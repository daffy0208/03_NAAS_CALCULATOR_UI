/**
 * Data Validation and Corruption Handler
 * Provides comprehensive data validation, schema checking, and corruption recovery
 */

export class DataValidator {
  static schemas = new Map();
  static corruptionDetectors = [];
  static recoveryStrategies = new Map();

  /**
   * Initialize data validation system
   */
  static init() {
    this.defineDefaultSchemas();
    this.defineCorruptionDetectors();
    this.defineRecoveryStrategies();
    this.setupStorageInterceptors();
  }

  /**
   * Define default schemas for common data types
   */
  static defineDefaultSchemas() {
    // Component data schema
    this.schemas.set('component', {
      type: 'object',
      required: ['id', 'name', 'type'],
      properties: {
        id: { type: 'string', minLength: 1 },
        name: { type: 'string', minLength: 1 },
        type: { type: 'string', enum: ['prtg', 'capital', 'support', 'onboarding', 'assessment', 'admin', 'otherCosts', 'enhancedSupport'] },
        params: { type: 'object' },
        results: { type: 'object' },
        timestamp: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}' }
      }
    });

    // Quote data schema
    this.schemas.set('quote', {
      type: 'object',
      required: ['id', 'components', 'totals'],
      properties: {
        id: { type: 'string', minLength: 1 },
        name: { type: 'string' },
        components: { type: 'object' },
        totals: {
          type: 'object',
          required: ['monthly', 'annual', 'threeYear', 'oneTime'],
          properties: {
            monthly: { type: 'number', minimum: 0 },
            annual: { type: 'number', minimum: 0 },
            threeYear: { type: 'number', minimum: 0 },
            oneTime: { type: 'number', minimum: 0 }
          }
        },
        timestamp: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}' }
      }
    });

    // Calculation results schema
    this.schemas.set('calculation', {
      type: 'object',
      required: ['totals', 'breakdown'],
      properties: {
        totals: {
          type: 'object',
          required: ['monthly', 'annual', 'threeYear', 'oneTime'],
          properties: {
            monthly: { type: 'number', minimum: 0 },
            annual: { type: 'number', minimum: 0 },
            threeYear: { type: 'number', minimum: 0 },
            oneTime: { type: 'number', minimum: 0 }
          }
        },
        breakdown: { type: 'object' },
        error: { type: 'boolean' }
      }
    });
  }

  /**
   * Define corruption detection patterns
   */
  static defineCorruptionDetectors() {
    // Detect invalid JSON
    this.corruptionDetectors.push({
      name: 'invalid_json',
      detect: (data) => {
        if (typeof data === 'string') {
          try {
            JSON.parse(data);
            return false;
          } catch {
            return true;
          }
        }
        return false;
      }
    });

    // Detect negative prices
    this.corruptionDetectors.push({
      name: 'negative_prices',
      detect: (data) => {
        if (data && typeof data === 'object' && data.totals) {
          const totals = data.totals;
          return Object.values(totals).some(value =>
            typeof value === 'number' && value < 0
          );
        }
        return false;
      }
    });

    // Detect missing required fields
    this.corruptionDetectors.push({
      name: 'missing_required_fields',
      detect: (data, schemaName) => {
        const schema = this.schemas.get(schemaName);
        if (!schema || !schema.required) return false;

        return schema.required.some(field =>
          !(field in data) || data[field] === null || data[field] === undefined
        );
      }
    });

    // Detect circular references
    this.corruptionDetectors.push({
      name: 'circular_reference',
      detect: (data) => {
        try {
          JSON.stringify(data);
          return false;
        } catch (error) {
          return error.message.includes('circular');
        }
      }
    });

    // Detect excessive nesting
    this.corruptionDetectors.push({
      name: 'excessive_nesting',
      detect: (data) => {
        const maxDepth = 10;
        const getDepth = (obj, depth = 0) => {
          if (depth > maxDepth) return depth;
          if (typeof obj !== 'object' || obj === null) return depth;

          const depths = Object.values(obj).map(value => getDepth(value, depth + 1));
          return Math.max(depth, ...depths);
        };

        return getDepth(data) > maxDepth;
      }
    });
  }

  /**
   * Define recovery strategies
   */
  static defineRecoveryStrategies() {
    // Recovery for invalid JSON
    this.recoveryStrategies.set('invalid_json', (data) => {
      console.log('Attempting to recover from invalid JSON');

      // Try to fix common JSON issues
      let fixed = data
        .replace(/'/g, '"')  // Single quotes to double quotes
        .replace(/,\s*}/g, '}')  // Trailing commas
        .replace(/,\s*]/g, ']');  // Trailing commas in arrays

      try {
        return JSON.parse(fixed);
      } catch {
        // Return empty object as fallback
        return {};
      }
    });

    // Recovery for negative prices
    this.recoveryStrategies.set('negative_prices', (data) => {
      console.log('Fixing negative prices in data');

      if (data.totals) {
        Object.keys(data.totals).forEach(key => {
          if (typeof data.totals[key] === 'number' && data.totals[key] < 0) {
            data.totals[key] = 0;
          }
        });
      }

      return data;
    });

    // Recovery for missing required fields
    this.recoveryStrategies.set('missing_required_fields', (data, schemaName) => {
      console.log('Adding missing required fields');

      const schema = this.schemas.get(schemaName);
      if (!schema?.required) return data;

      const recovered = { ...data };

      schema.required.forEach(field => {
        if (!(field in recovered) || recovered[field] === null || recovered[field] === undefined) {
          // Set default value based on schema
          const fieldSchema = schema.properties?.[field];
          recovered[field] = this.getDefaultValue(fieldSchema);
        }
      });

      return recovered;
    });

    // Recovery for circular references
    this.recoveryStrategies.set('circular_reference', (data) => {
      console.log('Removing circular references');

      const seen = new WeakSet();
      const cleanData = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (seen.has(obj)) return '[Circular Reference Removed]';

        seen.add(obj);
        const cleaned = Array.isArray(obj) ? [] : {};

        Object.keys(obj).forEach(key => {
          cleaned[key] = cleanData(obj[key]);
        });

        return cleaned;
      };

      return cleanData(data);
    });
  }

  /**
   * Validate data against schema
   * @param {any} data - Data to validate
   * @param {string} schemaName - Schema name
   * @returns {Object} - Validation result
   */
  static validateData(data, schemaName) {
    try {
      const schema = this.schemas.get(schemaName);
      if (!schema) {
        return {
          valid: true,
          errors: [],
          warnings: [`No schema found for ${schemaName}`]
        };
      }

      const errors = [];
      const warnings = [];

      // Type validation
      if (!this.validateType(data, schema.type)) {
        errors.push(`Expected type ${schema.type}, got ${typeof data}`);
      }

      // Required fields validation
      if (schema.required && schema.type === 'object') {
        schema.required.forEach(field => {
          if (!(field in data) || data[field] === null || data[field] === undefined) {
            errors.push(`Required field '${field}' is missing or null`);
          }
        });
      }

      // Property validation
      if (schema.properties && schema.type === 'object' && typeof data === 'object') {
        Object.keys(schema.properties).forEach(propName => {
          if (propName in data) {
            const propResult = this.validateProperty(data[propName], schema.properties[propName], propName);
            errors.push(...propResult.errors);
            warnings.push(...propResult.warnings);
          }
        });
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Error during data validation:', error);
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate property against schema
   * @param {any} value - Property value
   * @param {Object} propSchema - Property schema
   * @param {string} propName - Property name
   * @returns {Object} - Validation result
   */
  static validateProperty(value, propSchema, propName) {
    const errors = [];
    const warnings = [];

    // Type validation
    if (propSchema.type && !this.validateType(value, propSchema.type)) {
      errors.push(`Property '${propName}': expected type ${propSchema.type}, got ${typeof value}`);
    }

    // Enum validation
    if (propSchema.enum && !propSchema.enum.includes(value)) {
      errors.push(`Property '${propName}': value must be one of [${propSchema.enum.join(', ')}]`);
    }

    // String validations
    if (typeof value === 'string') {
      if (propSchema.minLength && value.length < propSchema.minLength) {
        errors.push(`Property '${propName}': minimum length is ${propSchema.minLength}`);
      }
      if (propSchema.maxLength && value.length > propSchema.maxLength) {
        errors.push(`Property '${propName}': maximum length is ${propSchema.maxLength}`);
      }
      if (propSchema.pattern && !new RegExp(propSchema.pattern).test(value)) {
        errors.push(`Property '${propName}': does not match required pattern`);
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (propSchema.minimum !== undefined && value < propSchema.minimum) {
        errors.push(`Property '${propName}': minimum value is ${propSchema.minimum}`);
      }
      if (propSchema.maximum !== undefined && value > propSchema.maximum) {
        errors.push(`Property '${propName}': maximum value is ${propSchema.maximum}`);
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate type
   * @param {any} value - Value to validate
   * @param {string} expectedType - Expected type
   * @returns {boolean} - Whether type is valid
   */
  static validateType(value, expectedType) {
    switch (expectedType) {
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'null':
        return value === null;
      default:
        return true;
    }
  }

  /**
   * Get default value for schema type
   * @param {Object} fieldSchema - Field schema
   * @returns {any} - Default value
   */
  static getDefaultValue(fieldSchema) {
    if (!fieldSchema) return null;

    switch (fieldSchema.type) {
      case 'string':
        return '';
      case 'number':
        return fieldSchema.minimum || 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return null;
    }
  }

  /**
   * Check for data corruption
   * @param {any} data - Data to check
   * @param {string} schemaName - Schema name (optional)
   * @returns {Array} - Array of detected corruption types
   */
  static detectCorruption(data, schemaName = null) {
    const corruptions = [];

    this.corruptionDetectors.forEach(detector => {
      try {
        if (detector.detect(data, schemaName)) {
          corruptions.push(detector.name);
        }
      } catch (error) {
        console.error(`Error in corruption detector ${detector.name}:`, error);
      }
    });

    return corruptions;
  }

  /**
   * Attempt to recover corrupted data
   * @param {any} data - Corrupted data
   * @param {Array} corruptions - Array of corruption types
   * @param {string} schemaName - Schema name (optional)
   * @returns {any} - Recovered data
   */
  static recoverData(data, corruptions, schemaName = null) {
    let recovered = data;

    corruptions.forEach(corruption => {
      const strategy = this.recoveryStrategies.get(corruption);
      if (strategy) {
        try {
          recovered = strategy(recovered, schemaName);
        } catch (error) {
          console.error(`Error in recovery strategy ${corruption}:`, error);
        }
      }
    });

    return recovered;
  }

  /**
   * Validate and sanitize data
   * @param {any} data - Data to validate and sanitize
   * @param {string} schemaName - Schema name
   * @returns {Object} - Result with sanitized data and validation info
   */
  static validateAndSanitize(data, schemaName) {
    try {
      // First check for corruption
      const corruptions = this.detectCorruption(data, schemaName);

      let sanitized = data;
      if (corruptions.length > 0) {
        console.warn(`Data corruption detected: ${corruptions.join(', ')}`);
        sanitized = this.recoverData(data, corruptions, schemaName);

        // Use error handler if available
        if (window.ErrorHandler && typeof window.ErrorHandler.handleError === 'function') {
          window.ErrorHandler.handleError(new Error(`Data corruption detected: ${corruptions.join(', ')}`), {
            operation: 'data_validation',
            corruptions,
            schemaName,
            severity: 'medium'
          });
        }
      }

      // Validate the sanitized data
      const validation = this.validateData(sanitized, schemaName);

      return {
        data: sanitized,
        validation,
        corruptions,
        recovered: corruptions.length > 0
      };

    } catch (error) {
      console.error('Error during validation and sanitization:', error);

      // Use error handler if available
      if (window.ErrorHandler && typeof window.ErrorHandler.handleError === 'function') {
        window.ErrorHandler.handleError(error, {
          operation: 'data_validation',
          schemaName,
          severity: 'high'
        });
      }

      return {
        data: null,
        validation: { valid: false, errors: [error.message], warnings: [] },
        corruptions: ['validation_error'],
        recovered: false
      };
    }
  }

  /**
   * Setup storage interceptors for automatic validation
   */
  static setupStorageInterceptors() {
    // Intercept localStorage.setItem
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      try {
        // Only validate JSON data
        if (key.includes('naas_') || key.includes('quote_')) {
          const parsed = JSON.parse(value);
          const schemaName = this.inferSchemaName(key);

          if (schemaName) {
            const result = this.validateAndSanitize(parsed, schemaName);
            if (!result.validation.valid) {
              console.warn(`Invalid data being stored in ${key}:`, result.validation.errors);
            }
            value = JSON.stringify(result.data);
          }
        }
      } catch (error) {
        // If JSON parsing fails, proceed with original value
        console.warn('Failed to validate data for storage:', error);
      }

      return originalSetItem.call(localStorage, key, value);
    };

    // Intercept localStorage.getItem
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = (key) => {
      const value = originalGetItem.call(localStorage, key);

      if (value && (key.includes('naas_') || key.includes('quote_'))) {
        try {
          const parsed = JSON.parse(value);
          const schemaName = this.inferSchemaName(key);

          if (schemaName) {
            const result = this.validateAndSanitize(parsed, schemaName);
            if (result.recovered || !result.validation.valid) {
              console.warn(`Corrupted data recovered from ${key}`);
              // Re-save the cleaned data
              originalSetItem.call(localStorage, key, JSON.stringify(result.data));
            }
            return JSON.stringify(result.data);
          }
        } catch (error) {
          console.error(`Failed to validate retrieved data from ${key}:`, error);
        }
      }

      return value;
    };
  }

  /**
   * Infer schema name from storage key
   * @param {string} key - Storage key
   * @returns {string|null} - Schema name
   */
  static inferSchemaName(key) {
    if (key.includes('component')) return 'component';
    if (key.includes('quote')) return 'quote';
    if (key.includes('calculation')) return 'calculation';
    return null;
  }

  /**
   * Add custom schema
   * @param {string} name - Schema name
   * @param {Object} schema - Schema definition
   */
  static addSchema(name, schema) {
    this.schemas.set(name, schema);
  }

  /**
   * Add custom corruption detector
   * @param {string} name - Detector name
   * @param {Function} detector - Detector function
   */
  static addCorruptionDetector(name, detector) {
    this.corruptionDetectors.push({ name, detect: detector });
  }

  /**
   * Add custom recovery strategy
   * @param {string} corruption - Corruption type
   * @param {Function} strategy - Recovery strategy function
   */
  static addRecoveryStrategy(corruption, strategy) {
    this.recoveryStrategies.set(corruption, strategy);
  }
}

// Initialize data validation when module loads
if (typeof window !== 'undefined') {
  DataValidator.init();
}