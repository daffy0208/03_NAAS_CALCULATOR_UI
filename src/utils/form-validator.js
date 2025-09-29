/**
 * Form Validation Utility
 * Provides comprehensive form validation with error handling
 */

export class FormValidator {
  static validationRules = new Map();
  static errorMessages = new Map();

  /**
   * Initialize form validation
   */
  static init() {
    this.setupGlobalValidation();
    this.defineDefaultRules();
    this.defineDefaultMessages();
  }

  /**
   * Setup global form validation
   */
  static setupGlobalValidation() {
    // Listen for form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.tagName === 'FORM') {
        if (!this.validateForm(form)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    });

    // Listen for input changes
    document.addEventListener('input', (event) => {
      const input = event.target;
      if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA' || input.tagName === 'SELECT') {
        this.validateField(input);
      }
    });

    // Listen for blur events
    document.addEventListener('blur', (event) => {
      const input = event.target;
      if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA' || input.tagName === 'SELECT') {
        this.validateField(input, true);
      }
    }, true);
  }

  /**
   * Define default validation rules
   */
  static defineDefaultRules() {
    this.validationRules.set('required', (value, element) => {
      if (element.type === 'checkbox' || element.type === 'radio') {
        return element.checked;
      }
      return value != null && value.toString().trim().length > 0;
    });

    this.validationRules.set('email', (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !value || emailRegex.test(value);
    });

    this.validationRules.set('number', (value) => {
      return !value || !isNaN(value) && isFinite(value);
    });

    this.validationRules.set('positiveNumber', (value) => {
      return !value || (!isNaN(value) && isFinite(value) && parseFloat(value) >= 0);
    });

    this.validationRules.set('integer', (value) => {
      return !value || (Number.isInteger(parseFloat(value)) && isFinite(value));
    });

    this.validationRules.set('minLength', (value, element, param) => {
      return !value || value.toString().length >= parseInt(param);
    });

    this.validationRules.set('maxLength', (value, element, param) => {
      return !value || value.toString().length <= parseInt(param);
    });

    this.validationRules.set('min', (value, element, param) => {
      return !value || parseFloat(value) >= parseFloat(param);
    });

    this.validationRules.set('max', (value, element, param) => {
      return !value || parseFloat(value) <= parseFloat(param);
    });

    this.validationRules.set('pattern', (value, element, param) => {
      return !value || new RegExp(param).test(value);
    });
  }

  /**
   * Define default error messages
   */
  static defineDefaultMessages() {
    this.errorMessages.set('required', 'This field is required.');
    this.errorMessages.set('email', 'Please enter a valid email address.');
    this.errorMessages.set('number', 'Please enter a valid number.');
    this.errorMessages.set('positiveNumber', 'Please enter a positive number.');
    this.errorMessages.set('integer', 'Please enter a whole number.');
    this.errorMessages.set('minLength', 'Please enter at least {param} characters.');
    this.errorMessages.set('maxLength', 'Please enter no more than {param} characters.');
    this.errorMessages.set('min', 'Please enter a value greater than or equal to {param}.');
    this.errorMessages.set('max', 'Please enter a value less than or equal to {param}.');
    this.errorMessages.set('pattern', 'Please enter a value in the correct format.');
  }

  /**
   * Validate a single form field
   * @param {HTMLElement} field - Field to validate
   * @param {boolean} showError - Whether to show error immediately
   * @returns {boolean} - Validation result
   */
  static validateField(field, showError = false) {
    try {
      const value = this.getFieldValue(field);
      const rules = this.getFieldRules(field);
      const errors = [];

      // Clear previous validation state
      this.clearFieldError(field);

      // Apply each validation rule
      for (const [ruleName, param] of rules) {
        const rule = this.validationRules.get(ruleName);
        if (rule && !rule(value, field, param)) {
          const message = this.getErrorMessage(ruleName, param, field);
          errors.push(message);

          // Show error if requested or if it's a critical error
          if (showError || ruleName === 'required') {
            this.showFieldError(field, message);
          }

          break; // Show only first error
        }
      }

      // Update field validation state
      if (errors.length > 0) {
        field.classList.add('invalid');
        field.classList.remove('valid');
        field.setAttribute('aria-invalid', 'true');
        return false;
      } else {
        field.classList.add('valid');
        field.classList.remove('invalid');
        field.setAttribute('aria-invalid', 'false');
        return true;
      }

    } catch (error) {
      console.error('Error validating field:', error);

      // Use error handler if available
      if (window.ErrorHandler && typeof window.ErrorHandler.handleError === 'function') {
        window.ErrorHandler.handleError(error, {
          operation: 'field_validation',
          fieldName: field.name || field.id,
          severity: 'low'
        });
      }

      return false;
    }
  }

  /**
   * Validate entire form
   * @param {HTMLFormElement} form - Form to validate
   * @returns {boolean} - Validation result
   */
  static validateForm(form) {
    try {
      const fields = form.querySelectorAll('input, textarea, select');
      let isValid = true;
      const errors = [];

      // Validate each field
      fields.forEach(field => {
        if (!this.validateField(field, true)) {
          isValid = false;
          errors.push({
            field: field.name || field.id,
            message: this.getFieldError(field)
          });
        }
      });

      // Show form-level error if needed
      if (!isValid) {
        this.showFormError(form, `Please correct ${errors.length} error(s) in the form.`);

        // Focus first invalid field
        const firstInvalidField = form.querySelector('.invalid');
        if (firstInvalidField) {
          firstInvalidField.focus();
        }
      } else {
        this.clearFormError(form);
      }

      return isValid;

    } catch (error) {
      console.error('Error validating form:', error);

      // Use error handler if available
      if (window.ErrorHandler && typeof window.ErrorHandler.handleError === 'function') {
        window.ErrorHandler.handleError(error, {
          operation: 'form_validation',
          formId: form.id,
          severity: 'medium'
        });
      }

      return false;
    }
  }

  /**
   * Get field value
   * @param {HTMLElement} field - Form field
   * @returns {string} - Field value
   */
  static getFieldValue(field) {
    if (field.type === 'checkbox') {
      return field.checked;
    } else if (field.type === 'radio') {
      const form = field.closest('form');
      const radioGroup = form ? form.querySelectorAll(`input[name="${field.name}"]:checked`) : [];
      return radioGroup.length > 0 ? radioGroup[0].value : '';
    } else {
      return field.value;
    }
  }

  /**
   * Get validation rules for a field
   * @param {HTMLElement} field - Form field
   * @returns {Array} - Array of [ruleName, parameter] pairs
   */
  static getFieldRules(field) {
    const rules = [];

    // HTML5 validation attributes
    if (field.required) rules.push(['required']);
    if (field.type === 'email') rules.push(['email']);
    if (field.type === 'number') rules.push(['number']);
    if (field.min) rules.push(['min', field.min]);
    if (field.max) rules.push(['max', field.max]);
    if (field.minLength) rules.push(['minLength', field.minLength]);
    if (field.maxLength) rules.push(['maxLength', field.maxLength]);
    if (field.pattern) rules.push(['pattern', field.pattern]);

    // Custom validation attributes
    if (field.dataset.validate) {
      const customRules = field.dataset.validate.split(',');
      customRules.forEach(rule => {
        const [ruleName, param] = rule.split(':');
        rules.push([ruleName.trim(), param ? param.trim() : undefined]);
      });
    }

    return rules;
  }

  /**
   * Get error message for a rule
   * @param {string} ruleName - Rule name
   * @param {string} param - Rule parameter
   * @param {HTMLElement} field - Form field
   * @returns {string} - Error message
   */
  static getErrorMessage(ruleName, param, field) {
    // Check for custom error message on field
    const customMessage = field.dataset[`error${ruleName.charAt(0).toUpperCase()}${ruleName.slice(1)}`];
    if (customMessage) {
      return customMessage.replace('{param}', param);
    }

    // Use default message
    const defaultMessage = this.errorMessages.get(ruleName) || 'Invalid input.';
    return defaultMessage.replace('{param}', param);
  }

  /**
   * Show field error
   * @param {HTMLElement} field - Form field
   * @param {string} message - Error message
   */
  static showFieldError(field, message) {
    this.clearFieldError(field);

    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
      color: #dc2626;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      display: block;
    `;

    field.parentNode.appendChild(errorElement);
    field.setAttribute('aria-describedby', errorElement.id = `${field.id || field.name}-error`);
  }

  /**
   * Clear field error
   * @param {HTMLElement} field - Form field
   */
  static clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
    field.removeAttribute('aria-describedby');
  }

  /**
   * Get field error message
   * @param {HTMLElement} field - Form field
   * @returns {string} - Error message
   */
  static getFieldError(field) {
    const errorElement = field.parentNode.querySelector('.field-error');
    return errorElement ? errorElement.textContent : '';
  }

  /**
   * Show form-level error
   * @param {HTMLFormElement} form - Form element
   * @param {string} message - Error message
   */
  static showFormError(form, message) {
    this.clearFormError(form);

    const errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 0.75rem;
      border-radius: 0.375rem;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    `;

    form.insertBefore(errorElement, form.firstChild);
  }

  /**
   * Clear form error
   * @param {HTMLFormElement} form - Form element
   */
  static clearFormError(form) {
    const existingError = form.querySelector('.form-error');
    if (existingError) {
      existingError.remove();
    }
  }

  /**
   * Add custom validation rule
   * @param {string} name - Rule name
   * @param {Function} validator - Validation function
   * @param {string} message - Default error message
   */
  static addRule(name, validator, message) {
    this.validationRules.set(name, validator);
    if (message) {
      this.errorMessages.set(name, message);
    }
  }
}

// Initialize form validation when module loads
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FormValidator.init());
  } else {
    FormValidator.init();
  }
}

// Add CSS for validation states
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .invalid {
      border-color: #dc2626 !important;
      box-shadow: 0 0 0 1px #dc2626 !important;
    }

    .valid {
      border-color: #059669 !important;
      box-shadow: 0 0 0 1px #059669 !important;
    }

    .field-error {
      color: #dc2626;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      display: block;
    }

    .form-error {
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 0.75rem;
      border-radius: 0.375rem;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }
  `;
  document.head.appendChild(style);
}