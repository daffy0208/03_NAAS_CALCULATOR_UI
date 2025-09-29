/**
 * Security utilities for safe DOM manipulation and input validation
 * Prevents XSS attacks and ensures data integrity
 */

import DOMPurify from 'dompurify';

export class SecurityUtils {
  /**
   * Safely set HTML content with DOMPurify sanitization
   * @param {HTMLElement} element - Target element
   * @param {string} html - HTML content to set
   * @param {Object} config - DOMPurify configuration
   */
  static setHTML(element, html, config = {}) {
    if (!element || typeof html !== 'string') {
      console.error('SecurityUtils.setHTML: Invalid parameters');
      return;
    }

    const defaultConfig = {
      ALLOWED_TAGS: [
        'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'em', 'i', 'b', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
        'thead', 'tbody', 'button', 'input', 'select', 'option', 'label',
        'form', 'fieldset', 'legend'
      ],
      ALLOWED_ATTR: [
        'class', 'id', 'data-*', 'type', 'name', 'value', 'placeholder',
        'min', 'max', 'step', 'required', 'readonly', 'disabled',
        'aria-*', 'role', 'tabindex'
      ],
      KEEP_CONTENT: false,
      ALLOW_DATA_ATTR: true
    };

    const sanitizedHTML = DOMPurify.sanitize(html, { ...defaultConfig, ...config });
    element.innerHTML = sanitizedHTML;
  }

  /**
   * Create a safe DOM element with text content
   * @param {string} tagName - Element tag name
   * @param {string} textContent - Text content
   * @param {Object} attributes - Element attributes
   * @returns {HTMLElement}
   */
  static createElement(tagName, textContent = '', attributes = {}) {
    const element = document.createElement(tagName);

    if (textContent) {
      element.textContent = textContent;
    }

    Object.entries(attributes).forEach(([key, value]) => {
      if (this.isValidAttribute(key, value)) {
        element.setAttribute(key, value);
      }
    });

    return element;
  }

  /**
   * Validate attribute name and value
   * @param {string} name - Attribute name
   * @param {string} value - Attribute value
   * @returns {boolean}
   */
  static isValidAttribute(name, value) {
    const allowedAttributes = [
      'class', 'id', 'type', 'name', 'value', 'placeholder',
      'min', 'max', 'step', 'required', 'readonly', 'disabled',
      'role', 'tabindex', 'title'
    ];

    const dataAttrPattern = /^data-[a-z]+$/;
    const ariaAttrPattern = /^aria-[a-z]+$/;

    const isAllowed = allowedAttributes.includes(name) ||
                     dataAttrPattern.test(name) ||
                     ariaAttrPattern.test(name);

    if (!isAllowed) {
      console.warn(`SecurityUtils: Blocked potentially unsafe attribute: ${name}`);
      return false;
    }

    // Check for JavaScript in attribute values
    if (typeof value === 'string' && /javascript:|data:|vbscript:|on\w+=/i.test(value)) {
      console.warn(`SecurityUtils: Blocked potentially unsafe attribute value: ${value}`);
      return false;
    }

    return true;
  }

  /**
   * Safely append child elements
   * @param {HTMLElement} parent - Parent element
   * @param {HTMLElement|HTMLElement[]} children - Child element(s)
   */
  static appendChild(parent, children) {
    if (!parent || !children) {
      console.error('SecurityUtils.appendChild: Invalid parameters');
      return;
    }

    const childArray = Array.isArray(children) ? children : [children];

    childArray.forEach(child => {
      if (child instanceof HTMLElement) {
        parent.appendChild(child);
      } else {
        console.error('SecurityUtils.appendChild: Invalid child element');
      }
    });
  }
}

export class InputValidator {
  /**
   * Validate and sanitize numeric input
   * @param {any} input - Input value
   * @param {Object} options - Validation options
   * @returns {number}
   */
  static validateNumber(input, options = {}) {
    const {
      min = 0,
      max = Number.MAX_SAFE_INTEGER,
      allowFloat = true,
      defaultValue = 0
    } = options;

    if (input === null || input === undefined || input === '') {
      return defaultValue;
    }

    const num = allowFloat ? parseFloat(input) : parseInt(input, 10);

    if (isNaN(num)) {
      throw new Error(`Invalid number: ${input}`);
    }

    if (num < min) {
      throw new Error(`Number ${num} is below minimum ${min}`);
    }

    if (num > max) {
      throw new Error(`Number ${num} exceeds maximum ${max}`);
    }

    return num;
  }

  /**
   * Validate and sanitize string input
   * @param {any} input - Input value
   * @param {Object} options - Validation options
   * @returns {string}
   */
  static validateString(input, options = {}) {
    const {
      maxLength = 255,
      minLength = 0,
      allowEmpty = true,
      pattern = null,
      defaultValue = ''
    } = options;

    if (input === null || input === undefined) {
      return defaultValue;
    }

    const str = String(input).trim();

    if (!allowEmpty && str.length === 0) {
      throw new Error('String cannot be empty');
    }

    if (str.length < minLength) {
      throw new Error(`String length ${str.length} is below minimum ${minLength}`);
    }

    if (str.length > maxLength) {
      throw new Error(`String length ${str.length} exceeds maximum ${maxLength}`);
    }

    if (pattern && !pattern.test(str)) {
      throw new Error(`String does not match required pattern`);
    }

    // Check for potential XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];

    if (xssPatterns.some(pattern => pattern.test(str))) {
      throw new Error('String contains potentially harmful content');
    }

    return str;
  }

  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {string}
   */
  static validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitizedEmail = this.validateString(email, {
      maxLength: 254,
      pattern: emailPattern
    });

    return sanitizedEmail.toLowerCase();
  }

  /**
   * Validate currency amount
   * @param {any} amount - Amount to validate
   * @returns {number}
   */
  static validateCurrency(amount) {
    return this.validateNumber(amount, {
      min: 0,
      max: 9999999.99,
      allowFloat: true
    });
  }

  /**
   * Validate percentage value
   * @param {any} percentage - Percentage to validate
   * @returns {number}
   */
  static validatePercentage(percentage) {
    return this.validateNumber(percentage, {
      min: 0,
      max: 100,
      allowFloat: true
    });
  }

  /**
   * Sanitize object for localStorage
   * @param {Object} obj - Object to sanitize
   * @returns {Object}
   */
  static sanitizeForStorage(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return {};
    }

    const sanitized = {};

    Object.entries(obj).forEach(([key, value]) => {
      try {
        // Validate key
        const sanitizedKey = this.validateString(key, { maxLength: 100 });

        // Sanitize value based on type
        if (typeof value === 'string') {
          sanitized[sanitizedKey] = this.validateString(value, { maxLength: 10000 });
        } else if (typeof value === 'number') {
          sanitized[sanitizedKey] = this.validateNumber(value);
        } else if (typeof value === 'boolean') {
          sanitized[sanitizedKey] = Boolean(value);
        } else if (Array.isArray(value)) {
          sanitized[sanitizedKey] = value.map(item =>
            typeof item === 'object' ? this.sanitizeForStorage(item) : item
          );
        } else if (typeof value === 'object') {
          sanitized[sanitizedKey] = this.sanitizeForStorage(value);
        }
      } catch (error) {
        console.warn(`Skipping invalid property ${key}:`, error.message);
      }
    });

    return sanitized;
  }
}