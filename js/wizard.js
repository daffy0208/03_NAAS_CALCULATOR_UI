/**
 * NaaS Pricing Calculator - Full Quote Wizard
 * Handles the complete quote building workflow with progressive disclosure
 */

class QuoteWizard {
    constructor(calculator) {
        this.calculator = calculator;
        this.currentStep = 1;
        this.totalSteps = 18; // 1 project + 15 components + 1 contract terms + 1 review
        this.dataStore = window.quoteDataStore;

        // Initialize wizard data structure
        this.wizardData = {
            project: {
                projectName: '',
                customerName: '',
                timeline: 'medium',
                budget: '',
                sites: 1,
                primaryLocation: '',
                totalUsers: 100,
                complexity: 'medium'
            }
        };

        this.steps = {
            1: { title: 'Project Information', subtitle: 'Basic project details and requirements', icon: 'fas fa-info-circle' },
            2: { title: 'Help & Instructions', subtitle: 'User guide and calculator instructions', icon: 'fas fa-question-circle' },
            3: { title: 'Enhanced Support', subtitle: 'Enhanced support services', icon: 'fas fa-star' },
            4: { title: 'Onboarding', subtitle: 'Initial setup and implementation', icon: 'fas fa-rocket' },
            5: { title: 'Capital Equipment', subtitle: 'Hardware costs and equipment financing', icon: 'fas fa-server' },
            6: { title: 'PBS Foundation', subtitle: 'Platform foundation services', icon: 'fas fa-building' },
            7: { title: 'Support Services', subtitle: '24/7 support and maintenance services', icon: 'fas fa-headset' },
            8: { title: 'Platform Assessment', subtitle: 'Network assessment and discovery', icon: 'fas fa-clipboard-check' },
            9: { title: 'PRTG Monitoring', subtitle: 'Network monitoring setup and licensing', icon: 'fas fa-chart-line' },
            10: { title: 'Admin Services', subtitle: 'Administrative and review services', icon: 'fas fa-cogs' },
            11: { title: 'Other Costs', subtitle: 'Additional costs and services', icon: 'fas fa-plus-circle' },
            12: { title: 'Dynamics 1 Year', subtitle: '1-year dynamic pricing options', icon: 'fas fa-calendar' },
            13: { title: 'Dynamics 3 Year', subtitle: '3-year dynamic pricing options', icon: 'fas fa-calendar' },
            14: { title: 'Dynamics 5 Year', subtitle: '5-year dynamic pricing options', icon: 'fas fa-calendar' },
            15: { title: 'NaaS Standard', subtitle: 'Standard NaaS package', icon: 'fas fa-layer-group' },
            16: { title: 'NaaS Enhanced', subtitle: 'Enhanced NaaS package', icon: 'fas fa-layer-group' },
            17: { title: 'Contract Terms', subtitle: 'Set contract duration and terms', icon: 'fas fa-file-contract' },
            18: { title: 'Quote Review', subtitle: 'Review and finalize your quote', icon: 'fas fa-check-circle' }
        };

        this.bindWizardEvents();
    }

    bindWizardEvents() {
        // Step navigation
        document.addEventListener('click', (e) => {
            if (e.target.id === 'wizardNext') {
                this.nextStep();
            } else if (e.target.id === 'wizardPrev') {
                this.previousStep();
            } else if (e.target.classList.contains('step-indicator')) {
                const step = parseInt(e.target.dataset.step);
                if (step <= this.currentStep) {
                    this.goToStep(step);
                }
            }
        });

        // Form changes
        document.addEventListener('change', (e) => {
            if (e.target.closest('#wizardContent')) {
                this.handleWizardInput(e);
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target.closest('#wizardContent')) {
                this.handleWizardInput(e);
            }
        });

        // Skip section buttons
        document.addEventListener('click', (e) => {
            if (e.target.id && e.target.id.startsWith('skip-')) {
                const componentType = e.target.id.replace('skip-', '');
                this.skipComponent(componentType);
            }
        });

        // Enable/disable toggles
        document.addEventListener('change', (e) => {
            if (e.target.id && e.target.id.startsWith('enable-')) {
                const componentType = e.target.id.replace('enable-', '');
                this.toggleComponent(componentType, e.target.checked);
            }
        });

        // Skip help button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'skip-help') {
                this.nextStep();
            }
        });
    }

    skipComponent(componentType) {
        // Mark component as disabled and move to next step
        if (this.dataStore) {
            this.dataStore.setComponentEnabled(componentType, false);
        }
        this.nextStep();
    }

    toggleComponent(componentType, enabled) {
        // Update component enabled state using data store
        if (this.dataStore) {
            this.dataStore.setComponentEnabled(componentType, enabled);
        }

        // Show/hide configuration
        const configDiv = document.getElementById(`config-${componentType}`);
        if (configDiv) {
            configDiv.classList.toggle('hidden', !enabled);
        }

        // Update toggle visual state
        const toggle = document.getElementById(`enable-${componentType}`);
        if (toggle) {
            const toggleDiv = toggle.nextElementSibling;
            const toggleCircle = toggleDiv.querySelector('div:last-child');
            if (enabled) {
                toggleCircle.classList.add('transform', 'translate-x-4', 'bg-blue-600');
            } else {
                toggleCircle.classList.remove('transform', 'translate-x-4', 'bg-blue-600');
            }
        }

        this.updateLivePricing();
    }

    initializeWizard() {
        // Load project data from data store
        if (this.dataStore) {
            this.wizardData.project = this.dataStore.getProject();
        } else {
            // Fallback to localStorage if dataStore not available
            const saved = localStorage.getItem('naas_full_quote');
            if (saved) {
                try {
                    const savedData = JSON.parse(saved);
                    this.wizardData = { ...this.wizardData, ...savedData };
                } catch (e) {
                    console.warn('Could not load saved wizard data from localStorage');
                }
            }
        }

        this.currentStep = 1;
        this.updateProgress();
        this.renderStep(1);
    }

    goToStep(step) {
        if (step < 1 || step > this.totalSteps) return;
        if (step > this.currentStep && !this.validateCurrentStep()) return;

        this.currentStep = step;
        this.updateProgress();
        this.renderStep(step);
    }

    validateCurrentStep() {
        // Basic validation - can be expanded based on step requirements
        try {
            const wizardContent = document.getElementById('wizardContent');
            if (!wizardContent) {
                console.warn('Wizard content not found for validation');
                return true; // Allow progression if content not found
            }

            // For project information step (step 1), check required fields
            if (this.currentStep === 1) {
                const projectName = wizardContent.querySelector('[name="projectName"]');
                const customerName = wizardContent.querySelector('[name="customerName"]');

                if (projectName && !projectName.value.trim()) {
                    this.showValidationError('Please enter a project name');
                    return false;
                }

                if (customerName && !customerName.value.trim()) {
                    this.showValidationError('Please enter a customer name');
                    return false;
                }
            }

            // For component steps, basic check that at least something is configured
            // Add more specific validation rules here as needed

            return true;
        } catch (error) {
            console.error('Error validating step:', error);
            // Don't block navigation on validation errors
            return true;
        }
    }

    showValidationError(message) {
        // Show error notification using the app's notification system
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'error');
        } else {
            // Fallback alert if notification system not available
            alert(message);
        }
    }

    nextStep() {
        if (!this.validateCurrentStep()) return;
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateProgress();
            this.renderStep(this.currentStep);
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateProgress();
            this.renderStep(this.currentStep);
        }
    }

    updateProgress() {
        // Update step indicators
        this.updateStepIndicators();

        // Update progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            const progress = (this.currentStep / this.totalSteps) * 100;
            progressBar.style.width = `${progress}%`;
        }

        // Update step counter
        const stepCounter = document.getElementById('currentStep');
        const totalStepsSpan = document.getElementById('totalSteps');
        if (stepCounter) {
            stepCounter.textContent = this.currentStep;
        }
        if (totalStepsSpan) {
            totalStepsSpan.textContent = this.totalSteps;
        }
    }

    updateStepIndicators() {
        const stepIndicators = document.getElementById('stepIndicators');
        if (!stepIndicators) return;

        let html = '';
        for (let i = 1; i <= this.totalSteps; i++) {
            const isActive = i === this.currentStep;
            const isCompleted = i < this.currentStep;
            
            html += `
                <div class="step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" data-step="${i}">
                    ${isCompleted ? '<i class="fas fa-check"></i>' : `<span>${i}</span>`}
                </div>
            `;
        }
        
        stepIndicators.innerHTML = html;
    }

    renderStep(step) {
        const wizardContent = document.getElementById('wizardContent');
        if (!wizardContent) return;

        const stepInfo = this.steps[step];
        let content = '';

        // Step header
        const header = `
            <div class="step-header mb-8">
                <div class="flex items-center mb-4">
                    <div class="bg-blue-100 p-3 rounded-lg mr-4">
                        <i class="${stepInfo.icon} text-blue-600 text-xl"></i>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">${stepInfo.title}</h2>
                        <p class="text-gray-600">${stepInfo.subtitle}</p>
                    </div>
                </div>
            </div>
        `;

        switch (step) {
            case 1:
                content = this.renderProjectStep();
                break;
            case 2:
                content = this.renderHelpStep();
                break;
            case 3:
                content = this.renderComponentStep('enhancedSupport');
                break;
            case 4:
                content = this.renderComponentStep('onboarding');
                break;
            case 5:
                content = this.renderComponentStep('capital');
                break;
            case 6:
                content = this.renderComponentStep('pbsFoundation');
                break;
            case 7:
                content = this.renderComponentStep('support');
                break;
            case 8:
                content = this.renderComponentStep('assessment');
                break;
            case 9:
                content = this.renderComponentStep('prtg');
                break;
            case 10:
                content = this.renderComponentStep('admin');
                break;
            case 11:
                content = this.renderComponentStep('otherCosts');
                break;
            case 12:
                content = this.renderComponentStep('dynamics1Year');
                break;
            case 13:
                content = this.renderComponentStep('dynamics3Year');
                break;
            case 14:
                content = this.renderComponentStep('dynamics5Year');
                break;
            case 15:
                content = this.renderComponentStep('naasStandard');
                break;
            case 16:
                content = this.renderComponentStep('naasEnhanced');
                break;
            case 17:
                content = this.renderContractStep();
                break;
            case 18:
                content = this.renderReviewStep();
                break;
        }

        const navigation = this.renderNavigation();

        wizardContent.innerHTML = header + content + navigation;
        
        // Initialize component-specific functionality after rendering
        if (step >= 3 && step <= 16) {
            this.initializeWizardComponent(step);
        }
        
        // Populate form with existing data
        this.populateStepForm(step);
        
        // Update live pricing if enabled
        this.updateLivePricing();
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

    renderComponentConfiguration(componentType) {
        // Get the component configuration from the component manager
        if (!window.componentManager) {
            console.error('Component manager not available');
            return '<div class="text-gray-500">Component manager not available</div>';
        }

        if (!window.componentManager.components[componentType]) {
            console.error(`Component ${componentType} not found in component manager`);
            return '<div class="text-gray-500">Component not found</div>';
        }

        try {
            let configHTML = '';

            switch (componentType) {
                case 'help':
                    configHTML = window.componentManager.renderHelpConfig();
                    break;
                case 'prtg':
                    configHTML = window.componentManager.renderPRTGConfig();
                    break;
                case 'capital':
                    configHTML = window.componentManager.renderCapitalConfig();
                    break;
                case 'support':
                    configHTML = window.componentManager.renderSupportConfig();
                    break;
                case 'onboarding':
                    configHTML = window.componentManager.renderOnboardingConfig();
                    break;
                case 'pbsFoundation':
                    configHTML = window.componentManager.renderPBSFoundationConfig();
                    break;
                case 'assessment':
                    configHTML = window.componentManager.renderAssessmentConfig();
                    break;
                case 'admin':
                    configHTML = window.componentManager.renderAdminConfig();
                    break;
                case 'otherCosts':
                    configHTML = window.componentManager.renderOtherCostsConfig();
                    break;
                case 'enhancedSupport':
                    configHTML = window.componentManager.renderEnhancedSupportConfig();
                    break;
                case 'dynamics1Year':
                    configHTML = window.componentManager.renderDynamicsConfig(1);
                    break;
                case 'dynamics3Year':
                    configHTML = window.componentManager.renderDynamicsConfig(3);
                    break;
                case 'dynamics5Year':
                    configHTML = window.componentManager.renderDynamicsConfig(5);
                    break;
                case 'naasStandard':
                    configHTML = window.componentManager.renderNaaSConfig('standard');
                    break;
                case 'naasEnhanced':
                    configHTML = window.componentManager.renderNaaSConfig('enhanced');
                    break;
                default:
                    configHTML = '<div class="text-gray-500">Configuration not available</div>';
            }
            
            if (!configHTML) {
                console.error(`No configuration HTML returned for ${componentType}`);
                return '<div class="text-gray-500">Configuration not available</div>';
            }
            
            return configHTML;
        } catch (error) {
            console.error('Error rendering component configuration:', error);
            return '<div class="text-gray-500">Configuration not available</div>';
        }
    }

    renderComponentStep(componentType) {
        const component = window.componentManager?.components[componentType];
        if (!component) return '<div class="text-center text-gray-500">Component not found</div>';

        let componentData = { enabled: false, params: {} };
        if (this.dataStore) {
            componentData = this.dataStore.getComponent(componentType);
        }
        const isEnabled = componentData.enabled || false;
        const params = componentData.params || {};

        // Map component types to exact colors from renders document - matching the colored accents
        const colorMap = {
            help: { icon: 'text-[var(--qolcom-green)]', bg: 'bg-gray-700', tag: 'text-[var(--qolcom-green)]' },
            prtg: { icon: 'text-purple-400', bg: 'bg-purple-900 bg-opacity-50', tag: 'text-purple-300' },
            capital: { icon: 'text-indigo-400', bg: 'bg-indigo-900 bg-opacity-50', tag: 'text-indigo-300' },
            support: { icon: 'text-cyan-400', bg: 'bg-cyan-900 bg-opacity-50', tag: 'text-cyan-300' },
            onboarding: { icon: 'text-emerald-400', bg: 'bg-emerald-900 bg-opacity-50', tag: 'text-emerald-300' },
            pbsFoundation: { icon: 'text-blue-400', bg: 'bg-blue-900 bg-opacity-50', tag: 'text-blue-300' },
            assessment: { icon: 'text-gray-400', bg: 'bg-gray-700', tag: 'text-gray-300' },
            admin: { icon: 'text-slate-400', bg: 'bg-slate-700', tag: 'text-slate-300' },
            otherCosts: { icon: 'text-orange-400', bg: 'bg-orange-900 bg-opacity-50', tag: 'text-orange-300' },
            enhancedSupport: { icon: 'text-red-400', bg: 'bg-red-900 bg-opacity-50', tag: 'text-red-300' },
            dynamics1Year: { icon: 'text-blue-400', bg: 'bg-blue-900 bg-opacity-50', tag: 'text-blue-300' },
            dynamics3Year: { icon: 'text-blue-400', bg: 'bg-blue-900 bg-opacity-50', tag: 'text-blue-300' },
            dynamics5Year: { icon: 'text-blue-400', bg: 'bg-blue-900 bg-opacity-50', tag: 'text-blue-300' },
            naasStandard: { icon: 'text-[var(--qolcom-green)]', bg: 'bg-gray-700', tag: 'text-[var(--qolcom-green)]' },
            naasEnhanced: { icon: 'text-[var(--qolcom-green)]', bg: 'bg-gray-700', tag: 'text-[var(--qolcom-green)]' }
        };

        const colors = colorMap[componentType] || { icon: 'text-gray-400', bg: 'bg-gray-700' };
        const materialIcon = this.getMaterialIcon(componentType);

        return `
            <div class="component-step">
                <div class="mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center">
                            <div class="${colors.bg} p-3 rounded-lg mr-4">
                                <span class="material-icons ${colors.icon} text-xl">${materialIcon}</span>
                            </div>
                            <div>
                                <h3 class="text-xl font-semibold text-gray-200">${component.name}</h3>
                                <p class="text-gray-400">${component.description}</p>
                            </div>
                        </div>
                        <label class="flex items-center cursor-pointer">
                            <input type="checkbox" id="enable-${componentType}" class="sr-only" ${isEnabled ? 'checked' : ''}>
                            <div class="relative">
                                <div class="w-10 h-6 bg-gray-600 rounded-full shadow-inner"></div>
                                <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform ${isEnabled ? 'transform translate-x-4 bg-[var(--qolcom-green)]' : ''}"></div>
                            </div>
                            <span class="ml-3 text-sm font-medium text-gray-300">Enable</span>
                        </label>
                    </div>
                </div>

                <div id="config-${componentType}" class="component-config ${isEnabled ? '' : 'hidden'}">
                    ${this.renderComponentConfiguration(componentType)}
                    <div id="wizardComponentResults-${componentType}" class="mt-6">
                        <!-- Results will be populated here -->
                    </div>
                </div>

                <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div class="text-sm text-gray-600">
                            Don't need this component?
                        </div>
                        <button type="button" id="skip-${componentType}" class="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            Skip this section →
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderHelpStep() {
        return `
            <div class="help-step">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            <i class="fas fa-info-circle text-blue-600 text-xl"></i>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-lg font-medium text-blue-900">Welcome to the NaaS Calculator</h3>
                            <p class="mt-1 text-sm text-blue-700">
                                This calculator helps you build comprehensive Network-as-a-Service quotes. Follow the steps below to configure your solution.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-900 mb-2">
                            <i class="fas fa-play-circle text-green-600 mr-2"></i>Getting Started
                        </h4>
                        <ul class="text-sm text-gray-600 space-y-1">
                            <li>• Complete project information in Step 1</li>
                            <li>• Configure each component as needed</li>
                            <li>• Use "Skip" to bypass unwanted components</li>
                            <li>• Review and generate your final quote</li>
                        </ul>
                    </div>

                    <div class="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-900 mb-2">
                            <i class="fas fa-calculator text-blue-600 mr-2"></i>Pricing Features
                        </h4>
                        <ul class="text-sm text-gray-600 space-y-1">
                            <li>• Real-time pricing calculations</li>
                            <li>• Volume discounts for multiple components</li>
                            <li>• Financing options for capital equipment</li>
                            <li>• CPI escalation for long-term contracts</li>
                        </ul>
                    </div>
                </div>

                <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h4 class="font-semibold text-gray-900 mb-3">
                        <i class="fas fa-list-check text-purple-600 mr-2"></i>Component Overview
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div class="text-sm">
                            <div class="font-medium text-gray-900">Core Services</div>
                            <div class="text-gray-600">PRTG Monitoring, Support Services, Onboarding</div>
                        </div>
                        <div class="text-sm">
                            <div class="font-medium text-gray-900">Infrastructure</div>
                            <div class="text-gray-600">Capital Equipment, PBS Foundation</div>
                        </div>
                        <div class="text-sm">
                            <div class="font-medium text-gray-900">Assessment</div>
                            <div class="text-gray-600">Platform Assessment, Admin Services</div>
                        </div>
                        <div class="text-sm">
                            <div class="font-medium text-gray-900">Enhanced Options</div>
                            <div class="text-gray-600">Enhanced Support, Other Costs</div>
                        </div>
                        <div class="text-sm">
                            <div class="font-medium text-gray-900">Dynamic Pricing</div>
                            <div class="text-gray-600">1, 3, and 5-year options</div>
                        </div>
                        <div class="text-sm">
                            <div class="font-medium text-gray-900">Packages</div>
                            <div class="text-gray-600">Standard and Enhanced NaaS</div>
                        </div>
                    </div>
                </div>

                <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div class="text-sm text-yellow-800">
                            <i class="fas fa-lightbulb mr-2"></i>
                            <strong>Tip:</strong> You can always go back to previous steps to make changes.
                        </div>
                        <button type="button" id="skip-help" class="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            Skip this section →
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderProjectStep() {
        const projectData = this.dataStore.getProject();
        
        return `
            <div class="space-y-6">
                <div class="config-section">
                    <h3><i class="fas fa-building"></i>Project Information</h3>
                    <div class="config-grid">
                        <div class="form-group">
                            <label class="form-label">Project Name</label>
                            <input type="text" name="projectName" class="form-input" placeholder="Enterprise Network Upgrade" value="${projectData.projectName || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Customer Name</label>
                            <input type="text" name="customerName" class="form-input" placeholder="Acme Corporation" value="${projectData.customerName || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Project Timeline</label>
                            <select name="timeline" class="form-input form-select">
                                <option value="immediate" ${projectData.timeline === 'immediate' ? 'selected' : ''}>Immediate (< 1 month)</option>
                                <option value="short" ${projectData.timeline === 'short' ? 'selected' : ''}>Short term (1-3 months)</option>
                                <option value="medium" ${projectData.timeline === 'medium' ? 'selected' : ''}>Medium term (3-6 months)</option>
                                <option value="long" ${projectData.timeline === 'long' ? 'selected' : ''}>Long term (6+ months)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Budget Range</label>
                            <select name="budget" class="form-input form-select">
                                <option value="small" ${projectData.budget === 'small' ? 'selected' : ''}>Small (< £50k)</option>
                                <option value="medium" ${projectData.budget === 'medium' ? 'selected' : ''}>Medium (£50k - £200k)</option>
                                <option value="large" ${projectData.budget === 'large' ? 'selected' : ''}>Large (£200k - £500k)</option>
                                <option value="enterprise" ${projectData.budget === 'enterprise' ? 'selected' : ''}>Enterprise (£500k+)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="config-section">
                    <h3><i class="fas fa-map-marker-alt"></i>Site Information</h3>
                    <div class="config-grid">
                        <div class="form-group">
                            <label class="form-label">Number of Sites</label>
                            <input type="number" name="sites" class="form-input" min="1" max="100" placeholder="1" value="${projectData.sites || 1}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Primary Location</label>
                            <input type="text" name="primaryLocation" class="form-input" placeholder="New York, NY" value="${projectData.primaryLocation || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Total Users</label>
                            <input type="number" name="totalUsers" class="form-input" min="1" placeholder="100" value="${projectData.totalUsers || 100}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Network Complexity</label>
                            <select name="complexity" class="form-input form-select">
                                <option value="simple" ${projectData.complexity === 'simple' ? 'selected' : ''}>Simple (Basic routing, single subnet)</option>
                                <option value="standard" ${projectData.complexity === 'standard' ? 'selected' : ''}>Standard (Multiple VLANs, basic security)</option>
                                <option value="complex" ${projectData.complexity === 'complex' ? 'selected' : ''}>Complex (Advanced routing, full security stack)</option>
                                <option value="enterprise" ${projectData.complexity === 'enterprise' ? 'selected' : ''}>Enterprise (Multi-site, full redundancy)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderInfrastructureStep() {
        return `
            <div class="space-y-6">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Equipment Selection -->
                    <div class="config-section">
                        <h3><i class="fas fa-server"></i>Network Equipment</h3>
                        <div class="space-y-4">
                            <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
                                <input type="checkbox" name="enableCapital" class="mr-3">
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900">Include Network Equipment</div>
                                    <div class="text-sm text-gray-600">Routers, switches, firewalls, and wireless equipment</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-lg font-bold text-green-600" id="capitalPreview">£0</div>
                                    <div class="text-sm text-gray-500">/month</div>
                                </div>
                            </label>
                            
                            <div id="capitalConfig" class="ml-6 space-y-3 hidden">
                                <div class="form-group">
                                    <label class="form-label">Quick Template</label>
                                    <select name="equipmentTemplate" class="form-input form-select">
                                        <option value="">Custom Configuration</option>
                                        <option value="small_office">Small Office (< 25 users)</option>
                                        <option value="medium_office">Medium Office (25-100 users)</option>
                                        <option value="large_office">Large Office (100-500 users)</option>
                                        <option value="enterprise">Enterprise (500+ users)</option>
                                    </select>
                                </div>
                                <button type="button" id="configureEquipment" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                    <i class="fas fa-cog mr-2"></i>Configure Equipment
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Monitoring -->
                    <div class="config-section">
                        <h3><i class="fas fa-chart-line"></i>Network Monitoring</h3>
                        <div class="space-y-4">
                            <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
                                <input type="checkbox" name="enablePRTG" class="mr-3">
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900">PRTG Network Monitoring</div>
                                    <div class="text-sm text-gray-600">24/7 network monitoring and alerting</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-lg font-bold text-green-600" id="prtgPreview">£0</div>
                                    <div class="text-sm text-gray-500">/month</div>
                                </div>
                            </label>
                            
                            <div id="prtgConfig" class="ml-6 space-y-3 hidden">
                                <div class="grid grid-cols-2 gap-3">
                                    <div class="form-group">
                                        <label class="form-label">Sensors</label>
                                        <input type="number" name="prtgSensors" class="form-input" value="100" min="1">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Service Level</label>
                                        <select name="prtgServiceLevel" class="form-input form-select">
                                            <option value="standard">Standard</option>
                                            <option value="enhanced" selected>Enhanced</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- PBS Foundation -->
                <div class="config-section">
                    <h3><i class="fas fa-building"></i>Platform Services</h3>
                    <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
                        <input type="checkbox" name="enablePBSFoundation" class="mr-3">
                        <div class="flex-1">
                            <div class="font-medium text-gray-900">PBS Foundation Platform</div>
                            <div class="text-sm text-gray-600">Management platform and administrative services</div>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-bold text-green-600" id="pbsPreview">£0</div>
                            <div class="text-sm text-gray-500">/month</div>
                        </div>
                    </label>
                </div>
            </div>
        `;
    }

    renderServiceStep() {
        return `
            <div class="space-y-6">
                <!-- Support Services -->
                <div class="config-section">
                    <h3><i class="fas fa-headset"></i>Support Services</h3>
                    <div class="space-y-4">
                        <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
                            <input type="checkbox" name="enableSupport" class="mr-3">
                            <div class="flex-1">
                                <div class="font-medium text-gray-900">Managed Support Services</div>
                                <div class="text-sm text-gray-600">Professional support and maintenance</div>
                            </div>
                            <div class="text-right">
                                <div class="text-lg font-bold text-green-600" id="supportPreview">£0</div>
                                <div class="text-sm text-gray-500">/month</div>
                            </div>
                        </label>
                        
                        <div id="supportConfig" class="ml-6 space-y-4 hidden">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="support-tier border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300" data-tier="basic">
                                    <div class="text-center">
                                        <h4 class="font-semibold text-gray-900">Basic</h4>
                                        <div class="text-2xl font-bold text-green-600 my-2">£400</div>
                                        <div class="text-sm text-gray-600">+ £20/device</div>
                                        <div class="text-xs text-gray-500 mt-2">8x5 Email Support</div>
                                    </div>
                                </div>
                                <div class="support-tier border-2 border-blue-300 bg-blue-50 rounded-lg p-4 cursor-pointer" data-tier="standard">
                                    <div class="text-center">
                                        <h4 class="font-semibold text-gray-900">Standard</h4>
                                        <div class="text-2xl font-bold text-green-600 my-2">£600</div>
                                        <div class="text-sm text-gray-600">+ £28/device</div>
                                        <div class="text-xs text-gray-500 mt-2">12x5 Phone + Email</div>
                                    </div>
                                </div>
                                <div class="support-tier border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300" data-tier="enhanced">
                                    <div class="text-center">
                                        <h4 class="font-semibold text-gray-900">Enhanced</h4>
                                        <div class="text-2xl font-bold text-green-600 my-2">£960</div>
                                        <div class="text-sm text-gray-600">+ £40/device</div>
                                        <div class="text-xs text-gray-500 mt-2">24x7 All Channels</div>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Number of Devices</label>
                                <input type="number" name="supportDevices" class="form-input" value="10" min="1">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Onboarding -->
                <div class="config-section">
                    <h3><i class="fas fa-rocket"></i>Implementation Services</h3>
                    <div class="space-y-4">
                        <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
                            <input type="checkbox" name="enableOnboarding" class="mr-3" checked>
                            <div class="flex-1">
                                <div class="font-medium text-gray-900">Professional Onboarding</div>
                                <div class="text-sm text-gray-600">Setup, configuration, and go-live support</div>
                            </div>
                            <div class="text-right">
                                <div class="text-lg font-bold text-green-600" id="onboardingPreview">£3,600</div>
                                <div class="text-sm text-gray-500">one-time</div>
                            </div>
                        </label>
                        
                        <div id="onboardingConfig" class="ml-6 space-y-3">
                            <div class="form-group">
                                <label class="form-label">Implementation Complexity</label>
                                <select name="onboardingComplexity" class="form-input form-select">
                                    <option value="simple">Simple (£2,000)</option>
                                    <option value="standard" selected>Standard (£3,600)</option>
                                    <option value="complex">Complex (£6,800)</option>
                                    <option value="enterprise">Enterprise (£12,000)</option>
                                </select>
                            </div>
                            <label class="flex items-center">
                                <input type="checkbox" name="includeAssessment" class="mr-2" checked>
                                <span class="form-label mb-0">Include Pre-Implementation Assessment (+£2,800)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderContractStep() {
        return `
            <div class="space-y-6">
                <div class="config-section">
                    <h3><i class="fas fa-calendar-alt"></i>Contract Terms</h3>
                    <div class="config-grid">
                        <div class="form-group">
                            <label class="form-label">Contract Duration</label>
                            <div class="grid grid-cols-3 gap-3">
                                <label class="contract-term border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 text-center" data-term="12">
                                    <input type="radio" name="contractTerm" value="12" class="sr-only">
                                    <div class="font-semibold">1 Year</div>
                                    <div class="text-sm text-gray-600">Flexible</div>
                                </label>
                                <label class="contract-term border-2 border-blue-300 bg-blue-50 rounded-lg p-4 cursor-pointer text-center" data-term="36">
                                    <input type="radio" name="contractTerm" value="36" class="sr-only" checked>
                                    <div class="font-semibold">3 Years</div>
                                    <div class="text-sm text-green-600">5% Discount</div>
                                    <div class="text-xs text-gray-500">Recommended</div>
                                </label>
                                <label class="contract-term border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 text-center" data-term="60">
                                    <input type="radio" name="contractTerm" value="60" class="sr-only">
                                    <div class="font-semibold">5 Years</div>
                                    <div class="text-sm text-green-600">10% Discount</div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="config-section">
                    <h3><i class="fas fa-credit-card"></i>Payment Options</h3>
                    <div class="space-y-4">
                        <label class="flex items-center p-4 border-2 border-blue-300 bg-blue-50 rounded-lg cursor-pointer">
                            <input type="radio" name="paymentFrequency" value="monthly" class="mr-3" checked>
                            <div class="flex-1">
                                <div class="font-medium text-gray-900">Monthly Payments</div>
                                <div class="text-sm text-gray-600">Standard monthly billing</div>
                            </div>
                        </label>
                        <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
                            <input type="radio" name="paymentFrequency" value="annual" class="mr-3">
                            <div class="flex-1">
                                <div class="font-medium text-gray-900">Annual Payments</div>
                                <div class="text-sm text-gray-600">Pay yearly and save 2% additional discount</div>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="config-section">
                    <h3><i class="fas fa-percentage"></i>Volume Discounts</h3>
                    <div id="discountBreakdown" class="space-y-3">
                        <!-- Discount information will be populated here -->
                    </div>
                </div>

                <div class="config-section">
                    <h3><i class="fas fa-file-signature"></i>Additional Options</h3>
                    <div class="space-y-3">
                        <label class="flex items-center">
                            <input type="checkbox" name="autoRenewal" class="mr-2" checked>
                            <span class="form-label mb-0">Auto-renewal (additional 2% discount)</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="escalationClause" class="mr-2" checked>
                            <span class="form-label mb-0">Include CPI escalation clause (3% annually)</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="slaGuarantee" class="mr-2">
                            <span class="form-label mb-0">99.9% SLA guarantee (+5% monthly cost)</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    renderReviewStep() {
        // Calculate final quote using data from dataStore
        let componentsData = {};
        if (this.dataStore) {
            // Get enabled components from dataStore
            componentsData = this.dataStore.getEnabledComponents();
        } else {
            // Fallback to wizardData (less reliable)
            Object.keys(this.wizardData).forEach(key => {
                if (key !== 'project' && this.wizardData[key] && this.wizardData[key].enabled) {
                    componentsData[key] = this.wizardData[key];
                }
            });
        }
        const quote = this.calculator.calculateCombinedQuote(componentsData);
        
        return `
            <div class="space-y-6">
                <!-- Quote Summary -->
                <div class="config-section">
                    <h3><i class="fas fa-file-invoice-dollar"></i>Quote Summary</h3>
                    <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                            <div>
                                <div class="text-2xl font-bold text-gray-900">${this.calculator.formatCurrency(quote.totals.oneTime)}</div>
                                <div class="text-sm text-gray-600">One-time Costs</div>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-green-600">${this.calculator.formatCurrency(quote.totals.monthly)}</div>
                                <div class="text-sm text-gray-600">Monthly Cost</div>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-blue-600">${this.calculator.formatCurrency(quote.totals.annual)}</div>
                                <div class="text-sm text-gray-600">Annual Cost</div>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-purple-600">${this.calculator.formatCurrency(quote.totals.threeYear)}</div>
                                <div class="text-sm text-gray-600">3-Year Total</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Component Breakdown -->
                <div class="config-section">
                    <h3><i class="fas fa-list"></i>Component Breakdown</h3>
                    <div class="space-y-4" id="componentBreakdown">
                        ${this.renderComponentBreakdown(quote)}
                    </div>
                </div>

                <!-- Discounts Applied -->
                ${quote.discounts && (quote.discounts.monthlyDiscount > 0 || quote.discounts.annualDiscount > 0) ? `
                <div class="config-section">
                    <h3><i class="fas fa-tags"></i>Discounts Applied</h3>
                    <div class="bg-green-50 rounded-lg p-4">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div>
                                <div class="text-lg font-bold text-green-600">${(quote.discounts.monthlyDiscount * 100).toFixed(1)}%</div>
                                <div class="text-sm text-gray-600">Monthly Discount</div>
                            </div>
                            <div>
                                <div class="text-lg font-bold text-green-600">${(quote.discounts.annualDiscount * 100).toFixed(1)}%</div>
                                <div class="text-sm text-gray-600">Annual Discount</div>
                            </div>
                            <div>
                                <div class="text-lg font-bold text-green-600">${(quote.discounts.termDiscount * 100).toFixed(1)}%</div>
                                <div class="text-sm text-gray-600">Term Discount</div>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Actions -->
                <div class="config-section">
                    <h3><i class="fas fa-rocket"></i>Next Steps</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button type="button" id="saveQuote" class="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 text-center">
                            <i class="fas fa-save text-xl mb-2"></i>
                            <div class="font-medium">Save Quote</div>
                            <div class="text-sm opacity-90">Save for later review</div>
                        </button>
                        <button type="button" id="exportQuote" class="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 text-center">
                            <i class="fas fa-download text-xl mb-2"></i>
                            <div class="font-medium">Export PDF</div>
                            <div class="text-sm opacity-90">Professional proposal</div>
                        </button>
                        <button type="button" id="emailQuote" class="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 text-center">
                            <i class="fas fa-envelope text-xl mb-2"></i>
                            <div class="font-medium">Email Quote</div>
                            <div class="text-sm opacity-90">Send to stakeholders</div>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderComponentBreakdown(quote) {
        let html = '';
        Object.keys(quote.components).forEach(componentType => {
            const component = quote.components[componentType];
            const componentInfo = componentManager.components[componentType];
            
            if (componentInfo) {
                html += `
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div class="flex items-center">
                            <div class="bg-${componentInfo.color}-100 p-2 rounded-lg mr-3">
                                <i class="${componentInfo.icon} text-${componentInfo.color}-600"></i>
                            </div>
                            <div>
                                <div class="font-medium text-gray-900">${componentInfo.name}</div>
                                <div class="text-sm text-gray-600">${componentInfo.description}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-medium text-green-600">${this.calculator.formatCurrency(component.totals.monthly)}/month</div>
                            <div class="text-sm text-gray-500">${this.calculator.formatCurrency(component.totals.threeYear)} 3-year total</div>
                        </div>
                    </div>
                `;
            }
        });
        return html;
    }

    renderNavigation() {
        const prevDisabled = this.currentStep === 1;
        const nextLabel = this.currentStep === this.totalSteps ? 'Generate Quote' : 'Next Step';
        const nextIcon = this.currentStep === this.totalSteps ? 'fas fa-check' : 'fas fa-arrow-right';

        return `
            <div class="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
                <button type="button" id="wizardPrev" 
                        class="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 ${prevDisabled ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${prevDisabled ? 'disabled' : ''}>
                    <i class="fas fa-arrow-left mr-2"></i>Previous
                </button>
                
                <div class="text-sm text-gray-500">
                    Step ${this.currentStep} of ${this.totalSteps}
                </div>
                
                <button type="button" id="wizardNext" 
                        class="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    ${nextLabel}<i class="${nextIcon} ml-2"></i>
                </button>
            </div>
        `;
    }

    validateCurrentStep() {
        // Add validation logic for each step
        switch (this.currentStep) {
            case 1:
                return this.validateProjectStep();
            case 2:
                return true; // Help step can always be skipped
            case 17:
                return this.validateContractStep();
            case 18:
                return true; // Review step doesn't need validation
            default:
                return true; // Component steps don't need validation
        }
    }

    validateProjectStep() {
        const projectData = this.dataStore.getProject();
        
        if (!projectData.projectName || !projectData.customerName) {
            this.showValidationError('Please fill in the project name and customer name.');
            return false;
        }
        return true;
    }

    validateInfrastructureStep() {
        // At least one infrastructure component should be selected
        const enabledComponents = this.dataStore.getEnabledComponents();
        const hasAnyComponent = Object.keys(enabledComponents).length > 0;
        
        if (!hasAnyComponent) {
            this.showValidationError('Please select at least one infrastructure component.');
            return false;
        }
        return true;
    }

    validateServiceStep() {
        return true; // Services are optional
    }

    validateContractStep() {
        return true; // Contract terms have defaults
    }

    showValidationError(message) {
        // Show error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 p-4 bg-red-600 text-white rounded-lg shadow-lg z-50';
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-circle mr-2"></i>
                ${message}
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    handleWizardInput(e) {
        const input = e.target;
        const name = input.name;
        const value = input.type === 'checkbox' ? input.checked : 
                     input.type === 'number' ? parseFloat(input.value) || 0 : 
                     input.value;

        // Route data to appropriate section
        if (!this.dataStore) {
            console.warn('DataStore not available for wizard input handling');
            return;
        }

        if (name.startsWith('project') || ['projectName', 'customerName', 'timeline', 'budget', 'sites', 'primaryLocation', 'totalUsers', 'complexity'].includes(name)) {
            const currentProject = this.dataStore.getProject();
            this.dataStore.updateProject({ ...currentProject, [name]: value });
        } else if (name.startsWith('enable-')) {
            const componentType = name.replace('enable-', '');
            console.log(`Wizard: Setting ${componentType} enabled to ${value}`);
            this.dataStore.setComponentEnabled(componentType, value);
        } else {
            // Route to appropriate component
            const componentMapping = {
                'prtgSensors': 'prtg',
                'prtgServiceLevel': 'prtg',
                'supportDevices': 'support',
                'onboardingComplexity': 'onboarding',
                'includeAssessment': 'onboarding'
            };

            const targetComponent = componentMapping[name] || this.getCurrentStepComponent();
            if (targetComponent) {
                console.log(`Wizard: Updating ${targetComponent} param ${name} to ${value}`);
                this.dataStore.updateComponentParams(targetComponent, { [name]: value });
            }
        }
        
        // Update live pricing
        this.updateLivePricing();
    }

    getCurrentStepComponent() {
        // Get the component type for the current step
        const stepComponentMap = {
            3: 'enhancedSupport',
            4: 'onboarding',
            5: 'capital',
            6: 'pbsFoundation',
            7: 'support',
            8: 'assessment',
            9: 'prtg',
            10: 'admin',
            11: 'otherCosts',
            12: 'dynamics1Year',
            13: 'dynamics3Year',
            14: 'dynamics5Year',
            15: 'naasStandard',
            16: 'naasEnhanced'
        };
        
        return stepComponentMap[this.currentStep] || null;
    }

    initializeWizardComponent(step) {
        const componentType = this.getCurrentStepComponent();
        if (!componentType || !window.componentManager) return;

        // Get the component configuration area
        const configArea = document.getElementById(`config-${componentType}`);
        if (!configArea) return;

        // Get component data from data store
        const componentData = this.dataStore.getComponent(componentType);
        
        // Populate form with existing data (same as standalone component)
        window.componentManager.populateForm(componentType, componentData.params);
        
        // Special handling for specific components (same as standalone component)
        if (componentType === 'prtg') {
            window.componentManager.populatePRTGDeviceTable();
        }
        
        // Calculate initial results (same as standalone component)
        window.componentManager.calculateComponent(componentType);
    }

    populateStepForm(step) {
        // Populate form fields with existing data
        const wizardContent = document.getElementById('wizardContent');
        
        // Project data
        Object.keys(this.wizardData.project || {}).forEach(key => {
            const input = wizardContent.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = this.wizardData.project[key];
                } else {
                    input.value = this.wizardData.project[key];
                }
            }
        });

        // Component enabled states from data store
        if (this.dataStore) {
            const components = this.dataStore.getAllComponents();
            Object.keys(components).forEach(componentType => {
                if (components[componentType].enabled) {
                    const enableInput = wizardContent.querySelector(`[name="enable${componentType.charAt(0).toUpperCase() + componentType.slice(1)}"]`);
                    if (enableInput) {
                        enableInput.checked = true;
                        enableInput.dispatchEvent(new Event('change'));
                    }
                }
            });
        }
    }

    updateLivePricing() {
        // Update component previews
        if (!this.dataStore) {
            console.warn('DataStore not available for live pricing updates');
            return;
        }

        const enabledComponents = this.dataStore.getEnabledComponents();

        Object.keys(enabledComponents).forEach(componentType => {
            const preview = document.getElementById(`${componentType}Preview`);
            if (preview && this.calculator) {
                let result;
                const params = enabledComponents[componentType].params || {};
                
                switch (componentType) {
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
                }

                if (result) {
                    if (componentType === 'onboarding') {
                        preview.textContent = this.calculator.formatCurrency(result.totals.oneTime);
                    } else {
                        preview.textContent = this.calculator.formatCurrency(result.totals.monthly);
                    }
                }
            }
        });
    }
}

// Initialize wizard when needed
let quoteWizard;
document.addEventListener('DOMContentLoaded', () => {
    if (window.NaaSCalculator) {
        const calculator = new NaaSCalculator();
        quoteWizard = new QuoteWizard(calculator);
    }
});