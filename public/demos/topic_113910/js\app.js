/**
 * AI私人咖啡甜度师 - 主控制器
 * 负责路由、页面切换、推荐流程、反馈学习
 */
(function (global) {
  'use strict';

  var currentScreen = 'home';
  var lastResult = null;
  var lastRecordId = null;
  var screenContainer = null;

  // ============ 首次使用预置示例数据 ============
  function seedDemoData() {
    var data = Store.load();
    // 仅在首次使用（无任何历史记录）时注入
    if (data.history.length > 0) return;

    // 先设置一个有学习痕迹的画像
    data.profile.basePreference = 4.6;
    data.profile.adaptCount = 3;
    Store.save(data);

    // 生成示例推荐记录
    var samples = [
      { hour: 8,  dayOffset: 0, input: { mood: 'tired',    drink: 'americano',  roast: 'medium',      origin: 'blend',          food: 'sandwich',  health: 'none'     }, feedback: 'perfect' },
      { hour: 14, dayOffset: 0, input: { mood: 'happy',    drink: 'latte',      roast: 'medium_dark', origin: 'latin_america', food: 'dessert',   health: 'moderate' }, feedback: 'sweet'   },
      { hour: 9,  dayOffset: 1, input: { mood: 'stressed', drink: 'cold_brew',  roast: 'dark',        origin: 'asia',          food: 'none',      health: 'none'     }, feedback: 'bland'   },
      { hour: 15, dayOffset: 1, input: { mood: 'relaxed',  drink: 'pour_over',  roast: 'light',       origin: 'africa',        food: 'fruit',     health: 'none'     }, feedback: 'perfect' },
      { hour: 20, dayOffset: 1, input: { mood: 'focused',  drink: 'cappuccino', roast: 'medium',      origin: 'blend',          food: 'chocolate', health: 'strict'   }, feedback: 'perfect' },
      { hour: 10, dayOffset: 2, input: { mood: 'happy',    drink: 'flat_white', roast: 'medium_dark', origin: 'latin_america', food: 'none',      health: 'moderate' }, feedback: 'perfect' }
    ];

    for (var i = 0; i < samples.length; i++) {
      var s = samples[i];
      var ts = new Date();
      ts.setDate(ts.getDate() - s.dayOffset);
      ts.setHours(s.hour, Math.floor(Math.random() * 50), 0, 0);
      var result = Engine.recommend(s.input, data.profile);
      result.id = 'seed_' + i;
      result.timestamp = ts.getTime();
      result.feedback = s.feedback;
      data.history.unshift(result);
    }
    data.profile.totalRecords = samples.length;
    Store.save(data);
  }

  // ============ 初始化 ============
  function init() {
    screenContainer = document.getElementById('screen');

    // 首次使用注入示例数据
    seedDemoData();

    // 底部导航绑定
    var navItems = document.querySelectorAll('.nav-item');
    for (var i = 0; i < navItems.length; i++) {
      navItems[i].addEventListener('click', function () {
        var target = this.getAttribute('data-screen');
        navigate(target);
      });
    }

    // 默认进入首页
    navigate('home');
  }

  // ============ 路由 ============
  function navigate(screen) {
    currentScreen = screen;

    // 更新导航高亮
    var navItems = document.querySelectorAll('.nav-item');
    for (var i = 0; i < navItems.length; i++) {
      navItems[i].classList.toggle('active', navItems[i].getAttribute('data-screen') === screen);
    }

    // 滚动到顶部
    screenContainer.scrollTop = 0;
    window.scrollTo(0, 0);

    // 渲染对应页面（带过渡动画）
    screenContainer.classList.remove('fade-in');
    void screenContainer.offsetWidth; // 触发重排
    screenContainer.classList.add('fade-in');

    switch (screen) {
      case 'home':
        UI.renderHome(screenContainer);
        break;
      case 'recommend':
        UI.renderRecommend(screenContainer);
        break;
      case 'history':
        UI.renderHistory(screenContainer);
        break;
      case 'profile':
        UI.renderProfile(screenContainer);
        break;
    }
  }

  // ============ 推荐流程 ============
  function doRecommend(input) {
    var profile = Store.getProfile();
    var result = Engine.recommend(input, profile);
    lastResult = result;

    // 生成记录ID
    lastRecordId = 'r_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    result.id = lastRecordId;

    // 保存到历史
    Store.addHistory(result);

    // 切换到结果页（用 recommend 容器复用）
    screenContainer.classList.remove('fade-in');
    void screenContainer.offsetWidth;
    screenContainer.classList.add('fade-in');
    UI.renderResult(screenContainer, result);

    // 隐藏底部导航（结果页专注体验）
    setNavVisible(false);
  }

  // ============ 反馈学习 ============
  function handleFeedback(feedback, result) {
    // 更新历史记录的反馈
    if (result.id) {
      Store.updateHistoryFeedback(result.id, feedback);
    }

    // 学习调整画像
    Store.updateProfile(function (p) {
      return Engine.learn(p, feedback);
    });
  }

  // ============ 导航栏显隐 ============
  function setNavVisible(visible) {
    var nav = document.getElementById('bottom-nav');
    if (nav) nav.style.display = visible ? '' : 'none';
  }

  // 重写 navigate 以处理结果页返回时恢复导航
  var _navigate = navigate;
  function navigateWrapper(screen) {
    setNavVisible(true);
    _navigate(screen);
  }

  // ============ 导出 ============
  global.App = {
    init: init,
    navigate: navigateWrapper,
    doRecommend: doRecommend,
    handleFeedback: handleFeedback
  };

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
