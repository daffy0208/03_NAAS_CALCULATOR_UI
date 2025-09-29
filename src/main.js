// Main entry point for the NaaS Calculator application
import '../css/styles.css';

// Import all the existing JavaScript modules
// Note: These are being imported to be bundled by Vite
// The actual functionality is in the js/ directory files

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('NaaS Calculator initializing...');

    // Load and execute the existing application scripts in order
    const scripts = [
        '/js/data-store.js',
        '/js/calculations.js',
        '/js/components.js',
        '/js/wizard.js',
        '/js/import-export.js',
        '/js/app.js'
    ];

    // Load scripts sequentially to maintain dependencies
    let scriptIndex = 0;

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async function loadAllScripts() {
        try {
            for (const scriptSrc of scripts) {
                await loadScript(scriptSrc);
                console.log(`Loaded: ${scriptSrc}`);
            }

            // Hide loading indicator once everything is loaded
            setTimeout(() => {
                const loadingIndicator = document.getElementById('loadingIndicator');
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
            }, 500);

            console.log('NaaS Calculator fully loaded and initialized');
        } catch (error) {
            console.error('Error loading application scripts:', error);

            // Show error boundary
            const errorBoundary = document.getElementById('errorBoundary');
            const errorMessage = document.getElementById('errorMessage');

            if (errorBoundary && errorMessage) {
                errorMessage.textContent = 'Failed to load application. Please check your internet connection and refresh the page.';
                errorBoundary.classList.remove('hidden');
            }
        }
    }

    loadAllScripts();
});

// Error refresh handler
document.addEventListener('DOMContentLoaded', () => {
    const errorRefresh = document.getElementById('errorRefresh');
    if (errorRefresh) {
        errorRefresh.addEventListener('click', () => {
            window.location.reload();
        });
    }
});