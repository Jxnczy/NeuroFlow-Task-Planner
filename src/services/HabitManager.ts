import { Habit } from '../types';
import { generateId } from '../utils/id';

type HabitListener = (habits: Habit[]) => void;

export class HabitManager {
    private habits: Habit[];
    private listeners: Set<HabitListener>;

    constructor(initialHabits: Habit[] = []) {
        this.habits = initialHabits;
        this.listeners = new Set();
    }

    subscribe(listener: HabitListener): () => void {
        this.listeners.add(listener);
        listener(this.habits);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach(listener => listener(this.habits));
    }

    getHabits(): Habit[] {
        return [...this.habits];
    }

    addHabit(name: string, goal: number): Habit {
        const newHabit: Habit = {
            id: generateId(),
            name,
            goal,
            checks: Array(7).fill(false)
        };
        this.habits = [...this.habits, newHabit];
        this.notify();
        return newHabit;
    }

    deleteHabit(habitId: string) {
        this.habits = this.habits.filter(h => h.id !== habitId);
        this.notify();
    }

    toggleHabit(habitId: string, dayIndex: number): Habit | undefined {
        let updatedHabit: Habit | undefined;
        this.habits = this.habits.map(h => {
            if (h.id === habitId) {
                const newChecks = [...h.checks];
                newChecks[dayIndex] = !newChecks[dayIndex];
                updatedHabit = { ...h, checks: newChecks };
                return updatedHabit;
            }
            return h;
        });
        this.notify();
        return updatedHabit;
    }

    setHabits(newHabits: Habit[]) {
        this.habits = newHabits;
        this.notify();
    }
}
