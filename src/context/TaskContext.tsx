import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useTaskManager } from '../hooks/useTaskManager';
import { Task, TaskType, GridRow } from '../types';
import { supabase } from '../lib/supabase';
import { mapTaskFromDb, DbTaskRow } from '../services/supabaseDataService';

interface TaskContextType {
    tasks: Task[];
    addTask: (title: string, duration: number, type: TaskType) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    scheduleTask: (taskId: string, date: Date, row?: GridRow | null, type?: TaskType) => void;
    deleteTask: (taskId: string) => void;
    toggleTaskComplete: (taskId: string) => void;
    handleReorderTasks: (sourceId: string, targetId: string) => void;
    handleDragStart: (e: React.DragEvent, taskId: string) => void;
    handleDragEnd: (e: React.DragEvent) => void;
    isDragging: boolean;
    handleDropOnGrid: (e: React.DragEvent, day: Date, row: GridRow | null) => void;
    handleDropOnSidebar: (e: React.DragEvent) => void;
    handleDropOnEisenhower: (e: React.DragEvent, quad: 'do' | 'decide' | 'delegate' | 'delete') => void;
    clearRescheduledTasks: () => void;
    isLoading: boolean;
    refreshTasks: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

interface TaskProviderProps {
    children: ReactNode;
    initialTasks: Task[];
    userId?: string;
    supabaseEnabled?: boolean;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children, initialTasks, userId, supabaseEnabled = true }) => {
    const {
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
        clearRescheduledTasks,
        syncRemoteTask,
        removeRemoteTask,
        isLoading,
        refreshTasks
    } = useTaskManager(initialTasks, userId, supabaseEnabled);

    useEffect(() => {
        if (!userId || !supabaseEnabled) return;

        const channel = supabase
            .channel('tasks-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
                (payload) => {
                    if (payload.eventType === 'DELETE' && (payload.old as DbTaskRow)?.id) {
                        removeRemoteTask((payload.old as DbTaskRow).id);
                        return;
                    }
                    if (payload.new) {
                        syncRemoteTask(mapTaskFromDb(payload.new as DbTaskRow));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, syncRemoteTask, removeRemoteTask, supabaseEnabled]);

    return (
        <TaskContext.Provider value={{
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
            clearRescheduledTasks,
            isLoading,
            refreshTasks
        }}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTaskContext = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTaskContext must be used within a TaskProvider');
    }
    return context;
};
