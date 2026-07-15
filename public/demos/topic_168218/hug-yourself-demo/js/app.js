/**
 * app.js - 应用启动器
 * 初始化 Store、Router，提供全局页面加载接口
 * 原生 ES6+，零外部依赖
 */
'use strict';

/**
 * 应用主控制器
 */
const App = {
  /** Router 实例引用 */
  router: null,

  /** 页面控制器缓存 */
  pageControllers: new Map(),

  /** 应用是否已初始化 */
  initialized: false,

  /** 首次访问标记 */
  firstVisit: false,

  /** 应用启动时间戳 */
  launchTime: 0,

  /**
   * 应用初始化入口
   * 执行顺序：Store 持久化恢复 -> Router 初始化 -> 首次访问检测 -> 触发路由
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) {
      console.warn('[App] 应用已初始化，跳过');
      return;
    }

    this.launchTime = Date.now();
    console.log(`[App] 启动中... ${formatDate(this.launchTime)}`);

    try {
      // 第一步：恢复持久化数据到 Store
      this._restorePersistedData();

      // 第三步：处理待注册的页面控制器（必须在Router初始化之前）
      this._processPendingRegistrations();

      // 第四步：注册全局样式/转场动画配置
      this._injectTransitionStyles();

      // 第五步：初始化 Router（会触发首次页面加载）
      this._initRouter();

      // 标记初始化完成
      this.initialized = true;
      console.log('[App] 初始化完成');
    } catch (error) {
      console.error('[App] 初始化失败:', error);
      throw error;
    }
  },

  /**
   * 从 localStorage 恢复持久化数据
   * 依次恢复各模块状态，保留默认值作为 fallback
   */
  _restorePersistedData() {
    const persistKeys = [
      'currentUser',
      'chatSession',
      'breathing',
      'trashCan',
      'training',
    ];

    persistKeys.forEach(key => {
      const defaultValue = Store.state[key];
      const loaded = Store.loadFromStorage(key, defaultValue);

      if (loaded) {
        console.log(`[App] 已恢复持久化数据: ${key}`);
      }
    });
  },

  /**
   * 初始化路由系统
   * 注册路由表、路由守卫、路由变化回调
   */
  _initRouter() {
    // 页面路由表
    const routes = {
      '/': 'home',
      '/ai-chat': 'ai-chat',
      '/breathing': 'breathing',
      '/trash-can': 'trash-can',
      '/training-hub': 'training-hub',
      '/cbt-form': 'cbt-form',
      '/boundary-scissors': 'boundary-scissors',
      '/energy-map': 'energy-map',
      '/settings': 'settings',
      '/onboarding': 'onboarding',
    };

    // 路由守卫：检查登录状态
    const beforeEach = (page, params) => {
      // 放行 home 页面
      if (page === 'home') {
        return true;
      }

      return true;
    };

    // 路由变化回调：加载对应页面控制器
    const onRouteChange = (page, params, navigationInfo) => {
      this._loadPage(page, params, navigationInfo);
    };

    // 创建 Router 实例
    this.router = new Router({
      routes,
      onRouteChange,
      beforeEach,
      transitionDuration: 350,
    });

    // 初始化 Router（绑定 hashchange 事件）
    this.router.init();

    // 暴露到全局以便 Page 控制器访问
    window.Router = this.router;
    console.log('[App] Router 初始化完成');
  },

  /**
   * 注入 CSS 转场动画样式
   * 支持页面切换时的滑动/淡入淡出动画
   */
  _injectTransitionStyles() {
    // 检查是否已注入
    if (document.getElementById('app-transition-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'app-transition-styles';
    style.textContent = `
      /* 页面容器 - 默认 */
      .page-container {
        position: relative;
        width: 100%;
        min-height: 100vh;
        overflow: hidden;
      }

      /* 页面内容包装器 */
      .page-view {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        transition: transform 0.35s ease, opacity 0.35s ease;
        will-change: transform, opacity;
      }

      /* 有导航栏时页面视图占满视口，顶部留空给导航栏 */
      .page-container.has-nav-bar .page-view {
        height: 100vh;
      }

      /* 进场动画 - 向前导航 */
      .page-view.enter-forward {
        animation: slideInRight 0.35s ease forwards;
      }

      /* 出场动画 - 向前导航 */
      .page-view.exit-forward {
        animation: slideOutLeft 0.35s ease forwards;
      }

      /* 进场动画 - 向后导航 */
      .page-view.enter-backward {
        animation: slideInLeft 0.35s ease forwards;
      }

      /* 出场动画 - 向后导航 */
      .page-view.exit-backward {
        animation: slideOutRight 0.35s ease forwards;
      }

      /* 淡入动画 */
      .page-view.fade-in {
        animation: fadeIn 0.3s ease forwards;
      }

      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0.5; }
        to   { transform: translateX(0);    opacity: 1; }
      }

      @keyframes slideOutLeft {
        from { transform: translateX(0);    opacity: 1; }
        to   { transform: translateX(-30%); opacity: 0; }
      }

      @keyframes slideInLeft {
        from { transform: translateX(-30%); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
      }

      @keyframes slideOutRight {
        from { transform: translateX(0);    opacity: 1; }
        to   { transform: translateX(100%); opacity: 0.5; }
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* 首次加载初始状态 */
      .page-view.initial {
        opacity: 0;
      }
    `;

    document.head.appendChild(style);
  },

  /**
   * 加载页面控制器
   * 根据页面名称查找对应的 controller 并执行挂载逻辑
   * @param {string} page - 页面名称
   * @param {Object} params - 路由参数
   * @param {Object} navigationInfo - 导航信息 { previousPage, direction, history }
   */
  async _loadPage(page, params, navigationInfo) {
    const { direction, previousPage } = navigationInfo;

    // 获取页面容器
    const container = document.getElementById('pageContainer');
    if (!container) {
      console.warn('[App] 未找到 #pageContainer 容器');
      return;
    }

    // 构建页面视图
    const pageView = document.createElement('div');
    pageView.className = 'page-view';
    pageView.dataset.page = page;

    // 检查是否首次加载
    const isFirstLoad = !previousPage;

    try {
      // 加载页面模板
      const content = await this._loadPageTemplate(page, params);
      pageView.innerHTML = content;

      if (isFirstLoad) {
        // 首次加载：淡入
        pageView.classList.add('initial');
        container.appendChild(pageView);

        // 触发重绘后执行淡入
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            pageView.classList.remove('initial');
            pageView.classList.add('fade-in');

            // 动画结束后清理
            setTimeout(() => {
              pageView.classList.remove('fade-in');
            }, 350);
          });
        });
      } else {
        // 非首次加载：执行转场动画
        // 找到当前显示的页面执行退出动画
        const previousView = container.querySelector('.page-view');
        if (previousView) {
          const exitClass = direction === 'backward' ? 'exit-backward' : 'exit-forward';
          previousView.classList.add(exitClass);

          // 动画结束后移除旧页面
          setTimeout(() => {
            if (previousView.parentNode) {
              previousView.parentNode.removeChild(previousView);
            }
          }, 350);
        }

        // 新页面执行进场动画
        const enterClass = direction === 'backward' ? 'enter-backward' : 'enter-forward';
        pageView.classList.add(enterClass);
        container.appendChild(pageView);

        // 动画结束后清理类名
        setTimeout(() => {
          pageView.classList.remove(enterClass);
        }, 350);
      }

      // 执行页面控制器（如果存在）
      await this._executePageController(page, pageView, params);

      // 更新页面标题
      this._updatePageTitle(page);

      // 滚动到页面顶部
      const activePageView = container.querySelector('.page-view:last-child');
      if (activePageView) {
        activePageView.scrollTo({ top: 0, behavior: 'auto' });
      }

    } catch (error) {
      console.error(`[App] 加载页面 [${page}] 失败:`, error);
      pageView.innerHTML = `
        <div class="page-error">
          <h2>页面加载失败</h2>
          <p>${error.message || '未知错误'}</p>
          <button onclick="window.location.reload()">刷新页面</button>
        </div>
      `;
      container.appendChild(pageView);
    }
  },

  /**
   * 加载页面模板
   * 查找页面控制器或直接加载 HTML 内容
   * @param {string} page - 页面名称
   * @param {Object} params - 路由参数
   * @returns {Promise<string>} 页面 HTML 内容
   */
  async _loadPageTemplate(page, params) {
    // 1. 尝试从已注册的页面控制器获取模板
    if (this.pageControllers.has(page)) {
      const controller = this.pageControllers.get(page);
      if (typeof controller.render === 'function') {
        return controller.render(params);
      }
    }

    // 2. 通过 file:// 协议直接打开时，fetch 会触发同源安全限制，
    //    而本项目没有独立的 pages/*.html 模板，直接返回默认占位模板
    if (window.location.protocol === 'file:') {
      return this._getDefaultTemplate(page, params);
    }

    // 3. 尝试加载对应的 HTML 文件（仅在 http/https 环境下生效）
    try {
      const response = await fetch(`/pages/${page}.html`);
      if (response.ok) {
        return await response.text();
      }
    } catch (e) {
      // 静默失败，使用默认模板
    }

    // 4. 使用默认占位模板
    return this._getDefaultTemplate(page, params);
  },

  /**
   * 获取默认页面占位模板
   * @param {string} page - 页面名称
   * @param {Object} params - 路由参数
   * @returns {string} HTML
   */
  _getDefaultTemplate(page, params) {
    const pageNames = {
      home: '首页',
      'ai-chat': 'AI 聊天',
      breathing: '呼吸练习',
      'trash-can': '情绪垃圾桶',
      'training-hub': '日常训练',
      'cbt-form': '心理预案',
      'boundary-scissors': '课题分离剪',
      'energy-map': '能量地图',
      settings: '设置'
    };

    const title = pageNames[page] || page;

    return `
      <div class="page-${page} page-content">
        <header class="page-header">
          <h1>${title}</h1>
        </header>
        <main class="page-main">
          <p class="page-placeholder">${title} 页面加载中...</p>
          <p class="page-params-note">${params ? JSON.stringify(params) : ''}</p>
        </main>
      </div>
    `;
  },

  /**
   * 执行页面控制器逻辑
   * @param {string} page - 页面名称
   * @param {HTMLElement} pageView - 页面 DOM 元素
   * @param {Object} params - 路由参数
   */
  async _executePageController(page, pageView, params) {
    if (this.pageControllers.has(page)) {
      const controller = this.pageControllers.get(page);

      // 执行控制器挂载
      if (typeof controller.mount === 'function') {
        try {
          await controller.mount(pageView, params);
        } catch (error) {
          console.error(`[App] 页面控制器 mount 失败 [${page}]:`, error);
        }
      }

      // 执行控制器生命周期钩子
      if (typeof controller.onEnter === 'function') {
        controller.onEnter(params);
      }
    }
  },

  /**
   * 更新页面标题
   * @param {string} page - 页面名称
   */
  _updatePageTitle(page) {
    const titles = {
      home: '首页 - Hug Yourself',
      'ai-chat': 'AI 聊天 - Hug Yourself',
      breathing: '呼吸练习 - Hug Yourself',
      'trash-can': '情绪垃圾桶 - Hug Yourself',
      'training-hub': '日常训练 - Hug Yourself',
      'cbt-form': '心理预案 - Hug Yourself',
      'boundary-scissors': '课题分离剪 - Hug Yourself',
      'energy-map': '能量地图 - Hug Yourself',
      settings: '设置 - Hug Yourself'
    };

    document.title = titles[page] || 'Hug Yourself';
  },

  /**
   * 注册页面控制器
   * @param {string} page - 页面名称
   * @param {Object} controller - 控制器对象 { render, mount, onEnter, onLeave }
   */
  registerPage(page, controller) {
    if (this.pageControllers.has(page)) {
      console.warn(`[App] 页面控制器已存在 [${page}]，将被覆盖`);
    }
    this.pageControllers.set(page, controller);
    console.log(`[App] 已注册页面控制器: ${page}`);
  },

  /**
   * 全局页面跳转接口
   * 供外部直接调用，自动处理路由导航
   * @param {string} pageName - 页面名称
   * @param {Object} [params={}] - 路由参数
   * @param {boolean} [replace=false] - 是否替换当前历史
   */
  showPage(pageName, params = {}, replace = false) {
    if (!this.router) {
      console.warn('[App] Router 未初始化，无法跳转');
      return;
    }
    this.router.navigateTo(pageName, params, replace);
  },

  /**
   * navigateTo - App.showPage 的别名，供页面内联事件调用
   * @param {string} pageName - 页面名称
   * @param {Object} [params={}] - 路由参数
   */
  navigateTo(pageName, params = {}) {
    this.showPage(pageName, params);
  },

  /**
   * 处理待注册的页面控制器
   * 在 App.init() 执行时，将页面控制器脚本在加载阶段已推入
   * window._pageRegistrations 队列中的控制器逐一注册到 App 中
   */
  _processPendingRegistrations() {
    if (window._pageRegistrations && window._pageRegistrations.length > 0) {
      window._pageRegistrations.forEach(reg => {
        this.registerPage(reg.page, reg.controller);
      });
      console.log(`[App] 已注册 ${window._pageRegistrations.length} 个页面控制器`);
      delete window._pageRegistrations;
    }
  },

  /**
   * 获取应用状态
   * @returns {Object} 当前应用信息
   */
  getAppInfo() {
    return {
      initialized: this.initialized,
      firstVisit: this.firstVisit,
      currentPage: this.router ? this.router.getCurrentPage() : null,
      launchTime: this.launchTime,
      uptime: Date.now() - this.launchTime,
    };
  },
};

// 暴露到全局（Router 由 router.js 暴露到全局，这里不再重复）
window.App = App;

// 页面加载完成后初始化应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    App.init().catch(console.error);
  });
} else {
  App.init().catch(console.error);
}