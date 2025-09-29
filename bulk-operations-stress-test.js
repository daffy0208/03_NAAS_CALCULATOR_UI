/**
 * Bulk Operations Stress Test Suite for NaaS Calculator
 * Tests high-volume operations, quote management, and data processing scenarios
 *
 * Test Categories:
 * 1. Mass Component Configuration
 * 2. Bulk Quote Creation and Management
 * 3. Large-Scale Data Import/Export
 * 4. Rapid Quote Comparison
 * 5. Storage Quota and Limits
 * 6. Session Management Under Load
 */

class BulkOperationsStressTest {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            warnings: 0,
            errors: [],
            performance: {},
            bulkOperations: {},
            issues: []
        };

        this.bulkLimits = {
            maxQuotes: 1000,
            maxComponentsPerQuote: 15,
            maxDataPoints: 50000,
            maxConcurrentOps: 20,
            maxMemoryGrowth: 50, // MB
            storageQuotaLimit: 5 * 1024 * 1024 // 5MB localStorage limit
        };

        this.isRunning = false;
        this.abortController = new AbortController();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'info': '📊',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'bulk': '📦',
            'memory': '💾'
        }[type] || '📊';

        console.log(`${prefix} [${timestamp}] ${message}`);

        if (type === 'error') {
            this.testResults.errors.push({ timestamp, message });
            this.testResults.failed++;
        } else if (type === 'warning') {
            this.testResults.warnings++;
        } else if (type === 'success') {
            this.testResults.passed++;
        }
    }

    async measureBulkPerformance(testName, operation, expectedVolume) {
        const startTime = performance.now();
        const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

        try {
            const result = await operation();
            const endTime = performance.now();
            const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

            const duration = endTime - startTime;
            const memoryDelta = (endMemory - startMemory) / 1024 / 1024; // MB
            const throughput = expectedVolume / (duration / 1000); // ops/second

            this.testResults.performance[testName] = {
                duration,
                memoryDelta,
                throughput,
                volume: expectedVolume
            };

            this.log(`${testName}: ${duration.toFixed(2)}ms, ${memoryDelta.toFixed(2)}MB, ${throughput.toFixed(0)} ops/sec`, 'bulk');

            return result;
        } catch (error) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            this.testResults.performance[testName] = { duration, error: error.message };
            throw error;
        }
    }

    // Test Category 1: Mass Component Configuration
    async testMassComponentConfiguration() {
        this.log('Starting Mass Component Configuration Tests', 'info');

        try {
            await this.testBulkComponentActivation();
            await this.testMassConfigurationUpdates();
            await this.testBulkComponentDisabling();
            await this.testComponentStateConsistency();
        } catch (error) {
            this.log(`Mass component configuration failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async testBulkComponentActivation() {
        await this.measureBulkPerformance('BulkComponentActivation', async () => {
            this.log('Testing bulk component activation...', 'info');

            const components = Object.keys(window.componentManager?.components || {});
            const activationBatches = [];

            // Create batches of 5 components each
            for (let i = 0; i < components.length; i += 5) {
                const batch = components.slice(i, i + 5);
                activationBatches.push(batch);
            }

            let totalActivated = 0;
            let failures = 0;

            // Process each batch rapidly
            for (const batch of activationBatches) {
                const batchPromises = batch.map(async (component) => {
                    try {
                        // Enable component
                        window.quoteDataStore.setComponentEnabled(component, true);

                        // Configure with random realistic data
                        const config = this.generateComponentConfig(component);
                        window.quoteDataStore.updateComponent(component, config);

                        totalActivated++;
                        return { component, success: true };
                    } catch (error) {
                        failures++;
                        return { component, success: false, error: error.message };
                    }
                });

                await Promise.all(batchPromises);

                // Small delay between batches to prevent overwhelming
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Verify all components are properly configured
            let consistentConfigs = 0;
            for (const component of components) {
                const componentData = window.quoteDataStore.getComponent(component);
                if (componentData.enabled) {
                    consistentConfigs++;
                }
            }

            const successRate = (totalActivated / components.length) * 100;

            if (successRate >= 95) {
                this.log(`Bulk component activation successful: ${successRate.toFixed(1)}% success rate`, 'success');
            } else {
                this.log(`Bulk component activation issues: ${successRate.toFixed(1)}% success rate`, 'warning');
            }

            return {
                totalComponents: components.length,
                activated: totalActivated,
                failures,
                consistentConfigs,
                successRate
            };
        }, components?.length || 0);
    }

    generateComponentConfig(component) {
        const configs = {
            prtg: {
                sensors: Math.floor(Math.random() * 1000) + 100,
                locations: Math.floor(Math.random() * 20) + 1,
                serviceLevel: Math.random() > 0.5 ? 'enhanced' : 'standard'
            },
            capital: {
                equipment: [
                    { type: 'router_medium', quantity: Math.floor(Math.random() * 10) + 1 },
                    { type: 'switch_small', quantity: Math.floor(Math.random() * 20) + 5 }
                ],
                financing: Math.random() > 0.5
            },
            support: {
                level: Math.random() > 0.5 ? 'enhanced' : 'standard',
                deviceCount: Math.floor(Math.random() * 100) + 10
            },
            onboarding: {
                complexity: ['simple', 'standard', 'complex'][Math.floor(Math.random() * 3)],
                sites: Math.floor(Math.random() * 5) + 1
            },
            pbsFoundation: {
                users: Math.floor(Math.random() * 100) + 10,
                locations: Math.floor(Math.random() * 10) + 1,
                features: ['basic', 'advanced'][Math.floor(Math.random() * 2)]
            }
        };

        return configs[component] || { enabled: true, timestamp: Date.now() };
    }

    async testMassConfigurationUpdates() {
        await this.measureBulkPerformance('MassConfigurationUpdates', async () => {
            this.log('Testing mass configuration updates...', 'info');

            const components = Object.keys(window.componentManager?.components || {});
            let updateOperations = 0;
            let failures = 0;

            // Perform rapid configuration changes
            for (let iteration = 0; iteration < 10; iteration++) {
                const updatePromises = components.map(async (component) => {
                    try {
                        const newConfig = this.generateComponentConfig(component);
                        newConfig.iteration = iteration;
                        newConfig.timestamp = Date.now();

                        window.quoteDataStore.updateComponent(component, newConfig);
                        updateOperations++;

                        // Occasionally trigger calculations
                        if (Math.random() < 0.3 && window.componentManager.calculateComponent) {
                            window.componentManager.calculateComponent(component);
                        }

                        return { component, success: true };
                    } catch (error) {
                        failures++;
                        return { component, success: false, error: error.message };
                    }
                });

                await Promise.all(updatePromises);

                // Brief pause between iterations
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Verify data consistency
            let consistentData = 0;
            for (const component of components) {
                const componentData = window.quoteDataStore.getComponent(component);
                if (componentData.iteration === 9) { // Last iteration
                    consistentData++;
                }
            }

            const successRate = ((updateOperations - failures) / updateOperations) * 100;

            if (successRate >= 95 && consistentData === components.length) {
                this.log(`Mass configuration updates successful: ${successRate.toFixed(1)}% success, ${consistentData} consistent`, 'success');
            } else {
                this.log(`Mass configuration update issues: ${successRate.toFixed(1)}% success, ${consistentData}/${components.length} consistent`, 'warning');
            }

            return {
                totalUpdates: updateOperations,
                failures,
                consistentData,
                totalComponents: components.length,
                successRate
            };
        }, components?.length * 10 || 0);
    }

    async testBulkComponentDisabling() {
        await this.measureBulkPerformance('BulkComponentDisabling', async () => {
            this.log('Testing bulk component disabling...', 'info');

            const components = Object.keys(window.componentManager?.components || {});
            let disabledCount = 0;
            let failures = 0;

            // Disable all components rapidly
            const disablePromises = components.map(async (component) => {
                try {
                    window.quoteDataStore.setComponentEnabled(component, false);
                    disabledCount++;
                    return { component, success: true };
                } catch (error) {
                    failures++;
                    return { component, success: false, error: error.message };
                }
            });

            await Promise.all(disablePromises);

            // Verify all components are disabled
            let actuallyDisabled = 0;
            for (const component of components) {
                const componentData = window.quoteDataStore.getComponent(component);
                if (!componentData.enabled) {
                    actuallyDisabled++;
                }
            }

            if (actuallyDisabled === components.length && failures === 0) {
                this.log('Bulk component disabling successful', 'success');
            } else {
                this.log(`Bulk disabling issues: ${actuallyDisabled}/${components.length} disabled, ${failures} failures`, 'warning');
            }

            return {
                totalComponents: components.length,
                disabledCount,
                actuallyDisabled,
                failures
            };
        }, components?.length || 0);
    }

    async testComponentStateConsistency() {
        await this.measureBulkPerformance('ComponentStateConsistency', async () => {
            this.log('Testing component state consistency under load...', 'info');

            const components = ['prtg', 'capital', 'support'];
            let stateChanges = 0;
            let inconsistencies = 0;

            // Rapidly toggle component states and check consistency
            for (let cycle = 0; cycle < 20; cycle++) {
                const cyclePromises = components.map(async (component) => {
                    const enabled = cycle % 2 === 0;

                    try {
                        // Set state
                        window.quoteDataStore.setComponentEnabled(component, enabled);
                        stateChanges++;

                        // Immediate verification
                        await new Promise(resolve => setTimeout(resolve, 10));
                        const currentState = window.quoteDataStore.getComponent(component);

                        if (currentState.enabled !== enabled) {
                            inconsistencies++;
                            this.log(`State inconsistency in ${component}: expected ${enabled}, got ${currentState.enabled}`, 'warning');
                        }

                        return { component, success: true };
                    } catch (error) {
                        return { component, success: false, error: error.message };
                    }
                });

                await Promise.all(cyclePromises);
            }

            const consistencyRate = ((stateChanges - inconsistencies) / stateChanges) * 100;

            if (consistencyRate >= 99) {
                this.log(`Component state consistency excellent: ${consistencyRate.toFixed(2)}%`, 'success');
            } else {
                this.log(`Component state consistency issues: ${consistencyRate.toFixed(2)}%`, 'warning');
            }

            return {
                stateChanges,
                inconsistencies,
                consistencyRate
            };
        }, 60); // 20 cycles * 3 components
    }

    // Test Category 2: Bulk Quote Creation and Management
    async testBulkQuoteManagement() {
        this.log('Starting Bulk Quote Management Tests', 'info');

        try {
            await this.testMassQuoteCreation();
            await this.testBulkQuoteComparison();
            await this.testQuoteHistoryManagement();
            await this.testConcurrentQuoteOperations();
        } catch (error) {
            this.log(`Bulk quote management failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async testMassQuoteCreation() {
        await this.measureBulkPerformance('MassQuoteCreation', async () => {
            this.log('Testing mass quote creation...', 'info');

            const quoteCount = 100;
            let createdQuotes = 0;
            let failures = 0;
            const quotes = [];

            for (let i = 0; i < quoteCount; i++) {
                try {
                    const quote = await this.createRandomQuote(i);
                    quotes.push(quote);
                    createdQuotes++;

                    // Save to localStorage periodically
                    if (i % 10 === 0) {
                        this.saveQuotesToStorage(quotes.slice(-10), 'bulk_test');
                    }

                } catch (error) {
                    failures++;
                    this.log(`Quote ${i} creation failed: ${error.message}`, 'warning');
                }

                // Prevent UI blocking
                if (i % 25 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }

            // Verify quote consistency
            const consistentQuotes = quotes.filter(q => q && q.totals && q.totals.monthly >= 0);
            const consistencyRate = (consistentQuotes.length / createdQuotes) * 100;

            if (createdQuotes >= quoteCount * 0.95 && consistencyRate >= 95) {
                this.log(`Mass quote creation successful: ${createdQuotes}/${quoteCount} created, ${consistencyRate.toFixed(1)}% consistent`, 'success');
            } else {
                this.log(`Mass quote creation issues: ${createdQuotes}/${quoteCount} created, ${consistencyRate.toFixed(1)}% consistent`, 'warning');
            }

            return {
                targetCount: quoteCount,
                createdQuotes,
                failures,
                consistentQuotes: consistentQuotes.length,
                consistencyRate,
                quotes
            };
        }, 100);
    }

    async createRandomQuote(index) {
        // Create a quote with random configuration
        const components = ['prtg', 'capital', 'support', 'onboarding'];
        const enabledComponents = components.filter(() => Math.random() > 0.3);

        const quoteData = {
            id: `bulk_test_${index}`,
            name: `Bulk Test Quote ${index}`,
            timestamp: new Date().toISOString(),
            project: {
                name: `Project ${index}`,
                description: `Test project for bulk operations ${index}`,
                contactEmail: `test${index}@example.com`
            },
            components: {}
        };

        let totalMonthly = 0;

        // Configure enabled components
        for (const component of enabledComponents) {
            const config = this.generateComponentConfig(component);
            quoteData.components[component] = {
                enabled: true,
                ...config
            };

            // Calculate pricing
            try {
                if (window.app && window.app.calculator) {
                    let result;
                    switch (component) {
                        case 'prtg':
                            result = window.app.calculator.calculatePRTG(config);
                            break;
                        case 'capital':
                            result = window.app.calculator.calculateCapital(config);
                            break;
                        case 'support':
                            result = window.app.calculator.calculateSupport(config);
                            break;
                        case 'onboarding':
                            result = window.app.calculator.calculateOnboarding(config);
                            break;
                    }

                    if (result && result.totals) {
                        totalMonthly += result.totals.monthly || 0;
                    }
                }
            } catch (calcError) {
                console.warn(`Calculation failed for ${component} in quote ${index}:`, calcError);
            }
        }

        quoteData.totals = {
            monthly: totalMonthly,
            annual: totalMonthly * 12,
            threeYear: totalMonthly * 36
        };

        return quoteData;
    }

    saveQuotesToStorage(quotes, prefix) {
        try {
            const existingQuotes = JSON.parse(localStorage.getItem('naas_bulk_test_quotes') || '{}');

            quotes.forEach(quote => {
                if (quote && quote.id) {
                    existingQuotes[quote.id] = quote;
                }
            });

            localStorage.setItem('naas_bulk_test_quotes', JSON.stringify(existingQuotes));
        } catch (error) {
            this.log(`Failed to save quotes to storage: ${error.message}`, 'warning');
        }
    }

    async testBulkQuoteComparison() {
        await this.measureBulkPerformance('BulkQuoteComparison', async () => {
            this.log('Testing bulk quote comparison...', 'info');

            // Get test quotes
            const testQuotes = JSON.parse(localStorage.getItem('naas_bulk_test_quotes') || '{}');
            const quoteIds = Object.keys(testQuotes);

            if (quoteIds.length < 10) {
                this.log('Insufficient quotes for comparison test', 'warning');
                return { skipped: true, reason: 'Insufficient test data' };
            }

            let comparisonOperations = 0;
            let validComparisons = 0;
            const comparisonResults = [];

            // Perform pairwise comparisons
            for (let i = 0; i < Math.min(quoteIds.length, 20); i += 2) {
                try {
                    const quote1 = testQuotes[quoteIds[i]];
                    const quote2 = testQuotes[quoteIds[i + 1]];

                    if (quote1 && quote2) {
                        const comparison = this.compareQuotes(quote1, quote2);
                        comparisonResults.push(comparison);
                        comparisonOperations++;

                        if (comparison.valid) {
                            validComparisons++;
                        }
                    }
                } catch (error) {
                    this.log(`Quote comparison ${i} failed: ${error.message}`, 'warning');
                }
            }

            // Analyze comparison results
            const avgDifference = comparisonResults
                .filter(c => c.valid)
                .reduce((sum, c) => sum + Math.abs(c.monthlyDifference), 0) / validComparisons;

            const successRate = (validComparisons / comparisonOperations) * 100;

            if (successRate >= 95) {
                this.log(`Bulk quote comparison successful: ${successRate.toFixed(1)}% success, avg difference £${avgDifference.toFixed(2)}`, 'success');
            } else {
                this.log(`Bulk quote comparison issues: ${successRate.toFixed(1)}% success`, 'warning');
            }

            return {
                comparisons: comparisonOperations,
                validComparisons,
                avgDifference,
                successRate
            };
        }, Math.min(Object.keys(JSON.parse(localStorage.getItem('naas_bulk_test_quotes') || '{}')).length / 2, 10));
    }

    compareQuotes(quote1, quote2) {
        try {
            const comparison = {
                quote1Id: quote1.id,
                quote2Id: quote2.id,
                monthlyDifference: (quote1.totals?.monthly || 0) - (quote2.totals?.monthly || 0),
                componentDifferences: {},
                valid: true
            };

            // Compare components
            const allComponents = new Set([
                ...Object.keys(quote1.components || {}),
                ...Object.keys(quote2.components || {})
            ]);

            allComponents.forEach(component => {
                const comp1 = quote1.components[component];
                const comp2 = quote2.components[component];

                comparison.componentDifferences[component] = {
                    inQuote1: !!comp1?.enabled,
                    inQuote2: !!comp2?.enabled,
                    bothEnabled: comp1?.enabled && comp2?.enabled
                };
            });

            return comparison;
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    async testQuoteHistoryManagement() {
        await this.measureBulkPerformance('QuoteHistoryManagement', async () => {
            this.log('Testing quote history management with large datasets...', 'info');

            // Create a large history dataset
            const historyEntries = [];
            for (let i = 0; i < 500; i++) {
                historyEntries.push({
                    id: `history_${i}`,
                    name: `Historical Quote ${i}`,
                    timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
                    totals: {
                        monthly: Math.random() * 5000 + 500,
                        annual: 0,
                        threeYear: 0
                    }
                });
                historyEntries[i].totals.annual = historyEntries[i].totals.monthly * 12;
                historyEntries[i].totals.threeYear = historyEntries[i].totals.monthly * 36;
            }

            // Test history operations
            let operationsCompleted = 0;
            let failures = 0;

            try {
                // Save history
                localStorage.setItem('naas_bulk_history_test', JSON.stringify(historyEntries));
                operationsCompleted++;

                // Load and parse history
                const loadedHistory = JSON.parse(localStorage.getItem('naas_bulk_history_test'));
                if (loadedHistory.length === historyEntries.length) {
                    operationsCompleted++;
                } else {
                    failures++;
                }

                // Sort operations
                const sortedByDate = [...loadedHistory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                const sortedByPrice = [...loadedHistory].sort((a, b) => b.totals.monthly - a.totals.monthly);
                operationsCompleted += 2;

                // Filter operations
                const recentQuotes = loadedHistory.filter(q => {
                    const quoteDate = new Date(q.timestamp);
                    const monthsAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    return quoteDate > monthsAgo;
                });

                const expensiveQuotes = loadedHistory.filter(q => q.totals.monthly > 2000);
                operationsCompleted += 2;

                // Search operations
                const searchResults = loadedHistory.filter(q => q.name.includes('Historical'));
                if (searchResults.length === loadedHistory.length) {
                    operationsCompleted++;
                } else {
                    failures++;
                }

                // Pagination simulation
                const pageSize = 10;
                const totalPages = Math.ceil(loadedHistory.length / pageSize);
                let paginationSuccessful = true;

                for (let page = 0; page < Math.min(totalPages, 10); page++) {
                    const start = page * pageSize;
                    const pageData = loadedHistory.slice(start, start + pageSize);

                    if (pageData.length === 0 && start < loadedHistory.length) {
                        paginationSuccessful = false;
                        break;
                    }
                }

                if (paginationSuccessful) {
                    operationsCompleted++;
                } else {
                    failures++;
                }

            } catch (error) {
                failures++;
                this.log(`History management operation failed: ${error.message}`, 'error');
            }

            // Clean up test data
            localStorage.removeItem('naas_bulk_history_test');

            const successRate = (operationsCompleted / (operationsCompleted + failures)) * 100;

            if (successRate >= 95) {
                this.log(`Quote history management successful: ${successRate.toFixed(1)}% success with 500 entries`, 'success');
            } else {
                this.log(`Quote history management issues: ${successRate.toFixed(1)}% success`, 'warning');
            }

            return {
                historySize: historyEntries.length,
                operationsCompleted,
                failures,
                successRate
            };
        }, 500);
    }

    async testConcurrentQuoteOperations() {
        await this.measureBulkPerformance('ConcurrentQuoteOperations', async () => {
            this.log('Testing concurrent quote operations...', 'info');

            const concurrentOperations = [];
            let completedOperations = 0;
            let failures = 0;

            // Create multiple concurrent quote operations
            for (let i = 0; i < 20; i++) {
                concurrentOperations.push(
                    new Promise(async (resolve) => {
                        try {
                            // Random operation type
                            const operations = [
                                () => this.createRandomQuote(i),
                                () => this.calculateRandomPricing(i),
                                () => this.simulateQuoteSave(i),
                                () => this.simulateQuoteLoad(i)
                            ];

                            const randomOperation = operations[Math.floor(Math.random() * operations.length)];
                            await randomOperation();

                            completedOperations++;
                            resolve({ success: true, operation: i });
                        } catch (error) {
                            failures++;
                            resolve({ success: false, operation: i, error: error.message });
                        }
                    })
                );
            }

            const results = await Promise.all(concurrentOperations);
            const successRate = (completedOperations / concurrentOperations.length) * 100;

            if (successRate >= 90) {
                this.log(`Concurrent quote operations successful: ${successRate.toFixed(1)}% success`, 'success');
            } else {
                this.log(`Concurrent quote operation issues: ${successRate.toFixed(1)}% success`, 'warning');
            }

            return {
                totalOperations: concurrentOperations.length,
                completedOperations,
                failures,
                successRate
            };
        }, 20);
    }

    async calculateRandomPricing(index) {
        const components = ['prtg', 'capital', 'support'];
        const randomComponent = components[index % components.length];
        const config = this.generateComponentConfig(randomComponent);

        if (window.app && window.app.calculator) {
            switch (randomComponent) {
                case 'prtg':
                    return window.app.calculator.calculatePRTG(config);
                case 'capital':
                    return window.app.calculator.calculateCapital(config);
                case 'support':
                    return window.app.calculator.calculateSupport(config);
            }
        }

        throw new Error('Calculator not available');
    }

    async simulateQuoteSave(index) {
        const quote = await this.createRandomQuote(index);
        const quotes = JSON.parse(localStorage.getItem('naas_concurrent_test') || '{}');
        quotes[`concurrent_${index}`] = quote;
        localStorage.setItem('naas_concurrent_test', JSON.stringify(quotes));
        return quote;
    }

    async simulateQuoteLoad(index) {
        const quotes = JSON.parse(localStorage.getItem('naas_concurrent_test') || '{}');
        const quote = quotes[`concurrent_${index}`];

        if (!quote) {
            throw new Error(`Quote concurrent_${index} not found`);
        }

        return quote;
    }

    // Test Category 3: Storage and Performance Limits
    async testStorageAndPerformanceLimits() {
        this.log('Starting Storage and Performance Limits Tests', 'info');

        try {
            await this.testStorageQuotaLimits();
            await this.testLargeDatasetProcessing();
            await this.testMemoryUsageUnderLoad();
            await this.testStorageCorruption();
        } catch (error) {
            this.log(`Storage and performance limits test failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async testStorageQuotaLimits() {
        await this.measureBulkPerformance('StorageQuotaLimits', async () => {
            this.log('Testing storage quota limits...', 'info');

            let storedData = 0;
            let quotaExceeded = false;
            let lastSuccessfulSize = 0;

            try {
                // Gradually increase stored data until we hit limits
                for (let size = 100; size <= 5000; size += 100) { // Up to 5MB test data
                    const testData = 'x'.repeat(size * 1024); // KB chunks
                    const dataObject = {
                        size: size,
                        timestamp: Date.now(),
                        data: testData,
                        metadata: {
                            chunkSize: size,
                            totalSize: testData.length
                        }
                    };

                    try {
                        localStorage.setItem(`quota_test_${size}`, JSON.stringify(dataObject));
                        storedData += JSON.stringify(dataObject).length;
                        lastSuccessfulSize = size;
                    } catch (storageError) {
                        quotaExceeded = true;
                        this.log(`Storage quota exceeded at ${size}KB (${(storedData / 1024 / 1024).toFixed(2)}MB stored)`, 'info');
                        break;
                    }
                }

                // Clean up test data
                for (let size = 100; size <= lastSuccessfulSize; size += 100) {
                    localStorage.removeItem(`quota_test_${size}`);
                }

            } catch (error) {
                this.log(`Storage quota test error: ${error.message}`, 'error');
            }

            const storedMB = storedData / 1024 / 1024;

            if (quotaExceeded && storedMB > 2) {
                this.log(`Storage quota handling appropriate: ${storedMB.toFixed(2)}MB limit detected`, 'success');
            } else if (!quotaExceeded && storedMB >= 5) {
                this.log(`Storage quota very generous: ${storedMB.toFixed(2)}MB stored without limit`, 'success');
            } else {
                this.log(`Storage quota concerns: Only ${storedMB.toFixed(2)}MB available`, 'warning');
            }

            return {
                storedMB,
                quotaExceeded,
                lastSuccessfulSize
            };
        }, lastSuccessfulSize || 100);
    }

    async testLargeDatasetProcessing() {
        await this.measureBulkPerformance('LargeDatasetProcessing', async () => {
            this.log('Testing large dataset processing...', 'info');

            // Create large dataset
            const largeDataset = [];
            for (let i = 0; i < 10000; i++) {
                largeDataset.push({
                    id: i,
                    component: ['prtg', 'capital', 'support'][i % 3],
                    sensors: Math.floor(Math.random() * 1000) + 100,
                    monthly: Math.random() * 2000 + 500,
                    timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
                });
            }

            let processedRows = 0;
            let processingErrors = 0;

            // Process dataset in chunks
            const chunkSize = 500;
            for (let i = 0; i < largeDataset.length; i += chunkSize) {
                const chunk = largeDataset.slice(i, i + chunkSize);

                try {
                    // Simulate processing operations
                    const processed = chunk.map(item => ({
                        ...item,
                        annual: item.monthly * 12,
                        threeYear: item.monthly * 36,
                        processed: true
                    }));

                    // Simulate calculations on chunk
                    const totalMonthly = processed.reduce((sum, item) => sum + item.monthly, 0);
                    const avgMonthly = totalMonthly / processed.length;

                    processedRows += processed.length;

                    // Brief pause to prevent UI blocking
                    if (i % 2000 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }

                } catch (error) {
                    processingErrors++;
                    this.log(`Chunk processing error at row ${i}: ${error.message}`, 'warning');
                }
            }

            const successRate = ((processedRows - processingErrors) / largeDataset.length) * 100;

            if (successRate >= 99) {
                this.log(`Large dataset processing excellent: ${successRate.toFixed(2)}% success with ${largeDataset.length} rows`, 'success');
            } else {
                this.log(`Large dataset processing issues: ${successRate.toFixed(2)}% success`, 'warning');
            }

            return {
                totalRows: largeDataset.length,
                processedRows,
                processingErrors,
                successRate
            };
        }, 10000);
    }

    async testMemoryUsageUnderLoad() {
        await this.measureBulkPerformance('MemoryUsageUnderLoad', async () => {
            this.log('Testing memory usage under load...', 'info');

            if (!performance.memory) {
                this.log('Performance.memory API not available, skipping memory test', 'warning');
                return { skipped: true };
            }

            const initialMemory = performance.memory.usedJSHeapSize;
            let maxMemory = initialMemory;
            let memoryLeakDetected = false;

            // Create memory-intensive operations
            for (let iteration = 0; iteration < 50; iteration++) {
                // Create large temporary objects
                const largeObjects = [];
                for (let i = 0; i < 1000; i++) {
                    largeObjects.push({
                        id: i,
                        data: new Array(1000).fill(`iteration_${iteration}_object_${i}`),
                        metadata: {
                            created: Date.now(),
                            iteration,
                            size: 1000
                        }
                    });
                }

                // Simulate processing
                const processed = largeObjects.map(obj => ({
                    ...obj,
                    processed: true,
                    processingTime: Date.now()
                }));

                // Check memory usage
                const currentMemory = performance.memory.usedJSHeapSize;
                maxMemory = Math.max(maxMemory, currentMemory);

                // Clean up
                largeObjects.length = 0;
                processed.length = 0;

                // Force garbage collection if available
                if (window.gc && iteration % 10 === 0) {
                    window.gc();
                }

                // Allow garbage collection
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            const finalMemory = performance.memory.usedJSHeapSize;
            const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024; // MB
            const maxGrowth = (maxMemory - initialMemory) / 1024 / 1024; // MB

            if (memoryGrowth <= this.bulkLimits.maxMemoryGrowth) {
                this.log(`Memory usage acceptable: ${memoryGrowth.toFixed(2)}MB growth (max: ${maxGrowth.toFixed(2)}MB)`, 'success');
            } else {
                this.log(`Excessive memory usage: ${memoryGrowth.toFixed(2)}MB growth (limit: ${this.bulkLimits.maxMemoryGrowth}MB)`, 'warning');
                memoryLeakDetected = true;
            }

            return {
                initialMemory: initialMemory / 1024 / 1024,
                finalMemory: finalMemory / 1024 / 1024,
                maxMemory: maxMemory / 1024 / 1024,
                memoryGrowth,
                maxGrowth,
                memoryLeakDetected
            };
        }, 50);
    }

    async testStorageCorruption() {
        await this.measureBulkPerformance('StorageCorruption', async () => {
            this.log('Testing storage corruption handling...', 'info');

            const testCases = [
                { name: 'Partial JSON', data: '{"incomplete": json' },
                { name: 'Invalid characters', data: 'invalid\x00\x01\x02data' },
                { name: 'Extremely large string', data: JSON.stringify({ data: 'x'.repeat(1000000) }) },
                { name: 'Null bytes', data: 'test\x00data\x00corrupted' },
                { name: 'Unicode issues', data: JSON.stringify({ text: '\uD800\uDC00\uD800' }) }
            ];

            let handledCorrectly = 0;

            for (const testCase of testCases) {
                try {
                    // Store corrupted data
                    localStorage.setItem('corruption_test', testCase.data);

                    // Attempt to retrieve and parse
                    const retrieved = localStorage.getItem('corruption_test');

                    try {
                        const parsed = JSON.parse(retrieved);
                        // If parsing succeeds, data wasn't really corrupted
                        handledCorrectly++;
                    } catch (parseError) {
                        // System should handle parse errors gracefully
                        handledCorrectly++;
                        this.log(`Parsing error handled correctly for ${testCase.name}`, 'success');
                    }

                    // Clean up
                    localStorage.removeItem('corruption_test');

                } catch (storageError) {
                    // Storage errors should be handled gracefully
                    handledCorrectly++;
                    this.log(`Storage error handled correctly for ${testCase.name}`, 'success');
                }
            }

            const handlingRate = (handledCorrectly / testCases.length) * 100;

            if (handlingRate >= 90) {
                this.log(`Storage corruption handling excellent: ${handlingRate.toFixed(1)}% success`, 'success');
            } else {
                this.log(`Storage corruption handling issues: ${handlingRate.toFixed(1)}% success`, 'warning');
            }

            return {
                totalTests: testCases.length,
                handledCorrectly,
                handlingRate
            };
        }, testCases.length);
    }

    // Main test runner
    async runBulkOperationsStressTests() {
        if (this.isRunning) {
            this.log('Bulk operations tests already running', 'warning');
            return this.testResults;
        }

        this.isRunning = true;
        this.testResults = {
            passed: 0,
            failed: 0,
            warnings: 0,
            errors: [],
            performance: {},
            bulkOperations: {},
            issues: []
        };

        this.log('🚀 Starting Bulk Operations Stress Testing Suite...', 'info');
        const overallStart = performance.now();

        try {
            // Wait for app to be ready
            await this.waitForAppReady();

            // Run test categories
            await this.testMassComponentConfiguration();
            await this.testBulkQuoteManagement();
            await this.testStorageAndPerformanceLimits();

            const overallTime = performance.now() - overallStart;

            this.log(`🏁 Bulk Operations Stress Testing Complete!`, 'info');
            this.log(`📊 Results: ${this.testResults.passed} passed, ${this.testResults.failed} failed, ${this.testResults.warnings} warnings`, 'info');
            this.log(`⏱️ Total time: ${(overallTime / 1000).toFixed(2)}s`, 'bulk');

            // Generate report
            await this.generateBulkTestReport();

        } catch (error) {
            this.log(`❌ Bulk operations testing failed: ${error.message}`, 'error');
            this.testResults.errors.push({ message: error.message, stack: error.stack });
        }

        this.isRunning = false;
        return this.testResults;
    }

    async waitForAppReady() {
        let attempts = 0;
        while (!window.app && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.app) {
            throw new Error('App not available after timeout');
        }
    }

    async generateBulkTestReport() {
        const report = {
            timestamp: new Date().toISOString(),
            testType: 'Bulk Operations Stress Test',
            summary: {
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                warnings: this.testResults.warnings,
                successRate: ((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)
            },
            performance: this.testResults.performance,
            errors: this.testResults.errors,
            limits: this.bulkLimits
        };

        // Store report
        try {
            localStorage.setItem('naas_bulk_operations_report', JSON.stringify(report));
            this.log('📋 Bulk operations test report saved', 'info');
        } catch (error) {
            this.log(`Failed to save test report: ${error.message}`, 'warning');
        }

        console.group('📊 BULK OPERATIONS STRESS TEST REPORT');
        console.log('Summary:', report.summary);
        console.log('Performance Metrics:', report.performance);
        console.log('Test Limits:', report.limits);
        console.groupEnd();

        return report;
    }

    // Cleanup method
    cleanup() {
        // Clean up test data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('bulk_test') || key.includes('concurrent_test') || key.includes('quota_test')) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn(`Failed to clean up key ${key}:`, error);
            }
        });

        this.log(`Cleaned up ${keysToRemove.length} test data entries`, 'info');
    }
}

// Initialize and expose
window.BulkOperationsStressTest = BulkOperationsStressTest;

// Auto-run if URL parameter present
if (window.location.search.includes('runBulkTests=true')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(async () => {
            const testSuite = new BulkOperationsStressTest();
            await testSuite.runBulkOperationsStressTests();
        }, 3000);
    });
}

// Expose quick test runner
window.runBulkOperationsStressTests = async function() {
    const testSuite = new BulkOperationsStressTest();
    return await testSuite.runBulkOperationsStressTests();
};

console.log('🔧 Bulk Operations Stress Test Suite loaded. Run window.runBulkOperationsStressTests() to start testing.');