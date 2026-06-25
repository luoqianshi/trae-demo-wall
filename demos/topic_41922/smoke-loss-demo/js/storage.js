/**
 * Local Storage Management Module
 * Handles user config read, write and default value fallback
 * All data stored locally, zero network transmission
 */

const STORAGE_KEY = 'smoke_loss_user_config';

/**
 * Get default user configuration
 * @returns {Object} default config object
 */
function getDefaultConfig() {
  return {
    brand: 'custom',
    brandName: '自定义',
    pricePerPack: 25,
    cigarettesPerPack: 20,
    nicotineMgPerCig: 1.0,
    tarMgPerCig: 10,
    dailyCigarettes: 20,
    smokingYears: 5,
    age: 30,
    gender: 'male',
    firstRecordedAt: null
  };
}

/**
 * Save user config to localStorage
 * @param {Object} config - user configuration object
 * @returns {boolean} save success status
 */
function saveUserConfig(config) {
  try {
    const configStr = JSON.stringify(config);
    localStorage.setItem(STORAGE_KEY, configStr);
    return true;
  } catch (e) {
    console.error('Failed to save user config:', e);
    return false;
  }
}

/**
 * Get user config from localStorage
 * Falls back to default config if no data exists
 * @returns {Object} user config object
 */
function getUserConfig() {
  try {
    const configStr = localStorage.getItem(STORAGE_KEY);
    if (!configStr) {
      return getDefaultConfig();
    }
    const config = JSON.parse(configStr);
    // Merge with defaults to avoid missing fields from partial saves
    return { ...getDefaultConfig(), ...config };
  } catch (e) {
    console.error('Failed to parse user config:', e);
    return getDefaultConfig();
  }
}

/**
 * Reset user config to default values
 * @returns {boolean} reset success status
 */
function resetUserConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.error('Failed to reset config:', e);
    return false;
  }
}

/**
 * Check if user has completed initial setup
 * @returns {boolean} true if config exists
 */
function hasUserConfig() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
