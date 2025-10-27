/**
 * NaaS Pricing Calculator - Main Application Controller
 * Orchestrates all components and manages application state
 */

// Import DOMPurify from global scope (loaded via CDN in index.html)
const DOMPurify = window.DOMPurify;

class NaaSApp {
    constructor() {
        this.currentView = 'dashboard';
        this.calculator = new NaaSCalculator();
        this.componentManager = null;
        this.quoteWizard = null;
        this.importExportManager = null;
        this.liveUpdates = true;

        // Managers
        this.viewManager = null;
        this.autoSaveManager = null;

        // Race condition prevention
        this.isInitializing = false;
        this.isInitialized = false;
        this.initPromise = null;
        this.pendingOperations = [];

        // Resource tracking for cleanup
        this.intervals = new Set();
        this.timeouts = new Set();
        this.eventListeners = new Set();
        this.unsubscribeFunctions = new Set();

        // Data store subscription
        this.dataStoreUnsubscribe = null;

        this.init();
    }

    async init() {
        // Prevent multiple initialization attempts
        if (this.isInitializing || this.isInitialized) {
            console.log('App already initializing or initialized, returning existing promise');
            return this.initPromise;
        }

        this.isInitializing = true;

        // Create and store initialization promise
        this.initPromise = new Promise(async (resolve, reject) => {
            try {
                // Wait for DOM to be ready
                if (document.readyState === 'loading') {
                    await new Promise(domResolve => {
                        document.addEventListener('DOMContentLoaded', domResolve, { once: true });
                    });
                }

                // Initialize the application
                await this.initializeApp();

                this.isInitialized = true;
                this.isInitializing = false;

                // Process any pending operations
                this.processPendingOperations();

                resolve();
            } catch (error) {
                this.isInitializing = false;
                console.error('App initialization failed:', error);
                reject(error);
            }
        });

        return this.initPromise;
    }

    /**
     * Process operations that were queued while app was initializing
     */
    processPendingOperations() {
        console.log(`Processing ${this.pendingOperations.length} pending operations`);

        this.pendingOperations.forEach(operation => {
            try {
                operation.resolve();
            } catch (error) {
                console.error('Error processing pending operation:', error);
                if (operation.reject) {
                    operation.reject(error);
                }
            }
        });

        this.pendingOperations = [];
    }

    /**
     * Queue an operation to run after initialization
     * @param {Function} operation - Operation to queue
     * @returns {Promise} - Promise that resolves when operation completes
     */
    async ensureInitialized(operation) {
        if (this.isInitialized) {
            return operation();
        }

        if (this.isInitializing && this.initPromise) {
            await this.initPromise;
            return operation();
        }

        // Queue the operation if not initialized yet
        return new Promise((resolve, reject) => {
            this.pendingOperations.push({
                resolve: () => {
                    try {
                        resolve(operation());
                    } catch (error) {
                        reject(error);
                    }
                },
                reject
            });
        });
    }

    async initializeApp() {
        // Show loading indicator
        this.showLoadingIndicator('Initializing application...');

        // Wait for data store to be available with polling
        let attempts = 0;
        while (!window.quoteDataStore && attempts < AppConfig.MAX_INIT_ATTEMPTS) {
            if (attempts % AppConfig.INIT_POLLING_LOG_FREQUENCY === 0) {
                this.updateLoadingIndicator(`Initializing data store... (${Math.floor(attempts/AppConfig.INIT_POLLING_LOG_FREQUENCY + 1)}/5)`);
            }
            await new Promise(resolve => setTimeout(resolve, AppConfig.INIT_POLLING_INTERVAL_MS));
            attempts++;
        }

        if (!window.quoteDataStore) {
            console.error('Data store not available after timeout');
            this.hideLoadingIndicator();
            this.showError('Failed to initialize data store');
            return;
        }

        console.log('Data store initialized successfully');
        this.dataStore = window.quoteDataStore;
        
        // Initialize managers with error handling
        this.updateLoadingIndicator('Loading component manager...');
        try {
            this.componentManager = new ComponentManager(this.calculator);
            window.componentManager = this.componentManager;
            console.log('ComponentManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ComponentManager:', error);
            this.hideLoadingIndicator();
            this.showError('Failed to initialize component manager');
            return;
        }

        this.updateLoadingIndicator('Loading quote wizard...');
        try {
            this.quoteWizard = new QuoteWizard(this.calculator);
            window.quoteWizard = this.quoteWizard;
            console.log('QuoteWizard initialized successfully');
        } catch (error) {
            console.error('Failed to initialize QuoteWizard:', error);
            this.hideLoadingIndicator();
            this.showError('Failed to initialize quote wizard');
            return;
        }

        try {
            this.importExportManager = new ImportExportManager(this.calculator);
            window.importExportManager = this.importExportManager;
            console.log('ImportExportManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ImportExportManager:', error);
            this.showError('Failed to initialize import/export manager');
            // Continue without import/export functionality
        }

        // Initialize ViewManager
        this.updateLoadingIndicator('Initializing view manager...');
        try {
            this.viewManager = new ViewManager(this);
            this.viewManager.initialize();
            console.log('ViewManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ViewManager:', error);
            this.showError('Failed to initialize view manager');
            // Continue with fallback view management
        }

        // Initialize AutoSaveManager
        this.updateLoadingIndicator('Setting up auto-save...');
        try {
            this.autoSaveManager = new AutoSaveManager(this);
            this.autoSaveManager.initialize();
            console.log('AutoSaveManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AutoSaveManager:', error);
            this.showNotification('Auto-save disabled due to initialization error', 'warning');
            // Continue without auto-save functionality
        }

        // Set up data store event listeners for synchronization
        try {
            this.setupDataStoreListeners();
            console.log('Data store listeners set up successfully');
        } catch (error) {
            console.error('Failed to set up data store listeners:', error);
            this.showError('Failed to set up data synchronization');
        }

        // Load saved data
        this.updateLoadingIndicator('Loading saved data...');
        try {
            this.loadSavedData();
            console.log('Saved data loaded successfully');
        } catch (error) {
            console.error('Failed to load saved data:', error);
            this.showNotification('Some saved data could not be loaded', 'warning');
        }

        // Start real-time updates
        try {
            this.startLiveUpdates();
            console.log('Live updates started successfully');
        } catch (error) {
            console.error('Failed to start live updates:', error);
            this.showNotification('Live updates disabled due to error', 'warning');
        }
        
        // Initialize component manager and dashboard
        if (this.componentManager) {
            try {
                this.componentManager.initializeComponents();
                console.log('Component manager initialized');

                // Initialize dashboard only after component manager is ready
                this.initializeDashboard();
                console.log('Dashboard initialized');
            } catch (error) {
                console.error('Failed to initialize components or dashboard:', error);
                this.showError('Failed to initialize dashboard components');
            }
        } else {
            console.error('Component manager not available - dashboard will not be populated');
            this.showError('Component manager not available');
        }
        
        // Show desktop navigation by default
        const desktopNav = document.getElementById('desktopNav');
        if (desktopNav) {
            desktopNav.classList.remove('hidden');
        }
        
        console.log('NaaS Pricing Calculator initialized successfully');

        // Restore any auto-saved data (if AutoSaveManager is available)
        if (this.autoSaveManager) {
            await this.autoSaveManager.restoreAutoSavedData();
        }

        // Hide loading indicator
        this.hideLoadingIndicator();
    }

    setupDataStoreListeners() {
        // Listen for data store changes to update UI
        this.dataStore.subscribe((type, data, allData) => {
            if (type === 'project') {
                // Update project-related UI elements
                this.updateProjectUI(data);
            } else if (type === 'component') {
                // Update component-related UI elements
                this.updateComponentUI(data.type, data.data);
            } else if (type === 'clear') {
                // Handle data clear
                this.handleDataClear();
            }
        });
    }

    updateProjectUI(projectData) {
        // Update any project-related UI elements
        // This could include updating dashboard project info, etc.
        console.log('Project data updated:', projectData);
    }

    updateComponentUI(componentType, componentData) {
        // Update component-related UI elements
        // This ensures both component view and wizard stay in sync
        console.log(`Component ${componentType} updated:`, componentData);
        
        // Update pricing if component manager is available
        if (this.componentManager && this.componentManager.currentComponent === componentType) {
            this.componentManager.calculateComponent(componentType);
        }
        
        // Update wizard pricing if wizard is visible
        if (this.quoteWizard && this.currentView === 'wizard') {
            this.quoteWizard.updateLivePricing();
        }
    }

    handleDataClear() {
        // Handle when all data is cleared
        console.log('Data store cleared');
        // Could reset UI elements, show welcome message, etc.
    }

    /**
     * Helper method to add event listener and track it for cleanup
     * @param {Element} element - DOM element
     * @param {string} event - Event name
     * @param {Function} listener - Event listener function
     * @param {Object} options - Event options
     * @returns {Function} Listener function (for reference if needed)
     */
    addManagedEventListener(element, event, listener, options = {}) {
        if (!element) {
            console.warn(`Cannot add event listener to null element for event: ${event}`);
            return null;
        }

        element.addEventListener(event, listener, options);

        // Track listener for cleanup (unless using { once: true })
        if (!options.once) {
            this.eventListeners.add({ element, event, listener, options });
        }

        return listener;
    }

    /**
     * View management wrapper methods - delegate to ViewManager when available
     */
    showView(viewName) {
        if (this.viewManager) {
            this.viewManager.showView(viewName);
            // Update currentView to stay in sync
            this.currentView = this.viewManager.getCurrentView();
        } else {
            console.warn('ViewManager not available, cannot show view:', viewName);
        }
    }

    initializeViews() {
        if (this.viewManager) {
            this.viewManager.initializeViews();
        }
    }

    toggleMobileMenu() {
        if (this.viewManager) {
            this.viewManager.toggleMobileMenu();
        }
    }

    hideMobileMenu() {
        if (this.viewManager) {
            this.viewManager.hideMobileMenu();
        }
    }

    /**
     * Auto-save wrapper methods - delegate to AutoSaveManager when available
     */
    markForAutoSave(type) {
        if (this.autoSaveManager) {
            this.autoSaveManager.markForAutoSave(type);
        }
    }

    async performAutoSave() {
        if (this.autoSaveManager) {
            await this.autoSaveManager.performAutoSave();
        }
    }

    async performImmediateAutoSave() {
        if (this.autoSaveManager) {
            await this.autoSaveManager.performImmediateAutoSave();
        }
    }

    bindNavigationEvents() {
        // Navigation buttons with keyboard support
        const dashboardBtn = document.getElementById('dashboardBtn');
        this.addManagedEventListener(dashboardBtn, 'click', () => {
            this.showView('dashboard');
        });
        this.addManagedEventListener(dashboardBtn, 'keydown', (e) => {
            this.handleTabNavigation(e, 'dashboard');
        });

        document.getElementById('componentsBtn')?.addEventListener('click', () => {
            this.showView('components');
        });
        document.getElementById('componentsBtn')?.addEventListener('keydown', (e) => {
            this.handleTabNavigation(e, 'components');
        });

        document.getElementById('wizardBtn')?.addEventListener('click', () => {
            this.showView('wizard');
            this.quoteWizard.initializeWizard();
        });
        document.getElementById('wizardBtn')?.addEventListener('keydown', (e) => {
            this.handleTabNavigation(e, 'wizard');
        });

        document.getElementById('historyBtn')?.addEventListener('click', () => {
            this.showView('history');
            this.loadHistory();
        });
        document.getElementById('historyBtn')?.addEventListener('keydown', (e) => {
            this.handleTabNavigation(e, 'history');
        });

        // Dashboard quick start button
        document.getElementById('startFullQuoteBtn')?.addEventListener('click', () => {
            this.showView('wizard');
            this.quoteWizard.initializeWizard();
        });

        // View Full Quote button in components view
        document.getElementById('viewFullQuoteBtn')?.addEventListener('click', () => {
            // Sync component data with wizard first
            if (this.componentManager) {
                this.componentManager.syncWithWizard();
            }
            this.showView('wizard');
            this.quoteWizard.initializeWizard();
        });

        // Quick Start button in components view
        document.getElementById('quickStartBtn')?.addEventListener('click', () => {
            // Select first available component automatically
            if (this.componentManager && this.componentManager.components) {
                const firstComponentKey = Object.keys(this.componentManager.components)[0];
                if (firstComponentKey) {
                    this.componentManager.selectComponent(firstComponentKey);
                    this.showNotification('Quick start: Selected first component', 'info');
                }
            }
        });

        // View Components button in wizard view
        document.getElementById('viewComponentsBtn')?.addEventListener('click', () => {
            this.showView('components');
            this.initializeComponentsView();
        });

        // Export Components Quote button
        document.getElementById('exportComponentsQuote')?.addEventListener('click', () => {
            if (this.componentManager) {
                const quote = this.componentManager.getCombinedQuote();
                this.importExportManager.exportQuote(quote, 'Components Quote');
            }
        });

        // Sidebar toggle
        document.getElementById('closeSidebar')?.addEventListener('click', () => {
            this.hidePricingSidebar();
        });

        // Mobile menu toggle
        document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Mobile navigation buttons
        document.getElementById('mobileDashboardBtn')?.addEventListener('click', () => {
            this.showView('dashboard');
            this.hideMobileMenu();
        });

        document.getElementById('mobileComponentsBtn')?.addEventListener('click', () => {
            this.showView('components');
            this.hideMobileMenu();
        });

        document.getElementById('mobileWizardBtn')?.addEventListener('click', () => {
            this.showView('wizard');
            this.quoteWizard.initializeWizard();
            this.hideMobileMenu();
        });

        document.getElementById('mobileHistoryBtn')?.addEventListener('click', () => {
            this.showView('history');
            this.loadHistory();
            this.hideMobileMenu();
        });

        // Global keyboard navigation
        this.addManagedEventListener(document, 'keydown', (e) => {
            // Live pricing toggle
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                this.toggleLiveUpdates();
            }

            // Escape to close mobile menu
            if (e.key === 'Escape') {
                this.hideMobileMenu();
            }
        });
    }

    /**
     * Handle keyboard navigation for tab buttons
     * @param {KeyboardEvent} e - The keyboard event
     * @param {string} viewName - The view name to show on Enter/Space
     */
    handleTabNavigation(e, viewName) {
        const tabs = ['dashboard', 'components', 'wizard', 'history'];
        const currentIndex = tabs.indexOf(viewName);

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.showView(viewName);
                if (viewName === 'wizard') {
                    this.quoteWizard?.initializeWizard();
                } else if (viewName === 'history') {
                    this.loadHistory();
                }
                break;

            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                const prevBtn = document.getElementById(`${tabs[prevIndex]}Btn`);
                if (prevBtn) {
                    prevBtn.focus();
                }
                break;

            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                const nextBtn = document.getElementById(`${tabs[nextIndex]}Btn`);
                if (nextBtn) {
                    nextBtn.focus();
                }
                break;

            case 'Home':
                e.preventDefault();
                document.getElementById('dashboardBtn')?.focus();
                break;

            case 'End':
                e.preventDefault();
                document.getElementById('historyBtn')?.focus();
                break;
        }
    }

    /**
     * Get description for screen readers when switching views
     * @param {string} viewName - The view name
     * @returns {string} - Description of the view
     */
    getViewDescription(viewName) {
        const descriptions = {
            dashboard: 'Overview of available components and recent quotes',
            components: 'Configure individual pricing components',
            wizard: 'Step-by-step comprehensive quote builder',
            history: 'View and manage saved quotes'
        };

        return descriptions[viewName] || '';
    }

    showView(viewName) {
        try {
            // Validate view name
            if (!viewName || typeof viewName !== 'string') {
                console.error('Invalid view name provided to showView');
                return;
            }

            // Hide all views and update ARIA states
            document.querySelectorAll('.view-content').forEach(view => {
                view.classList.add('hidden');
                view.setAttribute('aria-hidden', 'true');
                view.removeAttribute('tabindex');
            });

            // Show selected view and update ARIA states
            const targetView = document.getElementById(`${viewName}View`);
            if (!targetView) {
                console.error(`Target view ${viewName}View not found`);
                return;
            }

            targetView.classList.remove('hidden');
            targetView.setAttribute('aria-hidden', 'false');
            targetView.setAttribute('tabindex', '0');

            // Focus the view for screen readers and announce the change
            setTimeout(() => {
                targetView.focus();

                // Announce view change to screen readers
                const viewNames = {
                    dashboard: 'Dashboard view',
                    components: 'Components view',
                    wizard: 'Full Quote Builder view',
                    history: 'Quote History view'
                };

                this.announceToScreenReader(
                    `Switched to ${viewNames[viewName] || viewName}. ${this.getViewDescription(viewName)}`,
                    'polite'
                );
            }, AppConfig.VIEW_TRANSITION_DELAY_MS);

            // Update navigation state with error handling and ARIA
            try {
                document.querySelectorAll('.nav-btn').forEach(btn => {
                    btn.classList.remove('active');
                    btn.classList.add('border-transparent', 'text-gray-400');
                    btn.classList.remove('border-[var(--qolcom-green)]', 'text-[var(--qolcom-green)]');
                    btn.setAttribute('aria-selected', 'false');
                    btn.setAttribute('tabindex', '-1');
                });

                const activeBtn = document.getElementById(`${viewName}Btn`);
                if (activeBtn) {
                    activeBtn.classList.add('active');
                    activeBtn.classList.remove('border-transparent', 'text-gray-400');
                    activeBtn.classList.add('border-[var(--qolcom-green)]', 'text-[var(--qolcom-green)]');
                    activeBtn.setAttribute('aria-selected', 'true');
                    activeBtn.setAttribute('tabindex', '0');
                } else {
                    console.warn(`Navigation button ${viewName}Btn not found`);
                }
            } catch (navError) {
                console.error('Error updating navigation state:', navError);
            }

            // Update mobile navigation state
            try {
                this.updateMobileNavState(viewName);
            } catch (mobileNavError) {
                console.error('Error updating mobile navigation state:', mobileNavError);
            }

            this.currentView = viewName;

            // View-specific initialization
            switch (viewName) {
                case 'components':
                    this.initializeComponentsView();
                    break;
                case 'wizard':
                    if (this.quoteWizard) {
                        this.quoteWizard.initializeWizard();
                    }
                    break;
                case 'history':
                    this.loadHistory();
                    break;
            }

        } catch (error) {
            console.error('Error in showView:', error);
            this.showError(`Failed to show view ${viewName}: ${error.message}`);
        }
    }

    initializeViews() {
        // Set up view-specific functionality
        this.showView('dashboard'); // Start with dashboard

        // Note: Dashboard component cards will be bound in populateDashboardComponents()
        // after they are created to avoid race conditions

        console.log('Views initialized - dashboard component cards will be bound after population');

        // The following code is commented out to prevent race condition:
        /*
        document.querySelectorAll('.component-card[data-component]').forEach(card => {
            card.addEventListener('click', (event) => {
                try {
                    const componentType = card.dataset.component;

                    // Validate component type
                    if (!componentType) {
                        console.warn('Component card missing data-component attribute');
                        return;
                    }

                    // Validate component manager is available
                    if (!this.componentManager) {
                        this.showError('Component manager not available. Please refresh the page.');
                        return;
                    }

                    // Validate component exists
                    if (!this.componentManager.components || !this.componentManager.components[componentType]) {
                        this.showError(`Component '${componentType}' is not available.`);
                        return;
                    }

                    this.showView('components');

                    setTimeout(() => {
                        try {
                            if (this.componentManager && typeof this.componentManager.selectComponent === 'function') {
                                this.componentManager.selectComponent(componentType);
                            } else {
                                console.error('selectComponent method not available');
                                this.showError('Unable to select component. Please try refreshing the page.');
                            }
                        } catch (error) {
                            console.error('Error selecting component:', error);
                            this.showError('Error selecting component. Please try again.');
                        }
                    }, 150);

                } catch (error) {
                    console.error('Error handling component click:', error);
                    this.showError('An error occurred. Please refresh the page and try again.');
                }
            });
        });
        */
    }

    initializeComponentsView() {
        if (this.componentManager) {
            this.componentManager.initializeComponents();
        }
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const desktopNav = document.getElementById('desktopNav');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');

        if (!mobileMenu || !desktopNav) {
            console.error('Mobile menu or desktop nav elements not found');
            return;
        }

        try {
            const isHidden = mobileMenu.classList.contains('hidden');

            if (isHidden) {
                // Show mobile menu, hide desktop nav
                mobileMenu.classList.remove('hidden');
                mobileMenu.setAttribute('aria-hidden', 'false');
                desktopNav.classList.add('hidden');

                if (mobileMenuBtn) {
                    mobileMenuBtn.setAttribute('aria-expanded', 'true');
                    mobileMenuBtn.setAttribute('aria-label', 'Close mobile navigation menu');
                }

                // Focus first menu item for keyboard navigation
                setTimeout(() => {
                    const firstMenuItem = mobileMenu.querySelector('[role="menuitem"]');
                    if (firstMenuItem) {
                        firstMenuItem.focus();
                    }
                }, AppConfig.VIEW_TRANSITION_DELAY_MS);

                // Add keyboard navigation for mobile menu
                this.bindMobileMenuKeyboard(mobileMenu);
            } else {
                // Hide mobile menu, show desktop nav
                mobileMenu.classList.add('hidden');
                mobileMenu.setAttribute('aria-hidden', 'true');
                desktopNav.classList.remove('hidden');

                if (mobileMenuBtn) {
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                    mobileMenuBtn.setAttribute('aria-label', 'Toggle mobile navigation menu');
                    mobileMenuBtn.focus(); // Return focus to button
                }

                this.unbindMobileMenuKeyboard(mobileMenu);
            }
        } catch (error) {
            console.error('Error toggling mobile menu:', error);
        }
    }

    /**
     * Add keyboard navigation to mobile menu
     * @param {Element} mobileMenu - The mobile menu element
     */
    bindMobileMenuKeyboard(mobileMenu) {
        const menuItems = mobileMenu.querySelectorAll('[role="menuitem"]');

        menuItems.forEach((item, index) => {
            item.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        const nextItem = menuItems[index + 1] || menuItems[0];
                        nextItem.focus();
                        break;

                    case 'ArrowUp':
                        e.preventDefault();
                        const prevItem = menuItems[index - 1] || menuItems[menuItems.length - 1];
                        prevItem.focus();
                        break;

                    case 'Home':
                        e.preventDefault();
                        menuItems[0].focus();
                        break;

                    case 'End':
                        e.preventDefault();
                        menuItems[menuItems.length - 1].focus();
                        break;

                    case 'Escape':
                        e.preventDefault();
                        this.hideMobileMenu();
                        break;
                }
            });
        });
    }

    /**
     * Remove keyboard navigation from mobile menu
     * @param {Element} mobileMenu - The mobile menu element
     */
    unbindMobileMenuKeyboard(mobileMenu) {
        // Event listeners will be automatically removed when menu is hidden
        // This is a placeholder for future cleanup if needed
    }

    hideMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const desktopNav = document.getElementById('desktopNav');
        
        if (mobileMenu) {
            mobileMenu.classList.add('hidden');
        }
        if (desktopNav) {
            desktopNav.classList.remove('hidden');
        }
    }

    updateMobileNavState(activeView) {
        // Update mobile navigation state
        document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
            btn.classList.remove('active', 'text-blue-600');
            btn.classList.add('text-gray-500');
        });

        const activeBtn = document.getElementById(`mobile${activeView.charAt(0).toUpperCase() + activeView.slice(1)}Btn`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'text-blue-600');
            activeBtn.classList.remove('text-gray-500');
        }
    }

    initializeDashboard() {
        // Populate dashboard with all components
        this.populateDashboardComponents();
        
        // Update dashboard with real pricing data
        this.updateDashboardPricing();
        
        // Load recent quotes
        this.loadRecentQuotes();
    }

    populateDashboardComponents() {
        const container = document.getElementById('dashboardComponents');
        if (!container) {
            console.error('Dashboard components container not found');
            return;
        }

        if (!this.componentManager) {
            console.error('Component manager not available for dashboard population');
            container.innerHTML = '<div class="text-center text-gray-400 py-8">Component manager not available</div>';
            return;
        }

        if (!this.componentManager.components) {
            console.error('Components not available in component manager');
            container.innerHTML = '<div class="text-center text-gray-400 py-8">Components not loaded</div>';
            return;
        }

        const components = this.componentManager.components;

        // Check if components are available
        if (!components || Object.keys(components).length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <span class="material-icons text-6xl mb-4 text-gray-600">widgets</span>
                    <h3 class="text-xl font-medium mb-2 text-gray-400">No Components Available</h3>
                    <p class="text-gray-500 mb-6">Components are loading or not available at the moment.</p>
                    <button onclick="window.location.reload()" class="bg-[var(--qolcom-green)] hover:bg-opacity-80 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-colors">
                        Refresh Page
                    </button>
                </div>
            `;
            return;
        }

        let html = '';

        Object.keys(components).forEach(componentType => {
            const component = components[componentType];
            const isOneTime = componentType === 'onboarding' || componentType === 'assessment' || componentType === 'admin' || componentType === 'otherCosts';
            const isHelp = componentType === 'help';
            const pricingType = isHelp ? 'Free' : (isOneTime ? 'One-time' : 'Standalone');
            
            // Map component types to Material Icons
            const iconMap = {
                help: 'help_outline',
                prtg: 'router',
                capital: 'dns',
                support: 'support_agent',
                onboarding: 'rocket_launch',
                pbsFoundation: 'foundation',
                assessment: 'plagiarism',
                admin: 'admin_panel_settings',
                otherCosts: 'add_business',
                enhancedSupport: 'verified_user',
                dynamics1Year: 'schedule',
                dynamics3Year: 'schedule',
                dynamics5Year: 'schedule',
                naasStandard: 'layers',
                naasEnhanced: 'layers'
            };

            const materialIcon = iconMap[componentType] || 'widgets';
            // Map component types to exact colors from renders document - matching the colored accents
            const colorMap = {
                help: { 
                    border: 'border-[var(--qolcom-green)]', 
                    icon: 'text-[var(--qolcom-green)]', 
                    price: 'text-[var(--qolcom-green)]', 
                    bg: 'bg-gray-700',
                    tag: 'text-[var(--qolcom-green)]'
                },
                prtg: { 
                    border: 'border-purple-500', 
                    icon: 'text-purple-400', 
                    price: 'text-purple-400', 
                    bg: 'bg-purple-900 bg-opacity-50',
                    tag: 'text-purple-300'
                },
                capital: { 
                    border: 'border-indigo-500', 
                    icon: 'text-indigo-400', 
                    price: 'text-indigo-400', 
                    bg: 'bg-indigo-900 bg-opacity-50',
                    tag: 'text-indigo-300'
                },
                support: { 
                    border: 'border-cyan-500', 
                    icon: 'text-cyan-400', 
                    price: 'text-cyan-400', 
                    bg: 'bg-cyan-900 bg-opacity-50',
                    tag: 'text-cyan-300'
                },
                onboarding: { 
                    border: 'border-emerald-500', 
                    icon: 'text-emerald-400', 
                    price: 'text-emerald-400', 
                    bg: 'bg-emerald-900 bg-opacity-50',
                    tag: 'text-emerald-300'
                },
                pbsFoundation: { 
                    border: 'border-blue-500', 
                    icon: 'text-blue-400', 
                    price: 'text-blue-400', 
                    bg: 'bg-blue-900 bg-opacity-50',
                    tag: 'text-blue-300'
                },
                assessment: { 
                    border: 'border-gray-500', 
                    icon: 'text-gray-400', 
                    price: 'text-gray-400', 
                    bg: 'bg-gray-700',
                    tag: 'text-gray-300'
                },
                admin: { 
                    border: 'border-slate-500', 
                    icon: 'text-slate-400', 
                    price: 'text-slate-400', 
                    bg: 'bg-slate-700',
                    tag: 'text-slate-300'
                },
                otherCosts: { 
                    border: 'border-orange-500', 
                    icon: 'text-orange-400', 
                    price: 'text-orange-400', 
                    bg: 'bg-orange-900 bg-opacity-50',
                    tag: 'text-orange-300'
                },
                enhancedSupport: { 
                    border: 'border-red-500', 
                    icon: 'text-red-400', 
                    price: 'text-red-400', 
                    bg: 'bg-red-900 bg-opacity-50',
                    tag: 'text-red-300'
                },
                dynamics1Year: { 
                    border: 'border-blue-500', 
                    icon: 'text-blue-400', 
                    price: 'text-blue-400', 
                    bg: 'bg-blue-900 bg-opacity-50',
                    tag: 'text-blue-300'
                },
                dynamics3Year: { 
                    border: 'border-blue-500', 
                    icon: 'text-blue-400', 
                    price: 'text-blue-400', 
                    bg: 'bg-blue-900 bg-opacity-50',
                    tag: 'text-blue-300'
                },
                dynamics5Year: { 
                    border: 'border-blue-500', 
                    icon: 'text-blue-400', 
                    price: 'text-blue-400', 
                    bg: 'bg-blue-900 bg-opacity-50',
                    tag: 'text-blue-300'
                },
                naasStandard: { 
                    border: 'border-[var(--qolcom-green)]', 
                    icon: 'text-[var(--qolcom-green)]', 
                    price: 'text-[var(--qolcom-green)]', 
                    bg: 'bg-gray-700',
                    tag: 'text-[var(--qolcom-green)]'
                },
                naasEnhanced: { 
                    border: 'border-[var(--qolcom-green)]', 
                    icon: 'text-[var(--qolcom-green)]', 
                    price: 'text-[var(--qolcom-green)]', 
                    bg: 'bg-gray-700',
                    tag: 'text-[var(--qolcom-green)]'
                }
            };

            const colors = colorMap[componentType] || { border: 'border-gray-500', icon: 'text-gray-400', price: 'text-gray-400', bg: 'bg-gray-700' };

            html += `
                <div class="component-card rounded-xl shadow-md p-5 flex flex-col justify-between border-t-4 ${colors.border} cursor-pointer" data-component="${componentType}">
                    <div>
                        <div class="flex items-center mb-4">
                            <div class="${colors.bg} p-2 rounded-full mr-3">
                                <span class="material-icons ${colors.icon}">${materialIcon}</span>
                            </div>
                            <span class="${colors.bg} ${colors.tag} text-xs font-semibold px-2.5 py-0.5 rounded-full">${pricingType}</span>
                        </div>
                        <h3 class="font-bold text-gray-200 mb-2">${component.name}</h3>
                        <p class="text-sm text-gray-400 mb-4">${component.description}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-2xl font-bold ${colors.price}" id="price-${componentType}">${isHelp ? 'Free' : '-'}</p>
                        <p class="text-xs text-gray-500">${isHelp ? '' : (isOneTime ? 'one-time' : '/month')}</p>
                    </div>
                </div>
            `;
        });

        try {
            container.innerHTML = html;

            // Bind click events to new cards with comprehensive error handling
            const cards = container.querySelectorAll('.component-card[data-component]');
            cards.forEach(card => {
                // Remove any existing listeners to prevent duplicates
                const newCard = card.cloneNode(true);
                card.parentNode.replaceChild(newCard, card);

                newCard.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    const componentType = newCard.dataset.component;

                    // Comprehensive validation
                    if (!componentType) {
                        console.warn('Component card missing data-component attribute');
                        this.showNotification('Component not properly configured', 'warning');
                        return;
                    }

                    if (!this.componentManager) {
                        console.error('Component manager not available');
                        this.showError('Component manager not initialized. Please refresh the page.');
                        return;
                    }

                    if (!this.componentManager.components || !this.componentManager.components[componentType]) {
                        console.error(`Component ${componentType} not found in component manager`);
                        this.showError(`Component "${componentType}" is not available. Please refresh the page.`);
                        return;
                    }

                    try {
                        // Switch to components view
                        this.showView('components');

                        // Select component with proper error handling
                        setTimeout(() => {
                            try {
                                if (this.componentManager && typeof this.componentManager.selectComponent === 'function') {
                                    this.componentManager.selectComponent(componentType);
                                } else {
                                    console.error('selectComponent method not available');
                                    this.showError('Component selection not available. Please refresh the page.');
                                }
                            } catch (error) {
                                console.error('Error selecting component:', error);
                                this.showError(`Failed to select component "${componentType}": ${error.message}`);
                            }
                        }, AppConfig.COMPONENT_SELECT_DELAY_MS);
                    } catch (error) {
                        console.error('Error handling component card click:', error);
                        this.showError(`Failed to open component: ${error.message}`);
                    }
                });
            });

            console.log(`Dashboard populated with ${cards.length} components`);
        } catch (error) {
            console.error('Error rendering dashboard components:', error);
            container.innerHTML = '<div class="text-center text-red-400 py-8">Error loading components</div>';
        }
    }

    updateDashboardPricing() {
        const defaultParams = {
            help: {},
            prtg: { sensors: 100, locations: 5, serviceLevel: 'enhanced' },
            capital: { equipment: [{ type: 'router_medium', quantity: 2 }], financing: true },
            support: { level: 'enhanced', deviceCount: 10 },
            onboarding: { complexity: 'standard', sites: 1 },
            pbsFoundation: { users: 10, locations: 1, features: ['basic'] },
            assessment: { complexity: 'standard', deviceCount: 10, siteCount: 1 },
            admin: { annualReviews: 0, quarterlyReviews: 0, biAnnualReviews: 0 },
            otherCosts: { items: [] },
            enhancedSupport: { level: 'enhanced', deviceCount: 10 },
            dynamics1Year: { termMonths: 12, cpiRate: 0.03, aprRate: 0.05 },
            dynamics3Year: { termMonths: 36, cpiRate: 0.03, aprRate: 0.05 },
            dynamics5Year: { termMonths: 60, cpiRate: 0.03, aprRate: 0.05 },
            naasStandard: { package: 'standard', deviceCount: 10 },
            naasEnhanced: { package: 'enhanced', deviceCount: 10 }
        };

        Object.keys(defaultParams).forEach(componentType => {
            try {
                let result;
                switch (componentType) {
                    case 'help':
                        result = { totals: { monthly: 0, annual: 0, threeYear: 0, oneTime: 0 } };
                        break;
                    case 'prtg':
                        result = this.calculator.calculatePRTG(defaultParams[componentType]);
                        break;
                    case 'capital':
                        result = this.calculator.calculateCapital(defaultParams[componentType]);
                        break;
                    case 'support':
                        result = this.calculator.calculateSupport(defaultParams[componentType]);
                        break;
                    case 'onboarding':
                        result = this.calculator.calculateOnboarding(defaultParams[componentType]);
                        break;
                    case 'pbsFoundation':
                        result = this.calculator.calculatePBSFoundation(defaultParams[componentType]);
                        break;
                    case 'assessment':
                        result = this.calculator.calculateAssessment(defaultParams[componentType]);
                        break;
                    case 'admin':
                        result = this.calculator.calculateAdmin(defaultParams[componentType]);
                        break;
                    case 'otherCosts':
                        result = this.calculator.calculateOtherCosts(defaultParams[componentType]);
                        break;
                    case 'enhancedSupport':
                        result = this.calculator.calculateEnhancedSupport(defaultParams[componentType]);
                        break;
                    case 'dynamics1Year':
                    case 'dynamics3Year':
                    case 'dynamics5Year':
                        result = this.calculator.calculateDynamics(defaultParams[componentType], componentType);
                        break;
                    case 'naasStandard':
                    case 'naasEnhanced':
                        result = this.calculator.calculateNaaS(defaultParams[componentType], componentType);
                        break;
                }

                if (result) {
                    const priceElement = document.getElementById(`price-${componentType}`);
                    if (priceElement) {
                        if (componentType === 'help') {
                            priceElement.textContent = 'Free';
                        } else {
                            const isOneTime = componentType === 'onboarding' || componentType === 'assessment' || componentType === 'admin' || componentType === 'otherCosts';
                            const amount = isOneTime ? (result.totals.oneTime || 0) : (result.totals.monthly || 0);
                            priceElement.textContent = this.calculator.formatCurrency(amount);
                        }
                    }
                }
            } catch (error) {
                console.warn(`Error calculating ${componentType} pricing for dashboard:`, error);
            }
        });
    }

    loadRecentQuotes() {
        const recentQuotesContainer = document.getElementById('recentQuotes');
        if (!recentQuotesContainer) return;

        const savedComponents = JSON.parse(localStorage.getItem('naas_saved_components') || '{}');
        const savedQuotes = JSON.parse(localStorage.getItem('naas_full_quotes') || '{}');

        const allQuotes = [
            ...Object.values(savedComponents).map(item => ({
                ...item,
                type: 'component'
            })),
            ...Object.values(savedQuotes).map(item => ({
                ...item,
                type: 'full'
            }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (allQuotes.length === 0) {
            recentQuotesContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-clipboard-list text-4xl mb-4"></i>
                    <p>No recent quotes found</p>
                    <p class="text-sm">Start by creating a component quote or full quote</p>
                </div>
            `;
            return;
        }

        const recentHTML = allQuotes.slice(0, 5).map(quote => {
            const timeAgo = this.getTimeAgo(new Date(quote.timestamp));
            const monthlyPrice = quote.result?.totals?.monthly || 0;
            const term = quote.type === 'full' ? '3-year term' : 'component';
            
            return `
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors" 
                     onclick="app.loadQuote('${quote.type}', '${quote.timestamp}')">
                    <div>
                        <p class="font-medium text-gray-900">${quote.name || 'Unnamed Quote'}</p>
                        <p class="text-sm text-gray-600">Created ${timeAgo}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-semibold text-green-600">${this.calculator.formatCurrency(monthlyPrice)}/month</p>
                        <p class="text-sm text-gray-500">${term}</p>
                    </div>
                </div>
            `;
        }).join('');

        recentQuotesContainer.innerHTML = recentHTML;
    }

    loadQuote(type, timestamp) {
        if (type === 'component') {
            const savedComponents = JSON.parse(localStorage.getItem('naas_saved_components') || '{}');
            const quote = Object.values(savedComponents).find(item => item.timestamp === timestamp);
            
            if (quote) {
                this.showView('components');
                setTimeout(() => {
                    this.componentManager.selectComponent(quote.type);
                    this.componentManager.componentData[quote.type] = quote.params;
                    this.componentManager.populateForm(quote.type);
                    this.componentManager.calculateComponent(quote.type);
                }, AppConfig.VIEW_TRANSITION_DELAY_MS);
            }
        } else if (type === 'full') {
            const savedQuotes = JSON.parse(localStorage.getItem('naas_full_quotes') || '{}');
            const quote = Object.values(savedQuotes).find(item => item.timestamp === timestamp);
            
            if (quote) {
                this.showView('wizard');
                setTimeout(() => {
                    this.quoteWizard.wizardData = quote.data;
                    this.quoteWizard.initializeWizard();
                }, AppConfig.VIEW_TRANSITION_DELAY_MS);
            }
        }
    }

    loadHistory() {
        const historyContainer = document.getElementById('historyContent');
        if (!historyContainer) return;

        const savedComponents = JSON.parse(localStorage.getItem('naas_saved_components') || '{}');
        const savedQuotes = JSON.parse(localStorage.getItem('naas_full_quotes') || '{}');

        const allHistory = [
            ...Object.entries(savedComponents).map(([id, item]) => ({
                id,
                ...item,
                type: 'component'
            })),
            ...Object.entries(savedQuotes).map(([id, item]) => ({
                id,
                ...item,
                type: 'full'
            }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (allHistory.length === 0) {
            historyContainer.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-history text-4xl mb-4"></i>
                    <p class="text-lg font-medium mb-2">No quote history found</p>
                    <p>Your saved quotes and components will appear here</p>
                </div>
            `;
            return;
        }

        const historyHTML = `
            <div class="mb-6 flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-900">Quote History (${allHistory.length} items)</h3>
                <button onclick="app.clearHistory()" class="text-red-600 hover:text-red-800 text-sm">
                    <i class="fas fa-trash mr-1"></i>Clear All
                </button>
            </div>
            <div class="space-y-4">
                ${allHistory.map(item => this.renderHistoryItem(item)).join('')}
            </div>
        `;

        historyContainer.innerHTML = historyHTML;
    }

    renderHistoryItem(item) {
        const timeAgo = this.getTimeAgo(new Date(item.timestamp));
        const monthlyPrice = item.result?.totals?.monthly || 0;
        const threeYearPrice = item.result?.totals?.threeYear || 0;
        const typeLabel = item.type === 'component' ? 'Component' : 'Full Quote';
        const typeBadge = item.type === 'component' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';

        return `
            <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            <h4 class="font-medium text-gray-900 mr-3">${item.name || 'Unnamed Quote'}</h4>
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${typeBadge}">${typeLabel}</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-3">Created ${timeAgo}</p>
                        <div class="flex items-center space-x-4">
                            <button onclick="app.loadQuote('${item.type}', '${item.timestamp}')" 
                                    class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                <i class="fas fa-edit mr-1"></i>Edit
                            </button>
                            <button onclick="app.duplicateQuote('${item.type}', '${item.id}')" 
                                    class="text-green-600 hover:text-green-800 text-sm font-medium">
                                <i class="fas fa-copy mr-1"></i>Duplicate
                            </button>
                            <button onclick="app.deleteQuote('${item.type}', '${item.id}')" 
                                    class="text-red-600 hover:text-red-800 text-sm font-medium">
                                <i class="fas fa-trash mr-1"></i>Delete
                            </button>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold text-green-600">${this.calculator.formatCurrency(monthlyPrice)}</div>
                        <div class="text-sm text-gray-500">per month</div>
                        <div class="text-sm text-gray-600 mt-1">${this.calculator.formatCurrency(threeYearPrice)} (3-year)</div>
                    </div>
                </div>
            </div>
        `;
    }

    duplicateQuote(type, id) {
        if (type === 'component') {
            const savedComponents = JSON.parse(localStorage.getItem('naas_saved_components') || '{}');
            const original = savedComponents[id];
            
            if (original) {
                const newId = `${original.type}_${Date.now()}`;
                const duplicate = {
                    ...original,
                    name: `${original.name} (Copy)`,
                    timestamp: new Date().toISOString()
                };
                
                savedComponents[newId] = duplicate;
                localStorage.setItem('naas_saved_components', JSON.stringify(savedComponents));
                
                this.loadHistory();
                this.showNotification('Quote duplicated successfully!', 'success');
            }
        }
    }

    deleteQuote(type, id) {
        if (confirm('Are you sure you want to delete this quote?')) {
            if (type === 'component') {
                const savedComponents = JSON.parse(localStorage.getItem('naas_saved_components') || '{}');
                delete savedComponents[id];
                localStorage.setItem('naas_saved_components', JSON.stringify(savedComponents));
            } else if (type === 'full') {
                const savedQuotes = JSON.parse(localStorage.getItem('naas_full_quotes') || '{}');
                delete savedQuotes[id];
                localStorage.setItem('naas_full_quotes', JSON.stringify(savedQuotes));
            }
            
            this.loadHistory();
            this.loadRecentQuotes();
            this.showNotification('Quote deleted successfully!', 'success');
        }
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all quote history? This cannot be undone.')) {
            localStorage.removeItem('naas_saved_components');
            localStorage.removeItem('naas_full_quotes');
            this.loadHistory();
            this.loadRecentQuotes();
            this.showNotification('Quote history cleared!', 'success');
        }
    }

    loadSavedData() {
        // Load any saved component configurations
        const savedComponents = localStorage.getItem('naas_saved_components');
        if (savedComponents && this.componentManager) {
            try {
                const data = JSON.parse(savedComponents);
                // Component data is loaded on-demand when selecting components
            } catch (error) {
                console.warn('Error loading saved components:', error);
            }
        }

        // Load any saved wizard data
        const savedWizard = localStorage.getItem('naas_full_quote');
        if (savedWizard && this.quoteWizard) {
            try {
                const data = JSON.parse(savedWizard);
                this.quoteWizard.wizardData = { ...this.quoteWizard.wizardData, ...data };
            } catch (error) {
                console.warn('Error loading saved wizard data:', error);
            }
        }
    }

    startLiveUpdates() {
        if (!this.liveUpdates) return;

        // Update dashboard prices periodically (in case of external data changes)
        setInterval(() => {
            if (this.currentView === 'dashboard') {
                this.updateDashboardPricing();
            }
        }, AppConfig.DASHBOARD_UPDATE_INTERVAL_MS);

        // Auto-save wizard data periodically
        setInterval(() => {
            if (this.currentView === 'wizard' && this.quoteWizard && this.quoteWizard.wizardData) {
                const hasData = Object.keys(this.quoteWizard.wizardData).some(key =>
                    key !== 'project' && this.quoteWizard.wizardData[key].enabled
                );

                if (hasData) {
                    localStorage.setItem('naas_full_quote', JSON.stringify(this.quoteWizard.wizardData));
                }
            }
        }, AppConfig.WIZARD_AUTOSAVE_INTERVAL_MS);

        // Auto-save component data when changed
        this.addManagedEventListener(document, 'input', (e) => {
            if (this.currentView === 'components' && e.target.closest('#componentConfigArea')) {
                // Debounced save
                clearTimeout(this.componentSaveTimeout);
                this.componentSaveTimeout = setTimeout(() => {
                    if (this.componentManager && this.componentManager.currentComponent) {
                        const key = `component_${this.componentManager.currentComponent}_temp`;
                        localStorage.setItem(key, JSON.stringify(this.componentManager.componentData[this.componentManager.currentComponent]));
                    }
                }, AppConfig.AUTOSAVE_COMPONENT_DEBOUNCE_MS);
            }
        });
    }

    toggleLiveUpdates() {
        this.liveUpdates = !this.liveUpdates;
        this.showNotification(
            `Live updates ${this.liveUpdates ? 'enabled' : 'disabled'}`, 
            this.liveUpdates ? 'success' : 'info'
        );
    }

    showPricingSidebar() {
        const sidebar = document.getElementById('pricingSidebar');
        if (sidebar) {
            sidebar.classList.add('show');
        }
    }

    hidePricingSidebar() {
        const sidebar = document.getElementById('pricingSidebar');
        if (sidebar) {
            sidebar.classList.remove('show');
        }
    }

    updatePricingSidebar(data) {
        const sidebarContent = document.getElementById('sidebarContent');
        if (!sidebarContent) return;

        if (!data || Object.keys(data.components || {}).length === 0) {
            sidebarContent.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-calculator text-3xl mb-4"></i>
                    <p>No components selected</p>
                </div>
            `;
            return;
        }

        let sidebarHTML = '<div class="space-y-4">';
        
        Object.keys(data.components).forEach(componentType => {
            const component = data.components[componentType];
            const componentInfo = this.componentManager.components[componentType];
            
            if (componentInfo) {
                sidebarHTML += `
                    <div class="pricing-card">
                        <div class="flex items-center mb-3">
                            <div class="bg-${componentInfo.color}-100 p-2 rounded-lg mr-3">
                                <i class="${componentInfo.icon} text-${componentInfo.color}-600"></i>
                            </div>
                            <div>
                                <div class="font-medium text-gray-900">${componentInfo.name}</div>
                                <div class="text-sm text-gray-600">${componentInfo.category}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="pricing-amount">${this.calculator.formatCurrency(component.totals.monthly)}</div>
                            <div class="pricing-period">/month</div>
                        </div>
                    </div>
                `;
            }
        });

        sidebarHTML += `
            </div>
            <div class="mt-6 pt-6 border-t border-gray-200">
                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">${this.calculator.formatCurrency(data.totals.monthly)}</div>
                    <div class="text-sm text-gray-600">Total Monthly</div>
                    <div class="text-lg font-semibold text-gray-900 mt-2">${this.calculator.formatCurrency(data.totals.threeYear)}</div>
                    <div class="text-sm text-gray-600">3-Year Total</div>
                </div>
            </div>
        `;

        sidebarContent.innerHTML = sidebarHTML;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInMs = now - date;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
        } else if (diffInDays < 30) {
            return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    announceToScreenReader(message, priority = 'polite') {
        const announceElement = priority === 'assertive'
            ? document.getElementById('screenReaderAlerts')
            : document.getElementById('screenReaderAnnouncements');

        if (announceElement) {
            // Clear existing announcement
            announceElement.textContent = '';

            // Add new announcement after brief delay to ensure it's read
            setTimeout(() => {
                announceElement.textContent = message;

                // Clear after delay to prevent accumulation
                setTimeout(() => {
                    announceElement.textContent = '';
                }, AppConfig.SCREEN_READER_ANNOUNCEMENT_CLEAR_MS);
            }, AppConfig.VIEW_TRANSITION_DELAY_MS);
        }
    }

    showNotification(message, type = 'info') {
        // Announce to screen readers
        this.announceToScreenReader(message, type === 'error' ? 'assertive' : 'polite');

        // Prevent notification spam by removing similar existing notifications
        const existingNotifications = document.querySelectorAll('.notification-message');
        existingNotifications.forEach(existing => {
            if (existing.textContent.trim() === message.trim()) {
                existing.closest('.notification-container')?.remove();
            }
        });

        // Limit total notifications
        const allNotifications = document.querySelectorAll('.notification-container');
        if (allNotifications.length >= AppConfig.MAX_NOTIFICATION_COUNT) {
            // Remove oldest notification
            allNotifications[0]?.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification-container fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            type === 'success' ? 'bg-green-600 text-white' :
            type === 'error' ? 'bg-red-600 text-white' :
            type === 'warning' ? 'bg-yellow-600 text-white' :
            'bg-blue-600 text-white'
        }`;

        // Add stacking offset for multiple notifications
        const existingCount = document.querySelectorAll('.notification-container').length;
        if (existingCount > 0) {
            notification.style.top = `${1 + (existingCount * AppConfig.NOTIFICATION_STACK_OFFSET_REM)}rem`;
        }

        // Sanitize message before inserting into DOM to prevent XSS attacks
        const sanitizedMessage = DOMPurify ? DOMPurify.sanitize(message, {
            ALLOWED_TAGS: [],  // Strip all HTML tags
            KEEP_CONTENT: true  // Keep text content
        }) : String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;');

        notification.innerHTML = `
            <div class="flex items-center max-w-sm">
                <i class="fas fa-${
                    type === 'success' ? 'check-circle' :
                    type === 'error' ? 'exclamation-circle' :
                    type === 'warning' ? 'exclamation-triangle' :
                    'info-circle'
                } mr-2 flex-shrink-0"></i>
                <span class="notification-message flex-grow">${sanitizedMessage}</span>
                <button onclick="this.closest('.notification-container').remove()" class="ml-2 text-white hover:text-gray-200 flex-shrink-0">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Add entrance animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);

        // Auto remove after appropriate time based on type
        const autoRemoveTime = type === 'error'
            ? AppConfig.NOTIFICATION_AUTO_REMOVE_ERROR_MS
            : type === 'warning'
                ? AppConfig.NOTIFICATION_AUTO_REMOVE_WARNING_MS
                : AppConfig.NOTIFICATION_AUTO_REMOVE_SUCCESS_MS;
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.transform = 'translateX(100%)';
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), AppConfig.LOADING_FADE_OUT_MS);
            }
        }, autoRemoveTime);
    }

    showError(message) {
        this.showNotification(message, 'error');

        // Also show in error boundary if available
        const errorBoundary = document.getElementById('errorBoundary');
        const errorMessage = document.getElementById('errorMessage');

        if (errorBoundary && errorMessage) {
            errorMessage.textContent = message;
            errorBoundary.classList.remove('hidden');
        }
    }

    // Loading indicator management methods
    showLoadingIndicator(message = 'Loading...') {
        try {
            const loadingIndicator = document.getElementById('loadingIndicator');
            const loadingMessage = loadingIndicator?.querySelector('span');

            if (loadingIndicator) {
                loadingIndicator.style.display = 'flex';
                loadingIndicator.classList.remove('hidden');

                if (loadingMessage) {
                    loadingMessage.textContent = message;
                }
            }
        } catch (error) {
            console.error('Error showing loading indicator:', error);
        }
    }

    updateLoadingIndicator(message) {
        try {
            const loadingIndicator = document.getElementById('loadingIndicator');
            const loadingMessage = loadingIndicator?.querySelector('span');

            if (loadingMessage) {
                loadingMessage.textContent = message;
            }
        } catch (error) {
            console.error('Error updating loading indicator:', error);
        }
    }

    hideLoadingIndicator() {
        try {
            const loadingIndicator = document.getElementById('loadingIndicator');

            if (loadingIndicator) {
                // Smooth fade out
                loadingIndicator.style.opacity = '0';

                setTimeout(() => {
                    loadingIndicator.style.display = 'none';
                    loadingIndicator.classList.add('hidden');
                    loadingIndicator.style.opacity = '1'; // Reset for next use
                }, AppConfig.LOADING_FADE_OUT_MS);
            }
        } catch (error) {
            console.error('Error hiding loading indicator:', error);
        }
    }

    // Enhanced Auto-Save System
    initializeAutoSave() {
        // Auto-save configuration
        this.autoSave = {
            enabled: true,
            interval: AppConfig.AUTOSAVE_INTERVAL_MS,
            debounceTime: AppConfig.AUTOSAVE_DEBOUNCE_MS,
            lastSave: {},
            pendingChanges: new Set(),
            intervalId: null
        };

        this.startAutoSave();
        this.setupAutoSaveEventListeners();
    }

    startAutoSave() {
        if (!this.autoSave.enabled || this.autoSave.intervalId) return;

        this.autoSave.intervalId = this.setManagedInterval(() => {
            this.performAutoSave();
        }, this.autoSave.interval);

        console.log('Enhanced auto-save started');
    }

    stopAutoSave() {
        if (this.autoSave.intervalId) {
            this.clearManagedInterval(this.autoSave.intervalId);
            this.autoSave.intervalId = null;
        }
    }

    setupAutoSaveEventListeners() {
        // Save on form input changes
        this.addManagedEventListener(document, 'input', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.markForAutoSave('form-data');
            }
        });

        // Save on component configuration changes
        this.addManagedEventListener(document, 'change', (e) => {
            if (e.target.matches('[data-component], [data-config]')) {
                this.markForAutoSave('component-config');
            }
        });

        // Save before navigation
        this.addManagedEventListener(window, 'beforeunload', () => {
            this.performImmediateAutoSave();
        });

        // Save when page becomes hidden
        this.addManagedEventListener(document, 'visibilitychange', () => {
            if (document.hidden) {
                this.performImmediateAutoSave();
            }
        });
    }

    markForAutoSave(type) {
        this.autoSave.pendingChanges.add(type);

        // Debounced save for frequent changes
        if (this.autoSaveDebounceTimeout) {
            clearTimeout(this.autoSaveDebounceTimeout);
        }

        this.autoSaveDebounceTimeout = setTimeout(() => {
            this.performAutoSave();
        }, this.autoSave.debounceTime);
    }

    async performAutoSave() {
        if (this.autoSave.pendingChanges.size === 0) return;

        try {
            const savePromises = [];

            // Save wizard data
            if (this.currentView === 'wizard' && this.quoteWizard?.wizardData) {
                savePromises.push(this.saveWizardData());
            }

            // Save component configurations
            if (this.currentView === 'components' && this.componentManager?.componentData) {
                savePromises.push(this.saveComponentData());
            }

            // Save current project state
            savePromises.push(this.saveCurrentState());

            await Promise.all(savePromises);

            this.autoSave.pendingChanges.clear();
            this.autoSave.lastSave[this.currentView] = Date.now();

            // Show subtle notification
            this.showAutoSaveIndicator();

        } catch (error) {
            console.error('Auto-save failed:', error);
            this.showNotification('Auto-save failed, your changes may not be saved', 'warning');
        }
    }

    async performImmediateAutoSave() {
        // Force immediate save without debouncing
        this.markForAutoSave('immediate');
        await this.performAutoSave();
    }

    async saveWizardData() {
        if (!this.quoteWizard?.wizardData) return;

        const data = {
            type: 'wizard_progress',
            data: this.quoteWizard.wizardData,
            timestamp: Date.now(),
            currentStep: this.quoteWizard.currentStep || 0
        };

        if (this.dataStore) {
            await this.dataStore.saveTemporary('wizard_autosave', data);
        } else {
            localStorage.setItem('naas_wizard_autosave', JSON.stringify(data));
        }
    }

    async saveComponentData() {
        if (!this.componentManager?.componentData) return;

        const data = {
            type: 'component_configs',
            data: this.componentManager.componentData,
            timestamp: Date.now(),
            selectedComponent: this.componentManager.selectedComponent
        };

        if (this.dataStore) {
            await this.dataStore.saveTemporary('components_autosave', data);
        } else {
            localStorage.setItem('naas_components_autosave', JSON.stringify(data));
        }
    }

    async saveCurrentState() {
        const state = {
            currentView: this.currentView,
            timestamp: Date.now(),
            url: window.location.href,
            viewSpecific: this.getCurrentViewState()
        };

        if (this.dataStore) {
            await this.dataStore.saveTemporary('app_state', state);
        } else {
            localStorage.setItem('naas_app_state', JSON.stringify(state));
        }
    }

    getCurrentViewState() {
        switch (this.currentView) {
            case 'wizard':
                return {
                    currentStep: this.quoteWizard?.currentStep || 0,
                    completedSteps: this.quoteWizard?.completedSteps || []
                };
            case 'components':
                return {
                    selectedComponent: this.componentManager?.selectedComponent,
                    activeConfigurations: this.componentManager?.getActiveConfigurations?.() || {}
                };
            case 'history':
                return {
                    selectedQuote: document.querySelector('.selected-quote')?.dataset?.quoteId
                };
            default:
                return {};
        }
    }

    showAutoSaveIndicator() {
        // Show subtle visual indicator that data was saved
        let indicator = document.getElementById('autoSaveIndicator');

        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autoSaveIndicator';
            indicator.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-3 py-2 rounded-lg text-sm opacity-0 transition-opacity duration-300 z-40';
            indicator.innerHTML = '✓ Auto-saved';
            document.body.appendChild(indicator);
        }

        // Show indicator briefly
        indicator.style.opacity = '1';

        setTimeout(() => {
            indicator.style.opacity = '0';
        }, AppConfig.AUTOSAVE_INDICATOR_DISPLAY_MS);
    }

    async restoreAutoSavedData() {
        try {
            console.log('Attempting to restore auto-saved data...');

            // Restore wizard data if on wizard view
            if (this.currentView === 'wizard') {
                await this.restoreWizardData();
            }

            // Restore component data if on components view
            if (this.currentView === 'components') {
                await this.restoreComponentData();
            }

            // Restore general app state
            await this.restoreAppState();

        } catch (error) {
            console.error('Error restoring auto-saved data:', error);
        }
    }

    async restoreWizardData() {
        try {
            let savedData = null;

            if (this.dataStore) {
                savedData = await this.dataStore.getTemporary('wizard_autosave');
            } else {
                const saved = localStorage.getItem('naas_wizard_autosave');
                savedData = saved ? JSON.parse(saved) : null;
            }

            if (savedData && savedData.data && this.quoteWizard) {
                const timeDiff = Date.now() - (savedData.timestamp || 0);

                // Only restore if data is not expired
                if (timeDiff < AppConfig.AUTOSAVE_DATA_EXPIRY_MS) {
                    this.quoteWizard.wizardData = savedData.data;
                    this.quoteWizard.currentStep = savedData.currentStep || 0;

                    this.showNotification('Previous wizard progress restored', 'info');
                    console.log('Wizard data restored from auto-save');
                }
            }
        } catch (error) {
            console.error('Error restoring wizard data:', error);
        }
    }

    async restoreComponentData() {
        try {
            let savedData = null;

            if (this.dataStore) {
                savedData = await this.dataStore.getTemporary('components_autosave');
            } else {
                const saved = localStorage.getItem('naas_components_autosave');
                savedData = saved ? JSON.parse(saved) : null;
            }

            if (savedData && savedData.data && this.componentManager) {
                const timeDiff = Date.now() - (savedData.timestamp || 0);

                if (timeDiff < AppConfig.AUTOSAVE_DATA_EXPIRY_MS) {
                    this.componentManager.componentData = savedData.data;
                    this.componentManager.selectedComponent = savedData.selectedComponent;

                    this.showNotification('Previous component configurations restored', 'info');
                    console.log('Component data restored from auto-save');
                }
            }
        } catch (error) {
            console.error('Error restoring component data:', error);
        }
    }

    async restoreAppState() {
        try {
            let savedState = null;

            if (this.dataStore) {
                savedState = await this.dataStore.getTemporary('app_state');
            } else {
                const saved = localStorage.getItem('naas_app_state');
                savedState = saved ? JSON.parse(saved) : null;
            }

            if (savedState) {
                const timeDiff = Date.now() - (savedState.timestamp || 0);

                // Only restore state if not expired and same session
                if (timeDiff < AppConfig.APP_STATE_EXPIRY_MS && savedState.url === window.location.href) {
                    // Could restore view state here if needed
                    console.log('App state information available:', savedState.viewSpecific);
                }
            }
        } catch (error) {
            console.error('Error restoring app state:', error);
        }
    }

    // Resource management methods
    setManagedTimeout(callback, delay) {
        const timeoutId = setTimeout(() => {
            this.timeouts.delete(timeoutId);
            try {
                callback();
            } catch (error) {
                console.error('NaaSApp: Error in managed timeout callback:', error);
            }
        }, delay);
        this.timeouts.add(timeoutId);
        return timeoutId;
    }

    clearManagedTimeout(timeoutId) {
        if (this.timeouts.has(timeoutId)) {
            clearTimeout(timeoutId);
            this.timeouts.delete(timeoutId);
        }
    }

    setManagedInterval(callback, delay) {
        const intervalId = setInterval(() => {
            try {
                callback();
            } catch (error) {
                console.error('NaaSApp: Error in managed interval callback:', error);
            }
        }, delay);
        this.intervals.add(intervalId);
        return intervalId;
    }

    clearManagedInterval(intervalId) {
        if (this.intervals.has(intervalId)) {
            clearInterval(intervalId);
            this.intervals.delete(intervalId);
        }
    }

    // Enhanced live updates with proper resource management
    startLiveUpdatesFixed() {
        if (!this.liveUpdates) return;

        try {
            // Update dashboard prices periodically (with proper tracking)
            const dashboardInterval = this.setManagedInterval(() => {
                if (this.currentView === 'dashboard') {
                    this.updateDashboardPricing();
                }
            }, AppConfig.DASHBOARD_UPDATE_INTERVAL_MS);

            // Auto-save wizard data periodically (with proper tracking)
            const wizardSaveInterval = this.setManagedInterval(() => {
                if (this.currentView === 'wizard' && this.quoteWizard && this.quoteWizard.wizardData) {
                    const hasData = Object.keys(this.quoteWizard.wizardData).some(key =>
                        key !== 'project' && this.quoteWizard.wizardData[key].enabled
                    );

                    if (hasData) {
                        if (this.dataStore) {
                            // Use data store for saving
                            try {
                                this.dataStore.updateProject(this.quoteWizard.wizardData.project || {});
                                Object.keys(this.quoteWizard.wizardData).forEach(key => {
                                    if (key !== 'project' && this.quoteWizard.wizardData[key]) {
                                        this.dataStore.updateComponent(key, this.quoteWizard.wizardData[key]);
                                    }
                                });
                            } catch (error) {
                                console.error('NaaSApp: Error in wizard auto-save:', error);
                            }
                        } else {
                            // Fallback to localStorage
                            localStorage.setItem('naas_full_quote', JSON.stringify(this.quoteWizard.wizardData));
                        }
                    }
                }
            }, AppConfig.WIZARD_AUTOSAVE_INTERVAL_MS);

            console.log('NaaSApp: Live updates started with proper resource tracking');

        } catch (error) {
            console.error('NaaSApp: Failed to start live updates:', error);
        }
    }

    stopLiveUpdates() {
        // Clear all intervals
        this.intervals.forEach(intervalId => {
            clearInterval(intervalId);
        });
        this.intervals.clear();

        // Clear all timeouts
        this.timeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.timeouts.clear();

        console.log('NaaSApp: Live updates stopped, resources cleaned up');
    }

    // Enhanced toggle with proper resource management
    toggleLiveUpdatesFixed() {
        const wasEnabled = this.liveUpdates;
        this.liveUpdates = !this.liveUpdates;

        if (!wasEnabled && this.liveUpdates) {
            // Re-enable live updates
            this.startLiveUpdatesFixed();
        } else if (wasEnabled && !this.liveUpdates) {
            // Disable live updates by clearing intervals
            this.stopLiveUpdates();
        }

        this.showNotification(
            `Live updates ${this.liveUpdates ? 'enabled' : 'disabled'}`,
            this.liveUpdates ? 'success' : 'info'
        );
    }

    // Cleanup method to prevent memory leaks
    destroy() {
        console.log('NaaSApp: Cleaning up resources...');

        try {
            // Stop live updates
            this.stopLiveUpdates();

            // Stop auto-save
            this.stopAutoSave();

            // Remove all event listeners
            this.eventListeners.forEach(({ element, event, listener }) => {
                try {
                    element.removeEventListener(event, listener);
                } catch (error) {
                    console.warn('NaaSApp: Error removing event listener:', error);
                }
            });
            this.eventListeners.clear();

            // Unsubscribe from data store
            if (this.dataStoreUnsubscribe) {
                try {
                    this.dataStoreUnsubscribe();
                    this.dataStoreUnsubscribe = null;
                } catch (error) {
                    console.warn('NaaSApp: Error unsubscribing from data store:', error);
                }
            }

            // Clean up managers
            if (this.componentManager && typeof this.componentManager.destroy === 'function') {
                this.componentManager.destroy();
            }

            if (this.quoteWizard && typeof this.quoteWizard.destroy === 'function') {
                this.quoteWizard.destroy();
            }

            if (this.importExportManager && typeof this.importExportManager.destroy === 'function') {
                this.importExportManager.destroy();
            }

            // Clean up extracted managers
            if (this.viewManager && typeof this.viewManager.destroy === 'function') {
                this.viewManager.destroy();
            }

            if (this.autoSaveManager && typeof this.autoSaveManager.destroy === 'function') {
                this.autoSaveManager.destroy();
            }

            console.log('NaaSApp: Cleanup complete');

        } catch (error) {
            console.error('NaaSApp: Error during cleanup:', error);
        }
    }

    // Health check for monitoring
    getHealthStatus() {
        return {
            currentView: this.currentView,
            liveUpdates: this.liveUpdates,
            resourcesInUse: {
                intervals: this.intervals.size,
                timeouts: this.timeouts.size,
                eventListeners: this.eventListeners.size,
                subscriptions: this.dataStoreUnsubscribe ? 1 : 0
            },
            managers: {
                componentManager: !!this.componentManager,
                quoteWizard: !!this.quoteWizard,
                importExportManager: !!this.importExportManager,
                dataStore: !!this.dataStore
            }
        };
    }

    // Utility method for debugging
    getState() {
        return {
            health: this.getHealthStatus(),
            data: {
                currentView: this.currentView,
                componentData: this.componentManager?.componentData,
                wizardData: this.quoteWizard?.wizardData,
                liveUpdates: this.liveUpdates
            }
        };
    }
}

// Initialize the application with proper cleanup
let app;
document.addEventListener('DOMContentLoaded', () => {
    try {
        app = new NaaSApp();

        // Set up global cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (app && typeof app.destroy === 'function') {
                app.destroy();
            }
        });

        // Set up page visibility change handling
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden, could pause some operations
                if (app && app.liveUpdates) {
                    console.log('Page hidden, pausing live updates');
                    // Could implement pause functionality here
                }
            } else {
                // Page is visible again
                if (app && app.liveUpdates) {
                    console.log('Page visible, resuming live updates');
                    // Could implement resume functionality here
                }
            }
        });

        // Global error handler with enhanced logging
        window.addEventListener('error', (e) => {
            console.error('=== APPLICATION ERROR DETECTED ===');
            console.error('Message:', e.message);
            console.error('Filename:', e.filename);
            console.error('Line:', e.lineno);
            console.error('Column:', e.colno);
            console.error('Error object:', e.error);
            console.error('Stack trace:', e.error?.stack);
            if (app) {
                console.error('App health status:', app.getHealthStatus?.());
            }
            console.error('=== END ERROR ===');

            // Track error frequency
            if (!window.errorCount) window.errorCount = 0;
            window.errorCount++;

            // If too many errors, could disable some features
            if (window.errorCount > AppConfig.MAX_ERROR_COUNT_THRESHOLD) {
                console.warn('High error count detected, consider disabling some features');
                if (app && app.liveUpdates) {
                    app.toggleLiveUpdatesFixed?.();
                    console.log('Disabled live updates due to high error rate');
                }
            }
        });

        // Enhanced unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (e) => {
            console.error('=== UNHANDLED PROMISE REJECTION ===');
            console.error('Reason:', e.reason);
            console.error('Promise:', e.promise);
            if (e.reason?.stack) {
                console.error('Stack:', e.reason.stack);
            }
            if (app) {
                console.error('App health status:', app.getHealthStatus?.());
            }
            console.error('=== END REJECTION ===');

            e.preventDefault(); // Prevent default console error

            // Track promise rejection frequency
            if (!window.rejectionCount) window.rejectionCount = 0;
            window.rejectionCount++;
        });

        // Expose health monitoring
        window.getAppHealth = () => {
            return {
                app: app?.getHealthStatus?.() || 'App not available',
                dataStore: window.quoteDataStore?.getHealthStatus?.() || 'DataStore not available',
                storage: window.quoteDataStore?.storageManager?.getHealthStatus?.() || 'StorageManager not available',
                errors: window.errorCount || 0,
                rejections: window.rejectionCount || 0,
                timestamp: new Date().toISOString()
            };
        };

        console.log('NaaS Calculator initialized successfully with enhanced monitoring');

    } catch (error) {
        console.error('Failed to initialize NaaS Calculator:', error);
        // Could show user-friendly error message here
    }
});

// Expose app for debugging with safety check
Object.defineProperty(window, 'app', {
    get() { return app; },
    set(value) {
        if (app && typeof app.destroy === 'function') {
            app.destroy();
        }
        app = value;
    }
});