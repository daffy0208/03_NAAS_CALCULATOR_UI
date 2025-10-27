/**
 * Main entry point for the NaaS Calculator application
 *
 * Architecture Note (v1.0):
 * This file currently serves as Vite's entry point for CSS bundling only.
 * The application logic is loaded via script tags in index.html using a
 * global class-based architecture. This is intentional for v1.0 stability.
 *
 * Roadmap:
 * - v1.1: Progressive migration to ES modules (utilities first)
 * - v1.5: Full ES module architecture with proper imports
 * - v2.0: Backend integration with modern bundling
 *
 * See docs/DEVELOPMENT_ROADMAP.md for full migration plan.
 */

// Import Tailwind CSS - bundled by Vite
import '../css/styles.css';

// Verify application loaded correctly
document.addEventListener('DOMContentLoaded', function() {
    console.log('NaaS Calculator - Vite entry point loaded');
    console.log('Application initialized via script tags in index.html');

    // Verify global dependencies are available
    const requiredGlobals = ['AppConfig', 'QuoteDataStore', 'NaaSCalculator', 'NaaSApp'];
    const missing = requiredGlobals.filter(name => typeof window[name] === 'undefined');

    if (missing.length > 0) {
        console.error('Missing required global dependencies:', missing);
        console.error('Check that all script tags in index.html loaded correctly');
    }
});