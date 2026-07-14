/* ========== app.js — 应用入口 ========== */

(function () {
  'use strict';

  function init() {
    // === 种子数据 ===
    Actions.seedDataIfEmpty();

    // === 注册路由 ===
    Router.register(/^#\/home$/, HomePage, 'tab');
    Router.register(/^#\/discover$/, DiscoverPage, 'tab');
    Router.register(/^#\/profile$/, ProfilePage, 'tab');
    Router.register(/^#\/detail\/(\d+)$/, DetailPage, 'stack');
    Router.register(/^#\/add$/, FormPage, 'stack');
    Router.register(/^#\/edit\/(\d+)$/, FormPage, 'stack');
    Router.register(/^#\/checkin\/(\d+)$/, CheckInPage, 'stack');

    // === 设置容器 ===
    const pageContent = document.querySelector('.page-content');
    const tabBarContainer = document.querySelector('.tab-bar-slot');

    Router.setContainer(pageContent);
    Router.setTabBar(tabBarContainer);

    // === 挂载 TabBar ===
    TabBar.mount(tabBarContainer);

    // === 全局 FAB ===
    const fab = document.getElementById('global-fab');
    if (fab) {
      fab.addEventListener('click', () => {
        Router.navigate('#/add');
      });
    }

    // === 状态栏时间 ===
    UI.updateStatusBarTime();
    setInterval(UI.updateStatusBarTime, 30000);

    // === 初始化路由 ===
    Router.init();

    console.log('[App] 美食捕手 Demo 已启动 🍜');
  }

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
