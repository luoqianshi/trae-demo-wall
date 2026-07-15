/**
 * HomePage.js - 首页控制器
 * 渲染首页视图，处理首次访问引导，提供演示数据填充功能
 * 原生 ES6+，严格模式
 */
'use strict';

const HomePage = {
  /**
   * 渲染首页 HTML
   * 包含主按钮、快捷入口卡片、演示数据入口和首次访问引导
   * @param {Object} [params] - 路由参数
   * @returns {string} 首页 HTML 字符串
   */
  render(params = {}) {
    return `
      <div class="page home-page">
        <div class="home__hero">
          <h1 class="home__hero-title">今天过得怎么样？</h1>
          <p class="home__hero-subtitle">随时停下来，抱抱自己</p>
          <button class="home__main-btn anim-pulse" onclick="App.navigateTo('ai-chat')">
            <span class="home__main-btn-icon">🤗</span>
            <span class="home__main-btn-label">现在，我需要一点帮助</span>
            <span class="home__main-btn-desc">点击开始 AI 情绪分析</span>
          </button>
        </div>
        <div class="home__quick-entries">
          <div class="home__quick-card" onclick="App.navigateTo('breathing')">
            <div class="home__quick-card-icon home__quick-card-icon--warm">🤗</div>
            <div class="home__quick-card-title">抱抱自己</div>
            <div class="home__quick-card-desc">今天状态不好，需要快速恢复</div>
          </div>
          <div class="home__quick-card" onclick="App.navigateTo('training-hub')">
            <div class="home__quick-card-icon home__quick-card-icon--brand">🌱</div>
            <div class="home__quick-card-title">日常训练</div>
            <div class="home__quick-card-desc">平时提升自己的心理能力</div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 页面挂载：绑定事件，检测首次访问显示引导
   * @param {HTMLElement} pageView - 页面 DOM 元素
   * @param {Object} [params] - 路由参数
   */
  mount(pageView, params = {}) {
    // 显示导航栏
    if (typeof NavBar !== 'undefined' && typeof NavBar.show === 'function') {
      NavBar.show('home');
    }

    // 检测首次访问并显示引导遮罩
    this._checkFirstVisit(pageView);
  },

  /**
   * 检测首次访问，显示引导遮罩
   * 如果 currentUser.firstVisit 为 true，展示引导卡片让用户输入名称
   * @param {HTMLElement} pageView
   */
  _checkFirstVisit(pageView) {
    const user = Store.getState('currentUser');
    if (user && user.firstVisit === true) {
      const guide = pageView.querySelector('#firstVisitGuide');
      if (guide) {
        guide.style.display = 'flex';
      }
    }
  },

  /**
   * 开始旅程：保存用户名称，关闭引导
   * 由引导卡片中的"开始"按钮 onclick 触发
   */
  startJourney() {
    const nameInput = document.getElementById('nameInput');
    if (!nameInput) return;

    const name = nameInput.value.trim();
    if (!name) {
      // 输入为空时给出视觉提示
      nameInput.style.borderColor = '#ff4444';
      nameInput.placeholder = '请告诉我你的名字 :)';
      return;
    }

    // 更新用户信息到 Store 并持久化
    Store.setState('currentUser', { name, firstVisit: false });
    Store.saveToStorage('currentUser');

    // 隐藏引导遮罩
    const guide = document.getElementById('firstVisitGuide');
    if (guide) {
      guide.style.display = 'none';
    }

    console.log('[HomePage] 用户完成首次引导:', name);
  },

  /**
   * 填充演示数据
   * 从 DEMO_DATA 加载预设数据到 Store 中对应的训练模块
   * 包含 CBT 记录卡片和能量记录数据
   */
  fillDemoData() {
    if (typeof DEMO_DATA === 'undefined') {
      console.warn('[HomePage] DEMO_DATA 未加载，请确认 demo-data.js 已引入');
      return;
    }

    // 填充 CBT 三栏法记录卡片
    if (DEMO_DATA.savedCBTCards && DEMO_DATA.savedCBTCards.length > 0) {
      Store.setState('training', { cbtCards: DEMO_DATA.savedCBTCards });
    }

    // 填充能量记录
    if (DEMO_DATA.energyRecords && DEMO_DATA.energyRecords.length > 0) {
      Store.setState('training', { energyRecords: DEMO_DATA.energyRecords });
    }

    console.log('[HomePage] 演示数据已填充');
  },
};

// 注册页面到待处理队列（App初始化后自动注册）
window._pageRegistrations = window._pageRegistrations || [];
window._pageRegistrations.push({page: 'home', controller: HomePage});

// 暴露到全局，供 inline onclick 调用
window.HomePage = HomePage;