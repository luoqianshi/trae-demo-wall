/**
 * App Entry Point
 * Single Page Application router and page initialization
 * All page transitions handled via DOM show/hide (no actual navigation)
 */

// Built-in cigarette brand list
const CIGARETTE_BRANDS = [
  { id: 'custom',   name: '自定义' },
  { id: '中华',     name: 'China (Zhonghua) / 中华' },
  { id: '芙蓉王',   name: 'Furongwang / 芙蓉王' },
  { id: '利群',     name: 'Li Qun / 利群' },
  { id: '玉溪',     name: 'Yu Xi / 玉溪' },
  { id: '云烟',     name: 'Yunyan / 云烟' },
  { id: '黄鹤楼',   name: 'Huanghelou / 黄鹤楼' },
  { id: '南京',     name: 'Nanjing / 南京' },
  { id: '红塔山',   name: 'Hongtashan / 红塔山' },
  { id: '红双喜',   name: 'Double Happiness / 红双喜' }
];

// Brand default nicotine/tar values (mg per cigarette)
const BRAND_DEFAULTS = {
  '中华':     { nicotine: 1.0, tar: 12 },
  '芙蓉王':   { nicotine: 1.0, tar: 11 },
  '利群':     { nicotine: 0.8, tar: 10 },
  '玉溪':     { nicotine: 0.8, tar: 10 },
  '云烟':     { nicotine: 0.9, tar: 11 },
  '黄鹤楼':   { nicotine: 0.8, tar: 9  },
  '南京':     { nicotine: 0.8, tar: 11 },
  '红塔山':   { nicotine: 0.8, tar: 10 },
  '红双喜':   { nicotine: 0.9, tar: 10 }
};

/**
 * Router: show a specific page and hide others
 * @param {string} pageId - ID of page to show
 */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.style.display = page.id === pageId ? 'flex' : 'none';
  });
  // Scroll to top on page switch
  window.scrollTo(0, 0);
}

/**
 * Initialize welcome page event listeners
 */
function initWelcomePage() {
  const startBtn = document.getElementById('btn-start');
  if (!startBtn) return;

  startBtn.addEventListener('click', () => {
    if (hasUserConfig()) {
      showPage('page-stats');
      renderStatsPage();
    } else {
      showPage('page-entry');
      renderEntryPage();
    }
  });
}

/**
 * Render entry page form with current config values
 */
function renderEntryPage() {
  const config = getUserConfig();
  const form = document.getElementById('form-entry');
  if (!form) return;

  // Populate form fields
  document.getElementById('gender-' + (config.gender || 'male')).checked = true;
  document.getElementById('input-age').value = config.age || 30;
  document.getElementById('input-smoking-years').value = config.smokingYears || 5;
  document.getElementById('input-daily').value = config.dailyCigarettes || 20;
  document.getElementById('input-price').value = config.pricePerPack || 25;
  document.getElementById('input-nicotine').value = config.nicotineMgPerCig || 1.0;
  document.getElementById('input-tar').value = config.tarMgPerCig || 10;

  // Populate brand dropdown
  const brandSelect = document.getElementById('select-brand');
  if (brandSelect) {
    brandSelect.innerHTML = CIGARETTE_BRANDS.map(b =>
      `<option value="${b.id}" ${config.brand === b.id ? 'selected' : ''}>${b.name}</option>`
    ).join('');
    brandSelect.addEventListener('change', onBrandChange);
    onBrandChange(); // Apply brand defaults if not custom
  }
}

/**
 * Handle brand selection change
 * Auto-fill nicotine/tar defaults when a preset brand is selected
 */
function onBrandChange() {
  const brandSelect = document.getElementById('select-brand');
  if (!brandSelect) return;
  const brand = brandSelect.value;
  const defaults = BRAND_DEFAULTS[brand];
  if (defaults) {
    document.getElementById('input-nicotine').value = defaults.nicotine;
    document.getElementById('input-tar').value = defaults.tar;
  }
}

/**
 * Validate form input values
 * @returns {boolean} true if all values are valid
 */
function validateEntryForm() {
  const daily = parseInt(document.getElementById('input-daily')?.value || 0);
  const price = parseFloat(document.getElementById('input-price')?.value || 0);
  const nicotine = parseFloat(document.getElementById('input-nicotine')?.value || 0);
  const tar = parseFloat(document.getElementById('input-tar')?.value || 0);
  const age = parseInt(document.getElementById('input-age')?.value || 0);
  const smokingYears = parseInt(document.getElementById('input-smoking-years')?.value || 0);

  if (daily < 0 || price <= 0 || nicotine < 0 || tar < 0) {
    alert('Please fill in all values correctly. Price must be greater than 0.');
    return false;
  }
  if (age <= 0 || age > 120 || smokingYears < 0 || smokingYears > age) {
    alert('Please enter a valid age and smoking duration.');
    return false;
  }
  return true;
}

/**
 * Handle entry form submission
 */
function handleEntrySubmit(e) {
  e.preventDefault();
  if (!validateEntryForm()) return;

  // Get existing config to preserve firstRecordedAt if already set
  const existingConfig = getUserConfig();

  const config = {
    gender: document.querySelector('input[name="gender"]:checked')?.value || 'male',
    age: parseInt(document.getElementById('input-age')?.value || 30),
    smokingYears: parseInt(document.getElementById('input-smoking-years')?.value || 5),
    dailyCigarettes: parseInt(document.getElementById('input-daily')?.value || 20),
    pricePerPack: parseFloat(document.getElementById('input-price')?.value || 25),
    cigarettesPerPack: 20,
    nicotineMgPerCig: parseFloat(document.getElementById('input-nicotine')?.value || 1.0),
    tarMgPerCig: parseFloat(document.getElementById('input-tar')?.value || 10),
    brand: document.getElementById('select-brand')?.value || '自定义',
    brandName: CIGARETTE_BRANDS.find(b => b.id === document.getElementById('select-brand')?.value)?.name || '自定义',
    // Preserve existing firstRecordedAt, or set to current time if not set
    firstRecordedAt: existingConfig.firstRecordedAt || new Date().toISOString()
  };

  saveUserConfig(config);
  showPage('page-stats');
  renderStatsPage();
}

/**
 * Render statistics page with calculated data
 */
function renderStatsPage() {
  const config = validateConfig(getUserConfig());
  const safeConfig = validateConfig(config);

  const dailyCost = calculateDailyCost(safeConfig);
  const dailyNicotine = calculateDailyNicotine(safeConfig);
  const dailyTar = calculateDailyTar(safeConfig);
  const monthlyCost = calculateMonthlyCost(safeConfig);
  const yearlyCost = calculateYearlyCost(safeConfig);
  const totalCost = calculateTotalAccumulatedCost(safeConfig);
  const dailyItems = calculateDailyItemConversion(dailyCost);

  // Inject values into DOM
  setText('stat-daily-cost', `¥${dailyCost.toFixed(2)}`);
  setText('stat-daily-nicotine', `${dailyNicotine.toFixed(2)} mg`);
  setText('stat-daily-tar', `${dailyTar.toFixed(2)} mg`);
  setText('stat-monthly-cost', `¥${monthlyCost.toFixed(2)}`);
  setText('stat-yearly-cost', `¥${yearlyCost.toFixed(2)}`);
  setText('stat-total-cost', `¥${totalCost.toFixed(2)}`);
  setText('stat-daily-pack-equiv', `${(dailyCost / safeConfig.pricePerPack).toFixed(2)} packs`);

  // Render life item cards
  renderLifeItemCards(dailyItems);

  // Update disclaimer with user-specific info
  const disclaimer = document.getElementById('stats-disclaimer');
  if (disclaimer) {
    disclaimer.innerHTML = `
      <p class="disclaimer-note">
        ${safeConfig.brandName} · ${safeConfig.dailyCigarettes} cigarettes/day · ${safeConfig.age}y/o · ${safeConfig.smokingYears}y smoking history
      </p>
      <p>长期吸烟会显著增加健康风险，本页仅做生活成本提醒；所有健康相关数据均为估算值，不构成医学建议。</p>
    `;
  }
}

/**
 * Render life item conversion cards
 * @param {Array} items - sorted item list with quantity
 */
function renderLifeItemCards(items) {
  const container = document.getElementById('life-items-container');
  if (!container) return;

  container.innerHTML = items.slice(0, 4).map(item => `
    <div class="life-card">
      <span class="life-emoji">${item.emoji}</span>
      <div class="life-info">
        <div class="life-name">${item.name}</div>
        <div class="life-qty">≈ ${item.quantity.toFixed(1)} ×</div>
        <div class="life-price">¥${item.price}/ ${item.unit}</div>
      </div>
    </div>
  `).join('');
}

/**
 * Render long-term quit benefits page
 */
function renderQuitPage() {
  const config = validateConfig(getUserConfig());
  const weeklySavings = calculateWeeklyCost(config);
  const monthlySavings = calculateMonthlyCost(config);
  const yearlySavings = calculateYearlyCost(config);

  setText('quit-weekly', `¥${weeklySavings.toFixed(2)}`);
  setText('quit-monthly', `¥${monthlySavings.toFixed(2)}`);
  setText('quit-yearly', `¥${yearlySavings.toFixed(2)}`);

  const sloganEl = document.getElementById('quit-slogan');
  if (sloganEl) {
    sloganEl.textContent = getRandomQuitSlogan();
  }

  // Top 3 items for yearly savings
  const yearlyItems = calculateYearlyItemConversion(yearlySavings);
  const container = document.getElementById('quit-items-container');
  if (container) {
    container.innerHTML = yearlyItems.slice(0, 3).map(item => `
      <div class="quit-item-card">
        <span class="life-emoji">${item.emoji}</span>
        <div class="life-name">${item.name}</div>
        <div class="life-qty">≈ ${item.quantity.toFixed(1)} × / year</div>
      </div>
    `).join('');
  }
}

/**
 * Render share poster page
 */
function renderSharePage() {
  const config = validateConfig(getUserConfig());
  const nickname = document.getElementById('input-nickname')?.value?.trim() || '';
  const dailyCost = calculateDailyCost(config);
  const monthlyCost = calculateMonthlyCost(config);

  const shareData = {
    nickname: nickname || 'Anonymous',
    dailyCost: dailyCost.toFixed(2),
    monthlyCost: monthlyCost.toFixed(2),
    cigarettesPerDay: config.dailyCigarettes,
    brandName: config.brandName
  };

  // Update poster display
  setText('poster-nickname', shareData.nickname);
  setText('poster-daily-cost', `¥${shareData.dailyCost}`);
  setText('poster-monthly-cost', `¥${shareData.monthlyCost}`);
  setText('poster-brand', shareData.brandName);
  setText('poster-cigs', `${shareData.cigarettesPerDay} sticks/day`);
  setText('poster-date', new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }));

  // Pick a random slogan for poster
  const slogans = [
    '少抽一包，就是给未来的自己买一次呼吸。',
    "Less smoke, more life to live.",
    "Every cigarette not smoked is a quiet victory.",
    "The money saved could be a gift for your future self.",
    "Smoke less, save for something that lasts."
  ];
  setText('poster-slogan', slogans[Math.floor(Math.random() * slogans.length)]);
}

/**
 * Utility: set text content of an element by ID
 * @param {string} id - element ID
 * @param {string} text - text content
 */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/**
 * Initialize navigation buttons
 */
function initNav() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target === 'page-stats') renderStatsPage();
      if (target === 'page-quit') renderQuitPage();
      if (target === 'page-share') renderSharePage();
      showPage(target);
    });
  });

  // Entry form submit
  const form = document.getElementById('form-entry');
  if (form) {
    form.addEventListener('submit', handleEntrySubmit);
  }

  // Share page generate
  const shareBtn = document.getElementById('btn-generate-share');
  if (shareBtn) {
    shareBtn.addEventListener('click', renderSharePage);
  }

  // Back to stats from entry
  const backBtn = document.getElementById('btn-back-to-stats');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (hasUserConfig()) {
        showPage('page-stats');
        renderStatsPage();
      }
    });
  }

  // Reset / re-enter data
  const resetBtn = document.getElementById('btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all data? This cannot be undone.')) {
        resetUserConfig();
        showPage('page-entry');
        renderEntryPage();
      }
    });
  }
}

/**
 * Bootstrap: detect first run and show appropriate page
 */
function bootstrap() {
  initWelcomePage();
  initNav();

  if (hasUserConfig()) {
    showPage('page-stats');
    renderStatsPage();
  } else {
    showPage('page-welcome');
  }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', bootstrap);

