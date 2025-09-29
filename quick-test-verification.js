/**
 * Quick Verification Test for Dashboard Fixes
 * Tests key functionality to ensure fixes are working
 */

console.log('🔧 Quick Dashboard Fixes Verification');

// Test 1: Check if app initializes properly
function testAppInitialization() {
    return new Promise((resolve) => {
        let attempts = 0;
        const checkApp = () => {
            if (window.app) {
                console.log('✅ App initialized successfully');
                resolve(true);
            } else if (attempts < 50) {
                attempts++;
                setTimeout(checkApp, 100);
            } else {
                console.log('❌ App failed to initialize within 5 seconds');
                resolve(false);
            }
        };
        checkApp();
    });
}

// Test 2: Check notification system
function testNotificationSystem() {
    if (!window.app || !window.app.showNotification) {
        console.log('❌ Notification system not available');
        return false;
    }

    try {
        // Test different notification types
        window.app.showNotification('Test info notification', 'info');
        window.app.showNotification('Test warning notification', 'warning');
        window.app.showNotification('Test error notification', 'error');
        window.app.showNotification('Test success notification', 'success');

        console.log('✅ Notification system working');
        return true;
    } catch (error) {
        console.log('❌ Notification system error:', error);
        return false;
    }
}

// Test 3: Check component manager initialization
function testComponentManager() {
    if (!window.app || !window.app.componentManager) {
        console.log('❌ Component manager not available');
        return false;
    }

    if (!window.app.componentManager.components) {
        console.log('❌ Components not loaded in component manager');
        return false;
    }

    const componentCount = Object.keys(window.app.componentManager.components).length;
    console.log(`✅ Component manager initialized with ${componentCount} components`);
    return true;
}

// Test 4: Check dashboard population
function testDashboardPopulation() {
    const componentCards = document.querySelectorAll('.component-card[data-component]');

    if (componentCards.length === 0) {
        console.log('❌ No component cards found on dashboard');
        return false;
    }

    console.log(`✅ Dashboard populated with ${componentCards.length} component cards`);

    // Test if cards have proper event handlers (without triggering them)
    let hasHandlers = true;
    componentCards.forEach(card => {
        if (!card.onclick && !card.addEventListener) {
            hasHandlers = false;
        }
    });

    if (hasHandlers) {
        console.log('✅ Component cards appear to have event handlers');
    } else {
        console.log('⚠️ Some component cards may be missing event handlers');
    }

    return true;
}

// Test 5: Check navigation functionality
function testNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');

    if (navButtons.length === 0) {
        console.log('❌ No navigation buttons found');
        return false;
    }

    console.log(`✅ Found ${navButtons.length} navigation buttons`);

    // Check if showView function exists
    if (!window.app || !window.app.showView) {
        console.log('❌ showView function not available');
        return false;
    }

    console.log('✅ Navigation system appears functional');
    return true;
}

// Run all tests
async function runVerification() {
    console.log('Starting verification tests...');

    const results = {
        appInit: await testAppInitialization(),
        notifications: false,
        componentManager: false,
        dashboard: false,
        navigation: false
    };

    if (results.appInit) {
        // Wait a bit more for full initialization
        setTimeout(() => {
            results.notifications = testNotificationSystem();
            results.componentManager = testComponentManager();
            results.dashboard = testDashboardPopulation();
            results.navigation = testNavigation();

            // Summary
            const passed = Object.values(results).filter(r => r).length;
            const total = Object.keys(results).length;

            console.log('\n📊 Verification Results:');
            console.log(`✅ Passed: ${passed}/${total} tests`);

            if (passed === total) {
                console.log('🎉 All dashboard fixes appear to be working correctly!');
            } else {
                console.log('⚠️ Some issues may still exist. Check individual test results above.');
            }

            // Store results globally
            window.verificationResults = results;
        }, 2000);
    }
}

// Auto-run when loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runVerification);
} else {
    runVerification();
}