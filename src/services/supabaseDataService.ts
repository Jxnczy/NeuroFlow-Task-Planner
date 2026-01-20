import { supabase } from '../lib/supabase';
import { Task, TaskStatus, TaskType, GridRow, Habit, BrainDumpList } from '../types';
import { generateId } from '../utils/id';

export interface DbTaskRow {
    id: string;
    user_id: string;
    created_at: string | null;
    title: string;
    duration: number | null;
    priority: string | null;
    category: string | null;
    is_completed: boolean | null;
    is_frozen: boolean | null;
    scheduled_date: string | null;
    scheduled_time?: string | null;
    deadline: string | null;
    completed_at: string | null;
    status?: string | null;
    eisenhower_quad?: string | null;
    sort_order?: number | null;
}

export interface DbHabitRow {
    id: string;
    user_id: string;
    name: string;
    goal: number | null;
    daily_history: boolean[] | null;
}

export interface DbNoteRow {
    id: string;
    user_id: string;
    title: string | null;
    content: string | null;
    updated_at: string | null;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Ensure an ID is a valid UUID. If not, generate a new one.
 * This handles migration from legacy IDs like "1", "h3", etc.
 */
const ensureUUID = (id: string): string => {
    if (UUID_REGEX.test(id)) {
        return id;
    }
    // Legacy ID detected - generate a proper UUID
    return generateId();
};

// Track legacy ID -> UUID mappings for consistency within a session
const idMigrationMap = new Map<string, string>();

const migrateId = (legacyId: string): string => {
    if (UUID_REGEX.test(legacyId)) {
        return legacyId;
    }
    // Check if we've already migrated this ID
    if (idMigrationMap.has(legacyId)) {
        return idMigrationMap.get(legacyId)!;
    }
    // Generate new UUID and cache it
    const newId = generateId();
    idMigrationMap.set(legacyId, newId);
    return newId;
};

const getCompletionStatus = (row: DbTaskRow): TaskStatus => {
    if (row.status) return row.status as TaskStatus;
    if (row.is_completed) return 'completed';
    if (row.scheduled_date) return 'scheduled';
    return 'unscheduled';
};

export const mapTaskFromDb = (row: DbTaskRow): Task => ({
    id: row.id,
    title: row.title,
    duration: row.duration ?? 0,
    type: (row.priority as TaskType) ?? 'medium',
    status: getCompletionStatus(row),
    dueDate: row.scheduled_date,
    scheduledTime: row.scheduled_time ?? undefined,
    deadline: row.deadline ?? null,
    assignedRow: (row.category as GridRow) ?? null,
    eisenhowerQuad: (row.eisenhower_quad as Task['eisenhowerQuad']) ?? null,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    isFrozen: row.is_frozen ?? false,
    sortOrder: row.sort_order ?? 0,
    completedAt: row.completed_at ? new Date(row.completed_at).getTime() : undefined
});

const mapTaskToDb = (task: Task, userId: string): Omit<DbTaskRow, 'user_id' | 'id'> & { user_id: string; id: string } => ({
    id: migrateId(task.id),
    user_id: userId,
    title: task.title,
    duration: task.duration,
    priority: task.type,
    category: task.assignedRow,
    status: task.status,
    scheduled_date: task.dueDate,
    scheduled_time: task.scheduledTime ?? null,
    deadline: task.deadline ?? null,
    eisenhower_quad: task.eisenhowerQuad,
    is_completed: task.status === 'completed',
    is_frozen: task.isFrozen ?? false,
    sort_order: task.sortOrder ?? 0,
    created_at: new Date(task.createdAt || Date.now()).toISOString(),
    completed_at: task.completedAt ? new Date(task.completedAt).toISOString() : (task.status === 'completed' ? new Date().toISOString() : null)
});

const mapHabitFromDb = (row: DbHabitRow): Habit => ({
    id: row.id,
    name: row.name,
    goal: row.goal ?? 7,
    checks: Array.isArray(row.daily_history) ? row.daily_history : Array(7).fill(false)
});

const mapHabitToDb = (habit: Habit, userId: string): Omit<DbHabitRow, 'id' | 'user_id'> & { id: string; user_id: string } => ({
    id: migrateId(habit.id),
    user_id: userId,
    name: habit.name,
    goal: habit.goal,
    daily_history: habit.checks
});

const mapNoteFromDb = (row: DbNoteRow): BrainDumpList => ({
    id: row.id,
    title: row.title || 'Untitled',
    content: row.content || '',
    lastEdited: row.updated_at ? new Date(row.updated_at).getTime() : undefined
});

const mapNoteToDb = (list: BrainDumpList, userId: string): Omit<DbNoteRow, 'id' | 'user_id'> & { id: string; user_id: string } => ({
    id: migrateId(list.id),
    user_id: userId,
    title: list.title,
    content: list.content,
    updated_at: list.lastEdited ? new Date(list.lastEdited).toISOString() : new Date().toISOString()
});

export const SupabaseDataService = {
    async fetchTasks(userId: string): Promise<Task[]> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Failed to load tasks from Supabase', error);
            return [];
        }
        return (data || []).map(mapTaskFromDb);
    },

    async upsertTasks(userId: string, tasks: Task[]): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        if (!tasks.length) return;
        const payload = tasks.map(t => mapTaskToDb(t, userId));
        const { error } = await supabase.from('tasks').upsert(payload);
        if (error) {
            console.error('Failed to upsert tasks', error);
        }
    },

    async deleteTask(userId: string, taskId: string): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase.from('tasks').delete().eq('user_id', userId).eq('id', taskId);
        if (error) {
            console.error('Failed to delete task', error);
        }
    },

    async replaceTasks(userId: string, tasks: Task[]): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase.from('tasks').delete().eq('user_id', userId);
        if (error) {
            console.error('Failed to clear tasks before import', error);
        }
        if (tasks.length) {
            await this.upsertTasks(userId, tasks);
        }
    },

    async fetchHabits(userId: string): Promise<Habit[]> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { data, error } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .order('name', { ascending: true });
        if (error) {
            console.error('Failed to load habits', error);
            return [];
        }
        return (data || []).map(mapHabitFromDb);
    },

    async upsertHabit(userId: string, habit: Habit): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const payload = mapHabitToDb(habit, userId);
        const { error } = await supabase.from('habits').upsert(payload);
        if (error) {
            console.error('Failed to upsert habit', error);
        }
    },

    async deleteHabit(userId: string, habitId: string): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase.from('habits').delete().eq('user_id', userId).eq('id', habitId);
        if (error) {
            console.error('Failed to delete habit', error);
        }
    },

    async replaceHabits(userId: string, habits: Habit[]): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase.from('habits').delete().eq('user_id', userId);
        if (error) {
            console.error('Failed to clear habits before import', error);
        }
        if (habits.length) {
            const payload = habits.map(h => mapHabitToDb(h, userId));
            const { error: insertError } = await supabase.from('habits').upsert(payload);
            if (insertError) {
                console.error('Failed to import habits', insertError);
            }
        }
    },

    async fetchNotes(userId: string): Promise<BrainDumpList[]> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
        if (error) {
            console.error('Failed to load notes', error);
            return [];
        }
        return (data || []).map(mapNoteFromDb);
    },

    async upsertNote(userId: string, list: BrainDumpList): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const payload = mapNoteToDb(list, userId);
        const { error } = await supabase.from('notes').upsert(payload);
        if (error) {
            console.error('Failed to upsert note', error);
        }
    },

    async deleteNote(userId: string, noteId: string): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase.from('notes').delete().eq('user_id', userId).eq('id', noteId);
        if (error) {
            console.error('Failed to delete note', error);
        }
    },

    async replaceNotes(userId: string, notes: BrainDumpList[]): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase.from('notes').delete().eq('user_id', userId);
        if (error) {
            console.error('Failed to clear notes before import', error);
        }
        if (notes.length) {
            const payload = notes.map(n => mapNoteToDb(n, userId));
            const { error: insertError } = await supabase.from('notes').upsert(payload);
            if (insertError) {
                console.error('Failed to import notes', insertError);
            }
        }
    },

    // User Preferences - Onboarding Status
    async fetchOnboardingCompleted(userId: string): Promise<boolean> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { data, error } = await supabase
            .from('user_preferences')
            .select('onboarding_completed')
            .eq('user_id', userId)
            .single();

        if (error) {
            // No row means new user - not an error
            if (error.code === 'PGRST116') return false;
            console.error('Failed to fetch onboarding status', error);
            return false;
        }
        return data?.onboarding_completed ?? false;
    },

    async setOnboardingCompleted(userId: string): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase
            .from('user_preferences')
            .upsert({
                user_id: userId,
                onboarding_completed: true,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Failed to set onboarding completed', error);
        }
    },

    async fetchStatsResetAt(userId: string): Promise<number | undefined> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { data, error } = await supabase
            .from('user_preferences')
            .select('stats_reset_at')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return undefined;
            console.error('Failed to fetch stats reset preference', error);
            return undefined;
        }
        return data?.stats_reset_at ? new Date(data.stats_reset_at).getTime() : undefined;
    },

    async setStatsResetAt(userId: string, timestamp: number): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase
            .from('user_preferences')
            .upsert({
                user_id: userId,
                stats_reset_at: new Date(timestamp).toISOString(),
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Failed to update stats reset preference', error);
        }
    }
};
