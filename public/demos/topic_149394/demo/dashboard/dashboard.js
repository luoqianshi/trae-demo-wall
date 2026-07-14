/**
 * VidBuddy 管理中心主模块
 * 负责管理中心页面的初始化、面板切换、导航控制等核心功能
 */
(function () {
  const VT_DASHBOARD = {};

  /**
   * 初始化管理中心
   * 初始化流程：
   * 1. 设置标签导航（历史/设置面板切换）
   * 2. 根据 URL hash 初始化当前面板
   * 3. 监听 hash 变化事件，实现基于 URL 的面板路由
   * 4. 初始化子模块（历史管理、设置、备份）
   * 5. 监听 Chrome 存储变化，实现数据实时同步
   */
  VT_DASHBOARD.init = function () {
    VT_DASHBOARD.setupTabNavigation();
    VT_DASHBOARD.initFromHash();

    // 监听 URL hash 变化，实现基于 URL 的面板路由
    // 例如：#settings 切换到设置面板，空 hash 切换到历史面板
    window.addEventListener("hashchange", VT_DASHBOARD.initFromHash);

    // 初始化子模块（按需加载，避免模块未加载时出错）
    if (window.VT_DASHBOARD_HISTORY) {
      window.VT_DASHBOARD_HISTORY.init();
    }
    if (window.VT_DASHBOARD_SETTINGS) {
      window.VT_DASHBOARD_SETTINGS.init();
    }
    if (window.VT_DASHBOARD_BACKUP) {
      window.VT_DASHBOARD_BACKUP.init();
    }

    // Chrome 存储变化监听：实现数据实时同步
    // 当其他页面或内容脚本修改了标记、截图或播放历史时，自动刷新管理中心
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local") {
        // 只在关键数据变化时刷新，避免不必要的重渲染
        if (changes.markers || changes.screenshots || changes.progressHistory) {
          if (window.VT_DASHBOARD_HISTORY && window.VT_DASHBOARD_HISTORY.loadAndRender) {
            window.VT_DASHBOARD_HISTORY.loadAndRender();
          }
        }
      }
    });
  };

  /**
   * 设置标签导航
   */
  VT_DASHBOARD.setupTabNavigation = function () {
    const pageTitle = document.getElementById("page-title");

    const btnOpenSettings = document.getElementById("btn-open-settings");
    if (btnOpenSettings) {
      btnOpenSettings.addEventListener("click", (e) => {
        e.stopPropagation();
        VT_DASHBOARD.switchPanel("panel-settings");
      });
    }

    const btnBackToHistory = document.getElementById("btn-back-to-history");
    if (btnBackToHistory) {
      btnBackToHistory.addEventListener("click", (e) => {
        e.stopPropagation();
        VT_DASHBOARD.switchPanel("panel-history");
      });
    }

    // 暴露全局切换面板函数
    window.switchPanel = VT_DASHBOARD.switchPanel;
  };

  /**
   * 切换面板视图
   * @param {string} panelId - 面板ID（panel-history/panel-settings）
   */
  VT_DASHBOARD.switchPanel = function (panelId) {
    const panels = document.querySelectorAll(".panel-view");
    const pageTitle = document.getElementById("page-title");

    // 切换面板显示状态
    panels.forEach((panel) => {
      panel.classList.toggle("active", panel.id === panelId);
    });

    // 更新页面标题
    if (panelId === "panel-settings") {
      pageTitle.textContent = "插件配置";
    } else {
      pageTitle.textContent = "视频笔记管理中心";
    }

    // 更新 URL hash
    if (panelId === "panel-settings") {
      window.location.hash = "#settings";
    } else {
      window.location.hash = "";
    }
  };

  /**
   * 根据 URL hash 初始化面板
   */
  VT_DASHBOARD.initFromHash = function () {
    const hash = window.location.hash;
    if (hash === "#settings") {
      VT_DASHBOARD.switchPanel("panel-settings");
      if (window.VT_DASHBOARD_SETTINGS && window.VT_DASHBOARD_SETTINGS.loadSettings) {
        window.VT_DASHBOARD_SETTINGS.loadSettings();
      }
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    VT_DASHBOARD.init();
  });

  if (typeof window !== "undefined") {
    window.VT_DASHBOARD = VT_DASHBOARD;
  }
})();