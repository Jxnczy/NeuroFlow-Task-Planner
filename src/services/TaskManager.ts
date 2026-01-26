import { Task, TaskType, GridRow, TaskStatus } from '../types';
import { formatDate } from '../constants';
import { generateId } from '../utils/id';

type TaskListener = (tasks: Task[]) => void;

export class TaskManager {
    private tasks: Task[];
    private listeners: Set<TaskListener>;

    constructor(initialTasks: Task[] = []) {
        this.tasks = initialTasks;
        this.listeners = new Set();
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

    addTask(title: string, duration: number, type: TaskType, id?: string, notes?: string, parent_id?: string): Task {
        const newTask: Task = {
            id: id || generateId(),
            title,
            duration,
            type,
            notes,
            status: 'unscheduled',
            dueDate: null,
            deadline: null,
            assignedRow: null,
            eisenhowerQuad: null,
            createdAt: Date.now(),
            sortOrder: this.tasks.length,
            parent_id: parent_id || null,
        };
        this.tasks = [...this.tasks, newTask];
        this.notify();
        return newTask;
    }

    updateTask(taskId: string, updates: Partial<Task>) {
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
        this.tasks = newTasks.map((task, idx) => ({ ...task, sortOrder: idx }));
        this.notify();
    }

    scheduleTask(taskId: string, date: Date, row: GridRow | null, type?: TaskType) {
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
        this.tasks = this.tasks.map(t => {
            if (t.id === taskId) {
                return { ...t, status: 'unscheduled', dueDate: null, assignedRow: null, eisenhowerQuad: quad };
            }
            return t;
        });
        this.notify();
    }

    setTasks(newTasks: Task[]) {
        this.tasks = this.sortTasks(newTasks);
        this.notify();
    }

    private sortTasks(tasks: Task[]) {
        const normalized = tasks.map((task, idx) => ({
            ...task,
            sortOrder: task.sortOrder ?? idx
        }));
        return [...normalized].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
}
