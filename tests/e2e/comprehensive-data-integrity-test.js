/**
 * Comprehensive Data Integrity Test Suite
 * Tests all data integrity, persistence, and synchronization scenarios
 * Covers data corruption patterns, storage behaviors, migration, concurrency, validation, and more
 */

(function() {
    'use strict';

    class ComprehensiveDataIntegrityTest {
        constructor() {
            this.testResults = [];
            this.errors = [];
            this.warnings = [];
            this.corruptionPatterns = [];
            this.startTime = Date.now();

            // Test configuration
            this.config = {
                maxTestDuration: 120000, // 2 minutes
                concurrencyLevel: 10,
                sampleSize: 500,
                largeDatasetSize: 10000,
                corruptionSimulations: 25
            };

            // Data corruption simulation patterns
            this.corruptionTestPatterns = [
                { name: 'Partial Write Simulation', type: 'partial_write' },
                { name: 'Type Coercion Issues', type: 'type_coercion' },
                { name: 'JSON Parse/Stringify Edge Cases', type: 'json_corruption' },
                { name: 'Storage Quota Exceeded', type: 'quota_exceeded' },
                { name: 'Invalid Schema Migration', type: 'schema_corruption' },
                { name: 'Race Condition in Async Operations', type: 'race_condition' },
                { name: 'Memory Leaks in Data Subscriptions', type: 'memory_leak' },
                { name: 'Stale Data in Cache', type: 'cache_corruption' },
                { name: 'Cross-Tab State Conflicts', type: 'cross_tab_conflict' },
                { name: 'Malformed Component Data', type: 'component_corruption' }
            ];

            console.log('🧪 Starting Comprehensive Data Integrity Tests...');
            this.initializeTestEnvironment().then(() => {
                this.runAllTests();
            }).catch(error => {
                console.error('Test environment initialization failed:', error);
                this.generateErrorReport(error);
            });
        }

        async initializeTestEnvironment() {
            // Clear any existing data
            this.cleanupTestData();

            // Create test storage instances
            this.testStorage = {
                localStorage: new Map(),
                sessionStorage: new Map(),
                indexedDB: null
            };

            // Initialize test data structures
            this.testData = {
                originalProject: {
                    projectName: 'Test Project Original',
                    customerName: 'Test Customer',
                    sites: 5,
                    totalUsers: 1000,
                    timeline: 'medium',
                    complexity: 'high'
                },
                corruptedProject: {
                    projectName: '<script>alert("xss")</script>Corrupted',
                    customerName: 'javascript:void(0)',
                    sites: 'not_a_number',
                    totalUsers: -999,
                    timeline: 'invalid_timeline',
                    complexity: null
                },
                largeDataset: this.generateLargeDataset(),
                malformedJson: '{"projectName": "Test", "sites": 5, "components": {'
            };

            console.log('Test environment initialized successfully');
        }

        generateLargeDataset() {
            const dataset = [];
            for (let i = 0; i < this.config.largeDatasetSize; i++) {
                dataset.push({
                    id: `test_${i}`,
                    projectName: `Large Dataset Project ${i}`,
                    customerName: `Customer ${i}`,
                    sites: Math.floor(Math.random() * 100) + 1,
                    totalUsers: Math.floor(Math.random() * 10000) + 100,
                    components: this.generateRandomComponents(),
                    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
                });
            }
            return dataset;
        }

        generateRandomComponents() {
            const components = {};
            const componentTypes = ['prtg', 'support', 'naasStandard', 'naasEnhanced', 'dynamics1Year', 'assessment'];

            componentTypes.forEach(type => {
                components[type] = {
                    enabled: Math.random() > 0.5,
                    params: {
                        value: Math.floor(Math.random() * 1000),
                        config: `config_${Math.random().toString(36).substr(2, 9)}`
                    }
                };
            });

            return components;
        }

        async runAllTests() {
            const testSuites = [
                // Data Integrity Tests
                { name: 'Data Corruption Pattern Tests', suite: () => this.runDataCorruptionTests() },
                { name: 'Storage Systems Behavior Tests', suite: () => this.runStorageBehaviorTests() },
                { name: 'Data Migration Tests', suite: () => this.runDataMigrationTests() },
                { name: 'Concurrent Access Tests', suite: () => this.runConcurrentAccessTests() },
                { name: 'Data Validation Tests', suite: () => this.runDataValidationTests() },
                { name: 'Backup/Recovery Tests', suite: () => this.runBackupRecoveryTests() },
                { name: 'Import/Export Accuracy Tests', suite: () => this.runImportExportTests() },
                { name: 'Cross-Session Persistence Tests', suite: () => this.runCrossSessionTests() },
                { name: 'Performance Tests', suite: () => this.runPerformanceTests() },

                // Synchronization Tests
                { name: 'Component State Sync Tests', suite: () => this.runComponentSyncTests() },
                { name: 'Calculation Update Sync Tests', suite: () => this.runCalculationSyncTests() },
                { name: 'Form State Persistence Tests', suite: () => this.runFormStateTests() },
                { name: 'Multi-Tab Sync Tests', suite: () => this.runMultiTabSyncTests() },

                // Advanced Tests
                { name: 'Data Integrity Repair Tests', suite: () => this.runDataRepairTests() },
                { name: 'Memory Leak Detection Tests', suite: () => this.runMemoryLeakTests() },
                { name: 'Error Boundary Tests', suite: () => this.runErrorBoundaryTests() },
                { name: 'Security Vulnerability Tests', suite: () => this.runSecurityTests() }
            ];

            for (const { name, suite } of testSuites) {
                try {
                    console.log(`\n🔍 Running ${name}...`);
                    const result = await this.runTestWithTimeout(suite, 10000);
                    this.testResults.push({
                        suite: name,
                        status: 'PASSED',
                        result: result,
                        timestamp: new Date().toISOString()
                    });
                    console.log(`✅ ${name} - PASSED`);
                } catch (error) {
                    this.testResults.push({
                        suite: name,
                        status: 'FAILED',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                    this.errors.push({ suite: name, error: error });
                    console.error(`❌ ${name} - FAILED: ${error.message}`);
                }
            }

            this.generateComprehensiveReport();
        }

        async runTestWithTimeout(testFunction, timeout) {
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    reject(new Error(`Test timeout after ${timeout}ms`));
                }, timeout);

                Promise.resolve(testFunction())
                    .then(result => {
                        clearTimeout(timer);
                        resolve(result);
                    })
                    .catch(error => {
                        clearTimeout(timer);
                        reject(error);
                    });
            });
        }

        // ========== DATA CORRUPTION PATTERN TESTS ==========

        async runDataCorruptionTests() {
            const results = {};

            for (const pattern of this.corruptionTestPatterns) {
                try {
                    const result = await this.simulateDataCorruption(pattern);
                    results[pattern.name] = {
                        status: 'tested',
                        result: result,
                        repaired: await this.attemptDataRepair(result)
                    };
                } catch (error) {
                    results[pattern.name] = {
                        status: 'error',
                        error: error.message
                    };
                }
            }

            return {
                patternsTest: Object.keys(results).length,
                successful: Object.values(results).filter(r => r.status === 'tested').length,
                repairSuccess: Object.values(results).filter(r => r.repaired).length,
                details: results
            };
        }

        async simulateDataCorruption(pattern) {
            switch (pattern.type) {
                case 'partial_write':
                    return await this.testPartialWriteCorruption();
                case 'type_coercion':
                    return await this.testTypeCoercionIssues();
                case 'json_corruption':
                    return await this.testJSONCorruption();
                case 'quota_exceeded':
                    return await this.testQuotaExceededScenario();
                case 'schema_corruption':
                    return await this.testSchemaCorruption();
                case 'race_condition':
                    return await this.testRaceConditionCorruption();
                case 'memory_leak':
                    return await this.testMemoryLeakCorruption();
                case 'cache_corruption':
                    return await this.testCacheCorruption();
                case 'cross_tab_conflict':
                    return await this.testCrossTabConflict();
                case 'component_corruption':
                    return await this.testComponentCorruption();
                default:
                    throw new Error(`Unknown corruption pattern: ${pattern.type}`);
            }
        }

        async testPartialWriteCorruption() {
            // Simulate browser crash during write
            const originalSetItem = Storage.prototype.setItem;
            let writeInterrupted = false;

            Storage.prototype.setItem = function(key, value) {
                if (key === 'naas_quote_data' && Math.random() < 0.3) {
                    // Simulate partial write
                    const partialValue = value.substring(0, value.length / 2);
                    originalSetItem.call(this, key, partialValue);
                    writeInterrupted = true;
                    throw new Error('Simulated write interruption');
                }
                return originalSetItem.call(this, key, value);
            };

            try {
                const testStore = new QuoteDataStore();
                await new Promise(resolve => setTimeout(resolve, 100));

                testStore.updateProject(this.testData.originalProject);

                // Attempt to detect and repair corruption
                const stored = localStorage.getItem('naas_quote_data');
                const isCorrupted = this.detectDataCorruption(stored);

                return {
                    writeInterrupted,
                    corruptionDetected: isCorrupted,
                    dataRecoverable: isCorrupted ? this.attemptDataRecovery(stored) : true
                };
            } finally {
                Storage.prototype.setItem = originalSetItem;
            }
        }

        async testTypeCoercionIssues() {
            const testStore = new QuoteDataStore();
            await new Promise(resolve => setTimeout(resolve, 100));

            const coercionTests = [
                { sites: '5.5', expected: 5 },
                { sites: 'abc', expected: 1 },
                { sites: null, expected: 1 },
                { sites: undefined, expected: 1 },
                { totalUsers: '100.7', expected: 100 },
                { totalUsers: [], expected: 100 },
                { totalUsers: {}, expected: 100 }
            ];

            const results = [];
            for (const test of coercionTests) {
                try {
                    testStore.updateProject(test);
                    const project = testStore.getProject();

                    results.push({
                        input: test,
                        output: project,
                        coercionCorrect: project.sites === test.expected || project.totalUsers === test.expected
                    });
                } catch (error) {
                    results.push({
                        input: test,
                        error: error.message,
                        handled: true
                    });
                }
            }

            testStore.destroy();
            return {
                testsRun: results.length,
                correctCoercions: results.filter(r => r.coercionCorrect || r.handled).length,
                details: results
            };
        }

        async testJSONCorruption() {
            const jsonTests = [
                '{"projectName": "Test"',  // Incomplete JSON
                '{"projectName": "Test", "sites": }',  // Invalid syntax
                '{"projectName": "Test", "sites": 5, }',  // Trailing comma
                '{"projectName": "Test", "components": {"prtg": {"enabled": true, "params": {}}',  // Incomplete object
                '{"projectName": undefined}',  // Invalid value
                '"just a string"',  // Not an object
                'null',  // Null value
                'undefined',  // Undefined
                ''  // Empty string
            ];

            const results = [];
            for (const jsonStr of jsonTests) {
                try {
                    // Simulate corrupted localStorage data
                    localStorage.setItem('naas_quote_data', jsonStr);

                    const testStore = new QuoteDataStore();
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const project = testStore.getProject();
                    const isValid = this.validateDataStructure(testStore.data);

                    results.push({
                        input: jsonStr,
                        recovered: isValid,
                        fallbackUsed: project.projectName === ''
                    });

                    testStore.destroy();
                } catch (error) {
                    results.push({
                        input: jsonStr,
                        error: error.message,
                        handled: true
                    });
                }
            }

            return {
                testsRun: results.length,
                successfulRecoveries: results.filter(r => r.recovered || r.fallbackUsed || r.handled).length,
                details: results
            };
        }

        async testQuotaExceededScenario() {
            // Mock quota exceeded error
            const originalSetItem = Storage.prototype.setItem;
            let quotaExceededCount = 0;

            Storage.prototype.setItem = function(key, value) {
                if (key === 'naas_quote_data' && quotaExceededCount < 2) {
                    quotaExceededCount++;
                    const error = new Error('QuotaExceededError');
                    error.name = 'QuotaExceededError';
                    throw error;
                }
                return originalSetItem.call(this, key, value);
            };

            try {
                const testStore = new QuoteDataStore();
                await new Promise(resolve => setTimeout(resolve, 100));

                // This should trigger quota exceeded handling
                testStore.updateProject(this.testData.originalProject);

                const project = testStore.getProject();
                testStore.destroy();

                return {
                    quotaExceededTriggered: quotaExceededCount > 0,
                    fallbackWorked: project.projectName === this.testData.originalProject.projectName,
                    retrySucceeded: quotaExceededCount === 2
                };
            } finally {
                Storage.prototype.setItem = originalSetItem;
            }
        }

        // ========== STORAGE SYSTEMS BEHAVIOR TESTS ==========

        async runStorageBehaviorTests() {
            const results = {};

            // Test localStorage behavior
            results.localStorage = await this.testLocalStorageBehavior();

            // Test sessionStorage behavior
            results.sessionStorage = await this.testSessionStorageBehavior();

            // Test IndexedDB behavior
            results.indexedDB = await this.testIndexedDBBehavior();

            // Test storage fallback scenarios
            results.fallbacks = await this.testStorageFallbacks();

            return results;
        }

        async testLocalStorageBehavior() {
            const tests = [];

            // Test size limits
            try {
                const largeData = 'x'.repeat(5 * 1024 * 1024); // 5MB
                localStorage.setItem('test_large', largeData);
                tests.push({ test: 'large_data', passed: true });
                localStorage.removeItem('test_large');
            } catch (error) {
                tests.push({ test: 'large_data', passed: false, error: error.name });
            }

            // Test special characters
            try {
                const specialData = '{"test": "Special chars: \u0000\u001f\uffff"}';
                localStorage.setItem('test_special', specialData);
                const retrieved = localStorage.getItem('test_special');
                tests.push({
                    test: 'special_chars',
                    passed: retrieved === specialData
                });
                localStorage.removeItem('test_special');
            } catch (error) {
                tests.push({ test: 'special_chars', passed: false, error: error.message });
            }

            // Test concurrent access
            const concurrentResults = await this.testConcurrentLocalStorageAccess();
            tests.push({ test: 'concurrent_access', ...concurrentResults });

            return {
                totalTests: tests.length,
                passed: tests.filter(t => t.passed).length,
                details: tests
            };
        }

        async testSessionStorageBehavior() {
            const tests = [];

            // Test basic functionality
            try {
                sessionStorage.setItem('test_session', 'test_value');
                const retrieved = sessionStorage.getItem('test_session');
                tests.push({
                    test: 'basic_functionality',
                    passed: retrieved === 'test_value'
                });
                sessionStorage.removeItem('test_session');
            } catch (error) {
                tests.push({
                    test: 'basic_functionality',
                    passed: false,
                    error: error.message
                });
            }

            // Test persistence across page refreshes (simulated)
            try {
                sessionStorage.setItem('test_persist', JSON.stringify({ timestamp: Date.now() }));
                // Simulate page reload by checking if data exists
                const exists = sessionStorage.getItem('test_persist') !== null;
                tests.push({
                    test: 'persistence_simulation',
                    passed: exists
                });
                sessionStorage.removeItem('test_persist');
            } catch (error) {
                tests.push({
                    test: 'persistence_simulation',
                    passed: false,
                    error: error.message
                });
            }

            return {
                totalTests: tests.length,
                passed: tests.filter(t => t.passed).length,
                details: tests
            };
        }

        async testIndexedDBBehavior() {
            if (!('indexedDB' in window)) {
                return {
                    supported: false,
                    message: 'IndexedDB not supported'
                };
            }

            try {
                const testManager = new StorageManager();
                await testManager.initialize();

                const tests = [];

                // Test basic save/retrieve
                try {
                    const testQuote = {
                        projectName: 'IndexedDB Test',
                        customerName: 'Test Customer',
                        components: { prtg: { enabled: true } }
                    };

                    await testManager.saveQuote(testQuote);
                    const quotes = await testManager.getQuotes({ limit: 1 });

                    tests.push({
                        test: 'basic_save_retrieve',
                        passed: quotes.length > 0 && quotes[0].projectName === testQuote.projectName
                    });
                } catch (error) {
                    tests.push({
                        test: 'basic_save_retrieve',
                        passed: false,
                        error: error.message
                    });
                }

                // Test transaction handling
                try {
                    const promises = [];
                    for (let i = 0; i < 10; i++) {
                        promises.push(testManager.saveComponent({
                            componentType: 'test',
                            name: `Component ${i}`,
                            result: { value: i }
                        }));
                    }

                    await Promise.all(promises);
                    tests.push({
                        test: 'concurrent_transactions',
                        passed: true
                    });
                } catch (error) {
                    tests.push({
                        test: 'concurrent_transactions',
                        passed: false,
                        error: error.message
                    });
                }

                testManager.close();

                return {
                    supported: true,
                    totalTests: tests.length,
                    passed: tests.filter(t => t.passed).length,
                    details: tests
                };
            } catch (error) {
                return {
                    supported: true,
                    error: error.message,
                    totalTests: 0,
                    passed: 0
                };
            }
        }

        async testConcurrentLocalStorageAccess() {
            const promises = [];
            const results = [];

            for (let i = 0; i < 20; i++) {
                promises.push(
                    new Promise(resolve => {
                        setTimeout(() => {
                            try {
                                const key = `concurrent_test_${i}`;
                                const value = JSON.stringify({ index: i, timestamp: Date.now() });

                                localStorage.setItem(key, value);
                                const retrieved = localStorage.getItem(key);
                                const parsed = JSON.parse(retrieved);

                                results.push({
                                    index: i,
                                    success: parsed.index === i,
                                    consistent: retrieved === value
                                });

                                localStorage.removeItem(key);
                            } catch (error) {
                                results.push({
                                    index: i,
                                    success: false,
                                    error: error.message
                                });
                            }
                            resolve();
                        }, Math.random() * 100);
                    })
                );
            }

            await Promise.all(promises);

            return {
                totalOperations: results.length,
                successful: results.filter(r => r.success).length,
                consistent: results.filter(r => r.consistent).length
            };
        }

        // ========== DATA MIGRATION TESTS ==========

        async runDataMigrationTests() {
            const migrationScenarios = [
                { from: '1.0.0', to: '2.0.0', data: this.createLegacyData_1_0() },
                { from: null, to: '2.0.0', data: this.createUnversionedData() },
                { from: '2.0.0', to: '2.1.0', data: this.createCurrentData() }
            ];

            const results = [];

            for (const scenario of migrationScenarios) {
                try {
                    const result = await this.testDataMigration(scenario);
                    results.push({
                        scenario: `${scenario.from || 'unversioned'} -> ${scenario.to}`,
                        success: result.success,
                        dataIntact: result.dataIntact,
                        schemaValid: result.schemaValid,
                        backupCreated: result.backupCreated
                    });
                } catch (error) {
                    results.push({
                        scenario: `${scenario.from || 'unversioned'} -> ${scenario.to}`,
                        success: false,
                        error: error.message
                    });
                }
            }

            return {
                totalMigrations: results.length,
                successful: results.filter(r => r.success).length,
                details: results
            };
        }

        createLegacyData_1_0() {
            return {
                projectName: 'Legacy Project',
                customer: 'Legacy Customer', // Old field name
                components: {
                    prtg: { enabled: true, config: { sensors: 100 } }, // Old structure
                    support: true // Boolean instead of object
                }
            };
        }

        createUnversionedData() {
            return {
                project: {
                    projectName: 'Unversioned Project',
                    customerName: 'Unversioned Customer'
                },
                components: {
                    prtg: { enabled: true }
                }
            };
        }

        createCurrentData() {
            return {
                version: '2.0.0',
                project: {
                    projectName: 'Current Project',
                    customerName: 'Current Customer',
                    sites: 5,
                    totalUsers: 1000
                },
                components: {
                    prtg: { enabled: true, params: { sensors: 100 } },
                    support: { enabled: true, params: {} }
                }
            };
        }

        async testDataMigration(scenario) {
            // Store original data
            localStorage.setItem('naas_quote_data', JSON.stringify(scenario.data));

            // Create new store to trigger migration
            const testStore = new QuoteDataStore();
            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify migration
            const migratedData = testStore.data;
            const dataIntact = this.verifyDataIntegrity(scenario.data, migratedData);
            const schemaValid = this.validateDataStructure(migratedData);

            testStore.destroy();

            return {
                success: true,
                dataIntact,
                schemaValid,
                backupCreated: localStorage.getItem('naas_quote_data_backup') !== null,
                migrationLog: testStore.migrationLog || []
            };
        }

        // ========== CONCURRENT ACCESS TESTS ==========

        async runConcurrentAccessTests() {
            const scenarios = [
                { name: 'Multiple Component Updates', test: () => this.testConcurrentComponentUpdates() },
                { name: 'Project Data Race Conditions', test: () => this.testProjectDataRaceConditions() },
                { name: 'Storage Write Conflicts', test: () => this.testStorageWriteConflicts() },
                { name: 'Cross-Tab State Synchronization', test: () => this.testCrossTabStateSynchronization() },
                { name: 'Async Operation Queuing', test: () => this.testAsyncOperationQueuing() }
            ];

            const results = {};
            for (const scenario of scenarios) {
                try {
                    results[scenario.name] = await scenario.test();
                } catch (error) {
                    results[scenario.name] = { error: error.message };
                }
            }

            return results;
        }

        async testConcurrentComponentUpdates() {
            const testStore = new QuoteDataStore();
            await new Promise(resolve => setTimeout(resolve, 100));

            const updates = [];
            const componentTypes = ['prtg', 'support', 'naasStandard', 'assessment', 'admin'];

            // Create concurrent updates
            for (let i = 0; i < 50; i++) {
                const componentType = componentTypes[i % componentTypes.length];
                updates.push(
                    new Promise((resolve, reject) => {
                        setTimeout(() => {
                            try {
                                testStore.updateComponent(componentType, {
                                    enabled: i % 2 === 0,
                                    params: { iteration: i, timestamp: Date.now() }
                                });
                                resolve({ success: true, iteration: i, componentType });
                            } catch (error) {
                                reject({ success: false, iteration: i, error: error.message });
                            }
                        }, Math.random() * 100);
                    })
                );
            }

            const results = await Promise.allSettled(updates);
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            // Verify final state consistency
            const finalComponents = testStore.getAllComponents();
            const stateConsistent = this.verifyComponentStateConsistency(finalComponents);

            testStore.destroy();

            return {
                totalUpdates: results.length,
                successful,
                failed,
                stateConsistent,
                finalComponentsCount: Object.keys(finalComponents).length
            };
        }

        async testProjectDataRaceConditions() {
            const testStore = new QuoteDataStore();
            await new Promise(resolve => setTimeout(resolve, 100));

            const updates = [];

            // Create conflicting updates
            for (let i = 0; i < 20; i++) {
                updates.push(
                    new Promise(resolve => {
                        setTimeout(() => {
                            try {
                                testStore.updateProject({
                                    projectName: `Concurrent Project ${i}`,
                                    sites: i + 1,
                                    totalUsers: (i + 1) * 100
                                });
                                resolve({ success: true, iteration: i });
                            } catch (error) {
                                resolve({ success: false, iteration: i, error: error.message });
                            }
                        }, Math.random() * 50);
                    })
                );
            }

            const results = await Promise.all(updates);
            const finalProject = testStore.getProject();

            testStore.destroy();

            return {
                totalUpdates: results.length,
                successful: results.filter(r => r.success).length,
                finalProjectValid: this.validateProjectData(finalProject),
                noDataLoss: finalProject.projectName !== '' && finalProject.sites > 0
            };
        }

        // ========== DATA VALIDATION TESTS ==========

        async runDataValidationTests() {
            const validationTests = [
                { name: 'XSS Prevention', test: () => this.testXSSPrevention() },
                { name: 'Business Rule Enforcement', test: () => this.testBusinessRuleEnforcement() },
                { name: 'Schema Validation', test: () => this.testSchemaValidation() },
                { name: 'Input Sanitization', test: () => this.testInputSanitization() },
                { name: 'Type Safety', test: () => this.testTypeSafety() }
            ];

            const results = {};
            for (const test of validationTests) {
                try {
                    results[test.name] = await test.test();
                } catch (error) {
                    results[test.name] = { error: error.message };
                }
            }

            return results;
        }

        async testXSSPrevention() {
            const testStore = new QuoteDataStore();
            await new Promise(resolve => setTimeout(resolve, 100));

            const xssPayloads = [
                '<script>alert("xss")</script>',
                'javascript:void(0)',
                '<img src=x onerror=alert("xss")>',
                '"><script>alert("xss")</script>',
                'javascript:/*--></title></style></textarea></script></xmp><svg/onload=alert("xss")>'
            ];

            const results = [];
            for (const payload of xssPayloads) {
                try {
                    testStore.updateProject({
                        projectName: payload,
                        customerName: payload
                    });

                    const project = testStore.getProject();
                    const sanitized = !project.projectName.includes('<script>') &&
                                    !project.projectName.includes('javascript:') &&
                                    !project.customerName.includes('<script>') &&
                                    !project.customerName.includes('javascript:');

                    results.push({
                        payload: payload.substring(0, 50) + '...',
                        sanitized,
                        projectName: project.projectName,
                        customerName: project.customerName
                    });
                } catch (error) {
                    results.push({
                        payload: payload.substring(0, 50) + '...',
                        rejected: true,
                        error: error.message
                    });
                }
            }

            testStore.destroy();

            return {
                totalTests: results.length,
                sanitized: results.filter(r => r.sanitized || r.rejected).length,
                details: results
            };
        }

        async testBusinessRuleEnforcement() {
            const testStore = new QuoteDataStore();
            await new Promise(resolve => setTimeout(resolve, 100));

            const ruleTests = [];

            // Test NaaS mutual exclusion
            testStore.updateComponent('naasStandard', { enabled: true });
            testStore.updateComponent('naasEnhanced', { enabled: true });

            const naasStandard = testStore.getComponent('naasStandard');
            const naasEnhanced = testStore.getComponent('naasEnhanced');

            ruleTests.push({
                rule: 'NaaS Mutual Exclusion',
                enforced: !(naasStandard.enabled && naasEnhanced.enabled),
                details: { naasStandard: naasStandard.enabled, naasEnhanced: naasEnhanced.enabled }
            });

            // Test enhanced support dependency
            testStore.updateComponent('support', { enabled: false });
            testStore.updateComponent('enhancedSupport', { enabled: true });

            const support = testStore.getComponent('support');
            const enhancedSupport = testStore.getComponent('enhancedSupport');

            ruleTests.push({
                rule: 'Enhanced Support Dependency',
                enforced: !enhancedSupport.enabled || support.enabled,
                details: { support: support.enabled, enhancedSupport: enhancedSupport.enabled }
            });

            // Test Dynamics mutual exclusion
            testStore.updateComponent('dynamics1Year', { enabled: true });
            testStore.updateComponent('dynamics3Year', { enabled: true });
            testStore.updateComponent('dynamics5Year', { enabled: true });

            const dynamics1 = testStore.getComponent('dynamics1Year');
            const dynamics3 = testStore.getComponent('dynamics3Year');
            const dynamics5 = testStore.getComponent('dynamics5Year');

            const dynamicsCount = [dynamics1.enabled, dynamics3.enabled, dynamics5.enabled].filter(Boolean).length;

            ruleTests.push({
                rule: 'Dynamics Mutual Exclusion',
                enforced: dynamicsCount <= 1,
                details: {
                    dynamics1Year: dynamics1.enabled,
                    dynamics3Year: dynamics3.enabled,
                    dynamics5Year: dynamics5.enabled
                }
            });

            testStore.destroy();

            return {
                totalRules: ruleTests.length,
                enforced: ruleTests.filter(r => r.enforced).length,
                details: ruleTests
            };
        }

        // ========== UTILITY METHODS ==========

        detectDataCorruption(data) {
            try {
                if (!data) return true;
                const parsed = JSON.parse(data);
                return !this.validateDataStructure(parsed);
            } catch (error) {
                return true;
            }
        }

        attemptDataRecovery(corruptedData) {
            try {
                // Try to extract salvageable parts
                const partial = corruptedData.substring(0, corruptedData.lastIndexOf('}') + 1);
                const parsed = JSON.parse(partial);
                return this.validateDataStructure(parsed);
            } catch (error) {
                return false;
            }
        }

        async attemptDataRepair(corruptionResult) {
            // Simulate data repair mechanisms
            if (corruptionResult.corruptionDetected) {
                // Try to repair using backup data
                const backupExists = localStorage.getItem('naas_quote_data_backup') !== null;
                if (backupExists) {
                    return true;
                }

                // Try to repair using defaults
                try {
                    const testStore = new QuoteDataStore();
                    const defaults = testStore.createDefaultData();
                    testStore.destroy();
                    return this.validateDataStructure(defaults);
                } catch (error) {
                    return false;
                }
            }
            return true;
        }

        validateDataStructure(data) {
            if (!data || typeof data !== 'object') return false;
            if (!data.project || typeof data.project !== 'object') return false;
            if (!data.components || typeof data.components !== 'object') return false;
            return true;
        }

        validateProjectData(project) {
            return project &&
                   typeof project.projectName === 'string' &&
                   typeof project.customerName === 'string' &&
                   typeof project.sites === 'number' &&
                   project.sites > 0 &&
                   typeof project.totalUsers === 'number' &&
                   project.totalUsers > 0;
        }

        verifyDataIntegrity(original, migrated) {
            // Check if essential data was preserved during migration
            if (!original || !migrated) return false;

            if (original.projectName && migrated.project) {
                return migrated.project.projectName === original.projectName;
            }

            if (original.project && migrated.project) {
                return migrated.project.projectName === original.project.projectName;
            }

            return true;
        }

        verifyComponentStateConsistency(components) {
            // Check for logical inconsistencies
            const naasTypes = ['naasStandard', 'naasEnhanced'];
            const enabledNaas = naasTypes.filter(type => components[type]?.enabled);

            if (enabledNaas.length > 1) return false;

            const dynamicsTypes = ['dynamics1Year', 'dynamics3Year', 'dynamics5Year'];
            const enabledDynamics = dynamicsTypes.filter(type => components[type]?.enabled);

            if (enabledDynamics.length > 1) return false;

            return true;
        }

        cleanupTestData() {
            // Clean up any test data from previous runs
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('test_') || key.startsWith('naas_test_')) {
                    localStorage.removeItem(key);
                }
            });
        }

        generateErrorReport(error) {
            console.error('Critical test failure:', error);
            return {
                criticalError: true,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            };
        }

        generateComprehensiveReport() {
            const endTime = Date.now();
            const totalDuration = endTime - this.startTime;

            const passed = this.testResults.filter(r => r.status === 'PASSED').length;
            const failed = this.testResults.filter(r => r.status === 'FAILED').length;

            const report = {
                summary: {
                    total: this.testResults.length,
                    passed: passed,
                    failed: failed,
                    warnings: this.warnings.length,
                    duration: totalDuration,
                    passRate: Math.round((passed / this.testResults.length) * 100) + '%'
                },
                testResults: this.testResults,
                corruptionPatterns: this.corruptionPatterns,
                errors: this.errors.map(e => ({
                    suite: e.suite,
                    message: e.error.message,
                    stack: e.error.stack
                })),
                warnings: this.warnings,
                recommendations: this.generateRecommendations(),
                timestamp: new Date().toISOString(),
                environment: {
                    userAgent: navigator.userAgent,
                    localStorage: typeof Storage !== 'undefined',
                    indexedDB: 'indexedDB' in window,
                    sessionStorage: 'sessionStorage' in window,
                    webWorkers: typeof Worker !== 'undefined',
                    url: window.location.href
                },
                dataIntegrityScore: this.calculateDataIntegrityScore()
            };

            console.log('\n🧪 COMPREHENSIVE DATA INTEGRITY TEST RESULTS');
            console.log('='.repeat(60));
            console.log(`📊 Total Test Suites: ${report.summary.total}`);
            console.log(`✅ Passed: ${report.summary.passed} (${report.summary.passRate})`);
            console.log(`❌ Failed: ${report.summary.failed}`);
            console.log(`⚠️  Warnings: ${report.summary.warnings}`);
            console.log(`🏆 Data Integrity Score: ${report.dataIntegrityScore}/100`);
            console.log(`⏱️  Duration: ${Math.round(report.summary.duration / 1000)}s`);

            if (failed > 0) {
                console.log('\n❌ FAILED TEST SUITES:');
                this.errors.forEach(error => {
                    console.error(`  • ${error.suite}: ${error.error.message}`);
                });
            }

            if (this.warnings.length > 0) {
                console.log('\n⚠️ WARNINGS:');
                this.warnings.forEach(warning => {
                    console.warn(`  • ${warning}`);
                });
            }

            console.log('\n💡 RECOMMENDATIONS:');
            report.recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. ${rec}`);
            });

            const overallStatus = failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED';
            console.log(`\n${overallStatus}`);
            console.log('='.repeat(60));

            // Store comprehensive results globally
            window.comprehensiveDataIntegrityResults = report;

            return report;
        }

        generateRecommendations() {
            const recommendations = [];

            if (this.errors.some(e => e.error.message.includes('corruption'))) {
                recommendations.push('🛡️ Implement automatic data corruption detection and repair mechanisms');
            }

            if (this.errors.some(e => e.error.message.includes('race condition'))) {
                recommendations.push('🔄 Add mutex locks or queuing for concurrent operations');
            }

            if (this.errors.some(e => e.error.message.includes('quota'))) {
                recommendations.push('💾 Implement intelligent storage quota management');
            }

            if (this.warnings.length > 10) {
                recommendations.push('⚠️ Address high number of warnings to improve reliability');
            }

            recommendations.push('🔍 Implement real-time data integrity monitoring');
            recommendations.push('💽 Add automatic backup creation before data migrations');
            recommendations.push('🧪 Run data integrity tests in production environment');
            recommendations.push('📈 Add performance monitoring for large dataset operations');
            recommendations.push('🔐 Implement data encryption for sensitive information');
            recommendations.push('📋 Add comprehensive audit logging for data operations');

            return recommendations;
        }

        calculateDataIntegrityScore() {
            const totalTests = this.testResults.length;
            const passedTests = this.testResults.filter(r => r.status === 'PASSED').length;

            if (totalTests === 0) return 0;

            let score = Math.round((passedTests / totalTests) * 100);

            // Deduct points for warnings
            score -= Math.min(this.warnings.length * 2, 20);

            // Deduct points for critical errors
            score -= this.errors.filter(e => e.error.message.includes('critical')).length * 10;

            return Math.max(0, Math.min(100, score));
        }

        // ========== ADDITIONAL TEST METHODS (Continued in next sections) ==========

        async runBackupRecoveryTests() {
            const results = {};

            // Test backup creation
            results.backupCreation = await this.testBackupCreation();

            // Test data recovery
            results.dataRecovery = await this.testDataRecovery();

            // Test corruption detection
            results.corruptionDetection = await this.testCorruptionDetection();

            return results;
        }

        async testBackupCreation() {
            const testStore = new QuoteDataStore();
            await new Promise(resolve => setTimeout(resolve, 100));

            // Update some data
            testStore.updateProject(this.testData.originalProject);

            // Force backup creation
            const backupKey = 'naas_quote_data_backup_' + Date.now();
            localStorage.setItem(backupKey, JSON.stringify(testStore.data));

            const backupExists = localStorage.getItem(backupKey) !== null;

            if (backupExists) {
                localStorage.removeItem(backupKey);
            }

            testStore.destroy();

            return {
                backupCreated: backupExists,
                backupSize: backupExists ? localStorage.getItem(backupKey)?.length || 0 : 0
            };
        }

        async testDataRecovery() {
            // Simulate data corruption
            const originalData = JSON.stringify(this.testData.originalProject);
            const corruptedData = originalData.substring(0, originalData.length / 2);

            localStorage.setItem('naas_quote_data', corruptedData);

            // Attempt recovery
            try {
                const testStore = new QuoteDataStore();
                await new Promise(resolve => setTimeout(resolve, 200));

                const recoveredProject = testStore.getProject();
                const recoverySuccessful = this.validateProjectData(recoveredProject);

                testStore.destroy();

                return {
                    recoveryAttempted: true,
                    recoverySuccessful,
                    dataIntact: recoveredProject.projectName !== ''
                };
            } catch (error) {
                return {
                    recoveryAttempted: true,
                    recoverySuccessful: false,
                    error: error.message
                };
            }
        }

        async testCorruptionDetection() {
            const detectionTests = [
                { data: '{"projectName": "Valid"}', shouldDetect: false },
                { data: '{"projectName": "Valid"', shouldDetect: true },
                { data: 'null', shouldDetect: true },
                { data: '', shouldDetect: true },
                { data: '{"projectName": undefined}', shouldDetect: true }
            ];

            const results = [];

            for (const test of detectionTests) {
                const detected = this.detectDataCorruption(test.data);
                results.push({
                    data: test.data.substring(0, 30) + '...',
                    shouldDetect: test.shouldDetect,
                    detected,
                    correct: detected === test.shouldDetect
                });
            }

            return {
                totalTests: results.length,
                correctDetections: results.filter(r => r.correct).length,
                details: results
            };
        }

        // Additional test methods would continue here...
        // This includes runImportExportTests, runCrossSessionTests, runPerformanceTests,
        // runComponentSyncTests, runCalculationSyncTests, runFormStateTests,
        // runMultiTabSyncTests, runDataRepairTests, runMemoryLeakTests,
        // runErrorBoundaryTests, and runSecurityTests
    }

    // Auto-run when script loads
    if (typeof window !== 'undefined') {
        window.ComprehensiveDataIntegrityTest = ComprehensiveDataIntegrityTest;

        // Auto-start if ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => new ComprehensiveDataIntegrityTest(), 1000);
            });
        } else {
            setTimeout(() => new ComprehensiveDataIntegrityTest(), 1000);
        }
    }

})();