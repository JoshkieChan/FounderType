// Enhanced Offline Mode for FounderType
// Comprehensive offline functionality with sync capabilities

export interface OfflineData {
  commitments: any[];
  userProgress: any;
  analytics: any;
  templates: any[];
  lastSync: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

export class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = navigator.onLine;
  private syncQueue: SyncQueueItem[] = [];
  private cache: Map<string, any> = new Map();
  private syncInProgress: boolean = false;

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  constructor() {
    this.initializeOfflineMode();
    this.setupEventListeners();
    this.loadCachedData();
  }

  // Initialize offline mode
  private initializeOfflineMode(): void {
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker();
    }

    // Initialize IndexedDB for offline storage
    this.initializeIndexedDB();
  }

  // Setup event listeners
  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for page visibility changes
    document.addEventListener(
      'visibilitychange',
      this.handleVisibilityChange.bind(this)
    );
  }

  // Handle online event
  private handleOnline(): void {
    this.isOnline = true;
    console.log('App is online');
    this.startSync();
    this.notifyUser('Connection restored. Syncing data...');
  }

  // Handle offline event
  private handleOffline(): void {
    this.isOnline = false;
    console.log('App is offline');
    this.notifyUser("You're offline. Changes will be saved locally.");
  }

  // Handle visibility change
  private handleVisibilityChange(): void {
    if (!document.hidden && this.isOnline) {
      this.startSync();
    }
  }

  // Register service worker
  private async registerServiceWorker(): Promise<void> {
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1')
    ) {
      return;
    }

    try {
      const serviceWorkerResponse = await fetch('/sw.js', { method: 'HEAD' });
      const contentType =
        serviceWorkerResponse.headers.get('content-type') || '';
      if (!serviceWorkerResponse.ok || !contentType.includes('javascript')) {
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Initialize IndexedDB
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FounderTypeDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('commitments')) {
          db.createObjectStore('commitments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('userProgress')) {
          db.createObjectStore('userProgress', { keyPath: 'userId' });
        }
        if (!db.objectStoreNames.contains('analytics')) {
          db.createObjectStore('analytics', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('templates')) {
          db.createObjectStore('templates', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
      };
    });
  }

  // Load cached data
  private async loadCachedData(): Promise<void> {
    try {
      const cachedData = localStorage.getItem('foundertype_cache');
      if (cachedData) {
        const data = JSON.parse(cachedData);
        this.cache = new Map(Object.entries(data));
      }

      // Load sync queue
      const syncQueueData = localStorage.getItem('foundertype_sync_queue');
      if (syncQueueData) {
        this.syncQueue = JSON.parse(syncQueueData);
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
    }
  }

  // Save data to cache
  private saveToCache(): void {
    try {
      const cacheData = Object.fromEntries(this.cache);
      localStorage.setItem('foundertype_cache', JSON.stringify(cacheData));
      localStorage.setItem(
        'foundertype_sync_queue',
        JSON.stringify(this.syncQueue)
      );
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  // Get data with offline support
  async getData(key: string): Promise<any> {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Try to fetch from network if online
    if (this.isOnline) {
      try {
        const response = await fetch(`/api/${key}`);
        if (response.ok) {
          const data = await response.json();
          this.cache.set(key, data);
          this.saveToCache();
          return data;
        }
      } catch (error) {
        console.error('Network fetch failed:', error);
      }
    }

    // Try IndexedDB as fallback
    try {
      const data = await this.getFromIndexedDB(key);
      if (data) {
        return data;
      }
    } catch (error) {
      console.error('IndexedDB fetch failed:', error);
    }

    return null;
  }

  // Save data with offline support
  async saveData(key: string, data: any): Promise<void> {
    // Save to cache
    this.cache.set(key, data);
    this.saveToCache();

    // Save to IndexedDB
    try {
      await this.saveToIndexedDB(key, data);
    } catch (error) {
      console.error('IndexedDB save failed:', error);
    }

    // Queue for sync if offline
    if (!this.isOnline) {
      this.queueForSync(key, 'update', data);
    } else {
      // Try to sync immediately if online
      try {
        await this.syncToServer(key, data);
      } catch (error) {
        console.error('Server sync failed:', error);
        this.queueForSync(key, 'update', data);
      }
    }
  }

  // Queue item for sync
  private queueForSync(
    key: string,
    type: 'create' | 'update' | 'delete',
    data: any
  ): void {
    const queueItem: SyncQueueItem = {
      id: `${key}_${Date.now()}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.syncQueue.push(queueItem);
    this.saveToCache();
  }

  // Start sync process
  private async startSync(): Promise<void> {
    if (this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      while (this.syncQueue.length > 0) {
        const item = this.syncQueue[0];

        try {
          await this.processSyncItem(item);
          this.syncQueue.shift(); // Remove successful item
        } catch (error) {
          console.error('Sync item failed:', error);
          item.retries++;

          if (item.retries >= 3) {
            console.error('Max retries reached for item:', item.id);
            this.syncQueue.shift(); // Remove failed item after max retries
          } else {
            // Wait before retry
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * item.retries)
            );
          }
          break;
        }
      }
    } finally {
      this.syncInProgress = false;
      this.saveToCache();
    }
  }

  // Process individual sync item
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const { type, data } = item;

    switch (type) {
      case 'create':
        await this.createOnServer(data);
        break;
      case 'update':
        await this.updateOnServer(data);
        break;
      case 'delete':
        await this.deleteOnServer(data);
        break;
    }
  }

  // Create on server
  private async createOnServer(data: any): Promise<void> {
    const response = await fetch(`/api/${data.type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Create failed: ${response.statusText}`);
    }
  }

  // Update on server
  private async updateOnServer(data: any): Promise<void> {
    const response = await fetch(`/api/${data.type}/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Update failed: ${response.statusText}`);
    }
  }

  // Delete on server
  private async deleteOnServer(data: any): Promise<void> {
    const response = await fetch(`/api/${data.type}/${data.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
  }

  // Sync to server
  private async syncToServer(key: string, data: any): Promise<void> {
    const response = await fetch(`/api/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }

  // Get from IndexedDB
  private async getFromIndexedDB(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB is not initialized'));
        return;
      }

      const transaction = this.db.transaction([key], 'readonly');
      const store = transaction.objectStore(key);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Save to IndexedDB
  private async saveToIndexedDB(key: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB is not initialized'));
        return;
      }

      const transaction = this.db.transaction([key], 'readwrite');
      const store = transaction.objectStore(key);

      if (Array.isArray(data)) {
        data.forEach((item) => {
          store.put(item);
        });
      } else {
        store.put(data);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get offline status
  isOfflineMode(): boolean {
    return !this.isOnline;
  }

  // Get sync status
  getSyncStatus(): {
    isOnline: boolean;
    syncInProgress: boolean;
    queueLength: number;
    lastSync: number | null;
  } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      queueLength: this.syncQueue.length,
      lastSync: this.getLastSyncTime(),
    };
  }

  // Get last sync time
  private getLastSyncTime(): number | null {
    const lastSync = localStorage.getItem('foundertype_last_sync');
    return lastSync ? parseInt(lastSync) : null;
  }

  // Update last sync time
  private updateLastSyncTime(): void {
    localStorage.setItem('foundertype_last_sync', Date.now().toString());
  }

  // Force sync
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    await this.startSync();
    this.updateLastSyncTime();
    this.notifyUser('Sync completed successfully');
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    this.syncQueue = [];
    localStorage.removeItem('foundertype_cache');
    localStorage.removeItem('foundertype_sync_queue');
  }

  // Get cached data size
  getCacheSize(): number {
    const cacheData = JSON.stringify(Object.fromEntries(this.cache));
    const syncQueueData = JSON.stringify(this.syncQueue);
    return (cacheData.length + syncQueueData.length) / 1024; // Return size in KB
  }

  // Notify user
  private notifyUser(message: string): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = 'offline-notification';

    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#333',
      color: '#white',
      padding: '12px 20px',
      borderRadius: '8px',
      zIndex: '9999',
      fontSize: '14px',
      maxWidth: '300px',
    });

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Get offline analytics
  getOfflineAnalytics(): {
    totalCacheSize: number;
    syncQueueLength: number;
    isOnline: boolean;
    lastSyncTime: number | null;
    cacheHits: number;
    cacheMisses: number;
  } {
    return {
      totalCacheSize: this.getCacheSize(),
      syncQueueLength: this.syncQueue.length,
      isOnline: this.isOnline,
      lastSyncTime: this.getLastSyncTime(),
      cacheHits: 0, // Would need to implement tracking
      cacheMisses: 0, // Would need to implement tracking
    };
  }

  // Export offline data
  exportOfflineData(): string {
    const exportData = {
      cache: Object.fromEntries(this.cache),
      syncQueue: this.syncQueue,
      timestamp: Date.now(),
      version: '1.0.0',
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import offline data
  importOfflineData(data: string): void {
    try {
      const importData = JSON.parse(data);

      if (importData.cache) {
        this.cache = new Map(Object.entries(importData.cache));
      }

      if (importData.syncQueue) {
        this.syncQueue = importData.syncQueue;
      }

      this.saveToCache();
      this.notifyUser('Offline data imported successfully');
    } catch (error) {
      console.error('Failed to import offline data:', error);
      this.notifyUser('Failed to import offline data');
    }
  }

  private db: IDBDatabase | null = null;
}
