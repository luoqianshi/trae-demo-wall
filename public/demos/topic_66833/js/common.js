(function (window) {
  'use strict';

  // ==================== 数据访问层 Data API ====================

  /**
   * 获取所有场景
   * @returns {Array} 场景数组
   */
  function getAllScenes() {
    if (!window.MockData || !window.MockData.scenes) {
      return [];
    }
    return window.MockData.scenes.slice();
  }

  /**
   * 根据ID获取单个场景
   * @param {string} id - 场景ID
   * @returns {Object|null} 场景对象，找不到返回null
   */
  function getSceneById(id) {
    if (!id || !window.MockData || !window.MockData.scenes) {
      return null;
    }
    var scenes = window.MockData.scenes;
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].id === id) {
        return scenes[i];
      }
    }
    return null;
  }

  /**
   * 按分类获取场景
   * @param {string} categoryId - 分类ID，'all'返回全部
   * @returns {Array} 场景数组
   */
  function getScenesByCategory(categoryId) {
    if (!window.MockData || !window.MockData.scenes) {
      return [];
    }
    if (!categoryId || categoryId === 'all') {
      return getAllScenes();
    }
    var scenes = window.MockData.scenes;
    var result = [];
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].category === categoryId) {
        result.push(scenes[i]);
      }
    }
    return result;
  }

  /**
   * 按标题/描述搜索场景
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 匹配的场景数组
   */
  function searchScenes(keyword) {
    if (!keyword || !window.MockData || !window.MockData.scenes) {
      return [];
    }
    var lowerKeyword = keyword.toLowerCase();
    var scenes = window.MockData.scenes;
    var result = [];
    for (var i = 0; i < scenes.length; i++) {
      var scene = scenes[i];
      var titleMatch = scene.title && scene.title.toLowerCase().indexOf(lowerKeyword) > -1;
      var descMatch = scene.description && scene.description.toLowerCase().indexOf(lowerKeyword) > -1;
      if (titleMatch || descMatch) {
        result.push(scene);
      }
    }
    return result;
  }

  /**
   * 获取所有分类
   * @returns {Array} 分类数组
   */
  function getAllCategories() {
    if (!window.MockData || !window.MockData.categories) {
      return [];
    }
    return window.MockData.categories.slice();
  }

  // ==================== URL 工具 ====================

  /**
   * 获取URL查询参数
   * @param {string} name - 参数名
   * @returns {string|null} 参数值，不存在返回null
   */
  function getQueryParam(name) {
    if (!name) {
      return null;
    }
    var search = window.location.search.substring(1);
    if (!search) {
      return null;
    }
    var params = search.split('&');
    for (var i = 0; i < params.length; i++) {
      var pair = params[i].split('=');
      if (decodeURIComponent(pair[0]) === name) {
        return pair[1] ? decodeURIComponent(pair[1]) : '';
      }
    }
    return null;
  }

  /**
   * 构建带参数的URL
   * @param {string} path - 路径
   * @param {Object} params - 参数对象
   * @returns {string} 完整URL
   */
  function buildUrl(path, params) {
    if (!path) {
      return '';
    }
    if (!params || typeof params !== 'object') {
      return path;
    }
    var queryParts = [];
    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        var value = params[key];
        if (value !== undefined && value !== null) {
          queryParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
        }
      }
    }
    if (queryParts.length === 0) {
      return path;
    }
    var separator = path.indexOf('?') > -1 ? '&' : '?';
    return path + separator + queryParts.join('&');
  }

  // ==================== DOM 工具 ====================

  /**
   * querySelector 简写
   * @param {string} selector - 选择器
   * @param {Element} [context=document] - 上下文元素
   * @returns {Element|null} 匹配的元素
   */
  function $(selector, context) {
    if (!selector) {
      return null;
    }
    var ctx = context || document;
    try {
      return ctx.querySelector(selector);
    } catch (e) {
      return null;
    }
  }

  /**
   * querySelectorAll 简写
   * @param {string} selector - 选择器
   * @param {Element} [context=document] - 上下文元素
   * @returns {NodeList} 匹配的元素列表
   */
  function $$(selector, context) {
    if (!selector) {
      return [];
    }
    var ctx = context || document;
    try {
      return ctx.querySelectorAll(selector) || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * 创建元素
   * @param {string} tag - 标签名
   * @param {string} [className] - 类名
   * @param {string} [html] - 内部HTML
   * @returns {Element} 创建的元素
   */
  function createElement(tag, className, html) {
    if (!tag) {
      return null;
    }
    var el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    if (html !== undefined && html !== null) {
      el.innerHTML = html;
    }
    return el;
  }

  /**
   * 显示加载状态
   * @param {Element|string} container - 容器元素或选择器
   */
  function showLoading(container) {
    var el = typeof container === 'string' ? $(container) : container;
    if (!el) {
      return;
    }
    var loading = el.querySelector('.app-loading');
    if (!loading) {
      loading = createElement('div', 'app-loading', '<div class="app-loading-spinner"></div>');
      el.appendChild(loading);
    }
    loading.style.display = 'flex';
  }

  /**
   * 隐藏加载状态
   * @param {Element|string} container - 容器元素或选择器
   */
  function hideLoading(container) {
    var el = typeof container === 'string' ? $(container) : container;
    if (!el) {
      return;
    }
    var loading = el.querySelector('.app-loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  // ==================== 工具函数 ====================

  /**
   * 防抖
   * @param {Function} fn - 函数
   * @param {number} delay - 延迟毫秒数
   * @returns {Function} 防抖后的函数
   */
  function debounce(fn, delay) {
    if (typeof fn !== 'function') {
      return function () {};
    }
    var timer = null;
    return function () {
      var context = this;
      var args = arguments;
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(function () {
        fn.apply(context, args);
        timer = null;
      }, delay || 300);
    };
  }

  /**
   * 节流
   * @param {Function} fn - 函数
   * @param {number} delay - 间隔毫秒数
   * @returns {Function} 节流后的函数
   */
  function throttle(fn, delay) {
    if (typeof fn !== 'function') {
      return function () {};
    }
    var lastTime = 0;
    var timer = null;
    return function () {
      var context = this;
      var args = arguments;
      var now = Date.now();
      var remaining = (delay || 300) - (now - lastTime);
      if (remaining <= 0) {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        lastTime = now;
        fn.apply(context, args);
      } else if (!timer) {
        timer = setTimeout(function () {
          lastTime = Date.now();
          timer = null;
          fn.apply(context, args);
        }, remaining);
      }
    };
  }

  /**
   * 格式化时间（秒 → mm:ss）
   * @param {number} seconds - 秒数
   * @returns {string} 格式化后的时间字符串
   */
  function formatTime(seconds) {
    if (typeof seconds !== 'number' || seconds < 0 || isNaN(seconds)) {
      return '00:00';
    }
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  /**
   * HTML转义
   * @param {string} str - 待转义字符串
   * @returns {string} 转义后的字符串
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) {
      return '';
    }
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /**
   * 返回难度星级HTML（1-3星）
   * @param {number} level - 难度等级（1-3）
   * @returns {string} 星级HTML字符串
   */
  function difficultyStars(level) {
    var num = parseInt(level, 10);
    if (isNaN(num) || num < 1) {
      num = 1;
    }
    if (num > 3) {
      num = 3;
    }
    var html = '';
    for (var i = 0; i < 3; i++) {
      if (i < num) {
        html += '<span class="star star-full">★</span>';
      } else {
        html += '<span class="star star-empty">☆</span>';
      }
    }
    return html;
  }

  // ==================== 页面导航 ====================

  /**
   * 页面跳转
   * @param {string} page - 页面路径
   * @param {Object} [params] - 查询参数
   */
  function navigateTo(page, params) {
    if (!page) {
      return;
    }
    var url = buildUrl(page, params);
    window.location.href = url;
  }

  /**
   * 返回上一页
   */
  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
  }

  // ==================== 初始化函数 ====================

  /**
   * 初始化公共功能（返回顶部等）
   */
  function init() {
    initBackToTop();
  }

  /**
   * 初始化返回顶部按钮
   */
  function initBackToTop() {
    var btn = $('.back-to-top');
    if (!btn) {
      return;
    }
    var toggleVisibility = throttle(function () {
      if (window.scrollY > 300) {
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      } else {
        btn.style.opacity = '0';
        btn.style.pointerEvents = 'none';
      }
    }, 100);
    window.addEventListener('scroll', toggleVisibility);
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    toggleVisibility();
  }

  // ==================== 导出到 window.App ====================

  window.App = {
    // 数据访问层
    getAllScenes: getAllScenes,
    getSceneById: getSceneById,
    getScenesByCategory: getScenesByCategory,
    searchScenes: searchScenes,
    getAllCategories: getAllCategories,

    // URL 工具
    getQueryParam: getQueryParam,
    buildUrl: buildUrl,

    // DOM 工具
    $: $,
    $$: $$,
    createElement: createElement,
    showLoading: showLoading,
    hideLoading: hideLoading,

    // 工具函数
    debounce: debounce,
    throttle: throttle,
    formatTime: formatTime,
    escapeHtml: escapeHtml,
    difficultyStars: difficultyStars,

    // 页面导航
    navigateTo: navigateTo,
    goBack: goBack,

    // 初始化
    init: init
  };

})(window);
