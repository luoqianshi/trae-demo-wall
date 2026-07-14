/**
 * 银发就医小棉袄 - 5秒冷静期组件 SilverCoolDown
 * data-trae-gen="true"
 * @trae-review-status: reviewed
 *
 * 用途：safety_flag=red 时，强制展示 5 秒冷静期确认弹窗，
 *       防止老年用户不加辨别地直接采纳 AI 生成的医嘱内容。
 *
 * 设计目的：
 *   - 倒计时期间"我已了解风险"按钮禁用，强制用户等待阅读
 *   - 倒计时结束后按钮启用，用户须主动确认才能继续查看摘要
 *   - Demo 模式跳过 5 秒倒计时，但保留按钮文字与确认弹窗 UI，
 *     并显示说明文案"演示模式——冷静期已跳过"
 *
 * 纯 HTML5+CSS3+原生 JS，零依赖，零 npm，零构建。
 * 挂载到 window.Silver.CoolDown 命名空间。
 *
 * 用法：
 *   Silver.CoolDown.show({
 *     reason: '风险原因文案',
 *     suggestion: '操作建议文案',
 *     demoMode: false,
 *     onConfirm: function() { ... },
 *     onCancel: function() { ... }
 *   });
 */
(function () {
  'use strict';

  // ============ 常量 ============
  var COUNTDOWN_SECONDS = 5;          // 冷静期倒计时秒数
  var RING_RADIUS = 54;               // 进度环 SVG 半径
  var RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // 周长 ≈ 339.29

  // 状态枚举
  var STATE_IDLE = 'idle';            // 未展示
  var STATE_COUNTING = 'counting';    // 倒计时中
  var STATE_READY = 'ready';          // 倒计时结束，可确认
  var STATE_DEMO = 'demo';            // 演示模式（跳过倒计时）

  // ============ 模块私有状态 ============
  var overlay = null;                 // 遮罩 DOM
  var countdownTimer = null;          // setInterval 句柄
  var remainingSeconds = COUNTDOWN_SECONDS;
  var currentState = STATE_IDLE;
  var callbacks = { onConfirm: null, onCancel: null };

  // ============ 工具函数 ============

  /**
   * 安全文本转义，防止 reason/suggestion 中的 HTML 注入。
   */
  function escapeText(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 获取当前状态。
   * @returns {'idle'|'counting'|'ready'|'demo'}
   */
  function getState() {
    return currentState;
  }

  // ============ DOM 构建 ============

  /**
   * 构建弹窗 DOM 并绑定事件。
   */
  function buildModal(options) {
    overlay = document.createElement('div');
    overlay.className = 'silver-cooldown-overlay';
    overlay.setAttribute('data-trae-gen', 'true');

    var reasonHtml = options.reason
      ? '<div class="scd-reason"><span class="scd-label">⚠️ 风险提示</span><p class="scd-text">' + escapeText(options.reason) + '</p></div>'
      : '';
    var suggestionHtml = options.suggestion
      ? '<div class="scd-suggestion"><span class="scd-label">💡 操作建议</span><p class="scd-text">' + escapeText(options.suggestion) + '</p></div>'
      : '';

    var demoHintHtml = options.demoMode
      ? '<div class="scd-demo-hint">体验模式——冷静期已跳过</div>'
      : '';

    // 进度环（仅非 Demo 模式展示）
    var ringHtml = options.demoMode
      ? ''
      : ('<div class="scd-timer-wrap">' +
         '<svg class="scd-timer-ring" width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">' +
         '<circle class="scd-timer-ring-bg" cx="60" cy="60" r="' + RING_RADIUS + '" fill="none" stroke-width="8"/>' +
         '<circle class="scd-timer-ring-fg" cx="60" cy="60" r="' + RING_RADIUS + '" fill="none" stroke-width="8" stroke-linecap="round" transform="rotate(-90 60 60)"/>' +
         '</svg>' +
         '<span class="scd-countdown">' + COUNTDOWN_SECONDS + '</span>' +
         '</div>');

    // 按钮初始文案
    var btnText = options.demoMode
      ? '我已了解风险，查看摘要'
      : ('请等待 ' + COUNTDOWN_SECONDS + ' 秒');

    var modal = document.createElement('div');
    modal.className = 'silver-cooldown-modal';
    modal.setAttribute('role', 'alertdialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'scd-title');
    modal.innerHTML =
      '<div class="scd-icon" aria-hidden="true">⚠️</div>' +
      '<h2 class="scd-title" id="scd-title">请先冷静确认</h2>' +
      '<p class="scd-desc">AI 生成的医嘱内容可能存在偏差，请仔细阅读以下提示后再继续。</p>' +
      reasonHtml +
      suggestionHtml +
      ringHtml +
      demoHintHtml +
      '<button type="button" class="scd-btn" id="scd-confirm-btn" disabled>' + escapeText(btnText) + '</button>' +
      '<button type="button" class="scd-cancel" id="scd-cancel-btn" aria-label="关闭">不看了，返回</button>';

    overlay.appendChild(modal);

    // 绑定事件
    var confirmBtn = modal.querySelector('#scd-confirm-btn');
    var cancelBtn = modal.querySelector('#scd-cancel-btn');

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    // 点击遮罩空白处不关闭（强制用户主动选择），避免误触跳过冷静期

    // ESC 键关闭（仅倒计时结束后生效）
    document.addEventListener('keydown', handleEsc);

    return overlay;
  }

  // ============ 倒计时逻辑 ============

  /**
   * 启动 5 秒倒计时与进度环动画。
   */
  function startCountdown() {
    currentState = STATE_COUNTING;
    remainingSeconds = COUNTDOWN_SECONDS;

    var ringFg = overlay.querySelector('.scd-timer-ring-fg');
    var countdownEl = overlay.querySelector('.scd-countdown');
    var btn = overlay.querySelector('#scd-confirm-btn');

    // 初始化进度环：满环（dashoffset=0 表示完整圆周可见）
    if (ringFg) {
      ringFg.style.strokeDasharray = RING_CIRCUMFERENCE;
      ringFg.style.strokeDashoffset = '0';
      // 强制重绘以触发 transition
      // eslint-disable-next-line no-unused-expressions
      ringFg.getBoundingClientRect();
      // 5 秒内从满环过渡到空环（dashoffset = 周长）
      ringFg.style.transition = 'stroke-dashoffset ' + COUNTDOWN_SECONDS + 's linear';
      ringFg.style.strokeDashoffset = String(RING_CIRCUMFERENCE);
    }

    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(function () {
      remainingSeconds--;
      if (countdownEl) {
        countdownEl.textContent = Math.max(remainingSeconds, 0);
      }
      if (remainingSeconds <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        enableConfirm(btn);
      } else if (btn) {
        btn.textContent = '请等待 ' + remainingSeconds + ' 秒';
      }
    }, 1000);
  }

  /**
   * 倒计时结束：启用确认按钮，更新文案。
   */
  function enableConfirm(btn) {
    currentState = STATE_READY;
    if (btn) {
      btn.disabled = false;
      btn.textContent = '我已了解风险，查看摘要';
      btn.classList.add('scd-btn-ready');
    }
  }

  /**
   * Demo 模式：跳过倒计时，直接启用按钮。
   */
  function startDemoMode() {
    currentState = STATE_DEMO;
    var btn = overlay.querySelector('#scd-confirm-btn');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '我已了解风险，查看摘要';
      btn.classList.add('scd-btn-ready');
    }
  }

  // ============ 事件处理 ============

  function handleConfirm() {
    if (currentState !== STATE_READY && currentState !== STATE_DEMO) return;
    var cb = callbacks.onConfirm;
    hide();
    if (typeof cb === 'function') cb();
  }

  function handleCancel() {
    var cb = callbacks.onCancel;
    hide();
    if (typeof cb === 'function') cb();
  }

  function handleEsc(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      // 仅倒计时结束后允许 ESC 关闭
      if (currentState === STATE_READY || currentState === STATE_DEMO) {
        handleCancel();
      }
    }
  }

  // ============ 公共 API ============

  /**
   * 显示冷静期弹窗。
   * @param {Object} options
   *   {string} options.reason - 风险原因文案
   *   {string} options.suggestion - 操作建议文案
   *   {boolean} options.demoMode - 是否演示模式（跳过倒计时）
   *   {Function} options.onConfirm - 用户确认后的回调
   *   {Function} options.onCancel - 用户取消/关闭后的回调
   */
  function show(options) {
    options = options || {};
    // 若已有弹窗展示，先隐藏再重新展示
    if (overlay) hide();

    callbacks.onConfirm = typeof options.onConfirm === 'function' ? options.onConfirm : null;
    callbacks.onCancel = typeof options.onCancel === 'function' ? options.onCancel : null;

    buildModal(options);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    if (options.demoMode) {
      startDemoMode();
    } else {
      startCountdown();
    }
  }

  /**
   * 隐藏冷静期弹窗并清理状态。
   */
  function hide() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
      overlay = null;
    }
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleEsc);
    currentState = STATE_IDLE;
  }

  // ============ 暴露 API ============
  window.Silver = window.Silver || {};
  window.Silver.CoolDown = {
    show: show,
    hide: hide,
    getState: getState,
    // 暴露常量便于测试与外部集成
    _constants: {
      COUNTDOWN_SECONDS: COUNTDOWN_SECONDS,
      STATES: { IDLE: STATE_IDLE, COUNTING: STATE_COUNTING, READY: STATE_READY, DEMO: STATE_DEMO }
    }
  };
})();
