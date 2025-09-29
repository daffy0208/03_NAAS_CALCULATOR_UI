/**
 * NaaS Pricing Calculator - Component Management
 * Handles individual component pricing interfaces and logic
 */

class ComponentManager {
    constructor(calculator) {
        this.calculator = calculator;
        this.currentComponent = null;
        this.dataStore = window.quoteDataStore;

        // Initialize calculation orchestrator with error handling
        try {
            this.orchestrator = new CalculationOrchestrator(calculator, this.dataStore);
        } catch (error) {
            console.error('Failed to initialize calculation orchestrator:', error);
            this.orchestrator = null; // Fallback to direct calculations
        }

        // Listen for calculation completion events
        this.setupCalculationListeners();

        // Initialize component data structure
        this.componentData = {
            prtg: {},
            capital: { equipment: [] },
            enhancedSupport: {},
            managedServices: {},
            professionalServices: {},
            admin: {},
            assessment: {},
            otherCosts: {}
        };

        // Load saved component data
        this.loadComponentData();
        this.components = {
            help: {
                name: 'Help & Instructions',
                icon: 'fas fa-question-circle',
                color: 'blue',
                description: 'User guide and instructions for the NaaS calculator',
                category: 'Help'
            },
            enhancedSupport: {
                name: 'Enhanced Support',
                icon: 'fas fa-star',
                color: 'red',
                description: 'Premium support and monitoring services',
                category: 'Services'
            },
            onboarding: {
                name: 'Onboarding',
                icon: 'fas fa-rocket',
                color: 'green',
                description: 'Initial setup and implementation',
                category: 'Services'
            },
            capital: {
                name: 'Capital Equipment',
                icon: 'fas fa-server',
                color: 'purple',
                description: 'Hardware costs and equipment financing',
                category: 'Hardware'
            },
            pbsFoundation: {
                name: 'PBS Foundation',
                icon: 'fas fa-building',
                color: 'indigo',
                description: 'Foundation services and administration',
                category: 'Platform'
            },
            support: {
                name: 'Support Services',
                icon: 'fas fa-headset',
                color: 'orange',
                description: '24/7 support and maintenance services',
                category: 'Services'
            },
            assessment: {
                name: 'Platform Assessment',
                icon: 'fas fa-clipboard-check',
                color: 'teal',
                description: 'Network assessment and discovery services',
                category: 'Services'
            },
            prtg: {
                name: 'PRTG Monitoring',
                icon: 'fas fa-chart-line',
                color: 'blue',
                description: 'Network monitoring setup and licensing costs',
                category: 'Monitoring'
            },
            admin: {
                name: 'Admin Services',
                icon: 'fas fa-cogs',
                color: 'gray',
                description: 'Administrative and review services',
                category: 'Services'
            },
            otherCosts: {
                name: 'Other Costs',
                icon: 'fas fa-plus-circle',
                color: 'yellow',
                description: 'Additional equipment and services',
                category: 'Additional'
            },
            dynamics1Year: {
                name: 'Dynamics 1 Year',
                icon: 'fas fa-calendar',
                color: 'pink',
                description: '1-year dynamic pricing calculations',
                category: 'Pricing'
            },
            dynamics3Year: {
                name: 'Dynamics 3 Year',
                icon: 'fas fa-calendar-alt',
                color: 'pink',
                description: '3-year dynamic pricing calculations',
                category: 'Pricing'
            },
            dynamics5Year: {
                name: 'Dynamics 5 Year',
                icon: 'fas fa-calendar-week',
                color: 'pink',
                description: '5-year dynamic pricing calculations',
                category: 'Pricing'
            },
            naasStandard: {
                name: 'NaaS Standard',
                icon: 'fas fa-layer-group',
                color: 'cyan',
                description: 'Standard NaaS service package',
                category: 'Package'
            },
            naasEnhanced: {
                name: 'NaaS Enhanced',
                icon: 'fas fa-layer-group',
                color: 'cyan',
                description: 'Enhanced NaaS service package',
                category: 'Package'
            }
        };
        
        this.initializeComponents();
    }

    setupCalculationListeners() {
        // Listen for calculation completion events
        try {
            document.addEventListener('calculationsComplete', (event) => {
                const { results } = event.detail;
                this.handleCalculationResults(results);
            });
        } catch (error) {
            console.error('Failed to setup calculation listeners:', error);
        }
    }

    handleCalculationResults(results) {
        try {
            // Update UI with calculation results
            Object.keys(results).forEach(componentType => {
                const result = results[componentType];
                if (result.error) {
                    console.error(`Calculation error for ${componentType}:`, result.error);
                    // Don't show notification for calculation errors - they're not critical
                    return;
                }

                // Update component results display
                this.updateComponentResults(componentType, result);

                // Update dashboard if visible
                this.updateDashboardComponent(componentType, result);
            });
        } catch (error) {
            console.error('Failed to handle calculation results:', error);
        }
    }

    updateComponentResults(componentType, result) {
        const resultsContainer = document.getElementById(`componentResults`);
        const componentResultsContainer = document.getElementById(`${componentType}Results`);

        if (componentResultsContainer) {
            componentResultsContainer.innerHTML = this.renderResults(result);
        } else if (resultsContainer && this.currentComponent === componentType) {
            // Update main results area if this is the current component
            resultsContainer.innerHTML = this.renderResults(result);
        }
    }

    initializeComponents() {
        this.populateComponentList();
        this.bindComponentEvents();
    }

    getMaterialIcon(componentType) {
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
        return iconMap[componentType] || 'widgets';
    }

    populateComponentList() {
        const componentList = document.getElementById('componentList');
        if (!componentList) {
            console.error('componentList element not found');
            return;
        }

        console.log('Populating component list with', Object.keys(this.components).length, 'components');

        // Performance optimization: Build all HTML as one string, then set innerHTML once
        const componentItems = Object.keys(this.components).map(key => {
            const component = this.components[key];

            // Map component types to exact colors from renders document - matching the colored accents
            const colorMap = {
                help: { icon: 'text-[var(--qolcom-green)]', bg: 'bg-gray-700', price: 'text-[var(--qolcom-green)]', tag: 'text-[var(--qolcom-green)]' },
                prtg: { icon: 'text-purple-400', bg: 'bg-purple-900 bg-opacity-50', price: 'text-purple-400', tag: 'text-purple-300' },
                capital: { icon: 'text-indigo-400', bg: 'bg-indigo-900 bg-opacity-50', price: 'text-indigo-400', tag: 'text-indigo-300' },
                support: { icon: 'text-cyan-400', bg: 'bg-cyan-900 bg-opacity-50', price: 'text-cyan-400', tag: 'text-cyan-300' },
                onboarding: { icon: 'text-emerald-400', bg: 'bg-emerald-900 bg-opacity-50', price: 'text-emerald-400', tag: 'text-emerald-300' },
                pbsFoundation: { icon: 'text-blue-400', bg: 'bg-blue-900 bg-opacity-50', price: 'text-blue-400', tag: 'text-blue-300' },
                assessment: { icon: 'text-gray-400', bg: 'bg-gray-700', price: 'text-gray-400', tag: 'text-gray-300' },
                admin: { icon: 'text-slate-400', bg: 'bg-slate-700', price: 'text-slate-400', tag: 'text-slate-300' },
                otherCosts: { icon: 'text-orange-400', bg: 'bg-orange-900 bg-opacity-50', price: 'text-orange-400', tag: 'text-orange-300' },
                enhancedSupport: { icon: 'text-red-400', bg: 'bg-red-900 bg-opacity-50', price: 'text-red-400', tag: 'text-red-300' },
                dynamics1Year: { icon: 'text-blue-400', bg: 'bg-blue-900 bg-opacity-50', price: 'text-blue-400', tag: 'text-blue-300' },
                dynamics3Year: { icon: 'text-blue-400', bg: 'bg-blue-900 bg-opacity-50', price: 'text-blue-400', tag: 'text-blue-300' },
                dynamics5Year: { icon: 'text-blue-400', bg: 'bg-blue-900 bg-opacity-50', price: 'text-blue-400', tag: 'text-blue-300' },
                naasStandard: { icon: 'text-[var(--qolcom-green)]', bg: 'bg-gray-700', price: 'text-[var(--qolcom-green)]', tag: 'text-[var(--qolcom-green)]' },
                naasEnhanced: { icon: 'text-[var(--qolcom-green)]', bg: 'bg-gray-700', price: 'text-[var(--qolcom-green)]', tag: 'text-[var(--qolcom-green)]' }
            };

            const colors = colorMap[key] || { icon: 'text-gray-400', bg: 'bg-gray-700', price: 'text-gray-400' };

            return `
                <div class="component-item" data-component="${key}">
                    <div class="flex items-center space-x-3">
                        <div class="component-icon ${colors.bg} p-2 rounded-full">
                            <span class="material-icons ${colors.icon}">${this.getMaterialIcon(key)}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-gray-200 truncate">${component.name}</div>
                            <div class="text-sm text-gray-400">${component.category}</div>
                        </div>
                        <div class="text-right flex-shrink-0">
                            <div class="text-sm font-medium ${colors.price}" id="price-${key}">-</div>
                            <div class="text-xs text-gray-500">per month</div>
                        </div>
                    </div>
                </div>
            `;
        });

        // Single DOM write instead of multiple appendChild calls
        componentList.innerHTML = componentItems.join('');
    }

    bindComponentEvents() {
        // Component selection
        document.addEventListener('click', (e) => {
            const componentItem = e.target.closest('.component-item');
            if (componentItem) {
                const componentType = componentItem.dataset.component;
                this.selectComponent(componentType);
            }

            const componentCard = e.target.closest('.component-card[data-component]');
            if (componentCard) {
                const componentType = componentCard.dataset.component;
                this.selectComponentFromDashboard(componentType);
            }
        });

        // Form input changes
        document.addEventListener('input', (e) => {
            if (e.target.closest('#componentConfigArea')) {
                this.handleInputChange(e);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.closest('#componentConfigArea')) {
                this.handleInputChange(e);
            }
        });
    }

    selectComponent(componentType) {
        try {
            // Validate component type
            if (!componentType || typeof componentType !== 'string') {
                throw new Error('Invalid component type provided to selectComponent');
            }

            // Validate component exists
            if (!this.components || !this.components[componentType]) {
                throw new Error(`Component '${componentType}' not found in component definitions`);
            }

            console.log(`Selecting component: ${componentType}`);

            // Update UI state with error handling
            try {
                document.querySelectorAll('.component-item').forEach(item => {
                    item.classList.remove('active');
                });

                const selectedItem = document.querySelector(`[data-component="${componentType}"]`);
                if (selectedItem) {
                    selectedItem.classList.add('active');
                } else {
                    console.warn(`Component item with data-component="${componentType}" not found in DOM`);
                }
            } catch (uiError) {
                console.warn('Error updating component UI state:', uiError);
                // Continue with component selection even if UI update fails
            }

            // Update internal state
            this.currentComponent = componentType;

            // Render component configuration with error handling
            try {
                this.renderComponentConfig(componentType);
            } catch (renderError) {
                console.error('Error rendering component config:', renderError);

                // Show fallback content
                const configArea = document.getElementById('componentConfigArea');
                if (configArea) {
                    configArea.innerHTML = `
                        <div class="text-center py-12">
                            <span class="material-icons text-4xl text-red-400 mb-4">error_outline</span>
                            <p class="text-red-400 mb-4">Error loading ${this.components[componentType].name} configuration</p>
                            <button onclick="location.reload()" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
                                Refresh Page
                            </button>
                        </div>
                    `;
                }

                // Re-throw to be caught by outer handler
                throw renderError;
            }

        } catch (error) {
            console.error('Error selecting component:', error);

            // Use global error handler if available
            if (window.ErrorHandler && typeof window.ErrorHandler.handleError === 'function') {
                window.ErrorHandler.handleError(error, {
                    operation: 'select_component',
                    componentType,
                    severity: 'medium'
                });
            } else if (window.app && typeof window.app.showError === 'function') {
                window.app.showError(`Error selecting ${componentType}: ${error.message}`);
            } else {
                // Fallback: show alert (not ideal, but better than silent failure)
                console.warn('No error display method available, showing alert');
                alert(`Error selecting component: ${error.message}`);
            }
        }
    }

    selectComponentFromDashboard(componentType) {
        try {
            // Validate component type first
            if (!componentType || typeof componentType !== 'string') {
                throw new Error('Invalid component type provided to selectComponentFromDashboard');
            }

            console.log(`Selecting component from dashboard: ${componentType}`);

            // Find and click components button with error handling
            const componentsBtn = document.getElementById('componentsBtn');
            if (!componentsBtn) {
                throw new Error('Components button not found - cannot navigate to components view');
            }

            // Check if component exists before navigation
            if (!this.components || !this.components[componentType]) {
                throw new Error(`Component '${componentType}' not found in component definitions`);
            }

            componentsBtn.click();

            // Use a slightly longer timeout and add error handling
            setTimeout(() => {
                try {
                    this.selectComponent(componentType);
                } catch (delayedError) {
                    console.error('Delayed error selecting component:', delayedError);

                    // Use error handler if available
                    if (window.ErrorHandler && typeof window.ErrorHandler.handleError === 'function') {
                        window.ErrorHandler.handleError(delayedError, {
                            operation: 'delayed_select_component',
                            componentType,
                            severity: 'medium'
                        });
                    }
                }
            }, 150); // Slightly longer delay for better reliability

        } catch (error) {
            console.error('Error selecting component from dashboard:', error);

            // Use global error handler if available
            if (window.ErrorHandler && typeof window.ErrorHandler.handleError === 'function') {
                window.ErrorHandler.handleError(error, {
                    operation: 'select_component_from_dashboard',
                    componentType,
                    severity: 'medium'
                });
            } else if (window.app && typeof window.app.showError === 'function') {
                window.app.showError(`Error navigating to ${componentType}: ${error.message}`);
            }
        }
    }

    renderComponentConfig(componentType) {
        try {
            const configArea = document.getElementById('componentConfigArea');
            if (!configArea) return;

        const component = this.components[componentType];
        if (!component) return;

        let configHTML = '';

        switch (componentType) {
            case 'help':
                configHTML = this.renderHelpConfig();
                break;
            case 'prtg':
                configHTML = this.renderPRTGConfig();
                break;
            case 'capital':
                configHTML = this.renderCapitalConfig();
                break;
            case 'support':
                configHTML = this.renderSupportConfig();
                break;
            case 'onboarding':
                configHTML = this.renderOnboardingConfig();
                break;
            case 'pbsFoundation':
                configHTML = this.renderPBSFoundationConfig();
                break;
            case 'assessment':
                configHTML = this.renderAssessmentConfig();
                break;
            case 'admin':
                configHTML = this.renderAdminConfig();
                break;
            case 'otherCosts':
                configHTML = this.renderOtherCostsConfig();
                break;
            case 'enhancedSupport':
                configHTML = this.renderEnhancedSupportConfig();
                break;
            case 'dynamics1Year':
                configHTML = this.renderDynamicsConfig(1);
                break;
            case 'dynamics3Year':
                configHTML = this.renderDynamicsConfig(3);
                break;
            case 'dynamics5Year':
                configHTML = this.renderDynamicsConfig(5);
                break;
            case 'naasStandard':
                configHTML = this.renderNaaSConfig('standard');
                break;
            case 'naasEnhanced':
                configHTML = this.renderNaaSConfig('enhanced');
                break;
        }

        // Get color mapping for component
        const colorMap = {
            help: { icon: 'text-[var(--qolcom-green)]', bg: 'bg-gray-700', iconBg: 'bg-gray-200' },
            prtg: { icon: 'text-purple-600', bg: 'bg-purple-50', iconBg: 'bg-purple-100' },
            capital: { icon: 'text-indigo-600', bg: 'bg-indigo-50', iconBg: 'bg-indigo-100' },
            support: { icon: 'text-cyan-600', bg: 'bg-cyan-50', iconBg: 'bg-cyan-100' },
            onboarding: { icon: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100' },
            pbsFoundation: { icon: 'text-blue-600', bg: 'bg-blue-50', iconBg: 'bg-blue-100' },
            assessment: { icon: 'text-gray-600', bg: 'bg-gray-50', iconBg: 'bg-gray-100' },
            admin: { icon: 'text-slate-600', bg: 'bg-slate-50', iconBg: 'bg-slate-100' },
            otherCosts: { icon: 'text-orange-600', bg: 'bg-orange-50', iconBg: 'bg-orange-100' },
            enhancedSupport: { icon: 'text-red-600', bg: 'bg-red-50', iconBg: 'bg-red-100' },
            dynamics1Year: { icon: 'text-blue-600', bg: 'bg-blue-50', iconBg: 'bg-blue-100' },
            dynamics3Year: { icon: 'text-blue-600', bg: 'bg-blue-50', iconBg: 'bg-blue-100' },
            dynamics5Year: { icon: 'text-blue-600', bg: 'bg-blue-50', iconBg: 'bg-blue-100' },
            naasStandard: { icon: 'text-[var(--qolcom-green)]', bg: 'bg-gray-50', iconBg: 'bg-gray-100' },
            naasEnhanced: { icon: 'text-[var(--qolcom-green)]', bg: 'bg-gray-50', iconBg: 'bg-gray-100' }
        };

        const colors = colorMap[componentType] || { icon: 'text-gray-600', bg: 'bg-gray-50', iconBg: 'bg-gray-100' };

        configArea.innerHTML = `
            <div class="component-header mb-6">
                <div class="flex items-center mb-4">
                    <div class="${colors.iconBg} p-3 rounded-lg mr-4">
                        <i class="${component.icon} ${colors.icon} text-xl"></i>
                    </div>
                    <div>
                        <h2 class="text-xl font-semibold text-gray-200">${component.name}</h2>
                        <p class="text-gray-400">${component.description}</p>
                    </div>
                </div>
            </div>
            ${configHTML}
            <div id="componentResults" class="mt-6">
                <!-- Results will be populated here -->
            </div>
        `;

        // Load component data from data store
        const componentData = this.dataStore.getComponent(componentType);
        console.log(`Loading component data for ${componentType}:`, componentData);
        
        // Populate form with existing data
        this.populateForm(componentType, componentData.params);
        
        // Special handling for PRTG device table
        if (componentType === 'prtg') {
            this.populatePRTGDeviceTable();
        }
        
            // Calculate initial results
            this.calculateComponent(componentType);
        } catch (error) {
            console.error('Error rendering component config:', error);
            // Don't show notification - just log the error
        }
    }

    renderHelpConfig() {
        return `
            <div class="config-section">
                <h3><i class="fas fa-question-circle"></i>Help & Instructions</h3>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            <i class="fas fa-info-circle text-blue-600 text-xl"></i>
                        </div>
                        <div class="ml-3">
                            <h4 class="text-lg font-medium text-blue-900">NaaS Calculator User Guide</h4>
                            <p class="mt-1 text-sm text-blue-700">
                                This calculator helps you build comprehensive Network-as-a-Service quotes with real-time pricing and configuration options.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-900 mb-3">
                            <i class="fas fa-mouse-pointer text-green-600 mr-2"></i>How to Use
                        </h4>
                        <ol class="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                            <li>Select components from the left sidebar</li>
                            <li>Configure each component's parameters</li>
                            <li>View real-time pricing updates</li>
                            <li>Export quotes as PDF or Excel</li>
                            <li>Use Full Quote Builder for comprehensive solutions</li>
                        </ol>
                    </div>

                    <div class="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-900 mb-3">
                            <i class="fas fa-calculator text-blue-600 mr-2"></i>Pricing Features
                        </h4>
                        <ul class="text-sm text-gray-600 space-y-2">
                            <li>• <strong>Real-time calculations:</strong> Prices update as you configure</li>
                            <li>• <strong>Volume discounts:</strong> Automatic discounts for multiple components</li>
                            <li>• <strong>Financing options:</strong> APR calculations for capital equipment</li>
                            <li>• <strong>CPI escalation:</strong> Long-term contract pricing</li>
                            <li>• <strong>Currency:</strong> All prices in British Pounds (£)</li>
                        </ul>
                    </div>
                </div>

                <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h4 class="font-semibold text-gray-900 mb-4">
                        <i class="fas fa-list-check text-purple-600 mr-2"></i>Component Categories
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div class="text-sm">
                            <div class="font-medium text-gray-900 mb-1">Core Services</div>
                            <div class="text-gray-600">PRTG Monitoring, Support Services, Onboarding</div>
                        </div>
                        <div class="text-sm">
                            <div class="font-medium text-gray-900 mb-1">Infrastructure</div>
                            <div class="text-gray-600">Capital Equipment, PBS Foundation</div>
                        </div>
                        <div class="text-sm">
                            <div class="font-medium text-gray-900 mb-1">Assessment</div>
                            <div class="text-gray-600">Platform Assessment, Admin Services</div>
                        </div>
                        <div class="text-sm">
                            <div class="font-medium text-gray-900 mb-1">Enhanced Options</div>
                            <div class="text-gray-600">Enhanced Support, Other Costs</div>
                        </div>
                        <div class="text-sm">
                            <div class="font-medium text-gray-900 mb-1">Dynamic Pricing</div>
                            <div class="text-gray-600">1, 3, and 5-year contract options</div>
                        </div>
                        <div class="text-sm">
                            <div class="font-medium text-gray-900 mb-1">Packages</div>
                            <div class="text-gray-600">Standard and Enhanced NaaS packages</div>
                        </div>
                    </div>
                </div>

                <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div class="flex items-start">
                        <i class="fas fa-lightbulb text-yellow-600 mt-1 mr-3"></i>
                        <div>
                            <h4 class="font-medium text-yellow-900 mb-1">Pro Tips</h4>
                            <ul class="text-sm text-yellow-800 space-y-1">
                                <li>• Use the Full Quote Builder for comprehensive solutions with volume discounts</li>
                                <li>• Capital Equipment supports both manual entry and spreadsheet upload</li>
                                <li>• PRTG Monitoring includes detailed device configuration tables</li>
                                <li>• All quotes can be saved and exported in multiple formats</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPRTGConfig() {
        return `
            <div class="config-section">
                <h3><i class="fas fa-cog"></i>Step 1: Device Monitoring Configuration</h3>
                <p class="text-sm text-gray-600 mb-4">Complete the table below with the assistance of Pre-Sales</p>
                
                <div class="overflow-x-auto">
                    <table class="w-full border-collapse border border-gray-300 text-sm">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="border border-gray-300 p-2 text-left font-semibold">Device Type/Function</th>
                                <th class="border border-gray-300 p-2 text-center">Ping</th>
                                <th class="border border-gray-300 p-2 text-center">CPU Load</th>
                                <th class="border border-gray-300 p-2 text-center">RAM</th>
                                <th class="border border-gray-300 p-2 text-center">Uptime</th>
                                <th class="border border-gray-300 p-2 text-center">Port Traffic</th>
                                <th class="border border-gray-300 p-2 text-center">Connected APs</th>
                                <th class="border border-gray-300 p-2 text-center">Connected Clients</th>
                                <th class="border border-gray-300 p-2 text-center">SSL Security</th>
                                <th class="border border-gray-300 p-2 text-center">SSL Certificate</th>
                                <th class="border border-gray-300 p-2 text-center">HTTPS</th>
                                <th class="border border-gray-300 p-2 text-center">SNTP</th>
                                <th class="border border-gray-300 p-2 text-center">Active Processes</th>
                                <th class="border border-gray-300 p-2 text-center">Physical Memory</th>
                                <th class="border border-gray-300 p-2 text-center">Swap Memory</th>
                                <th class="border border-gray-300 p-2 text-center">Load Average</th>
                                <th class="border border-gray-300 p-2 text-center">Software Version</th>
                                <th class="border border-gray-300 p-2 text-center font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody id="prtgDeviceTable">
                            <!-- Device rows will be populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <strong>Total Sensors Required:</strong> <span id="totalSensorsCount">0</span>
                    </p>
                </div>
            </div>
            
            <div class="config-section">
                <h3><i class="fas fa-network-wired"></i>Step 2: Connection Method & Jump Box</h3>
                <p class="text-sm text-gray-600 mb-4">Choose connection method and if jump box required</p>
                
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">QAD-MON-ADV-3 (PRTG Setup) - MANDATORY</div>
                            <div class="text-sm text-gray-600">Required for all PRTG installations</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="prtgSetup" class="w-16 p-2 border border-gray-300 rounded text-center" value="1" min="0" readonly>
                            <span class="ml-2 text-sm text-blue-600">(mandatory)</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">QAD-MON-VPN (Site to Site VPN)</div>
                            <div class="text-sm text-gray-600">VPN connection to customer network</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="siteToSiteVPN" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">enter value of 1</span>
                        </div>
                    </div>
                    
                    <div class="text-center text-gray-500 font-medium">OR</div>
                    
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">QAD-MON-HTTPS (Probe on site - Customer must provide VM)</div>
                            <div class="text-sm text-gray-600">On-site probe with customer-provided VM</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="probeOnSite" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">enter value of 1</span>
                        </div>
                    </div>
                    
                    <div class="text-center text-gray-500 font-medium">OR</div>
                    
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">QAD-MON-JMP (VPN Jump Box)</div>
                            <div class="text-sm text-gray-600">VPN jump box for secure access</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="vpnJumpBox" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">enter value of 1</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="config-section">
                <h3><i class="fas fa-cogs"></i>Service Level Configuration</h3>
                <div class="config-grid">
                    <div class="form-group">
                        <label class="form-label">Service Level</label>
                        <select name="serviceLevel" class="form-input form-select">
                            <option value="standard">Standard (8x5 Support)</option>
                            <option value="enhanced">Enhanced (24x7 Support)</option>
                            <option value="enterprise">Enterprise (24x7 + Dedicated)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Alert Recipients</label>
                        <input type="number" name="alertRecipients" class="form-input" min="1" max="100" 
                               placeholder="10" data-tooltip="Number of people receiving alerts">
                    </div>
                </div>
            </div>
            
            <div class="config-section">
                <h3><i class="fas fa-chart-line"></i>Licensing Options</h3>
                <div class="config-grid">
                    <div class="form-group">
                        <label class="form-label">License Term</label>
                        <select name="licenseTerm" class="form-input form-select">
                            <option value="1">1 Year</option>
                            <option value="3">3 Year</option>
                            <option value="5">5 Year</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Discount Level</label>
                        <select name="discountLevel" class="form-input form-select">
                            <option value="68">68% (5 Year)</option>
                            <option value="70">70% (1-3 Year)</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    renderCapitalConfig() {
        return `
            <div class="config-section">
                <h3><i class="fas fa-server"></i>Equipment Selection</h3>
                <div class="mb-6">
                    <div class="flex gap-4 mb-4">
                        <div class="flex-1">
                            <label class="form-label">Equipment Description</label>
                            <input type="text" id="equipmentDescription" class="form-input" placeholder="e.g., Cisco Catalyst 9300 Switch">
                        </div>
                        <div class="w-24">
                            <label class="form-label">Quantity</label>
                            <input type="number" id="equipmentQuantity" class="form-input" min="1" value="1">
                        </div>
                        <div class="w-32">
                            <label class="form-label">Unit Cost (£)</label>
                            <input type="number" id="equipmentUnitCost" class="form-input" placeholder="0.00" step="0.01">
                        </div>
                        <div class="flex items-end">
                            <button type="button" id="addEquipment" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                <i class="fas fa-plus mr-1"></i>Add
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Spreadsheet Upload Section -->
                <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 class="text-lg font-semibold text-gray-900 mb-3">
                        <i class="fas fa-upload mr-2"></i>Upload Equipment List
                    </h4>
                    <p class="text-sm text-gray-600 mb-3">
                        Upload an Excel or CSV file with your equipment list. Expected format: Description, Quantity, Unit Cost
                    </p>
                    <div class="space-y-3">
                        <div class="flex items-center gap-4">
                            <input type="file" id="equipmentFileUpload" class="form-input" accept=".xlsx,.xls,.csv" style="flex: 1;">
                            <button type="button" id="uploadEquipmentFile" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                                <i class="fas fa-upload mr-1"></i>Upload
                            </button>
                        </div>
                        <div class="flex gap-4">
                            <button type="button" id="downloadTemplate" class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                                <i class="fas fa-download mr-1"></i>Download Template
                            </button>
                        </div>
                        <div id="fileStatus" class="text-sm text-gray-600 hidden">
                            <!-- File status will be shown here -->
                        </div>
                    </div>
                </div>
                
                <div id="equipmentList" class="mb-4">
                    <!-- Equipment list will be populated here -->
                </div>
            </div>
            <div class="config-section">
                <h3><i class="fas fa-credit-card"></i>Financing Options</h3>
                <div class="config-grid">
                    <div class="form-group">
                        <label class="flex items-center">
                            <input type="checkbox" name="financing" class="mr-2">
                            <span class="form-label mb-0">Enable Financing (${(this.calculator.config.APR_RATE * 100).toFixed(1)}% APR)</span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Term (Months)</label>
                        <select name="termMonths" class="form-input form-select">
                            <option value="12">12 months</option>
                            <option value="24">24 months</option>
                            <option value="36" selected>36 months</option>
                            <option value="48">48 months</option>
                            <option value="60">60 months</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Down Payment (£)</label>
                        <input type="number" name="downPayment" class="form-input" min="0" placeholder="0.00" step="0.01">
                    </div>
                </div>
            </div>
        `;
    }

    renderSupportConfig() {
        return `
            <div class="config-section">
                <h3><i class="fas fa-headset"></i>Core Support Services</h3>
                <div class="config-grid">
                    <div class="form-group">
                        <label class="form-label">Service Desk Support</label>
                        <select name="serviceDesk" class="form-input form-select">
                            <option value="8x5">8x5 Service Desk (Standard)</option>
                            <option value="24x7">24x7 Service Desk (Enhanced)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Device Count</label>
                        <input type="number" name="deviceCount" class="form-input" min="1" max="10000" 
                               placeholder="10" data-tooltip="Number of devices to support">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contract Term</label>
                        <select name="contractTerm" class="form-input form-select">
                            <option value="12">12 months</option>
                            <option value="36">36 months</option>
                            <option value="60">60 months</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">MAC Support Level</label>
                        <select name="macLevel" class="form-input form-select">
                            <option value="low">Low (Static Environment)</option>
                            <option value="medium">Medium (Few Changes)</option>
                            <option value="high">High (Lots of Changes)</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="config-section">
                <h3><i class="fas fa-chart-line"></i>Additional Support Services</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">QAD-MON (Qolcom Monitoring Service)</div>
                            <div class="text-sm text-gray-600">Central monitoring and alerting</div>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" name="monitoringService" class="mr-2">
                            <span class="text-sm text-gray-600">Include</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">QAD-VISION (API Driven Service Monitoring)</div>
                            <div class="text-sm text-gray-600">Analytics platform and KPI monitoring</div>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" name="visionService" class="mr-2">
                            <span class="text-sm text-gray-600">Include</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="config-section">
                <h3><i class="fas fa-tools"></i>Service Review Options</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">QAD-REVIEW-A (Annual Service Reviews)</div>
                            <div class="text-sm text-gray-600">Annual service review meetings</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="annualReviews" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">£650 each</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">QAD-REVIEW-Q (Quarterly Service Reviews)</div>
                            <div class="text-sm text-gray-600">Quarterly service review meetings</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="quarterlyReviews" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">£650 each</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">QAD-REVIEW-B (Bi-Annual Service Reviews)</div>
                            <div class="text-sm text-gray-600">Bi-annual service review meetings</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="biAnnualReviews" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">£650 each</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="config-section">
                <h3><i class="fas fa-cogs"></i>Technical Services</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">QAR TECHNICAL (Technical Consultancy Days)</div>
                            <div class="text-sm text-gray-600">Technical consultancy and advisory</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="technicalDays" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">£1,250 per day</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">QAD-ENG-L3-O (Level 3 Engineering Days)</div>
                            <div class="text-sm text-gray-600">Advanced engineering support</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="l3EngineeringDays" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">£950 per day</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">QAD-REPORT (Reporting Service)</div>
                            <div class="text-sm text-gray-600">Custom reporting and analytics</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="reportingService" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">£450 per report</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">QAD-BACKUP-Q (Quarterly System Backups)</div>
                            <div class="text-sm text-gray-600">Quarterly backup verification</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="backupService" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">£50 per backup</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderOnboardingConfig() {
        return `
            <div class="config-section">
                <h3><i class="fas fa-rocket"></i>Implementation Scope</h3>
                <div class="config-grid">
                    <div class="form-group">
                        <label class="form-label">Project Complexity</label>
                        <select name="complexity" class="form-input form-select">
                            <option value="simple">Simple (£2,000 base) - Basic setup, single site</option>
                            <option value="standard" selected>Standard (£3,600 base) - Multi-site, standard config</option>
                            <option value="complex">Complex (£6,800 base) - Custom design, integration</option>
                            <option value="enterprise">Enterprise (£12,000 base) - Full transformation</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Number of Sites</label>
                        <input type="number" name="sites" class="form-input" min="1" max="100" placeholder="1">
                    </div>
                    <div class="form-group">
                        <label class="flex items-center">
                            <input type="checkbox" name="includeAssessment" class="mr-2" checked>
                            <span class="form-label mb-0">Include Pre-Assessment</span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Assessment Type</label>
                        <select name="assessmentType" class="form-input form-select">
                            <option value="network">Network Assessment (£1,200)</option>
                            <option value="security">Security Assessment (£1,600)</option>
                            <option value="comprehensive" selected>Comprehensive (£2,800)</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    renderPBSFoundationConfig() {
        return `
            <div class="config-section">
                <h3><i class="fas fa-building"></i>Foundation Platform</h3>
                <div class="config-grid">
                    <div class="form-group">
                        <label class="form-label">Number of Users</label>
                        <input type="number" name="users" class="form-input" min="1" max="1000" 
                               placeholder="10" data-tooltip="Platform user licenses">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Locations</label>
                        <input type="number" name="locations" class="form-input" min="1" max="100" placeholder="1">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Additional Features</label>
                        <div class="space-y-2 mt-2">
                            <label class="flex items-center">
                                <input type="checkbox" name="features" value="advanced_reporting" class="mr-2">
                                <span class="text-sm">Advanced Reporting (+£120/month)</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="features" value="api_access" class="mr-2">
                                <span class="text-sm">API Access (+£80/month)</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="features" value="sso_integration" class="mr-2">
                                <span class="text-sm">SSO Integration (+£160/month)</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="features" value="custom_branding" class="mr-2">
                                <span class="text-sm">Custom Branding (+£60/month)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getDefaultParams(componentType) {
        switch (componentType) {
            case 'help':
                return {};
            case 'prtg':
                return { 
                    ...this.calculator.config.defaults.prtg,
                    prtgSetup: 1,
                    siteToSiteVPN: 0,
                    probeOnSite: 0,
                    vpnJumpBox: 0,
                    licenseTerm: 3,
                    discountLevel: 70
                };
            case 'capital':
                return { 
                    equipment: [],
                    financing: true,
                    termMonths: 36,
                    downPayment: 0
                };
            case 'support':
                return {
                    level: 'enhanced',
                    deviceCount: 10,
                    termMonths: 36,
                    includeEscalation: true
                };
            case 'onboarding':
                return {
                    complexity: 'standard',
                    sites: 1,
                    includeAssessment: true,
                    assessmentType: 'comprehensive'
                };
            case 'pbsFoundation':
                return {
                    users: 10,
                    locations: 1,
                    features: ['basic']
                };
            case 'assessment':
                return { 
                    complexity: 'standard',
                    deviceCount: 10,
                    siteCount: 1,
                    includeReport: true
                };
            case 'admin':
                return { 
                    annualReviews: 0,
                    quarterlyReviews: 0,
                    biAnnualReviews: 0,
                    technicalDays: 0,
                    l3EngineeringDays: 0,
                    reportingService: 0,
                    backupService: 0
                };
            case 'otherCosts':
                return { 
                    items: [],
                    totalCost: 0
                };
            case 'enhancedSupport':
                return { 
                    level: 'enhanced',
                    deviceCount: 10,
                    termMonths: 36,
                    includeEscalation: true
                };
            case 'dynamics1Year':
            case 'dynamics3Year':
            case 'dynamics5Year':
                return { 
                    termMonths: componentType === 'dynamics1Year' ? 12 : 
                               componentType === 'dynamics3Year' ? 36 : 60,
                    cpiRate: 0.03,
                    aprRate: 0.05
                };
            case 'naasStandard':
            case 'naasEnhanced':
                return { 
                    package: componentType === 'naasStandard' ? 'standard' : 'enhanced',
                    deviceCount: 10,
                    termMonths: 36,
                    includeEscalation: true
                };
            default:
                return {};
        }
    }

    populateForm(componentType, data = null) {
        try {
            if (!data) {
                const componentData = this.dataStore.getComponent(componentType);
                if (!componentData || !componentData.params) {
                    console.warn(`No component data available for: ${componentType}`);
                    return;
                }
                data = componentData.params;
            }

            const configArea = document.getElementById('componentConfigArea');
            if (!configArea) {
                console.error('componentConfigArea not found');
                return;
            }

            Object.keys(data).forEach(key => {
                const input = configArea.querySelector(`[name="${key}"]`);
                if (input && data[key] !== undefined && data[key] !== null) {
                    if (input.type === 'checkbox') {
                        input.checked = Boolean(data[key]);
                    } else if (input.type === 'number' || input.tagName === 'SELECT') {
                        input.value = data[key];
                    } else if (key === 'features' && Array.isArray(data[key])) {
                        // Handle feature checkboxes
                        const checkboxes = configArea.querySelectorAll(`[name="${key}"]`);
                        checkboxes.forEach(checkbox => {
                            checkbox.checked = data[key].includes(checkbox.value);
                        });
                    }
                }
            });
        } catch (error) {
            console.error(`Error populating form for ${componentType}:`, error);
        }

        // Special handling for capital equipment
        if (componentType === 'capital' && data.equipment) {
            this.renderEquipmentList(data.equipment);
        }
    }

    handleInputChange(e) {
        if (!this.currentComponent) return;

        const input = e.target;
        const name = input.name;

        // If input has no name, skip processing
        if (!name) return;

        let value;
        if (input.type === 'checkbox') {
            value = input.checked;
        } else if (input.type === 'number') {
            const numValue = parseFloat(input.value);
            // Validate numeric inputs
            if (isNaN(numValue) || numValue < 0) {
                input.classList.add('border-red-500');
                return; // Don't update data store with invalid values
            } else {
                input.classList.remove('border-red-500');
                value = numValue;
            }
        } else {
            value = input.value;
        }

        // Get current component data
        const currentData = this.dataStore.getComponent(this.currentComponent);
        if (!currentData) {
            console.warn(`No component data found for: ${this.currentComponent}`);
            return;
        }

        const newParams = { ...currentData.params };

        // Handle special cases
        if (name === 'features') {
            if (!newParams.features) {
                newParams.features = [];
            }
            if (input.checked) {
                if (!newParams.features.includes(value)) {
                    newParams.features.push(value);
                }
            } else {
                const index = newParams.features.indexOf(value);
                if (index > -1) {
                    newParams.features.splice(index, 1);
                }
            }
        } else if (['prtgSetup', 'siteToSiteVPN', 'probeOnSite', 'vpnJumpBox', 'licenseTerm', 'discountLevel'].includes(name)) {
            // Handle PRTG connection method and licensing inputs
            newParams[name] = value;
        } else {
            newParams[name] = value;
        }

        // Update data store
        this.dataStore.updateComponentParams(this.currentComponent, newParams);

        // Recalculate
        this.calculateComponent(this.currentComponent);
    }

    calculateComponent(componentType) {
        // Use orchestrator for managed calculations if available
        if (this.orchestrator) {
            this.orchestrator.scheduleCalculation(componentType, 0, 'component-manager');
            return; // Orchestrator handles the actual calculation asynchronously
        } else {
            // Fallback to direct calculation
            console.warn('Using direct calculation fallback for', componentType);
            return this.calculateComponentDirect(componentType);
        }
    }

    // Legacy direct calculation method (kept for compatibility)
    calculateComponentDirect(componentType) {
        try {
            const componentData = this.dataStore.getComponent(componentType);
            if (!componentData || !componentData.params) {
                console.warn(`No data found for component: ${componentType}`);
                return null;
            }

            const params = componentData.params;
            let result;

            switch (componentType) {
                case 'help':
                    result = { totals: { monthly: 0, annual: 0, threeYear: 0, oneTime: 0 } };
                    break;
                case 'prtg':
                    result = this.calculator.calculatePRTG(params);
                    break;
                case 'capital':
                    result = this.calculator.calculateCapital(params);
                    break;
                case 'support':
                    result = this.calculator.calculateSupport(params);
                    break;
                case 'onboarding':
                    result = this.calculator.calculateOnboarding(params);
                    break;
                case 'pbsFoundation':
                    result = this.calculator.calculatePBSFoundation(params);
                    break;
                case 'assessment':
                    result = this.calculator.calculateAssessment(params);
                    break;
                case 'admin':
                    result = this.calculator.calculateAdmin(params);
                    break;
                case 'otherCosts':
                    result = this.calculator.calculateOtherCosts(params);
                    break;
                case 'enhancedSupport':
                    result = this.calculator.calculateEnhancedSupport(params);
                    break;
                case 'dynamics1Year':
                case 'dynamics3Year':
                case 'dynamics5Year':
                    result = this.calculator.calculateDynamics(params, componentType);
                    break;
                case 'naasStandard':
                case 'naasEnhanced':
                    result = this.calculator.calculateNaaS(params, componentType);
                    break;
                default:
                    console.warn(`Unknown component type: ${componentType}`);
                    return null;
            }

            if (result) {
                this.renderResults(componentType, result);
                this.updateComponentPrice(componentType, result.totals?.monthly || 0);
                this.updatePricingSummary(); // Update pricing summary
            }

            return result;
        } catch (error) {
            console.error(`Error calculating component ${componentType}:`, error);
            // Create a default error result to prevent UI breakage
            const errorResult = {
                totals: { monthly: 0, annual: 0, threeYear: 0, oneTime: 0 },
                error: error.message
            };

            // Still update UI with error state
            this.updateComponentPrice(componentType, 0);
            return errorResult;
        }
    }

    renderResults(componentType, result) {
        const resultsContainer = document.getElementById('componentResults');
        const wizardResultsContainer = document.getElementById(`wizardComponentResults-${componentType}`);
        
        // Render results in standalone component view
        if (resultsContainer) {
            this.renderResultsHTML(resultsContainer, componentType, result);
        }
        
        // Render results in wizard view
        if (wizardResultsContainer) {
            this.renderResultsHTML(wizardResultsContainer, componentType, result);
        }
    }

    renderResultsHTML(container, componentType, result) {
        if (!container) return;

        const { totals, breakdown } = result;
        
        let breakdownHTML = '';
        if (breakdown) {
            breakdownHTML = '<div class="grid grid-cols-2 gap-4 mb-4">';
            Object.keys(breakdown).forEach(key => {
                if (typeof breakdown[key] === 'number' && breakdown[key] > 0) {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    breakdownHTML += `
                        <div class="flex justify-between">
                            <span class="text-gray-600">${label}:</span>
                            <span class="font-medium">${this.calculator.formatCurrency(breakdown[key])}</span>
                        </div>
                    `;
                }
            });
            breakdownHTML += '</div>';
        }

        container.innerHTML = `
            <div class="calc-result">
                <h4><i class="fas fa-calculator mr-2"></i>Cost Summary</h4>
                ${breakdownHTML}
                <div class="result-item">
                    <span>One-time Cost:</span>
                    <span>${this.calculator.formatCurrency(totals.oneTime)}</span>
                </div>
                <div class="result-item">
                    <span>Monthly Cost:</span>
                    <span>${this.calculator.formatCurrency(totals.monthly)}</span>
                </div>
                <div class="result-item">
                    <span>Annual Cost:</span>
                    <span>${this.calculator.formatCurrency(totals.annual)}</span>
                </div>
                <div class="result-item">
                    <span><strong>3-Year Total:</strong></span>
                    <span><strong>${this.calculator.formatCurrency(totals.threeYear)}</strong></span>
                </div>
                <div class="mt-4 flex gap-3">
                    <button id="saveComponent" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        <i class="fas fa-save mr-2"></i>Save Configuration
                    </button>
                    <button id="exportComponent" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <i class="fas fa-download mr-2"></i>Export Quote
                    </button>
                    <button id="addToFullQuote" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                        <i class="fas fa-plus mr-2"></i>Add to Full Quote
                    </button>
                </div>
            </div>
        `;

        // Bind result buttons
        document.getElementById('saveComponent')?.addEventListener('click', () => {
            this.saveComponent(componentType, result);
        });

        document.getElementById('exportComponent')?.addEventListener('click', () => {
            this.exportComponent(componentType, result);
        });

        document.getElementById('addToFullQuote')?.addEventListener('click', () => {
            this.addToFullQuote(componentType);
        });
    }

    updateComponentPrice(componentType, monthlyPrice) {
        try {
            // Validate monthlyPrice
            if (typeof monthlyPrice !== 'number' || isNaN(monthlyPrice)) {
                monthlyPrice = 0;
            }

            const priceElement = document.getElementById(`price-${componentType}`);
            if (priceElement) {
                priceElement.textContent = this.calculator.formatCurrency(monthlyPrice);
            }

            // Update dashboard card price if exists
            const dashboardCard = document.querySelector(`[data-component="${componentType}"] .text-2xl`);
            if (dashboardCard) {
                dashboardCard.textContent = this.calculator.formatCurrency(monthlyPrice);
            }
        } catch (error) {
            console.error(`Error updating component price for ${componentType}:`, error);
        }
    }

    renderEquipmentList(equipment) {
        try {
            const listContainer = document.getElementById('equipmentList');
            if (!listContainer) {
                console.warn('Equipment list container not found');
                return;
            }

            if (!equipment || equipment.length === 0) {
                listContainer.innerHTML = '<p class="text-gray-400 text-center py-4">No equipment added</p>';
                return;
            }

            let listHTML = '<div class="space-y-2">';
            equipment.forEach((item, index) => {
                // Validate equipment item
                if (!item || typeof item !== 'object') {
                    console.warn(`Invalid equipment item at index ${index}:`, item);
                    return;
                }

                const description = item.description || 'Unknown Equipment';
                const quantity = parseInt(item.quantity) || 0;
                const unitCost = parseFloat(item.unitCost) || 0;
                const totalCost = unitCost * quantity;

                listHTML += `
                    <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600">
                        <div class="flex-1">
                            <div class="font-medium text-gray-200">${description}</div>
                            <div class="text-sm text-gray-400">Qty: ${quantity} × ${this.calculator.formatCurrency(unitCost)}</div>
                        </div>
                        <div class="text-right">
                            <div class="font-medium text-[var(--qolcom-green)]">${this.calculator.formatCurrency(totalCost)}</div>
                            <button class="text-red-400 hover:text-red-300 text-sm" onclick="componentManager.removeEquipment(${index})">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                `;
            });
            listHTML += '</div>';

            listContainer.innerHTML = listHTML;
        } catch (error) {
            console.error('Error rendering equipment list:', error);
        }
    }

    addEquipment() {
        try {
            const descriptionInput = document.getElementById('equipmentDescription');
            const quantityInput = document.getElementById('equipmentQuantity');
            const unitCostInput = document.getElementById('equipmentUnitCost');

            // Validate inputs exist
            if (!descriptionInput || !quantityInput || !unitCostInput) {
                console.error('Equipment input elements not found');
                this.showNotification('Form elements not found. Please refresh the page.', 'error');
                return;
            }

            // Validate input values
            const description = descriptionInput.value.trim();
            const quantity = parseInt(quantityInput.value) || 1;
            const unitCost = parseFloat(unitCostInput.value) || 0;

            if (!description) {
                this.showNotification('Please enter equipment description.', 'error');
                descriptionInput.focus();
                return;
            }

            if (quantity <= 0) {
                this.showNotification('Quantity must be greater than 0.', 'error');
                quantityInput.focus();
                return;
            }

            if (unitCost <= 0) {
                this.showNotification('Unit cost must be greater than 0.', 'error');
                unitCostInput.focus();
                return;
            }

            // Get current component data from data store
            const componentData = this.dataStore.getComponent('capital');
            const equipment = componentData.params.equipment || [];

            // Add new equipment item
            const newItem = {
                description: description,
                quantity: quantity,
                unitCost: unitCost
            };

            equipment.push(newItem);

            // Update data store
            const newParams = { ...componentData.params, equipment: equipment };
            this.dataStore.updateComponentParams('capital', newParams);

            // Update UI and recalculate
            this.renderEquipmentList(equipment);
            this.calculateComponent('capital');

            // Reset form
            descriptionInput.value = '';
            quantityInput.value = '1';
            unitCostInput.value = '';

            this.showNotification('Equipment added successfully!', 'success');
        } catch (error) {
            console.error('Error adding equipment:', error);
            this.showNotification('Error adding equipment. Please try again.', 'error');
        }
    }

    removeEquipment(index) {
        try {
            const componentData = this.dataStore.getComponent('capital');
            if (!componentData || !componentData.params.equipment) {
                console.warn('No equipment data found to remove');
                return;
            }

            const equipment = [...componentData.params.equipment];

            // Validate index
            if (index < 0 || index >= equipment.length) {
                console.error('Invalid equipment index:', index);
                this.showNotification('Invalid equipment item.', 'error');
                return;
            }

            // Remove equipment item
            equipment.splice(index, 1);

            // Update data store
            const newParams = { ...componentData.params, equipment: equipment };
            this.dataStore.updateComponentParams('capital', newParams);

            // Update UI and recalculate
            this.renderEquipmentList(equipment);
            this.calculateComponent('capital');

            this.showNotification('Equipment removed successfully!', 'success');
        } catch (error) {
            console.error('Error removing equipment:', error);
            this.showNotification('Error removing equipment. Please try again.', 'error');
        }
    }

    saveComponent(componentType, result) {
        const saved = JSON.parse(localStorage.getItem('naas_saved_components') || '{}');
        const timestamp = new Date().toISOString();
        
        saved[`${componentType}_${Date.now()}`] = {
            type: componentType,
            name: this.components[componentType].name,
            params: this.componentData[componentType],
            result: result,
            timestamp: timestamp
        };

        localStorage.setItem('naas_saved_components', JSON.stringify(saved));
        
        // Show success message
        this.showNotification('Component configuration saved successfully!', 'success');
    }

    exportComponent(componentType, result) {
        // Trigger export functionality
        window.importExportManager.exportComponent(componentType, result, this.componentData[componentType]);
    }

    addToFullQuote(componentType) {
        // Add component to full quote builder
        const fullQuoteData = JSON.parse(localStorage.getItem('naas_full_quote') || '{}');
        fullQuoteData[componentType] = {
            enabled: true,
            params: this.componentData[componentType]
        };
        localStorage.setItem('naas_full_quote', JSON.stringify(fullQuoteData));
        
        this.showNotification(`${this.components[componentType].name} added to full quote builder!`, 'success');
    }

    async uploadEquipmentFile() {
        const fileInput = document.getElementById('equipmentFileUpload');
        const fileStatus = document.getElementById('fileStatus');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showNotification('Please select a file to upload.', 'error');
            if (fileStatus) {
                fileStatus.textContent = 'No file selected';
                fileStatus.className = 'text-sm text-red-600';
                fileStatus.classList.remove('hidden');
            }
            return;
        }

        if (fileStatus) {
            fileStatus.textContent = `Selected: ${file.name}`;
            fileStatus.className = 'text-sm text-blue-600';
            fileStatus.classList.remove('hidden');
        }

        try {
            const data = await this.readFile(file);
            const equipment = this.parseEquipmentFile(data, file.name);
            
            if (equipment.length > 0) {
                this.componentData.capital.equipment = equipment;
                this.renderEquipmentList(equipment);
                this.calculateComponent('capital');
                this.showNotification(`Successfully uploaded ${equipment.length} equipment items.`, 'success');
            } else {
                this.showNotification('No valid equipment data found in the file.', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification('Error uploading file. Please check the format.', 'error');
        }
    }

    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (file.name.endsWith('.csv')) {
                    resolve(e.target.result);
                } else {
                    // Excel file
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    resolve(jsonData);
                }
            };
            reader.onerror = reject;
            
            if (file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }

    parseEquipmentFile(data, filename) {
        const equipment = [];
        
        if (filename.endsWith('.csv')) {
            const lines = data.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',').map(v => v.trim());
                    const item = this.parseEquipmentRow(headers, values);
                    if (item) equipment.push(item);
                }
            }
        } else {
            // Excel data
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (row && row.length >= 3) {
                    const item = {
                        description: row[0] || '',
                        quantity: parseInt(row[1]) || 1,
                        unitCost: parseFloat(row[2]) || 0
                    };
                    if (item.description && item.unitCost > 0) {
                        equipment.push(item);
                    }
                }
            }
        }
        
        return equipment;
    }

    parseEquipmentRow(headers, values) {
        const descriptionIndex = headers.findIndex(h => h.includes('description') || h.includes('name'));
        const quantityIndex = headers.findIndex(h => h.includes('quantity') || h.includes('qty'));
        const costIndex = headers.findIndex(h => h.includes('cost') || h.includes('price'));
        
        if (descriptionIndex >= 0 && costIndex >= 0) {
            return {
                description: values[descriptionIndex] || '',
                quantity: parseInt(values[quantityIndex]) || 1,
                unitCost: parseFloat(values[costIndex]) || 0
            };
        }
        return null;
    }

    downloadEquipmentTemplate() {
        const templateData = [
            ['Description', 'Quantity', 'Unit Cost (£)'],
            ['Cisco Catalyst 9300 Switch', '2', '2500.00'],
            ['Fortinet FortiGate 100F Firewall', '1', '1200.00'],
            ['Aruba AP-515 Access Point', '5', '450.00']
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(templateData);
        XLSX.utils.book_append_sheet(wb, ws, 'Equipment Template');
        
        XLSX.writeFile(wb, 'Equipment_Template.xlsx');
        this.showNotification('Equipment template downloaded successfully!', 'success');
    }

    populatePRTGDeviceTable() {
        const tableBody = document.getElementById('prtgDeviceTable');
        if (!tableBody) return;

        const deviceTypes = [
            'HP Aruba Switches',
            'HP Aruba Wireless Controllers', 
            'ClearPass',
            'Airwave Management',
            'Firewalls (Fortinet)',
            'Other (i.e. 3rd Party Switch)'
        ];

        const monitoringTypes = [
            'ping', 'cpuLoad', 'ram', 'uptime', 'portTraffic', 
            'connectedAPs', 'connectedClients', 'sslSecurity', 
            'sslCertificate', 'https', 'sntp', 'activeProcesses', 
            'physicalMemory', 'swapMemory', 'loadAverage', 'softwareVersion'
        ];

        let tableHTML = '';
        
        deviceTypes.forEach(deviceType => {
            tableHTML += `
                <tr class="hover:bg-gray-50">
                    <td class="border border-gray-300 p-2 font-medium">${deviceType}</td>
            `;
            
            monitoringTypes.forEach(monitorType => {
                const isHighlighted = (deviceType === 'ClearPass' || deviceType === 'Firewalls (Fortinet)') && 
                                    ['ram', 'uptime', 'portTraffic', 'connectedAPs', 'connectedClients', 
                                     'sslSecurity', 'sslCertificate', 'https', 'sntp', 'activeProcesses', 
                                     'physicalMemory', 'swapMemory', 'loadAverage', 'softwareVersion'].includes(monitorType);
                
                tableHTML += `
                    <td class="border border-gray-300 p-1 text-center ${isHighlighted ? 'bg-yellow-100' : ''}">
                        <input type="checkbox" 
                               class="prtg-sensor-checkbox" 
                               data-device="${deviceType}" 
                               data-monitor="${monitorType}"
                               onchange="componentManager.updatePRTGSensors()"
                               ${isHighlighted ? 'checked' : ''}>
                    </td>
                `;
            });
            
            tableHTML += `
                    <td class="border border-gray-300 p-2 text-center font-semibold">
                        <span class="device-total" data-device="${deviceType}">0</span>
                    </td>
                </tr>
            `;
        });

        // Add total row
        tableHTML += `
            <tr class="bg-gray-100 font-semibold">
                <td class="border border-gray-300 p-2">Total Sensors Required</td>
        `;
        
        monitoringTypes.forEach(() => {
            tableHTML += '<td class="border border-gray-300 p-2 text-center">0</td>';
        });
        
        tableHTML += `
                <td class="border border-gray-300 p-2 text-center">
                    <span id="grandTotalSensors">0</span>
                </td>
            </tr>
        `;

        tableBody.innerHTML = tableHTML;
        this.updatePRTGSensors();
    }

    updatePRTGSensors() {
        try {
            const checkboxes = document.querySelectorAll('.prtg-sensor-checkbox');
            if (!checkboxes || checkboxes.length === 0) {
                console.warn('No PRTG sensor checkboxes found');
                return;
            }

            const deviceTotals = {};
            let grandTotal = 0;

            // Initialize device totals
            const deviceTypes = [
                'HP Aruba Switches', 'HP Aruba Wireless Controllers', 'ClearPass',
                'Airwave Management', 'Firewalls (Fortinet)', 'Other (i.e. 3rd Party Switch)'
            ];
            deviceTypes.forEach(device => deviceTotals[device] = 0);

            // Count sensors for each device
            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    const device = checkbox.dataset.device;
                    if (device && deviceTotals.hasOwnProperty(device)) {
                        deviceTotals[device] = (deviceTotals[device] || 0) + 1;
                        grandTotal++;
                    }
                }
            });

            // Update device totals
            Object.keys(deviceTotals).forEach(device => {
                const totalElement = document.querySelector(`[data-device="${device}"].device-total`);
                if (totalElement) {
                    totalElement.textContent = deviceTotals[device];
                }
            });

            // Update grand total
            const grandTotalElement = document.getElementById('grandTotalSensors');
            if (grandTotalElement) {
                grandTotalElement.textContent = grandTotal;
            }

            // Update total sensors count
            const totalSensorsElement = document.getElementById('totalSensorsCount');
            if (totalSensorsElement) {
                totalSensorsElement.textContent = grandTotal;
            }

            // Update component data and recalculate
            const componentData = this.dataStore.getComponent('prtg');
            if (componentData) {
                const newParams = { ...componentData.params, sensors: grandTotal };
                this.dataStore.updateComponentParams('prtg', newParams);
                this.calculateComponent('prtg');
            }
        } catch (error) {
            console.error('Error updating PRTG sensors:', error);
        }
    }

    renderAssessmentConfig() {
        return `
            <div class="config-section">
                <h3><i class="fas fa-clipboard-check"></i>Assessment Configuration</h3>
                <div class="config-grid">
                    <div class="form-group">
                        <label class="form-label">Assessment Complexity</label>
                        <select name="complexity" class="form-input form-select">
                            <option value="simple">Simple Assessment - £2,500</option>
                            <option value="standard" selected>Standard Assessment - £4,500</option>
                            <option value="complex">Complex Assessment - £8,500</option>
                            <option value="enterprise">Enterprise Assessment - £15,000</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Device Count</label>
                        <input type="number" name="deviceCount" class="form-input" min="1" max="10000" 
                               placeholder="10" data-tooltip="Number of devices to assess">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Site Count</label>
                        <input type="number" name="siteCount" class="form-input" min="1" max="100" 
                               placeholder="1" data-tooltip="Number of sites to assess">
                    </div>
                    <div class="form-group">
                        <label class="flex items-center">
                            <input type="checkbox" name="includeReport" class="mr-2" checked>
                            <span class="form-label mb-0">Include Detailed Report</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    renderAdminConfig() {
        return `
            <div class="config-section">
                <h3><i class="fas fa-cogs"></i>Administrative Services</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">Annual Service Reviews</div>
                            <div class="text-sm text-gray-600">QAD-REVIEW-A</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="annualReviews" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">£650 each</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">Quarterly Service Reviews</div>
                            <div class="text-sm text-gray-600">QAD-REVIEW-Q</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="quarterlyReviews" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">£650 each</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">Bi-Annual Service Reviews</div>
                            <div class="text-sm text-gray-600">QAD-REVIEW-B</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="biAnnualReviews" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">£650 each</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">Technical Consultancy Days</div>
                            <div class="text-sm text-gray-600">QAR TECHNICAL</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="technicalDays" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">£1,250 per day</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">Level 3 Engineering Days</div>
                            <div class="text-sm text-gray-600">QAD-ENG-L3-O</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="l3EngineeringDays" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">£950 per day</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">Reporting Service</div>
                            <div class="text-sm text-gray-600">QAD-REPORT</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="reportingService" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">£450 per report</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div>
                            <div class="font-medium">Quarterly System Backups</div>
                            <div class="text-sm text-gray-600">QAD-BACKUP-Q</div>
                        </div>
                        <div class="flex items-center">
                            <input type="number" name="backupService" class="w-16 p-2 border border-gray-300 rounded text-center" value="0" min="0">
                            <span class="ml-2 text-sm text-blue-600">£50 per backup</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderOtherCostsConfig() {
        return `
            <div class="config-section">
                <h3><i class="fas fa-plus-circle"></i>Additional Costs</h3>
                <p class="text-sm text-gray-600 mb-4">Add additional equipment and services not covered by other components</p>
                
                <div class="mb-6">
                    <div class="flex gap-4 mb-4">
                        <div class="flex-1">
                            <label class="form-label">Item Description</label>
                            <input type="text" id="otherItemDescription" class="form-input" placeholder="e.g., Firewall, Cabling, Certificates">
                        </div>
                        <div class="w-24">
                            <label class="form-label">Quantity</label>
                            <input type="number" id="otherItemQuantity" class="form-input" min="1" value="1">
                        </div>
                        <div class="w-32">
                            <label class="form-label">Unit Cost (£)</label>
                            <input type="number" id="otherItemUnitCost" class="form-input" placeholder="0.00" step="0.01">
                        </div>
                        <div class="flex items-end">
                            <button type="button" id="addOtherItem" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                <i class="fas fa-plus mr-1"></i>Add
                            </button>
                        </div>
                    </div>
                </div>
                
                <div id="otherItemsList" class="mb-4">
                    <!-- Other items list will be populated here -->
                </div>
            </div>
        `;
    }

    renderEnhancedSupportConfig() {
        return `
            <div class="config-section">
                <h3><i class="fas fa-star"></i>Enhanced Support Configuration</h3>
                <div class="config-grid">
                    <div class="form-group">
                        <label class="form-label">Support Level</label>
                        <select name="level" class="form-input form-select">
                            <option value="enhanced">Enhanced Support - £1,200/month base</option>
                            <option value="premium">Premium Support - £2,000/month base</option>
                            <option value="enterprise">Enterprise Support - £3,500/month base</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Device Count</label>
                        <input type="number" name="deviceCount" class="form-input" min="1" max="10000" 
                               placeholder="10" data-tooltip="Number of devices under support">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contract Term</label>
                        <select name="termMonths" class="form-input form-select">
                            <option value="12">12 months</option>
                            <option value="36">36 months</option>
                            <option value="60">60 months</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="flex items-center">
                            <input type="checkbox" name="includeEscalation" class="mr-2" checked>
                            <span class="form-label mb-0">Include CPI Escalation (3.0% annually)</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    renderDynamicsConfig(years) {
        return `
            <div class="config-section">
                <h3><i class="fas fa-calendar"></i>Dynamics ${years} Year Configuration</h3>
                <div class="config-grid">
                    <div class="form-group">
                        <label class="form-label">Contract Term</label>
                        <input type="number" name="termMonths" class="form-input" value="${years * 12}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">CPI Rate (%)</label>
                        <input type="number" name="cpiRate" class="form-input" value="3.0" step="0.1" min="0" max="10">
                    </div>
                    <div class="form-group">
                        <label class="form-label">APR Rate (%)</label>
                        <input type="number" name="aprRate" class="form-input" value="5.0" step="0.1" min="0" max="20">
                    </div>
                </div>
            </div>
        `;
    }

    renderNaaSConfig(type) {
        return `
            <div class="config-section">
                <h3><i class="fas fa-layer-group"></i>NaaS ${type.charAt(0).toUpperCase() + type.slice(1)} Package</h3>
                <div class="config-grid">
                    <div class="form-group">
                        <label class="form-label">Package Type</label>
                        <input type="text" name="package" class="form-input" value="${type}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Device Count</label>
                        <input type="number" name="deviceCount" class="form-input" min="1" max="10000" 
                               placeholder="10" data-tooltip="Number of devices in package">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contract Term</label>
                        <select name="termMonths" class="form-input form-select">
                            <option value="12">12 months</option>
                            <option value="36">36 months</option>
                            <option value="60">60 months</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="flex items-center">
                            <input type="checkbox" name="includeEscalation" class="mr-2" checked>
                            <span class="form-label mb-0">Include CPI Escalation (3.0% annually)</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-600 text-white' : 
            type === 'error' ? 'bg-red-600 text-white' : 
            'bg-blue-600 text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
                ${message}
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }


    // Get combined quote from all components
    getCombinedQuote() {
        const enabledComponents = this.dataStore.getEnabledComponents();
        return this.calculator.calculateCombinedQuote(enabledComponents);
    }

    // Update pricing summary sidebar
    updatePricingSummary() {
        const pricingSummary = document.getElementById('pricingSummary');
        if (!pricingSummary) return;

        const quote = this.getCombinedQuote();
        
        if (Object.keys(quote.components).length === 0) {
            pricingSummary.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-gray-400">Configure components to see pricing</p>
                </div>
            `;
            return;
        }

        pricingSummary.innerHTML = `
            <div class="space-y-3">
                <div class="text-center">
                    <div class="text-2xl font-bold text-[var(--qolcom-green)]">${this.calculator.formatCurrency(quote.totals.monthly)}</div>
                    <div class="text-sm text-gray-400">Monthly Cost</div>
                </div>
                <div class="text-center">
                    <div class="text-lg font-semibold text-blue-400">${this.calculator.formatCurrency(quote.totals.annual)}</div>
                    <div class="text-sm text-gray-400">Annual Cost</div>
                </div>
                <div class="text-center">
                    <div class="text-lg font-semibold text-purple-400">${this.calculator.formatCurrency(quote.totals.threeYear)}</div>
                    <div class="text-sm text-gray-400">3-Year Total</div>
                </div>
                ${quote.totals.oneTime > 0 ? `
                <div class="text-center">
                    <div class="text-lg font-semibold text-orange-400">${this.calculator.formatCurrency(quote.totals.oneTime)}</div>
                    <div class="text-sm text-gray-400">One-time Costs</div>
                </div>
                ` : ''}
                ${quote.discounts && (quote.discounts.monthlyDiscount > 0 || quote.discounts.annualDiscount > 0) ? `
                <div class="bg-green-900 bg-opacity-50 rounded-lg p-3">
                    <div class="text-center">
                        <div class="text-sm font-semibold text-green-300">Volume Discounts Applied</div>
                        <div class="text-xs text-green-400">Monthly: ${(quote.discounts.monthlyDiscount * 100).toFixed(1)}%</div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Load component data from localStorage
    loadComponentData() {
        try {
            const savedData = localStorage.getItem('naas_component_data');
            if (savedData) {
                const parsedData = JSON.parse(savedData);

                // Merge saved data with default structure
                this.componentData = {
                    ...this.componentData,
                    ...parsedData
                };

                console.log('Component data loaded from localStorage');
            }
        } catch (error) {
            console.error('Error loading component data:', error);
        }
    }

    // Save component data to localStorage
    saveComponentData() {
        try {
            localStorage.setItem('naas_component_data', JSON.stringify(this.componentData));
            console.log('Component data saved to localStorage');
        } catch (error) {
            console.error('Error saving component data:', error);
        }
    }
}

// Global event handlers for component manager
document.addEventListener('DOMContentLoaded', () => {
    // Bind equipment add button
    document.addEventListener('click', (e) => {
        if (e.target.id === 'addEquipment') {
            window.componentManager?.addEquipment();
            } else if (e.target.id === 'uploadEquipmentFile') {
                window.componentManager?.uploadEquipmentFile();
            } else if (e.target.id === 'downloadTemplate') {
                window.componentManager?.downloadEquipmentTemplate();
            }
        });
});