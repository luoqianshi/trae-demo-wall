const STORAGE_PREFIX = 'ai_writer_api_key_';
const EXPIRY_SUFFIX = '_expiry';

export interface StoredKeyInfo {
  key: string;
  expiry: number;
}

export class SecureApiKeyManager {
  private static getStorageKey(provider: string): string {
    return `${STORAGE_PREFIX}${provider}`;
  }

  private static getExpiryKey(provider: string): string {
    return `${STORAGE_PREFIX}${provider}${EXPIRY_SUFFIX}`;
  }

  static store(provider: string, apiKey: string, remember: boolean): void {
    try {
      if (!remember) {
        this.clear(provider);
        return;
      }

      const expiry = remember ? Date.now() + 7 * 24 * 60 * 60 * 1000 : Date.now() + 15 * 60 * 1000;
      
      localStorage.setItem(this.getStorageKey(provider), this.encrypt(apiKey));
      localStorage.setItem(this.getExpiryKey(provider), expiry.toString());
    } catch (e) {
      console.warn('无法存储API密钥:', e);
    }
  }

  static retrieve(provider: string): string | null {
    try {
      const storedKey = localStorage.getItem(this.getStorageKey(provider));
      const expiryStr = localStorage.getItem(this.getExpiryKey(provider));

      if (!storedKey || !expiryStr) {
        return null;
      }

      const expiry = parseInt(expiryStr, 10);
      if (Date.now() > expiry) {
        this.clear(provider);
        return null;
      }

      return this.decrypt(storedKey);
    } catch (e) {
      console.warn('无法读取API密钥:', e);
      return null;
    }
  }

  static hasValidKey(provider: string): boolean {
    const key = this.retrieve(provider);
    return key !== null && key.length > 0;
  }

  static clear(provider: string): void {
    try {
      localStorage.removeItem(this.getStorageKey(provider));
      localStorage.removeItem(this.getExpiryKey(provider));
    } catch (e) {
      console.warn('无法清除API密钥:', e);
    }
  }

  private static encrypt(text: string): string {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const key = this.getEncryptionKey();
      
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data[i] ^ key[i % key.length]);
      }
      
      return btoa(result);
    } catch {
      return btoa(text);
    }
  }

  private static decrypt(text: string): string {
    try {
      const decoded = atob(text);
      const key = this.getEncryptionKey();
      
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key[i % key.length]);
      }
      
      return result;
    } catch {
      return atob(text);
    }
  }

  private static getEncryptionKey(): number[] {
    const seed = 'ai_writer_secret_key_2024';
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(seed));
  }
}