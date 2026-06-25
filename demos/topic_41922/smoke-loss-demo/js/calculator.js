/**
 * Core Calculation Module
 * All results are estimated values for reminder purpose only
 * Do NOT constitute medical advice
 */

/**
 * Format number to 2 decimal places
 * @param {number} num - raw number
 * @returns {number} formatted number with 2 decimals
 */
function formatDecimal(num) {
  return Math.round(num * 100) / 100;
}

/**
 * Calculate daily cost of smoking
 * @param {Object} config - user config object
 * @returns {number} daily cost in yuan
 */
function calculateDailyCost(config) {
  const { dailyCigarettes, pricePerPack } = config;
  const cigarettesPerPack = 20;
  if (cigarettesPerPack <= 0 || dailyCigarettes < 0) return 0;
  const cost = (dailyCigarettes / cigarettesPerPack) * pricePerPack;
  return formatDecimal(Math.max(0, cost));
}

/**
 * Calculate daily nicotine intake
 * @param {Object} config - user config object
 * @returns {number} daily nicotine in mg
 */
function calculateDailyNicotine(config) {
  const { dailyCigarettes, nicotineMgPerCig } = config;
  if (dailyCigarettes < 0 || nicotineMgPerCig < 0) return 0;
  const total = dailyCigarettes * nicotineMgPerCig;
  return formatDecimal(Math.max(0, total));
}

/**
 * Calculate daily tar intake
 * @param {Object} config - user config object
 * @returns {number} daily tar in mg
 */
function calculateDailyTar(config) {
  const { dailyCigarettes, tarMgPerCig } = config;
  if (dailyCigarettes < 0 || tarMgPerCig < 0) return 0;
  const total = dailyCigarettes * tarMgPerCig;
  return formatDecimal(Math.max(0, total));
}

/**
 * Calculate weekly estimated cost (7 days)
 * @param {Object} config - user config object
 * @returns {number} weekly cost in yuan
 */
function calculateWeeklyCost(config) {
  const dailyCost = calculateDailyCost(config);
  return formatDecimal(dailyCost * 7);
}

/**
 * Calculate monthly estimated cost (30 days)
 * @param {Object} config - user config object
 * @returns {number} monthly cost in yuan
 */
function calculateMonthlyCost(config) {
  const dailyCost = calculateDailyCost(config);
  return formatDecimal(dailyCost * 30);
}

/**
 * Calculate yearly estimated cost (365 days)
 * @param {Object} config - user config object
 * @returns {number} yearly cost in yuan
 */
function calculateYearlyCost(config) {
  const dailyCost = calculateDailyCost(config);
  return formatDecimal(dailyCost * 365);
}

/**
 * Calculate total accumulated cost from first recorded date
 * Uses days difference between current date and firstRecordedAt
 * Falls back to smoking years estimation if firstRecordedAt is not set
 * @param {Object} config - user config object
 * @returns {number} total accumulated cost in yuan
 */
function calculateTotalAccumulatedCost(config) {
  const dailyCost = calculateDailyCost(config);
  const { firstRecordedAt, smokingYears } = config;
  
  if (firstRecordedAt) {
    // Preferred: calculate based on actual days since first record
    const firstDate = new Date(firstRecordedAt);
    const now = new Date();
    const diffTime = Math.max(0, now - firstDate);
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return formatDecimal(dailyCost * Math.max(0, days));
  } else {
    // Fallback: estimate based on smoking years
    const years = Math.max(0, smokingYears || 0);
    return formatDecimal(dailyCost * 365 * years);
  }
}

/**
 * Life item conversion configuration
 * Convert smoking cost to tangible daily items
 * Price reference: domestic market retail prices, for display only
 */
const LIFE_ITEMS = [
  { id: 'fishing_rod',  name: 'Fishing Rod',      emoji: '🎣', price: 300,   unit: 'set' },
  { id: 'watch',         name: 'Entry Watch',       emoji: '⌚', price: 1500,  unit: 'piece' },
  { id: 'lipstick',     name: 'Lipstick',          emoji: '💄', price: 350,   unit: 'tube' },
  { id: 'travel',        name: 'Weekend Trip',       emoji: '🧳', price: 2000,  unit: 'trip' },
  { id: 'gym',          name: 'Gym Monthly Card',   emoji: '🏋️', price: 299,   unit: 'card' },
  { id: 'earphones',    name: 'Wireless Earphones', emoji: '🎧', price: 199,   unit: 'pair' },
  { id: 'bicycle',      name: 'City Bicycle',       emoji: '🚲', price: 800,   unit: 'unit' },
  { id: 'coffee',       name: 'Premium Coffee',     emoji: '☕', price: 35,    unit: 'cup' }
];

/**
 * Calculate how many life items can be bought with daily cost
 * @param {number} dailyCost - daily smoking cost in yuan
 * @returns {Array} list of items with quantity
 */
function calculateDailyItemConversion(dailyCost) {
  return LIFE_ITEMS.map(item => ({
    ...item,
    quantity: formatDecimal(dailyCost / item.price)
  })).sort((a, b) => b.quantity - a.quantity);
}

/**
 * Calculate how many life items can be bought with yearly cost
 * @param {number} yearlyCost - yearly smoking cost in yuan
 * @returns {Array} list of items with quantity
 */
function calculateYearlyItemConversion(yearlyCost) {
  return LIFE_ITEMS.map(item => ({
    ...item,
    quantity: formatDecimal(yearlyCost / item.price)
  })).sort((a, b) => b.quantity - a.quantity);
}

/**
 * Warning phrases for long-term quit benefits page
 * Gentle, non-alarming style
 */
const QUIT_SLOGANS = [
  "少抽一包，就是给未来的自己买一次呼吸",
  "Saving 1 pack = buying yourself one breath of fresh air",
  "Every cigarette not smoked is a quiet victory",
  "The money saved could be a small gift for your future self",
  "Less smoke, more life to live",
  "Smoke less, save for something that lasts"
];

/**
 * Get random quit slogan
 * @returns {string} a random slogan
 */
function getRandomQuitSlogan() {
  return QUIT_SLOGANS[Math.floor(Math.random() * QUIT_SLOGANS.length)];
}

/**
 * Get brand display name by brand id
 * @param {string} brandId - brand identifier
 * @returns {string} display name
 */
function getBrandDisplayName(brandId) {
  const brands = {
    'custom': '自定义',
    '中华': 'China (Zhonghua)',
    '芙蓉王': 'Furongwang',
    '利群': 'Li Qun',
    '玉溪': 'Yu Xi',
    '云烟': 'Yunyan',
    '黄鹤楼': 'Huanghelou',
    '南京': 'Nanjing',
    '红塔山': 'Hongtashan',
    '红双喜': 'Double Happiness'
  };
  return brands[brandId] || brandId;
}

/**
 * Validate config values for calculation safety
 * @param {Object} config - user config
 * @returns {Object} validated config with safe numeric defaults
 */
function validateConfig(config) {
  const defaults = getDefaultConfig();
  return {
    ...defaults,
    ...config,
    dailyCigarettes: Math.max(0, Number(config.dailyCigarettes) || defaults.dailyCigarettes),
    pricePerPack: Math.max(1, Number(config.pricePerPack) || defaults.pricePerPack),
    cigarettesPerPack: 20,
    nicotineMgPerCig: Math.max(0, Number(config.nicotineMgPerCig) || defaults.nicotineMgPerCig),
    tarMgPerCig: Math.max(0, Number(config.tarMgPerCig) || defaults.tarMgPerCig),
    smokingYears: Math.max(0, Number(config.smokingYears) || defaults.smokingYears),
    age: Math.max(1, Number(config.age) || defaults.age)
  };
}
