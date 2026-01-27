import React, { useCallback, useRef, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { CryptoService } from '../services/CryptoService';
import { AppData, Task, Habit, BrainDumpList } from '../types';

export function usePersistence(
    tasks: Task[],
    habits: Habit[],
    brainDumpLists: BrainDumpList[],
    statsResetAt: number,
    encryptionEnabled: boolean = false
) {
    const storage = StorageService.getInstance();
    const crypto = CryptoService.getInstance();
    const saveInProgress = useRef(false);

    // Local autosave for offline resilience
    useEffect(() => {
        // Debounce and prevent concurrent saves
        if (saveInProgress.current) return;

        // Safety check: Prevent saving if critical data is undefined (e.g. during render crashes or context failures)
        if (!Array.isArray(tasks) || !Array.isArray(habits) || !Array.isArray(brainDumpLists)) {
            console.warn('usePersistence: Skipping save due to missing/invalid data structures', { tasks, habits, brainDumpLists });
            return;
        }

        const data: AppData = { tasks, habits, brainDumpLists, statsResetAt };

        const saveData = async () => {
            saveInProgress.current = true;
            try {
                // Check latest encryption status directly from storage to avoid stale closures
                const isEncrypted = storage.isEncryptionEnabled() || encryptionEnabled;

                if (isEncrypted && crypto.getIsUnlocked()) {
                    // Save encrypted
                    await storage.saveEncrypted(data);
                } else if (!isEncrypted) {
                    // Fallback to plaintext ONLY if encryption is strictly disabled
                    storage.save(data);
                }
                // If encryption enabled but vault locked, skip save (read-only mode)
            } catch (error) {
                console.error('Failed to save data:', error);
            } finally {
                saveInProgress.current = false;
            }
        };

        // Small debounce to batch rapid changes
        const timer = setTimeout(saveData, 100);
        return () => clearTimeout(timer);
    }, [tasks, habits, brainDumpLists, statsResetAt, encryptionEnabled, crypto, storage]);

    const exportData = useCallback(() => {
        const data: AppData = { tasks, habits, brainDumpLists, statsResetAt };
        storage.exportData(data);
    }, [tasks, habits, brainDumpLists, statsResetAt, storage]);

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
    }, [storage]);

    return {
        exportData,
        importData,
        saveTheme: (id: string) => storage.saveTheme(id),
        loadTheme: () => storage.loadTheme()
    };
}

