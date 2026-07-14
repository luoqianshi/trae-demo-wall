<!-- @trae-gen Onboarding V1.1 -->
/**
 * 银发就医小棉袄 首次使用引导
 * 适老化 4 步引导浮层：半透明遮罩 + 高亮目标 + 箭头指示 + 大字体按钮
 *
 * 用法:
 *   SilverOnboarding.start();   // 启动引导（内部会检查是否已完成，已完成则跳过）
 *   SilverOnboarding.reset();   // 重置引导状态（调试或重新引导时使用）
 *   SilverOnboarding.isDone();  // 是否已完成引导
 *
 * localStorage key: silvercare_onboarding_done
 */
(function() {
  'use strict';

  var ONBOARDING_KEY = 'silvercare_onboarding_done';

  // 引导步骤配置：selector 指向目标元素，placement 为期望的气泡位置
  // 无 selector 的步骤为纯文本介绍/结束页，居中显示
  var steps = [
    {
      // 开场介绍（无高亮目标，居中显示）
      title: '欢迎使用银发就医小棉袄',
      text: '这是一款专为老年人设计的 AI 就医陪伴工具。\n\n说话就能记健康、拍照就能认药方，把自己的健康安排得明明白白。\n\n接下来，让我们一起了解 4 个核心功能。',
      placement: 'center'
    },
    {
      selector: '.quick-action:first-child',
      title: '🎙️ 语音记录',
      text: '点击这里，说出"今天头晕、血压 148"，AI 自动整理为健康日志',
      placement: 'bottom'
    },
    {
      selector: '.med-card',
      title: '💊 今日用药',
      text: '这里显示医生开的药，打勾即可标记已服用，下方还有服药规则提醒',
      placement: 'bottom'
    },
    {
      selector: '.tab-bar .tab-item:nth-child(2)',
      title: '🏥 就医记录',
      text: '切换到「就医」页，记录每次看病时医生的诊断和处方，方便随时查看',
      placement: 'top'
    },
    {
      selector: '.tab-bar .tab-item:nth-child(3)',
      title: '👨‍👩‍👧 家人共享',
      text: '切换到「亲人」页，子女可远程查看您的健康状态和就诊摘要',
      placement: 'top'
    },
    {
      // 结束语（无高亮目标，居中显示）
      title: '恭喜完成引导',
      text: '现在您可以开始使用银发就医小棉袄了。\n\n点击语音按钮试试说出您的感受，小棉袄会一直陪伴您。',
      placement: 'center'
    }
  ];

  var currentIndex = 0;
  var overlayEl = null;    // 全屏遮罩（拦截点击）
  var highlightEl = null;  // 高亮框（透过它看到目标，周围变暗）
  var tooltipEl = null;    // 气泡提示（文案 + 按钮）
  var resizeHandler = null;
  var scrollHandler = null;

  /**
   * 是否已完成引导
   */
  function isDone() {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  /**
   * 标记引导已完成
   */
  function markDone() {
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch (e) {
      // 隐私模式下 localStorage 可能不可用，忽略
    }
  }

  /**
   * 注入引导相关样式（仅注入一次）
   */
  function injectStyles() {
    if (document.getElementById('onboarding-styles')) return;
    var css =
      '#onboarding-overlay {' +
      '  position: fixed; top: 0; left: 0; width: 100%; height: 100%;' +
      '  background: rgba(0,0,0,0.45);' +     // 半透明遮罩，强化"引导模式"视觉反馈
      '  z-index: 10000; cursor: default;' +
      '  transition: background 0.3s ease;' +
      '}' +
      '#onboarding-highlight {' +
      '  position: fixed; z-index: 10001; pointer-events: none;' +
      '  border-radius: 14px; padding: 0; margin: 0;' +
      '  box-shadow: 0 0 0 4px #FFD54F, 0 8px 32px rgba(0,0,0,0.6);' +  // 金色描边 + 阴影
      '  background: rgba(255,255,255,0.02);' +  // 让高亮区轻微透出底层内容
      '  transition: top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease;' +
      '}' +
      '#onboarding-tooltip {' +
      '  position: fixed; z-index: 10002;' +
      '  min-width: 260px; max-width: 92%;' +
      '  background: #FFFFFF; border-radius: 16px;' +
      '  padding: 20px 20px 16px;' +
      '  box-shadow: 0 8px 32px rgba(0,0,0,0.35);' +
      '  font-family: inherit; color: #333;' +
      '  transition: top 0.3s ease, left 0.3s ease;' +
      '}' +
      '#onboarding-tooltip .ob-step-indicator {' +
      '  font-size: 14px; color: #888; margin-bottom: 8px;' +
      '}' +
      '#onboarding-tooltip .ob-title {' +
      '  font-size: 22px; font-weight: 700; color: #222;' +
      '  line-height: 1.4; margin-bottom: 6px;' +
      '}' +
      '#onboarding-tooltip .ob-text {' +
      '  font-size: 20px; color: #555; line-height: 1.5; margin-bottom: 18px;' +
      '}' +
      '#onboarding-tooltip .ob-actions {' +
      '  display: flex; gap: 12px; justify-content: flex-end;' +
      '}' +
      '#onboarding-tooltip .ob-btn {' +
      '  font-family: inherit; font-size: 18px; font-weight: 600;' +
      '  border: none; border-radius: 12px;' +
      '  padding: 14px 24px; min-height: 56px;' +
      '  cursor: pointer; transition: transform 0.1s, opacity 0.15s;' +
      '}' +
      '#onboarding-tooltip .ob-btn:active { transform: scale(0.97); }' +
      '#onboarding-tooltip .ob-btn-skip {' +
      '  background: #F0F0F0; color: #666;' +
      '}' +
      '#onboarding-tooltip .ob-btn-next {' +
      '  background: #1976D2; color: #FFF;' +
      '}' +
      // 箭头指示（默认朝上，用于气泡在目标下方时）
      '#onboarding-tooltip .ob-arrow {' +
      '  position: absolute; left: 50%;' +
      '  width: 18px; height: 18px; margin-left: -9px;' +
      '  background: #FFFFFF; transform: rotate(45deg);' +
      '  box-shadow: -2px -2px 4px rgba(0,0,0,0.08);' +
      '}' +
      '#onboarding-tooltip.ob-arrow-top .ob-arrow { top: -9px; }' +
      '#onboarding-tooltip.ob-arrow-bottom .ob-arrow { bottom: -9px; }' +
      // 适老模式：字体更大、按钮更高
      'body.theme-accessible #onboarding-tooltip .ob-title { font-size: 26px; }' +
      'body.theme-accessible #onboarding-tooltip .ob-text { font-size: 23px; }' +
      'body.theme-accessible #onboarding-tooltip .ob-btn { font-size: 20px; min-height: 60px; padding: 16px 28px; }';
    var styleEl = document.createElement('style');
    styleEl.id = 'onboarding-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  /**
   * 构建遮罩 / 高亮框 / 气泡 三个基础元素
   */
  function buildOverlay() {
    injectStyles();

    overlayEl = document.createElement('div');
    overlayEl.id = 'onboarding-overlay';
    // 点击遮罩不做任何事，避免误触关闭
    document.body.appendChild(overlayEl);

    highlightEl = document.createElement('div');
    highlightEl.id = 'onboarding-highlight';
    document.body.appendChild(highlightEl);

    tooltipEl = document.createElement('div');
    tooltipEl.id = 'onboarding-tooltip';
    document.body.appendChild(tooltipEl);

    // 窗口变化或滚动时重新定位当前步骤
    resizeHandler = function() { positionCurrent(); };
    scrollHandler = function() { positionCurrent(); };
    window.addEventListener('resize', resizeHandler);
    window.addEventListener('scroll', scrollHandler, true);
  }

  /**
   * 渲染指定步骤
   */
  function renderStep(index) {
    if (index < 0 || index >= steps.length) {
      finish();
      return;
    }
    currentIndex = index;
    var step = steps[index];

    // 无 selector 的步骤（介绍/结束页）：居中显示，不高亮任何元素
    if (!step.selector) {
      showCenterTooltip(step);
      // 语音播报
      if (window.SilverTTS && typeof window.SilverTTS.speak === 'function') {
        window.SilverTTS.speak(step.text);
      }
      return;
    }

    var target = document.querySelector(step.selector);
    if (!target) {
      // 目标不存在则跳到下一步
      renderStep(index + 1);
      return;
    }

    // 先把目标滚动到可视区
    try {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {
      target.scrollIntoView();
    }

    // 等待滚动完成后再定位（平滑滚动约 200~300ms）
    setTimeout(function() { positionCurrent(); }, 280);

    // 语音播报当前步骤（用户点击"下一步"触发，在用户交互上下文中）
    if (window.SilverTTS && typeof window.SilverTTS.speak === 'function') {
      window.SilverTTS.speak(step.text);
    }
  }

  /**
   * 居中显示无高亮目标的步骤（介绍页 / 结束页）
   */
  function showCenterTooltip(step) {
    // 隐藏高亮框
    if (highlightEl) {
      highlightEl.style.display = 'none';
    }

    var isLast = currentIndex === steps.length - 1;
    var isFirst = currentIndex === 0;
    var stepNum = currentIndex + 1;
    var totalSteps = steps.length;

    tooltipEl.innerHTML =
      '<div class="ob-step-indicator">' + (isFirst ? '欢迎' : isLast ? '完成' : ('第 ' + stepNum + ' 步 / 共 ' + totalSteps + ' 步')) + '</div>' +
      '<div class="ob-title">' + step.title + '</div>' +
      '<div class="ob-text">' + step.text.replace(/\n/g, '<br>') + '</div>' +
      '<div class="ob-actions">' +
        '<button class="ob-btn ob-btn-skip" type="button">' + (isFirst ? '跳过' : '跳过') + '</button>' +
        '<button class="ob-btn ob-btn-next" type="button">' + (isLast ? '完成' : (isFirst ? '开始引导' : '下一步')) + '</button>' +
      '</div>';

    tooltipEl.querySelector('.ob-btn-skip').addEventListener('click', finish);
    tooltipEl.querySelector('.ob-btn-next').addEventListener('click', function() {
      if (isLast) {
        finish();
      } else {
        renderStep(currentIndex + 1);
      }
    });

    // 居中定位
    var tipRect = tooltipEl.getBoundingClientRect();
    var top = Math.max(40, (window.innerHeight - tipRect.height) / 2);
    var left = Math.max(16, (window.innerWidth - tipRect.width) / 2);
    tooltipEl.style.top = top + 'px';
    tooltipEl.style.left = left + 'px';
    tooltipEl.className = '';
  }

  /**
   * 定位当前步骤的高亮框与气泡
   */
  function positionCurrent() {
    if (!highlightEl || !tooltipEl) return;
    var step = steps[currentIndex];
    if (!step) return;
    var target = document.querySelector(step.selector);
    if (!target) return;

    // 恢复高亮框显示（从居中步骤切换回来时可能被隐藏了）
    highlightEl.style.display = '';

    var rect = target.getBoundingClientRect();
    var pad = 8;

    // 高亮框包住目标
    highlightEl.style.top = (rect.top - pad) + 'px';
    highlightEl.style.left = (rect.left - pad) + 'px';
    highlightEl.style.width = (rect.width + pad * 2) + 'px';
    highlightEl.style.height = (rect.height + pad * 2) + 'px';

    var isLast = currentIndex === steps.length - 1;
    tooltipEl.innerHTML =
      '<div class="ob-step-indicator">第 ' + (currentIndex + 1) + ' 步 / 共 ' + steps.length + ' 步</div>' +
      '<div class="ob-title">' + step.title + '</div>' +
      '<div class="ob-text">' + step.text + '</div>' +
      '<div class="ob-actions">' +
        '<button class="ob-btn ob-btn-skip" type="button">跳过</button>' +
        '<button class="ob-btn ob-btn-next" type="button">' + (isLast ? '完成' : '下一步') + '</button>' +
      '</div>' +
      '<div class="ob-arrow"></div>';

    // 绑定按钮事件
    tooltipEl.querySelector('.ob-btn-skip').addEventListener('click', finish);
    tooltipEl.querySelector('.ob-btn-next').addEventListener('click', function() {
      if (isLast) {
        finish();
      } else {
        renderStep(currentIndex + 1);
      }
    });

    // 计算气泡位置
    var tipRect = tooltipEl.getBoundingClientRect();
    var arrowSize = 14;
    var margin = 12;
    var placement = step.placement || 'bottom';
    var top, left;
    var arrowClass = 'ob-arrow-top'; // 默认箭头在气泡顶部（气泡位于目标下方）

    // 水平居中于目标
    left = rect.left + rect.width / 2 - tipRect.width / 2;
    if (left < margin) left = margin;
    if (left + tipRect.width > window.innerWidth - margin) {
      left = window.innerWidth - tipRect.width - margin;
    }

    // 候选位置：下方 / 上方
    var belowTop = rect.bottom + arrowSize + 8;
    var aboveTop = rect.top - tipRect.height - arrowSize - 8;
    var belowFits = belowTop + tipRect.height <= window.innerHeight - margin;
    var aboveFits = aboveTop >= margin;

    if (placement === 'bottom') {
      if (belowFits) {
        top = belowTop;
        arrowClass = 'ob-arrow-top';
      } else if (aboveFits) {
        top = aboveTop;
        arrowClass = 'ob-arrow-bottom';
      } else {
        // 上下都放不下：优先按 placement 方向，再 clamp 进视口
        top = belowTop;
        arrowClass = 'ob-arrow-top';
        if (top + tipRect.height > window.innerHeight - margin) {
          top = window.innerHeight - tipRect.height - margin;
        }
        if (top < margin) top = margin;
      }
    } else {
      // placement === 'top'
      if (aboveFits) {
        top = aboveTop;
        arrowClass = 'ob-arrow-bottom';
      } else if (belowFits) {
        top = belowTop;
        arrowClass = 'ob-arrow-top';
      } else {
        top = aboveTop;
        arrowClass = 'ob-arrow-bottom';
        if (top < margin) top = margin;
        if (top + tipRect.height > window.innerHeight - margin) {
          top = window.innerHeight - tipRect.height - margin;
        }
      }
    }

    tooltipEl.style.top = top + 'px';
    tooltipEl.style.left = left + 'px';
    tooltipEl.className = arrowClass;
  }

  /**
   * 结束引导：标记完成并清理 DOM 与事件
   * 设计师 P0 修复：通过 postMessage 通知父页面 index.html，触发 guideComplete 显示
   */
  function finish() {
    markDone();
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler, true);
      scrollHandler = null;
    }
    if (overlayEl) { overlayEl.remove(); overlayEl = null; }
    if (highlightEl) { highlightEl.remove(); highlightEl = null; }
    if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
    currentIndex = 0;
    // 完成反馈：让用户知道引导已结束、可以开始体验
    if (typeof window.showToast === 'function') {
      window.showToast('✅ 引导已完成，开始体验吧！点击「语音」试试说话记录健康', 'success');
    }
    // 通知父页面（index.html）引导已完成
    // 父页面收到后标记所有 3 步为已访问，显示 guideComplete
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'silvercare_onboarding_complete' }, '*');
      }
    } catch (e) {
      // 跨域时 postMessage 仍可发送（targetOrigin='*'），失败时静默降级
    }
  }

  /**
   * 启动引导：若已完成或不在首页则跳过
   */
  function start() {
    if (isDone()) return;
    // 仅在存在快捷入口的首页启动，避免误在其他页面触发
    if (!document.querySelector('.quick-actions')) return;
    if (overlayEl) return; // 防止重复启动
    buildOverlay();
    renderStep(0);
  }

  /**
   * 强制启动引导（忽略"已完成"标记，用于用户主动重新打开引导）
   * 用法：SilverOnboarding.forceStart()
   * 注：若引导已在运行，先清理旧 overlay 再重启，确保按钮始终有响应
   */
  function forceStart() {
    if (!document.querySelector('.quick-actions')) {
      // 不在首页则提示用户先回到首页
      if (typeof showToast === 'function') {
        showToast('请先回到「我的健康」首页再开启引导', 'info');
      }
      return;
    }
    // 若引导已在运行，先清理旧 overlay 再重启，避免按钮"无反应"
    if (overlayEl) {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
      }
      if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler, true);
        scrollHandler = null;
      }
      if (overlayEl) { overlayEl.remove(); overlayEl = null; }
      if (highlightEl) { highlightEl.remove(); highlightEl = null; }
      if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
      currentIndex = 0;
    }
    buildOverlay();
    renderStep(0);
  }

  /**
   * 重置引导状态
   */
  function reset() {
    try {
      localStorage.removeItem(ONBOARDING_KEY);
    } catch (e) {}
  }

  // 暴露 API 到全局
  window.SilverOnboarding = {
    start: start,
    forceStart: forceStart,
    reset: reset,
    isDone: isDone,
    version: '20260711e' // 用于检测缓存版本，外层 iframe 据此决定是否重载
  };
})();
