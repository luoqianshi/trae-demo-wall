/* ============================================================
   main.js — 应用入口，初始化所有模块
   ============================================================ */

(function () {
  'use strict';

  // 确认所有依赖加载完成
  const requiredModules = [
    'AppState', 'MockData', 'Toast',
    'ScriptInput', 'ResultCards', 'PreviewPanel',
    'TimelinePanel', 'ExportPanel', 'TrackPanel',
    'PresetLibrary', 'KimiSettings',
  ];

  function checkDependencies() {
    const missing = requiredModules.filter(m => !window[m]);
    if (missing.length > 0) {
      console.warn('Waiting for dependencies:', missing);
      setTimeout(checkDependencies, 50);
      return;
    }
    initApp();
  }

  function initApp() {
    // 初始化所有模块
    ScriptInput.init();
    KimiSettings.init();
    ResultCards.init();
    PreviewPanel.init();
    TimelinePanel.init();
    ExportPanel.init();
    TrackPanel.init();

    // 初始化主题切换
    initThemeToggle();
    initAccentToggle();
    initModeToggle();

    console.log('快讯包装生成器 UI 已就绪');
  }

  function initModeToggle() {
    const toggle = document.querySelector('.js-mode-toggle');
    if (!toggle) return;

    const singleView = document.getElementById('mode-single');
    const trackView = document.getElementById('mode-track');

    toggle.querySelectorAll('.mode-toggle__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;

        toggle.querySelectorAll('.mode-toggle__btn').forEach(b =>
          b.classList.remove('mode-toggle__btn--active')
        );
        btn.classList.add('mode-toggle__btn--active');

        if (mode === 'single') {
          singleView.classList.add('mode-view--active');
          singleView.classList.remove('hidden');
          trackView.classList.add('hidden');
          trackView.classList.remove('mode-view--active');
        } else {
          singleView.classList.add('hidden');
          singleView.classList.remove('mode-view--active');
          trackView.classList.remove('hidden');
          trackView.classList.add('mode-view--active');
        }
      });
    });
  }

  function initThemeToggle() {
    const toggle = document.querySelector('.js-theme-toggle');
    if (!toggle) return;

    toggle.querySelectorAll('.theme-toggle__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        document.documentElement.setAttribute('data-theme', theme);
        AppState.set('theme', theme);

        toggle.querySelectorAll('.theme-toggle__btn').forEach(b =>
          b.classList.remove('theme-toggle__btn--active')
        );
        btn.classList.add('theme-toggle__btn--active');
      });
    });

    // 初始状态
    const currentTheme = AppState.get('theme');
    const activeBtn = toggle.querySelector(`[data-theme="${currentTheme}"]`);
    if (activeBtn) activeBtn.classList.add('theme-toggle__btn--active');
  }

  function initAccentToggle() {
    const toggle = document.querySelector('.js-accent-toggle');
    if (!toggle) return;

    toggle.querySelectorAll('.accent-toggle__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const accent = btn.dataset.accent;
        document.documentElement.setAttribute('data-accent', accent);
        AppState.set('accent', accent);

        toggle.querySelectorAll('.accent-toggle__btn').forEach(b =>
          b.classList.remove('accent-toggle__btn--active')
        );
        btn.classList.add('accent-toggle__btn--active');

        // 刷新预览（如果当前有选中结果）
        const currentResult = AppState.getSelectedResult();
        if (currentResult) {
          AppState.set('selectedResultId', currentResult.id);
        }
      });
    });

    // 初始状态
    const currentAccent = AppState.get('accent');
    const activeBtn = toggle.querySelector(`[data-accent="${currentAccent}"]`);
    if (activeBtn) activeBtn.classList.add('accent-toggle__btn--active');
  }

  // 启动检查
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkDependencies);
  } else {
    checkDependencies();
  }
})();