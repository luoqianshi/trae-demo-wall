/* ============================================================
   归位 App - 共享交互脚本
   负责页面导航、Tab 栏、Toast 反馈、涟漪效果等通用交互
   注：各业务页面的具体逻辑由其内联脚本自行处理
   ============================================================ */
(function () {
  'use strict';

  // ── 页面路由映射 ──
  var PAGES = {
    home: 'home.html',
    hierarchy: 'hierarchy.html',
    items: 'items.html',
    'item-detail': 'item-detail.html',
    scan: 'scan.html',
    settings: 'settings.html'
  };

  // 根据当前文件名推断激活的 Tab
  var currentPath = window.location.pathname.split('/').pop() || 'home.html';
  var activePageKey = Object.keys(PAGES).find(function (k) {
    return PAGES[k] === currentPath;
  });

  // ── Toast 工具 ──
  var toastTimer = null;
  function showToast(message) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    if (toastTimer) clearTimeout(toastTimer);
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = [
      'position:fixed',
      'left:50%',
      'bottom:80px',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:#fff',
      'padding:8px 16px',
      'border-radius:8px',
      'font-size:13px',
      'z-index:9999',
      'pointer-events:none',
      'max-width:80%',
      'text-align:center'
    ].join(';');
    document.body.appendChild(toast);
    toastTimer = setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2200);
  }

  // ── 涟漪效果 ──
  function attachRipple(el) {
    if (!el) return;
    el.style.position = el.style.position || 'relative';
    el.style.overflow = 'hidden';
    el.addEventListener('click', function (e) {
      var rect = el.getBoundingClientRect();
      var ripple = document.createElement('span');
      var size = Math.max(rect.width, rect.height);
      ripple.style.cssText = [
        'position:absolute',
        'width:' + size + 'px',
        'height:' + size + 'px',
        'left:' + (e.clientX - rect.left - size / 2) + 'px',
        'top:' + (e.clientY - rect.top - size / 2) + 'px',
        'border-radius:50%',
        'background:rgba(216,27,96,0.18)',
        'transform:scale(0)',
        'animation:ripple 0.6s ease-out',
        'pointer-events:none'
      ].join(';');
      el.appendChild(ripple);
      setTimeout(function () {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
      }, 600);
    });
  }

  // ── 导航：跳转 ──
  function navigate(pageKey) {
    if (PAGES[pageKey]) {
      window.location.href = PAGES[pageKey];
    }
  }

  // ── Tab 栏统一处理 ──
  function setupTabBar() {
    var tabMap = {
      'tab-home': 'home',
      'tab-browse': 'hierarchy',
      'tab-items': 'items',
      'tab-settings': 'settings'
    };
    Object.keys(tabMap).forEach(function (id) {
      var els = document.querySelectorAll('[data-dom-id="' + id + '"]');
      els.forEach(function (el) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', function (e) {
          e.preventDefault();
          navigate(tabMap[id]);
        });
        if (tabMap[id] === activePageKey) {
          el.setAttribute('data-active', 'true');
        }
      });
    });
  }

  // ── 首页：feature 卡片点击（带 returnTo） ──
  function setupHomeCards() {
    var cardMap = {
      'cta-scan': { page: 'scan', returnTo: 'home.html' },
      'cta-browse-hierarchy': { page: 'hierarchy', returnTo: null },
      'cta-browse-items': { page: 'items', returnTo: null }
    };
    Object.keys(cardMap).forEach(function (id) {
      var el = document.querySelector('[data-dom-id="' + id + '"]');
      if (el) {
        attachRipple(el);
        el.addEventListener('click', function () {
          var cfg = cardMap[id];
          var url = PAGES[cfg.page];
          if (cfg.returnTo) {
            url += '?returnTo=' + encodeURIComponent(cfg.returnTo);
          }
          window.location.href = url;
        });
      }
    });

    var settingsBtn = document.querySelector('[data-dom-id="settings-btn"]');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function () { navigate('settings'); });
    }

    var sectionLink = document.querySelector('.section-link');
    if (sectionLink) {
      sectionLink.href = PAGES.items;
    }
  }

  // ── 扫码页：闪光灯（返回按钮和手动输入由 scan.html 内联脚本处理） ──
  function setupScan() {
    var flashBtn = document.querySelector('.scan-flash-btn');
    if (flashBtn) {
      var flashOn = false;
      flashBtn.addEventListener('click', function () {
        flashOn = !flashOn;
        var bg = document.querySelector('.scan-camera-bg');
        if (bg) {
          bg.style.background = flashOn
            ? 'radial-gradient(ellipse at center, #2a2a3e 0%, #1a1a2e 70%)'
            : 'radial-gradient(ellipse at center, #1a1a2e 0%, #0F0F1A 70%)';
        }
        showToast(flashOn ? '闪光灯已开启' : '闪光灯已关闭');
      });
    }
  }

  // ── 设置页：语言切换 ──
  function setupSettings() {
    var radioItems = document.querySelectorAll('.radio-list__item, [data-dom-id^="lang-"]');
    radioItems.forEach(function (item) {
      item.addEventListener('click', function () {
        radioItems.forEach(function (r) { r.classList.remove('is-selected'); r.removeAttribute('data-active'); });
        item.classList.add('is-selected');
        item.setAttribute('data-active', 'true');
        showToast('已切换：' + (item.textContent || '').trim().split('\n')[0]);
      });
    });
  }

  // ── 初始化 ──
  function init() {
    setupTabBar();

    // 涟漪动画样式（一次性注入）
    if (!document.getElementById('ripple-style')) {
      var style = document.createElement('style');
      style.id = 'ripple-style';
      style.textContent = '@keyframes ripple{to{transform:scale(2.4);opacity:0;}}';
      document.head.appendChild(style);
    }

    // 根据当前页面加载对应逻辑
    // 注：hierarchy/items/item-detail 页面的业务逻辑由各自内联脚本完整处理，
    // 此处仅处理首页卡片、扫码页闪光灯、设置页语言切换等辅助交互
    switch (currentPath) {
      case PAGES.home:
        setupHomeCards();
        break;
      case PAGES.scan:
        setupScan();
        break;
      case PAGES.settings:
        setupSettings();
        break;
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 暴露 showToast 供外部调用
  window.GuiweiApp = { showToast: showToast, navigate: navigate };
})();
