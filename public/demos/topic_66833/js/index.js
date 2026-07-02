/**
 * 你好，我的小孩 - 首页交互逻辑
 * 功能：
 * 1. 动态渲染 Hero 区场景快速入口
 * 2. 动态渲染热门场景卡片
 * 3. 顶部导航滚动效果
 * 4. 移动端菜单切换
 * 5. 平滑滚动
 */

(function () {
  'use strict';

  // ==================== 初始化 ====================
  document.addEventListener('DOMContentLoaded', function () {
    initHeroScenes();
    initHotScenes();
    initHeaderScroll();
    initMobileMenu();
    initSmoothScroll();
  });

  // ==================== 1. Hero 区场景快速入口 ====================
  /**
   * 渲染 Hero 区的场景分类快速入口
   * 使用 categories 数据，排除"全部场景"，取前6个
   */
  function initHeroScenes() {
    var container = document.getElementById('heroScenes');
    if (!container || !window.MockData || !window.MockData.categories) {
      return;
    }

    var categories = window.MockData.categories.filter(function (cat) {
      return cat.id !== 'all';
    });

    var html = '';
    categories.forEach(function (cat) {
      html += '\
        <a href="scenes.html?category=' + cat.id + '" class="hero-scene-item">\
          <div class="hero-scene-item__icon">' + cat.icon + '</div>\
          <span class="hero-scene-item__name">' + cat.name + '</span>\
        </a>\
      ';
    });

    container.innerHTML = html;
  }

  // ==================== 2. 热门场景卡片 ====================
  /**
   * 渲染热门场景卡片列表
   * 使用 scenes 数据，取前6个
   */
  function initHotScenes() {
    var container = document.getElementById('hotScenesGrid');
    if (!container || !window.MockData || !window.MockData.scenes) {
      return;
    }

    var scenes = window.MockData.scenes.slice(0, 6);

    var html = '';
    scenes.forEach(function (scene) {
      var starsHtml = generateStars(scene.difficulty);

      html += '\
        <a href="scene-detail.html?id=' + scene.id + '" class="scene-card">\
          <div class="scene-card__cover" style="background: ' + scene.coverGradient + ';">\
            <span class="scene-card__icon">' + scene.icon + '</span>\
          </div>\
          <div class="scene-card__body">\
            <h3 class="scene-card__title">' + scene.title + '</h3>\
            <p class="scene-card__desc">' + scene.description + '</p>\
            <div class="scene-card__meta">\
              <div class="scene-card__difficulty" title="难度：' + scene.difficulty + '星">\
                ' + starsHtml + '\
              </div>\
              <span class="scene-card__time">' + scene.estimatedTime + '</span>\
            </div>\
          </div>\
        </a>\
      ';
    });

    container.innerHTML = html;
  }

  /**
   * 生成难度星级 HTML
   * @param {number} difficulty - 难度等级 1-5
   * @returns {string} 星星 HTML
   */
  function generateStars(difficulty) {
    var html = '';
    for (var i = 1; i <= 3; i++) {
      if (i <= difficulty) {
        html += '<span class="scene-card__star scene-card__star--active">★</span>';
      } else {
        html += '<span class="scene-card__star">★</span>';
      }
    }
    return html;
  }

  // ==================== 3. 顶部导航滚动效果 ====================
  /**
   * 监听滚动，给 header 添加 scrolled 类
   * 实现滚动时显示阴影的效果
   */
  function initHeaderScroll() {
    var header = document.getElementById('siteHeader');
    if (!header) {
      return;
    }

    function handleScroll() {
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    handleScroll();
    window.addEventListener('scroll', throttle(handleScroll, 100));
  }

  // ==================== 4. 移动端菜单切换 ====================
  /**
   * 移动端汉堡菜单展开/收起
   */
  function initMobileMenu() {
    var toggleBtn = document.getElementById('menuToggle');
    var nav = document.getElementById('siteNav');
    if (!toggleBtn || !nav) {
      return;
    }

    toggleBtn.addEventListener('click', function () {
      nav.classList.toggle('open');
    });

    // 点击导航链接后关闭菜单
    var navLinks = nav.querySelectorAll('a');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
      });
    });

    // 点击页面其他地方关闭菜单
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !toggleBtn.contains(e.target)) {
        nav.classList.remove('open');
      }
    });
  }

  // ==================== 5. 平滑滚动 ====================
  /**
   * 锚点链接平滑滚动
   */
  function initSmoothScroll() {
    var anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var targetId = link.getAttribute('href');
        if (targetId === '#' || targetId.length <= 1) {
          return;
        }

        var targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          var headerHeight = 64;
          var targetPosition = targetElement.offsetTop - headerHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // ==================== 工具函数 ====================
  /**
   * 节流函数
   * @param {Function} func - 要节流的函数
   * @param {number} limit - 时间间隔（毫秒）
   * @returns {Function} 节流后的函数
   */
  function throttle(func, limit) {
    var inThrottle;
    return function () {
      var args = arguments;
      var context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function () {
          inThrottle = false;
        }, limit);
      }
    };
  }

})();
