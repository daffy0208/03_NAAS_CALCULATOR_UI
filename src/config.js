/**
 * NaaS Pricing Calculator - Configuration Constants
 * Centralized configuration for magic numbers, timing values, and limits
 */

const AppConfig = {
    // Calculation timing
    CALCULATION_DEBOUNCE_MS: 50,
    CALCULATION_RETRY_DELAY_MS: 100,
    CALCULATION_QUEUE_CHECK_MS: 10,

    // History and storage limits
    MAX_CALCULATION_HISTORY_SIZE: 50,
    MAX_LOCALSTORAGE_ENTRIES: 10,
    MAX_NOTIFICATION_COUNT: 3,

    // Initialization
    MAX_INIT_ATTEMPTS: 50,
    INIT_POLLING_INTERVAL_MS: 100,
    INIT_POLLING_LOG_FREQUENCY: 10,

    // Auto-save timing
    AUTOSAVE_INTERVAL_MS: 5000,
    AUTOSAVE_DEBOUNCE_MS: 1000,
    AUTOSAVE_COMPONENT_DEBOUNCE_MS: 2000,

    // Live updates
    DASHBOARD_UPDATE_INTERVAL_MS: 30000,
    WIZARD_AUTOSAVE_INTERVAL_MS: 10000,

    // UI timing
    VIEW_TRANSITION_DELAY_MS: 100,
    COMPONENT_SELECT_DELAY_MS: 50,
    LOADING_FADE_OUT_MS: 300,
    SCREEN_READER_ANNOUNCEMENT_CLEAR_MS: 5000,

    // Notification timing
    NOTIFICATION_AUTO_REMOVE_ERROR_MS: 8000,
    NOTIFICATION_AUTO_REMOVE_WARNING_MS: 6000,
    NOTIFICATION_AUTO_REMOVE_SUCCESS_MS: 4000,
    AUTOSAVE_INDICATOR_DISPLAY_MS: 2000,

    // Data expiration
    TEMP_DATA_EXPIRY_MS: 24 * 60 * 60 * 1000, // 24 hours
    AUTOSAVE_DATA_EXPIRY_MS: 24 * 60 * 60 * 1000, // 24 hours
    APP_STATE_EXPIRY_MS: 60 * 60 * 1000, // 1 hour

    // Storage cleanup
    STORAGE_CLEANUP_QUOTES_DAYS: 90,
    STORAGE_CLEANUP_COMPONENTS_DAYS: 30,
    STORAGE_CLEANUP_HISTORY_DAYS: 14,

    // Storage concurrency
    MAX_CONCURRENT_STORAGE_OPERATIONS: 3,
    STORAGE_RECONNECTION_DELAY_MS: 1000,
    MAX_STORAGE_RECONNECT_ATTEMPTS: 3,

    // Validation limits
    MAX_STRING_LENGTH: 255,
    MAX_STRING_LENGTH_SHORT: 100,
    MAX_STRING_LENGTH_MEDIUM: 50,
    MAX_OBJECT_DEPTH: 3,
    MAX_ARRAY_SIZE: 100,
    MAX_ARRAY_SIZE_SHORT: 50,
    MAX_KEY_LENGTH: 100,

    // Business limits
    MIN_SITES: 1,
    MAX_SITES: 1000,
    MIN_USERS: 1,
    MAX_USERS: 100000,
    DEFAULT_USER_COUNT: 100,
    DEFAULT_DEVICE_COUNT: 10,

    // Financial defaults
    DEFAULT_APR_RATE: 0.05,
    DEFAULT_CPI_RATE: 0.03,
    DEFAULT_TERM_MONTHS: 36,
    MONTHS_PER_YEAR: 12,

    // Discount thresholds
    DISCOUNT_THRESHOLD_TIER1: 1500,
    DISCOUNT_THRESHOLD_TIER2: 3000,
    DISCOUNT_THRESHOLD_TIER3: 5000,
    DISCOUNT_COMPONENT_COUNT_TIER1: 3,
    DISCOUNT_COMPONENT_COUNT_TIER2: 4,

    // Discount rates
    DISCOUNT_RATE_TIER1: 0.05,
    DISCOUNT_RATE_TIER2: 0.075,
    DISCOUNT_RATE_TIER3: 0.10,
    DISCOUNT_RATE_BUNDLE_TIER1: 0.025,
    DISCOUNT_RATE_BUNDLE_TIER2: 0.05,
    DISCOUNT_RATE_ANNUAL: 0.02,
    DISCOUNT_RATE_TERM: 0.03,

    // Discount caps
    MAX_MONTHLY_DISCOUNT: 0.20,
    MAX_ANNUAL_DISCOUNT: 0.25,
    MAX_TERM_DISCOUNT: 0.30,

    // Error tracking
    MAX_ERROR_COUNT_THRESHOLD: 10,

    // IndexedDB
    INDEXEDDB_NAME: 'NaaSCalculatorDB',
    INDEXEDDB_VERSION: 2,

    // LocalStorage keys
    LOCALSTORAGE_KEY_QUOTE_DATA: 'naas_quote_data',
    LOCALSTORAGE_KEY_WIZARD_AUTOSAVE: 'naas_wizard_autosave',
    LOCALSTORAGE_KEY_COMPONENTS_AUTOSAVE: 'naas_components_autosave',
    LOCALSTORAGE_KEY_APP_STATE: 'naas_app_state',
    LOCALSTORAGE_KEY_FULL_QUOTE: 'naas_full_quote',
    LOCALSTORAGE_KEY_SAVED_COMPONENTS: 'naas_saved_components',
    LOCALSTORAGE_KEY_FULL_QUOTES: 'naas_full_quotes',
    LOCALSTORAGE_PREFIX_TEMP: 'naas_temp_',
    LOCALSTORAGE_PREFIX_TEST: 'naas_test_',
    LOCALSTORAGE_PREFIX_COMPONENT_TEMP: 'component_',
    LOCALSTORAGE_PREFIX_SETTING: 'naas_setting_',
    LOCALSTORAGE_PREFIX_FALLBACK: 'naas_fallback_',
    LOCALSTORAGE_SUFFIX_TEMP: '_temp',

    // Storage quota
    LOCALSTORAGE_FALLBACK_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    LOCALSTORAGE_FALLBACK_KEEP_COUNT: 5,

    // Storage cleanup strategies
    STORAGE_CLEANUP_HISTORY_KEEP: 50,
    STORAGE_CLEANUP_QUOTES_KEEP: 20,
    STORAGE_CLEANUP_COMPONENTS_KEEP: 100,
    STORAGE_CLEANUP_AGGRESSIVE_FACTOR: 0.5,

    // Z-index layers
    Z_INDEX_NOTIFICATION: 50,
    Z_INDEX_AUTOSAVE_INDICATOR: 40,
    Z_INDEX_LOADING: 60,

    // Notification stacking
    NOTIFICATION_STACK_OFFSET_REM: 5,

    // Data versions
    DATA_VERSION: '2.0.0'
};

// Freeze the configuration to prevent accidental modification
Object.freeze(AppConfig);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
} else {
    window.AppConfig = AppConfig;
}
