import { useState, useEffect, useMemo, useCallback } from 'react';
import { TaskManager } from '../services/TaskManager';
import { Task, TaskType, GridRow } from '../types';
import { playSuccessSound } from '../constants';
import { SupabaseDataService } from '../services/supabaseDataService';
import { generateId } from '../utils/id';
import { getTaskIdFromDragEvent, setTaskDragData } from '../utils/drag';
import { getSpace, getSpacesEnabled } from '../state/space';
import { getSpacesEnabled as checkSpacesEnabled } from '../state/features';

import { useSpace } from './useSpace';

// Note: We expose `allTasks` for persistence and `tasks` for the UI (filtered)
export function useTaskManager(initialTasks: Task[], userId?: string, supabaseEnabled: boolean = true) {
    const [allTasks, setAllTasks] = useState<Task[]>(initialTasks);
    const { space: currentSpace, spacesEnabled } = useSpace(); // Reactive state
    const [isLoading, setIsLoading] = useState<boolean>(() => {
        if (!userId || !supabaseEnabled) return false;
        return true;
    });

    // Initialize manager once
    const manager = useMemo(() => new TaskManager(initialTasks), []);

    // Subscribe to changes (manager holds ALL tasks)
    useEffect(() => {
        return manager.subscribe(setAllTasks);
    }, [manager]);

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
                manager.mergeTasks(remoteTasks);
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
                    manager.mergeTasks(remoteTasks);
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

        /* 
         * Disabled visibility-based refresh to prevent "reload" sensation.
         * Relying on periodic polling and manual refreshes for now.
         */
        /*
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                void fetchRemoteTasks();
            }
        };
        window.addEventListener('visibilitychange', handleVisibility);
        */

        const interval = window.setInterval(() => {
            void fetchRemoteTasks();
        }, 30000); // Increased to 30s to reduce background activity

        return () => {
            // window.removeEventListener('visibilitychange', handleVisibility);
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

    // Derived state for UI
    const tasks = useMemo(() => {
        if (!spacesEnabled) {
            return allTasks.filter(t => !t.space || t.space === 'private');
        }
        return allTasks.filter(t => (t.space || 'private') === currentSpace);
    }, [allTasks, isLoading, spacesEnabled, currentSpace]); // Reactive dependencies!


    // Expose stable API
    const addTask = useCallback((title: string, duration: number, type: TaskType, notes?: string) => {
        const space = spacesEnabled ? currentSpace : 'private';

        const newTask = manager.addTask(title, duration, type, generateId(), notes, undefined, space);
        persistTasks([newTask]);
        return newTask;
    }, [manager, persistTasks, spacesEnabled, currentSpace]);

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

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleDropOnGrid = useCallback((e: React.DragEvent<HTMLElement>, day: Date, row: GridRow | null) => {
        e.preventDefault();
        setIsDragging(false);
        const taskId = getTaskIdFromDragEvent(e);
        if (!taskId) return;

        // Find in allTasks to be safe
        const task = allTasks.find(t => t.id === taskId);
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
    }, [allTasks, scheduleTask]);

    const handleDropOnSidebar = useCallback((e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const taskId = getTaskIdFromDragEvent(e);
        if (!taskId) return;
        manager.unscheduleTask(taskId);
        const changed = diffTasks(allTasks, manager.getTasks());
        if (changed.length) {
            persistTasks(changed);
        }
    }, [allTasks, manager, diffTasks, persistTasks]);

    const handleDropOnEisenhower = useCallback((e: React.DragEvent<HTMLElement>, quad: 'do' | 'decide' | 'delegate' | 'delete') => {
        e.preventDefault();
        setIsDragging(false);
        const taskId = getTaskIdFromDragEvent(e);
        if (!taskId) return;
        manager.setEisenhowerQuad(taskId, quad);
        const changed = diffTasks(allTasks, manager.getTasks());
        if (changed.length) {
            persistTasks(changed);
        }
    }, [allTasks, manager, diffTasks, persistTasks]);

    const syncRemoteTask = useCallback((task: Task) => manager.upsertTask(task), [manager]);
    const removeRemoteTask = useCallback((taskId: string) => manager.removeTask(taskId), [manager]);

    return {
        tasks,
        allTasks, // EXPOSED for persistence
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
        resetStats: () => {
            const before = manager.getTasks();
            manager.resetStats();
            const after = manager.getTasks();
            const changed = diffTasks(before, after);
            if (changed.length) {
                persistTasks(changed);
            }
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
