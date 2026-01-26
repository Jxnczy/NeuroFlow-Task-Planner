import { supabase } from '../lib/supabase';
import { Task, TaskStatus, TaskType, GridRow, Habit, BrainDumpList } from '../types';
import { generateId } from '../utils/id';
import { CryptoService } from './CryptoService';
import { logger } from '../utils/logger';

// Encryption marker prefix to identify encrypted strings
const ENCRYPTED_PREFIX = 'ENC:';
export const LOCKED_CONTENT_PLACEHOLDER = '[Encrypted - Unlock vault to view]';


/**
 * Encrypt a string field if encryption is enabled and vault is unlocked
 * Returns the original string if encryption is not available
 */
/**
 * Encrypt a string field if encryption is enabled and vault is unlocked
 * Returns the original string if encryption is not available
 */
const encryptField = async (value: string, context?: string): Promise<string> => {
    const crypto = CryptoService.getInstance();
    if (!crypto.getIsUnlocked()) {
        return value; // Return plaintext if vault is locked
    }
    try {
        const encrypted = await crypto.encryptData(value, context);
        return ENCRYPTED_PREFIX + JSON.stringify(encrypted);
    } catch (error) {
        logger.error('Failed to encrypt field, storing as plaintext:', error);
        return value;
    }
};

/**
 * Decrypt a string field if it's encrypted
 * Returns the original string if not encrypted or decryption fails
 */
/**
 * Decrypt a string field if it's encrypted
 * Returns the original string if not encrypted or decryption fails
 */
const decryptField = async (value: string | null, context?: string): Promise<string> => {
    if (!value) return '';

    // Check if the value is encrypted
    if (!value.startsWith(ENCRYPTED_PREFIX)) {
        return value; // Return as-is if not encrypted
    }

    const crypto = CryptoService.getInstance();
    if (!crypto.getIsUnlocked()) {
        logger.warn('Cannot decrypt field - vault is locked');
        return LOCKED_CONTENT_PLACEHOLDER;
    }

    try {
        const encryptedJson = value.slice(ENCRYPTED_PREFIX.length);
        const encrypted = JSON.parse(encryptedJson);
        return await crypto.decryptData(encrypted, context);
    } catch (error) {
        logger.error('Failed to decrypt field:', error);
        return '[Decryption failed]';
    }
};
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


export const mapTaskFromDb = async (row: DbTaskRow): Promise<Task> => {
    const title = await decryptField(row.title, row.id);
    return {
        id: row.id,
        title,
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
    };
};

const mapTaskToDb = async (task: Task, userId: string): Promise<Omit<DbTaskRow, 'user_id' | 'id'> & { user_id: string; id: string }> => {
    // Generate/Migrate ID first so we can use it as context
    const id = migrateId(task.id);
    const encryptedTitle = await encryptField(task.title, id);
    return {
        id,
        user_id: userId,
        title: encryptedTitle,
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
    };
};

const mapHabitFromDb = async (row: DbHabitRow): Promise<Habit> => {
    const name = await decryptField(row.name, row.id);
    return {
        id: row.id,
        name,
        goal: row.goal ?? 7,
        checks: Array.isArray(row.daily_history) ? row.daily_history : Array(7).fill(false)
    };
};

const mapHabitToDb = async (habit: Habit, userId: string): Promise<Omit<DbHabitRow, 'id' | 'user_id'> & { id: string; user_id: string }> => {
    const id = migrateId(habit.id);
    const encryptedName = await encryptField(habit.name, id);
    return {
        id,
        user_id: userId,
        name: encryptedName,
        goal: habit.goal,
        daily_history: habit.checks
    };
};

const mapNoteFromDb = async (row: DbNoteRow): Promise<BrainDumpList> => {
    const title = await decryptField(row.title, row.id);
    const content = await decryptField(row.content, row.id);
    return {
        id: row.id,
        title: title || 'Untitled',
        content: content || '',
        lastEdited: row.updated_at ? new Date(row.updated_at).getTime() : undefined
    };
};

const mapNoteToDb = async (list: BrainDumpList, userId: string): Promise<Omit<DbNoteRow, 'id' | 'user_id'> & { id: string; user_id: string }> => {
    const id = migrateId(list.id);
    const encryptedTitle = await encryptField(list.title, id);
    const encryptedContent = await encryptField(list.content, id);
    return {
        id: migrateId(list.id),
        user_id: userId,
        title: encryptedTitle,
        content: encryptedContent,
        updated_at: list.lastEdited ? new Date(list.lastEdited).toISOString() : new Date().toISOString()
    };
};

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
            logger.error('Failed to load tasks from Supabase', error);
            return [];
        }
        return Promise.all((data || []).map(mapTaskFromDb));
    },

    async upsertTasks(userId: string, tasks: Task[]): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        if (!tasks.length) return;
        const payload = await Promise.all(tasks.map(t => mapTaskToDb(t, userId)));
        const { error } = await supabase.from('tasks').upsert(payload);
        if (error) {
            logger.error('Failed to upsert tasks', error);
        }
    },

    async deleteTask(userId: string, taskId: string): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase.from('tasks').delete().eq('user_id', userId).eq('id', taskId);
        if (error) {
            logger.error('Failed to delete task', error);
        }
    },

    async replaceTasks(userId: string, tasks: Task[]): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase.from('tasks').delete().eq('user_id', userId);
        if (error) {
            logger.error('Failed to clear tasks before import', error);
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
            logger.error('Failed to load habits', error);
            return [];
        }
        return Promise.all((data || []).map(mapHabitFromDb));
    },

    async upsertHabit(userId: string, habit: Habit): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const payload = await mapHabitToDb(habit, userId);
        const { error } = await supabase.from('habits').upsert(payload);
        if (error) {
            logger.error('Failed to upsert habit', error);
        }
    },

    async deleteHabit(userId: string, habitId: string): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase.from('habits').delete().eq('user_id', userId).eq('id', habitId);
        if (error) {
            logger.error('Failed to delete habit', error);
        }
    },

    async replaceHabits(userId: string, habits: Habit[]): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase.from('habits').delete().eq('user_id', userId);
        if (error) {
            logger.error('Failed to clear habits before import', error);
        }
        if (habits.length) {
            const payload = await Promise.all(habits.map(h => mapHabitToDb(h, userId)));
            const { error: insertError } = await supabase.from('habits').upsert(payload);
            if (insertError) {
                logger.error('Failed to import habits', insertError);
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
            logger.error('Failed to load notes', error);
            return [];
        }
        return Promise.all((data || []).map(mapNoteFromDb));
    },

    async upsertNote(userId: string, list: BrainDumpList): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const payload = await mapNoteToDb(list, userId);
        const { error } = await supabase.from('notes').upsert(payload);
        if (error) {
            logger.error('Failed to upsert note', error);
        }
    },

    async deleteNote(userId: string, noteId: string): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase.from('notes').delete().eq('user_id', userId).eq('id', noteId);
        if (error) {
            logger.error('Failed to delete note', error);
        }
    },

    async replaceNotes(userId: string, notes: BrainDumpList[]): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase.from('notes').delete().eq('user_id', userId);
        if (error) {
            logger.error('Failed to clear notes before import', error);
        }
        if (notes.length) {
            const payload = await Promise.all(notes.map(n => mapNoteToDb(n, userId)));
            const { error: insertError } = await supabase.from('notes').upsert(payload);
            if (insertError) {
                logger.error('Failed to import notes', insertError);
            }
        }
    },

    // Vault Metadata Sync
    async fetchVaultMetadata(userId: string): Promise<{ salt: string | null; isSetup: boolean }> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { data, error } = await supabase
            .from('user_preferences')
            .select('vault_salt, vault_initialized')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return { salt: null, isSetup: false };
            logger.error('Failed to fetch vault metadata', error);
            return { salt: null, isSetup: false };
        }
        return {
            salt: data?.vault_salt ?? null,
            isSetup: data?.vault_initialized ?? false
        };
    },

    async upsertVaultMetadata(userId: string, salt: string): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase
            .from('user_preferences')
            .upsert({
                user_id: userId,
                vault_salt: salt,
                vault_initialized: true,
                encryption_enabled: true,
                onboarding_completed: true, // Restoring/enabling encryption implies onboarding is done
                updated_at: new Date().toISOString()
            });

        if (error) {
            logger.error('Failed to sync vault metadata', error);
        }
    },

    /**
     * Fetch a raw sample of encrypted data (task or habit) to extract salt
     * Used for vault restoration
     */
    async fetchRawEncryptedSample(userId: string): Promise<string | null> {
        if (!supabase) throw new Error('Supabase unavailable');

        // Try tasks first
        const { data: tasks } = await supabase
            .from('tasks')
            .select('title')
            .eq('user_id', userId)
            .ilike('title', 'ENC:%')
            .limit(1);

        if (tasks && tasks.length > 0 && tasks[0].title) {
            return tasks[0].title.substring(4); // Remove ENC: prefix
        }

        // Try habits
        const { data: habits } = await supabase
            .from('habits')
            .select('name')
            .eq('user_id', userId)
            .ilike('name', 'ENC:%')
            .limit(1);

        if (habits && habits.length > 0 && habits[0].name) {
            return habits[0].name.substring(4);
        }

        // Try notes
        const { data: notes } = await supabase
            .from('notes')
            .select('title, content')
            .eq('user_id', userId)
            .or('title.ilike.ENC:%,content.ilike.ENC:%')
            .limit(1);

        if (notes && notes.length > 0) {
            if (notes[0].title?.startsWith(ENCRYPTED_PREFIX)) return notes[0].title.substring(4);
            if (notes[0].content?.startsWith(ENCRYPTED_PREFIX)) return notes[0].content.substring(4);
        }

        return null;
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
            logger.error('Failed to fetch onboarding status', error);
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
            logger.error('Failed to set onboarding completed', error);
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
            logger.error('Failed to fetch stats reset preference', error);
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
            logger.error('Failed to update stats reset preference', error);
        }
    },

    // Vault Metadata Sync
    async fetchVaultMetadata(userId: string): Promise<{ salt: string | null; isSetup: boolean }> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { data, error } = await supabase
            .from('user_preferences')
            .select('vault_salt, vault_initialized')
            .eq('user_id', userId)
            .single();

        console.log('SupabaseDataService: fetchVaultMetadata result:', { userId, data, error });

        if (error) {
            if (error.code === 'PGRST116') return { salt: null, isSetup: false };
            logger.error('Failed to fetch vault metadata', error);
            return { salt: null, isSetup: false };
        }
        return {
            salt: data?.vault_salt ?? null,
            isSetup: data?.vault_initialized ?? false
        };
    },

    async upsertVaultMetadata(userId: string, salt: string): Promise<void> {
        if (!supabase) throw new Error('Supabase unavailable');
        const { error } = await supabase
            .from('user_preferences')
            .upsert({
                user_id: userId,
                vault_salt: salt,
                vault_initialized: true,
                encryption_enabled: true,
                updated_at: new Date().toISOString()
            });

        if (error) {
            // Enhanced error logging to help diagnose RLS permission issues
            logger.error('Failed to sync vault metadata - RLS may be misconfigured:', {
                code: error.code,
                message: error.message,
                hint: error.hint,
                details: error.details,
                userId: userId.substring(0, 8) + '...' // Log partial userId for debugging
            });
            // Re-throw so caller can handle the error appropriately
            throw new Error(`Vault metadata sync failed: ${error.message} (code: ${error.code})`);
        }
    }
};
