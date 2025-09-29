/**
 * NaaS Pricing Calculator - Calculation Engine
 * Implements all financial calculations from the Excel spreadsheet
 */

class NaaSCalculator {
    constructor() {
        // Configuration constants based on Excel spreadsheet
        this.config = {
            // Financial rates
            APR_RATE: 0.05, // 5% Annual Percentage Rate for capital equipment
            CPI_RATE: 0.03, // 3% Consumer Price Index for support cost escalation
            MONTHS_PER_YEAR: 12,
            
            // Default contract terms
            DEFAULT_TERM_MONTHS: 36,
            
            // Component defaults
            defaults: {
                prtg: {
                    sensors: 100,
                    locations: 5,
                    alertRecipients: 10,
                    serviceLevel: 'enhanced'
                },
                capital: {
                    equipmentList: [],
                    financing: true,
                    termMonths: 36
                },
                support: {
                    level: 'enhanced',
                    hours: '24x7',
                    escalation: true
                },
                onboarding: {
                    complexity: 'standard',
                    sites: 1,
                    assessment: true
                }
            }
        };

        // Component pricing data (replicated from Excel sheets)
        this.pricingData = {
            prtg: {
                baseLicense: {
                    up_to_100: 2340,
                    up_to_500: 5850,
                    up_to_1000: 11700,
                    up_to_2500: 23400,
                    unlimited: 46800
                },
                setupCosts: {
                    standard: 1500,
                    enhanced: 2500,
                    enterprise: 4000
                },
                monthlyService: {
                    standard: {
                        up_to_100: 250,
                        up_to_500: 450,
                        up_to_1000: 750,
                        up_to_2500: 1200,
                        unlimited: 2000
                    },
                    enhanced: {
                        up_to_100: 450,
                        up_to_500: 750,
                        up_to_1000: 1200,
                        up_to_2500: 1800,
                        unlimited: 3000
                    }
                }
            },
            capital: {
                equipmentTypes: {
                    'router_small': { cost: 2500, category: 'Router' },
                    'router_medium': { cost: 8500, category: 'Router' },
                    'router_large': { cost: 18500, category: 'Router' },
                    'switch_24port': { cost: 1200, category: 'Switch' },
                    'switch_48port': { cost: 2400, category: 'Switch' },
                    'firewall_small': { cost: 3500, category: 'Firewall' },
                    'firewall_medium': { cost: 12000, category: 'Firewall' },
                    'firewall_large': { cost: 25000, category: 'Firewall' },
                    'wireless_ap': { cost: 450, category: 'Wireless' },
                    'wireless_controller': { cost: 2800, category: 'Wireless' }
                }
            },
            support: {
                hourlyRates: {
                    l1_support: 85,
                    l2_support: 125,
                    l3_support: 185,
                    engineer: 225
                },
                packages: {
                    basic: {
                        hours: '8x5',
                        monthlyBase: 500,
                        perDeviceMonthly: 25
                    },
                    standard: {
                        hours: '12x5',
                        monthlyBase: 750,
                        perDeviceMonthly: 35
                    },
                    enhanced: {
                        hours: '24x7',
                        monthlyBase: 1200,
                        perDeviceMonthly: 50
                    }
                }
            },
            onboarding: {
                baseImplementation: {
                    simple: 2500,
                    standard: 4500,
                    complex: 8500,
                    enterprise: 15000
                },
                assessment: {
                    network: 1500,
                    security: 2000,
                    comprehensive: 3500
                },
                perSite: {
                    simple: 500,
                    standard: 1000,
                    complex: 2000
                }
            },
            pbsFoundation: {
                baseMonthly: 200,
                perUserMonthly: 25,
                perLocationMonthly: 100,
                features: {
                    'advanced_reporting': 150,
                    'api_access': 100,
                    'sso_integration': 200,
                    'custom_branding': 75,
                    'multi_tenant': 300,
                    'advanced_analytics': 125
                }
            },
            assessment: {
                baseCosts: {
                    simple: 2500,
                    standard: 4500,
                    complex: 8500,
                    enterprise: 15000
                },
                deviceMultiplier: {
                    base: 10,
                    factor: 1.0
                },
                reportCost: 500
            },
            admin: {
                reviewCosts: {
                    annual: 650,
                    quarterly: 650,
                    biAnnual: 650
                },
                technicalRates: {
                    technicalDay: 1250,
                    l3EngineeringDay: 950
                },
                serviceCosts: {
                    reportingService: 450,
                    backupService: 50
                }
            },
            enhancedSupport: {
                baseCosts: {
                    enhanced: 1200,
                    premium: 2000,
                    enterprise: 3500
                },
                perDeviceCost: 50,
                escalationRate: 0.03
            },
            naas: {
                baseCosts: {
                    standard: 800,
                    enhanced: 1200
                },
                perDeviceCost: 40,
                escalationRate: 0.03
            }
        };
    }

    /**
     * Calculate PRTG Monitoring costs
     */
    calculatePRTG(params) {
        try {
            // Input validation
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters provided to calculatePRTG');
            }

            const {
                sensors = this.config.defaults.prtg.sensors,
                locations = this.config.defaults.prtg.locations,
                alertRecipients = this.config.defaults.prtg.alertRecipients,
                serviceLevel = this.config.defaults.prtg.serviceLevel
            } = params;

            // Validate inputs
            if (typeof sensors !== 'number' || sensors < 1) {
                throw new Error('Sensors must be a positive number');
            }
            if (typeof locations !== 'number' || locations < 1) {
                throw new Error('Locations must be a positive number');
            }
            if (typeof alertRecipients !== 'number' || alertRecipients < 1) {
                throw new Error('Alert recipients must be a positive number');
            }
            if (!['standard', 'enhanced', 'enterprise'].includes(serviceLevel)) {
                throw new Error('Invalid service level. Must be standard, enhanced, or enterprise');
            }

        // Determine sensor tier
        let sensorTier;
        if (sensors <= 100) sensorTier = 'up_to_100';
        else if (sensors <= 500) sensorTier = 'up_to_500';
        else if (sensors <= 1000) sensorTier = 'up_to_1000';
        else if (sensors <= 2500) sensorTier = 'up_to_2500';
        else sensorTier = 'unlimited';

        // Calculate costs
        const licenseCost = this.pricingData.prtg.baseLicense[sensorTier];
        const setupCost = this.pricingData.prtg.setupCosts[serviceLevel] || this.pricingData.prtg.setupCosts.standard;
        const monthlyService = this.pricingData.prtg.monthlyService[serviceLevel][sensorTier];

        // Additional costs based on complexity
        const locationMultiplier = Math.max(1, locations / 5);
        const alertMultiplier = Math.max(1, alertRecipients / 10);
        
        const totalMonthlyService = Math.round(monthlyService * locationMultiplier * alertMultiplier);
        const annualLicense = licenseCost;
        const oneTimeSetup = setupCost;

        return {
            breakdown: {
                annualLicense,
                oneTimeSetup,
                monthlyService: totalMonthlyService
            },
            totals: {
                oneTime: oneTimeSetup,
                monthly: totalMonthlyService + Math.round(annualLicense / 12),
                annual: annualLicense + (totalMonthlyService * 12),
                threeYear: (annualLicense * 3) + (totalMonthlyService * 36) + oneTimeSetup
            },
            metadata: {
                sensorTier,
                sensors,
                locations,
                serviceLevel
            }
        };
        } catch (error) {
            console.error('Error in calculatePRTG:', error);
            return {
                error: error.message,
                totals: { monthly: 0, annual: 0, threeYear: 0, oneTime: 0 },
                breakdown: { error: true }
            };
        }
    }

    /**
     * Calculate Capital Equipment costs with financing
     */
    calculateCapital(params) {
        try {
            // Input validation
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid parameters provided to calculateCapital');
            }

            const {
                equipment = [],
                financing = true,
                termMonths = this.config.DEFAULT_TERM_MONTHS,
                downPayment = 0
            } = params;

            // Validate inputs
            if (!Array.isArray(equipment)) {
                throw new Error('Equipment must be an array');
            }
            if (typeof financing !== 'boolean') {
                throw new Error('Financing must be a boolean value');
            }
            if (typeof termMonths !== 'number' || termMonths < 1) {
                throw new Error('Term months must be a positive number');
            }
            if (typeof downPayment !== 'number' || downPayment < 0) {
                throw new Error('Down payment must be a non-negative number');
            }

        let totalEquipmentCost = 0;
        const equipmentBreakdown = [];

        // Calculate total equipment cost
        equipment.forEach(item => {
            const { description, quantity = 1, unitCost = 0 } = item;
            const totalCost = unitCost * quantity;
            
            totalEquipmentCost += totalCost;
            equipmentBreakdown.push({
                description,
                quantity,
                unitCost,
                totalCost,
                category: 'Custom Equipment'
            });
        });

        if (totalEquipmentCost === 0) {
            return {
                breakdown: equipmentBreakdown,
                totals: { oneTime: 0, monthly: 0, annual: 0, threeYear: 0 },
                financing: null
            };
        }

        let financingDetails = null;
        let monthlyPayment = 0;

        if (financing && totalEquipmentCost > downPayment) {
            const loanAmount = totalEquipmentCost - downPayment;
            const monthlyRate = this.config.APR_RATE / this.config.MONTHS_PER_YEAR;
            
            // PMT function equivalent: PMT(rate, nper, pv)
            if (monthlyRate > 0) {
                monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                               (Math.pow(1 + monthlyRate, termMonths) - 1);
            } else {
                monthlyPayment = loanAmount / termMonths;
            }

            financingDetails = {
                loanAmount,
                termMonths,
                apr: this.config.APR_RATE,
                monthlyPayment: Math.round(monthlyPayment),
                totalInterest: Math.round((monthlyPayment * termMonths) - loanAmount),
                totalPayments: Math.round(monthlyPayment * termMonths)
            };
        }

        return {
            breakdown: equipmentBreakdown,
            totals: {
                oneTime: financing ? downPayment : totalEquipmentCost,
                monthly: Math.round(monthlyPayment),
                annual: Math.round(monthlyPayment * 12),
                threeYear: financing ? 
                    Math.round(downPayment + (monthlyPayment * Math.min(36, termMonths))) : 
                    totalEquipmentCost
            },
            financing: financingDetails,
            metadata: {
                totalEquipmentCost,
                financing,
                termMonths
            }
        };
        } catch (error) {
            console.error('Error in calculateCapital:', error);
            return {
                error: error.message,
                totals: { monthly: 0, annual: 0, threeYear: 0, oneTime: 0 },
                breakdown: { error: true }
            };
        }
    }

    /**
     * Calculate Support Services costs with CPI escalation
     */
    calculateSupport(params) {
        const {
            level = 'enhanced',
            deviceCount = 10,
            customHours = null,
            includeEscalation = true,
            termMonths = this.config.DEFAULT_TERM_MONTHS
        } = params;

        const supportPackage = this.pricingData.support.packages[level] || this.pricingData.support.packages.standard;
        
        const baseMonthly = supportPackage.monthlyBase;
        const deviceMonthly = supportPackage.perDeviceMonthly * deviceCount;
        const totalMonthly = baseMonthly + deviceMonthly;

        let escalatedCosts = [];
        let totalWithEscalation = 0;

        if (includeEscalation) {
            // Calculate costs with CPI escalation over term
            for (let year = 1; year <= Math.ceil(termMonths / 12); year++) {
                const yearlyRate = totalMonthly * Math.pow(1 + this.config.CPI_RATE, year - 1);
                const monthsInYear = Math.min(12, termMonths - ((year - 1) * 12));
                const yearCost = yearlyRate * monthsInYear;
                
                escalatedCosts.push({
                    year,
                    monthlyRate: Math.round(yearlyRate),
                    months: monthsInYear,
                    totalCost: Math.round(yearCost)
                });
                
                totalWithEscalation += yearCost;
            }
        }

        return {
            breakdown: {
                baseMonthly,
                deviceMonthly,
                deviceCount,
                totalMonthly
            },
            escalation: includeEscalation ? escalatedCosts : null,
            totals: {
                oneTime: 0,
                monthly: totalMonthly,
                annual: totalMonthly * 12,
                threeYear: includeEscalation ? Math.round(totalWithEscalation) : totalMonthly * termMonths
            },
            metadata: {
                level,
                hours: supportPackage.hours,
                deviceCount,
                includeEscalation
            }
        };
    }

    /**
     * Calculate Onboarding costs
     */
    calculateOnboarding(params) {
        const {
            complexity = 'standard',
            sites = 1,
            includeAssessment = true,
            assessmentType = 'comprehensive',
            customServices = []
        } = params;

        const baseImplementation = this.pricingData.onboarding.baseImplementation[complexity] || 
                                 this.pricingData.onboarding.baseImplementation.standard;
        
        const perSiteCost = this.pricingData.onboarding.perSite[complexity] || 
                           this.pricingData.onboarding.perSite.standard;
        
        const additionalSites = Math.max(0, sites - 1);
        const sitesCost = additionalSites * perSiteCost;
        
        const assessmentCost = includeAssessment ? 
            (this.pricingData.onboarding.assessment[assessmentType] || 0) : 0;

        let customServicesCost = 0;
        customServices.forEach(service => {
            customServicesCost += service.cost || 0;
        });

        const totalCost = baseImplementation + sitesCost + assessmentCost + customServicesCost;

        return {
            breakdown: {
                baseImplementation,
                additionalSites,
                sitesCost,
                assessment: assessmentCost,
                customServices: customServicesCost
            },
            totals: {
                oneTime: totalCost,
                monthly: 0,
                annual: 0,
                threeYear: totalCost
            },
            metadata: {
                complexity,
                sites,
                includeAssessment,
                assessmentType
            }
        };
    }

    /**
     * Calculate PBS Foundation costs
     */
    calculatePBSFoundation(params) {
        const {
            users = 10,
            locations = 1,
            features = ['basic']
        } = params;

        const baseMonthly = this.pricingData.pbsFoundation.baseMonthly;
        const perUserMonthly = this.pricingData.pbsFoundation.perUserMonthly;
        const perLocationMonthly = this.pricingData.pbsFoundation.perLocationMonthly;
        
        let featuresCost = 0;
        features.forEach(feature => {
            featuresCost += this.pricingData.pbsFoundation.features[feature] || 0;
        });

        const totalMonthly = baseMonthly + (perUserMonthly * users) + 
                           (perLocationMonthly * (locations - 1)) + featuresCost;

        return {
            breakdown: {
                baseMonthly,
                userCost: perUserMonthly * users,
                locationCost: perLocationMonthly * (locations - 1),
                featuresCost
            },
            totals: {
                oneTime: 0,
                monthly: totalMonthly,
                annual: totalMonthly * 12,
                threeYear: totalMonthly * 36
            },
            metadata: {
                users,
                locations,
                features
            }
        };
    }

    /**
     * Calculate combined quote with discounts
     */
    calculateCombinedQuote(components) {
        const results = {};
        let totalOneTime = 0;
        let totalMonthly = 0;
        let totalAnnual = 0;
        let totalThreeYear = 0;

        // Calculate each component
        Object.keys(components).forEach(componentType => {
            if (components[componentType] && components[componentType].enabled) {
                const params = components[componentType].params || {};
                
                switch (componentType) {
                    case 'help':
                        results[componentType] = { totals: { monthly: 0, annual: 0, threeYear: 0, oneTime: 0 } };
                        break;
                    case 'prtg':
                        results[componentType] = this.calculatePRTG(params);
                        break;
                    case 'capital':
                        results[componentType] = this.calculateCapital(params);
                        break;
                    case 'support':
                        results[componentType] = this.calculateSupport(params);
                        break;
                    case 'onboarding':
                        results[componentType] = this.calculateOnboarding(params);
                        break;
                    case 'pbsFoundation':
                        results[componentType] = this.calculatePBSFoundation(params);
                        break;
                    case 'assessment':
                        results[componentType] = this.calculateAssessment(params);
                        break;
                    case 'admin':
                        results[componentType] = this.calculateAdmin(params);
                        break;
                    case 'otherCosts':
                        results[componentType] = this.calculateOtherCosts(params);
                        break;
                    case 'enhancedSupport':
                        results[componentType] = this.calculateEnhancedSupport(params);
                        break;
                    case 'dynamics1Year':
                    case 'dynamics3Year':
                    case 'dynamics5Year':
                        results[componentType] = this.calculateDynamics(params, componentType);
                        break;
                    case 'naasStandard':
                    case 'naasEnhanced':
                        results[componentType] = this.calculateNaaS(params, componentType);
                        break;
                }

                if (results[componentType]) {
                    totalOneTime += results[componentType].totals.oneTime || 0;
                    totalMonthly += results[componentType].totals.monthly || 0;
                    totalAnnual += results[componentType].totals.annual || 0;
                    totalThreeYear += results[componentType].totals.threeYear || 0;
                }
            }
        });

        // Apply volume discounts
        const discounts = this.calculateVolumeDiscounts(totalMonthly, Object.keys(results).length);
        
        return {
            components: results,
            subtotals: {
                oneTime: totalOneTime,
                monthly: totalMonthly,
                annual: totalAnnual,
                threeYear: totalThreeYear
            },
            discounts,
            totals: {
                oneTime: totalOneTime,
                monthly: Math.round(totalMonthly * (1 - discounts.monthlyDiscount)),
                annual: Math.round(totalAnnual * (1 - discounts.annualDiscount)),
                threeYear: Math.round(totalThreeYear * (1 - discounts.termDiscount))
            }
        };
    }

    /**
     * Calculate volume discounts based on total monthly cost and component count
     */
    calculateVolumeDiscounts(monthlyTotal, componentCount) {
        let monthlyDiscount = 0;
        let annualDiscount = 0;
        let termDiscount = 0;

        // Monthly total discounts
        if (monthlyTotal >= 5000) monthlyDiscount = 0.10; // 10% for £5k+
        else if (monthlyTotal >= 3000) monthlyDiscount = 0.075; // 7.5% for £3k+
        else if (monthlyTotal >= 1500) monthlyDiscount = 0.05; // 5% for £1.5k+

        // Bundle discounts (additional discount for multiple components)
        if (componentCount >= 4) monthlyDiscount += 0.05; // Additional 5% for 4+ components
        else if (componentCount >= 3) monthlyDiscount += 0.025; // Additional 2.5% for 3+ components

        // Annual payment discount
        annualDiscount = monthlyDiscount + 0.02; // Additional 2% for annual payment

        // 3-year term discount
        termDiscount = annualDiscount + 0.03; // Additional 3% for 3-year commitment

        // Cap discounts at reasonable levels
        monthlyDiscount = Math.min(monthlyDiscount, 0.20);
        annualDiscount = Math.min(annualDiscount, 0.25);
        termDiscount = Math.min(termDiscount, 0.30);

        return {
            monthlyDiscount,
            annualDiscount,
            termDiscount,
            reasons: {
                volumeDiscount: monthlyTotal >= 1500,
                bundleDiscount: componentCount >= 3,
                annualPayment: true,
                termCommitment: true
            }
        };
    }

    /**
     * Format currency values
     */
    formatCurrency(amount, includeCents = false) {
        const options = {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: includeCents ? 2 : 0,
            maximumFractionDigits: includeCents ? 2 : 0
        };
        try {
            return new Intl.NumberFormat('en-GB', options).format(amount);
        } catch (error) {
            // Fallback to manual formatting if Intl.NumberFormat fails
            return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: includeCents ? 2 : 0, maximumFractionDigits: includeCents ? 2 : 0 })}`;
        }
    }

    /**
     * Generic error handler for calculation functions
     */
    handleCalculationError(functionName, error) {
        console.error(`Error in ${functionName}:`, error);
        return {
            error: error.message,
            totals: { monthly: 0, annual: 0, threeYear: 0, oneTime: 0 },
            breakdown: { error: true }
        };
    }

    /**
     * Get equipment catalog for dropdowns
     */
    getEquipmentCatalog() {
        const catalog = {};
        Object.keys(this.pricingData.capital.equipmentTypes).forEach(key => {
            const item = this.pricingData.capital.equipmentTypes[key];
            if (!catalog[item.category]) {
                catalog[item.category] = [];
            }
            catalog[item.category].push({
                id: key,
                name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                cost: item.cost
            });
        });
        return catalog;
    }

    calculateAssessment(params) {
        const {
            complexity = 'standard',
            deviceCount = 10,
            siteCount = 1,
            includeReport = true
        } = params;

        const baseCost = this.pricingData.assessment.baseCosts[complexity] || this.pricingData.assessment.baseCosts.standard;
        const deviceMultiplier = Math.max(1, deviceCount / this.pricingData.assessment.deviceMultiplier.base);
        const siteMultiplier = Math.max(1, siteCount);
        const reportCost = includeReport ? this.pricingData.assessment.reportCost : 0;

        const oneTimeCost = (baseCost * deviceMultiplier * siteMultiplier) + reportCost;

        return {
            breakdown: {
                baseCost,
                deviceMultiplier,
                siteMultiplier,
                reportCost,
                complexity
            },
            totals: {
                monthly: 0,
                annual: 0,
                threeYear: 0,
                oneTime: oneTimeCost
            }
        };
    }

    calculateAdmin(params) {
        const {
            annualReviews = 0,
            quarterlyReviews = 0,
            biAnnualReviews = 0,
            technicalDays = 0,
            l3EngineeringDays = 0,
            reportingService = 0,
            backupService = 0
        } = params;

        const reviewCost = (annualReviews + quarterlyReviews + biAnnualReviews) * this.pricingData.admin.reviewCosts.annual;
        const technicalCost = technicalDays * this.pricingData.admin.technicalRates.technicalDay;
        const engineeringCost = l3EngineeringDays * this.pricingData.admin.technicalRates.l3EngineeringDay;
        const reportingCost = reportingService * this.pricingData.admin.serviceCosts.reportingService;
        const backupCost = backupService * this.pricingData.admin.serviceCosts.backupService;

        const totalOneTime = reviewCost + technicalCost + engineeringCost + reportingCost + backupCost;

        return {
            breakdown: {
                reviewCost,
                technicalCost,
                engineeringCost,
                reportingCost,
                backupCost
            },
            totals: {
                monthly: 0,
                annual: 0,
                threeYear: 0,
                oneTime: totalOneTime
            }
        };
    }

    calculateOtherCosts(params) {
        const { items = [] } = params;
        
        let totalCost = 0;
        const breakdown = [];

        items.forEach(item => {
            const itemTotal = item.quantity * item.unitCost;
            totalCost += itemTotal;
            breakdown.push({
                description: item.description,
                quantity: item.quantity,
                unitCost: item.unitCost,
                totalCost: itemTotal
            });
        });

        return {
            breakdown,
            totals: {
                monthly: 0,
                annual: 0,
                threeYear: 0,
                oneTime: totalCost
            }
        };
    }

    calculateEnhancedSupport(params) {
        const {
            level = 'enhanced',
            deviceCount = 10,
            termMonths = 36,
            includeEscalation = true
        } = params;

        const baseMonthly = this.pricingData.enhancedSupport.baseCosts[level] || this.pricingData.enhancedSupport.baseCosts.enhanced;
        const deviceCost = deviceCount * this.pricingData.enhancedSupport.perDeviceCost;
        const monthlyCost = baseMonthly + deviceCost;
        
        let annualCost = monthlyCost * 12;
        let threeYearCost = annualCost * 3;

        if (includeEscalation) {
            // Apply CPI escalation
            const cpiRate = this.pricingData.enhancedSupport.escalationRate;
            annualCost = monthlyCost * 12 * (1 + cpiRate);
            threeYearCost = monthlyCost * 12 * ((1 + cpiRate) + Math.pow(1 + cpiRate, 2) + Math.pow(1 + cpiRate, 3));
        }

        return {
            breakdown: {
                baseMonthly,
                deviceCost,
                deviceCount,
                level,
                escalation: includeEscalation ? '3% CPI' : 'None'
            },
            totals: {
                monthly: monthlyCost,
                annual: annualCost,
                threeYear: threeYearCost,
                oneTime: 0
            }
        };
    }

    calculateDynamics(params, componentType) {
        const {
            termMonths = 36,
            cpiRate = 0.03,
            aprRate = 0.05,
            baseMonthly = 0,
            deviceCount = 10,
            includeEscalation = true
        } = params;

        // Extract term from component type (1Year, 3Year, 5Year)
        const termMatch = componentType.match(/(\d+)Year/);
        const termYears = termMatch ? parseInt(termMatch[1]) : 3;
        const actualTermMonths = termYears * 12;

        // Base monthly cost calculation
        const deviceCost = deviceCount * 25; // £25 per device for dynamics
        const monthlyCost = baseMonthly + deviceCost;

        let annualCost = monthlyCost * 12;
        let totalTermCost = annualCost * termYears;

        // Apply CPI escalation if enabled
        if (includeEscalation) {
            let escalatedAnnualCost = 0;
            for (let year = 1; year <= termYears; year++) {
                const yearCost = monthlyCost * 12 * Math.pow(1 + cpiRate, year - 1);
                escalatedAnnualCost += yearCost;
            }
            totalTermCost = escalatedAnnualCost;
            annualCost = monthlyCost * 12 * (1 + cpiRate);
        }

        // Calculate financing if applicable
        let financingDetails = null;
        if (baseMonthly > 0) {
            const totalFinanced = totalTermCost;
            const monthlyRate = aprRate / 12;
            
            if (monthlyRate > 0) {
                const monthlyPayment = (totalFinanced * monthlyRate * Math.pow(1 + monthlyRate, actualTermMonths)) / 
                                     (Math.pow(1 + monthlyRate, actualTermMonths) - 1);
                
                financingDetails = {
                    totalFinanced,
                    termMonths: actualTermMonths,
                    apr: aprRate,
                    monthlyPayment: Math.round(monthlyPayment),
                    totalInterest: Math.round((monthlyPayment * actualTermMonths) - totalFinanced)
                };
            }
        }

        return {
            breakdown: {
                termYears,
                termMonths: actualTermMonths,
                baseMonthly,
                deviceCost,
                deviceCount,
                monthlyCost,
                cpiRate: cpiRate * 100,
                aprRate: aprRate * 100,
                escalation: includeEscalation ? '3% CPI' : 'None',
                componentType
            },
            financing: financingDetails,
            totals: {
                monthly: monthlyCost,
                annual: annualCost,
                threeYear: termYears === 3 ? totalTermCost : (annualCost * 3),
                oneTime: 0
            }
        };
    }

    calculateNaaS(params, componentType) {
        const {
            package: packageType = 'standard',
            deviceCount = 10,
            termMonths = 36,
            includeEscalation = true
        } = params;

        const baseMonthly = this.pricingData.naas.baseCosts[packageType] || this.pricingData.naas.baseCosts.standard;
        const deviceCost = deviceCount * this.pricingData.naas.perDeviceCost;
        const monthlyCost = baseMonthly + deviceCost;
        
        let annualCost = monthlyCost * 12;
        let threeYearCost = annualCost * 3;

        if (includeEscalation) {
            const cpiRate = this.pricingData.naas.escalationRate;
            annualCost = monthlyCost * 12 * (1 + cpiRate);
            threeYearCost = monthlyCost * 12 * ((1 + cpiRate) + Math.pow(1 + cpiRate, 2) + Math.pow(1 + cpiRate, 3));
        }

        return {
            breakdown: {
                baseMonthly,
                deviceCost,
                deviceCount,
                packageType,
                escalation: includeEscalation ? '3% CPI' : 'None'
            },
            totals: {
                monthly: monthlyCost,
                annual: annualCost,
                threeYear: threeYearCost,
                oneTime: 0
            }
        };
    }
}

// Export for use in other modules
window.NaaSCalculator = NaaSCalculator;