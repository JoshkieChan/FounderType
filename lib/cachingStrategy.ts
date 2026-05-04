// Comprehensive caching strategy for scaling

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize?: number; // Maximum number of items
  strategy: 'lru' | 'fifo' | 'lfu';
}

export interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class MemoryCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private maxSize: number;
  private strategy: 'lru' | 'fifo' | 'lfu';

  constructor(config: CacheConfig) {
    this.maxSize = config.maxSize || 1000;
    this.strategy = config.strategy;
  }

  set(key: string, value: T, ttl: number = 300): void {
    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, item);
  }

  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();

    return item.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictOldest(): void {
    let keyToDelete: string | null = null;

    switch (this.strategy) {
      case 'lru':
        keyToDelete = this.getLRUKey();
        break;
      case 'fifo':
        keyToDelete = this.getFIFOKey();
        break;
      case 'lfu':
        keyToDelete = this.getLFUKey();
        break;
    }

    if (keyToDelete) {
      this.cache.delete(keyToDelete);
    }
  }

  private getLRUKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private getFIFOKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private getLFUKey(): string | null {
    let leastUsedKey: string | null = null;
    let leastCount = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < leastCount) {
        leastCount = item.accessCount;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsage: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses
      memoryUsage: 0, // Would need to calculate actual memory usage
    };
  }
}

// Cache manager for different types of data
export class CacheManager {
  private static instance: CacheManager;
  private caches: Map<string, MemoryCache<any>> = new Map();

  private constructor() {
    this.initializeCaches();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private initializeCaches(): void {
    // User profiles cache
    this.caches.set(
      'profiles',
      new MemoryCache({
        ttl: 1800, // 30 minutes
        maxSize: 10000,
        strategy: 'lru',
      })
    );

    // Commitments cache
    this.caches.set(
      'commitments',
      new MemoryCache({
        ttl: 600, // 10 minutes
        maxSize: 50000,
        strategy: 'lru',
      })
    );

    // Feed data cache
    this.caches.set(
      'feed',
      new MemoryCache({
        ttl: 300, // 5 minutes
        maxSize: 1000,
        strategy: 'lru',
      })
    );

    // API responses cache
    this.caches.set(
      'api',
      new MemoryCache({
        ttl: 60, // 1 minute
        maxSize: 5000,
        strategy: 'fifo',
      })
    );

    // Gemini AI responses cache
    this.caches.set(
      'gemini',
      new MemoryCache({
        ttl: 3600, // 1 hour
        maxSize: 1000,
        strategy: 'lfu',
      })
    );
  }

  get<T>(cacheName: string, key: string): T | null {
    const cache = this.caches.get(cacheName);
    return cache ? cache.get(key) : null;
  }

  set<T>(cacheName: string, key: string, value: T, ttl?: number): void {
    const cache = this.caches.get(cacheName);
    if (cache) {
      cache.set(key, value, ttl);
    }
  }

  delete(cacheName: string, key: string): boolean {
    const cache = this.caches.get(cacheName);
    return cache ? cache.delete(key) : false;
  }

  clear(cacheName?: string): void {
    if (cacheName) {
      const cache = this.caches.get(cacheName);
      if (cache) {
        cache.clear();
      }
    } else {
      this.caches.forEach((cache) => cache.clear());
    }
  }

  getStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }

    return stats;
  }
}

// Cache keys generator
export class CacheKeys {
  static userProfile(userId: string): string {
    return `profile:${userId}`;
  }

  static userCommitments(userId: string): string {
    return `commitments:${userId}`;
  }

  static commitment(commitmentId: string): string {
    return `commitment:${commitmentId}`;
  }

  static feed(page: number, filters?: string): string {
    const filterStr = filters ? `:${filters}` : '';
    return `feed:${page}${filterStr}`;
  }

  static geminiResponse(inputHash: string): string {
    return `gemini:${inputHash}`;
  }

  static apiResponse(endpoint: string, params?: string): string {
    const paramStr = params ? `:${params}` : '';
    return `api:${endpoint}${paramStr}`;
  }
}

// Cache warming strategies
export class CacheWarmer {
  private cacheManager: CacheManager;

  constructor() {
    this.cacheManager = CacheManager.getInstance();
  }

  // Pre-warm user profiles for active users
  async warmUserProfiles(userIds: string[]): Promise<void> {
    // Implementation would fetch profiles and cache them
    console.log('Warming user profiles for', userIds.length, 'users');
  }

  // Pre-warm feed data
  async warmFeedData(pages: number = 5): Promise<void> {
    // Implementation would pre-fetch feed pages
    console.log('Warming feed data for', pages, 'pages');
  }

  // Pre-warm popular commitments
  async warmPopularCommitments(): Promise<void> {
    // Implementation would fetch and cache popular commitments
    console.log('Warming popular commitments');
  }
}

// Cache invalidation strategies
export class CacheInvalidator {
  private cacheManager: CacheManager;

  constructor() {
    this.cacheManager = CacheManager.getInstance();
  }

  // Invalidate user-related caches
  invalidateUser(userId: string): void {
    this.cacheManager.delete('profiles', CacheKeys.userProfile(userId));
    this.cacheManager.delete('commitments', CacheKeys.userCommitments(userId));

    // Invalidate feed pages that might contain this user's commitments
    for (let i = 1; i <= 10; i++) {
      this.cacheManager.delete('feed', CacheKeys.feed(i));
    }
  }

  // Invalidate commitment-related caches
  invalidateCommitment(commitmentId: string): void {
    this.cacheManager.delete('commitments', CacheKeys.commitment(commitmentId));

    // Invalidate feed pages
    for (let i = 1; i <= 10; i++) {
      this.cacheManager.delete('feed', CacheKeys.feed(i));
    }
  }

  // Invalidate all feed caches
  invalidateFeed(): void {
    this.cacheManager.clear('feed');
  }

  // Invalidate API cache
  invalidateApi(endpoint?: string): void {
    if (endpoint) {
      // Would need to track keys to invalidate specific endpoint
      this.cacheManager.clear('api');
    } else {
      this.cacheManager.clear('api');
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();
export const cacheWarmer = new CacheWarmer();
export const cacheInvalidator = new CacheInvalidator();
