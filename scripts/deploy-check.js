#!/usr/bin/env node

/**
 * Deployment Check Script
 * Verifies the production build is ready for deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Running deployment readiness check...\n');

const checks = [];

// Check if dist directory exists
function checkDistDirectory() {
  const distPath = path.join(rootDir, 'dist');
  const exists = fs.existsSync(distPath);

  return {
    name: 'Build Output Directory',
    status: exists ? 'PASS' : 'FAIL',
    message: exists ? 'dist/ directory found' : 'dist/ directory missing - run npm run build'
  };
}

// Check if essential files exist
function checkEssentialFiles() {
  const distPath = path.join(rootDir, 'dist');
  const requiredFiles = [
    'index.html',
    'manifest.webmanifest',
    'sw.js'
  ];

  const missingFiles = requiredFiles.filter(file => {
    return !fs.existsSync(path.join(distPath, file));
  });

  return {
    name: 'Essential Files',
    status: missingFiles.length === 0 ? 'PASS' : 'FAIL',
    message: missingFiles.length === 0
      ? 'All essential files present'
      : `Missing files: ${missingFiles.join(', ')}`
  };
}

// Check if HTML contains CSP headers
function checkSecurityHeaders() {
  try {
    const indexPath = path.join(rootDir, 'dist', 'index.html');
    const content = fs.readFileSync(indexPath, 'utf8');

    const hasCSP = content.includes('Content-Security-Policy');
    const hasXFrame = content.includes('X-Frame-Options');

    return {
      name: 'Security Headers',
      status: hasCSP && hasXFrame ? 'PASS' : 'WARN',
      message: hasCSP && hasXFrame
        ? 'Security headers configured'
        : 'Some security headers missing - check server configuration'
    };
  } catch (error) {
    return {
      name: 'Security Headers',
      status: 'FAIL',
      message: 'Could not check security headers'
    };
  }
}

// Check file sizes
function checkFileSizes() {
  try {
    const distPath = path.join(rootDir, 'dist');
    const indexPath = path.join(distPath, 'index.html');

    const indexSize = fs.statSync(indexPath).size;
    const indexSizeKB = Math.round(indexSize / 1024);

    // Check if main HTML is reasonable size (should be under 100KB)
    const status = indexSizeKB < 100 ? 'PASS' : 'WARN';
    const message = `index.html size: ${indexSizeKB}KB ${status === 'WARN' ? '(large)' : '(good)'}`;

    return {
      name: 'File Sizes',
      status,
      message
    };
  } catch (error) {
    return {
      name: 'File Sizes',
      status: 'FAIL',
      message: 'Could not check file sizes'
    };
  }
}

// Check PWA manifest
function checkPWAManifest() {
  try {
    const manifestPath = path.join(rootDir, 'dist', 'manifest.webmanifest');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const hasRequiredFields = manifest.name &&
                            manifest.short_name &&
                            manifest.start_url &&
                            manifest.display &&
                            manifest.icons;

    return {
      name: 'PWA Manifest',
      status: hasRequiredFields ? 'PASS' : 'FAIL',
      message: hasRequiredFields
        ? 'PWA manifest is valid'
        : 'PWA manifest missing required fields'
    };
  } catch (error) {
    return {
      name: 'PWA Manifest',
      status: 'FAIL',
      message: 'Could not validate PWA manifest'
    };
  }
}

// Check Service Worker
function checkServiceWorker() {
  try {
    const swPath = path.join(rootDir, 'dist', 'sw.js');
    const swContent = fs.readFileSync(swPath, 'utf8');

    const hasWorkbox = swContent.includes('workbox') || swContent.includes('precache');

    return {
      name: 'Service Worker',
      status: hasWorkbox ? 'PASS' : 'WARN',
      message: hasWorkbox
        ? 'Service worker with precaching found'
        : 'Service worker found but may lack precaching'
    };
  } catch (error) {
    return {
      name: 'Service Worker',
      status: 'FAIL',
      message: 'Service worker not found or invalid'
    };
  }
}

// Check package.json for required scripts
function checkPackageScripts() {
  try {
    const packagePath = path.join(rootDir, 'package.json');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    const requiredScripts = ['build', 'dev', 'test', 'lint'];
    const missingScripts = requiredScripts.filter(script =>
      !packageContent.scripts || !packageContent.scripts[script]
    );

    return {
      name: 'Package Scripts',
      status: missingScripts.length === 0 ? 'PASS' : 'WARN',
      message: missingScripts.length === 0
        ? 'All required scripts present'
        : `Missing scripts: ${missingScripts.join(', ')}`
    };
  } catch (error) {
    return {
      name: 'Package Scripts',
      status: 'FAIL',
      message: 'Could not check package.json'
    };
  }
}

// Run all checks
async function runChecks() {
  const allChecks = [
    checkDistDirectory(),
    checkEssentialFiles(),
    checkSecurityHeaders(),
    checkFileSizes(),
    checkPWAManifest(),
    checkServiceWorker(),
    checkPackageScripts()
  ];

  console.log('Running deployment checks...\n');

  let passed = 0;
  let warned = 0;
  let failed = 0;

  allChecks.forEach(check => {
    let icon = '❓';
    if (check.status === 'PASS') {
      icon = '✅';
      passed++;
    } else if (check.status === 'WARN') {
      icon = '⚠️';
      warned++;
    } else {
      icon = '❌';
      failed++;
    }

    console.log(`${icon} ${check.name}: ${check.message}`);
  });

  console.log(`\n📊 Results: ${passed} passed, ${warned} warnings, ${failed} failed\n`);

  if (failed > 0) {
    console.log('❌ Deployment check FAILED - fix errors before deploying');
    process.exit(1);
  } else if (warned > 0) {
    console.log('⚠️  Deployment check passed with WARNINGS - review before deploying');
    process.exit(0);
  } else {
    console.log('✅ Deployment check PASSED - ready to deploy!');
    process.exit(0);
  }
}

// Show help information
function showHelp() {
  console.log(`
NaaS Calculator Deployment Check

Usage:
  node scripts/deploy-check.js [options]

Options:
  --help, -h    Show this help message
  --verbose, -v Show detailed output

This script verifies:
  ✓ Build output exists
  ✓ Essential files present
  ✓ Security headers configured
  ✓ File sizes reasonable
  ✓ PWA manifest valid
  ✓ Service worker configured
  ✓ Package.json scripts present

Exit codes:
  0 - All checks passed
  1 - One or more checks failed
`);
}

// Main execution
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
} else {
  runChecks().catch(error => {
    console.error('❌ Deployment check failed:', error.message);
    process.exit(1);
  });
}