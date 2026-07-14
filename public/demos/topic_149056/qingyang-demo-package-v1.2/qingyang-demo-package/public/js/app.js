/**
 * 轻养助手 - 主应用逻辑
 * SPA路由管理、认证状态检查、页面切换
 */

const app = {
  routes: {
    '#/login': { page: authPage, showNav: false },
    '#/onboarding': { page: onboardingPage, showNav: false },
    '#/': { page: dashboardPage, showNav: true },
    '#/plan': { page: planPage, showNav: true },
    '#/tracking': { page: trackingPage, showNav: true },
    '#/nutrition': { page: null, showNav: true, script: 'nutrition' },
    '#/fitness': { page: null, showNav: true, script: 'fitness' },
    '#/analysis': { page: null, showNav: true, script: 'analysis' },
    '#/community': { page: null, showNav: true, script: 'community' },
    '#/profile': { page: null, showNav: true, script: 'profile' },
  },

  init() {
    // 检查认证状态
    window.addEventListener('hashchange', () => this.handleRoute());

    // 初始路由
    this.handleRoute();
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },

  isGuest() {
    return localStorage.getItem('guestMode') === 'true';
  },

  handleRoute() {
    const hash = window.location.hash || '#/';

    // 规范化路由（去掉末尾斜杠）
    const normalizedHash = hash.replace(/\/$/, '') || '#/';
    const route = this.routes[normalizedHash] || this.routes['#/'];

    const appEl = document.getElementById('app');
    if (!appEl) return;

    // 清理旧内容
    appEl.innerHTML = '';
    appEl.scrollTop = 0;
    window.scrollTo(0, 0);

    // 认证检查
    if (route.showNav && !this.isAuthenticated() && !this.isGuest()) {
      window.location.hash = '#/login';
      return;
    }

    // 渲染导航栏
    if (route.showNav) {
      nav.show();
      nav.update(normalizedHash);
    } else {
      nav.hide();
    }

    // 渲染页面
    if (route.script && window.Pages && window.Pages[route.script]) {
      window.Pages[route.script](appEl);
    } else if (route.page && typeof route.page.render === 'function') {
      route.page.render();
    } else if (route.placeholder) {
      this.renderPlaceholder(route.placeholder);
    } else {
      // 兜底
      window.location.hash = '#/';
    }
  },

  renderPlaceholder(message) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="page">
        <div class="page-header">
          <h1>${message.split('开发中')[0] || '功能'}</h1>
          <div class="subtitle">即将上线</div>
        </div>
        <div class="empty-state">
          <div class="empty-icon">🚧</div>
          <div class="empty-title">${message}</div>
          <div class="empty-desc">该功能正在紧张开发中，敬请期待</div>
          <button class="btn btn-primary btn-sm" onclick="window.location.hash='#/'">返回首页</button>
        </div>
      </div>
    `;
  }
};

/**
 * Toast 提示组件
 */
function showToast(message, type = 'info', duration = 2500) {
  // 移除已有toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ========== 启动应用 ==========
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
