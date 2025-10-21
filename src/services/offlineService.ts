interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt?: number;
  version?: string;
}

interface OfflineConfig {
  dbName: string;
  version: number;
  stores: string[];
}

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineService {
  private db: IDBDatabase | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncQueue: SyncOperation[] = [];
  private config: OfflineConfig = {
    dbName: 'mon-toit-offline',
    version: 1,
    stores: ['properties', 'favorites', 'messages', 'applications', 'sync-queue']
  };

  constructor() {
    this.initializeEventListeners();
  }

  async initialize(): Promise<boolean> {
    try {
      await this.initDatabase();
      await this.loadSyncQueue();
      return true;
    } catch (error) {
      console.error('Failed to initialize offline service:', error);
      return false;
    }
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        this.config.stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });

            // Add indexes for common queries
            if (storeName === 'properties') {
              store.createIndex('owner_id', 'owner_id', { unique: false });
              store.createIndex('status', 'status', { unique: false });
              store.createIndex('created_at', 'created_at', { unique: false });
            } else if (storeName === 'favorites') {
              store.createIndex('user_id', 'user_id', { unique: false });
              store.createIndex('property_id', 'property_id', { unique: false });
            } else if (storeName === 'messages') {
              store.createIndex('sender_id', 'sender_id', { unique: false });
              store.createIndex('receiver_id', 'receiver_id', { unique: false });
              store.createIndex('property_id', 'property_id', { unique: false });
            } else if (storeName === 'applications') {
              store.createIndex('property_id', 'property_id', { unique: false });
              store.createIndex('tenant_id', 'tenant_id', { unique: false });
              store.createIndex('status', 'status', { unique: false });
            } else if (storeName === 'sync-queue') {
              store.createIndex('timestamp', 'timestamp', { unique: false });
              store.createIndex('type', 'type', { unique: false });
            }
          }
        });
      };
    });
  }

  private initializeEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Cache management
  async cacheData(storeName: string, data: any, expiresAt?: number): Promise<void> {
    if (!this.db) return;

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt,
      version: '1.0'
    };

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put({ id: data.id, ...entry });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedData(storeName: string, id: string): Promise<any | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if expired
        if (result.expiresAt && Date.now() > result.expiresAt) {
          this.removeCachedData(storeName, id);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCachedData(storeName: string): Promise<any[]> {
    if (!this.db) return [];

    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result || [];
        const validData = results
          .filter(item => !item.expiresAt || Date.now() <= item.expiresAt)
          .map(item => item.data);
        resolve(validData);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removeCachedData(storeName: string, id: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue management
  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return;

    try {
      const operations = await this.getAllCachedData('sync-queue');
      this.syncQueue = operations.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private async saveSyncQueue(): Promise<void> {
    if (!this.db) return;

    try {
      // Clear existing queue
      const transaction = this.db.transaction(['sync-queue'], 'readwrite');
      const store = transaction.objectStore('sync-queue');
      await store.clear();

      // Save updated queue
      for (const operation of this.syncQueue) {
        await this.cacheData('sync-queue', operation);
      }
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  async addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const syncOperation: SyncOperation = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
      ...operation
    };

    this.syncQueue.push(syncOperation);
    await this.saveSyncQueue();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingOperations();
    }
  }

  private async syncPendingOperations(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const operations = [...this.syncQueue];
    const failedOperations: SyncOperation[] = [];

    for (const operation of operations) {
      try {
        await this.syncOperation(operation);
        // Remove successful operation from queue
        this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);

        // Increment retries and add back to queue if under limit
        operation.retries++;
        if (operation.retries < 3) {
          failedOperations.push(operation);
        }
      }
    }

    // Update queue with failed operations
    this.syncQueue = failedOperations;
    await this.saveSyncQueue();
  }

  private async syncOperation(operation: SyncOperation): Promise<void> {
    const response = await fetch(operation.endpoint, {
      method: operation.type === 'create' ? 'POST' :
                operation.type === 'update' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      },
      body: operation.type !== 'delete' ? JSON.stringify(operation.data) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Update local cache with server response
    if (operation.type !== 'delete' && response.ok) {
      const responseData = await response.json();
      const storeName = this.getStoreNameFromEndpoint(operation.endpoint);
      if (storeName) {
        await this.cacheData(storeName, responseData);
      }
    }
  }

  private getStoreNameFromEndpoint(endpoint: string): string | null {
    if (endpoint.includes('/properties')) return 'properties';
    if (endpoint.includes('/favorites')) return 'favorites';
    if (endpoint.includes('/messages')) return 'messages';
    if (endpoint.includes('/applications')) return 'applications';
    return null;
  }

  // Offline CRUD operations
  async createOfflineRecord(storeName: string, data: any, endpoint: string): Promise<void> {
    // Add to local cache
    await this.cacheData(storeName, data);

    // Add to sync queue
    await this.addToSyncQueue({
      type: 'create',
      endpoint,
      data
    });
  }

  async updateOfflineRecord(storeName: string, id: string, updates: any, endpoint: string): Promise<void> {
    // Update local cache
    const existingData = await this.getCachedData(storeName, id);
    if (existingData) {
      const updatedData = { ...existingData, ...updates };
      await this.cacheData(storeName, updatedData);

      // Add to sync queue
      await this.addToSyncQueue({
        type: 'update',
        endpoint,
        data: { id, ...updates }
      });
    }
  }

  async deleteOfflineRecord(storeName: string, id: string, endpoint: string): Promise<void> {
    // Remove from local cache
    await this.removeCachedData(storeName, id);

    // Add to sync queue
    await this.addToSyncQueue({
      type: 'delete',
      endpoint,
      data: { id }
    });
  }

  // Status and utilities
  get isOnlineStatus(): boolean {
    return this.isOnline;
  }

  get pendingSyncOperations(): SyncOperation[] {
    return [...this.syncQueue];
  }

  get cacheSize(): Promise<{ [storeName: string]: number }> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve({});
        return;
      }

      const results: [storeName: string]: number = {};
      let completedStores = 0;

      this.config.stores.forEach(storeName => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();

        request.onsuccess = () => {
          results[storeName] = request.result;
          completedStores++;
          if (completedStores === this.config.stores.length) {
            resolve(results);
          }
        };
      });
    });
  }

  async clearCache(storeName?: string): Promise<void> {
    if (!this.db) return;

    const stores = storeName ? [storeName] : this.config.stores;
    const transaction = this.db.transaction(stores, 'readwrite');

    for (const store of stores) {
      const objectStore = transaction.objectStore(store);
      await objectStore.clear();
    }
  }

  // Preload critical data
  async preloadCriticalData(userId: string): Promise<void> {
    if (!this.isOnline) return;

    try {
      // Preload user's properties
      const propertiesResponse = await fetch(`/api/properties?owner_id=${userId}`);
      if (propertiesResponse.ok) {
        const properties = await propertiesResponse.json();
        await Promise.all(
          properties.map((property: any) =>
            this.cacheData('properties', property, Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          )
        );
      }

      // Preload user's favorites
      const favoritesResponse = await fetch(`/api/favorites?user_id=${userId}`);
      if (favoritesResponse.ok) {
        const favorites = await favoritesResponse.json();
        await this.cacheData('favorites', favorites, Date.now() + 60 * 60 * 1000); // 1 hour
      }

      // Preload recent messages
      const messagesResponse = await fetch(`/api/messages?user_id=${userId}&limit=50`);
      if (messagesResponse.ok) {
        const messages = await messagesResponse.json();
        await this.cacheData('messages', messages, Date.now() + 30 * 60 * 1000); // 30 minutes
      }

    } catch (error) {
      console.error('Failed to preload critical data:', error);
    }
  }
}

// React hook for offline functionality
export const useOfflineService = () => {
  const [service, setService] = useState<OfflineService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState(0);

  useEffect(() => {
    const offlineService = new OfflineService();
    setService(offlineService);

    offlineService.initialize().then((success) => {
      setIsInitialized(success);
    });

    // Update online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (service) {
      const pending = service.pendingSyncOperations;
      setPendingOperations(pending.length);
    }
  }, [service]);

  const createOfflineRecord = async (storeName: string, data: any, endpoint: string) => {
    if (!service) return;
    await service.createOfflineRecord(storeName, data, endpoint);
  };

  const updateOfflineRecord = async (storeName: string, id: string, updates: any, endpoint: string) => {
    if (!service) return;
    await service.updateOfflineRecord(storeName, id, updates, endpoint);
  };

  const deleteOfflineRecord = async (storeName: string, id: string, endpoint: string) => {
    if (!service) return;
    await service.deleteOfflineRecord(storeName, id, endpoint);
  };

  const getCachedData = async (storeName: string, id: string) => {
    if (!service) return null;
    return await service.getCachedData(storeName, id);
  };

  const getAllCachedData = async (storeName: string) => {
    if (!service) return [];
    return await service.getAllCachedData(storeName);
  };

  const preloadCriticalData = async (userId: string) => {
    if (!service) return;
    await service.preloadCriticalData(userId);
  };

  return {
    isInitialized,
    isOnline,
    pendingOperations,
    createOfflineRecord,
    updateOfflineRecord,
    deleteOfflineRecord,
    getCachedData,
    getAllCachedData,
    preloadCriticalData
  };
};

export default OfflineService;