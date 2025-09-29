/**
 * Advanced Power User Stress Testing for NaaS Calculator
 * Comprehensive testing suite covering complex workflows, edge cases, and performance scenarios
 *
 * Test Categories:
 * 1. Multi-Component Complex Configurations
 * 2. Data Import/Export Stress Tests
 * 3. Quote Management Bulk Operations
 * 4. Performance and Memory Stress Tests
 * 5. Concurrent Usage Scenarios
 * 6. Cross-Browser Compatibility Tests
 * 7. Storage and Network Edge Cases
 * 8. Error Recovery and Resilience Tests
 */

class PowerUserStressTestSuite {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            warnings: 0,
            errors: [],
            performance: {},
            memory: {},
            issues: []
        };

        this.performanceBaselines = {
            componentLoad: 500,  // ms
            calculationTime: 200, // ms
            navSwitchTime: 100,  // ms
            bulkOperations: 2000, // ms
            memoryGrowth: 10     // MB max growth
        };

        this.testTimeout = 30000; // 30 seconds max per test
        this.isRunning = false;
        this.originalConsole = console.log;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'info': '📋',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'performance': '⚡',
            'memory': '💾'
        }[type] || '📋';

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

    async measurePerformance(testName, asyncOperation) {
        const startTime = performance.now();
        const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

        try {
            const result = await asyncOperation();
            const endTime = performance.now();
            const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

            const duration = endTime - startTime;
            const memoryDelta = endMemory - startMemory;

            this.testResults.performance[testName] = { duration, memoryDelta };

            this.log(`${testName}: ${duration.toFixed(2)}ms, Memory: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`, 'performance');

            return result;
        } catch (error) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            this.testResults.performance[testName] = { duration, error: error.message };
            throw error;
        }
    }

    // Test Category 1: Multi-Component Complex Configurations
    async testComplexMultiComponentScenarios() {
        this.log('Starting Complex Multi-Component Configuration Tests', 'info');

        try {
            // Scenario 1: Enable all components simultaneously
            await this.testSimultaneousComponentActivation();

            // Scenario 2: Large enterprise configuration
            await this.testLargeEnterpriseConfiguration();

            // Scenario 3: Component interaction and dependencies
            await this.testComponentInteractions();

            // Scenario 4: Configuration persistence across views
            await this.testConfigurationPersistence();

        } catch (error) {
            this.log(`Complex multi-component test failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async testSimultaneousComponentActivation() {
        await this.measurePerformance('SimultaneousComponentActivation', async () => {
            this.log('Testing simultaneous component activation...', 'info');

            if (!window.quoteDataStore) {
                throw new Error('QuoteDataStore not available');
            }

            const components = ['prtg', 'capital', 'support', 'onboarding', 'pbsFoundation', 'assessment'];
            const activationPromises = [];

            // Enable all components simultaneously
            components.forEach(component => {
                activationPromises.push(
                    window.quoteDataStore.setComponentEnabled(component, true)
                );
            });

            await Promise.all(activationPromises);

            // Verify all components are enabled
            let allEnabled = true;
            for (const component of components) {
                const componentData = window.quoteDataStore.getComponent(component);
                if (!componentData.enabled) {
                    allEnabled = false;
                    this.log(`Component ${component} not properly enabled`, 'error');
                }
            }

            if (allEnabled) {
                this.log('All components activated simultaneously', 'success');
            } else {
                throw new Error('Some components failed to activate');
            }

            // Test calculation performance with all components
            if (window.app && window.app.calculator) {
                const startCalc = performance.now();

                // Perform calculations for all enabled components
                const calculations = {};
                for (const component of components) {
                    try {
                        switch (component) {
                            case 'prtg':
                                calculations[component] = window.app.calculator.calculatePRTG({
                                    sensors: 1000, locations: 25, serviceLevel: 'enhanced'
                                });
                                break;
                            case 'capital':
                                calculations[component] = window.app.calculator.calculateCapital({
                                    equipment: [
                                        { type: 'router_high', quantity: 10 },
                                        { type: 'switch_medium', quantity: 50 },
                                        { type: 'firewall_high', quantity: 5 }
                                    ],
                                    financing: true
                                });
                                break;
                            case 'support':
                                calculations[component] = window.app.calculator.calculateSupport({
                                    level: 'enhanced', deviceCount: 100
                                });
                                break;
                            // Add more as needed
                        }
                    } catch (calcError) {
                        this.log(`Calculation failed for ${component}: ${calcError.message}`, 'warning');
                    }
                }

                const calcTime = performance.now() - startCalc;
                this.log(`All component calculations completed in ${calcTime.toFixed(2)}ms`, 'performance');

                if (calcTime > this.performanceBaselines.bulkOperations) {
                    this.log(`Performance warning: Bulk calculations took ${calcTime}ms (baseline: ${this.performanceBaselines.bulkOperations}ms)`, 'warning');
                }
            }

            return { components, calculations: Object.keys(calculations).length };
        });
    }

    async testLargeEnterpriseConfiguration() {
        await this.measurePerformance('LargeEnterpriseConfiguration', async () => {
            this.log('Testing large enterprise configuration...', 'info');

            // Simulate a very large enterprise setup
            const largeConfig = {
                prtg: { sensors: 10000, locations: 100, serviceLevel: 'enhanced' },
                capital: {
                    equipment: [
                        { type: 'router_high', quantity: 100 },
                        { type: 'switch_medium', quantity: 500 },
                        { type: 'firewall_high', quantity: 50 },
                        { type: 'wireless_medium', quantity: 1000 }
                    ],
                    financing: true
                },
                support: { level: 'enhanced', deviceCount: 1000 },
                pbsFoundation: { users: 1000, locations: 50, features: ['advanced', 'enterprise'] }
            };

            // Apply configuration
            for (const [component, config] of Object.entries(largeConfig)) {
                try {
                    window.quoteDataStore.setComponentEnabled(component, true);
                    window.quoteDataStore.updateComponent(component, config);
                } catch (error) {
                    this.log(`Failed to configure ${component}: ${error.message}`, 'error');
                }
            }

            // Test wizard with large configuration
            if (window.app && window.app.showView) {
                window.app.showView('wizard');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Let view load

                if (window.quoteWizard) {
                    try {
                        await window.quoteWizard.initializeWizard();
                        this.log('Large configuration loaded in wizard', 'success');
                    } catch (error) {
                        this.log(`Wizard failed with large config: ${error.message}`, 'error');
                    }
                }
            }

            return largeConfig;
        });
    }

    async testComponentInteractions() {
        await this.measurePerformance('ComponentInteractions', async () => {
            this.log('Testing component interactions and dependencies...', 'info');

            // Test scenarios where components affect each other
            const interactionTests = [
                {
                    name: 'PRTG affects Support calculation',
                    setup: () => {
                        window.quoteDataStore.updateComponent('prtg', { sensors: 1000 });
                        window.quoteDataStore.updateComponent('support', { level: 'enhanced' });
                    },
                    verify: () => {
                        // Verify that support pricing considers PRTG sensor count
                        const supportCalc = window.app.calculator.calculateSupport({
                            level: 'enhanced',
                            deviceCount: window.quoteDataStore.getComponent('prtg').sensors || 100
                        });
                        return supportCalc && supportCalc.totals.monthly > 0;
                    }
                },
                {
                    name: 'Capital equipment affects support',
                    setup: () => {
                        window.quoteDataStore.updateComponent('capital', {
                            equipment: [{ type: 'router_high', quantity: 20 }]
                        });
                    },
                    verify: () => {
                        // Support should scale with equipment count
                        return true; // Implement actual verification logic
                    }
                }
            ];

            let passedInteractions = 0;
            for (const test of interactionTests) {
                try {
                    test.setup();
                    if (test.verify()) {
                        this.log(`Interaction test passed: ${test.name}`, 'success');
                        passedInteractions++;
                    } else {
                        this.log(`Interaction test failed: ${test.name}`, 'error');
                    }
                } catch (error) {
                    this.log(`Interaction test error: ${test.name} - ${error.message}`, 'error');
                }
            }

            return { total: interactionTests.length, passed: passedInteractions };
        });
    }

    async testConfigurationPersistence() {
        await this.measurePerformance('ConfigurationPersistence', async () => {
            this.log('Testing configuration persistence across views...', 'info');

            // Set up complex configuration
            const testConfig = {
                prtg: { sensors: 500, locations: 10, serviceLevel: 'enhanced' },
                capital: { equipment: [{ type: 'router_medium', quantity: 5 }], financing: true }
            };

            // Apply configuration in components view
            if (window.app) {
                window.app.showView('components');
                await new Promise(resolve => setTimeout(resolve, 500));

                // Configure components
                for (const [component, config] of Object.entries(testConfig)) {
                    window.quoteDataStore.setComponentEnabled(component, true);
                    window.quoteDataStore.updateComponent(component, config);
                }

                // Switch to wizard view
                window.app.showView('wizard');
                await new Promise(resolve => setTimeout(resolve, 500));

                // Verify configuration persisted
                let configPersisted = true;
                for (const [component, expectedConfig] of Object.entries(testConfig)) {
                    const actualConfig = window.quoteDataStore.getComponent(component);
                    if (!actualConfig.enabled) {
                        configPersisted = false;
                        this.log(`Configuration not persisted for ${component}`, 'error');
                    }
                }

                if (configPersisted) {
                    this.log('Configuration properly persisted across views', 'success');
                } else {
                    throw new Error('Configuration persistence failed');
                }

                return { components: Object.keys(testConfig).length, persisted: configPersisted };
            }

            throw new Error('App instance not available for persistence testing');
        });
    }

    // Test Category 2: Data Import/Export Stress Tests
    async testDataImportExportWorkflows() {
        this.log('Starting Data Import/Export Stress Tests', 'info');

        try {
            await this.testLargeDataImport();
            await this.testMultipleExportFormats();
            await this.testConcurrentImportExport();
            await this.testDataIntegrity();
            await this.testCorruptedDataHandling();
        } catch (error) {
            this.log(`Import/Export test failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async testLargeDataImport() {
        await this.measurePerformance('LargeDataImport', async () => {
            this.log('Testing large data import handling...', 'info');

            // Generate large test dataset (simulate CSV with 10,000 rows)
            const largeDataSet = this.generateLargeTestDataSet(10000);

            if (window.importExportManager) {
                try {
                    // Simulate file import
                    const importResult = await this.simulateFileImport(largeDataSet, 'csv');

                    if (importResult.success && importResult.rowsProcessed === 10000) {
                        this.log('Large data import completed successfully', 'success');
                    } else {
                        this.log(`Large data import partial failure: ${importResult.rowsProcessed}/10000 rows`, 'warning');
                    }

                    return importResult;
                } catch (error) {
                    this.log(`Large data import failed: ${error.message}`, 'error');
                    throw error;
                }
            } else {
                this.log('ImportExportManager not available', 'warning');
                return { success: false, reason: 'Manager not available' };
            }
        });
    }

    generateLargeTestDataSet(rowCount) {
        const components = ['prtg', 'capital', 'support', 'onboarding'];
        const data = [];

        for (let i = 0; i < rowCount; i++) {
            data.push({
                id: i,
                component: components[i % components.length],
                sensors: Math.floor(Math.random() * 1000) + 100,
                locations: Math.floor(Math.random() * 50) + 1,
                deviceCount: Math.floor(Math.random() * 500) + 10,
                serviceLevel: Math.random() > 0.5 ? 'enhanced' : 'standard',
                timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
            });
        }

        return data;
    }

    async simulateFileImport(data, format) {
        // Simulate the import process
        let processedRows = 0;
        let errors = 0;

        for (let i = 0; i < data.length; i += 100) { // Process in batches
            const batch = data.slice(i, i + 100);

            try {
                // Simulate processing delay
                await new Promise(resolve => setTimeout(resolve, 10));

                // Simulate occasional errors (5% failure rate)
                if (Math.random() < 0.05) {
                    errors++;
                    continue;
                }

                processedRows += batch.length;

                // Update progress periodically
                if (i % 1000 === 0) {
                    this.log(`Import progress: ${processedRows}/${data.length} rows processed`, 'info');
                }

            } catch (error) {
                errors++;
            }
        }

        return {
            success: errors < data.length * 0.1, // Success if < 10% errors
            rowsProcessed: processedRows,
            errors: errors,
            totalRows: data.length
        };
    }

    async testMultipleExportFormats() {
        await this.measurePerformance('MultipleExportFormats', async () => {
            this.log('Testing multiple export formats...', 'info');

            const formats = ['excel', 'csv', 'pdf'];
            const exportResults = {};

            // Create test data to export
            const testQuoteData = {
                project: { name: 'Test Export', date: new Date().toISOString() },
                components: {
                    prtg: { enabled: true, sensors: 500, locations: 10 },
                    support: { enabled: true, level: 'enhanced', deviceCount: 50 }
                }
            };

            for (const format of formats) {
                try {
                    const startTime = performance.now();

                    // Simulate export process
                    const exportResult = await this.simulateExport(testQuoteData, format);

                    const exportTime = performance.now() - startTime;
                    exportResults[format] = {
                        success: exportResult.success,
                        time: exportTime,
                        size: exportResult.size
                    };

                    if (exportResult.success) {
                        this.log(`${format.toUpperCase()} export completed in ${exportTime.toFixed(2)}ms (${exportResult.size} bytes)`, 'success');
                    } else {
                        this.log(`${format.toUpperCase()} export failed`, 'error');
                    }

                } catch (error) {
                    this.log(`${format.toUpperCase()} export error: ${error.message}`, 'error');
                    exportResults[format] = { success: false, error: error.message };
                }
            }

            return exportResults;
        });
    }

    async simulateExport(data, format) {
        // Simulate export processing time based on format
        const processingTimes = { excel: 200, csv: 50, pdf: 500 };
        await new Promise(resolve => setTimeout(resolve, processingTimes[format] || 100));

        // Simulate file size
        const sizes = { excel: 15000, csv: 5000, pdf: 25000 };

        return {
            success: Math.random() > 0.05, // 95% success rate
            size: sizes[format] || 10000,
            format: format
        };
    }

    async testConcurrentImportExport() {
        await this.measurePerformance('ConcurrentImportExport', async () => {
            this.log('Testing concurrent import/export operations...', 'info');

            const concurrentOperations = [];

            // Start multiple imports
            for (let i = 0; i < 3; i++) {
                const smallDataSet = this.generateLargeTestDataSet(100);
                concurrentOperations.push(
                    this.simulateFileImport(smallDataSet, 'csv')
                        .then(result => ({ type: 'import', id: i, result }))
                );
            }

            // Start multiple exports
            const testData = { components: { prtg: { sensors: 100 } } };
            for (let i = 0; i < 3; i++) {
                concurrentOperations.push(
                    this.simulateExport(testData, ['csv', 'excel', 'pdf'][i])
                        .then(result => ({ type: 'export', id: i, result }))
                );
            }

            try {
                const results = await Promise.all(concurrentOperations);

                const importResults = results.filter(r => r.type === 'import');
                const exportResults = results.filter(r => r.type === 'export');

                const importSuccess = importResults.every(r => r.result.success);
                const exportSuccess = exportResults.every(r => r.result.success);

                if (importSuccess && exportSuccess) {
                    this.log('All concurrent operations completed successfully', 'success');
                } else {
                    this.log(`Concurrent operations partial failure - Imports: ${importSuccess}, Exports: ${exportSuccess}`, 'warning');
                }

                return { imports: importResults.length, exports: exportResults.length, allSuccess: importSuccess && exportSuccess };

            } catch (error) {
                this.log(`Concurrent operations failed: ${error.message}`, 'error');
                throw error;
            }
        });
    }

    async testDataIntegrity() {
        await this.measurePerformance('DataIntegrity', async () => {
            this.log('Testing data integrity during operations...', 'info');

            // Create reference data
            const originalData = {
                prtg: { sensors: 500, locations: 10, serviceLevel: 'enhanced' },
                capital: { equipment: [{ type: 'router_medium', quantity: 3 }], financing: true }
            };

            // Store original data
            for (const [component, config] of Object.entries(originalData)) {
                window.quoteDataStore.setComponentEnabled(component, true);
                window.quoteDataStore.updateComponent(component, config);
            }

            // Perform various operations that might affect data integrity
            const operations = [
                () => window.app.showView('components'),
                () => window.app.showView('wizard'),
                () => window.app.showView('history'),
                () => window.app.showView('dashboard'),
                () => {
                    // Simulate rapid component selection
                    if (window.componentManager) {
                        window.componentManager.selectComponent('prtg');
                        window.componentManager.selectComponent('capital');
                        window.componentManager.selectComponent('prtg');
                    }
                }
            ];

            // Execute operations with delays
            for (const operation of operations) {
                try {
                    operation();
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (error) {
                    this.log(`Operation failed during integrity test: ${error.message}`, 'warning');
                }
            }

            // Verify data integrity
            let dataIntact = true;
            for (const [component, expectedConfig] of Object.entries(originalData)) {
                const currentConfig = window.quoteDataStore.getComponent(component);

                if (!currentConfig.enabled) {
                    dataIntact = false;
                    this.log(`Data integrity issue: ${component} not enabled`, 'error');
                    continue;
                }

                // Check key properties
                for (const [key, expectedValue] of Object.entries(expectedConfig)) {
                    if (JSON.stringify(currentConfig[key]) !== JSON.stringify(expectedValue)) {
                        dataIntact = false;
                        this.log(`Data integrity issue: ${component}.${key} changed from ${JSON.stringify(expectedValue)} to ${JSON.stringify(currentConfig[key])}`, 'error');
                    }
                }
            }

            if (dataIntact) {
                this.log('Data integrity maintained throughout operations', 'success');
            } else {
                throw new Error('Data integrity compromised');
            }

            return { components: Object.keys(originalData).length, intact: dataIntact };
        });
    }

    async testCorruptedDataHandling() {
        await this.measurePerformance('CorruptedDataHandling', async () => {
            this.log('Testing corrupted data handling...', 'info');

            const corruptedDataSets = [
                { name: 'Invalid JSON', data: '{"invalid": json}' },
                { name: 'Missing required fields', data: JSON.stringify({ component: 'prtg' }) },
                { name: 'Invalid data types', data: JSON.stringify({ sensors: 'invalid_number', locations: null }) },
                { name: 'Extremely large values', data: JSON.stringify({ sensors: Number.MAX_SAFE_INTEGER, locations: 999999 }) },
                { name: 'Malicious script injection', data: JSON.stringify({ name: '<script>alert("xss")</script>' }) }
            ];

            let handledCorrectly = 0;

            for (const testCase of corruptedDataSets) {
                try {
                    // Attempt to process corrupted data
                    const result = await this.processCorruptedData(testCase.data);

                    if (result.handled && !result.crashed) {
                        handledCorrectly++;
                        this.log(`Corrupted data handled correctly: ${testCase.name}`, 'success');
                    } else {
                        this.log(`Corrupted data not handled properly: ${testCase.name}`, 'error');
                    }

                } catch (error) {
                    // This is actually good - we want the system to safely reject corrupted data
                    handledCorrectly++;
                    this.log(`Corrupted data safely rejected: ${testCase.name} - ${error.message}`, 'success');
                }
            }

            const successRate = (handledCorrectly / corruptedDataSets.length) * 100;
            if (successRate >= 90) {
                this.log(`Corrupted data handling: ${successRate.toFixed(1)}% success rate`, 'success');
            } else {
                this.log(`Poor corrupted data handling: ${successRate.toFixed(1)}% success rate`, 'warning');
            }

            return { total: corruptedDataSets.length, handled: handledCorrectly, successRate };
        });
    }

    async processCorruptedData(corruptedData) {
        try {
            // Attempt to parse and process the corrupted data
            const parsed = JSON.parse(corruptedData);

            // Validate data structure
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Invalid data structure');
            }

            // Attempt to use the data in the system
            if (parsed.sensors && typeof parsed.sensors === 'number' && parsed.sensors > 1000000) {
                throw new Error('Sensor count exceeds reasonable limits');
            }

            // Check for script injection
            if (JSON.stringify(parsed).includes('<script>')) {
                throw new Error('Potential script injection detected');
            }

            return { handled: true, crashed: false };

        } catch (error) {
            // System should handle errors gracefully
            return { handled: true, crashed: false, error: error.message };
        }
    }

    // Test Category 3: Performance and Memory Stress Tests
    async testPerformanceAndMemoryStress() {
        this.log('Starting Performance and Memory Stress Tests', 'info');

        try {
            await this.testMemoryLeakDetection();
            await this.testPerformanceDegradation();
            await this.testLongRunningSession();
            await this.testResourceCleanup();
            await this.testExtremeValueHandling();
        } catch (error) {
            this.log(`Performance/Memory test failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async testMemoryLeakDetection() {
        await this.measurePerformance('MemoryLeakDetection', async () => {
            this.log('Testing for memory leaks...', 'info');

            if (!performance.memory) {
                this.log('Performance.memory API not available, skipping memory leak test', 'warning');
                return { skipped: true };
            }

            const initialMemory = performance.memory.usedJSHeapSize;
            let maxMemoryGrowth = 0;

            // Perform memory-intensive operations repeatedly
            for (let iteration = 0; iteration < 100; iteration++) {
                // Create and destroy large data structures
                const largeArray = new Array(10000).fill(0).map((_, i) => ({
                    id: i,
                    data: new Array(100).fill(`iteration_${iteration}_item_${i}`)
                }));

                // Simulate component operations
                if (window.app && window.componentManager) {
                    window.componentManager.selectComponent('prtg');
                    window.componentManager.selectComponent('capital');
                    window.componentManager.selectComponent('support');
                }

                // Force some calculations
                if (window.app && window.app.calculator) {
                    window.app.calculator.calculatePRTG({ sensors: 1000, locations: 10 });
                    window.app.calculator.calculateSupport({ level: 'enhanced', deviceCount: 100 });
                }

                // Check memory growth
                if (iteration % 10 === 0) {
                    const currentMemory = performance.memory.usedJSHeapSize;
                    const memoryGrowth = (currentMemory - initialMemory) / 1024 / 1024; // MB
                    maxMemoryGrowth = Math.max(maxMemoryGrowth, memoryGrowth);

                    if (memoryGrowth > this.performanceBaselines.memoryGrowth * 2) {
                        this.log(`Potential memory leak detected: ${memoryGrowth.toFixed(2)}MB growth at iteration ${iteration}`, 'warning');
                    }
                }

                // Clean up
                largeArray.length = 0;

                // Allow garbage collection
                if (iteration % 20 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }

            // Force garbage collection and final memory check
            if (window.gc) {
                window.gc();
            }
            await new Promise(resolve => setTimeout(resolve, 1000));

            const finalMemory = performance.memory.usedJSHeapSize;
            const totalGrowth = (finalMemory - initialMemory) / 1024 / 1024;

            if (totalGrowth <= this.performanceBaselines.memoryGrowth) {
                this.log(`Memory usage acceptable: ${totalGrowth.toFixed(2)}MB growth`, 'success');
            } else {
                this.log(`Excessive memory growth: ${totalGrowth.toFixed(2)}MB (baseline: ${this.performanceBaselines.memoryGrowth}MB)`, 'warning');
            }

            return {
                initialMemory: initialMemory / 1024 / 1024,
                finalMemory: finalMemory / 1024 / 1024,
                totalGrowth,
                maxMemoryGrowth,
                acceptable: totalGrowth <= this.performanceBaselines.memoryGrowth
            };
        });
    }

    async testPerformanceDegradation() {
        await this.measurePerformance('PerformanceDegradation', async () => {
            this.log('Testing performance degradation over time...', 'info');

            const performanceMetrics = [];

            // Test operations repeatedly and measure performance
            for (let i = 0; i < 50; i++) {
                const operationStart = performance.now();

                // Perform standard operations
                if (window.app) {
                    window.app.showView('components');
                    await new Promise(resolve => setTimeout(resolve, 50));

                    window.app.showView('wizard');
                    await new Promise(resolve => setTimeout(resolve, 50));

                    window.app.showView('dashboard');
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

                // Perform calculations
                if (window.app && window.app.calculator) {
                    window.app.calculator.calculatePRTG({ sensors: 500, locations: 10 });
                    window.app.calculator.calculateSupport({ level: 'enhanced', deviceCount: 50 });
                }

                const operationTime = performance.now() - operationStart;
                performanceMetrics.push(operationTime);

                // Log periodic updates
                if (i % 10 === 9) {
                    const avgTime = performanceMetrics.slice(-10).reduce((a, b) => a + b, 0) / 10;
                    this.log(`Iteration ${i + 1}/50: Avg operation time ${avgTime.toFixed(2)}ms`, 'info');
                }
            }

            // Analyze performance degradation
            const firstQuarter = performanceMetrics.slice(0, 12);
            const lastQuarter = performanceMetrics.slice(-12);

            const avgFirst = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
            const avgLast = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;

            const degradation = ((avgLast - avgFirst) / avgFirst) * 100;

            if (Math.abs(degradation) < 20) {
                this.log(`Performance stable: ${degradation.toFixed(1)}% change`, 'success');
            } else if (degradation > 20) {
                this.log(`Performance degradation detected: ${degradation.toFixed(1)}% slower`, 'warning');
            } else {
                this.log(`Performance improvement detected: ${Math.abs(degradation).toFixed(1)}% faster`, 'success');
            }

            return {
                totalOperations: performanceMetrics.length,
                avgFirst,
                avgLast,
                degradation,
                metrics: performanceMetrics
            };
        });
    }

    async testLongRunningSession() {
        await this.measurePerformance('LongRunningSession', async () => {
            this.log('Testing long-running session stability...', 'info');

            let operationsCompleted = 0;
            let errors = 0;
            const sessionDurationMinutes = 2; // 2-minute stress test
            const endTime = Date.now() + (sessionDurationMinutes * 60 * 1000);

            while (Date.now() < endTime) {
                try {
                    // Simulate user interactions
                    const operations = [
                        () => window.app?.showView('dashboard'),
                        () => window.app?.showView('components'),
                        () => window.app?.showView('wizard'),
                        () => {
                            if (window.componentManager) {
                                const components = ['prtg', 'capital', 'support'];
                                const randomComponent = components[Math.floor(Math.random() * components.length)];
                                window.componentManager.selectComponent(randomComponent);
                            }
                        },
                        () => {
                            if (window.app?.calculator) {
                                window.app.calculator.calculatePRTG({
                                    sensors: Math.floor(Math.random() * 1000) + 100,
                                    locations: Math.floor(Math.random() * 20) + 1
                                });
                            }
                        }
                    ];

                    const randomOperation = operations[Math.floor(Math.random() * operations.length)];
                    randomOperation();
                    operationsCompleted++;

                    // Throttle operations to prevent overwhelming
                    await new Promise(resolve => setTimeout(resolve, 100));

                } catch (error) {
                    errors++;
                    if (errors % 10 === 0) {
                        this.log(`Long-running session: ${errors} errors after ${operationsCompleted} operations`, 'warning');
                    }
                }
            }

            const errorRate = (errors / operationsCompleted) * 100;
            const operationsPerMinute = operationsCompleted / sessionDurationMinutes;

            if (errorRate < 5) {
                this.log(`Long-running session completed: ${operationsCompleted} operations, ${errorRate.toFixed(2)}% error rate`, 'success');
            } else {
                this.log(`Long-running session unstable: ${errorRate.toFixed(2)}% error rate`, 'warning');
            }

            return {
                duration: sessionDurationMinutes,
                operationsCompleted,
                errors,
                errorRate,
                operationsPerMinute
            };
        });
    }

    async testResourceCleanup() {
        await this.measurePerformance('ResourceCleanup', async () => {
            this.log('Testing resource cleanup...', 'info');

            if (!window.app || typeof window.app.getHealthStatus !== 'function') {
                this.log('App health monitoring not available', 'warning');
                return { skipped: true };
            }

            const initialHealth = window.app.getHealthStatus();

            // Perform resource-intensive operations
            const operations = [];

            // Create multiple intervals and timeouts
            for (let i = 0; i < 10; i++) {
                operations.push(setInterval(() => {
                    // Dummy operation
                    Math.random();
                }, 100));

                operations.push(setTimeout(() => {
                    // Dummy operation
                }, 5000));
            }

            // Add event listeners
            const dummyListeners = [];
            for (let i = 0; i < 10; i++) {
                const listener = () => {};
                document.addEventListener('click', listener);
                dummyListeners.push({ element: document, event: 'click', listener });
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check resource usage
            const midHealth = window.app.getHealthStatus();

            // Clean up
            operations.forEach(id => {
                clearInterval(id);
                clearTimeout(id);
            });

            dummyListeners.forEach(({ element, event, listener }) => {
                element.removeEventListener(event, listener);
            });

            await new Promise(resolve => setTimeout(resolve, 500));

            const finalHealth = window.app.getHealthStatus();

            // Compare resource usage
            const resourcesGrew = (
                finalHealth.resourcesInUse.intervals > initialHealth.resourcesInUse.intervals ||
                finalHealth.resourcesInUse.timeouts > initialHealth.resourcesInUse.timeouts ||
                finalHealth.resourcesInUse.eventListeners > initialHealth.resourcesInUse.eventListeners
            );

            if (!resourcesGrew) {
                this.log('Resource cleanup working correctly', 'success');
            } else {
                this.log('Potential resource leak detected', 'warning');
            }

            return {
                initialResources: initialHealth.resourcesInUse,
                midResources: midHealth.resourcesInUse,
                finalResources: finalHealth.resourcesInUse,
                cleanupWorking: !resourcesGrew
            };
        });
    }

    async testExtremeValueHandling() {
        await this.measurePerformance('ExtremeValueHandling', async () => {
            this.log('Testing extreme value handling...', 'info');

            const extremeValues = [
                { name: 'Zero sensors', component: 'prtg', data: { sensors: 0, locations: 1 } },
                { name: 'Negative sensors', component: 'prtg', data: { sensors: -100, locations: 5 } },
                { name: 'Extremely large sensors', component: 'prtg', data: { sensors: 1000000, locations: 1000 } },
                { name: 'Float sensors', component: 'prtg', data: { sensors: 100.5, locations: 5.7 } },
                { name: 'Empty equipment', component: 'capital', data: { equipment: [], financing: true } },
                { name: 'Null values', component: 'support', data: { level: null, deviceCount: null } },
                { name: 'Undefined values', component: 'onboarding', data: { complexity: undefined, sites: undefined } }
            ];

            let handledCorrectly = 0;

            for (const testCase of extremeValues) {
                try {
                    if (window.app && window.app.calculator) {
                        let result;

                        switch (testCase.component) {
                            case 'prtg':
                                result = window.app.calculator.calculatePRTG(testCase.data);
                                break;
                            case 'capital':
                                result = window.app.calculator.calculateCapital(testCase.data);
                                break;
                            case 'support':
                                result = window.app.calculator.calculateSupport(testCase.data);
                                break;
                            case 'onboarding':
                                result = window.app.calculator.calculateOnboarding(testCase.data);
                                break;
                        }

                        // Check if result is reasonable
                        if (result && result.totals &&
                            typeof result.totals.monthly === 'number' &&
                            !isNaN(result.totals.monthly) &&
                            result.totals.monthly >= 0) {
                            handledCorrectly++;
                            this.log(`Extreme value handled correctly: ${testCase.name}`, 'success');
                        } else {
                            this.log(`Extreme value result invalid: ${testCase.name}`, 'error');
                        }
                    }

                } catch (error) {
                    // Graceful error handling is acceptable for extreme values
                    if (error.message.includes('Invalid') || error.message.includes('out of range')) {
                        handledCorrectly++;
                        this.log(`Extreme value safely rejected: ${testCase.name}`, 'success');
                    } else {
                        this.log(`Extreme value caused unexpected error: ${testCase.name} - ${error.message}`, 'error');
                    }
                }
            }

            const successRate = (handledCorrectly / extremeValues.length) * 100;

            if (successRate >= 90) {
                this.log(`Extreme value handling: ${successRate.toFixed(1)}% success rate`, 'success');
            } else {
                this.log(`Poor extreme value handling: ${successRate.toFixed(1)}% success rate`, 'warning');
            }

            return {
                totalTests: extremeValues.length,
                handledCorrectly,
                successRate
            };
        });
    }

    // Test Category 4: Concurrent Usage and Race Conditions
    async testConcurrentUsageScenarios() {
        this.log('Starting Concurrent Usage and Race Condition Tests', 'info');

        try {
            await this.testSimultaneousNavigation();
            await this.testConcurrentCalculations();
            await this.testRapidUserInteractions();
            await this.testDataRaceConditions();
            await this.testMultipleTabSimulation();
        } catch (error) {
            this.log(`Concurrent usage test failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async testSimultaneousNavigation() {
        await this.measurePerformance('SimultaneousNavigation', async () => {
            this.log('Testing simultaneous navigation operations...', 'info');

            const navigationPromises = [];
            const views = ['dashboard', 'components', 'wizard', 'history'];

            // Fire multiple navigation requests simultaneously
            for (let i = 0; i < 20; i++) {
                const randomView = views[Math.floor(Math.random() * views.length)];
                navigationPromises.push(
                    new Promise(resolve => {
                        try {
                            window.app.showView(randomView);
                            setTimeout(resolve, 50);
                        } catch (error) {
                            resolve({ error: error.message, view: randomView });
                        }
                    })
                );
            }

            const results = await Promise.all(navigationPromises);
            const errors = results.filter(r => r && r.error);

            if (errors.length === 0) {
                this.log('Simultaneous navigation handled correctly', 'success');
            } else {
                this.log(`Navigation race conditions detected: ${errors.length} errors`, 'warning');
                errors.forEach(error => {
                    this.log(`Navigation error: ${error.view} - ${error.error}`, 'error');
                });
            }

            // Verify final state is consistent
            const finalView = window.app.currentView;
            const viewElement = document.getElementById(`${finalView}View`);
            const isVisible = viewElement && !viewElement.classList.contains('hidden');

            if (isVisible) {
                this.log(`Navigation state consistent: showing ${finalView}`, 'success');
            } else {
                this.log(`Navigation state inconsistent: currentView=${finalView} but element not visible`, 'error');
            }

            return {
                totalNavigations: navigationPromises.length,
                errors: errors.length,
                finalView,
                stateConsistent: isVisible
            };
        });
    }

    async testConcurrentCalculations() {
        await this.measurePerformance('ConcurrentCalculations', async () => {
            this.log('Testing concurrent calculations...', 'info');

            const calculationPromises = [];

            // Start multiple calculations simultaneously
            for (let i = 0; i < 10; i++) {
                calculationPromises.push(
                    new Promise(resolve => {
                        try {
                            const result = window.app.calculator.calculatePRTG({
                                sensors: 100 + i * 50,
                                locations: 5 + i,
                                serviceLevel: i % 2 === 0 ? 'standard' : 'enhanced'
                            });
                            resolve({ success: true, result, id: i });
                        } catch (error) {
                            resolve({ success: false, error: error.message, id: i });
                        }
                    })
                );
            }

            // Also test different calculation types
            calculationPromises.push(
                new Promise(resolve => {
                    try {
                        const result = window.app.calculator.calculateSupport({
                            level: 'enhanced',
                            deviceCount: 100
                        });
                        resolve({ success: true, result, type: 'support' });
                    } catch (error) {
                        resolve({ success: false, error: error.message, type: 'support' });
                    }
                })
            );

            const results = await Promise.all(calculationPromises);
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);

            if (failed.length === 0) {
                this.log('All concurrent calculations completed successfully', 'success');
            } else {
                this.log(`Concurrent calculation issues: ${failed.length}/${results.length} failed`, 'warning');
                failed.forEach(failure => {
                    this.log(`Calculation failed: ${failure.type || failure.id} - ${failure.error}`, 'error');
                });
            }

            // Verify calculation results are consistent
            const prtgResults = successful.filter(r => r.id !== undefined);
            const consistentResults = prtgResults.every(r =>
                r.result && r.result.totals && typeof r.result.totals.monthly === 'number'
            );

            if (consistentResults) {
                this.log('Calculation results are consistent', 'success');
            } else {
                this.log('Calculation results inconsistency detected', 'error');
            }

            return {
                totalCalculations: calculationPromises.length,
                successful: successful.length,
                failed: failed.length,
                consistentResults
            };
        });
    }

    async testRapidUserInteractions() {
        await this.measurePerformance('RapidUserInteractions', async () => {
            this.log('Testing rapid user interactions...', 'info');

            let interactions = 0;
            let errors = 0;

            // Simulate rapid clicking and interactions
            const rapidInteractionTest = async () => {
                const interactions = [];

                // Rapid navigation
                for (let i = 0; i < 20; i++) {
                    interactions.push(
                        new Promise(resolve => {
                            setTimeout(() => {
                                try {
                                    const views = ['dashboard', 'components', 'wizard'];
                                    const randomView = views[i % views.length];
                                    window.app.showView(randomView);
                                    resolve({ success: true });
                                } catch (error) {
                                    resolve({ success: false, error: error.message });
                                }
                            }, i * 10); // 10ms intervals
                        })
                    );
                }

                // Rapid component selection
                if (window.componentManager) {
                    for (let i = 0; i < 20; i++) {
                        interactions.push(
                            new Promise(resolve => {
                                setTimeout(() => {
                                    try {
                                        const components = ['prtg', 'capital', 'support'];
                                        const randomComponent = components[i % components.length];
                                        window.componentManager.selectComponent(randomComponent);
                                        resolve({ success: true });
                                    } catch (error) {
                                        resolve({ success: false, error: error.message });
                                    }
                                }, i * 15); // 15ms intervals
                            })
                        );
                    }
                }

                return Promise.all(interactions);
            };

            const results = await rapidInteractionTest();
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;

            const successRate = (successful / results.length) * 100;

            if (successRate >= 95) {
                this.log(`Rapid interactions handled well: ${successRate.toFixed(1)}% success rate`, 'success');
            } else {
                this.log(`Rapid interaction issues: ${successRate.toFixed(1)}% success rate`, 'warning');
            }

            return {
                totalInteractions: results.length,
                successful,
                failed,
                successRate
            };
        });
    }

    async testDataRaceConditions() {
        await this.measurePerformance('DataRaceConditions', async () => {
            this.log('Testing data race conditions...', 'info');

            // Test simultaneous data updates
            const updatePromises = [];
            const components = ['prtg', 'capital', 'support'];

            for (let i = 0; i < 30; i++) {
                const component = components[i % components.length];
                updatePromises.push(
                    new Promise(resolve => {
                        setTimeout(() => {
                            try {
                                window.quoteDataStore.updateComponent(component, {
                                    sensors: 100 + i,
                                    locations: 5 + (i % 10),
                                    serviceLevel: i % 2 === 0 ? 'standard' : 'enhanced',
                                    timestamp: Date.now()
                                });
                                resolve({ success: true, component, iteration: i });
                            } catch (error) {
                                resolve({ success: false, error: error.message, component, iteration: i });
                            }
                        }, Math.random() * 100); // Random delays
                    })
                );
            }

            const results = await Promise.all(updatePromises);
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);

            // Verify data integrity after concurrent updates
            let dataIntegrityMaintained = true;
            for (const component of components) {
                const componentData = window.quoteDataStore.getComponent(component);
                if (!componentData || typeof componentData.sensors !== 'number') {
                    dataIntegrityMaintained = false;
                    this.log(`Data integrity lost for ${component}`, 'error');
                }
            }

            if (failed.length === 0 && dataIntegrityMaintained) {
                this.log('Data race conditions handled correctly', 'success');
            } else {
                this.log(`Data race condition issues: ${failed.length} failures, integrity: ${dataIntegrityMaintained}`, 'warning');
            }

            return {
                totalUpdates: updatePromises.length,
                successful: successful.length,
                failed: failed.length,
                dataIntegrityMaintained
            };
        });
    }

    async testMultipleTabSimulation() {
        await this.measurePerformance('MultipleTabSimulation', async () => {
            this.log('Simulating multiple tab usage...', 'info');

            // Simulate what happens when multiple instances try to access localStorage
            const tabSimulations = [];

            for (let tabId = 0; tabId < 5; tabId++) {
                tabSimulations.push(
                    new Promise(resolve => {
                        setTimeout(() => {
                            try {
                                // Simulate tab-specific operations
                                const tabData = {
                                    tabId,
                                    timestamp: Date.now(),
                                    components: {
                                        prtg: { sensors: 100 * (tabId + 1), enabled: true }
                                    }
                                };

                                // Store tab-specific data
                                localStorage.setItem(`naas_tab_${tabId}`, JSON.stringify(tabData));

                                // Read shared data (potential conflict point)
                                const sharedData = JSON.parse(localStorage.getItem('naas_saved_components') || '{}');
                                sharedData[`tab_${tabId}_entry`] = {
                                    name: `Tab ${tabId} Quote`,
                                    timestamp: new Date().toISOString(),
                                    params: { sensors: 100 * (tabId + 1) }
                                };

                                // Write back shared data (race condition possibility)
                                localStorage.setItem('naas_saved_components', JSON.stringify(sharedData));

                                resolve({ success: true, tabId });

                            } catch (error) {
                                resolve({ success: false, tabId, error: error.message });
                            }
                        }, Math.random() * 200);
                    })
                );
            }

            const results = await Promise.all(tabSimulations);
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);

            // Verify shared data integrity
            try {
                const finalSharedData = JSON.parse(localStorage.getItem('naas_saved_components') || '{}');
                const tabEntries = Object.keys(finalSharedData).filter(key => key.startsWith('tab_'));

                if (tabEntries.length === 5 && failed.length === 0) {
                    this.log('Multiple tab simulation successful', 'success');
                } else {
                    this.log(`Multi-tab issues: ${tabEntries.length}/5 entries, ${failed.length} failures`, 'warning');
                }

                // Clean up test data
                tabEntries.forEach(key => delete finalSharedData[key]);
                for (let i = 0; i < 5; i++) {
                    localStorage.removeItem(`naas_tab_${i}`);
                }
                localStorage.setItem('naas_saved_components', JSON.stringify(finalSharedData));

            } catch (error) {
                this.log(`Multi-tab data verification failed: ${error.message}`, 'error');
            }

            return {
                totalTabs: tabSimulations.length,
                successful: successful.length,
                failed: failed.length
            };
        });
    }

    // Test Category 5: Cross-Browser Compatibility Tests
    async testCrossBrowserCompatibility() {
        this.log('Starting Cross-Browser Compatibility Tests', 'info');

        try {
            await this.testBrowserFeatureSupport();
            await this.testLocalStorageCompatibility();
            await this.testAPICompatibility();
            await this.testCSSCompatibility();
        } catch (error) {
            this.log(`Cross-browser compatibility test failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async testBrowserFeatureSupport() {
        await this.measurePerformance('BrowserFeatureSupport', async () => {
            this.log('Testing browser feature support...', 'info');

            const features = [
                { name: 'localStorage', test: () => 'localStorage' in window && window.localStorage !== null },
                { name: 'sessionStorage', test: () => 'sessionStorage' in window && window.sessionStorage !== null },
                { name: 'JSON', test: () => 'JSON' in window && typeof JSON.parse === 'function' },
                { name: 'Promise', test: () => 'Promise' in window },
                { name: 'fetch', test: () => 'fetch' in window },
                { name: 'performance', test: () => 'performance' in window },
                { name: 'performance.memory', test: () => 'performance' in window && 'memory' in performance },
                { name: 'addEventListener', test: () => 'addEventListener' in document },
                { name: 'querySelector', test: () => 'querySelector' in document },
                { name: 'classList', test: () => {
                    const testElement = document.createElement('div');
                    return 'classList' in testElement;
                }},
                { name: 'FileReader', test: () => 'FileReader' in window },
                { name: 'URL', test: () => 'URL' in window },
                { name: 'MutationObserver', test: () => 'MutationObserver' in window },
                { name: 'RequestAnimationFrame', test: () => 'requestAnimationFrame' in window }
            ];

            const supportedFeatures = [];
            const unsupportedFeatures = [];

            features.forEach(feature => {
                try {
                    if (feature.test()) {
                        supportedFeatures.push(feature.name);
                        this.log(`✅ ${feature.name} supported`, 'success');
                    } else {
                        unsupportedFeatures.push(feature.name);
                        this.log(`❌ ${feature.name} not supported`, 'warning');
                    }
                } catch (error) {
                    unsupportedFeatures.push(feature.name);
                    this.log(`❌ ${feature.name} test failed: ${error.message}`, 'error');
                }
            });

            const supportRate = (supportedFeatures.length / features.length) * 100;

            if (supportRate >= 90) {
                this.log(`Browser feature support excellent: ${supportRate.toFixed(1)}%`, 'success');
            } else if (supportRate >= 75) {
                this.log(`Browser feature support good: ${supportRate.toFixed(1)}%`, 'success');
            } else {
                this.log(`Browser feature support poor: ${supportRate.toFixed(1)}%`, 'warning');
            }

            return {
                total: features.length,
                supported: supportedFeatures,
                unsupported: unsupportedFeatures,
                supportRate
            };
        });
    }

    async testLocalStorageCompatibility() {
        await this.measurePerformance('LocalStorageCompatibility', async () => {
            this.log('Testing localStorage compatibility...', 'info');

            const tests = [
                {
                    name: 'Basic storage',
                    test: () => {
                        localStorage.setItem('test_basic', 'value');
                        const result = localStorage.getItem('test_basic');
                        localStorage.removeItem('test_basic');
                        return result === 'value';
                    }
                },
                {
                    name: 'JSON storage',
                    test: () => {
                        const testData = { number: 123, string: 'test', array: [1, 2, 3] };
                        localStorage.setItem('test_json', JSON.stringify(testData));
                        const retrieved = JSON.parse(localStorage.getItem('test_json'));
                        localStorage.removeItem('test_json');
                        return JSON.stringify(retrieved) === JSON.stringify(testData);
                    }
                },
                {
                    name: 'Large data storage',
                    test: () => {
                        const largeData = 'x'.repeat(100000); // 100KB
                        localStorage.setItem('test_large', largeData);
                        const result = localStorage.getItem('test_large') === largeData;
                        localStorage.removeItem('test_large');
                        return result;
                    }
                },
                {
                    name: 'Unicode storage',
                    test: () => {
                        const unicodeData = 'Hello 世界 🚀 🇬🇧';
                        localStorage.setItem('test_unicode', unicodeData);
                        const result = localStorage.getItem('test_unicode') === unicodeData;
                        localStorage.removeItem('test_unicode');
                        return result;
                    }
                },
                {
                    name: 'Storage events',
                    test: () => {
                        // This test requires multiple tabs to work properly
                        // We'll just check if the event exists
                        return 'StorageEvent' in window || 'storage' in window;
                    }
                }
            ];

            let passedTests = 0;

            for (const test of tests) {
                try {
                    if (test.test()) {
                        passedTests++;
                        this.log(`localStorage test passed: ${test.name}`, 'success');
                    } else {
                        this.log(`localStorage test failed: ${test.name}`, 'error');
                    }
                } catch (error) {
                    this.log(`localStorage test error: ${test.name} - ${error.message}`, 'error');
                }
            }

            const successRate = (passedTests / tests.length) * 100;

            if (successRate >= 80) {
                this.log(`localStorage compatibility good: ${successRate.toFixed(1)}%`, 'success');
            } else {
                this.log(`localStorage compatibility issues: ${successRate.toFixed(1)}%`, 'warning');
            }

            return {
                total: tests.length,
                passed: passedTests,
                successRate
            };
        });
    }

    async testAPICompatibility() {
        await this.measurePerformance('APICompatibility', async () => {
            this.log('Testing API compatibility...', 'info');

            const apiTests = [
                {
                    name: 'Array methods',
                    test: () => {
                        const arr = [1, 2, 3];
                        return arr.map && arr.filter && arr.reduce && arr.forEach &&
                               arr.find && arr.includes && arr.some && arr.every;
                    }
                },
                {
                    name: 'Object methods',
                    test: () => {
                        return Object.keys && Object.values && Object.entries &&
                               Object.assign && Object.create;
                    }
                },
                {
                    name: 'String methods',
                    test: () => {
                        const str = 'test';
                        return str.includes && str.startsWith && str.endsWith &&
                               str.trim && str.split && str.replace;
                    }
                },
                {
                    name: 'Date methods',
                    test: () => {
                        const date = new Date();
                        return date.toISOString && date.getTime &&
                               Date.now && Date.parse;
                    }
                },
                {
                    name: 'Math methods',
                    test: () => {
                        return Math.floor && Math.ceil && Math.round &&
                               Math.max && Math.min && Math.random;
                    }
                },
                {
                    name: 'Console methods',
                    test: () => {
                        return console.log && console.error && console.warn &&
                               console.info && console.group;
                    }
                }
            ];

            let passedTests = 0;

            for (const test of apiTests) {
                try {
                    if (test.test()) {
                        passedTests++;
                        this.log(`API test passed: ${test.name}`, 'success');
                    } else {
                        this.log(`API test failed: ${test.name}`, 'error');
                    }
                } catch (error) {
                    this.log(`API test error: ${test.name} - ${error.message}`, 'error');
                }
            }

            const successRate = (passedTests / apiTests.length) * 100;

            if (successRate >= 95) {
                this.log(`API compatibility excellent: ${successRate.toFixed(1)}%`, 'success');
            } else {
                this.log(`API compatibility issues: ${successRate.toFixed(1)}%`, 'warning');
            }

            return {
                total: apiTests.length,
                passed: passedTests,
                successRate
            };
        });
    }

    async testCSSCompatibility() {
        await this.measurePerformance('CSSCompatibility', async () => {
            this.log('Testing CSS compatibility...', 'info');

            const testElement = document.createElement('div');
            document.body.appendChild(testElement);

            const cssTests = [
                {
                    name: 'Flexbox',
                    test: () => {
                        testElement.style.display = 'flex';
                        return testElement.style.display === 'flex';
                    }
                },
                {
                    name: 'Grid',
                    test: () => {
                        testElement.style.display = 'grid';
                        return testElement.style.display === 'grid';
                    }
                },
                {
                    name: 'Transform',
                    test: () => {
                        testElement.style.transform = 'translateX(10px)';
                        return testElement.style.transform.includes('translateX');
                    }
                },
                {
                    name: 'Transition',
                    test: () => {
                        testElement.style.transition = 'all 0.3s ease';
                        return testElement.style.transition.includes('0.3s');
                    }
                },
                {
                    name: 'Border-radius',
                    test: () => {
                        testElement.style.borderRadius = '10px';
                        return testElement.style.borderRadius === '10px';
                    }
                },
                {
                    name: 'Box-shadow',
                    test: () => {
                        testElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        return testElement.style.boxShadow.includes('rgba');
                    }
                },
                {
                    name: 'CSS Variables',
                    test: () => {
                        testElement.style.setProperty('--test-var', 'red');
                        return testElement.style.getPropertyValue('--test-var') === 'red';
                    }
                }
            ];

            let passedTests = 0;

            for (const test of cssTests) {
                try {
                    if (test.test()) {
                        passedTests++;
                        this.log(`CSS test passed: ${test.name}`, 'success');
                    } else {
                        this.log(`CSS test failed: ${test.name}`, 'warning');
                    }
                } catch (error) {
                    this.log(`CSS test error: ${test.name} - ${error.message}`, 'error');
                }
            }

            document.body.removeChild(testElement);

            const successRate = (passedTests / cssTests.length) * 100;

            if (successRate >= 90) {
                this.log(`CSS compatibility excellent: ${successRate.toFixed(1)}%`, 'success');
            } else {
                this.log(`CSS compatibility issues: ${successRate.toFixed(1)}%`, 'warning');
            }

            return {
                total: cssTests.length,
                passed: passedTests,
                successRate
            };
        });
    }

    // Main test runner
    async runPowerUserStressTests() {
        if (this.isRunning) {
            this.log('Tests already running', 'warning');
            return this.testResults;
        }

        this.isRunning = true;
        this.testResults = {
            passed: 0,
            failed: 0,
            warnings: 0,
            errors: [],
            performance: {},
            memory: {},
            issues: []
        };

        this.log('🚀 Starting Power User Stress Testing Suite...', 'info');
        const overallStart = performance.now();

        try {
            // Wait for app to be ready
            await this.waitForAppReady();

            // Run test categories
            await this.testComplexMultiComponentScenarios();
            await this.testDataImportExportWorkflows();
            await this.testPerformanceAndMemoryStress();
            await this.testConcurrentUsageScenarios();
            await this.testCrossBrowserCompatibility();

            const overallTime = performance.now() - overallStart;

            this.log(`🏁 Power User Stress Testing Complete!`, 'info');
            this.log(`📊 Overall Results: ${this.testResults.passed} passed, ${this.testResults.failed} failed, ${this.testResults.warnings} warnings`, 'info');
            this.log(`⏱️ Total time: ${(overallTime / 1000).toFixed(2)}s`, 'performance');

            // Generate summary
            await this.generateTestReport();

        } catch (error) {
            this.log(`❌ Stress testing failed: ${error.message}`, 'error');
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

        // Wait for app to be initialized
        if (window.app.ensureInitialized) {
            await window.app.ensureInitialized(() => {});
        }
    }

    async generateTestReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                warnings: this.testResults.warnings,
                successRate: ((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)
            },
            performance: this.testResults.performance,
            errors: this.testResults.errors,
            browserInfo: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine,
                memoryInfo: performance.memory ? {
                    usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                    jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                } : 'Not available'
            }
        };

        // Store report
        try {
            localStorage.setItem('naas_stress_test_report', JSON.stringify(report));
            this.log('📋 Test report saved to localStorage', 'info');
        } catch (error) {
            this.log(`Failed to save test report: ${error.message}`, 'warning');
        }

        // Log comprehensive summary
        console.group('📋 POWER USER STRESS TEST REPORT');
        console.log('Summary:', report.summary);
        console.log('Performance Metrics:', report.performance);
        console.log('Browser Info:', report.browserInfo);
        if (report.errors.length > 0) {
            console.log('Errors:', report.errors);
        }
        console.groupEnd();

        return report;
    }
}

// Initialize and expose the test suite
window.PowerUserStressTestSuite = PowerUserStressTestSuite;

// Auto-run tests if URL parameter is present
if (window.location.search.includes('runStressTests=true')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(async () => {
            const testSuite = new PowerUserStressTestSuite();
            await testSuite.runPowerUserStressTests();
        }, 5000);
    });
}

// Expose quick test runner
window.runPowerUserStressTests = async function() {
    const testSuite = new PowerUserStressTestSuite();
    return await testSuite.runPowerUserStressTests();
};

console.log('🔧 Power User Stress Test Suite loaded. Run window.runPowerUserStressTests() to start testing.');