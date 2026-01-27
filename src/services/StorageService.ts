import { AppData } from '../types';
import { CryptoService, EncryptedPayload } from './CryptoService';

export class StorageService {
    private static instance: StorageService;
    private readonly STORAGE_KEY = 'neuroflow-app-data';
    private readonly THEME_KEY = 'neuroflow-theme';
    private readonly SYNC_PREF_KEY = 'neuroflow-sync-enabled';
    private readonly DAY_VIEW_KEY = 'neuroflow-day-view-mode';
    private readonly ENCRYPTED_DATA_KEY = 'neuroflow-encrypted-data';
    private readonly ENCRYPTION_ENABLED_KEY = 'neuroflow-encryption-enabled';

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

    /**
     * Check if encryption is enabled for this user
     */
    isEncryptionEnabled(): boolean {
        return localStorage.getItem(this.ENCRYPTION_ENABLED_KEY) === 'true';
    }

    /**
     * Enable encryption mode
     */
    enableEncryption(): void {
        localStorage.setItem(this.ENCRYPTION_ENABLED_KEY, 'true');
    }

    /**
     * Disable encryption mode
     */
    disableEncryption(): void {
        localStorage.setItem(this.ENCRYPTION_ENABLED_KEY, 'false');
    }

    /**
     * Check if there's existing unencrypted data that needs migration
     */
    hasUnencryptedData(): boolean {
        const plainData = localStorage.getItem(this.STORAGE_KEY);
        return !!plainData && !this.isEncryptionEnabled();
    }

    /**
     * Save encrypted data blob
     */
    async saveEncrypted(data: AppData): Promise<void> {
        try {
            const crypto = CryptoService.getInstance();
            if (!crypto.getIsUnlocked()) {
                throw new Error('Vault is locked');
            }
            const encrypted = await crypto.encryptData(data);
            localStorage.setItem(this.ENCRYPTED_DATA_KEY, JSON.stringify(encrypted));
            // Self-healing: Ensure the encryption flag is set
            if (localStorage.getItem(this.ENCRYPTION_ENABLED_KEY) !== 'true') {
                localStorage.setItem(this.ENCRYPTION_ENABLED_KEY, 'true');
            }
        } catch (error) {
            console.error('Failed to save encrypted data:', error);
            throw error;
        }
    }

    /**
     * Get raw encrypted payload for verification
     */
    getRawEncryptedData(): EncryptedPayload | null {
        try {
            const encryptedJson = localStorage.getItem(this.ENCRYPTED_DATA_KEY);
            if (!encryptedJson) return null;
            return JSON.parse(encryptedJson);
        } catch {
            return null;
        }
    }

    /**
     * Load and decrypt data
     */
    async loadEncrypted(): Promise<AppData | null> {
        try {
            const crypto = CryptoService.getInstance();
            if (!crypto.getIsUnlocked()) {
                throw new Error('Vault is locked');
            }
            const encryptedJson = localStorage.getItem(this.ENCRYPTED_DATA_KEY);
            if (!encryptedJson) {
                return null;
            }
            const encrypted: EncryptedPayload = JSON.parse(encryptedJson);
            const data = await crypto.decryptJSON<AppData>(encrypted);
            return data;
        } catch (error) {
            console.error('Failed to load encrypted data:', error);
            return null;
        }
    }

    /**
     * Migrate existing plaintext data to encrypted format
     */
    async migrateToEncrypted(): Promise<boolean> {
        try {
            const plainData = this.load();
            if (!plainData) {
                return true; // Nothing to migrate
            }

            // Save as encrypted
            await this.saveEncrypted(plainData);

            // Mark encryption as enabled
            this.enableEncryption();

            // Clear plaintext data
            localStorage.removeItem(this.STORAGE_KEY);

            console.log('Successfully migrated data to encrypted storage');
            return true;
        } catch (error) {
            console.error('Failed to migrate to encrypted storage:', error);
            return false;
        }
    }

    /**
     * Clear all encrypted data (for vault reset)
     */
    clearEncryptedData(): void {
        localStorage.removeItem(this.ENCRYPTED_DATA_KEY);
        localStorage.removeItem(this.ENCRYPTION_ENABLED_KEY);
    }

    /**
     * Clear plaintext data (after successful migration)
     */
    clearPlaintextData(): void {
        localStorage.removeItem(this.STORAGE_KEY);
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

    saveDayViewMode(mode: 'list' | 'timeline'): void {
        try {
            localStorage.setItem(this.DAY_VIEW_KEY, mode);
        } catch (error) {
            console.error('Failed to save day view mode:', error);
        }
    }

    loadDayViewMode(): 'list' | 'timeline' {
        try {
            const val = localStorage.getItem(this.DAY_VIEW_KEY);
            if (val === 'timeline') return 'timeline';
            return 'list'; // default
        } catch {
            return 'list';
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
                        dayHistory: typeof data.dayHistory === 'object' ? data.dayHistory : {},
                        statsResetAt: typeof data.statsResetAt === 'number' ? data.statsResetAt : undefined
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

