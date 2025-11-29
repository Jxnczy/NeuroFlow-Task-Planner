import { Task, TaskType, GridRow, TaskStatus } from '../types';
import { formatDate } from '../constants';

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

    addTask(title: string, duration: number, type: TaskType): Task {
        const newTask: Task = {
            id: Math.random().toString(36).substr(2, 9),
            title,
            duration,
            type,
            status: 'unscheduled',
            dueDate: null,
            assignedRow: null,
            eisenhowerQuad: null,
            createdAt: Date.now(),
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

    toggleTaskComplete(taskId: string): boolean {
        let isNowComplete = false;
        this.tasks = this.tasks.map(t => {
            if (t.id === taskId) {
                const isComplete = t.status === 'completed';
                let newStatus: TaskStatus;

                if (isComplete) {
                    newStatus = (t.dueDate && t.assignedRow) ? 'scheduled' : 'unscheduled';
                } else {
                    newStatus = 'completed';
                    isNowComplete = true;
                }
                return { ...t, status: newStatus };
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
        this.tasks = newTasks;
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
                    id: Math.random().toString(36).substr(2, 9),
                    status: 'scheduled',
                    dueDate: targetDateStr,
                    assignedRow: row,
                    eisenhowerQuad: null,
                    type: type || taskToSchedule.type,
                    createdAt: Date.now()
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
                    type: type || t.type
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
                    eisenhowerQuad: null
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
        this.tasks = newTasks;
        this.notify();
    }
}
