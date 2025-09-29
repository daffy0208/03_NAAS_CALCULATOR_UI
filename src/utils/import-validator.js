/**
 * NaaS Pricing Calculator - Import Validation Schema
 * Provides strict boundary checking and data validation for imports
 */

class ImportValidator {
    constructor() {
        // Define validation schemas for each component type
        this.schemas = {
            prtg: {
                sensors: {
                    type: 'number',
                    min: 1,
                    max: 50000,
                    required: true,
                    description: 'Number of PRTG sensors (1-50,000)'
                },
                locations: {
                    type: 'number',
                    min: 1,
                    max: 1000,
                    required: false,
                    default: 1,
                    description: 'Number of monitoring locations (1-1,000)'
                },
                alertRecipients: {
                    type: 'number',
                    min: 1,
                    max: 100,
                    required: false,
                    default: 10,
                    description: 'Number of alert recipients (1-100)'
                },
                serviceLevel: {
                    type: 'enum',
                    values: ['standard', 'enhanced', 'enterprise'],
                    required: false,
                    default: 'enhanced',
                    description: 'Service level (standard, enhanced, enterprise)'
                }
            },
            capital: {
                equipment: {
                    type: 'array',
                    required: true,
                    minItems: 1,
                    maxItems: 100,
                    itemSchema: {
                        type: {
                            type: 'enum',
                            values: [
                                'router_small', 'router_medium', 'router_large', 'router_enterprise',
                                'switch_24port', 'switch_48port', 'switch_managed', 'switch_core',
                                'firewall_basic', 'firewall_advanced', 'firewall_enterprise',
                                'ap_indoor', 'ap_outdoor', 'ap_enterprise', 'ap_mesh',
                                'server_1u', 'server_2u', 'server_blade', 'storage_nas'
                            ],
                            required: true
                        },
                        quantity: {
                            type: 'number',
                            min: 1,
                            max: 1000,
                            required: true
                        },
                        customCost: {
                            type: 'number',
                            min: 0,
                            max: 1000000,
                            required: false
                        }
                    },
                    description: 'Array of equipment items'
                },
                financing: {
                    type: 'boolean',
                    required: false,
                    default: true,
                    description: 'Whether to include financing'
                },
                termMonths: {
                    type: 'number',
                    min: 12,
                    max: 84,
                    required: false,
                    default: 36,
                    description: 'Financing term in months (12-84)'
                }
            },
            support: {
                level: {
                    type: 'enum',
                    values: ['basic', 'standard', 'enhanced', 'enterprise'],
                    required: false,
                    default: 'enhanced',
                    description: 'Support level'
                },
                deviceCount: {
                    type: 'number',
                    min: 1,
                    max: 10000,
                    required: false,
                    default: 10,
                    description: 'Number of supported devices (1-10,000)'
                },
                termMonths: {
                    type: 'number',
                    min: 12,
                    max: 60,
                    required: false,
                    default: 36,
                    description: 'Support contract term in months (12-60)'
                },
                includeEscalation: {
                    type: 'boolean',
                    required: false,
                    default: true,
                    description: 'Include CPI escalation clause'
                }
            },
            onboarding: {
                complexity: {
                    type: 'enum',
                    values: ['simple', 'standard', 'complex', 'enterprise'],
                    required: false,
                    default: 'standard',
                    description: 'Implementation complexity level'
                },
                sites: {
                    type: 'number',
                    min: 1,
                    max: 100,
                    required: false,
                    default: 1,
                    description: 'Number of sites (1-100)'
                },
                includeAssessment: {
                    type: 'boolean',
                    required: false,
                    default: true,
                    description: 'Include pre-implementation assessment'
                }
            },
            pbsFoundation: {
                userCount: {
                    type: 'number',
                    min: 1,
                    max: 10000,
                    required: false,
                    default: 100,
                    description: 'Number of users (1-10,000)'
                },
                serviceLevel: {
                    type: 'enum',
                    values: ['basic', 'standard', 'premium'],
                    required: false,
                    default: 'standard',
                    description: 'PBS service level'
                }
            }
        };

        // Define global validation rules
        this.globalRules = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedExtensions: ['.xlsx', '.xls', '.csv'],
            maxRowsPerSheet: 10000,
            maxColumnsPerSheet: 100,
            timeoutMs: 30000 // 30 second timeout for processing
        };

        this.validationResults = [];
    }

    /**
     * Validate imported data against schemas
     */
    validateImportData(data, componentType) {
        this.validationResults = [];

        if (!componentType || !this.schemas[componentType]) {
            return this.createValidationResult(false, `Unknown component type: ${componentType}`, []);
        }

        const schema = this.schemas[componentType];
        const validatedData = {};
        const errors = [];
        const warnings = [];

        // Validate each field in the schema
        for (const [fieldName, fieldSchema] of Object.entries(schema)) {
            const result = this.validateField(data, fieldName, fieldSchema, componentType);

            if (result.isValid) {
                validatedData[fieldName] = result.value;
            } else {
                errors.push(...result.errors);
            }

            warnings.push(...result.warnings);
        }

        // Check for unknown fields in data
        const unknownFields = Object.keys(data).filter(key => !schema[key]);
        if (unknownFields.length > 0) {
            warnings.push(`Unknown fields will be ignored: ${unknownFields.join(', ')}`);
        }

        const isValid = errors.length === 0;
        return this.createValidationResult(isValid, isValid ? 'Validation successful' : 'Validation failed', errors, warnings, validatedData);
    }

    /**
     * Validate individual field against its schema
     */
    validateField(data, fieldName, fieldSchema, componentType) {
        const value = data[fieldName];
        const errors = [];
        const warnings = [];
        let processedValue = value;

        // Check if required field is missing
        if (fieldSchema.required && (value === undefined || value === null || value === '')) {
            errors.push(`Required field '${fieldName}' is missing for component '${componentType}'`);
            return { isValid: false, errors, warnings };
        }

        // Use default value if field is missing and not required
        if ((value === undefined || value === null || value === '') && fieldSchema.default !== undefined) {
            processedValue = fieldSchema.default;
            warnings.push(`Using default value '${fieldSchema.default}' for field '${fieldName}'`);
        }

        // Skip validation if field is optional and empty
        if (!fieldSchema.required && (processedValue === undefined || processedValue === null || processedValue === '')) {
            return { isValid: true, value: processedValue, errors, warnings };
        }

        // Type validation
        const typeValidation = this.validateType(processedValue, fieldSchema, fieldName, componentType);
        if (!typeValidation.isValid) {
            errors.push(...typeValidation.errors);
            return { isValid: false, errors, warnings };
        }

        processedValue = typeValidation.value;

        return { isValid: true, value: processedValue, errors, warnings };
    }

    /**
     * Validate data type and constraints
     */
    validateType(value, schema, fieldName, componentType) {
        const errors = [];
        let processedValue = value;

        switch (schema.type) {
            case 'number':
                processedValue = this.validateNumber(value, schema, fieldName, errors);
                break;
            case 'string':
                processedValue = this.validateString(value, schema, fieldName, errors);
                break;
            case 'boolean':
                processedValue = this.validateBoolean(value, schema, fieldName, errors);
                break;
            case 'enum':
                processedValue = this.validateEnum(value, schema, fieldName, errors);
                break;
            case 'array':
                processedValue = this.validateArray(value, schema, fieldName, componentType, errors);
                break;
            default:
                errors.push(`Unknown type '${schema.type}' for field '${fieldName}'`);
        }

        return { isValid: errors.length === 0, value: processedValue, errors };
    }

    validateNumber(value, schema, fieldName, errors) {
        let num = value;

        // Convert to number if it's a string
        if (typeof value === 'string') {
            num = parseFloat(value);
        }

        if (isNaN(num)) {
            errors.push(`Field '${fieldName}' must be a valid number, got '${value}'`);
            return value;
        }

        // Check min/max constraints
        if (schema.min !== undefined && num < schema.min) {
            errors.push(`Field '${fieldName}' must be at least ${schema.min}, got ${num}`);
        }

        if (schema.max !== undefined && num > schema.max) {
            errors.push(`Field '${fieldName}' must be at most ${schema.max}, got ${num}`);
        }

        // Check if integer is required
        if (schema.integer && !Number.isInteger(num)) {
            errors.push(`Field '${fieldName}' must be an integer, got ${num}`);
        }

        return num;
    }

    validateString(value, schema, fieldName, errors) {
        if (typeof value !== 'string') {
            errors.push(`Field '${fieldName}' must be a string, got ${typeof value}`);
            return value;
        }

        // Check length constraints
        if (schema.minLength !== undefined && value.length < schema.minLength) {
            errors.push(`Field '${fieldName}' must be at least ${schema.minLength} characters long`);
        }

        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            errors.push(`Field '${fieldName}' must be at most ${schema.maxLength} characters long`);
        }

        // Check pattern if provided
        if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
            errors.push(`Field '${fieldName}' does not match required pattern`);
        }

        return value;
    }

    validateBoolean(value, schema, fieldName, errors) {
        if (typeof value === 'boolean') {
            return value;
        }

        // Try to convert common boolean representations
        if (typeof value === 'string') {
            const lower = value.toLowerCase().trim();
            if (['true', '1', 'yes', 'on'].includes(lower)) {
                return true;
            }
            if (['false', '0', 'no', 'off'].includes(lower)) {
                return false;
            }
        }

        if (typeof value === 'number') {
            return value !== 0;
        }

        errors.push(`Field '${fieldName}' must be a boolean value, got '${value}'`);
        return value;
    }

    validateEnum(value, schema, fieldName, errors) {
        const stringValue = String(value).toLowerCase().trim();
        const validValues = schema.values.map(v => v.toLowerCase());

        if (!validValues.includes(stringValue)) {
            errors.push(`Field '${fieldName}' must be one of [${schema.values.join(', ')}], got '${value}'`);
            return value;
        }

        // Return the original case from schema
        const index = validValues.indexOf(stringValue);
        return schema.values[index];
    }

    validateArray(value, schema, fieldName, componentType, errors) {
        if (!Array.isArray(value)) {
            errors.push(`Field '${fieldName}' must be an array, got ${typeof value}`);
            return value;
        }

        // Check array length constraints
        if (schema.minItems !== undefined && value.length < schema.minItems) {
            errors.push(`Field '${fieldName}' must have at least ${schema.minItems} items, got ${value.length}`);
        }

        if (schema.maxItems !== undefined && value.length > schema.maxItems) {
            errors.push(`Field '${fieldName}' must have at most ${schema.maxItems} items, got ${value.length}`);
        }

        // Validate each item if itemSchema is provided
        if (schema.itemSchema) {
            const validatedItems = [];
            for (let i = 0; i < value.length; i++) {
                const item = value[i];
                const itemErrors = [];

                for (const [itemField, itemFieldSchema] of Object.entries(schema.itemSchema)) {
                    const fieldResult = this.validateField(item, itemField, itemFieldSchema, componentType);
                    if (!fieldResult.isValid) {
                        itemErrors.push(...fieldResult.errors.map(err => `Item ${i}: ${err}`));
                    } else {
                        if (!validatedItems[i]) validatedItems[i] = {};
                        validatedItems[i][itemField] = fieldResult.value;
                    }
                }

                if (itemErrors.length > 0) {
                    errors.push(...itemErrors);
                } else if (validatedItems[i]) {
                    // Only include items that passed validation
                }
            }

            return errors.length > 0 ? value : validatedItems;
        }

        return value;
    }

    /**
     * Validate file before processing
     */
    validateFile(file) {
        const errors = [];
        const warnings = [];

        // Check file size
        if (file.size > this.globalRules.maxFileSize) {
            errors.push(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (${this.globalRules.maxFileSize / 1024 / 1024}MB)`);
        }

        // Check file extension
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.globalRules.allowedExtensions.includes(fileExtension)) {
            errors.push(`File extension '${fileExtension}' is not allowed. Allowed extensions: ${this.globalRules.allowedExtensions.join(', ')}`);
        }

        // Check filename for security issues
        if (this.containsSuspiciousPatterns(file.name)) {
            errors.push(`Filename contains potentially unsafe characters`);
        }

        return this.createValidationResult(errors.length === 0, errors.length === 0 ? 'File validation successful' : 'File validation failed', errors, warnings);
    }

    /**
     * Check for suspicious patterns in filenames
     */
    containsSuspiciousPatterns(filename) {
        const suspiciousPatterns = [
            /\.\.|\/|\\|<|>|:|"|'|\||\?|\*/,  // Path traversal and special chars
            /script|javascript|vbs|exe|bat|cmd/i  // Executable extensions
        ];

        return suspiciousPatterns.some(pattern => pattern.test(filename));
    }

    /**
     * Validate CSV/Excel data structure
     */
    validateDataStructure(data, fileType) {
        const errors = [];
        const warnings = [];

        if (fileType === 'excel') {
            // Validate Excel workbook structure
            if (!data.SheetNames || data.SheetNames.length === 0) {
                errors.push('Excel file contains no worksheets');
            }

            for (const sheetName of data.SheetNames || []) {
                const worksheet = data.Sheets[sheetName];
                if (!worksheet) {
                    errors.push(`Worksheet '${sheetName}' is empty or corrupted`);
                    continue;
                }

                // Check worksheet size
                const range = worksheet['!ref'];
                if (range) {
                    const bounds = this.parseExcelRange(range);
                    if (bounds.rows > this.globalRules.maxRowsPerSheet) {
                        errors.push(`Worksheet '${sheetName}' has too many rows (${bounds.rows} > ${this.globalRules.maxRowsPerSheet})`);
                    }
                    if (bounds.cols > this.globalRules.maxColumnsPerSheet) {
                        errors.push(`Worksheet '${sheetName}' has too many columns (${bounds.cols} > ${this.globalRules.maxColumnsPerSheet})`);
                    }
                }
            }
        } else if (fileType === 'csv') {
            // Validate CSV structure
            if (!Array.isArray(data) || data.length === 0) {
                errors.push('CSV file is empty or has invalid structure');
            } else if (data.length > this.globalRules.maxRowsPerSheet) {
                errors.push(`CSV file has too many rows (${data.length} > ${this.globalRules.maxRowsPerSheet})`);
            }
        }

        return this.createValidationResult(errors.length === 0, errors.length === 0 ? 'Data structure validation successful' : 'Data structure validation failed', errors, warnings);
    }

    /**
     * Parse Excel range to get dimensions
     */
    parseExcelRange(range) {
        const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
        if (!match) return { rows: 0, cols: 0 };

        const [, startCol, startRow, endCol, endRow] = match;
        const startColNum = this.columnToNumber(startCol);
        const endColNum = this.columnToNumber(endCol);

        return {
            rows: parseInt(endRow) - parseInt(startRow) + 1,
            cols: endColNum - startColNum + 1
        };
    }

    /**
     * Convert Excel column letters to numbers
     */
    columnToNumber(column) {
        let result = 0;
        for (let i = 0; i < column.length; i++) {
            result = result * 26 + (column.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
        }
        return result;
    }

    /**
     * Create standardized validation result
     */
    createValidationResult(isValid, message, errors = [], warnings = [], data = null) {
        return {
            isValid,
            message,
            errors: Array.isArray(errors) ? errors : [errors],
            warnings: Array.isArray(warnings) ? warnings : [warnings],
            data,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get schema documentation for a component type
     */
    getSchemaDocumentation(componentType) {
        if (!this.schemas[componentType]) {
            return null;
        }

        const schema = this.schemas[componentType];
        const documentation = {
            componentType,
            fields: {}
        };

        for (const [fieldName, fieldSchema] of Object.entries(schema)) {
            documentation.fields[fieldName] = {
                type: fieldSchema.type,
                required: fieldSchema.required || false,
                description: fieldSchema.description || 'No description available',
                constraints: {}
            };

            // Add type-specific constraints
            if (fieldSchema.min !== undefined) documentation.fields[fieldName].constraints.min = fieldSchema.min;
            if (fieldSchema.max !== undefined) documentation.fields[fieldName].constraints.max = fieldSchema.max;
            if (fieldSchema.values) documentation.fields[fieldName].constraints.allowedValues = fieldSchema.values;
            if (fieldSchema.default !== undefined) documentation.fields[fieldName].constraints.defaultValue = fieldSchema.default;
        }

        return documentation;
    }

    /**
     * Generate validation report
     */
    generateValidationReport(results) {
        const report = {
            timestamp: new Date().toISOString(),
            totalComponents: results.length,
            validComponents: results.filter(r => r.isValid).length,
            invalidComponents: results.filter(r => !r.isValid).length,
            totalErrors: results.reduce((acc, r) => acc + r.errors.length, 0),
            totalWarnings: results.reduce((acc, r) => acc + r.warnings.length, 0),
            details: results
        };

        return report;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImportValidator;
} else {
    window.ImportValidator = ImportValidator;
}