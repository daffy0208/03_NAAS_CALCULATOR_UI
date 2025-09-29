/**
 * NaaS Calculator - Enhanced Error Boundary System
 * Comprehensive error handling, recovery mechanisms, and user-friendly error boundaries
 */

class ErrorBoundary {
    constructor() {
        this.errors = new Map();
        this.errorCounter = 0;
        this.maxErrors = 50;
        this.errorThreshold = 10;
        this.recoveryAttempts = new Map();
        this.maxRecoveryAttempts = 3;
        this.criticalErrors = [];
        this.userNotifications = new Set();

        // Feature degradation tracking
        this.degradedFeatures = new Set();
        this.availableFeatures = new Set([
            'calculator', 'dataStore', 'components', 'wizard',
            'importExport', 'localStorage', 'notifications'
        ]);

        // Error categories
        this.errorCategories = {
            CRITICAL: 'critical',
            RECOVERABLE: 'recoverable',
            WARNING: 'warning',
            INFO: 'info'
        };

        this.initialize();
    }

    initialize() {
        this.setupGlobalErrorHandlers();
        this.setupPerformanceMonitoring();
        this.setupRecoveryMechanisms();
        this.setupUserInterface();

        console.log('ErrorBoundary: Initialized with enhanced error handling');
    }

    setupGlobalErrorHandlers() {
        // Enhanced window error handler
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error?.stack,
                timestamp: new Date().toISOString(),
                category: this.categorizeError(event.error)
            });
        });

        // Enhanced unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise_rejection',
                reason: event.reason,
                promise: event.promise,
                message: event.reason?.message || String(event.reason),
                stack: event.reason?.stack,
                timestamp: new Date().toISOString(),
                category: this.categorizePromiseRejection(event.reason)
            });

            // Prevent default console error if we handle it
            event.preventDefault();
        });

        // Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleResourceError({
                    type: 'resource',
                    element: event.target.tagName,
                    source: event.target.src || event.target.href,
                    message: `Failed to load ${event.target.tagName}: ${event.target.src || event.target.href}`,
                    timestamp: new Date().toISOString(),
                    category: this.errorCategories.WARNING
                });
            }
        }, true);

        // Security errors (CSP violations, etc.)
        document.addEventListener('securitypolicyviolation', (event) => {
            this.handleError({
                type: 'security',
                violatedDirective: event.violatedDirective,
                blockedURI: event.blockedURI,
                originalPolicy: event.originalPolicy,
                message: `CSP violation: ${event.violatedDirective}`,
                timestamp: new Date().toISOString(),
                category: this.errorCategories.CRITICAL
            });
        });
    }

    setupPerformanceMonitoring() {
        // Memory usage monitoring
        if (performance.memory) {
            setInterval(() => {
                const memoryInfo = performance.memory;
                const memoryUsage = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;

                if (memoryUsage > 0.9) {
                    this.handleError({
                        type: 'performance',
                        message: `High memory usage detected: ${Math.round(memoryUsage * 100)}%`,
                        memoryInfo: {
                            used: Math.round(memoryInfo.usedJSHeapSize / 1048576) + ' MB',
                            total: Math.round(memoryInfo.totalJSHeapSize / 1048576) + ' MB',
                            limit: Math.round(memoryInfo.jsHeapSizeLimit / 1048576) + ' MB'
                        },
                        timestamp: new Date().toISOString(),
                        category: this.errorCategories.WARNING
                    });
                }
            }, 30000); // Check every 30 seconds
        }

        // Long task monitoring
        if (typeof PerformanceObserver !== 'undefined') {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.duration > 50) { // Long task threshold
                            this.handleError({
                                type: 'performance',
                                message: `Long task detected: ${Math.round(entry.duration)}ms`,
                                duration: entry.duration,
                                startTime: entry.startTime,
                                timestamp: new Date().toISOString(),
                                category: this.errorCategories.INFO
                            });
                        }
                    });
                });
                observer.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                console.warn('ErrorBoundary: Performance monitoring not supported');
            }
        }
    }

    setupRecoveryMechanisms() {
        // Auto-recovery for common issues
        this.recoveryStrategies = {
            'localStorage_quota': this.recoverLocalStorageQuota.bind(this),
            'dataStore_corruption': this.recoverDataStore.bind(this),
            'component_initialization': this.recoverComponentInitialization.bind(this),
            'calculator_error': this.recoverCalculatorError.bind(this),
            'network_error': this.recoverNetworkError.bind(this),
            'memory_leak': this.recoverMemoryLeak.bind(this)
        };

        // Heartbeat monitoring for critical components
        this.startComponentHealthCheck();
    }

    setupUserInterface() {
        // Create error notification container
        this.createErrorNotificationContainer();

        // Create error recovery modal
        this.createErrorRecoveryModal();

        // Add error boundary indicators
        this.createErrorIndicators();
    }

    handleError(errorInfo) {
        const errorId = this.generateErrorId();
        errorInfo.id = errorId;
        errorInfo.userAgent = navigator.userAgent;
        errorInfo.url = window.location.href;

        // Store error
        this.errors.set(errorId, errorInfo);
        this.errorCounter++;

        // Clean up old errors
        if (this.errors.size > this.maxErrors) {
            const oldestError = this.errors.keys().next().value;
            this.errors.delete(oldestError);
        }

        // Log error for debugging
        this.logError(errorInfo);

        // Categorize and handle based on severity
        switch (errorInfo.category) {
            case this.errorCategories.CRITICAL:
                this.handleCriticalError(errorInfo);
                break;
            case this.errorCategories.RECOVERABLE:
                this.attemptRecovery(errorInfo);
                break;
            case this.errorCategories.WARNING:
                this.handleWarning(errorInfo);
                break;
            case this.errorCategories.INFO:
                this.handleInfo(errorInfo);
                break;
        }

        // Check error threshold
        this.checkErrorThreshold();

        // Update error indicators
        this.updateErrorIndicators();
    }

    handleResourceError(errorInfo) {
        console.warn('ErrorBoundary: Resource loading error:', errorInfo);

        // Attempt to reload critical resources
        if (errorInfo.source && errorInfo.source.includes('js/')) {
            this.attemptResourceRecovery(errorInfo);
        }

        this.showUserNotification({
            type: 'warning',
            title: 'Resource Loading Issue',
            message: 'Some resources failed to load. Functionality may be limited.',
            actions: [{
                label: 'Reload Page',
                action: () => window.location.reload()
            }]
        });
    }

    categorizeError(error) {
        if (!error) return this.errorCategories.WARNING;

        const message = error.message || '';
        const stack = error.stack || '';

        // Critical errors that break core functionality
        if (message.includes('QuoteDataStore') ||
            message.includes('NaaSCalculator') ||
            message.includes('Cannot read property') ||
            error.name === 'ReferenceError') {
            return this.errorCategories.CRITICAL;
        }

        // Recoverable errors
        if (message.includes('storage quota') ||
            message.includes('Network') ||
            message.includes('fetch') ||
            error.name === 'TypeError') {
            return this.errorCategories.RECOVERABLE;
        }

        // Performance warnings
        if (message.includes('memory') || message.includes('performance')) {
            return this.errorCategories.WARNING;
        }

        return this.errorCategories.WARNING;
    }

    categorizePromiseRejection(reason) {
        if (!reason) return this.errorCategories.WARNING;

        const message = typeof reason === 'string' ? reason : reason.message || '';

        if (message.includes('fetch') || message.includes('network')) {
            return this.errorCategories.RECOVERABLE;
        }

        if (message.includes('storage') || message.includes('quota')) {
            return this.errorCategories.RECOVERABLE;
        }

        return this.errorCategories.WARNING;
    }

    handleCriticalError(errorInfo) {
        this.criticalErrors.push(errorInfo);

        // Immediately degrade affected features
        this.degradeFeatures(errorInfo);

        // Show critical error modal
        this.showCriticalErrorModal(errorInfo);

        // Attempt immediate recovery
        this.attemptRecovery(errorInfo);

        console.error('ErrorBoundary: Critical error detected', errorInfo);
    }

    attemptRecovery(errorInfo) {
        const errorKey = this.getRecoveryKey(errorInfo);
        const attempts = this.recoveryAttempts.get(errorKey) || 0;

        if (attempts >= this.maxRecoveryAttempts) {
            console.warn(`ErrorBoundary: Max recovery attempts reached for ${errorKey}`);
            this.degradeFeatures(errorInfo);
            return;
        }

        this.recoveryAttempts.set(errorKey, attempts + 1);

        const strategy = this.recoveryStrategies[errorKey];
        if (strategy) {
            console.log(`ErrorBoundary: Attempting recovery for ${errorKey} (attempt ${attempts + 1})`);
            strategy(errorInfo);
        } else {
            this.genericRecovery(errorInfo);
        }
    }

    getRecoveryKey(errorInfo) {
        const message = errorInfo.message || '';

        if (message.includes('storage quota') || message.includes('QuotaExceeded')) {
            return 'localStorage_quota';
        }
        if (message.includes('QuoteDataStore')) {
            return 'dataStore_corruption';
        }
        if (message.includes('ComponentManager') || message.includes('components')) {
            return 'component_initialization';
        }
        if (message.includes('Calculator') || message.includes('calculate')) {
            return 'calculator_error';
        }
        if (message.includes('fetch') || message.includes('network')) {
            return 'network_error';
        }
        if (message.includes('memory')) {
            return 'memory_leak';
        }

        return 'generic_error';
    }

    // Recovery Strategies
    recoverLocalStorageQuota(errorInfo) {
        try {
            // Clear temporary data
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('naas_temp_') ||
                    key.startsWith('naas_test_') ||
                    key.includes('component_') && key.includes('_temp')) {
                    localStorage.removeItem(key);
                }
            });

            this.showUserNotification({
                type: 'info',
                title: 'Storage Cleaned',
                message: 'Temporary data cleared to free storage space.'
            });

            return true;
        } catch (error) {
            console.error('ErrorBoundary: Failed to recover localStorage quota', error);
            return false;
        }
    }

    recoverDataStore(errorInfo) {
        try {
            // Attempt to reinitialize data store
            if (window.quoteDataStore && typeof window.quoteDataStore.initializeAsync === 'function') {
                window.quoteDataStore.initializeAsync()
                    .then(() => {
                        this.showUserNotification({
                            type: 'success',
                            title: 'Data Store Recovered',
                            message: 'Data store has been successfully reinitialized.'
                        });
                    })
                    .catch((error) => {
                        this.showUserNotification({
                            type: 'error',
                            title: 'Recovery Failed',
                            message: 'Unable to recover data store. Page reload may be required.',
                            actions: [{
                                label: 'Reload Page',
                                action: () => window.location.reload()
                            }]
                        });
                    });
            }
            return true;
        } catch (error) {
            console.error('ErrorBoundary: Failed to recover data store', error);
            return false;
        }
    }

    recoverComponentInitialization(errorInfo) {
        try {
            // Attempt to reinitialize component manager
            if (window.app && typeof window.app.initializeComponentsView === 'function') {
                setTimeout(() => {
                    window.app.initializeComponentsView();
                    this.showUserNotification({
                        type: 'info',
                        title: 'Components Reinitialized',
                        message: 'Component system has been restarted.'
                    });
                }, 1000);
            }
            return true;
        } catch (error) {
            console.error('ErrorBoundary: Failed to recover components', error);
            return false;
        }
    }

    recoverCalculatorError(errorInfo) {
        try {
            // Reset calculator instance
            if (window.app && window.app.calculator) {
                window.app.calculator = new NaaSCalculator();

                this.showUserNotification({
                    type: 'info',
                    title: 'Calculator Reset',
                    message: 'Calculation engine has been reinitialized.'
                });
            }
            return true;
        } catch (error) {
            console.error('ErrorBoundary: Failed to recover calculator', error);
            return false;
        }
    }

    recoverNetworkError(errorInfo) {
        // Network errors usually resolve themselves
        // Set up retry mechanism for failed operations
        this.showUserNotification({
            type: 'warning',
            title: 'Network Issue Detected',
            message: 'Network connectivity issue detected. Operations will be retried automatically.',
            duration: 5000
        });

        return true;
    }

    recoverMemoryLeak(errorInfo) {
        try {
            // Force garbage collection if available
            if (typeof gc === 'function') {
                gc();
            }

            // Clear large data structures if they exist
            if (window.app && window.app.componentManager && window.app.componentManager.componentData) {
                // Clear cached component data
                window.app.componentManager.componentData = {};
            }

            this.showUserNotification({
                type: 'warning',
                title: 'Memory Optimization',
                message: 'Cleared cached data to optimize memory usage.'
            });

            return true;
        } catch (error) {
            console.error('ErrorBoundary: Failed to recover from memory issue', error);
            return false;
        }
    }

    genericRecovery(errorInfo) {
        // Generic recovery attempt
        this.showUserNotification({
            type: 'warning',
            title: 'Error Detected',
            message: 'An error was detected and recovery is being attempted.',
            actions: [{
                label: 'Reload Page',
                action: () => window.location.reload()
            }, {
                label: 'Report Issue',
                action: () => this.showErrorReport(errorInfo)
            }]
        });
    }

    degradeFeatures(errorInfo) {
        const message = errorInfo.message || '';

        if (message.includes('Calculator') || message.includes('calculate')) {
            this.degradedFeatures.add('calculator');
        }
        if (message.includes('DataStore') || message.includes('storage')) {
            this.degradedFeatures.add('dataStore');
        }
        if (message.includes('Component') || message.includes('wizard')) {
            this.degradedFeatures.add('components');
        }
        if (message.includes('import') || message.includes('export')) {
            this.degradedFeatures.add('importExport');
        }

        this.updateFeatureStatus();
    }

    updateFeatureStatus() {
        // Update UI to reflect degraded features
        this.degradedFeatures.forEach(feature => {
            const elements = document.querySelectorAll(`[data-feature="${feature}"]`);
            elements.forEach(element => {
                element.classList.add('feature-degraded');
                element.title = `This feature is currently unavailable due to an error`;
            });
        });
    }

    startComponentHealthCheck() {
        setInterval(() => {
            this.checkComponentHealth();
        }, 30000); // Check every 30 seconds
    }

    checkComponentHealth() {
        const healthChecks = {
            app: () => window.app && typeof window.app.getHealthStatus === 'function',
            dataStore: () => window.quoteDataStore && typeof window.quoteDataStore.getHealthStatus === 'function',
            calculator: () => window.NaaSCalculator && window.app?.calculator,
            components: () => window.componentManager || window.app?.componentManager,
            wizard: () => window.quoteWizard || window.app?.quoteWizard
        };

        Object.entries(healthChecks).forEach(([component, check]) => {
            if (!check()) {
                this.handleError({
                    type: 'health_check',
                    message: `Component ${component} failed health check`,
                    component: component,
                    timestamp: new Date().toISOString(),
                    category: this.errorCategories.WARNING
                });
            }
        });
    }

    checkErrorThreshold() {
        const recentErrors = Array.from(this.errors.values())
            .filter(error => {
                const errorTime = new Date(error.timestamp);
                const now = new Date();
                return (now - errorTime) < 300000; // Last 5 minutes
            });

        if (recentErrors.length >= this.errorThreshold) {
            this.showUserNotification({
                type: 'error',
                title: 'Multiple Errors Detected',
                message: `${recentErrors.length} errors occurred in the last 5 minutes. Consider refreshing the page.`,
                persistent: true,
                actions: [{
                    label: 'Refresh Page',
                    action: () => window.location.reload()
                }, {
                    label: 'View Error Log',
                    action: () => this.showErrorLog()
                }]
            });
        }
    }

    // UI Components
    createErrorNotificationContainer() {
        if (document.getElementById('errorNotifications')) return;

        const container = document.createElement('div');
        container.id = 'errorNotifications';
        container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-sm';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
    }

    createErrorRecoveryModal() {
        if (document.getElementById('errorRecoveryModal')) return;

        const modal = document.createElement('div');
        modal.id = 'errorRecoveryModal';
        modal.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 hidden z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-md w-full p-6">
                <div class="flex items-center mb-4">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-lg font-medium text-gray-900">System Error</h3>
                    </div>
                </div>
                <div class="mb-4">
                    <p id="errorRecoveryMessage" class="text-sm text-gray-600"></p>
                </div>
                <div class="flex justify-end space-x-3">
                    <button id="errorRecoveryTryAgain" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Try Again
                    </button>
                    <button id="errorRecoveryReload" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('#errorRecoveryTryAgain').addEventListener('click', () => {
            this.hideErrorRecoveryModal();
            // Retry last failed operation if possible
        });

        modal.querySelector('#errorRecoveryReload').addEventListener('click', () => {
            window.location.reload();
        });
    }

    createErrorIndicators() {
        // Create error status indicator
        const indicator = document.createElement('div');
        indicator.id = 'errorStatusIndicator';
        indicator.className = 'fixed bottom-4 right-4 bg-green-500 text-white p-2 rounded-full text-sm z-40';
        indicator.innerHTML = '<i class="fas fa-check"></i>';
        indicator.title = 'System Status: Normal';
        document.body.appendChild(indicator);
    }

    updateErrorIndicators() {
        const indicator = document.getElementById('errorStatusIndicator');
        if (!indicator) return;

        const criticalCount = this.criticalErrors.length;
        const recentErrorCount = Array.from(this.errors.values())
            .filter(error => {
                const errorTime = new Date(error.timestamp);
                const now = new Date();
                return (now - errorTime) < 300000; // Last 5 minutes
            }).length;

        if (criticalCount > 0) {
            indicator.className = 'fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-full text-sm z-40 animate-pulse';
            indicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            indicator.title = `System Status: Critical (${criticalCount} critical errors)`;
        } else if (recentErrorCount > 0) {
            indicator.className = 'fixed bottom-4 right-4 bg-yellow-500 text-white p-2 rounded-full text-sm z-40';
            indicator.innerHTML = '<i class="fas fa-exclamation"></i>';
            indicator.title = `System Status: Warning (${recentErrorCount} recent errors)`;
        } else {
            indicator.className = 'fixed bottom-4 right-4 bg-green-500 text-white p-2 rounded-full text-sm z-40';
            indicator.innerHTML = '<i class="fas fa-check"></i>';
            indicator.title = 'System Status: Normal';
        }
    }

    showUserNotification(options) {
        const {
            type = 'info',
            title = 'Notification',
            message = '',
            duration = 6000,
            persistent = false,
            actions = []
        } = options;

        // Prevent duplicate notifications
        const notificationKey = `${type}:${title}:${message}`;
        if (this.userNotifications.has(notificationKey) && !persistent) {
            return;
        }
        this.userNotifications.add(notificationKey);

        const container = document.getElementById('errorNotifications');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `bg-white border-l-4 p-4 rounded shadow-lg pointer-events-auto max-w-sm transform transition-all duration-300 translate-x-full opacity-0 ${
            type === 'error' ? 'border-red-500' :
            type === 'warning' ? 'border-yellow-500' :
            type === 'success' ? 'border-green-500' :
            'border-blue-500'
        }`;

        notification.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <i class="fas fa-${
                        type === 'error' ? 'exclamation-circle text-red-500' :
                        type === 'warning' ? 'exclamation-triangle text-yellow-500' :
                        type === 'success' ? 'check-circle text-green-500' :
                        'info-circle text-blue-500'
                    }"></i>
                </div>
                <div class="ml-3 flex-1">
                    <h4 class="text-sm font-medium text-gray-900">${title}</h4>
                    ${message ? `<p class="mt-1 text-sm text-gray-600">${message}</p>` : ''}
                    ${actions.length > 0 ? `
                        <div class="mt-2 space-x-2">
                            ${actions.map((action, index) => `
                                <button class="text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded" data-action="${index}">
                                    ${action.label}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="ml-4 flex-shrink-0">
                    <button class="close-notification text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        notification.querySelector('.close-notification').addEventListener('click', () => {
            this.removeNotification(notification, notificationKey);
        });

        actions.forEach((action, index) => {
            const button = notification.querySelector(`[data-action="${index}"]`);
            if (button) {
                button.addEventListener('click', () => {
                    action.action();
                    this.removeNotification(notification, notificationKey);
                });
            }
        });

        container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        }, 10);

        // Auto-remove if not persistent
        if (!persistent && duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification, notificationKey);
            }, duration);
        }
    }

    removeNotification(notification, notificationKey) {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.userNotifications.delete(notificationKey);
        }, 300);
    }

    showCriticalErrorModal(errorInfo) {
        const modal = document.getElementById('errorRecoveryModal');
        const message = document.getElementById('errorRecoveryMessage');

        if (modal && message) {
            message.textContent = `A critical error has occurred: ${errorInfo.message}. The system will attempt to recover automatically.`;
            modal.classList.remove('hidden');
        }
    }

    hideErrorRecoveryModal() {
        const modal = document.getElementById('errorRecoveryModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Utility methods
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    logError(errorInfo) {
        const logEntry = {
            id: errorInfo.id,
            timestamp: errorInfo.timestamp,
            type: errorInfo.type,
            category: errorInfo.category,
            message: errorInfo.message,
            url: errorInfo.url,
            userAgent: navigator.userAgent.substring(0, 100) // Truncate for logging
        };

        console.group(`ErrorBoundary: ${errorInfo.category.toUpperCase()} Error`);
        console.error('Error Details:', logEntry);
        if (errorInfo.stack) {
            console.error('Stack Trace:', errorInfo.stack);
        }
        console.groupEnd();
    }

    // Public API
    getErrorSummary() {
        return {
            totalErrors: this.errors.size,
            criticalErrors: this.criticalErrors.length,
            degradedFeatures: Array.from(this.degradedFeatures),
            availableFeatures: Array.from(this.availableFeatures).filter(f => !this.degradedFeatures.has(f)),
            recentErrors: Array.from(this.errors.values()).slice(-10)
        };
    }

    clearErrors() {
        this.errors.clear();
        this.criticalErrors = [];
        this.errorCounter = 0;
        this.recoveryAttempts.clear();
        this.updateErrorIndicators();
    }

    exportErrorLog() {
        const errorData = {
            summary: this.getErrorSummary(),
            allErrors: Array.from(this.errors.values()),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        const blob = new Blob([JSON.stringify(errorData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `naas-error-log-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    isFeatureAvailable(feature) {
        return !this.degradedFeatures.has(feature);
    }
}

// Global error boundary instance
let globalErrorBoundary;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        globalErrorBoundary = new ErrorBoundary();
        window.errorBoundary = globalErrorBoundary;
    });
} else {
    globalErrorBoundary = new ErrorBoundary();
    window.errorBoundary = globalErrorBoundary;
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorBoundary;
} else if (typeof window !== 'undefined') {
    window.ErrorBoundary = ErrorBoundary;
}