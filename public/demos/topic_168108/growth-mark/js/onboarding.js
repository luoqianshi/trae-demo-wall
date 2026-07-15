/**
 * 成长印记 · 新用户动态指引（onboarding.js）
 * 首次访问时展示 Spotlight Tour，逐步引导用户了解核心功能。
 * 纯原生 JS + CSS，无第三方依赖。
 * localStorage 键：growthmark_onboarding_done
 */
'use strict';

const Onboarding = {
  // ============================================================
  // 状态
  // ============================================================
  _isActive: false,
  _currentStep: -1,
  _onComplete: null,

  // DOM 引用（运行时缓存）
  _overlay: null,
  _spotlight: null,
  _tooltip: null,
  _resizeRAF: null,
  _keyHandler: null,
  _resizeHandler: null,
  _scrollEndHandler: null,

  // 配置
  _STORAGE_KEY: 'growthmark_onboarding_done',
  _SPOTLIGHT_PADDING: 8,
  _TOOLTIP_GAP: 16,

  // 常量定义
  _DELAY_INIT: 100,
  _DELAY_VIEW_SWITCH: 250,
  _DELAY_VIEW_SWITCH_EXTRA: 100,
  _DELAY_SCROLL_STABLE_MOBILE: 250,
  _DELAY_SCROLL_STABLE_DESKTOP: 150,
  _DELAY_DYNAMIC_TARGET: 350,
  _DELAY_EXTRA_OFFSET: 50,
  _DELAY_TARGET_NOT_FOUND: 80,

  // ============================================================
  // 步骤定义
  // ============================================================
  _steps: [
    // ---- 步骤 0：欢迎（全屏居中，不聚焦任何元素） ----
    {
      target: null,
      title: '欢迎来到成长印记',
      description: '你好呀 👋 这里是只属于你的成长小窝。\n不管是灵光一闪的念头，还是沉甸甸的收获，\n都可以轻轻地放在这里，我来帮你收好。',
      type: 'welcome',
      fullscreen: true
    },
    // ---- 步骤 1：输入记录 ----
    {
      target: '[data-onboarding="capture"]',
      title: '记录你的成长',
      description: '把心里的话、工作的思考、学习的笔记，\n都可以粘贴在这里。\n我会帮你读、帮你整理，变成一张温柔的小卡片。',
      placement: 'bottom',
      scrollBehavior: 'center',
      type: 'normal',
      switchView: true,
      onEnter: function(el) {
        if (typeof App !== 'undefined') App.switchView('home');
        if (el && el.classList) el.classList.add('onboarding-pulse');
      }
    },
    // ---- 步骤 2：你的成长印记 ----
    {
      target: '[data-onboarding="cards-section"]',
      title: '你的成长印记',
      description: '每一条记录，都会变成一张有温度的卡片。\n点进去看看，我是怎么读懂你的故事的。',
      placement: 'top',
      scrollBehavior: 'center',
      type: 'normal',
      switchView: true,
      scrollExtraOffset: 90,
      onEnter: function(el) {
        if (typeof App !== 'undefined') App.switchView('home');
      }
    },
    // ---- 步骤 3：智能关联发现（动态查找第一张卡片并展开） ----
    {
      target: null,
      dynamicTarget: '.record-card',
      title: '看见成长的脉络',
      description: '你看，这些记录之间有着悄悄的联系——\n某段学习，某段思考，某段实践，\n原来它们一直都在彼此呼应。',
      placement: 'top',
      scrollBehavior: 'center',
      type: 'normal',
      switchView: true,
      onEnter: function(el) {
        if (typeof App !== 'undefined') App.switchView('home');
        if (el && el.dataset && el.dataset.recordId && typeof Render !== 'undefined') {
          if (!el.classList.contains('active')) {
            Render.toggleCard(el, el.dataset.recordId);
          }
        }
      }
    },
    // ---- 步骤 4：导航切换 ----
    {
      target: '[data-onboarding="nav"]',
      title: '换个角度看自己',
      description: '「时光回顾」陪你回望走过的路，\n「演进脉络」帮你看清每一条成长线。\n怎么舒服，怎么看。',
      placement: 'bottom',
      scrollBehavior: 'start',
      type: 'normal',
      switchView: true,
      onEnter: function(el) {
        if (typeof App !== 'undefined') App.switchView('home');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    // ---- 步骤 5：时光回顾 ----
    {
      target: '[data-onboarding="review"]',
      title: '时光回顾',
      description: '翻一翻每个月的自己——\n那些你以为忘了的事，\n其实一直都在时间里发着光。',
      placement: 'right',
      scrollBehavior: 'start',
      type: 'normal',
      switchView: true,
      scrollExtraOffset: 60,
      onEnter: function(el) {
        if (typeof App !== 'undefined') App.switchView('review');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    // ---- 步骤 6：演进脉络 ----
    {
      target: '[data-onboarding="routes"]',
      title: '演进脉络',
      description: '每一个标签，都是一条专属的成长小径。\n沿着时间走下去，\n你会看见自己是怎么一步步变成今天的样子。',
      placement: 'left',
      scrollBehavior: 'start',
      type: 'normal',
      switchView: true,
      scrollExtraOffset: 60,
      onEnter: function(el) {
        if (typeof App !== 'undefined') App.switchView('routes');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    // ---- 步骤 7：AI 服务设置 ----
    {
      target: '[data-onboarding="settings"]',
      title: '让 AI 更懂你',
      description: '点击这个小齿轮，配置你的 AI 服务。\n接入真实 API 后，分析会更精准、更懂你。\n什么时候想设置了，随时来找它。',
      placement: 'bottom',
      scrollBehavior: 'start',
      type: 'normal',
      switchView: true,
      onEnter: function(el) {
        if (typeof App !== 'undefined') App.switchView('home');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    // ---- 步骤 8：完成 ----
    {
      target: '[data-onboarding="cta"]',
      title: '准备好了吗？',
      description: '来吧，写下你的第一条成长印记。\n从今天开始，\n让每一步都被温柔地记住。',
      placement: 'top',
      scrollBehavior: 'center',
      type: 'complete',
      switchView: true,
      onEnter: function(el) {
        if (typeof App !== 'undefined') App.switchView('home');
      }
    }
  ],

  // ============================================================
  // 公开方法
  // ============================================================

  /**
   * 新用户首次启动引导（供 App.init() 调用）
   * @param {Function} [onComplete] - 引导完成或跳过后的回调
   */
  startIfNew: function(onComplete) {
    // 已完成过引导，跳过
    if (localStorage.getItem(this._STORAGE_KEY)) return;

    // 防御性检查：关键 DOM 是否存在
    if (!document.querySelector('[data-onboarding="hero"]')) {
      console.warn('[Onboarding] 关键 DOM 不存在，跳过引导');
      return;
    }

    this._onComplete = onComplete || null;
    this._isActive = true;
    this._createDOM();
    this._bindGlobalEvents();

    // 首步延迟启动，等待 DOM 渲染
    var self = this;
    setTimeout(function() {
      if (!self._isActive) return;
      self._goToStep(0);
    }, this._DELAY_INIT);
  },

  /**
   * 手动重新触发引导（供"帮助"按钮或调试调用）
   */
  restart: function() {
    // 如果正在运行，先清理
    if (this._isActive) {
      this._unbindGlobalEvents();
      this._destroyDOM();
    }
    localStorage.removeItem(this._STORAGE_KEY);
    document.body.classList.remove('onboarding-active');
    this.startIfNew();
  },

  // ============================================================
  // 生命周期
  // ============================================================

  /**
   * 创建遮罩、高亮框和 Tooltip DOM
   */
  _createDOM: function() {
    var self = this;

    // 1. 点击拦截层（透明，仅防止用户点击被引导元素外的区域）
    this._overlay = document.createElement('div');
    this._overlay.className = 'onboarding-overlay';
    document.body.appendChild(this._overlay);

    // 点击遮罩 = 跳过
    this._overlay.addEventListener('click', function() { self._skip(); });

    // 2. 高亮框（box-shadow 镂空效果）
    this._spotlight = document.createElement('div');
    this._spotlight.className = 'onboarding-spotlight';
    document.body.appendChild(this._spotlight);

    // 3. Tooltip 气泡
    this._tooltip = document.createElement('div');
    this._tooltip.className = 'onboarding-tooltip';
    this._tooltip.setAttribute('role', 'dialog');
    this._tooltip.setAttribute('aria-label', '新手引导');
    this._tooltip.innerHTML = this._buildTooltipHTML();
    document.body.appendChild(this._tooltip);

    // 绑定 Tooltip 内部按钮事件
    var skipBtn = this._tooltip.querySelector('.onboarding-skip-btn');
    if (skipBtn) skipBtn.addEventListener('click', function(e) { e.stopPropagation(); self._skip(); });

    var prevBtn = this._tooltip.querySelector('.onboarding-btn-prev');
    if (prevBtn) prevBtn.addEventListener('click', function(e) { e.stopPropagation(); self._prevStep(); });

    var nextBtn = this._tooltip.querySelector('.onboarding-btn-next');
    if (nextBtn) nextBtn.addEventListener('click', function(e) { e.stopPropagation(); self._nextStep(); });

    // 让页面 fade-in 元素立即显示（避免引导期间页面内容空白）
    var fadeEls = document.querySelectorAll('.fade-in:not(.visible)');
    for (var i = 0; i < fadeEls.length; i++) {
      fadeEls[i].classList.add('visible');
    }

    // 禁止 body 滚动（引导期间由 JS 控制滚动）
    document.body.classList.add('onboarding-active');
  },

  /**
   * 构建 Tooltip 内部 HTML
   */
  _buildTooltipHTML: function() {
    var dotsHTML = '';
    for (var i = 0; i < this._steps.length; i++) {
      dotsHTML += '<span class="onboarding-step-dot"></span>';
    }
    return '' +
      '<div class="onboarding-tooltip-inner">' +
        '<div class="onboarding-tooltip-header">' +
          '<div class="onboarding-step-indicator">' + dotsHTML + '</div>' +
          '<button class="onboarding-skip-btn" aria-label="稍后再看">稍后再看</button>' +
        '</div>' +
        '<h3 class="onboarding-tooltip-title"></h3>' +
        '<p class="onboarding-tooltip-desc"></p>' +
        '<div class="onboarding-tooltip-footer">' +
          '<button class="onboarding-btn-prev" style="display:none;">上一步</button>' +
          '<button class="onboarding-btn-next">继续 →</button>' +
        '</div>' +
      '</div>' +
      '<div class="onboarding-tooltip-arrow"></div>';
  },

  /**
   * 绑定全局事件（键盘、窗口 resize）
   */
  _bindGlobalEvents: function() {
    var self = this;

    // 键盘操作
    this._keyHandler = function(e) {
      if (!self._isActive) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        self._skip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (self._currentStep === self._steps.length - 1) {
          self._complete();
        } else {
          self._nextStep();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        self._prevStep();
      }
    };
    document.addEventListener('keydown', this._keyHandler);

    // 窗口 resize 重定位（RAF 节流）
    this._resizeHandler = function() {
      if (self._resizeRAF) cancelAnimationFrame(self._resizeRAF);
      self._resizeRAF = requestAnimationFrame(function() {
        if (self._isActive && self._currentStep >= 0) {
          var step = self._steps[self._currentStep];
          if (step.fullscreen) return;
          var target = self._getStepTarget(step);
          if (target) {
            self._positionSpotlight(target);
            self._positionTooltip(target, step.placement);
          }
        }
      });
    };
    window.addEventListener('resize', this._resizeHandler);
  },

  /**
   * 解绑全局事件
   */
  _unbindGlobalEvents: function() {
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    if (this._resizeRAF) {
      cancelAnimationFrame(this._resizeRAF);
      this._resizeRAF = null;
    }
    if (this._scrollEndHandler) {
      window.removeEventListener('scrollend', this._scrollEndHandler);
      this._scrollEndHandler = null;
    }
  },

  /**
   * 销毁所有 DOM，恢复页面状态
   */
  _destroyDOM: function() {
    if (this._overlay) { this._overlay.remove(); this._overlay = null; }
    if (this._spotlight) { this._spotlight.remove(); this._spotlight = null; }
    if (this._tooltip) { this._tooltip.remove(); this._tooltip = null; }
    document.body.classList.remove('onboarding-active');
    document.body.style.overflow = '';

    // 清除输入框呼吸动画残留
    var pulseEl = document.querySelector('.capture-textarea.onboarding-pulse');
    if (pulseEl) pulseEl.classList.remove('onboarding-pulse');
  },

  // ============================================================
  // 步骤控制
  // ============================================================

  /**
   * 跳转到指定步骤
   * @param {number} index - 目标步骤索引
   */
  _goToStep: function(index) {
    if (index < 0 || index >= this._steps.length) return;
    var step = this._steps[index];

    var prevStep = this._currentStep;
    this._currentStep = index;

    var self = this;

    // 全屏欢迎模式：不聚焦任何元素，直接居中弹窗
    if (step.fullscreen) {
      if (prevStep >= 0 && prevStep !== index) {
        this._tooltip.classList.add('onboarding-tooltip-fade-out');
        setTimeout(function() {
          if (!self._isActive) return;
          self._tooltip.classList.remove('onboarding-tooltip-fade-out');
          self._doStepPositioning(index, step, prevStep);
        }, self._DELAY_INIT);
      } else {
        this._doStepPositioning(index, step, prevStep);
      }
      return;
    }

    // 执行 onEnter 钩子（如果有）
    if (step.onEnter) {
      var targetEl = this._getStepTarget(step);
      try { step.onEnter(targetEl); } catch(e) { console.warn('[Onboarding] onEnter error:', e); }
    }

    // 如果步骤标记需要切换视图，延迟等待视图动画完成
    var needsViewSwitch = step.switchView;
    if (needsViewSwitch) {
      if (prevStep >= 0 && prevStep !== index) {
        this._tooltip.classList.add('onboarding-tooltip-fade-out');
        setTimeout(function() {
          if (!self._isActive) return;
          self._tooltip.classList.remove('onboarding-tooltip-fade-out');
          self._doStepPositioning(index, step, prevStep);
        }, self._DELAY_VIEW_SWITCH + self._DELAY_VIEW_SWITCH_EXTRA);
      } else {
        setTimeout(function() {
          if (!self._isActive) return;
          self._doStepPositioning(index, step, prevStep);
        }, self._DELAY_VIEW_SWITCH);
      }
    } else {
      // 无需切换视图，直接定位
      this._doStepPositioning(index, step, prevStep);
    }
  },

  /**
   * 执行步骤定位（滚动 + spotlight + tooltip）
   */
  _doStepPositioning: function(index, step, prevStep) {
    var self = this;
    var target = this._getStepTarget(step);

    // 非全屏模式下目标元素不存在则跳过
    if (!step.fullscreen && !target) {
      console.warn('[Onboarding] 步骤 ' + index + ' 目标未找到: ' + (step.target || step.dynamicTarget));
      setTimeout(function() {
        if (!self._isActive) return;
        self._goToStep(index + 1);
      }, self._DELAY_TARGET_NOT_FOUND);
      return;
    }

    // 清除上一步的输入框呼吸效果
    if (prevStep >= 0 && prevStep !== index) {
      var prevPulseEl = document.querySelector('.capture-textarea.onboarding-pulse');
      if (prevPulseEl) prevPulseEl.classList.remove('onboarding-pulse');
    }

    // 全屏模式：全屏灰色遮罩，tooltip 居中
    if (step.fullscreen) {
      // 显示全屏灰色遮罩
      this._overlay.classList.add('fullscreen-mask');
      this._spotlight.classList.remove('visible');
      this._positionTooltipFullscreen();
      this._updateTooltipContent(step);
      this._tooltip.classList.add('visible');
      return;
    } else {
      // 非全屏模式：移除全屏遮罩样式
      this._overlay.classList.remove('fullscreen-mask');
    }

    // 步骤类型特殊处理（spotlight 边框颜色）
    if (step.type === 'welcome') {
      this._spotlight.classList.add('spotlight-gold');
    } else {
      this._spotlight.classList.remove('spotlight-gold');
    }
    if (step.type === 'complete') {
      this._spotlight.classList.add('spotlight-gold');
    }

    // 滚动到目标可见，并为 tooltip 预留空间
    this._scrollToTarget(target, step.scrollBehavior, step.placement);

    // 如果步骤有额外滚动偏移，向上微调（确保标题露出）
    if (step.scrollExtraOffset) {
      setTimeout(function() {
        if (!self._isActive) return;
        window.scrollBy({ top: -step.scrollExtraOffset, behavior: 'instant' });
      }, self._DELAY_EXTRA_OFFSET);
    }

    // 等滚动稳定后定位
    var scrollDelay = this._isMobile() ? this._DELAY_SCROLL_STABLE_MOBILE : this._DELAY_SCROLL_STABLE_DESKTOP;
    setTimeout(function() {
      if (!self._isActive) return;
      self._positionSpotlight(target);
      self._positionTooltip(target, step.placement);
      self._updateTooltipContent(step);
      self._spotlight.classList.add('visible');
      self._tooltip.classList.add('visible');

      // 对于 dynamicTarget 步骤（如智能关联发现），卡片展开后需要二次定位
      if (step.dynamicTarget) {
        setTimeout(function() {
          if (self._isActive && self._currentStep === index) {
            // 卡片展开后高度变化，先重新滚动确保标题可见
            self._scrollToTarget(target, step.scrollBehavior, step.placement);
            // 重新定位 spotlight 和 tooltip
            self._positionSpotlight(target);
            self._positionTooltip(target, step.placement);
          }
        }, self._DELAY_DYNAMIC_TARGET);
      }
    }, scrollDelay);

    // 额外保险：监听 scrollend 事件重定位
    if ('onscrollend' in window) {
      // 先移除上一步可能残留的 scrollend 监听器（防累积）
      if (self._scrollEndHandler) {
        window.removeEventListener('scrollend', self._scrollEndHandler);
      }
      self._scrollEndHandler = function() {
        if (self._isActive && self._currentStep === index) {
          self._positionSpotlight(target);
          self._positionTooltip(target, step.placement);
        }
        window.removeEventListener('scrollend', self._scrollEndHandler);
        self._scrollEndHandler = null;
      };
      window.addEventListener('scrollend', self._scrollEndHandler);
    }
  },

  /**
   * 下一步（最后一步时点击等同于完成）
   */
  _nextStep: function() {
    if (this._currentStep < this._steps.length - 1) {
      this._goToStep(this._currentStep + 1);
    } else if (this._currentStep === this._steps.length - 1) {
      this._complete();
    }
  },

  /**
   * 上一步
   */
  _prevStep: function() {
    if (this._currentStep > 0) {
      this._goToStep(this._currentStep - 1);
    }
  },

  /**
   * 完成引导（标记 localStorage + 庆祝动画 + 清理）
   */
  _complete: function() {
    this._isActive = false;
    localStorage.setItem(this._STORAGE_KEY, 'true');

    // 庆祝动画：金色光晕
    this._spotlight.classList.add('celebrate');

    var self = this;
    // 延迟后清理
    setTimeout(function() {
      self._spotlight.classList.remove('visible');
      self._tooltip.classList.remove('visible');
      self._tooltip.classList.add('onboarding-tooltip-fade-out');
      self._overlay.classList.add('fade-out');

      setTimeout(function() {
        self._unbindGlobalEvents();
        self._destroyDOM();
        if (self._onComplete) self._onComplete();
      }, 300);
    }, 400);
  },

  /**
   * 跳过引导
   */
  _skip: function() {
    this._isActive = false;
    localStorage.setItem(this._STORAGE_KEY, 'true');
    if (this._overlay) this._overlay.classList.add('fade-out');
    this._unbindGlobalEvents();
    this._destroyDOM();
    if (this._onComplete) this._onComplete();
  },

  // ============================================================
  // 定位与渲染
  // ============================================================

  /**
   * 定位高亮框到目标元素（box-shadow 镂空）
   * @param {HTMLElement} target
   * @param {Object} [customRect] - 自定义范围 {top, left, width, height}
   */
  _positionSpotlight: function(target, customRect) {
    var rect = customRect || target.getBoundingClientRect();
    var pad = this._SPOTLIGHT_PADDING;

    this._spotlight.style.top = (rect.top - pad) + 'px';
    this._spotlight.style.left = (rect.left - pad) + 'px';
    this._spotlight.style.width = (rect.width + pad * 2) + 'px';
    this._spotlight.style.height = (rect.height + pad * 2) + 'px';

    // 尝试获取目标元素的圆角（自定义范围时使用默认圆角）
    var radius = customRect ? 12 : this._getElementRadius(target);
    this._spotlight.style.borderRadius = radius + 'px';
  },

  /**
   * 定位 Tooltip 气泡
   * 策略：首选方向 → 翻转方向 → 左右方向 → 视口内兜底位置
   * @param {HTMLElement} target
   * @param {string} preferredPlacement
   * @param {Object} [customRect] - 自定义参考范围 {top, left, width, height}
   */
  _positionTooltip: function(target, preferredPlacement, customRect) {
    var rect = customRect || target.getBoundingClientRect();
    var isMobile = this._isMobile();

    // 移动端：固定底部
    if (isMobile) {
      this._tooltip.style.position = 'fixed';
      this._tooltip.style.bottom = '0';
      this._tooltip.style.left = '0';
      this._tooltip.style.right = '0';
      this._tooltip.style.top = 'auto';
      this._tooltip.style.transform = 'none';
      this._tooltip.classList.add('onboarding-tooltip-mobile');
      this._tooltip.classList.remove('arrow-bottom', 'arrow-top', 'arrow-left', 'arrow-right');
      return;
    }

    // 桌面端：确保 tooltip 可见以获取准确尺寸
    this._tooltip.classList.remove('onboarding-tooltip-mobile');
    this._tooltip.style.visibility = 'hidden';
    this._tooltip.style.display = 'block';
    this._tooltip.style.left = '0';
    this._tooltip.style.top = '0';
    this._tooltip.style.right = 'auto';
    this._tooltip.style.bottom = 'auto';

    var tooltipW = this._tooltip.offsetWidth;
    var tooltipH = this._tooltip.offsetHeight;
    var gap = this._TOOLTIP_GAP;
    var vpW = window.innerWidth;
    var vpH = window.innerHeight;
    var margin = 16; // 视口边缘留白

    // 计算四个方向的放置位置
    var pos = {
      bottom: { top: rect.bottom + gap, left: rect.left + rect.width / 2 - tooltipW / 2, arrow: 'arrow-top' },
      top:    { top: rect.top - gap - tooltipH, left: rect.left + rect.width / 2 - tooltipW / 2, arrow: 'arrow-bottom' },
      right:  { top: rect.top + rect.height / 2 - tooltipH / 2, left: rect.right + gap, arrow: 'arrow-left' },
      left:   { top: rect.top + rect.height / 2 - tooltipH / 2, left: rect.left - gap - tooltipW, arrow: 'arrow-right' }
    };

    // 检查每个方向是否能完整显示
    function fits(p) {
      return p.top >= margin &&
             p.top + tooltipH <= vpH - margin &&
             p.left >= margin &&
             p.left + tooltipW <= vpW - margin;
    }

    var chosen = null;
    var flipMap = { bottom: 'top', top: 'bottom', right: 'left', left: 'right' };
    var alt1 = 'right', alt2 = 'left'; // 备选方向

    // 1. 首选方向
    if (fits(pos[preferredPlacement])) {
      chosen = pos[preferredPlacement];
    }
    // 2. 翻转方向
    else if (fits(pos[flipMap[preferredPlacement]])) {
      chosen = pos[flipMap[preferredPlacement]];
    }
    // 3. 左右方向（如果上下都不行）
    else if (preferredPlacement === 'bottom' || preferredPlacement === 'top') {
      if (fits(pos.right)) chosen = pos.right;
      else if (fits(pos.left)) chosen = pos.left;
    }
    // 4. 上下方向（如果左右都不行）
    else {
      if (fits(pos.bottom)) chosen = pos.bottom;
      else if (fits(pos.top)) chosen = pos.top;
    }

    // 5. 兜底：如果所有方向都放不下，强制放在视口内（首选方向优先，尽量靠近目标）
    if (!chosen) {
      var p = pos[preferredPlacement];
      // 垂直居中于目标，水平紧贴目标边缘
      if (preferredPlacement === 'bottom' || preferredPlacement === 'top') {
        p.top = Math.max(margin, Math.min(p.top, vpH - tooltipH - margin));
        p.left = Math.max(margin, Math.min(p.left, vpW - tooltipW - margin));
      } else {
        p.left = Math.max(margin, Math.min(p.left, vpW - tooltipW - margin));
        p.top = Math.max(margin, Math.min(p.top, vpH - tooltipH - margin));
      }
      chosen = p;
    }

    this._tooltip.style.top = chosen.top + 'px';
    this._tooltip.style.left = chosen.left + 'px';
    this._tooltip.style.visibility = '';

    // 更新箭头方向
    this._tooltip.classList.remove('arrow-bottom', 'arrow-top', 'arrow-left', 'arrow-right');
    this._tooltip.classList.add(chosen.arrow);
  },

  /**
   * 全屏模式下 tooltip 居中定位（不聚焦任何元素）
   */
  _positionTooltipFullscreen: function() {
    this._tooltip.classList.remove('onboarding-tooltip-mobile');
    this._tooltip.style.visibility = 'hidden';
    this._tooltip.style.display = 'block';
    this._tooltip.style.left = '0';
    this._tooltip.style.top = '0';
    this._tooltip.style.right = 'auto';
    this._tooltip.style.bottom = 'auto';

    var tooltipW = this._tooltip.offsetWidth;
    var tooltipH = this._tooltip.offsetHeight;
    var vpW = window.innerWidth;
    var vpH = window.innerHeight;

    var left = Math.max(16, (vpW - tooltipW) / 2);
    var top = Math.max(16, (vpH - tooltipH) / 2);

    this._tooltip.style.left = left + 'px';
    this._tooltip.style.top = top + 'px';
    this._tooltip.style.visibility = '';
    this._tooltip.classList.remove('arrow-bottom', 'arrow-top', 'arrow-left', 'arrow-right');
  },

  /**
   * 更新 Tooltip 文案和步骤指示器
   */
  _updateTooltipContent: function(step) {
    var titleEl = this._tooltip.querySelector('.onboarding-tooltip-title');
    var descEl = this._tooltip.querySelector('.onboarding-tooltip-desc');
    var prevBtn = this._tooltip.querySelector('.onboarding-btn-prev');
    var nextBtn = this._tooltip.querySelector('.onboarding-btn-next');

    titleEl.textContent = step.title;
    descEl.textContent = step.description;

    // 步骤指示器
    var dots = this._tooltip.querySelectorAll('.onboarding-step-dot');
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.remove('active', 'done');
      if (i < this._currentStep) {
        dots[i].classList.add('done');
      } else if (i === this._currentStep) {
        dots[i].classList.add('active');
      }
    }

    // 上一步按钮：第一步隐藏
    prevBtn.style.display = this._currentStep > 0 ? '' : 'none';

    // 下一步按钮文案：最后一步改为"开始记录"
    if (this._currentStep === this._steps.length - 1) {
      nextBtn.textContent = '开始记录 ✨';
    } else {
      nextBtn.textContent = '继续 →';
    }
  },

  /**
   * 滚动到目标元素可见，并确保周围有足够空间放置 tooltip
   * @param {HTMLElement} target
   * @param {string} behavior - 'center' | 'start' | 'none'
   * @param {string} placement - 'bottom' | 'top' | 'left' | 'right'
   * @param {Object} [focusRect] - 自定义焦点区域 {top, left, width, height}
   */
  _scrollToTarget: function(target, behavior, placement, focusRect) {
    if (behavior === 'none') return;

    // 引导期间 body 有 overflow:hidden，滚动前临时解除
    var originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';

    var vpH = window.innerHeight;
    var minSpace = 240; // tooltip 需要的最小周围空间（px）

    // 计算需要滚动到的参考 rect
    var rect = focusRect ? {
      top: focusRect.top,
      bottom: focusRect.top + focusRect.height,
      left: focusRect.left,
      right: focusRect.left + focusRect.width,
      width: focusRect.width,
      height: focusRect.height
    } : target.getBoundingClientRect();

    // 步骤1：确保焦点区域在视口内
    var isInViewport = rect.top >= 0 && rect.bottom <= vpH;
    if (!isInViewport) {
      if (focusRect) {
        // 有自定义焦点区域：用 target 的 scrollIntoView 做粗定位，再微调
        if (rect.top < 0) {
          // 焦点在视口上方：滚动 target 顶部到视口顶部
          target.scrollIntoView({ block: 'start', behavior: 'instant' });
        } else {
          // 焦点在视口下方：滚动 target 底部到视口底部
          target.scrollIntoView({ block: 'end', behavior: 'instant' });
        }
      } else {
        // 关键优化：当卡片高度超过视口的70%时，优先滚动到顶部确保标题可见
        var useCenter = behavior === 'center' && rect.height < vpH * 0.7;
        var block = useCenter ? 'center' : 'start';
        target.scrollIntoView({ block: block, behavior: 'instant' });
      }
      document.body.style.overflow = originalOverflow || 'hidden';
      return;
    }

    // 步骤2：检查 tooltip 周围空间是否足够
    var spaceAbove = rect.top;
    var spaceBelow = vpH - rect.bottom;

    // 上下都有足够空间，无需滚动
    if (spaceAbove >= minSpace && spaceBelow >= minSpace) {
      document.body.style.overflow = originalOverflow || 'hidden';
      return;
    }

    // 空间不足，滚动到合适位置
    if (focusRect) {
      if (spaceAbove < minSpace) {
        target.scrollIntoView({ block: 'start', behavior: 'instant' });
      } else {
        target.scrollIntoView({ block: 'end', behavior: 'instant' });
      }
    } else if (behavior === 'center') {
      // 关键优化：当卡片高度超过视口的70%时，优先滚动到顶部确保标题可见
      var useCenter2 = rect.height < vpH * 0.7;
      target.scrollIntoView({ block: useCenter2 ? 'center' : 'start', behavior: 'instant' });
    } else {
      target.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
    document.body.style.overflow = originalOverflow || 'hidden';
  },

  // ============================================================
  // 工具方法
  // ============================================================

  /**
   * 判断是否移动端
   */
  _isMobile: function() {
    return window.innerWidth <= 768;
  },

  /**
   * 获取步骤目标元素（抽取重复逻辑）
   * @param {Object} step - 步骤配置
   * @returns {HTMLElement|null}
   */
  _getStepTarget: function(step) {
    if (step.fullscreen) return null;
    return step.dynamicTarget
      ? document.querySelector(step.dynamicTarget)
      : document.querySelector(step.target);
  },

  /**
   * 计算容器内多个子元素的 bounding rect 并集
   * @param {HTMLElement} container
   * @param {string[]} selectors - CSS 选择器数组
   * @returns {Object|null} {top, left, width, height}
   */
  _computeHeaderUnionRect: function(container, selectors) {
    var rects = [];
    for (var i = 0; i < selectors.length; i++) {
      var el = container.querySelector(selectors[i]);
      if (el) rects.push(el.getBoundingClientRect());
    }
    if (rects.length === 0) return null;
    var t = Math.min.apply(null, rects.map(function(r) { return r.top; }));
    var l = Math.min.apply(null, rects.map(function(r) { return r.left; }));
    var b = Math.max.apply(null, rects.map(function(r) { return r.bottom; }));
    var r = Math.max.apply(null, rects.map(function(r) { return r.right; }));
    return { top: t, left: l, width: r - l, height: b - t };
  },

  /**
   * 获取目标元素的圆角值（从 computed style 读取）
   */
  _getElementRadius: function(el) {
    try {
      var style = window.getComputedStyle(el);
      var radius = style.borderRadius;
      // 解析 "12px" 格式
      if (radius && radius.indexOf('px') !== -1) {
        return parseInt(radius, 10);
      }
    } catch (e) {
      // 降级为默认圆角
    }
    return 12;
  }
};

// DOM Ready 时确保 Onboarding 可用
console.log('[Onboarding] 模块已加载');
