// ============================================
// 状态管理
// ============================================

let currentParams = {
  age: '3-6',
  weather: 'any',
  transport: 'drive',
  duration: 'half',
  indoors: undefined,
  type: undefined,
  crowd: undefined,
  distance: undefined,
  stroller: true
};

let weights = {
  outdoor: 0,
  activity: 0,
  indoor: 0,
  exhibition: 0,
  picking: 0,
  water: 0,
  crowd: 0
};

let currentRecommendations = [];
let selectedDestination = null;
let currentTab = 'home';
let recPage = 1;

let profile = {
  babyName: '荔枝',
  ageGroup: '3-6',
  gender: '',
  interests: ['动物', '自然'],
  allergies: [],
  preferredDuration: 'half',
  transport: 'drive',
  needsStroller: true,
  preferredTime: 'morning',
  maxDistance: 60,
  stats: {
    totalTrips: 0,
    outdoorRatio: 0,
    likedTypes: [],
    dislikedTypes: [],
    avgDuration: 'half',
    timePreference: 'morning'
  }
};

// ============================================
// 全局错误边界
// ============================================
window.addEventListener('error', function(e) {
  console.error('KidGo error:', e.error || e.message);
  const msg = '系统遇到了一点小问题，请刷新页面重试';
  if (typeof showMessage === 'function') {
    try { showMessage('error', 'error'); } catch (_) {}
  } else if (typeof showToast === 'function') {
    try { showToast(msg, 'error'); } catch (_) {}
  } else {
    // 最基础兜底：alert
    try { alert(msg); } catch (_) {}
  }
});

// ============================================
// 初始化
// ============================================
function init() {
  // 初始化 store（从 localStorage 加载用户数据）
  store.init({
    collections: collections,
    records: records,
    weights: weights,
    params: currentParams,
    tab: 'home'
  });

  // 恢复持久化数据到全局变量（兼容现有代码）
  collections = store.get('collections');
  records = store.get('records');
  weights = store.get('weights');
  profile = store.get('profile') || profile;

  // 初始化 AI 配置（如本地无配置则使用默认 Key）
  if (typeof setDefaultApiKeyIfEmpty === 'function') {
    setDefaultApiKeyIfEmpty('sk-YOUR_API_KEY_HERE');
  }

  renderCollectionList();
  renderTimeline();
  if (typeof renderArchivePage === 'function') {
    renderArchivePage();
  }
  updateCollectionCount();
  updateParamTags();
  refreshIcons();
}

document.addEventListener('DOMContentLoaded', init);
