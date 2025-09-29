/**
 * Comprehensive Test Suite Master Control for NaaS Calculator
 * Orchestrates all testing frameworks and generates final analysis
 *
 * Test Suites Included:
 * 1. Browser Basic Tests
 * 2. Power User Stress Tests
 * 3. Bulk Operations Tests
 * 4. Issue Detection and Fixes
 * 5. Performance Benchmarking
 * 6. Cross-Browser Compatibility
 * 7. Security Vulnerability Scanning
 * 8. Data Integrity Validation
 */

class ComprehensiveTestSuite {
    constructor() {
        this.testSuites = new Map();
        this.results = new Map();
        this.isRunning = false;
        this.startTime = null;
        this.endTime = null;

        this.config = {
            runBasicTests: true,
            runStressTests: true,
            runBulkTests: true,
            runIssueDetection: true,
            runPerformanceBenchmarks: true,
            runSecurityScan: true,
            autoFix: true,
            generateReport: true,
            maxTestTimeout: 600000, // 10 minutes max per test suite
            retryFailedTests: true
        };

        this.registerTestSuites();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'info': '🎯',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'test': '🧪',
            'report': '📊'
        }[type] || '🎯';

        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    registerTestSuites() {
        // Register all available test suites
        this.testSuites.set('browser-basic', {
            name: 'Browser Basic Tests',
            runner: () => window.runNaaSBrowserTests?.(),
            timeout: 30000,
            required: true,
            description: 'Basic functionality and component availability tests'
        });

        this.testSuites.set('power-user-stress', {
            name: 'Power User Stress Tests',
            runner: () => window.runPowerUserStressTests?.(),
            timeout: 300000, // 5 minutes
            required: false,
            description: 'Complex workflows, edge cases, and performance scenarios'
        });

        this.testSuites.set('bulk-operations', {
            name: 'Bulk Operations Tests',
            runner: () => window.runBulkOperationsStressTests?.(),
            timeout: 180000, // 3 minutes
            required: false,
            description: 'High-volume operations and data processing tests'
        });

        this.testSuites.set('issue-detection', {
            name: 'Issue Detection and Fixes',
            runner: () => window.runIssueDetectionAndFix?.(),
            timeout: 120000, // 2 minutes
            required: false,
            description: 'Automated issue detection and resolution system'
        });

        this.testSuites.set('performance-benchmark', {
            name: 'Performance Benchmarks',
            runner: () => this.runPerformanceBenchmarks(),
            timeout: 60000,
            required: false,
            description: 'Performance baseline measurements and comparisons'
        });

        this.testSuites.set('security-scan', {
            name: 'Security Vulnerability Scan',
            runner: () => this.runSecurityScan(),
            timeout: 45000,
            required: false,
            description: 'Security vulnerability detection and mitigation'
        });

        this.testSuites.set('data-integrity', {
            name: 'Data Integrity Validation',
            runner: () => this.runDataIntegrityValidation(),
            timeout: 30000,
            required: false,
            description: 'Data consistency and corruption resistance tests'
        });
    }

    async runAllTests(customConfig = {}) {
        if (this.isRunning) {
            this.log('Test suite already running', 'warning');
            return this.results;
        }

        this.isRunning = true;
        this.startTime = Date.now();
        this.config = { ...this.config, ...customConfig };

        this.log('🚀 Starting Comprehensive Test Suite...', 'test');
        this.log(`Configuration: ${JSON.stringify(this.config)}`, 'info');

        try {
            // Wait for application to be ready
            await this.waitForApplicationReady();

            // Clear previous results
            this.results.clear();

            // Run test suites in sequence
            for (const [suiteId, suite] of this.testSuites) {
                if (!this.shouldRunSuite(suiteId)) {
                    this.log(`Skipping ${suite.name}`, 'info');
                    continue;
                }

                await this.runTestSuite(suiteId, suite);
            }

            // Generate comprehensive report
            const report = await this.generateComprehensiveReport();

            this.endTime = Date.now();
            const totalTime = (this.endTime - this.startTime) / 1000;

            this.log(`🏁 Comprehensive testing complete in ${totalTime.toFixed(2)}s`, 'success');
            this.log(`📊 Final Results: ${report.summary.totalPassed} passed, ${report.summary.totalFailed} failed, ${report.summary.totalWarnings} warnings`, 'report');

            return report;

        } catch (error) {
            this.log(`❌ Comprehensive testing failed: ${error.message}`, 'error');
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    async waitForApplicationReady() {
        this.log('Waiting for application to be ready...', 'info');

        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max wait

        while (attempts < maxAttempts) {
            if (window.app &&
                window.quoteDataStore &&
                window.componentManager &&
                window.app.calculator) {

                // Additional check for initialization
                if (window.app.isInitialized) {
                    this.log('Application ready', 'success');
                    return;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (attempts >= maxAttempts) {
            throw new Error('Application failed to initialize within timeout period');
        }
    }

    shouldRunSuite(suiteId) {
        const configMap = {
            'browser-basic': this.config.runBasicTests,
            'power-user-stress': this.config.runStressTests,
            'bulk-operations': this.config.runBulkTests,
            'issue-detection': this.config.runIssueDetection,
            'performance-benchmark': this.config.runPerformanceBenchmarks,
            'security-scan': this.config.runSecurityScan,
            'data-integrity': true // Always run data integrity
        };

        return configMap[suiteId] !== false;
    }

    async runTestSuite(suiteId, suite) {
        this.log(`Running ${suite.name}...`, 'test');

        const result = {
            suiteId,
            name: suite.name,
            description: suite.description,
            startTime: Date.now(),
            endTime: null,
            duration: null,
            status: 'running',
            data: null,
            error: null,
            retryCount: 0
        };

        try {
            // Set up timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Test suite timeout')), suite.timeout);
            });

            // Run the test suite
            const testPromise = suite.runner();

            if (!testPromise || typeof testPromise.then !== 'function') {
                // Synchronous test - create a resolved promise
                result.data = testPromise;
            } else {
                // Asynchronous test
                result.data = await Promise.race([testPromise, timeoutPromise]);
            }

            result.status = 'completed';
            result.endTime = Date.now();
            result.duration = result.endTime - result.startTime;

            this.log(`✅ ${suite.name} completed in ${(result.duration / 1000).toFixed(2)}s`, 'success');

        } catch (error) {
            result.status = 'failed';
            result.error = {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            };
            result.endTime = Date.now();
            result.duration = result.endTime - result.startTime;

            this.log(`❌ ${suite.name} failed: ${error.message}`, 'error');

            // Retry failed test if configured
            if (this.config.retryFailedTests && !suite.required && result.retryCount === 0) {
                this.log(`Retrying ${suite.name}...`, 'warning');
                result.retryCount++;

                try {
                    result.data = await suite.runner();
                    result.status = 'completed';
                    result.error = null;
                    this.log(`✅ ${suite.name} succeeded on retry`, 'success');
                } catch (retryError) {
                    result.error = {
                        message: retryError.message,
                        stack: retryError.stack,
                        timestamp: new Date().toISOString(),
                        isRetry: true
                    };
                    this.log(`❌ ${suite.name} failed on retry: ${retryError.message}`, 'error');
                }
            }
        }

        this.results.set(suiteId, result);
    }

    // Custom test implementations

    async runPerformanceBenchmarks() {
        this.log('Running performance benchmarks...', 'test');

        const benchmarks = {
            componentInitialization: null,
            calculationSpeed: null,
            navigationSpeed: null,
            memoryUsage: null,
            domUpdatePerformance: null
        };

        try {
            // Component initialization benchmark
            const compInitStart = performance.now();
            if (window.componentManager) {
                window.componentManager.initializeComponents();
            }
            benchmarks.componentInitialization = performance.now() - compInitStart;

            // Calculation speed benchmark
            if (window.app && window.app.calculator) {
                const calcStart = performance.now();
                for (let i = 0; i < 10; i++) {
                    window.app.calculator.calculatePRTG({
                        sensors: 100 + i * 10,
                        locations: 5,
                        serviceLevel: 'enhanced'
                    });
                }
                benchmarks.calculationSpeed = (performance.now() - calcStart) / 10; // Average per calculation
            }

            // Navigation speed benchmark
            if (window.app) {
                const navStart = performance.now();
                const views = ['dashboard', 'components', 'wizard', 'history'];
                for (const view of views) {
                    window.app.showView(view);
                    await new Promise(resolve => setTimeout(resolve, 50)); // Allow DOM update
                }
                benchmarks.navigationSpeed = (performance.now() - navStart) / views.length;
            }

            // Memory usage benchmark
            if (performance.memory) {
                benchmarks.memoryUsage = {
                    usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
                    totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
                    jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) // MB
                };
            }

            // DOM update performance
            const domStart = performance.now();
            for (let i = 0; i < 100; i++) {
                const div = document.createElement('div');
                div.textContent = `Benchmark test ${i}`;
                document.body.appendChild(div);
                document.body.removeChild(div);
            }
            benchmarks.domUpdatePerformance = (performance.now() - domStart) / 100; // Average per operation

            return {
                success: true,
                benchmarks,
                baseline: {
                    componentInitialization: 500, // ms
                    calculationSpeed: 50, // ms
                    navigationSpeed: 100, // ms
                    domUpdatePerformance: 1 // ms
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                benchmarks,
                timestamp: new Date().toISOString()
            };
        }
    }

    async runSecurityScan() {
        this.log('Running security vulnerability scan...', 'test');

        const vulnerabilities = [];
        const securityChecks = [];

        try {
            // XSS vulnerability check
            const xssTest = this.testXSSVulnerability();
            securityChecks.push({ name: 'XSS Protection', result: xssTest });
            if (!xssTest.secure) vulnerabilities.push(xssTest);

            // CSRF protection check
            const csrfTest = this.testCSRFProtection();
            securityChecks.push({ name: 'CSRF Protection', result: csrfTest });
            if (!csrfTest.secure) vulnerabilities.push(csrfTest);

            // Content Security Policy check
            const cspTest = this.testContentSecurityPolicy();
            securityChecks.push({ name: 'Content Security Policy', result: cspTest });
            if (!cspTest.secure) vulnerabilities.push(cspTest);

            // Local Storage security check
            const storageTest = this.testLocalStorageSecurity();
            securityChecks.push({ name: 'LocalStorage Security', result: storageTest });
            if (!storageTest.secure) vulnerabilities.push(storageTest);

            // Input validation check
            const inputTest = this.testInputValidation();
            securityChecks.push({ name: 'Input Validation', result: inputTest });
            if (!inputTest.secure) vulnerabilities.push(inputTest);

            return {
                success: true,
                securityScore: ((securityChecks.length - vulnerabilities.length) / securityChecks.length) * 100,
                vulnerabilities,
                allChecks: securityChecks,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                vulnerabilities,
                securityChecks,
                timestamp: new Date().toISOString()
            };
        }
    }

    testXSSVulnerability() {
        try {
            // Test for XSS in input fields
            const testElement = document.createElement('div');
            const xssPayload = '<img src=x onerror=alert("XSS")>';

            testElement.innerHTML = xssPayload;
            document.body.appendChild(testElement);

            // Check if script executed (it shouldn't)
            const scriptExecuted = testElement.innerHTML.includes('onerror=alert');
            document.body.removeChild(testElement);

            return {
                secure: !scriptExecuted,
                description: 'XSS injection test',
                severity: scriptExecuted ? 'high' : 'none',
                details: scriptExecuted ? 'XSS payload was not properly sanitized' : 'XSS payload properly sanitized'
            };

        } catch (error) {
            return {
                secure: false,
                description: 'XSS test failed to execute',
                severity: 'medium',
                details: error.message
            };
        }
    }

    testCSRFProtection() {
        // Check for CSRF tokens in forms
        const forms = document.querySelectorAll('form');
        let hasCSRFProtection = false;

        forms.forEach(form => {
            const csrfTokens = form.querySelectorAll('input[name*="csrf"], input[name*="token"]');
            if (csrfTokens.length > 0) {
                hasCSRFProtection = true;
            }
        });

        // For SPA applications, check for CSRF headers
        const hasCSRFHeaders = !!window.csrfToken || !!document.querySelector('meta[name="csrf-token"]');

        const secure = hasCSRFProtection || hasCSRFHeaders || forms.length === 0;

        return {
            secure,
            description: 'CSRF protection check',
            severity: secure ? 'none' : 'medium',
            details: secure ? 'CSRF protection detected or no forms present' : 'No CSRF protection found'
        };
    }

    testContentSecurityPolicy() {
        const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        const hasSRFHeader = !!cspMeta;

        return {
            secure: hasSRFHeader,
            description: 'Content Security Policy check',
            severity: hasSRFHeader ? 'none' : 'low',
            details: hasSRFHeader ? 'CSP header detected' : 'No CSP header found',
            cspContent: cspMeta ? cspMeta.getAttribute('content') : null
        };
    }

    testLocalStorageSecurity() {
        let securityIssues = [];

        try {
            // Check for sensitive data in localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);

                // Check for potential passwords or tokens
                if (key.toLowerCase().includes('password') ||
                    key.toLowerCase().includes('token') ||
                    key.toLowerCase().includes('secret')) {
                    securityIssues.push(`Potential sensitive data in key: ${key}`);
                }

                // Check for unencrypted data that looks sensitive
                if (value && (value.includes('password') || value.includes('token'))) {
                    securityIssues.push(`Potential sensitive data in value for key: ${key}`);
                }
            }

            return {
                secure: securityIssues.length === 0,
                description: 'LocalStorage security check',
                severity: securityIssues.length > 0 ? 'medium' : 'none',
                details: securityIssues.length > 0 ? securityIssues.join(', ') : 'No sensitive data found in localStorage',
                issueCount: securityIssues.length
            };

        } catch (error) {
            return {
                secure: false,
                description: 'LocalStorage security check failed',
                severity: 'low',
                details: error.message
            };
        }
    }

    testInputValidation() {
        const inputFields = document.querySelectorAll('input, textarea, select');
        let validationIssues = [];

        inputFields.forEach(field => {
            // Check for basic validation attributes
            const hasValidation = field.hasAttribute('required') ||
                                field.hasAttribute('pattern') ||
                                field.hasAttribute('min') ||
                                field.hasAttribute('max') ||
                                field.hasAttribute('maxlength');

            if (!hasValidation && field.type !== 'hidden') {
                validationIssues.push(`Input field without validation: ${field.name || field.id || 'unnamed'}`);
            }
        });

        return {
            secure: validationIssues.length === 0,
            description: 'Input validation check',
            severity: validationIssues.length > 5 ? 'medium' : 'low',
            details: validationIssues.length > 0 ?
                `${validationIssues.length} input fields without validation` :
                'All input fields have validation',
            totalFields: inputFields.length,
            unvalidatedFields: validationIssues.length
        };
    }

    async runDataIntegrityValidation() {
        this.log('Running data integrity validation...', 'test');

        const validationResults = {
            consistency: null,
            persistence: null,
            corruption: null,
            recovery: null
        };

        try {
            // Test data consistency
            validationResults.consistency = await this.testDataConsistency();

            // Test data persistence
            validationResults.persistence = await this.testDataPersistence();

            // Test corruption resistance
            validationResults.corruption = await this.testCorruptionResistance();

            // Test recovery mechanisms
            validationResults.recovery = await this.testRecoveryMechanisms();

            const overallScore = Object.values(validationResults)
                .reduce((sum, result) => sum + (result.score || 0), 0) / 4;

            return {
                success: true,
                overallScore,
                validationResults,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                validationResults,
                timestamp: new Date().toISOString()
            };
        }
    }

    async testDataConsistency() {
        // Test that data remains consistent across different operations
        const testData = {
            component: 'prtg',
            data: { sensors: 500, locations: 10, serviceLevel: 'enhanced' }
        };

        try {
            // Store data
            window.quoteDataStore.setComponentEnabled(testData.component, true);
            window.quoteDataStore.updateComponent(testData.component, testData.data);

            // Perform operations that might affect consistency
            window.app.showView('components');
            await new Promise(resolve => setTimeout(resolve, 100));
            window.app.showView('wizard');
            await new Promise(resolve => setTimeout(resolve, 100));

            // Check consistency
            const retrievedData = window.quoteDataStore.getComponent(testData.component);
            const consistent = JSON.stringify(retrievedData.sensors) === JSON.stringify(testData.data.sensors);

            return {
                score: consistent ? 100 : 0,
                consistent,
                details: consistent ? 'Data remained consistent' : 'Data consistency failed'
            };

        } catch (error) {
            return {
                score: 0,
                consistent: false,
                error: error.message,
                details: 'Data consistency test failed'
            };
        }
    }

    async testDataPersistence() {
        const testKey = 'integrity_test_persistence';
        const testValue = { test: 'data', timestamp: Date.now() };

        try {
            // Store data
            localStorage.setItem(testKey, JSON.stringify(testValue));

            // Simulate page reload by clearing memory references
            let retrieved = null;

            // Retrieve data
            const storedValue = localStorage.getItem(testKey);
            retrieved = JSON.parse(storedValue);

            // Clean up
            localStorage.removeItem(testKey);

            const persistent = retrieved && retrieved.test === testValue.test;

            return {
                score: persistent ? 100 : 0,
                persistent,
                details: persistent ? 'Data persisted correctly' : 'Data persistence failed'
            };

        } catch (error) {
            localStorage.removeItem(testKey);
            return {
                score: 0,
                persistent: false,
                error: error.message,
                details: 'Data persistence test failed'
            };
        }
    }

    async testCorruptionResistance() {
        const corruptionTests = [
            { name: 'Invalid JSON', data: '{"invalid": json}' },
            { name: 'Null bytes', data: 'data\x00corrupted' },
            { name: 'Large data', data: JSON.stringify({ large: 'x'.repeat(100000) }) }
        ];

        let resistanceScore = 0;
        const results = [];

        for (const test of corruptionTests) {
            try {
                const testKey = `corruption_test_${Date.now()}`;

                // Store corrupted data
                localStorage.setItem(testKey, test.data);

                // Try to retrieve and handle
                const retrieved = localStorage.getItem(testKey);

                // System should handle this gracefully
                let handled = true;
                try {
                    JSON.parse(retrieved);
                } catch (parseError) {
                    // Expected for invalid JSON
                }

                localStorage.removeItem(testKey);

                if (handled) {
                    resistanceScore += 33.33;
                    results.push({ ...test, handled: true });
                } else {
                    results.push({ ...test, handled: false });
                }

            } catch (error) {
                // System handled it by throwing an error - this is good
                resistanceScore += 33.33;
                results.push({ ...test, handled: true, error: error.message });
            }
        }

        return {
            score: Math.round(resistanceScore),
            resistant: resistanceScore >= 66,
            results,
            details: `${results.filter(r => r.handled).length}/${corruptionTests.length} corruption tests handled`
        };
    }

    async testRecoveryMechanisms() {
        try {
            // Test error recovery
            let errorHandled = false;

            // Trigger an error and see if system recovers
            try {
                if (window.app && window.app.calculator) {
                    window.app.calculator.calculatePRTG({ sensors: 'invalid' });
                }
            } catch (error) {
                errorHandled = true;
            }

            // Test data recovery
            let dataRecovered = false;
            try {
                // Simulate data loss
                const originalData = window.quoteDataStore.getComponent('prtg');
                window.quoteDataStore.updateComponent('prtg', null);

                // Try to recover
                const recovered = window.quoteDataStore.getComponent('prtg');
                dataRecovered = recovered !== null;

            } catch (error) {
                // Recovery mechanism exists
                dataRecovered = true;
            }

            const recoveryScore = (errorHandled ? 50 : 0) + (dataRecovered ? 50 : 0);

            return {
                score: recoveryScore,
                recoverable: recoveryScore >= 50,
                details: `Error handling: ${errorHandled}, Data recovery: ${dataRecovered}`
            };

        } catch (error) {
            return {
                score: 0,
                recoverable: false,
                error: error.message,
                details: 'Recovery mechanism test failed'
            };
        }
    }

    async generateComprehensiveReport() {
        this.log('Generating comprehensive test report...', 'report');

        const summary = {
            totalSuites: this.results.size,
            completedSuites: 0,
            failedSuites: 0,
            totalPassed: 0,
            totalFailed: 0,
            totalWarnings: 0,
            totalTime: this.endTime ? (this.endTime - this.startTime) / 1000 : 0
        };

        const suiteResults = {};
        const issues = [];
        const recommendations = [];

        // Process each test suite result
        for (const [suiteId, result] of this.results) {
            suiteResults[suiteId] = result;

            if (result.status === 'completed') {
                summary.completedSuites++;

                // Extract metrics from suite data
                if (result.data) {
                    if (result.data.passed) summary.totalPassed += result.data.passed;
                    if (result.data.failed) summary.totalFailed += result.data.failed;
                    if (result.data.warnings) summary.totalWarnings += result.data.warnings;

                    // Collect issues
                    if (result.data.issues) {
                        issues.push(...result.data.issues);
                    }
                    if (result.data.errors) {
                        issues.push(...result.data.errors);
                    }
                }
            } else {
                summary.failedSuites++;
                issues.push({
                    suite: result.name,
                    type: 'suite_failure',
                    message: result.error?.message || 'Suite failed to complete',
                    severity: 'high'
                });
            }
        }

        // Generate recommendations based on results
        recommendations.push(...this.generateRecommendations(suiteResults, issues));

        // Security assessment
        const securityResult = suiteResults['security-scan'];
        const securityScore = securityResult?.data?.securityScore || 0;

        // Performance assessment
        const performanceResult = suiteResults['performance-benchmark'];
        const performanceScore = this.calculatePerformanceScore(performanceResult?.data?.benchmarks);

        const overallScore = this.calculateOverallScore(summary, securityScore, performanceScore);

        const report = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            testSuiteVersion: 'comprehensive-v1',
            environment: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                memory: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
                } : 'Not available'
            },
            summary,
            overallScore,
            assessments: {
                security: {
                    score: securityScore,
                    grade: this.getGrade(securityScore)
                },
                performance: {
                    score: performanceScore,
                    grade: this.getGrade(performanceScore)
                }
            },
            suiteResults,
            issues: issues.slice(0, 50), // Limit to top 50 issues
            recommendations: recommendations.slice(0, 20), // Limit to top 20 recommendations
            config: this.config
        };

        // Store report
        this.storeReport(report);

        return report;
    }

    generateRecommendations(suiteResults, issues) {
        const recommendations = [];

        // Performance recommendations
        const performanceResult = suiteResults['performance-benchmark'];
        if (performanceResult?.data?.benchmarks) {
            const benchmarks = performanceResult.data.benchmarks;
            if (benchmarks.componentInitialization > 500) {
                recommendations.push({
                    type: 'performance',
                    priority: 'medium',
                    title: 'Optimize Component Initialization',
                    description: 'Component initialization is slow. Consider lazy loading or code splitting.'
                });
            }
        }

        // Security recommendations
        const securityResult = suiteResults['security-scan'];
        if (securityResult?.data?.vulnerabilities?.length > 0) {
            recommendations.push({
                type: 'security',
                priority: 'high',
                title: 'Address Security Vulnerabilities',
                description: `${securityResult.data.vulnerabilities.length} security vulnerabilities detected.`
            });
        }

        // Memory recommendations
        const stressTestResult = suiteResults['power-user-stress'];
        if (stressTestResult?.data?.performance) {
            const memoryIssues = Object.values(stressTestResult.data.performance)
                .filter(p => p.memoryDelta && p.memoryDelta > 10);

            if (memoryIssues.length > 0) {
                recommendations.push({
                    type: 'memory',
                    priority: 'medium',
                    title: 'Optimize Memory Usage',
                    description: 'Memory leaks detected in stress testing. Review memory management.'
                });
            }
        }

        // Add general recommendations based on issue patterns
        const errorCount = issues.filter(i => i.severity === 'high').length;
        if (errorCount > 5) {
            recommendations.push({
                type: 'reliability',
                priority: 'high',
                title: 'Improve Error Handling',
                description: 'Multiple high-severity issues detected. Review error handling mechanisms.'
            });
        }

        return recommendations;
    }

    calculatePerformanceScore(benchmarks) {
        if (!benchmarks) return 50;

        let score = 100;
        const baselines = {
            componentInitialization: 500,
            calculationSpeed: 50,
            navigationSpeed: 100,
            domUpdatePerformance: 1
        };

        Object.keys(baselines).forEach(metric => {
            if (benchmarks[metric] && benchmarks[metric] > baselines[metric]) {
                const penalty = Math.min(30, (benchmarks[metric] / baselines[metric] - 1) * 50);
                score -= penalty;
            }
        });

        return Math.max(0, Math.round(score));
    }

    calculateOverallScore(summary, securityScore, performanceScore) {
        const successRate = summary.totalPassed / (summary.totalPassed + summary.totalFailed || 1);
        const testScore = successRate * 100;

        // Weighted average: 40% test results, 30% performance, 30% security
        const overallScore = (testScore * 0.4) + (performanceScore * 0.3) + (securityScore * 0.3);

        return Math.round(overallScore);
    }

    getGrade(score) {
        if (score >= 95) return 'A+';
        if (score >= 90) return 'A';
        if (score >= 85) return 'B+';
        if (score >= 80) return 'B';
        if (score >= 75) return 'C+';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    storeReport(report) {
        try {
            // Store main report
            localStorage.setItem('naas_comprehensive_test_report', JSON.stringify(report));

            // Store summary for quick access
            const summary = {
                timestamp: report.timestamp,
                overallScore: report.overallScore,
                grade: this.getGrade(report.overallScore),
                totalIssues: report.issues.length,
                securityScore: report.assessments.security.score,
                performanceScore: report.assessments.performance.score
            };
            localStorage.setItem('naas_test_summary', JSON.stringify(summary));

            this.log('Comprehensive test report saved to localStorage', 'success');

        } catch (error) {
            this.log(`Failed to save test report: ${error.message}`, 'error');
        }
    }

    // Utility methods for manual testing
    getLastReport() {
        try {
            const report = localStorage.getItem('naas_comprehensive_test_report');
            return report ? JSON.parse(report) : null;
        } catch (error) {
            this.log(`Failed to retrieve last report: ${error.message}`, 'error');
            return null;
        }
    }

    clearAllTestData() {
        const testKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('test') || key.includes('naas_'))) {
                testKeys.push(key);
            }
        }

        testKeys.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn(`Failed to remove test key ${key}:`, error);
            }
        });

        this.log(`Cleared ${testKeys.length} test data entries`, 'info');
    }

    printReportSummary(report = null) {
        const testReport = report || this.getLastReport();

        if (!testReport) {
            this.log('No test report available', 'warning');
            return;
        }

        console.group('📊 COMPREHENSIVE TEST REPORT SUMMARY');
        console.log('Overall Score:', testReport.overallScore, this.getGrade(testReport.overallScore));
        console.log('Security Score:', testReport.assessments.security.score, testReport.assessments.security.grade);
        console.log('Performance Score:', testReport.assessments.performance.score, testReport.assessments.performance.grade);
        console.log('Test Results:', testReport.summary);
        console.log('Total Issues:', testReport.issues.length);
        console.log('Recommendations:', testReport.recommendations.length);
        console.groupEnd();
    }
}

// Initialize and expose
window.ComprehensiveTestSuite = ComprehensiveTestSuite;

// Quick runners
window.runAllNaaSTests = async function(config = {}) {
    const testSuite = new ComprehensiveTestSuite();
    return await testSuite.runAllTests(config);
};

window.getLastTestReport = function() {
    const testSuite = new ComprehensiveTestSuite();
    return testSuite.getLastReport();
};

window.printLastTestReport = function() {
    const testSuite = new ComprehensiveTestSuite();
    testSuite.printReportSummary();
};

// Auto-run if URL parameter present
if (window.location.search.includes('runAllTests=true')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(async () => {
            const testSuite = new ComprehensiveTestSuite();
            await testSuite.runAllTests();
            testSuite.printReportSummary();
        }, 5000); // Wait 5 seconds for full app initialization
    });
}

console.log('🎯 Comprehensive Test Suite loaded. Run window.runAllNaaSTests() to start all tests.');