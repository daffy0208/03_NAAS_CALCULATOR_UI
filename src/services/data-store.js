/**
 * Secure Data Store Service
 * Manages quote data persistence with validation and error handling
 */

import { InputValidator } from '../utils/security.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class DataStore {
  constructor() {
    this.data = this.createDefaultData();
    this.listeners = new Set();
    this.autoSaveTimeout = null;
    this.loadFromStorage();
  }

  /**
   * Create default data structure
   */
  createDefaultData() {
    return {
      metadata: {
        version: '2.0.0',
        lastModified: new Date().toISOString(),
        created: new Date().toISOString()
      },
      project: {
        name: '',
        customerName: '',
        customerEmail: '',
        description: '',
        totalDevices: 0,
        sites: 1
      },
      components: {
        help: { enabled: false, params: {}, results: null },
        prtg: { enabled: false, params: this.getDefaultPRTGParams(), results: null },
        capital: { enabled: false, params: { equipment: [], financing: false, termMonths: 36, downPayment: 0 }, results: null },
        support: { enabled: false, params: { level: 'standard', deviceCount: 10, termMonths: 36 }, results: null },
        onboarding: { enabled: false, params: { complexity: 'standard', sites: 1, includeAssessment: true }, results: null },
        pbsFoundation: { enabled: false, params: { users: 10, locations: 1, features: [] }, results: null },
        assessment: { enabled: false, params: { complexity: 'standard', deviceCount: 10, siteCount: 1 }, results: null },
        admin: { enabled: false, params: { annualReviews: 0, quarterlyReviews: 0, technicalDays: 0 }, results: null },
        otherCosts: { enabled: false, params: { items: [], totalCost: 0 }, results: null },
        enhancedSupport: { enabled: false, params: { level: 'enhanced', deviceCount: 10, termMonths: 36 }, results: null },
        dynamics1Year: { enabled: false, params: { termMonths: 12, cpiRate: 0.03, aprRate: 0.05 }, results: null },
        dynamics3Year: { enabled: false, params: { termMonths: 36, cpiRate: 0.03, aprRate: 0.05 }, results: null },
        dynamics5Year: { enabled: false, params: { termMonths: 60, cpiRate: 0.03, aprRate: 0.05 }, results: null },
        naasStandard: { enabled: false, params: { package: 'standard', deviceCount: 10, termMonths: 36 }, results: null },
        naasEnhanced: { enabled: false, params: { package: 'enhanced', deviceCount: 10, termMonths: 36 }, results: null }
      },
      totals: {
        monthly: 0,
        annual: 0,
        threeYear: 0,
        oneTime: 0,
        discounts: { monthlyDiscount: 0, annualDiscount: 0 }
      }
    };
  }

  /**
   * Get default PRTG parameters
   */
  getDefaultPRTGParams() {
    return {
      sensors: 0,
      serviceLevel: 'standard',
      alertRecipients: 10,
      prtgSetup: 1,
      siteToSiteVPN: 0,
      probeOnSite: 0,
      vpnJumpBox: 0,
      licenseTerm: 3,
      discountLevel: 70,
      devices: {
        'HP Aruba Switches': { ping: false, cpuLoad: false, ram: false, uptime: false },
        'HP Aruba Wireless Controllers': { ping: false, cpuLoad: false, ram: false, uptime: false },
        'ClearPass': { ping: false, cpuLoad: false, ram: false, uptime: false },
        'Airwave Management': { ping: false, cpuLoad: false, ram: false, uptime: false },
        'Firewalls (Fortinet)': { ping: false, cpuLoad: false, ram: false, uptime: false },
        'Other (i.e. 3rd Party Switch)': { ping: false, cpuLoad: false, ram: false, uptime: false }
      }
    };
  }

  /**
   * Get component data
   */
  getComponent(componentType) {
    try {
      const component = this.data.components[componentType];
      if (!component) {
        throw new Error(`Component ${componentType} not found`);
      }
      return { ...component };
    } catch (error) {
      ErrorHandler.handleError(error, { operation: 'getComponent', componentType });
      return { enabled: false, params: {}, results: null };
    }
  }

  /**
   * Update component parameters with validation
   */
  updateComponentParams(componentType, params) {
    try {
      if (!this.data.components[componentType]) {
        throw new Error(`Component ${componentType} not found`);
      }

      // Validate and sanitize parameters
      const sanitizedParams = this.validateComponentParams(componentType, params);

      this.data.components[componentType].params = { ...sanitizedParams };
      this.data.metadata.lastModified = new Date().toISOString();

      // Notify listeners
      this.notifyListeners('componentParamsUpdated', { componentType, params: sanitizedParams });

      // Auto-save with debouncing
      this.scheduleAutoSave();

      return true;
    } catch (error) {
      ErrorHandler.handleValidationError(error, componentType, params);
      return false;
    }
  }

  /**
   * Validate component parameters based on component type
   */
  validateComponentParams(componentType, params) {
    const validators = {
      prtg: this.validatePRTGParams,
      capital: this.validateCapitalParams,
      support: this.validateSupportParams,
      onboarding: this.validateOnboardingParams,
      pbsFoundation: this.validatePBSFoundationParams,
      assessment: this.validateAssessmentParams,
      admin: this.validateAdminParams,
      otherCosts: this.validateOtherCostsParams,
      enhancedSupport: this.validateEnhancedSupportParams
    };

    const validator = validators[componentType] || this.validateGenericParams;
    return validator.call(this, params);
  }

  /**
   * Validate PRTG parameters
   */
  validatePRTGParams(params) {
    const validated = {};

    validated.sensors = InputValidator.validateNumber(params.sensors, { min: 0, max: 10000 });
    validated.alertRecipients = InputValidator.validateNumber(params.alertRecipients, { min: 1, max: 1000 });
    validated.prtgSetup = InputValidator.validateNumber(params.prtgSetup, { min: 0, max: 10 });
    validated.siteToSiteVPN = InputValidator.validateNumber(params.siteToSiteVPN, { min: 0, max: 10 });
    validated.probeOnSite = InputValidator.validateNumber(params.probeOnSite, { min: 0, max: 10 });
    validated.vpnJumpBox = InputValidator.validateNumber(params.vpnJumpBox, { min: 0, max: 10 });
    validated.licenseTerm = InputValidator.validateNumber(params.licenseTerm, { min: 1, max: 5 });
    validated.discountLevel = InputValidator.validatePercentage(params.discountLevel);

    if (params.serviceLevel && ['standard', 'enhanced', 'enterprise'].includes(params.serviceLevel)) {
      validated.serviceLevel = params.serviceLevel;
    } else {
      validated.serviceLevel = 'standard';
    }

    if (params.devices && typeof params.devices === 'object') {
      validated.devices = {};
      Object.keys(params.devices).forEach(deviceType => {
        if (typeof params.devices[deviceType] === 'object') {
          validated.devices[deviceType] = { ...params.devices[deviceType] };
        }
      });
    }

    return validated;
  }

  /**
   * Validate capital equipment parameters
   */
  validateCapitalParams(params) {
    const validated = {};

    if (Array.isArray(params.equipment)) {
      validated.equipment = params.equipment.map(item => ({
        description: InputValidator.validateString(item.description, { maxLength: 500 }),
        quantity: InputValidator.validateNumber(item.quantity, { min: 1, max: 10000 }),
        unitCost: InputValidator.validateCurrency(item.unitCost)
      }));
    } else {
      validated.equipment = [];
    }

    validated.financing = Boolean(params.financing);
    validated.termMonths = InputValidator.validateNumber(params.termMonths, { min: 12, max: 84 });
    validated.downPayment = InputValidator.validateCurrency(params.downPayment);

    return validated;
  }

  /**
   * Validate support parameters
   */
  validateSupportParams(params) {
    const validated = {};

    validated.deviceCount = InputValidator.validateNumber(params.deviceCount, { min: 1, max: 50000 });
    validated.termMonths = InputValidator.validateNumber(params.termMonths, { min: 12, max: 60 });

    const validLevels = ['standard', 'enhanced', 'enterprise'];
    validated.level = validLevels.includes(params.level) ? params.level : 'standard';

    // Validate service options
    validated.monitoringService = Boolean(params.monitoringService);
    validated.visionService = Boolean(params.visionService);
    validated.includeEscalation = Boolean(params.includeEscalation);

    // Validate review quantities
    validated.annualReviews = InputValidator.validateNumber(params.annualReviews, { min: 0, max: 12 });
    validated.quarterlyReviews = InputValidator.validateNumber(params.quarterlyReviews, { min: 0, max: 48 });
    validated.biAnnualReviews = InputValidator.validateNumber(params.biAnnualReviews, { min: 0, max: 24 });

    // Validate service days
    validated.technicalDays = InputValidator.validateNumber(params.technicalDays, { min: 0, max: 365 });
    validated.l3EngineeringDays = InputValidator.validateNumber(params.l3EngineeringDays, { min: 0, max: 365 });
    validated.reportingService = InputValidator.validateNumber(params.reportingService, { min: 0, max: 100 });
    validated.backupService = InputValidator.validateNumber(params.backupService, { min: 0, max: 100 });

    return validated;
  }

  /**
   * Validate onboarding parameters
   */
  validateOnboardingParams(params) {
    const validated = {};

    const validComplexity = ['simple', 'standard', 'complex', 'enterprise'];
    validated.complexity = validComplexity.includes(params.complexity) ? params.complexity : 'standard';

    validated.sites = InputValidator.validateNumber(params.sites, { min: 1, max: 1000 });
    validated.includeAssessment = Boolean(params.includeAssessment);

    const validAssessmentTypes = ['network', 'security', 'comprehensive'];
    validated.assessmentType = validAssessmentTypes.includes(params.assessmentType) ?
      params.assessmentType : 'comprehensive';

    return validated;
  }

  /**
   * Validate PBS Foundation parameters
   */
  validatePBSFoundationParams(params) {
    const validated = {};

    validated.users = InputValidator.validateNumber(params.users, { min: 1, max: 10000 });
    validated.locations = InputValidator.validateNumber(params.locations, { min: 1, max: 1000 });

    if (Array.isArray(params.features)) {
      const validFeatures = ['advanced_reporting', 'api_access', 'sso_integration', 'custom_branding'];
      validated.features = params.features.filter(f => validFeatures.includes(f));
    } else {
      validated.features = [];
    }

    return validated;
  }

  /**
   * Validate assessment parameters
   */
  validateAssessmentParams(params) {
    const validated = {};

    const validComplexity = ['simple', 'standard', 'complex', 'enterprise'];
    validated.complexity = validComplexity.includes(params.complexity) ? params.complexity : 'standard';

    validated.deviceCount = InputValidator.validateNumber(params.deviceCount, { min: 1, max: 50000 });
    validated.siteCount = InputValidator.validateNumber(params.siteCount, { min: 1, max: 1000 });
    validated.includeReport = Boolean(params.includeReport);

    return validated;
  }

  /**
   * Validate admin services parameters
   */
  validateAdminParams(params) {
    const validated = {};

    validated.annualReviews = InputValidator.validateNumber(params.annualReviews, { min: 0, max: 10 });
    validated.quarterlyReviews = InputValidator.validateNumber(params.quarterlyReviews, { min: 0, max: 40 });
    validated.biAnnualReviews = InputValidator.validateNumber(params.biAnnualReviews, { min: 0, max: 20 });
    validated.technicalDays = InputValidator.validateNumber(params.technicalDays, { min: 0, max: 365 });
    validated.l3EngineeringDays = InputValidator.validateNumber(params.l3EngineeringDays, { min: 0, max: 365 });
    validated.reportingService = InputValidator.validateNumber(params.reportingService, { min: 0, max: 100 });
    validated.backupService = InputValidator.validateNumber(params.backupService, { min: 0, max: 100 });

    return validated;
  }

  /**
   * Validate other costs parameters
   */
  validateOtherCostsParams(params) {
    const validated = {};

    if (Array.isArray(params.items)) {
      validated.items = params.items.map(item => ({
        description: InputValidator.validateString(item.description, { maxLength: 500 }),
        quantity: InputValidator.validateNumber(item.quantity, { min: 1, max: 10000 }),
        unitCost: InputValidator.validateCurrency(item.unitCost)
      }));
    } else {
      validated.items = [];
    }

    validated.totalCost = InputValidator.validateCurrency(params.totalCost);

    return validated;
  }

  /**
   * Validate enhanced support parameters
   */
  validateEnhancedSupportParams(params) {
    const validated = {};

    const validLevels = ['enhanced', 'premium', 'enterprise'];
    validated.level = validLevels.includes(params.level) ? params.level : 'enhanced';

    validated.deviceCount = InputValidator.validateNumber(params.deviceCount, { min: 1, max: 50000 });
    validated.termMonths = InputValidator.validateNumber(params.termMonths, { min: 12, max: 60 });
    validated.includeEscalation = Boolean(params.includeEscalation);

    return validated;
  }

  /**
   * Generic parameter validator
   */
  validateGenericParams(params) {
    return InputValidator.sanitizeForStorage(params);
  }

  /**
   * Update component results
   */
  updateComponentResults(componentType, results) {
    try {
      if (!this.data.components[componentType]) {
        throw new Error(`Component ${componentType} not found`);
      }

      this.data.components[componentType].results = { ...results };
      this.data.components[componentType].enabled = true;
      this.data.metadata.lastModified = new Date().toISOString();

      // Update totals
      this.recalculateTotals();

      // Notify listeners
      this.notifyListeners('componentResultsUpdated', { componentType, results });

      // Auto-save
      this.scheduleAutoSave();

      return true;
    } catch (error) {
      ErrorHandler.handleError(error, { operation: 'updateComponentResults', componentType });
      return false;
    }
  }

  /**
   * Enable/disable component
   */
  setComponentEnabled(componentType, enabled) {
    try {
      if (!this.data.components[componentType]) {
        throw new Error(`Component ${componentType} not found`);
      }

      this.data.components[componentType].enabled = Boolean(enabled);
      this.data.metadata.lastModified = new Date().toISOString();

      // Recalculate totals
      this.recalculateTotals();

      // Notify listeners
      this.notifyListeners('componentEnabledChanged', { componentType, enabled });

      // Auto-save
      this.scheduleAutoSave();

      return true;
    } catch (error) {
      ErrorHandler.handleError(error, { operation: 'setComponentEnabled', componentType });
      return false;
    }
  }

  /**
   * Get enabled components
   */
  getEnabledComponents() {
    const enabled = {};
    Object.entries(this.data.components).forEach(([key, component]) => {
      if (component.enabled && component.results) {
        enabled[key] = component;
      }
    });
    return enabled;
  }

  /**
   * Update project information
   */
  updateProject(projectData) {
    try {
      const validatedProject = {};

      validatedProject.name = InputValidator.validateString(projectData.name, { maxLength: 200 });
      validatedProject.customerName = InputValidator.validateString(projectData.customerName, { maxLength: 200 });
      validatedProject.description = InputValidator.validateString(projectData.description, { maxLength: 1000 });
      validatedProject.totalDevices = InputValidator.validateNumber(projectData.totalDevices, { min: 0, max: 100000 });
      validatedProject.sites = InputValidator.validateNumber(projectData.sites, { min: 1, max: 10000 });

      if (projectData.customerEmail) {
        validatedProject.customerEmail = InputValidator.validateEmail(projectData.customerEmail);
      }

      this.data.project = { ...this.data.project, ...validatedProject };
      this.data.metadata.lastModified = new Date().toISOString();

      // Notify listeners
      this.notifyListeners('projectUpdated', validatedProject);

      // Auto-save
      this.scheduleAutoSave();

      return true;
    } catch (error) {
      ErrorHandler.handleValidationError(error, 'project', projectData);
      return false;
    }
  }

  /**
   * Recalculate totals from enabled components
   */
  recalculateTotals() {
    const totals = { monthly: 0, annual: 0, threeYear: 0, oneTime: 0 };

    Object.values(this.data.components).forEach(component => {
      if (component.enabled && component.results && component.results.totals) {
        totals.monthly += component.results.totals.monthly || 0;
        totals.annual += component.results.totals.annual || 0;
        totals.threeYear += component.results.totals.threeYear || 0;
        totals.oneTime += component.results.totals.oneTime || 0;
      }
    });

    this.data.totals = { ...totals, discounts: this.calculateDiscounts(totals) };
  }

  /**
   * Calculate volume discounts
   */
  calculateDiscounts(totals) {
    const discounts = { monthlyDiscount: 0, annualDiscount: 0 };

    const enabledCount = Object.values(this.data.components).filter(c => c.enabled).length;

    if (enabledCount >= 5) {
      discounts.monthlyDiscount = 0.1; // 10% discount for 5+ components
    } else if (enabledCount >= 3) {
      discounts.monthlyDiscount = 0.05; // 5% discount for 3+ components
    }

    discounts.annualDiscount = discounts.monthlyDiscount;

    return discounts;
  }

  /**
   * Save data to localStorage with error handling
   */
  saveToStorage() {
    try {
      const sanitizedData = InputValidator.sanitizeForStorage(this.data);
      const jsonString = JSON.stringify(sanitizedData);

      if (jsonString.length > 5000000) { // 5MB limit
        throw new Error('Data too large for storage');
      }

      localStorage.setItem('naas_quote_data_v2', jsonString);
      return true;
    } catch (error) {
      ErrorHandler.handleStorageError(error, 'save', 'naas_quote_data_v2');
      return false;
    }
  }

  /**
   * Load data from localStorage with validation
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('naas_quote_data_v2');
      if (!stored) {
        return false; // No stored data
      }

      const parsedData = JSON.parse(stored);

      // Validate data structure
      if (this.validateDataStructure(parsedData)) {
        this.data = { ...this.createDefaultData(), ...parsedData };
        this.data.metadata.lastModified = new Date().toISOString();

        // Notify listeners
        this.notifyListeners('dataLoaded', this.data);

        return true;
      } else {
        console.warn('Invalid data structure, using defaults');
        return false;
      }
    } catch (error) {
      ErrorHandler.handleStorageError(error, 'load', 'naas_quote_data_v2');
      return false;
    }
  }

  /**
   * Validate data structure integrity
   */
  validateDataStructure(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.metadata || !data.project || !data.components) return false;

    // Check required component structure
    const requiredComponents = ['prtg', 'capital', 'support', 'onboarding'];
    return requiredComponents.every(comp =>
      data.components[comp] &&
      typeof data.components[comp].params === 'object'
    );
  }

  /**
   * Schedule auto-save with debouncing
   */
  scheduleAutoSave() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(() => {
      this.saveToStorage();
    }, 2000); // Save 2 seconds after last change
  }

  /**
   * Add data change listener
   */
  addListener(listener) {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
    }
  }

  /**
   * Remove data change listener
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of data changes
   */
  notifyListeners(eventType, data) {
    this.listeners.forEach(listener => {
      try {
        listener({ type: eventType, data });
      } catch (error) {
        console.error('Error in data store listener:', error);
      }
    });
  }

  /**
   * Clear all data
   */
  clearAllData() {
    this.data = this.createDefaultData();
    this.saveToStorage();
    this.notifyListeners('dataCleared', {});
  }

  /**
   * Export data for backup
   */
  exportData() {
    return {
      ...this.data,
      exportTimestamp: new Date().toISOString()
    };
  }

  /**
   * Import data from backup
   */
  importData(importedData) {
    try {
      if (this.validateDataStructure(importedData)) {
        this.data = { ...this.createDefaultData(), ...importedData };
        this.data.metadata.lastModified = new Date().toISOString();
        this.saveToStorage();
        this.notifyListeners('dataImported', this.data);
        return true;
      }
      return false;
    } catch (error) {
      ErrorHandler.handleError(error, { operation: 'importData' });
      return false;
    }
  }
}

// Create singleton instance
export const dataStore = new DataStore();