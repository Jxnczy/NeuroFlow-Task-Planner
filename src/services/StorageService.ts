import { AppData } from '../types';

export class StorageService {
    private static instance: StorageService;
    private readonly STORAGE_KEY = 'neuroflow-app-data';
    private readonly THEME_KEY = 'neuroflow-theme';
    private readonly SYNC_PREF_KEY = 'neuroflow-sync-enabled';

    private constructor() { }

    static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    save(data: AppData): void {
        try {
            const json = JSON.stringify(data);
            localStorage.setItem(this.STORAGE_KEY, json);
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    load(): AppData | null {
        try {
            const json = localStorage.getItem(this.STORAGE_KEY);
            if (json) {
                const data = JSON.parse(json);
                // Basic validation
                if (data && (Array.isArray(data.tasks) || Array.isArray(data.habits))) {
                    return data as AppData;
                }
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }
        return null;
    }

    saveTheme(themeId: string): void {
        try {
            localStorage.setItem(this.THEME_KEY, themeId);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    }

    loadTheme(): string {
        try {
            return localStorage.getItem(this.THEME_KEY) || 'northern-lights';
        } catch {
            return 'northern-lights';
        }
    }

    saveSyncPreference(enabled: boolean): void {
        try {
            localStorage.setItem(this.SYNC_PREF_KEY, enabled ? 'true' : 'false');
        } catch (error) {
            console.error('Failed to save sync preference:', error);
        }
    }

    loadSyncPreference(): boolean {
        try {
            const val = localStorage.getItem(this.SYNC_PREF_KEY);
            if (val === null) return true; // default to enabled
            return val === 'true';
        } catch {
            return true;
        }
    }

    exportData(data: AppData): void {
        try {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
            a.download = `${timestamp}-neuroflow-data.json`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export data:', error);
            alert('Failed to export data.');
        }
    }

    async importData(file: File): Promise<AppData> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = e.target?.result as string;
                    const data = JSON.parse(json);

                    // Relaxed validation: Check if it looks somewhat like our data
                    // We accept if it has tasks OR habits.
                    if (data && (Array.isArray(data.tasks) || Array.isArray(data.habits))) {
                        // Ensure required fields exist by defaulting to empty arrays if missing
                        const validData: AppData = {
                            tasks: Array.isArray(data.tasks) ? data.tasks : [],
                            habits: Array.isArray(data.habits) ? data.habits : [],
                            brainDumpLists: Array.isArray(data.brainDumpLists) ? data.brainDumpLists : [],
                            brainDumpContent: data.brainDumpContent,
                            notes: data.notes,
                            dayHistory: data.dayHistory || {}
                        };
                        resolve(validData);
                    } else {
                        reject(new Error('Invalid data format: Missing tasks or habits array'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
}
