import { AppData, Task, Habit, BrainDumpList, Note } from '../types';

export const migrateDataToSpaces = (data: AppData): AppData => {
    if (!data) return data;

    // Helper to safely assign space if missing
    // We strictly assign 'private' to existing data that has no space.
    // If it already has a space, we leave it alone (idempotency).

    const migrateItem = <T extends { space?: 'work' | 'private' }>(item: T): T => {
        if (!item.space) {
            return { ...item, space: 'private' };
        }
        return item;
    };

    return {
        ...data,
        tasks: data.tasks?.map(migrateItem) || [],
        habits: data.habits?.map(migrateItem) || [],
        brainDumpLists: data.brainDumpLists?.map(migrateItem) || [],
        notes: data.notes?.map(migrateItem) || [], // For legacy notes if present
    };
};
