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
        toggleHabit
    };
}
