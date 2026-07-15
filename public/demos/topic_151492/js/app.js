let currentStep = 1;
const totalSteps = 4;

// SVG图标定义 - 扁平化风格
const iconSVGs = {
  // 导航图标
  home: '<svg viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
  templates: '<svg viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
  customize: '<svg viewBox="0 0 24 24"><path d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/></svg>',
  profile: '<svg viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
  user: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>',
  search: '<svg viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>',
  wallet: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>',
  abacus: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 12h18"/><path d="M7 4v16M12 4v16M17 4v16"/><circle cx="7" cy="7.5" r="1.2"/><circle cx="7" cy="10" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="12" cy="10" r="1.2"/><circle cx="17" cy="7.5" r="1.2"/><circle cx="17" cy="10" r="1.2"/><circle cx="7" cy="14.5" r="1.2"/><circle cx="7" cy="17" r="1.2"/><circle cx="12" cy="14.5" r="1.2"/><circle cx="12" cy="17" r="1.2"/><circle cx="17" cy="14.5" r="1.2"/><circle cx="17" cy="17" r="1.2"/></svg>',
  fire: '<svg viewBox="0 0 24 24"><path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.987-6C12 7 16 9 17 14c1-1 2-2 2.657-2.343a8 8 0 01-2 7z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>',
  clipboard: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>',
  bolt: '<svg viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>',
  // 活动类型图标
  celebration: '<svg viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  heart2: '<svg viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>',
  microphone: '<svg viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>',
  users: '<svg viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
  tent: '<svg viewBox="0 0 24 24"><path d="M3 21l6-6m0 0l6 6m-6-6v6m12-6l-6-9-6 9h12z"/></svg>',
  cake: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8a4 4 0 00-8 0M21 15H3c0-4 4-7 9-7s9 3 9 7z"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
  film: '<svg viewBox="0 0 24 24"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  messageCircle: '<svg viewBox="0 0 24 24"><path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.399.35.037.67.21.865.501L12 20.25l2.75-4.125a1.125 1.125 0 01.865-.501c1.153-.106 2.294-.233 3.423-.399 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.178-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>',
  moreHorizontal: '<svg viewBox="0 0 24 24"><path d="M6 12a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0zm-6 0a2 2 0 11-4 0 2 2 0 014 0z"/></svg>',
  // 预算分类图标
  building: '<svg viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-4 0H5m4 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
  utensils: '<svg viewBox="0 0 24 24"><path d="M3 3v18h18M9 17V9m0 0c1.5-1.5 3-1.5 4.5 0M9 9c1.5-1.5 3-1.5 4.5 0V17"/></svg>',
  palette: '<svg viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 14a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 14a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>',
  music: '<svg viewBox="0 0 24 24"><path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>',
  box: '<svg viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
  gift: '<svg viewBox="0 0 24 24"><path d="M12 8v13m0-13H5v13h7m0-13h7v13h-7m0-13V5a2 2 0 00-2-2H7a2 2 0 00-2 2v3h7m0 0h7V5a2 2 0 00-2-2h-3a2 2 0 00-2 2v3"/></svg>',
  car: '<svg viewBox="0 0 24 24"><path d="M8 17h8M8 17a4 4 0 01-4-4V9a2 2 0 012-2h12a2 2 0 012 2v4a4 4 0 01-4 4M8 17v2a2 2 0 002 2h4a2 2 0 002-2v-2M6 9h12"/></svg>',
  // 其他图标
  star: '<svg viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.872a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.872a1 1 0 00-1.176 0l-3.976 2.872c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.872c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>',
  arrowLeft: '<svg viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
  filter: '<svg viewBox="0 0 24 24"><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>',
  target: '<svg viewBox="0 0 24 24"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 18a6 6 0 100-12 6 6 0 000 12z"/><path d="M12 14a2 2 0 100-4 2 2 0 000 4z"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  file: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>',
  presentation: '<svg viewBox="0 0 24 24"><path d="M3 4h18M4 4v10a2 2 0 002 2h12a2 2 0 002-2V4M2 20h20M9 16v4M15 16v4M10 11l2-2 2 2 3-3"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
  cloud: '<svg viewBox="0 0 24 24"><path d="M7 18a4 4 0 01-.883-7.903A5 5 0 1115.71 8.861 4.5 4.5 0 0117 18H7z"/><path d="M9 14l2 2 4-4"/></svg>'
};

// 生成图标HTML
function getIcon(type, size = '') {
  const svg = iconSVGs[type] || iconSVGs.wallet;
  const sizeClass = size ? `icon-${size}` : '';
  return `<span class="icon ${sizeClass}">${svg}</span>`;
}

// 初始化页面中所有data-icon属性的图标
function initIcons() {
  document.querySelectorAll('[data-icon]').forEach(el => {
    const iconType = el.getAttribute('data-icon');
    const svg = iconSVGs[iconType] || iconSVGs.wallet;
    el.innerHTML = svg;
  });
}

let wizardData = {
  activityType: '',
  activityTypeName: '',
  peopleCount: 50,
  budgetLimit: 50000,
  planName: '',
  categories: {},
  customCategories: [],
  percentages: {}
};

const categoryColors = {
  venue: '#0D9488',
  catering: '#C87941',
  decoration: '#D97706',
  performance: '#7C3AED',
  materials: '#0891B2',
  gifts: '#059669',
  transport: '#DC2626',
  contingency: '#6B7280'
};

function formatMoney(amount) {
  return '¥' + amount.toLocaleString('zh-CN');
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('open');
  }
}

function updateSidebarBudget(value) {
  const el = document.getElementById('budgetValue');
  if (el) {
    el.textContent = formatMoney(parseInt(value));
  }
}

function renderHomePage() {
  initWelcomeScreen();
  initIcons();
  updateHeaderUserArea();
  renderCategoryChips();
  renderFeaturedTemplates();
}

function renderTopCategoryNav() {
  const nav = document.getElementById('topCategoryNav');
  if (!nav) return;

  nav.innerHTML = `
    <div class="category-nav-item active" onclick="filterTopCategory(this, 'all')">
      ${getIcon('fire')}
      <span>全部</span>
    </div>
  ` + activityTypes.map(type => `
    <div class="category-nav-item" onclick="filterTopCategory(this, '${type.id}')">
      ${getIcon(type.iconType)}
      <span>${type.name}</span>
    </div>
  `).join('');
}

function filterTopCategory(el, typeId) {
  document.querySelectorAll('.category-nav-item').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  if (typeId === 'all') {
    renderFeaturedTemplatesAll();
  } else {
    renderFeaturedTemplatesByType(typeId);
  }
}

function renderCategoryChips() {
  const container = document.getElementById('categoryChipScroll');
  if (!container) return;

  container.innerHTML = `
    <div class="category-chip active" onclick="filterCategoryChip(this, 'all')">
      <span class="category-chip-icon">${getIcon('fire')}</span>
      <span>全部</span>
    </div>
  ` + activityTypes.map(type => `
    <div class="category-chip" onclick="filterCategoryChip(this, '${type.id}')">
      <span class="category-chip-icon">${getIcon(type.iconType)}</span>
      <span>${type.name}</span>
    </div>
  `).join('');
}

function filterCategoryChip(el, typeId) {
  document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  if (typeId === 'all') {
    renderFeaturedTemplatesAll();
  } else {
    renderFeaturedTemplatesByType(typeId);
  }
}

function renderFeaturedTemplatesAll() {
  const grid = document.getElementById('featuredTemplates');
  if (!grid) return;
  const featured = budgetTemplates.slice(0, 4);
  grid.innerHTML = featured.map(template => createTemplateCard(template)).join('');
}

function renderFeaturedTemplatesByType(typeId) {
  const grid = document.getElementById('featuredTemplates');
  if (!grid) return;
  const filtered = budgetTemplates.filter(t => t.type === typeId).slice(0, 4);
  if (filtered.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">暂无该类型的方案</div>';
    return;
  }
  grid.innerHTML = filtered.map(template => createTemplateCard(template)).join('');
}

function goToTemplatesByType(typeId) {
  window.location.href = `templates.html?type=${typeId}`;
}

function renderFeaturedTemplates() {
  const grid = document.getElementById('featuredTemplates');
  if (!grid) return;
  const featured = budgetTemplates.slice(0, 4);
  grid.innerHTML = featured.map(template => createTemplateCard(template)).join('');
}

function createTemplateCard(template) {
  const avgBudget = Math.round((template.budgetMin + template.budgetMax) / 2);
  return `
    <div class="template-card" onclick="goToDetail(${template.id})">
      <div class="template-cover">
        <img src="${template.cover}" alt="${template.name}" loading="lazy">
      </div>
      <div class="template-info">
        <div class="template-name">${template.name}</div>
        <div class="template-subtitle">${template.typeName} · ${template.peopleMin}-${template.peopleMax}人</div>
        <div class="template-footer">
          <div class="template-price"><sup>¥</sup>${(avgBudget / 10000).toFixed(1)}万</div>
          <button class="quick-view-btn" onclick="event.stopPropagation(); goToDetail(${template.id})">查看详情</button>
        </div>
      </div>
    </div>
  `;
}

function getCategoryIcon(typeId) {
  const type = activityTypes.find(t => t.id === typeId);
  return type ? getIcon(type.iconType) : getIcon('clipboard');
}

function goToDetail(id) {
  window.location.href = `detail.html?id=${id}`;
}

function useTemplate(id) {
  window.location.href = `customize.html?template=${id}`;
}

function initTemplatesPage() {
  initIcons();
  updateHeaderUserArea();
  renderTemplatesList();
  bindSearchEvent();
}

function renderTopCategoryNavForTemplates() {
  const nav = document.getElementById('topCategoryNav');
  if (!nav) return;

  nav.innerHTML = `
    <div class="category-nav-item active" data-type="all" onclick="filterTemplatesByType(this, 'all')">
      ${getIcon('fire')}
      <span>全部</span>
    </div>
  ` + activityTypes.map(type => `
    <div class="category-nav-item" data-type="${type.id}" onclick="filterTemplatesByType(this, '${type.id}')">
      ${getIcon(type.iconType)}
      <span>${type.name}</span>
    </div>
  `).join('');
}

function filterTemplatesByType(el, typeId) {
  document.querySelectorAll('.category-nav-item').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderTemplatesList();
}

function filterByBudget(el, value) {
  document.querySelectorAll('#budgetFilterTags .filter-tag').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderTemplatesList();
}

function filterByPeople(el, value) {
  document.querySelectorAll('#peopleFilterTags .filter-tag').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderTemplatesList();
}

function bindSearchEvent() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderTemplatesList();
      }, 300);
    });
  }
}

function getFilteredTemplates() {
  let filtered = [...budgetTemplates];

  const budgetTag = document.querySelector('#budgetFilterTags .filter-tag.active');
  if (budgetTag && budgetTag.dataset.value && budgetTag.dataset.value !== 'all') {
    const value = budgetTag.dataset.value;
    const [min, max] = value.split('-').map(v => {
      if (v.endsWith('+')) return Infinity;
      return parseFloat(v) || 0;
    });
    filtered = filtered.filter(t => {
      const avg = (t.budgetMin + t.budgetMax) / 2;
      return avg >= min && avg <= max;
    });
  }

  const peopleTag = document.querySelector('#peopleFilterTags .filter-tag.active');
  if (peopleTag && peopleTag.dataset.value && peopleTag.dataset.value !== 'all') {
    const value = peopleTag.dataset.value;
    const [min, max] = value.split('-').map(v => {
      if (v.endsWith('+')) return Infinity;
      return parseFloat(v) || 0;
    });
    filtered = filtered.filter(t => {
      return t.peopleMin <= max && t.peopleMax >= min;
    });
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput && searchInput.value.trim()) {
    const keyword = searchInput.value.trim().toLowerCase();
    filtered = filtered.filter(t =>
      t.name.toLowerCase().includes(keyword) ||
      t.description.toLowerCase().includes(keyword) ||
      t.tags.some(tag => tag.toLowerCase().includes(keyword))
    );
  }

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    switch (sortSelect.value) {
      case 'popular':
        filtered.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.budgetMin - b.budgetMin);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.budgetMax - a.budgetMax);
        break;
    }
  }

  return filtered;
}

function renderTemplatesList() {
  const grid = document.getElementById('templatesGrid');
  const countEl = document.getElementById('resultCount');
  if (!grid || !countEl) return;

  const templates = getFilteredTemplates();
  countEl.innerHTML = `共 <strong>${templates.length}</strong> 个方案`;

  if (templates.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1;" class="empty-box">
        <div class="empty-box-icon">${getIcon('search')}</div>
        <div class="empty-box-title">暂无匹配的方案</div>
        <div class="empty-box-desc">试试调整筛选条件或搜索关键词</div>
      </div>
    `;
    return;
  }

  grid.innerHTML = templates.map(template => createTemplateCard(template)).join('');
}

function initDetailPage() {
  initIcons();
  updateHeaderUserArea();
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id') || 1;
  const template = getTemplateById(id);

  if (!template) {
    document.getElementById('detailMain').innerHTML = '<p>方案不存在</p>';
    return;
  }

  const breadcrumb = document.getElementById('breadcrumbName');
  if (breadcrumb) breadcrumb.textContent = template.name;

  renderDetailMain(template);
  renderDetailSidebar(template);
  renderRecommendSidebar(template);
}

function renderTopCategoryNavSimple() {
  const nav = document.getElementById('topCategoryNav');
  if (!nav) return;

  nav.innerHTML = `
    <div class="category-nav-item" onclick="window.location.href='index.html'">
      ${getIcon('home')}
      <span>首页</span>
    </div>
  ` + activityTypes.map(type => `
    <div class="category-nav-item" onclick="window.location.href='templates.html?type=${type.id}'">
      ${getIcon(type.iconType)}
      <span>${type.name}</span>
    </div>
  `).join('');
}

function renderDetailMain(template) {
  const main = document.getElementById('detailMain');
  if (!main) return;

  const totalBudget = template.items.reduce((sum, item) => sum + item.amount, 0);

  main.innerHTML = `
    <div class="detail-hero">
      <div class="detail-cover-large">
        <img src="${template.cover}" alt="${template.name}">
        <div class="detail-cover-overlay">
          <span class="detail-type-badge">${template.typeName}</span>
          <h1 class="detail-title-large">${template.name}</h1>
          <div class="detail-meta-row">
            <span>${getIcon('star')} ${template.rating} 分</span>
            <span>${getIcon('users')} ${template.peopleMin} - ${template.peopleMax} 人</span>
            <span>${getIcon('building')} ${template.industry}</span>
            <span>${getIcon('chart')} ${template.usageCount} 人使用</span>
          </div>
        </div>
      </div>
    </div>

    <div class="detail-main-card">
      <div class="detail-section">
        <h3 class="detail-section-title">${getIcon('edit')} 方案介绍</h3>
        <p class="detail-description-text">${template.description}</p>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">${getIcon('eye')} 适用场景</h3>
        <p class="detail-description-text">${template.suitableFor}</p>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">${getIcon('bolt')} 方案亮点</h3>
        <div class="highlights-grid">
          ${template.highlights.map(h => `<div class="highlight-item">${h}</div>`).join('')}
        </div>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">${getIcon('clipboard')} 预算明细</h3>
        <table class="budget-table">
          <thead>
            <tr>
              <th>预算分类</th>
              <th>项目名称</th>
              <th>金额</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            ${template.items.map(item => {
              const cat = getCategoryById(item.category);
              return `
                <tr>
                  <td>
                    <div class="budget-cat-cell">
                      <div class="budget-cat-icon">${cat ? getIcon(cat.iconType) : getIcon('box')}</div>
                      <span>${cat ? cat.name : '其他'}</span>
                    </div>
                  </td>
                  <td>${item.name}</td>
                  <td class="budget-amount">${formatMoney(item.amount)}</td>
                  <td class="budget-note">${item.note}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderDetailSidebar(template) {
  const sidebar = document.getElementById('detailSidebar');
  if (!sidebar) return;

  const totalBudget = template.items.reduce((sum, item) => sum + item.amount, 0);
  const avgPeople = Math.round((template.peopleMin + template.peopleMax) / 2);
  const perPerson = Math.round(totalBudget / avgPeople);

  const categoryTotals = {};
  template.items.forEach(item => {
    if (!categoryTotals[item.category]) {
      categoryTotals[item.category] = 0;
    }
    categoryTotals[item.category] += item.amount;
  });

  const pieData = Object.entries(categoryTotals).map(([cat, amount]) => ({
    category: cat,
    amount,
    percent: (amount / totalBudget * 100).toFixed(1)
  }));

  sidebar.innerHTML = `
    <div class="summary-card">
      <div class="summary-price-block">
        <div class="summary-price-label">预算总计</div>
        <div class="summary-price"><sup>¥</sup>${(totalBudget / 10000).toFixed(1)}万</div>
      </div>
      <div class="summary-stats">
        <div class="summary-stat-item">
          <div class="summary-stat-value">${avgPeople}</div>
          <div class="summary-stat-label">参与人数</div>
        </div>
        <div class="summary-stat-item">
          <div class="summary-stat-value">${formatMoney(perPerson)}</div>
          <div class="summary-stat-label">人均成本</div>
        </div>
      </div>
      <div class="chart-block">
        <div class="chart-title">预算分类占比</div>
        <div class="pie-chart" style="background: conic-gradient(${pieData.map((d, i) => {
          const color = categoryColors[d.category] || '#6B7280';
          const start = pieData.slice(0, i).reduce((sum, p) => sum + parseFloat(p.percent), 0);
          const end = start + parseFloat(d.percent);
          return `${color} ${start}% ${end}%`;
        }).join(', ')})">
          <div class="pie-chart-center">
            <div class="pie-chart-center-label">共${pieData.length}类</div>
            <div class="pie-chart-center-value">${(totalBudget / 10000).toFixed(1)}万</div>
          </div>
        </div>
        <div class="chart-legend">
          ${pieData.map(d => {
            const cat = getCategoryById(d.category);
            return `
              <div class="legend-item">
                <div class="legend-color" style="background: ${categoryColors[d.category]}"></div>
                <span class="legend-name">${cat ? cat.name : d.category}</span>
                <span class="legend-value">${d.percent}%</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="summary-actions">
        <button class="btn btn-primary" onclick="useTemplate(${template.id})">使用此方案</button>
        <button class="btn btn-secondary" onclick="useTemplate(${template.id})">在此基础上定制</button>
        <button class="btn btn-outline">${getIcon('heart')} 收藏方案</button>
      </div>
    </div>
  `;
}

function renderRecommendSidebar(currentTemplate) {
  const container = document.getElementById('sidebarRecommendList');
  if (!container) return;

  const recommend = budgetTemplates
    .filter(t => t.id !== currentTemplate.id && t.type === currentTemplate.type)
    .slice(0, 3);

  if (recommend.length === 0) {
    const recommend2 = budgetTemplates.filter(t => t.id !== currentTemplate.id).slice(0, 3);
    container.innerHTML = recommend2.map(t => `
      <div class="sidebar-filter-item" onclick="goToDetail(${t.id})">
        ${getIcon('clipboard')}
        <span style="font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.name}</span>
      </div>
    `).join('');
    return;
  }

  container.innerHTML = recommend.map(t => `
    <div class="sidebar-filter-item" onclick="goToDetail(${t.id})">
      <span>${getCategoryIcon(t.type)}</span>
      <span style="font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.name}</span>
    </div>
  `).join('');
}

function getTemplateById(id) {
  return budgetTemplates.find(t => t.id === parseInt(id));
}

function getCategoryById(id) {
  return budgetCategories.find(c => c.id === id) || wizardData.customCategories.find(c => c.id === id);
}

function initCustomizePage() {
  initIcons();
  updateHeaderUserArea();
  renderActivityTypeGrid();
  renderBudgetCategories();
  renderPercentageSliders();
  bindWizardEvents();
  updateBudgetSummary();

  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('template');
  if (templateId) {
    const template = getTemplateById(templateId);
    if (template) {
      prefillFromTemplate(template);
    }
  }
}

function prefillFromTemplate(template) {
  wizardData.activityType = template.type;
  wizardData.activityTypeName = template.typeName;
  wizardData.peopleCount = Math.round((template.peopleMin + template.peopleMax) / 2);
  wizardData.budgetLimit = template.budgetMax;
  wizardData.planName = template.name + '（定制版）';

  // 使用活动类型比例自动分配预算
  autoAllocateBudget();

  document.getElementById('peopleCount').value = wizardData.peopleCount;
  document.getElementById('budgetLimit').value = wizardData.budgetLimit;
  document.getElementById('planName').value = wizardData.planName;

  const typeCards = document.querySelectorAll('.activity-card');
  typeCards.forEach(card => {
    if (card.dataset.type === template.type) {
      card.classList.add('selected');
    }
  });

  updateBudgetSummary();
  renderBudgetCategories();
  renderPercentageSliders();
}

// 根据活动类型和预算上限自动分配各分类预算
function autoAllocateBudget() {
  const ratios = activityBudgetRatios[wizardData.activityType] || {};
  const budgetLimit = wizardData.budgetLimit;
  const peopleCount = wizardData.peopleCount;
  const itemTemplates = activityBudgetItemTemplates[wizardData.activityType] || {};

  wizardData.categories = {};
  budgetCategories.forEach(cat => {
    const percent = ratios[cat.id] || cat.defaultPercent;
    const catAmount = Math.round(budgetLimit * (percent / 100));

    if (itemTemplates[cat.id] && itemTemplates[cat.id].length > 0) {
      wizardData.categories[cat.id] = itemTemplates[cat.id].map(template => {
        const itemAmount = Math.round(catAmount * template.ratio);
        let unitPrice = itemAmount;
        let quantity = 1;
        if (cat.id === 'catering' || cat.id === 'gifts') {
          unitPrice = Math.max(1, Math.round(itemAmount / peopleCount));
          quantity = peopleCount;
        }
        return {
          name: template.name,
          unitPrice: unitPrice,
          quantity: quantity,
          note: template.note
        };
      });
    } else {
      const gen = categoryDefaultItemGen[cat.id];
      const item = gen ? gen(catAmount, peopleCount) : { name: cat.name + '费用', unitPrice: catAmount, quantity: 1, note: '' };
      wizardData.categories[cat.id] = [item];
    }
  });
}

function renderActivityTypeGrid() {
  const grid = document.getElementById('activityTypeGrid');
  if (!grid) return;

  grid.innerHTML = activityTypes.map(type => `
    <div class="activity-card" data-type="${type.id}" style="--type-color: ${type.color};" onclick="selectActivityType('${type.id}', '${type.name}')">
      <div class="activity-card-icon">${getIcon(type.iconType)}</div>
      <div class="activity-card-name">${type.name}</div>
    </div>
  `).join('');
}

function selectActivityType(typeId, typeName) {
  wizardData.activityType = typeId;
  wizardData.activityTypeName = typeName;

  document.querySelectorAll('.activity-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.type === typeId);
  });

  if (Object.keys(wizardData.categories).length > 0) {
    autoAllocateBudget();
    renderBudgetCategories();
    renderPercentageSliders();
    updateBudgetSummary();
  }
}

function renderBudgetCategories() {
  const container = document.getElementById('budgetCategoriesList');
  if (!container) return;

  const allCats = [...budgetCategories, ...wizardData.customCategories];

  container.innerHTML = allCats.map(cat => {
    const isEnabled = wizardData.categories[cat.id] && wizardData.categories[cat.id].length > 0;
    const items = wizardData.categories[cat.id] || [];
    const categoryTotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const isCustom = wizardData.customCategories.some(c => c.id === cat.id);

    return `
      <div class="category-card-item ${isEnabled ? 'enabled' : ''}" data-category="${cat.id}">
        <div class="category-card-header">
          <div class="category-card-left">
            <div class="category-card-icon">${getIcon(cat.iconType || 'box')}</div>
            <div class="category-card-info">
              <h4>${cat.name}</h4>
              <p>${isEnabled ? items.length + ' 个项目 · ' + formatMoney(categoryTotal) : '点击开启此分类'}</p>
            </div>
          </div>
          <div class="category-card-actions">
            ${isCustom ? `<button class="item-remove-btn category-remove-btn" onclick="removeCustomCategory('${cat.id}')" title="删除分类">×</button>` : ''}
            <label class="switch">
              <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleCategory('${cat.id}', this.checked)">
              <span class="switch-slider"></span>
            </label>
          </div>
        </div>
        <div class="category-card-details">
          <div class="item-row item-row-header">
            <span class="item-field-label">项目名称</span>
            <span class="item-field-label">单价</span>
            <span class="item-field-label">数量</span>
            <span class="item-field-label">小计</span>
            <span class="item-field-label">备注</span>
            <span></span>
          </div>
          <div id="items-${cat.id}">
            ${items.map((item, idx) => createBudgetItemRow(cat.id, idx, item)).join('')}
          </div>
          <div class="add-item-link" onclick="addBudgetItem('${cat.id}')">
            <span>+</span> 添加${cat.name}项目
          </div>
        </div>
      </div>
    `;
  }).join('') + `
    <div class="add-category-btn" onclick="showAddCategoryDialog()">
      ${getIcon('plus')} 添加自定义分类
    </div>
  `;
}

function createBudgetItemRow(categoryId, index, item = { name: '', unitPrice: 0, quantity: 1, note: '' }) {
  const subtotal = (item.unitPrice || 0) * (item.quantity || 0);
  return `
    <div class="item-row">
      <input type="text" class="item-input" placeholder="项目名称" value="${item.name || ''}"
             onchange="updateBudgetItem('${categoryId}', ${index}, 'name', this.value)">
      <input type="number" class="item-input" placeholder="单价" value="${item.unitPrice || 0}" min="0"
             onchange="updateBudgetItem('${categoryId}', ${index}, 'unitPrice', parseFloat(this.value) || 0)">
      <input type="number" class="item-input" placeholder="数量" value="${item.quantity || 1}" min="0"
             onchange="updateBudgetItem('${categoryId}', ${index}, 'quantity', parseFloat(this.value) || 0)">
      <div class="item-subtotal">${formatMoney(subtotal)}</div>
      <input type="text" class="item-input" placeholder="备注" value="${item.note || ''}"
             onchange="updateBudgetItem('${categoryId}', ${index}, 'note', this.value)">
      <button class="item-remove-btn" onclick="removeBudgetItem('${categoryId}', ${index})">×</button>
    </div>
  `;
}

function toggleCategory(categoryId, enabled) {
  const catItem = document.querySelector(`.category-card-item[data-category="${categoryId}"]`);
  if (!catItem) return;

  if (enabled) {
    catItem.classList.add('enabled');
    if (!wizardData.categories[categoryId]) {
      const cat = getCategoryById(categoryId);
      const defaultPercent = cat.defaultPercent || 5;
      const defaultAmount = Math.round(wizardData.budgetLimit * (defaultPercent / 100));
      const itemTemplates = activityBudgetItemTemplates[wizardData.activityType] || {};

      if (itemTemplates[categoryId] && itemTemplates[categoryId].length > 0) {
        wizardData.categories[categoryId] = itemTemplates[categoryId].map(template => {
          const itemAmount = Math.round(defaultAmount * template.ratio);
          let unitPrice = itemAmount;
          let quantity = 1;
          if (categoryId === 'catering' || categoryId === 'gifts') {
            unitPrice = Math.max(1, Math.round(itemAmount / wizardData.peopleCount));
            quantity = wizardData.peopleCount;
          }
          return {
            name: template.name,
            unitPrice: unitPrice,
            quantity: quantity,
            note: template.note
          };
        });
      } else {
        const gen = categoryDefaultItemGen[categoryId];
        const item = gen ? gen(defaultAmount, wizardData.peopleCount) : { name: cat.name + '费用', unitPrice: defaultAmount, quantity: 1, note: '' };
        wizardData.categories[categoryId] = [item];
      }
    }
    renderBudgetCategoryItems(categoryId);
  } else {
    catItem.classList.remove('enabled');
    delete wizardData.categories[categoryId];
  }

  updateBudgetSummary();
  renderPercentageSliders();
  updateCategoryInfo(categoryId);
}

function renderBudgetCategoryItems(categoryId) {
  const container = document.getElementById(`items-${categoryId}`);
  if (!container) return;

  const items = wizardData.categories[categoryId] || [];
  container.innerHTML = items.map((item, idx) => createBudgetItemRow(categoryId, idx, item)).join('');
}

function updateBudgetItem(categoryId, index, field, value) {
  if (!wizardData.categories[categoryId]) return;
  wizardData.categories[categoryId][index][field] = value;

  // 单价或数量变化时，刷新该行的小计显示及汇总
  if (field === 'unitPrice' || field === 'quantity') {
    renderBudgetCategoryItems(categoryId);
  }
  updateBudgetSummary();
  renderPercentageSliders();
  updateCategoryInfo(categoryId);
}

function addBudgetItem(categoryId) {
  if (!wizardData.categories[categoryId]) {
    wizardData.categories[categoryId] = [];
  }
  wizardData.categories[categoryId].push({ name: '', unitPrice: 0, quantity: 1, note: '' });
  renderBudgetCategoryItems(categoryId);
  updateCategoryInfo(categoryId);
}

function removeBudgetItem(categoryId, index) {
  if (!wizardData.categories[categoryId]) return;
  wizardData.categories[categoryId].splice(index, 1);
  
  if (wizardData.categories[categoryId].length === 0) {
    const checkbox = document.querySelector(`.category-card-item[data-category="${categoryId}"] .switch input`);
    if (checkbox) checkbox.checked = false;
    toggleCategory(categoryId, false);
    return;
  }
  
  renderBudgetCategoryItems(categoryId);
  updateBudgetSummary();
  renderPercentageSliders();
  updateCategoryInfo(categoryId);
}

function updateCategoryInfo(categoryId) {
  const catItem = document.querySelector(`.category-card-item[data-category="${categoryId}"]`);
  if (!catItem) return;

  const infoEl = catItem.querySelector('.category-card-info p');
  const items = wizardData.categories[categoryId] || [];
  const total = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  if (infoEl) {
    if (items.length > 0) {
      infoEl.textContent = `${items.length} 个项目 · ${formatMoney(total)}`;
    } else {
      infoEl.textContent = '点击开启此分类';
    }
  }
}

function getTotalBudget() {
  let total = 0;
  Object.values(wizardData.categories).forEach(items => {
    items.forEach(item => {
      total += (item.unitPrice || 0) * (item.quantity || 0);
    });
  });
  return total;
}

function getCategoryTotal(categoryId) {
  const items = wizardData.categories[categoryId] || [];
  return items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0), 0);
}

function updateBudgetSummary() {
  const totalBudget = getTotalBudget();
  const budgetLimit = parseFloat(document.getElementById('budgetLimit')?.value) || 0;
  const peopleCount = parseInt(document.getElementById('peopleCount')?.value) || 0;
  const perPerson = peopleCount > 0 ? Math.round(totalBudget / peopleCount) : 0;

  wizardData.budgetLimit = budgetLimit;
  wizardData.peopleCount = peopleCount;

  const summaryLimit = document.getElementById('summaryBudgetLimit');
  const summaryCurrent = document.getElementById('summaryCurrentBudget');
  const summaryPeople = document.getElementById('summaryPeople');
  const summaryPerPerson = document.getElementById('summaryPerPerson');
  const budgetStatus = document.getElementById('budgetStatus');

  if (summaryLimit) summaryLimit.textContent = formatMoney(budgetLimit);
  if (summaryCurrent) {
    summaryCurrent.textContent = formatMoney(totalBudget);
    summaryCurrent.classList.toggle('danger', totalBudget > budgetLimit && budgetLimit > 0);
  }
  if (summaryPeople) summaryPeople.textContent = peopleCount + '人';
  if (summaryPerPerson) summaryPerPerson.textContent = formatMoney(perPerson);

  if (budgetStatus) {
    const ratio = budgetLimit > 0 ? totalBudget / budgetLimit : 0;
    budgetStatus.className = 'band-status-pill';
    if (ratio <= 0.8) {
      budgetStatus.classList.add('safe');
      budgetStatus.textContent = '预算充足';
    } else if (ratio <= 1) {
      budgetStatus.classList.add('warning');
      budgetStatus.textContent = '接近上限';
    } else {
      budgetStatus.classList.add('danger');
      budgetStatus.textContent = '已超预算';
    }
  }
}

function renderPercentageSliders() {
  const container = document.getElementById('percentageSliders');
  if (!container) return;

  const totalBudget = getTotalBudget();
  const enabledCategories = Object.keys(wizardData.categories).filter(
    catId => wizardData.categories[catId] && wizardData.categories[catId].length > 0
  );

  if (enabledCategories.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">请先在第二步中添加预算分类</p>';
    return;
  }

  container.innerHTML = enabledCategories.map(catId => {
    const cat = getCategoryById(catId);
    const catTotal = getCategoryTotal(catId);
    const percent = totalBudget > 0 ? (catTotal / totalBudget * 100).toFixed(1) : 0;

    return `
      <div class="slider-row">
        <div class="slider-label">
          ${cat ? getIcon(cat.iconType) : getIcon('box')}
          <span>${cat ? cat.name : catId}</span>
        </div>
        <input type="range" class="slider-input" 
               min="0" max="100" step="0.5" value="${percent}"
               data-category="${catId}"
               oninput="adjustByPercentage('${catId}', this.value)">
        <div class="slider-value">${percent}%</div>
      </div>
    `;
  }).join('');

  updateTips();
}

function adjustByPercentage(categoryId, percent) {
  const totalBudget = getTotalBudget();
  const targetAmount = Math.round(totalBudget * (percent / 100));
  const currentAmount = getCategoryTotal(categoryId);

  if (currentAmount === 0) return;

  const ratio = targetAmount / currentAmount;

  if (wizardData.categories[categoryId]) {
    wizardData.categories[categoryId].forEach(item => {
      item.unitPrice = Math.round((item.unitPrice || 0) * ratio);
    });
  }

  updateBudgetSummary();
  renderPercentageSliders();
  renderBudgetCategories();
}

function updateTips() {
  const tipsList = document.getElementById('tipsList');
  if (!tipsList) return;

  const totalBudget = getTotalBudget();
  const budgetLimit = wizardData.budgetLimit;
  const tips = [];

  if (budgetLimit > 0 && totalBudget > budgetLimit) {
    tips.push(`当前预算已超出上限 ${formatMoney(totalBudget - budgetLimit)}，建议适当削减非必要开支。`);
  }

  const venueRatio = totalBudget > 0 ? (getCategoryTotal('venue') / totalBudget * 100) : 0;
  if (wizardData.categories['venue'] && venueRatio > 40) {
    tips.push('场地费用占比过高，建议控制在30%以内，可考虑性价比更高的场地。');
  }

  const contingencyRatio = totalBudget > 0 ? (getCategoryTotal('contingency') / totalBudget * 100) : 0;
  if (!wizardData.categories['contingency'] || contingencyRatio < 5) {
    tips.push('建议预留5%-10%的备用金，以应对突发情况。');
  }

  const cateringRatio = totalBudget > 0 ? (getCategoryTotal('catering') / totalBudget * 100) : 0;
  if (wizardData.categories['catering'] && cateringRatio < 10) {
    tips.push('餐饮费用占比偏低，可能影响参会体验，建议适当提升。');
  }

  if (tips.length === 0) {
    tips.push('预算结构合理，各项支出分配均衡，继续保持！');
  }

  tipsList.innerHTML = tips.map(tip => `<li>${tip}</li>`).join('');
}

function bindWizardEvents() {
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const peopleInput = document.getElementById('peopleCount');
  const budgetInput = document.getElementById('budgetLimit');

  if (nextBtn) nextBtn.addEventListener('click', nextStep);
  if (prevBtn) prevBtn.addEventListener('click', prevStep);
  if (peopleInput) peopleInput.addEventListener('input', updateBudgetSummary);
  if (budgetInput) budgetInput.addEventListener('input', updateBudgetSummary);

  document.querySelectorAll('.export-option-card').forEach(card => {
    card.addEventListener('click', () => {
      const format = card.dataset.format;
      alert(`方案已导出为 ${format.toUpperCase()} 格式！（演示功能）`);
    });
  });
}

function nextStep() {
  if (currentStep < totalSteps) {
    if (currentStep === 1) {
      if (!wizardData.activityType) {
        showCustomModal('💡 记得选择活动类型哦My Buddy～');
        return;
      }
      const peopleCount = parseInt(document.getElementById('peopleCount').value);
      if (!peopleCount || peopleCount <= 0) {
        alert('请输入有效的参与人数');
        return;
      }
      const budgetLimit = parseFloat(document.getElementById('budgetLimit').value);
      if (!budgetLimit || budgetLimit <= 0) {
        alert('请输入有效的预算上限');
        return;
      }
    }

    if (currentStep === 2) {
      const totalBudget = getTotalBudget();
      if (totalBudget === 0) {
        alert('请至少添加一个预算项目');
        return;
      }
    }

    currentStep++;
    updateWizardUI();
    updateSidebarSteps();

    // 从第一步进入第二步时，自动分配预算
    if (currentStep === 2 && Object.keys(wizardData.categories).length === 0) {
      autoAllocateBudget();
      renderBudgetCategories();
      updateBudgetSummary();
      renderPercentageSliders();
    }

    if (currentStep === 4) {
      renderPreview();
    }
  } else {
    showSuccessModal();
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateWizardUI();
    updateSidebarSteps();
  }
}

function updateSidebarSteps() {
  for (let i = 1; i <= totalSteps; i++) {
    const el = document.getElementById(`side-step-${i}`);
    if (!el) continue;
    el.classList.remove('active');
    const badge = el.querySelector('span:first-child');
    if (badge) {
      if (i <= currentStep) {
        badge.style.background = 'white';
        badge.style.color = 'var(--primary)';
      } else {
        badge.style.background = 'rgba(255,255,255,0.2)';
        badge.style.color = 'white';
      }
    }
    if (i === currentStep) {
      el.classList.add('active');
    }
  }
}

function updateWizardUI() {
  document.querySelectorAll('.wizard-step').forEach(step => {
    const stepNum = parseInt(step.dataset.step);
    step.classList.remove('active', 'completed');
    if (stepNum < currentStep) {
      step.classList.add('completed');
    } else if (stepNum === currentStep) {
      step.classList.add('active');
    }
  });

  for (let i = 1; i <= totalSteps; i++) {
    const panel = document.getElementById(`step${i}`);
    if (panel) {
      panel.style.display = i === currentStep ? 'block' : 'none';
      if (i === currentStep) {
        panel.classList.add('fade-in');
      }
    }
  }

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (prevBtn) {
    prevBtn.style.visibility = currentStep > 1 ? 'visible' : 'hidden';
  }
  if (nextBtn) {
    nextBtn.textContent = currentStep === totalSteps ? '完成 ✓' : '下一步 →';
  }
}

// 添加自定义分类
function showAddCategoryDialog() {
  const name = prompt('请输入自定义分类名称：');
  if (!name || !name.trim()) return;

  const id = 'custom_' + Date.now();
  wizardData.customCategories.push({
    id: id,
    name: name.trim(),
    iconType: 'box',
    defaultPercent: 5
  });

  // 自动开启该分类
  const defaultAmount = Math.round(wizardData.budgetLimit * 0.05);
  wizardData.categories[id] = [{ name: name.trim() + '费用', unitPrice: defaultAmount, quantity: 1, note: '' }];

  renderBudgetCategories();
  updateBudgetSummary();
  renderPercentageSliders();
}

// 删除自定义分类
function removeCustomCategory(categoryId) {
  if (!confirm('确定删除此分类及其所有预算项吗？')) return;
  wizardData.customCategories = wizardData.customCategories.filter(c => c.id !== categoryId);
  delete wizardData.categories[categoryId];
  renderBudgetCategories();
  updateBudgetSummary();
  renderPercentageSliders();
}

function renderPreview() {
  const infoGrid = document.getElementById('previewInfoGrid');
  const table = document.getElementById('previewBudgetTable');

  const totalBudget = getTotalBudget();
  const perPerson = wizardData.peopleCount > 0 ? Math.round(totalBudget / wizardData.peopleCount) : 0;

  if (infoGrid) {
    infoGrid.innerHTML = `
      <div class="preview-info-box">
        <div class="preview-info-box-label">活动类型</div>
        <div class="preview-info-box-value">${wizardData.activityTypeName || '未选择'}</div>
      </div>
      <div class="preview-info-box">
        <div class="preview-info-box-label">参与人数</div>
        <div class="preview-info-box-value">${wizardData.peopleCount} 人</div>
      </div>
      <div class="preview-info-box">
        <div class="preview-info-box-label">人均成本</div>
        <div class="preview-info-box-value">${formatMoney(perPerson)}</div>
      </div>
    `;
  }

  if (table) {
    let rows = '';
    Object.entries(wizardData.categories).forEach(([catId, items]) => {
      const cat = getCategoryById(catId);
      items.forEach(item => {
        const subtotal = (item.unitPrice || 0) * (item.quantity || 0);
        rows += `
          <tr>
            <td>
              <div class="budget-cat-cell">
                <div class="budget-cat-icon">${cat ? getIcon(cat.iconType || 'box') : getIcon('box')}</div>
                <span>${cat ? cat.name : catId}</span>
              </div>
            </td>
            <td>${item.name || '未命名'}</td>
            <td class="budget-amount">${formatMoney(item.unitPrice || 0)}</td>
            <td>${item.quantity || 0}</td>
            <td class="budget-amount">${formatMoney(subtotal)}</td>
            <td class="budget-note">${item.note || '-'}</td>
          </tr>
        `;
      });
    });

    table.innerHTML = `
      <thead>
        <tr>
          <th>预算分类</th>
          <th>项目名称</th>
          <th>单价</th>
          <th>数量</th>
          <th>小计</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr style="background: var(--primary-soft); font-weight: 600;">
          <td colspan="4">合计</td>
          <td class="budget-amount" style="font-size: 18px;">${formatMoney(totalBudget)}</td>
          <td>-</td>
        </tr>
      </tbody>
    `;
  }
}

function initProfilePage() {
  initIcons();
  updateHeaderUserArea();

  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  fillProfileUserInfo(user);
  fillSettingsForm(user);
  renderMyPlans();
  renderExportHistory();
  bindProfileMenu();
  bindLogoutBtn();
}

function fillProfileUserInfo(user) {
  const avatarEl = document.querySelector('.profile-avatar-lg');
  const nameEl = document.querySelector('.profile-name-lg');
  const emailEl = document.querySelector('.profile-email-lg');

  if (avatarEl) avatarEl.innerHTML = '<span class="icon" data-icon="user"></span>';
  if (nameEl) nameEl.textContent = user.nickname || '用户' + user.phone.slice(-4);
  if (emailEl) emailEl.textContent = user.phone;
  initIcons();
}

function fillSettingsForm(user) {
  const nicknameInput = document.querySelector('.settings-wrap input[type="text"]');
  const emailInput = document.querySelector('.settings-wrap input[type="email"]');
  const phoneInput = document.querySelector('.settings-wrap input[type="tel"]');
  const industrySelect = document.querySelector('.settings-wrap select');

  if (nicknameInput && user.nickname) nicknameInput.value = user.nickname;
  if (phoneInput) phoneInput.value = user.phone;
  if (industrySelect && user.industry) industrySelect.value = user.industry;
}

function bindLogoutBtn() {
  const settingsWrap = document.querySelector('.settings-wrap');
  if (!settingsWrap) return;

  const logoutBtn = document.createElement('button');
  logoutBtn.className = 'btn btn-outline btn-block';
  logoutBtn.style.marginTop = '12px';
  logoutBtn.textContent = '退出登录';
  logoutBtn.onclick = function() {
    showLogoutModal();
  };

  const saveBtn = settingsWrap.querySelector('.btn-primary');
  if (saveBtn && saveBtn.parentNode) {
    saveBtn.parentNode.appendChild(logoutBtn);
  } else {
    settingsWrap.appendChild(logoutBtn);
  }
}

function showLogoutModal() {
  const modal = document.getElementById('logoutModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeLogoutModal() {
  const modal = document.getElementById('logoutModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function confirmLogout() {
  closeLogoutModal();
  logout();
}

function renderMyPlans() {
  const grid = document.getElementById('myPlansGrid');
  if (!grid) return;

  if (userPlans.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1;" class="empty-box">
        <div class="empty-box-icon">${getIcon('clipboard')}</div>
        <div class="empty-box-title">暂无方案</div>
        <div class="empty-box-desc">开始创建你的第一个预算方案吧</div>
        <a href="customize.html" class="btn btn-primary">创建方案</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = userPlans.map(plan => `
    <div class="user-plan-card" onclick="goToDetail(${plan.templateId || 1})">
      <div class="user-plan-cover">
        <img src="${plan.cover}" alt="${plan.name}">
        <span class="user-plan-status ${plan.status === '已完成' ? 'done' : 'doing'}">${plan.status}</span>
      </div>
      <div class="user-plan-info">
        <div class="user-plan-name">${plan.name}</div>
        <div class="user-plan-meta">
          <span class="user-plan-budget">${formatMoney(plan.totalBudget)}</span>
          <span>${getIcon('users')} ${plan.people}人</span>
        </div>
        <div class="user-plan-date">创建于 ${plan.createdAt}</div>
      </div>
    </div>
  `).join('');
}

function renderExportHistory() {
  const tbody = document.querySelector('#exportTable tbody');
  if (!tbody) return;

  tbody.innerHTML = exportHistory.map(record => `
    <tr>
      <td>${record.planName}</td>
      <td><span class="filter-tag" style="padding: 4px 12px;">${record.format}</span></td>
      <td>${record.exportDate}</td>
      <td>${record.size}</td>
      <td><button class="btn btn-outline btn-sm">重新下载</button></td>
    </tr>
  `).join('');
}

function bindProfileMenu() {
  const menuItems = document.querySelectorAll('.profile-nav-item');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      
      menuItems.forEach(m => m.classList.remove('active'));
      item.classList.add('active');

      document.querySelectorAll('.profile-tab').forEach(t => {
        t.style.display = 'none';
      });
      const targetTab = document.getElementById(`tab-${tab}`);
      if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('fade-in');
      }
    });
  });
}

// 欢迎页动画控制
function initWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcomeScreen');
  if (!welcomeScreen) return;
  
  setTimeout(() => {
    welcomeScreen.addEventListener('animationend', (e) => {
      if (e.animationName === 'welcomeFadeOut') {
        welcomeScreen.remove();
      }
    });
  }, 100);
}

// ==================== 登录状态管理 ====================
const AUTH_KEY = 'budget_buddy_user';
const USERS_KEY = 'budget_buddy_users';

function getCurrentUser() {
  try {
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function isLoggedIn() {
  return !!getCurrentUser();
}

function saveUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  updateHeaderUserArea();
  window.location.href = 'index.html';
}

function getAllUsers() {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveAllUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function updateHeaderUserArea() {
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;

  const user = getCurrentUser();
  if (user) {
    headerActions.innerHTML = `
      <button class="topbar-icon-btn" title="通知"><span class="icon" data-icon="bell"></span></button>
      <button class="topbar-icon-btn" title="收藏"><span class="icon" data-icon="heart"></span></button>
      <div class="topbar-avatar" title="${user.nickname || user.phone}" onclick="goToProfile()"><span class="icon" data-icon="user"></span></div>
    `;
  } else {
    headerActions.innerHTML = `
      <button class="topbar-icon-btn" title="通知"><span class="icon" data-icon="bell"></span></button>
      <button class="topbar-icon-btn" title="收藏"><span class="icon" data-icon="heart"></span></button>
      <a href="login.html" class="btn btn-primary btn-sm login-nav-btn">登录 / 注册</a>
    `;
  }
  initIcons();
}

function goToProfile() {
  window.location.href = 'profile.html';
}

// ==================== 登录页面逻辑 ====================
let codeCountdownTimer = null;
let codeCountdown = 0;

function initLoginPage() {
  initIcons();

  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.dataset.tab;
      switchAuthTab(tabName);
    });
  });

  document.querySelectorAll('.mode-switch-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const mode = this.dataset.mode;
      switchLoginMode(mode);
    });
  });
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');

  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
  clearAllErrors();
}

function switchLoginMode(mode) {
  document.querySelectorAll('.mode-switch-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.mode-switch-btn[data-mode="${mode}"]`).classList.add('active');

  document.getElementById('passwordLoginForm').style.display = mode === 'password' ? 'block' : 'none';
  document.getElementById('codeLoginForm').style.display = mode === 'code' ? 'block' : 'none';
  clearAllErrors();
}

function clearAllErrors() {
  document.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
  });
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

// 发送登录验证码
function sendLoginCode() {
  const phone = document.getElementById('codeLoginPhone').value.trim();

  if (!phone) {
    showError('codeLoginPhoneError', '请输入手机号');
    return;
  }
  if (!validatePhone(phone)) {
    showError('codeLoginPhoneError', '请输入正确的11位手机号');
    return;
  }

  showError('codeLoginPhoneError', '');

  if (codeCountdownTimer) return;

  codeCountdown = 60;
  const btn = document.getElementById('sendCodeBtn');
  btn.disabled = true;
  btn.classList.add('disabled');
  btn.textContent = `${codeCountdown}s 后重发`;

  document.getElementById('demoCodeTip').style.display = 'block';

  codeCountdownTimer = setInterval(() => {
    codeCountdown--;
    if (codeCountdown <= 0) {
      clearInterval(codeCountdownTimer);
      codeCountdownTimer = null;
      btn.disabled = false;
      btn.classList.remove('disabled');
      btn.textContent = '获取验证码';
    } else {
      btn.textContent = `${codeCountdown}s 后重发`;
    }
  }, 1000);
}

// 密码登录
function handlePasswordLogin() {
  const phone = document.getElementById('loginPhone').value.trim();
  const password = document.getElementById('loginPassword').value;

  let hasError = false;
  if (!phone) {
    showError('loginPhoneError', '请输入手机号');
    hasError = true;
  } else if (!validatePhone(phone)) {
    showError('loginPhoneError', '请输入正确的11位手机号');
    hasError = true;
  } else {
    showError('loginPhoneError', '');
  }

  if (!password) {
    showError('loginPasswordError', '请输入密码');
    hasError = true;
  } else {
    showError('loginPasswordError', '');
  }

  if (hasError) return;

  const users = getAllUsers();
  const user = users.find(u => u.phone === phone);

  if (!user) {
    showError('loginPasswordError', '该手机号未注册，请先注册');
    return;
  }

  if (user.password !== password) {
    showError('loginPasswordError', '密码错误');
    return;
  }

  saveUser(user);
  window.location.href = 'index.html';
}

// 验证码登录
function handleCodeLogin() {
  const phone = document.getElementById('codeLoginPhone').value.trim();
  const code = document.getElementById('codeLoginCode').value.trim();

  let hasError = false;
  if (!phone) {
    showError('codeLoginPhoneError', '请输入手机号');
    hasError = true;
  } else if (!validatePhone(phone)) {
    showError('codeLoginPhoneError', '请输入正确的11位手机号');
    hasError = true;
  } else {
    showError('codeLoginPhoneError', '');
  }

  if (!code) {
    showError('codeLoginCodeError', '请输入验证码');
    hasError = true;
  } else if (code !== '123456') {
    showError('codeLoginCodeError', '验证码错误');
    hasError = true;
  } else {
    showError('codeLoginCodeError', '');
  }

  if (hasError) return;

  const users = getAllUsers();
  let user = users.find(u => u.phone === phone);

  if (!user) {
    user = {
      phone: phone,
      password: '',
      nickname: '用户' + phone.slice(-4),
      industry: '',
      occupation: '',
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveAllUsers(users);
  }

  saveUser(user);
  window.location.href = 'index.html';
}

// 注册
function handleRegister() {
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;
  const industry = document.getElementById('regIndustry').value;
  const occupation = document.getElementById('regOccupation').value;

  let hasError = false;

  if (!phone) {
    showError('regPhoneError', '请输入手机号');
    hasError = true;
  } else if (!validatePhone(phone)) {
    showError('regPhoneError', '请输入正确的11位手机号');
    hasError = true;
  } else {
    showError('regPhoneError', '');
  }

  if (!password) {
    showError('regPasswordError', '请设置密码');
    hasError = true;
  } else if (password.length < 6 || password.length > 20) {
    showError('regPasswordError', '密码长度需6-20位');
    hasError = true;
  } else {
    showError('regPasswordError', '');
  }

  if (!confirmPassword) {
    showError('regConfirmPasswordError', '请再次输入密码');
    hasError = true;
  } else if (confirmPassword !== password) {
    showError('regConfirmPasswordError', '两次密码不一致');
    hasError = true;
  } else {
    showError('regConfirmPasswordError', '');
  }

  if (!industry) {
    showError('regIndustryError', '请选择行业');
    hasError = true;
  } else {
    showError('regIndustryError', '');
  }

  if (!occupation) {
    showError('regOccupationError', '请选择职业');
    hasError = true;
  } else {
    showError('regOccupationError', '');
  }

  if (hasError) return;

  const users = getAllUsers();
  if (users.some(u => u.phone === phone)) {
    showError('regPhoneError', '该手机号已注册，请直接登录');
    return;
  }

  const newUser = {
    phone: phone,
    password: password,
    nickname: '用户' + phone.slice(-4),
    industry: industry,
    occupation: occupation,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveAllUsers(users);
  saveUser(newUser);

  window.location.href = 'index.html';
}

function showSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function showCustomModal(message, icon = '💡') {
  const modal = document.getElementById('customModal');
  const title = document.getElementById('customModalTitle');
  const iconEl = document.getElementById('customModalIcon');
  if (modal && title) {
    title.textContent = message;
    if (iconEl) {
      iconEl.textContent = icon;
    }
    modal.style.display = 'flex';
  }
}

function closeCustomModal() {
  const modal = document.getElementById('customModal');
  if (modal) {
    modal.style.display = 'none';
  }
}
