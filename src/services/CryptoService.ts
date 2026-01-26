/**
 * CryptoService - End-to-End Encryption using Web Crypto API
 * 
 * Uses AES-256-GCM for authenticated encryption and PBKDF2 for key derivation.
 * All cryptographic operations happen client-side; keys never leave the device.
 */

// Constants for cryptographic operations
const PBKDF2_ITERATIONS = 600000; // OWASP 2023 recommendation
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits for GCM
const KEY_LENGTH = 256; // AES-256

export interface EncryptedPayload {
    ciphertext: string; // Base64 encoded
    iv: string; // Base64 encoded
    salt: string; // Base64 encoded (for key derivation verification)
    version: number; // Schema version for future migrations
    context?: string; // Optional context identifier (not signed itself, but used as AAD)
}

/**
 * Generate cryptographically secure random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate a new salt for key derivation
 */
export function generateSalt(): Uint8Array {
    return generateRandomBytes(SALT_LENGTH);
}

/**
 * Convert Uint8Array to Base64 string
 */
export function arrayToBase64(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array));
}

/**
 * Convert Base64 string to Uint8Array
 */
export function base64ToArray(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Derive an encryption key from a passphrase using PBKDF2
 * @param passphrase - User's vault passphrase
 * @param salt - Unique salt for this user (stored alongside encrypted data)
 * @returns CryptoKey suitable for AES-GCM operations
 */
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    // Import passphrase as raw key material
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    // Derive AES-256 key using PBKDF2
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: KEY_LENGTH },
        false, // Non-extractable for security
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt data using AES-256-GCM
 * @param plaintext - Data to encrypt (will be JSON stringified if object)
 * @param key - CryptoKey derived from passphrase
 * @param salt - Salt used for key derivation (included in payload for verification)
 * @returns EncryptedPayload with ciphertext, IV, and metadata
 */
export async function encrypt(
    plaintext: string | object,
    key: CryptoKey,
    salt: Uint8Array,
    context?: string
): Promise<EncryptedPayload> {
    const encoder = new TextEncoder();
    const data = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);
    const plaintextBytes = encoder.encode(data);

    // Prepare Additional Authenticated Data (AAD) if context is provided
    const additionalData = context ? encoder.encode(context) : undefined;

    // Generate fresh IV for each encryption (critical for GCM security)
    const iv = generateRandomBytes(IV_LENGTH);

    // Encrypt using AES-GCM
    const algorithm: AesGcmParams = { name: 'AES-GCM', iv: iv };
    if (additionalData) {
        algorithm.additionalData = additionalData;
    }

    const ciphertextBuffer = await crypto.subtle.encrypt(
        algorithm,
        key,
        plaintextBytes
    );

    return {
        ciphertext: arrayToBase64(new Uint8Array(ciphertextBuffer)),
        iv: arrayToBase64(iv),
        salt: arrayToBase64(salt),
        version: 2,
        context: context
    };
}

/**
 * Decrypt data using AES-256-GCM
 * @param payload - EncryptedPayload from encrypt()
 * @param key - CryptoKey derived from passphrase
 * @param context - Optional context to bind decryption to (required if payload version >= 2)
 * @returns Decrypted string (parse as JSON if needed)
 * @throws Error if decryption fails (wrong key or tampered data)
 */
export async function decrypt(
    payload: EncryptedPayload,
    key: CryptoKey,
    context?: string
): Promise<string> {
    const ciphertext = base64ToArray(payload.ciphertext);
    const iv = base64ToArray(payload.iv);

    // Version 2+ requires context binding if created with context
    // We enforce context check if payload.version >= 2
    let additionalData: Uint8Array | undefined;
    if (payload.version >= 2 && context) {
        const encoder = new TextEncoder();
        additionalData = encoder.encode(context);
    }

    try {
        const algorithm: AesGcmParams = { name: 'AES-GCM', iv: iv };
        if (additionalData) {
            algorithm.additionalData = additionalData;
        }

        const plaintextBuffer = await crypto.subtle.decrypt(
            algorithm,
            key,
            ciphertext
        );

        const decoder = new TextDecoder();
        return decoder.decode(plaintextBuffer);
    } catch (error) {
        // GCM authentication failed - wrong key or tampered data/context
        throw new Error('Decryption failed: Invalid passphrase, corrupted data, or context mismatch');
    }
}

/**
 * Verify a passphrase against stored encrypted data
 * Attempts to derive key and decrypt a small test value
 */
export async function verifyPassphrase(
    passphrase: string,
    encryptedPayload: EncryptedPayload
): Promise<boolean> {
    try {
        const salt = base64ToArray(encryptedPayload.salt);
        const key = await deriveKey(passphrase, salt);
        await decrypt(encryptedPayload, key);
        return true;
    } catch {
        return false;
    }
}

/**
 * Hash a passphrase for quick verification (not for encryption)
 * Uses SHA-256 - only for checking if passphrase matches, not security-critical
 */
export async function hashPassphrase(passphrase: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase + arrayToBase64(salt));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return arrayToBase64(new Uint8Array(hashBuffer));
}

/**
 * CryptoService singleton for managing encryption state
 */
export class CryptoService {
    private static instance: CryptoService;
    private encryptionKey: CryptoKey | null = null;
    private salt: Uint8Array | null = null;
    private isUnlocked = false;

    private constructor() { }

    static getInstance(): CryptoService {
        if (!CryptoService.instance) {
            CryptoService.instance = new CryptoService();
        }
        return CryptoService.instance;
    }

    /**
     * Initialize vault with a new passphrase (first-time setup)
     */
    async setupVault(passphrase: string): Promise<{ salt: string }> {
        this.salt = generateSalt();
        this.encryptionKey = await deriveKey(passphrase, this.salt);
        this.isUnlocked = true;
        return { salt: arrayToBase64(this.salt) };
    }

    /**
     * Unlock vault with existing passphrase
     */
    async unlock(passphrase: string, saltBase64: string): Promise<void> {
        this.salt = base64ToArray(saltBase64);
        this.encryptionKey = await deriveKey(passphrase, this.salt);
        this.isUnlocked = true;
    }

    /**
     * Lock vault - clear encryption key from memory
     */
    lock(): void {
        this.encryptionKey = null;
        this.isUnlocked = false;
        // Salt can remain cached for unlock attempts
    }

    /**
     * Check if vault is currently unlocked
     */
    getIsUnlocked(): boolean {
        return this.isUnlocked && this.encryptionKey !== null;
    }

    /**
     * Get current salt (for storage)
     */
    getSalt(): string | null {
        return this.salt ? arrayToBase64(this.salt) : null;
    }

    /**
     * Encrypt data using current key
     */
    async encryptData(data: object | string, context?: string): Promise<EncryptedPayload> {
        if (!this.encryptionKey || !this.salt) {
            throw new Error('Vault is locked. Unlock with passphrase first.');
        }
        return encrypt(data, this.encryptionKey, this.salt, context);
    }

    /**
     * Decrypt data using current key
     */
    async decryptData(payload: EncryptedPayload, context?: string): Promise<string> {
        if (!this.encryptionKey) {
            throw new Error('Vault is locked. Unlock with passphrase first.');
        }
        return decrypt(payload, this.encryptionKey, context);
    }

    /**
     * Decrypt and parse JSON data
     */
    async decryptJSON<T>(payload: EncryptedPayload): Promise<T> {
        const jsonString = await this.decryptData(payload);
        return JSON.parse(jsonString) as T;
    }

    /**
     * Extract salt from an encrypted payload string (pre-decryption)
     * Used for restoring vault from data when local config is missing
     */
    extractSaltFromPayload(encryptedString: string): string | null {
        try {
            // Remove prefix if present (handled by caller usually, but safe to check)
            const jsonStr = encryptedString.startsWith('ENC:') ? encryptedString.substring(4) : encryptedString;
            const payload = JSON.parse(jsonStr) as EncryptedPayload;
            return payload.salt || null;
        } catch {
            return null;
        }
    }
}
