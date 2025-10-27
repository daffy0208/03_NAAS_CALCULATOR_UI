/**
 * NaaS Pricing Calculator - Quote Data Store
 * Single source of truth for all quote data with event-driven updates
 * Version 2.0 - Enhanced with proper initialization, validation, and error handling
 */

class QuoteDataStore {
    constructor() {
        // Storage state tracking
        this.storageInitialized = false;
        this.initializationPromise = null;
        this.storageManager = null;

        // Data versioning for migrations
        this.DATA_VERSION = '2.0.0';

        // Default data structure factory
        this.data = this.createDefaultData();

        // Event system
        this.listeners = [];
        this.unsubscribeFunctions = new Set();

        // Resource cleanup tracking
        this.intervals = new Set();
        this.timeouts = new Set();

        // Initialize asynchronously
        this.initializeAsync().catch(error => {
            console.error('QuoteDataStore initialization failed:', error);
        });
    }

    /**
     * Create default data structure with proper typing
     */
    createDefaultData() {
        const componentDefaults = () => ({ enabled: false, params: {} });

        return {
            version: this.DATA_VERSION,
            timestamp: new Date().toISOString(),
            project: {
                projectName: '',
                customerName: '',
                timeline: 'medium',
                budget: '',
                sites: 1,
                primaryLocation: '',
                totalUsers: 100,
                complexity: 'medium'
            },
            components: {
                help: componentDefaults(),
                prtg: componentDefaults(),
                capital: componentDefaults(),
                support: componentDefaults(),
                onboarding: componentDefaults(),
                pbsFoundation: componentDefaults(),
                assessment: componentDefaults(),
                admin: componentDefaults(),
                otherCosts: componentDefaults(),
                enhancedSupport: componentDefaults(),
                dynamics1Year: componentDefaults(),
                dynamics3Year: componentDefaults(),
                dynamics5Year: componentDefaults(),
                naasStandard: componentDefaults(),
                naasEnhanced: componentDefaults()
            }
        };
    }

    /**
     * Proper async initialization to prevent race conditions
     */
    async initializeAsync() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._performInitialization();
        return this.initializationPromise;
    }

    async _performInitialization() {
        try {
            // Initialize storage manager
            this.storageManager = new StorageManager();
            const initialized = await this.storageManager.initialize();
            this.storageInitialized = true;

            console.log('QuoteDataStore: Storage initialized:', initialized ? 'IndexedDB' : 'localStorage fallback');

            // Load existing data with migration support
            await this.loadFromStorage();

            // Set up cross-tab synchronization
            this.setupCrossTabSync();

            return true;
        } catch (error) {
            console.error('QuoteDataStore: Initialization failed:', error);
            this.storageInitialized = false;
            // Fallback to localStorage only
            this.loadFromStorageSync();
            return false;
        }
    }

    /**
     * Ensure storage is initialized before operations
     */
    async ensureInitialized() {
        if (!this.storageInitialized && this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.storageInitialized;
    }

    /**
     * Set up cross-tab synchronization using storage events
     */
    setupCrossTabSync() {
        // Listen for storage changes from other tabs
        const storageListener = (event) => {
            if (event.key === 'naas_quote_data' && event.newValue) {
                try {
                    const newData = JSON.parse(event.newValue);
                    if (this.validateDataStructure(newData)) {
                        // Merge data from other tab
                        this.data = this.mergeWithDefaults(newData);
                        this.notifyListeners('sync', this.data);
                        console.log('QuoteDataStore: Synced data from another tab');
                    }
                } catch (error) {
                    console.error('QuoteDataStore: Cross-tab sync failed:', error);
                }
            }
        };

        window.addEventListener('storage', storageListener);

        // Store cleanup function
        this.unsubscribeFunctions.add(() => {
            window.removeEventListener('storage', storageListener);
        });

        // Set up beforeunload to save data
        const beforeUnloadListener = () => {
            try {
                this.saveToStorageSync();
            } catch (error) {
                console.error('QuoteDataStore: Failed to save on beforeunload:', error);
            }
        };

        window.addEventListener('beforeunload', beforeUnloadListener);

        this.unsubscribeFunctions.add(() => {
            window.removeEventListener('beforeunload', beforeUnloadListener);
        });
    }

    // Event system for data changes
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    notifyListeners(type, data) {
        this.listeners.forEach(listener => {
            try {
                listener(type, data, this.data);
            } catch (error) {
                console.error('Error in data store listener:', error);
            }
        });
    }

    // Project data methods with validation
    updateProject(projectData) {
        try {
            if (!projectData || typeof projectData !== 'object') {
                throw new Error('Project data must be a valid object');
            }

            // Validate and sanitize project data
            const validatedData = this.validateProjectData(projectData);

            // Update with validated data
            this.data.project = { ...this.data.project, ...validatedData };
            this.data.timestamp = new Date().toISOString();

            // Save and notify
            this.saveToStorage();
            this.notifyListeners('project', this.data.project);

        } catch (error) {
            console.error('QuoteDataStore: Failed to update project:', error);
            throw error;
        }
    }

    /**
     * Validate and sanitize project data
     */
    validateProjectData(projectData) {
        const validated = {};

        // String fields with sanitization
        if (projectData.projectName !== undefined) {
            validated.projectName = this.sanitizeString(projectData.projectName, AppConfig.MAX_STRING_LENGTH_SHORT);
        }
        if (projectData.customerName !== undefined) {
            validated.customerName = this.sanitizeString(projectData.customerName, AppConfig.MAX_STRING_LENGTH_SHORT);
        }
        if (projectData.primaryLocation !== undefined) {
            validated.primaryLocation = this.sanitizeString(projectData.primaryLocation, AppConfig.MAX_STRING_LENGTH_SHORT);
        }
        if (projectData.budget !== undefined) {
            validated.budget = this.sanitizeString(projectData.budget, AppConfig.MAX_STRING_LENGTH_MEDIUM);
        }

        // Enum validation
        if (projectData.timeline !== undefined) {
            const validTimelines = ['short', 'medium', 'long'];
            validated.timeline = validTimelines.includes(projectData.timeline) ?
                projectData.timeline : 'medium';
        }

        if (projectData.complexity !== undefined) {
            const validComplexity = ['low', 'medium', 'high'];
            validated.complexity = validComplexity.includes(projectData.complexity) ?
                projectData.complexity : 'medium';
        }

        // Numeric validation
        if (projectData.sites !== undefined) {
            validated.sites = this.validatePositiveInteger(projectData.sites, AppConfig.MIN_SITES, AppConfig.MAX_SITES) || AppConfig.MIN_SITES;
        }
        if (projectData.totalUsers !== undefined) {
            validated.totalUsers = this.validatePositiveInteger(projectData.totalUsers, AppConfig.MIN_USERS, AppConfig.MAX_USERS) || AppConfig.DEFAULT_USER_COUNT;
        }

        return validated;
    }

    getProject() {
        return { ...this.data.project };
    }

    // Component data methods with validation
    updateComponent(type, componentData) {
        try {
            if (!type || typeof type !== 'string') {
                throw new Error('Component type must be a valid string');
            }

            if (!componentData || typeof componentData !== 'object') {
                throw new Error('Component data must be a valid object');
            }

            // Validate component type exists
            if (!this.data.components[type]) {
                // Only allow known component types
                const knownTypes = Object.keys(this.createDefaultData().components);
                if (!knownTypes.includes(type)) {
                    throw new Error(`Unknown component type: ${type}`);
                }
                this.data.components[type] = { enabled: false, params: {} };
            }

            // Validate component data
            const validatedData = this.validateComponentData(componentData);

            // Apply business rules
            this.validateBusinessRules(type, validatedData);

            // Update with validated data
            this.data.components[type] = { ...this.data.components[type], ...validatedData };
            this.data.timestamp = new Date().toISOString();

            // Save and notify
            this.saveToStorage();
            this.notifyListeners('component', { type, data: this.data.components[type] });

        } catch (error) {
            console.error(`QuoteDataStore: Failed to update component ${type}:`, error);
            throw error;
        }
    }

    /**
     * Validate component data structure
     */
    validateComponentData(componentData) {
        const validated = {};

        // Validate enabled flag
        if (componentData.enabled !== undefined) {
            validated.enabled = Boolean(componentData.enabled);
        }

        // Validate params object
        if (componentData.params !== undefined) {
            if (typeof componentData.params === 'object' && componentData.params !== null) {
                validated.params = this.sanitizeObject(componentData.params);
            } else {
                validated.params = {};
            }
        }

        return validated;
    }

    /**
     * Validate business rules for component interactions
     */
    validateBusinessRules(type, data) {
        // Rule: Only one NaaS type should be enabled at a time
        if ((type === 'naasStandard' || type === 'naasEnhanced') && data.enabled) {
            const otherNaasType = type === 'naasStandard' ? 'naasEnhanced' : 'naasStandard';
            if (this.data.components[otherNaasType]?.enabled) {
                console.warn(`QuoteDataStore: Disabling ${otherNaasType} as ${type} is being enabled`);
                this.data.components[otherNaasType].enabled = false;
            }
        }

        // Rule: Only one Dynamics term should be enabled
        const dynamicsTypes = ['dynamics1Year', 'dynamics3Year', 'dynamics5Year'];
        if (dynamicsTypes.includes(type) && data.enabled) {
            dynamicsTypes.forEach(dynType => {
                if (dynType !== type && this.data.components[dynType]?.enabled) {
                    console.warn(`QuoteDataStore: Disabling ${dynType} as ${type} is being enabled`);
                    this.data.components[dynType].enabled = false;
                }
            });
        }

        // Rule: Enhanced support requires base support
        if (type === 'enhancedSupport' && data.enabled) {
            if (!this.data.components.support?.enabled) {
                console.warn('QuoteDataStore: Enhanced support requires base support - enabling automatically');
                this.data.components.support.enabled = true;
            }
        }
    }

    getComponent(type) {
        return this.data.components[type] ? { ...this.data.components[type] } : { enabled: false, params: {} };
    }

    getAllComponents() {
        return { ...this.data.components };
    }

    // Enable/disable component
    setComponentEnabled(type, enabled) {
        this.updateComponent(type, { enabled });
    }

    // Update component parameters
    updateComponentParams(type, params) {
        const currentData = this.getComponent(type);
        this.updateComponent(type, { ...currentData, params: { ...currentData.params, ...params } });
    }

    // Get all enabled components
    getEnabledComponents() {
        return Object.keys(this.data.components)
            .filter(type => this.data.components[type].enabled)
            .reduce((acc, type) => {
                acc[type] = this.getComponent(type);
                return acc;
            }, {});
    }

    // Clear all data
    clear() {
        this.data = {
            project: {
                projectName: '',
                customerName: '',
                timeline: 'medium',
                budget: '',
                sites: 1,
                primaryLocation: '',
                totalUsers: 100,
                complexity: 'medium'
            },
            components: {
                help: { enabled: false, params: {} },
                prtg: { enabled: false, params: {} },
                capital: { enabled: false, params: {} },
                support: { enabled: false, params: {} },
                onboarding: { enabled: false, params: {} },
                pbsFoundation: { enabled: false, params: {} },
                assessment: { enabled: false, params: {} },
                admin: { enabled: false, params: {} },
                otherCosts: { enabled: false, params: {} },
                enhancedSupport: { enabled: false, params: {} },
                dynamics1Year: { enabled: false, params: {} },
                dynamics3Year: { enabled: false, params: {} },
                dynamics5Year: { enabled: false, params: {} },
                naasStandard: { enabled: false, params: {} },
                naasEnhanced: { enabled: false, params: {} }
            }
        };
        this.saveToStorage();
        this.notifyListeners('clear', null);
    }

    // Validation utility methods
    sanitizeString(value, maxLength = AppConfig.MAX_STRING_LENGTH) {
        if (value === null || value === undefined) return '';
        const str = String(value).trim();
        // Basic XSS prevention - remove script tags and similar
        const cleaned = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                           .replace(/javascript:/gi, '')
                           .replace(/on\w+\s*=/gi, '');
        return cleaned.substring(0, maxLength);
    }

    validatePositiveInteger(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < min || num > max) {
            return null;
        }
        return num;
    }

    sanitizeObject(obj, maxDepth = AppConfig.MAX_OBJECT_DEPTH) {
        if (maxDepth <= 0 || obj === null || typeof obj !== 'object') {
            return {};
        }

        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (key.length > AppConfig.MAX_KEY_LENGTH) continue; // Skip overly long keys

            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            } else if (typeof value === 'number' && isFinite(value)) {
                sanitized[key] = value;
            } else if (typeof value === 'boolean') {
                sanitized[key] = value;
            } else if (Array.isArray(value) && value.length < AppConfig.MAX_ARRAY_SIZE) {
                sanitized[key] = value.slice(0, AppConfig.MAX_ARRAY_SIZE_SHORT); // Limit array size
            } else if (typeof value === 'object') {
                sanitized[key] = this.sanitizeObject(value, maxDepth - 1);
            }
        }
        return sanitized;
    }

    validateDataStructure(data) {
        if (!data || typeof data !== 'object') return false;
        if (!data.project || typeof data.project !== 'object') return false;
        if (!data.components || typeof data.components !== 'object') return false;
        return true;
    }

    mergeWithDefaults(data) {
        const defaults = this.createDefaultData();

        return {
            version: data.version || defaults.version,
            timestamp: data.timestamp || defaults.timestamp,
            project: { ...defaults.project, ...(data.project || {}) },
            components: { ...defaults.components, ...(data.components || {}) }
        };
    }

    // Enhanced persistence methods with better error handling
    saveToStorage() {
        try {
            // Always save to localStorage immediately for reliability
            this.saveToStorageSync();

            // Use non-blocking async save to IndexedDB
            this._saveToStorageAsync().catch(error => {
                console.error('QuoteDataStore: Background IndexedDB save failed:', error);
            });
        } catch (error) {
            console.error('QuoteDataStore: Critical save failure:', error);
            throw error;
        }
    }

    saveToStorageSync() {
        try {
            const dataToSave = {
                ...this.data,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('naas_quote_data', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('QuoteDataStore: localStorage save failed:', error);

            // Try to free up space and retry once
            if (error.name === 'QuotaExceededError') {
                this.cleanupLocalStorage();
                try {
                    localStorage.setItem('naas_quote_data', JSON.stringify(this.data));
                } catch (retryError) {
                    console.error('QuoteDataStore: localStorage retry failed:', retryError);
                    throw retryError;
                }
            } else {
                throw error;
            }
        }
    }

    cleanupLocalStorage() {
        // Remove old test data and temporary data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('naas_test_') ||
                key.startsWith('naas_temp_') ||
                key.includes('component_') && key.includes('_temp')) {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    // Ignore individual removal failures
                }
            }
        });
    }

    async _saveToStorageAsync() {
        try {
            await this.storageManager.saveQuote({
                projectName: this.data.project.projectName || 'Untitled Quote',
                customerName: this.data.project.customerName || 'Unknown Customer',
                components: this.data.components,
                project: this.data.project,
                type: 'auto_save'
            });
        } catch (error) {
            console.error('Error saving to IndexedDB:', error);
        }
    }

    async loadFromStorage() {
        try {
            await this.loadFromStorageSync();

            // Try to load from IndexedDB if available
            if (this.storageManager && this.storageInitialized) {
                try {
                    const quotes = await this.storageManager.getQuotes({ limit: 1 });
                    if (quotes.length > 0) {
                        const latestQuote = quotes[0];
                        if (this.validateDataStructure(latestQuote)) {
                            const merged = this.mergeWithDefaults({
                                project: latestQuote.project,
                                components: latestQuote.components,
                                version: latestQuote.version,
                                timestamp: latestQuote.timestamp
                            });

                            // Use IndexedDB data if it's newer
                            const localTimestamp = new Date(this.data.timestamp || 0);
                            const dbTimestamp = new Date(latestQuote.timestamp || 0);

                            if (dbTimestamp > localTimestamp) {
                                this.data = merged;
                                console.log('QuoteDataStore: Loaded newer data from IndexedDB');
                            }
                        }
                    }
                } catch (error) {
                    console.warn('QuoteDataStore: Could not load from IndexedDB:', error);
                }
            }
        } catch (error) {
            console.error('QuoteDataStore: Failed to load data:', error);
            // Continue with default data
        }
    }

    loadFromStorageSync() {
        try {
            const stored = localStorage.getItem('naas_quote_data');
            if (stored) {
                const parsedData = JSON.parse(stored);

                if (this.validateDataStructure(parsedData)) {
                    // Merge with defaults and handle data migration
                    this.data = this.mergeWithDefaults(parsedData);

                    // Migrate data if version mismatch
                    if (!parsedData.version || parsedData.version !== this.DATA_VERSION) {
                        console.log(`QuoteDataStore: Migrating data from ${parsedData.version || 'legacy'} to ${this.DATA_VERSION}`);
                        this.migrateData(parsedData);
                        this.saveToStorageSync(); // Save migrated data
                    }
                } else {
                    console.warn('QuoteDataStore: Invalid data structure in localStorage, using defaults');
                    this.data = this.createDefaultData();
                }
            }
        } catch (error) {
            console.error('QuoteDataStore: Error loading from localStorage:', error);
            // Fallback to defaults on any error
            this.data = this.createDefaultData();
        }
    }

    migrateData(oldData) {
        // Handle migration from older versions
        if (!oldData.version) {
            // Migrate from v1.x to v2.x
            console.log('QuoteDataStore: Migrating from legacy format');

            // Handle old component format
            if (oldData.components) {
                Object.keys(oldData.components).forEach(componentType => {
                    const component = oldData.components[componentType];
                    if (component && typeof component === 'object') {
                        // Ensure proper structure
                        if (component.enabled === undefined) {
                            component.enabled = false;
                        }
                        if (!component.params || typeof component.params !== 'object') {
                            component.params = {};
                        }
                    }
                });
            }
        }

        // Add version and timestamp to migrated data
        this.data.version = this.DATA_VERSION;
        this.data.timestamp = new Date().toISOString();
    }

    // Export data for quote generation
    exportData() {
        return {
            version: this.DATA_VERSION,
            project: this.getProject(),
            components: this.getAllComponents(),
            enabledComponents: this.getEnabledComponents(),
            timestamp: new Date().toISOString()
        };
    }

    // Resource cleanup and management
    setManagedInterval(callback, delay) {
        const intervalId = setInterval(callback, delay);
        this.intervals.add(intervalId);
        return intervalId;
    }

    setManagedTimeout(callback, delay) {
        const timeoutId = setTimeout(() => {
            this.timeouts.delete(timeoutId);
            callback();
        }, delay);
        this.timeouts.add(timeoutId);
        return timeoutId;
    }

    clearManagedInterval(intervalId) {
        if (this.intervals.has(intervalId)) {
            clearInterval(intervalId);
            this.intervals.delete(intervalId);
        }
    }

    clearManagedTimeout(timeoutId) {
        if (this.timeouts.has(timeoutId)) {
            clearTimeout(timeoutId);
            this.timeouts.delete(timeoutId);
        }
    }

    // Temporary storage methods for auto-save functionality
    async saveTemporary(key, data) {
        try {
            const temporaryData = {
                key: key,
                data: data,
                timestamp: Date.now(),
                expiresAt: Date.now() + AppConfig.TEMP_DATA_EXPIRY_MS
            };

            if (this.storageManager) {
                await this.storageManager.saveToIndexedDB('temp_storage', temporaryData);
            } else {
                // Fallback to localStorage
                const tempKey = `naas_temp_${key}`;
                localStorage.setItem(tempKey, JSON.stringify(temporaryData));
            }

            console.log(`Temporary data saved for key: ${key}`);
        } catch (error) {
            console.error('Failed to save temporary data:', error);
            throw error;
        }
    }

    async getTemporary(key) {
        try {
            let temporaryData = null;

            if (this.storageManager) {
                try {
                    // Try to get from IndexedDB
                    const allTemp = await this.storageManager.getFromIndexedDB('temp_storage');
                    temporaryData = allTemp?.find(item => item.key === key);
                } catch (error) {
                    console.warn('Error accessing IndexedDB temp storage:', error);
                }
            }

            if (!temporaryData) {
                // Fallback to localStorage
                const tempKey = `naas_temp_${key}`;
                const stored = localStorage.getItem(tempKey);
                if (stored) {
                    temporaryData = JSON.parse(stored);
                }
            }

            if (!temporaryData) {
                return null;
            }

            // Check if data has expired
            if (temporaryData.expiresAt && Date.now() > temporaryData.expiresAt) {
                // Clean up expired data
                await this.removeTemporary(key);
                return null;
            }

            return temporaryData.data;

        } catch (error) {
            console.error('Failed to get temporary data:', error);
            return null;
        }
    }

    async removeTemporary(key) {
        try {
            if (this.storageManager) {
                // Remove from IndexedDB (this is simplified - in a real implementation you'd need a proper key-based delete)
                console.log(`Would remove temporary data for key: ${key} from IndexedDB`);
                // For now, just let it expire naturally
            }

            // Remove from localStorage
            const tempKey = `naas_temp_${key}`;
            localStorage.removeItem(tempKey);

        } catch (error) {
            console.error('Failed to remove temporary data:', error);
        }
    }

    async cleanupExpiredTemporary() {
        try {
            // Clean up expired localStorage entries
            const keysToRemove = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('naas_temp_')) {
                    try {
                        const stored = localStorage.getItem(key);
                        const data = JSON.parse(stored);

                        if (data.expiresAt && Date.now() > data.expiresAt) {
                            keysToRemove.push(key);
                        }
                    } catch (error) {
                        // Invalid data, remove it
                        keysToRemove.push(key);
                    }
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));

            if (keysToRemove.length > 0) {
                console.log(`Cleaned up ${keysToRemove.length} expired temporary storage entries`);
            }

        } catch (error) {
            console.error('Error cleaning up expired temporary data:', error);
        }
    }

    // Cleanup method to prevent memory leaks
    destroy() {
        console.log('QuoteDataStore: Cleaning up resources...');

        // Clear all intervals
        this.intervals.forEach(intervalId => {
            clearInterval(intervalId);
        });
        this.intervals.clear();

        // Clear all timeouts
        this.timeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.timeouts.clear();

        // Unsubscribe from all events
        this.unsubscribeFunctions.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (error) {
                console.warn('QuoteDataStore: Error during unsubscribe:', error);
            }
        });
        this.unsubscribeFunctions.clear();

        // Clear listeners
        this.listeners = [];

        // Close storage manager
        if (this.storageManager && typeof this.storageManager.close === 'function') {
            this.storageManager.close();
        }

        // Final save
        try {
            this.saveToStorageSync();
        } catch (error) {
            console.warn('QuoteDataStore: Could not perform final save:', error);
        }

        console.log('QuoteDataStore: Cleanup complete');
    }

    // Health check method for monitoring
    getHealthStatus() {
        return {
            version: this.DATA_VERSION,
            storageInitialized: this.storageInitialized,
            hasData: !!(this.data?.project?.projectName || Object.values(this.data?.components || {}).some(c => c.enabled)),
            listenerCount: this.listeners.length,
            resourcesInUse: {
                intervals: this.intervals.size,
                timeouts: this.timeouts.size,
                subscriptions: this.unsubscribeFunctions.size
            },
            lastUpdate: this.data?.timestamp,
            memoryUsage: this.calculateMemoryUsage()
        };
    }

    calculateMemoryUsage() {
        try {
            const dataSize = JSON.stringify(this.data).length;
            return {
                dataSize: `${Math.round(dataSize / 1024)} KB`,
                listeners: this.listeners.length,
                rawBytes: dataSize
            };
        } catch (error) {
            return { error: 'Could not calculate memory usage' };
        }
    }

    // Debug method
    debugInfo() {
        return {
            health: this.getHealthStatus(),
            data: this.data,
            config: {
                DATA_VERSION: this.DATA_VERSION,
                storageInitialized: this.storageInitialized
            }
        };
    }
}

// Enhanced global instance creation with proper error handling
function createQuoteDataStore() {
    try {
        if (window.quoteDataStore) {
            console.warn('QuoteDataStore already exists, cleaning up old instance');
            window.quoteDataStore.destroy();
        }

        console.log('Creating new QuoteDataStore instance...');
        window.quoteDataStore = new QuoteDataStore();

        // Set up global cleanup on page unload
        window.addEventListener('unload', () => {
            if (window.quoteDataStore) {
                window.quoteDataStore.destroy();
            }
        });

        return window.quoteDataStore;
    } catch (error) {
        console.error('Failed to create QuoteDataStore:', error);
        throw error;
    }
}

// Create global instance when DOM is ready with proper error handling
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createQuoteDataStore);
} else {
    // DOM already loaded
    createQuoteDataStore();
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuoteDataStore;
} else if (typeof window !== 'undefined') {
    window.QuoteDataStore = QuoteDataStore;
}
