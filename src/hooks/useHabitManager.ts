import { useState, useEffect, useRef, useCallback } from 'react';
import { HabitManager } from '../services/HabitManager';
import { Habit } from '../types';
import { SupabaseDataService } from '../services/supabaseDataService';

export function useHabitManager(initialHabits: Habit[], userId?: string, supabaseEnabled: boolean = true) {
    const managerRef = useRef<HabitManager>();
    const [habits, setHabits] = useState<Habit[]>(initialHabits);

    if (!managerRef.current) {
        managerRef.current = new HabitManager(initialHabits);
    }

    const manager = managerRef.current;

    useEffect(() => {
        return manager.subscribe(setHabits);
    }, []);

    // Sync incoming remote or imported habits
    useEffect(() => {
        manager.setHabits(initialHabits);
    }, [initialHabits, manager]);

    // Visibility-based refresh for multi-device sync
    const fetchRemoteHabits = useCallback(async () => {
        if (!userId || !supabaseEnabled) return;
        try {
            const remote = await SupabaseDataService.fetchHabits(userId);
            if (remote.length) {
                manager.setHabits(remote);
            }
        } catch (error) {
            console.error('Failed to refresh habits from Supabase', error);
        }
    }, [userId, supabaseEnabled, manager]);

    useEffect(() => {
        if (!userId || !supabaseEnabled) return;

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                void fetchRemoteHabits();
            }
        };
        window.addEventListener('visibilitychange', handleVisibility);

        // Periodic polling for sync (every 30 seconds - less aggressive than tasks)
        const interval = window.setInterval(() => {
            void fetchRemoteHabits();
        }, 30000);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibility);
            window.clearInterval(interval);
        };
    }, [userId, supabaseEnabled, fetchRemoteHabits]);

    const persistHabit = useCallback((habit: Habit) => {
        if (!userId || !supabaseEnabled) return;
        void SupabaseDataService.upsertHabit(userId, habit);
    }, [userId, supabaseEnabled]);

    const addHabit = useCallback((name: string, goal: number) => {
        const newHabit = manager.addHabit(name, goal);
        persistHabit(newHabit);
    }, [manager, persistHabit]);

    const deleteHabit = useCallback((habitId: string) => {
        manager.deleteHabit(habitId);
        if (userId && supabaseEnabled) {
            void SupabaseDataService.deleteHabit(userId, habitId);
        }
    }, [manager, userId, supabaseEnabled]);

    const clearHabits = useCallback(() => {
        manager.clearHabits();
        if (userId && supabaseEnabled) {
            void SupabaseDataService.replaceHabits(userId, []);
        }
    }, [manager, userId, supabaseEnabled]);

    const toggleHabit = useCallback((habitId: string, dayIndex: number) => {
        const updated = manager.toggleHabit(habitId, dayIndex);
        if (updated) {
            persistHabit(updated);
        }
    }, [manager, persistHabit]);

    return {
        habits,
        addHabit,
        deleteHabit,
        toggleHabit,
        clearHabits
    };
}

