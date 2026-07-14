// ============================================
// P1 首页逻辑
// ============================================

function selectSeg(btn) {
  const group = btn.closest('.seg-group');
  const groupName = group.dataset.group;
  group.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  let value = btn.dataset.value;
  
  currentParams[groupName] = value;
  
  // 特殊映射
  if (groupName === 'weather') {
    if (value === 'indoor') {
      currentParams.indoors = true;
    } else if (value === 'sunny') {
      currentParams.indoors = false;
    } else if (value === 'cloudy') {
      currentParams.indoors = true;
    } else {
      currentParams.indoors = undefined;
    }
  }
}

function useQuickCmd(text, btn) {
  document.getElementById('p1-input').value = text;

  // 给被点击的按钮添加选中态视觉反馈
  if (btn) {
    document.querySelectorAll('.quick-cmd-btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
  }

  // 聚焦输入框，方便用户继续输入
  document.getElementById('p1-input').focus();
}

function handleStartPlanning() {
  const input = document.getElementById('p1-input').value;
  if (input) {
    extractParamsFromInput(input);
  }

  // 重置权重
  resetWeights();

  // 设置加载状态标志（必须在switchTab之前，防止干扰）
  window.isLoadingRecommendations = true;

  // 切换到推荐页（必须先切换，让页面元素变为active）
  switchTab('recommend');

  // 显示加载状态（页面切换后才能操作元素）
  showLoadingState();

  // 运行加载动画并获取 AI 推荐
  runLoadingAnimation(input);
}

function extractParamsFromInput(input) {
  const keywordMap = {
    '室内': { indoors: true },
    '户外': { indoors: false },
    '外面': { indoors: false },
    '活动': { type: 'activity' },
    '展览': { type: 'exhibition' },
    '看展': { type: 'exhibition' },
    '采摘': { type: 'picking' },
    '人少': { crowd: 'low' },
    '安静': { crowd: 'low' },
    '不挤': { crowd: 'low' },
    '近': { distance: 'short' },
    '不远': { distance: 'short' },
    '推车': { stroller: true },
    '婴儿车': { stroller: true },
    '半天': { duration: 'half' },
    '一天': { duration: 'full' },
    '全天': { duration: 'full' },
    '感冒': { health: 'recovering' },
    '生病': { health: 'recovering' },
    '刚好': { health: 'recovering' }
  };

  for (let [keyword, setting] of Object.entries(keywordMap)) {
    if (input.includes(keyword)) {
      Object.assign(currentParams, setting);
    }
  }
}

// ============================================
// AI 配置隐藏入口（连续点击 logo 5 次）
// ============================================
let logoClickCount = 0;
let logoClickTimer = null;

function handleLogoClick() {
  logoClickCount++;

  if (logoClickTimer) clearTimeout(logoClickTimer);
  logoClickTimer = setTimeout(() => {
    logoClickCount = 0;
  }, 2000);

  if (logoClickCount >= 5) {
    logoClickCount = 0;
    openAIConfig();
  }
}

// ============================================
// 输入框状态控制
// ============================================
function initInputState() {
  const input = document.getElementById('p1-input');
  const btn = document.getElementById('p1-submit-btn');
  
  if (!input || !btn) return;

  const updateBtnState = () => {
    if (input.value.trim().length > 0) {
      btn.disabled = false;
      btn.classList.remove('disabled');
    } else {
      btn.disabled = true;
      btn.classList.add('disabled');
    }
  };

  input.addEventListener('input', updateBtnState);
  input.addEventListener('paste', updateBtnState);
  
  updateBtnState();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInputState);
} else {
  initInputState();
}

function openAIConfig() {
  const modal = document.getElementById('ai-config-modal');
  if (!modal) return;

  const config = getAIConfig();
  const enabledEl = document.getElementById('ai-config-enabled');
  const keyEl = document.getElementById('ai-config-key');

  if (enabledEl) enabledEl.checked = config.enabled;
  if (keyEl) keyEl.value = config.apiKey || '';

  modal.style.display = 'flex';
}

function closeAIConfig() {
  const modal = document.getElementById('ai-config-modal');
  if (modal) modal.style.display = 'none';
}

function saveAIConfigFromUI() {
  const enabledEl = document.getElementById('ai-config-enabled');
  const keyEl = document.getElementById('ai-config-key');

  const config = {
    enabled: enabledEl ? enabledEl.checked : true,
    apiKey: keyEl ? keyEl.value.trim() : ''
  };

  saveAIConfig(config);
  closeAIConfig();
  showToast('AI 配置已保存');
}

// 初始化默认 API Key（仅在本地未配置时写入）
if (typeof setDefaultApiKeyIfEmpty === 'function') {
  setDefaultApiKeyIfEmpty('sk-YOUR_API_KEY_HERE');
}
