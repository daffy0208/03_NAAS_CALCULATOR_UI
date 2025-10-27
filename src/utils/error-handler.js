/**
 * Comprehensive Error Handling System
 * Provides centralized error handling, logging, and user notification
 */

export class ErrorHandler {
  static errors = new Map();
  static listeners = new Set();

  /**
   * Initialize error handling system
   */
  static init() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: 'promise',
        promise: event.promise
      });
    });
  }

  /**
   * Handle different types of errors
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Additional context information
   */
  static handleError(error, context = {}) {
    const errorInfo = this.createErrorInfo(error, context);

    // Log error
    this.logError(errorInfo);

    // Store error for debugging
    this.storeError(errorInfo);

    // Notify user if appropriate
    if (this.shouldNotifyUser(errorInfo)) {
      this.notifyUser(errorInfo);
    }

    // Notify listeners
    this.notifyListeners(errorInfo);
  }

  /**
   * Create standardized error information object
   * @param {Error|string} error - Error
   * @param {Object} context - Context
   * @returns {Object}
   */
  static createErrorInfo(error, context) {
    const timestamp = new Date().toISOString();
    const errorId = this.generateErrorId();

    if (error instanceof Error) {
      return {
        id: errorId,
        timestamp,
        message: error.message,
        name: error.name,
        stack: error.stack,
        context,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
    }

    return {
      id: errorId,
      timestamp,
      message: String(error),
      name: 'Unknown',
      stack: null,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  /**
   * Log error to console with formatted output
   * @param {Object} errorInfo - Error information
   */
  static logError(errorInfo) {
    const { id, timestamp, message, name, context, stack } = errorInfo;

    console.group(`🚨 Error ${id} - ${timestamp}`);
    console.error(`${name}: ${message}`);

    if (context && Object.keys(context).length > 0) {
      console.table(context);
    }

    if (stack) {
      console.error('Stack trace:', stack);
    }

    console.groupEnd();
  }

  /**
   * Store error for debugging purposes
   * @param {Object} errorInfo - Error information
   */
  static storeError(errorInfo) {
    this.errors.set(errorInfo.id, errorInfo);

    // Keep only last N errors (configurable)
    const maxErrors = typeof AppConfig !== 'undefined' ? AppConfig.MAX_ARRAY_SIZE : 100;
    if (this.errors.size > maxErrors) {
      const oldestKey = this.errors.keys().next().value;
      this.errors.delete(oldestKey);
    }
  }

  /**
   * Determine if user should be notified
   * @param {Object} errorInfo - Error information
   * @returns {boolean}
   */
  static shouldNotifyUser(errorInfo) {
    const { context, name } = errorInfo;

    // Don't notify for certain error types
    const silentErrors = ['NetworkError', 'AbortError', 'ValidationError'];
    if (silentErrors.includes(name)) {
      return false;
    }

    // Don't notify for development errors
    if (context.type === 'development') {
      return false;
    }

    return true;
  }

  /**
   * Show user-friendly error notification
   * @param {Object} errorInfo - Error information
   */
  static notifyUser(errorInfo) {
    const userMessage = this.getUserFriendlyMessage(errorInfo);
    this.showNotification(userMessage, 'error');
  }

  /**
   * Convert technical error to user-friendly message
   * @param {Object} errorInfo - Error information
   * @returns {string}
   */
  static getUserFriendlyMessage(errorInfo) {
    const { message, context } = errorInfo;

    // Component-specific messages
    if (context.component) {
      const componentMessages = {
        'prtg': 'Error calculating PRTG pricing. Please check your sensor configuration.',
        'capital': 'Error calculating equipment costs. Please verify equipment details.',
        'support': 'Error calculating support costs. Please check your service configuration.',
        'wizard': 'Error in quote wizard. Please review your configuration.',
        'import': 'Error importing data. Please check your file format.',
        'export': 'Error exporting data. Please try again.'
      };

      return componentMessages[context.component] ||
             'An error occurred in the pricing calculator. Please refresh and try again.';
    }

    // Generic messages based on error type
    if (message.includes('fetch') || message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (message.includes('localStorage') || message.includes('storage')) {
      return 'Unable to save data. Please check your browser storage settings.';
    }

    if (message.includes('JSON') || message.includes('parse')) {
      return 'Data format error. The file may be corrupted.';
    }

    return 'An unexpected error occurred. Please refresh the page and try again.';
  }

  /**
   * Show notification to user
   * @param {string} message - Message to show
   * @param {string} type - Notification type (error, success, warning, info)
   * @param {Object} options - Additional options
   */
  static showNotification(message, type = 'error', options = {}) {
    // Use AppConfig constants if available
    const getDefaultDuration = () => {
      if (typeof AppConfig === 'undefined') return 5000;
      switch (type) {
        case 'error': return AppConfig.NOTIFICATION_AUTO_REMOVE_ERROR_MS;
        case 'warning': return AppConfig.NOTIFICATION_AUTO_REMOVE_WARNING_MS;
        case 'success': return AppConfig.NOTIFICATION_AUTO_REMOVE_SUCCESS_MS;
        default: return AppConfig.NOTIFICATION_AUTO_REMOVE_SUCCESS_MS;
      }
    };

    const {
      duration = getDefaultDuration(),
      persistent = false,
      onClick = null,
      allowHtml = false
    } = options;

    // Remove any existing notifications of the same type if requested
    if (options.replaceExisting) {
      const existingNotifications = document.querySelectorAll(`.error-notification--${type}`);
      existingNotifications.forEach(notification => notification.remove());
    }

    const notification = document.createElement('div');
    notification.className = `error-notification error-notification--${type}`;

    // Define colors and icons for different types
    const typeConfig = {
      error: { bg: '#dc2626', icon: '⚠️' },
      success: { bg: '#059669', icon: '✅' },
      warning: { bg: '#d97706', icon: '⚠️' },
      info: { bg: '#2563eb', icon: 'ℹ️' }
    };

    const config = typeConfig[type] || typeConfig.error;

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${config.bg};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
      cursor: ${onClick ? 'pointer' : 'default'};
      transition: transform 0.2s ease;
    `;

    // Add hover effect
    notification.addEventListener('mouseenter', () => {
      notification.style.transform = 'scale(1.02)';
    });

    notification.addEventListener('mouseleave', () => {
      notification.style.transform = 'scale(1)';
    });

    const messageContent = allowHtml ? message : this.escapeHtml(message);

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 16px; flex-shrink: 0;">
          ${config.icon}
        </span>
        <div style="flex: 1;">
          <div style="font-weight: 500; margin-bottom: ${type === 'error' ? '4px' : '0'};">
            ${messageContent}
          </div>
          ${type === 'error' ? '<div style="font-size: 12px; opacity: 0.8;">Click to dismiss</div>' : ''}
        </div>
        <button onclick="this.parentElement.parentElement.remove()"
                style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; opacity: 0.7; hover: opacity: 1; flex-shrink: 0;"
                onmouseover="this.style.opacity='1'"
                onmouseout="this.style.opacity='0.7'">
          ×
        </button>
      </div>
    `;

    // Add click handler if provided
    if (onClick) {
      notification.addEventListener('click', (event) => {
        if (event.target.tagName !== 'BUTTON') {
          onClick(event);
        }
      });
    }

    // Position notifications to stack
    const existingNotifications = document.querySelectorAll('.error-notification');

    // Limit max notifications using AppConfig
    const maxNotifications = typeof AppConfig !== 'undefined' ? AppConfig.MAX_NOTIFICATION_COUNT : 3;
    if (existingNotifications.length >= maxNotifications) {
      // Remove oldest notification
      existingNotifications[0].remove();
    }

    if (existingNotifications.length > 0) {
      const stackOffset = typeof AppConfig !== 'undefined' ? AppConfig.NOTIFICATION_STACK_OFFSET_REM : 5;
      const topOffset = 20 + existingNotifications.length * (stackOffset * 16); // Convert rem to px (assuming 16px base)
      notification.style.top = `${topOffset}px`;
    }

    document.body.appendChild(notification);

    // Auto remove after specified duration (unless persistent)
    if (!persistent && duration > 0) {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.style.animation = 'slideOut 0.3s ease-in';
          setTimeout(() => {
            if (notification.parentElement) {
              notification.remove();
            }
          }, 300);
        }
      }, duration);
    }

    return notification;
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  static escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Handle calculation errors specifically
   * @param {Error} error - Calculation error
   * @param {string} componentType - Component that failed
   * @returns {Object} - Safe fallback result
   */
  static handleCalculationError(error, componentType) {
    this.handleError(error, {
      type: 'calculation',
      component: componentType,
      severity: 'high'
    });

    return {
      totals: { monthly: 0, annual: 0, threeYear: 0, oneTime: 0 },
      breakdown: { error: true },
      error: 'Calculation failed'
    };
  }

  /**
   * Handle storage errors
   * @param {Error} error - Storage error
   * @param {string} operation - Storage operation (save/load)
   * @param {string} key - Storage key
   */
  static handleStorageError(error, operation, key) {
    this.handleError(error, {
      type: 'storage',
      operation,
      key,
      severity: 'medium'
    });
  }

  /**
   * Handle validation errors
   * @param {Error} error - Validation error
   * @param {string} field - Field that failed validation
   * @param {any} value - Invalid value
   */
  static handleValidationError(error, field, value) {
    this.handleError(error, {
      type: 'validation',
      field,
      value,
      severity: 'low'
    });
  }

  /**
   * Add error listener
   * @param {Function} listener - Error listener function
   */
  static addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove error listener
   * @param {Function} listener - Error listener function
   */
  static removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all error listeners
   * @param {Object} errorInfo - Error information
   */
  static notifyListeners(errorInfo) {
    this.listeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  /**
   * Generate unique error ID
   * @returns {string}
   */
  static generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all stored errors
   * @returns {Array}
   */
  static getAllErrors() {
    return Array.from(this.errors.values());
  }

  /**
   * Clear all stored errors
   */
  static clearErrors() {
    this.errors.clear();
  }

  /**
   * Get error statistics
   * @returns {Object}
   */
  static getErrorStats() {
    const errors = this.getAllErrors();
    const oneDayMs = typeof AppConfig !== 'undefined' ? AppConfig.AUTOSAVE_DATA_EXPIRY_MS : 24 * 60 * 60 * 1000;

    const stats = {
      total: errors.length,
      byType: {},
      byComponent: {},
      bySeverity: {},
      recent: errors.filter(e =>
        new Date() - new Date(e.timestamp) < oneDayMs
      ).length
    };

    errors.forEach(error => {
      const type = error.context.type || 'unknown';
      const component = error.context.component || 'unknown';
      const severity = error.context.severity || 'unknown';

      stats.byType[type] = (stats.byType[type] || 0) + 1;
      stats.byComponent[component] = (stats.byComponent[component] || 0) + 1;
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
    });

    return stats;
  }

  /**
   * Retry failed operation with exponential backoff
   * @param {Function} operation - Operation to retry
   * @param {Object} options - Retry options
   * @returns {Promise} - Result of operation
   */
  static async retryOperation(operation, options = {}) {
    const {
      maxAttempts = typeof AppConfig !== 'undefined' ? AppConfig.MAX_STORAGE_RECONNECT_ATTEMPTS : 3,
      baseDelay = typeof AppConfig !== 'undefined' ? AppConfig.STORAGE_RECONNECTION_DELAY_MS : 1000,
      maxDelay = 10000,
      onRetry = null
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          break;
        }

        // Exponential backoff with jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100,
          maxDelay
        );

        if (onRetry) {
          onRetry(attempt, maxAttempts, delay, error);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Create safe error boundary wrapper for async functions
   * @param {Function} fn - Function to wrap
   * @param {Object} context - Error context
   * @returns {Function} - Wrapped function
   */
  static createErrorBoundary(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(error, {
          ...context,
          functionName: fn.name,
          arguments: args.map(arg => typeof arg === 'object' ? '[Object]' : String(arg)).join(', ')
        });
        throw error;
      }
    };
  }

  /**
   * Check if error rate is too high
   * @param {number} timeWindowMs - Time window to check (default 1 minute)
   * @returns {boolean} - True if error rate is high
   */
  static isErrorRateHigh(timeWindowMs = 60000) {
    const threshold = typeof AppConfig !== 'undefined' ? AppConfig.MAX_ERROR_COUNT_THRESHOLD : 10;
    const now = Date.now();
    const recentErrors = Array.from(this.errors.values()).filter(
      error => now - new Date(error.timestamp).getTime() < timeWindowMs
    );

    return recentErrors.length > threshold;
  }
}

// Initialize error handling when module loads
if (typeof window !== 'undefined') {
  ErrorHandler.init();
}

// Add CSS for notifications
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }

    .error-notification {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    }

    .error-notification--error {
      border-left: 4px solid #ef4444;
    }

    .error-notification--success {
      border-left: 4px solid #10b981;
    }

    .error-notification--warning {
      border-left: 4px solid #f59e0b;
    }

    .error-notification--info {
      border-left: 4px solid #3b82f6;
    }
  `;
  document.head.appendChild(style);
}