'use strict';

/**
 * BreathingOrb - 呼吸光球组件
 * 
 * 一个可视化正念呼吸练习的交互组件，包含：
 * - 可缩放的光球（CSS 动画驱动）
 * - 呼吸阶段文字提示 (吸气/停留/呼气)
 * - 进度条（单个呼吸周期 + 整体练习进度）
 * - 计时器（已用时间 / 总时间）
 * - 触觉反馈（阶段切换时震动）
 * 
 * 使用方式：
 *   const container = document.getElementById('breathingContainer');
 *   const orb = new BreathingOrb(container, {
 *     totalDuration: 180,    // 总时长（秒），默认 180
 *     onComplete: () => { ... }  // 练习结束回调
 *   });
 *   orb.render();
 *   orb.start();
 */

class BreathingOrb {
  /**
   * @param {HTMLElement} container - 承载光球的容器元素
   * @param {Object} [options={}] - 配置项
   * @param {number} [options.totalDuration=180] - 练习总时长（秒），默认 3 分钟
   * @param {Function} [options.onComplete] - 练习结束时的回调函数
   */
  constructor(container, options = {}) {
    // ----- 容器校验 -----
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error('[BreathingOrb] 有效的容器元素是必需的');
    }

    /** @type {HTMLElement} 承载光球的容器 */
    this.container = container;

    /** @type {number} 练习总时长（秒） */
    this.totalDuration = options.totalDuration || 180;

    /** @type {Function|undefined} 练习结束回调 */
    this.onComplete = typeof options.onComplete === 'function' ? options.onComplete : null;

    // ----- 呼吸周期参数 -----
    /** @type {number} 吸气阶段时长（秒） */
    this.INHALE = 4;
    /** @type {number} 停留阶段时长（秒） */
    this.HOLD = 2;
    /** @type {number} 呼气阶段时长（秒） */
    this.EXHALE = 6;
    /** @type {number} 单个完整周期时长（秒） */
    this.CYCLE = this.INHALE + this.HOLD + this.EXHALE; // 12s

    // ----- 运行状态 -----
    /** @type {boolean} 是否正在运行 */
    this._running = false;
    /** @type {number} 已用时间（秒） */
    this._elapsed = 0;
    /** @type {number} 当前周期内已用时间（秒） */
    this._cycleElapsed = 0;
    /** @type {string} 当前阶段标识: 'inhale' | 'hold' | 'exhale' */
    this._phase = 'inhale';
    /** @type {number} 当前阶段已用时间（秒） */
    this._phaseElapsed = 0;

    // ----- 计时器 ID -----
    /** @type {number|null} 主循环 requestAnimationFrame ID */
    this._rafId = null;
    /** @type {number} 上一帧的时间戳 */
    this._lastTimestamp = 0;

    // ----- DOM 元素引用 -----
    /** @type {HTMLElement|null} 光球主体 */
    this._orbEl = null;
    /** @type {HTMLElement|null} 阶段文字显示元素 */
    this._phaseTextEl = null;
    /** @type {HTMLElement|null} 周期进度条 */
    this._cycleProgressEl = null;
    /** @type {HTMLElement|null} 总进度条 */
    this._totalProgressEl = null;
    /** @type {HTMLElement|null} 计时器文字 */
    this._timerEl = null;
    /** @type {HTMLElement|null} 光球包裹层（用于动画） */
    this._orbWrapperEl = null;
  }

  // ============================================================
  // 渲染（创建 DOM 结构）
  // ============================================================

  /**
   * 渲染光球组件 DOM 结构并插入容器
   * @returns {BreathingOrb} 返回自身，支持链式调用
   */
  render() {
    // 清空容器
    this.container.innerHTML = '';

    // ----- 1. 创建 CSS 样式（仅注入一次） -----
    this._injectStyles();

    // ----- 2. 创建主容器 -----
    const wrapper = document.createElement('div');
    wrapper.className = 'breathing-orb-container';

    // ----- 3. 光球区域 -----
    const orbArea = document.createElement('div');
    orbArea.className = 'breathing-orb-area';

    // 光球包裹层（CSS 动画作用于此元素）
    this._orbWrapperEl = document.createElement('div');
    this._orbWrapperEl.className = 'breathing-orb-wrapper';

    // 光球主体（圆形 + 光晕通过伪元素实现）
    this._orbEl = document.createElement('div');
    this._orbEl.className = 'breathing-orb';

    this._orbWrapperEl.appendChild(this._orbEl);
    orbArea.appendChild(this._orbWrapperEl);

    // 阶段文字
    this._phaseTextEl = document.createElement('div');
    this._phaseTextEl.className = 'breathing-phase-text';
    this._phaseTextEl.textContent = '点击开始';
    orbArea.appendChild(this._phaseTextEl);

    wrapper.appendChild(orbArea);

    // ----- 4. 进度条区域 -----
    const progressArea = document.createElement('div');
    progressArea.className = 'breathing-progress-area';

    // 周期进度条（当前呼吸周期的进度）
    const cycleProgressRow = document.createElement('div');
    cycleProgressRow.className = 'breathing-progress-row';
    const cycleLabel = document.createElement('span');
    cycleLabel.className = 'breathing-progress-label';
    cycleLabel.textContent = '单次呼吸';
    const cycleTrack = document.createElement('div');
    cycleTrack.className = 'breathing-progress-track';
    this._cycleProgressEl = document.createElement('div');
    this._cycleProgressEl.className = 'breathing-progress-fill';
    this._cycleProgressEl.style.width = '0%';
    cycleTrack.appendChild(this._cycleProgressEl);
    cycleProgressRow.appendChild(cycleLabel);
    cycleProgressRow.appendChild(cycleTrack);

    // 总进度条（整体练习进度）
    const totalProgressRow = document.createElement('div');
    totalProgressRow.className = 'breathing-progress-row';
    const totalLabel = document.createElement('span');
    totalLabel.className = 'breathing-progress-label';
    totalLabel.textContent = '整体进度';
    const totalTrack = document.createElement('div');
    totalTrack.className = 'breathing-progress-track';
    this._totalProgressEl = document.createElement('div');
    this._totalProgressEl.className = 'breathing-progress-fill breathing-progress-fill--total';
    this._totalProgressEl.style.width = '0%';
    totalTrack.appendChild(this._totalProgressEl);
    totalProgressRow.appendChild(totalLabel);
    totalProgressRow.appendChild(totalTrack);

    progressArea.appendChild(cycleProgressRow);
    progressArea.appendChild(totalProgressRow);

    wrapper.appendChild(progressArea);

    // ----- 5. 计时器 -----
    this._timerEl = document.createElement('div');
    this._timerEl.className = 'breathing-timer';
    this._timerEl.textContent = `0:00 / ${this._formatTime(this.totalDuration)}`;
    wrapper.appendChild(this._timerEl);

    // 插入容器
    this.container.appendChild(wrapper);

    return this;
  }

  // ============================================================
  // 启动 / 停止
  // ============================================================

  /**
   * 启动呼吸练习
   * 使用 requestAnimationFrame 驱动循环，确保动画与阶段切换精确同步
   * 
   * @returns {BreathingOrb} 返回自身，支持链式调用
   */
  start() {
    if (this._running) return this;

    // 重置状态
    this._running = true;
    this._elapsed = 0;
    this._cycleElapsed = 0;
    this._phaseElapsed = 0;
    this._phase = 'inhale';

    // 重置 UI
    this._phaseTextEl.textContent = '吸气...';
    this._cycleProgressEl.style.width = '0%';
    this._totalProgressEl.style.width = '0%';
    this._timerEl.textContent = `0:00 / ${this._formatTime(this.totalDuration)}`;

    // 移除结束状态
    this._orbWrapperEl.classList.remove('phase-complete');

    // 触发震动（阶段开始）
    this._vibrate();

    // 启动动画循环
    this._lastTimestamp = performance.now();
    this._tick(this._lastTimestamp);

    return this;
  }

  /**
   * 停止呼吸练习
   */
  stop() {
    if (!this._running) return;

    this._running = false;

    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    // 重置光球动画
    this._orbWrapperEl.classList.remove('phase-inhale', 'phase-hold', 'phase-exhale');
  }

  // ============================================================
  // 内部方法
  // ============================================================

  /**
   * 主循环（requestAnimationFrame 回调）
   * 逐帧更新计时、阶段切换、进度条和光球动画
   * 
   * @param {number} timestamp - 当前帧的时间戳
   * @private
   */
  _tick(timestamp) {
    if (!this._running) return;

    // 计算时间差（秒），限制单帧最大步长以防卡顿时跳过大段时间
    const delta = Math.min((timestamp - this._lastTimestamp) / 1000, 0.5);
    this._lastTimestamp = timestamp;

    // 更新已用时间
    this._elapsed += delta;
    this._cycleElapsed += delta;
    this._phaseElapsed += delta;

    // ----- 检查是否到达总时长 -----
    if (this._elapsed >= this.totalDuration) {
      this._elapsed = this.totalDuration;
      this._updateUI(1, 1);       // 进度拉满
      this.stop();
      this._phaseTextEl.textContent = '完成！';
      this._orbWrapperEl.classList.add('phase-complete');

      // 触发完成回调
      if (typeof this.onComplete === 'function') {
        this.onComplete();
      }
      return;
    }

    // ----- 检查阶段切换 -----
    let phaseChanged = false;

    if (this._phase === 'inhale' && this._phaseElapsed >= this.INHALE) {
      this._phase = 'hold';
      this._phaseElapsed = 0;
      this._phaseTextEl.textContent = '停留...';
      phaseChanged = true;
    } else if (this._phase === 'hold' && this._phaseElapsed >= this.HOLD) {
      this._phase = 'exhale';
      this._phaseElapsed = 0;
      this._phaseTextEl.textContent = '呼气...';
      phaseChanged = true;
    } else if (this._phase === 'exhale' && this._phaseElapsed >= this.EXHALE) {
      // 周期完成，重置进入下一周期
      this._cycleElapsed = 0;
      this._phase = 'inhale';
      this._phaseElapsed = 0;
      this._phaseTextEl.textContent = '吸气...';
      phaseChanged = true;
    }

    // 阶段切换震动反馈
    if (phaseChanged) {
      this._vibrate();
    }

    // ----- 更新光球 CSS 动画类名 -----
    this._orbWrapperEl.classList.remove('phase-inhale', 'phase-hold', 'phase-exhale');
    this._orbWrapperEl.classList.add(`phase-${this._phase}`);

    // ----- 计算进度 -----
    // 周期进度：当前周期内经过时间 / 周期总时长
    const cycleProgress = Math.min(this._cycleElapsed / this.CYCLE, 1);
    // 总进度：已用时间 / 总时长
    const totalProgress = Math.min(this._elapsed / this.totalDuration, 1);

    // ----- 更新 UI -----
    this._updateUI(cycleProgress, totalProgress);

    // 继续下一帧
    this._rafId = requestAnimationFrame((ts) => this._tick(ts));
  }

  /**
   * 更新 UI 元素（进度条、计时器）
   * 
   * @param {number} cycleProgress - 周期进度 (0~1)
   * @param {number} totalProgress - 总进度 (0~1)
   * @private
   */
  _updateUI(cycleProgress, totalProgress) {
    // 周期进度条
    this._cycleProgressEl.style.width = `${(cycleProgress * 100).toFixed(1)}%`;

    // 总进度条
    this._totalProgressEl.style.width = `${(totalProgress * 100).toFixed(1)}%`;

    // 计时器
    const elapsedFormatted = this._formatTime(Math.floor(this._elapsed));
    this._timerEl.textContent = `${elapsedFormatted} / ${this._formatTime(this.totalDuration)}`;
  }

  /**
   * 格式化时间（秒 -> "M:SS"）
   * 
   * @param {number} seconds - 秒数
   * @returns {string} 格式化后的时间字符串
   * @private
   */
  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * 触觉震动反馈
   * 在阶段切换时调用，增强沉浸感
   * 
   * @private
   */
  _vibrate() {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }

  /**
   * 注入组件所需的 CSS 样式
   * 仅在首次调用时注入，后续调用跳过
   * 
   * @private
   */
  _injectStyles() {
    if (BreathingOrb._stylesInjected) return;
    BreathingOrb._stylesInjected = true;

    const style = document.createElement('style');
    style.textContent = `
      /* ---- 光球容器 ---- */
      .breathing-orb-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 10px 0;
        user-select: none;
      }

      /* ---- 光球区域 ---- */
      .breathing-orb-area {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        width: 240px;
        height: 260px;
        margin-bottom: 4px;
      }

      /* ---- 光球包裹层（CSS 动画作用于此） ---- */
      .breathing-orb-wrapper {
        width: 150px;
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: transform 0.3s ease;
      }

      /* 吸气阶段 - 光球放大 */
      .breathing-orb-wrapper.phase-inhale {
        animation: orb-scale-inhale 4s ease-in-out forwards;
      }

      /* 停留阶段 - 保持放大状态 */
      .breathing-orb-wrapper.phase-hold {
        animation: orb-scale-hold 2s ease-in-out forwards;
      }

      /* 呼气阶段 - 光球缩小 */
      .breathing-orb-wrapper.phase-exhale {
        animation: orb-scale-exhale 6s ease-in-out forwards;
      }

      /* 完成状态 - 柔和呼吸效果 */
      .breathing-orb-wrapper.phase-complete {
        animation: orb-glow-pulse 2s ease-in-out infinite;
      }

      /* ---- 光球主体（圆形 + 光晕） ---- */
      .breathing-orb {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        position: relative;
        background: radial-gradient(
          circle at 35% 35%,
          #a8e6cf 0%,
          #7ec8a8 40%,
          #4a9e7a 100%
        );
        box-shadow:
          0 0 30px rgba(74, 158, 122, 0.4),
          0 0 60px rgba(74, 158, 122, 0.2),
          inset 0 -4px 8px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: box-shadow 0.3s ease;
      }

      /* 外层光晕 - 伪元素 */
      .breathing-orb::before {
        content: '';
        position: absolute;
        top: -20px;
        left: -20px;
        right: -20px;
        bottom: -20px;
        border-radius: 50%;
        background: radial-gradient(
          circle at 35% 35%,
          rgba(168, 230, 207, 0.2) 0%,
          rgba(126, 200, 168, 0.1) 40%,
          transparent 70%
        );
        pointer-events: none;
        animation: glow-pulse 3s ease-in-out infinite;
      }

      /* 内层高光 - 伪元素 */
      .breathing-orb::after {
        content: '';
        position: absolute;
        top: 12%;
        left: 18%;
        width: 30%;
        height: 25%;
        border-radius: 50%;
        background: radial-gradient(
          ellipse at center,
          rgba(255, 255, 255, 0.6) 0%,
          transparent 100%
        );
        pointer-events: none;
      }

      /* ---- 阶段文字 ---- */
      .breathing-phase-text {
        margin-top: 16px;
        font-size: 18px;
        font-weight: 600;
        color: #4a7c6a;
        letter-spacing: 2px;
        text-align: center;
        transition: opacity 0.3s ease;
      }

      /* ---- 进度条区域 ---- */
      .breathing-progress-area {
        width: 100%;
        max-width: 280px;
        margin-bottom: 16px;
      }

      .breathing-progress-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .breathing-progress-label {
        flex-shrink: 0;
        font-size: 12px;
        color: #888;
        width: 56px;
        text-align: right;
      }

      .breathing-progress-track {
        flex: 1;
        height: 8px;
        background: #e8e8e8;
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }

      .breathing-progress-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #a8e6cf, #4a9e7a);
        border-radius: 4px;
        opacity: 0.9;
        box-shadow: 0 0 10px rgba(74, 158, 122, 0.35);
        transition: width 0.1s linear;
        will-change: width;
      }

      .breathing-progress-fill--total {
        background: linear-gradient(90deg, #81ecec, #6c5ce7);
        box-shadow: 0 0 10px rgba(108, 92, 231, 0.35);
      }

      /* ---- 计时器 ---- */
      .breathing-timer {
        font-size: 14px;
        color: #999;
        font-variant-numeric: tabular-nums;
        letter-spacing: 1px;
      }

      /* ============================================================ */
      /* Keyframes 动画定义                                           */
      /* ============================================================ */

      @keyframes orb-scale-inhale {
        0%   { transform: scale(1); }
        100% { transform: scale(1.4); }
      }

      @keyframes orb-scale-hold {
        0%   { transform: scale(1.4); }
        100% { transform: scale(1.4); }
      }

      @keyframes orb-scale-exhale {
        0%   { transform: scale(1.4); }
        100% { transform: scale(1); }
      }

      @keyframes orb-glow-pulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50%      { transform: scale(1.08); opacity: 1; }
      }

      @keyframes glow-pulse {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50%      { opacity: 1; transform: scale(1.05); }
      }
    `;

    document.head.appendChild(style);
  }
}

/** @private 静态标记，确保样式只注入一次 */
BreathingOrb._stylesInjected = false;