import { Task, TaskType, GridRow, TaskStatus } from '../types';
import { formatDate } from '../constants';
import { generateId } from '../utils/id';

const SYNC_GRACE_PERIOD = 10000; // Reduced from 30s to 10s for snappier feel while maintaining safety

type TaskListener = (tasks: Task[]) => void;

export class TaskManager {
    private tasks: Task[];
    private listeners: Set<TaskListener>;
    private lastLocalUpdate: Map<string, number>;

    constructor(initialTasks: Task[] = []) {
        this.tasks = initialTasks;
        this.listeners = new Set();
        this.lastLocalUpdate = new Map();

        // Mark initial tasks as fresh to prevent immediate overwrite by stale server data
        const now = Date.now();
        initialTasks.forEach(t => this.lastLocalUpdate.set(t.id, now));
    }

    subscribe(listener: TaskListener): () => void {
        this.listeners.add(listener);
        // Immediately notify with current state
        listener(this.tasks);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach(listener => listener(this.tasks));
    }

    getTasks(): Task[] {
        return [...this.tasks];
    }

    addTask(title: string, duration: number, type: TaskType, id?: string, notes?: string, parent_id?: string, space?: 'work' | 'private'): Task {
        const newTask: Task = {
            id: id || generateId(),
            title,
            duration,
            type,
            notes,
            space: space || 'private',
            status: 'unscheduled',
            dueDate: null,
            deadline: null,
            assignedRow: null,
            eisenhowerQuad: null,
            createdAt: Date.now(),
            sortOrder: this.tasks.length,
            parent_id: parent_id || null,
        };
        this.lastLocalUpdate.set(newTask.id, Date.now());
        this.tasks = [...this.tasks, newTask];
        this.notify();
        return newTask;
    }

    updateTask(taskId: string, updates: Partial<Task>) {
        this.lastLocalUpdate.set(taskId, Date.now());
        this.tasks = this.tasks.map(t =>
            t.id === taskId ? { ...t, ...updates } : t
        );
        this.notify();
    }

    deleteTask(taskId: string) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.notify();
    }

    upsertTask(task: Task) {
        // CONFLICT RESOLUTION:
        // If the task was modified locally in the last 30 seconds, IGNORE the remote update.
        // This prevents stale echoes from the server (which might be 15s+ old) from overwriting
        // fresh local changes (moves, renames, completions, etc.).

        const lastLocalUpdate = this.lastLocalUpdate.get(task.id) || 0;
        const isLocallyFresh = (Date.now() - lastLocalUpdate < SYNC_GRACE_PERIOD);

        if (isLocallyFresh) {
            console.log(`[TaskManager] Ignoring remote update for task ${task.id} (local change < ${SYNC_GRACE_PERIOD}ms old)`);
            return;
        }

        const existing = this.tasks.find(t => t.id === task.id);
        if (existing) {
            this.tasks = this.tasks.map(t => t.id === task.id ? { ...existing, ...task } : t);
        } else {
            this.tasks = [...this.tasks, task];
        }
        this.tasks = this.sortTasks(this.tasks);
        this.notify();
    }

    removeTask(taskId: string) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.notify();
    }

    deleteAllTasks() {
        this.tasks = [];
        this.notify();
    }

    clearRescheduledTasks() {
        this.tasks = this.tasks.filter(t => t.status !== 'rescheduled');
        this.notify();
    }

    resetStats() {
        // No longer uncompleting tasks here.
        // The baseline will be updated in App/Context and Analytics will filter.
        this.notify();
    }

    toggleTaskComplete(taskId: string): boolean {
        this.lastLocalUpdate.set(taskId, Date.now());
        let isNowComplete = false;
        this.tasks = this.tasks.map(t => {
            if (t.id === taskId) {
                const isComplete = t.status === 'completed';
                let newStatus: TaskStatus;

                if (isComplete) {
                    newStatus = (t.dueDate && t.assignedRow) ? 'scheduled' : 'unscheduled';
                    return { ...t, status: newStatus, completedAt: undefined };
                } else {
                    newStatus = 'completed';
                    isNowComplete = true;
                    return { ...t, status: newStatus, completedAt: Date.now() };
                }
            }
            return t;
        });
        this.notify();
        return isNowComplete;
    }

    reorderTasks(sourceTaskId: string, targetTaskId: string) {
        const sourceIndex = this.tasks.findIndex(t => t.id === sourceTaskId);
        const targetIndex = this.tasks.findIndex(t => t.id === targetTaskId);
        if (sourceIndex === -1 || targetIndex === -1) return;

        const newTasks = [...this.tasks];
        const [removed] = newTasks.splice(sourceIndex, 1);
        newTasks.splice(targetIndex, 0, removed);

        // Update sortOrder for all tasks and mark them as locally updated
        // This prevents remote sync from reverting the order immediately
        const now = Date.now();
        this.tasks = newTasks.map((task, idx) => {
            const updated = { ...task, sortOrder: idx };
            this.lastLocalUpdate.set(task.id, now);
            return updated;
        });
        this.notify();
    }

    scheduleTask(taskId: string, date: Date, row: GridRow | null, type?: TaskType) {
        this.lastLocalUpdate.set(taskId, Date.now());
        const targetDateStr = formatDate(date);
        const todayStr = formatDate(new Date());

        // Find the task first to check if we need to fork
        const taskToSchedule = this.tasks.find(t => t.id === taskId);

        if (taskToSchedule && taskToSchedule.dueDate && taskToSchedule.status !== 'unscheduled') {
            const currentDueDate = taskToSchedule.dueDate;

            // Check if moving from Past -> Future/Today
            // Simple string comparison works for ISO dates (YYYY-MM-DD)
            if (currentDueDate < todayStr && targetDateStr >= todayStr) {
                // FORK LOGIC

                // 1. Mark original as rescheduled
                this.tasks = this.tasks.map(t =>
                    t.id === taskId ? { ...t, status: 'rescheduled' } : t
                );

                // 2. Create new clone for the target date
                const newTask: Task = {
                    ...taskToSchedule,
                    id: generateId(),
                    status: 'scheduled',
                    dueDate: targetDateStr,
                    deadline: taskToSchedule.deadline, // Preserve deadline
                    assignedRow: row,
                    eisenhowerQuad: null,
                    type: type || taskToSchedule.type,
                    createdAt: Date.now(),
                    sortOrder: this.tasks.length
                };

                this.lastLocalUpdate.set(newTask.id, Date.now());

                this.tasks = [...this.tasks, newTask];
                this.notify();
                return;
            }
        }

        // Normal scheduling logic (no fork)
        this.tasks = this.tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    status: 'scheduled',
                    dueDate: targetDateStr,
                    assignedRow: row,
                    eisenhowerQuad: null,
                    type: type || t.type,
                    isFrozen: false
                };
            }
            return t;
        });
        this.notify();
    }

    unscheduleTask(taskId: string) {
        this.lastLocalUpdate.set(taskId, Date.now());
        this.tasks = this.tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    status: 'unscheduled',
                    dueDate: null,
                    assignedRow: null,
                    eisenhowerQuad: null,
                    isFrozen: false
                };
            }
            return t;
        });
        this.notify();
    }

    setEisenhowerQuad(taskId: string, quad: 'do' | 'decide' | 'delegate' | 'delete') {
        this.lastLocalUpdate.set(taskId, Date.now());
        this.tasks = this.tasks.map(t => {
            if (t.id === taskId) {
                return { ...t, status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: quad };
            }
            return t;
        });
        this.notify();
    }

    mergeTasks(remoteTasks: Task[]) {
        const remoteMap = new Map(remoteTasks.map(t => [t.id, t]));
        const merged: Task[] = [];
        const processedIds = new Set<string>();

        // 1. Process local tasks (keep fresh ones, update others, drop deleted)
        for (const localTask of this.tasks) {
            processedIds.add(localTask.id);
            const lastUpdate = this.lastLocalUpdate.get(localTask.id) || 0;
            const isFresh = (Date.now() - lastUpdate < SYNC_GRACE_PERIOD); // grace period

            if (isFresh) {
                // Keep local change regardless of remote state
                merged.push(localTask);
            } else if (remoteMap.has(localTask.id)) {
                // Update with remote data (remote is source of truth after 30s)
                merged.push(remoteMap.get(localTask.id)!);
            } else {
                // Not in remoteMap and not fresh -> It was deleted remotely
                // So we drop it (do nothing)
            }
        }

        // 2. Add new remote tasks that weren't in local
        for (const remoteTask of remoteTasks) {
            if (!processedIds.has(remoteTask.id)) {
                merged.push(remoteTask);
            }
        }

        this.tasks = this.sortTasks(this.repairTasks(merged));
        this.notify();
    }

    setTasks(newTasks: Task[]) {
        this.tasks = this.sortTasks(this.repairTasks(newTasks));
        this.notify();
    }

    private repairTasks(tasks: Task[]): Task[] {
        return tasks.map(t => {
            if (t.status === 'scheduled' && !t.assignedRow && t.dueDate) {
                // Auto-repair missing row
                let assignedRow: any = 'FOCUS';
                switch (t.type) {
                    case 'high': assignedRow = 'GOAL'; break;
                    case 'medium': assignedRow = 'FOCUS'; break;
                    case 'low': assignedRow = 'WORK'; break;
                    case 'leisure': assignedRow = 'LEISURE'; break;
                    case 'chores': assignedRow = 'CHORES'; break;
                    default: assignedRow = 'FOCUS';
                }
                // console.log(`[TaskManager] Auto-repaired task ${t.id}: assigned to ${assignedRow}`);
                return { ...t, assignedRow };
            }
            return t;
        });
    }

    private sortTasks(tasks: Task[]) {
        const normalized = tasks.map((task, idx) => ({
            ...task,
            sortOrder: task.sortOrder ?? idx
        }));
        return [...normalized].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
}
