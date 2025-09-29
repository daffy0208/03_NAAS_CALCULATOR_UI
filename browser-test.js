/**
 * Simple Browser-Based Testing for NaaS Calculator
 * Run this in the browser console to identify bugs
 */

console.log('🔧 NaaS Calculator - Browser Testing Started');

// Test 1: Check if core classes are available
function testCoreClassesLoaded() {
    const tests = [
        { name: 'NaaSCalculator', class: window.NaaSCalculator },
        { name: 'QuoteDataStore', class: window.QuoteDataStore },
        { name: 'ComponentManager', class: window.ComponentManager },
        { name: 'QuoteWizard', class: window.QuoteWizard },
        { name: 'ImportExportManager', class: window.ImportExportManager }
    ];

    console.log('\n📦 Testing Core Classes:');
    tests.forEach(test => {
        if (test.class) {
            console.log(`✅ ${test.name} - Available`);
        } else {
            console.log(`❌ ${test.name} - Missing`);
        }
    });
}

// Test 2: Check if instances are created correctly
function testInstancesCreated() {
    console.log('\n🏗️ Testing Instance Creation:');

    const instances = [
        { name: 'app', instance: window.app },
        { name: 'componentManager', instance: window.componentManager },
        { name: 'quoteWizard', instance: window.quoteWizard },
        { name: 'importExportManager', instance: window.importExportManager },
        { name: 'quoteDataStore', instance: window.quoteDataStore }
    ];

    instances.forEach(test => {
        if (test.instance) {
            console.log(`✅ ${test.name} - Instance created`);
        } else {
            console.log(`❌ ${test.name} - Instance missing`);
        }
    });
}

// Test 3: Test basic wizard functionality
function testWizardBasics() {
    console.log('\n🧙 Testing Wizard Basics:');

    try {
        if (window.quoteWizard) {
            // Test wizard data initialization
            if (window.quoteWizard.wizardData) {
                console.log('✅ Wizard data initialized');
            } else {
                console.log('❌ Wizard data not initialized');
            }

            // Test dataStore connection
            if (window.quoteWizard.dataStore) {
                console.log('✅ Wizard dataStore connected');
            } else {
                console.log('❌ Wizard dataStore not connected');
            }

            // Test calculator connection
            if (window.quoteWizard.calculator) {
                console.log('✅ Wizard calculator connected');
            } else {
                console.log('❌ Wizard calculator not connected');
            }
        } else {
            console.log('❌ QuoteWizard not available for testing');
        }
    } catch (error) {
        console.log('❌ Error testing wizard:', error.message);
    }
}

// Test 4: Test component manager basics
function testComponentManagerBasics() {
    console.log('\n🧩 Testing Component Manager Basics:');

    try {
        if (window.componentManager) {
            // Test components data
            if (window.componentManager.components) {
                const componentCount = Object.keys(window.componentManager.components).length;
                console.log(`✅ Components loaded: ${componentCount} components`);
            } else {
                console.log('❌ Components not loaded');
            }

            // Test dataStore connection
            if (window.componentManager.dataStore) {
                console.log('✅ ComponentManager dataStore connected');
            } else {
                console.log('❌ ComponentManager dataStore not connected');
            }

            // Test calculator connection
            if (window.componentManager.calculator) {
                console.log('✅ ComponentManager calculator connected');
            } else {
                console.log('❌ ComponentManager calculator not connected');
            }
        } else {
            console.log('❌ ComponentManager not available for testing');
        }
    } catch (error) {
        console.log('❌ Error testing component manager:', error.message);
    }
}

// Test 5: Test dataStore functionality
function testDataStoreFunctionality() {
    console.log('\n💾 Testing DataStore Functionality:');

    try {
        if (window.quoteDataStore) {
            // Test project data
            const project = window.quoteDataStore.getProject();
            console.log('✅ Can get project data:', project ? 'Yes' : 'No');

            // Test component data
            const components = window.quoteDataStore.getAllComponents();
            console.log('✅ Can get components data:', components ? 'Yes' : 'No');

            // Test setting data
            window.quoteDataStore.updateProject({ projectName: 'Test Project' });
            const updatedProject = window.quoteDataStore.getProject();
            if (updatedProject.projectName === 'Test Project') {
                console.log('✅ Project data can be updated');
            } else {
                console.log('❌ Project data update failed');
            }

            // Test component enabling
            window.quoteDataStore.setComponentEnabled('prtg', true);
            const prtgComponent = window.quoteDataStore.getComponent('prtg');
            if (prtgComponent.enabled) {
                console.log('✅ Component enabling works');
            } else {
                console.log('❌ Component enabling failed');
            }
        } else {
            console.log('❌ DataStore not available for testing');
        }
    } catch (error) {
        console.log('❌ Error testing dataStore:', error.message);
    }
}

// Test 6: Test calculations
function testCalculations() {
    console.log('\n🔢 Testing Calculations:');

    try {
        if (window.app && window.app.calculator) {
            const calculator = window.app.calculator;

            // Test PRTG calculation
            const prtgResult = calculator.calculatePRTG({
                sensors: 100,
                locations: 5,
                serviceLevel: 'enhanced'
            });

            if (prtgResult && prtgResult.totals && typeof prtgResult.totals.monthly === 'number') {
                console.log(`✅ PRTG calculation works: £${prtgResult.totals.monthly}/month`);
            } else {
                console.log('❌ PRTG calculation failed');
            }

            // Test Support calculation
            const supportResult = calculator.calculateSupport({
                level: 'enhanced',
                deviceCount: 10
            });

            if (supportResult && supportResult.totals && typeof supportResult.totals.monthly === 'number') {
                console.log(`✅ Support calculation works: £${supportResult.totals.monthly}/month`);
            } else {
                console.log('❌ Support calculation failed');
            }

        } else {
            console.log('❌ Calculator not available for testing');
        }
    } catch (error) {
        console.log('❌ Error testing calculations:', error.message);
    }
}

// Test 7: Test navigation
function testNavigation() {
    console.log('\n🧭 Testing Navigation:');

    try {
        const navButtons = ['dashboardBtn', 'componentsBtn', 'wizardBtn', 'historyBtn'];
        const views = ['dashboardView', 'componentsView', 'wizardView', 'historyView'];

        navButtons.forEach((btnId, index) => {
            const btn = document.getElementById(btnId);
            const view = document.getElementById(views[index]);

            if (btn && view) {
                console.log(`✅ ${btnId} and ${views[index]} elements exist`);
            } else {
                console.log(`❌ Missing ${btnId} or ${views[index]}`);
            }
        });
    } catch (error) {
        console.log('❌ Error testing navigation:', error.message);
    }
}

// Test 8: Test component list population
function testComponentListPopulation() {
    console.log('\n📋 Testing Component List Population:');

    try {
        const componentList = document.getElementById('componentList');
        if (componentList) {
            const componentItems = componentList.querySelectorAll('.component-item');
            if (componentItems.length > 0) {
                console.log(`✅ Component list populated with ${componentItems.length} items`);

                // Test first component click
                const firstComponent = componentItems[0];
                const componentType = firstComponent.dataset.component;
                if (componentType) {
                    console.log(`✅ First component has type: ${componentType}`);
                } else {
                    console.log('❌ First component missing data-component attribute');
                }
            } else {
                console.log('❌ Component list is empty');
            }
        } else {
            console.log('❌ Component list element not found');
        }
    } catch (error) {
        console.log('❌ Error testing component list:', error.message);
    }
}

// Test 9: Test modals
function testModals() {
    console.log('\n🪟 Testing Modals:');

    try {
        const modals = ['importModal', 'exportModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                console.log(`✅ ${modalId} element exists`);

                // Test show/hide functionality
                modal.classList.add('show');
                if (modal.classList.contains('show')) {
                    console.log(`✅ ${modalId} can be shown`);
                    modal.classList.remove('show');
                    if (!modal.classList.contains('show')) {
                        console.log(`✅ ${modalId} can be hidden`);
                    } else {
                        console.log(`❌ ${modalId} cannot be hidden`);
                    }
                } else {
                    console.log(`❌ ${modalId} cannot be shown`);
                }
            } else {
                console.log(`❌ ${modalId} element not found`);
            }
        });
    } catch (error) {
        console.log('❌ Error testing modals:', error.message);
    }
}

// Main test runner
function runAllBrowserTests() {
    console.log('🚀 Starting Browser-Based Testing...\n');

    testCoreClassesLoaded();
    testInstancesCreated();
    testWizardBasics();
    testComponentManagerBasics();
    testDataStoreFunctionality();
    testCalculations();
    testNavigation();
    testComponentListPopulation();
    testModals();

    console.log('\n🏁 Browser Testing Complete!');
    console.log('📝 Check the console output above for any ❌ issues that need fixing.');
}

// Auto-run tests after a delay to allow page to fully load
setTimeout(() => {
    runAllBrowserTests();
}, 3000);

// Also expose the function for manual running
window.runNaaSBrowserTests = runAllBrowserTests;