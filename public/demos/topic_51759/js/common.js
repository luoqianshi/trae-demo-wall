/* ============================================================
   咕噜噜 GULULU — 公共 JS（共享状态、导航、主题、Toast、Loader）
   ============================================================ */
'use strict';

// ===== 全局状态 =====
window.appState = {
  theme: localStorage.getItem('gululu_theme') || 'light',
  // 大师召唤
  selectedChef: '',
  cookMode: 'master',
  ingrMode: 'library',
  ingrCat: 'meat',
  selectedIngredients: new Set(),
  fridgeCat: 'meat',
  selectedFridgeItems: new Set(),
  // 排面拉满
  tableMode: 'fixed',
  tableDishCount: 6,
  tableCustomDishes: [],
  tableTastes: new Set(),
  tableStyle: '',
  tableScene: '',
};

// ===== 页面导航 =====
function navigateTo(pageName) {
  const pageMap = {
    'index': 'index.html',
    'discover': 'discover.html',
    'identify': 'identify.html',
    'kitchen': 'kitchen.html',
    'mine': 'mine.html',
    'cook': 'kitchen.html?sub=cook',
    'fridge': 'kitchen.html?sub=fridge',
    'sauce': 'kitchen.html?sub=sauce',
    'fortune': 'kitchen.html?sub=fortune',
    'table': 'kitchen.html?sub=table',
    'classroom': 'kitchen.html?sub=classroom',
    'rank': 'discover.html?sub=rank',
    'knowledge': 'discover.html?sub=knowledge',
    'community': 'discover.html?sub=community',
    'diet': 'mine.html?sub=diet',
    'achievement': 'mine.html?sub=achievement',
    'favorites': 'mine.html?sub=favorites',
    'menus': 'mine.html?sub=menus',
    'plan': 'mine.html?sub=plan',
    'settings': 'mine.html?sub=settings',
  };
  const url = pageMap[pageName];
  if (url) {
    window.location.href = url;
  }
}

// ===== Toast =====
function showToast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast hidden';
    const container = document.querySelector('.phone-screen') || document.body;
    container.appendChild(el);
  }
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add('hidden'), 2000);
}

// ===== 主题切换 =====
function toggleTheme() {
  const s = window.appState;
  s.theme = s.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('gululu_theme', s.theme);
  applyTheme();
}

function applyTheme() {
  const s = window.appState;
  const html = document.documentElement;
  const btn = document.getElementById('themeBtn');

  if (s.theme === 'dark') {
    html.setAttribute('data-theme', 'dark');
    html.style.setProperty('--bg-canvas', '#11100F');
    html.style.setProperty('--bg-surface', '#1C1A18');
    html.style.setProperty('--bg-subtle', '#252321');
    html.style.setProperty('--bg-brandSoft', '#2D2018');
    html.style.setProperty('--bg-goldSoft', '#2D2618');
    html.style.setProperty('--text-primary', '#EBE5DF');
    html.style.setProperty('--text-secondary', '#9E948B');
    html.style.setProperty('--text-tertiary', '#706860');
    html.style.setProperty('--glass-bg', 'rgba(28,26,24,0.80)');
    html.style.setProperty('--glass-border', 'rgba(255,255,255,0.08)');
    html.style.setProperty('--action-secondary-bg', '#2D2618');
    html.style.setProperty('--action-secondary-text', '#D9A52E');
    html.style.setProperty('--action-secondary-border', '#4D3C18');
    if (btn) btn.textContent = '☀️';
  } else {
    html.setAttribute('data-theme', 'light');
    html.style.setProperty('--bg-canvas', '#FBFAF8');
    html.style.setProperty('--bg-surface', '#FFFFFF');
    html.style.setProperty('--bg-subtle', '#F6F3EF');
    html.style.setProperty('--bg-brandSoft', '#FFF4EC');
    html.style.setProperty('--bg-goldSoft', '#FFF9E8');
    html.style.setProperty('--text-primary', '#211F1D');
    html.style.setProperty('--text-secondary', '#6F6761');
    html.style.setProperty('--text-tertiary', '#91877F');
    html.style.setProperty('--glass-bg', 'rgba(255,255,255,0.72)');
    html.style.setProperty('--glass-border', 'rgba(255,255,255,0.55)');
    html.style.setProperty('--action-secondary-bg', '#FFF9E8');
    html.style.setProperty('--action-secondary-text', '#8B6914');
    html.style.setProperty('--action-secondary-border', '#F0DFB8');
    if (btn) btn.textContent = '🌙';
  }
}

// ===== Cooking Loader =====
function showCookingLoader(show) {
  let overlay = document.getElementById('cookingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cookingOverlay';
    overlay.className = 'cooking-overlay hidden';
    overlay.innerHTML = `
      <div class="cooking-card">
        <div class="cooking-loader__icon">👨‍🍳</div>
        <div class="cooking-loader__title">大厨正在施法中...</div>
        <div class="cooking-loader__text" id="cookingText">掏出锅铲...</div>
        <div class="cooking-progress">
          <div class="cooking-progress__bar" id="cookingProgress"></div>
        </div>
      </div>
    `;
    const container = document.querySelector('.phone-screen') || document.body;
    container.appendChild(overlay);
  }
  overlay.classList.toggle('hidden', !show);
  if (show) {
    const texts = ['掏出锅铲...', '切菜剁肉...', '颠勺中...', '灵魂调味...', '装盘出品...'];
    let i = 0;
    const progressBar = document.getElementById('cookingProgress');
    progressBar.style.width = '0%';
    const textEl = document.getElementById('cookingText');
    const interval = setInterval(() => {
      textEl.textContent = texts[i % texts.length];
      progressBar.style.width = `${(i + 1) * 20}%`;
      i++;
      if (document.getElementById('cookingOverlay').classList.contains('hidden')) {
        clearInterval(interval);
      }
    }, 800);
    overlay._interval = interval;
  } else {
    if (overlay._interval) clearInterval(overlay._interval);
  }
}

// ===== 食谱弹窗 =====
function showRecipeModal(dishName) {
  let modal = document.getElementById('recipeModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'recipeModal';
    modal.className = 'recipe-modal hidden';
    modal.innerHTML = `
      <div class="recipe-modal__mask" onclick="closeRecipeModal()"></div>
      <div class="recipe-modal__sheet">
        <div class="recipe-modal__header">
          <span class="recipe-modal__title" id="recipeModalTitle">菜谱详情</span>
          <button class="recipe-modal__close" onclick="closeRecipeModal()">✕</button>
        </div>
        <div class="recipe-modal__body" id="recipeModalBody"></div>
      </div>
    `;
    const container = document.querySelector('.phone-screen') || document.body;
    container.appendChild(modal);
  }
  modal.classList.remove('hidden');
  document.getElementById('recipeModalTitle').textContent = dishName;

  const body = document.getElementById('recipeModalBody');
  body.innerHTML = `
    <div class="recipe-section">
      <div class="recipe-section__title">🥬 食材</div>
      <div class="recipe-ingredients">
        <span class="recipe-ingredient">主料 500g</span>
        <span class="recipe-ingredient">姜 3片</span>
        <span class="recipe-ingredient">蒜 3瓣</span>
        <span class="recipe-ingredient">葱 2根</span>
        <span class="recipe-ingredient">生抽 2勺</span>
        <span class="recipe-ingredient">料酒 1勺</span>
        <span class="recipe-ingredient">盐 适量</span>
        <span class="recipe-ingredient">糖 1小勺</span>
      </div>
    </div>
    <div class="recipe-section">
      <div class="recipe-section__title">👨‍🍳 烹饪步骤</div>
      <div class="recipe-steps">
        <div class="recipe-step"><div class="recipe-step__num">1</div><div class="recipe-step__text">主料清洗干净，切成适口大小</div></div>
        <div class="recipe-step"><div class="recipe-step__num">2</div><div class="recipe-step__text">姜切片，蒜切末，葱切段</div></div>
        <div class="recipe-step"><div class="recipe-step__num">3</div><div class="recipe-step__text">热锅凉油，放入姜蒜爆香</div></div>
        <div class="recipe-step"><div class="recipe-step__num">4</div><div class="recipe-step__text">加入主料炒至变色，烹入料酒</div></div>
        <div class="recipe-step"><div class="recipe-step__num">5</div><div class="recipe-step__text">加生抽、糖和适量水，中小火炖煮10-15分钟</div></div>
        <div class="recipe-step"><div class="recipe-step__num">6</div><div class="recipe-step__text">大火收汁，撒葱花出锅</div></div>
      </div>
    </div>
    <div class="recipe-section">
      <div class="recipe-section__title">💡 烹饪技巧</div>
      <p>• 火候是关键：大火爆香，中小火慢炖，最后大火收汁</p>
      <p>• 出锅前尝味，微调咸淡</p>
      <p>• 可以加入时蔬增加营养和色彩</p>
    </div>
  `;
}

function closeRecipeModal() {
  const modal = document.getElementById('recipeModal');
  if (modal) modal.classList.add('hidden');
}

// ===== 工具函数 =====
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== 初始化主题 =====
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
});
