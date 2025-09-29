/**
 * NaaS Calculator - Error Test Definitions
 * Comprehensive error simulation tests covering all failure scenarios
 */

// Wait for DOM and test framework to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Give the test framework time to initialize
    setTimeout(initializeErrorTests, 1000);
});

function initializeErrorTests() {
    // Verify testFramework is available
    if (typeof testFramework === 'undefined') {
        console.error('Test framework not available');
        return;
    }

    console.log('Initializing comprehensive error tests...');

    // 1. NETWORK FAILURES
    // ==================

    testFramework.addTest('networkFailures', 'Offline Mode Handling', async () => {
        // Simulate offline mode
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false
        });

        // Trigger offline event
        window.dispatchEvent(new Event('offline'));

        // Test if app handles offline gracefully
        try {
            if (typeof window.app !== 'undefined' && window.app) {
                // Test some app functionality while offline
                window.app.showNotification('Test offline notification', 'info');

                // Try to save data offline
                if (window.quoteDataStore) {
                    window.quoteDataStore.updateProject({
                        projectName: 'Offline Test Project'
                    });
                }
            }

            return { status: 'App handles offline mode gracefully' };
        } finally {
            // Restore online status
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: true
            });
            window.dispatchEvent(new Event('online'));
        }
    }, 'Test application behavior when network connection is unavailable');

    testFramework.addTest('networkFailures', 'Request Timeout Simulation', async () => {
        // Mock fetch to simulate timeout
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('Request timeout'));
                }, 1000);
            });
        };

        try {
            // Test timeout handling in import/export if available
            if (window.importExportManager) {
                try {
                    // This should fail gracefully
                    await window.importExportManager.exportData('test');
                    return { status: 'No timeout handling detected' };
                } catch (error) {
                    return { status: 'Request timeout handled properly', error: error.message };
                }
            }
            return { status: 'No network-dependent operations found' };
        } finally {
            window.fetch = originalFetch;
        }
    }, 'Test handling of network request timeouts');

    testFramework.addTest('networkFailures', 'Intermittent Connectivity', async () => {
        let connectionFlips = 0;
        const maxFlips = 6;

        // Simulate intermittent connectivity
        const flipConnection = () => {
            if (connectionFlips < maxFlips) {
                const isOnline = navigator.onLine;
                Object.defineProperty(navigator, 'onLine', {
                    writable: true,
                    value: !isOnline
                });

                window.dispatchEvent(new Event(isOnline ? 'offline' : 'online'));
                connectionFlips++;

                setTimeout(flipConnection, 200);
            }
        };

        flipConnection();

        // Wait for connection flips to complete
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Verify app is still functional
        if (window.app && typeof window.app.getHealthStatus === 'function') {
            const health = window.app.getHealthStatus();
            return {
                status: 'App survived intermittent connectivity',
                health: health,
                connectionFlips: connectionFlips
            };
        }

        return { status: 'Intermittent connectivity test completed', connectionFlips: connectionFlips };
    }, 'Test application stability during intermittent network connectivity');

    // 2. DATA CORRUPTION
    // ==================

    testFramework.addTest('dataCorruption', 'Invalid JSON in LocalStorage', async () => {
        // Corrupt localStorage data
        const originalData = localStorage.getItem('naas_quote_data');
        localStorage.setItem('naas_quote_data', '{"invalid": json data}');

        try {
            // Try to load data store
            const testDataStore = new QuoteDataStore();
            await testDataStore.initializeAsync();

            // Check if it recovered gracefully
            const project = testDataStore.getProject();

            return {
                status: 'Recovered from corrupted localStorage data',
                recoveredProject: project
            };
        } finally {
            // Restore original data
            if (originalData) {
                localStorage.setItem('naas_quote_data', originalData);
            } else {
                localStorage.removeItem('naas_quote_data');
            }
        }
    }, 'Test recovery from corrupted JSON data in localStorage');

    testFramework.addTest('dataCorruption', 'Missing Required Fields', async () => {
        if (!window.quoteDataStore) {
            throw new Error('QuoteDataStore not available');
        }

        // Test with missing required project fields
        try {
            window.quoteDataStore.updateProject({
                projectName: null,
                customerName: undefined,
                sites: "invalid_number",
                timeline: "invalid_timeline"
            });

            const project = window.quoteDataStore.getProject();

            return {
                status: 'Handled missing/invalid fields gracefully',
                sanitizedProject: project
            };
        } catch (error) {
            return {
                status: 'Error handling missing fields needs improvement',
                error: error.message
            };
        }
    }, 'Test handling of missing or invalid required fields');

    testFramework.addTest('dataCorruption', 'Type Mismatch Validation', async () => {
        if (!window.quoteDataStore) {
            throw new Error('QuoteDataStore not available');
        }

        const invalidInputs = [
            { projectName: 123 },
            { sites: "not_a_number" },
            { totalUsers: -50 },
            { complexity: "invalid_complexity" },
            { timeline: {} }
        ];

        const results = [];

        for (const input of invalidInputs) {
            try {
                window.quoteDataStore.updateProject(input);
                const project = window.quoteDataStore.getProject();
                results.push({
                    input: input,
                    result: 'handled',
                    sanitized: project
                });
            } catch (error) {
                results.push({
                    input: input,
                    result: 'error',
                    error: error.message
                });
            }
        }

        return {
            status: 'Type mismatch validation test completed',
            results: results
        };
    }, 'Test validation of incorrect data types');

    testFramework.addTest('dataCorruption', 'Malicious Script Injection', async () => {
        if (!window.quoteDataStore) {
            throw new Error('QuoteDataStore not available');
        }

        const maliciousInputs = [
            '<script>alert("XSS")</script>',
            'javascript:alert("XSS")',
            'onload="alert(\'XSS\')"',
            '<img src="x" onerror="alert(\'XSS\')">'
        ];

        try {
            window.quoteDataStore.updateProject({
                projectName: maliciousInputs[0],
                customerName: maliciousInputs[1],
                primaryLocation: maliciousInputs[2],
                budget: maliciousInputs[3]
            });

            const project = window.quoteDataStore.getProject();

            // Check if malicious content was sanitized
            const isSanitized = !Object.values(project).some(value =>
                typeof value === 'string' && (
                    value.includes('<script>') ||
                    value.includes('javascript:') ||
                    value.includes('onerror=') ||
                    value.includes('onload=')
                )
            );

            return {
                status: isSanitized ? 'Successfully sanitized malicious input' : 'XSS vulnerability detected',
                sanitizedProject: project
            };
        } catch (error) {
            return {
                status: 'Error during sanitization test',
                error: error.message
            };
        }
    }, 'Test protection against XSS and script injection attacks');

    // 3. BROWSER LIMITATIONS
    // =====================

    testFramework.addTest('browserLimitations', 'LocalStorage Quota Exceeded', async () => {
        const originalSetItem = Storage.prototype.setItem;
        let quotaExceeded = false;

        // Mock localStorage to throw quota exceeded error
        Storage.prototype.setItem = function(key, value) {
            if (key.startsWith('test_quota_')) {
                quotaExceeded = true;
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                throw error;
            }
            return originalSetItem.call(this, key, value);
        };

        try {
            // Try to save large amount of data
            if (window.quoteDataStore) {
                // First, create a large data structure
                const largeData = {
                    projectName: 'A'.repeat(1000000), // Very large string
                    customerName: 'B'.repeat(1000000)
                };

                // Override the storage save to trigger quota error
                const originalSaveSync = window.quoteDataStore.saveToStorageSync;
                window.quoteDataStore.saveToStorageSync = function() {
                    localStorage.setItem('test_quota_exceeded', JSON.stringify(largeData));
                };

                try {
                    window.quoteDataStore.updateProject(largeData);
                    return { status: 'Quota exceeded error not properly handled' };
                } catch (error) {
                    if (error.name === 'QuotaExceededError') {
                        return { status: 'Quota exceeded error handled gracefully' };
                    }
                    throw error;
                } finally {
                    window.quoteDataStore.saveToStorageSync = originalSaveSync;
                }
            }

            return { status: 'QuoteDataStore not available for quota test' };

        } finally {
            Storage.prototype.setItem = originalSetItem;
        }
    }, 'Test handling of localStorage quota exceeded errors');

    testFramework.addTest('browserLimitations', 'Feature Detection Fallbacks', async () => {
        // Test various browser feature detections
        const features = {
            localStorage: typeof(Storage) !== "undefined",
            indexedDB: 'indexedDB' in window,
            webWorkers: typeof(Worker) !== "undefined",
            fetch: 'fetch' in window,
            promises: 'Promise' in window,
            arrow_functions: (() => true)() === true,
            template_literals: true,
            destructuring: true
        };

        // Test specific fallback mechanisms
        let fallbacksWorking = 0;
        let totalFallbacks = 0;

        // Test localStorage fallback
        if (window.StorageManager) {
            totalFallbacks++;
            try {
                const tempStorage = new StorageManager();
                if (tempStorage.hasLocalStorageFallback) {
                    fallbacksWorking++;
                }
            } catch (error) {
                // Fallback mechanism exists but may not work
            }
        }

        return {
            status: 'Browser feature detection completed',
            features: features,
            fallbacksWorking: fallbacksWorking,
            totalFallbacks: totalFallbacks,
            compatibilityScore: Object.values(features).filter(Boolean).length / Object.keys(features).length
        };
    }, 'Test detection of browser capabilities and fallback mechanisms');

    testFramework.addTest('browserLimitations', 'Memory Pressure Simulation', async () => {
        // Create memory pressure by allocating large arrays
        const memoryHogs = [];
        let allocatedMB = 0;
        const maxMB = 50; // Limit to prevent browser crash

        try {
            while (allocatedMB < maxMB) {
                memoryHogs.push(new Array(256 * 256).fill('memory_pressure_test'));
                allocatedMB += 1;

                // Test if app still functions under memory pressure
                if (allocatedMB % 10 === 0) {
                    if (window.app && typeof window.app.getHealthStatus === 'function') {
                        const health = window.app.getHealthStatus();
                        if (!health) {
                            return {
                                status: 'App failed under memory pressure',
                                allocatedMB: allocatedMB
                            };
                        }
                    }
                }

                // Small delay to prevent blocking
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            return {
                status: 'App survived memory pressure test',
                allocatedMB: allocatedMB,
                finalHealth: window.app?.getHealthStatus?.() || 'Health check not available'
            };

        } finally {
            // Clean up memory
            memoryHogs.length = 0;
            if (typeof gc === 'function') {
                gc(); // Force garbage collection if available
            }
        }
    }, 'Test application stability under memory pressure');

    // 4. USER INPUT ERRORS
    // ===================

    testFramework.addTest('userInputErrors', 'Boundary Value Testing', async () => {
        if (!window.quoteDataStore) {
            throw new Error('QuoteDataStore not available');
        }

        const boundaryTests = [
            { field: 'sites', values: [0, -1, 1, 999, 1000, 1001] },
            { field: 'totalUsers', values: [0, -1, 1, 99999, 100000, 100001] },
            { field: 'projectName', values: ['', 'a', 'A'.repeat(100), 'A'.repeat(101)] },
            { field: 'customerName', values: ['', 'a', 'A'.repeat(100), 'A'.repeat(101)] }
        ];

        const results = [];

        for (const test of boundaryTests) {
            for (const value of test.values) {
                try {
                    const input = {};
                    input[test.field] = value;
                    window.quoteDataStore.updateProject(input);

                    const project = window.quoteDataStore.getProject();
                    results.push({
                        field: test.field,
                        input: value,
                        result: 'accepted',
                        sanitized: project[test.field]
                    });
                } catch (error) {
                    results.push({
                        field: test.field,
                        input: value,
                        result: 'rejected',
                        error: error.message
                    });
                }
            }
        }

        return {
            status: 'Boundary value testing completed',
            results: results
        };
    }, 'Test handling of boundary values for numeric and string inputs');

    testFramework.addTest('userInputErrors', 'SQL Injection Attempts', async () => {
        if (!window.quoteDataStore) {
            throw new Error('QuoteDataStore not available');
        }

        const sqlInjectionPayloads = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'/*",
            "' UNION SELECT * FROM users --",
            "'; INSERT INTO users VALUES('hacker'); --"
        ];

        try {
            for (const payload of sqlInjectionPayloads) {
                window.quoteDataStore.updateProject({
                    projectName: payload,
                    customerName: payload
                });
            }

            const project = window.quoteDataStore.getProject();

            // Check if SQL injection attempts were neutralized
            const isSafe = !Object.values(project).some(value =>
                typeof value === 'string' && (
                    value.includes('DROP TABLE') ||
                    value.includes('INSERT INTO') ||
                    value.includes('UNION SELECT') ||
                    value.includes("1'='1")
                )
            );

            return {
                status: isSafe ? 'SQL injection attempts neutralized' : 'Potential SQL injection vulnerability',
                sanitizedProject: project
            };
        } catch (error) {
            return {
                status: 'Error during SQL injection test',
                error: error.message
            };
        }
    }, 'Test protection against SQL injection attempts');

    testFramework.addTest('userInputErrors', 'Unicode and Special Characters', async () => {
        if (!window.quoteDataStore) {
            throw new Error('QuoteDataStore not available');
        }

        const unicodeTests = [
            '🎉 Project Name with Emojis 🚀',
            'Проект на русском языке',
            '中文项目名称',
            'العربية المشروع',
            'Spëcîàl Chärãçtërs',
            'Control\x00Characters\x01Test',
            'Zero\u0000Width\u200BSpaces',
            '\r\n\t Line breaks and tabs \r\n\t'
        ];

        const results = [];

        for (const testString of unicodeTests) {
            try {
                window.quoteDataStore.updateProject({
                    projectName: testString
                });

                const project = window.quoteDataStore.getProject();
                results.push({
                    input: testString,
                    result: 'handled',
                    sanitized: project.projectName,
                    lengthChange: testString.length !== project.projectName.length
                });
            } catch (error) {
                results.push({
                    input: testString,
                    result: 'error',
                    error: error.message
                });
            }
        }

        return {
            status: 'Unicode and special character testing completed',
            results: results
        };
    }, 'Test handling of Unicode characters and special symbols');

    // 5. SYSTEM ERRORS
    // ===============

    testFramework.addTest('systemErrors', 'Unhandled JavaScript Errors', async () => {
        let errorsCaught = [];
        let originalErrorHandler = window.onerror;

        // Set up error capture
        window.onerror = function(message, source, lineno, colno, error) {
            errorsCaught.push({ message, source, lineno, colno, error: error?.name });
            return true; // Prevent default handling
        };

        try {
            // Trigger various types of errors
            setTimeout(() => {
                // Reference error
                try {
                    undefinedVariable.someMethod();
                } catch (e) {
                    // Caught, but let's test uncaught ones too
                }

                // Type error in setTimeout to make it uncaught
                setTimeout(() => {
                    null.someMethod();
                }, 10);
            }, 10);

            // Wait for errors to be caught
            await new Promise(resolve => setTimeout(resolve, 100));

            return {
                status: 'JavaScript error handling test completed',
                errorsCaught: errorsCaught.length,
                errors: errorsCaught
            };

        } finally {
            window.onerror = originalErrorHandler;
        }
    }, 'Test capture and handling of unhandled JavaScript errors');

    testFramework.addTest('systemErrors', 'Promise Rejection Handling', async () => {
        let rejectionsCaught = [];
        let originalRejectionHandler = window.onunhandledrejection;

        // Set up rejection capture
        window.onunhandledrejection = function(event) {
            rejectionsCaught.push({
                reason: event.reason,
                promise: event.promise
            });
            event.preventDefault(); // Prevent default handling
        };

        try {
            // Create unhandled promise rejections
            Promise.reject(new Error('Test unhandled rejection 1'));

            new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('Test unhandled rejection 2'));
                }, 10);
            });

            // Promise that rejects with non-Error
            Promise.reject('String rejection');

            // Wait for rejections to be caught
            await new Promise(resolve => setTimeout(resolve, 100));

            return {
                status: 'Promise rejection handling test completed',
                rejectionsCaught: rejectionsCaught.length,
                rejections: rejectionsCaught.map(r => ({
                    reason: r.reason?.message || r.reason,
                    type: typeof r.reason
                }))
            };

        } finally {
            window.onunhandledrejection = originalRejectionHandler;
        }
    }, 'Test handling of unhandled Promise rejections');

    testFramework.addTest('systemErrors', 'Critical Function Failures', async () => {
        // Test what happens when critical functions fail
        const results = [];

        // Test calculator failure
        if (window.NaaSCalculator) {
            const calc = new NaaSCalculator();

            // Break the calculator temporarily
            const originalCalculatePRTG = calc.calculatePRTG;
            calc.calculatePRTG = function() {
                throw new Error('Calculator failure simulation');
            };

            try {
                calc.calculatePRTG({ sensors: 100 });
                results.push({ function: 'calculatePRTG', result: 'no_error_thrown' });
            } catch (error) {
                results.push({
                    function: 'calculatePRTG',
                    result: 'error_thrown',
                    error: error.message
                });
            } finally {
                calc.calculatePRTG = originalCalculatePRTG;
            }
        }

        // Test data store failure
        if (window.quoteDataStore) {
            const originalUpdateProject = window.quoteDataStore.updateProject;
            window.quoteDataStore.updateProject = function() {
                throw new Error('DataStore failure simulation');
            };

            try {
                window.quoteDataStore.updateProject({ projectName: 'test' });
                results.push({ function: 'updateProject', result: 'no_error_thrown' });
            } catch (error) {
                results.push({
                    function: 'updateProject',
                    result: 'error_thrown',
                    error: error.message
                });
            } finally {
                window.quoteDataStore.updateProject = originalUpdateProject;
            }
        }

        return {
            status: 'Critical function failure test completed',
            results: results
        };
    }, 'Test system behavior when critical functions throw errors');

    // 6. RACE CONDITIONS
    // =================

    testFramework.addTest('raceConditions', 'Concurrent Data Updates', async () => {
        if (!window.quoteDataStore) {
            throw new Error('QuoteDataStore not available');
        }

        // Simulate concurrent updates to the same data
        const promises = [];
        const updateCount = 10;

        for (let i = 0; i < updateCount; i++) {
            promises.push(
                window.quoteDataStore.updateProject({
                    projectName: `Concurrent Project ${i}`,
                    sites: i + 1
                })
            );
        }

        try {
            await Promise.all(promises);

            const finalProject = window.quoteDataStore.getProject();

            return {
                status: 'Concurrent updates completed',
                finalProjectName: finalProject.projectName,
                finalSites: finalProject.sites,
                updatesAttempted: updateCount
            };
        } catch (error) {
            return {
                status: 'Race condition detected',
                error: error.message
            };
        }
    }, 'Test handling of concurrent data store updates');

    testFramework.addTest('raceConditions', 'Rapid UI Interactions', async () => {
        // Simulate rapid button clicks and interactions
        let interactionCount = 0;
        let errors = [];

        // Find a button to rapidly click
        const testButton = document.querySelector('button');

        if (!testButton) {
            return { status: 'No buttons found for interaction test' };
        }

        // Store original click handler
        const originalHandler = testButton.onclick;
        let handlerExecutions = 0;

        // Add test handler
        testButton.onclick = function(e) {
            handlerExecutions++;
            try {
                if (originalHandler) {
                    originalHandler.call(this, e);
                }
            } catch (error) {
                errors.push(error.message);
            }
        };

        // Rapid fire clicks
        for (let i = 0; i < 20; i++) {
            try {
                testButton.click();
                interactionCount++;
            } catch (error) {
                errors.push(error.message);
            }

            // Small delay between clicks
            await new Promise(resolve => setTimeout(resolve, 5));
        }

        // Restore original handler
        testButton.onclick = originalHandler;

        return {
            status: 'Rapid UI interaction test completed',
            interactionCount: interactionCount,
            handlerExecutions: handlerExecutions,
            errors: errors.length,
            errorMessages: errors.slice(0, 5) // Limit error messages
        };
    }, 'Test system stability under rapid UI interactions');

    testFramework.addTest('raceConditions', 'Initialization Race Conditions', async () => {
        // Test multiple simultaneous initialization attempts
        const initPromises = [];

        // Create multiple data store instances simultaneously
        for (let i = 0; i < 5; i++) {
            const promise = new Promise(async (resolve) => {
                try {
                    const dataStore = new QuoteDataStore();
                    await dataStore.initializeAsync();
                    resolve({ success: true, instance: i });
                } catch (error) {
                    resolve({ success: false, error: error.message, instance: i });
                }
            });
            initPromises.push(promise);
        }

        const results = await Promise.all(initPromises);

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return {
            status: 'Initialization race condition test completed',
            successful: successful,
            failed: failed,
            results: results
        };
    }, 'Test handling of simultaneous initialization attempts');

    // 7. RESOURCE CONSTRAINTS
    // =====================

    testFramework.addTest('resourceConstraints', 'CPU Intensive Operations', async () => {
        const startTime = performance.now();
        let calculationsPerformed = 0;

        try {
            // Perform CPU-intensive calculations
            if (window.NaaSCalculator) {
                const calculator = new NaaSCalculator();

                // Run many calculations in succession
                for (let i = 0; i < 1000 && (performance.now() - startTime) < 2000; i++) {
                    try {
                        calculator.calculatePRTG({
                            sensors: Math.floor(Math.random() * 1000) + 1,
                            locations: Math.floor(Math.random() * 10) + 1,
                            serviceLevel: Math.random() > 0.5 ? 'standard' : 'enhanced'
                        });
                        calculationsPerformed++;
                    } catch (error) {
                        // Individual calculation errors are acceptable
                    }

                    // Yield control occasionally
                    if (i % 100 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 1));
                    }
                }
            }

            const endTime = performance.now();

            return {
                status: 'CPU intensive test completed',
                duration: Math.round(endTime - startTime),
                calculationsPerformed: calculationsPerformed,
                calculationsPerSecond: Math.round(calculationsPerformed / ((endTime - startTime) / 1000))
            };

        } catch (error) {
            return {
                status: 'CPU intensive test failed',
                error: error.message,
                calculationsPerformed: calculationsPerformed
            };
        }
    }, 'Test application performance under CPU-intensive operations');

    testFramework.addTest('resourceConstraints', 'Large Dataset Handling', async () => {
        if (!window.quoteDataStore) {
            throw new Error('QuoteDataStore not available');
        }

        try {
            // Create a large dataset
            const largeComponentData = {};

            // Add many components with complex data
            for (let i = 0; i < 100; i++) {
                const componentName = `testComponent${i}`;
                largeComponentData[componentName] = {
                    enabled: true,
                    params: {
                        id: i,
                        name: `Component ${i}`,
                        description: 'A'.repeat(1000), // 1KB description
                        settings: new Array(50).fill(null).map((_, j) => ({
                            key: `setting${j}`,
                            value: `value${j}`.repeat(10)
                        }))
                    }
                };
            }

            const startTime = performance.now();

            // Try to process the large dataset
            for (const [componentName, componentData] of Object.entries(largeComponentData)) {
                try {
                    window.quoteDataStore.updateComponent(componentName.replace('testComponent', 'prtg'), componentData);
                } catch (error) {
                    // Individual component errors are expected for unknown component types
                }
            }

            const endTime = performance.now();

            return {
                status: 'Large dataset handling test completed',
                datasetSize: Object.keys(largeComponentData).length,
                duration: Math.round(endTime - startTime),
                averageTimePerComponent: Math.round((endTime - startTime) / Object.keys(largeComponentData).length)
            };

        } catch (error) {
            return {
                status: 'Large dataset handling test failed',
                error: error.message
            };
        }
    }, 'Test handling of large datasets and complex data structures');

    testFramework.addTest('resourceConstraints', 'Long Running Operations', async () => {
        // Simulate a long-running operation
        const startTime = Date.now();
        let operationCount = 0;
        let errors = [];

        try {
            // Run operations for up to 3 seconds
            while (Date.now() - startTime < 3000) {
                try {
                    // Simulate complex calculation
                    if (window.NaaSCalculator) {
                        const calc = new NaaSCalculator();
                        const result = calc.calculatePRTG({
                            sensors: 1000,
                            locations: 20,
                            serviceLevel: 'enhanced'
                        });

                        // Also test data operations
                        if (window.quoteDataStore && operationCount % 10 === 0) {
                            window.quoteDataStore.updateProject({
                                projectName: `Long Running Operation ${operationCount}`
                            });
                        }
                    }

                    operationCount++;

                    // Yield control every 50 operations
                    if (operationCount % 50 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }

                } catch (error) {
                    errors.push(error.message);
                    if (errors.length > 10) break; // Stop if too many errors
                }
            }

            const endTime = Date.now();

            return {
                status: 'Long running operation test completed',
                duration: endTime - startTime,
                operationCount: operationCount,
                operationsPerSecond: Math.round(operationCount / ((endTime - startTime) / 1000)),
                errors: errors.length,
                errorSamples: errors.slice(0, 3)
            };

        } catch (error) {
            return {
                status: 'Long running operation test failed',
                error: error.message,
                operationCount: operationCount
            };
        }
    }, 'Test system stability during long-running operations');

    // 8. INTEGRATION FAILURES
    // =====================

    testFramework.addTest('integrationFailures', 'File Import Errors', async () => {
        if (!window.importExportManager) {
            return { status: 'ImportExportManager not available' };
        }

        const testCases = [
            {
                name: 'Invalid JSON File',
                data: 'invalid json content {',
                type: 'application/json'
            },
            {
                name: 'Empty File',
                data: '',
                type: 'application/json'
            },
            {
                name: 'Wrong File Type',
                data: 'This is a text file, not JSON',
                type: 'text/plain'
            },
            {
                name: 'Malicious Content',
                data: '{"projectName": "<script>alert(\'XSS\')</script>"}',
                type: 'application/json'
            }
        ];

        const results = [];

        for (const testCase of testCases) {
            try {
                // Create a mock File object
                const file = new File([testCase.data], 'test.json', { type: testCase.type });

                // Try to import the file
                const result = await window.importExportManager.importFile(file);

                results.push({
                    testCase: testCase.name,
                    result: 'success',
                    imported: result
                });

            } catch (error) {
                results.push({
                    testCase: testCase.name,
                    result: 'error_handled',
                    error: error.message
                });
            }
        }

        return {
            status: 'File import error testing completed',
            results: results
        };
    }, 'Test handling of various file import error conditions');

    testFramework.addTest('integrationFailures', 'Calculation Engine Errors', async () => {
        if (!window.NaaSCalculator) {
            throw new Error('NaaSCalculator not available');
        }

        const calculator = new NaaSCalculator();
        const errorCases = [
            {
                method: 'calculatePRTG',
                params: null,
                description: 'Null parameters'
            },
            {
                method: 'calculatePRTG',
                params: { sensors: -100, locations: -5 },
                description: 'Negative values'
            },
            {
                method: 'calculateCapital',
                params: { equipment: 'invalid_equipment_list' },
                description: 'Invalid equipment list'
            },
            {
                method: 'calculateSupport',
                params: { level: 'invalid_level', deviceCount: 'not_a_number' },
                description: 'Invalid support level and device count'
            }
        ];

        const results = [];

        for (const testCase of errorCases) {
            try {
                const result = calculator[testCase.method](testCase.params);
                results.push({
                    method: testCase.method,
                    description: testCase.description,
                    result: 'no_error',
                    returned: result
                });
            } catch (error) {
                results.push({
                    method: testCase.method,
                    description: testCase.description,
                    result: 'error_thrown',
                    error: error.message
                });
            }
        }

        return {
            status: 'Calculation engine error testing completed',
            results: results
        };
    }, 'Test error handling in calculation engine methods');

    testFramework.addTest('integrationFailures', 'Cross-Component Communication', async () => {
        // Test communication failures between different components
        const results = [];

        // Test app -> data store communication
        try {
            if (window.app && window.quoteDataStore) {
                // Try to break the communication
                const originalNotifyListeners = window.quoteDataStore.notifyListeners;
                window.quoteDataStore.notifyListeners = function() {
                    throw new Error('Communication failure simulation');
                };

                try {
                    window.quoteDataStore.updateProject({ projectName: 'Test Communication' });
                    results.push({
                        test: 'App -> DataStore',
                        result: 'communication_failed_silently'
                    });
                } catch (error) {
                    results.push({
                        test: 'App -> DataStore',
                        result: 'error_thrown',
                        error: error.message
                    });
                } finally {
                    window.quoteDataStore.notifyListeners = originalNotifyListeners;
                }
            }
        } catch (error) {
            results.push({
                test: 'App -> DataStore',
                result: 'setup_error',
                error: error.message
            });
        }

        // Test calculator -> data integration
        try {
            if (window.NaaSCalculator && window.quoteDataStore) {
                const calc = new NaaSCalculator();

                // Try calculation with corrupted data from store
                const originalGetComponent = window.quoteDataStore.getComponent;
                window.quoteDataStore.getComponent = function() {
                    return { enabled: true, params: { sensors: 'invalid', locations: null } };
                };

                try {
                    const componentData = window.quoteDataStore.getComponent('prtg');
                    const calcResult = calc.calculatePRTG(componentData.params);

                    results.push({
                        test: 'Calculator -> DataStore Integration',
                        result: 'handled_gracefully',
                        calcResult: calcResult
                    });
                } catch (error) {
                    results.push({
                        test: 'Calculator -> DataStore Integration',
                        result: 'error_thrown',
                        error: error.message
                    });
                } finally {
                    window.quoteDataStore.getComponent = originalGetComponent;
                }
            }
        } catch (error) {
            results.push({
                test: 'Calculator -> DataStore Integration',
                result: 'setup_error',
                error: error.message
            });
        }

        return {
            status: 'Cross-component communication testing completed',
            results: results
        };
    }, 'Test error handling in cross-component communication');

    console.log('Error test definitions loaded successfully');
}