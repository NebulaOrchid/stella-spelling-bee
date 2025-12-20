import type { IStorage } from '../../types';

/**
 * LocalStorage implementation of IStorage interface
 * Easy to swap with database implementation later
 */
export class LocalStorageService implements IStorage {
  private prefix: string;

  constructor(prefix: string = 'spelling-bee') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      // Only clear keys with our prefix
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(`${this.prefix}:`)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const storage = new LocalStorageService();
