#!/usr/bin/env node

/**
 * Static Analysis of Data Persistence Issues
 * Analyzes the codebase to identify data persistence and state management problems
 */

const fs = require('fs');
const path = require('path');

class DataPersistenceAnalyzer {
    constructor() {
        this.issues = [];
        this.warnings = [];
        this.recommendations = [];
        this.codeFiles = {};
    }

    async analyze() {
        console.log('🔍 Analyzing Data Persistence and State Management Issues...\n');

        await this.loadCodeFiles();
        await this.analyzeQuoteDataStore();
        await this.analyzeStorageManager();
        await this.analyzeDataSynchronization();
        await this.analyzeErrorHandling();
        await this.analyzeDataValidation();
        await this.analyzeConcurrency();
        await this.analyzeSessionManagement();

        this.generateReport();
    }

    async loadCodeFiles() {
        const jsDir = path.join(__dirname, 'js');
        const files = [
            'data-store.js',
            'storage-manager.js',
            'app.js',
            'components.js',
            'wizard.js',
            'calculation-orchestrator.js'
        ];

        for (const file of files) {
            try {
                const filePath = path.join(jsDir, file);
                if (fs.existsSync(filePath)) {
                    this.codeFiles[file] = fs.readFileSync(filePath, 'utf8');
                }
            } catch (error) {
                this.warnings.push(`Could not load ${file}: ${error.message}`);
            }
        }

        console.log(`📁 Loaded ${Object.keys(this.codeFiles).length} code files for analysis`);
    }

    analyzeQuoteDataStore() {
        console.log('🔎 Analyzing QuoteDataStore...');

        const dataStoreCode = this.codeFiles['data-store.js'];
        if (!dataStoreCode) {
            this.issues.push({
                severity: 'critical',
                category: 'missing-file',
                file: 'data-store.js',
                issue: 'QuoteDataStore file not found'
            });
            return;
        }

        // Issue 1: Race condition in initialization
        if (dataStoreCode.includes('initializeStorage()') && !dataStoreCode.includes('await this.initializeStorage()')) {
            this.issues.push({
                severity: 'high',
                category: 'race-condition',
                file: 'data-store.js',
                line: this.findLineNumber(dataStoreCode, 'initializeStorage()'),
                issue: 'StorageManager initialization is not awaited, causing race conditions',
                fix: 'Make constructor async or use a proper initialization pattern'
            });
        }

        // Issue 2: No data validation
        if (!dataStoreCode.includes('validate') && !dataStoreCode.includes('sanitize')) {
            this.issues.push({
                severity: 'high',
                category: 'data-validation',
                file: 'data-store.js',
                issue: 'No data validation or sanitization in QuoteDataStore',
                fix: 'Add input validation for all updateProject and updateComponent calls'
            });
        }

        // Issue 3: Error handling in event listeners
        if (dataStoreCode.includes('this.listeners.forEach') && !dataStoreCode.includes('try') ) {
            this.issues.push({
                severity: 'medium',
                category: 'error-handling',
                file: 'data-store.js',
                line: this.findLineNumber(dataStoreCode, 'this.listeners.forEach'),
                issue: 'Event listener errors could crash the application',
                fix: 'Wrap listener calls in try-catch blocks (already implemented)'
            });
        }

        // Issue 4: Memory leak potential
        if (dataStoreCode.includes('subscribe') && !dataStoreCode.includes('unsubscribe')) {
            this.warnings.push({
                severity: 'medium',
                category: 'memory-leak',
                file: 'data-store.js',
                issue: 'Event listeners might not be properly cleaned up',
                fix: 'Ensure unsubscribe function is used to prevent memory leaks'
            });
        }

        // Issue 5: Inconsistent data structure initialization
        const componentInitLines = dataStoreCode.match(/enabled: false, params: {}/g);
        if (componentInitLines && componentInitLines.length > 10) {
            this.warnings.push({
                severity: 'low',
                category: 'code-duplication',
                file: 'data-store.js',
                issue: 'Duplicate component initialization code',
                fix: 'Extract to a factory function or configuration object'
            });
        }

        // Issue 6: No schema versioning
        if (!dataStoreCode.includes('version') && !dataStoreCode.includes('schema')) {
            this.issues.push({
                severity: 'medium',
                category: 'data-migration',
                file: 'data-store.js',
                issue: 'No data schema versioning for future migrations',
                fix: 'Add version field to stored data for migration support'
            });
        }

        console.log('✅ QuoteDataStore analysis complete');
    }

    analyzeStorageManager() {
        console.log('🔎 Analyzing StorageManager...');

        const storageCode = this.codeFiles['storage-manager.js'];
        if (!storageCode) {
            this.issues.push({
                severity: 'critical',
                category: 'missing-file',
                file: 'storage-manager.js',
                issue: 'StorageManager file not found'
            });
            return;
        }

        // Issue 1: IndexedDB connection handling
        if (storageCode.includes('this.db.close()') && !storageCode.includes('onclose')) {
            this.warnings.push({
                severity: 'medium',
                category: 'connection-handling',
                file: 'storage-manager.js',
                issue: 'IndexedDB connection closure not properly handled in all cases',
                fix: 'Add comprehensive connection state management'
            });
        }

        // Issue 2: Transaction error handling
        if (storageCode.includes('transaction') && !storageCode.includes('transaction.onerror')) {
            this.issues.push({
                severity: 'high',
                category: 'error-handling',
                file: 'storage-manager.js',
                issue: 'IndexedDB transaction errors not handled',
                fix: 'Add error handlers for all database transactions'
            });
        }

        // Issue 3: Quota exceeded handling
        if (storageCode.includes('QuotaExceededError') && !storageCode.includes('cleanup')) {
            this.warnings.push({
                severity: 'medium',
                category: 'quota-management',
                file: 'storage-manager.js',
                issue: 'Quota exceeded error handling could be improved',
                fix: 'Implement automatic cleanup when quota is exceeded'
            });
        }

        // Issue 4: Migration completeness
        const migrationLines = storageCode.match(/migrate/gi);
        if (migrationLines && migrationLines.length < 3) {
            this.issues.push({
                severity: 'medium',
                category: 'data-migration',
                file: 'storage-manager.js',
                issue: 'Migration logic may be incomplete',
                fix: 'Ensure all legacy data formats are properly migrated'
            });
        }

        // Issue 5: Concurrent access protection
        if (!storageCode.includes('mutex') && !storageCode.includes('lock')) {
            this.issues.push({
                severity: 'high',
                category: 'concurrency',
                file: 'storage-manager.js',
                issue: 'No protection against concurrent database access',
                fix: 'Implement locking mechanism for database operations'
            });
        }

        // Issue 6: Browser compatibility fallback
        if (storageCode.includes('indexedDB') && !storageCode.includes('webkit') && !storageCode.includes('moz')) {
            this.warnings.push({
                severity: 'low',
                category: 'compatibility',
                file: 'storage-manager.js',
                issue: 'May not handle vendor-prefixed IndexedDB implementations',
                fix: 'Add support for webkitIndexedDB and mozIndexedDB'
            });
        }

        console.log('✅ StorageManager analysis complete');
    }

    analyzeDataSynchronization() {
        console.log('🔎 Analyzing Data Synchronization...');

        const appCode = this.codeFiles['app.js'];
        const componentsCode = this.codeFiles['components.js'];
        const wizardCode = this.codeFiles['wizard.js'];

        // Issue 1: Event subscription cleanup
        if (appCode && appCode.includes('subscribe') && !appCode.includes('unsubscribe')) {
            this.issues.push({
                severity: 'medium',
                category: 'memory-leak',
                file: 'app.js',
                issue: 'Event subscriptions not cleaned up on component destruction',
                fix: 'Store unsubscribe functions and call them on cleanup'
            });
        }

        // Issue 2: Cross-component data consistency
        if (appCode && !appCode.includes('syncWith')) {
            this.warnings.push({
                severity: 'medium',
                category: 'data-sync',
                file: 'app.js',
                issue: 'Limited cross-component synchronization mechanisms',
                fix: 'Implement comprehensive data sync between components and wizard'
            });
        }

        // Issue 3: Real-time updates reliability
        if (appCode && appCode.includes('setInterval') && !appCode.includes('clearInterval')) {
            this.issues.push({
                severity: 'medium',
                category: 'resource-leak',
                file: 'app.js',
                issue: 'Intervals not properly cleaned up',
                fix: 'Store interval IDs and clear them on component destruction'
            });
        }

        // Issue 4: Storage event handling
        if (appCode && !appCode.includes('storage')) {
            this.issues.push({
                severity: 'medium',
                category: 'multi-tab-sync',
                file: 'app.js',
                issue: 'No storage event handling for multi-tab synchronization',
                fix: 'Add storage event listeners for cross-tab data sync'
            });
        }

        console.log('✅ Data Synchronization analysis complete');
    }

    analyzeErrorHandling() {
        console.log('🔎 Analyzing Error Handling...');

        for (const [filename, code] of Object.entries(this.codeFiles)) {
            // Count try-catch blocks vs async operations
            const asyncCount = (code.match(/async /g) || []).length;
            const awaitCount = (code.match(/await /g) || []).length;
            const tryCount = (code.match(/try {/g) || []).length;
            const catchCount = (code.match(/catch/g) || []).length;

            if (awaitCount > tryCount * 2) {
                this.issues.push({
                    severity: 'high',
                    category: 'error-handling',
                    file: filename,
                    issue: `Insufficient error handling for async operations (${awaitCount} awaits, ${tryCount} try blocks)`,
                    fix: 'Wrap async operations in try-catch blocks'
                });
            }

            // Check for unhandled promise rejections
            if (code.includes('Promise') && !code.includes('catch(')) {
                this.warnings.push({
                    severity: 'medium',
                    category: 'error-handling',
                    file: filename,
                    issue: 'Potential unhandled promise rejections',
                    fix: 'Add .catch() handlers to all promises'
                });
            }

            // Check for localStorage usage without error handling
            if (code.includes('localStorage.') && !code.includes('try')) {
                this.issues.push({
                    severity: 'medium',
                    category: 'error-handling',
                    file: filename,
                    issue: 'localStorage operations without error handling',
                    fix: 'Wrap localStorage operations in try-catch blocks'
                });
            }
        }

        console.log('✅ Error Handling analysis complete');
    }

    analyzeDataValidation() {
        console.log('🔎 Analyzing Data Validation...');

        for (const [filename, code] of Object.entries(this.codeFiles)) {
            // Check for input validation
            if (code.includes('updateProject') || code.includes('updateComponent')) {
                if (!code.includes('validate') && !code.includes('typeof') && !code.includes('instanceof')) {
                    this.issues.push({
                        severity: 'high',
                        category: 'data-validation',
                        file: filename,
                        issue: 'No input validation for data updates',
                        fix: 'Add type checking and validation for all inputs'
                    });
                }
            }

            // Check for sanitization
            if (code.includes('innerHTML') || code.includes('textContent')) {
                if (!code.includes('sanitize') && !code.includes('escape')) {
                    this.warnings.push({
                        severity: 'medium',
                        category: 'security',
                        file: filename,
                        issue: 'Potential XSS vulnerability in DOM manipulation',
                        fix: 'Sanitize all user input before DOM insertion'
                    });
                }
            }

            // Check for business rule validation
            if (code.includes('enabled: true') && !code.includes('validate')) {
                this.warnings.push({
                    severity: 'low',
                    category: 'business-logic',
                    file: filename,
                    issue: 'No business rule validation for component state changes',
                    fix: 'Add validation for component interdependencies'
                });
            }
        }

        console.log('✅ Data Validation analysis complete');
    }

    analyzeConcurrency() {
        console.log('🔎 Analyzing Concurrency Issues...');

        for (const [filename, code] of Object.entries(this.codeFiles)) {
            // Check for race conditions in initialization
            if (code.includes('constructor') && code.includes('async')) {
                this.issues.push({
                    severity: 'high',
                    category: 'race-condition',
                    file: filename,
                    issue: 'Async operations in constructor can cause race conditions',
                    fix: 'Use factory pattern or explicit initialization method'
                });
            }

            // Check for shared state mutations
            if (code.includes('this.data') && !code.includes('lock') && !code.includes('mutex')) {
                this.warnings.push({
                    severity: 'medium',
                    category: 'concurrency',
                    file: filename,
                    issue: 'Shared state mutations without synchronization',
                    fix: 'Implement proper synchronization for shared state'
                });
            }

            // Check for setTimeout/setInterval cleanup
            const timeoutCount = (code.match(/setTimeout/g) || []).length;
            const intervalCount = (code.match(/setInterval/g) || []).length;
            const clearTimeoutCount = (code.match(/clearTimeout/g) || []).length;
            const clearIntervalCount = (code.match(/clearInterval/g) || []).length;

            if (timeoutCount > clearTimeoutCount) {
                this.issues.push({
                    severity: 'medium',
                    category: 'resource-leak',
                    file: filename,
                    issue: `Potential timeout leaks (${timeoutCount} set, ${clearTimeoutCount} cleared)`,
                    fix: 'Store timeout IDs and clear them appropriately'
                });
            }

            if (intervalCount > clearIntervalCount) {
                this.issues.push({
                    severity: 'high',
                    category: 'resource-leak',
                    file: filename,
                    issue: `Potential interval leaks (${intervalCount} set, ${clearIntervalCount} cleared)`,
                    fix: 'Store interval IDs and clear them appropriately'
                });
            }
        }

        console.log('✅ Concurrency analysis complete');
    }

    analyzeSessionManagement() {
        console.log('🔎 Analyzing Session Management...');

        const dataStoreCode = this.codeFiles['data-store.js'];
        const appCode = this.codeFiles['app.js'];

        // Check for session persistence
        if (dataStoreCode && !dataStoreCode.includes('sessionStorage')) {
            this.warnings.push({
                severity: 'low',
                category: 'session-management',
                file: 'data-store.js',
                issue: 'No sessionStorage usage for temporary data',
                fix: 'Consider using sessionStorage for temporary session data'
            });
        }

        // Check for page refresh handling
        if (appCode && !appCode.includes('beforeunload')) {
            this.warnings.push({
                severity: 'medium',
                category: 'session-management',
                file: 'app.js',
                issue: 'No beforeunload handler to save data on page exit',
                fix: 'Add beforeunload event listener to ensure data persistence'
            });
        }

        // Check for storage event handling (multi-tab sync)
        if (appCode && !appCode.includes('addEventListener(\'storage\'')) {
            this.issues.push({
                severity: 'medium',
                category: 'multi-tab-sync',
                file: 'app.js',
                issue: 'No storage event handling for multi-tab synchronization',
                fix: 'Add storage event listeners to sync data across tabs'
            });
        }

        console.log('✅ Session Management analysis complete');
    }

    findLineNumber(code, searchString) {
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(searchString)) {
                return i + 1;
            }
        }
        return null;
    }

    generateReport() {
        console.log('\n📊 ANALYSIS COMPLETE\n');

        const criticalIssues = this.issues.filter(i => i.severity === 'critical');
        const highIssues = this.issues.filter(i => i.severity === 'high');
        const mediumIssues = this.issues.filter(i => i.severity === 'medium');
        const lowIssues = this.issues.filter(i => i.severity === 'low');

        console.log('='.repeat(80));
        console.log('📋 DATA PERSISTENCE ANALYSIS REPORT');
        console.log('='.repeat(80));

        console.log(`\n📈 SUMMARY:`);
        console.log(`  🔴 Critical Issues: ${criticalIssues.length}`);
        console.log(`  🟠 High Priority:   ${highIssues.length}`);
        console.log(`  🟡 Medium Priority: ${mediumIssues.length}`);
        console.log(`  🟢 Low Priority:    ${lowIssues.length}`);
        console.log(`  ⚠️  Warnings:       ${this.warnings.length}`);
        console.log(`  📁 Files Analyzed:  ${Object.keys(this.codeFiles).length}`);

        if (criticalIssues.length > 0) {
            console.log('\n🔴 CRITICAL ISSUES (Must Fix):');
            criticalIssues.forEach((issue, i) => {
                console.log(`\n${i + 1}. ${issue.issue}`);
                console.log(`   📄 File: ${issue.file}${issue.line ? ` (line ${issue.line})` : ''}`);
                console.log(`   🏷️  Category: ${issue.category}`);
                console.log(`   🔧 Fix: ${issue.fix || 'No fix provided'}`);
            });
        }

        if (highIssues.length > 0) {
            console.log('\n🟠 HIGH PRIORITY ISSUES:');
            highIssues.forEach((issue, i) => {
                console.log(`\n${i + 1}. ${issue.issue}`);
                console.log(`   📄 File: ${issue.file}${issue.line ? ` (line ${issue.line})` : ''}`);
                console.log(`   🏷️  Category: ${issue.category}`);
                console.log(`   🔧 Fix: ${issue.fix || 'No fix provided'}`);
            });
        }

        if (mediumIssues.length > 0) {
            console.log('\n🟡 MEDIUM PRIORITY ISSUES:');
            mediumIssues.slice(0, 5).forEach((issue, i) => {
                console.log(`\n${i + 1}. ${issue.issue}`);
                console.log(`   📄 File: ${issue.file}${issue.line ? ` (line ${issue.line})` : ''}`);
                console.log(`   🏷️  Category: ${issue.category}`);
                console.log(`   🔧 Fix: ${issue.fix || 'No fix provided'}`);
            });
            if (mediumIssues.length > 5) {
                console.log(`\n   ... and ${mediumIssues.length - 5} more medium priority issues`);
            }
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            this.warnings.slice(0, 3).forEach((warning, i) => {
                console.log(`\n${i + 1}. ${warning.issue || warning}`);
                if (warning.file) {
                    console.log(`   📄 File: ${warning.file}`);
                }
                if (warning.fix) {
                    console.log(`   🔧 Fix: ${warning.fix}`);
                }
            });
            if (this.warnings.length > 3) {
                console.log(`\n   ... and ${this.warnings.length - 3} more warnings`);
            }
        }

        console.log('\n💡 KEY RECOMMENDATIONS:');

        const recommendations = [
            '1. 🏗️  Implement proper async initialization pattern for QuoteDataStore',
            '2. 🔒 Add data validation and sanitization for all user inputs',
            '3. 🚫 Implement proper error handling for all async operations',
            '4. 🔄 Add cross-tab synchronization using storage events',
            '5. 🧹 Implement proper cleanup for event listeners and timers',
            '6. 📊 Add data schema versioning for future migrations',
            '7. ⚡ Implement concurrency protection for shared state',
            '8. 🛡️  Add comprehensive error boundaries and fallbacks',
            '9. 🔍 Add monitoring and logging for data operations',
            '10. 🧪 Implement comprehensive automated testing'
        ];

        recommendations.forEach(rec => console.log(`   ${rec}`));

        console.log('\n' + '='.repeat(80));
        console.log('📝 Next Steps:');
        console.log('1. Fix all critical and high-priority issues');
        console.log('2. Run comprehensive tests with the test suite');
        console.log('3. Implement recommended improvements');
        console.log('4. Add monitoring and error tracking');
        console.log('='.repeat(80) + '\n');

        // Generate JSON report for further processing
        const report = {
            summary: {
                total: this.issues.length,
                critical: criticalIssues.length,
                high: highIssues.length,
                medium: mediumIssues.length,
                low: lowIssues.length,
                warnings: this.warnings.length,
                filesAnalyzed: Object.keys(this.codeFiles).length
            },
            issues: this.issues,
            warnings: this.warnings,
            recommendations: recommendations,
            timestamp: new Date().toISOString(),
            filesAnalyzed: Object.keys(this.codeFiles)
        };

        // Save report
        try {
            fs.writeFileSync('data-persistence-analysis-report.json', JSON.stringify(report, null, 2));
            console.log('📄 Detailed report saved to: data-persistence-analysis-report.json');
        } catch (error) {
            console.log('⚠️  Could not save report file:', error.message);
        }

        return report;
    }
}

// Run analysis
if (require.main === module) {
    const analyzer = new DataPersistenceAnalyzer();
    analyzer.analyze().catch(console.error);
}

module.exports = DataPersistenceAnalyzer;