/**
 * Security utilities tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityUtils, InputValidator } from '../../src/utils/security.js';

describe('SecurityUtils', () => {
  let mockElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
  });

  describe('setHTML', () => {
    it('should call setHTML without errors', () => {
      const maliciousHTML = '<script>alert("xss")</script><p>Safe content</p>';

      // Should not throw an error
      expect(() => {
        SecurityUtils.setHTML(mockElement, maliciousHTML);
      }).not.toThrow();

      // Function should handle the input gracefully
      expect(mockElement).toBeDefined();
    });

    it('should handle null element gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      SecurityUtils.setHTML(null, '<p>test</p>');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle non-string HTML gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      SecurityUtils.setHTML(mockElement, 123);

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('createElement', () => {
    it('should create element with text content', () => {
      const element = SecurityUtils.createElement('span', 'Hello World');

      expect(element.tagName).toBe('SPAN');
      expect(element.textContent).toBe('Hello World');
    });

    it('should create element with valid attributes', () => {
      const element = SecurityUtils.createElement('input', '', {
        type: 'text',
        class: 'form-input',
        'data-test': 'value'
      });

      expect(element.type).toBe('text');
      expect(element.className).toBe('form-input');
      expect(element.getAttribute('data-test')).toBe('value');
    });

    it('should filter out unsafe attributes', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      const element = SecurityUtils.createElement('div', '', {
        'onclick': 'alert("xss")',
        'valid-attr': 'safe'
      });

      expect(consoleSpy).toHaveBeenCalled();
      expect(element.getAttribute('onclick')).toBeNull();
    });
  });

  describe('isValidAttribute', () => {
    it('should allow safe attributes', () => {
      expect(SecurityUtils.isValidAttribute('class', 'safe-class')).toBe(true);
      expect(SecurityUtils.isValidAttribute('data-id', '123')).toBe(true);
      expect(SecurityUtils.isValidAttribute('aria-label', 'button')).toBe(true);
    });

    it('should block unsafe attributes', () => {
      expect(SecurityUtils.isValidAttribute('onclick', 'alert(1)')).toBe(false);
      expect(SecurityUtils.isValidAttribute('onload', 'malicious()')).toBe(false);
    });

    it('should block JavaScript in attribute values', () => {
      expect(SecurityUtils.isValidAttribute('href', 'javascript:alert(1)')).toBe(false);
      expect(SecurityUtils.isValidAttribute('src', 'data:text/html,<script>')).toBe(false);
    });
  });
});

describe('InputValidator', () => {
  describe('validateNumber', () => {
    it('should validate valid numbers', () => {
      expect(InputValidator.validateNumber('123')).toBe(123);
      expect(InputValidator.validateNumber('123.45')).toBe(123.45);
      expect(InputValidator.validateNumber(456)).toBe(456);
    });

    it('should handle empty/null values', () => {
      expect(InputValidator.validateNumber('')).toBe(0);
      expect(InputValidator.validateNumber(null)).toBe(0);
      expect(InputValidator.validateNumber(undefined)).toBe(0);
    });

    it('should throw on invalid numbers', () => {
      expect(() => InputValidator.validateNumber('abc')).toThrow('Invalid number');
      expect(() => InputValidator.validateNumber('not-a-number')).toThrow('Invalid number');
    });

    it('should enforce min/max constraints', () => {
      expect(() => InputValidator.validateNumber(-5, { min: 0 })).toThrow('below minimum');
      expect(() => InputValidator.validateNumber(150, { max: 100 })).toThrow('exceeds maximum');
    });

    it('should handle integer-only mode', () => {
      expect(InputValidator.validateNumber('123.45', { allowFloat: false })).toBe(123);
    });
  });

  describe('validateString', () => {
    it('should validate valid strings', () => {
      expect(InputValidator.validateString('hello')).toBe('hello');
      expect(InputValidator.validateString('  spaced  ')).toBe('spaced');
    });

    it('should handle empty strings based on allowEmpty', () => {
      expect(InputValidator.validateString('', { allowEmpty: true })).toBe('');
      expect(() => InputValidator.validateString('', { allowEmpty: false })).toThrow('cannot be empty');
    });

    it('should enforce length constraints', () => {
      expect(() => InputValidator.validateString('ab', { minLength: 3 })).toThrow('below minimum');
      expect(() => InputValidator.validateString('toolong', { maxLength: 3 })).toThrow('exceeds maximum');
    });

    it('should validate against patterns', () => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(() => InputValidator.validateString('invalid-email', { pattern: emailPattern }))
        .toThrow('does not match required pattern');
    });

    it('should detect XSS attempts', () => {
      expect(() => InputValidator.validateString('<script>alert(1)</script>')).toThrow('harmful content');
      expect(() => InputValidator.validateString('javascript:alert(1)')).toThrow('harmful content');
      expect(() => InputValidator.validateString('onclick=alert(1)')).toThrow('harmful content');
    });

    it('should handle null/undefined values', () => {
      expect(InputValidator.validateString(null)).toBe('');
      expect(InputValidator.validateString(undefined)).toBe('');
      expect(InputValidator.validateString(null, { defaultValue: 'default' })).toBe('default');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(InputValidator.validateEmail('test@example.com')).toBe('test@example.com');
      expect(InputValidator.validateEmail('USER@DOMAIN.COM')).toBe('user@domain.com');
    });

    it('should reject invalid email formats', () => {
      expect(() => InputValidator.validateEmail('invalid-email')).toThrow();
      expect(() => InputValidator.validateEmail('@domain.com')).toThrow();
      expect(() => InputValidator.validateEmail('user@')).toThrow();
    });
  });

  describe('validateCurrency', () => {
    it('should validate currency amounts', () => {
      expect(InputValidator.validateCurrency('123.45')).toBe(123.45);
      expect(InputValidator.validateCurrency(0)).toBe(0);
    });

    it('should reject negative amounts', () => {
      expect(() => InputValidator.validateCurrency(-10)).toThrow('below minimum');
    });

    it('should reject excessive amounts', () => {
      expect(() => InputValidator.validateCurrency(99999999)).toThrow('exceeds maximum');
    });
  });

  describe('validatePercentage', () => {
    it('should validate percentage values', () => {
      expect(InputValidator.validatePercentage('50')).toBe(50);
      expect(InputValidator.validatePercentage('0')).toBe(0);
      expect(InputValidator.validatePercentage('100')).toBe(100);
    });

    it('should reject values outside 0-100 range', () => {
      expect(() => InputValidator.validatePercentage('-5')).toThrow('below minimum');
      expect(() => InputValidator.validatePercentage('150')).toThrow('exceeds maximum');
    });
  });

  describe('sanitizeForStorage', () => {
    it('should sanitize object properties', () => {
      const input = {
        validString: 'hello',
        validNumber: 123,
        validBoolean: true,
        invalidScript: '<script>alert(1)</script>',
        nested: {
          prop: 'value'
        },
        array: ['item1', 'item2']
      };

      const result = InputValidator.sanitizeForStorage(input);

      expect(result.validString).toBe('hello');
      expect(result.validNumber).toBe(123);
      expect(result.validBoolean).toBe(true);
      expect(result.invalidScript).toBeUndefined(); // Should be filtered out
      expect(result.nested).toEqual({ prop: 'value' });
      expect(result.array).toEqual(['item1', 'item2']);
    });

    it('should handle null/undefined input', () => {
      expect(InputValidator.sanitizeForStorage(null)).toEqual({});
      expect(InputValidator.sanitizeForStorage(undefined)).toEqual({});
    });

    it('should handle non-object input', () => {
      expect(InputValidator.sanitizeForStorage('string')).toEqual({});
      expect(InputValidator.sanitizeForStorage(123)).toEqual({});
    });
  });
});