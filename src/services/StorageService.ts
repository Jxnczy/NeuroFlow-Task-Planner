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

    loadSyncPreference(): boolean | null {
        try {
            const val = localStorage.getItem(this.SYNC_PREF_KEY);
            if (val === null) return null; // First visit - no preference set yet
            return val === 'true';
        } catch {
            return null;
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

    /**
     * Type guard to validate task structure
     */
    private isValidTask(item: unknown): boolean {
        if (typeof item !== 'object' || item === null) return false;
        const t = item as Record<string, unknown>;
        return (
            typeof t.id === 'string' && t.id.length > 0 &&
            typeof t.title === 'string' &&
            (t.duration === undefined || typeof t.duration === 'number') &&
            (t.type === undefined || ['low', 'medium', 'high', 'leisure', 'backlog', 'chores'].includes(t.type as string)) &&
            (t.deadline === undefined || t.deadline === null || typeof t.deadline === 'string')
        );
    }

    /**
     * Type guard to validate habit structure
     */
    private isValidHabit(item: unknown): boolean {
        if (typeof item !== 'object' || item === null) return false;
        const h = item as Record<string, unknown>;
        return (
            typeof h.id === 'string' && h.id.length > 0 &&
            typeof h.name === 'string' &&
            (h.goal === undefined || typeof h.goal === 'number') &&
            (h.checks === undefined || Array.isArray(h.checks))
        );
    }

    /**
     * Type guard to validate brain dump list structure
     */
    private isValidBrainDumpList(item: unknown): boolean {
        if (typeof item !== 'object' || item === null) return false;
        const l = item as Record<string, unknown>;
        return (
            typeof l.id === 'string' && l.id.length > 0 &&
            typeof l.title === 'string' &&
            (l.content === undefined || typeof l.content === 'string')
        );
    }

    async importData(file: File): Promise<AppData> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = e.target?.result as string;
                    const data = JSON.parse(json);

                    // Validate structure exists
                    if (!data || typeof data !== 'object') {
                        reject(new Error('Invalid data format: not a valid JSON object'));
                        return;
                    }

                    // Check if it has at least tasks or habits
                    if (!Array.isArray(data.tasks) && !Array.isArray(data.habits)) {
                        reject(new Error('Invalid data format: Missing tasks or habits array'));
                        return;
                    }

                    // Filter and validate each item, removing malformed entries
                    const validTasks = Array.isArray(data.tasks)
                        ? data.tasks.filter((t: unknown) => this.isValidTask(t))
                        : [];
                    const validHabits = Array.isArray(data.habits)
                        ? data.habits.filter((h: unknown) => this.isValidHabit(h))
                        : [];
                    const validLists = Array.isArray(data.brainDumpLists)
                        ? data.brainDumpLists.filter((l: unknown) => this.isValidBrainDumpList(l))
                        : [];

                    // Log if items were filtered out
                    const tasksFiltered = (data.tasks?.length || 0) - validTasks.length;
                    const habitsFiltered = (data.habits?.length || 0) - validHabits.length;
                    if (tasksFiltered > 0 || habitsFiltered > 0) {
                        console.warn(`Import: filtered out ${tasksFiltered} invalid tasks and ${habitsFiltered} invalid habits`);
                    }

                    const validData: AppData = {
                        tasks: validTasks,
                        habits: validHabits,
                        brainDumpLists: validLists,
                        brainDumpContent: typeof data.brainDumpContent === 'string' ? data.brainDumpContent : undefined,
                        notes: data.notes,
                        dayHistory: typeof data.dayHistory === 'object' ? data.dayHistory : {}
                    };
                    resolve(validData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
}

