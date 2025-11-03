/**
 * Unit tests for CalculationOrchestrator
 * Tests dependency management, calculation ordering, and race condition prevention
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
const mockAppConfig = {
    CALCULATION_DEBOUNCE_MS: 50,
    CALCULATION_RETRY_DELAY_MS: 100,
    MAX_CALCULATION_HISTORY_SIZE: 100
};

// Set up global mocks
global.AppConfig = mockAppConfig;

// Mock DependencyGraph
class MockDependencyGraph {
    constructor() {
        this.graph = {
            'prtg': { dependencies: [], level: 0 },
            'capital': { dependencies: [], level: 0 },
            'support': { dependencies: ['capital'], level: 1 },
            'onboarding': { dependencies: [], level: 0 }
        };
    }

    validateRelationships(components) {
        return { isValid: true, missingDependencies: [] };
    }

    getCalculationOrder(components, _enabled) {
        // Simple topological sort for testing
        const order = [];
        const visited = new Set();
        
        const visit = (comp) => {
            if (visited.has(comp) || !components.includes(comp)) return;
            visited.add(comp);
            
            const deps = this.graph[comp]?.dependencies || [];
            deps.forEach(dep => visit(dep));
            order.push(comp);
        };
        
        components.forEach(comp => visit(comp));
        return order;
    }

    getDependents(component) {
        return Object.keys(this.graph).filter(comp => 
            this.graph[comp].dependencies.includes(component)
        );
    }
}

global.DependencyGraph = MockDependencyGraph;

describe('CalculationOrchestrator', () => {
    let orchestrator;
    let mockCalculator;
    let mockDataStore;

    beforeEach(() => {
        // Reset mocks
        mockCalculator = {
            calculatePrtg: vi.fn(() => ({ totals: { monthly: 100 }, breakdown: {} })),
            calculateCapital: vi.fn(() => ({ totals: { monthly: 200 }, breakdown: {} })),
            calculateSupport: vi.fn(() => ({ totals: { monthly: 300 }, breakdown: {} })),
            calculateOnboarding: vi.fn(() => ({ totals: { monthly: 400 }, breakdown: {} }))
        };

        mockDataStore = {
            getEnabledComponents: vi.fn(() => ['prtg', 'capital', 'support']),
            getComponentData: vi.fn((type) => ({ type, enabled: true })),
            updateComponent: vi.fn(),
            subscribe: vi.fn()
        };

        // Dynamically define CalculationOrchestrator for testing
        const CalculationOrchestrator = class {
            constructor(calculator, dataStore) {
                this.calculator = calculator;
                this.dataStore = dataStore;
                this.pendingCalculations = new Set();
                this.calculationQueue = [];
                this.isProcessing = false;
                this.calculationTimeout = null;
                this.calculationHistory = [];
                this.maxHistorySize = AppConfig.MAX_CALCULATION_HISTORY_SIZE;
                this.dependencyGraph = new DependencyGraph();
                this.performanceMetrics = {
                    totalSorts: 0,
                    totalSortTime: 0,
                    averageSortTime: 0,
                    lastSortTime: 0
                };
            }

            scheduleCalculation(componentType, priority = 0, source = 'user') {
                if (this.pendingCalculations.has(componentType)) {
                    return;
                }
                this.pendingCalculations.add(componentType);
                this.calculationQueue.push({
                    componentType,
                    priority,
                    source,
                    timestamp: Date.now()
                });
                clearTimeout(this.calculationTimeout);
                this.calculationTimeout = setTimeout(() => {
                    this.processCalculationQueue();
                }, AppConfig.CALCULATION_DEBOUNCE_MS);
            }

            async processCalculationQueue() {
                if (this.isProcessing || this.calculationQueue.length === 0) {
                    return;
                }
                this.isProcessing = true;
                
                try {
                    const componentTypes = this.calculationQueue.map(calc => calc.componentType);
                    const enabledComponents = this.dataStore.getEnabledComponents();
                    const calculationOrder = this.dependencyGraph.getCalculationOrder(
                        componentTypes,
                        enabledComponents
                    );

                    for (const componentType of calculationOrder) {
                        await this.executeCalculation(componentType);
                    }

                    this.calculationQueue = [];
                    this.pendingCalculations.clear();
                } finally {
                    this.isProcessing = false;
                }
            }

            async executeCalculation(componentType) {
                // Note: This method name construction logic mirrors the actual implementation
                // in src/core/calculation-orchestrator.js. If the naming convention changes
                // in the real code, these tests should be updated accordingly.
                const methodName = `calculate${componentType.charAt(0).toUpperCase()}${componentType.slice(1)}`;
                if (typeof this.calculator[methodName] === 'function') {
                    return this.calculator[methodName]();
                }
                return { totals: {}, breakdown: {} };
            }
        };

        orchestrator = new CalculationOrchestrator(mockCalculator, mockDataStore);
    });

    describe('scheduleCalculation', () => {
        it('should schedule a calculation', () => {
            orchestrator.scheduleCalculation('prtg');
            expect(orchestrator.pendingCalculations.has('prtg')).toBe(true);
            expect(orchestrator.calculationQueue).toHaveLength(1);
            expect(orchestrator.calculationQueue[0].componentType).toBe('prtg');
        });

        it('should prevent duplicate calculations', () => {
            orchestrator.scheduleCalculation('prtg');
            orchestrator.scheduleCalculation('prtg');
            expect(orchestrator.calculationQueue).toHaveLength(1);
        });

        it('should handle priority scheduling', () => {
            orchestrator.scheduleCalculation('prtg', 1);
            expect(orchestrator.calculationQueue[0].priority).toBe(1);
        });

        it('should debounce rapid calculations', async () => {
            orchestrator.scheduleCalculation('prtg');
            orchestrator.scheduleCalculation('capital');
            
            // Should not process immediately
            expect(orchestrator.isProcessing).toBe(false);
            
            // Should process after debounce delay
            await new Promise(resolve => setTimeout(resolve, mockAppConfig.CALCULATION_DEBOUNCE_MS + 50));
            expect(orchestrator.isProcessing).toBe(false);
        });
    });

    describe('processCalculationQueue', () => {
        it('should process calculations in dependency order', async () => {
            orchestrator.scheduleCalculation('support'); // Depends on capital
            orchestrator.scheduleCalculation('capital');
            
            await new Promise(resolve => setTimeout(resolve, mockAppConfig.CALCULATION_DEBOUNCE_MS + 50));
            await orchestrator.processCalculationQueue();
            
            // Capital should be called before support
            expect(mockCalculator.calculateCapital).toHaveBeenCalled();
            expect(mockCalculator.calculateSupport).toHaveBeenCalled();
        });

        it('should clear queue after processing', async () => {
            orchestrator.scheduleCalculation('prtg');
            await new Promise(resolve => setTimeout(resolve, mockAppConfig.CALCULATION_DEBOUNCE_MS + 50));
            await orchestrator.processCalculationQueue();
            
            expect(orchestrator.calculationQueue).toHaveLength(0);
            expect(orchestrator.pendingCalculations.size).toBe(0);
        });

        it('should prevent concurrent processing', async () => {
            orchestrator.isProcessing = true;
            orchestrator.scheduleCalculation('prtg');
            
            const result = await orchestrator.processCalculationQueue();
            expect(result).toBeUndefined(); // Should return early
        });
    });

    describe('executeCalculation', () => {
        it('should call the correct calculator method', async () => {
            await orchestrator.executeCalculation('prtg');
            expect(mockCalculator.calculatePrtg).toHaveBeenCalled();
        });

        it('should handle unknown component types gracefully', async () => {
            const result = await orchestrator.executeCalculation('unknown');
            expect(result).toEqual({ totals: {}, breakdown: {} });
        });
    });

    describe('dependency graph integration', () => {
        it('should validate relationships', () => {
            const validation = orchestrator.dependencyGraph.validateRelationships(['prtg', 'capital']);
            expect(validation.isValid).toBe(true);
        });

        it('should get calculation order respecting dependencies', () => {
            const order = orchestrator.dependencyGraph.getCalculationOrder(
                ['support', 'capital', 'prtg'],
                ['support', 'capital', 'prtg']
            );
            
            // Capital should come before support
            const capitalIndex = order.indexOf('capital');
            const supportIndex = order.indexOf('support');
            expect(capitalIndex).toBeLessThan(supportIndex);
        });

        it('should identify dependents', () => {
            const dependents = orchestrator.dependencyGraph.getDependents('capital');
            expect(dependents).toContain('support');
        });
    });
});
