/**
 * NaaS Pricing Calculator - Storage Manager
 * Migrates from localStorage to IndexedDB for scalable history tracking
 */

class StorageManager {
    constructor() {
        this.dbName = 'NaaSCalculatorDB';
        this.dbVersion = 2;
        this.db = null;
        this.isIndexedDBSupported = this.checkIndexedDBSupport();
        this.maxLocalStorageEntries = 10; // Fallback limit for localStorage

        // Store names
        this.stores = {
            quotes: 'quotes',
            components: 'components',
            history: 'history',
            settings: 'settings'
        };

        // Concurrency control
        this.operationQueue = [];
        this.isProcessingQueue = false;
        this.maxConcurrentOperations = 3;
        this.activeOperations = new Set();

        // Error tracking
        this.errorCount = 0;
        this.lastError = null;

        // Connection state
        this.connectionState = 'disconnected';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
    }

    /**
     * Check if IndexedDB is supported with vendor prefixes
     */
    checkIndexedDBSupport() {
        if (typeof window === 'undefined') return false;

        // Check for standard and vendor-prefixed versions
        window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;

        return window.indexedDB !== null && window.indexedDB !== undefined;
    }

    /**
     * Concurrency control - queue operations to prevent conflicts
     */
    async queueOperation(operation) {
        return new Promise((resolve, reject) => {
            const queueItem = {
                operation,
                resolve,
                reject,
                timestamp: Date.now()
            };

            this.operationQueue.push(queueItem);
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessingQueue || this.operationQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.operationQueue.length > 0 && this.activeOperations.size < this.maxConcurrentOperations) {
            const queueItem = this.operationQueue.shift();
            const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            this.activeOperations.add(operationId);

            // Execute operation
            queueItem.operation()
                .then(result => {
                    queueItem.resolve(result);
                })
                .catch(error => {
                    queueItem.reject(error);
                })
                .finally(() => {
                    this.activeOperations.delete(operationId);
                    // Continue processing queue
                    setTimeout(() => this.processQueue(), 0);
                });
        }

        this.isProcessingQueue = false;
    }

    /**
     * Enhanced error handling for transactions
     */
    handleTransactionError(operation, error) {
        this.errorCount++;
        this.lastError = {
            operation,
            error: error?.message || error,
            timestamp: new Date().toISOString(),
            connectionState: this.connectionState
        };

        console.error(`StorageManager: ${operation}:`, error);

        // Check if we need to attempt reconnection
        if (error?.name === 'InvalidStateError' || error?.name === 'TransactionInactiveError') {
            this.connectionState = 'error';
            this.attemptReconnection();
        }
    }

    /**
     * Attempt to reconnect to IndexedDB
     */
    async attemptReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('StorageManager: Maximum reconnection attempts reached');
            return false;
        }

        this.reconnectAttempts++;
        console.log(`StorageManager: Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        try {
            // Close existing connection
            if (this.db) {
                this.db.close();
                this.db = null;
            }

            // Wait before attempting reconnection
            await new Promise(resolve => setTimeout(resolve, 1000 * this.reconnectAttempts));

            // Reinitialize
            const success = await this.initIndexedDB();
            if (success) {
                this.connectionState = 'connected';
                this.reconnectAttempts = 0;
                console.log('StorageManager: Reconnection successful');
                return true;
            }
        } catch (error) {
            console.error('StorageManager: Reconnection failed:', error);
        }

        return false;
    }

    /**
     * Initialize the storage system
     */
    async initialize() {
        if (this.isIndexedDBSupported) {
            try {
                await this.initIndexedDB();
                console.log('StorageManager: IndexedDB initialized successfully');

                // Migrate existing localStorage data
                await this.migrateFromLocalStorage();
                return true;
            } catch (error) {
                console.error('StorageManager: Failed to initialize IndexedDB, falling back to localStorage', error);
                this.isIndexedDBSupported = false;
            }
        }

        console.log('StorageManager: Using localStorage fallback');
        return false;
    }

    /**
     * Initialize IndexedDB with object stores
     */
    initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error(`Failed to open IndexedDB: ${request.error}`));
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.connectionState = 'connected';
                this.reconnectAttempts = 0;

                // Enhanced connection event handling
                this.db.onversionchange = () => {
                    console.warn('IndexedDB version changed, closing connection');
                    this.connectionState = 'version_change';
                    this.db.close();
                    // Notify user to refresh
                    if (typeof window !== 'undefined' && window.dispatchEvent) {
                        window.dispatchEvent(new CustomEvent('indexeddb-version-change', {
                            detail: { message: 'Database version changed, please refresh the page' }
                        }));
                    }
                };

                this.db.onclose = (event) => {
                    console.warn('IndexedDB connection closed unexpectedly:', event);
                    this.connectionState = 'disconnected';
                    // Attempt automatic reconnection
                    setTimeout(() => {
                        this.attemptReconnection();
                    }, 1000);
                };

                // Handle blocked connections
                this.db.onblocked = (event) => {
                    console.warn('IndexedDB connection blocked:', event);
                    this.connectionState = 'blocked';
                };

                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Quotes store - for complete quotes
                if (!db.objectStoreNames.contains(this.stores.quotes)) {
                    const quotesStore = db.createObjectStore(this.stores.quotes, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    quotesStore.createIndex('timestamp', 'timestamp', { unique: false });
                    quotesStore.createIndex('customerName', 'customerName', { unique: false });
                    quotesStore.createIndex('projectName', 'projectName', { unique: false });
                }

                // Components store - for individual component calculations
                if (!db.objectStoreNames.contains(this.stores.components)) {
                    const componentsStore = db.createObjectStore(this.stores.components, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    componentsStore.createIndex('componentType', 'componentType', { unique: false });
                    componentsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // History store - for calculation history and analytics
                if (!db.objectStoreNames.contains(this.stores.history)) {
                    const historyStore = db.createObjectStore(this.stores.history, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    historyStore.createIndex('type', 'type', { unique: false });
                    historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                    historyStore.createIndex('sessionId', 'sessionId', { unique: false });
                }

                // Settings store - for user preferences
                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    db.createObjectStore(this.stores.settings, {
                        keyPath: 'key'
                    });
                }
            };
        });
    }

    /**
     * Migrate existing data from localStorage to IndexedDB
     */
    async migrateFromLocalStorage() {
        try {
            // Migrate saved components
            const savedComponents = localStorage.getItem('naas_saved_components');
            if (savedComponents) {
                const components = JSON.parse(savedComponents);
                for (const [key, data] of Object.entries(components)) {
                    await this.saveComponent({
                        componentType: data.componentType || 'unknown',
                        name: data.name,
                        params: data.params || {},
                        result: data.result,
                        timestamp: data.timestamp || new Date().toISOString(),
                        migrated: true
                    });
                }
                console.log(`Migrated ${Object.keys(components).length} components from localStorage`);
            }

            // Migrate saved quotes
            const savedQuotes = localStorage.getItem('naas_full_quote');
            if (savedQuotes) {
                const quote = JSON.parse(savedQuotes);
                await this.saveQuote({
                    projectName: quote.project?.projectName || 'Migrated Quote',
                    customerName: quote.project?.customerName || 'Unknown Customer',
                    components: quote.components || {},
                    project: quote.project || {},
                    timestamp: new Date().toISOString(),
                    migrated: true
                });
                console.log('Migrated full quote from localStorage');
            }

            // Store migration flag
            await this.setSetting('migrationCompleted', {
                completed: true,
                timestamp: new Date().toISOString(),
                version: this.dbVersion
            });

        } catch (error) {
            console.error('Error during localStorage migration:', error);
        }
    }

    /**
     * Save a complete quote
     */
    async saveQuote(quoteData) {
        const quote = {
            ...quoteData,
            timestamp: quoteData.timestamp || new Date().toISOString(),
            version: this.dbVersion
        };

        if (this.isIndexedDBSupported && this.db) {
            return this.saveToIndexedDB(this.stores.quotes, quote);
        } else {
            return this.saveQuoteToLocalStorage(quote);
        }
    }

    /**
     * Save component calculation result
     */
    async saveComponent(componentData) {
        const component = {
            ...componentData,
            timestamp: componentData.timestamp || new Date().toISOString(),
            sessionId: this.getSessionId(),
            version: this.dbVersion
        };

        if (this.isIndexedDBSupported && this.db) {
            return this.saveToIndexedDB(this.stores.components, component);
        } else {
            return this.saveComponentToLocalStorage(component);
        }
    }

    /**
     * Save history entry
     */
    async saveHistory(historyData) {
        const history = {
            ...historyData,
            timestamp: historyData.timestamp || new Date().toISOString(),
            sessionId: this.getSessionId(),
            version: this.dbVersion
        };

        if (this.isIndexedDBSupported && this.db) {
            return this.saveToIndexedDB(this.stores.history, history);
        } else {
            // Skip history in localStorage due to size constraints
            return null;
        }
    }

    /**
     * Save setting
     */
    async setSetting(key, value) {
        const setting = {
            key,
            value,
            timestamp: new Date().toISOString()
        };

        if (this.isIndexedDBSupported && this.db) {
            return this.saveToIndexedDB(this.stores.settings, setting);
        } else {
            localStorage.setItem(`naas_setting_${key}`, JSON.stringify(setting));
            return setting;
        }
    }

    /**
     * Get setting
     */
    async getSetting(key) {
        if (this.isIndexedDBSupported && this.db) {
            return this.getFromIndexedDB(this.stores.settings, key);
        } else {
            const stored = localStorage.getItem(`naas_setting_${key}`);
            return stored ? JSON.parse(stored).value : null;
        }
    }

    /**
     * Get quotes with optional filtering
     */
    async getQuotes(options = {}) {
        const { limit = 50, customerName, projectName, startDate, endDate } = options;

        if (this.isIndexedDBSupported && this.db) {
            return this.getQuotesFromIndexedDB({ limit, customerName, projectName, startDate, endDate });
        } else {
            return this.getQuotesFromLocalStorage(limit);
        }
    }

    /**
     * Get components with optional filtering
     */
    async getComponents(options = {}) {
        const { limit = 100, componentType, startDate, endDate } = options;

        if (this.isIndexedDBSupported && this.db) {
            return this.getComponentsFromIndexedDB({ limit, componentType, startDate, endDate });
        } else {
            return this.getComponentsFromLocalStorage(limit);
        }
    }

    /**
     * Get history entries
     */
    async getHistory(options = {}) {
        const { limit = 200, type, sessionId, startDate, endDate } = options;

        if (this.isIndexedDBSupported && this.db) {
            return this.getHistoryFromIndexedDB({ limit, type, sessionId, startDate, endDate });
        } else {
            return []; // No history in localStorage
        }
    }

    /**
     * Delete old entries to manage storage size
     */
    async cleanup(options = {}) {
        const {
            quotesKeepDays = 90,
            componentsKeepDays = 30,
            historyKeepDays = 14
        } = options;

        const cutoffDates = {
            quotes: new Date(Date.now() - quotesKeepDays * 24 * 60 * 60 * 1000),
            components: new Date(Date.now() - componentsKeepDays * 24 * 60 * 60 * 1000),
            history: new Date(Date.now() - historyKeepDays * 24 * 60 * 60 * 1000)
        };

        if (this.isIndexedDBSupported && this.db) {
            const results = {};
            for (const [store, cutoff] of Object.entries(cutoffDates)) {
                results[store] = await this.deleteOldEntries(this.stores[store], cutoff);
            }
            return results;
        } else {
            // Clean up localStorage
            this.cleanupLocalStorage();
            return { localStorage: 'cleaned' };
        }
    }

    /**
     * Enhanced IndexedDB helper methods with better error handling and concurrency control
     */
    async saveToIndexedDB(storeName, data) {
        return this.queueOperation(async () => {
            if (!this.db || this.connectionState !== 'connected') {
                throw new Error('Database not available');
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');

                // Add comprehensive transaction error handling
                transaction.onerror = (event) => {
                    const error = event.target.error;

                    // Handle quota exceeded errors at transaction level
                    if (error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                        this.handleQuotaExceeded(storeName, data)
                            .then(resolve)
                            .catch(reject);
                        return;
                    }

                    this.handleTransactionError('Transaction failed during save', error);
                    reject(new Error(`Transaction failed for ${storeName}: ${error?.message || 'Unknown error'}`));
                };

                transaction.onabort = (event) => {
                    const error = event.target.error;

                    // Handle quota exceeded errors at abort level
                    if (error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                        this.handleQuotaExceeded(storeName, data)
                            .then(resolve)
                            .catch(reject);
                        return;
                    }

                    this.handleTransactionError('Transaction aborted during save', error);
                    reject(new Error(`Transaction aborted for ${storeName}: ${error?.message || 'Aborted'}`));
                };

                transaction.oncomplete = () => {
                    // Transaction completed successfully
                };

                try {
                    const store = transaction.objectStore(storeName);
                    const request = store.add(data);

                    request.onsuccess = () => {
                        resolve({ id: request.result, ...data });
                    };

                    request.onerror = () => {
                        const error = request.error;

                        // Handle quota exceeded errors specifically
                        if (error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                            this.handleQuotaExceeded(storeName, data)
                                .then(resolve)
                                .catch(reject);
                            return;
                        }

                        this.handleTransactionError('Save request failed', error);
                        reject(new Error(`Failed to save to ${storeName}: ${error?.message || 'Save failed'}`));
                    };
                } catch (error) {
                    this.handleTransactionError('Exception during save operation', error);
                    reject(error);
                }
            });
        });
    }

    async getFromIndexedDB(storeName, key) {
        return this.queueOperation(async () => {
            if (!this.db || this.connectionState !== 'connected') {
                throw new Error('Database not available');
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readonly');

                transaction.onerror = (event) => {
                    this.handleTransactionError('Transaction failed during get', event.target.error);
                    reject(new Error(`Transaction failed for ${storeName}: ${event.target.error?.message || 'Unknown error'}`));
                };

                transaction.onabort = (event) => {
                    this.handleTransactionError('Transaction aborted during get', event.target.error);
                    reject(new Error(`Transaction aborted for ${storeName}: ${event.target.error?.message || 'Aborted'}`));
                };

                try {
                    const store = transaction.objectStore(storeName);
                    const request = store.get(key);

                    request.onsuccess = () => {
                        resolve(request.result);
                    };

                    request.onerror = () => {
                        this.handleTransactionError('Get request failed', request.error);
                        reject(new Error(`Failed to get from ${storeName}: ${request.error?.message || 'Get failed'}`));
                    };
                } catch (error) {
                    this.handleTransactionError('Exception during get operation', error);
                    reject(error);
                }
            });
        });
    }

    getQuotesFromIndexedDB(options) {
        return this.queueOperation(async () => {
            if (!this.db || this.connectionState !== 'connected') {
                throw new Error('Database not available');
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.stores.quotes], 'readonly');

                transaction.onerror = (event) => {
                    this.handleTransactionError('Transaction failed during quote retrieval', event.target.error);
                    reject(new Error(`Transaction failed: ${event.target.error?.message || 'Unknown error'}`));
                };

                try {
                    const store = transaction.objectStore(this.stores.quotes);
                    const index = store.index('timestamp');
                    const request = index.openCursor(null, 'prev');

                    const results = [];
                    let count = 0;

                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor && count < options.limit) {
                            const quote = cursor.value;

                            // Apply filters with null safety
                            let include = true;
                            if (options.customerName && !quote.customerName?.toLowerCase().includes(options.customerName.toLowerCase())) {
                                include = false;
                            }
                            if (options.projectName && !quote.projectName?.toLowerCase().includes(options.projectName.toLowerCase())) {
                                include = false;
                            }
                            if (options.startDate && quote.timestamp < options.startDate) {
                                include = false;
                            }
                            if (options.endDate && quote.timestamp > options.endDate) {
                                include = false;
                            }

                            if (include) {
                                results.push(quote);
                                count++;
                            }

                            cursor.continue();
                        } else {
                            resolve(results);
                        }
                    };

                    request.onerror = () => {
                        this.handleTransactionError('Quote retrieval cursor failed', request.error);
                        reject(new Error(`Failed to get quotes: ${request.error?.message || 'Cursor failed'}`));
                    };
                } catch (error) {
                    this.handleTransactionError('Exception during quote retrieval', error);
                    reject(error);
                }
            });
        });
    }

    async deleteOldEntries(storeName, cutoffDate) {
        return this.queueOperation(async () => {
            if (!this.db || this.connectionState !== 'connected') {
                throw new Error('Database not available');
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');

                transaction.onerror = (event) => {
                    this.handleTransactionError('Transaction failed during cleanup', event.target.error);
                    reject(new Error(`Cleanup transaction failed: ${event.target.error?.message || 'Unknown error'}`));
                };

                try {
                    const store = transaction.objectStore(storeName);
                    const index = store.index('timestamp');
                    const range = IDBKeyRange.upperBound(cutoffDate.toISOString());
                    const request = index.openCursor(range);

                    let deletedCount = 0;

                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            try {
                                cursor.delete();
                                deletedCount++;
                                cursor.continue();
                            } catch (error) {
                                this.handleTransactionError('Failed to delete entry during cleanup', error);
                                reject(error);
                            }
                        } else {
                            resolve(deletedCount);
                        }
                    };

                    request.onerror = () => {
                        this.handleTransactionError('Cleanup cursor failed', request.error);
                        reject(new Error(`Failed to delete old entries: ${request.error?.message || 'Cursor failed'}`));
                    };
                } catch (error) {
                    this.handleTransactionError('Exception during cleanup operation', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * localStorage fallback methods
     */
    saveQuoteToLocalStorage(quote) {
        try {
            const quotes = this.getQuotesFromLocalStorage(this.maxLocalStorageEntries - 1);
            quotes.unshift(quote);
            localStorage.setItem('naas_quotes_list', JSON.stringify(quotes));
            return quote;
        } catch (error) {
            console.error('Failed to save quote to localStorage:', error);
            return null;
        }
    }

    saveComponentToLocalStorage(component) {
        try {
            const components = this.getComponentsFromLocalStorage(this.maxLocalStorageEntries - 1);
            components.unshift(component);
            localStorage.setItem('naas_components_list', JSON.stringify(components));
            return component;
        } catch (error) {
            console.error('Failed to save component to localStorage:', error);
            return null;
        }
    }

    getQuotesFromLocalStorage(limit) {
        try {
            const stored = localStorage.getItem('naas_quotes_list');
            const quotes = stored ? JSON.parse(stored) : [];
            return quotes.slice(0, limit);
        } catch (error) {
            console.error('Failed to get quotes from localStorage:', error);
            return [];
        }
    }

    getComponentsFromLocalStorage(limit) {
        try {
            const stored = localStorage.getItem('naas_components_list');
            const components = stored ? JSON.parse(stored) : [];
            return components.slice(0, limit);
        } catch (error) {
            console.error('Failed to get components from localStorage:', error);
            return [];
        }
    }

    cleanupLocalStorage() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('naas_') &&
                !['naas_quotes_list', 'naas_components_list'].includes(key)) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Utility methods
     */
    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return this.sessionId;
    }

    async getStorageStats() {
        if (this.isIndexedDBSupported && this.db) {
            const stats = {};
            for (const storeName of Object.values(this.stores)) {
                try {
                    const count = await this.getStoreCount(storeName);
                    stats[storeName] = count;
                } catch (error) {
                    stats[storeName] = 'error';
                }
            }
            return stats;
        } else {
            return {
                localStorage: {
                    used: this.getLocalStorageSize(),
                    quotesCount: this.getQuotesFromLocalStorage(1000).length,
                    componentsCount: this.getComponentsFromLocalStorage(1000).length
                }
            };
        }
    }

    async getStoreCount(storeName) {
        return this.queueOperation(async () => {
            if (!this.db || this.connectionState !== 'connected') {
                throw new Error('Database not available');
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readonly');

                transaction.onerror = (event) => {
                    this.handleTransactionError('Transaction failed during count', event.target.error);
                    reject(new Error(`Count transaction failed: ${event.target.error?.message || 'Unknown error'}`));
                };

                try {
                    const store = transaction.objectStore(storeName);
                    const request = store.count();

                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => {
                        this.handleTransactionError('Count request failed', request.error);
                        reject(new Error(`Failed to count ${storeName}: ${request.error?.message || 'Count failed'}`));
                    };
                } catch (error) {
                    this.handleTransactionError('Exception during count operation', error);
                    reject(error);
                }
            });
        });
    }

    getLocalStorageSize() {
        let total = 0;
        for (const key in localStorage) {
            if (key.startsWith('naas_')) {
                total += localStorage[key].length;
            }
        }
        return `${Math.round(total / 1024)}KB`;
    }

    /**
     * Enhanced connection management and cleanup
     */
    close() {
        console.log('StorageManager: Closing database connection');

        // Clear operation queue
        this.operationQueue = [];
        this.isProcessingQueue = false;

        // Wait for active operations to complete
        const maxWait = 5000; // 5 seconds
        const startTime = Date.now();

        const waitForOperations = () => {
            if (this.activeOperations.size === 0 || (Date.now() - startTime) > maxWait) {
                // Close database
                if (this.db) {
                    this.db.close();
                    this.db = null;
                }
                this.connectionState = 'disconnected';
                console.log('StorageManager: Database closed');
            } else {
                // Wait a bit more
                setTimeout(waitForOperations, 100);
            }
        };

        waitForOperations();
    }

    /**
     * Health check for monitoring
     */
    /**
     * Handle quota exceeded errors by cleaning up old data and retrying
     */
    async handleQuotaExceeded(storeName, newData) {
        console.warn(`Storage quota exceeded for store: ${storeName}. Attempting cleanup...`);

        try {
            // Get current storage usage
            const stats = await this.getStorageStats();
            console.log('Storage stats before cleanup:', stats);

            // Perform aggressive cleanup based on store type
            const cleanupResult = await this.performQuotaCleanup(storeName);

            if (cleanupResult.itemsRemoved > 0) {
                console.log(`Quota cleanup removed ${cleanupResult.itemsRemoved} items from ${storeName}`);

                // Retry the save operation after cleanup
                return await this.retrySaveAfterCleanup(storeName, newData);
            } else {
                throw new Error('No data available to clean up, storage quota permanently exceeded');
            }

        } catch (cleanupError) {
            console.error('Failed to handle quota exceeded:', cleanupError);

            // If all else fails, try localStorage as fallback
            return await this.fallbackToLocalStorage(storeName, newData);
        }
    }

    /**
     * Perform aggressive cleanup for quota management
     */
    async performQuotaCleanup(targetStore) {
        let totalRemoved = 0;

        try {
            // Clean up each store based on priority (oldest first)
            const cleanupStrategies = [
                { store: 'history', keepLatest: 50 },      // Keep last 50 history entries
                { store: 'quotes', keepLatest: 20 },       // Keep last 20 saved quotes
                { store: 'components', keepLatest: 100 },   // Keep last 100 component configs
            ];

            for (const strategy of cleanupStrategies) {
                if (strategy.store === targetStore || totalRemoved < 10) {
                    // Be more aggressive with the target store or if we haven't freed enough space
                    const keepCount = strategy.store === targetStore ?
                        Math.floor(strategy.keepLatest * 0.5) : strategy.keepLatest;

                    const removed = await this.cleanupOldEntries(strategy.store, keepCount);
                    totalRemoved += removed;

                    console.log(`Cleaned ${removed} entries from ${strategy.store}`);
                }
            }

            return { itemsRemoved: totalRemoved };

        } catch (error) {
            console.error('Error during quota cleanup:', error);
            return { itemsRemoved: 0 };
        }
    }

    /**
     * Clean up old entries from a specific store
     */
    async cleanupOldEntries(storeName, keepLatest) {
        return this.queueOperation(async () => {
            if (!this.db || this.connectionState !== 'connected') {
                return 0;
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                let removedCount = 0;

                // Get all entries ordered by timestamp (newest first)
                const request = store.openCursor(null, 'prev');

                let entryCount = 0;
                const entriesToDelete = [];

                request.onsuccess = (event) => {
                    const cursor = event.target.result;

                    if (cursor) {
                        entryCount++;

                        // Keep only the latest entries
                        if (entryCount > keepLatest) {
                            entriesToDelete.push(cursor.primaryKey);
                        }

                        cursor.continue();
                    } else {
                        // Delete old entries
                        let deletePromises = entriesToDelete.map(key => {
                            return new Promise((delResolve, delReject) => {
                                const deleteRequest = store.delete(key);
                                deleteRequest.onsuccess = () => {
                                    removedCount++;
                                    delResolve();
                                };
                                deleteRequest.onerror = () => delReject(deleteRequest.error);
                            });
                        });

                        Promise.all(deletePromises)
                            .then(() => resolve(removedCount))
                            .catch(reject);
                    }
                };

                request.onerror = () => reject(request.error);
            });
        });
    }

    /**
     * Retry save operation after cleanup
     */
    async retrySaveAfterCleanup(storeName, data) {
        return this.queueOperation(async () => {
            if (!this.db || this.connectionState !== 'connected') {
                throw new Error('Database not available after cleanup');
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);

                transaction.onerror = (event) => reject(event.target.error);

                const request = store.add(data);

                request.onsuccess = () => resolve({ id: request.result, ...data });
                request.onerror = () => {
                    // If still quota exceeded, fall back to localStorage
                    if (request.error && (request.error.name === 'QuotaExceededError' ||
                                          request.error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                        this.fallbackToLocalStorage(storeName, data)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        reject(request.error);
                    }
                };
            });
        });
    }

    /**
     * Fallback to localStorage when IndexedDB quota is exhausted
     */
    async fallbackToLocalStorage(storeName, data) {
        try {
            const fallbackKey = `naas_fallback_${storeName}_${Date.now()}`;
            const dataToStore = JSON.stringify(data);

            // Check if we can store in localStorage
            if (dataToStore.length > 5 * 1024 * 1024) { // 5MB limit
                throw new Error('Data too large for localStorage fallback');
            }

            localStorage.setItem(fallbackKey, dataToStore);
            console.warn(`Data saved to localStorage fallback: ${fallbackKey}`);

            // Clean up old fallback entries to prevent localStorage from filling up
            this.cleanupLocalStorageFallbacks(storeName);

            return { id: fallbackKey, ...data, isFallback: true };

        } catch (localStorageError) {
            // If localStorage also fails, we're out of options
            if (localStorageError.name === 'QuotaExceededError') {
                throw new Error('Both IndexedDB and localStorage storage quotas exceeded. Cannot save data.');
            }
            throw localStorageError;
        }
    }

    /**
     * Clean up old localStorage fallback entries
     */
    cleanupLocalStorageFallbacks(storeName) {
        try {
            const fallbackPrefix = `naas_fallback_${storeName}_`;
            const fallbackKeys = [];

            // Find all fallback keys for this store
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(fallbackPrefix)) {
                    fallbackKeys.push(key);
                }
            }

            // Sort by timestamp (newest first) and keep only the latest 5
            fallbackKeys.sort((a, b) => {
                const timestampA = parseInt(a.split('_').pop());
                const timestampB = parseInt(b.split('_').pop());
                return timestampB - timestampA;
            });

            // Remove old fallback entries
            fallbackKeys.slice(5).forEach(key => {
                localStorage.removeItem(key);
            });

            if (fallbackKeys.length > 5) {
                console.log(`Cleaned up ${fallbackKeys.length - 5} old localStorage fallback entries`);
            }

        } catch (error) {
            console.error('Error cleaning up localStorage fallbacks:', error);
        }
    }

    getHealthStatus() {
        return {
            isSupported: this.isIndexedDBSupported,
            connectionState: this.connectionState,
            dbVersion: this.dbVersion,
            errorCount: this.errorCount,
            lastError: this.lastError,
            activeOperations: this.activeOperations.size,
            queueLength: this.operationQueue.length,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
} else {
    window.StorageManager = StorageManager;
}