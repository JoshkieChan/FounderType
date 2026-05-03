import Logger from './logger';

interface OfflineQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data?: any;
  timestamp: number;
  retryCount: number;
}

class OfflineManager {
  private queue: OfflineQueueItem[] = [];
  private isOnline = true;
  private retryDelay = 5000; // 5 seconds
  private maxRetries = 3;

  constructor() {
    this.setupNetworkListener();
    this.loadQueue();
  }

  private setupNetworkListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        Logger.info('Network connection restored');
        this.processQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        Logger.warn('Network connection lost');
      });

      this.isOnline = navigator.onLine;
    }
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem('offlineQueue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      Logger.error('Failed to load offline queue:', error);
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem('offlineQueue', JSON.stringify(this.queue));
    } catch (error) {
      Logger.error('Failed to save offline queue:', error);
    }
  }

  public addToQueue(
    type: 'create' | 'update' | 'delete',
    endpoint: string,
    data?: any
  ): string {
    const item: OfflineQueueItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(item);
    this.saveQueue();

    if (this.isOnline) {
      this.processQueue();
    }

    Logger.info('Added to offline queue:', { type, endpoint, id: item.id });
    return item.id;
  }

  public async processQueue(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0) {
      return;
    }

    Logger.info('Processing offline queue:', { items: this.queue.length });

    const itemsToProcess = [...this.queue];
    this.queue = [];
    this.saveQueue();

    for (const item of itemsToProcess) {
      try {
        await this.processItem(item);
      } catch (error) {
        Logger.error('Failed to process queue item:', error);
        
        item.retryCount++;
        if (item.retryCount < this.maxRetries) {
          this.queue.push(item);
          Logger.info('Item queued for retry:', { id: item.id, retryCount: item.retryCount });
        } else {
          Logger.error('Max retries exceeded for item:', { id: item.id });
        }
      }
    }

    this.saveQueue();

    // If there are still items to retry, schedule another attempt
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), this.retryDelay);
    }
  }

  private async processItem(item: OfflineQueueItem): Promise<void> {
    const { type, endpoint, data } = item;

    switch (type) {
      case 'create':
        // Implementation would depend on your API client
        Logger.info('Creating item offline:', { endpoint, data });
        break;
      case 'update':
        Logger.info('Updating item offline:', { endpoint, data });
        break;
      case 'delete':
        Logger.info('Deleting item offline:', { endpoint });
        break;
    }
  }

  public getQueueStatus(): {
    isOnline: boolean;
    queueLength: number;
    pendingItems: OfflineQueueItem[];
  } {
    return {
      isOnline: this.isOnline,
      queueLength: this.queue.length,
      pendingItems: [...this.queue],
    };
  }

  public clearQueue(): void {
    this.queue = [];
    this.saveQueue();
    Logger.info('Offline queue cleared');
  }

  public isNetworkAvailable(): boolean {
    return this.isOnline;
  }
}

export const offlineManager = new OfflineManager();

export default OfflineManager;
