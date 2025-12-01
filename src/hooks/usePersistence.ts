import React, { useCallback } from 'react';
import { StorageService } from '../services/StorageService';
import { AppData, Task, Habit, BrainDumpList } from '../types';

export function usePersistence(tasks: Task[], habits: Habit[], brainDumpLists: BrainDumpList[]) {
    const storage = StorageService.getInstance();

    // Local autosave for offline resilience
    React.useEffect(() => {
        const data: AppData = { tasks, habits, brainDumpLists };
        storage.save(data);
    }, [tasks, habits, brainDumpLists]);

    const exportData = useCallback(() => {
        const data: AppData = { tasks, habits, brainDumpLists };
        storage.exportData(data);
    }, [tasks, habits, brainDumpLists]);

    const importData = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return null;

        try {
            const data = await storage.importData(file);
            if (data) {
                return data;
            }
            return data;
        } catch (error) {
            console.error(error);
            alert('Failed to import data.');
            return null;
        }
    }, []);

    return {
        exportData,
        importData,
        saveTheme: (id: string) => storage.saveTheme(id),
        loadTheme: () => storage.loadTheme()
    };
}
