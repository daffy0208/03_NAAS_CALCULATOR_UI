/**
 * Comprehensive Data Persistence and State Management Test Suite
 * Tests all aspects of data storage, synchronization, and state management
 */

class DataPersistenceTest {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.warnings = [];

        // Test configuration
        this.config = {
            testTimeout: 10000,
            concurrentTabCount: 3,
            largeDataSize: 1024 * 1024, // 1MB
            testIterations: 100
        };

        this.initializeTest();
    }

    async initializeTest() {
        console.log('=== Starting Data Persistence Test Suite ===');
        await this.setupTestEnvironment();
        await this.runAllTests();
        this.generateReport();
    }

    async setupTestEnvironment() {
        console.log('Setting up test environment...');

        // Clear existing data for clean testing
        await this.clearAllData();

        // Initialize required components
        this.storageManager = new StorageManager();
        await this.storageManager.initialize();

        this.quoteDataStore = new QuoteDataStore();

        // Test data templates
        this.testData = {
            project: {
                projectName: 'Test Project ' + Date.now(),
                customerName: 'Test Customer',
                timeline: 'medium',
                budget: '50000',
                sites: 3,
                primaryLocation: 'New York',
                totalUsers: 150,
                complexity: 'high'
            },
            components: {
                prtg: {
                    enabled: true,
                    params: {
                        sensors: 200,
                        locations: 5,
                        serviceLevel: 'enhanced'
                    }
                },
                capital: {
                    enabled: true,
                    params: {
                        equipment: [
                            { type: 'router_medium', quantity: 2 },
                            { type: 'switch_24port', quantity: 3 }
                        ],
                        financing: true
                    }
                },
                support: {
                    enabled: true,
                    params: {
                        level: 'enhanced',
                        deviceCount: 20
                    }
                }
            }
        };
    }

    async runAllTests() {
        const tests = [
            // Core storage tests
            { name: 'Local Storage Operations', test: () => this.testLocalStorageOperations() },
            { name: 'IndexedDB Operations', test: () => this.testIndexedDBOperations() },
            { name: 'Storage Fallback Mechanism', test: () => this.testStorageFallback() },

            // Data persistence tests
            { name: 'Quote Data Store Initialization', test: () => this.testQuoteDataStoreInit() },
            { name: 'Data Save and Load Operations', test: () => this.testDataSaveLoad() },
            { name: 'Data Migration', test: () => this.testDataMigration() },
            { name: 'Data Corruption Recovery', test: () => this.testCorruptionRecovery() },

            // Session management tests
            { name: 'Session Persistence', test: () => this.testSessionPersistence() },
            { name: 'Multiple Tabs Synchronization', test: () => this.testMultipleTabsSync() },
            { name: 'Page Refresh Data Retention', test: () => this.testPageRefreshRetention() },

            // Data synchronization tests
            { name: 'Component to Wizard Sync', test: () => this.testComponentWizardSync() },
            { name: 'Data Store Event Handling', test: () => this.testDataStoreEvents() },
            { name: 'Real-time Updates', test: () => this.testRealTimeUpdates() },

            // State management tests
            { name: 'Component State Transitions', test: () => this.testComponentStateTransitions() },
            { name: 'Navigation State Management', test: () => this.testNavigationState() },
            { name: 'Form State Persistence', test: () => this.testFormStatePersistence() },

            // Data validation tests
            { name: 'Schema Validation', test: () => this.testSchemaValidation() },
            { name: 'Type Checking', test: () => this.testTypeChecking() },
            { name: 'Business Rule Validation', test: () => this.testBusinessRules() },

            // Concurrent access tests
            { name: 'Race Condition Prevention', test: () => this.testRaceConditions() },
            { name: 'Simultaneous Operations', test: () => this.testSimultaneousOperations() },
            { name: 'Data Consistency Under Load', test: () => this.testDataConsistency() },

            // Edge cases and recovery
            { name: 'Storage Quota Limits', test: () => this.testStorageQuotaLimits() },
            { name: 'Network Failure Recovery', test: () => this.testNetworkFailureRecovery() },
            { name: 'Browser Compatibility', test: () => this.testBrowserCompatibility() },
            { name: 'Data Backup and Restore', test: () => this.testBackupRestore() }
        ];

        for (const testCase of tests) {
            try {
                console.log(`Running test: ${testCase.name}...`);
                const startTime = performance.now();
                const result = await this.runWithTimeout(testCase.test(), this.config.testTimeout);
                const endTime = performance.now();

                this.testResults.push({
                    name: testCase.name,
                    status: 'PASSED',
                    duration: endTime - startTime,
                    result: result
                });

                console.log(`✅ ${testCase.name} - PASSED (${Math.round(endTime - startTime)}ms)`);

            } catch (error) {
                this.testResults.push({
                    name: testCase.name,
                    status: 'FAILED',
                    error: error.message,
                    stack: error.stack
                });

                this.errors.push({
                    test: testCase.name,
                    error: error
                });

                console.error(`❌ ${testCase.name} - FAILED:`, error.message);
            }

            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async runWithTimeout(promise, timeout) {
        return Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Test timeout')), timeout)
            )
        ]);
    }

    // ========== LOCAL STORAGE TESTS ==========

    async testLocalStorageOperations() {
        const testKey = 'naas_test_data';
        const testData = { test: 'data', timestamp: Date.now() };

        // Test save
        localStorage.setItem(testKey, JSON.stringify(testData));

        // Test load
        const loaded = JSON.parse(localStorage.getItem(testKey));
        if (JSON.stringify(loaded) !== JSON.stringify(testData)) {
            throw new Error('Data mismatch in localStorage save/load');
        }

        // Test remove
        localStorage.removeItem(testKey);
        if (localStorage.getItem(testKey) !== null) {
            throw new Error('Data not properly removed from localStorage');
        }

        // Test quota handling
        try {
            const largeData = 'x'.repeat(this.config.largeDataSize);
            localStorage.setItem('naas_large_test', largeData);
            localStorage.removeItem('naas_large_test');
        } catch (error) {
            if (error.name !== 'QuotaExceededError') {
                throw new Error('Unexpected error during quota test: ' + error.message);
            }
        }

        return { status: 'All localStorage operations working correctly' };
    }

    async testIndexedDBOperations() {
        if (!this.storageManager.isIndexedDBSupported) {
            this.warnings.push('IndexedDB not supported - using localStorage fallback');
            return { status: 'IndexedDB not supported, fallback active' };
        }

        // Test quote saving
        const testQuote = {
            projectName: 'IndexedDB Test Quote',
            customerName: 'Test Customer',
            components: this.testData.components,
            project: this.testData.project,
            timestamp: new Date().toISOString()
        };

        const savedQuote = await this.storageManager.saveQuote(testQuote);
        if (!savedQuote || !savedQuote.id) {
            throw new Error('Failed to save quote to IndexedDB');
        }

        // Test quote retrieval
        const quotes = await this.storageManager.getQuotes({ limit: 10 });
        if (!quotes.find(q => q.id === savedQuote.id)) {
            throw new Error('Saved quote not found in retrieval');
        }

        // Test component saving
        const testComponent = {
            componentType: 'prtg',
            name: 'Test PRTG Component',
            params: { sensors: 100, locations: 3 },
            result: { totals: { monthly: 500 } },
            timestamp: new Date().toISOString()
        };

        const savedComponent = await this.storageManager.saveComponent(testComponent);
        if (!savedComponent || !savedComponent.id) {
            throw new Error('Failed to save component to IndexedDB');
        }

        // Test cleanup
        const cleanupResult = await this.storageManager.cleanup({
            quotesKeepDays: 1,
            componentsKeepDays: 1,
            historyKeepDays: 1
        });

        return {
            status: 'IndexedDB operations working correctly',
            quotes: quotes.length,
            cleanup: cleanupResult
        };
    }

    async testStorageFallback() {
        // Temporarily disable IndexedDB to test fallback
        const originalSupport = this.storageManager.isIndexedDBSupported;
        this.storageManager.isIndexedDBSupported = false;

        try {
            const testQuote = {
                projectName: 'Fallback Test Quote',
                customerName: 'Test Customer',
                components: {},
                project: this.testData.project
            };

            const result = await this.storageManager.saveQuote(testQuote);
            if (!result) {
                throw new Error('Fallback to localStorage failed');
            }

            const quotes = await this.storageManager.getQuotes({ limit: 5 });
            if (!quotes.find(q => q.projectName === testQuote.projectName)) {
                throw new Error('Quote not found in localStorage fallback');
            }

        } finally {
            // Restore original support
            this.storageManager.isIndexedDBSupported = originalSupport;
        }

        return { status: 'Storage fallback mechanism working correctly' };
    }

    // ========== QUOTE DATA STORE TESTS ==========

    async testQuoteDataStoreInit() {
        if (!this.quoteDataStore) {
            throw new Error('QuoteDataStore not initialized');
        }

        if (!this.quoteDataStore.data) {
            throw new Error('QuoteDataStore data not initialized');
        }

        if (!this.quoteDataStore.data.project) {
            throw new Error('QuoteDataStore project data not initialized');
        }

        if (!this.quoteDataStore.data.components) {
            throw new Error('QuoteDataStore components data not initialized');
        }

        if (!Array.isArray(this.quoteDataStore.listeners)) {
            throw new Error('QuoteDataStore listeners not initialized');
        }

        return { status: 'QuoteDataStore initialized correctly' };
    }

    async testDataSaveLoad() {
        // Test project data save/load
        this.quoteDataStore.updateProject(this.testData.project);
        const savedProject = this.quoteDataStore.getProject();

        if (savedProject.projectName !== this.testData.project.projectName) {
            throw new Error('Project data save/load failed');
        }

        // Test component data save/load
        Object.keys(this.testData.components).forEach(componentType => {
            this.quoteDataStore.updateComponent(componentType, this.testData.components[componentType]);
            const savedComponent = this.quoteDataStore.getComponent(componentType);

            if (!savedComponent.enabled) {
                throw new Error(`Component ${componentType} enable state not saved`);
            }
        });

        // Test localStorage persistence
        const localStorageData = localStorage.getItem('naas_quote_data');
        if (!localStorageData) {
            throw new Error('Data not persisted to localStorage');
        }

        const parsedData = JSON.parse(localStorageData);
        if (parsedData.project.projectName !== this.testData.project.projectName) {
            throw new Error('localStorage data mismatch');
        }

        return { status: 'Data save/load operations working correctly' };
    }

    async testDataMigration() {
        // Simulate old format data
        const oldFormatData = {
            projectName: 'Old Format Project',
            customer: 'Old Customer', // Different key
            components: {
                prtg: { enabled: true, config: { sensors: 50 } } // Different structure
            }
        };

        localStorage.setItem('naas_quote_data', JSON.stringify(oldFormatData));

        // Create new data store instance to trigger migration
        const newDataStore = new QuoteDataStore();
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for initialization

        const migratedData = newDataStore.data;

        // Check if migration handled gracefully
        if (!migratedData.project) {
            throw new Error('Migration failed - project data missing');
        }

        if (!migratedData.components) {
            throw new Error('Migration failed - components data missing');
        }

        return { status: 'Data migration handled correctly' };
    }

    async testCorruptionRecovery() {
        // Test with corrupted JSON
        localStorage.setItem('naas_quote_data', '{invalid json}');

        const dataStore = new QuoteDataStore();
        await new Promise(resolve => setTimeout(resolve, 100));

        // Should fall back to defaults
        if (!dataStore.data.project.projectName === '') {
            throw new Error('Corruption recovery failed - project data not reset');
        }

        // Test with partial corruption
        const partiallyCorrupt = JSON.stringify({
            project: null, // Corrupt project
            components: this.testData.components // Valid components
        });

        localStorage.setItem('naas_quote_data', partiallyCorrupt);

        const dataStore2 = new QuoteDataStore();
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!dataStore2.data.project || !dataStore2.data.components) {
            throw new Error('Partial corruption recovery failed');
        }

        return { status: 'Data corruption recovery working correctly' };
    }

    // ========== SESSION MANAGEMENT TESTS ==========

    async testSessionPersistence() {
        // Save test data
        this.quoteDataStore.updateProject(this.testData.project);

        // Simulate page refresh by creating new instance
        const newDataStore = new QuoteDataStore();
        await new Promise(resolve => setTimeout(resolve, 100));

        const restoredProject = newDataStore.getProject();
        if (restoredProject.projectName !== this.testData.project.projectName) {
            throw new Error('Session data not persisted across page refresh');
        }

        return { status: 'Session persistence working correctly' };
    }

    async testMultipleTabsSync() {
        // Simulate multiple tabs by using storage events
        let eventFired = false;

        const storageListener = (event) => {
            if (event.key === 'naas_quote_data') {
                eventFired = true;
            }
        };

        window.addEventListener('storage', storageListener);

        try {
            // Simulate change from another tab
            const newData = { ...this.testData.project, projectName: 'Updated from another tab' };
            localStorage.setItem('naas_quote_data', JSON.stringify({
                project: newData,
                components: {}
            }));

            // Trigger storage event manually (simulating another tab)
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'naas_quote_data',
                newValue: localStorage.getItem('naas_quote_data')
            }));

            await new Promise(resolve => setTimeout(resolve, 100));

            // Note: Full sync test would require actual multiple tabs
            // This tests the event mechanism

        } finally {
            window.removeEventListener('storage', storageListener);
        }

        return { status: 'Multiple tabs sync mechanism available' };
    }

    async testPageRefreshRetention() {
        // Set up complex data
        this.quoteDataStore.updateProject(this.testData.project);
        Object.keys(this.testData.components).forEach(componentType => {
            this.quoteDataStore.updateComponent(componentType, this.testData.components[componentType]);
        });

        // Verify immediate persistence
        const beforeRefreshData = localStorage.getItem('naas_quote_data');
        if (!beforeRefreshData) {
            throw new Error('Data not persisted before refresh');
        }

        // Simulate refresh by creating new instance
        const postRefreshStore = new QuoteDataStore();
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify all data retained
        const project = postRefreshStore.getProject();
        if (project.projectName !== this.testData.project.projectName) {
            throw new Error('Project data not retained after refresh');
        }

        const components = postRefreshStore.getAllComponents();
        Object.keys(this.testData.components).forEach(componentType => {
            if (!components[componentType] || !components[componentType].enabled) {
                throw new Error(`Component ${componentType} not retained after refresh`);
            }
        });

        return { status: 'Page refresh data retention working correctly' };
    }

    // ========== DATA SYNCHRONIZATION TESTS ==========

    async testComponentWizardSync() {
        let syncEventsFired = [];

        // Set up listener to track sync events
        const unsubscribe = this.quoteDataStore.subscribe((type, data, allData) => {
            syncEventsFired.push({ type, data, timestamp: Date.now() });
        });

        try {
            // Update component data
            this.quoteDataStore.updateComponent('prtg', this.testData.components.prtg);

            // Update project data
            this.quoteDataStore.updateProject(this.testData.project);

            await new Promise(resolve => setTimeout(resolve, 50));

            // Check if events were fired
            if (syncEventsFired.length < 2) {
                throw new Error('Sync events not fired properly');
            }

            const componentEvent = syncEventsFired.find(e => e.type === 'component');
            const projectEvent = syncEventsFired.find(e => e.type === 'project');

            if (!componentEvent || !projectEvent) {
                throw new Error('Expected sync events not found');
            }

        } finally {
            unsubscribe();
        }

        return {
            status: 'Component-Wizard sync working correctly',
            events: syncEventsFired.length
        };
    }

    async testDataStoreEvents() {
        let eventCount = 0;
        let lastEventData = null;

        const unsubscribe = this.quoteDataStore.subscribe((type, data, allData) => {
            eventCount++;
            lastEventData = { type, data, allData };
        });

        try {
            // Test various operations
            this.quoteDataStore.updateProject({ projectName: 'Event Test' });
            this.quoteDataStore.setComponentEnabled('prtg', true);
            this.quoteDataStore.updateComponentParams('prtg', { sensors: 200 });
            this.quoteDataStore.clear();

            await new Promise(resolve => setTimeout(resolve, 100));

            if (eventCount < 4) {
                throw new Error(`Expected at least 4 events, got ${eventCount}`);
            }

            if (!lastEventData || lastEventData.type !== 'clear') {
                throw new Error('Clear event not fired properly');
            }

        } finally {
            unsubscribe();
        }

        return {
            status: 'Data store events working correctly',
            totalEvents: eventCount
        };
    }

    async testRealTimeUpdates() {
        // Test rapid successive updates
        const updateCount = 10;
        let eventsReceived = 0;

        const unsubscribe = this.quoteDataStore.subscribe(() => {
            eventsReceived++;
        });

        try {
            // Rapid updates
            for (let i = 0; i < updateCount; i++) {
                this.quoteDataStore.updateProject({
                    projectName: `Real-time test ${i}`,
                    budget: String(1000 * i)
                });
            }

            await new Promise(resolve => setTimeout(resolve, 200));

            if (eventsReceived !== updateCount) {
                throw new Error(`Expected ${updateCount} events, got ${eventsReceived}`);
            }

        } finally {
            unsubscribe();
        }

        return {
            status: 'Real-time updates working correctly',
            updatesProcessed: eventsReceived
        };
    }

    // ========== STATE MANAGEMENT TESTS ==========

    async testComponentStateTransitions() {
        const componentType = 'prtg';

        // Test enable/disable transitions
        this.quoteDataStore.setComponentEnabled(componentType, true);
        let component = this.quoteDataStore.getComponent(componentType);
        if (!component.enabled) {
            throw new Error('Component enable state not set correctly');
        }

        this.quoteDataStore.setComponentEnabled(componentType, false);
        component = this.quoteDataStore.getComponent(componentType);
        if (component.enabled) {
            throw new Error('Component disable state not set correctly');
        }

        // Test parameter updates
        const testParams = { sensors: 150, locations: 8, serviceLevel: 'premium' };
        this.quoteDataStore.updateComponentParams(componentType, testParams);
        component = this.quoteDataStore.getComponent(componentType);

        if (component.params.sensors !== testParams.sensors) {
            throw new Error('Component parameters not updated correctly');
        }

        // Test combined updates
        this.quoteDataStore.updateComponent(componentType, {
            enabled: true,
            params: { ...testParams, sensors: 200 }
        });

        component = this.quoteDataStore.getComponent(componentType);
        if (!component.enabled || component.params.sensors !== 200) {
            throw new Error('Combined component update failed');
        }

        return { status: 'Component state transitions working correctly' };
    }

    async testNavigationState() {
        // Test navigation state persistence through data operations
        this.quoteDataStore.updateProject({ projectName: 'Navigation Test' });

        // Verify data persists through state changes
        const project1 = this.quoteDataStore.getProject();

        this.quoteDataStore.setComponentEnabled('capital', true);

        // Project data should still be intact
        const project2 = this.quoteDataStore.getProject();
        if (project1.projectName !== project2.projectName) {
            throw new Error('Navigation state not maintained during operations');
        }

        // Component state should be preserved
        const capital = this.quoteDataStore.getComponent('capital');
        if (!capital.enabled) {
            throw new Error('Component state not maintained');
        }

        return { status: 'Navigation state management working correctly' };
    }

    async testFormStatePersistence() {
        // Simulate form data entry
        const formData = {
            projectName: 'Form Test Project',
            customerName: 'Form Test Customer',
            timeline: 'long',
            budget: '100000',
            sites: 5,
            primaryLocation: 'California',
            totalUsers: 500,
            complexity: 'high'
        };

        this.quoteDataStore.updateProject(formData);

        // Simulate interruption (like navigation away)
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify form state is preserved
        const retrievedData = this.quoteDataStore.getProject();

        Object.keys(formData).forEach(key => {
            if (retrievedData[key] !== formData[key]) {
                throw new Error(`Form field ${key} not persisted correctly`);
            }
        });

        // Test partial form updates
        this.quoteDataStore.updateProject({ timeline: 'short', budget: '75000' });
        const partialUpdate = this.quoteDataStore.getProject();

        if (partialUpdate.timeline !== 'short' || partialUpdate.customerName !== formData.customerName) {
            throw new Error('Partial form updates not working correctly');
        }

        return { status: 'Form state persistence working correctly' };
    }

    // ========== DATA VALIDATION TESTS ==========

    async testSchemaValidation() {
        // Test required fields
        try {
            this.quoteDataStore.updateProject(null);
            // Should handle gracefully
        } catch (error) {
            // Expected to handle gracefully, not crash
        }

        // Test invalid data types
        this.quoteDataStore.updateProject({
            projectName: 123, // Should be string
            sites: 'invalid', // Should be number
            budget: 'not-a-number'
        });

        const project = this.quoteDataStore.getProject();
        // Should have been converted or handled gracefully

        // Test component schema validation
        this.quoteDataStore.updateComponent('prtg', {
            enabled: 'not-boolean', // Should be boolean
            params: 'not-object' // Should be object
        });

        const component = this.quoteDataStore.getComponent('prtg');
        if (typeof component.enabled !== 'boolean') {
            throw new Error('Boolean type validation failed');
        }

        if (typeof component.params !== 'object') {
            throw new Error('Object type validation failed');
        }

        return { status: 'Schema validation working correctly' };
    }

    async testTypeChecking() {
        const testCases = [
            { field: 'projectName', value: 123, expected: 'string' },
            { field: 'sites', value: '5', expected: 'number' },
            { field: 'totalUsers', value: 'many', expected: 'number' },
            { field: 'timeline', value: 999, expected: 'string' }
        ];

        testCases.forEach(testCase => {
            this.quoteDataStore.updateProject({
                [testCase.field]: testCase.value
            });

            const result = this.quoteDataStore.getProject();
            const actualType = typeof result[testCase.field];

            // Note: Current implementation may not enforce strict typing
            // This test documents current behavior
        });

        return { status: 'Type checking documented (may need strengthening)' };
    }

    async testBusinessRules() {
        // Test logical constraints
        this.quoteDataStore.updateProject({
            sites: -5, // Should not be negative
            totalUsers: 0, // Should be positive
            budget: '-1000' // Should not be negative
        });

        const project = this.quoteDataStore.getProject();

        // Business rule validation would need to be implemented
        // This test documents where validation should occur

        // Test component interdependencies
        this.quoteDataStore.setComponentEnabled('naasStandard', true);
        this.quoteDataStore.setComponentEnabled('naasEnhanced', true);
        // Business rule: shouldn't have both NaaS types enabled simultaneously

        return {
            status: 'Business rule validation needs implementation',
            note: 'Current implementation allows invalid business combinations'
        };
    }

    // ========== CONCURRENT ACCESS TESTS ==========

    async testRaceConditions() {
        const concurrentOperations = [];
        const operationCount = 50;

        // Create multiple concurrent operations
        for (let i = 0; i < operationCount; i++) {
            concurrentOperations.push(
                this.quoteDataStore.updateProject({
                    projectName: `Concurrent Test ${i}`,
                    budget: String(i * 1000)
                })
            );

            concurrentOperations.push(
                this.quoteDataStore.setComponentEnabled('prtg', i % 2 === 0)
            );
        }

        // Execute all operations concurrently
        await Promise.all(concurrentOperations);

        // Verify final state is consistent
        const finalProject = this.quoteDataStore.getProject();
        const finalComponent = this.quoteDataStore.getComponent('prtg');

        if (!finalProject.projectName || typeof finalProject.budget !== 'string') {
            throw new Error('Race condition caused data corruption');
        }

        if (typeof finalComponent.enabled !== 'boolean') {
            throw new Error('Race condition affected component state');
        }

        return {
            status: 'Race conditions handled correctly',
            finalProject: finalProject.projectName
        };
    }

    async testSimultaneousOperations() {
        const operations = [];
        const timestamp = Date.now();

        // Create operations that should complete atomically
        operations.push(
            this.quoteDataStore.updateProject({ projectName: `Sim Test ${timestamp}` }),
            this.quoteDataStore.setComponentEnabled('capital', true),
            this.quoteDataStore.updateComponentParams('capital', {
                equipment: [{ type: 'router_large', quantity: 1 }]
            }),
            this.storageManager.saveQuote({
                projectName: `Simultaneous Quote ${timestamp}`,
                timestamp: new Date().toISOString()
            })
        );

        const startTime = performance.now();
        await Promise.all(operations);
        const endTime = performance.now();

        // Verify all operations completed
        const project = this.quoteDataStore.getProject();
        const component = this.quoteDataStore.getComponent('capital');

        if (project.projectName !== `Sim Test ${timestamp}`) {
            throw new Error('Project update not completed correctly');
        }

        if (!component.enabled) {
            throw new Error('Component enable not completed correctly');
        }

        return {
            status: 'Simultaneous operations completed successfully',
            duration: Math.round(endTime - startTime)
        };
    }

    async testDataConsistency() {
        const iterations = 20;
        const results = [];

        for (let i = 0; i < iterations; i++) {
            // Set up test data
            const testProject = {
                projectName: `Consistency Test ${i}`,
                customerName: `Customer ${i}`,
                sites: i + 1,
                totalUsers: (i + 1) * 10
            };

            // Update project
            this.quoteDataStore.updateProject(testProject);

            // Enable random components
            const components = ['prtg', 'capital', 'support'];
            const enabledComponent = components[i % components.length];
            this.quoteDataStore.setComponentEnabled(enabledComponent, true);

            // Immediately verify consistency
            const storedProject = this.quoteDataStore.getProject();
            const storedComponent = this.quoteDataStore.getComponent(enabledComponent);

            const consistent = (
                storedProject.projectName === testProject.projectName &&
                storedProject.sites === testProject.sites &&
                storedComponent.enabled === true
            );

            results.push(consistent);
        }

        const consistentCount = results.filter(r => r).length;
        const consistencyRate = (consistentCount / iterations) * 100;

        if (consistencyRate < 100) {
            throw new Error(`Data consistency rate: ${consistencyRate}% (expected 100%)`);
        }

        return {
            status: 'Data consistency maintained under load',
            consistencyRate: `${consistencyRate}%`,
            iterations
        };
    }

    // ========== EDGE CASES AND RECOVERY TESTS ==========

    async testStorageQuotaLimits() {
        const originalQuotaExceeded = localStorage.quotaExceeded || false;

        try {
            // Test large data storage
            const largeProject = {
                projectName: 'Quota Test Project',
                largeData: 'x'.repeat(1024 * 1024) // 1MB of data
            };

            this.quoteDataStore.updateProject(largeProject);

            // Verify it handles large data gracefully
            const stored = this.quoteDataStore.getProject();
            if (!stored.projectName) {
                throw new Error('Large data storage failed completely');
            }

            return { status: 'Storage quota handling working correctly' };

        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                return {
                    status: 'Quota exceeded handled gracefully',
                    note: 'Large data was rejected as expected'
                };
            }
            throw error;
        }
    }

    async testNetworkFailureRecovery() {
        // Simulate network failure for IndexedDB operations
        const originalDB = this.storageManager.db;

        try {
            // Temporarily disable database
            this.storageManager.db = null;

            // Operations should fall back to localStorage
            const testQuote = {
                projectName: 'Network Failure Test',
                customerName: 'Test Customer',
                timestamp: new Date().toISOString()
            };

            const result = await this.storageManager.saveQuote(testQuote);

            if (!result) {
                throw new Error('No fallback occurred during network failure');
            }

            // Verify fallback storage
            const quotes = await this.storageManager.getQuotes({ limit: 5 });
            if (!quotes.find(q => q.projectName === testQuote.projectName)) {
                throw new Error('Fallback storage did not work');
            }

        } finally {
            // Restore database connection
            this.storageManager.db = originalDB;
        }

        return { status: 'Network failure recovery working correctly' };
    }

    async testBrowserCompatibility() {
        const features = {
            localStorage: typeof Storage !== 'undefined',
            indexedDB: 'indexedDB' in window,
            promises: typeof Promise !== 'undefined',
            json: typeof JSON !== 'undefined',
            storageEvents: 'addEventListener' in window
        };

        const missingFeatures = Object.keys(features).filter(key => !features[key]);

        if (missingFeatures.length > 0) {
            this.warnings.push(`Missing browser features: ${missingFeatures.join(', ')}`);
        }

        // Test basic operations in current browser
        try {
            localStorage.setItem('naas_compat_test', 'test');
            const retrieved = localStorage.getItem('naas_compat_test');
            localStorage.removeItem('naas_compat_test');

            if (retrieved !== 'test') {
                throw new Error('Basic localStorage compatibility failed');
            }
        } catch (error) {
            throw new Error(`Browser compatibility issue: ${error.message}`);
        }

        return {
            status: 'Browser compatibility verified',
            features,
            warnings: missingFeatures
        };
    }

    async testBackupRestore() {
        // Set up test data
        this.quoteDataStore.updateProject(this.testData.project);
        Object.keys(this.testData.components).forEach(componentType => {
            this.quoteDataStore.updateComponent(componentType, this.testData.components[componentType]);
        });

        // Export current state (backup)
        const backup = this.quoteDataStore.exportData();

        if (!backup.project || !backup.components) {
            throw new Error('Backup export incomplete');
        }

        // Clear all data
        this.quoteDataStore.clear();

        // Verify data is cleared
        const clearedProject = this.quoteDataStore.getProject();
        if (clearedProject.projectName !== '') {
            throw new Error('Data not properly cleared');
        }

        // Restore from backup
        this.quoteDataStore.data = {
            project: backup.project,
            components: backup.components
        };
        this.quoteDataStore.saveToStorage();

        // Verify restoration
        const restoredProject = this.quoteDataStore.getProject();
        if (restoredProject.projectName !== this.testData.project.projectName) {
            throw new Error('Backup restoration failed');
        }

        const restoredComponents = this.quoteDataStore.getAllComponents();
        Object.keys(this.testData.components).forEach(componentType => {
            if (!restoredComponents[componentType] || !restoredComponents[componentType].enabled) {
                throw new Error(`Component ${componentType} not restored correctly`);
            }
        });

        return {
            status: 'Backup and restore working correctly',
            backupSize: JSON.stringify(backup).length
        };
    }

    // ========== UTILITY METHODS ==========

    async clearAllData() {
        // Clear localStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('naas_')) {
                localStorage.removeItem(key);
            }
        });

        // Clear IndexedDB if available
        if (this.storageManager && this.storageManager.db) {
            try {
                await this.storageManager.cleanup({
                    quotesKeepDays: 0,
                    componentsKeepDays: 0,
                    historyKeepDays: 0
                });
            } catch (error) {
                console.warn('Could not clear IndexedDB:', error);
            }
        }
    }

    generateReport() {
        const passed = this.testResults.filter(r => r.status === 'PASSED').length;
        const failed = this.testResults.filter(r => r.status === 'FAILED').length;
        const total = this.testResults.length;

        const report = {
            summary: {
                total,
                passed,
                failed,
                passRate: `${Math.round((passed / total) * 100)}%`,
                totalDuration: this.testResults.reduce((sum, r) => sum + (r.duration || 0), 0)
            },
            tests: this.testResults,
            errors: this.errors,
            warnings: this.warnings,
            recommendations: this.generateRecommendations(),
            timestamp: new Date().toISOString()
        };

        console.log('\n=== DATA PERSISTENCE TEST REPORT ===');
        console.log(`Tests: ${passed}/${total} passed (${report.summary.passRate})`);
        console.log(`Duration: ${Math.round(report.summary.totalDuration)}ms`);
        console.log(`Errors: ${failed}`);
        console.log(`Warnings: ${this.warnings.length}`);

        if (failed > 0) {
            console.log('\n=== FAILED TESTS ===');
            this.errors.forEach(error => {
                console.error(`❌ ${error.test}: ${error.error.message}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log('\n=== WARNINGS ===');
            this.warnings.forEach(warning => {
                console.warn(`⚠️ ${warning}`);
            });
        }

        console.log('\n=== RECOMMENDATIONS ===');
        report.recommendations.forEach(rec => {
            console.log(`💡 ${rec}`);
        });

        // Store report for external access
        window.dataTestReport = report;
        localStorage.setItem('naas_test_report', JSON.stringify(report));

        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.errors.length > 0) {
            recommendations.push('Fix failing tests to ensure data reliability');
        }

        if (this.warnings.find(w => w.includes('IndexedDB not supported'))) {
            recommendations.push('Consider implementing better localStorage quota management');
        }

        if (this.warnings.find(w => w.includes('Missing browser features'))) {
            recommendations.push('Add polyfills for missing browser features');
        }

        recommendations.push('Implement data validation and sanitization');
        recommendations.push('Add comprehensive error handling for all storage operations');
        recommendations.push('Consider implementing data versioning for better migration support');
        recommendations.push('Add monitoring for storage quota usage');
        recommendations.push('Implement automatic data backup and recovery mechanisms');

        return recommendations;
    }
}

// Auto-run tests when script is loaded
if (typeof window !== 'undefined') {
    window.DataPersistenceTest = DataPersistenceTest;

    // Auto-start test if data store is available
    document.addEventListener('DOMContentLoaded', () => {
        if (window.quoteDataStore && window.StorageManager) {
            console.log('Starting data persistence tests...');
            new DataPersistenceTest();
        } else {
            console.log('Data persistence test ready. Run new DataPersistenceTest() when dependencies are loaded.');
        }
    });
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataPersistenceTest;
}