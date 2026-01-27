import { useState, useEffect, useMemo, useCallback } from 'react';
import { HabitManager } from '../services/HabitManager';
import { Habit } from '../types';
import { SupabaseDataService } from '../services/supabaseDataService';

import { useSpace } from './useSpace';

export function useHabitManager(initialHabits: Habit[], userId?: string, supabaseEnabled: boolean = true) {
    const [allHabits, setAllHabits] = useState<Habit[]>(initialHabits);
    const { space: currentSpace, spacesEnabled } = useSpace();

    // Initialize manager once
    const manager = useMemo(() => new HabitManager(initialHabits), []);

    useEffect(() => {
        return manager.subscribe(setAllHabits);
    }, [manager]);

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

        /*
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                void fetchRemoteHabits();
            }
        };
        window.addEventListener('visibilitychange', handleVisibility);
        */

        // Periodic polling for sync (every 60 seconds)
        const interval = window.setInterval(() => {
            void fetchRemoteHabits();
        }, 60000);

        return () => {
            // window.removeEventListener('visibilitychange', handleVisibility);
            window.clearInterval(interval);
        };
    }, [userId, supabaseEnabled, fetchRemoteHabits]);

    const persistHabit = useCallback((habit: Habit) => {
        if (!userId || !supabaseEnabled) return;
        void SupabaseDataService.upsertHabit(userId, habit);
    }, [userId, supabaseEnabled]);

    const addHabit = useCallback((name: string, goal: number) => {
        const space = spacesEnabled ? currentSpace : 'private';

        const newHabit = manager.addHabit(name, goal, space);
        persistHabit(newHabit);
    }, [manager, persistHabit, spacesEnabled, currentSpace]);

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

    // Derived state
    const habits = useMemo(() => {
        if (!spacesEnabled) {
            return allHabits.filter(h => !h.space || h.space === 'private');
        }
        return allHabits.filter(h => (h.space || 'private') === currentSpace);
    }, [allHabits, spacesEnabled, currentSpace]);

    return {
        habits,
        allHabits,
        addHabit,
        deleteHabit,
        toggleHabit,
        clearHabits
    };
}

