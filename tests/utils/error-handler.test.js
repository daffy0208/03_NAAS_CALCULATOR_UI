/**
 * Error handler tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler } from '../../src/utils/error-handler.js';

describe('ErrorHandler', () => {
  beforeEach(() => {
    ErrorHandler.clearErrors();
    ErrorHandler.listeners.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any notifications created during tests
    document.querySelectorAll('.error-notification').forEach(el => el.remove());
  });

  describe('createErrorInfo', () => {
    it('should create error info from Error object', () => {
      const error = new Error('Test error');
      error.name = 'TestError';

      const errorInfo = ErrorHandler.createErrorInfo(error, { component: 'test' });

      expect(errorInfo.message).toBe('Test error');
      expect(errorInfo.name).toBe('TestError');
      expect(errorInfo.context.component).toBe('test');
      expect(errorInfo.stack).toBe(error.stack);
      expect(errorInfo.id).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(errorInfo.timestamp).toBeDefined();
    });

    it('should create error info from string', () => {
      const errorInfo = ErrorHandler.createErrorInfo('String error', { type: 'validation' });

      expect(errorInfo.message).toBe('String error');
      expect(errorInfo.name).toBe('Unknown');
      expect(errorInfo.context.type).toBe('validation');
      expect(errorInfo.stack).toBeNull();
    });
  });

  describe('handleError', () => {
    it('should log error to console', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const error = new Error('Test error');

      ErrorHandler.handleError(error);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should store error for debugging', () => {
      const error = new Error('Test error');

      ErrorHandler.handleError(error);

      const errors = ErrorHandler.getAllErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Test error');
    });

    it('should limit stored errors to 100', () => {
      // Add 101 errors
      for (let i = 0; i < 101; i++) {
        ErrorHandler.handleError(new Error(`Error ${i}`));
      }

      const errors = ErrorHandler.getAllErrors();
      expect(errors).toHaveLength(100);
      // Should have removed the oldest error
      expect(errors.find(e => e.message === 'Error 0')).toBeUndefined();
    });
  });

  describe('shouldNotifyUser', () => {
    it('should not notify for silent error types', () => {
      const errorInfo = { name: 'NetworkError', context: {} };
      expect(ErrorHandler.shouldNotifyUser(errorInfo)).toBe(false);

      const errorInfo2 = { name: 'ValidationError', context: {} };
      expect(ErrorHandler.shouldNotifyUser(errorInfo2)).toBe(false);
    });

    it('should not notify for development errors', () => {
      const errorInfo = { name: 'Error', context: { type: 'development' } };
      expect(ErrorHandler.shouldNotifyUser(errorInfo)).toBe(false);
    });

    it('should notify for other error types', () => {
      const errorInfo = { name: 'CalculationError', context: { component: 'prtg' } };
      expect(ErrorHandler.shouldNotifyUser(errorInfo)).toBe(true);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return component-specific messages', () => {
      const errorInfo = { message: 'calc failed', context: { component: 'prtg' } };
      const message = ErrorHandler.getUserFriendlyMessage(errorInfo);

      expect(message).toContain('PRTG pricing');
    });

    it('should return network error messages', () => {
      const errorInfo = { message: 'fetch failed', context: {} };
      const message = ErrorHandler.getUserFriendlyMessage(errorInfo);

      expect(message).toContain('Network error');
    });

    it('should return storage error messages', () => {
      const errorInfo = { message: 'localStorage failed', context: {} };
      const message = ErrorHandler.getUserFriendlyMessage(errorInfo);

      expect(message).toContain('Unable to save data');
    });

    it('should return generic message for unknown errors', () => {
      const errorInfo = { message: 'unknown error', context: {} };
      const message = ErrorHandler.getUserFriendlyMessage(errorInfo);

      expect(message).toContain('unexpected error occurred');
    });
  });

  describe('showNotification', () => {
    it('should create notification element', () => {
      ErrorHandler.showNotification('Test message', 'error');

      const notification = document.querySelector('.error-notification');
      expect(notification).toBeTruthy();
      expect(notification.textContent).toContain('Test message');
    });

    it('should auto-remove notification after timeout', async () => {
      vi.useFakeTimers();

      ErrorHandler.showNotification('Test message', 'error');

      expect(document.querySelector('.error-notification')).toBeTruthy();

      // Advance timers and wait for DOM updates
      await vi.advanceTimersByTimeAsync(5000);

      // Wait for any pending microtasks
      await vi.runAllTimersAsync();

      expect(document.querySelector('.error-notification')).toBeFalsy();

      vi.useRealTimers();
    });
  });

  describe('handleCalculationError', () => {
    it('should return safe fallback result', () => {
      const error = new Error('Calculation failed');
      const result = ErrorHandler.handleCalculationError(error, 'prtg');

      expect(result.totals.monthly).toBe(0);
      expect(result.totals.annual).toBe(0);
      expect(result.totals.threeYear).toBe(0);
      expect(result.totals.oneTime).toBe(0);
      expect(result.breakdown.error).toBe(true);
      expect(result.error).toBe('Calculation failed');
    });

    it('should store error with correct context', () => {
      const error = new Error('Calculation failed');
      ErrorHandler.handleCalculationError(error, 'prtg');

      const errors = ErrorHandler.getAllErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].context.type).toBe('calculation');
      expect(errors[0].context.component).toBe('prtg');
      expect(errors[0].context.severity).toBe('high');
    });
  });

  describe('listeners', () => {
    it('should add and remove listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      ErrorHandler.addListener(listener1);
      ErrorHandler.addListener(listener2);

      expect(ErrorHandler.listeners.size).toBe(2);

      ErrorHandler.removeListener(listener1);

      expect(ErrorHandler.listeners.size).toBe(1);
    });

    it('should notify listeners on error', () => {
      const listener = vi.fn();
      ErrorHandler.addListener(listener);

      const error = new Error('Test error');
      ErrorHandler.handleError(error);

      expect(listener).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Test error'
      }));
    });

    it('should handle listener errors gracefully', () => {
      const badListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const consoleSpy = vi.spyOn(console, 'error');

      ErrorHandler.addListener(badListener);

      const error = new Error('Test error');
      ErrorHandler.handleError(error);

      expect(consoleSpy).toHaveBeenCalledWith('Error in error listener:', expect.any(Error));
    });
  });

  describe('getErrorStats', () => {
    it('should return error statistics', () => {
      ErrorHandler.handleError(new Error('Error 1'), { type: 'calculation', component: 'prtg' });
      ErrorHandler.handleError(new Error('Error 2'), { type: 'validation', component: 'prtg' });
      ErrorHandler.handleError(new Error('Error 3'), { type: 'calculation', component: 'support' });

      const stats = ErrorHandler.getErrorStats();

      expect(stats.total).toBe(3);
      expect(stats.byType.calculation).toBe(2);
      expect(stats.byType.validation).toBe(1);
      expect(stats.byComponent.prtg).toBe(2);
      expect(stats.byComponent.support).toBe(1);
    });
  });

  describe('generateErrorId', () => {
    it('should generate unique error IDs', () => {
      const id1 = ErrorHandler.generateErrorId();
      const id2 = ErrorHandler.generateErrorId();

      expect(id1).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });
});