/**
 * NaaS Pricing Calculator - Main Application Controller
 * Orchestrates all components and manages application state
 */

class NaaSApp {
    constructor() {
        this.currentView = 'dashboard';
        this.calculator = new NaaSCalculator();
        this.componentManager = null;
        this.quoteWizard = null;
        this.importExportManager = null;
        this.liveUpdates = true;
        
        this.init();
    }

    async init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        // Wait for data store to be available
        if (!window.quoteDataStore) {
            console.error('Data store not available');
            return;
        }
        this.dataStore = window.quoteDataStore;
        
        // Initialize managers
        this.componentManager = new ComponentManager(this.calculator);
        this.quoteWizard = new QuoteWizard(this.calculator);
        window.quoteWizard = this.quoteWizard; // Make globally accessible
        this.importExportManager = new ImportExportManager(this.calculator);
        
        // Set global references for cross-component communication
        window.componentManager = this.componentManager;
        window.quoteWizard = this.quoteWizard;
        window.importExportManager = this.importExportManager;
        
        // Set up data store event listeners for synchronization
        this.setupDataStoreListeners();
        
        // Bind navigation events
        this.bindNavigationEvents();
        
        // Initialize views
        this.initializeViews();
        
        // Load saved data
        this.loadSavedData();
        
        // Start real-time updates
        this.startLiveUpdates();
        
        // Initialize component manager
        if (this.componentManager) {
            this.componentManager.initializeComponents();
        }
        
        // Initialize dashboard with sample data
        this.initializeDashboard();
        
        // Show desktop navigation by default
        const desktopNav = document.getElementById('desktopNav');
        if (desktopNav) {
            desktopNav.classList.remove('hidden');
        }
        
        console.log('NaaS Pricing Calculator initialized successfully');
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

    bindNavigationEvents() {
        // Navigation buttons
        document.getElementById('dashboardBtn')?.addEventListener('click', () => {
            this.showView('dashboard');
        });

        document.getElementById('componentsBtn')?.addEventListener('click', () => {
            this.showView('components');
        });

        document.getElementById('wizardBtn')?.addEventListener('click', () => {
            this.showView('wizard');
            this.quoteWizard.initializeWizard();
        });

        document.getElementById('historyBtn')?.addEventListener('click', () => {
            this.showView('history');
            this.loadHistory();
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

        // Live pricing toggle
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                this.toggleLiveUpdates();
            }
        });
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.add('hidden');
        });

        // Show selected view
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.remove('hidden');
        }

        // Update navigation state
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.classList.add('border-transparent', 'text-gray-500');
            btn.classList.remove('border-blue-500', 'text-blue-600');
        });

        const activeBtn = document.getElementById(`${viewName}Btn`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.classList.remove('border-transparent', 'text-gray-500');
            activeBtn.classList.add('border-blue-500', 'text-blue-600');
        }

        // Update mobile navigation state
        this.updateMobileNavState(viewName);

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
    }

    initializeViews() {
        // Set up view-specific functionality
        this.showView('dashboard'); // Start with dashboard
        
        // Bind dashboard component cards
        document.querySelectorAll('.component-card[data-component]').forEach(card => {
            card.addEventListener('click', () => {
                const componentType = card.dataset.component;
                this.showView('components');
                setTimeout(() => {
                    this.componentManager.selectComponent(componentType);
                }, 100);
            });
        });
    }

    initializeComponentsView() {
        if (this.componentManager) {
            this.componentManager.initializeComponents();
        }
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const desktopNav = document.getElementById('desktopNav');
        
        if (mobileMenu && desktopNav) {
            const isHidden = mobileMenu.classList.contains('hidden');
            
            if (isHidden) {
                // Show mobile menu, hide desktop nav
                mobileMenu.classList.remove('hidden');
                desktopNav.classList.add('hidden');
            } else {
                // Hide mobile menu, show desktop nav
                mobileMenu.classList.add('hidden');
                desktopNav.classList.remove('hidden');
            }
        }
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
        if (!container || !this.componentManager) return;

        const components = this.componentManager.components;
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

        container.innerHTML = html;

        // Bind click events to new cards
        container.querySelectorAll('.component-card[data-component]').forEach(card => {
            card.addEventListener('click', () => {
                const componentType = card.dataset.component;
                this.showView('components');
                setTimeout(() => {
                    this.componentManager.selectComponent(componentType);
                }, 100);
            });
        });
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
                }, 100);
            }
        } else if (type === 'full') {
            const savedQuotes = JSON.parse(localStorage.getItem('naas_full_quotes') || '{}');
            const quote = Object.values(savedQuotes).find(item => item.timestamp === timestamp);
            
            if (quote) {
                this.showView('wizard');
                setTimeout(() => {
                    this.quoteWizard.wizardData = quote.data;
                    this.quoteWizard.initializeWizard();
                }, 100);
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

        // Update dashboard prices every 30 seconds (in case of external data changes)
        setInterval(() => {
            if (this.currentView === 'dashboard') {
                this.updateDashboardPricing();
            }
        }, 30000);

        // Auto-save wizard data every 10 seconds
        setInterval(() => {
            if (this.currentView === 'wizard' && this.quoteWizard && this.quoteWizard.wizardData) {
                const hasData = Object.keys(this.quoteWizard.wizardData).some(key => 
                    key !== 'project' && this.quoteWizard.wizardData[key].enabled
                );
                
                if (hasData) {
                    localStorage.setItem('naas_full_quote', JSON.stringify(this.quoteWizard.wizardData));
                }
            }
        }, 10000);

        // Auto-save component data when changed
        document.addEventListener('input', (e) => {
            if (this.currentView === 'components' && e.target.closest('#componentConfigArea')) {
                // Debounced save
                clearTimeout(this.componentSaveTimeout);
                this.componentSaveTimeout = setTimeout(() => {
                    if (this.componentManager && this.componentManager.currentComponent) {
                        const key = `component_${this.componentManager.currentComponent}_temp`;
                        localStorage.setItem(key, JSON.stringify(this.componentManager.componentData[this.componentManager.currentComponent]));
                    }
                }, 2000);
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

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            type === 'success' ? 'bg-green-600 text-white' : 
            type === 'error' ? 'bg-red-600 text-white' : 
            type === 'warning' ? 'bg-yellow-600 text-white' :
            'bg-blue-600 text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${
                    type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' :
                    'info-circle'
                } mr-2"></i>
                ${message}
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Utility method for debugging
    getState() {
        return {
            currentView: this.currentView,
            componentData: this.componentManager?.componentData,
            wizardData: this.quoteWizard?.wizardData,
            liveUpdates: this.liveUpdates
        };
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new NaaSApp();
    
    // Global error handler
    window.addEventListener('error', (e) => {
        console.error('Application error:', e.error);
        app?.showNotification('An unexpected error occurred. Please refresh the page.', 'error');
    });
    
    // Global unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        app?.showNotification('A background process failed. Some features may not work correctly.', 'warning');
    });
});

// Expose app for debugging
window.app = app;