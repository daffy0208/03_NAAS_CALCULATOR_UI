/**
 * Comprehensive Testing Script for NaaS Calculator
 * Tests all workflows and identifies bugs systematically
 */

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    delays: {
        short: 100,
        medium: 500,
        long: 1000,
        navigation: 2000
    }
};

// Test results tracker
const testResults = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    bugs: [],
    warnings: []
};

// Utility functions
function logTest(name, status, message = '') {
    testResults.totalTests++;
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${name}: ${status}${message ? ' - ' + message : ''}`;
    console.log(logMessage);

    if (status === 'PASS') {
        testResults.passed++;
    } else if (status === 'FAIL') {
        testResults.failed++;
        testResults.bugs.push({ test: name, message, timestamp });
    } else if (status === 'WARN') {
        testResults.warnings.push({ test: name, message, timestamp });
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getElement(selector) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
        } else {
            setTimeout(() => {
                const retryElement = document.querySelector(selector);
                if (retryElement) {
                    resolve(retryElement);
                } else {
                    reject(new Error(`Element not found: ${selector}`));
                }
            }, 500);
        }
    });
}

async function clickElement(selector) {
    try {
        const element = await getElement(selector);
        element.click();
        await sleep(TEST_CONFIG.delays.short);
        return true;
    } catch (error) {
        logTest('Click Element', 'FAIL', `Failed to click ${selector}: ${error.message}`);
        return false;
    }
}

async function fillInput(selector, value) {
    try {
        const element = await getElement(selector);
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(TEST_CONFIG.delays.short);
        return true;
    } catch (error) {
        logTest('Fill Input', 'FAIL', `Failed to fill ${selector}: ${error.message}`);
        return false;
    }
}

// Test Suite 1: Project Setup Wizard
async function testProjectSetupWizard() {
    console.log('\n=== Testing Project Setup Wizard ===');

    try {
        // Navigate to wizard
        if (!await clickElement('#wizardBtn')) return;
        await sleep(TEST_CONFIG.delays.navigation);

        // Check if wizard initialized
        if (!document.querySelector('#wizardContent')) {
            logTest('Wizard Initialization', 'FAIL', 'Wizard content not found');
            return;
        }
        logTest('Wizard Initialization', 'PASS');

        // Test project form fields
        const projectData = {
            projectName: 'Test Enterprise Network',
            customerName: 'ACME Corporation',
            sites: '3',
            totalUsers: '250',
            primaryLocation: 'London, UK'
        };

        for (const [field, value] of Object.entries(projectData)) {
            if (!await fillInput(`[name="${field}"]`, value)) {
                logTest(`Project Field ${field}`, 'FAIL', 'Could not fill field');
            } else {
                logTest(`Project Field ${field}`, 'PASS');
            }
        }

        // Test timeline selection
        if (await getElement('[name="timeline"]')) {
            const timelineSelect = await getElement('[name="timeline"]');
            timelineSelect.value = 'short';
            timelineSelect.dispatchEvent(new Event('change', { bubbles: true }));
            logTest('Timeline Selection', 'PASS');
        } else {
            logTest('Timeline Selection', 'FAIL', 'Timeline select not found');
        }

        // Test budget selection
        if (await getElement('[name="budget"]')) {
            const budgetSelect = await getElement('[name="budget"]');
            budgetSelect.value = 'large';
            budgetSelect.dispatchEvent(new Event('change', { bubbles: true }));
            logTest('Budget Selection', 'PASS');
        } else {
            logTest('Budget Selection', 'FAIL', 'Budget select not found');
        }

        // Test complexity selection
        if (await getElement('[name="complexity"]')) {
            const complexitySelect = await getElement('[name="complexity"]');
            complexitySelect.value = 'complex';
            complexitySelect.dispatchEvent(new Event('change', { bubbles: true }));
            logTest('Complexity Selection', 'PASS');
        } else {
            logTest('Complexity Selection', 'FAIL', 'Complexity select not found');
        }

        // Test navigation to next step
        if (!await clickElement('#wizardNext')) {
            logTest('Wizard Next Navigation', 'FAIL', 'Could not proceed to next step');
        } else {
            await sleep(TEST_CONFIG.delays.medium);
            logTest('Wizard Next Navigation', 'PASS');
        }

        // Verify step progression
        const currentStep = document.querySelector('#currentStep');
        if (currentStep && currentStep.textContent === '2') {
            logTest('Step Progress Tracking', 'PASS');
        } else {
            logTest('Step Progress Tracking', 'FAIL', 'Step counter not updated correctly');
        }

    } catch (error) {
        logTest('Project Setup Wizard', 'FAIL', error.message);
    }
}

// Test Suite 2: Component Selection and Configuration
async function testComponentSelection() {
    console.log('\n=== Testing Component Selection ===');

    try {
        // Navigate to components view
        if (!await clickElement('#componentsBtn')) return;
        await sleep(TEST_CONFIG.delays.navigation);

        // Check if components loaded
        const componentList = document.querySelector('#componentList');
        if (!componentList) {
            logTest('Component List', 'FAIL', 'Component list not found');
            return;
        }

        const componentItems = componentList.querySelectorAll('.component-item');
        if (componentItems.length === 0) {
            logTest('Component List Population', 'FAIL', 'No components found');
            return;
        } else {
            logTest('Component List Population', 'PASS', `Found ${componentItems.length} components`);
        }

        // Test individual component selection
        const componentsToTest = ['prtg', 'capital', 'support', 'onboarding'];

        for (const componentType of componentsToTest) {
            const componentElement = document.querySelector(`[data-component="${componentType}"]`);
            if (!componentElement) {
                logTest(`Component ${componentType} Selection`, 'FAIL', 'Component not found');
                continue;
            }

            componentElement.click();
            await sleep(TEST_CONFIG.delays.medium);

            // Check if component configuration loaded
            const configArea = document.querySelector('#componentConfigArea');
            if (!configArea || configArea.innerHTML.trim() === '') {
                logTest(`Component ${componentType} Configuration`, 'FAIL', 'Configuration not loaded');
            } else {
                logTest(`Component ${componentType} Configuration`, 'PASS');

                // Test form interaction
                const inputs = configArea.querySelectorAll('input, select');
                let interactionSuccess = false;

                for (const input of inputs) {
                    try {
                        if (input.type === 'number') {
                            input.value = '10';
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            interactionSuccess = true;
                            break;
                        } else if (input.type === 'text') {
                            input.value = 'Test Value';
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            interactionSuccess = true;
                            break;
                        } else if (input.tagName === 'SELECT') {
                            if (input.options.length > 1) {
                                input.selectedIndex = 1;
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                                interactionSuccess = true;
                                break;
                            }
                        }
                    } catch (error) {
                        // Continue to next input
                    }
                }

                if (interactionSuccess) {
                    logTest(`Component ${componentType} Form Interaction`, 'PASS');

                    // Check for calculation results
                    await sleep(TEST_CONFIG.delays.medium);
                    const results = configArea.querySelector('#componentResults, .pricing-result, .result-summary');
                    if (results) {
                        logTest(`Component ${componentType} Calculations`, 'PASS');
                    } else {
                        logTest(`Component ${componentType} Calculations`, 'WARN', 'No calculation results visible');
                    }
                } else {
                    logTest(`Component ${componentType} Form Interaction`, 'WARN', 'No interactable inputs found');
                }
            }
        }

    } catch (error) {
        logTest('Component Selection', 'FAIL', error.message);
    }
}

// Test Suite 3: Quote Generation and Export
async function testQuoteGeneration() {
    console.log('\n=== Testing Quote Generation ===');

    try {
        // Navigate to wizard final step
        if (!await clickElement('#wizardBtn')) return;
        await sleep(TEST_CONFIG.delays.navigation);

        // Skip to final step by setting step directly
        if (window.quoteWizard) {
            window.quoteWizard.currentStep = 18; // Review step
            window.quoteWizard.renderStep(18);
            await sleep(TEST_CONFIG.delays.medium);

            // Check if review step loaded
            const reviewContent = document.querySelector('#wizardContent');
            if (reviewContent && reviewContent.innerHTML.includes('Quote Summary')) {
                logTest('Quote Review Step', 'PASS');

                // Test save quote functionality
                const saveBtn = document.querySelector('#saveQuote');
                if (saveBtn) {
                    saveBtn.click();
                    await sleep(TEST_CONFIG.delays.medium);
                    logTest('Save Quote Button', 'PASS');
                } else {
                    logTest('Save Quote Button', 'FAIL', 'Save button not found');
                }

                // Test export functionality
                const exportBtn = document.querySelector('#exportQuote');
                if (exportBtn) {
                    exportBtn.click();
                    await sleep(TEST_CONFIG.delays.medium);
                    logTest('Export Quote Button', 'PASS');
                } else {
                    logTest('Export Quote Button', 'FAIL', 'Export button not found');
                }

            } else {
                logTest('Quote Review Step', 'FAIL', 'Review content not loaded');
            }
        } else {
            logTest('Quote Wizard Instance', 'FAIL', 'Wizard instance not available');
        }

    } catch (error) {
        logTest('Quote Generation', 'FAIL', error.message);
    }
}

// Test Suite 4: Data Persistence and Management
async function testDataPersistence() {
    console.log('\n=== Testing Data Persistence ===');

    try {
        // Test localStorage functionality
        if (typeof Storage !== "undefined") {
            localStorage.setItem('naas_test', 'test_value');
            const retrieved = localStorage.getItem('naas_test');
            if (retrieved === 'test_value') {
                logTest('LocalStorage Access', 'PASS');
                localStorage.removeItem('naas_test');
            } else {
                logTest('LocalStorage Access', 'FAIL', 'Could not retrieve stored value');
            }
        } else {
            logTest('LocalStorage Access', 'FAIL', 'localStorage not available');
        }

        // Test data store functionality
        if (window.quoteDataStore) {
            // Test project data persistence
            window.quoteDataStore.updateProject({ projectName: 'Test Project' });
            const retrievedProject = window.quoteDataStore.getProject();
            if (retrievedProject.projectName === 'Test Project') {
                logTest('DataStore Project Persistence', 'PASS');
            } else {
                logTest('DataStore Project Persistence', 'FAIL', 'Project data not persisted');
            }

            // Test component data persistence
            window.quoteDataStore.setComponentEnabled('prtg', true);
            window.quoteDataStore.updateComponentParams('prtg', { sensors: 100 });
            const retrievedComponent = window.quoteDataStore.getComponent('prtg');
            if (retrievedComponent.enabled && retrievedComponent.params.sensors === 100) {
                logTest('DataStore Component Persistence', 'PASS');
            } else {
                logTest('DataStore Component Persistence', 'FAIL', 'Component data not persisted');
            }

        } else {
            logTest('DataStore Availability', 'FAIL', 'DataStore not available');
        }

    } catch (error) {
        logTest('Data Persistence', 'FAIL', error.message);
    }
}

// Test Suite 5: Import/Export Functionality
async function testImportExport() {
    console.log('\n=== Testing Import/Export ===');

    try {
        // Test import modal
        if (!await clickElement('#importBtn')) {
            logTest('Import Modal Opening', 'FAIL', 'Could not open import modal');
        } else {
            await sleep(TEST_CONFIG.delays.medium);
            const modal = document.querySelector('#importModal');
            if (modal && !modal.classList.contains('hidden')) {
                logTest('Import Modal Opening', 'PASS');

                // Close modal
                await clickElement('#cancelImport');
            } else {
                logTest('Import Modal Opening', 'FAIL', 'Modal not visible');
            }
        }

        // Test export modal
        if (!await clickElement('#exportBtn')) {
            logTest('Export Modal Opening', 'FAIL', 'Could not open export modal');
        } else {
            await sleep(TEST_CONFIG.delays.medium);
            const modal = document.querySelector('#exportModal');
            if (modal && !modal.classList.contains('hidden')) {
                logTest('Export Modal Opening', 'PASS');

                // Test export options
                const exportType = document.querySelector('#exportType');
                if (exportType) {
                    exportType.value = 'pdf';
                    exportType.dispatchEvent(new Event('change'));
                    logTest('Export Type Selection', 'PASS');
                } else {
                    logTest('Export Type Selection', 'FAIL', 'Export type selector not found');
                }

                // Close modal
                await clickElement('#cancelExport');
            } else {
                logTest('Export Modal Opening', 'FAIL', 'Modal not visible');
            }
        }

    } catch (error) {
        logTest('Import/Export', 'FAIL', error.message);
    }
}

// Test Suite 6: Calculation Accuracy
async function testCalculationAccuracy() {
    console.log('\n=== Testing Calculation Accuracy ===');

    try {
        if (!window.NaaSCalculator) {
            logTest('Calculator Availability', 'FAIL', 'Calculator class not available');
            return;
        }

        const calculator = new NaaSCalculator();

        // Test PRTG calculation
        const prtgResult = calculator.calculatePRTG({
            sensors: 100,
            locations: 5,
            serviceLevel: 'enhanced'
        });

        if (prtgResult && prtgResult.totals && typeof prtgResult.totals.monthly === 'number') {
            logTest('PRTG Calculation', 'PASS', `Monthly: £${prtgResult.totals.monthly}`);
        } else {
            logTest('PRTG Calculation', 'FAIL', 'Invalid calculation result');
        }

        // Test Support calculation
        const supportResult = calculator.calculateSupport({
            level: 'enhanced',
            deviceCount: 10
        });

        if (supportResult && supportResult.totals && typeof supportResult.totals.monthly === 'number') {
            logTest('Support Calculation', 'PASS', `Monthly: £${supportResult.totals.monthly}`);
        } else {
            logTest('Support Calculation', 'FAIL', 'Invalid calculation result');
        }

        // Test Capital calculation
        const capitalResult = calculator.calculateCapital({
            equipment: [
                { type: 'router_medium', quantity: 2 }
            ],
            financing: true,
            termMonths: 36
        });

        if (capitalResult && capitalResult.totals && typeof capitalResult.totals.monthly === 'number') {
            logTest('Capital Calculation', 'PASS', `Monthly: £${capitalResult.totals.monthly}`);
        } else {
            logTest('Capital Calculation', 'FAIL', 'Invalid calculation result');
        }

    } catch (error) {
        logTest('Calculation Accuracy', 'FAIL', error.message);
    }
}

// Test Suite 7: UI Responsiveness and Error Handling
async function testUIResponsiveness() {
    console.log('\n=== Testing UI Responsiveness ===');

    try {
        // Test navigation responsiveness
        const views = ['dashboard', 'components', 'wizard', 'history'];
        for (const view of views) {
            const btn = document.querySelector(`#${view}Btn`);
            if (btn) {
                btn.click();
                await sleep(TEST_CONFIG.delays.medium);

                const viewElement = document.querySelector(`#${view}View`);
                if (viewElement && !viewElement.classList.contains('hidden')) {
                    logTest(`${view} View Navigation`, 'PASS');
                } else {
                    logTest(`${view} View Navigation`, 'FAIL', 'View not visible after navigation');
                }
            } else {
                logTest(`${view} View Navigation`, 'FAIL', 'Navigation button not found');
            }
        }

        // Test error handling with invalid inputs
        if (await clickElement('#componentsBtn')) {
            await sleep(TEST_CONFIG.delays.medium);

            // Select PRTG component
            const prtgComponent = document.querySelector('[data-component="prtg"]');
            if (prtgComponent) {
                prtgComponent.click();
                await sleep(TEST_CONFIG.delays.medium);

                // Try invalid input values
                const sensorInput = document.querySelector('[name="sensors"], input[type="number"]');
                if (sensorInput) {
                    sensorInput.value = '-100'; // Invalid negative value
                    sensorInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await sleep(TEST_CONFIG.delays.medium);

                    // Check if error handling occurred
                    const errorMessages = document.querySelectorAll('.error-message, .text-red-500, .text-red-600');
                    if (errorMessages.length > 0) {
                        logTest('Input Validation Error Handling', 'PASS');
                    } else {
                        logTest('Input Validation Error Handling', 'WARN', 'No visible error messages for invalid input');
                    }
                }
            }
        }

    } catch (error) {
        logTest('UI Responsiveness', 'FAIL', error.message);
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Comprehensive NaaS Calculator Testing...\n');

    const startTime = Date.now();

    await testProjectSetupWizard();
    await sleep(TEST_CONFIG.delays.medium);

    await testComponentSelection();
    await sleep(TEST_CONFIG.delays.medium);

    await testQuoteGeneration();
    await sleep(TEST_CONFIG.delays.medium);

    await testDataPersistence();
    await sleep(TEST_CONFIG.delays.medium);

    await testImportExport();
    await sleep(TEST_CONFIG.delays.medium);

    await testCalculationAccuracy();
    await sleep(TEST_CONFIG.delays.medium);

    await testUIResponsiveness();

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Generate comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`⏱️  Total Time: ${duration.toFixed(2)} seconds`);
    console.log(`📋 Tests Run: ${testResults.totalTests}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
    console.log(`🎯 Success Rate: ${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%`);

    if (testResults.bugs.length > 0) {
        console.log('\n🐛 BUGS IDENTIFIED:');
        testResults.bugs.forEach((bug, index) => {
            console.log(`${index + 1}. ${bug.test}: ${bug.message}`);
        });
    }

    if (testResults.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        testResults.warnings.forEach((warning, index) => {
            console.log(`${index + 1}. ${warning.test}: ${warning.message}`);
        });
    }

    console.log('\n🏁 Testing Complete!');

    return testResults;
}

// Auto-run when script is loaded
if (typeof window !== 'undefined') {
    // Browser environment
    window.runNaaSTests = runAllTests;

    // Auto-run after page load
    if (document.readyState === 'complete') {
        setTimeout(runAllTests, 2000);
    } else {
        window.addEventListener('load', () => {
            setTimeout(runAllTests, 2000);
        });
    }
} else {
    // Node environment
    module.exports = { runAllTests, testResults };
}