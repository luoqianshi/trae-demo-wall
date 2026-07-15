/**
 * 本草灵枢 · 全站统一导航栏组件
 * 自动检测当前页面高亮、移动端汉堡菜单、集成 auth.js
 */
const Nav = (() => {
  // 导航链接配置
  const LINKS = [
    { href: 'index.html',      label: '首页' },
    { href: 'herbs.html',      label: '药材百科' },
    { href: 'diagnose.html',   label: '智能辨证' },
    { href: 'ai-chat.html',    label: 'AI 问诊' },
    { href: 'acupoints.html',  label: '针灸穴位' },
    { href: 'care.html',       label: '日常护理' },
    { href: 'graph.html',      label: '全局图谱' },
  ];

  // 获取当前页面文件名
  function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    return filename || 'index.html';
  }

  // 注入导航样式（自包含，不依赖 Tailwind）
  function injectStyles() {
    if (document.getElementById('nav-shared-styles')) return;
    const style = document.createElement('style');
    style.id = 'nav-shared-styles';
    style.textContent = `
      .tcm-nav-bar {
        position: sticky; top: 0; z-index: 1000;
        background: rgba(241, 235, 216, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(216, 206, 179, 0.5);
        transition: box-shadow 0.3s ease;
      }
      .tcm-nav-bar.scrolled {
        box-shadow: 0 2px 20px rgba(30, 38, 34, 0.08);
      }
      .tcm-nav-inner {
        max-width: 1200px; margin: 0 auto;
        padding: 0 24px; height: 64px;
        display: flex; align-items: center; justify-content: space-between;
        gap: 16px;
      }
      .tcm-nav-logo {
        display: flex; align-items: center; gap: 12px;
        text-decoration: none; flex-shrink: 0;
      }
      .tcm-nav-logo-icon {
        width: 40px; height: 40px; border-radius: 10px;
        background: #2D5A4A;
        display: flex; align-items: center; justify-content: center;
        color: #F1EBD8; font-size: 18px; font-weight: 700;
        font-family: 'Noto Serif SC', serif;
      }
      .tcm-nav-logo-text {
        font-family: 'Noto Serif SC', serif;
        font-size: 20px; font-weight: 700;
        color: #2D5A4A; letter-spacing: 0.15em;
        white-space: nowrap;
      }
      .tcm-nav-links {
        display: flex; align-items: center; gap: 4px;
        flex: 1; justify-content: center;
      }
      .tcm-nav-link {
        position: relative;
        padding: 8px 14px;
        font-size: 14px; font-family: 'Noto Sans SC', sans-serif;
        color: #6B6259; text-decoration: none;
        transition: color 0.3s ease;
        white-space: nowrap; border-radius: 8px;
        cursor: pointer;
      }
      .tcm-nav-link::after {
        content: '';
        position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);
        width: 0; height: 2px; border-radius: 1px;
        background: #2D5A4A;
        transition: width 0.3s ease;
      }
      .tcm-nav-link:hover { color: #2D5A4A; }
      .tcm-nav-link:hover::after { width: 60%; }
      .tcm-nav-link.active {
        color: #2D5A4A; font-weight: 500;
        background: rgba(45, 90, 74, 0.06);
      }
      .tcm-nav-link.active::after { width: 60%; }
      .tcm-nav-right {
        display: flex; align-items: center; gap: 12px; flex-shrink: 0;
      }
      .tcm-nav-toggle {
        display: none;
        background: none; border: none; cursor: pointer;
        padding: 8px; border-radius: 8px;
        transition: background 0.2s;
      }
      .tcm-nav-toggle:hover { background: rgba(45, 90, 74, 0.08); }
      .tcm-nav-toggle svg { width: 24px; height: 24px; color: #2D5A4A; }
      .tcm-nav-mobile {
        display: none;
        flex-direction: column; gap: 2px;
        padding: 8px 24px 16px;
        border-top: 1px solid rgba(216, 206, 179, 0.4);
        background: rgba(241, 235, 216, 0.98);
        backdrop-filter: blur(12px);
      }
      .tcm-nav-mobile.open { display: flex; }
      .tcm-nav-mobile .tcm-nav-link {
        padding: 12px 16px; font-size: 15px;
        border-radius: 10px;
      }
      .tcm-nav-mobile .tcm-nav-link::after { display: none; }
      .tcm-nav-mobile .tcm-nav-link.active {
        background: rgba(45, 90, 74, 0.1);
      }

      /* 响应式 */
      @media (max-width: 768px) {
        .tcm-nav-links { display: none; }
        .tcm-nav-toggle { display: flex; align-items: center; }
        .tcm-nav-logo-text { font-size: 18px; }
        .tcm-nav-inner { height: 56px; padding: 0 16px; }
      }

      /* auth.js 生成的按钮样式兼容 */
      #authNavSlot a, #authNavSlot button {
        font-family: 'Noto Sans SC', sans-serif;
      }
    `;
    document.head.appendChild(style);
  }

  // 渲染导航
  function render() {
    injectStyles();

    // 查找挂载点
    const mount = document.getElementById('nav-mount');
    if (!mount) return;

    const current = getCurrentPage();

    // 生成链接 HTML
    const linksHTML = LINKS.map(link => {
      const isActive = link.href === current ? 'active' : '';
      return `<a href="${link.href}" class="tcm-nav-link ${isActive}">${link.label}</a>`;
    }).join('');

    const mobileLinksHTML = LINKS.map(link => {
      const isActive = link.href === current ? 'active' : '';
      return `<a href="${link.href}" class="tcm-nav-link ${isActive}">${link.label}</a>`;
    }).join('');

    mount.innerHTML = `
      <nav class="tcm-nav-bar" id="tcmNavBar">
        <div class="tcm-nav-inner">
          <a href="index.html" class="tcm-nav-logo">
            <div class="tcm-nav-logo-icon">本</div>
            <span class="tcm-nav-logo-text">本草灵枢</span>
          </a>
          <div class="tcm-nav-links">
            ${linksHTML}
          </div>
          <div class="tcm-nav-right">
            <div id="authNavSlot"></div>
            <button class="tcm-nav-toggle" id="navToggle" aria-label="菜单">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="tcm-nav-mobile" id="navMobile">
          ${mobileLinksHTML}
        </div>
      </nav>
    `;

    // 滚动阴影
    window.addEventListener('scroll', () => {
      const bar = document.getElementById('tcmNavBar');
      if (bar) bar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    // 移动端菜单切换
    const toggle = document.getElementById('navToggle');
    const mobile = document.getElementById('navMobile');
    if (toggle && mobile) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        mobile.classList.toggle('open');
      });
      // 点击外部关闭
      document.addEventListener('click', (e) => {
        if (!mobile.contains(e.target) && !toggle.contains(e.target)) {
          mobile.classList.remove('open');
        }
      });
    }

    // 渲染 auth 状态
    if (typeof Auth !== 'undefined' && Auth.updateNavUI) {
      Auth.updateNavUI();
    }
  }

  return { render, LINKS };
})();

// 自动渲染
document.addEventListener('DOMContentLoaded', () => Nav.render());
