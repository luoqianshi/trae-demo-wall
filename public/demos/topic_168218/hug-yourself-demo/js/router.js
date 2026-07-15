/**
 * router.js - Hash 路由系统
 * 基于 hashchange 事件实现前端路由，支持参数传递、导航历史、转场动画、路由守卫
 * 原生 ES6+，零外部依赖
 */
'use strict';

/**
 * Hash 路由类
 */
class Router {
  /**
   * @param {Object} options - 配置项
   * @param {Object} options.routes - 路由表 { hash: pageName, ... }
   * @param {Function} options.onRouteChange - 路由变化回调 (pageName, params) => void
   * @param {Function} [options.beforeEach] - 路由守卫，返回 false 阻止跳转
   * @param {number} [options.transitionDuration=300] - 转场动画时长 ms
   */
  constructor(options = {}) {
    const {
      routes = {},
      onRouteChange = () => {},
      beforeEach = null,
      transitionDuration = 300,
    } = options;

    /** 路由表：hash -> 页面名称 */
    this.routes = routes;

    /** 路由变化回调 */
    this.onRouteChange = onRouteChange;

    /** 路由守卫（前置钩子） */
    this.beforeEach = beforeEach;

    /** 转场动画时长 */
    this.transitionDuration = transitionDuration;

    /** 导航历史栈 */
    this.history = [];

    /** 当前页面名称 */
    this.currentPage = '';

    /** 当前路由参数 */
    this.currentParams = {};

    /** 上次页面名称（用于转场方向判断） */
    this.previousPage = '';

    /** 绑定的 hashchange 处理器（保存引用以便移除） */
    this._hashChangeHandler = null;

    /** 是否已初始化 */
    this._initialized = false;
  }

  /**
   * 默认路由表
   * 可根据项目需求扩展
   */
  static DEFAULT_ROUTES = {
    '/': 'home',
    '/ai-chat': 'ai-chat',
    '/breathing': 'breathing',
    '/trash-can': 'trash-can',
    '/training': 'training',
    '/settings': 'settings',
    '/onboarding': 'onboarding',
  };

  /**
   * 初始化路由
   * 绑定 hashchange 事件，解析当前 hash
   */
  init() {
    if (this._initialized) {
      console.warn('[Router] 已初始化，请勿重复调用');
      return;
    }

    // 绑定 hashchange 事件
    this._hashChangeHandler = this._handleHashChange.bind(this);
    window.addEventListener('hashchange', this._hashChangeHandler);

    // 解析当前 hash（首次加载）
    this._resolveCurrentHash();

    this._initialized = true;
    console.log('[Router] 初始化完成');
  }

  /**
   * 销毁路由，解绑事件
   */
  destroy() {
    if (this._hashChangeHandler) {
      window.removeEventListener('hashchange', this._hashChangeHandler);
      this._hashChangeHandler = null;
    }
    this.history = [];
    this._initialized = false;
    console.log('[Router] 已销毁');
  }

  /**
   * 解析当前 hash 并触发路由变化
   */
  _resolveCurrentHash() {
    const hash = window.location.hash.slice(1) || '/';
    const { page, params } = this._parseHash(hash);
    this._executeRoute(page, params);
  }

  /**
   * 处理 hashchange 事件
   */
  _handleHashChange() {
    this._resolveCurrentHash();
  }

  /**
   * 解析 hash 字符串，分离页面名和参数
   * 支持格式：/page?key=value&key2=value2 或 /page/param
   * @param {string} hash - hash 字符串（不含 #）
   * @returns {{ page: string, params: Object }}
   */
  _parseHash(hash) {
    // 分离路径和查询字符串
    const [pathPart, queryString] = hash.split('?');
    const paths = pathPart.split('/').filter(Boolean);

    // 从路由表中查找匹配
    let page = '';
    let params = {};

    // 查找最精确匹配
    const routePath = '/' + paths.join('/');
    if (this.routes[routePath]) {
      page = this.routes[routePath];
    } else {
      // 尝试匹配父路径
      const parentPath = '/' + paths.slice(0, -1).join('/');
      if (this.routes[parentPath]) {
        page = this.routes[parentPath];
        // 剩余路径片段作为参数
        params._pathParam = paths[paths.length - 1];
      } else if (this.routes['/']) {
        // 默认回退
        page = this.routes['/'];
      }
    }

    // 解析查询字符串参数
    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [key, value] = pair.split('=').map(decodeURIComponent);
        if (key) {
          // 尝试解析 JSON 值
          try {
            params[key] = JSON.parse(value);
          } catch {
            params[key] = value;
          }
        }
      });
    }

    return { page, params };
  }

  /**
   * 执行路由跳转（内部方法）
   * @param {string} page - 页面名称
   * @param {Object} params - 路由参数
   * @returns {Promise<boolean>} 是否成功执行
   */
  async _executeRoute(page, params) {
    if (!page) {
      console.warn(`[Router] 无法匹配路由: ${window.location.hash}`);
      return false;
    }

    // 路由守卫检查
    if (typeof this.beforeEach === 'function') {
      try {
        const canProceed = await this.beforeEach(page, params);
        if (canProceed === false) {
          console.log(`[Router] 路由守卫阻止跳转: ${page}`);
          return false;
        }
      } catch (error) {
        console.error('[Router] 路由守卫出错:', error);
        return false;
      }
    }

    // 跳转到相同页面不重复处理
    if (this.currentPage === page && JSON.stringify(this.currentParams) === JSON.stringify(params)) {
      return false;
    }

    // 记录历史
    if (this.currentPage) {
      this.history.push({
        page: this.currentPage,
        params: this.currentParams,
        timestamp: Date.now(),
      });
    }

    // 记录上次页面用于转场方向
    this.previousPage = this.currentPage;

    // 更新当前页面
    this.currentPage = page;
    this.currentParams = params;

    // 计算转场方向
    const direction = this._getTransitionDirection(page);

    // 触发路由变化回调（页面控制器加载逻辑）
    this.onRouteChange(page, params, {
      previousPage: this.previousPage,
      direction,
      history: [...this.history],
    });

    // 通知 Store 导航状态变化
    if (window.Store) {
      window.Store.setState('navigation', {
        currentPage: page,
        history: [...this.history],
        transitionDirection: direction,
      });
    }

    return true;
  }

  /**
   * 计算转场方向
   * @param {string} targetPage - 目标页面
   * @returns {string} 'forward' | 'backward' | 'none'
   */
  _getTransitionDirection(targetPage) {
    // 如果历史栈为空或者是从深层页面返回，则为 backward
    if (this.history.length > 0) {
      const lastEntry = this.history[this.history.length - 1];
      // 通过路由表顺序判断（简化策略：看页面层级深度）
      const pageOrder = Object.values(this.routes);
      const currentIndex = pageOrder.indexOf(this.currentPage);
      const targetIndex = pageOrder.indexOf(targetPage);

      if (targetIndex < currentIndex) {
        return 'backward';
      }
    }

    // 如果历史栈中已有该页面，判定为返回
    const existsInHistory = this.history.some(entry => entry.page === targetPage);
    if (existsInHistory) {
      return 'backward';
    }

    return 'forward';
  }

  /**
   * 导航到指定页面
   * @param {string} page - 页面名称（路由表中的键）
   * @param {Object} [params={}] - 传递给页面的参数
   * @param {boolean} [replace=false] - 是否替换当前历史记录
   */
  navigateTo(page, params = {}, replace = false) {
    // 查找路由表中对应的 hash
    const hash = this._findHashByPage(page);
    if (!hash) {
      console.warn(`[Router] 未找到页面 [${page}] 的路由映射`);
      return;
    }

    // 构建查询字符串
    const queryParts = [];
    for (const [key, value] of Object.entries(params)) {
      if (key.startsWith('_')) continue; // 跳过内部参数
      const encodedValue = typeof value === 'object'
        ? encodeURIComponent(JSON.stringify(value))
        : encodeURIComponent(String(value));
      queryParts.push(`${encodeURIComponent(key)}=${encodedValue}`);
    }

    let hashWithParams = hash;
    if (queryParts.length > 0) {
      hashWithParams += '?' + queryParts.join('&');
    }

    // 如果是 replace 模式，替换历史记录
    if (replace) {
      window.location.replace(`#${hashWithParams}`);
    } else {
      window.location.hash = hashWithParams;
    }
  }

  /**
   * 返回上一页
   * @param {Object} [params={}] - 可选参数
   * @returns {boolean} 是否有历史记录可返回
   */
  goBack(params = {}) {
    if (this.history.length === 0) {
      console.log('[Router] 没有历史记录，无法返回');
      return false;
    }

    const lastEntry = this.history.pop();
    this.navigateTo(lastEntry.page, { ...lastEntry.params, ...params, _back: true }, true);
    return true;
  }

  /**
   * 根据页面名称查找路由 hash
   * @param {string} page - 页面名称
   * @returns {string|null} 对应的 hash 字符串
   */
  _findHashByPage(page) {
    for (const [hash, pageName] of Object.entries(this.routes)) {
      if (pageName === page) {
        return hash;
      }
    }
    return null;
  }

  /**
   * 获取当前页面名称
   * @returns {string}
   */
  getCurrentPage() {
    return this.currentPage;
  }

  /**
   * 获取当前路由参数
   * @returns {Object}
   */
  getCurrentParams() {
    return { ...this.currentParams };
  }

  /**
   * 获取导航历史
   * @returns {Array}
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * 获取上一个页面名称
   * @returns {string}
   */
  getPreviousPage() {
    return this.previousPage;
  }

  /**
   * 获取转场方向
   * @returns {string}
   */
  getTransitionDirection() {
    return this._getTransitionDirection(this.currentPage);
  }

  /**
   * 重定向到指定页面（替换当前历史记录）
   * @param {string} page - 页面名称
   * @param {Object} [params={}] - 参数
   */
  redirect(page, params = {}) {
    this.navigateTo(page, params, true);
  }
}

// 暴露到全局
window.Router = Router;