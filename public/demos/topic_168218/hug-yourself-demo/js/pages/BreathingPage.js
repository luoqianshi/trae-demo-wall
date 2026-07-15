/**
 * BreathingPage.js - 正念呼吸页控制器
 * 管理呼吸练习流程，包含开始/停止/重置控制，完成卡片展示
 * 集成 BreathingOrb 组件实现可视化呼吸光球动画
 * 原生 ES6+，严格模式
 */
'use strict';

const BreathingPage = {
  /** @type {BreathingOrb|null} 呼吸光球组件实例 */
  _orb: null,

  /** @type {number} 练习总时长（秒），默认 3 分钟 */
  _totalDuration: 180,

  // ============================================================
  // 生命周期
  // ============================================================

  /**
   * 渲染正念呼吸页 HTML
   * 包含呼吸光球容器、阶段文字、进度条、计时器、控制按钮和完成卡片
   * @returns {string} 页面 HTML 字符串
   */
  render() {
    return `
      <div class="page breathing-page">
        <div class="breathing-page__container">
          <div id="breathingOrbContainer" class="breathing-page__orb"></div>
          <div class="breathing-page__actions">
            <button id="startBtn" class="btn btn-primary" onclick="BreathingPage.start()">开始</button>
            <button id="stopBtn" class="btn btn--secondary" onclick="BreathingPage.stop()" style="display:none;">停止</button>
          </div>
          <div id="completionCard" class="breathing-page__completion" style="display:none;">
            <h3 class="breathing-page__completion-title">很好，完成了！</h3>
            <p class="breathing-page__completion-text">感觉好些了吗？</p>
            <div class="breathing-page__completion-actions">
              <button class="btn btn-primary" onclick="BreathingPage.restart()">再来一次</button>
              <button class="btn btn--secondary" onclick="App.navigateTo('trash-can')">情绪垃圾桶</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 页面挂载：显示导航栏，初始化呼吸光球组件
   * @param {HTMLElement} pageView - 页面 DOM 元素
   * @param {Object} [params] - 路由参数
   */
  mount(pageView, params = {}) {
    // 显示导航栏
    if (typeof NavBar !== 'undefined' && typeof NavBar.show === 'function') {
      NavBar.show('breathing');
    }

    // 初始化呼吸光球组件
    this._initOrb();
  },

  // ============================================================
  // 组件初始化
  // ============================================================

  /**
   * 初始化 BreathingOrb 组件
   * 在 orb 容器中渲染光球，设置完成回调
   * @private
   */
  _initOrb() {
    const container = document.getElementById('breathingOrbContainer');
    if (!container) {
      console.warn('[BreathingPage] 未找到呼吸光球容器 #breathingOrbContainer');
      return;
    }

    // 确保 BreathingOrb 类可用
    if (typeof BreathingOrb === 'undefined') {
      console.warn('[BreathingPage] BreathingOrb 组件未加载，请确认 breathing-orb.js 已引入');
      return;
    }

    // 创建 BreathingOrb 实例
    this._orb = new BreathingOrb(container, {
      totalDuration: this._totalDuration,
      onComplete: () => this.onComplete(),
    });

    // 渲染组件 DOM 结构
    this._orb.render();
  },

  // ============================================================
  // 呼吸流程控制
  // ============================================================

  /**
   * 开始呼吸练习
   * 隐藏开始按钮，显示停止按钮，启动呼吸光球动画
   */
  start() {
    if (!this._orb) {
      console.warn('[BreathingPage] 呼吸光球未初始化');
      return;
    }

    // 切换按钮显隐
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-block';

    // 更新阶段文字
    const phaseEl = document.getElementById('breathingPhase');
    if (phaseEl) phaseEl.textContent = '吸气...';

    // 启动呼吸光球
    this._orb.start();

    // 更新 Store 状态
    if (typeof Store !== 'undefined') {
      Store.setState('breathing', {
        isActive: true,
        currentPhase: 'inhale',
        duration: this._totalDuration,
      });
    }

    console.log('[BreathingPage] 呼吸练习开始');
  },

  /**
   * 停止呼吸练习
   * 隐藏停止按钮，显示开始按钮，停止呼吸光球动画
   */
  stop() {
    if (!this._orb) {
      console.warn('[BreathingPage] 呼吸光球未初始化');
      return;
    }

    // 停止呼吸光球
    this._orb.stop();

    // 切换按钮显隐
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    if (startBtn) startBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'none';

    // 重置阶段文字
    const phaseEl = document.getElementById('breathingPhase');
    if (phaseEl) phaseEl.textContent = '点击开始';

    // 更新 Store 状态
    if (typeof Store !== 'undefined') {
      Store.setState('breathing', {
        isActive: false,
        currentPhase: 'stopped',
      });
    }

    console.log('[BreathingPage] 呼吸练习已停止');
  },

  /**
   * 呼吸练习完成回调
   * 隐藏按钮区域，显示完成卡片，持久化练习记录
   * 由 BreathingOrb 的 onComplete 回调触发
   */
  onComplete() {
    // 隐藏按钮区域
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'none';

    // 更新阶段文字
    const phaseEl = document.getElementById('breathingPhase');
    if (phaseEl) phaseEl.textContent = '完成！';

    // 显示完成卡片
    const card = document.getElementById('completionCard');
    if (card) {
      card.style.display = 'block';
    }

    // 更新 Store 并持久化
    if (typeof Store !== 'undefined') {
      Store.setState('breathing', {
        isActive: false,
        currentPhase: 'complete',
        duration: this._totalDuration,
        lastCompletedAt: Date.now(),
      });
      Store.saveToStorage('breathing');
    }

    console.log('[BreathingPage] 呼吸练习完成');
  },

  /**
   * 重新开始呼吸练习
   * 隐藏完成卡片，重置页面状态，直接开始新的一轮练习
   */
  restart() {
    if (!this._orb) {
      console.warn('[BreathingPage] 呼吸光球未初始化');
      return;
    }

    // 隐藏完成卡片
    const card = document.getElementById('completionCard');
    if (card) {
      card.style.display = 'none';
    }

    // 重置阶段文字
    const phaseEl = document.getElementById('breathingPhase');
    if (phaseEl) phaseEl.textContent = '吸气...';

    // 重新渲染呼吸光球（重置内部状态到初始状态）
    this._orb.render();

    // 直接调用 start() 开始新练习（start 会处理按钮显隐）
    this.start();
  },
};

// 注册页面到待处理队列（App初始化后自动注册）
window._pageRegistrations = window._pageRegistrations || [];
window._pageRegistrations.push({page: 'breathing', controller: BreathingPage});

// 暴露到全局，供 inline onclick 调用
window.BreathingPage = BreathingPage;