/**
 * AutoSaveManager - Manages automatic saving and restoration of application data
 * Extracted from app.js to reduce complexity and improve maintainability
 */
class AutoSaveManager {
    constructor(app) {
        this.app = app;
        this.autoSave = {
            enabled: true,
            interval: AppConfig.AUTOSAVE_INTERVAL_MS,
            debounceTime: AppConfig.AUTOSAVE_DEBOUNCE_MS,
            lastSave: {},
            pendingChanges: new Set(),
            intervalId: null
        };
        this.debounceTimeout = null;
    }

    /**
     * Initialize the auto-save system
     */
    initialize() {
        this.startAutoSave();
        this.setupEventListeners();
        console.log('AutoSaveManager initialized');
    }

    /**
     * Start auto-save interval
     */
    startAutoSave() {
        if (!this.autoSave.enabled || this.autoSave.intervalId) return;

        this.autoSave.intervalId = this.app.setManagedInterval(() => {
            this.performAutoSave();
        }, this.autoSave.interval);

        console.log('AutoSaveManager: Auto-save started');
    }

    /**
     * Stop auto-save interval
     */
    stopAutoSave() {
        if (this.autoSave.intervalId) {
            this.app.clearManagedInterval(this.autoSave.intervalId);
            this.autoSave.intervalId = null;
        }
    }

    /**
     * Set up event listeners for auto-save triggers
     */
    setupEventListeners() {
        // Save on form input changes
        this.app.addManagedEventListener(document, 'input', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.markForAutoSave('form-data');
            }
        });

        // Save on component configuration changes
        this.app.addManagedEventListener(document, 'change', (e) => {
            if (e.target.matches('[data-component], [data-config]')) {
                this.markForAutoSave('component-config');
            }
        });

        // Save before navigation
        this.app.addManagedEventListener(window, 'beforeunload', () => {
            this.performImmediateAutoSave();
        });

        // Save when page becomes hidden
        this.app.addManagedEventListener(document, 'visibilitychange', () => {
            if (document.hidden) {
                this.performImmediateAutoSave();
            }
        });
    }

    /**
     * Mark data for auto-save with debouncing
     * @param {string} type - Type of data to save
     */
    markForAutoSave(type) {
        this.autoSave.pendingChanges.add(type);

        // Debounced save for frequent changes
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        this.debounceTimeout = setTimeout(() => {
            this.performAutoSave();
        }, this.autoSave.debounceTime);
    }

    /**
     * Perform auto-save operation
     * @async
     * @returns {Promise<void>}
     */
    async performAutoSave() {
        if (this.autoSave.pendingChanges.size === 0) return;

        try {
            const savePromises = [];

            // Save wizard data
            if (this.app.currentView === 'wizard' && this.app.quoteWizard?.wizardData) {
                savePromises.push(this.saveWizardData());
            }

            // Save component configurations
            if (this.app.currentView === 'components' && this.app.componentManager?.componentData) {
                savePromises.push(this.saveComponentData());
            }

            // Save current project state
            savePromises.push(this.saveCurrentState());

            await Promise.all(savePromises);

            this.autoSave.pendingChanges.clear();
            this.autoSave.lastSave[this.app.currentView] = Date.now();

            // Show subtle notification
            this.showAutoSaveIndicator();

        } catch (error) {
            console.error('AutoSaveManager: Auto-save failed:', error);
            this.app.showNotification('Auto-save failed, your changes may not be saved', 'warning');
        }
    }

    /**
     * Perform immediate auto-save without debouncing
     * @async
     * @returns {Promise<void>}
     */
    async performImmediateAutoSave() {
        // Force immediate save without debouncing
        this.markForAutoSave('immediate');
        await this.performAutoSave();
    }

    /**
     * Save wizard data
     * @async
     * @returns {Promise<void>}
     */
    async saveWizardData() {
        if (!this.app.quoteWizard?.wizardData) return;

        const data = {
            type: 'wizard_progress',
            data: this.app.quoteWizard.wizardData,
            timestamp: Date.now(),
            currentStep: this.app.quoteWizard.currentStep || 0
        };

        if (this.app.dataStore) {
            await this.app.dataStore.saveTemporary('wizard_autosave', data);
        } else {
            localStorage.setItem('naas_wizard_autosave', JSON.stringify(data));
        }
    }

    /**
     * Save component data
     * @async
     * @returns {Promise<void>}
     */
    async saveComponentData() {
        if (!this.app.componentManager?.componentData) return;

        const data = {
            type: 'component_configs',
            data: this.app.componentManager.componentData,
            timestamp: Date.now(),
            selectedComponent: this.app.componentManager.selectedComponent
        };

        if (this.app.dataStore) {
            await this.app.dataStore.saveTemporary('components_autosave', data);
        } else {
            localStorage.setItem('naas_components_autosave', JSON.stringify(data));
        }
    }

    /**
     * Save current application state
     * @async
     * @returns {Promise<void>}
     */
    async saveCurrentState() {
        const state = {
            currentView: this.app.currentView,
            timestamp: Date.now(),
            url: window.location.href,
            viewSpecific: this.getCurrentViewState()
        };

        if (this.app.dataStore) {
            await this.app.dataStore.saveTemporary('app_state', state);
        } else {
            localStorage.setItem('naas_app_state', JSON.stringify(state));
        }
    }

    /**
     * Get view-specific state data
     * @returns {Object} View-specific state
     */
    getCurrentViewState() {
        switch (this.app.currentView) {
            case 'wizard':
                return {
                    currentStep: this.app.quoteWizard?.currentStep || 0,
                    completedSteps: this.app.quoteWizard?.completedSteps || []
                };
            case 'components':
                return {
                    selectedComponent: this.app.componentManager?.selectedComponent,
                    activeConfigurations: this.app.componentManager?.getActiveConfigurations?.() || {}
                };
            case 'history':
                return {
                    selectedQuote: document.querySelector('.selected-quote')?.dataset?.quoteId
                };
            default:
                return {};
        }
    }

    /**
     * Show auto-save indicator
     */
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

    /**
     * Restore all auto-saved data
     * @async
     * @returns {Promise<void>}
     */
    async restoreAutoSavedData() {
        try {
            console.log('AutoSaveManager: Attempting to restore auto-saved data...');

            // Restore wizard data if on wizard view
            if (this.app.currentView === 'wizard') {
                await this.restoreWizardData();
            }

            // Restore component data if on components view
            if (this.app.currentView === 'components') {
                await this.restoreComponentData();
            }

            // Restore general app state
            await this.restoreAppState();

        } catch (error) {
            console.error('AutoSaveManager: Error restoring auto-saved data:', error);
        }
    }

    /**
     * Restore wizard data from auto-save
     * @async
     * @returns {Promise<void>}
     */
    async restoreWizardData() {
        try {
            let savedData = null;

            if (this.app.dataStore) {
                savedData = await this.app.dataStore.getTemporary('wizard_autosave');
            } else {
                const saved = localStorage.getItem('naas_wizard_autosave');
                savedData = saved ? JSON.parse(saved) : null;
            }

            if (savedData && savedData.data && this.app.quoteWizard) {
                const timeDiff = Date.now() - (savedData.timestamp || 0);

                // Only restore if data is not expired
                if (timeDiff < AppConfig.AUTOSAVE_DATA_EXPIRY_MS) {
                    this.app.quoteWizard.wizardData = savedData.data;
                    this.app.quoteWizard.currentStep = savedData.currentStep || 0;

                    this.app.showNotification('Previous wizard progress restored', 'info');
                    console.log('AutoSaveManager: Wizard data restored');
                }
            }
        } catch (error) {
            console.error('AutoSaveManager: Error restoring wizard data:', error);
        }
    }

    /**
     * Restore component data from auto-save
     * @async
     * @returns {Promise<void>}
     */
    async restoreComponentData() {
        try {
            let savedData = null;

            if (this.app.dataStore) {
                savedData = await this.app.dataStore.getTemporary('components_autosave');
            } else {
                const saved = localStorage.getItem('naas_components_autosave');
                savedData = saved ? JSON.parse(saved) : null;
            }

            if (savedData && savedData.data && this.app.componentManager) {
                const timeDiff = Date.now() - (savedData.timestamp || 0);

                if (timeDiff < AppConfig.AUTOSAVE_DATA_EXPIRY_MS) {
                    this.app.componentManager.componentData = savedData.data;
                    this.app.componentManager.selectedComponent = savedData.selectedComponent;

                    this.app.showNotification('Previous component configurations restored', 'info');
                    console.log('AutoSaveManager: Component data restored');
                }
            }
        } catch (error) {
            console.error('AutoSaveManager: Error restoring component data:', error);
        }
    }

    /**
     * Restore app state from auto-save
     * @async
     * @returns {Promise<void>}
     */
    async restoreAppState() {
        try {
            let savedState = null;

            if (this.app.dataStore) {
                savedState = await this.app.dataStore.getTemporary('app_state');
            } else {
                const saved = localStorage.getItem('naas_app_state');
                savedState = saved ? JSON.parse(saved) : null;
            }

            if (savedState) {
                const timeDiff = Date.now() - (savedState.timestamp || 0);

                // Only restore state if not expired and same session
                if (timeDiff < AppConfig.APP_STATE_EXPIRY_MS && savedState.url === window.location.href) {
                    // Could restore view state here if needed
                    console.log('AutoSaveManager: App state information available:', savedState.viewSpecific);
                }
            }
        } catch (error) {
            console.error('AutoSaveManager: Error restoring app state:', error);
        }
    }

    /**
     * Enable auto-save
     */
    enable() {
        this.autoSave.enabled = true;
        this.startAutoSave();
        this.app.showNotification('Auto-save enabled', 'success');
    }

    /**
     * Disable auto-save
     */
    disable() {
        this.autoSave.enabled = false;
        this.stopAutoSave();
        this.app.showNotification('Auto-save disabled', 'info');
    }

    /**
     * Check if auto-save is enabled
     * @returns {boolean} True if enabled
     */
    isEnabled() {
        return this.autoSave.enabled;
    }

    /**
     * Get auto-save statistics
     * @returns {Object} Auto-save statistics
     */
    getStats() {
        return {
            enabled: this.autoSave.enabled,
            pendingChanges: Array.from(this.autoSave.pendingChanges),
            lastSave: this.autoSave.lastSave,
            interval: this.autoSave.interval,
            debounceTime: this.autoSave.debounceTime
        };
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.stopAutoSave();
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        this.autoSave.pendingChanges.clear();
        console.log('AutoSaveManager: Destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoSaveManager;
} else {
    window.AutoSaveManager = AutoSaveManager;
}
