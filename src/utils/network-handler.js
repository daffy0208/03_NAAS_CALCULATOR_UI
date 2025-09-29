/**
 * Network Error Handler
 * Provides comprehensive network error handling, retry logic, and offline support
 */

export class NetworkHandler {
  static isOnline = navigator.onLine;
  static retryQueue = [];
  static maxRetries = 3;
  static baseDelay = 1000;
  static offlineQueue = [];

  /**
   * Initialize network error handling
   */
  static init() {
    this.setupOnlineOfflineHandlers();
    this.setupFetchInterceptor();
    this.setupPeriodicConnectivityCheck();
  }

  /**
   * Setup online/offline event handlers
   */
  static setupOnlineOfflineHandlers() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Connection restored');

      if (window.ErrorHandler && typeof window.ErrorHandler.showNotification === 'function') {
        window.ErrorHandler.showNotification('Connection restored', 'success', { duration: 3000 });
      }

      // Process offline queue
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Connection lost');

      if (window.ErrorHandler && typeof window.ErrorHandler.showNotification === 'function') {
        window.ErrorHandler.showNotification(
          'You are currently offline. Some features may not work.',
          'warning',
          { duration: 0, persistent: true }
        );
      }
    });
  }

  /**
   * Setup fetch interceptor for automatic error handling
   */
  static setupFetchInterceptor() {
    const originalFetch = window.fetch;

    window.fetch = async (url, options = {}) => {
      return this.fetchWithRetry(originalFetch, url, options);
    };
  }

  /**
   * Enhanced fetch with retry logic and error handling
   * @param {Function} fetchFn - Original fetch function
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Promise} - Fetch promise
   */
  static async fetchWithRetry(fetchFn, url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);

    const requestOptions = {
      ...options,
      signal: controller.signal
    };

    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Check if offline
        if (!this.isOnline) {
          throw new Error('No internet connection');
        }

        const response = await fetchFn(url, requestOptions);
        clearTimeout(timeoutId);

        // Handle HTTP error status codes
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.status = response.status;
          error.response = response;
          throw error;
        }

        return response;

      } catch (error) {
        lastError = error;
        clearTimeout(timeoutId);

        // Don't retry for certain error types
        if (this.isNonRetryableError(error) || attempt === this.maxRetries) {
          break;
        }

        // Wait before retry with exponential backoff
        const delay = this.calculateDelay(attempt);
        console.log(`Request failed (attempt ${attempt + 1}), retrying in ${delay}ms:`, error.message);
        await this.sleep(delay);
      }
    }

    // Handle the final error
    return this.handleNetworkError(lastError, url, options);
  }

  /**
   * Handle network errors
   * @param {Error} error - Network error
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise} - Rejected promise or offline queue entry
   */
  static async handleNetworkError(error, url, options) {
    console.error('Network request failed:', error);

    // Create error info
    const errorInfo = {
      type: 'network',
      url,
      error: error.message,
      status: error.status || null,
      timestamp: new Date().toISOString()
    };

    // Use global error handler if available
    if (window.ErrorHandler && typeof window.ErrorHandler.handleError === 'function') {
      window.ErrorHandler.handleError(error, {
        operation: 'network_request',
        url,
        severity: this.getErrorSeverity(error),
        ...errorInfo
      });
    }

    // Queue request for later if offline and method is safe
    if (!this.isOnline && this.isSafeMethod(options.method)) {
      return this.queueOfflineRequest(url, options);
    }

    throw error;
  }

  /**
   * Check if error is non-retryable
   * @param {Error} error - Error to check
   * @returns {boolean} - Whether error is non-retryable
   */
  static isNonRetryableError(error) {
    // Client errors (4xx) generally shouldn't be retried
    if (error.status >= 400 && error.status < 500) {
      return true;
    }

    // Specific error types that shouldn't be retried
    const nonRetryableErrors = ['AbortError', 'TypeError', 'SyntaxError'];
    return nonRetryableErrors.includes(error.name);
  }

  /**
   * Calculate retry delay with exponential backoff
   * @param {number} attempt - Attempt number
   * @returns {number} - Delay in milliseconds
   */
  static calculateDelay(attempt) {
    return this.baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
  }

  /**
   * Get error severity based on error type
   * @param {Error} error - Network error
   * @returns {string} - Error severity
   */
  static getErrorSeverity(error) {
    if (error.status >= 500) return 'high';
    if (error.status >= 400) return 'medium';
    if (error.name === 'AbortError') return 'low';
    return 'medium';
  }

  /**
   * Check if HTTP method is safe for offline queuing
   * @param {string} method - HTTP method
   * @returns {boolean} - Whether method is safe
   */
  static isSafeMethod(method = 'GET') {
    return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
  }

  /**
   * Queue request for when connection is restored
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise} - Promise that resolves when connection is restored
   */
  static queueOfflineRequest(url, options) {
    return new Promise((resolve, reject) => {
      this.offlineQueue.push({
        url,
        options,
        resolve,
        reject,
        timestamp: Date.now()
      });

      console.log(`Queued offline request: ${url}`);
    });
  }

  /**
   * Process queued offline requests
   */
  static async processOfflineQueue() {
    console.log(`Processing ${this.offlineQueue.length} offline requests`);

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const request of queue) {
      try {
        // Check if request is too old (older than 5 minutes)
        if (Date.now() - request.timestamp > 5 * 60 * 1000) {
          request.reject(new Error('Request expired'));
          continue;
        }

        const response = await fetch(request.url, request.options);
        request.resolve(response);
      } catch (error) {
        request.reject(error);
      }
    }
  }

  /**
   * Setup periodic connectivity check
   */
  static setupPeriodicConnectivityCheck() {
    setInterval(async () => {
      try {
        // Try to fetch a small resource to check connectivity
        await fetch('/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache',
          timeout: 5000
        });

        if (!this.isOnline) {
          this.isOnline = true;
          window.dispatchEvent(new Event('online'));
        }
      } catch (error) {
        if (this.isOnline) {
          this.isOnline = false;
          window.dispatchEvent(new Event('offline'));
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Sleep utility function
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after delay
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check current network status
   * @returns {boolean} - Whether online
   */
  static getNetworkStatus() {
    return this.isOnline;
  }

  /**
   * Manually set network status (for testing)
   * @param {boolean} online - Network status
   */
  static setNetworkStatus(online) {
    const wasOnline = this.isOnline;
    this.isOnline = online;

    if (wasOnline !== online) {
      window.dispatchEvent(new Event(online ? 'online' : 'offline'));
    }
  }

  /**
   * Clear offline queue
   */
  static clearOfflineQueue() {
    this.offlineQueue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.offlineQueue = [];
  }

  /**
   * Get offline queue status
   * @returns {Object} - Queue status
   */
  static getOfflineQueueStatus() {
    return {
      count: this.offlineQueue.length,
      oldestTimestamp: this.offlineQueue.length > 0
        ? Math.min(...this.offlineQueue.map(r => r.timestamp))
        : null
    };
  }
}

// Initialize network handling when module loads
if (typeof window !== 'undefined') {
  NetworkHandler.init();
}