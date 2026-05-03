import Logger from './logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class Cache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    this.cache.set(key, entry);
    Logger.debug(`Cache set: ${key}`);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      Logger.debug(`Cache expired: ${key}`);
      return null;
    }

    Logger.debug(`Cache hit: ${key}`);
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      Logger.debug(`Cache delete: ${key}`);
    }
    return deleted;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    Logger.debug(`Cache cleared: ${size} entries removed`);
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      Logger.debug(`Cache cleanup: ${cleaned} expired entries removed`);
    }

    return cleaned;
  }

  // Get cache statistics
  getStats(): {
    size: number;
    entries: Array<{ key: string; age: number; ttl: number; expired: boolean }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl,
      expired: now - entry.timestamp > entry.ttl,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}

// Create singleton instances for different cache types
export const apiCache = new Cache();
export const imageCache = new Cache();
export const userProfileCache = new Cache();

// Set different TTLs for different cache types
imageCache.set('default', null, 60 * 60 * 1000); // 1 hour for images
userProfileCache.set('default', null, 30 * 60 * 1000); // 30 minutes for profiles

export default Cache;
