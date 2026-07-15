/**
 * TrainingHub.js - 日常训练入口页控制器
 * 展示三个训练模块卡片列表，显示统计数据，提供入口跳转
 * 原生 ES6+，严格模式
 */
'use strict';

const TrainingHub = {
  /**
   * 训练模块配置
   * 每个模块包含：路由名称、图标、名称、描述
   */
  trainingModules: [
    {
      id: 'cbt-form',
      route: 'cbt-form',
      icon: '🛡️',
      name: '心理预案',
      description: '提前构建认知预案，应对焦虑场景'
    },
    {
      id: 'boundary-scissors',
      route: 'boundary-scissors',
      icon: '✂️',
      name: '课题分离剪',
      description: '剪断情绪纠缠，分清你我的边界'
    },
    {
      id: 'energy-map',
      route: 'energy-map',
      icon: '⚡',
      name: '能量地图',
      description: '记录每日能量变化，找到精力节奏'
    },
    {
      id: 'trash-can',
      route: 'trash-can',
      icon: '🗑️',
      name: '情绪垃圾桶',
      description: '写下负面情绪，把情绪石头丢进垃圾桶释放'
    }
  ],

  /**
   * 渲染训练中心页面 HTML
   * 包含统计概览区域和训练模块卡片列表
   * @param {Object} [params] - 路由参数
   * @returns {string} 页面 HTML 字符串
   */
  render(params = {}) {
    return `
      <div class="page training-hub">
        <header class="training-hub__header">
          <h1 class="training-hub__title">日常训练</h1>
          <p class="training-hub__subtitle">每天 small step，提升心理韧性</p>
        </header>

        <section class="training-hub__stats">
          <h2 class="training-hub__section-title">训练统计</h2>
          <div class="training-hub__stats-grid">
            <div class="training-hub__stat-card">
              <div class="training-hub__stat-value" id="totalTrainingsCount">0</div>
              <div class="training-hub__stat-label">已完成训练</div>
            </div>
            <div class="training-hub__stat-card">
              <div class="training-hub__stat-value" id="cbtCardsCount">0</div>
              <div class="training-hub__stat-label">已保存预案</div>
            </div>
            <div class="training-hub__stat-card">
              <div class="training-hub__stat-value" id="lastEnergyRecord">暂无</div>
              <div class="training-hub__stat-label">最近能量记录</div>
            </div>
          </div>
        </section>

        <section class="training-hub__modules">
          <h2 class="training-hub__section-title">选择训练模块</h2>
          <div class="training-hub__modules-list">
            ${this.renderModuleCards()}
          </div>
        </section>
      </div>
    `;
  },

  /**
   * 渲染所有训练模块卡片 HTML
   * @returns {string} 卡片 HTML
   */
  renderModuleCards() {
    return this.trainingModules.map(module => `
      <div class="training-hub__card" onclick="App.showPage('${module.route}')">
        <div class="training-hub__card-icon">${module.icon}</div>
        <div class="training-hub__card-info">
          <h3 class="training-hub__card-name">${module.name}</h3>
          <p class="training-hub__card-desc">${module.description}</p>
        </div>
        <div class="training-hub__card-arrow">›</div>
      </div>
    `).join('');
  },

  /**
   * 页面挂载：显示导航栏，更新统计数据
   * @param {HTMLElement} pageView - 页面 DOM 元素
   * @param {Object} [params] - 路由参数
   */
  mount(pageView, params = {}) {
    // 显示导航栏
    if (typeof NavBar !== 'undefined' && typeof NavBar.show === 'function') {
      NavBar.show('training-hub');
    }

    // 更新统计数据
    this.updateStats();
  },

  /**
   * 从 Store 获取并更新统计数据
   * 计算：
   *  - 总训练次数 = CBT卡片数 + 边界记录数 + 能量记录数
   *  - 已保存预案卡片数量
   *  - 最近一次能量记录日期
   */
  updateStats() {
    if (typeof Store === 'undefined') {
      console.warn('[TrainingHub] Store 不可用，无法获取统计数据');
      return;
    }

    const training = Store.getState('training');
    if (!training) return;

    const cbtCardsCount = training.cbtCards?.length || 0;
    const boundaryRecordsCount = training.boundaryRecords?.length || 0;
    const energyRecordsCount = training.energyRecords?.length || 0;
    const totalTrainingsCount = cbtCardsCount + boundaryRecordsCount + energyRecordsCount;

    // 更新 DOM
    const totalEl = document.getElementById('totalTrainingsCount');
    const cbtEl = document.getElementById('cbtCardsCount');
    const lastEnergyEl = document.getElementById('lastEnergyRecord');

    if (totalEl) {
      totalEl.textContent = totalTrainingsCount.toString();
    }

    if (cbtEl) {
      cbtEl.textContent = cbtCardsCount.toString();
    }

    if (lastEnergyEl && energyRecordsCount > 0) {
      const lastRecord = training.energyRecords[energyRecordsCount - 1];
      lastEnergyEl.textContent = lastRecord.date || '记录存在';
    }
  },
};

// 注册页面到待处理队列（App初始化后自动注册）
window._pageRegistrations = window._pageRegistrations || [];
window._pageRegistrations.push({page: 'training-hub', controller: TrainingHub});

// 暴露到全局
window.TrainingHub = TrainingHub;
