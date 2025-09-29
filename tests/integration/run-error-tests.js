/**
 * NaaS Calculator - Automated Error Test Runner
 * Programmatically execute all error tests and generate comprehensive report
 */

class AutomatedErrorTestRunner {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                categories: {}
            },
            testResults: {},
            errorLog: [],
            environment: this.captureEnvironment(),
            recommendations: []
        };

        this.testCategories = [
            'networkFailures',
            'dataCorruption',
            'browserLimitations',
            'userInputErrors',
            'systemErrors',
            'raceConditions',
            'resourceConstraints',
            'integrationFailures'
        ];

        this.setupErrorCapture();
    }

    captureEnvironment() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            storageQuota: this.checkStorageQuota(),
            memoryInfo: this.getMemoryInfo(),
            supportedFeatures: this.checkFeatureSupport(),
            windowSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timestamp: new Date().toISOString()
        };
    }

    checkStorageQuota() {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                navigator.storage.estimate().then(estimate => {
                    return {
                        quota: estimate.quota,
                        usage: estimate.usage,
                        available: estimate.quota - estimate.usage
                    };
                });
            }
            return 'not_available';
        } catch (error) {
            return 'error_checking';
        }
    }

    getMemoryInfo() {
        try {
            if (performance.memory) {
                return {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }
            return 'not_available';
        } catch (error) {
            return 'error_checking';
        }
    }

    checkFeatureSupport() {
        return {
            localStorage: typeof(Storage) !== "undefined",
            indexedDB: 'indexedDB' in window,
            webWorkers: typeof(Worker) !== "undefined",
            fetch: 'fetch' in window,
            promises: 'Promise' in window,
            performanceObserver: typeof PerformanceObserver !== 'undefined',
            intersectionObserver: 'IntersectionObserver' in window,
            mutationObserver: 'MutationObserver' in window
        };
    }

    setupErrorCapture() {
        // Capture all errors during testing
        this.originalConsoleError = console.error;
        this.originalWindowError = window.onerror;
        this.originalUnhandledRejection = window.onunhandledrejection;

        console.error = (...args) => {
            this.results.errorLog.push({
                type: 'console.error',
                timestamp: new Date().toISOString(),
                message: args.join(' '),
                stack: new Error().stack
            });
            return this.originalConsoleError.apply(console, args);
        };

        window.onerror = (message, source, lineno, colno, error) => {
            this.results.errorLog.push({
                type: 'window.error',
                timestamp: new Date().toISOString(),
                message: message,
                source: source,
                line: lineno,
                column: colno,
                stack: error?.stack
            });
            if (this.originalWindowError) {
                return this.originalWindowError.apply(window, arguments);
            }
        };

        window.onunhandledrejection = (event) => {
            this.results.errorLog.push({
                type: 'unhandled.rejection',
                timestamp: new Date().toISOString(),
                reason: event.reason,
                promise: event.promise
            });
            if (this.originalUnhandledRejection) {
                return this.originalUnhandledRejection.apply(window, arguments);
            }
        };
    }

    async runAllTests() {
        console.log('🚀 Starting Automated Error Test Suite...');

        const startTime = performance.now();

        try {
            // Initialize test framework if not available
            if (typeof testFramework === 'undefined') {
                console.error('❌ Test framework not available');
                return this.results;
            }

            // Calculate total tests
            this.results.summary.totalTests = Object.values(testFramework.tests)
                .reduce((sum, tests) => sum + tests.length, 0);

            console.log(`📊 Running ${this.results.summary.totalTests} tests across ${this.testCategories.length} categories...`);

            // Run tests for each category
            for (const category of this.testCategories) {
                await this.runCategoryTests(category);
            }

            // Generate analysis and recommendations
            this.generateRecommendations();

            const endTime = performance.now();
            this.results.duration = Math.round(endTime - startTime);

            console.log('✅ All tests completed!');
            console.log(`📈 Results: ${this.results.summary.passed} passed, ${this.results.summary.failed} failed`);

            return this.results;

        } catch (error) {
            console.error('❌ Test suite execution failed:', error);
            this.results.error = {
                message: error.message,
                stack: error.stack
            };
            return this.results;
        } finally {
            this.restoreErrorHandlers();
        }
    }

    async runCategoryTests(category) {
        console.log(`🧪 Testing category: ${category}`);

        if (!testFramework.tests[category]) {
            console.warn(`⚠️  No tests found for category: ${category}`);
            return;
        }

        const categoryResults = [];
        const tests = testFramework.tests[category];

        for (let i = 0; i < tests.length; i++) {
            const test = tests[i];
            const startTime = performance.now();

            try {
                console.log(`  🔍 Running: ${test.name}`);

                const result = await test.testFunction();
                const endTime = performance.now();

                const testResult = {
                    name: test.name,
                    description: test.description,
                    status: 'passed',
                    duration: Math.round(endTime - startTime),
                    result: result,
                    timestamp: new Date().toISOString()
                };

                categoryResults.push(testResult);
                this.results.summary.passed++;

                console.log(`  ✅ ${test.name} - PASSED (${testResult.duration}ms)`);

            } catch (error) {
                const endTime = performance.now();

                const testResult = {
                    name: test.name,
                    description: test.description,
                    status: 'failed',
                    duration: Math.round(endTime - startTime),
                    error: {
                        message: error.message,
                        stack: error.stack,
                        name: error.name
                    },
                    timestamp: new Date().toISOString()
                };

                categoryResults.push(testResult);
                this.results.summary.failed++;

                console.log(`  ❌ ${test.name} - FAILED: ${error.message}`);
            }
        }

        this.results.testResults[category] = categoryResults;
        this.results.summary.categories[category] = {
            total: tests.length,
            passed: categoryResults.filter(r => r.status === 'passed').length,
            failed: categoryResults.filter(r => r.status === 'failed').length
        };

        const categoryPassed = this.results.summary.categories[category].passed;
        const categoryTotal = this.results.summary.categories[category].total;
        console.log(`📋 ${category}: ${categoryPassed}/${categoryTotal} tests passed`);
    }

    generateRecommendations() {
        const recommendations = [];

        // Analyze failure patterns
        Object.entries(this.results.testResults).forEach(([category, tests]) => {
            const failedTests = tests.filter(t => t.status === 'failed');

            if (failedTests.length > 0) {
                recommendations.push({
                    category: category,
                    priority: this.getPriorityLevel(category, failedTests),
                    issue: `${failedTests.length} tests failed in ${category}`,
                    recommendation: this.getRecommendationForCategory(category, failedTests),
                    affectedTests: failedTests.map(t => t.name)
                });
            }
        });

        // Analyze error patterns
        const errorTypes = this.results.errorLog.reduce((acc, error) => {
            acc[error.type] = (acc[error.type] || 0) + 1;
            return acc;
        }, {});

        if (Object.keys(errorTypes).length > 0) {
            recommendations.push({
                category: 'error_patterns',
                priority: 'high',
                issue: `${this.results.errorLog.length} errors logged during testing`,
                recommendation: 'Review error patterns and implement additional error handling',
                errorBreakdown: errorTypes
            });
        }

        // Browser compatibility recommendations
        const unsupportedFeatures = Object.entries(this.results.environment.supportedFeatures)
            .filter(([feature, supported]) => !supported)
            .map(([feature]) => feature);

        if (unsupportedFeatures.length > 0) {
            recommendations.push({
                category: 'browser_compatibility',
                priority: 'medium',
                issue: `Unsupported features detected: ${unsupportedFeatures.join(', ')}`,
                recommendation: 'Implement fallbacks for unsupported browser features',
                unsupportedFeatures: unsupportedFeatures
            });
        }

        // Performance recommendations
        const slowTests = Object.values(this.results.testResults)
            .flat()
            .filter(test => test.duration > 1000);

        if (slowTests.length > 0) {
            recommendations.push({
                category: 'performance',
                priority: 'medium',
                issue: `${slowTests.length} tests took longer than 1 second to complete`,
                recommendation: 'Optimize performance for slow operations',
                slowTests: slowTests.map(t => ({ name: t.name, duration: t.duration }))
            });
        }

        this.results.recommendations = recommendations.sort((a, b) => {
            const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    getPriorityLevel(category, failedTests) {
        const criticalCategories = ['systemErrors', 'dataCorruption'];
        const highPriorityCategories = ['networkFailures', 'integrationFailures'];

        if (criticalCategories.includes(category)) return 'critical';
        if (highPriorityCategories.includes(category)) return 'high';

        if (failedTests.length > 2) return 'high';
        if (failedTests.length > 1) return 'medium';
        return 'low';
    }

    getRecommendationForCategory(category, failedTests) {
        const recommendations = {
            networkFailures: 'Implement robust offline handling and network retry mechanisms',
            dataCorruption: 'Add comprehensive data validation and recovery procedures',
            browserLimitations: 'Implement feature detection and progressive enhancement',
            userInputErrors: 'Strengthen input validation and sanitization',
            systemErrors: 'Add more comprehensive error boundaries and recovery mechanisms',
            raceConditions: 'Implement proper synchronization and state management',
            resourceConstraints: 'Optimize resource usage and implement resource monitoring',
            integrationFailures: 'Add better error handling for external integrations'
        };

        return recommendations[category] || 'Review failed tests and implement appropriate error handling';
    }

    restoreErrorHandlers() {
        console.error = this.originalConsoleError;
        window.onerror = this.originalWindowError;
        window.onunhandledrejection = this.originalUnhandledRejection;
    }

    exportResults() {
        const fileName = `naas-error-test-results-${new Date().toISOString().split('T')[0]}.json`;
        const blob = new Blob([JSON.stringify(this.results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`📁 Test results exported to: ${fileName}`);
    }

    generateHTMLReport() {
        const passRate = ((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1);

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NaaS Calculator - Error Test Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <div class="max-w-7xl mx-auto p-6">
        <header class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">NaaS Calculator - Error Test Report</h1>
            <p class="text-gray-600">Generated on ${new Date(this.results.timestamp).toLocaleString()}</p>
        </header>

        <!-- Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold text-gray-700">Total Tests</h3>
                <p class="text-3xl font-bold text-blue-600">${this.results.summary.totalTests}</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold text-gray-700">Passed</h3>
                <p class="text-3xl font-bold text-green-600">${this.results.summary.passed}</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold text-gray-700">Failed</h3>
                <p class="text-3xl font-bold text-red-600">${this.results.summary.failed}</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold text-gray-700">Pass Rate</h3>
                <p class="text-3xl font-bold ${passRate >= 90 ? 'text-green-600' : passRate >= 70 ? 'text-yellow-600' : 'text-red-600'}">${passRate}%</p>
            </div>
        </div>

        <!-- Recommendations -->
        <div class="bg-white rounded-lg shadow mb-8">
            <div class="p-6 border-b border-gray-200">
                <h2 class="text-xl font-bold text-gray-900">Recommendations</h2>
            </div>
            <div class="p-6">
                ${this.results.recommendations.map(rec => `
                    <div class="mb-4 p-4 border-l-4 ${
                        rec.priority === 'critical' ? 'border-red-500 bg-red-50' :
                        rec.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                        rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                    }">
                        <h3 class="font-semibold ${
                            rec.priority === 'critical' ? 'text-red-800' :
                            rec.priority === 'high' ? 'text-orange-800' :
                            rec.priority === 'medium' ? 'text-yellow-800' :
                            'text-blue-800'
                        }">${rec.priority.toUpperCase()}: ${rec.issue}</h3>
                        <p class="text-gray-700 mt-2">${rec.recommendation}</p>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Category Results -->
        <div class="bg-white rounded-lg shadow">
            <div class="p-6 border-b border-gray-200">
                <h2 class="text-xl font-bold text-gray-900">Test Results by Category</h2>
            </div>
            <div class="p-6">
                ${Object.entries(this.results.summary.categories).map(([category, stats]) => `
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-3">${category}</h3>
                        <div class="bg-gray-200 rounded-full h-4 mb-2">
                            <div class="bg-green-500 h-4 rounded-full" style="width: ${(stats.passed / stats.total) * 100}%"></div>
                        </div>
                        <p class="text-sm text-gray-600">${stats.passed}/${stats.total} tests passed</p>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `naas-error-test-report-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('📊 HTML report generated and downloaded');
    }
}

// Run tests when page is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for other scripts to load
    setTimeout(async () => {
        console.log('🔧 Initializing automated test runner...');

        const runner = new AutomatedErrorTestRunner();
        const results = await runner.runAllTests();

        console.log('📋 Test Summary:', results.summary);
        console.log('💡 Recommendations:', results.recommendations.length);

        // Export results automatically
        runner.exportResults();
        runner.generateHTMLReport();

        // Make runner available globally for manual inspection
        window.errorTestRunner = runner;

    }, 2000);
});

// Export for manual use
window.AutomatedErrorTestRunner = AutomatedErrorTestRunner;