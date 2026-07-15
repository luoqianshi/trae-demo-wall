'use strict';

/**
 * NavBar - 导航栏组件
 * 
 * 管理页面顶部导航栏的显示/隐藏、标题切换和返回按钮状态。
 * 依赖 HTML 中已存在的以下 DOM 结构：
 *   <nav id="navBar">
 *     <button id="navBack">&#x2190;</button>
 *     <span id="navTitle">抱抱自己</span>
 *   </nav>
 */
const NavBar = {
  // ============================================================
  // 页面标题映射
  // key: 页面名称（路由标识），value: 导航栏显示的中文标题
  // ============================================================
  pageTitles: {
    'home': '抱抱自己',
    'ai-chat': 'AI情绪分析',
    'breathing': '正念呼吸',
    'trash-can': '情绪垃圾桶',
    'cbt-form': '心理预案',
    'boundary-scissors': '课题分离剪',
    'energy-map': '能量地图',
    'training-hub': '日常训练'
  },

  // ============================================================
  // 不需要返回按钮的页面列表
  // 这些页面通常为顶层页面，无需提供返回上一级的功能
  // ============================================================
  noBackPages: ['home'],

  // ============================================================
  // 页面返回路径映射
  // key: 当前页面，value: 点击返回按钮应回到的父级页面
  // 避免依赖浏览器历史栈造成 AI聊天 <-> 课题分离 这类循环跳转
  // ============================================================
  backRoutes: {
    'home': null,
    'ai-chat': 'home',
    'breathing': 'home',
    'trash-can': 'home',
    'training-hub': 'home',
    'cbt-form': 'training-hub',
    'boundary-scissors': 'training-hub',
    'energy-map': 'training-hub'
  },

  /** @type {string} 当前显示的页面名称 */
  _currentPage: 'home',

  /** @type {boolean} 返回按钮事件是否已绑定 */
  _backBound: false,

  /**
   * 显示/更新导航栏
   *
   * @param {string} pageName - 当前页面名称（对应 pageTitles 中的 key）
   * @param {Object} [options={}] - 可选配置项
   * @param {boolean} [options.showBack] - 强制指定返回按钮显隐（覆盖默认逻辑）
   */
  show(pageName, options = {}) {
    // 记录当前页面，供 goBack 使用
    this._currentPage = pageName;
    // 获取导航栏 DOM 元素
    const nav = document.getElementById('navBar');
    const title = document.getElementById('navTitle');
    const back = document.getElementById('navBack');

    // 绑定返回按钮点击事件（仅绑定一次，优先于内联 onclick）
    if (back && !this._backBound) {
      back.addEventListener('click', () => this.goBack());
      this._backBound = true;
    }

    // 如果关键 DOM 元素缺失，静默退出以避免报错
    if (!nav || !title || !back) {
      console.warn('[NavBar] 导航栏 DOM 元素未找到，请确保 HTML 中包含 navBar/navTitle/navBack');
      return;
    }

    // ----- 首页：隐藏导航栏 -----
    if (pageName === 'home') {
      nav.style.display = 'none';
      document.getElementById('pageContainer').classList.remove('has-nav-bar');
      return;
    }

    // ----- 非首页：显示导航栏 -----
    nav.style.display = 'flex';
    document.getElementById('pageContainer').classList.add('has-nav-bar');

    // 设置页面标题（若映射表中不存在则以默认值回退）
    title.textContent = this.pageTitles[pageName] || '抱抱自己';

    // ----- 控制返回按钮显隐 -----
    // 优先级：options.showBack > noBackPages 规则
    if (typeof options.showBack === 'boolean') {
      back.style.display = options.showBack ? 'flex' : 'none';
    } else {
      back.style.display = this.noBackPages.includes(pageName) ? 'none' : 'flex';
    }
  },

  /**
   * 返回按钮点击处理
   * 根据当前页面在 backRoutes 中的父级映射进行跳转，
   * 而不是依赖浏览器历史栈，避免页面间循环返回。
   */
  goBack() {
    const parentPage = this.backRoutes[this._currentPage];

    // 没有父级页面（如首页）则不执行返回
    if (!parentPage) {
      console.log('[NavBar] 当前页面没有配置返回路径');
      return;
    }

    // 使用 App 的路由方法跳转到父级页面
    if (typeof App !== 'undefined' && typeof App.navigateTo === 'function') {
      App.navigateTo(parentPage);
    } else if (typeof App !== 'undefined' && typeof App.router !== 'undefined' && typeof App.router.navigateTo === 'function') {
      App.router.navigateTo(parentPage);
    } else {
      console.warn('[NavBar] App 导航方法不可用，无法返回');
    }
  }
};