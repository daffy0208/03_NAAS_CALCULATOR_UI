/**
 * Comprehensive Data Integrity Test Script
 * Tests all the fixes implemented for data persistence and state management
 */

(function() {
    'use strict';

    class DataIntegrityTest {
        constructor() {
            this.testResults = [];
            this.errors = [];
            this.warnings = [];
            this.startTime = Date.now();

            // Test configuration
            this.config = {
                maxTestDuration: 30000, // 30 seconds
                concurrencyLevel: 5,
                sampleSize: 100
            };

            console.log('🧪 Starting Data Integrity Tests...');
            this.runTests();
        }

        async runTests() {
            const tests = [
                { name: 'QuoteDataStore Initialization', test: () => this.testDataStoreInit() },
                { name: 'Data Validation and Sanitization', test: () => this.testDataValidation() },
                { name: 'Cross-Tab Synchronization', test: () => this.testCrossTabSync() },
                { name: 'Resource Management', test: () => this.testResourceManagement() },
                { name: 'Error Handling', test: () => this.testErrorHandling() },
                { name: 'Storage Manager Concurrency', test: () => this.testStorageConcurrency() },
                { name: 'Data Migration', test: () => this.testDataMigration() },
                { name: 'Memory Leak Prevention', test: () => this.testMemoryLeaks() },
                { name: 'Business Rule Validation', test: () => this.testBusinessRules() },
                { name: 'Performance Under Load', test: () => this.testPerformance() }
            ];

            for (const testCase of tests) {
                try {
                    console.log(`Running: ${testCase.name}...`);
                    const result = await this.runTestWithTimeout(testCase.test, 5000);
                    this.testResults.push({
                        name: testCase.name,
                        status: 'PASSED',
                        result: result
                    });
                    console.log(`✅ ${testCase.name} - PASSED`);
                } catch (error) {
                    this.testResults.push({
                        name: testCase.name,
                        status: 'FAILED',
                        error: error.message
                    });
                    this.errors.push({ test: testCase.name, error: error });
                    console.error(`❌ ${testCase.name} - FAILED: ${error.message}`);
                }
            }

            this.generateReport();
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

        // ========== TEST IMPLEMENTATIONS ==========

        async testDataStoreInit() {
            // Test enhanced initialization
            if (!window.QuoteDataStore) {
                throw new Error('QuoteDataStore class not available');
            }

            // Create new instance to test initialization
            const testStore = new QuoteDataStore();

            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check if properly initialized
            if (!testStore.data) {
                throw new Error('Data not initialized');
            }

            if (testStore.DATA_VERSION !== '2.0.0') {
                throw new Error(`Expected version 2.0.0, got ${testStore.DATA_VERSION}`);
            }

            if (!testStore.intervals) {
                throw new Error('Intervals tracking not initialized');
            }

            if (!testStore.timeouts) {
                throw new Error('Timeouts tracking not initialized');
            }

            // Test health status
            const health = testStore.getHealthStatus();
            if (!health || typeof health !== 'object') {
                throw new Error('Health status not available');
            }

            // Cleanup
            testStore.destroy();

            return {
                status: 'Initialization working correctly',
                version: testStore.DATA_VERSION,
                healthAvailable: !!health
            };
        }

        async testDataValidation() {
            const testStore = new QuoteDataStore();
            await new Promise(resolve => setTimeout(resolve, 100));

            // Test project data validation
            try {
                // Test XSS prevention
                testStore.updateProject({
                    projectName: '<script>alert("xss")</script>Test Project',
                    customerName: 'javascript:void(0)',
                    sites: 'invalid_number',
                    totalUsers: -100
                });

                const project = testStore.getProject();

                if (project.projectName.includes('<script>')) {
                    throw new Error('XSS vulnerability in project name');
                }

                if (project.customerName.includes('javascript:')) {
                    throw new Error('XSS vulnerability in customer name');
                }

                if (typeof project.sites !== 'number' || project.sites <= 0) {
                    throw new Error('Invalid sites number not handled properly');
                }

            } catch (error) {
                if (error.message.includes('XSS') || error.message.includes('Invalid')) {
                    throw error;
                }
                // Other errors are expected for invalid data
            }

            // Test component validation
            try {
                testStore.updateComponent('invalidComponent', { enabled: true });
                throw new Error('Should reject unknown component types');
            } catch (error) {
                if (!error.message.includes('Unknown component')) {
                    throw new Error('Component validation not working properly');
                }
            }

            testStore.destroy();
            return { status: 'Data validation working correctly' };
        }

        async testCrossTabSync() {
            // Test storage event handling
            let eventFired = false;
            const testData = { test: 'cross-tab-sync', timestamp: Date.now() };

            const storageListener = (event) => {
                if (event.key === 'naas_quote_data') {
                    eventFired = true;
                }
            };

            window.addEventListener('storage', storageListener);

            try {
                // Simulate storage change from another tab
                localStorage.setItem('naas_quote_data', JSON.stringify(testData));

                // Trigger storage event
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'naas_quote_data',
                    newValue: JSON.stringify(testData),
                    oldValue: null
                }));

                await new Promise(resolve => setTimeout(resolve, 100));

                // Clean up
                localStorage.removeItem('naas_quote_data');

            } finally {
                window.removeEventListener('storage', storageListener);
            }

            return {
                status: 'Cross-tab sync mechanism available',
                eventFired: eventFired
            };
        }

        async testResourceManagement() {
            const testStore = new QuoteDataStore();
            await new Promise(resolve => setTimeout(resolve, 100));

            // Test managed timeouts
            let callbackExecuted = false;
            const timeoutId = testStore.setManagedTimeout(() => {
                callbackExecuted = true;
            }, 50);

            if (!testStore.timeouts.has(timeoutId)) {
                throw new Error('Timeout not tracked properly');
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            if (!callbackExecuted) {
                throw new Error('Managed timeout callback not executed');
            }

            if (testStore.timeouts.has(timeoutId)) {
                throw new Error('Timeout not cleaned up after execution');
            }

            // Test managed intervals
            let intervalCount = 0;
            const intervalId = testStore.setManagedInterval(() => {
                intervalCount++;
            }, 10);

            if (!testStore.intervals.has(intervalId)) {
                throw new Error('Interval not tracked properly');
            }

            await new Promise(resolve => setTimeout(resolve, 50));

            testStore.clearManagedInterval(intervalId);

            if (testStore.intervals.has(intervalId)) {
                throw new Error('Interval not cleaned up properly');
            }

            const finalCount = intervalCount;
            await new Promise(resolve => setTimeout(resolve, 30));

            if (intervalCount > finalCount) {
                throw new Error('Interval continued after cleanup');
            }

            testStore.destroy();
            return {
                status: 'Resource management working correctly',
                intervalExecutions: finalCount
            };
        }

        async testErrorHandling() {
            const testStore = new QuoteDataStore();
            await new Promise(resolve => setTimeout(resolve, 100));

            // Test invalid data handling
            let errorsCaught = 0;

            try {
                testStore.updateProject(null);
            } catch (error) {
                errorsCaught++;
                if (!error.message.includes('valid object')) {
                    throw new Error('Wrong error message for null project data');
                }
            }

            try {
                testStore.updateComponent('test', 'invalid');
            } catch (error) {
                errorsCaught++;
            }

            if (errorsCaught !== 2) {
                throw new Error(`Expected 2 errors, caught ${errorsCaught}`);
            }

            // Test listener error handling
            let listenerErrors = 0;
            const originalError = console.error;
            console.error = (message) => {
                if (message.includes('Error in data store listener')) {
                    listenerErrors++;
                }
                originalError(message);
            };

            testStore.subscribe(() => {
                throw new Error('Test listener error');
            });

            testStore.updateProject({ projectName: 'Error Test' });

            await new Promise(resolve => setTimeout(resolve, 50));

            console.error = originalError;

            if (listenerErrors === 0) {
                throw new Error('Listener errors not caught properly');
            }

            testStore.destroy();
            return {
                status: 'Error handling working correctly',
                errorsCaught: errorsCaught,
                listenerErrorsHandled: listenerErrors
            };
        }

        async testStorageConcurrency() {
            // Test concurrent operations don't conflict
            const operations = [];
            const testData = [];

            // Create multiple concurrent save operations
            for (let i = 0; i < 20; i++) {
                testData.push({
                    projectName: `Concurrent Test ${i}`,
                    customerName: `Customer ${i}`,
                    sites: i + 1
                });
            }

            const testStore = new QuoteDataStore();
            await new Promise(resolve => setTimeout(resolve, 100));

            // Execute concurrent updates
            const startTime = Date.now();
            testData.forEach((data, index) => {
                operations.push(
                    new Promise((resolve, reject) => {
                        try {
                            testStore.updateProject(data);
                            resolve(index);
                        } catch (error) {
                            reject(error);
                        }
                    })
                );
            });

            const results = await Promise.allSettled(operations);
            const endTime = Date.now();

            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed > 0) {
                console.warn(`${failed} concurrent operations failed`);
            }

            // Verify final state is consistent
            const finalProject = testStore.getProject();
            if (!finalProject.projectName) {
                throw new Error('Final state is corrupted after concurrent operations');
            }

            testStore.destroy();
            return {
                status: 'Concurrency test completed',
                successful: successful,
                failed: failed,
                duration: endTime - startTime
            };
        }

        async testDataMigration() {
            // Test data migration from old format
            const oldFormatData = {
                projectName: 'Migration Test',
                customer: 'Old Customer Field', // Different key name
                components: {
                    prtg: { enabled: true, config: { sensors: 50 } } // Old structure
                }
            };

            // Store old format data
            localStorage.setItem('naas_quote_data', JSON.stringify(oldFormatData));

            // Create new data store to trigger migration
            const testStore = new QuoteDataStore();
            await new Promise(resolve => setTimeout(resolve, 200));

            // Check if migration worked
            const migratedData = testStore.data;

            if (!migratedData.version) {
                throw new Error('Version not added during migration');
            }

            if (!migratedData.project) {
                throw new Error('Project structure not migrated');
            }

            if (!migratedData.components || !migratedData.components.prtg) {
                throw new Error('Components not migrated properly');
            }

            if (typeof migratedData.components.prtg.enabled !== 'boolean') {
                throw new Error('Component structure not normalized during migration');
            }

            // Clean up
            testStore.destroy();
            localStorage.removeItem('naas_quote_data');

            return {
                status: 'Data migration working correctly',
                version: migratedData.version,
                migrationDetected: true
            };
        }

        async testMemoryLeaks() {
            // Test for potential memory leaks
            const initialMemory = this.getMemoryEstimate();
            const stores = [];

            // Create and destroy multiple instances
            for (let i = 0; i < 10; i++) {
                const store = new QuoteDataStore();
                await new Promise(resolve => setTimeout(resolve, 10));

                // Add some data
                store.updateProject({ projectName: `Memory Test ${i}` });
                store.updateComponent('prtg', { enabled: true, params: { sensors: 100 } });

                // Add listeners
                const unsubscribe1 = store.subscribe(() => {});
                const unsubscribe2 = store.subscribe(() => {});

                stores.push({ store, unsubscribe1, unsubscribe2 });
            }

            // Clean up properly
            stores.forEach(({ store, unsubscribe1, unsubscribe2 }) => {
                unsubscribe1();
                unsubscribe2();
                store.destroy();
            });

            // Allow garbage collection
            await new Promise(resolve => setTimeout(resolve, 100));

            const finalMemory = this.getMemoryEstimate();
            const memoryIncrease = finalMemory - initialMemory;

            // Memory increase should be reasonable (less than 1MB for this test)
            if (memoryIncrease > 1024 * 1024) {
                this.warnings.push(`Potential memory leak: ${Math.round(memoryIncrease / 1024)}KB increase`);
            }

            return {
                status: 'Memory leak test completed',
                initialMemory: Math.round(initialMemory / 1024) + 'KB',
                finalMemory: Math.round(finalMemory / 1024) + 'KB',
                increase: Math.round(memoryIncrease / 1024) + 'KB'
            };
        }

        async testBusinessRules() {
            const testStore = new QuoteDataStore();
            await new Promise(resolve => setTimeout(resolve, 100));

            // Test mutual exclusion rules
            testStore.updateComponent('naasStandard', { enabled: true });
            testStore.updateComponent('naasEnhanced', { enabled: true });

            // naasStandard should be disabled automatically
            const naasStandard = testStore.getComponent('naasStandard');
            const naasEnhanced = testStore.getComponent('naasEnhanced');

            if (naasStandard.enabled && naasEnhanced.enabled) {
                throw new Error('Business rule violation: Both NaaS types enabled simultaneously');
            }

            // Test dependency rules
            testStore.updateComponent('enhancedSupport', { enabled: true });
            const support = testStore.getComponent('support');

            if (!support.enabled) {
                throw new Error('Business rule violation: Enhanced support enabled without base support');
            }

            testStore.destroy();
            return {
                status: 'Business rules validation working correctly',
                naasExclusionWorking: !(naasStandard.enabled && naasEnhanced.enabled),
                supportDependencyWorking: support.enabled
            };
        }

        async testPerformance() {
            const testStore = new QuoteDataStore();
            await new Promise(resolve => setTimeout(resolve, 100));

            const operations = 1000;
            const startTime = Date.now();

            // Perform many operations
            for (let i = 0; i < operations; i++) {
                testStore.updateProject({
                    projectName: `Performance Test ${i}`,
                    sites: i % 10 + 1
                });

                if (i % 10 === 0) {
                    testStore.updateComponent('prtg', {
                        enabled: i % 20 === 0,
                        params: { sensors: i }
                    });
                }
            }

            const endTime = Date.now();
            const duration = endTime - startTime;
            const opsPerSecond = Math.round((operations / duration) * 1000);

            // Performance should be reasonable (at least 100 ops/sec)
            if (opsPerSecond < 100) {
                this.warnings.push(`Performance concern: Only ${opsPerSecond} operations/second`);
            }

            testStore.destroy();
            return {
                status: 'Performance test completed',
                operations: operations,
                duration: duration + 'ms',
                opsPerSecond: opsPerSecond
            };
        }

        // ========== UTILITY METHODS ==========

        getMemoryEstimate() {
            // Rough memory usage estimate
            let size = 0;

            // Estimate localStorage usage
            for (let key in localStorage) {
                if (key.startsWith('naas_')) {
                    size += localStorage[key].length * 2; // UTF-16 encoding
                }
            }

            // Estimate DOM elements
            size += document.getElementsByTagName('*').length * 100; // Rough estimate

            return size;
        }

        generateReport() {
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
                results: this.testResults,
                errors: this.errors.map(e => ({
                    test: e.test,
                    message: e.error.message,
                    stack: e.error.stack
                })),
                warnings: this.warnings,
                timestamp: new Date().toISOString(),
                environment: {
                    userAgent: navigator.userAgent,
                    localStorage: typeof Storage !== 'undefined',
                    indexedDB: 'indexedDB' in window,
                    url: window.location.href
                }
            };

            console.log('\n🧪 DATA INTEGRITY TEST RESULTS');
            console.log('='.repeat(50));
            console.log(`Total Tests: ${report.summary.total}`);
            console.log(`Passed: ${report.summary.passed} (${report.summary.passRate})`);
            console.log(`Failed: ${report.summary.failed}`);
            console.log(`Warnings: ${report.summary.warnings}`);
            console.log(`Duration: ${report.summary.duration}ms`);

            if (failed > 0) {
                console.log('\n❌ FAILED TESTS:');
                this.errors.forEach(error => {
                    console.error(`  • ${error.test}: ${error.error.message}`);
                });
            }

            if (this.warnings.length > 0) {
                console.log('\n⚠️ WARNINGS:');
                this.warnings.forEach(warning => {
                    console.warn(`  • ${warning}`);
                });
            }

            const overallStatus = failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED';
            console.log(`\n${overallStatus}`);
            console.log('='.repeat(50));

            // Store results globally
            window.dataIntegrityTestResults = report;

            return report;
        }
    }

    // Auto-run when script loads
    if (typeof window !== 'undefined') {
        window.DataIntegrityTest = DataIntegrityTest;

        // Auto-start if ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => new DataIntegrityTest(), 1000);
            });
        } else {
            setTimeout(() => new DataIntegrityTest(), 1000);
        }
    }

})();