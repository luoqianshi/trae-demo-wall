/* =========================================================================
 * 「知行」App 本体 Demo —— Phase 0 / App 外壳逻辑（shell.js）
 * -------------------------------------------------------------------------
 * 职责：
 *   1. 注入 ZX.icon 库图标（tab：graph / comment / fingerprint；标题栏：search / spark）
 *   2. 状态栏实时时间（HH:MM，每 30s 刷新一次）
 *   3. 5-tab 路由：display 切换 + is-active + aria-selected
 *   4. 初始化默认进入「笔记本」页（非广场）
 * 依赖：../../demo/shared/icons.js（window.ZX.icon）、../../demo/shared/mock-data.js
 * =======================================================================*/

(function () {
  'use strict';

  var DEFAULT_PAGE = 'notebook';

  /* ZX.icon 注入映射：优先复用共享图标库 */
  var TAB_ICONS = {
    square: 'graph',
    friends: 'comment',
    profile: 'fingerprint'
  };
  var HEAD_ICONS = {
    square: 'search',
    notebook: 'spark'
  };

  /* ⇄ 双向箭头角标：叠在「广场」tab 图标上，提示「重复点击可切换 Feed / 市场」 */
  var SWAP_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" '
    + 'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" '
    + 'aria-hidden="true" focusable="false">'
    + '<path d="M7 4L3 8l4 4"/><path d="M3 8h14"/>'
    + '<path d="M17 20l4-4-4-4"/><path d="M21 16H7"/></svg>';

  function injectIcons() {
    if (!window.ZX || typeof window.ZX.icon !== 'function') { return; }

    Object.keys(TAB_ICONS).forEach(function (page) {
      var slot = document.querySelector('[data-tab-icon="' + page + '"]');
      if (slot) { slot.innerHTML = window.ZX.icon(TAB_ICONS[page], 24); }
    });

    /* tab 图标右上角叠一个 ⇄ 小角标（不动 tab 本体尺寸/位置）。
     * 任何带 data-tab-swap 属性的 tab icon 都加角标，提示「重复点击可切换视图」。
     * 目前用于：广场（Feed / 市场）、工作区（值班台 / 编辑器）。 */
    var swapSlots = document.querySelectorAll('[data-tab-swap]');
    Array.prototype.forEach.call(swapSlots, function (slot) {
      var badge = document.createElement('span');
      badge.className = 'zx-tab__swap';
      badge.setAttribute('aria-hidden', 'true');
      badge.innerHTML = SWAP_SVG;
      slot.appendChild(badge);
    });

    Object.keys(HEAD_ICONS).forEach(function (page) {
      var slot = document.querySelector('[data-head-icon="' + page + '"]');
      if (slot) { slot.innerHTML = window.ZX.icon(HEAD_ICONS[page], 22); }
    });
  }

  /* 状态栏时间：HH:MM（24h，等宽 tabular） */
  function tick() {
    var el = document.querySelector('.zx-statusbar__time');
    if (!el) { return; }
    var d = new Date();
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    el.textContent = hh + ':' + mm;
  }

  function route(name) {
    var tabs = document.querySelectorAll('.zx-tab');
    var pages = document.querySelectorAll('.zx-page');

    tabs.forEach(function (tab) {
      var on = tab.getAttribute('data-tab') === name;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    pages.forEach(function (page) {
      page.classList.toggle('is-active', page.getAttribute('data-page') === name);
    });

    /* 闭环支持：切 tab 后通知各 tab 刷新自己的列表（关注/发布联动） */
    setTimeout(function () {
      try { window.dispatchEvent(new CustomEvent('zx-tab-active', { detail: { tab: name } })); } catch (e) {}
    }, 60);
  }

  function bindTabs() {
    var tabs = document.querySelectorAll('.zx-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        /* 中间 FAB：写新笔记 —— action 而非 tab 切换 */
        if (tab.getAttribute('data-action') === 'write-note') {
          route('notebook');
          if (window.ZX_NOTEBOOK && typeof window.ZX_NOTEBOOK.pushView === 'function') {
            window.ZX_NOTEBOOK.pushView('template');
          }
          return;
        }
        var name = tab.getAttribute('data-tab');
        var isActive = tab.classList.contains('is-active');
        /* 广场页再次点击已激活 tab → 切换全屏翻页 / 瀑布流列表 */
        if (isActive && name === 'square'
            && window.ZX_SQUARE && typeof window.ZX_SQUARE.toggleFeedMode === 'function') {
          window.ZX_SQUARE.toggleFeedMode();
          return;
        }
        /* 工作页再次点击已激活 tab → 切换值班台 / 编辑器视图 */
        if (isActive && name === 'notebook'
            && window.ZX_NOTEBOOK && typeof window.ZX_NOTEBOOK.toggleView === 'function') {
          window.ZX_NOTEBOOK.toggleView();
          return;
        }
        route(name);
      });
    });
  }

  /* 键盘可达性补强：为带 role="button" 的非原生控件（div/span + tabindex）启用
   * Enter / Space → click 委托。原生 <button> 已有此行为，不会被重复触发
   * （这里通过 target.matches 显式过滤原生按钮）。仅做事件桥接，不改任何既有交互。 */
  function bindRoleButtonKeys() {
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      if (e.defaultPrevented) return;
      var el = e.target;
      if (!el || el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
      if (!el.matches || !el.matches('[role="button"][tabindex], [role="switch"][tabindex]')) return;
      e.preventDefault();
      el.click();
    });
  }

  function init() {
    injectIcons();
    bindTabs();
    bindRoleButtonKeys();
    tick();
    setInterval(tick, 30000);
    route(DEFAULT_PAGE);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
