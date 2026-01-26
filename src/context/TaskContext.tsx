import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useTaskManager } from '../hooks/useTaskManager';
import { Task, TaskType, GridRow } from '../types';
import { supabase, supabaseAvailable } from '../lib/supabase';
import { mapTaskFromDb, DbTaskRow } from '../services/supabaseDataService';

interface TaskContextType {
    tasks: Task[];
    addTask: (title: string, duration: number, type: TaskType, id?: string, notes?: string, parent_id?: string) => Task;
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
    resetStats: () => void;
    isLoading: boolean;
    refreshTasks: () => void;
    deleteAllTasks: () => void;
    selectedTaskId: string | null;
    setSelectedTaskId: (taskId: string | null) => void;
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
        resetStats,
        syncRemoteTask,
        removeRemoteTask,
        isLoading,
        refreshTasks,

        deleteAllTasks
    } = useTaskManager(initialTasks, userId, supabaseEnabled);

    const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);

    useEffect(() => {
        if (!userId || !supabaseEnabled || !supabaseAvailable || !supabase) return;

        let channel: ReturnType<typeof supabase.channel> | null = null;
        let isSubscribed = false;

        const setupChannel = async () => {
            channel = supabase
                .channel(`tasks-realtime-${userId}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
                    (payload) => {
                        if (payload.eventType === 'DELETE' && (payload.old as DbTaskRow)?.id) {
                            removeRemoteTask((payload.old as DbTaskRow).id);
                            return;
                        }
                        if (payload.new) {
                            mapTaskFromDb(payload.new as DbTaskRow).then(task => {
                                syncRemoteTask(task);
                            });
                        }
                    }
                );

            await channel.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    isSubscribed = true;
                }
            });
        };

        setupChannel();

        return () => {
            // Only try to remove if we have a channel and it was subscribed
            if (channel && isSubscribed) {
                supabase.removeChannel(channel);
            } else if (channel) {
                // If not subscribed yet, just unsubscribe to cancel pending connection
                channel.unsubscribe();
            }
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
            resetStats,
            isLoading,
            refreshTasks,
            deleteAllTasks,
            selectedTaskId,
            setSelectedTaskId
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
