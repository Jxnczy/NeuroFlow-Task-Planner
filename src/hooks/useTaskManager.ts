import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TaskManager } from '../services/TaskManager';
import { Task, TaskType, GridRow } from '../types';
import { playSuccessSound } from '../constants';

export function useTaskManager(initialTasks: Task[]) {
    const managerRef = useRef<TaskManager>();
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    // Initialize manager once
    if (!managerRef.current) {
        managerRef.current = new TaskManager(initialTasks);
    }

    const manager = managerRef.current;

    // Subscribe to changes
    useEffect(() => {
        return manager.subscribe(setTasks);
    }, []);

    // Sync initial tasks if they change (e.g. from localStorage load)


    // Expose stable API
    const addTask = useCallback((title: string, duration: number, type: TaskType) => {
        manager.addTask(title, duration, type);
    }, []);

    const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
        manager.updateTask(taskId, updates);
    }, []);

    const deleteTask = useCallback((taskId: string) => {
        manager.deleteTask(taskId);
    }, []);

    const toggleTaskComplete = useCallback((taskId: string) => {
        const isNowComplete = manager.toggleTaskComplete(taskId);
        if (isNowComplete) {
            playSuccessSound();
        }
        return isNowComplete;
    }, []);

    const handleReorderTasks = useCallback((sourceId: string, targetId: string) => {
        manager.reorderTasks(sourceId, targetId);
    }, []);

    // Drag and Drop Logic
    const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDropOnGrid = useCallback((e: React.DragEvent, day: Date, row: GridRow | null) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
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

        manager.scheduleTask(taskId, day, targetRow as GridRow, targetType);
    }, [tasks]);

    const handleDropOnSidebar = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;
        manager.unscheduleTask(taskId);
    }, []);

    const handleDropOnEisenhower = useCallback((e: React.DragEvent, quad: 'do' | 'decide' | 'delegate' | 'delete') => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;
        manager.setEisenhowerQuad(taskId, quad);
    }, []);

    return {
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        handleReorderTasks,
        handleDragStart,
        handleDropOnGrid,
        handleDropOnSidebar,
        handleDropOnEisenhower,
        clearRescheduledTasks: () => manager.clearRescheduledTasks()
    };
}
