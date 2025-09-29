/**
 * Main Application Entry Point
 * Initializes the NaaS Pricing Calculator with proper error handling and state management
 */

import { ErrorHandler } from './utils/error-handler.js';
import { SecurityUtils } from './utils/security.js';
import { dataStore } from './services/data-store.js';

/**
 * Main Application Class
 * Handles initialization, navigation, and coordination between components
 */
class NaaSCalculatorApp {
  constructor() {
    this.currentView = 'dashboard';
    this.isInitialized = false;
    this.components = new Map();

    // Bind methods to maintain context
    this.handleNavigation = this.handleNavigation.bind(this);
    this.handleViewChange = this.handleViewChange.bind(this);
    this.handleDataChange = this.handleDataChange.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('🚀 Initializing NaaS Pricing Calculator...');

      // Ensure ErrorHandler is available globally
      if (!window.ErrorHandler) {
        window.ErrorHandler = ErrorHandler;
      }

      // Initialize error handling with enhanced capabilities
      ErrorHandler.addListener(this.handleError);

      // Add global error boundary
      this.setupGlobalErrorHandling();

      // Initialize data store with error handling
      try {
        dataStore.addListener(this.handleDataChange);
      } catch (error) {
        console.error('Failed to initialize data store listener:', error);
        // Continue without data listener
      }

      // Initialize UI components with error recovery
      await this.initializeUI();

      // Set up navigation with error handling
      this.setupNavigation();

      // Load initial view with fallback
      const initialView = this.getInitialView();
      await this.loadView(initialView);

      // Setup auto-save with error handling
      this.setupAutoSave();

      // Mark as initialized
      this.isInitialized = true;

      console.log('✅ NaaS Pricing Calculator initialized successfully');

      // Hide loading indicator
      this.hideLoadingIndicator();

    } catch (error) {
      console.error('Critical initialization error:', error);

      // Try to use ErrorHandler if available
      if (ErrorHandler && typeof ErrorHandler.handleError === 'function') {
        ErrorHandler.handleError(error, {
          operation: 'app_initialization',
          severity: 'critical'
        });
      }

      this.showCriticalError();
    }
  }

  /**
   * Setup global error handling for the application
   */
  setupGlobalErrorHandling() {
    // Enhanced global error handler
    window.addEventListener('error', (event) => {
      const error = event.error || new Error(event.message);
      ErrorHandler.handleError(error, {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        operation: 'global_error',
        severity: 'high'
      });
    });

    // Enhanced unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      ErrorHandler.handleError(error, {
        type: 'unhandled_promise',
        operation: 'promise_rejection',
        severity: 'high'
      });

      // Prevent default handling to avoid browser console spam
      event.preventDefault();
    });

    // Network error handling
    window.addEventListener('offline', () => {
      ErrorHandler.showNotification('You are currently offline. Some features may not work.', 'warning');
    });

    window.addEventListener('online', () => {
      ErrorHandler.showNotification('Connection restored.', 'success');
    });

    // Add error boundary for specific DOM events
    document.addEventListener('click', (event) => {
      const target = event.target;

      // Check if click target has error-prone data attributes
      if (target.dataset.component && !target.onclick) {
        try {
          // Validate component exists before navigation
          const componentType = target.dataset.component;
          if (this.componentDefinitions && !this.componentDefinitions[componentType]) {
            ErrorHandler.handleError(new Error(`Invalid component: ${componentType}`), {
              operation: 'component_click',
              componentType,
              severity: 'medium'
            });
            event.preventDefault();
            return;
          }
        } catch (error) {
          ErrorHandler.handleError(error, {
            operation: 'component_validation',
            severity: 'low'
          });
        }
      }
    });
  }

  /**
   * Get initial view from URL or default to dashboard
   */
  getInitialView() {
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');

    const validViews = ['dashboard', 'components', 'wizard', 'history'];
    return validViews.includes(view) ? view : 'dashboard';
  }

  /**
   * Initialize UI components
   */
  async initializeUI() {
    try {
      // Load component definitions
      await this.loadComponentDefinitions();

      // Initialize dashboard
      this.initializeDashboard();

      // Initialize components view
      this.initializeComponentsView();

      // Initialize wizard
      this.initializeWizard();

      // Initialize history view
      this.initializeHistoryView();

      // Initialize import/export modals
      this.initializeModals();

    } catch (error) {
      throw new Error(`UI initialization failed: ${error.message}`);
    }
  }

  /**
   * Load component definitions
   */
  async loadComponentDefinitions() {
    this.componentDefinitions = {
      prtg: {
        name: 'PRTG Monitoring',
        icon: 'fas fa-chart-line',
        color: 'blue',
        description: 'Network monitoring and alerting',
        basePrice: { monthly: 45, setup: 150 },
        category: 'monitoring'
      },
      capital: {
        name: 'Capital Equipment',
        icon: 'fas fa-server',
        color: 'green',
        description: 'Hardware and infrastructure',
        basePrice: { monthly: 0, setup: 0 },
        category: 'hardware'
      },
      support: {
        name: 'Support Services',
        icon: 'fas fa-headset',
        color: 'purple',
        description: 'Technical support and maintenance',
        basePrice: { monthly: 150, setup: 0 },
        category: 'support'
      },
      onboarding: {
        name: 'Onboarding',
        icon: 'fas fa-rocket',
        color: 'orange',
        description: 'Professional setup and configuration',
        basePrice: { monthly: 0, setup: 2500 },
        category: 'services'
      },
      pbsFoundation: {
        name: 'PBS Foundation',
        icon: 'fas fa-foundation',
        color: 'indigo',
        description: 'Business intelligence platform',
        basePrice: { monthly: 200, setup: 1000 },
        category: 'software'
      },
      assessment: {
        name: 'Network Assessment',
        icon: 'fas fa-search',
        color: 'red',
        description: 'Comprehensive network analysis',
        basePrice: { monthly: 0, setup: 5000 },
        category: 'services'
      },
      admin: {
        name: 'Admin Services',
        icon: 'fas fa-user-cog',
        color: 'gray',
        description: 'Administrative and management services',
        basePrice: { monthly: 100, setup: 0 },
        category: 'services'
      },
      otherCosts: {
        name: 'Other Costs',
        icon: 'fas fa-plus-circle',
        color: 'yellow',
        description: 'Additional costs and customizations',
        basePrice: { monthly: 0, setup: 0 },
        category: 'misc'
      },
      enhancedSupport: {
        name: 'Enhanced Support',
        icon: 'fas fa-shield-alt',
        color: 'emerald',
        description: 'Premium support with SLA guarantees',
        basePrice: { monthly: 300, setup: 0 },
        category: 'support'
      }
    };
  }

  /**
   * Setup navigation event handlers
   */
  setupNavigation() {
    // Desktop navigation
    const navButtons = document.querySelectorAll('[data-view]');
    navButtons.forEach(button => {
      button.addEventListener('click', this.handleNavigation);
    });

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        const isExpanded = !mobileMenu.classList.contains('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', isExpanded);
      });
    }

    // Import/Export buttons
    const importBtn = document.getElementById('importBtn');
    const exportBtn = document.getElementById('exportBtn');

    if (importBtn) {
      importBtn.addEventListener('click', () => this.showModal('import'));
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.showModal('export'));
    }
  }

  /**
   * Handle navigation clicks
   */
  async handleNavigation(event) {
    event.preventDefault();
    const view = event.currentTarget.dataset.view;

    if (view && view !== this.currentView) {
      await this.loadView(view);
    }
  }

  /**
   * Load and display a specific view
   */
  async loadView(viewName) {
    try {
      if (!this.isValidView(viewName)) {
        throw new Error(`Invalid view: ${viewName}`);
      }

      // Hide all views
      this.hideAllViews();

      // Update navigation state
      this.updateNavigationState(viewName);

      // Show target view
      const viewElement = document.getElementById(`${viewName}View`);
      if (viewElement) {
        viewElement.classList.remove('hidden');
        viewElement.classList.add('view-content');
      }

      // Load view-specific content
      await this.loadViewContent(viewName);

      // Update current view
      this.currentView = viewName;

      // Update URL without page reload
      this.updateURL(viewName);

      console.log(`📄 Loaded view: ${viewName}`);

    } catch (error) {
      ErrorHandler.handleError(error, {
        operation: 'load_view',
        view: viewName
      });
    }
  }

  /**
   * Check if view name is valid
   */
  isValidView(viewName) {
    const validViews = ['dashboard', 'components', 'wizard', 'history'];
    return validViews.includes(viewName);
  }

  /**
   * Hide all view elements
   */
  hideAllViews() {
    const views = document.querySelectorAll('.view-content');
    views.forEach(view => {
      view.classList.add('hidden');
    });
  }

  /**
   * Update navigation button states
   */
  updateNavigationState(activeView) {
    // Desktop navigation
    const navButtons = document.querySelectorAll('[data-view]');
    navButtons.forEach(button => {
      const isActive = button.dataset.view === activeView;

      if (isActive) {
        button.classList.add('active');
        button.classList.remove('border-transparent', 'text-gray-400');
        button.classList.add('border-qolcom-green', 'text-qolcom-green', 'bg-qolcom-green', 'bg-opacity-20');
      } else {
        button.classList.remove('active');
        button.classList.remove('border-qolcom-green', 'text-qolcom-green', 'bg-qolcom-green', 'bg-opacity-20');
        button.classList.add('border-transparent', 'text-gray-400');
      }
    });
  }

  /**
   * Load view-specific content
   */
  async loadViewContent(viewName) {
    switch (viewName) {
      case 'dashboard':
        await this.loadDashboardContent();
        break;
      case 'components':
        await this.loadComponentsContent();
        break;
      case 'wizard':
        await this.loadWizardContent();
        break;
      case 'history':
        await this.loadHistoryContent();
        break;
      default:
        console.warn(`No content loader for view: ${viewName}`);
    }
  }

  /**
   * Load dashboard content
   */
  async loadDashboardContent() {
    const dashboardComponents = document.getElementById('dashboardComponents');
    if (!dashboardComponents) return;

    let html = '';

    Object.entries(this.componentDefinitions).forEach(([key, component]) => {
      const componentData = dataStore.getComponent(key);
      const hasResults = componentData.results && componentData.results.totals;
      const price = hasResults ?
        `£${componentData.results.totals.monthly.toFixed(2)}/mo` :
        `from £${component.basePrice.monthly}/mo`;

      html += `
        <div class="component-card cursor-pointer border-top border-${component.color}-500"
             data-component="${key}"
             onclick="app.navigateToComponent('${key}')">
          <div class="component-icon bg-${component.color}-100 text-${component.color}-600 mb-3">
            <i class="${component.icon}"></i>
          </div>
          <h3 class="font-semibold mb-2">${component.name}</h3>
          <p class="text-sm text-gray-400 mb-3 line-clamp-2">${component.description}</p>
          <div class="flex justify-between items-center">
            <span class="text-lg font-bold text-qolcom-green">${price}</span>
            <span class="material-icons text-gray-400">arrow_forward</span>
          </div>
        </div>
      `;
    });

    SecurityUtils.setHTML(dashboardComponents, html);

    // Load recent quotes
    this.loadRecentQuotes();
  }

  /**
   * Load recent quotes
   */
  loadRecentQuotes() {
    const recentQuotes = document.getElementById('recentQuotes');
    if (!recentQuotes) return;

    const savedComponents = JSON.parse(localStorage.getItem('naas_saved_components') || '{}');
    const recentItems = Object.values(savedComponents)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    if (recentItems.length === 0) {
      SecurityUtils.setHTML(recentQuotes, `
        <div class="text-center py-8">
          <span class="material-icons text-4xl text-gray-400 mb-4">history</span>
          <p class="text-gray-400">No recent quotes found</p>
          <button onclick="app.loadView('wizard')"
                  class="mt-4 bg-qolcom-green text-white px-4 py-2 rounded-lg hover:bg-opacity-80">
            Create Your First Quote
          </button>
        </div>
      `);
      return;
    }

    let html = '';
    recentItems.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString();
      const total = item.result?.totals?.monthly || 0;

      html += `
        <div class="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
          <div>
            <div class="font-medium text-gray-200">${item.name}</div>
            <div class="text-sm text-gray-400">${date}</div>
          </div>
          <div class="text-right">
            <div class="font-semibold text-qolcom-green">£${total.toFixed(2)}/mo</div>
          </div>
        </div>
      `;
    });

    SecurityUtils.setHTML(recentQuotes, html);
  }

  /**
   * Navigate to specific component
   */
  async navigateToComponent(componentType) {
    try {
      // Validate component type
      if (!componentType || typeof componentType !== 'string') {
        throw new Error('Invalid component type provided');
      }

      // Check if component exists in definitions
      if (!this.componentDefinitions[componentType]) {
        ErrorHandler.handleError(new Error(`Component '${componentType}' not found`), {
          operation: 'navigate_to_component',
          componentType,
          severity: 'medium'
        });
        return;
      }

      await this.loadView('components');

      // Wait for view to load, then select component
      setTimeout(() => {
        try {
          // Try multiple selection methods based on available APIs
          if (window.componentManager && typeof window.componentManager.selectComponentFromDashboard === 'function') {
            window.componentManager.selectComponentFromDashboard(componentType);
          } else if (window.app && window.app.componentManager && typeof window.app.componentManager.selectComponent === 'function') {
            window.app.componentManager.selectComponent(componentType);
          } else if (typeof window.selectComponent === 'function') {
            window.selectComponent(componentType);
          } else {
            // Fallback: try to simulate click on component
            const componentItem = document.querySelector(`[data-component="${componentType}"]`);
            if (componentItem) {
              componentItem.click();
            } else {
              ErrorHandler.handleError(new Error('No component selection method available'), {
                operation: 'navigate_to_component',
                componentType,
                severity: 'low'
              });
            }
          }
        } catch (error) {
          ErrorHandler.handleError(error, {
            operation: 'component_selection',
            componentType,
            severity: 'medium'
          });
        }
      }, 150); // Slightly longer delay to ensure proper initialization

    } catch (error) {
      ErrorHandler.handleError(error, {
        operation: 'navigate_to_component',
        componentType,
        severity: 'high'
      });
    }
  }

  /**
   * Initialize dashboard
   */
  initializeDashboard() {
    const startFullQuoteBtn = document.getElementById('startFullQuoteBtn');
    if (startFullQuoteBtn) {
      startFullQuoteBtn.addEventListener('click', () => {
        this.loadView('wizard');
      });
    }
  }

  /**
   * Initialize components view
   */
  initializeComponentsView() {
    // This will be expanded when we create the full components module
    console.log('Components view initialized');
  }

  /**
   * Initialize wizard
   */
  initializeWizard() {
    // This will be expanded when we create the full wizard module
    console.log('Wizard initialized');
  }

  /**
   * Initialize history view
   */
  initializeHistoryView() {
    // This will be expanded when we create the full history module
    console.log('History view initialized');
  }

  /**
   * Initialize modals
   */
  initializeModals() {
    // Modal close handlers
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.hideModal(modal);
        });
      }
    });

    // Click outside to close
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('modal')) {
        this.hideModal(event.target);
      }
    });
  }

  /**
   * Show modal
   */
  showModal(modalName) {
    const modal = document.getElementById(`${modalName}Modal`);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  /**
   * Hide modal
   */
  hideModal(modal) {
    if (typeof modal === 'string') {
      modal = document.getElementById(modal);
    }

    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Setup auto-save functionality
   */
  setupAutoSave() {
    // Auto-save every 30 seconds
    setInterval(() => {
      if (this.isInitialized) {
        dataStore.saveToStorage();
      }
    }, 30000);

    // Save on page unload
    window.addEventListener('beforeunload', () => {
      dataStore.saveToStorage();
    });
  }

  /**
   * Handle data changes
   */
  handleDataChange(event) {
    console.log('Data changed:', event.type, event.data);

    // Refresh current view if needed
    if (this.currentView === 'dashboard') {
      this.loadRecentQuotes();
    }
  }

  /**
   * Handle view changes
   */
  handleViewChange(viewName) {
    this.loadView(viewName);
  }

  /**
   * Handle application errors
   */
  handleError(errorInfo) {
    if (errorInfo.context?.severity === 'critical') {
      this.showCriticalError(errorInfo);
    }
  }

  /**
   * Show critical error screen
   */
  showCriticalError(errorInfo = null) {
    const errorBoundary = document.getElementById('errorBoundary');
    const errorMessage = document.getElementById('errorMessage');

    if (errorBoundary) {
      if (errorMessage && errorInfo) {
        errorMessage.textContent = ErrorHandler.getUserFriendlyMessage(errorInfo);
      }

      errorBoundary.classList.remove('hidden');
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }

  /**
   * Update URL without page reload
   */
  updateURL(viewName) {
    const url = new URL(window.location);
    if (viewName === 'dashboard') {
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', viewName);
    }
    window.history.replaceState({}, '', url);
  }

  /**
   * Load components content
   */
  async loadComponentsContent() {
    // Placeholder - will be implemented with full component system
    console.log('Loading components content...');
  }

  /**
   * Load wizard content
   */
  async loadWizardContent() {
    // Placeholder - will be implemented with full wizard system
    console.log('Loading wizard content...');
  }

  /**
   * Load history content
   */
  async loadHistoryContent() {
    // Placeholder - will be implemented with full history system
    console.log('Loading history content...');
  }
}

// Initialize the application when DOM is loaded
let app;

document.addEventListener('DOMContentLoaded', async () => {
  app = new NaaSCalculatorApp();

  // Make app globally accessible for event handlers
  window.app = app;

  await app.init();
});

// Export for testing
export { NaaSCalculatorApp };