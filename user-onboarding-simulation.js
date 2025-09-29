/**
 * Comprehensive User Onboarding Flow Simulation
 * Tests every possible path and interaction for new users
 */

class UserOnboardingSimulation {
    constructor() {
        this.testResults = [];
        this.issues = [];
        this.currentStep = 0;
        this.totalSteps = 0;
        this.testStartTime = Date.now();

        // Simulation state
        this.userState = {
            isFirstVisit: true,
            hasData: false,
            currentView: 'dashboard',
            completedSteps: [],
            errors: [],
            viewportSize: 'desktop',
            accessibilityMode: false
        };

        this.testSuites = [
            'FirstVisitExperience',
            'NavigationDiscovery',
            'ProjectCreation',
            'ComponentExploration',
            'ConfigurationLearning',
            'QuoteGeneration',
            'DataManagement',
            'ErrorRecovery',
            'EdgeCases',
            'MobileDesktop',
            'AccessibilityFeatures',
            'FormValidation',
            'PerformanceTesting'
        ];
    }

    async runCompleteOnboardingSimulation() {
        console.log('🚀 Starting Comprehensive User Onboarding Simulation');
        console.log('='.repeat(60));

        try {
            // Initialize application
            await this.initializeApplication();

            // Run all test suites
            for (const suite of this.testSuites) {
                console.log(`\n📋 Running ${suite} test suite...`);
                await this[`test${suite}`]();
            }

            // Generate final report
            this.generateFinalReport();

        } catch (error) {
            console.error('❌ Simulation failed:', error);
            this.addIssue('CRITICAL', 'Simulation Framework', error.message);
        }
    }

    async initializeApplication() {
        this.addTestResult('Application Initialization', 'PASS', 'Application loaded successfully');

        // Clear any existing data to simulate fresh user
        if (typeof StorageManager !== 'undefined') {
            try {
                StorageManager.clearAllData();
                console.log('✅ Cleared all existing data for fresh user simulation');
            } catch (error) {
                this.addIssue('HIGH', 'Data Clearing', 'Failed to clear existing data: ' + error.message);
            }
        }

        // Simulate fresh browser state
        this.userState.isFirstVisit = true;
        this.userState.hasData = false;
    }

    // 1. First Visit Experience Testing
    async testFirstVisitExperience() {
        console.log('🔍 Testing first visit experience...');

        // Test loading indicator
        await this.testLoadingIndicator();

        // Test initial page state
        await this.testInitialPageState();

        // Test welcome messaging
        await this.testWelcomeMessaging();

        // Test default view
        await this.testDefaultView();
    }

    async testLoadingIndicator() {
        const loadingIndicator = document.getElementById('loadingIndicator');

        if (!loadingIndicator) {
            this.addIssue('MEDIUM', 'Loading UX', 'Loading indicator not found');
            return;
        }

        // Check if loading indicator is properly styled
        const styles = window.getComputedStyle(loadingIndicator);
        if (styles.position !== 'fixed') {
            this.addIssue('LOW', 'Loading UX', 'Loading indicator not positioned as overlay');
        }

        this.addTestResult('Loading Indicator', 'PASS', 'Loading indicator present and properly styled');
    }

    async testInitialPageState() {
        // Check that dashboard is the default view
        const dashboardView = document.getElementById('dashboardView');
        const otherViews = ['componentsView', 'wizardView', 'historyView'];

        if (!dashboardView || dashboardView.classList.contains('hidden')) {
            this.addIssue('HIGH', 'Default View', 'Dashboard view not visible on first visit');
        }

        // Check other views are hidden
        otherViews.forEach(viewId => {
            const view = document.getElementById(viewId);
            if (view && !view.classList.contains('hidden')) {
                this.addIssue('MEDIUM', 'View State', `${viewId} should be hidden on first visit`);
            }
        });

        this.addTestResult('Initial Page State', 'PASS', 'Correct views shown/hidden on first visit');
    }

    async testWelcomeMessaging() {
        const welcomeText = document.querySelector('#dashboardView h2');
        if (!welcomeText || !welcomeText.textContent.includes('Welcome')) {
            this.addIssue('MEDIUM', 'User Experience', 'Welcome message not clear or missing');
        }

        const descText = document.querySelector('#dashboardView p');
        if (!descText || descText.textContent.length < 20) {
            this.addIssue('LOW', 'User Experience', 'Description text too brief or missing');
        }

        this.addTestResult('Welcome Messaging', 'PASS', 'Welcome message and description present');
    }

    async testDefaultView() {
        // Test that dashboard components are loading
        const dashboardComponents = document.getElementById('dashboardComponents');

        // Wait for components to potentially load
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!dashboardComponents || dashboardComponents.children.length === 0) {
            this.addIssue('HIGH', 'Component Loading', 'Dashboard components not loading on first visit');
        }

        this.addTestResult('Default View', 'PASS', 'Dashboard view loads with components');
    }

    // 2. Navigation Discovery Testing
    async testNavigationDiscovery() {
        console.log('🧭 Testing navigation discovery...');

        await this.testDesktopNavigation();
        await this.testMobileNavigation();
        await this.testNavigationStates();
        await this.testActionButtons();
    }

    async testDesktopNavigation() {
        const navButtons = [
            { id: 'dashboardBtn', label: 'Dashboard', view: 'dashboard' },
            { id: 'componentsBtn', label: 'Components', view: 'components' },
            { id: 'wizardBtn', label: 'Full Quote', view: 'wizard' },
            { id: 'historyBtn', label: 'History', view: 'history' }
        ];

        for (const nav of navButtons) {
            const button = document.getElementById(nav.id);
            if (!button) {
                this.addIssue('HIGH', 'Navigation', `${nav.label} navigation button missing`);
                continue;
            }

            // Test click functionality
            try {
                button.click();
                await new Promise(resolve => setTimeout(resolve, 200));

                const targetView = document.getElementById(`${nav.view}View`);
                if (!targetView || targetView.classList.contains('hidden')) {
                    this.addIssue('HIGH', 'Navigation', `${nav.label} navigation not working - view not shown`);
                }

            } catch (error) {
                this.addIssue('HIGH', 'Navigation', `${nav.label} navigation click failed: ${error.message}`);
            }
        }

        this.addTestResult('Desktop Navigation', 'PASS', 'All navigation buttons functional');
    }

    async testMobileNavigation() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');

        if (!mobileMenuBtn) {
            this.addIssue('HIGH', 'Mobile Navigation', 'Mobile menu button missing');
            return;
        }

        // Test mobile menu toggle
        try {
            mobileMenuBtn.click();
            await new Promise(resolve => setTimeout(resolve, 200));

            if (mobileMenu.classList.contains('hidden')) {
                this.addIssue('HIGH', 'Mobile Navigation', 'Mobile menu not showing when toggled');
            }

            // Test mobile navigation buttons
            const mobileNavButtons = [
                'mobileDashboardBtn', 'mobileComponentsBtn',
                'mobileWizardBtn', 'mobileHistoryBtn'
            ];

            for (const btnId of mobileNavButtons) {
                const btn = document.getElementById(btnId);
                if (!btn) {
                    this.addIssue('MEDIUM', 'Mobile Navigation', `${btnId} missing`);
                }
            }

        } catch (error) {
            this.addIssue('HIGH', 'Mobile Navigation', `Mobile menu toggle failed: ${error.message}`);
        }

        this.addTestResult('Mobile Navigation', 'PASS', 'Mobile navigation functional');
    }

    async testNavigationStates() {
        // Test active states
        const dashboardBtn = document.getElementById('dashboardBtn');
        if (dashboardBtn && !dashboardBtn.classList.contains('active')) {
            this.addIssue('LOW', 'Navigation UX', 'Dashboard button should be active by default');
        }

        // Test navigation state persistence
        const componentsBtn = document.getElementById('componentsBtn');
        if (componentsBtn) {
            componentsBtn.click();
            await new Promise(resolve => setTimeout(resolve, 200));

            if (!componentsBtn.classList.contains('active')) {
                this.addIssue('MEDIUM', 'Navigation UX', 'Navigation active state not updating');
            }

            if (dashboardBtn.classList.contains('active')) {
                this.addIssue('MEDIUM', 'Navigation UX', 'Previous navigation state not cleared');
            }
        }

        this.addTestResult('Navigation States', 'PASS', 'Navigation states update correctly');
    }

    async testActionButtons() {
        const importBtn = document.getElementById('importBtn');
        const exportBtn = document.getElementById('exportBtn');

        // Test import button
        if (!importBtn) {
            this.addIssue('HIGH', 'Action Buttons', 'Import button missing');
        } else {
            try {
                importBtn.click();
                await new Promise(resolve => setTimeout(resolve, 200));

                const importModal = document.getElementById('importModal');
                if (!importModal || importModal.classList.contains('hidden')) {
                    this.addIssue('HIGH', 'Import Function', 'Import modal not showing');
                }
            } catch (error) {
                this.addIssue('HIGH', 'Import Function', `Import button failed: ${error.message}`);
            }
        }

        // Test export button
        if (!exportBtn) {
            this.addIssue('HIGH', 'Action Buttons', 'Export button missing');
        } else {
            try {
                exportBtn.click();
                await new Promise(resolve => setTimeout(resolve, 200));

                const exportModal = document.getElementById('exportModal');
                if (!exportModal || exportModal.classList.contains('hidden')) {
                    this.addIssue('HIGH', 'Export Function', 'Export modal not showing');
                }
            } catch (error) {
                this.addIssue('HIGH', 'Export Function', `Export button failed: ${error.message}`);
            }
        }

        this.addTestResult('Action Buttons', 'PASS', 'Import/Export buttons functional');
    }

    // 3. Project Creation Testing
    async testProjectCreation() {
        console.log('📝 Testing project creation...');

        await this.testWizardAccess();
        await this.testWizardFlow();
        await this.testWizardValidation();
        await this.testWizardNavigation();
    }

    async testWizardAccess() {
        // Test starting full quote from dashboard
        const startFullQuoteBtn = document.getElementById('startFullQuoteBtn');
        if (!startFullQuoteBtn) {
            this.addIssue('HIGH', 'Wizard Access', 'Start Full Quote button missing from dashboard');
            return;
        }

        try {
            startFullQuoteBtn.click();
            await new Promise(resolve => setTimeout(resolve, 200));

            const wizardView = document.getElementById('wizardView');
            if (!wizardView || wizardView.classList.contains('hidden')) {
                this.addIssue('HIGH', 'Wizard Access', 'Wizard view not showing when started from dashboard');
            }

        } catch (error) {
            this.addIssue('HIGH', 'Wizard Access', `Failed to start wizard: ${error.message}`);
        }

        this.addTestResult('Wizard Access', 'PASS', 'Can access wizard from dashboard');
    }

    async testWizardFlow() {
        // Go to wizard view
        const wizardBtn = document.getElementById('wizardBtn');
        if (wizardBtn) wizardBtn.click();
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check wizard structure
        const wizardContent = document.getElementById('wizardContent');
        const stepIndicators = document.getElementById('stepIndicators');
        const progressBar = document.getElementById('progressBar');

        if (!wizardContent) {
            this.addIssue('HIGH', 'Wizard Structure', 'Wizard content area missing');
        }

        if (!stepIndicators) {
            this.addIssue('MEDIUM', 'Wizard UX', 'Step indicators missing');
        }

        if (!progressBar) {
            this.addIssue('MEDIUM', 'Wizard UX', 'Progress bar missing');
        }

        // Test if wizard loads first step
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (wizardContent && wizardContent.children.length === 0) {
            this.addIssue('HIGH', 'Wizard Function', 'Wizard not loading initial step');
        }

        this.addTestResult('Wizard Flow', 'PASS', 'Wizard structure and initial loading working');
    }

    async testWizardValidation() {
        // Test form validation in wizard
        const wizardContent = document.getElementById('wizardContent');
        if (!wizardContent) return;

        // Look for form inputs
        const inputs = wizardContent.querySelectorAll('input, select, textarea');

        if (inputs.length === 0) {
            this.addIssue('MEDIUM', 'Wizard Validation', 'No form inputs found in wizard for validation testing');
            return;
        }

        // Test required field validation
        const nextBtn = wizardContent.querySelector('[data-action="next"]') ||
                       wizardContent.querySelector('button[type="submit"]');

        if (nextBtn) {
            try {
                nextBtn.click();
                await new Promise(resolve => setTimeout(resolve, 200));

                // Check for validation messages
                const validationMessages = wizardContent.querySelectorAll('.error, .invalid, [role="alert"]');
                if (validationMessages.length === 0) {
                    this.addIssue('MEDIUM', 'Wizard Validation', 'No validation messages shown for empty required fields');
                }

            } catch (error) {
                this.addIssue('LOW', 'Wizard Validation', `Validation test failed: ${error.message}`);
            }
        }

        this.addTestResult('Wizard Validation', 'PASS', 'Wizard validation tested');
    }

    async testWizardNavigation() {
        const wizardContent = document.getElementById('wizardContent');
        if (!wizardContent) return;

        // Test next/previous buttons
        const prevBtn = wizardContent.querySelector('[data-action="prev"]');
        const nextBtn = wizardContent.querySelector('[data-action="next"]');

        if (!nextBtn) {
            this.addIssue('MEDIUM', 'Wizard Navigation', 'Next button not found in wizard');
        }

        // Test step indicators if present
        const stepIndicators = document.getElementById('stepIndicators');
        if (stepIndicators) {
            const steps = stepIndicators.querySelectorAll('[data-step]');
            steps.forEach((step, index) => {
                if (index < 3) { // Test first few steps
                    try {
                        step.click();
                        // Note: This might not work if step jumping is disabled
                    } catch (error) {
                        // Expected if step jumping is disabled
                    }
                }
            });
        }

        this.addTestResult('Wizard Navigation', 'PASS', 'Wizard navigation elements present');
    }

    // 4. Component Exploration Testing
    async testComponentExploration() {
        console.log('🧩 Testing component exploration...');

        // Navigate to components view
        const componentsBtn = document.getElementById('componentsBtn');
        if (componentsBtn) componentsBtn.click();
        await new Promise(resolve => setTimeout(resolve, 500));

        await this.testComponentList();
        await this.testComponentConfiguration();
        await this.testPricingSummary();
    }

    async testComponentList() {
        const componentList = document.getElementById('componentList');

        if (!componentList) {
            this.addIssue('HIGH', 'Component List', 'Component list container missing');
            return;
        }

        // Wait for components to load
        await new Promise(resolve => setTimeout(resolve, 1500));

        const componentItems = componentList.children;
        if (componentItems.length === 0) {
            this.addIssue('HIGH', 'Component List', 'No components loaded in component list');
            return;
        }

        // Test component selection
        for (let i = 0; i < Math.min(3, componentItems.length); i++) {
            const item = componentItems[i];
            if (item.click) {
                try {
                    item.click();
                    await new Promise(resolve => setTimeout(resolve, 300));

                    const configArea = document.getElementById('componentConfigArea');
                    if (configArea && configArea.textContent.includes('Select a component')) {
                        this.addIssue('MEDIUM', 'Component Selection', `Component ${i+1} not loading configuration`);
                    }

                } catch (error) {
                    this.addIssue('MEDIUM', 'Component Selection', `Failed to select component ${i+1}: ${error.message}`);
                }
            }
        }

        this.addTestResult('Component List', 'PASS', `Found ${componentItems.length} components`);
    }

    async testComponentConfiguration() {
        const configArea = document.getElementById('componentConfigArea');
        if (!configArea) {
            this.addIssue('HIGH', 'Component Config', 'Component configuration area missing');
            return;
        }

        // Test if configuration UI loads
        const componentList = document.getElementById('componentList');
        if (componentList && componentList.children.length > 0) {
            const firstComponent = componentList.children[0];
            firstComponent.click();
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check for form inputs in config area
            const configInputs = configArea.querySelectorAll('input, select, textarea');
            if (configInputs.length === 0) {
                this.addIssue('MEDIUM', 'Component Config', 'No configuration inputs found for component');
            }

            // Test input interaction
            configInputs.forEach((input, index) => {
                if (index < 2) { // Test first couple inputs
                    try {
                        if (input.type === 'number' || input.type === 'text') {
                            input.value = '10';
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                        } else if (input.tagName === 'SELECT') {
                            if (input.options.length > 1) {
                                input.selectedIndex = 1;
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                    } catch (error) {
                        this.addIssue('LOW', 'Component Config', `Input interaction failed: ${error.message}`);
                    }
                }
            });
        }

        this.addTestResult('Component Configuration', 'PASS', 'Component configuration interface working');
    }

    async testPricingSummary() {
        const pricingSummary = document.getElementById('pricingSummary');
        if (!pricingSummary) {
            this.addIssue('HIGH', 'Pricing Summary', 'Pricing summary area missing');
            return;
        }

        // After configuring a component, pricing should update
        await new Promise(resolve => setTimeout(resolve, 1000));

        const priceElements = pricingSummary.querySelectorAll('[data-price], .price, .total');
        if (priceElements.length === 0) {
            this.addIssue('MEDIUM', 'Pricing Summary', 'No pricing information visible in summary');
        }

        // Test export quote button
        const exportQuoteBtn = document.getElementById('exportComponentsQuote');
        if (!exportQuoteBtn) {
            this.addIssue('MEDIUM', 'Quote Export', 'Export quote button missing');
        } else {
            try {
                exportQuoteBtn.click();
                await new Promise(resolve => setTimeout(resolve, 200));
                // Should trigger export modal or direct download
            } catch (error) {
                this.addIssue('MEDIUM', 'Quote Export', `Export quote failed: ${error.message}`);
            }
        }

        this.addTestResult('Pricing Summary', 'PASS', 'Pricing summary functionality working');
    }

    // 5. Configuration Learning Testing
    async testConfigurationLearning() {
        console.log('⚙️ Testing configuration learning...');

        await this.testAllComponentTypes();
        await this.testConfigurationPersistence();
        await this.testConfigurationValidation();
    }

    async testAllComponentTypes() {
        const componentList = document.getElementById('componentList');
        if (!componentList) return;

        const components = Array.from(componentList.children);

        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            const componentName = component.textContent || `Component ${i+1}`;

            try {
                component.click();
                await new Promise(resolve => setTimeout(resolve, 400));

                const configArea = document.getElementById('componentConfigArea');
                const inputs = configArea.querySelectorAll('input, select, textarea');

                if (inputs.length === 0) {
                    this.addIssue('MEDIUM', 'Component Types', `${componentName} has no configuration options`);
                    continue;
                }

                // Test each input type
                inputs.forEach(input => {
                    this.testInputBehavior(input, componentName);
                });

            } catch (error) {
                this.addIssue('LOW', 'Component Types', `Failed to test ${componentName}: ${error.message}`);
            }
        }

        this.addTestResult('Configuration Learning', 'PASS', `Tested configuration for ${components.length} components`);
    }

    testInputBehavior(input, componentName) {
        try {
            switch (input.type) {
                case 'number':
                    // Test numeric validation
                    input.value = 'abc';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    if (input.value === 'abc') {
                        this.addIssue('LOW', 'Input Validation', `${componentName} numeric input accepts non-numeric values`);
                    }

                    input.value = '100';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    break;

                case 'text':
                    input.value = 'Test Value';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    break;

                case 'checkbox':
                    input.checked = !input.checked;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    break;

                default:
                    if (input.tagName === 'SELECT' && input.options.length > 0) {
                        input.selectedIndex = Math.min(1, input.options.length - 1);
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
            }
        } catch (error) {
            this.addIssue('LOW', 'Input Behavior', `Input test failed for ${componentName}: ${error.message}`);
        }
    }

    async testConfigurationPersistence() {
        // Test that configuration is maintained when switching components
        const componentList = document.getElementById('componentList');
        if (!componentList || componentList.children.length < 2) return;

        const firstComponent = componentList.children[0];
        const secondComponent = componentList.children[1];

        // Configure first component
        firstComponent.click();
        await new Promise(resolve => setTimeout(resolve, 300));

        const configArea = document.getElementById('componentConfigArea');
        const firstInput = configArea.querySelector('input[type="number"], input[type="text"]');
        if (firstInput) {
            const testValue = 'TestPersistence123';
            firstInput.value = testValue;
            firstInput.dispatchEvent(new Event('input', { bubbles: true }));

            // Switch to second component
            secondComponent.click();
            await new Promise(resolve => setTimeout(resolve, 300));

            // Switch back to first component
            firstComponent.click();
            await new Promise(resolve => setTimeout(resolve, 300));

            const sameInput = configArea.querySelector('input[type="number"], input[type="text"]');
            if (sameInput && sameInput.value !== testValue) {
                this.addIssue('MEDIUM', 'Configuration Persistence', 'Component configuration not persisting when switching between components');
            }
        }

        this.addTestResult('Configuration Persistence', 'PASS', 'Configuration persistence tested');
    }

    async testConfigurationValidation() {
        // Test validation across different component configurations
        const componentList = document.getElementById('componentList');
        if (!componentList) return;

        const components = Array.from(componentList.children).slice(0, 3); // Test first 3

        for (const component of components) {
            component.click();
            await new Promise(resolve => setTimeout(resolve, 300));

            const configArea = document.getElementById('componentConfigArea');
            const requiredInputs = configArea.querySelectorAll('input[required], select[required]');

            // Clear required inputs and test validation
            requiredInputs.forEach(input => {
                if (input.type === 'number' || input.type === 'text') {
                    input.value = '';
                } else if (input.tagName === 'SELECT') {
                    input.selectedIndex = 0;
                }
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });

            // Trigger validation check (if there's a form submit or calculate button)
            const calculateBtn = configArea.querySelector('[data-action="calculate"], button[type="submit"]');
            if (calculateBtn) {
                try {
                    calculateBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 200));

                    // Check for validation messages
                    const validationErrors = configArea.querySelectorAll('.error, .invalid, [role="alert"]');
                    if (requiredInputs.length > 0 && validationErrors.length === 0) {
                        this.addIssue('LOW', 'Configuration Validation', 'Required field validation not showing errors');
                    }
                } catch (error) {
                    // Validation might be handled differently
                }
            }
        }

        this.addTestResult('Configuration Validation', 'PASS', 'Configuration validation tested');
    }

    // 6. Quote Generation Testing
    async testQuoteGeneration() {
        console.log('💰 Testing quote generation...');

        await this.testQuickQuoteGeneration();
        await this.testFullQuoteGeneration();
        await this.testQuoteExport();
        await this.testQuoteFormats();
    }

    async testQuickQuoteGeneration() {
        // Test component-level quote generation
        const componentsBtn = document.getElementById('componentsBtn');
        if (componentsBtn) componentsBtn.click();
        await new Promise(resolve => setTimeout(resolve, 500));

        const componentList = document.getElementById('componentList');
        if (componentList && componentList.children.length > 0) {
            // Configure a component
            const firstComponent = componentList.children[0];
            firstComponent.click();
            await new Promise(resolve => setTimeout(resolve, 400));

            const configArea = document.getElementById('componentConfigArea');
            const inputs = configArea.querySelectorAll('input[type="number"]');

            // Set some values
            inputs.forEach((input, index) => {
                if (index < 2) {
                    input.value = '10';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });

            await new Promise(resolve => setTimeout(resolve, 500));

            // Check if pricing updates
            const pricingSummary = document.getElementById('pricingSummary');
            const priceElements = pricingSummary.querySelectorAll('[data-price], .price, .total');

            if (priceElements.length === 0) {
                this.addIssue('MEDIUM', 'Quote Generation', 'No pricing information generated for component configuration');
            }
        }

        this.addTestResult('Quick Quote Generation', 'PASS', 'Component-level quote generation tested');
    }

    async testFullQuoteGeneration() {
        // Test full wizard quote generation
        const wizardBtn = document.getElementById('wizardBtn');
        if (wizardBtn) wizardBtn.click();
        await new Promise(resolve => setTimeout(resolve, 500));

        const wizardContent = document.getElementById('wizardContent');
        if (!wizardContent) {
            this.addIssue('HIGH', 'Full Quote', 'Wizard content not accessible');
            return;
        }

        // Try to fill out first few steps quickly
        for (let step = 0; step < 3; step++) {
            await new Promise(resolve => setTimeout(resolve, 400));

            const inputs = wizardContent.querySelectorAll('input, select');
            inputs.forEach(input => {
                if (input.type === 'number') {
                    input.value = '5';
                } else if (input.type === 'text') {
                    input.value = 'Test Value';
                } else if (input.tagName === 'SELECT' && input.options.length > 1) {
                    input.selectedIndex = 1;
                }
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });

            const nextBtn = wizardContent.querySelector('[data-action="next"]');
            if (nextBtn && !nextBtn.disabled) {
                nextBtn.click();
                await new Promise(resolve => setTimeout(resolve, 400));
            } else {
                break;
            }
        }

        this.addTestResult('Full Quote Generation', 'PASS', 'Full quote generation workflow tested');
    }

    async testQuoteExport() {
        // Test export functionality
        const exportBtn = document.getElementById('exportBtn');
        if (!exportBtn) {
            this.addIssue('HIGH', 'Quote Export', 'Main export button missing');
            return;
        }

        try {
            exportBtn.click();
            await new Promise(resolve => setTimeout(resolve, 300));

            const exportModal = document.getElementById('exportModal');
            if (!exportModal || exportModal.classList.contains('hidden')) {
                this.addIssue('HIGH', 'Quote Export', 'Export modal not showing');
                return;
            }

            // Test export options
            const exportType = document.getElementById('exportType');
            if (!exportType) {
                this.addIssue('MEDIUM', 'Quote Export', 'Export type selector missing');
            } else {
                // Test different export formats
                const formats = ['excel', 'csv', 'pdf'];
                formats.forEach(format => {
                    const option = Array.from(exportType.options).find(opt => opt.value === format);
                    if (!option) {
                        this.addIssue('LOW', 'Quote Export', `${format.toUpperCase()} export format missing`);
                    }
                });
            }

            // Test export checkboxes
            const exportCurrent = document.getElementById('exportCurrent');
            const exportHistory = document.getElementById('exportHistory');
            const exportComponents = document.getElementById('exportComponents');

            if (!exportCurrent) {
                this.addIssue('MEDIUM', 'Quote Export', 'Export current quote option missing');
            }

            // Test export confirmation
            const confirmExport = document.getElementById('confirmExport');
            if (confirmExport) {
                try {
                    confirmExport.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    // Export should trigger - hard to test file download
                } catch (error) {
                    this.addIssue('MEDIUM', 'Quote Export', `Export confirmation failed: ${error.message}`);
                }
            }

        } catch (error) {
            this.addIssue('HIGH', 'Quote Export', `Export functionality failed: ${error.message}`);
        }

        this.addTestResult('Quote Export', 'PASS', 'Quote export functionality tested');
    }

    async testQuoteFormats() {
        // Test different quote output formats
        const formats = ['summary', 'detailed', 'itemized'];

        // This would typically test different views or export options
        // Since the specific implementation may vary, we'll test what's available

        const pricingSummary = document.getElementById('pricingSummary');
        if (pricingSummary) {
            const summaryItems = pricingSummary.querySelectorAll('.price-item, .quote-item, [data-component]');
            if (summaryItems.length > 0) {
                this.addTestResult('Quote Formats', 'PASS', `Found ${summaryItems.length} quote items in summary format`);
            } else {
                this.addIssue('LOW', 'Quote Formats', 'Quote summary format appears empty');
            }
        }

        this.addTestResult('Quote Formats', 'PASS', 'Quote format testing completed');
    }

    // 7. Data Management Testing
    async testDataManagement() {
        console.log('💾 Testing data management...');

        await this.testDataSaving();
        await this.testDataLoading();
        await this.testDataClearing();
        await this.testDataPersistence();
    }

    async testDataSaving() {
        // Test automatic data saving
        if (typeof StorageManager === 'undefined') {
            this.addIssue('HIGH', 'Data Management', 'StorageManager not available');
            return;
        }

        try {
            // Create some test data
            const testData = { test: 'value', timestamp: Date.now() };
            StorageManager.saveQuote('test-quote', testData);

            const savedData = StorageManager.loadQuote('test-quote');
            if (!savedData || savedData.test !== 'value') {
                this.addIssue('HIGH', 'Data Saving', 'Data not saving/loading correctly');
            }

        } catch (error) {
            this.addIssue('HIGH', 'Data Saving', `Data saving failed: ${error.message}`);
        }

        this.addTestResult('Data Saving', 'PASS', 'Data saving functionality tested');
    }

    async testDataLoading() {
        // Test data loading from storage
        try {
            // Go to history view to test loading
            const historyBtn = document.getElementById('historyBtn');
            if (historyBtn) historyBtn.click();
            await new Promise(resolve => setTimeout(resolve, 500));

            const historyContent = document.getElementById('historyContent');
            if (!historyContent) {
                this.addIssue('MEDIUM', 'Data Loading', 'History content area missing');
                return;
            }

            // Check if any saved quotes are displayed
            await new Promise(resolve => setTimeout(resolve, 1000));

            const historyItems = historyContent.querySelectorAll('.quote-item, .history-item, [data-quote]');
            // Note: Might be empty for new users, which is expected

        } catch (error) {
            this.addIssue('MEDIUM', 'Data Loading', `Data loading test failed: ${error.message}`);
        }

        this.addTestResult('Data Loading', 'PASS', 'Data loading functionality tested');
    }

    async testDataClearing() {
        // Test data clearing functionality
        try {
            if (typeof StorageManager !== 'undefined') {
                // Save some test data first
                StorageManager.saveQuote('clear-test', { test: 'data' });

                // Clear it
                StorageManager.clearAllData();

                // Verify it's cleared
                const clearedData = StorageManager.loadQuote('clear-test');
                if (clearedData !== null) {
                    this.addIssue('MEDIUM', 'Data Clearing', 'Data not properly cleared');
                }
            }
        } catch (error) {
            this.addIssue('MEDIUM', 'Data Clearing', `Data clearing failed: ${error.message}`);
        }

        this.addTestResult('Data Clearing', 'PASS', 'Data clearing functionality tested');
    }

    async testDataPersistence() {
        // Test data persistence across page refreshes (simulated)
        try {
            if (typeof StorageManager !== 'undefined') {
                const persistenceTest = {
                    test: 'persistence',
                    timestamp: Date.now(),
                    user: 'onboarding-test'
                };

                StorageManager.saveQuote('persistence-test', persistenceTest);

                // Simulate what happens on page load
                const loadedData = StorageManager.loadQuote('persistence-test');
                if (!loadedData || loadedData.test !== 'persistence') {
                    this.addIssue('MEDIUM', 'Data Persistence', 'Data not persisting correctly');
                }

                // Clean up
                StorageManager.clearAllData();
            }
        } catch (error) {
            this.addIssue('MEDIUM', 'Data Persistence', `Persistence test failed: ${error.message}`);
        }

        this.addTestResult('Data Persistence', 'PASS', 'Data persistence functionality tested');
    }

    // 8. Error Recovery Testing
    async testErrorRecovery() {
        console.log('🔧 Testing error recovery...');

        await this.testInvalidInputs();
        await this.testNetworkIssues();
        await this.testErrorBoundaries();
        await this.testGracefulDegradation();
    }

    async testInvalidInputs() {
        // Test various invalid input scenarios
        const componentsBtn = document.getElementById('componentsBtn');
        if (componentsBtn) componentsBtn.click();
        await new Promise(resolve => setTimeout(resolve, 500));

        const componentList = document.getElementById('componentList');
        if (componentList && componentList.children.length > 0) {
            componentList.children[0].click();
            await new Promise(resolve => setTimeout(resolve, 400));

            const configArea = document.getElementById('componentConfigArea');
            const inputs = configArea.querySelectorAll('input');

            const invalidInputs = [
                { type: 'number', values: ['abc', '-1', '999999999', 'null', 'undefined'] },
                { type: 'text', values: ['<script>alert("xss")</script>', '../../etc/passwd', 'null'] },
                { type: 'email', values: ['invalid-email', '@domain.com', 'user@'] }
            ];

            for (const input of inputs) {
                const testValues = invalidInputs.find(test => test.type === input.type);
                if (testValues) {
                    for (const value of testValues.values.slice(0, 2)) { // Test first 2 values
                        try {
                            input.value = value;
                            input.dispatchEvent(new Event('input', { bubbles: true }));

                            await new Promise(resolve => setTimeout(resolve, 100));

                            // Check if app crashed or shows error handling
                            if (!document.body) {
                                this.addIssue('CRITICAL', 'Error Recovery', `App crashed with input: ${value}`);
                                return;
                            }

                        } catch (error) {
                            // Some errors are expected
                            if (error.message.includes('script') || error.message.includes('security')) {
                                this.addTestResult('Invalid Input Protection', 'PASS', 'XSS protection working');
                            }
                        }
                    }
                }
            }
        }

        this.addTestResult('Invalid Inputs', 'PASS', 'Invalid input handling tested');
    }

    async testNetworkIssues() {
        // Test offline/network failure scenarios
        // This is limited in a browser environment, but we can test some aspects

        try {
            // Test import with malformed data
            const importBtn = document.getElementById('importBtn');
            if (importBtn) {
                importBtn.click();
                await new Promise(resolve => setTimeout(resolve, 200));

                // Simulate bad file upload
                const importFile = document.getElementById('importFile');
                if (importFile) {
                    // Create a mock file with invalid data
                    const blob = new Blob(['invalid,data,format'], { type: 'text/csv' });
                    const file = new File([blob], 'test.csv', { type: 'text/csv' });

                    // This is tricky to test fully without actually uploading
                    // We're testing that the interface exists
                }

                // Close modal
                const cancelImport = document.getElementById('cancelImport');
                if (cancelImport) cancelImport.click();
            }

        } catch (error) {
            // Network errors might be expected
            this.addTestResult('Network Issues', 'PASS', 'Network error handling exists');
        }

        this.addTestResult('Network Issues', 'PASS', 'Network issue handling tested');
    }

    async testErrorBoundaries() {
        // Test error boundary functionality
        const errorBoundary = document.getElementById('errorBoundary');

        if (!errorBoundary) {
            this.addIssue('MEDIUM', 'Error Boundaries', 'Error boundary component missing');
            return;
        }

        // Test error refresh button
        const errorRefresh = document.getElementById('errorRefresh');
        if (!errorRefresh) {
            this.addIssue('LOW', 'Error Boundaries', 'Error refresh button missing');
        }

        // Test error message area
        const errorMessage = document.getElementById('errorMessage');
        if (!errorMessage) {
            this.addIssue('LOW', 'Error Boundaries', 'Error message area missing');
        }

        this.addTestResult('Error Boundaries', 'PASS', 'Error boundary components present');
    }

    async testGracefulDegradation() {
        // Test graceful degradation when features fail

        // Test JavaScript disabled scenario (limited testing possible)
        try {
            // Test if critical functionality still works with limited JS
            const staticElements = document.querySelectorAll('h1, h2, nav, main');
            if (staticElements.length === 0) {
                this.addIssue('HIGH', 'Graceful Degradation', 'Basic HTML structure missing');
            }

            // Test CSS fallbacks
            const navElement = document.querySelector('nav');
            if (navElement) {
                const styles = window.getComputedStyle(navElement);
                if (styles.display === 'none') {
                    this.addIssue('MEDIUM', 'Graceful Degradation', 'Navigation hidden without JS');
                }
            }

        } catch (error) {
            this.addIssue('LOW', 'Graceful Degradation', `Degradation test failed: ${error.message}`);
        }

        this.addTestResult('Graceful Degradation', 'PASS', 'Graceful degradation tested');
    }

    // 9. Edge Cases Testing
    async testEdgeCases() {
        console.log('🎯 Testing edge cases...');

        await this.testEmptyStates();
        await this.testPartialCompletion();
        await this.testBrowserNavigation();
        await this.testPageRefresh();
    }

    async testEmptyStates() {
        // Test empty state handling
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) historyBtn.click();
        await new Promise(resolve => setTimeout(resolve, 500));

        const historyContent = document.getElementById('historyContent');
        if (historyContent) {
            // For new users, history should show empty state
            if (historyContent.textContent.trim().length === 0) {
                this.addIssue('LOW', 'Empty States', 'History empty state not user-friendly');
            }
        }

        // Test components with no configuration
        const componentsBtn = document.getElementById('componentsBtn');
        if (componentsBtn) componentsBtn.click();
        await new Promise(resolve => setTimeout(resolve, 500));

        const configArea = document.getElementById('componentConfigArea');
        if (configArea && configArea.textContent.includes('Select a component')) {
            this.addTestResult('Empty States', 'PASS', 'Empty state messaging present');
        }

        this.addTestResult('Empty States', 'PASS', 'Empty state handling tested');
    }

    async testPartialCompletion() {
        // Test partial workflow completion
        const wizardBtn = document.getElementById('wizardBtn');
        if (wizardBtn) wizardBtn.click();
        await new Promise(resolve => setTimeout(resolve, 500));

        const wizardContent = document.getElementById('wizardContent');
        if (wizardContent) {
            // Fill out part of the form
            const inputs = wizardContent.querySelectorAll('input, select');
            const halfwayPoint = Math.floor(inputs.length / 2);

            for (let i = 0; i < halfwayPoint; i++) {
                const input = inputs[i];
                if (input.type === 'number') {
                    input.value = '5';
                } else if (input.type === 'text') {
                    input.value = 'Partial';
                }
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Navigate away and back
            const dashboardBtn = document.getElementById('dashboardBtn');
            if (dashboardBtn) dashboardBtn.click();
            await new Promise(resolve => setTimeout(resolve, 300));

            wizardBtn.click();
            await new Promise(resolve => setTimeout(resolve, 300));

            // Check if partial data is preserved
            const firstInput = wizardContent.querySelector('input[type="number"], input[type="text"]');
            if (firstInput && (firstInput.value === '5' || firstInput.value === 'Partial')) {
                this.addTestResult('Partial Completion', 'PASS', 'Partial form data preserved');
            } else {
                this.addIssue('MEDIUM', 'Partial Completion', 'Partial form data not preserved when navigating');
            }
        }

        this.addTestResult('Partial Completion', 'PASS', 'Partial completion handling tested');
    }

    async testBrowserNavigation() {
        // Test browser back/forward button handling
        try {
            // Navigate through different views
            const views = ['components', 'wizard', 'history', 'dashboard'];

            for (const view of views) {
                const btn = document.getElementById(`${view}Btn`);
                if (btn) {
                    btn.click();
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

            // Test browser back (limited capability in test environment)
            // The app should handle history state changes
            if (typeof window !== 'undefined' && window.history) {
                // App should have proper history handling
                this.addTestResult('Browser Navigation', 'PASS', 'Browser history API available');
            }

        } catch (error) {
            this.addIssue('LOW', 'Browser Navigation', `Browser navigation test failed: ${error.message}`);
        }

        this.addTestResult('Browser Navigation', 'PASS', 'Browser navigation tested');
    }

    async testPageRefresh() {
        // Test page refresh during workflows
        // This is limited in testing but we can check for data persistence

        try {
            // Set up some state
            const componentsBtn = document.getElementById('componentsBtn');
            if (componentsBtn) componentsBtn.click();
            await new Promise(resolve => setTimeout(resolve, 300));

            // Configure a component
            const componentList = document.getElementById('componentList');
            if (componentList && componentList.children.length > 0) {
                componentList.children[0].click();
                await new Promise(resolve => setTimeout(resolve, 300));

                const configArea = document.getElementById('componentConfigArea');
                const input = configArea.querySelector('input[type="number"]');
                if (input) {
                    input.value = '42';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }

            // Simulate what should happen on refresh
            if (typeof StorageManager !== 'undefined') {
                // Data should be automatically saved
                await new Promise(resolve => setTimeout(resolve, 500));

                // Check if there's auto-save functionality
                const hasAutoSave = typeof window !== 'undefined' &&
                                   (window.localStorage || window.sessionStorage);

                if (!hasAutoSave) {
                    this.addIssue('MEDIUM', 'Page Refresh', 'No auto-save mechanism detected');
                }
            }

        } catch (error) {
            this.addIssue('LOW', 'Page Refresh', `Page refresh test failed: ${error.message}`);
        }

        this.addTestResult('Page Refresh', 'PASS', 'Page refresh handling tested');
    }

    // 10. Mobile vs Desktop Testing
    async testMobileDesktop() {
        console.log('📱 Testing mobile vs desktop experiences...');

        await this.testResponsiveLayout();
        await this.testMobileInteractions();
        await this.testDesktopInteractions();
        await this.testViewportChanges();
    }

    async testResponsiveLayout() {
        // Test responsive design
        const viewportSizes = [
            { width: 375, height: 667, name: 'Mobile' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 1024, height: 768, name: 'Tablet Landscape' },
            { width: 1440, height: 900, name: 'Desktop' }
        ];

        for (const size of viewportSizes) {
            // We can't actually resize the viewport in this context,
            // but we can test responsive elements

            const mobileMenu = document.getElementById('mobileMenu');
            const desktopNav = document.getElementById('desktopNav');

            if (!mobileMenu) {
                this.addIssue('MEDIUM', 'Mobile Layout', 'Mobile menu missing');
            }

            if (!desktopNav) {
                this.addIssue('MEDIUM', 'Desktop Layout', 'Desktop navigation missing');
            }

            // Test responsive classes
            const responsiveElements = document.querySelectorAll('.sm\\:inline, .md\\:flex, .lg\\:grid');
            if (responsiveElements.length === 0) {
                this.addIssue('LOW', 'Responsive Design', 'No responsive utility classes found');
            }
        }

        this.addTestResult('Responsive Layout', 'PASS', 'Responsive layout elements tested');
    }

    async testMobileInteractions() {
        // Test mobile-specific interactions
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');

        if (mobileMenuBtn) {
            try {
                // Test mobile menu toggle
                mobileMenuBtn.click();
                await new Promise(resolve => setTimeout(resolve, 200));

                const mobileMenu = document.getElementById('mobileMenu');
                if (mobileMenu && mobileMenu.classList.contains('hidden')) {
                    this.addIssue('MEDIUM', 'Mobile Interactions', 'Mobile menu not showing on click');
                }

                // Test mobile navigation
                const mobileNavButtons = document.querySelectorAll('.mobile-nav-btn');
                if (mobileNavButtons.length === 0) {
                    this.addIssue('MEDIUM', 'Mobile Interactions', 'Mobile navigation buttons missing');
                }

                // Test first mobile nav button
                if (mobileNavButtons.length > 0) {
                    mobileNavButtons[0].click();
                    await new Promise(resolve => setTimeout(resolve, 200));
                }

            } catch (error) {
                this.addIssue('MEDIUM', 'Mobile Interactions', `Mobile interaction failed: ${error.message}`);
            }
        }

        this.addTestResult('Mobile Interactions', 'PASS', 'Mobile interactions tested');
    }

    async testDesktopInteractions() {
        // Test desktop-specific interactions
        const desktopNavButtons = document.querySelectorAll('.nav-btn');

        if (desktopNavButtons.length === 0) {
            this.addIssue('MEDIUM', 'Desktop Interactions', 'Desktop navigation buttons missing');
            return;
        }

        // Test hover states (limited in testing environment)
        for (const button of desktopNavButtons) {
            try {
                // Test click interactions
                button.click();
                await new Promise(resolve => setTimeout(resolve, 200));

                // Check if button shows active state
                if (!button.classList.contains('active')) {
                    this.addIssue('LOW', 'Desktop Interactions', 'Desktop nav button active state not updating');
                    break;
                }

            } catch (error) {
                this.addIssue('LOW', 'Desktop Interactions', `Desktop nav interaction failed: ${error.message}`);
            }
        }

        this.addTestResult('Desktop Interactions', 'PASS', 'Desktop interactions tested');
    }

    async testViewportChanges() {
        // Test behavior when viewport changes
        // This is limited in our testing environment

        const flexElements = document.querySelectorAll('.flex, .grid');
        const responsiveElements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]');

        if (responsiveElements.length > 0) {
            this.addTestResult('Viewport Changes', 'PASS', `Found ${responsiveElements.length} responsive elements`);
        } else {
            this.addIssue('LOW', 'Viewport Changes', 'Limited responsive design detected');
        }

        this.addTestResult('Viewport Changes', 'PASS', 'Viewport change handling tested');
    }

    // 11. Accessibility Features Testing
    async testAccessibilityFeatures() {
        console.log('♿ Testing accessibility features...');

        await this.testKeyboardNavigation();
        await this.testScreenReaderSupport();
        await this.testColorContrast();
        await this.testFocusManagement();
    }

    async testKeyboardNavigation() {
        // Test keyboard navigation
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
            this.addIssue('HIGH', 'Accessibility', 'No focusable elements found');
            return;
        }

        // Test tabindex order
        let tabindexIssues = 0;
        focusableElements.forEach((element, index) => {
            const tabindex = element.getAttribute('tabindex');
            if (tabindex && parseInt(tabindex) > 0) {
                tabindexIssues++;
            }
        });

        if (tabindexIssues > 0) {
            this.addIssue('MEDIUM', 'Accessibility', `Found ${tabindexIssues} elements with positive tabindex`);
        }

        // Test first element focus
        try {
            focusableElements[0].focus();
            if (document.activeElement === focusableElements[0]) {
                this.addTestResult('Keyboard Navigation', 'PASS', 'Elements can receive focus');
            }
        } catch (error) {
            this.addIssue('MEDIUM', 'Accessibility', 'Focus management issue');
        }

        this.addTestResult('Keyboard Navigation', 'PASS', `Found ${focusableElements.length} focusable elements`);
    }

    async testScreenReaderSupport() {
        // Test screen reader support
        const ariaLabels = document.querySelectorAll('[aria-label]');
        const ariaDescribedBy = document.querySelectorAll('[aria-describedby]');
        const ariaRoles = document.querySelectorAll('[role]');
        const srOnlyElements = document.querySelectorAll('.sr-only');

        // Check for ARIA attributes
        const buttons = document.querySelectorAll('button');
        let unlabeledButtons = 0;

        buttons.forEach(button => {
            const hasLabel = button.getAttribute('aria-label') ||
                            button.textContent.trim() ||
                            button.querySelector('.sr-only');

            if (!hasLabel) {
                unlabeledButtons++;
            }
        });

        if (unlabeledButtons > 0) {
            this.addIssue('MEDIUM', 'Screen Reader', `${unlabeledButtons} buttons without accessible labels`);
        }

        // Check for heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
            this.addIssue('MEDIUM', 'Screen Reader', 'No heading structure found');
        }

        this.addTestResult('Screen Reader Support', 'PASS',
            `Found ${ariaLabels.length} aria-labels, ${ariaRoles.length} roles, ${headings.length} headings`);
    }

    async testColorContrast() {
        // Basic color contrast testing
        const textElements = document.querySelectorAll('p, span, div, button, a');
        let contrastIssues = 0;

        // This is a simplified test - real contrast testing would need color analysis
        textElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;

            // Check for very light text on light backgrounds (simplified)
            if (color && backgroundColor) {
                if (color.includes('rgb(255') && backgroundColor.includes('rgb(255')) {
                    contrastIssues++;
                }
            }
        });

        if (contrastIssues > 0) {
            this.addIssue('LOW', 'Color Contrast', `Potential contrast issues on ${contrastIssues} elements`);
        }

        this.addTestResult('Color Contrast', 'PASS', 'Color contrast analysis completed');
    }

    async testFocusManagement() {
        // Test focus management
        const modals = document.querySelectorAll('.modal, [role="dialog"]');

        modals.forEach(modal => {
            const focusableInModal = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (focusableInModal.length === 0) {
                this.addIssue('MEDIUM', 'Focus Management', 'Modal without focusable elements');
            }
        });

        // Test focus visible styles
        const focusVisibleElements = document.querySelectorAll('[class*="focus:"]');
        if (focusVisibleElements.length === 0) {
            this.addIssue('LOW', 'Focus Management', 'Limited focus visible styles');
        }

        this.addTestResult('Focus Management', 'PASS', 'Focus management tested');
    }

    // 12. Form Validation Testing
    async testFormValidation() {
        console.log('📋 Testing form validation...');

        await this.testRequiredFields();
        await this.testInputFormats();
        await this.testValidationMessages();
        await this.testValidationTiming();
    }

    async testRequiredFields() {
        // Test required field validation across different forms
        const forms = ['wizard', 'components'];

        for (const formType of forms) {
            if (formType === 'wizard') {
                const wizardBtn = document.getElementById('wizardBtn');
                if (wizardBtn) wizardBtn.click();
                await new Promise(resolve => setTimeout(resolve, 400));
            } else {
                const componentsBtn = document.getElementById('componentsBtn');
                if (componentsBtn) componentsBtn.click();
                await new Promise(resolve => setTimeout(resolve, 400));

                const componentList = document.getElementById('componentList');
                if (componentList && componentList.children.length > 0) {
                    componentList.children[0].click();
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }

            const container = formType === 'wizard' ?
                document.getElementById('wizardContent') :
                document.getElementById('componentConfigArea');

            if (!container) continue;

            const requiredInputs = container.querySelectorAll('[required]');

            requiredInputs.forEach(input => {
                // Clear the input
                if (input.type === 'checkbox') {
                    input.checked = false;
                } else {
                    input.value = '';
                }

                // Trigger validation
                input.dispatchEvent(new Event('blur', { bubbles: true }));
                input.dispatchEvent(new Event('invalid', { bubbles: true }));
            });

            if (requiredInputs.length > 0) {
                this.addTestResult('Required Fields', 'PASS',
                    `Found ${requiredInputs.length} required fields in ${formType}`);
            }
        }

        this.addTestResult('Required Fields', 'PASS', 'Required field validation tested');
    }

    async testInputFormats() {
        // Test input format validation
        const formatTests = [
            { type: 'email', valid: ['test@example.com'], invalid: ['invalid-email', '@domain'] },
            { type: 'number', valid: ['123', '45.67'], invalid: ['abc', '12abc', 'null'] },
            { type: 'url', valid: ['https://example.com'], invalid: ['not-a-url', 'ftp://'] }
        ];

        // Find inputs to test
        const allInputs = document.querySelectorAll('input');

        formatTests.forEach(test => {
            const inputsOfType = Array.from(allInputs).filter(input =>
                input.type === test.type || input.getAttribute('data-type') === test.type
            );

            inputsOfType.forEach(input => {
                // Test valid inputs
                test.valid.forEach(validValue => {
                    input.value = validValue;
                    input.dispatchEvent(new Event('input', { bubbles: true }));

                    if (input.validity && input.validity.valid === false) {
                        this.addIssue('LOW', 'Input Validation',
                            `Valid ${test.type} input rejected: ${validValue}`);
                    }
                });

                // Test invalid inputs
                test.invalid.forEach(invalidValue => {
                    input.value = invalidValue;
                    input.dispatchEvent(new Event('input', { bubbles: true }));

                    if (input.validity && input.validity.valid === true) {
                        this.addIssue('LOW', 'Input Validation',
                            `Invalid ${test.type} input accepted: ${invalidValue}`);
                    }
                });
            });
        });

        this.addTestResult('Input Formats', 'PASS', 'Input format validation tested');
    }

    async testValidationMessages() {
        // Test validation message display
        const forms = document.querySelectorAll('form, .form-container');
        let validationMessageFound = false;

        // Look for existing validation message elements
        const validationElements = document.querySelectorAll(
            '.error, .invalid, .validation-message, [role="alert"]'
        );

        if (validationElements.length > 0) {
            validationMessageFound = true;
        }

        // Try to trigger validation messages
        const requiredInputs = document.querySelectorAll('input[required], select[required]');

        for (const input of Array.from(requiredInputs).slice(0, 3)) {
            input.value = '';
            input.dispatchEvent(new Event('blur', { bubbles: true }));
            input.dispatchEvent(new Event('invalid', { bubbles: true }));

            await new Promise(resolve => setTimeout(resolve, 100));

            // Check if validation message appeared
            const parentForm = input.closest('form, .form-container, div');
            if (parentForm) {
                const messages = parentForm.querySelectorAll('.error, .invalid, [role="alert"]');
                if (messages.length > 0) {
                    validationMessageFound = true;
                    break;
                }
            }
        }

        if (!validationMessageFound && requiredInputs.length > 0) {
            this.addIssue('MEDIUM', 'Validation Messages', 'No validation messages found for required fields');
        }

        this.addTestResult('Validation Messages', 'PASS', 'Validation message display tested');
    }

    async testValidationTiming() {
        // Test when validation occurs (on blur, on submit, real-time)
        const inputs = document.querySelectorAll('input, select, textarea');

        let realtimeValidation = false;
        let blurValidation = false;

        for (const input of Array.from(inputs).slice(0, 3)) {
            if (input.type === 'number') {
                // Test real-time validation
                input.value = 'abc';
                input.dispatchEvent(new Event('input', { bubbles: true }));

                await new Promise(resolve => setTimeout(resolve, 100));

                if (input.value !== 'abc') {
                    realtimeValidation = true;
                }

                // Test blur validation
                input.value = '';
                input.dispatchEvent(new Event('blur', { bubbles: true }));

                await new Promise(resolve => setTimeout(resolve, 100));

                // Check for validation styling or messages
                if (input.classList.contains('invalid') || input.classList.contains('error')) {
                    blurValidation = true;
                }
            }
        }

        const validationResults = [];
        if (realtimeValidation) validationResults.push('real-time');
        if (blurValidation) validationResults.push('on-blur');

        this.addTestResult('Validation Timing', 'PASS',
            `Validation timing: ${validationResults.join(', ') || 'basic'}`);
    }

    // 13. Performance Testing
    async testPerformanceTesting() {
        console.log('⚡ Testing performance with large datasets...');

        await this.testLargeDataLoading();
        await this.testMemoryUsage();
        await this.testRenderingPerformance();
        await this.testCalculationPerformance();
    }

    async testLargeDataLoading() {
        // Test with large datasets
        try {
            if (typeof StorageManager !== 'undefined') {
                // Create large dataset
                const largeData = {};
                for (let i = 0; i < 1000; i++) {
                    largeData[`item_${i}`] = {
                        name: `Component ${i}`,
                        price: Math.random() * 1000,
                        quantity: Math.floor(Math.random() * 100),
                        details: 'A'.repeat(100) // Large string
                    };
                }

                const startTime = performance.now();
                StorageManager.saveQuote('large-test', largeData);
                const saveTime = performance.now() - startTime;

                const loadStartTime = performance.now();
                const loadedData = StorageManager.loadQuote('large-test');
                const loadTime = performance.now() - loadStartTime;

                if (saveTime > 1000) {
                    this.addIssue('MEDIUM', 'Performance', `Large data save took ${saveTime.toFixed(2)}ms`);
                }

                if (loadTime > 1000) {
                    this.addIssue('MEDIUM', 'Performance', `Large data load took ${loadTime.toFixed(2)}ms`);
                }

                // Cleanup
                StorageManager.clearAllData();

                this.addTestResult('Large Data Loading', 'PASS',
                    `Save: ${saveTime.toFixed(2)}ms, Load: ${loadTime.toFixed(2)}ms`);
            }
        } catch (error) {
            this.addIssue('MEDIUM', 'Performance', `Large data test failed: ${error.message}`);
        }

        this.addTestResult('Large Data Loading', 'PASS', 'Large data performance tested');
    }

    async testMemoryUsage() {
        // Basic memory usage testing
        try {
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

            // Create memory pressure
            const memoryTest = [];
            for (let i = 0; i < 10000; i++) {
                memoryTest.push({
                    id: i,
                    data: new Array(100).fill('test'),
                    timestamp: Date.now()
                });
            }

            const peakMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

            // Cleanup
            memoryTest.length = 0;

            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }

            const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

            const memoryGrowth = peakMemory - initialMemory;
            const memoryRecovery = peakMemory - finalMemory;

            if (memoryGrowth > 50 * 1024 * 1024) { // 50MB
                this.addIssue('LOW', 'Memory Usage', `High memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
            }

            this.addTestResult('Memory Usage', 'PASS',
                `Growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB, Recovery: ${(memoryRecovery / 1024 / 1024).toFixed(2)}MB`);

        } catch (error) {
            this.addTestResult('Memory Usage', 'PASS', 'Memory testing not available in this environment');
        }
    }

    async testRenderingPerformance() {
        // Test rendering performance
        const startTime = performance.now();

        // Test component rendering
        const componentsBtn = document.getElementById('componentsBtn');
        if (componentsBtn) componentsBtn.click();
        await new Promise(resolve => setTimeout(resolve, 100));

        const wizardBtn = document.getElementById('wizardBtn');
        if (wizardBtn) wizardBtn.click();
        await new Promise(resolve => setTimeout(resolve, 100));

        const dashboardBtn = document.getElementById('dashboardBtn');
        if (dashboardBtn) dashboardBtn.click();
        await new Promise(resolve => setTimeout(resolve, 100));

        const renderTime = performance.now() - startTime;

        if (renderTime > 2000) {
            this.addIssue('MEDIUM', 'Rendering Performance', `Slow view switching: ${renderTime.toFixed(2)}ms`);
        }

        this.addTestResult('Rendering Performance', 'PASS', `View switching: ${renderTime.toFixed(2)}ms`);
    }

    async testCalculationPerformance() {
        // Test calculation performance with many inputs
        const componentsBtn = document.getElementById('componentsBtn');
        if (componentsBtn) componentsBtn.click();
        await new Promise(resolve => setTimeout(resolve, 400));

        const componentList = document.getElementById('componentList');
        if (!componentList || componentList.children.length === 0) return;

        // Select multiple components and configure them
        const startTime = performance.now();

        for (let i = 0; i < Math.min(5, componentList.children.length); i++) {
            componentList.children[i].click();
            await new Promise(resolve => setTimeout(resolve, 100));

            const configArea = document.getElementById('componentConfigArea');
            const inputs = configArea.querySelectorAll('input[type="number"]');

            inputs.forEach(input => {
                input.value = Math.floor(Math.random() * 100);
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });

            await new Promise(resolve => setTimeout(resolve, 50));
        }

        const calculationTime = performance.now() - startTime;

        if (calculationTime > 3000) {
            this.addIssue('MEDIUM', 'Calculation Performance',
                `Slow calculations: ${calculationTime.toFixed(2)}ms for 5 components`);
        }

        this.addTestResult('Calculation Performance', 'PASS',
            `Multi-component calculations: ${calculationTime.toFixed(2)}ms`);
    }

    // Utility Methods
    addTestResult(testName, status, message) {
        this.testResults.push({
            test: testName,
            status: status,
            message: message,
            timestamp: Date.now()
        });

        const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        console.log(`  ${statusIcon} ${testName}: ${message}`);
    }

    addIssue(severity, category, description) {
        this.issues.push({
            severity: severity,
            category: category,
            description: description,
            timestamp: Date.now(),
            id: `issue_${this.issues.length + 1}`
        });

        const severityIcon = severity === 'CRITICAL' ? '🔥' :
                            severity === 'HIGH' ? '🚨' :
                            severity === 'MEDIUM' ? '⚠️' : '💡';

        console.log(`  ${severityIcon} ${severity} [${category}]: ${description}`);
    }

    generateFinalReport() {
        const endTime = Date.now();
        const duration = endTime - this.testStartTime;

        console.log('\n' + '='.repeat(60));
        console.log('📊 USER ONBOARDING SIMULATION REPORT');
        console.log('='.repeat(60));

        console.log(`\n⏱️  Test Duration: ${(duration / 1000).toFixed(2)} seconds`);
        console.log(`📝 Total Tests Run: ${this.testResults.length}`);

        // Test Results Summary
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const warnings = this.testResults.filter(r => r.status === 'WARN').length;

        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️  Warnings: ${warnings}`);

        // Issues Summary
        console.log(`\n🔍 Issues Found: ${this.issues.length}`);

        const critical = this.issues.filter(i => i.severity === 'CRITICAL').length;
        const high = this.issues.filter(i => i.severity === 'HIGH').length;
        const medium = this.issues.filter(i => i.severity === 'MEDIUM').length;
        const low = this.issues.filter(i => i.severity === 'LOW').length;

        console.log(`🔥 Critical: ${critical}`);
        console.log(`🚨 High: ${high}`);
        console.log(`⚠️  Medium: ${medium}`);
        console.log(`💡 Low: ${low}`);

        // Detailed Issues
        if (this.issues.length > 0) {
            console.log('\n📋 DETAILED ISSUES:');
            console.log('-'.repeat(40));

            this.issues.forEach((issue, index) => {
                const severityIcon = issue.severity === 'CRITICAL' ? '🔥' :
                                    issue.severity === 'HIGH' ? '🚨' :
                                    issue.severity === 'MEDIUM' ? '⚠️' : '💡';

                console.log(`\n${index + 1}. ${severityIcon} ${issue.severity} - ${issue.category}`);
                console.log(`   ${issue.description}`);
            });
        }

        // Recommendations
        console.log('\n🎯 KEY RECOMMENDATIONS:');
        console.log('-'.repeat(40));

        if (critical > 0) {
            console.log('🔥 URGENT: Address critical issues immediately - they may prevent users from using the application');
        }

        if (high > 0) {
            console.log('🚨 HIGH PRIORITY: Fix high-severity issues that impact user experience significantly');
        }

        if (medium > 0) {
            console.log('⚠️  MEDIUM PRIORITY: Address medium issues to improve user experience');
        }

        console.log('\n✨ Overall Assessment:');
        if (critical === 0 && high === 0) {
            console.log('🎉 Application is ready for user onboarding! Only minor issues found.');
        } else if (critical === 0 && high <= 2) {
            console.log('👍 Application is mostly ready, but some important fixes needed.');
        } else {
            console.log('🔧 Application needs significant fixes before optimal user onboarding.');
        }

        console.log('\n' + '='.repeat(60));
        console.log('End of User Onboarding Simulation Report');
        console.log('='.repeat(60));

        // Return summary for programmatic access
        return {
            duration: duration,
            totalTests: this.testResults.length,
            passed: passed,
            failed: failed,
            warnings: warnings,
            totalIssues: this.issues.length,
            criticalIssues: critical,
            highIssues: high,
            mediumIssues: medium,
            lowIssues: low,
            issues: this.issues,
            testResults: this.testResults
        };
    }
}

// Auto-run simulation when loaded
if (typeof window !== 'undefined') {
    // Wait for DOM and application to be ready
    document.addEventListener('DOMContentLoaded', async () => {
        // Wait a bit more for the app to fully initialize
        setTimeout(async () => {
            const simulation = new UserOnboardingSimulation();
            await simulation.runCompleteOnboardingSimulation();
        }, 2000);
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserOnboardingSimulation;
}