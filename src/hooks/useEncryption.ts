import React, { useState, useCallback, useEffect } from 'react';
import { CryptoService, EncryptedPayload } from '../services/CryptoService';
import { StorageService } from '../services/StorageService';
import { SupabaseDataService } from '../services/supabaseDataService';

const VAULT_SALT_KEY = 'neuroflow-vault-salt';
const VAULT_INITIALIZED_KEY = 'neuroflow-vault-initialized';
const SESSION_PASSPHRASE_KEY = 'neuroflow-session-passphrase';
const SESSION_EXPIRY_KEY = 'neuroflow-session-expiry';
const SESSION_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface UseEncryptionResult {
    isVaultSetup: boolean; // Has user ever set up encryption?
    isUnlocked: boolean; // Is vault currently unlocked?
    isUnlocked: boolean; // Is vault currently unlocked?
    isLoading: boolean; // Is an operation in progress?
    isSyncing: boolean; // Is checking remote vault?
    error: string | null;

    setupVault: (passphrase: string) => Promise<boolean>;
    unlock: (passphrase: string) => Promise<boolean>;
    lock: () => void;
    resetVault: () => void;
    syncVaultWithAccount: (userId: string) => Promise<void>;

    encryptData: (data: object) => Promise<EncryptedPayload>;
    decryptData: (payload: EncryptedPayload) => Promise<string>;
    decryptJSON: <T>(payload: EncryptedPayload) => Promise<T>;

    restoreVaultFromData: (passphrase: string, encryptedDataString: string) => Promise<boolean>;
}

export function useEncryption(userId?: string): UseEncryptionResult {
    const crypto = CryptoService.getInstance();
    const storage = StorageService.getInstance();

    const [isVaultSetup, setIsVaultSetup] = useState(() => {
        // Synchronously check if vault exists to prevent initial render race conditions
        // If salt exists, vault is set up
        const salt = localStorage.getItem(VAULT_SALT_KEY);
        return !!salt;
    });

    const [isUnlocked, setIsUnlocked] = useState(() => crypto.getIsUnlocked());

<<<<<<< HEAD
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
=======
    // Optimistic loading state if we have a session to restore
    const [isLoading, setIsLoading] = useState(() => {
        const storedPass = sessionStorage.getItem(SESSION_PASSPHRASE_KEY);
        const expiryStr = sessionStorage.getItem(SESSION_EXPIRY_KEY);
        if (storedPass && expiryStr) {
            const expiry = parseInt(expiryStr, 10);
            return Date.now() < expiry;
        }
        return false;
    });

>>>>>>> d688b1bf6644106d2449d2bfc16b0940eba2785e
    const [error, setError] = useState<string | null>(null);

    // Initial check effect
    useEffect(() => {
        const salt = localStorage.getItem(VAULT_SALT_KEY);
        const initialized = localStorage.getItem(VAULT_INITIALIZED_KEY);
        const setup = !!salt && initialized === 'true';
        setIsVaultSetup(setup);
<<<<<<< HEAD
        setIsUnlocked(crypto.getIsUnlocked());

        // Auto-sync if user is logged in
        if (userId) {
            syncVaultWithAccount(userId);
        }
    }, [userId]);
=======

        // Check session storage for auto-unlock
        if (setup && !crypto.getIsUnlocked()) {
            const storedPass = sessionStorage.getItem(SESSION_PASSPHRASE_KEY);
            const expiryStr = sessionStorage.getItem(SESSION_EXPIRY_KEY);

            if (storedPass && expiryStr) {
                const expiry = parseInt(expiryStr, 10);
                if (Date.now() < expiry) {
                    console.log('Restoring vault session...');
                    crypto.unlock(storedPass, salt).then(() => {
                        setIsUnlocked(true);
                        // Refresh expiry
                        sessionStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION_MS).toString());
                    }).catch(() => {
                        // Failed to unlock with stored pass - clear session
                        sessionStorage.removeItem(SESSION_PASSPHRASE_KEY);
                        sessionStorage.removeItem(SESSION_EXPIRY_KEY);
                    }).finally(() => {
                        setIsLoading(false);
                    });
                } else {
                    // Session expired
                    sessionStorage.removeItem(SESSION_PASSPHRASE_KEY);
                    sessionStorage.removeItem(SESSION_EXPIRY_KEY);
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        } else {
            setIsUnlocked(crypto.getIsUnlocked());
            setIsLoading(false);
        }
    }, []);
>>>>>>> d688b1bf6644106d2449d2bfc16b0940eba2785e

    /**
     * Set up vault for first time with new passphrase
     */
    const setupVault = useCallback(async (passphrase: string): Promise<boolean> => {
        if (!passphrase || passphrase.length < 8) {
            setError('Passphrase must be at least 8 characters');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { salt } = await crypto.setupVault(passphrase);

            // Store salt (not secret, just unique per user)
            localStorage.setItem(VAULT_SALT_KEY, salt);
            localStorage.setItem(VAULT_INITIALIZED_KEY, 'true');

            // Enable encryption mode in StorageService
            storage.enableEncryption();

<<<<<<< HEAD
            // Sync to Account if logged in
            if (userId) {
                await SupabaseDataService.upsertVaultMetadata(userId, salt);
            }
=======
            // Set session
            sessionStorage.setItem(SESSION_PASSPHRASE_KEY, passphrase);
            sessionStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION_MS).toString());
>>>>>>> d688b1bf6644106d2449d2bfc16b0940eba2785e

            setIsVaultSetup(true);
            setIsUnlocked(true);
            return true;
        } catch (err) {
            setError('Failed to set up vault: ' + (err instanceof Error ? err.message : 'Unknown error'));
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    /**
     * Unlock existing vault with passphrase
     */
    const unlock = useCallback(async (passphrase: string): Promise<boolean> => {
        const salt = localStorage.getItem(VAULT_SALT_KEY);
        if (!salt) {
            setError('No vault configuration found on this device. Please log in or set up encryption.');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            await crypto.unlock(passphrase, salt);
            setIsUnlocked(true);

            // Set session
            sessionStorage.setItem(SESSION_PASSPHRASE_KEY, passphrase);
            sessionStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION_MS).toString());

            return true;
        } catch (err) {
            setError('Invalid passphrase. Please try again.');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Sync local vault metadata with cloud account
     * Includes 10-second timeout to prevent indefinite loading states
     */
    const syncVaultWithAccount = useCallback(async (uid: string) => {
        setIsSyncing(true);
        // Timeout to prevent indefinite loading state
        const timeoutId = setTimeout(() => {
            console.warn('Vault sync timed out after 10 seconds - allowing user to proceed');
            setIsSyncing(false);
        }, 10000);

        try {
            const localSalt = localStorage.getItem(VAULT_SALT_KEY);
            const { salt: remoteSalt, isSetup: remoteSetup } = await SupabaseDataService.fetchVaultMetadata(uid);
            clearTimeout(timeoutId);

            console.log('useEncryption: syncVaultWithAccount remote data:', { remoteSalt, remoteSetup, localSalt });

            if (remoteSetup && remoteSalt) {
                if (!localSalt) {
                    // CASE 1: New Device - Import remote salt
                    console.log('Detected remote vault, importing configuration...');
                    localStorage.setItem(VAULT_SALT_KEY, remoteSalt);
                    localStorage.setItem(VAULT_INITIALIZED_KEY, 'true');
                    // CRITICAL: Mark encryption as enabled so App knows to ask for unlock
                    storage.enableEncryption();
                    setIsVaultSetup(true);
                } else if (localSalt !== remoteSalt) {
                    // CASE 2: Conflict - This is tricky.
                    // For now, assume remote is source of truth if we are syncing?
                    // Or warn user?
                    console.warn('Vault salt mismatch between local and remote. Keeping local for safety.');
                }
            } else if (localSalt && !remoteSetup) {
                // CASE 3: First Sync - Push local salt to remote
                console.log('Pushing local vault configuration to account...');
                await SupabaseDataService.upsertVaultMetadata(uid, localSalt);
            }
        } catch (e) {
            // Log error but allow user to proceed - don't leave app in stuck state
            console.error('Failed to sync vault metadata, allowing user to proceed:', e);
        } finally {
            clearTimeout(timeoutId);
            setIsSyncing(false);
        }
    }, []);

    /**
     * Lock vault - clear key from memory
     */
    const lock = useCallback(() => {
        crypto.lock();
        setIsUnlocked(false);
        sessionStorage.removeItem(SESSION_PASSPHRASE_KEY);
        sessionStorage.removeItem(SESSION_EXPIRY_KEY);
    }, []);

    /**
     * Reset vault - clears all encrypted data
     * WARNING: This is destructive!
     */
    const resetVault = useCallback(() => {
        crypto.lock();
        localStorage.removeItem(VAULT_SALT_KEY);
        localStorage.removeItem(VAULT_INITIALIZED_KEY);
        sessionStorage.removeItem(SESSION_PASSPHRASE_KEY);
        sessionStorage.removeItem(SESSION_EXPIRY_KEY);
        setIsVaultSetup(false);
        setIsUnlocked(false);
        setError(null);
    }, []);

    /**
     * Encrypt data
     */
    const encryptData = useCallback(async (data: object): Promise<EncryptedPayload> => {
        if (!crypto.getIsUnlocked()) {
            throw new Error('Vault is locked');
        }
        return crypto.encryptData(data);
    }, []);

    /**
     * Decrypt data to string
     */
    const decryptData = useCallback(async (payload: EncryptedPayload): Promise<string> => {
        if (!crypto.getIsUnlocked()) {
            throw new Error('Vault is locked');
        }
        return crypto.decryptData(payload);
    }, []);

    /**
     * Decrypt and parse JSON
     */
    const decryptJSON = useCallback(async <T,>(payload: EncryptedPayload): Promise<T> => {
        if (!crypto.getIsUnlocked()) {
            throw new Error('Vault is locked');
        }
        return crypto.decryptJSON<T>(payload);
    }, []);

<<<<<<< HEAD
    return React.useMemo(() => ({
=======
    /**
     * Restore vault configuration from existing encrypted data
     * Used when local salt is missing but data is present (e.g. fresh syncing to new device)
     */
    const restoreVaultFromData = useCallback(async (passphrase: string, encryptedDataString: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Extract salt from the data payload
            const saltStr = crypto.extractSaltFromPayload(encryptedDataString);
            if (!saltStr) {
                throw new Error('Could not find encryption configuration in the provided data');
            }

            // 2. Attempt to unlock with this salt and passphrase
            // This will throw if the passphrase is wrong (verification fails)
            await crypto.unlock(passphrase, saltStr);

            // 3. If successful, persist this salt as our local configuration
            localStorage.setItem(VAULT_SALT_KEY, saltStr);
            localStorage.setItem(VAULT_INITIALIZED_KEY, 'true');

            // Enable encryption mode in StorageService
            storage.enableEncryption();

            // 4. Sync restored metadata to account to prevent future issues
            // Note: userId is not available in hook scope, but App calls this, and App has userId.
            // Wait, syncVaultWithAccount needs userId. 
            // We can rely on App to sync metadata (it does upsertVaultMetadata).
            // But we should ensure local state is consistent.

            // Set session
            sessionStorage.setItem(SESSION_PASSPHRASE_KEY, passphrase);
            sessionStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION_MS).toString());

            setIsVaultSetup(true);
            setIsUnlocked(true);
            return true;
        } catch (err) {
            console.error('Vault restoration failed:', err);
            setError('Failed to restore keys: ' + (err instanceof Error ? err.message : 'Invalid passphrase or corrupted data'));
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
>>>>>>> d688b1bf6644106d2449d2bfc16b0940eba2785e
        isVaultSetup,
        isUnlocked,
        isLoading,
        isSyncing,
        error,
        setupVault,
        unlock,
        lock,
        resetVault,
        syncVaultWithAccount,
        encryptData,
        decryptData,
<<<<<<< HEAD
        decryptJSON
    }), [
        isVaultSetup,
        isUnlocked,
        isLoading,
        isSyncing,
        error,
        setupVault,
        unlock,
        lock,
        resetVault,
        syncVaultWithAccount,
        encryptData,
        decryptData,
        decryptJSON
    ]);
=======
        decryptJSON,
        restoreVaultFromData
    };
>>>>>>> d688b1bf6644106d2449d2bfc16b0940eba2785e
}
