/**
 * Data Integrity Repair Mechanisms
 * Automatic detection, validation, and repair of corrupted data
 */

class DataIntegrityManager {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.repairHistory = [];
        this.corruptionDetectors = [];
        this.repairStrategies = new Map();
        this.validationRules = new Map();
        this.backupManager = new BackupManager();

        this.initializeRepairStrategies();
        this.initializeCorruptionDetectors();
        this.initializeValidationRules();
    }

    initializeRepairStrategies() {
        // JSON corruption repair
        this.repairStrategies.set('json_corruption', {
            detect: (data) => this.detectJSONCorruption(data),
            repair: (data) => this.repairJSONCorruption(data),
            priority: 1
        });

        // Schema mismatch repair
        this.repairStrategies.set('schema_mismatch', {
            detect: (data) => this.detectSchemaMismatch(data),
            repair: (data) => this.repairSchemaMismatch(data),
            priority: 2
        });

        // Type coercion repair
        this.repairStrategies.set('type_coercion', {
            detect: (data) => this.detectTypeIssues(data),
            repair: (data) => this.repairTypeIssues(data),
            priority: 3
        });

        // Business rule violations repair
        this.repairStrategies.set('business_rules', {
            detect: (data) => this.detectBusinessRuleViolations(data),
            repair: (data) => this.repairBusinessRuleViolations(data),
            priority: 4
        });

        // Circular reference repair
        this.repairStrategies.set('circular_reference', {
            detect: (data) => this.detectCircularReferences(data),
            repair: (data) => this.repairCircularReferences(data),
            priority: 5
        });
    }

    initializeCorruptionDetectors() {
        this.corruptionDetectors = [
            {
                name: 'JSON Integrity Check',
                check: (data) => this.checkJSONIntegrity(data)
            },
            {
                name: 'Schema Validation',
                check: (data) => this.validateSchema(data)
            },
            {
                name: 'Data Type Consistency',
                check: (data) => this.checkDataTypes(data)
            },
            {
                name: 'Business Rule Compliance',
                check: (data) => this.checkBusinessRules(data)
            },
            {
                name: 'Circular Reference Detection',
                check: (data) => this.checkCircularReferences(data)
            }
        ];
    }

    initializeValidationRules() {
        // Project validation rules
        this.validationRules.set('project', {
            projectName: { type: 'string', maxLength: 100, required: false },
            customerName: { type: 'string', maxLength: 100, required: false },
            sites: { type: 'number', min: 1, max: 1000, required: true },
            totalUsers: { type: 'number', min: 1, max: 100000, required: true },
            timeline: { type: 'enum', values: ['short', 'medium', 'long'], required: true },
            complexity: { type: 'enum', values: ['low', 'medium', 'high'], required: true }
        });

        // Component validation rules
        this.validationRules.set('component', {
            enabled: { type: 'boolean', required: true },
            params: { type: 'object', required: true }
        });
    }

    // ========== MAIN INTEGRITY METHODS ==========

    async performIntegrityCheck(data = null) {
        const targetData = data || this.dataStore.data;
        const checkResults = {
            timestamp: new Date().toISOString(),
            dataSize: JSON.stringify(targetData).length,
            issues: [],
            repaired: [],
            warnings: []
        };

        console.log('🔍 Starting data integrity check...');

        // Run all corruption detectors
        for (const detector of this.corruptionDetectors) {
            try {
                const result = await detector.check(targetData);
                if (!result.valid) {
                    checkResults.issues.push({
                        detector: detector.name,
                        issues: result.issues,
                        severity: result.severity || 'medium'
                    });
                }
            } catch (error) {
                checkResults.warnings.push({
                    detector: detector.name,
                    error: error.message
                });
            }
        }

        // Attempt repairs if issues found
        if (checkResults.issues.length > 0) {
            console.log(`🔧 Found ${checkResults.issues.length} integrity issues, attempting repairs...`);

            const repairResult = await this.performAutomaticRepair(targetData);
            checkResults.repaired = repairResult.repaired;
            checkResults.repairedData = repairResult.repairedData;

            // Update data store if repairs were made
            if (repairResult.repaired.length > 0 && !data) {
                this.dataStore.data = repairResult.repairedData;
                this.dataStore.saveToStorage();
            }
        }

        // Store repair history
        this.repairHistory.push(checkResults);

        console.log(`✅ Integrity check complete. Issues: ${checkResults.issues.length}, Repaired: ${checkResults.repaired.length}`);
        return checkResults;
    }

    async performAutomaticRepair(data) {
        const repairResult = {
            repairedData: JSON.parse(JSON.stringify(data)), // Deep copy
            repaired: [],
            failed: []
        };

        // Create backup before repairs
        await this.backupManager.createBackup(data, 'pre_repair');

        // Sort repair strategies by priority
        const strategies = Array.from(this.repairStrategies.entries())
            .sort((a, b) => a[1].priority - b[1].priority);

        for (const [strategyName, strategy] of strategies) {
            try {
                const detectionResult = await strategy.detect(repairResult.repairedData);

                if (detectionResult.needsRepair) {
                    console.log(`🔧 Applying repair strategy: ${strategyName}`);

                    const repairStrategyResult = await strategy.repair(repairResult.repairedData);

                    if (repairStrategyResult.success) {
                        repairResult.repairedData = repairStrategyResult.data;
                        repairResult.repaired.push({
                            strategy: strategyName,
                            issues: detectionResult.issues,
                            repairs: repairStrategyResult.repairs
                        });
                    } else {
                        repairResult.failed.push({
                            strategy: strategyName,
                            error: repairStrategyResult.error
                        });
                    }
                }
            } catch (error) {
                repairResult.failed.push({
                    strategy: strategyName,
                    error: error.message
                });
            }
        }

        return repairResult;
    }

    // ========== CORRUPTION DETECTORS ==========

    checkJSONIntegrity(data) {
        try {
            // Test if data can be properly serialized and deserialized
            const serialized = JSON.stringify(data);
            const deserialized = JSON.parse(serialized);

            // Check for NaN, Infinity, undefined values that break JSON
            const hasInvalidValues = this.containsInvalidJSONValues(data);

            return {
                valid: !hasInvalidValues,
                issues: hasInvalidValues ? ['Contains invalid JSON values (NaN, Infinity, undefined)'] : [],
                severity: hasInvalidValues ? 'high' : 'low'
            };
        } catch (error) {
            return {
                valid: false,
                issues: [`JSON serialization failed: ${error.message}`],
                severity: 'critical'
            };
        }
    }

    validateSchema(data) {
        const issues = [];

        // Check required top-level properties
        if (!data.project || typeof data.project !== 'object') {
            issues.push('Missing or invalid project object');
        }

        if (!data.components || typeof data.components !== 'object') {
            issues.push('Missing or invalid components object');
        }

        // Validate project structure
        if (data.project) {
            const projectRules = this.validationRules.get('project');
            for (const [field, rule] of Object.entries(projectRules)) {
                const value = data.project[field];
                const validation = this.validateField(value, rule, field);
                if (!validation.valid) {
                    issues.push(`Project.${field}: ${validation.error}`);
                }
            }
        }

        // Validate components structure
        if (data.components) {
            const componentRule = this.validationRules.get('component');
            for (const [componentName, component] of Object.entries(data.components)) {
                if (component && typeof component === 'object') {
                    for (const [field, rule] of Object.entries(componentRule)) {
                        const value = component[field];
                        const validation = this.validateField(value, rule, field);
                        if (!validation.valid) {
                            issues.push(`Component.${componentName}.${field}: ${validation.error}`);
                        }
                    }
                }
            }
        }

        return {
            valid: issues.length === 0,
            issues,
            severity: issues.length > 5 ? 'critical' : issues.length > 2 ? 'high' : 'medium'
        };
    }

    checkDataTypes(data) {
        const issues = [];

        // Check project data types
        if (data.project) {
            if (data.project.sites !== undefined && (!Number.isInteger(data.project.sites) || data.project.sites <= 0)) {
                issues.push('Project sites must be a positive integer');
            }

            if (data.project.totalUsers !== undefined && (!Number.isInteger(data.project.totalUsers) || data.project.totalUsers <= 0)) {
                issues.push('Project totalUsers must be a positive integer');
            }
        }

        // Check component data types
        if (data.components) {
            for (const [componentName, component] of Object.entries(data.components)) {
                if (component) {
                    if (component.enabled !== undefined && typeof component.enabled !== 'boolean') {
                        issues.push(`Component ${componentName}.enabled must be boolean`);
                    }

                    if (component.params !== undefined && (typeof component.params !== 'object' || Array.isArray(component.params))) {
                        issues.push(`Component ${componentName}.params must be an object`);
                    }
                }
            }
        }

        return {
            valid: issues.length === 0,
            issues,
            severity: 'medium'
        };
    }

    checkBusinessRules(data) {
        const issues = [];

        if (data.components) {
            // Check NaaS mutual exclusion
            const naasStandard = data.components.naasStandard?.enabled;
            const naasEnhanced = data.components.naasEnhanced?.enabled;

            if (naasStandard && naasEnhanced) {
                issues.push('Both NaaS Standard and Enhanced cannot be enabled simultaneously');
            }

            // Check Dynamics mutual exclusion
            const dynamics1 = data.components.dynamics1Year?.enabled;
            const dynamics3 = data.components.dynamics3Year?.enabled;
            const dynamics5 = data.components.dynamics5Year?.enabled;

            const enabledDynamics = [dynamics1, dynamics3, dynamics5].filter(Boolean);
            if (enabledDynamics.length > 1) {
                issues.push('Only one Dynamics term can be enabled at a time');
            }

            // Check enhanced support dependency
            const enhancedSupport = data.components.enhancedSupport?.enabled;
            const support = data.components.support?.enabled;

            if (enhancedSupport && !support) {
                issues.push('Enhanced support requires base support to be enabled');
            }
        }

        return {
            valid: issues.length === 0,
            issues,
            severity: 'high'
        };
    }

    checkCircularReferences(data) {
        const visited = new WeakSet();

        const hasCircularReference = (obj) => {
            if (obj === null || typeof obj !== 'object') return false;

            if (visited.has(obj)) return true;

            visited.add(obj);

            for (const value of Object.values(obj)) {
                if (hasCircularReference(value)) return true;
            }

            visited.delete(obj);
            return false;
        };

        const hasCircular = hasCircularReference(data);

        return {
            valid: !hasCircular,
            issues: hasCircular ? ['Circular reference detected in data structure'] : [],
            severity: hasCircular ? 'critical' : 'low'
        };
    }

    // ========== REPAIR STRATEGIES ==========

    detectJSONCorruption(data) {
        const hasInvalid = this.containsInvalidJSONValues(data);
        return {
            needsRepair: hasInvalid,
            issues: hasInvalid ? ['Invalid JSON values detected'] : []
        };
    }

    repairJSONCorruption(data) {
        try {
            const cleanedData = this.cleanInvalidJSONValues(data);
            return {
                success: true,
                data: cleanedData,
                repairs: ['Removed NaN, Infinity, and undefined values']
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    detectSchemaMismatch(data) {
        const schemaCheck = this.validateSchema(data);
        return {
            needsRepair: !schemaCheck.valid,
            issues: schemaCheck.issues
        };
    }

    repairSchemaMismatch(data) {
        try {
            const repairedData = { ...data };
            const repairs = [];

            // Ensure required structure exists
            if (!repairedData.project || typeof repairedData.project !== 'object') {
                repairedData.project = this.createDefaultProject();
                repairs.push('Added missing project structure');
            }

            if (!repairedData.components || typeof repairedData.components !== 'object') {
                repairedData.components = this.createDefaultComponents();
                repairs.push('Added missing components structure');
            }

            // Repair project fields
            const projectDefaults = this.createDefaultProject();
            for (const [field, defaultValue] of Object.entries(projectDefaults)) {
                if (repairedData.project[field] === undefined) {
                    repairedData.project[field] = defaultValue;
                    repairs.push(`Added default value for project.${field}`);
                }
            }

            // Repair component structure
            const componentDefaults = { enabled: false, params: {} };
            for (const [componentName, component] of Object.entries(repairedData.components)) {
                if (!component || typeof component !== 'object') {
                    repairedData.components[componentName] = { ...componentDefaults };
                    repairs.push(`Repaired component structure for ${componentName}`);
                } else {
                    if (component.enabled === undefined) {
                        component.enabled = false;
                        repairs.push(`Added default enabled value for ${componentName}`);
                    }
                    if (!component.params || typeof component.params !== 'object') {
                        component.params = {};
                        repairs.push(`Added default params for ${componentName}`);
                    }
                }
            }

            return {
                success: true,
                data: repairedData,
                repairs
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    detectTypeIssues(data) {
        const typeCheck = this.checkDataTypes(data);
        return {
            needsRepair: !typeCheck.valid,
            issues: typeCheck.issues
        };
    }

    repairTypeIssues(data) {
        try {
            const repairedData = JSON.parse(JSON.stringify(data));
            const repairs = [];

            // Repair project types
            if (repairedData.project) {
                if (repairedData.project.sites !== undefined) {
                    const sites = parseInt(repairedData.project.sites, 10);
                    if (isNaN(sites) || sites <= 0) {
                        repairedData.project.sites = 1;
                        repairs.push('Corrected invalid sites value to 1');
                    } else {
                        repairedData.project.sites = sites;
                    }
                }

                if (repairedData.project.totalUsers !== undefined) {
                    const users = parseInt(repairedData.project.totalUsers, 10);
                    if (isNaN(users) || users <= 0) {
                        repairedData.project.totalUsers = 100;
                        repairs.push('Corrected invalid totalUsers value to 100');
                    } else {
                        repairedData.project.totalUsers = users;
                    }
                }
            }

            // Repair component types
            if (repairedData.components) {
                for (const [componentName, component] of Object.entries(repairedData.components)) {
                    if (component) {
                        if (component.enabled !== undefined && typeof component.enabled !== 'boolean') {
                            component.enabled = Boolean(component.enabled);
                            repairs.push(`Corrected enabled type for ${componentName}`);
                        }

                        if (component.params !== undefined && (typeof component.params !== 'object' || Array.isArray(component.params))) {
                            component.params = {};
                            repairs.push(`Corrected params type for ${componentName}`);
                        }
                    }
                }
            }

            return {
                success: true,
                data: repairedData,
                repairs
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    detectBusinessRuleViolations(data) {
        const ruleCheck = this.checkBusinessRules(data);
        return {
            needsRepair: !ruleCheck.valid,
            issues: ruleCheck.issues
        };
    }

    repairBusinessRuleViolations(data) {
        try {
            const repairedData = JSON.parse(JSON.stringify(data));
            const repairs = [];

            if (repairedData.components) {
                // Fix NaaS mutual exclusion
                const naasStandard = repairedData.components.naasStandard?.enabled;
                const naasEnhanced = repairedData.components.naasEnhanced?.enabled;

                if (naasStandard && naasEnhanced) {
                    // Keep the enhanced version, disable standard
                    repairedData.components.naasStandard.enabled = false;
                    repairs.push('Disabled NaaS Standard to resolve mutual exclusion');
                }

                // Fix Dynamics mutual exclusion
                const dynamicsTypes = ['dynamics1Year', 'dynamics3Year', 'dynamics5Year'];
                const enabledDynamics = dynamicsTypes.filter(type => repairedData.components[type]?.enabled);

                if (enabledDynamics.length > 1) {
                    // Keep only the first enabled one
                    for (let i = 1; i < enabledDynamics.length; i++) {
                        repairedData.components[enabledDynamics[i]].enabled = false;
                    }
                    repairs.push('Disabled multiple Dynamics terms to resolve mutual exclusion');
                }

                // Fix enhanced support dependency
                const enhancedSupport = repairedData.components.enhancedSupport?.enabled;
                const support = repairedData.components.support?.enabled;

                if (enhancedSupport && !support) {
                    if (repairedData.components.support) {
                        repairedData.components.support.enabled = true;
                        repairs.push('Enabled base support to satisfy enhanced support dependency');
                    }
                }
            }

            return {
                success: true,
                data: repairedData,
                repairs
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ========== UTILITY METHODS ==========

    containsInvalidJSONValues(obj, visited = new WeakSet()) {
        if (obj === null || typeof obj !== 'object') {
            return obj !== obj || obj === Infinity || obj === -Infinity || obj === undefined;
        }

        if (visited.has(obj)) return false;
        visited.add(obj);

        for (const value of Object.values(obj)) {
            if (this.containsInvalidJSONValues(value, visited)) {
                return true;
            }
        }

        return false;
    }

    cleanInvalidJSONValues(obj, visited = new WeakSet()) {
        if (obj === null || typeof obj !== 'object') {
            if (obj !== obj || obj === Infinity || obj === -Infinity || obj === undefined) {
                return null;
            }
            return obj;
        }

        if (visited.has(obj)) return null;
        visited.add(obj);

        const cleaned = Array.isArray(obj) ? [] : {};

        for (const [key, value] of Object.entries(obj)) {
            const cleanedValue = this.cleanInvalidJSONValues(value, visited);
            if (cleanedValue !== null) {
                cleaned[key] = cleanedValue;
            }
        }

        visited.delete(obj);
        return cleaned;
    }

    validateField(value, rule, fieldName) {
        if (rule.required && (value === undefined || value === null)) {
            return { valid: false, error: 'Field is required' };
        }

        if (value === undefined || value === null) {
            return { valid: true }; // Optional field
        }

        switch (rule.type) {
            case 'string':
                if (typeof value !== 'string') {
                    return { valid: false, error: 'Must be a string' };
                }
                if (rule.maxLength && value.length > rule.maxLength) {
                    return { valid: false, error: `Must be no more than ${rule.maxLength} characters` };
                }
                break;

            case 'number':
                if (typeof value !== 'number' || !isFinite(value)) {
                    return { valid: false, error: 'Must be a valid number' };
                }
                if (rule.min !== undefined && value < rule.min) {
                    return { valid: false, error: `Must be at least ${rule.min}` };
                }
                if (rule.max !== undefined && value > rule.max) {
                    return { valid: false, error: `Must be no more than ${rule.max}` };
                }
                break;

            case 'boolean':
                if (typeof value !== 'boolean') {
                    return { valid: false, error: 'Must be a boolean' };
                }
                break;

            case 'object':
                if (typeof value !== 'object' || Array.isArray(value)) {
                    return { valid: false, error: 'Must be an object' };
                }
                break;

            case 'enum':
                if (!rule.values.includes(value)) {
                    return { valid: false, error: `Must be one of: ${rule.values.join(', ')}` };
                }
                break;
        }

        return { valid: true };
    }

    createDefaultProject() {
        return {
            projectName: '',
            customerName: '',
            timeline: 'medium',
            budget: '',
            sites: 1,
            primaryLocation: '',
            totalUsers: 100,
            complexity: 'medium'
        };
    }

    createDefaultComponents() {
        const componentTypes = [
            'help', 'prtg', 'capital', 'support', 'onboarding', 'pbsFoundation',
            'assessment', 'admin', 'otherCosts', 'enhancedSupport', 'dynamics1Year',
            'dynamics3Year', 'dynamics5Year', 'naasStandard', 'naasEnhanced'
        ];

        const components = {};
        componentTypes.forEach(type => {
            components[type] = { enabled: false, params: {} };
        });

        return components;
    }

    // ========== REPAIR HISTORY AND MONITORING ==========

    getRepairHistory() {
        return this.repairHistory;
    }

    getHealthStatus() {
        return {
            totalChecks: this.repairHistory.length,
            totalIssuesFound: this.repairHistory.reduce((sum, check) => sum + check.issues.length, 0),
            totalRepairs: this.repairHistory.reduce((sum, check) => sum + check.repaired.length, 0),
            lastCheck: this.repairHistory[this.repairHistory.length - 1]?.timestamp,
            repairStrategiesCount: this.repairStrategies.size,
            detectorsCount: this.corruptionDetectors.length
        };
    }

    clearHistory() {
        this.repairHistory = [];
    }
}

// Backup Manager for creating data backups before repairs
class BackupManager {
    constructor() {
        this.backupPrefix = 'naas_backup_';
        this.maxBackups = 10;
    }

    async createBackup(data, type = 'manual') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupKey = `${this.backupPrefix}${type}_${timestamp}`;

        try {
            const backupData = {
                data: JSON.parse(JSON.stringify(data)), // Deep copy
                type,
                timestamp: new Date().toISOString(),
                size: JSON.stringify(data).length,
                version: data.version || 'unknown'
            };

            localStorage.setItem(backupKey, JSON.stringify(backupData));

            // Clean up old backups
            await this.cleanupOldBackups();

            return {
                success: true,
                backupKey,
                size: backupData.size
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async restoreBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('Backup not found');
            }

            const parsed = JSON.parse(backupData);
            return {
                success: true,
                data: parsed.data,
                metadata: {
                    type: parsed.type,
                    timestamp: parsed.timestamp,
                    version: parsed.version
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    getBackupList() {
        const backups = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.backupPrefix)) {
                try {
                    const backupData = JSON.parse(localStorage.getItem(key));
                    backups.push({
                        key,
                        type: backupData.type,
                        timestamp: backupData.timestamp,
                        size: backupData.size,
                        version: backupData.version
                    });
                } catch (error) {
                    // Skip invalid backup
                }
            }
        }

        return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    async cleanupOldBackups() {
        const backups = this.getBackupList();

        if (backups.length > this.maxBackups) {
            const toDelete = backups.slice(this.maxBackups);
            toDelete.forEach(backup => {
                localStorage.removeItem(backup.key);
            });
        }
    }

    async deleteBackup(backupKey) {
        localStorage.removeItem(backupKey);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataIntegrityManager, BackupManager };
} else if (typeof window !== 'undefined') {
    window.DataIntegrityManager = DataIntegrityManager;
    window.BackupManager = BackupManager;
}