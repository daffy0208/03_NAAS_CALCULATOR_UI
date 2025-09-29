/**
 * NaaS Pricing Calculator - Calculation Orchestrator
 * Manages calculation dependencies, prevents race conditions, and ensures proper order
 */

class CalculationOrchestrator {
    constructor(calculator, dataStore) {
        this.calculator = calculator;
        this.dataStore = dataStore;
        this.pendingCalculations = new Set();
        this.calculationQueue = [];
        this.isProcessing = false;
        this.calculationTimeout = null;
        this.calculationHistory = [];
        this.maxHistorySize = 50;

        // Initialize formal dependency graph
        this.dependencyGraph = new DependencyGraph();
    }

    /**
     * Schedule a component calculation with priority-based queuing
     */
    scheduleCalculation(componentType, priority = 0, source = 'user') {
        // Prevent duplicate calculations for the same component
        if (this.pendingCalculations.has(componentType)) {
            console.log(`Calculation for ${componentType} already pending, skipping duplicate`);
            return;
        }

        console.log(`Scheduling calculation for ${componentType} (priority: ${priority}, source: ${source})`);

        this.pendingCalculations.add(componentType);
        this.calculationQueue.push({
            componentType,
            priority,
            source,
            timestamp: Date.now()
        });

        // Debounce multiple rapid updates to prevent calculation storms
        clearTimeout(this.calculationTimeout);
        this.calculationTimeout = setTimeout(() => {
            this.processCalculationQueue();
        }, 50); // 50ms debounce
    }

    /**
     * Process the calculation queue in dependency order
     */
    async processCalculationQueue() {
        if (this.isProcessing) {
            console.log('Calculation queue already processing, scheduling retry');
            // If already processing, schedule another attempt
            setTimeout(() => this.processCalculationQueue(), 100);
            return;
        }

        if (this.calculationQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        console.log(`Processing calculation queue with ${this.calculationQueue.length} items`);

        try {
            // Get calculation order using dependency graph
            const componentTypes = this.calculationQueue.map(calc => calc.componentType);
            const enabledComponents = this.dataStore.getEnabledComponents();

            // Validate dependencies before processing
            const validation = this.dependencyGraph.validateRelationships(enabledComponents);
            if (validation.errors.length > 0) {
                console.error('Dependency validation errors:', validation.errors);
                throw new Error(`Dependency errors: ${validation.errors.join(', ')}`);
            }

            if (validation.warnings.length > 0) {
                console.warn('Dependency warnings:', validation.warnings);
            }

            // Get topologically sorted order
            const sortedOrder = this.dependencyGraph.getCalculationOrder(enabledComponents);

            // Sort calculations by dependency order, then by priority
            const sortedCalculations = this.calculationQueue.sort((a, b) => {
                const aIndex = sortedOrder.indexOf(a.componentType);
                const bIndex = sortedOrder.indexOf(b.componentType);

                // If both components are in the sorted order, use that order
                if (aIndex !== -1 && bIndex !== -1) {
                    return aIndex - bIndex;
                }

                // Fallback to priority and timestamp
                const priorityDiff = b.priority - a.priority;
                if (priorityDiff !== 0) return priorityDiff;

                return a.timestamp - b.timestamp;
            });

            // Clear the queue and pending set
            this.calculationQueue = [];
            this.pendingCalculations.clear();

            // Process calculations in order
            const results = {};
            const startTime = Date.now();

            for (const calculation of sortedCalculations) {
                const { componentType, source } = calculation;

                try {
                    console.log(`Executing calculation for ${componentType}`);
                    const result = await this.executeCalculation(componentType);
                    results[componentType] = result;

                    // Check if this calculation triggers dependent calculations
                    this.scheduleDependentCalculations(componentType);

                } catch (error) {
                    console.error(`Error calculating ${componentType}:`, error);
                    results[componentType] = { error: error.message };
                }
            }

            // Record calculation batch in history
            this.recordCalculationBatch(sortedCalculations, results, Date.now() - startTime);

            // Notify UI of completion
            this.notifyCalculationComplete(results);

        } catch (error) {
            console.error('Error processing calculation queue:', error);
        } finally {
            this.isProcessing = false;

            // If new calculations were queued while processing, handle them
            if (this.calculationQueue.length > 0) {
                setTimeout(() => this.processCalculationQueue(), 10);
            }
        }
    }

    /**
     * Execute individual component calculation with context injection
     */
    async executeCalculation(componentType) {
        const componentData = this.dataStore.getComponent(componentType);
        if (!componentData.enabled) {
            return { totals: { monthly: 0, annual: 0, threeYear: 0, oneTime: 0 } };
        }

        const params = componentData.params;
        const context = this.buildCalculationContext(componentType);

        switch (componentType) {
            case 'help':
                return { totals: { monthly: 0, annual: 0, threeYear: 0, oneTime: 0 } };
            case 'prtg':
                return this.calculator.calculatePRTG(params, context);
            case 'capital':
                return this.calculator.calculateCapital(params, context);
            case 'support':
                return this.calculator.calculateSupport(params, context);
            case 'onboarding':
                return this.calculator.calculateOnboarding(params, context);
            case 'pbsFoundation':
                return this.calculator.calculatePBSFoundation(params, context);
            case 'assessment':
                return this.calculator.calculateAssessment(params, context);
            case 'admin':
                return this.calculator.calculateAdmin(params, context);
            case 'otherCosts':
                return this.calculator.calculateOtherCosts(params, context);
            case 'enhancedSupport':
                return this.calculator.calculateEnhancedSupport(params, context);
            case 'dynamics1Year':
            case 'dynamics3Year':
            case 'dynamics5Year':
                return this.calculator.calculateDynamics(params, componentType, context);
            case 'naasStandard':
            case 'naasEnhanced':
                return this.calculator.calculateNaaS(params, componentType, context);
            default:
                throw new Error(`Unknown component type: ${componentType}`);
        }
    }

    /**
     * Build calculation context with dependencies
     */
    buildCalculationContext(componentType) {
        const context = {
            timestamp: Date.now(),
            enabledComponents: this.dataStore.getEnabledComponents(),
            globalTotals: { monthly: 0, annual: 0, threeYear: 0, oneTime: 0 }
        };

        // Inject specific dependencies
        const deps = this.dependencies[componentType] || [];

        for (const dep of deps) {
            if (dep === '*') {
                // Special case: depends on all enabled components
                context.allComponents = context.enabledComponents;
            } else if (context.enabledComponents[dep]) {
                // Inject specific dependency data
                context[`${dep}Data`] = context.enabledComponents[dep];

                // Special case: capital equipment count for support calculations
                if (dep === 'capital' && componentType === 'support') {
                    const capitalData = context.enabledComponents.capital;
                    context.deviceCount = this.extractDeviceCount(capitalData);
                }
            }
        }

        return context;
    }

    /**
     * Extract device count from capital equipment data
     */
    extractDeviceCount(capitalData) {
        if (!capitalData || !capitalData.params || !capitalData.params.equipment) {
            return 10; // Default device count
        }

        return capitalData.params.equipment.reduce((total, item) => {
            return total + (item.quantity || 1);
        }, 0);
    }

    /**
     * Schedule calculations for components that depend on the given component
     */
    scheduleDependentCalculations(changedComponent) {
        const dependents = this.dependencyGraph.getDependents(changedComponent);

        for (const componentType of dependents) {
            // Only schedule if the dependent component is enabled
            const componentData = this.dataStore.getComponent(componentType);
            if (componentData.enabled) {
                this.scheduleCalculation(componentType, 1, 'dependency');
            }
        }
    }

    /**
     * Get dependency level for topological sorting
     */
    getDependencyLevel(componentType) {
        try {
            return this.dependencyGraph.getLevel(componentType);
        } catch (error) {
            console.warn(`Unknown component type: ${componentType}, using default level 999`);
            return 999;
        }
    }

    /**
     * Record calculation batch in history for debugging
     */
    recordCalculationBatch(calculations, results, duration) {
        const batch = {
            timestamp: Date.now(),
            calculations: calculations.map(c => ({
                component: c.componentType,
                level: this.getDependencyLevel(c.componentType),
                source: c.source
            })),
            results: Object.keys(results).reduce((acc, key) => {
                acc[key] = results[key].totals || { error: true };
                return acc;
            }, {}),
            duration
        };

        this.calculationHistory.push(batch);

        // Limit history size
        if (this.calculationHistory.length > this.maxHistorySize) {
            this.calculationHistory = this.calculationHistory.slice(-this.maxHistorySize);
        }

        console.log(`Calculation batch completed in ${duration}ms:`, batch);
    }

    /**
     * Notify UI components of calculation completion
     */
    notifyCalculationComplete(results) {
        // Dispatch custom event for UI updates
        const event = new CustomEvent('calculationsComplete', {
            detail: { results, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    /**
     * Get calculation statistics for debugging
     */
    getCalculationStats() {
        return {
            historyCount: this.calculationHistory.length,
            pendingCalculations: Array.from(this.pendingCalculations),
            queueLength: this.calculationQueue.length,
            isProcessing: this.isProcessing,
            recentBatches: this.calculationHistory.slice(-5)
        };
    }

    /**
     * Clear all pending calculations (emergency reset)
     */
    clearQueue() {
        console.warn('Clearing calculation queue - emergency reset');
        this.calculationQueue = [];
        this.pendingCalculations.clear();
        clearTimeout(this.calculationTimeout);
        this.isProcessing = false;
    }

    /**
     * Validate calculation order for circular dependencies
     */
    validateCalculationOrder(components) {
        try {
            return this.dependencyGraph.isAcyclic(components);
        } catch (error) {
            console.error('Error validating calculation order:', error);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalculationOrchestrator;
} else {
    window.CalculationOrchestrator = CalculationOrchestrator;
}