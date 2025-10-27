/**
 * NaaS Pricing Calculator - Dependency Graph Manager
 * Manages component dependencies and provides topological sorting
 */

class DependencyGraph {
    constructor() {
        // Define the complete dependency graph
        this.graph = {
            // Level 0: Independent components (no dependencies)
            'help': {
                dependencies: [],
                level: 0,
                category: 'documentation',
                description: 'User guide and calculator instructions'
            },
            'assessment': {
                dependencies: [],
                level: 0,
                category: 'services',
                description: 'Network assessment and discovery'
            },
            'admin': {
                dependencies: [],
                level: 0,
                category: 'services',
                description: 'Administrative and review services'
            },
            'otherCosts': {
                dependencies: [],
                level: 0,
                category: 'flexible',
                description: 'Additional costs and custom services'
            },

            // Level 1: Base infrastructure and core services
            'prtg': {
                dependencies: [],
                level: 1,
                category: 'monitoring',
                description: 'PRTG network monitoring setup and licensing',
                provides: ['sensorCount', 'monitoringLocations']
            },
            'capital': {
                dependencies: [],
                level: 1,
                category: 'infrastructure',
                description: 'Capital equipment and hardware costs',
                provides: ['deviceCount', 'equipmentList', 'totalCapitalCost']
            },
            'onboarding': {
                dependencies: [],
                level: 1,
                category: 'services',
                description: 'Initial setup and implementation services',
                provides: ['implementationCost', 'setupComplexity']
            },
            'pbsFoundation': {
                dependencies: [],
                level: 1,
                category: 'platform',
                description: 'PBS foundation platform services',
                provides: ['platformCost', 'userLicenses']
            },

            // Level 2: Services that depend on base infrastructure
            'support': {
                dependencies: ['capital'],
                level: 2,
                category: 'services',
                description: '24/7 support and maintenance services',
                requires: {
                    'capital': ['deviceCount']
                },
                provides: ['supportLevel', 'supportCoverage']
            },

            // Level 3: Enhanced services that build on support
            'enhancedSupport': {
                dependencies: ['support'],
                level: 3,
                category: 'services',
                description: 'Premium support and monitoring services',
                requires: {
                    'support': ['supportLevel']
                },
                provides: ['enhancedSLA', 'premiumFeatures']
            },

            // Level 3: Package services with multiple dependencies
            'naasStandard': {
                dependencies: ['prtg', 'support'],
                level: 3,
                category: 'packages',
                description: 'Standard NaaS service package',
                requires: {
                    'prtg': ['sensorCount'],
                    'support': ['supportLevel', 'deviceCount']
                },
                provides: ['standardPackageFeatures']
            },
            'naasEnhanced': {
                dependencies: ['naasStandard', 'enhancedSupport'],
                level: 3,
                category: 'packages',
                description: 'Enhanced NaaS service package',
                requires: {
                    'naasStandard': ['standardPackageFeatures'],
                    'enhancedSupport': ['enhancedSLA']
                },
                provides: ['enhancedPackageFeatures']
            },

            // Level 4: Dynamic pricing models (depend on all active components)
            'dynamics1Year': {
                dependencies: ['*'], // Special marker for "all active components"
                level: 4,
                category: 'contracts',
                description: '1-year dynamic pricing options',
                requires: {
                    '*': ['monthlyTotal', 'componentCount']
                }
            },
            'dynamics3Year': {
                dependencies: ['*'],
                level: 4,
                category: 'contracts',
                description: '3-year dynamic pricing options',
                requires: {
                    '*': ['monthlyTotal', 'componentCount', 'annualTotal']
                }
            },
            'dynamics5Year': {
                dependencies: ['*'],
                level: 4,
                category: 'contracts',
                description: '5-year dynamic pricing options',
                requires: {
                    '*': ['monthlyTotal', 'componentCount', 'annualTotal']
                }
            }
        };

        // Validation cache
        this.validationCache = new Map();
    }

    /**
     * Get all dependencies for a component
     */
    getDependencies(componentType) {
        const component = this.graph[componentType];
        if (!component) {
            throw new Error(`Unknown component type: ${componentType}`);
        }
        return [...component.dependencies];
    }

    /**
     * Get the dependency level of a component
     */
    getLevel(componentType) {
        const component = this.graph[componentType];
        if (!component) {
            throw new Error(`Unknown component type: ${componentType}`);
        }
        return component.level;
    }

    /**
     * Get all components that depend on a given component
     */
    getDependents(componentType) {
        const dependents = [];

        for (const [type, component] of Object.entries(this.graph)) {
            // Use Set for O(1) lookups instead of O(n) includes
            const depSet = new Set(component.dependencies);
            if (depSet.has(componentType) ||
                (depSet.has('*') && componentType !== type)) {
                dependents.push(type);
            }
        }

        return dependents;
    }

    /**
     * Perform topological sort on a set of components
     */
    topologicalSort(componentTypes) {
        const visited = new Set();
        const recursionStack = new Set();
        const result = [];

        // Create Set for O(1) lookups instead of O(n) includes
        const componentSet = new Set(componentTypes);

        // Validate for circular dependencies first
        if (!this.isAcyclic(componentTypes)) {
            throw new Error('Circular dependency detected');
        }

        const visit = (componentType) => {
            if (recursionStack.has(componentType)) {
                throw new Error(`Circular dependency detected involving ${componentType}`);
            }

            if (visited.has(componentType)) {
                return;
            }

            visited.add(componentType);
            recursionStack.add(componentType);

            // Visit dependencies first
            const dependencies = this.getDependencies(componentType);
            for (const dep of dependencies) {
                if (dep === '*') {
                    // Handle wildcard dependencies (all other active components)
                    const allOthers = componentTypes.filter(t => t !== componentType);
                    allOthers.forEach(other => visit(other));
                } else if (componentSet.has(dep)) {
                    visit(dep);
                }
            }

            recursionStack.delete(componentType);
            result.push(componentType);
        };

        // Sort by level first for stability
        const sortedByLevel = componentTypes.sort((a, b) => {
            return this.getLevel(a) - this.getLevel(b);
        });

        for (const componentType of sortedByLevel) {
            visit(componentType);
        }

        return result;
    }

    /**
     * Check if the graph is acyclic for given components
     */
    isAcyclic(componentTypes) {
        const cacheKey = componentTypes.sort().join(',');
        if (this.validationCache.has(cacheKey)) {
            return this.validationCache.get(cacheKey);
        }

        const visited = new Set();
        const recursionStack = new Set();

        // Create Set for O(1) lookups instead of O(n) includes
        const componentSet = new Set(componentTypes);

        const hasCycle = (componentType) => {
            if (recursionStack.has(componentType)) {
                return true;
            }
            if (visited.has(componentType)) {
                return false;
            }

            visited.add(componentType);
            recursionStack.add(componentType);

            const dependencies = this.getDependencies(componentType);
            for (const dep of dependencies) {
                if (dep === '*') {
                    // Check all other components for cycles
                    const allOthers = componentTypes.filter(t => t !== componentType);
                    for (const other of allOthers) {
                        if (hasCycle(other)) {
                            return true;
                        }
                    }
                } else if (componentSet.has(dep) && hasCycle(dep)) {
                    return true;
                }
            }

            recursionStack.delete(componentType);
            return false;
        };

        for (const componentType of componentTypes) {
            if (hasCycle(componentType)) {
                this.validationCache.set(cacheKey, false);
                return false;
            }
        }

        this.validationCache.set(cacheKey, true);
        return true;
    }

    /**
     * Get calculation order for a set of enabled components
     */
    getCalculationOrder(enabledComponents) {
        const componentTypes = Object.keys(enabledComponents).filter(
            type => enabledComponents[type] && enabledComponents[type].enabled
        );

        if (componentTypes.length === 0) {
            return [];
        }

        try {
            return this.topologicalSort(componentTypes);
        } catch (error) {
            console.error('Error in topological sort:', error);
            // Fallback to level-based sorting
            return this.levelBasedSort(componentTypes);
        }
    }

    /**
     * Fallback sorting by dependency level
     */
    levelBasedSort(componentTypes) {
        return componentTypes.sort((a, b) => {
            const levelDiff = this.getLevel(a) - this.getLevel(b);
            if (levelDiff !== 0) return levelDiff;

            // Secondary sort by name for stability
            return a.localeCompare(b);
        });
    }

    /**
     * Validate component relationships
     */
    validateRelationships(components) {
        const errors = [];
        const warnings = [];

        for (const [componentType, componentData] of Object.entries(components)) {
            if (!componentData.enabled) continue;

            const component = this.graph[componentType];
            if (!component) {
                errors.push(`Unknown component type: ${componentType}`);
                continue;
            }

            // Check if all dependencies are enabled
            for (const dependency of component.dependencies) {
                if (dependency === '*') {
                    // Wildcard dependency - at least one other component should be enabled
                    const otherEnabled = Object.keys(components).some(
                        type => type !== componentType &&
                                components[type] &&
                                components[type].enabled
                    );
                    if (!otherEnabled) {
                        warnings.push(`${componentType} requires other components to be enabled`);
                    }
                } else if (!components[dependency] || !components[dependency].enabled) {
                    errors.push(`${componentType} requires ${dependency} to be enabled`);
                }
            }

            // Validate required data availability
            if (component.requires) {
                for (const [reqComponent, reqFields] of Object.entries(component.requires)) {
                    if (reqComponent === '*') continue; // Skip wildcard for now

                    if (!components[reqComponent] || !components[reqComponent].enabled) {
                        continue; // Already caught above
                    }

                    const reqComponentData = components[reqComponent];
                    for (const field of reqFields) {
                        if (!this.hasRequiredField(reqComponentData, field)) {
                            warnings.push(
                                `${componentType} expects ${field} from ${reqComponent} but it may not be available`
                            );
                        }
                    }
                }
            }
        }

        return { errors, warnings };
    }

    /**
     * Check if component data has a required field
     */
    hasRequiredField(componentData, fieldName) {
        // This is a heuristic check - in practice you'd check actual calculation results
        if (componentData.params && componentData.params[fieldName] !== undefined) {
            return true;
        }

        // Check common field mappings
        const fieldMappings = {
            'deviceCount': ['deviceCount', 'devices', 'equipment'],
            'sensorCount': ['sensors', 'sensorCount'],
            'supportLevel': ['level', 'tier', 'supportLevel']
        };

        const possibleFields = fieldMappings[fieldName] || [fieldName];
        return possibleFields.some(field =>
            componentData.params && componentData.params[field] !== undefined
        );
    }

    /**
     * Generate visualization data for the dependency graph
     */
    generateVisualizationData(enabledComponents = null) {
        const nodes = [];
        const edges = [];
        const componentTypes = enabledComponents ?
            Object.keys(enabledComponents).filter(type => enabledComponents[type]?.enabled) :
            Object.keys(this.graph);

        // Generate nodes
        for (const componentType of componentTypes) {
            const component = this.graph[componentType];
            nodes.push({
                id: componentType,
                label: this.getDisplayName(componentType),
                level: component.level,
                category: component.category,
                description: component.description,
                enabled: enabledComponents ?
                    (enabledComponents[componentType]?.enabled || false) : true
            });
        }

        // Generate edges
        const componentTypeSet = new Set(componentTypes);
        for (const componentType of componentTypes) {
            const component = this.graph[componentType];
            for (const dependency of component.dependencies) {
                if (dependency === '*') {
                    // Create edges to all other enabled components
                    componentTypes
                        .filter(type => type !== componentType)
                        .forEach(target => {
                            edges.push({
                                from: target,
                                to: componentType,
                                type: 'wildcard'
                            });
                        });
                } else if (componentTypeSet.has(dependency)) {
                    edges.push({
                        from: dependency,
                        to: componentType,
                        type: 'direct'
                    });
                }
            }
        }

        return { nodes, edges };
    }

    /**
     * Get display name for component
     */
    getDisplayName(componentType) {
        const displayNames = {
            'help': 'Help & Instructions',
            'prtg': 'PRTG Monitoring',
            'capital': 'Capital Equipment',
            'support': 'Support Services',
            'onboarding': 'Onboarding',
            'pbsFoundation': 'PBS Foundation',
            'assessment': 'Platform Assessment',
            'admin': 'Admin Services',
            'otherCosts': 'Other Costs',
            'enhancedSupport': 'Enhanced Support',
            'dynamics1Year': 'Dynamics 1 Year',
            'dynamics3Year': 'Dynamics 3 Year',
            'dynamics5Year': 'Dynamics 5 Year',
            'naasStandard': 'NaaS Standard',
            'naasEnhanced': 'NaaS Enhanced'
        };

        return displayNames[componentType] || componentType;
    }

    /**
     * Generate Mermaid diagram syntax
     */
    generateMermaidDiagram(enabledComponents = null) {
        const visualization = this.generateVisualizationData(enabledComponents);
        let mermaid = 'graph TD\n';

        // Add style classes
        mermaid += '    classDef level0 fill:#e1f5fe\n';
        mermaid += '    classDef level1 fill:#f3e5f5\n';
        mermaid += '    classDef level2 fill:#e8f5e8\n';
        mermaid += '    classDef level3 fill:#fff3e0\n';
        mermaid += '    classDef level4 fill:#fce4ec\n';
        mermaid += '\n';

        // Add nodes
        for (const node of visualization.nodes) {
            const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
            mermaid += `    ${nodeId}["${node.label}"]\n`;
            mermaid += `    ${nodeId} --> class:level${node.level}\n`;
        }

        mermaid += '\n';

        // Add edges
        for (const edge of visualization.edges) {
            const fromId = edge.from.replace(/[^a-zA-Z0-9]/g, '_');
            const toId = edge.to.replace(/[^a-zA-Z0-9]/g, '_');
            const edgeStyle = edge.type === 'wildcard' ? '-.->|depends on all|' : '-->';
            mermaid += `    ${fromId} ${edgeStyle} ${toId}\n`;
        }

        return mermaid;
    }

    /**
     * Get dependency statistics
     */
    getStatistics() {
        const components = Object.keys(this.graph);
        const levels = {};
        const categories = {};

        for (const [componentType, component] of Object.entries(this.graph)) {
            // Count by level
            const level = `Level ${component.level}`;
            levels[level] = (levels[level] || 0) + 1;

            // Count by category
            categories[component.category] = (categories[component.category] || 0) + 1;
        }

        const totalEdges = Object.values(this.graph)
            .reduce((sum, component) => sum + component.dependencies.length, 0);

        return {
            totalComponents: components.length,
            totalEdges,
            levelDistribution: levels,
            categoryDistribution: categories,
            maxLevel: Math.max(...Object.values(this.graph).map(c => c.level)),
            circularDependencies: this.findCircularDependencies()
        };
    }

    /**
     * Find any circular dependencies in the graph
     */
    findCircularDependencies() {
        const allComponents = Object.keys(this.graph);
        const cycles = [];

        try {
            this.topologicalSort(allComponents);
        } catch (error) {
            if (error.message.includes('Circular dependency')) {
                cycles.push(error.message);
            }
        }

        return cycles;
    }

    /**
     * Export graph definition for external use
     */
    exportGraph() {
        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            graph: this.graph,
            statistics: this.getStatistics()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DependencyGraph;
} else {
    window.DependencyGraph = DependencyGraph;
}