import { useState, useEffect, useRef, useCallback } from 'react';
import { TaskManager } from '../services/TaskManager';
import { Task, TaskType, GridRow } from '../types';
import { playSuccessSound } from '../constants';
import { SupabaseDataService } from '../services/supabaseDataService';
import { generateId } from '../utils/id';
import { getTaskIdFromDragEvent, setTaskDragData } from '../utils/drag';

export function useTaskManager(initialTasks: Task[], userId?: string, supabaseEnabled: boolean = true) {
    const managerRef = useRef<TaskManager>();
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Initialize manager once
    if (!managerRef.current) {
        managerRef.current = new TaskManager(initialTasks);
    }

    const manager = managerRef.current;

    // Subscribe to changes
    useEffect(() => {
        return manager.subscribe(setTasks);
    }, []);

    // Sync initial tasks if they change (e.g. after remote fetch/import)
    useEffect(() => {
        manager.setTasks(initialTasks);
    }, [initialTasks, manager]);

    // Remote load
    const fetchRemoteTasks = useCallback(async () => {
        if (!userId || !supabaseEnabled) return;
        try {
            const remoteTasks = await SupabaseDataService.fetchTasks(userId);
            if (remoteTasks.length) {
                manager.setTasks(remoteTasks);
            }
        } catch (error) {
            console.error('Failed to refresh tasks from Supabase', error);
        }
    }, [userId, manager, supabaseEnabled]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!userId || !supabaseEnabled) {
                setIsLoading(false);
                return;
            }
            setIsLoading(!initialTasks.length);
            try {
                const remoteTasks = await SupabaseDataService.fetchTasks(userId);
                if (!mounted) return;
                if (remoteTasks.length) {
                    manager.setTasks(remoteTasks);
                }
            } catch (error) {
                console.error('Failed to load tasks from Supabase', error);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };
        load();
        return () => { mounted = false; };
    }, [userId, manager, initialTasks, supabaseEnabled]);

    // Lightweight polling/visibility refresh to keep devices in sync even if Realtime is blocked
    useEffect(() => {
        if (!userId || !supabaseEnabled) return;

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                void fetchRemoteTasks();
            }
        };
        window.addEventListener('visibilitychange', handleVisibility);
        const interval = window.setInterval(() => {
            void fetchRemoteTasks();
        }, 15000);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibility);
            window.clearInterval(interval);
        };
    }, [userId, fetchRemoteTasks, supabaseEnabled]);

    const persistTasks = useCallback((tasksToPersist: Task[]) => {
        if (!userId || !supabaseEnabled || !tasksToPersist.length) return;
        void SupabaseDataService.upsertTasks(userId, tasksToPersist);
    }, [userId, supabaseEnabled]);

    const deleteTaskRemote = useCallback((taskId: string) => {
        if (!userId || !supabaseEnabled) return;
        void SupabaseDataService.deleteTask(userId, taskId);
    }, [userId, supabaseEnabled]);

    const diffTasks = useCallback((previous: Task[], next: Task[]) => {
        const prevMap = new Map(previous.map(t => [t.id, t]));
        return next.filter(task => {
            const prev = prevMap.get(task.id);
            if (!prev) return true;
            return JSON.stringify(prev) !== JSON.stringify(task);
        });
    }, []);


    // Expose stable API
    const addTask = useCallback((title: string, duration: number, type: TaskType) => {
        const newTask = manager.addTask(title, duration, type, generateId());
        persistTasks([newTask]);
        return newTask;
    }, [manager, persistTasks]);

    const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
        const before = manager.getTasks();
        manager.updateTask(taskId, updates);
        const after = manager.getTasks();
        const changed = diffTasks(before, after).filter(t => t.id === taskId);
        if (changed.length) {
            persistTasks(changed);
        }
    }, [manager, persistTasks, diffTasks]);

    const deleteTask = useCallback((taskId: string) => {
        manager.deleteTask(taskId);
        deleteTaskRemote(taskId);
    }, [manager, deleteTaskRemote]);

    const scheduleTask = useCallback((taskId: string, date: Date, row: GridRow | null = null, type?: TaskType) => {
        const before = manager.getTasks();
        manager.scheduleTask(taskId, date, row, type);
        const after = manager.getTasks();
        const changed = diffTasks(before, after);
        if (changed.length) {
            persistTasks(changed);
        }
    }, [manager, diffTasks, persistTasks]);

    const toggleTaskComplete = useCallback((taskId: string) => {
        const before = manager.getTasks();
        const isNowComplete = manager.toggleTaskComplete(taskId);
        const after = manager.getTasks();
        const changed = diffTasks(before, after).filter(t => t.id === taskId);
        if (changed.length) {
            persistTasks(changed);
        }
        if (isNowComplete) {
            playSuccessSound();
        }
        return isNowComplete;
    }, [manager, diffTasks, persistTasks]);

    const handleReorderTasks = useCallback((sourceId: string, targetId: string) => {
        const before = manager.getTasks();
        manager.reorderTasks(sourceId, targetId);
        const after = manager.getTasks();
        const changed = diffTasks(before, after);
        if (changed.length) {
            persistTasks(changed);
        }
    }, [manager, diffTasks, persistTasks]);

    // Drag and Drop Logic
    const [isDragging, setIsDragging] = useState(false);

    // Global dragstart/dragend to ensure isDragging is always set correctly
    useEffect(() => {
        const handleGlobalDragStart = (e: DragEvent) => {
            // Check if it's a task drag (has our custom data type)
            if (e.dataTransfer?.types?.includes('text/plain')) {
                setIsDragging(true);
            }
        };

        const handleGlobalDragEnd = () => {
            setIsDragging(false);
        };

        document.addEventListener('dragstart', handleGlobalDragStart);
        document.addEventListener('dragend', handleGlobalDragEnd);
        document.addEventListener('drop', handleGlobalDragEnd);

        return () => {
            document.removeEventListener('dragstart', handleGlobalDragStart);
            document.removeEventListener('dragend', handleGlobalDragEnd);
            document.removeEventListener('drop', handleGlobalDragEnd);
        };
    }, []);

    const handleDragStart = useCallback((e: React.DragEvent<HTMLElement>, taskId: string) => {
        setTaskDragData(e, taskId);
        setIsDragging(true);
    }, []);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        setIsDragging(false);
    }, []);

    const handleDropOnGrid = useCallback((e: React.DragEvent<HTMLElement>, day: Date, row: GridRow | null) => {
        e.preventDefault();
        setIsDragging(false);
        const taskId = getTaskIdFromDragEvent(e);
        if (!taskId) return;

        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        let targetRow = row;
        let targetType = task.type;

        if (targetRow) {
            // Dropped on a specific row (Matrix mode)
            switch (targetRow) {
                case 'GOAL': targetType = 'high'; break;
                case 'FOCUS': targetType = 'medium'; break;
                case 'WORK': targetType = 'low'; break;
                case 'LEISURE': targetType = 'leisure'; break;
                case 'CHORES': targetType = 'chores'; break;
            }
        } else {
            // Dropped on a day column (Stacked mode)
            switch (task.type) {
                case 'high': targetRow = 'GOAL'; break;
                case 'medium': targetRow = 'FOCUS'; break;
                case 'low': targetRow = 'WORK'; break;
                case 'leisure': targetRow = 'LEISURE'; break;
                case 'chores': targetRow = 'CHORES'; break;
                case 'backlog':
                default:
                    targetType = 'medium';
                    targetRow = 'FOCUS';
                    break;
            }
        }

        scheduleTask(taskId, day, targetRow as GridRow, targetType);
    }, [tasks, scheduleTask]);

    const handleDropOnSidebar = useCallback((e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const taskId = getTaskIdFromDragEvent(e);
        if (!taskId) return;
        manager.unscheduleTask(taskId);
        const changed = diffTasks(tasks, manager.getTasks());
        if (changed.length) {
            persistTasks(changed);
        }
    }, [tasks, manager, diffTasks, persistTasks]);

    const handleDropOnEisenhower = useCallback((e: React.DragEvent<HTMLElement>, quad: 'do' | 'decide' | 'delegate' | 'delete') => {
        e.preventDefault();
        setIsDragging(false);
        const taskId = getTaskIdFromDragEvent(e);
        if (!taskId) return;
        manager.setEisenhowerQuad(taskId, quad);
        const changed = diffTasks(tasks, manager.getTasks());
        if (changed.length) {
            persistTasks(changed);
        }
    }, [tasks, manager, diffTasks, persistTasks]);

    const syncRemoteTask = useCallback((task: Task) => manager.upsertTask(task), [manager]);
    const removeRemoteTask = useCallback((taskId: string) => manager.removeTask(taskId), [manager]);

    return {
        tasks,
        addTask,
        updateTask,
        scheduleTask,
        deleteTask,
        toggleTaskComplete,
        handleReorderTasks,
        handleDragStart,
        handleDragEnd,
        isDragging,
        handleDropOnGrid,
        handleDropOnSidebar,
        handleDropOnEisenhower,
        clearRescheduledTasks: () => {
            const before = manager.getTasks();
            manager.clearRescheduledTasks();
            const after = manager.getTasks();
            const removed = before.filter(t => !after.some(nt => nt.id === t.id));
            removed.forEach(t => deleteTaskRemote(t.id));
        },
        deleteAllTasks: () => {
            const toDelete = manager.getTasks();
            // Remove locally
            manager.deleteAllTasks();
            // Remove remotely
            if (userId && supabaseEnabled) {
                void SupabaseDataService.replaceTasks(userId, []);
                toDelete.forEach(t => deleteTaskRemote(t.id));
            }
        },
        syncRemoteTask,
        removeRemoteTask,
        refreshTasks: fetchRemoteTasks,
        isLoading
    };
}
