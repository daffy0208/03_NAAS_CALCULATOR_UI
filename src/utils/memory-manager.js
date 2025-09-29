/**
 * Memory Management and Leak Prevention
 * Provides utilities for preventing memory leaks and managing resource cleanup
 */

export class MemoryManager {
  static eventListeners = new Map();
  static timers = new Set();
  static observers = new Set();
  static references = new WeakMap();
  static cleanupCallbacks = [];

  /**
   * Initialize memory management
   */
  static init() {
    this.setupPageUnloadCleanup();
    this.setupPeriodicCleanup();
    this.interceptTimerFunctions();
    this.interceptEventListeners();
  }

  /**
   * Setup cleanup on page unload
   */
  static setupPageUnloadCleanup() {
    window.addEventListener('beforeunload', () => {
      this.performCleanup();
    });

    window.addEventListener('pagehide', () => {
      this.performCleanup();
    });

    // Cleanup on visibility change (helps with mobile browsers)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.performPartialCleanup();
      }
    });
  }

  /**
   * Setup periodic cleanup
   */
  static setupPeriodicCleanup() {
    // Run cleanup every 5 minutes
    this.addManagedTimer(setInterval(() => {
      this.performPartialCleanup();
    }, 5 * 60 * 1000));
  }

  /**
   * Intercept timer functions to track them
   */
  static interceptTimerFunctions() {
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    const originalClearTimeout = window.clearTimeout;
    const originalClearInterval = window.clearInterval;

    window.setTimeout = (callback, delay, ...args) => {
      const id = originalSetTimeout(callback, delay, ...args);
      this.timers.add(id);
      return id;
    };

    window.setInterval = (callback, delay, ...args) => {
      const id = originalSetInterval(callback, delay, ...args);
      this.timers.add(id);
      return id;
    };

    window.clearTimeout = (id) => {
      this.timers.delete(id);
      return originalClearTimeout(id);
    };

    window.clearInterval = (id) => {
      this.timers.delete(id);
      return originalClearInterval(id);
    };
  }

  /**
   * Intercept event listener functions to track them
   */
  static interceptEventListeners() {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

    EventTarget.prototype.addEventListener = function(type, listener, options) {
      const key = `${this.constructor.name}_${type}`;
      if (!MemoryManager.eventListeners.has(key)) {
        MemoryManager.eventListeners.set(key, []);
      }
      MemoryManager.eventListeners.get(key).push({ element: this, listener, options });

      return originalAddEventListener.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function(type, listener, options) {
      const key = `${this.constructor.name}_${type}`;
      const listeners = MemoryManager.eventListeners.get(key);
      if (listeners) {
        const index = listeners.findIndex(l =>
          l.element === this && l.listener === listener
        );
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }

      return originalRemoveEventListener.call(this, type, listener, options);
    };
  }

  /**
   * Add managed timer (tracked automatically)
   * @param {number} id - Timer ID
   */
  static addManagedTimer(id) {
    this.timers.add(id);
    return id;
  }

  /**
   * Add managed observer
   * @param {Observer} observer - Observer instance
   */
  static addManagedObserver(observer) {
    this.observers.add(observer);
    return observer;
  }

  /**
   * Add cleanup callback
   * @param {Function} callback - Cleanup callback
   */
  static addCleanupCallback(callback) {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Create managed event listener
   * @param {EventTarget} element - Target element
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {Object} options - Event options
   * @returns {Function} - Cleanup function
   */
  static addManagedEventListener(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);

    // Return cleanup function
    return () => {
      element.removeEventListener(event, handler, options);
    };
  }

  /**
   * Create managed fetch request with cleanup
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Object} - Fetch promise and abort controller
   */
  static createManagedFetch(url, options = {}) {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchPromise = fetch(url, {
      ...options,
      signal
    });

    // Add to cleanup
    this.addCleanupCallback(() => {
      controller.abort();
    });

    return {
      promise: fetchPromise,
      abort: () => controller.abort()
    };
  }

  /**
   * Create managed DOM element with cleanup tracking
   * @param {string} tagName - Element tag name
   * @param {Object} attributes - Element attributes
   * @returns {Object} - Element and cleanup function
   */
  static createManagedElement(tagName, attributes = {}) {
    const element = document.createElement(tagName);

    // Set attributes
    Object.keys(attributes).forEach(key => {
      element.setAttribute(key, attributes[key]);
    });

    // Track element for cleanup
    this.references.set(element, {
      created: Date.now(),
      type: 'element'
    });

    return {
      element,
      cleanup: () => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        this.references.delete(element);
      }
    };
  }

  /**
   * Monitor object for memory usage
   * @param {Object} obj - Object to monitor
   * @param {string} name - Object name for debugging
   */
  static monitorObject(obj, name) {
    this.references.set(obj, {
      name,
      created: Date.now(),
      type: 'monitored'
    });
  }

  /**
   * Perform full cleanup
   */
  static performCleanup() {
    console.log('Performing full memory cleanup');

    // Clear all timers
    this.timers.forEach(id => {
      clearTimeout(id);
      clearInterval(id);
    });
    this.timers.clear();

    // Disconnect all observers
    this.observers.forEach(observer => {
      if (observer.disconnect) {
        observer.disconnect();
      }
    });
    this.observers.clear();

    // Remove event listeners
    this.eventListeners.forEach((listeners, key) => {
      listeners.forEach(({ element, listener, options }) => {
        try {
          element.removeEventListener(key.split('_')[1], listener, options);
        } catch (error) {
          console.warn('Error removing event listener:', error);
        }
      });
    });
    this.eventListeners.clear();

    // Run cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Error in cleanup callback:', error);
      }
    });
    this.cleanupCallbacks = [];

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  /**
   * Perform partial cleanup (safe for periodic execution)
   */
  static performPartialCleanup() {
    console.log('Performing partial memory cleanup');

    // Clean up expired timers (this is mainly for tracking accuracy)
    // The actual timers will clean themselves up when they expire

    // Check for detached DOM elements
    this.cleanDetachedElements();

    // Run memory usage check
    this.checkMemoryUsage();
  }

  /**
   * Clean up detached DOM elements
   */
  static cleanDetachedElements() {
    this.references.forEach((info, obj) => {
      if (info.type === 'element' && obj.nodeType) {
        // Check if element is detached
        if (!obj.isConnected && !document.contains(obj)) {
          this.references.delete(obj);
          console.log(`Cleaned up detached element: ${obj.tagName}`);
        }
      }
    });
  }

  /**
   * Check memory usage and warn if high
   */
  static checkMemoryUsage() {
    if (performance.memory) {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
      const usagePercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;

      if (usagePercent > 80) {
        console.warn(`High memory usage detected: ${usagePercent.toFixed(1)}%`);

        // Use error handler if available
        if (window.ErrorHandler && typeof window.ErrorHandler.handleError === 'function') {
          window.ErrorHandler.handleError(new Error('High memory usage detected'), {
            operation: 'memory_check',
            usagePercent: usagePercent.toFixed(1),
            severity: 'medium'
          });
        }

        // Perform emergency cleanup
        this.performPartialCleanup();
      }

      return {
        used: usedJSHeapSize,
        total: totalJSHeapSize,
        limit: jsHeapSizeLimit,
        usagePercent
      };
    }

    return null;
  }

  /**
   * Get memory statistics
   * @returns {Object} - Memory statistics
   */
  static getMemoryStats() {
    const stats = {
      trackedTimers: this.timers.size,
      trackedObservers: this.observers.size,
      trackedEventListeners: Array.from(this.eventListeners.values())
        .reduce((total, listeners) => total + listeners.length, 0),
      trackedReferences: this.references.size,
      cleanupCallbacks: this.cleanupCallbacks.length
    };

    const memInfo = this.checkMemoryUsage();
    if (memInfo) {
      stats.memory = memInfo;
    }

    return stats;
  }

  /**
   * Create a scoped cleanup manager for components
   * @param {string} scope - Scope name
   * @returns {Object} - Scoped manager
   */
  static createScope(scope) {
    const scopedTimers = new Set();
    const scopedObservers = new Set();
    const scopedCallbacks = [];

    return {
      addTimer: (id) => {
        scopedTimers.add(id);
        this.timers.add(id);
        return id;
      },

      addObserver: (observer) => {
        scopedObservers.add(observer);
        this.observers.add(observer);
        return observer;
      },

      addEventListener: (element, event, handler, options = {}) => {
        const cleanup = this.addManagedEventListener(element, event, handler, options);
        scopedCallbacks.push(cleanup);
        return cleanup;
      },

      addCleanupCallback: (callback) => {
        scopedCallbacks.push(callback);
      },

      cleanup: () => {
        console.log(`Cleaning up scope: ${scope}`);

        // Clear scoped timers
        scopedTimers.forEach(id => {
          clearTimeout(id);
          clearInterval(id);
          this.timers.delete(id);
        });

        // Disconnect scoped observers
        scopedObservers.forEach(observer => {
          if (observer.disconnect) {
            observer.disconnect();
          }
          this.observers.delete(observer);
        });

        // Run scoped callbacks
        scopedCallbacks.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.warn(`Error in scoped cleanup callback for ${scope}:`, error);
          }
        });
      }
    };
  }

  /**
   * Debounce function with automatic cleanup
   * @param {Function} func - Function to debounce
   * @param {number} delay - Debounce delay
   * @returns {Function} - Debounced function with cleanup
   */
  static createDebounced(func, delay) {
    let timeoutId;

    const debounced = (...args) => {
      clearTimeout(timeoutId);
      timeoutId = this.addManagedTimer(setTimeout(() => func(...args), delay));
    };

    debounced.cleanup = () => {
      clearTimeout(timeoutId);
      this.timers.delete(timeoutId);
    };

    return debounced;
  }

  /**
   * Throttle function with automatic cleanup
   * @param {Function} func - Function to throttle
   * @param {number} delay - Throttle delay
   * @returns {Function} - Throttled function with cleanup
   */
  static createThrottled(func, delay) {
    let lastCall = 0;
    let timeoutId;

    const throttled = (...args) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall;

      if (timeSinceLastCall >= delay) {
        lastCall = now;
        func(...args);
      } else {
        clearTimeout(timeoutId);
        timeoutId = this.addManagedTimer(setTimeout(() => {
          lastCall = Date.now();
          func(...args);
        }, delay - timeSinceLastCall));
      }
    };

    throttled.cleanup = () => {
      clearTimeout(timeoutId);
      this.timers.delete(timeoutId);
    };

    return throttled;
  }
}

// Initialize memory management when module loads
if (typeof window !== 'undefined') {
  MemoryManager.init();
}