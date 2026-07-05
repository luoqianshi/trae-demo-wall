/* ============================================================
   暖伴 NuanBan · 应用共享逻辑
   ============================================================ */

// ---- 主题切换 (适老化) ----
function toggleElderMode() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  if (current === 'elder') {
    html.removeAttribute('data-theme');
    localStorage.setItem('nuanban-theme', 'normal');
    showToast('已切换至标准模式');
  } else {
    html.setAttribute('data-theme', 'elder');
    localStorage.setItem('nuanban-theme', 'elder');
    showToast('已开启长辈模式,字号已放大');
  }
}

function initTheme() {
  const saved = localStorage.getItem('nuanban-theme');
  if (saved === 'elder') {
    document.documentElement.setAttribute('data-theme', 'elder');
  }
}

// ---- Toast 提示 ----
function showToast(msg, duration = 2000) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ---- 导航 ----
function go(url) {
  window.location.href = url;
}

function back() {
  if (history.length > 1) {
    history.back();
  } else {
    window.location.href = '../index.html';
  }
}

// ---- 移动端 Tab 栏渲染 ----
function renderTabbar(active = 'home') {
  const items = [
    { key: 'home', label: '首页', icon: 'home', url: 'u-home.html' },
    { key: 'order', label: '订单', icon: 'order', url: 'u-orders.html' },
    { key: 'member', label: '会员', icon: 'member', url: 'u-member.html' },
    { key: 'profile', label: '我的', icon: 'profile', url: 'u-profile.html' },
  ];
  return `
    <nav class="tabbar">
      ${items.map(item => `
        <a class="tabbar__item ${item.key === active ? 'tabbar__item--active' : ''}" href="${item.url}">
          ${IconLib[item.icon]}
          <span class="tabbar__label">${item.label}</span>
        </a>
      `).join('')}
    </nav>
  `;
}

// ---- 陪诊师端 Tab 栏 ----
function renderCompanionTabbar(active = 'work') {
  const items = [
    { key: 'work', label: '工作台', icon: 'home', url: 'c-workbench.html' },
    { key: 'grab', label: '抢单', icon: 'order', url: 'c-grab.html' },
    { key: 'income', label: '收益', icon: 'wallet', url: 'c-income.html' },
    { key: 'profile', label: '我的', icon: 'profile', url: 'c-profile.html' },
  ];
  return `
    <nav class="tabbar">
      ${items.map(item => `
        <a class="tabbar__item ${item.key === active ? 'tabbar__item--active' : ''}" href="${item.url}">
          ${IconLib[item.icon]}
          <span class="tabbar__label">${item.label}</span>
        </a>
      `).join('')}
    </nav>
  `;
}

// ---- 头部导航渲染 ----
function renderHeader(title, opts = {}) {
  const { showBack = true, rightHTML = '' } = opts;
  return `
    <header class="app-header">
      ${showBack ? `<button class="app-header__back" onclick="back()">${IconLib.back}</button>` : '<span style="width:44px"></span>'}
      <span class="app-header__title">${title}</span>
      <span class="app-header__right">${rightHTML}</span>
    </header>
  `;
}

// ---- 陪诊师卡片渲染 ----
function renderCompanionCard(c) {
  return `
    <div class="companion-card anim-fade-up" onclick="go('u-companion-detail.html?id=${c.id}')">
      <div class="companion-card__avatar" style="font-size:24px;font-weight:600;color:var(--color-primary)">${c.avatar}</div>
      <div class="companion-card__body">
        <div class="companion-card__title">
          ${c.name}
          <span class="status-dot status-dot--${c.online ? 'online' : 'offline'}"></span>
          <span style="font-size:var(--fs-xs);color:var(--color-text-3);font-weight:400">${c.online ? '在线' : '离线'}</span>
        </div>
        <div class="companion-card__desc">${c.desc}</div>
        <div class="companion-card__meta">
          ${starsHTML(c.rating)}
          <span>·</span>
          <span>服务${c.orders}单</span>
          <span>·</span>
          <span>${c.exp}经验</span>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
          ${c.tags.map(t => `<span class="badge badge-primary">${t}</span>`).join('')}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px">
          <span class="price"><span class="price__symbol">¥</span><span class="price__integer">${c.price}</span><span class="price__decimal">起</span></span>
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();go('u-booking.html?companion_id=${c.id}')">预约</button>
        </div>
      </div>
    </div>
  `;
}

// ---- 状态胶囊渲染 ----
function renderStatusBadge(status) {
  const s = MockData.orderStatus[status];
  if (!s) return '';
  return `<span class="badge badge-${s.color}">${s.label}</span>`;
}

// ---- 页面初始化 ----
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
});
