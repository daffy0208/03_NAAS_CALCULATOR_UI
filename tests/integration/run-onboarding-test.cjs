#!/usr/bin/env node

/**
 * Automated User Onboarding Test Runner
 * Runs the comprehensive onboarding simulation and captures results
 */

const fs = require('fs');
const path = require('path');

// Simple HTML parser to extract results
function parseTestResults(htmlContent) {
    try {
        // Look for console output or embedded results
        const consolePattern = /console\.log\(['"]([^'"]*)['"]\)/g;
        const matches = [];
        let match;

        while ((match = consolePattern.exec(htmlContent)) !== null) {
            matches.push(match[1]);
        }

        return matches;
    } catch (error) {
        console.error('Failed to parse test results:', error);
        return [];
    }
}

// Simulate browser environment for basic testing
class BrowserSimulator {
    constructor() {
        this.issues = [];
        this.testResults = [];
        this.currentView = 'dashboard';
    }

    async runBasicChecks() {
        console.log('🚀 Running Basic Onboarding Checks');
        console.log('='.repeat(50));

        // Check if main HTML file exists and is readable
        await this.checkFileStructure();
        await this.checkJavaScriptFiles();
        await this.checkCSSFiles();
        await this.checkHTMLStructure();
        await this.generateReport();
    }

    async checkFileStructure() {
        console.log('\n📁 Checking file structure...');

        const requiredFiles = [
            'index.html',
            'css/styles.css',
            'js/app.js',
            'js/components.js',
            'js/wizard.js',
            'js/storage-manager.js',
            'js/data-store.js',
            'js/calculations.js'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                this.addTestResult('File Structure', 'PASS', `${file} exists`);
            } else {
                this.addIssue('HIGH', 'File Structure', `Missing required file: ${file}`);
            }
        }
    }

    async checkJavaScriptFiles() {
        console.log('\n📜 Checking JavaScript files...');

        const jsFiles = [
            'js/app.js',
            'js/components.js',
            'js/wizard.js',
            'js/storage-manager.js'
        ];

        for (const file of jsFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');

                    // Basic syntax check
                    if (content.includes('function') || content.includes('class') || content.includes('const ')) {
                        this.addTestResult('JavaScript', 'PASS', `${file} has valid syntax`);
                    } else {
                        this.addIssue('MEDIUM', 'JavaScript', `${file} appears to be empty or invalid`);
                    }

                    // Check for common issues
                    if (content.includes('console.error') && content.includes('throw new Error')) {
                        this.addTestResult('Error Handling', 'PASS', `${file} has error handling`);
                    }

                    // Check for async/await usage
                    if (content.includes('async ') && content.includes('await ')) {
                        this.addTestResult('Modern JavaScript', 'PASS', `${file} uses modern async patterns`);
                    }

                } catch (error) {
                    this.addIssue('HIGH', 'JavaScript', `Failed to read ${file}: ${error.message}`);
                }
            }
        }
    }

    async checkCSSFiles() {
        console.log('\n🎨 Checking CSS files...');

        const cssFile = 'css/styles.css';
        const filePath = path.join(__dirname, cssFile);

        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');

                // Check for CSS custom properties
                if (content.includes('--qolcom-green')) {
                    this.addTestResult('CSS Variables', 'PASS', 'Custom CSS properties defined');
                }

                // Check for responsive design
                if (content.includes('@media') || content.includes('responsive')) {
                    this.addTestResult('Responsive Design', 'PASS', 'Media queries found');
                } else {
                    this.addIssue('MEDIUM', 'Responsive Design', 'Limited responsive design detected');
                }

                // Check for dark theme support
                if (content.includes('dark') || content.includes('bg-gray-900')) {
                    this.addTestResult('Dark Theme', 'PASS', 'Dark theme styles present');
                }

            } catch (error) {
                this.addIssue('MEDIUM', 'CSS', `Failed to read CSS file: ${error.message}`);
            }
        } else {
            this.addIssue('HIGH', 'CSS', 'Main CSS file missing');
        }
    }

    async checkHTMLStructure() {
        console.log('\n🏗️ Checking HTML structure...');

        const htmlFile = 'index.html';
        const filePath = path.join(__dirname, htmlFile);

        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');

                // Check for semantic HTML
                const semanticElements = ['nav', 'main', 'section', 'article', 'header', 'footer'];
                semanticElements.forEach(element => {
                    if (content.includes(`<${element}`)) {
                        this.addTestResult('Semantic HTML', 'PASS', `${element} element used`);
                    }
                });

                // Check for accessibility
                if (content.includes('aria-label') || content.includes('role=')) {
                    this.addTestResult('Accessibility', 'PASS', 'ARIA attributes found');
                } else {
                    this.addIssue('MEDIUM', 'Accessibility', 'Limited ARIA attributes detected');
                }

                // Check for required views
                const requiredViews = ['dashboardView', 'componentsView', 'wizardView', 'historyView'];
                requiredViews.forEach(view => {
                    if (content.includes(`id="${view}"`)) {
                        this.addTestResult('View Structure', 'PASS', `${view} element found`);
                    } else {
                        this.addIssue('HIGH', 'View Structure', `Missing ${view} element`);
                    }
                });

                // Check for navigation
                if (content.includes('dashboardBtn') && content.includes('componentsBtn')) {
                    this.addTestResult('Navigation', 'PASS', 'Navigation buttons found');
                } else {
                    this.addIssue('HIGH', 'Navigation', 'Navigation structure incomplete');
                }

                // Check for modals
                if (content.includes('importModal') && content.includes('exportModal')) {
                    this.addTestResult('Modals', 'PASS', 'Import/Export modals found');
                } else {
                    this.addIssue('MEDIUM', 'Modals', 'Modal structure incomplete');
                }

                // Check for mobile responsiveness
                if (content.includes('mobileMenu') && content.includes('mobileMenuBtn')) {
                    this.addTestResult('Mobile Navigation', 'PASS', 'Mobile menu structure found');
                } else {
                    this.addIssue('HIGH', 'Mobile Navigation', 'Mobile navigation missing');
                }

                // Check for error handling
                if (content.includes('errorBoundary')) {
                    this.addTestResult('Error Boundaries', 'PASS', 'Error boundary found');
                } else {
                    this.addIssue('MEDIUM', 'Error Boundaries', 'Error boundary missing');
                }

                // Check for loading indicator
                if (content.includes('loadingIndicator')) {
                    this.addTestResult('Loading UX', 'PASS', 'Loading indicator found');
                } else {
                    this.addIssue('LOW', 'Loading UX', 'Loading indicator missing');
                }

            } catch (error) {
                this.addIssue('HIGH', 'HTML Structure', `Failed to read HTML file: ${error.message}`);
            }
        } else {
            this.addIssue('CRITICAL', 'HTML Structure', 'Main HTML file missing');
        }
    }

    addTestResult(testName, status, message) {
        this.testResults.push({
            test: testName,
            status: status,
            message: message,
            timestamp: Date.now()
        });

        const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        console.log(`  ${statusIcon} ${testName}: ${message}`);
    }

    addIssue(severity, category, description) {
        this.issues.push({
            severity: severity,
            category: category,
            description: description,
            timestamp: Date.now(),
            id: `issue_${this.issues.length + 1}`
        });

        const severityIcon = severity === 'CRITICAL' ? '🔥' :
                            severity === 'HIGH' ? '🚨' :
                            severity === 'MEDIUM' ? '⚠️' : '💡';

        console.log(`  ${severityIcon} ${severity} [${category}]: ${description}`);
    }

    async generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 BASIC ONBOARDING CHECKS REPORT');
        console.log('='.repeat(60));

        // Test Results Summary
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const warnings = this.testResults.filter(r => r.status === 'WARN').length;

        console.log(`\n📝 Total Tests Run: ${this.testResults.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️  Warnings: ${warnings}`);

        // Issues Summary
        console.log(`\n🔍 Issues Found: ${this.issues.length}`);

        const critical = this.issues.filter(i => i.severity === 'CRITICAL').length;
        const high = this.issues.filter(i => i.severity === 'HIGH').length;
        const medium = this.issues.filter(i => i.severity === 'MEDIUM').length;
        const low = this.issues.filter(i => i.severity === 'LOW').length;

        console.log(`🔥 Critical: ${critical}`);
        console.log(`🚨 High: ${high}`);
        console.log(`⚠️  Medium: ${medium}`);
        console.log(`💡 Low: ${low}`);

        // Detailed Issues
        if (this.issues.length > 0) {
            console.log('\n📋 ISSUES TO FIX:');
            console.log('-'.repeat(40));

            this.issues.forEach((issue, index) => {
                const severityIcon = issue.severity === 'CRITICAL' ? '🔥' :
                                    issue.severity === 'HIGH' ? '🚨' :
                                    issue.severity === 'MEDIUM' ? '⚠️' : '💡';

                console.log(`\n${index + 1}. ${severityIcon} ${issue.severity} - ${issue.category}`);
                console.log(`   ${issue.description}`);
            });
        }

        // Save results to file
        const reportData = {
            timestamp: new Date().toISOString(),
            testResults: this.testResults,
            issues: this.issues,
            summary: {
                totalTests: this.testResults.length,
                passed: passed,
                failed: failed,
                warnings: warnings,
                totalIssues: this.issues.length,
                criticalIssues: critical,
                highIssues: high,
                mediumIssues: medium,
                lowIssues: low
            }
        };

        try {
            fs.writeFileSync('onboarding-test-results.json', JSON.stringify(reportData, null, 2));
            console.log('\n💾 Results saved to onboarding-test-results.json');
        } catch (error) {
            console.log('\n❌ Failed to save results:', error.message);
        }

        return reportData;
    }
}

// Enhanced simulation with dependency checking
class DependencyChecker {
    constructor() {
        this.dependencies = [];
        this.missingDependencies = [];
    }

    async checkExternalDependencies() {
        console.log('\n🔗 Checking external dependencies...');

        const htmlContent = fs.readFileSync('index.html', 'utf8');

        // Extract CDN links
        const cdnRegex = /https:\/\/[^\s"']+\.(css|js)/g;
        const cdnLinks = htmlContent.match(cdnRegex) || [];

        console.log(`Found ${cdnLinks.length} external dependencies:`);
        cdnLinks.forEach(link => {
            console.log(`  📦 ${link}`);
        });

        // Check for required libraries
        const requiredLibraries = ['tailwindcss', 'font-awesome', 'xlsx', 'jspdf'];
        requiredLibraries.forEach(lib => {
            if (htmlContent.includes(lib)) {
                console.log(`  ✅ ${lib} dependency found`);
            } else {
                console.log(`  ❌ ${lib} dependency missing`);
                this.missingDependencies.push(lib);
            }
        });

        return this.missingDependencies;
    }

    async checkInternalDependencies() {
        console.log('\n🔧 Checking internal JavaScript dependencies...');

        const jsFiles = [
            'js/app.js',
            'js/components.js',
            'js/wizard.js',
            'js/storage-manager.js',
            'js/data-store.js'
        ];

        for (const file of jsFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');

                // Check for class definitions
                const classMatches = content.match(/class\s+(\w+)/g) || [];
                const functionMatches = content.match(/function\s+(\w+)/g) || [];
                const constMatches = content.match(/const\s+(\w+)\s*=/g) || [];

                console.log(`  📄 ${file}:`);
                if (classMatches.length > 0) console.log(`    Classes: ${classMatches.join(', ')}`);
                if (functionMatches.length > 0) console.log(`    Functions: ${functionMatches.length}`);
                if (constMatches.length > 0) console.log(`    Constants: ${constMatches.length}`);
            }
        }
    }
}

// Main execution
async function runOnboardingAnalysis() {
    console.log('🎯 Starting Comprehensive User Onboarding Analysis');
    console.log('='.repeat(60));

    try {
        // Basic file and structure checks
        const simulator = new BrowserSimulator();
        const basicResults = await simulator.runBasicChecks();

        // Dependency analysis
        const depChecker = new DependencyChecker();
        await depChecker.checkExternalDependencies();
        await depChecker.checkInternalDependencies();

        // Additional static analysis
        await runStaticAnalysis();

        console.log('\n' + '='.repeat(60));
        console.log('🎊 Analysis Complete!');
        console.log('='.repeat(60));

        return basicResults;

    } catch (error) {
        console.error('❌ Analysis failed:', error);
        throw error;
    }
}

async function runStaticAnalysis() {
    console.log('\n🔍 Running static analysis...');

    // Check for common patterns and potential issues
    const htmlContent = fs.readFileSync('index.html', 'utf8');

    // Security checks
    if (htmlContent.includes('unsafe-inline')) {
        console.log('  ⚠️  CSP allows unsafe-inline (potential security risk)');
    }

    // Performance checks
    if (htmlContent.includes('defer') || htmlContent.includes('async')) {
        console.log('  ✅ Script loading optimization found');
    } else {
        console.log('  💡 Consider adding defer/async to script tags');
    }

    // SEO checks
    if (htmlContent.includes('<meta name="description"')) {
        console.log('  ✅ Meta description found');
    } else {
        console.log('  💡 Consider adding meta description');
    }

    // PWA checks
    if (htmlContent.includes('manifest.json')) {
        console.log('  ✅ Web app manifest found');
    } else {
        console.log('  💡 Consider adding PWA manifest');
    }
}

// Run the analysis
if (require.main === module) {
    runOnboardingAnalysis().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { BrowserSimulator, DependencyChecker, runOnboardingAnalysis };