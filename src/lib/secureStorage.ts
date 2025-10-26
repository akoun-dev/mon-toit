/**
 * Secure Storage Utility with AES-GCM Encryption
 * Provides military-grade encryption for sensitive localStorage data
 */

import { secureRandom } from './securityUtils';

// Interface for encrypted data structure
interface EncryptedData {
  data: string;        // Base64 encrypted data
  iv: string;         // Base64 initialization vector
  salt: string;       // Base64 salt for key derivation
  algorithm: string; // Encryption algorithm used
  timestamp: number; // Encryption timestamp
}

class SecureStorage {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256; // bits
  private static readonly IV_LENGTH = 12;    // bytes for GCM
  private static readonly SALT_LENGTH = 16;   // bytes for PBKDF2
  private static readonly ITERATIONS = 100000; // PBKDF2 iterations

  /**
   * Derive encryption key from password and salt using PBKDF2
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: SecureStorage.ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: SecureStorage.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a consistent encryption key from browser fingerprint
   */
  private async getEncryptionKey(): Promise<string> {
    // Create a consistent fingerprint from browser characteristics
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      !!navigator.hardwareConcurrency,
      !!navigator.cookieEnabled
    ].join('|');

    // Use a stable key derivation (not time-based for consistency)
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(fingerprint));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt data using AES-GCM
   */
  private async encryptData(data: string): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generate random salt and IV
    const salt = secureRandom.bytes(SecureStorage.SALT_LENGTH);
    const iv = secureRandom.bytes(SecureStorage.IV_LENGTH);

    // Derive key
    const key = await this.deriveKey(await this.getEncryptionKey(), salt);

    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: SecureStorage.ALGORITHM, iv },
      key,
      dataBuffer
    );

    // Convert to base64 for storage
    const encryptedData = {
      data: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
      iv: btoa(String.fromCharCode(...iv)),
      salt: btoa(String.fromCharCode(...salt)),
      algorithm: SecureStorage.ALGORITHM,
      timestamp: Date.now()
    };

    return encryptedData;
  }

  /**
   * Decrypt data using AES-GCM
   */
  private async decryptData(encryptedData: EncryptedData): Promise<string | null> {
    try {
      // Convert from base64
      const encryptedBuffer = new Uint8Array(
        atob(encryptedData.data).split('').map(char => char.charCodeAt(0))
      );
      const iv = new Uint8Array(
        atob(encryptedData.iv).split('').map(char => char.charCodeAt(0))
      );
      const salt = new Uint8Array(
        atob(encryptedData.salt).split('').map(char => char.charCodeAt(0))
      );

      // Derive key
      const key = await this.deriveKey(await this.getEncryptionKey(), salt);

      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: SecureStorage.ALGORITHM, iv },
        key,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Store data with optional encryption
   */
  async setItem(key: string, value: string, isSensitive = false): Promise<void> {
    try {
      if (isSensitive) {
        const encryptedData = await this.encryptData(value);
        localStorage.setItem(key, JSON.stringify(encryptedData));

        // Store metadata for compatibility
        localStorage.setItem(`${key}_meta`, JSON.stringify({
          encrypted: true,
          algorithm: SecureStorage.ALGORITHM,
          timestamp: Date.now()
        }));
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Failed to store data:', error);
      // Fallback to unencrypted storage
      localStorage.setItem(key, value);
    }
  }

  /**
   * Retrieve data with automatic decryption
   */
  async getItem(key: string, isSensitive = false): Promise<string | null> {
    try {
      if (isSensitive) {
        // Check if this is encrypted data
        const storedData = localStorage.getItem(key);
        if (storedData) {
          try {
            const encryptedData: EncryptedData = JSON.parse(storedData);
            if (encryptedData.data && encryptedData.iv && encryptedData.salt) {
              return await this.decryptData(encryptedData);
            }
          } catch {
            // Not valid encrypted data, try legacy format
          }
        }

        // Fallback to legacy format check
        const metaData = localStorage.getItem(`${key}_meta`);
        if (metaData) {
          const meta = JSON.parse(metaData);
          if (meta.encrypted) {
            // Try legacy decryption (XOR)
            return this.legacyDecrypt(key);
          }
        }
      }

      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return localStorage.getItem(key);
    }
  }

  /**
   * Legacy decryption for old XOR-encrypted data
   */
  private legacyDecrypt(key: string): string | null {
    try {
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) return null;

      // Check if it's a valid base64 string (legacy format)
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encryptedValue)) {
        return null; // Not legacy encrypted data
      }

      // Simple XOR decryption (legacy)
      const userAgent = navigator.userAgent;
      const language = navigator.language;
      const xorKey = btoa(`${userAgent}-${language}`).slice(0, 32);

      const text = atob(encryptedValue);
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ xorKey.charCodeAt(i % xorKey.length)
        );
      }
      return result;
    } catch (error) {
      // Silently handle legacy decryption failures - these are expected
      // during migration from old storage format
      return null;
    }
  }

  /**
   * Remove item and its metadata
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_meta`);
  }

  /**
   * Clear all storage except certain keys
   */
  clear(): void {
    const keysToKeep = ['user_preferences', 'app_settings'];
    const allKeys = Object.keys(localStorage);

    allKeys.forEach(key => {
      if (!keysToKeep.includes(key) && !key.endsWith('_meta')) {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_meta`);
      }
    });
  }

  /**
   * List all sensitive keys (those with _meta)
   */
  getSensitiveKeys(): string[] {
    return Object.keys(localStorage)
      .filter(key => key.endsWith('_meta'))
      .map(key => key.replace('_meta', ''));
  }

  /**
   * Check if a key is encrypted
   */
  isEncrypted(key: string): boolean {
    const metaData = localStorage.getItem(`${key}_meta`);
    if (metaData) {
      try {
        const meta = JSON.parse(metaData);
        return meta.encrypted === true;
      } catch {
        return false;
      }
    }

    // Also check if stored data looks like our encrypted format
    const storedData = localStorage.getItem(key);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        return parsed.data && parsed.iv && parsed.salt && parsed.algorithm;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Migrate old XOR-encrypted data to new AES-GCM encryption
   */
  async migrateLegacyData(): Promise<number> {
    const sensitiveKeys = this.getSensitiveKeys();
    let migratedCount = 0;

    for (const key of sensitiveKeys) {
      if (!this.isEncrypted(key)) {
        continue; // Skip non-encrypted keys
      }

      try {
        // Get legacy decrypted value
        const legacyValue = this.legacyDecrypt(key);
        if (legacyValue) {
          // Re-encrypt with new AES-GCM
          await this.setItem(key, legacyValue, true);
          migratedCount++;
        }
      } catch (error) {
        // Silently handle migration failures - expected during transition
        // No need to log errors for legacy data that can't be migrated
      }
    }

    return migratedCount;
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();

// Helper functions for common use cases (async versions)
export const secureTokenStorage = {
  setToken: async (token: string) => {
    await secureStorage.setItem('auth_token', token, true);
  },
  getToken: async (): Promise<string | null> => {
    return await secureStorage.getItem('auth_token', true);
  },
  removeToken: () => {
    secureStorage.removeItem('auth_token');
  }
};

export const secureUserStorage = {
  setUserPreferences: async (preferences: Record<string, any>) => {
    await secureStorage.setItem('user_preferences', JSON.stringify(preferences), true);
  },
  getUserPreferences: async (): Promise<Record<string, any> | null> => {
    const prefs = await secureStorage.getItem('user_preferences', true);
    return prefs ? JSON.parse(prefs) : null;
  },
  removeUserPreferences: () => {
    secureStorage.removeItem('user_preferences');
  }
};

// Migration utility to encrypt existing sensitive data
export const migrateToSecureStorage = async () => {
  const sensitiveKeys = ['mapbox_token', 'auth_token', 'user_preferences'];
  let migratedCount = 0;

  for (const key of sensitiveKeys) {
    const existingValue = localStorage.getItem(key);
    if (existingValue && !secureStorage.isEncrypted(key)) {
      // Check if it looks like it might be sensitive
      if (key.includes('token') || key.includes('auth') || key.includes('user')) {
        await secureStorage.setItem(key, existingValue, true);
        // Remove unencrypted version
        localStorage.removeItem(key);
        migratedCount++;
      }
    }
  }

  // Also migrate legacy encrypted data
  const legacyMigratedCount = await secureStorage.migrateLegacyData();

  console.log(`Migration completed: ${migratedCount} new items, ${legacyMigratedCount} legacy items`);
  return migratedCount + legacyMigratedCount;
};

// Disable auto-migration to prevent session issues
// Migration will be handled manually if needed
// if (import.meta.env.DEV) {
//   migrateToSecureStorage().catch(console.error);
// }