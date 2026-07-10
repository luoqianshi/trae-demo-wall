/**
 * 好好穿 Wearwell - 桌面展示页交互逻辑
 * 屏幕切换、Tab 导航、子页面返回、键盘导航等
 */

(function () {
  'use strict';

  /* ===== 状态 ===== */
  const SCREENS = ['splash', 'today', 'looks', 'memory-detail', 'closet', 'item-detail', 'capture', 'ai-confirm', 'preview', 'me'];

  // 主 Tab 屏幕和对应的 Tab Bar 名称
  const TAB_SCREENS = ['today', 'looks', 'capture', 'closet', 'me'];

  // 子页面的父屏幕（用于返回）
  const PARENT_MAP = {
    'memory-detail': 'today',
    'item-detail': 'closet',
    'ai-confirm': 'capture',
    'preview': 'memory-detail'
  };

  // 备选搭配数据集（3 套）
  const BACKUP_SETS = [
    [
      { src: 'assets/hero-outfit.jpg', alt: '通勤搭配' },
      { src: 'assets/outfit-weekend.jpg', alt: '周末搭配' },
      { src: 'assets/outfit-evening.jpg', alt: '晚间搭配' }
    ],
    [
      { src: 'assets/outfit-weekend.jpg', alt: '周末搭配' },
      { src: 'assets/outfit-evening.jpg', alt: '晚间搭配' },
      { src: 'assets/hero-outfit.jpg', alt: '通勤搭配' }
    ],
    [
      { src: 'assets/outfit-evening.jpg', alt: '晚间搭配' },
      { src: 'assets/hero-outfit.jpg', alt: '通勤搭配' },
      { src: 'assets/outfit-weekend.jpg', alt: '周末搭配' }
    ]
  ];

  let currentScreen = 'splash';
  let backupIndex = 0;
  let splashTimer = null;

  /* ===== DOM 缓存 ===== */
  const phoneInner = document.querySelector('.phone-inner');
  const toast = document.getElementById('toast');
  const dotsContainer = document.getElementById('screenDots');

  /* ===== 工具函数 ===== */

  // 显示 Toast 通知
  function showToast(text) {
    if (!toast) return;
    toast.querySelector('span').textContent = text;
    toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      toast.classList.remove('show');
    }, 1600);
  }

  // 获取指定屏幕 DOM
  function getScreen(name) {
    return phoneInner.querySelector('[data-screen="' + name + '"]');
  }

  // 更新右侧导航点
  function updateDots(name) {
    if (!dotsContainer) return;
    var dots = dotsContainer.querySelectorAll('.screen-dot');
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('active', dots[i].getAttribute('data-dot') === name);
    }
  }

  // 更新所有 Tab Bar 中指定 tab 的高亮状态
  function updateTabHighlight(tabName) {
    var allTabs = phoneInner.querySelectorAll('.tab-item[data-tab]');
    for (var i = 0; i < allTabs.length; i++) {
      allTabs[i].classList.toggle('active', allTabs[i].getAttribute('data-tab') === tabName);
    }
  }

  /* ===== 核心屏幕切换 ===== */
  function switchTo(name) {
    var screen = getScreen(name);
    if (!screen) return;

    // 移除当前屏幕的 active
    var current = getScreen(currentScreen);
    if (current) current.classList.remove('active');

    // 激活目标屏幕
    screen.classList.add('active');

    // 滚动到顶部（内容区域）
    var content = screen.querySelector('.screen-content');
    if (content) content.scrollTop = 0;

    currentScreen = name;
    updateDots(name);

    // 更新 Tab 高亮
    if (TAB_SCREENS.indexOf(name) !== -1) {
      updateTabHighlight(name);
    }
  }

  /* ===== Splash 自动跳转 ===== */
  function startSplash() {
    splashTimer = setTimeout(function () {
      switchTo('today');
    }, 1250);
  }

  /* ===== 事件绑定 ===== */
  function bindEvents() {
    // 1. Tab Bar 点击
    phoneInner.addEventListener('click', function (e) {
      var tabItem = e.target.closest('.tab-item[data-tab]');
      if (tabItem) {
        e.preventDefault();
        var tab = tabItem.getAttribute('data-tab');
        switchTo(tab);
        return;
      }

      // 2. 自定义 action 按钮
      var actionEl = e.target.closest('[data-action]');
      if (actionEl) {
        handleAction(actionEl.getAttribute('data-action'));
        return;
      }

      // 3. 分类胶囊切换
      var pill = e.target.closest('.category-pill');
      if (pill) {
        var strip = pill.parentElement;
        strip.querySelectorAll('.category-pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        return;
      }

      // 4. 替换策略切换
      var segBtn = e.target.closest('.segmented-btn');
      if (segBtn) {
        segBtn.parentElement.querySelectorAll('.segmented-btn').forEach(function (b) { b.classList.remove('active'); });
        segBtn.classList.add('active');
        return;
      }

      // 5. 替换候选卡片选中
      var candidate = e.target.closest('.replace-candidate');
      if (candidate) {
        candidate.parentElement.querySelectorAll('.replace-candidate').forEach(function (c) { c.classList.remove('active'); });
        candidate.classList.add('active');
        return;
      }

      // 6. 视图切换
      var viewBtn = e.target.closest('.view-toggle button');
      if (viewBtn) {
        viewBtn.parentElement.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
        viewBtn.classList.add('active');
        return;
      }
    });

    // 7. 右侧导航点点击
    if (dotsContainer) {
      dotsContainer.addEventListener('click', function (e) {
        var dot = e.target.closest('.screen-dot');
        if (dot) {
          clearTimeout(splashTimer);
          switchTo(dot.getAttribute('data-dot'));
        }
      });
    }

    // 8. 键盘左右箭头切换
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        clearTimeout(splashTimer);
        var idx = SCREENS.indexOf(currentScreen);
        var next;
        if (e.key === 'ArrowRight') {
          next = (idx + 1) % SCREENS.length;
        } else {
          next = (idx - 1 + SCREENS.length) % SCREENS.length;
        }
        switchTo(SCREENS[next]);
      }
    });
  }

  /* ===== Action 处理器 ===== */
  function handleAction(action) {
    switch (action) {
      case 'back':
        var parent = PARENT_MAP[currentScreen];
        if (parent) switchTo(parent);
        break;

      case 'back-to-today':
        showToast('已加入今日搭配');
        setTimeout(function () { switchTo('today'); }, 400);
        break;

      case 'open-memory-detail':
        switchTo('memory-detail');
        break;

      case 'open-item-detail':
        switchTo('item-detail');
        break;

      case 'open-ai-confirm':
        switchTo('ai-confirm');
        break;

      case 'open-preview':
        switchTo('preview');
        break;

      case 'shuffle-backup':
        backupIndex = (backupIndex + 1) % BACKUP_SETS.length;
        renderBackupCards();
        showToast('已切换备选搭配');
        break;
    }
  }

  /* ===== 备选搭配渲染 ===== */
  function renderBackupCards() {
    var strip = phoneInner.querySelector('.today-content .backup-strip');
    if (!strip) return;
    var set = BACKUP_SETS[backupIndex];
    strip.innerHTML = '';
    for (var i = 0; i < set.length; i++) {
      var card = document.createElement('div');
      card.className = 'backup-card';
      card.innerHTML = '<img src="' + set[i].src + '" alt="' + set[i].alt + '" />';
      card.addEventListener('click', function () {
        // 点击备选卡时更新主推荐卡片（简单演示：仅显示 toast）
        showToast('已更新主推荐');
      });
      strip.appendChild(card);
    }
  }

  /* ===== 初始化 ===== */
  function init() {
    bindEvents();
    startSplash();
    updateDots('splash');
  }

  // 等 DOM 就绪后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
