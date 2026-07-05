/**
 * app.js - 家护手记 主路由入口
 * 基于 hash 的单页应用路由管理
 */

(function () {
  'use strict';

  // ===== 页面模块映射 =====
  const PAGE_MAP = {
    '#/login': LoginPage,
    '#/home': HomePage,
    '#/family-member/add': FamilyMemberPage,
    '#/family-member/edit': FamilyMemberPage,
    '#/family-member/detail': FamilyMemberPage,
    '#/medical-record/add': MedicalRecordPage,
    '#/medical-record/edit': MedicalRecordPage,
    '#/medical-record/detail': MedicalRecordPage,
    '#/treatment/add': TreatmentPage,
    '#/treatment/edit': TreatmentPage,
    '#/treatment/detail': TreatmentPage,
    '#/records': RecordsPage,
    '#/profile': ProfilePage,
    '#/invite': InvitePage
  };

  // ===== 工具函数 =====

  /**
   * 解析 hash，提取路径和查询参数
   * @param {string} hash - 完整的 hash 字符串，如 '#/family-member/edit?id=1'
   * @returns {{ path: string, params: Object }}
   */
  function parseHash(hash) {
    const url = hash || '#/login';
    const [path, queryStr] = url.split('?');
    const params = {};

    if (queryStr) {
      queryStr.split('&').forEach(function (pair) {
        const [key, value] = pair.split('=');
        if (key) {
          params[decodeURIComponent(key)] = value !== undefined ? decodeURIComponent(value) : '';
        }
      });
    }

    return { path, params };
  }

  /**
   * 根据路径匹配路由，确定页面模块和模式
   * @param {string} path - 路由路径，如 '#/family-member/edit'
   * @returns {{ module: Object|null, mode: string }}
   */
  function matchRoute(path) {
    // 精确匹配
    if (PAGE_MAP[path]) {
      return { module: PAGE_MAP[path], mode: '' };
    }

    // 前缀匹配（支持带参数的路由，如 #/family-member/edit?id=1）
    const matchingKey = Object.keys(PAGE_MAP).find(function (key) {
      return path.indexOf(key) === 0;
    });

    if (matchingKey) {
      return { module: PAGE_MAP[matchingKey], mode: '' };
    }

    // 未匹配
    return { module: null, mode: '' };
  }

  // ===== 路由函数 =====

  /**
   * 核心路由处理
   */
  function route() {
    var hash = window.location.hash || '#/login';
    var currentUser = Storage.getCurrentUser();
    var isLoggedIn = !!currentUser;

    // 登录守卫：未登录用户只能访问登录页
    if (!isLoggedIn && hash !== '#/login') {
      window.location.hash = '#/login';
      return;
    }

    // 已登录用户访问登录页时，自动跳转到首页
    if (isLoggedIn && hash === '#/login') {
      window.location.hash = '#/home';
      return;
    }

    // 默认路由：空 hash 跳转登录
    if (!hash || hash === '#' || hash === '#/') {
      if (isLoggedIn) {
        window.location.hash = '#/home';
      } else {
        window.location.hash = '#/login';
      }
      return;
    }

    var parsed = parseHash(hash);
    var matched = matchRoute(parsed.path);

    if (matched.module) {
      // 设置页面模式（add / edit / detail）
      var mode = '';
      if (parsed.path.indexOf('/add') !== -1) {
        mode = 'add';
      } else if (parsed.path.indexOf('/edit') !== -1) {
        mode = 'edit';
      } else if (parsed.path.indexOf('/detail') !== -1) {
        mode = 'detail';
      }
      renderPage(matched.module, mode, parsed.params);
    } else {
      // 未匹配的路由，跳转首页
      window.location.hash = '#/home';
    }
  }

  // ===== 页面渲染 =====

  /**
   * 渲染页面到 #app 容器
   * @param {Object} pageModule - 页面模块（需实现 render 和 init 方法）
   * @param {string} mode - 页面模式：add / edit / detail / 空
   * @param {Object} params - URL 查询参数
   */
  function renderPage(pageModule, mode, params) {
    var app = document.getElementById('app');
    if (!app) return;

    // 直接渲染页面内容
    app.innerHTML = pageModule.render(mode, params);

    // 初始化页面事件绑定
    if (typeof pageModule.init === 'function') {
      pageModule.init(mode, params);
    }

    // 滚动到顶部
    window.scrollTo(0, 0);
  }

  // ===== 应用初始化 =====

  function init() {
    // 初始化测试数据
    Storage.initTestData();

    // 监听 hash 变化
    window.addEventListener('hashchange', route);

    // 渲染初始页面
    route();
  }

  // 兼容 DOMContentLoaded 已触发的情况
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
