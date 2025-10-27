/**
 * ViewManager - Manages view switching, navigation, and mobile menu
 * Extracted from app.js to reduce complexity and improve maintainability
 */
class ViewManager {
    constructor(app) {
        this.app = app;
        this.currentView = 'dashboard';
        this.eventListeners = new Set();

        // View descriptions for screen readers
        this.viewDescriptions = {
            dashboard: 'Overview of available components and recent quotes',
            components: 'Configure individual pricing components',
            wizard: 'Step-by-step comprehensive quote builder',
            history: 'View and manage saved quotes'
        };

        // View names for announcements
        this.viewNames = {
            dashboard: 'Dashboard view',
            components: 'Components view',
            wizard: 'Full Quote Builder view',
            history: 'Quote History view'
        };
    }

    /**
     * Initialize view system and bind navigation events
     */
    initialize() {
        this.bindNavigationEvents();
        this.initializeViews();
    }

    /**
     * Show a specific view
     * @param {string} viewName - Name of the view to show
     */
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
                this.app.announceToScreenReader(
                    `Switched to ${this.viewNames[viewName] || viewName}. ${this.viewDescriptions[viewName] || ''}`,
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
                    this.app.initializeComponentsView();
                    break;
                case 'wizard':
                    if (this.app.quoteWizard) {
                        this.app.quoteWizard.initializeWizard();
                    }
                    break;
                case 'history':
                    this.app.loadHistory();
                    break;
            }

        } catch (error) {
            console.error('Error in showView:', error);
            this.app.showError(`Failed to show view ${viewName}: ${error.message}`);
        }
    }

    /**
     * Initialize all views
     */
    initializeViews() {
        // Set up view-specific functionality
        this.showView('dashboard'); // Start with dashboard

        console.log('Views initialized by ViewManager');
    }

    /**
     * Toggle mobile menu visibility
     */
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
     * Hide mobile menu
     */
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

    /**
     * Update mobile navigation state for active view
     * @param {string} activeView - The currently active view
     */
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
                    this.app.quoteWizard?.initializeWizard();
                } else if (viewName === 'history') {
                    this.app.loadHistory();
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
     * Bind navigation events to buttons
     */
    bindNavigationEvents() {
        // Desktop navigation buttons with keyboard support
        const dashboardBtn = document.getElementById('dashboardBtn');
        this.app.addManagedEventListener(dashboardBtn, 'click', () => {
            this.showView('dashboard');
        });
        this.app.addManagedEventListener(dashboardBtn, 'keydown', (e) => {
            this.handleTabNavigation(e, 'dashboard');
        });

        const componentsBtn = document.getElementById('componentsBtn');
        this.app.addManagedEventListener(componentsBtn, 'click', () => {
            this.showView('components');
        });
        this.app.addManagedEventListener(componentsBtn, 'keydown', (e) => {
            this.handleTabNavigation(e, 'components');
        });

        const wizardBtn = document.getElementById('wizardBtn');
        this.app.addManagedEventListener(wizardBtn, 'click', () => {
            this.showView('wizard');
            this.app.quoteWizard?.initializeWizard();
        });
        this.app.addManagedEventListener(wizardBtn, 'keydown', (e) => {
            this.handleTabNavigation(e, 'wizard');
        });

        const historyBtn = document.getElementById('historyBtn');
        this.app.addManagedEventListener(historyBtn, 'click', () => {
            this.showView('history');
            this.app.loadHistory();
        });
        this.app.addManagedEventListener(historyBtn, 'keydown', (e) => {
            this.handleTabNavigation(e, 'history');
        });

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.app.addManagedEventListener(mobileMenuBtn, 'click', () => {
            this.toggleMobileMenu();
        });

        // Mobile navigation buttons
        const mobileDashboardBtn = document.getElementById('mobileDashboardBtn');
        this.app.addManagedEventListener(mobileDashboardBtn, 'click', () => {
            this.showView('dashboard');
            this.hideMobileMenu();
        });

        const mobileComponentsBtn = document.getElementById('mobileComponentsBtn');
        this.app.addManagedEventListener(mobileComponentsBtn, 'click', () => {
            this.showView('components');
            this.hideMobileMenu();
        });

        const mobileWizardBtn = document.getElementById('mobileWizardBtn');
        this.app.addManagedEventListener(mobileWizardBtn, 'click', () => {
            this.showView('wizard');
            this.app.quoteWizard?.initializeWizard();
            this.hideMobileMenu();
        });

        const mobileHistoryBtn = document.getElementById('mobileHistoryBtn');
        this.app.addManagedEventListener(mobileHistoryBtn, 'click', () => {
            this.showView('history');
            this.app.loadHistory();
            this.hideMobileMenu();
        });

        // Global keyboard navigation
        this.app.addManagedEventListener(document, 'keydown', (e) => {
            // Escape to close mobile menu
            if (e.key === 'Escape') {
                this.hideMobileMenu();
            }
        });

        console.log('ViewManager: Navigation events bound');
    }

    /**
     * Get current view name
     * @returns {string} Current view name
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * Get view description for screen readers
     * @param {string} viewName - The view name
     * @returns {string} Description of the view
     */
    getViewDescription(viewName) {
        return this.viewDescriptions[viewName] || '';
    }

    /**
     * Cleanup method
     */
    destroy() {
        // Event listeners are managed by app, so no cleanup needed here
        console.log('ViewManager: Destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ViewManager;
} else {
    window.ViewManager = ViewManager;
}
