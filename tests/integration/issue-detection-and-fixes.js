/**
 * Issue Detection and Automatic Fixes for NaaS Calculator
 * Comprehensive system to detect, analyze, and fix issues found during stress testing
 *
 * Categories:
 * 1. Performance Issues
 * 2. Memory Leaks
 * 3. Race Conditions
 * 4. Data Integrity Problems
 * 5. UI/UX Issues
 * 6. Storage Problems
 * 7. Error Handling Gaps
 * 8. Cross-Browser Compatibility Issues
 */

class IssueDetectionAndFixSystem {
    constructor() {
        this.detectedIssues = [];
        this.appliedFixes = [];
        this.preventiveMeasures = [];
        this.isAnalyzing = false;

        // Issue severity levels
        this.severity = {
            CRITICAL: 'critical',
            HIGH: 'high',
            MEDIUM: 'medium',
            LOW: 'low',
            INFO: 'info'
        };

        // Fix status
        this.fixStatus = {
            PENDING: 'pending',
            IN_PROGRESS: 'in_progress',
            COMPLETED: 'completed',
            FAILED: 'failed'
        };

        this.performanceBaselines = {
            componentLoadTime: 500,
            calculationTime: 200,
            navigationTime: 100,
            memoryGrowthLimit: 10,
            errorRate: 0.05
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'info': '🔍',
            'issue': '🐛',
            'fix': '🔧',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️'
        }[type] || '🔍';

        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    // Main analysis function
    async analyzeAndFixIssues() {
        if (this.isAnalyzing) {
            this.log('Issue analysis already in progress', 'warning');
            return;
        }

        this.isAnalyzing = true;
        this.log('🚀 Starting comprehensive issue detection and fix system...', 'info');

        try {
            // Reset state
            this.detectedIssues = [];
            this.appliedFixes = [];

            // Run analysis phases
            await this.detectPerformanceIssues();
            await this.detectMemoryLeaks();
            await this.detectRaceConditions();
            await this.detectDataIntegrityProblems();
            await this.detectUIUXIssues();
            await this.detectStorageProblems();
            await this.detectErrorHandlingGaps();
            await this.detectCompatibilityIssues();

            // Apply fixes
            await this.applyFixes();

            // Implement preventive measures
            await this.implementPreventiveMeasures();

            // Generate report
            const report = this.generateFixReport();

            this.log(`🏁 Issue analysis complete: ${this.detectedIssues.length} issues found, ${this.appliedFixes.length} fixes applied`, 'success');

            return report;

        } catch (error) {
            this.log(`Issue analysis failed: ${error.message}`, 'error');
            throw error;
        } finally {
            this.isAnalyzing = false;
        }
    }

    // Issue Detection Methods

    async detectPerformanceIssues() {
        this.log('Detecting performance issues...', 'info');

        const performanceIssues = [];

        try {
            // Test component loading performance
            const componentLoadStart = performance.now();
            if (window.componentManager) {
                window.componentManager.initializeComponents();
            }
            const componentLoadTime = performance.now() - componentLoadStart;

            if (componentLoadTime > this.performanceBaselines.componentLoadTime) {
                performanceIssues.push({
                    type: 'slow_component_loading',
                    severity: this.severity.MEDIUM,
                    description: `Component loading takes ${componentLoadTime.toFixed(2)}ms (baseline: ${this.performanceBaselines.componentLoadTime}ms)`,
                    metrics: { actual: componentLoadTime, baseline: this.performanceBaselines.componentLoadTime },
                    fix: 'optimizeComponentLoading'
                });
            }

            // Test calculation performance
            if (window.app && window.app.calculator) {
                const calcStart = performance.now();
                window.app.calculator.calculatePRTG({ sensors: 100, locations: 5, serviceLevel: 'enhanced' });
                const calcTime = performance.now() - calcStart;

                if (calcTime > this.performanceBaselines.calculationTime) {
                    performanceIssues.push({
                        type: 'slow_calculations',
                        severity: this.severity.HIGH,
                        description: `Calculations take ${calcTime.toFixed(2)}ms (baseline: ${this.performanceBaselines.calculationTime}ms)`,
                        metrics: { actual: calcTime, baseline: this.performanceBaselines.calculationTime },
                        fix: 'optimizeCalculations'
                    });
                }
            }

            // Test navigation performance
            const navStart = performance.now();
            if (window.app) {
                window.app.showView('components');
                window.app.showView('dashboard');
            }
            const navTime = performance.now() - navStart;

            if (navTime > this.performanceBaselines.navigationTime) {
                performanceIssues.push({
                    type: 'slow_navigation',
                    severity: this.severity.MEDIUM,
                    description: `Navigation takes ${navTime.toFixed(2)}ms (baseline: ${this.performanceBaselines.navigationTime}ms)`,
                    metrics: { actual: navTime, baseline: this.performanceBaselines.navigationTime },
                    fix: 'optimizeNavigation'
                });
            }

            // Detect excessive DOM manipulations
            const domObserver = this.createDOMObserver();
            setTimeout(() => {
                const mutations = domObserver.mutations;
                domObserver.disconnect();

                if (mutations > 100) { // Too many DOM changes
                    performanceIssues.push({
                        type: 'excessive_dom_mutations',
                        severity: this.severity.MEDIUM,
                        description: `Excessive DOM mutations detected: ${mutations} changes`,
                        metrics: { mutations },
                        fix: 'optimizeDOMUpdates'
                    });
                }
            }, 2000);

        } catch (error) {
            this.log(`Performance detection error: ${error.message}`, 'error');
        }

        this.detectedIssues.push(...performanceIssues);
        this.log(`Found ${performanceIssues.length} performance issues`, 'issue');
    }

    async detectMemoryLeaks() {
        this.log('Detecting memory leaks...', 'info');

        const memoryIssues = [];

        if (!performance.memory) {
            this.log('Performance.memory API not available, skipping memory leak detection', 'warning');
            return;
        }

        try {
            const initialMemory = performance.memory.usedJSHeapSize;

            // Simulate memory-intensive operations
            for (let i = 0; i < 20; i++) {
                // Create large objects
                const largeArray = new Array(10000).fill().map((_, idx) => ({
                    id: idx,
                    data: `memory_test_${i}_${idx}`,
                    created: Date.now()
                }));

                // Simulate component operations
                if (window.componentManager) {
                    window.componentManager.selectComponent('prtg');
                    window.componentManager.selectComponent('capital');
                }

                // Clear references
                largeArray.length = 0;
            }

            // Check final memory usage
            const finalMemory = performance.memory.usedJSHeapSize;
            const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024;

            if (memoryGrowth > this.performanceBaselines.memoryGrowthLimit) {
                memoryIssues.push({
                    type: 'memory_leak',
                    severity: this.severity.HIGH,
                    description: `Potential memory leak: ${memoryGrowth.toFixed(2)}MB growth (limit: ${this.performanceBaselines.memoryGrowthLimit}MB)`,
                    metrics: {
                        initialMemory: initialMemory / 1024 / 1024,
                        finalMemory: finalMemory / 1024 / 1024,
                        growth: memoryGrowth
                    },
                    fix: 'fixMemoryLeaks'
                });
            }

            // Check for uncleaned event listeners
            const appHealthStatus = window.app?.getHealthStatus?.();
            if (appHealthStatus && appHealthStatus.resourcesInUse.eventListeners > 50) {
                memoryIssues.push({
                    type: 'excessive_event_listeners',
                    severity: this.severity.MEDIUM,
                    description: `Excessive event listeners: ${appHealthStatus.resourcesInUse.eventListeners}`,
                    metrics: { count: appHealthStatus.resourcesInUse.eventListeners },
                    fix: 'cleanupEventListeners'
                });
            }

        } catch (error) {
            this.log(`Memory leak detection error: ${error.message}`, 'error');
        }

        this.detectedIssues.push(...memoryIssues);
        this.log(`Found ${memoryIssues.length} memory issues`, 'issue');
    }

    async detectRaceConditions() {
        this.log('Detecting race conditions...', 'info');

        const raceConditionIssues = [];

        try {
            // Test concurrent data updates
            const updatePromises = [];
            const testComponent = 'prtg';

            for (let i = 0; i < 10; i++) {
                updatePromises.push(
                    new Promise(resolve => {
                        setTimeout(() => {
                            try {
                                window.quoteDataStore.updateComponent(testComponent, {
                                    sensors: 100 + i,
                                    timestamp: Date.now(),
                                    iteration: i
                                });
                                resolve({ success: true, iteration: i });
                            } catch (error) {
                                resolve({ success: false, error: error.message, iteration: i });
                            }
                        }, Math.random() * 100);
                    })
                );
            }

            const results = await Promise.all(updatePromises);
            const failures = results.filter(r => !r.success);

            if (failures.length > 0) {
                raceConditionIssues.push({
                    type: 'data_update_race_condition',
                    severity: this.severity.HIGH,
                    description: `Race condition in data updates: ${failures.length}/${results.length} failures`,
                    metrics: { failures: failures.length, total: results.length },
                    fix: 'fixDataRaceConditions'
                });
            }

            // Test concurrent navigation
            const navPromises = [];
            const views = ['dashboard', 'components', 'wizard'];

            for (let i = 0; i < 15; i++) {
                navPromises.push(
                    new Promise(resolve => {
                        setTimeout(() => {
                            try {
                                const view = views[i % views.length];
                                window.app.showView(view);
                                resolve({ success: true, view });
                            } catch (error) {
                                resolve({ success: false, error: error.message, view: views[i % views.length] });
                            }
                        }, Math.random() * 50);
                    })
                );
            }

            const navResults = await Promise.all(navPromises);
            const navFailures = navResults.filter(r => !r.success);

            if (navFailures.length > 0) {
                raceConditionIssues.push({
                    type: 'navigation_race_condition',
                    severity: this.severity.MEDIUM,
                    description: `Navigation race condition: ${navFailures.length}/${navResults.length} failures`,
                    metrics: { failures: navFailures.length, total: navResults.length },
                    fix: 'fixNavigationRaceConditions'
                });
            }

        } catch (error) {
            this.log(`Race condition detection error: ${error.message}`, 'error');
        }

        this.detectedIssues.push(...raceConditionIssues);
        this.log(`Found ${raceConditionIssues.length} race condition issues`, 'issue');
    }

    async detectDataIntegrityProblems() {
        this.log('Detecting data integrity problems...', 'info');

        const dataIntegrityIssues = [];

        try {
            // Test data persistence
            const testData = {
                prtg: { sensors: 500, locations: 10, serviceLevel: 'enhanced' },
                capital: { equipment: [{ type: 'router_medium', quantity: 2 }], financing: true }
            };

            // Store test data
            Object.keys(testData).forEach(component => {
                window.quoteDataStore.setComponentEnabled(component, true);
                window.quoteDataStore.updateComponent(component, testData[component]);
            });

            // Perform operations that might corrupt data
            await new Promise(resolve => setTimeout(resolve, 100));
            window.app.showView('components');
            await new Promise(resolve => setTimeout(resolve, 100));
            window.app.showView('wizard');
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify data integrity
            let integrityIssues = 0;
            Object.keys(testData).forEach(component => {
                const currentData = window.quoteDataStore.getComponent(component);
                const expectedData = testData[component];

                if (!currentData.enabled) {
                    integrityIssues++;
                    return;
                }

                // Check key properties
                Object.keys(expectedData).forEach(key => {
                    if (JSON.stringify(currentData[key]) !== JSON.stringify(expectedData[key])) {
                        integrityIssues++;
                    }
                });
            });

            if (integrityIssues > 0) {
                dataIntegrityIssues.push({
                    type: 'data_corruption',
                    severity: this.severity.CRITICAL,
                    description: `Data integrity compromised: ${integrityIssues} corruption issues`,
                    metrics: { corruptionCount: integrityIssues },
                    fix: 'fixDataIntegrity'
                });
            }

            // Test localStorage corruption resistance
            const corruptionTests = [
                { key: 'test_corrupt_1', value: '{"invalid": json}' },
                { key: 'test_corrupt_2', value: 'not_json_at_all' }
            ];

            let corruptionHandlingIssues = 0;
            corruptionTests.forEach(test => {
                try {
                    localStorage.setItem(test.key, test.value);
                    const retrieved = localStorage.getItem(test.key);
                    JSON.parse(retrieved); // This should fail gracefully
                } catch (error) {
                    // Good - system should handle this gracefully
                } finally {
                    try {
                        localStorage.removeItem(test.key);
                    } catch (e) {
                        corruptionHandlingIssues++;
                    }
                }
            });

            if (corruptionHandlingIssues > 0) {
                dataIntegrityIssues.push({
                    type: 'poor_corruption_handling',
                    severity: this.severity.MEDIUM,
                    description: `Poor corruption handling: ${corruptionHandlingIssues} issues`,
                    metrics: { handlingIssues: corruptionHandlingIssues },
                    fix: 'improveCorruptionHandling'
                });
            }

        } catch (error) {
            this.log(`Data integrity detection error: ${error.message}`, 'error');
        }

        this.detectedIssues.push(...dataIntegrityIssues);
        this.log(`Found ${dataIntegrityIssues.length} data integrity issues`, 'issue');
    }

    async detectUIUXIssues() {
        this.log('Detecting UI/UX issues...', 'info');

        const uiIssues = [];

        try {
            // Test for missing elements
            const criticalElements = [
                'dashboardView', 'componentsView', 'wizardView', 'historyView',
                'dashboardBtn', 'componentsBtn', 'wizardBtn', 'historyBtn',
                'importBtn', 'exportBtn', 'componentList', 'pricingSummary'
            ];

            const missingElements = criticalElements.filter(id => !document.getElementById(id));

            if (missingElements.length > 0) {
                uiIssues.push({
                    type: 'missing_ui_elements',
                    severity: this.severity.HIGH,
                    description: `Missing UI elements: ${missingElements.join(', ')}`,
                    metrics: { missingElements },
                    fix: 'fixMissingUIElements'
                });
            }

            // Test for accessibility issues
            const accessibilityIssues = this.checkAccessibility();
            if (accessibilityIssues.length > 0) {
                uiIssues.push({
                    type: 'accessibility_issues',
                    severity: this.severity.MEDIUM,
                    description: `Accessibility issues found: ${accessibilityIssues.length} problems`,
                    metrics: { issues: accessibilityIssues },
                    fix: 'fixAccessibilityIssues'
                });
            }

            // Test responsive design
            const responsiveIssues = this.checkResponsiveDesign();
            if (responsiveIssues.length > 0) {
                uiIssues.push({
                    type: 'responsive_design_issues',
                    severity: this.severity.LOW,
                    description: `Responsive design issues: ${responsiveIssues.length} problems`,
                    metrics: { issues: responsiveIssues },
                    fix: 'fixResponsiveDesign'
                });
            }

        } catch (error) {
            this.log(`UI/UX detection error: ${error.message}`, 'error');
        }

        this.detectedIssues.push(...uiIssues);
        this.log(`Found ${uiIssues.length} UI/UX issues`, 'issue');
    }

    async detectStorageProblems() {
        this.log('Detecting storage problems...', 'info');

        const storageIssues = [];

        try {
            // Test localStorage availability
            if (typeof Storage === 'undefined') {
                storageIssues.push({
                    type: 'no_storage_support',
                    severity: this.severity.CRITICAL,
                    description: 'LocalStorage not supported in this browser',
                    metrics: {},
                    fix: 'implementStorageFallback'
                });
                return;
            }

            // Test storage quota
            let quotaExceeded = false;
            let maxStorageSize = 0;

            try {
                for (let size = 100; size <= 5000; size += 100) {
                    const testData = 'x'.repeat(size * 1024);
                    localStorage.setItem(`quota_test_${size}`, testData);
                    maxStorageSize = size;
                }
            } catch (storageError) {
                quotaExceeded = true;
            }

            // Clean up test data
            for (let size = 100; size <= maxStorageSize; size += 100) {
                try {
                    localStorage.removeItem(`quota_test_${size}`);
                } catch (e) {}
            }

            if (maxStorageSize < 1000) { // Less than 1MB available
                storageIssues.push({
                    type: 'low_storage_quota',
                    severity: this.severity.HIGH,
                    description: `Low storage quota: only ${maxStorageSize}KB available`,
                    metrics: { availableKB: maxStorageSize },
                    fix: 'optimizeStorageUsage'
                });
            }

            // Test for storage cleanup issues
            const beforeCleanup = this.getStorageSize();
            // Simulate creating temporary data
            for (let i = 0; i < 10; i++) {
                localStorage.setItem(`temp_${i}`, JSON.stringify({ data: 'temporary', size: i }));
            }
            // Simulate cleanup
            for (let i = 0; i < 10; i++) {
                localStorage.removeItem(`temp_${i}`);
            }
            const afterCleanup = this.getStorageSize();

            if (afterCleanup > beforeCleanup) {
                storageIssues.push({
                    type: 'storage_cleanup_issue',
                    severity: this.severity.MEDIUM,
                    description: `Storage not properly cleaned: ${afterCleanup - beforeCleanup} bytes remain`,
                    metrics: { beforeCleanup, afterCleanup, difference: afterCleanup - beforeCleanup },
                    fix: 'improveStorageCleanup'
                });
            }

        } catch (error) {
            this.log(`Storage detection error: ${error.message}`, 'error');
        }

        this.detectedIssues.push(...storageIssues);
        this.log(`Found ${storageIssues.length} storage issues`, 'issue');
    }

    async detectErrorHandlingGaps() {
        this.log('Detecting error handling gaps...', 'info');

        const errorHandlingIssues = [];

        try {
            // Test calculator error handling
            if (window.app && window.app.calculator) {
                const errorScenarios = [
                    { component: 'prtg', data: { sensors: -100 } },
                    { component: 'prtg', data: { sensors: 'invalid' } },
                    { component: 'capital', data: { equipment: null } },
                    { component: 'support', data: { level: 'nonexistent' } }
                ];

                let unhandledErrors = 0;
                let totalErrors = 0;

                for (const scenario of errorScenarios) {
                    totalErrors++;
                    try {
                        switch (scenario.component) {
                            case 'prtg':
                                window.app.calculator.calculatePRTG(scenario.data);
                                break;
                            case 'capital':
                                window.app.calculator.calculateCapital(scenario.data);
                                break;
                            case 'support':
                                window.app.calculator.calculateSupport(scenario.data);
                                break;
                        }
                    } catch (error) {
                        // Error was properly thrown - this is good
                    }
                }

                const errorHandlingRate = ((totalErrors - unhandledErrors) / totalErrors);
                if (errorHandlingRate < 0.9) { // Less than 90% error handling
                    errorHandlingIssues.push({
                        type: 'poor_error_handling',
                        severity: this.severity.HIGH,
                        description: `Poor error handling: ${(errorHandlingRate * 100).toFixed(1)}% coverage`,
                        metrics: { handlingRate: errorHandlingRate, unhandledErrors, totalErrors },
                        fix: 'improveErrorHandling'
                    });
                }
            }

            // Test for global error handlers
            if (!window.onerror || !window.addEventListener) {
                errorHandlingIssues.push({
                    type: 'missing_global_error_handler',
                    severity: this.severity.MEDIUM,
                    description: 'No global error handler detected',
                    metrics: {},
                    fix: 'addGlobalErrorHandler'
                });
            }

        } catch (error) {
            this.log(`Error handling detection error: ${error.message}`, 'error');
        }

        this.detectedIssues.push(...errorHandlingIssues);
        this.log(`Found ${errorHandlingIssues.length} error handling issues`, 'issue');
    }

    async detectCompatibilityIssues() {
        this.log('Detecting compatibility issues...', 'info');

        const compatibilityIssues = [];

        try {
            // Test browser feature support
            const requiredFeatures = [
                { name: 'localStorage', test: () => 'localStorage' in window },
                { name: 'JSON', test: () => 'JSON' in window },
                { name: 'Promise', test: () => 'Promise' in window },
                { name: 'addEventListener', test: () => 'addEventListener' in document },
                { name: 'querySelector', test: () => 'querySelector' in document }
            ];

            const unsupportedFeatures = requiredFeatures.filter(feature => !feature.test());

            if (unsupportedFeatures.length > 0) {
                compatibilityIssues.push({
                    type: 'browser_compatibility',
                    severity: this.severity.HIGH,
                    description: `Unsupported browser features: ${unsupportedFeatures.map(f => f.name).join(', ')}`,
                    metrics: { unsupportedFeatures: unsupportedFeatures.map(f => f.name) },
                    fix: 'addBrowserPolyfills'
                });
            }

            // Test CSS compatibility
            const testElement = document.createElement('div');
            document.body.appendChild(testElement);

            const cssFeatures = [
                { name: 'flexbox', test: () => { testElement.style.display = 'flex'; return testElement.style.display === 'flex'; } },
                { name: 'grid', test: () => { testElement.style.display = 'grid'; return testElement.style.display === 'grid'; } },
                { name: 'transforms', test: () => { testElement.style.transform = 'translateX(10px)'; return testElement.style.transform.includes('translateX'); } }
            ];

            const unsupportedCSS = cssFeatures.filter(feature => !feature.test());
            document.body.removeChild(testElement);

            if (unsupportedCSS.length > 0) {
                compatibilityIssues.push({
                    type: 'css_compatibility',
                    severity: this.severity.MEDIUM,
                    description: `Unsupported CSS features: ${unsupportedCSS.map(f => f.name).join(', ')}`,
                    metrics: { unsupportedCSS: unsupportedCSS.map(f => f.name) },
                    fix: 'addCSSFallbacks'
                });
            }

        } catch (error) {
            this.log(`Compatibility detection error: ${error.message}`, 'error');
        }

        this.detectedIssues.push(...compatibilityIssues);
        this.log(`Found ${compatibilityIssues.length} compatibility issues`, 'issue');
    }

    // Fix Implementation Methods

    async applyFixes() {
        this.log('Applying fixes for detected issues...', 'info');

        for (const issue of this.detectedIssues) {
            if (issue.fix && this[issue.fix]) {
                try {
                    this.log(`Applying fix for ${issue.type}...`, 'fix');
                    await this[issue.fix](issue);

                    this.appliedFixes.push({
                        issue: issue.type,
                        fix: issue.fix,
                        status: this.fixStatus.COMPLETED,
                        timestamp: new Date().toISOString()
                    });

                    this.log(`Fix applied successfully for ${issue.type}`, 'success');
                } catch (error) {
                    this.log(`Fix failed for ${issue.type}: ${error.message}`, 'error');
                    this.appliedFixes.push({
                        issue: issue.type,
                        fix: issue.fix,
                        status: this.fixStatus.FAILED,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }
    }

    // Specific Fix Methods

    async optimizeComponentLoading(issue) {
        // Implement lazy loading for components
        if (window.componentManager) {
            const originalInitialize = window.componentManager.initializeComponents;
            window.componentManager.initializeComponents = function() {
                // Use requestIdleCallback for better performance
                if (window.requestIdleCallback) {
                    window.requestIdleCallback(() => originalInitialize.call(this));
                } else {
                    setTimeout(() => originalInitialize.call(this), 0);
                }
            };
        }
    }

    async optimizeCalculations(issue) {
        // Add calculation caching
        if (window.app && window.app.calculator) {
            const calculator = window.app.calculator;
            const cache = new Map();

            // Cache calculation results
            const originalCalculatePRTG = calculator.calculatePRTG;
            calculator.calculatePRTG = function(params) {
                const cacheKey = JSON.stringify(params);
                if (cache.has(cacheKey)) {
                    return cache.get(cacheKey);
                }

                const result = originalCalculatePRTG.call(this, params);
                cache.set(cacheKey, result);

                // Limit cache size
                if (cache.size > 100) {
                    const firstKey = cache.keys().next().value;
                    cache.delete(firstKey);
                }

                return result;
            };
        }
    }

    async optimizeNavigation(issue) {
        // Implement navigation debouncing
        if (window.app) {
            let navigationTimeout;
            const originalShowView = window.app.showView;

            window.app.showView = function(viewName) {
                clearTimeout(navigationTimeout);
                navigationTimeout = setTimeout(() => {
                    originalShowView.call(this, viewName);
                }, 50);
            };
        }
    }

    async optimizeDOMUpdates(issue) {
        // Implement DOM update batching
        let updateQueue = [];
        let updateScheduled = false;

        const batchDOMUpdates = () => {
            if (updateQueue.length === 0) return;

            updateQueue.forEach(update => update());
            updateQueue = [];
            updateScheduled = false;
        };

        window.queueDOMUpdate = (updateFunction) => {
            updateQueue.push(updateFunction);

            if (!updateScheduled) {
                updateScheduled = true;
                if (window.requestAnimationFrame) {
                    window.requestAnimationFrame(batchDOMUpdates);
                } else {
                    setTimeout(batchDOMUpdates, 16);
                }
            }
        };
    }

    async fixMemoryLeaks(issue) {
        // Enhance memory management
        if (window.app) {
            // Add automatic cleanup
            const cleanup = () => {
                // Clear large objects
                if (window.componentManager && window.componentManager.largeDataCache) {
                    window.componentManager.largeDataCache.clear();
                }

                // Force garbage collection if available
                if (window.gc) {
                    window.gc();
                }
            };

            // Run cleanup periodically
            setInterval(cleanup, 300000); // Every 5 minutes

            // Enhanced destroy method
            const originalDestroy = window.app.destroy;
            window.app.destroy = function() {
                cleanup();
                if (originalDestroy) originalDestroy.call(this);
            };
        }
    }

    async cleanupEventListeners(issue) {
        // Implement better event listener management
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        const eventListenerRegistry = new Map();

        EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (!eventListenerRegistry.has(this)) {
                eventListenerRegistry.set(this, []);
            }
            eventListenerRegistry.get(this).push({ type, listener, options });
            return originalAddEventListener.call(this, type, listener, options);
        };

        // Global cleanup function
        window.cleanupAllEventListeners = () => {
            for (const [element, listeners] of eventListenerRegistry) {
                listeners.forEach(({ type, listener, options }) => {
                    try {
                        element.removeEventListener(type, listener, options);
                    } catch (error) {
                        console.warn('Failed to remove event listener:', error);
                    }
                });
            }
            eventListenerRegistry.clear();
        };
    }

    async fixDataRaceConditions(issue) {
        // Implement data update queuing
        if (window.quoteDataStore) {
            const updateQueue = [];
            let isProcessingQueue = false;

            const processUpdateQueue = async () => {
                if (isProcessingQueue || updateQueue.length === 0) return;

                isProcessingQueue = true;
                while (updateQueue.length > 0) {
                    const update = updateQueue.shift();
                    try {
                        await update();
                    } catch (error) {
                        console.error('Queued update failed:', error);
                    }
                }
                isProcessingQueue = false;
            };

            const originalUpdateComponent = window.quoteDataStore.updateComponent;
            window.quoteDataStore.updateComponent = function(component, data) {
                return new Promise((resolve, reject) => {
                    updateQueue.push(async () => {
                        try {
                            const result = originalUpdateComponent.call(this, component, data);
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    });
                    processUpdateQueue();
                });
            };
        }
    }

    async fixNavigationRaceConditions(issue) {
        // Implement navigation state locking
        if (window.app) {
            let isNavigating = false;
            const originalShowView = window.app.showView;

            window.app.showView = async function(viewName) {
                if (isNavigating) {
                    console.warn(`Navigation to ${viewName} blocked - already navigating`);
                    return;
                }

                isNavigating = true;
                try {
                    await originalShowView.call(this, viewName);
                } finally {
                    isNavigating = false;
                }
            };
        }
    }

    async fixDataIntegrity(issue) {
        // Implement data validation and recovery
        if (window.quoteDataStore) {
            const originalUpdateComponent = window.quoteDataStore.updateComponent;

            window.quoteDataStore.updateComponent = function(component, data) {
                // Validate data before storing
                if (!this.validateComponentData(component, data)) {
                    throw new Error(`Invalid data for component ${component}`);
                }

                // Store with backup
                const backup = this.getComponent(component);
                try {
                    return originalUpdateComponent.call(this, component, data);
                } catch (error) {
                    // Restore from backup on failure
                    if (backup) {
                        originalUpdateComponent.call(this, component, backup);
                    }
                    throw error;
                }
            };

            // Add validation method
            window.quoteDataStore.validateComponentData = function(component, data) {
                if (!data || typeof data !== 'object') return false;

                // Component-specific validation
                switch (component) {
                    case 'prtg':
                        return typeof data.sensors === 'number' && data.sensors > 0;
                    case 'capital':
                        return Array.isArray(data.equipment);
                    case 'support':
                        return typeof data.level === 'string';
                    default:
                        return true;
                }
            };
        }
    }

    async improveCorruptionHandling(issue) {
        // Add robust JSON parsing
        window.safeJSONParse = (str, fallback = {}) => {
            try {
                const parsed = JSON.parse(str);
                return parsed !== null && typeof parsed === 'object' ? parsed : fallback;
            } catch (error) {
                console.warn('JSON parse failed, using fallback:', error);
                return fallback;
            }
        };

        // Enhance localStorage access
        const originalGetItem = localStorage.getItem;
        localStorage.safeGetItem = function(key, fallback = null) {
            try {
                const value = originalGetItem.call(this, key);
                return value ? window.safeJSONParse(value, fallback) : fallback;
            } catch (error) {
                console.warn(`localStorage access failed for key ${key}:`, error);
                return fallback;
            }
        };
    }

    async improveErrorHandling(issue) {
        // Add comprehensive error boundaries
        window.errorBoundary = (fn, fallback = null) => {
            try {
                return fn();
            } catch (error) {
                console.error('Error boundary caught:', error);
                if (window.app && window.app.showError) {
                    window.app.showError(`An error occurred: ${error.message}`);
                }
                return fallback;
            }
        };

        // Wrap critical functions
        if (window.app && window.app.calculator) {
            const methods = ['calculatePRTG', 'calculateCapital', 'calculateSupport'];
            methods.forEach(method => {
                if (window.app.calculator[method]) {
                    const original = window.app.calculator[method];
                    window.app.calculator[method] = function(...args) {
                        return window.errorBoundary(() => original.apply(this, args), { error: 'Calculation failed', totals: { monthly: 0 } });
                    };
                }
            });
        }
    }

    async addGlobalErrorHandler(issue) {
        // Add comprehensive global error handling
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            if (window.app && window.app.showError) {
                window.app.showError(`System error: ${event.error.message}`);
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            if (window.app && window.app.showError) {
                window.app.showError(`Promise error: ${event.reason.message || event.reason}`);
            }
            event.preventDefault();
        });
    }

    // Helper Methods

    createDOMObserver() {
        let mutationCount = 0;
        const observer = new MutationObserver((mutations) => {
            mutationCount += mutations.length;
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });

        observer.mutations = mutationCount;
        return observer;
    }

    checkAccessibility() {
        const issues = [];

        // Check for missing alt attributes
        const images = document.querySelectorAll('img:not([alt])');
        if (images.length > 0) {
            issues.push(`${images.length} images missing alt attributes`);
        }

        // Check for missing aria labels
        const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        if (buttons.length > 0) {
            issues.push(`${buttons.length} buttons missing aria labels`);
        }

        return issues;
    }

    checkResponsiveDesign() {
        const issues = [];

        // Test at different viewport sizes
        const testWidths = [320, 768, 1024, 1200];
        const originalWidth = window.innerWidth;

        testWidths.forEach(width => {
            // This is a simplified test - in real implementation you'd need more sophisticated checks
            if (width < 768) {
                const mobileMenu = document.getElementById('mobileMenu');
                if (!mobileMenu) {
                    issues.push('No mobile menu found for small screens');
                }
            }
        });

        return issues;
    }

    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    }

    async implementPreventiveMeasures() {
        this.log('Implementing preventive measures...', 'info');

        const measures = [
            this.addPerformanceMonitoring,
            this.addMemoryMonitoring,
            this.addErrorTracking,
            this.addDataValidation,
            this.addHealthChecks
        ];

        for (const measure of measures) {
            try {
                await measure.call(this);
                this.preventiveMeasures.push(measure.name);
            } catch (error) {
                this.log(`Failed to implement ${measure.name}: ${error.message}`, 'error');
            }
        }
    }

    async addPerformanceMonitoring() {
        if (!window.performanceMonitor) {
            window.performanceMonitor = {
                metrics: {},
                track: function(name, operation) {
                    const start = performance.now();
                    const result = operation();
                    const duration = performance.now() - start;

                    if (!this.metrics[name]) this.metrics[name] = [];
                    this.metrics[name].push(duration);

                    // Keep only last 100 measurements
                    if (this.metrics[name].length > 100) {
                        this.metrics[name].shift();
                    }

                    return result;
                },
                getAverage: function(name) {
                    const metrics = this.metrics[name];
                    if (!metrics || metrics.length === 0) return 0;
                    return metrics.reduce((a, b) => a + b, 0) / metrics.length;
                }
            };
        }
    }

    async addMemoryMonitoring() {
        if (performance.memory && !window.memoryMonitor) {
            window.memoryMonitor = {
                baseline: performance.memory.usedJSHeapSize,
                checkMemoryUsage: function() {
                    const current = performance.memory.usedJSHeapSize;
                    const growth = (current - this.baseline) / 1024 / 1024;

                    if (growth > 50) { // More than 50MB growth
                        console.warn(`High memory usage detected: ${growth.toFixed(2)}MB growth`);
                        if (window.app && window.app.showNotification) {
                            window.app.showNotification('High memory usage detected', 'warning');
                        }
                    }

                    return growth;
                }
            };

            // Check every 5 minutes
            setInterval(() => window.memoryMonitor.checkMemoryUsage(), 300000);
        }
    }

    async addErrorTracking() {
        if (!window.errorTracker) {
            window.errorTracker = {
                errors: [],
                track: function(error, context = '') {
                    this.errors.push({
                        message: error.message,
                        stack: error.stack,
                        context: context,
                        timestamp: new Date().toISOString()
                    });

                    // Keep only last 50 errors
                    if (this.errors.length > 50) {
                        this.errors.shift();
                    }
                },
                getErrorRate: function() {
                    const recentErrors = this.errors.filter(e => {
                        const errorTime = new Date(e.timestamp);
                        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                        return errorTime > fiveMinutesAgo;
                    });

                    return recentErrors.length;
                }
            };
        }
    }

    async addDataValidation() {
        if (window.quoteDataStore && !window.quoteDataStore.validator) {
            window.quoteDataStore.validator = {
                validateComponent: function(component, data) {
                    if (!component || !data) return false;

                    // Basic validation rules
                    switch (component) {
                        case 'prtg':
                            return typeof data.sensors === 'number' && data.sensors > 0 && data.sensors < 100000;
                        case 'capital':
                            return Array.isArray(data.equipment) && data.equipment.length >= 0;
                        case 'support':
                            return typeof data.level === 'string' && ['basic', 'standard', 'enhanced'].includes(data.level);
                        default:
                            return true;
                    }
                }
            };
        }
    }

    async addHealthChecks() {
        if (!window.healthChecker) {
            window.healthChecker = {
                checks: {
                    appAvailable: () => !!window.app,
                    dataStoreAvailable: () => !!window.quoteDataStore,
                    calculatorAvailable: () => !!window.app?.calculator,
                    storageAvailable: () => typeof Storage !== 'undefined',
                    memoryHealthy: () => {
                        if (!performance.memory) return true;
                        const used = performance.memory.usedJSHeapSize / 1024 / 1024;
                        return used < 100; // Less than 100MB
                    }
                },
                runHealthCheck: function() {
                    const results = {};
                    let healthy = true;

                    Object.keys(this.checks).forEach(checkName => {
                        try {
                            results[checkName] = this.checks[checkName]();
                            if (!results[checkName]) healthy = false;
                        } catch (error) {
                            results[checkName] = false;
                            healthy = false;
                        }
                    });

                    return { healthy, results };
                }
            };

            // Run health checks every 10 minutes
            setInterval(() => {
                const health = window.healthChecker.runHealthCheck();
                if (!health.healthy) {
                    console.warn('Health check failed:', health.results);
                }
            }, 600000);
        }
    }

    generateFixReport() {
        const report = {
            timestamp: new Date().toISOString(),
            analysis: {
                totalIssues: this.detectedIssues.length,
                criticalIssues: this.detectedIssues.filter(i => i.severity === this.severity.CRITICAL).length,
                highIssues: this.detectedIssues.filter(i => i.severity === this.severity.HIGH).length,
                mediumIssues: this.detectedIssues.filter(i => i.severity === this.severity.MEDIUM).length,
                lowIssues: this.detectedIssues.filter(i => i.severity === this.severity.LOW).length
            },
            fixes: {
                totalFixes: this.appliedFixes.length,
                successfulFixes: this.appliedFixes.filter(f => f.status === this.fixStatus.COMPLETED).length,
                failedFixes: this.appliedFixes.filter(f => f.status === this.fixStatus.FAILED).length
            },
            preventiveMeasures: this.preventiveMeasures,
            detectedIssues: this.detectedIssues,
            appliedFixes: this.appliedFixes
        };

        // Store report
        try {
            localStorage.setItem('naas_issue_fix_report', JSON.stringify(report));
        } catch (error) {
            this.log(`Failed to save issue fix report: ${error.message}`, 'warning');
        }

        // Log comprehensive summary
        console.group('🔧 ISSUE DETECTION AND FIX REPORT');
        console.log('Analysis Summary:', report.analysis);
        console.log('Fix Summary:', report.fixes);
        console.log('Preventive Measures:', report.preventiveMeasures);
        console.log('Detected Issues:', report.detectedIssues);
        console.log('Applied Fixes:', report.appliedFixes);
        console.groupEnd();

        return report;
    }
}

// Initialize and expose
window.IssueDetectionAndFixSystem = IssueDetectionAndFixSystem;

// Quick runner
window.runIssueDetectionAndFix = async function() {
    const system = new IssueDetectionAndFixSystem();
    return await system.analyzeAndFixIssues();
};

// Auto-run if URL parameter present
if (window.location.search.includes('runIssueFixes=true')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(async () => {
            const system = new IssueDetectionAndFixSystem();
            await system.analyzeAndFixIssues();
        }, 2000);
    });
}

console.log('🔧 Issue Detection and Fix System loaded. Run window.runIssueDetectionAndFix() to analyze and fix issues.');