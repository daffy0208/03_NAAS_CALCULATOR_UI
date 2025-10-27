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
        this.maxHistorySize = AppConfig.MAX_CALCULATION_HISTORY_SIZE;

        // Initialize formal dependency graph
        this.dependencyGraph = new DependencyGraph();

        // Performance tracking
        this.performanceMetrics = {
            totalSorts: 0,
            totalSortTime: 0,
            averageSortTime: 0,
            lastSortTime: 0
        };
    }

    /**
     * Schedule a component calculation with priority-based queuing
     * Prevents duplicate calculations and uses debouncing to avoid calculation storms
     *
     * @param {string} componentType - Type of component to calculate (e.g., 'prtg', 'capital')
     * @param {number} [priority=0] - Priority level (higher = more important)
     * @param {string} [source='user'] - Source of calculation request ('user', 'dependency', 'auto')
     * @returns {void}
     *
     * @example
     * orchestrator.scheduleCalculation('prtg', 1, 'user');
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
        }, AppConfig.CALCULATION_DEBOUNCE_MS);
    }

    /**
     * Process the calculation queue in dependency order
     * Uses topological sorting to ensure dependencies are calculated first
     * Validates relationships and handles errors gracefully
     *
     * @async
     * @returns {Promise<void>}
     * @throws {Error} If dependency validation fails
     *
     * @description
     * - Validates all component dependencies before processing
     * - Sorts calculations using topological order from dependency graph
     * - Falls back to priority and timestamp for non-dependent components
     * - Records calculation history for debugging
     * - Notifies UI via custom event when complete
     */
    async processCalculationQueue() {
        if (this.isProcessing) {
            console.log('Calculation queue already processing, scheduling retry');
            // If already processing, schedule another attempt
            setTimeout(() => this.processCalculationQueue(), AppConfig.CALCULATION_RETRY_DELAY_MS);
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
            const sortStartTime = performance.now();
            const sortedOrder = this.dependencyGraph.getCalculationOrder(enabledComponents);

            // Create Map for O(1) index lookups instead of O(n) indexOf
            const orderMap = new Map();
            sortedOrder.forEach((componentType, index) => {
                orderMap.set(componentType, index);
            });

            // Sort calculations by dependency order, then by priority
            const sortedCalculations = this.calculationQueue.sort((a, b) => {
                const aIndex = orderMap.get(a.componentType);
                const bIndex = orderMap.get(b.componentType);

                // If both components are in the sorted order, use that order
                if (aIndex !== undefined && bIndex !== undefined) {
                    return aIndex - bIndex;
                }

                // Fallback to priority and timestamp
                const priorityDiff = b.priority - a.priority;
                if (priorityDiff !== 0) return priorityDiff;

                return a.timestamp - b.timestamp;
            });

            // Track sort performance
            const sortEndTime = performance.now();
            this.performanceMetrics.lastSortTime = sortEndTime - sortStartTime;
            this.performanceMetrics.totalSorts++;
            this.performanceMetrics.totalSortTime += this.performanceMetrics.lastSortTime;
            this.performanceMetrics.averageSortTime = this.performanceMetrics.totalSortTime / this.performanceMetrics.totalSorts;

            console.log(`Dependency sort completed in ${this.performanceMetrics.lastSortTime.toFixed(2)}ms (avg: ${this.performanceMetrics.averageSortTime.toFixed(2)}ms)`);


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
                setTimeout(() => this.processCalculationQueue(), AppConfig.CALCULATION_QUEUE_CHECK_MS);
            }
        }
    }

    /**
     * Execute individual component calculation with context injection
     * Routes to appropriate calculator method based on component type
     *
     * @async
     * @param {string} componentType - Type of component to calculate
     * @returns {Promise<Object>} Calculation result with totals and breakdown
     * @returns {Object} result.totals - Monthly, annual, 3-year, and one-time totals
     * @returns {Object} result.breakdown - Detailed cost breakdown
     * @returns {Object} [result.metadata] - Additional calculation metadata
     * @throws {Error} If component type is unknown
     *
     * @example
     * const result = await executeCalculation('prtg');
     * // Returns: { totals: { monthly: 100, annual: 1200, ... }, breakdown: {...} }
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
     * @param {string} componentType - The component type to build context for
     * @returns {Object} Context object with dependencies injected
     */
    buildCalculationContext(componentType) {
        const context = {
            timestamp: Date.now(),
            enabledComponents: this.dataStore.getEnabledComponents(),
            globalTotals: { monthly: 0, annual: 0, threeYear: 0, oneTime: 0 }
        };

        try {
            // Inject specific dependencies using dependency graph
            const deps = this.dependencyGraph.getDependencies(componentType);

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
        } catch (error) {
            console.warn(`Unable to get dependencies for ${componentType}:`, error.message);
            // Continue with basic context even if dependencies can't be resolved
        }

        return context;
    }

    /**
     * Extract device count from capital equipment data
     * Used to calculate device-dependent pricing (e.g., support costs)
     *
     * @param {Object} capitalData - Capital equipment component data
     * @param {Object} capitalData.params - Component parameters
     * @param {Array} capitalData.params.equipment - Array of equipment items
     * @param {number} capitalData.params.equipment[].quantity - Quantity of each item
     * @returns {number} Total device count, defaults to 10 if no data available
     *
     * @example
     * const count = extractDeviceCount(capitalData);
     * // Returns sum of all equipment quantities
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
     * Automatically triggered when a component calculation completes
     * Only schedules enabled dependent components
     *
     * @param {string} changedComponent - Component that just completed calculation
     * @returns {void}
     *
     * @example
     * // When capital equipment changes, support costs need recalculation
     * scheduleDependentCalculations('capital');
     * // This will schedule 'support' if it's enabled
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
     * Level 0 = no dependencies, higher levels depend on lower levels
     *
     * @param {string} componentType - Component type to check
     * @returns {number} Dependency level (0-4), or 999 if unknown
     *
     * @description Dependency levels:
     * - Level 0: Independent (help, assessment, admin, otherCosts)
     * - Level 1: Base infrastructure (prtg, capital, onboarding, pbsFoundation)
     * - Level 2: Services (support depends on capital)
     * - Level 3: Enhanced services (enhancedSupport, naasStandard, naasEnhanced)
     * - Level 4: Contract pricing (dynamics depends on all active components)
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
     * Maintains rolling history with configurable size limit
     *
     * @param {Array<Object>} calculations - Array of calculation objects
     * @param {string} calculations[].componentType - Type of component
     * @param {number} calculations[].priority - Calculation priority
     * @param {string} calculations[].source - Source of calculation
     * @param {Object} results - Calculation results by component type
     * @param {number} duration - Total batch processing time in milliseconds
     * @returns {void}
     *
     * @example
     * recordCalculationBatch(
     *   [{ componentType: 'prtg', priority: 1, source: 'user' }],
     *   { prtg: { totals: {...} } },
     *   45
     * );
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
     * Dispatches 'calculationsComplete' custom event on document
     *
     * @param {Object} results - Calculation results by component type
     * @param {Object} results[componentType] - Result for each component
     * @param {Object} results[componentType].totals - Cost totals
     * @param {Object} results[componentType].breakdown - Cost breakdown
     * @returns {void}
     *
     * @fires document#calculationsComplete
     *
     * @example
     * // Listen for completion in UI code:
     * document.addEventListener('calculationsComplete', (e) => {
     *   console.log('Results:', e.detail.results);
     * });
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
     * Provides insight into calculation queue state and history
     *
     * @returns {Object} Statistics object
     * @returns {number} return.historyCount - Total calculations in history
     * @returns {Array<string>} return.pendingCalculations - Components waiting for calculation
     * @returns {number} return.queueLength - Number of items in queue
     * @returns {boolean} return.isProcessing - Whether queue is currently processing
     * @returns {Array<Object>} return.recentBatches - Last 5 calculation batches
     *
     * @example
     * const stats = orchestrator.getCalculationStats();
     * console.log(`Queue length: ${stats.queueLength}, Processing: ${stats.isProcessing}`);
     */
    getCalculationStats() {
        return {
            historyCount: this.calculationHistory.length,
            pendingCalculations: Array.from(this.pendingCalculations),
            performanceMetrics: { ...this.performanceMetrics },
            queueLength: this.calculationQueue.length,
            isProcessing: this.isProcessing,
            recentBatches: this.calculationHistory.slice(-5)
        };
    }

    /**
     * Clear all pending calculations (emergency reset)
     * Use this when the calculation system gets stuck or errors accumulate
     *
     * @returns {void}
     *
     * @warning This clears all pending calculations without processing them
     * @example
     * // Emergency reset if calculations are stuck
     * orchestrator.clearQueue();
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
     * Checks if the dependency graph is acyclic (no circular dependencies)
     *
     * @param {Object} components - Components to validate
     * @param {string[]} components.keys - Component type names
     * @returns {boolean} True if valid (no circular dependencies), false otherwise
     *
     * @example
     * const isValid = orchestrator.validateCalculationOrder(enabledComponents);
     * if (!isValid) {
     *   console.error('Circular dependency detected!');
     * }
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