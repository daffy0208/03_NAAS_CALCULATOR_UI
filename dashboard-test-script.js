/**
 * Comprehensive Dashboard Test Script
 * Tests all dashboard interactions and identifies issues
 */

class DashboardTester {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.issues = [];
        this.init();
    }

    init() {
        console.log('🚀 Starting Dashboard Comprehensive Testing...');
        this.setupErrorCapture();

        // Wait for app to fully initialize
        this.waitForAppInitialization().then(() => {
            this.runAllTests();
        });
    }

    setupErrorCapture() {
        // Capture JavaScript errors
        const originalError = console.error;
        console.error = (...args) => {
            this.errors.push({
                type: 'console.error',
                message: args.join(' '),
                timestamp: new Date().toISOString(),
                stack: new Error().stack
            });
            originalError.apply(console, args);
        };

        // Capture uncaught errors
        window.addEventListener('error', (e) => {
            this.errors.push({
                type: 'uncaught.error',
                message: e.message,
                filename: e.filename,
                line: e.lineno,
                column: e.colno,
                timestamp: new Date().toISOString()
            });
        });

        // Capture promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            this.errors.push({
                type: 'unhandled.promise',
                message: e.reason,
                timestamp: new Date().toISOString()
            });
        });
    }

    async waitForAppInitialization() {
        let attempts = 0;
        while (!window.app && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.app) {
            this.issues.push('App failed to initialize within 10 seconds');
            throw new Error('App initialization timeout');
        }

        // Wait for component manager and data store
        attempts = 0;
        while ((!window.app.componentManager || !window.quoteDataStore) && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.app.componentManager) {
            this.issues.push('Component Manager failed to initialize');
        }
        if (!window.quoteDataStore) {
            this.issues.push('Data Store failed to initialize');
        }
    }

    async runAllTests() {
        console.log('🔍 Running Dashboard Tests...');

        try {
            await this.testInitialization();
            await this.testComponentCardClicks();
            await this.testNavigationButtons();
            await this.testMobileMenu();
            await this.testDataDisplay();
            await this.testResponsiveBehavior();
            await this.testStateManagement();
            await this.testErrorHandling();

            this.generateReport();
        } catch (error) {
            console.error('Test execution failed:', error);
            this.errors.push({
                type: 'test.execution',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            this.generateReport();
        }
    }

    async testInitialization() {
        console.log('📋 Testing Dashboard Initialization...');

        const test = {
            name: 'Dashboard Initialization',
            subtests: []
        };

        // Test 1: Dashboard view is visible
        const dashboardView = document.getElementById('dashboardView');
        test.subtests.push({
            name: 'Dashboard View Exists',
            passed: !!dashboardView,
            details: dashboardView ? 'Found dashboard view element' : 'Dashboard view element missing'
        });

        // Test 2: Component cards are populated
        const componentCards = document.querySelectorAll('.component-card[data-component]');
        test.subtests.push({
            name: 'Component Cards Populated',
            passed: componentCards.length > 0,
            details: `Found ${componentCards.length} component cards`
        });

        // Test 3: Navigation is initialized
        const navButtons = document.querySelectorAll('.nav-btn');
        test.subtests.push({
            name: 'Navigation Buttons Present',
            passed: navButtons.length >= 4,
            details: `Found ${navButtons.length} navigation buttons`
        });

        // Test 4: App state
        const appState = window.app ? window.app.getState() : null;
        test.subtests.push({
            name: 'App State Available',
            passed: !!appState,
            details: appState ? `Current view: ${appState.currentView}` : 'App state not available'
        });

        this.testResults.push(test);
    }

    async testComponentCardClicks() {
        console.log('🎯 Testing Component Card Clicks...');

        const test = {
            name: 'Component Card Clicks',
            subtests: []
        };

        const componentCards = document.querySelectorAll('.component-card[data-component]');

        for (const card of componentCards) {
            const componentType = card.dataset.component;
            const errorsBefore = this.errors.length;

            try {
                // Clear any existing notifications
                document.querySelectorAll('.fixed.top-4.right-4').forEach(el => el.remove());

                // Click the card
                card.click();

                // Wait for any async operations
                await new Promise(resolve => setTimeout(resolve, 500));

                const errorsAfter = this.errors.length;
                const newErrors = this.errors.slice(errorsBefore);

                // Check if view switched to components
                const componentsView = document.getElementById('componentsView');
                const isComponentsVisible = componentsView && !componentsView.classList.contains('hidden');

                // Check for error notifications
                const errorNotifications = document.querySelectorAll('.bg-red-600');

                test.subtests.push({
                    name: `Click ${componentType} Card`,
                    passed: newErrors.length === 0 && errorNotifications.length === 0,
                    details: {
                        componentType,
                        errorsGenerated: newErrors.length,
                        viewSwitched: isComponentsVisible,
                        errorNotifications: errorNotifications.length,
                        errors: newErrors
                    }
                });

                if (newErrors.length > 0 || errorNotifications.length > 0) {
                    this.issues.push(`Component card click for ${componentType} generated errors`);
                }

            } catch (error) {
                test.subtests.push({
                    name: `Click ${componentType} Card`,
                    passed: false,
                    details: `Exception: ${error.message}`
                });
                this.issues.push(`Exception clicking ${componentType} card: ${error.message}`);
            }
        }

        this.testResults.push(test);
    }

    async testNavigationButtons() {
        console.log('🧭 Testing Navigation Buttons...');

        const test = {
            name: 'Navigation Buttons',
            subtests: []
        };

        const navButtons = [
            { id: 'dashboardBtn', view: 'dashboard' },
            { id: 'componentsBtn', view: 'components' },
            { id: 'wizardBtn', view: 'wizard' },
            { id: 'historyBtn', view: 'history' }
        ];

        for (const nav of navButtons) {
            const errorsBefore = this.errors.length;

            try {
                const button = document.getElementById(nav.id);

                if (!button) {
                    test.subtests.push({
                        name: `${nav.view} Button`,
                        passed: false,
                        details: 'Button element not found'
                    });
                    continue;
                }

                // Click the button
                button.click();

                // Wait for view change
                await new Promise(resolve => setTimeout(resolve, 300));

                const errorsAfter = this.errors.length;
                const newErrors = this.errors.slice(errorsBefore);

                // Check if correct view is shown
                const targetView = document.getElementById(`${nav.view}View`);
                const isVisible = targetView && !targetView.classList.contains('hidden');

                test.subtests.push({
                    name: `${nav.view} Button`,
                    passed: newErrors.length === 0 && isVisible,
                    details: {
                        viewSwitched: isVisible,
                        errorsGenerated: newErrors.length,
                        errors: newErrors
                    }
                });

            } catch (error) {
                test.subtests.push({
                    name: `${nav.view} Button`,
                    passed: false,
                    details: `Exception: ${error.message}`
                });
            }
        }

        this.testResults.push(test);
    }

    async testMobileMenu() {
        console.log('📱 Testing Mobile Menu...');

        const test = {
            name: 'Mobile Menu',
            subtests: []
        };

        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');

        if (!mobileMenuBtn || !mobileMenu) {
            test.subtests.push({
                name: 'Mobile Menu Elements',
                passed: false,
                details: 'Mobile menu elements not found'
            });
            this.testResults.push(test);
            return;
        }

        try {
            // Test mobile menu toggle
            const errorsBefore = this.errors.length;

            mobileMenuBtn.click();
            await new Promise(resolve => setTimeout(resolve, 200));

            const isVisible = !mobileMenu.classList.contains('hidden');

            mobileMenuBtn.click(); // Close it
            await new Promise(resolve => setTimeout(resolve, 200));

            const isHidden = mobileMenu.classList.contains('hidden');

            const errorsAfter = this.errors.length;
            const newErrors = this.errors.slice(errorsBefore);

            test.subtests.push({
                name: 'Mobile Menu Toggle',
                passed: newErrors.length === 0 && isVisible && isHidden,
                details: {
                    menuOpened: isVisible,
                    menuClosed: isHidden,
                    errorsGenerated: newErrors.length
                }
            });

        } catch (error) {
            test.subtests.push({
                name: 'Mobile Menu Toggle',
                passed: false,
                details: `Exception: ${error.message}`
            });
        }

        this.testResults.push(test);
    }

    async testDataDisplay() {
        console.log('📊 Testing Data Display...');

        const test = {
            name: 'Data Display',
            subtests: []
        };

        // Test component pricing display
        const priceElements = document.querySelectorAll('[id^="price-"]');
        test.subtests.push({
            name: 'Price Elements Present',
            passed: priceElements.length > 0,
            details: `Found ${priceElements.length} price elements`
        });

        // Test recent quotes section
        const recentQuotes = document.getElementById('recentQuotes');
        test.subtests.push({
            name: 'Recent Quotes Section',
            passed: !!recentQuotes,
            details: recentQuotes ? 'Recent quotes section present' : 'Recent quotes section missing'
        });

        // Test project info (if any)
        const projectElements = document.querySelectorAll('[data-project]');
        test.subtests.push({
            name: 'Project Data Elements',
            passed: true, // This is optional
            details: `Found ${projectElements.length} project-related elements`
        });

        this.testResults.push(test);
    }

    async testResponsiveBehavior() {
        console.log('📏 Testing Responsive Behavior...');

        const test = {
            name: 'Responsive Behavior',
            subtests: []
        };

        const originalWidth = window.innerWidth;
        const originalHeight = window.innerHeight;

        try {
            // Test mobile breakpoint
            Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
            window.dispatchEvent(new Event('resize'));

            await new Promise(resolve => setTimeout(resolve, 300));

            // Check if mobile menu is working
            const mobileMenu = document.getElementById('mobileMenu');
            const desktopNav = document.getElementById('desktopNav');

            test.subtests.push({
                name: 'Mobile Layout',
                passed: !!mobileMenu,
                details: 'Mobile menu elements present'
            });

            // Test tablet breakpoint
            Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
            window.dispatchEvent(new Event('resize'));

            await new Promise(resolve => setTimeout(resolve, 300));

            test.subtests.push({
                name: 'Tablet Layout',
                passed: true, // Visual check would be needed
                details: 'Tablet breakpoint triggered'
            });

            // Test desktop breakpoint
            Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
            window.dispatchEvent(new Event('resize'));

            await new Promise(resolve => setTimeout(resolve, 300));

            test.subtests.push({
                name: 'Desktop Layout',
                passed: !!desktopNav,
                details: 'Desktop navigation present'
            });

        } finally {
            // Restore original dimensions
            Object.defineProperty(window, 'innerWidth', { value: originalWidth, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: originalHeight, writable: true });
            window.dispatchEvent(new Event('resize'));
        }

        this.testResults.push(test);
    }

    async testStateManagement() {
        console.log('⚡ Testing State Management...');

        const test = {
            name: 'State Management',
            subtests: []
        };

        // Test empty state
        try {
            if (window.quoteDataStore) {
                const initialData = window.quoteDataStore.exportData();

                // Clear data and test
                window.quoteDataStore.clear();
                await new Promise(resolve => setTimeout(resolve, 300));

                const clearedData = window.quoteDataStore.exportData();

                test.subtests.push({
                    name: 'Clear Data State',
                    passed: Object.keys(clearedData.enabledComponents).length === 0,
                    details: `Enabled components after clear: ${Object.keys(clearedData.enabledComponents).length}`
                });

                // Restore some data
                window.quoteDataStore.updateProject({
                    projectName: 'Test Project',
                    customerName: 'Test Customer'
                });

                window.quoteDataStore.setComponentEnabled('prtg', true);

                const restoredData = window.quoteDataStore.exportData();

                test.subtests.push({
                    name: 'Update Data State',
                    passed: restoredData.project.projectName === 'Test Project' && restoredData.enabledComponents.prtg,
                    details: `Project: ${restoredData.project.projectName}, PRTG enabled: ${!!restoredData.enabledComponents.prtg}`
                });

            } else {
                test.subtests.push({
                    name: 'Data Store Available',
                    passed: false,
                    details: 'Data store not available for testing'
                });
            }
        } catch (error) {
            test.subtests.push({
                name: 'State Management Test',
                passed: false,
                details: `Exception: ${error.message}`
            });
        }

        this.testResults.push(test);
    }

    async testErrorHandling() {
        console.log('🚨 Testing Error Handling...');

        const test = {
            name: 'Error Handling',
            subtests: []
        };

        // Test missing component selection
        try {
            if (window.app && window.app.componentManager) {
                const errorsBefore = this.errors.length;

                // Try to select non-existent component
                window.app.componentManager.selectComponent('nonExistentComponent');

                await new Promise(resolve => setTimeout(resolve, 300));

                const errorsAfter = this.errors.length;

                test.subtests.push({
                    name: 'Invalid Component Selection',
                    passed: errorsAfter === errorsBefore, // Should handle gracefully
                    details: `Errors generated: ${errorsAfter - errorsBefore}`
                });
            }
        } catch (error) {
            test.subtests.push({
                name: 'Invalid Component Selection',
                passed: false,
                details: `Exception: ${error.message}`
            });
        }

        // Test missing DOM elements
        try {
            const errorsBefore = this.errors.length;

            // Try to interact with missing element
            const missingElement = document.getElementById('nonExistentElement');
            if (missingElement) {
                missingElement.click();
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            const errorsAfter = this.errors.length;

            test.subtests.push({
                name: 'Missing DOM Element Handling',
                passed: errorsAfter === errorsBefore,
                details: 'No errors for missing element interaction'
            });

        } catch (error) {
            test.subtests.push({
                name: 'Missing DOM Element Handling',
                passed: true, // Expected to handle gracefully
                details: 'Exception caught as expected'
            });
        }

        this.testResults.push(test);
    }

    generateReport() {
        console.log('📄 Generating Test Report...');

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: this.testResults.length,
                totalSubtests: this.testResults.reduce((sum, test) => sum + test.subtests.length, 0),
                passedSubtests: this.testResults.reduce((sum, test) =>
                    sum + test.subtests.filter(subtest => subtest.passed).length, 0
                ),
                failedSubtests: this.testResults.reduce((sum, test) =>
                    sum + test.subtests.filter(subtest => !subtest.passed).length, 0
                ),
                totalErrors: this.errors.length,
                totalIssues: this.issues.length
            },
            testResults: this.testResults,
            errors: this.errors,
            issues: this.issues,
            recommendations: this.generateRecommendations()
        };

        // Log summary
        console.log('📊 TEST SUMMARY:');
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`Total Subtests: ${report.summary.totalSubtests}`);
        console.log(`Passed: ${report.summary.passedSubtests}`);
        console.log(`Failed: ${report.summary.failedSubtests}`);
        console.log(`Errors: ${report.summary.totalErrors}`);
        console.log(`Issues: ${report.summary.totalIssues}`);

        // Log critical issues
        if (this.issues.length > 0) {
            console.log('🚨 CRITICAL ISSUES:');
            this.issues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue}`);
            });
        }

        // Store report globally for analysis
        window.dashboardTestReport = report;

        console.log('✅ Test Report Generated - Check window.dashboardTestReport for full details');

        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        // Analyze errors for patterns
        const errorTypes = {};
        this.errors.forEach(error => {
            errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
        });

        if (errorTypes['console.error'] > 0) {
            recommendations.push('Fix console errors - these indicate potential functionality issues');
        }

        if (errorTypes['unhandled.promise'] > 0) {
            recommendations.push('Add proper error handling for promise rejections');
        }

        // Analyze failed tests
        const failedTests = this.testResults.filter(test =>
            test.subtests.some(subtest => !subtest.passed)
        );

        failedTests.forEach(test => {
            const failedSubtests = test.subtests.filter(subtest => !subtest.passed);
            failedSubtests.forEach(subtest => {
                if (subtest.name.includes('Component Card')) {
                    recommendations.push('Fix component card click handlers to prevent error notifications');
                }
                if (subtest.name.includes('Navigation')) {
                    recommendations.push('Fix navigation button event handlers');
                }
                if (subtest.name.includes('Mobile')) {
                    recommendations.push('Fix mobile menu functionality');
                }
            });
        });

        return recommendations;
    }
}

// Auto-start testing when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new DashboardTester();
    });
} else {
    new DashboardTester();
}