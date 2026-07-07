/**
 * 惠生活平台 - 共享UI组件库
 * 包含所有前端交互组件功能
 * 无外部依赖，纯ES6+实现
 * @module HuishengComponents
 */

'use strict';

/* ============================================================
 *  1. Skeleton Screen - 骨架屏
 * ============================================================ */
const Skeleton = {
  /**
   * 显示骨架屏
   * @param {HTMLElement|string} container - 容器元素或选择器
   * @param {'card'|'list'|'table'|'detail'} type - 骨架类型
   * @param {number} [count=3] - 骨架项数量
   * @param {number} [timeout=0] - 自动隐藏超时(ms)，0为不自动隐藏
   */
  show(container, type = 'card', count = 3, timeout = 0) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    // 保存原始内容
    el._skeletonOriginalContent = el.innerHTML;
    el._skeletonOriginalDisplay = el.style.display;

    const templates = {
      card: () => `
        <div class="skeleton-item skeleton-card">
          <div class="skeleton-rect skeleton-shimmer"></div>
          <div class="skeleton-line skeleton-shimmer" style="width:70%"></div>
          <div class="skeleton-line skeleton-shimmer" style="width:50%"></div>
        </div>`,
      list: () => `
        <div class="skeleton-item skeleton-list">
          <div class="skeleton-circle skeleton-shimmer"></div>
          <div class="skeleton-line-group">
            <div class="skeleton-line skeleton-shimmer" style="width:80%"></div>
            <div class="skeleton-line skeleton-shimmer" style="width:60%"></div>
          </div>
        </div>`,
      table: () => `
        <div class="skeleton-item skeleton-table">
          <div class="skeleton-line skeleton-shimmer" style="width:100%"></div>
          <div class="skeleton-line skeleton-shimmer" style="width:90%"></div>
          <div class="skeleton-line skeleton-shimmer" style="width:95%"></div>
        </div>`,
      detail: () => `
        <div class="skeleton-item skeleton-detail">
          <div class="skeleton-line skeleton-shimmer" style="width:60%;height:24px"></div>
          <div class="skeleton-line skeleton-shimmer" style="width:100%"></div>
          <div class="skeleton-line skeleton-shimmer" style="width:100%"></div>
          <div class="skeleton-line skeleton-shimmer" style="width:80%"></div>
          <div class="skeleton-rect skeleton-shimmer" style="height:120px"></div>
        </div>`
    };

    const renderFn = templates[type] || templates.card;
    let html = '<div class="skeleton-wrapper">';
    for (let i = 0; i < count; i++) {
      html += renderFn();
    }
    html += '</div>';

    el.innerHTML = html;
    el.classList.add('skeleton-active');

    if (timeout > 0) {
      this._timeout = setTimeout(() => this.hide(el), timeout);
    }
  },

  /**
   * 隐藏骨架屏，恢复真实内容
   * @param {HTMLElement|string} container - 容器元素或选择器
   */
  hide(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }

    const wrapper = el.querySelector('.skeleton-wrapper');
    if (wrapper) wrapper.remove();

    el.classList.remove('skeleton-active');

    // 如果保存了原始内容则恢复
    if (el._skeletonOriginalContent !== undefined) {
      el.innerHTML = el._skeletonOriginalContent;
      delete el._skeletonOriginalContent;
    }
  }
};

/* ============================================================
 *  2. Empty State - 空状态
 * ============================================================ */
const EmptyState = {
  /** 默认配置 */
  _defaults: {
    order: {
      icon: '📦',
      title: '暂无订单',
      description: '您还没有任何订单，去逛逛吧',
      actionText: '去下单'
    },
    search: {
      icon: '🔍',
      title: '未找到结果',
      description: '换个关键词试试吧',
      actionText: '重新搜索'
    },
    favorite: {
      icon: '❤️',
      title: '暂无收藏',
      description: '快去收藏心仪的商品吧',
      actionText: '去逛逛'
    },
    commission: {
      icon: '💰',
      title: '暂无佣金记录',
      description: '推广商品赚取佣金',
      actionText: '去推广'
    },
    custom: {
      icon: '📭',
      title: '暂无数据',
      description: '',
      actionText: ''
    }
  },

  /**
   * 显示空状态
   * @param {HTMLElement|string} container - 容器
   * @param {'order'|'search'|'favorite'|'commission'|'custom'} type - 类型
   * @param {Object} [options] - 自定义选项 { title, description, actionText, onAction }
   */
  show(container, type = 'custom', options = {}) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    const defaults = this._defaults[type] || this._defaults.custom;
    const config = { ...defaults, ...options };

    const html = `
      <div class="empty-state" data-type="${type}">
        <div class="empty-state-icon">${config.icon}</div>
        <div class="empty-state-title">${config.title}</div>
        ${config.description ? `<div class="empty-state-desc">${config.description}</div>` : ''}
        ${config.actionText ? `<button class="empty-state-action">${config.actionText}</button>` : ''}
      </div>`;

    el.innerHTML = html;

    // 绑定操作按钮事件
    if (config.actionText && config.onAction) {
      const btn = el.querySelector('.empty-state-action');
      if (btn) btn.addEventListener('click', config.onAction);
    }
  },

  /**
   * 隐藏空状态
   * @param {HTMLElement|string} container - 容器
   */
  hide(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;
    const emptyEl = el.querySelector('.empty-state');
    if (emptyEl) emptyEl.remove();
  }
};

/* ============================================================
 *  3. Progress Components - 进度组件
 * ============================================================ */

/**
 * 进度条
 */
const ProgressBar = {
  /**
   * 初始化进度条
   * @param {HTMLElement|string} element - 元素
   * @param {Object} options - { value, max, color, animated }
   */
  init(element, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const { value = 0, max = 100, color = '', animated = true } = options;
    el.classList.add('progress-bar-wrapper');
    if (animated) el.classList.add('progress-bar-animated');

    el.innerHTML = `
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width:${Math.min(value / max * 100, 100)}%;${color ? 'background-color:' + color : ''}"></div>
      </div>
      <div class="progress-bar-label">${Math.round(value / max * 100)}%</div>`;

    el._progressMax = max;
  },

  /**
   * 设置进度值
   * @param {HTMLElement|string} element - 元素
   * @param {number} value - 当前值
   */
  setValue(element, value) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const max = el._progressMax || 100;
    const pct = Math.min(value / max * 100, 100);
    const fill = el.querySelector('.progress-bar-fill');
    const label = el.querySelector('.progress-bar-label');
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = Math.round(pct) + '%';
  }
};

/**
 * 环形进度
 */
const ProgressRing = {
  /**
   * 初始化环形进度
   * @param {HTMLElement|string} element - 元素
   * @param {Object} options - { value, max, size, strokeWidth, color }
   */
  init(element, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const { value = 0, max = 100, size = 120, strokeWidth = 8, color = '#ff6034' } = options;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(value / max, 1);
    const offset = circumference * (1 - pct);

    el.classList.add('progress-ring-wrapper');
    el.innerHTML = `
      <svg class="progress-ring-svg" width="${size}" height="${size}">
        <circle class="progress-ring-bg" cx="${size / 2}" cy="${size / 2}" r="${radius}"
          stroke="#e5e5e5" stroke-width="${strokeWidth}" fill="none"/>
        <circle class="progress-ring-fill" cx="${size / 2}" cy="${size / 2}" r="${radius}"
          stroke="${color}" stroke-width="${strokeWidth}" fill="none"
          stroke-linecap="round"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}"
          transform="rotate(-90 ${size / 2} ${size / 2})"/>
      </svg>
      <div class="progress-ring-text">${Math.round(pct * 100)}%</div>`;

    el._ringMax = max;
    el._ringCircumference = circumference;
    el._ringRadius = radius;
    el._ringSize = size;
  },

  /**
   * 设置环形进度值
   * @param {HTMLElement|string} element - 元素
   * @param {number} value - 当前值
   */
  setValue(element, value) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const max = el._ringMax || 100;
    const circumference = el._ringCircumference || 1;
    const size = el._ringSize || 120;
    const pct = Math.min(value / max, 1);
    const offset = circumference * (1 - pct);

    const fill = el.querySelector('.progress-ring-fill');
    const text = el.querySelector('.progress-ring-text');
    if (fill) fill.setAttribute('stroke-dashoffset', offset);
    if (text) text.textContent = Math.round(pct * 100) + '%';
  }
};

/**
 * 顶部加载条
 */
const ProgressTop = {
  _el: null,
  _value: 0,
  _timer: null,

  /** 显示顶部加载条并开始自动递增 */
  start() {
    this._value = 0;
    this._ensureEl();
    this._updateWidth();
    this._el.style.display = 'block';

    // 模拟自动递增
    this._timer = setInterval(() => {
      if (this._value < 90) {
        this._value += Math.random() * 10;
        this._updateWidth();
      }
    }, 300);
  },

  /**
   * 设置进度百分比
   * @param {number} value - 0~100
   */
  set(value) {
    this._value = Math.min(value, 100);
    this._updateWidth();
  },

  /** 完成加载并隐藏 */
  done() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._value = 100;
    this._updateWidth();
    setTimeout(() => {
      if (this._el) this._el.style.display = 'none';
    }, 300);
  },

  _ensureEl() {
    if (!this._el) {
      const bar = document.createElement('div');
      bar.className = 'progress-top-bar';
      bar.innerHTML = '<div class="progress-top-fill"></div>';
      bar.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:3px;z-index:99999;pointer-events:none;';
      const fill = bar.querySelector('.progress-top-fill');
      fill.style.cssText = 'height:100%;background:linear-gradient(90deg,#ff6034,#ff9034);transition:width 0.3s ease;width:0%;';
      document.body.appendChild(bar);
      this._el = bar;
    }
  },

  _updateWidth() {
    if (!this._el) return;
    const fill = this._el.querySelector('.progress-top-fill');
    if (fill) fill.style.width = this._value + '%';
  }
};

/**
 * 倒计时
 */
const Countdown = {
  _instances: new WeakMap(),

  /**
   * 初始化倒计时
   * @param {HTMLElement|string} element - 元素
   * @param {Object} options - { targetDate, onTick, onComplete, showDays }
   */
  init(element, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const { targetDate, onTick = null, onComplete = null, showDays = true } = options;
    el.classList.add('countdown-wrapper');

    const state = {
      targetDate: new Date(targetDate),
      onTick,
      onComplete,
      showDays,
      timer: null,
      running: false
    };

    this._instances.set(el, state);
    this._render(el, state);
  },

  /** 开始倒计时 */
  start() {
    document.querySelectorAll('.countdown-wrapper').forEach(el => {
      const state = this._instances.get(el);
      if (!state || state.running) return;
      state.running = true;
      state.timer = setInterval(() => {
        this._tick(el, state);
      }, 1000);
    });
  },

  /** 停止倒计时 */
  stop() {
    document.querySelectorAll('.countdown-wrapper').forEach(el => {
      const state = this._instances.get(el);
      if (state && state.timer) {
        clearInterval(state.timer);
        state.running = false;
      }
    });
  },

  /**
   * 销毁倒计时
   * @param {HTMLElement} [element] - 指定元素，不传则销毁所有
   */
  destroy(element) {
    const destroyOne = (el) => {
      const state = this._instances.get(el);
      if (state && state.timer) clearInterval(state.timer);
      this._instances.delete(el);
      el.innerHTML = '';
    };

    if (element) {
      const el = typeof element === 'string' ? document.querySelector(element) : element;
      if (el) destroyOne(el);
    } else {
      document.querySelectorAll('.countdown-wrapper').forEach(destroyOne);
    }
  },

  _tick(el, state) {
    const now = Date.now();
    const diff = state.targetDate.getTime() - now;

    if (diff <= 0) {
      clearInterval(state.timer);
      state.running = false;
      this._render(el, state, 0);
      if (state.onComplete) state.onComplete();
      return;
    }

    this._render(el, state, diff);
    if (state.onTick) state.onTick(diff);
  },

  _render(el, state, diff) {
    if (diff === undefined) diff = state.targetDate.getTime() - Date.now();
    if (diff < 0) diff = 0;

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    const pad = n => String(n).padStart(2, '0');
    let html = '<div class="countdown-inner">';
    if (state.showDays) {
      html += `<span class="countdown-block"><em>${pad(d)}</em><small>天</small></span><span class="countdown-sep">:</span>`;
    }
    html += `<span class="countdown-block"><em>${pad(h)}</em><small>时</small></span><span class="countdown-sep">:</span>`;
    html += `<span class="countdown-block"><em>${pad(m)}</em><small>分</small></span><span class="countdown-sep">:</span>`;
    html += `<span class="countdown-block"><em>${pad(s)}</em><small>秒</small></span>`;
    html += '</div>';

    el.innerHTML = html;
  }
};

/* ============================================================
 *  4. Notification Center - 通知中心
 * ============================================================ */
const NotificationCenter = {
  _notifications: [],
  _badgeEl: null,
  _panelEl: null,
  _storageKey: 'hs_notifications',

  /**
   * 初始化通知中心
   * @param {Object} options - { badgeSelector, panelSelector }
   */
  init(options = {}) {
    const { badgeSelector = '.notification-badge', panelSelector = '.notification-panel' } = options;

    this._badgeEl = document.querySelector(badgeSelector);
    this._panelEl = document.querySelector(panelSelector);

    // 从localStorage加载
    try {
      const saved = localStorage.getItem(this._storageKey);
      if (saved) this._notifications = JSON.parse(saved);
    } catch (e) {
      this._notifications = [];
    }

    this._updateBadge();
  },

  /**
   * 添加通知
   * @param {Object} notification - { id, type, title, content, time, read, category, icon }
   */
  addNotification(notification) {
    const n = {
      id: notification.id || Date.now().toString(),
      type: notification.type || 'system',
      title: notification.title || '',
      content: notification.content || '',
      time: notification.time || new Date().toISOString(),
      read: false,
      category: notification.category || 'system',
      icon: notification.icon || this._getCategoryIcon(notification.category),
      ...notification
    };
    this._notifications.unshift(n);
    this._save();
    this._updateBadge();
  },

  /**
   * 标记已读
   * @param {string} id - 通知ID
   */
  markAsRead(id) {
    const n = this._notifications.find(item => item.id === id);
    if (n) {
      n.read = true;
      this._save();
      this._updateBadge();
    }
  },

  /** 标记全部已读 */
  markAllAsRead() {
    this._notifications.forEach(n => n.read = true);
    this._save();
    this._updateBadge();
  },

  /** 获取未读数量 */
  getUnreadCount() {
    return this._notifications.filter(n => !n.read).length;
  },

  /** 渲染通知面板 */
  renderPanel() {
    if (!this._panelEl) return;

    const unread = this.getUnreadCount();
    let html = `<div class="notification-header">
      <span>通知</span>
      ${unread > 0 ? `<span class="notification-count">${unread}条未读</span>` : ''}
      <button class="notification-mark-all">全部已读</button>
    </div>`;

    html += '<div class="notification-list">';
    const list = this._notifications.slice(0, 20);
    if (list.length === 0) {
      html += '<div class="notification-empty">暂无通知</div>';
    } else {
      list.forEach(n => {
        html += `
          <div class="notification-item${n.read ? '' : ' unread'}" data-id="${n.id}">
            <div class="notification-icon">${n.icon}</div>
            <div class="notification-body">
              <div class="notification-title">${n.title}</div>
              <div class="notification-content">${n.content}</div>
              <div class="notification-time">${this._formatTime(n.time)}</div>
            </div>
          </div>`;
      });
    }
    html += '</div>';

    this._panelEl.innerHTML = html;

    // 绑定事件
    const markAllBtn = this._panelEl.querySelector('.notification-mark-all');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        this.markAllAsRead();
        this.renderPanel();
      });
    }

    this._panelEl.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', () => {
        this.markAsRead(item.dataset.id);
        item.classList.remove('unread');
        this._updateBadge();
      });
    });
  },

  /**
   * 渲染通知列表页
   * @param {HTMLElement|string} container - 容器
   */
  renderListPage(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    let html = '<div class="notification-list-page">';
    this._notifications.forEach(n => {
      html += `
        <div class="notification-item${n.read ? '' : ' unread'}" data-id="${n.id}">
          <div class="notification-icon">${n.icon}</div>
          <div class="notification-body">
            <div class="notification-title">${n.title}</div>
            <div class="notification-content">${n.content}</div>
            <div class="notification-time">${this._formatTime(n.time)}</div>
          </div>
        </div>`;
    });
    html += '</div>';

    el.innerHTML = html;
  },

  _getCategoryIcon(category) {
    const icons = { transaction: '💳', system: '🔔', interaction: '👥' };
    return icons[category] || '🔔';
  },

  /** 格式化时间为友好字符串 */
  _formatTime(timeStr) {
    const date = new Date(timeStr);
    const now = Date.now();
    const diff = now - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 300000) return '5分钟前';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 172800000) return '昨天';
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  _updateBadge() {
    if (!this._badgeEl) return;
    const count = this.getUnreadCount();
    this._badgeEl.textContent = count > 99 ? '99+' : count;
    this._badgeEl.style.display = count > 0 ? '' : 'none';
  },

  _save() {
    try {
      localStorage.setItem(this._storageKey, JSON.stringify(this._notifications));
    } catch (e) { /* 忽略存储错误 */ }
  }
};

/* ============================================================
 *  5. Star Rating - 星级评分
 * ============================================================ */
const StarRating = {
  _instances: new WeakMap(),

  /**
   * 初始化星级评分
   * @param {HTMLElement|string} element - 元素
   * @param {Object} options - { value, max, size, interactive, onChange, halfStar }
   */
  init(element, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const {
      value = 0,
      max = 5,
      size = 24,
      interactive = false,
      onChange = null,
      halfStar = false
    } = options;

    el.classList.add('star-rating');
    if (interactive) el.classList.add('star-rating-interactive');

    const state = { value, max, size, interactive, onChange, halfStar };
    this._instances.set(el, state);
    this._render(el, state);

    if (interactive) {
      this._bindEvents(el, state);
    }
  },

  /**
   * 设置评分值
   * @param {HTMLElement|string} element - 元素
   * @param {number} value - 评分值
   */
  setValue(element, value) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    const state = this._instances.get(el);
    if (!state) return;
    state.value = value;
    this._render(el, state);
  },

  /**
   * 获取评分值
   * @param {HTMLElement|string} element - 元素
   * @returns {number}
   */
  getValue(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return 0;
    const state = this._instances.get(el);
    return state ? state.value : 0;
  },

  _render(el, state) {
    let html = '';
    for (let i = 1; i <= state.max; i++) {
      const filled = i <= Math.floor(state.value);
      const half = state.halfStar && !filled && (i - 0.5 <= state.value);
      const cls = filled ? 'star-filled' : (half ? 'star-half' : 'star-empty');
      html += `<span class="star-item ${cls}" data-index="${i}" style="font-size:${state.size}px">★</span>`;
    }
    el.innerHTML = html;
  },

  _bindEvents(el, state) {
    // 鼠标悬停预览
    el.addEventListener('mousemove', (e) => {
      const star = e.target.closest('.star-item');
      if (!star) return;
      const index = parseInt(star.dataset.index);
      const rect = star.getBoundingClientRect();
      const isHalf = state.halfStar && (e.clientX - rect.left) < rect.width / 2;
      const previewValue = isHalf ? index - 0.5 : index;

      el.querySelectorAll('.star-item').forEach(s => {
        const si = parseInt(s.dataset.index);
        s.classList.toggle('star-filled', si <= Math.floor(previewValue));
        s.classList.toggle('star-half', state.halfStar && si === Math.ceil(previewValue) && previewValue % 1 !== 0);
        s.classList.toggle('star-empty', si > previewValue);
      });
    });

    el.addEventListener('mouseleave', () => {
      this._render(el, state);
    });

    // 点击设置
    el.addEventListener('click', (e) => {
      const star = e.target.closest('.star-item');
      if (!star) return;
      const index = parseInt(star.dataset.index);
      const rect = star.getBoundingClientRect();
      const isHalf = state.halfStar && (e.clientX - rect.left) < rect.width / 2;
      state.value = isHalf ? index - 0.5 : index;
      this._render(el, state);
      if (state.onChange) state.onChange(state.value);
    });

    // 触摸支持
    el.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      const star = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!star || !star.classList.contains('star-item')) return;
      const index = parseInt(star.dataset.index);
      state.value = index;
      this._render(el, state);
      if (state.onChange) state.onChange(state.value);
    });
  }
};

/* ============================================================
 *  6. Image/Video Upload - 图片/视频上传
 * ============================================================ */
const UploadComponent = {
  _instances: new WeakMap(),

  /**
   * 初始化上传组件
   * @param {HTMLElement|string} element - 元素
   * @param {Object} options - { maxCount, maxSize, accept, sortable, onChange }
   */
  init(element, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const {
      maxCount = 9,
      maxSize = 10 * 1024 * 1024,
      accept = 'image/*',
      sortable = false,
      onChange = null
    } = options;

    el.classList.add('upload-component');
    const state = { files: [], maxCount, maxSize, accept, sortable, onChange };
    this._instances.set(el, state);

    this._render(el, state);

    // 文件输入
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = maxCount > 1;
    input.style.display = 'none';
    input.className = 'upload-file-input';
    el.appendChild(input);

    input.addEventListener('change', () => {
      Array.from(input.files).forEach(file => {
        this.addFile(el, file);
      });
      input.value = '';
    });

    // 点击添加按钮
    el.addEventListener('click', (e) => {
      if (e.target.closest('.upload-add-btn')) {
        if (state.files.length < maxCount) input.click();
      }
      if (e.target.closest('.upload-delete')) {
        const idx = parseInt(e.target.closest('.upload-delete').dataset.index);
        this.removeFile(el, idx);
      }
    });

    // 排序拖拽
    if (sortable) {
      this._bindSortable(el, state);
    }
  },

  /**
   * 添加文件
   * @param {HTMLElement|string} element - 元素
   * @param {File} file - 文件对象
   */
  addFile(element, file) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    const state = this._instances.get(el);
    if (!state) return;

    if (state.files.length >= state.maxCount) return;
    if (file.size > state.maxSize) {
      alert('文件大小超出限制');
      return;
    }

    const fileObj = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      progress: 0,
      status: 'pending'
    };

    state.files.push(fileObj);
    this._render(el, state);
    if (state.onChange) state.onChange(state.files);
  },

  /**
   * 移除文件
   * @param {HTMLElement|string} element - 元素
   * @param {number} index - 文件索引
   */
  removeFile(element, index) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    const state = this._instances.get(el);
    if (!state) return;

    state.files.splice(index, 1);
    this._render(el, state);
    if (state.onChange) state.onChange(state.files);
  },

  /**
   * 获取文件列表
   * @param {HTMLElement|string} element - 元素
   * @returns {Array}
   */
  getFiles(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return [];
    const state = this._instances.get(el);
    return state ? state.files : [];
  },

  /**
   * 模拟上传进度
   * @param {HTMLElement|string} element - 元素
   * @param {number} index - 文件索引
   */
  simulateUpload(element, index) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    const state = this._instances.get(el);
    if (!state || !state.files[index]) return;

    const file = state.files[index];
    file.status = 'uploading';
    file.progress = 0;

    const interval = setInterval(() => {
      file.progress += Math.random() * 20 + 5;
      if (file.progress >= 100) {
        file.progress = 100;
        file.status = 'done';
        clearInterval(interval);
      }
      this._render(el, state);
    }, 200);
  },

  _render(el, state) {
    let html = '<div class="upload-list">';
    state.files.forEach((file, idx) => {
      const isImage = file.type.startsWith('image/');
      html += `<div class="upload-item" data-index="${idx}" draggable="${state.sortable}">
        <div class="upload-preview">
          ${isImage ? `<img src="${file.url}" alt="">` : `<div class="upload-file-icon">📎</div>`}
          ${file.status === 'uploading' ? `<div class="upload-progress"><div class="upload-progress-fill" style="width:${file.progress}%"></div></div>` : ''}
        </div>
        <button class="upload-delete" data-index="${idx}">×</button>
      </div>`;
    });

    if (state.files.length < state.maxCount) {
      html += `<div class="upload-add-btn"><span>+</span></div>`;
    }
    html += '</div>';
    el.querySelector('.upload-list')?.remove();

    // 保留input，只更新列表
    const listContainer = el.querySelector('.upload-list');
    if (listContainer) {
      listContainer.outerHTML = html;
    } else {
      el.insertAdjacentHTML('afterbegin', html);
    }
  },

  _bindSortable(el, state) {
    let dragIdx = null;
    el.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.upload-item');
      if (!item) return;
      dragIdx = parseInt(item.dataset.index);
      item.classList.add('dragging');
    });
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      const item = e.target.closest('.upload-item');
      if (!item) return;
      item.classList.add('drag-over');
    });
    el.addEventListener('dragleave', (e) => {
      const item = e.target.closest('.upload-item');
      if (item) item.classList.remove('drag-over');
    });
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      const item = e.target.closest('.upload-item');
      if (!item) return;
      const dropIdx = parseInt(item.dataset.index);
      if (dragIdx !== null && dragIdx !== dropIdx) {
        const [moved] = state.files.splice(dragIdx, 1);
        state.files.splice(dropIdx, 0, moved);
        this._render(el, state);
      }
      item.classList.remove('drag-over');
    });
    el.addEventListener('dragend', () => {
      dragIdx = null;
      el.querySelectorAll('.dragging, .drag-over').forEach(el => {
        el.classList.remove('dragging', 'drag-over');
      });
    });
  }
};

/* ============================================================
 *  7. Address Picker - 地址选择器
 * ============================================================ */
const AddressPicker = {
  _el: null,
  _onSelect: null,
  _selected: { province: '', city: '', district: '' },
  _scrollPositions: [0, 0, 0],

  /** 简化的省市区数据 */
  _data: {
    '浙江省': {
      '杭州市': ['西湖区', '上城区', '拱墅区', '滨江区', '余杭区'],
      '宁波市': ['海曙区', '江北区', '鄞州区', '镇海区'],
      '温州市': ['鹿城区', '龙湾区', '瓯海区']
    },
    '上海市': {
      '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '浦东新区', '虹口区']
    },
    '江苏省': {
      '南京市': ['玄武区', '秦淮区', '鼓楼区', '建邺区'],
      '苏州市': ['姑苏区', '虎丘区', '吴中区', '相城区'],
      '无锡市': ['锡山区', '惠山区', '滨湖区']
    },
    '北京市': {
      '北京市': ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '通州区']
    },
    '广东省': {
      '广州市': ['天河区', '越秀区', '荔湾区', '白云区', '番禺区'],
      '深圳市': ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区'],
      '东莞市': ['莞城区', '南城区', '东城区']
    }
  },

  /**
   * 显示地址选择器
   * @param {Object} options - { onSelect, defaultValues }
   */
  show(options = {}) {
    this._onSelect = options.onSelect || null;
    if (options.defaultValues) {
      this._selected = { ...options.defaultValues };
    } else {
      this._selected = { province: '', city: '', district: '' };
    }

    this._createEl();
    this._render();
    this._el.classList.add('address-picker-visible');
  },

  /** 隐藏地址选择器 */
  hide() {
    if (this._el) {
      this._el.classList.remove('address-picker-visible');
      setTimeout(() => {
        this._el.remove();
        this._el = null;
      }, 300);
    }
  },

  _createEl() {
    if (this._el) this._el.remove();

    const overlay = document.createElement('div');
    overlay.className = 'address-picker-overlay';
    overlay.innerHTML = `
      <div class="address-picker-mask"></div>
      <div class="address-picker-panel">
        <div class="address-picker-header">
          <button class="address-picker-cancel">取消</button>
          <span>选择地址</span>
          <button class="address-picker-confirm">确定</button>
        </div>
        <div class="address-picker-columns">
          <div class="address-picker-column" data-col="0"></div>
          <div class="address-picker-column" data-col="1"></div>
          <div class="address-picker-column" data-col="2"></div>
        </div>
        <div class="address-picker-indicator"></div>
      </div>`;

    document.body.appendChild(overlay);
    this._el = overlay;

    // 事件绑定
    overlay.querySelector('.address-picker-mask').addEventListener('click', () => this.hide());
    overlay.querySelector('.address-picker-cancel').addEventListener('click', () => this.hide());
    overlay.querySelector('.address-picker-confirm').addEventListener('click', () => {
      if (this._onSelect) {
        this._onSelect({ ...this._selected });
      }
      this.hide();
    });

    // 滚动事件
    overlay.querySelectorAll('.address-picker-column').forEach(col => {
      col.addEventListener('scroll', () => this._onScroll(col));
    });
  },

  _render() {
    if (!this._el) return;

    const provinces = Object.keys(this._data);
    const province = this._selected.province || provinces[0];
    const cities = Object.keys(this._data[province] || {});
    const city = this._selected.city || cities[0];
    const districts = (this._data[province] && this._data[province][city]) || [];
    const district = this._selected.district || districts[0];

    this._selected = { province, city, district };

    const columns = this._el.querySelectorAll('.address-picker-column');
    const ITEM_H = 40;

    // 省份列
    columns[0].innerHTML = '<div class="picker-padding"></div>' +
      provinces.map(p => `<div class="picker-item${p === province ? ' selected' : ''}" data-value="${p}">${p}</div>`).join('') +
      '<div class="picker-padding"></div>';
    const pIdx = provinces.indexOf(province);
    columns[0].scrollTop = pIdx * ITEM_H;

    // 城市列
    columns[1].innerHTML = '<div class="picker-padding"></div>' +
      cities.map(c => `<div class="picker-item${c === city ? ' selected' : ''}" data-value="${c}">${c}</div>`).join('') +
      '<div class="picker-padding"></div>';
    const cIdx = cities.indexOf(city);
    columns[1].scrollTop = cIdx * ITEM_H;

    // 区县列
    columns[2].innerHTML = '<div class="picker-padding"></div>' +
      districts.map(d => `<div class="picker-item${d === district ? ' selected' : ''}" data-value="${d}">${d}</div>`).join('') +
      '<div class="picker-padding"></div>';
    const dIdx = districts.indexOf(district);
    columns[2].scrollTop = dIdx * ITEM_H;
  },

  _onScroll(col) {
    const ITEM_H = 40;
    const colIdx = parseInt(col.dataset.col);
    clearTimeout(col._scrollTimer);
    col._scrollTimer = setTimeout(() => {
      const idx = Math.round(col.scrollTop / ITEM_H);
      col.scrollTop = idx * ITEM_H;

      const items = col.querySelectorAll('.picker-item');
      items.forEach(it => it.classList.remove('selected'));
      if (items[idx]) {
        items[idx].classList.add('selected');
        const value = items[idx].dataset.value;

        if (colIdx === 0) {
          this._selected.province = value;
          this._selected.city = '';
          this._selected.district = '';
          this._render();
        } else if (colIdx === 1) {
          this._selected.city = value;
          this._selected.district = '';
          this._render();
        } else {
          this._selected.district = value;
        }
      }
    }, 100);
  }
};

/* ============================================================
 *  8. Date/Time Picker - 日期时间选择器
 * ============================================================ */
const DatePicker = {
  _el: null,
  _onSelect: null,
  _mode: 'date',
  _currentMonth: null,
  _selectedDate: null,
  _min: null,
  _max: null,
  _defaultDate: null,

  /**
   * 显示日期选择器
   * @param {Object} options - { mode, onSelect, min, max, defaultDate }
   */
  show(options = {}) {
    this._mode = options.mode || 'date';
    this._onSelect = options.onSelect || null;
    this._min = options.min ? new Date(options.min) : null;
    this._max = options.max ? new Date(options.max) : null;
    this._defaultDate = options.defaultDate ? new Date(options.defaultDate) : new Date();
    this._selectedDate = null;
    this._currentMonth = new Date(this._defaultDate.getFullYear(), this._defaultDate.getMonth(), 1);

    this._createEl();
    this._render();
  },

  /** 隐藏日期选择器 */
  hide() {
    if (this._el) {
      this._el.classList.remove('datepicker-visible');
      setTimeout(() => {
        this._el.remove();
        this._el = null;
      }, 300);
    }
  },

  _createEl() {
    if (this._el) this._el.remove();

    const overlay = document.createElement('div');
    overlay.className = 'datepicker-overlay';
    overlay.innerHTML = `
      <div class="datepicker-mask"></div>
      <div class="datepicker-panel">
        <div class="datepicker-header">
          <button class="datepicker-cancel">取消</button>
          <span>选择日期</span>
          <button class="datepicker-confirm">确定</button>
        </div>
        <div class="datepicker-nav">
          <button class="datepicker-prev">‹</button>
          <span class="datepicker-month-label"></span>
          <button class="datepicker-next">›</button>
        </div>
        <div class="datepicker-weekdays">
          <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
        </div>
        <div class="datepicker-days"></div>
        ${this._mode === 'time' || this._mode === 'datetime' ? this._createTimeColumns() : ''}
      </div>`;

    document.body.appendChild(overlay);
    this._el = overlay;

    overlay.querySelector('.datepicker-mask').addEventListener('click', () => this.hide());
    overlay.querySelector('.datepicker-cancel').addEventListener('click', () => this.hide());
    overlay.querySelector('.datepicker-confirm').addEventListener('click', () => this._confirm());
    overlay.querySelector('.datepicker-prev').addEventListener('click', () => this._prevMonth());
    overlay.querySelector('.datepicker-next').addEventListener('click', () => this._nextMonth());
    overlay.querySelector('.datepicker-days').addEventListener('click', (e) => {
      const day = e.target.closest('.datepicker-day');
      if (day && !day.classList.contains('disabled')) {
        this._selectDay(parseInt(day.dataset.day));
      }
    });
  },

  _createTimeColumns() {
    return `
      <div class="datepicker-time">
        <div class="datepicker-time-col" data-type="hour"></div>
        <span class="datepicker-time-sep">:</span>
        <div class="datepicker-time-col" data-type="minute"></div>
      </div>`;
  },

  _render() {
    if (!this._el) return;

    const year = this._currentMonth.getFullYear();
    const month = this._currentMonth.getMonth();
    const label = this._el.querySelector('.datepicker-month-label');
    if (label) label.textContent = `${year}年${month + 1}月`;

    const daysContainer = this._el.querySelector('.datepicker-days');
    if (!daysContainer) return;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    let html = '';
    // 填充空白
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="datepicker-day empty"></div>';
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = this._selectedDate && date.toDateString() === this._selectedDate.toDateString();
      const isDisabled = (this._min && date < this._min) || (this._max && date > this._max);

      html += `<div class="datepicker-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}" data-day="${d}">${d}</div>`;
    }
    daysContainer.innerHTML = html;

    // 时间列
    if (this._mode === 'time' || this._mode === 'datetime') {
      this._renderTimeColumns();
    }
  },

  _renderTimeColumns() {
    const hourCol = this._el.querySelector('[data-type="hour"]');
    const minuteCol = this._el.querySelector('[data-type="minute"]');
    if (!hourCol || !minuteCol) return;

    let hourHtml = '';
    for (let h = 0; h < 24; h++) {
      hourHtml += `<div class="time-item" data-value="${h}">${String(h).padStart(2, '0')}</div>`;
    }
    hourCol.innerHTML = hourHtml;

    let minHtml = '';
    for (let m = 0; m < 60; m += 5) {
      minHtml += `<div class="time-item" data-value="${m}">${String(m).padStart(2, '0')}</div>`;
    }
    minuteCol.innerHTML = minHtml;
  },

  _selectDay(day) {
    const year = this._currentMonth.getFullYear();
    const month = this._currentMonth.getMonth();
    this._selectedDate = new Date(year, month, day);
    this._render();
  },

  _prevMonth() {
    const m = this._currentMonth.getMonth();
    const y = this._currentMonth.getFullYear();
    this._currentMonth = new Date(y, m - 1, 1);
    this._render();
  },

  _nextMonth() {
    const m = this._currentMonth.getMonth();
    const y = this._currentMonth.getFullYear();
    this._currentMonth = new Date(y, m + 1, 1);
    this._render();
  },

  _confirm() {
    if (this._onSelect) {
      let result = this._selectedDate || this._defaultDate;
      if (this._mode === 'time' || this._mode === 'datetime') {
        const hourCol = this._el.querySelector('[data-type="hour"]');
        const minuteCol = this._el.querySelector('[data-type="minute"]');
        const hour = hourCol ? parseInt(hourCol.querySelector('.time-item.selected')?.dataset.value || 0) : 0;
        const minute = minuteCol ? parseInt(minuteCol.querySelector('.time-item.selected')?.dataset.value || 0) : 0;
        result = new Date(result.getFullYear(), result.getMonth(), result.getDate(), hour, minute);
      }
      this._onSelect(result);
    }
    this.hide();
  }
};

/**
 * 日期范围选择器
 */
const DateRangePicker = {
  _el: null,
  _onSelect: null,
  _startDate: null,
  _endDate: null,
  _currentMonth: null,
  _min: null,
  _max: null,

  /**
   * 显示日期范围选择器
   * @param {Object} options - { onSelect, min, max }
   */
  show(options = {}) {
    this._onSelect = options.onSelect || null;
    this._min = options.min ? new Date(options.min) : null;
    this._max = options.max ? new Date(options.max) : null;
    this._startDate = null;
    this._endDate = null;
    this._currentMonth = new Date();

    this._createEl();
    this._render();
  },

  /** 隐藏日期范围选择器 */
  hide() {
    if (this._el) {
      this._el.classList.remove('datepicker-visible');
      setTimeout(() => {
        this._el.remove();
        this._el = null;
      }, 300);
    }
  },

  _createEl() {
    if (this._el) this._el.remove();

    const overlay = document.createElement('div');
    overlay.className = 'datepicker-overlay daterange-overlay';
    overlay.innerHTML = `
      <div class="datepicker-mask"></div>
      <div class="datepicker-panel daterange-panel">
        <div class="datepicker-header">
          <button class="datepicker-cancel">取消</button>
          <span>选择日期范围</span>
          <button class="datepicker-confirm">确定</button>
        </div>
        <div class="datepicker-nav">
          <button class="datepicker-prev">‹</button>
          <span class="datepicker-month-label"></span>
          <button class="datepicker-next">›</button>
        </div>
        <div class="datepicker-weekdays">
          <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
        </div>
        <div class="datepicker-days"></div>
        <div class="daterange-info">
          <span class="daterange-start">开始：未选择</span>
          <span class="daterange-end">结束：未选择</span>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    this._el = overlay;

    overlay.querySelector('.datepicker-mask').addEventListener('click', () => this.hide());
    overlay.querySelector('.datepicker-cancel').addEventListener('click', () => this.hide());
    overlay.querySelector('.datepicker-confirm').addEventListener('click', () => this._confirm());
    overlay.querySelector('.datepicker-prev').addEventListener('click', () => this._prevMonth());
    overlay.querySelector('.datepicker-next').addEventListener('click', () => this._nextMonth());
    overlay.querySelector('.datepicker-days').addEventListener('click', (e) => {
      const day = e.target.closest('.datepicker-day');
      if (day && !day.classList.contains('disabled') && !day.classList.contains('empty')) {
        this._selectDay(parseInt(day.dataset.day));
      }
    });
  },

  _render() {
    if (!this._el) return;

    const year = this._currentMonth.getFullYear();
    const month = this._currentMonth.getMonth();
    const label = this._el.querySelector('.datepicker-month-label');
    if (label) label.textContent = `${year}年${month + 1}月`;

    const daysContainer = this._el.querySelector('.datepicker-days');
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="datepicker-day empty"></div>';
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isStart = this._startDate && date.toDateString() === this._startDate.toDateString();
      const isEnd = this._endDate && date.toDateString() === this._endDate.toDateString();
      const inRange = this._startDate && this._endDate && date > this._startDate && date < this._endDate;
      const isDisabled = (this._min && date < this._min) || (this._max && date > this._max);

      html += `<div class="datepicker-day${isStart ? ' range-start' : ''}${isEnd ? ' range-end' : ''}${inRange ? ' in-range' : ''}${isDisabled ? ' disabled' : ''}" data-day="${d}">${d}</div>`;
    }
    daysContainer.innerHTML = html;

    // 更新范围信息
    const startInfo = this._el.querySelector('.daterange-start');
    const endInfo = this._el.querySelector('.daterange-end');
    if (startInfo) startInfo.textContent = '开始：' + (this._startDate ? this._formatDate(this._startDate) : '未选择');
    if (endInfo) endInfo.textContent = '结束：' + (this._endDate ? this._formatDate(this._endDate) : '未选择');
  },

  _selectDay(day) {
    const year = this._currentMonth.getFullYear();
    const month = this._currentMonth.getMonth();
    const date = new Date(year, month, day);

    if (!this._startDate || (this._startDate && this._endDate)) {
      this._startDate = date;
      this._endDate = null;
    } else {
      if (date < this._startDate) {
        this._endDate = this._startDate;
        this._startDate = date;
      } else {
        this._endDate = date;
      }
    }
    this._render();
  },

  _prevMonth() {
    const m = this._currentMonth.getMonth();
    const y = this._currentMonth.getFullYear();
    this._currentMonth = new Date(y, m - 1, 1);
    this._render();
  },

  _nextMonth() {
    const m = this._currentMonth.getMonth();
    const y = this._currentMonth.getFullYear();
    this._currentMonth = new Date(y, m + 1, 1);
    this._render();
  },

  _confirm() {
    if (this._onSelect && this._startDate && this._endDate) {
      this._onSelect({ start: this._startDate, end: this._endDate });
    }
    this.hide();
  },

  _formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
};

/* ============================================================
 *  9. Bottom Action Bar - 底部操作栏
 * ============================================================ */
const BottomBar = {
  _el: null,

  /**
   * 显示底部操作栏
   * @param {Object} options - { price, priceLabel, buttons, icons }
   */
  show(options = {}) {
    const {
      price = 0,
      priceLabel = '合计',
      buttons = [],
      icons = []
    } = options;

    this.hide();

    const bar = document.createElement('div');
    bar.className = 'bottom-action-bar';

    let html = '<div class="bottom-bar-inner">';
    // 图标区
    if (icons.length > 0) {
      html += '<div class="bottom-bar-icons">';
      icons.forEach((icon, idx) => {
        html += `<div class="bottom-bar-icon" data-idx="${idx}">
          <span class="bottom-bar-icon-img">${icon.icon || '📌'}</span>
          <span class="bottom-bar-icon-label">${icon.label || ''}</span>
        </div>`;
      });
      html += '</div>';
    }
    // 价格区
    html += `<div class="bottom-bar-price"><span class="price-label">${priceLabel}</span><span class="price-value">¥${price.toFixed(2)}</span></div>`;
    // 按钮区
    html += '<div class="bottom-bar-buttons">';
    buttons.forEach((btn, idx) => {
      html += `<button class="bottom-bar-btn ${btn.className || ''}" data-idx="${idx}">${btn.text}</button>`;
    });
    html += '</div></div>';

    bar.innerHTML = html;
    document.body.appendChild(bar);
    this._el = bar;

    // 绑定事件
    bar.querySelectorAll('.bottom-bar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        if (buttons[idx] && buttons[idx].onClick) buttons[idx].onClick();
      });
    });
    bar.querySelectorAll('.bottom-bar-icon').forEach(icon => {
      icon.addEventListener('click', () => {
        const idx = parseInt(icon.dataset.idx);
        if (icons[idx] && icons[idx].onClick) icons[idx].onClick();
      });
    });
  },

  /** 隐藏底部操作栏 */
  hide() {
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
  },

  /**
   * 更新价格
   * @param {number} price - 新价格
   */
  updatePrice(price) {
    if (!this._el) return;
    const priceEl = this._el.querySelector('.price-value');
    if (priceEl) priceEl.textContent = '¥' + price.toFixed(2);
  }
};

/* ============================================================
 *  10. Search Bar Enhanced - 增强搜索栏
 * ============================================================ */
const SearchEnhanced = {
  _instances: new WeakMap(),
  _storageKey: 'hs_search_history',
  _debounceTimers: new WeakMap(),

  /**
   * 初始化增强搜索栏
   * @param {HTMLElement|string} element - 元素
   * @param {Object} options - { onSearch, onSuggest, hotKeywords, placeholder }
   */
  init(element, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const {
      onSearch = null,
      onSuggest = null,
      hotKeywords = [],
      placeholder = '搜索商品/店铺'
    } = options;

    el.classList.add('search-enhanced');
    const state = { onSearch, onSuggest, hotKeywords, overlayVisible: false };
    this._instances.set(el, state);

    el.innerHTML = `
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" placeholder="${placeholder}" autocomplete="off">
        <button class="search-clear" style="display:none">×</button>
      </div>
      <div class="search-overlay" style="display:none">
        <div class="search-history-section">
          <div class="search-history-header"><span>搜索历史</span><button class="search-history-clear">清除</button></div>
          <div class="search-history-tags"></div>
        </div>
        ${hotKeywords.length > 0 ? `
        <div class="search-hot-section">
          <div class="search-hot-header">热门搜索</div>
          <div class="search-hot-tags">
            ${hotKeywords.map(k => `<span class="search-tag">${k}</span>`).join('')}
          </div>
        </div>` : ''}
        <div class="search-suggestions" style="display:none"></div>
      </div>`;

    const input = el.querySelector('.search-input');
    const clearBtn = el.querySelector('.search-clear');
    const overlay = el.querySelector('.search-overlay');

    // 输入事件（带防抖）
    input.addEventListener('input', () => {
      const val = input.value.trim();
      clearBtn.style.display = val ? '' : 'none';

      // 防抖建议
      clearTimeout(this._debounceTimers.get(el));
      if (val && onSuggest) {
        this._debounceTimers.set(el, setTimeout(() => {
          onSuggest(val);
        }, 300));
      } else {
        el.querySelector('.search-suggestions').style.display = 'none';
      }
    });

    // 聚焦显示遮罩
    input.addEventListener('focus', () => {
      this.showOverlay(el);
    });

    // 清除按钮
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      input.focus();
    });

    // 回车搜索
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value.trim();
        if (val) {
          this.addHistory(el, val);
          if (onSearch) onSearch(val);
          this.hideOverlay(el);
        }
      }
    });

    // 清除历史
    el.querySelector('.search-history-clear')?.addEventListener('click', () => {
      this.clearHistory(el);
    });

    // 标签点击
    el.addEventListener('click', (e) => {
      const tag = e.target.closest('.search-tag');
      if (tag) {
        input.value = tag.textContent;
        if (onSearch) onSearch(tag.textContent);
        this.hideOverlay(el);
      }
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!el.contains(e.target)) {
        this.hideOverlay(el);
      }
    });

    this._renderHistory(el);
  },

  /** 显示搜索遮罩 */
  showOverlay(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    const overlay = el.querySelector('.search-overlay');
    if (overlay) overlay.style.display = '';
    this._renderHistory(el);
  },

  /** 隐藏搜索遮罩 */
  hideOverlay(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    const overlay = el.querySelector('.search-overlay');
    if (overlay) overlay.style.display = 'none';
  },

  /**
   * 添加搜索历史
   * @param {HTMLElement|string} element - 元素
   * @param {string} keyword - 关键词
   */
  addHistory(element, keyword) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    let history = this._getHistory();
    history = history.filter(h => h !== keyword);
    history.unshift(keyword);
    history = history.slice(0, 10);
    try {
      localStorage.setItem(this._storageKey, JSON.stringify(history));
    } catch (e) { /* 忽略 */ }

    this._renderHistory(el);
  },

  /**
   * 清除搜索历史
   * @param {HTMLElement|string} element - 元素
   */
  clearHistory(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    try {
      localStorage.removeItem(this._storageKey);
    } catch (e) { /* 忽略 */ }
    if (el) this._renderHistory(el);
  },

  /**
   * 显示搜索建议
   * @param {HTMLElement|string} element - 元素
   * @param {string} keyword - 关键词
   */
  showSuggestions(element, keyword) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const suggestions = el.querySelector('.search-suggestions');
    if (!suggestions) return;

    // 简单的本地建议（实际项目中由onSuggest回调提供）
    const history = this._getHistory();
    const matched = history.filter(h => h.includes(keyword));
    if (matched.length > 0) {
      suggestions.innerHTML = matched.map(s => `<div class="suggestion-item">${s}</div>`).join('');
      suggestions.style.display = '';
    } else {
      suggestions.style.display = 'none';
    }
  },

  _getHistory() {
    try {
      return JSON.parse(localStorage.getItem(this._storageKey) || '[]');
    } catch (e) {
      return [];
    }
  },

  _renderHistory(el) {
    const tags = el.querySelector('.search-history-tags');
    if (!tags) return;

    const history = this._getHistory();
    if (history.length === 0) {
      tags.innerHTML = '<span class="search-history-empty">暂无搜索历史</span>';
    } else {
      tags.innerHTML = history.map(h => `<span class="search-tag">${h}</span>`).join('');
    }
  }
};

/* ============================================================
 *  11. Sidebar Collapse - 侧边栏折叠
 * ============================================================ */
const SidebarCollapse = {
  _instances: new WeakMap(),

  /**
   * 初始化侧边栏折叠
   * @param {HTMLElement|string} sidebarElement - 侧边栏元素
   * @param {Object} options - { toggleSelector, storageKey }
   */
  init(sidebarElement, options = {}) {
    const sidebar = typeof sidebarElement === 'string' ? document.querySelector(sidebarElement) : sidebarElement;
    if (!sidebar) return;

    const {
      toggleSelector = '.sidebar-toggle',
      storageKey = 'hs_sidebar_collapsed'
    } = options;

    const state = { storageKey, collapsed: false };
    this._instances.set(sidebar, state);

    // 从localStorage恢复状态
    try {
      state.collapsed = localStorage.getItem(storageKey) === 'true';
    } catch (e) { /* 忽略 */ }

    // 平板以下自动折叠
    if (window.innerWidth < 1024) {
      state.collapsed = true;
    }

    this._applyState(sidebar, state);

    // 绑定切换按钮
    const toggleBtn = document.querySelector(toggleSelector);
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle(sidebar));
    }

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      if (window.innerWidth < 1024 && !state.collapsed) {
        state.collapsed = true;
        this._applyState(sidebar, state);
      }
    });
  },

  /** 切换折叠状态 */
  toggle(sidebarElement) {
    const sidebar = typeof sidebarElement === 'string' ? document.querySelector(sidebarElement) : sidebarElement;
    if (!sidebar) return;
    const state = this._instances.get(sidebar);
    if (!state) return;

    state.collapsed = !state.collapsed;
    this._applyState(sidebar, state);
    this._saveState(state);
  },

  /** 折叠 */
  collapse(sidebarElement) {
    const sidebar = typeof sidebarElement === 'string' ? document.querySelector(sidebarElement) : sidebarElement;
    if (!sidebar) return;
    const state = this._instances.get(sidebar);
    if (!state) return;
    state.collapsed = true;
    this._applyState(sidebar, state);
    this._saveState(state);
  },

  /** 展开 */
  expand(sidebarElement) {
    const sidebar = typeof sidebarElement === 'string' ? document.querySelector(sidebarElement) : sidebarElement;
    if (!sidebar) return;
    const state = this._instances.get(sidebar);
    if (!state) return;
    state.collapsed = false;
    this._applyState(sidebar, state);
    this._saveState(state);
  },

  _applyState(sidebar, state) {
    sidebar.classList.toggle('sidebar-collapsed', state.collapsed);
    sidebar.style.transition = 'width 0.3s ease';
    sidebar.style.width = state.collapsed ? '64px' : '';
    document.body.classList.toggle('sidebar-is-collapsed', state.collapsed);
  },

  _saveState(state) {
    try {
      localStorage.setItem(state.storageKey, state.collapsed.toString());
    } catch (e) { /* 忽略 */ }
  }
};

/* ============================================================
 *  12. Distribution Tree - 分销树
 * ============================================================ */
const DistTree = {
  _instances: new WeakMap(),

  /**
   * 初始化分销树
   * @param {HTMLElement|string} element - 元素
   * @param {Object} options - { data, onNodeClick }
   */
  init(element, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const { data = {}, onNodeClick = null } = options;
    el.classList.add('dist-tree');

    const state = { data, onNodeClick, expandedLevels: new Set([0]) };
    this._instances.set(el, state);
  },

  /** 渲染分销树 */
  render(element) {
    const el = element ? (typeof element === 'string' ? document.querySelector(element) : element) : null;
    if (!el) return;
    const state = this._instances.get(el);
    if (!state) return;

    el.innerHTML = this._renderNode(state.data, 0);
    this._bindEvents(el, state);
  },

  /**
   * 展开到指定层级
   * @param {number} level - 层级
   */
  expand(level) {
    document.querySelectorAll('.dist-tree').forEach(el => {
      const state = this._instances.get(el);
      if (!state) return;
      for (let i = 0; i <= level; i++) state.expandedLevels.add(i);
      this.render(el);
    });
  },

  /**
   * 折叠到指定层级
   * @param {number} level - 层级
   */
  collapse(level) {
    document.querySelectorAll('.dist-tree').forEach(el => {
      const state = this._instances.get(el);
      if (!state) return;
      state.expandedLevels.forEach(l => {
        if (l > level) state.expandedLevels.delete(l);
      });
      this.render(el);
    });
  },

  _renderNode(node, level) {
    if (!node) return '';
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = this._instances.has(document.querySelector('.dist-tree')) &&
      this._instances.get(document.querySelector('.dist-tree')).expandedLevels.has(level);

    let html = `<div class="dist-tree-node" data-id="${node.id}" data-level="${level}">
      <div class="dist-tree-item" style="padding-left:${level * 24}px">
        ${hasChildren ? `<span class="dist-tree-toggle${isExpanded ? ' expanded' : ''}">▶</span>` : '<span class="dist-tree-spacer"></span>'}
        <span class="dist-tree-avatar">${node.avatar ? `<img src="${node.avatar}" alt="">` : '👤'}</span>
        <span class="dist-tree-name">${node.name}</span>
        <span class="dist-tree-level">L${node.level || level}</span>
        <span class="dist-tree-commission">¥${(node.commission || 0).toFixed(2)}</span>
      </div>`;

    if (hasChildren && isExpanded) {
      html += '<div class="dist-tree-children">';
      node.children.forEach(child => {
        html += this._renderNode(child, level + 1);
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  _bindEvents(el, state) {
    el.addEventListener('click', (e) => {
      const toggle = e.target.closest('.dist-tree-toggle');
      if (toggle) {
        const node = toggle.closest('.dist-tree-node');
        const level = parseInt(node.dataset.level);
        if (state.expandedLevels.has(level)) {
          state.expandedLevels.delete(level);
        } else {
          state.expandedLevels.add(level);
        }
        this.render(el);
        return;
      }

      const item = e.target.closest('.dist-tree-item');
      if (item && state.onNodeClick) {
        const nodeEl = item.closest('.dist-tree-node');
        state.onNodeClick(nodeEl.dataset.id);
      }
    });
  }
};

/* ============================================================
 *  13. Verification Code Card - 核销码卡片
 * ============================================================ */
const VerifyCodeCard = {
  _el: null,
  _isBright: false,
  _options: {},

  /**
   * 显示核销码卡片
   * @param {Object} options - { code, type, orderId, onEnlarge }
   */
  show(options = {}) {
    const {
      code = '123456789',
      type = 'qr',
      orderId = '',
      onEnlarge = null
    } = options;

    this._options = options;
    this._isBright = false;

    // 移除已有
    this.hide();

    const card = document.createElement('div');
    card.className = 'verify-code-card';

    const codeHtml = type === 'qr' ? this._generateQR(code) : this._generateBarcode(code);

    card.innerHTML = `
      <div class="verify-card-inner">
        <div class="verify-card-header">
          <span class="verify-card-order">订单号：${orderId}</span>
          <button class="verify-card-brightness">🔆</button>
        </div>
        <div class="verify-card-code">${codeHtml}</div>
        <div class="verify-card-number">${code}</div>
        <div class="verify-card-actions">
          <button class="verify-card-enlarge">放大查看</button>
        </div>
      </div>`;

    document.body.appendChild(card);
    this._el = card;

    // 事件绑定
    card.querySelector('.verify-card-brightness').addEventListener('click', () => this.toggleBrightness());
    card.querySelector('.verify-card-enlarge').addEventListener('click', () => {
      if (onEnlarge) onEnlarge();
      this.enlarge();
    });
  },

  /** 隐藏核销码卡片 */
  hide() {
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
  },

  /** 切换亮度 */
  toggleBrightness() {
    this._isBright = !this._isBright;
    if (this._el) {
      this._el.querySelector('.verify-card-inner').classList.toggle('brightness-high', this._isBright);
    }
  },

  /** 放大查看 */
  enlarge() {
    if (!this._el) return;

    const overlay = document.createElement('div');
    overlay.className = 'verify-code-fullscreen';
    overlay.innerHTML = this._el.querySelector('.verify-card-inner').innerHTML;
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
  },

  /** 生成简易QR码图案（CSS实现） */
  _generateQR(code) {
    const size = 21; // QR码模块数
    let html = `<div class="qr-code" style="display:inline-grid;grid-template-columns:repeat(${size},1fr);width:168px;height:168px;background:#fff;padding:8px;">`;

    // 基于code生成伪随机矩阵
    let seed = 0;
    for (let i = 0; i < code.length; i++) seed = (seed * 31 + code.charCodeAt(i)) & 0x7fffffff;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // 定位图案
        const isFinder = (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
        const isFinderBorder = isFinder && (x === 0 || x === 6 || y === 0 || y === 6 || (x >= size - 7 && (x === size - 7 || x === size - 1)) || (y >= size - 7 && (y === size - 7 || y === size - 1)));
        const isFinderCore = isFinder && x >= 2 && x <= 4 && y >= 2 && y <= 4;
        const isFinderCore2 = isFinder && x >= size - 5 && x <= size - 3 && y >= 2 && y <= 4;
        const isFinderCore3 = isFinder && x >= 2 && x <= 4 && y >= size - 5 && y <= size - 3;

        let filled;
        if (isFinderBorder || isFinderCore || isFinderCore2 || isFinderCore3) {
          filled = true;
        } else if (isFinder) {
          filled = false;
        } else {
          seed = (seed * 1103515245 + 12345) & 0x7fffffff;
          filled = (seed % 3) === 0;
        }

        html += `<div style="width:8px;height:8px;background:${filled ? '#000' : '#fff'}"></div>`;
      }
    }
    html += '</div>';
    return html;
  },

  /** 生成条形码图案（CSS实现） */
  _generateBarcode(code) {
    let html = '<div class="barcode" style="display:flex;align-items:flex-end;height:80px;gap:1px;padding:8px;background:#fff;">';
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      // 根据字符生成条形
      const bars = charCode.toString(2).padStart(8, '0');
      for (const bit of bars) {
        const width = bit === '1' ? 2 : 1;
        html += `<div style="width:${width}px;height:${bit === '1' ? 80 : 60}px;background:#000;"></div>`;
      }
      // 间隔
      html += '<div style="width:2px;height:80px;background:#fff;"></div>';
    }
    html += '</div>';
    return html;
  }
};

/* ============================================================
 *  14. Bargain Progress - 砍价进度
 * ============================================================ */
const BargainProgress = {
  _instances: new WeakMap(),

  /**
   * 初始化砍价进度
   * @param {HTMLElement|string} element - 元素
   * @param {Object} options - { originalPrice, currentPrice, floorPrice, helpers, onShare }
   */
  init(element, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const {
      originalPrice = 100,
      currentPrice = 80,
      floorPrice = 10,
      helpers = [],
      onShare = null
    } = options;

    el.classList.add('bargain-progress');
    const state = { originalPrice, currentPrice, floorPrice, helpers, onShare };
    this._instances.set(el, state);
    this._render(el, state);
  },

  /**
   * 添加助力者
   * @param {HTMLElement|string} element - 元素
   * @param {Object} helper - { name, avatar, amount }
   */
  addHelper(element, helper) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    const state = this._instances.get(el);
    if (!state) return;

    state.helpers.push(helper);
    this.showBubble(el, helper);
    this._render(el, state);
  },

  /**
   * 更新进度
   * @param {HTMLElement|string} element - 元素
   * @param {number} currentPrice - 当前价格
   */
  updateProgress(element, currentPrice) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    const state = this._instances.get(el);
    if (!state) return;

    state.currentPrice = currentPrice;
    this._render(el, state);
  },

  /**
   * 显示助力气泡
   * @param {HTMLElement|string} element - 元素
   * @param {Object} helper - { name, avatar, amount }
   */
  showBubble(element, helper) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const bubble = document.createElement('div');
    bubble.className = 'bargain-bubble';
    bubble.innerHTML = `<span>${helper.name} 帮砍了 ¥${helper.amount.toFixed(2)}</span>`;
    el.appendChild(bubble);

    // 动画滑入
    requestAnimationFrame(() => bubble.classList.add('bargain-bubble-visible'));

    // 自动消失
    setTimeout(() => {
      bubble.classList.remove('bargain-bubble-visible');
      setTimeout(() => bubble.remove(), 300);
    }, 3000);
  },

  _render(el, state) {
    const totalDiscount = state.originalPrice - state.floorPrice;
    const currentDiscount = state.originalPrice - state.currentPrice;
    const pct = totalDiscount > 0 ? Math.min(currentDiscount / totalDiscount * 100, 100) : 0;

    let html = `
      <div class="bargain-price-info">
        <span class="bargain-original">¥${state.originalPrice.toFixed(2)}</span>
        <span class="bargain-current">¥${state.currentPrice.toFixed(2)}</span>
        <span class="bargain-floor">底价 ¥${state.floorPrice.toFixed(2)}</span>
      </div>
      <div class="bargain-bar">
        <div class="bargain-bar-fill" style="width:${pct}%"></div>
        <div class="bargain-bar-marker" style="left:${pct}%"></div>
      </div>
      <div class="bargain-helpers">
        ${state.helpers.map(h => `
          <div class="bargain-helper">
            <span class="bargain-helper-avatar">${h.avatar ? `<img src="${h.avatar}" alt="">` : '👤'}</span>
            <span class="bargain-helper-info">${h.name} -¥${h.amount.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>`;

    if (state.onShare) {
      html += '<button class="bargain-share-btn">邀请好友帮砍</button>';
    }

    el.innerHTML = html;

    // 绑定分享按钮
    const shareBtn = el.querySelector('.bargain-share-btn');
    if (shareBtn && state.onShare) {
      shareBtn.addEventListener('click', state.onShare);
    }
  }
};

/* ============================================================
 *  15. Activity Popup - 活动弹窗
 * ============================================================ */
const ActivityPopup = {
  _el: null,
  _timer: null,

  /**
   * 显示活动弹窗
   * @param {Object} options - { image, title, countdown, ctaText, ctaLink, onClose, showOnce }
   */
  show(options = {}) {
    const {
      image = '',
      title = '限时活动',
      countdown = 0,
      ctaText = '立即参与',
      ctaLink = '#',
      onClose = null,
      showOnce = false
    } = options;

    // showOnce: 每个session只显示一次
    if (showOnce) {
      const key = 'hs_popup_' + (title || 'default');
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
      } catch (e) { /* 忽略 */ }
    }

    this.hide();

    const popup = document.createElement('div');
    popup.className = 'activity-popup';

    let countdownHtml = '';
    if (countdown > 0) {
      countdownHtml = '<div class="activity-popup-countdown"></div>';
    }

    popup.innerHTML = `
      <div class="activity-popup-mask"></div>
      <div class="activity-popup-content">
        <button class="activity-popup-close">×</button>
        ${image ? `<img class="activity-popup-image" src="${image}" alt="${title}">` : ''}
        <div class="activity-popup-title">${title}</div>
        ${countdownHtml}
        <a class="activity-popup-cta" href="${ctaLink}">${ctaText}</a>
      </div>`;

    document.body.appendChild(popup);
    this._el = popup;

    // 事件绑定
    popup.querySelector('.activity-popup-close').addEventListener('click', () => {
      if (onClose) onClose();
      this.hide();
    });
    popup.querySelector('.activity-popup-mask').addEventListener('click', () => {
      if (onClose) onClose();
      this.hide();
    });

    // 倒计时
    if (countdown > 0) {
      let remaining = countdown;
      const countdownEl = popup.querySelector('.activity-popup-countdown');
      this._timer = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(this._timer);
          this.hide();
          return;
        }
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        if (countdownEl) countdownEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}后关闭`;
      }, 1000);
    }
  },

  /** 隐藏活动弹窗 */
  hide() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
  }
};

/* ============================================================
 *  16. Button Loading - 按钮加载状态
 * ============================================================ */
const BtnLoading = {
  /**
   * 开始加载状态
   * @param {HTMLElement|string} button - 按钮元素
   */
  start(button) {
    const btn = typeof button === 'string' ? document.querySelector(button) : button;
    if (!btn) return;

    btn._originalText = btn.textContent;
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.innerHTML = `<span class="btn-spinner"></span><span class="btn-loading-text">加载中...</span>`;
  },

  /**
   * 停止加载状态
   * @param {HTMLElement|string} button - 按钮元素
   */
  stop(button) {
    const btn = typeof button === 'string' ? document.querySelector(button) : button;
    if (!btn) return;

    btn.disabled = false;
    btn.classList.remove('btn-loading');
    if (btn._originalText !== undefined) {
      btn.textContent = btn._originalText;
      delete btn._originalText;
    }
  },

  /**
   * 自动加载包装器
   * @param {HTMLElement|string} button - 按钮元素
   * @param {Function} asyncFn - 异步函数
   * @returns {Function}
   */
  wrap(button, asyncFn) {
    return async (...args) => {
      this.start(button);
      try {
        return await asyncFn(...args);
      } finally {
        this.stop(button);
      }
    };
  }
};

/* ============================================================
 *  17. Form Validation - 表单验证
 * ============================================================ */
const FormValidation = {
  _instances: new WeakMap(),

  /**
   * 初始化表单验证
   * @param {HTMLElement|string} formElement - 表单元素
   * @param {Object} rules - 验证规则 { fieldName: { required, pattern, min, max, custom, message } }
   */
  init(formElement, rules = {}) {
    const form = typeof formElement === 'string' ? document.querySelector(formElement) : formElement;
    if (!form) return;

    const state = { rules, errors: {} };
    this._instances.set(form, state);

    // 实时验证
    form.addEventListener('input', (e) => {
      const field = e.target.closest('[name]');
      if (field) this.validate(form, field.name);
    });

    form.addEventListener('blur', (e) => {
      const field = e.target.closest('[name]');
      if (field) this.validate(form, field.name);
    }, true);
  },

  /**
   * 验证单个字段
   * @param {HTMLElement|string} formElement - 表单元素
   * @param {string} fieldName - 字段名
   * @returns {boolean}
   */
  validate(formElement, fieldName) {
    const form = typeof formElement === 'string' ? document.querySelector(formElement) : formElement;
    if (!form) return false;

    const state = this._instances.get(form);
    if (!state || !state.rules[fieldName]) return true;

    const rule = state.rules[fieldName];
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (!field) return true;

    const value = field.value.trim();
    let error = '';

    if (rule.required && !value) {
      error = rule.message || '此字段为必填项';
    } else if (value) {
      if (rule.pattern && !rule.pattern.test(value)) {
        error = rule.message || '格式不正确';
      }
      if (rule.min !== undefined && value.length < rule.min) {
        error = rule.message || `最少${rule.min}个字符`;
      }
      if (rule.max !== undefined && value.length > rule.max) {
        error = rule.message || `最多${rule.max}个字符`;
      }
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
          error = customResult || rule.message || '验证失败';
        }
      }
    }

    if (error) {
      this.showError(form, fieldName, error);
      return false;
    } else {
      this.showSuccess(form, fieldName);
      return true;
    }
  },

  /**
   * 验证所有字段
   * @param {HTMLElement|string} formElement - 表单元素
   * @returns {boolean}
   */
  validateAll(formElement) {
    const form = typeof formElement === 'string' ? document.querySelector(formElement) : formElement;
    if (!form) return false;

    const state = this._instances.get(form);
    if (!state) return true;

    let allValid = true;
    for (const fieldName of Object.keys(state.rules)) {
      if (!this.validate(form, fieldName)) {
        allValid = false;
      }
    }
    return allValid;
  },

  /**
   * 显示错误
   * @param {HTMLElement|string} formElement - 表单元素
   * @param {string} fieldName - 字段名
   * @param {string} message - 错误信息
   */
  showError(formElement, fieldName, message) {
    const form = typeof formElement === 'string' ? document.querySelector(formElement) : formElement;
    if (!form) return;

    const field = form.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    field.classList.add('field-error');
    field.classList.remove('field-success');

    // 移除旧错误
    this.clearError(form, fieldName);

    const errorEl = document.createElement('div');
    errorEl.className = 'form-error-msg';
    errorEl.textContent = message;
    field.parentNode.appendChild(errorEl);
  },

  /**
   * 显示成功
   * @param {HTMLElement|string} formElement - 表单元素
   * @param {string} fieldName - 字段名
   */
  showSuccess(formElement, fieldName) {
    const form = typeof formElement === 'string' ? document.querySelector(formElement) : formElement;
    if (!form) return;

    const field = form.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    field.classList.remove('field-error');
    field.classList.add('field-success');
    this.clearError(form, fieldName);
  },

  /**
   * 清除错误
   * @param {HTMLElement|string} formElement - 表单元素
   * @param {string} fieldName - 字段名
   */
  clearError(formElement, fieldName) {
    const form = typeof formElement === 'string' ? document.querySelector(formElement) : formElement;
    if (!form) return;

    const field = form.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    const existing = field.parentNode.querySelector('.form-error-msg');
    if (existing) existing.remove();
  }
};

/* ============================================================
 *  18. Swipe Actions - 滑动操作
 * ============================================================ */
const SwipeActions = {
  _instances: new WeakMap(),
  _currentOpen: null,

  /**
   * 初始化滑动操作
   * @param {HTMLElement|string} element - 元素
   * @param {Object} options - { actions, threshold }
   */
  init(element, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const {
      actions = [],
      threshold = 80
    } = options;

    el.classList.add('swipe-item');

    const actionWidth = actions.length * 80;
    const state = { actions, threshold, actionWidth, startX: 0, startY: 0, currentX: 0, isOpen: false, direction: '' };
    this._instances.set(el, state);

    // 构建HTML
    const content = el.innerHTML;
    el.innerHTML = `
      <div class="swipe-content">${content}</div>
      <div class="swipe-actions" style="width:${actionWidth}px">
        ${actions.map((a, i) => `<button class="swipe-action-btn ${a.className || ''}" data-index="${i}">${a.text}</button>`).join('')}
      </div>`;

    // 触摸事件
    el.addEventListener('touchstart', (e) => this._onTouchStart(el, e), { passive: true });
    el.addEventListener('touchmove', (e) => this._onTouchMove(el, e), { passive: false });
    el.addEventListener('touchend', (e) => this._onTouchEnd(el, e));

    // 按钮点击
    el.querySelector('.swipe-actions').addEventListener('click', (e) => {
      const btn = e.target.closest('.swipe-action-btn');
      if (btn) {
        const idx = parseInt(btn.dataset.index);
        if (actions[idx] && actions[idx].onClick) actions[idx].onClick();
        this._close(el);
      }
    });
  },

  /** 关闭所有已打开的滑动项 */
  closeAll() {
    document.querySelectorAll('.swipe-item').forEach(el => {
      this._close(el);
    });
  },

  _onTouchStart(el, e) {
    const state = this._instances.get(el);
    if (!state) return;

    const touch = e.touches[0];
    state.startX = touch.clientX;
    state.startY = touch.clientY;
    state.direction = '';

    // 关闭其他已打开的项
    if (this._currentOpen && this._currentOpen !== el) {
      this._close(this._currentOpen);
    }
  },

  _onTouchMove(el, e) {
    const state = this._instances.get(el);
    if (!state) return;

    const touch = e.touches[0];
    const dx = touch.clientX - state.startX;
    const dy = touch.clientY - state.startY;

    // 判断方向
    if (!state.direction) {
      if (Math.abs(dx) > Math.abs(dy)) {
        state.direction = 'horizontal';
      } else {
        state.direction = 'vertical';
        return;
      }
    }

    if (state.direction === 'vertical') return;

    e.preventDefault();
    state.currentX = dx;

    const content = el.querySelector('.swipe-content');
    if (content) {
      const translateX = state.isOpen ? Math.min(dx - state.actionWidth, 0) : Math.min(dx, 0);
      content.style.transform = `translateX(${translateX}px)`;
      content.style.transition = 'none';
    }
  },

  _onTouchEnd(el, e) {
    const state = this._instances.get(el);
    if (!state || state.direction !== 'horizontal') return;

    const content = el.querySelector('.swipe-content');
    if (!content) return;

    content.style.transition = 'transform 0.3s ease';

    if (state.currentX < -state.threshold) {
      // 打开
      content.style.transform = `translateX(-${state.actionWidth}px)`;
      state.isOpen = true;
      this._currentOpen = el;
    } else {
      // 关闭
      this._close(el);
    }

    state.currentX = 0;
  },

  _close(el) {
    const content = el.querySelector('.swipe-content');
    if (content) {
      content.style.transition = 'transform 0.3s ease';
      content.style.transform = 'translateX(0)';
    }
    const state = this._instances.get(el);
    if (state) state.isOpen = false;
    if (this._currentOpen === el) this._currentOpen = null;
  }
};

/* ============================================================
 *  19. Pull to Refresh - 下拉刷新
 * ============================================================ */
const PullRefresh = {
  _instances: new WeakMap(),

  /**
   * 初始化下拉刷新
   * @param {HTMLElement|string} element - 元素
   * @param {Object} options - { onRefresh, threshold }
   */
  init(element, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const {
      onRefresh = null,
      threshold = 80
    } = options;

    el.classList.add('pull-refresh-container');

    // 创建刷新指示器
    const indicator = document.createElement('div');
    indicator.className = 'pull-refresh-indicator';
    indicator.innerHTML = '<div class="pull-refresh-arrow">↓</div><div class="pull-refresh-text">下拉刷新</div>';
    el.insertBefore(indicator, el.firstChild);

    const state = {
      onRefresh,
      threshold,
      startY: 0,
      pulling: false,
      refreshing: false
    };
    this._instances.set(el, state);

    el.addEventListener('touchstart', (e) => {
      if (el.scrollTop <= 0 && !state.refreshing) {
        state.startY = e.touches[0].clientY;
        state.pulling = true;
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (!state.pulling || state.refreshing) return;

      const dy = e.touches[0].clientY - state.startY;
      if (dy <= 0) return;

      const distance = Math.min(dy * 0.5, 150);
      indicator.style.transform = `translateY(${distance}px)`;

      const arrow = indicator.querySelector('.pull-refresh-arrow');
      const text = indicator.querySelector('.pull-refresh-text');

      if (distance >= threshold) {
        if (arrow) arrow.style.transform = 'rotate(180deg)';
        if (text) text.textContent = '释放刷新';
      } else {
        if (arrow) arrow.style.transform = '';
        if (text) text.textContent = '下拉刷新';
      }
    }, { passive: true });

    el.addEventListener('touchend', async () => {
      if (!state.pulling || state.refreshing) return;

      const currentTransform = indicator.style.transform;
      const match = currentTransform.match(/translateY\((\d+(?:\.\d+)?)px\)/);
      const distance = match ? parseFloat(match[1]) : 0;

      if (distance >= threshold) {
        // 触发刷新
        state.refreshing = true;
        indicator.style.transform = `translateY(${threshold}px)`;
        indicator.querySelector('.pull-refresh-arrow').style.display = 'none';
        indicator.querySelector('.pull-refresh-text').textContent = '刷新中...';
        indicator.classList.add('refreshing');

        if (onRefresh) {
          try {
            await onRefresh();
          } catch (e) { /* 忽略 */ }
        }

        // 重置
        state.refreshing = false;
        indicator.classList.remove('refreshing');
        indicator.querySelector('.pull-refresh-arrow').style.display = '';
        indicator.querySelector('.pull-refresh-arrow').style.transform = '';
        indicator.querySelector('.pull-refresh-text').textContent = '下拉刷新';
      }

      indicator.style.transition = 'transform 0.3s ease';
      indicator.style.transform = 'translateY(0)';
      setTimeout(() => {
        indicator.style.transition = '';
      }, 300);

      state.pulling = false;
    });
  }
};

/* ============================================================
 *  20. Dark Mode - 暗黑模式
 * ============================================================ */
const DarkMode = {
  _storageKey: 'hs_dark_mode',
  _mediaQuery: null,

  /** 初始化暗黑模式 */
  init() {
    // 检查系统偏好或已保存的偏好
    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const saved = this._getSavedPreference();
    if (saved !== null) {
      if (saved) this.enable(); else this.disable();
    } else if (this._mediaQuery.matches) {
      this.enable();
    }

    // 监听系统偏好变化
    this._mediaQuery.addEventListener('change', (e) => {
      if (this._getSavedPreference() === null) {
        if (e.matches) this.enable(); else this.disable();
      }
    });
  },

  /** 切换暗黑模式 */
  toggle() {
    if (this.isDark()) {
      this.disable();
    } else {
      this.enable();
    }
  },

  /** 启用暗黑模式 */
  enable() {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-mode');
    this._savePreference(true);
  },

  /** 禁用暗黑模式 */
  disable() {
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('dark-mode');
    this._savePreference(false);
  },

  /**
   * 是否为暗黑模式
   * @returns {boolean}
   */
  isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  },

  _getSavedPreference() {
    try {
      const val = localStorage.getItem(this._storageKey);
      return val === null ? null : val === 'true';
    } catch (e) {
      return null;
    }
  },

  _savePreference(isDark) {
    try {
      localStorage.setItem(this._storageKey, isDark.toString());
    } catch (e) { /* 忽略 */ }
  }
};

/* ============================================================
 *  21. Number Animation - 数字动画
 * ============================================================ */
const NumberAnimate = {
  /**
   * 数字滚动动画
   * @param {HTMLElement|string} element - 元素
   * @param {number} targetValue - 目标值
   * @param {Object} options - { duration, prefix, suffix, decimals }
   */
  roll(element, targetValue, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const {
      duration = 1000,
      prefix = '',
      suffix = '',
      decimals = 0
    } = options;

    const startValue = parseFloat(el.textContent.replace(/[^\d.-]/g, '')) || 0;
    this._animate(el, startValue, targetValue, duration, prefix, suffix, decimals);
  },

  /**
   * 数字递增动画
   * @param {HTMLElement|string} element - 元素
   * @param {number} startValue - 起始值
   * @param {number} endValue - 结束值
   * @param {Object} options - { duration, prefix, suffix, decimals }
   */
  countUp(element, startValue, endValue, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const {
      duration = 1000,
      prefix = '',
      suffix = '',
      decimals = 0
    } = options;

    this._animate(el, startValue, endValue, duration, prefix, suffix, decimals);
  },

  _animate(el, startValue, endValue, duration, prefix, suffix, decimals) {
    const startTime = performance.now();
    const diff = endValue - startValue;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 缓动函数 (easeOutCubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + diff * eased;

      el.textContent = prefix + current.toFixed(decimals) + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }
};

/* ============================================================
 *  22. Charts - 简易图表 (SVG)
 * ============================================================ */
const Chart = {
  /**
   * 折线图
   * @param {HTMLElement|string} container - 容器
   * @param {Array} data - [{label, value}]
   * @param {Object} options - { color, smooth, fill, width, height }
   */
  line(container, data = [], options = {}) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el || data.length === 0) return;

    const {
      color = '#ff6034',
      smooth = true,
      fill = true,
      width = 400,
      height = 200
    } = options;

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const values = data.map(d => d.value);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;

    const points = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1 || 1)) * chartW,
      y: padding.top + chartH - ((d.value - minVal) / range) * chartH
    }));

    // 构建路径
    let linePath;
    if (smooth && points.length > 2) {
      linePath = this._smoothPath(points);
    } else {
      linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    }

    // 填充区域
    const fillPath = fill ? `${linePath} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z` : '';

    // Y轴刻度
    const yTicks = 5;
    let yAxisHtml = '';
    for (let i = 0; i <= yTicks; i++) {
      const val = minVal + (range * i / yTicks);
      const y = padding.top + chartH - (i / yTicks) * chartH;
      yAxisHtml += `<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="#999" font-size="11">${Math.round(val)}</text>`;
      yAxisHtml += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#eee" stroke-width="1"/>`;
    }

    // X轴标签
    let xAxisHtml = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1 || 1)) * chartW;
      return `<text x="${x}" y="${height - 8}" text-anchor="middle" fill="#999" font-size="11">${d.label}</text>`;
    }).join('');

    // 数据点
    const dotsHtml = points.map(p =>
      `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}" stroke="#fff" stroke-width="2"/>`
    ).join('');

    el.innerHTML = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        ${yAxisHtml}
        ${xAxisHtml}
        ${fill ? `<path d="${fillPath}" fill="${color}" fill-opacity="0.1"/>` : ''}
        <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        ${dotsHtml}
      </svg>`;
  },

  /**
   * 饼图
   * @param {HTMLElement|string} container - 容器
   * @param {Array} data - [{label, value, color}]
   * @param {Object} options - { donut, size }
   */
  pie(container, data = [], options = {}) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el || data.length === 0) return;

    const { donut = false, size = 200 } = options;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 20;
    const innerRadius = donut ? radius * 0.6 : 0;

    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return;

    const defaultColors = ['#ff6034', '#36a3f7', '#4caf50', '#ffc107', '#9c27b0', '#00bcd4'];
    let currentAngle = -Math.PI / 2;

    let slicesHtml = '';
    let labelsHtml = '';

    data.forEach((d, i) => {
      const color = d.color || defaultColors[i % defaultColors.length];
      const angle = (d.value / total) * Math.PI * 2;
      const endAngle = currentAngle + angle;

      const largeArc = angle > Math.PI ? 1 : 0;

      const x1 = cx + radius * Math.cos(currentAngle);
      const y1 = cy + radius * Math.sin(currentAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);

      let path;
      if (donut) {
        const ix1 = cx + innerRadius * Math.cos(currentAngle);
        const iy1 = cy + innerRadius * Math.sin(currentAngle);
        const ix2 = cx + innerRadius * Math.cos(endAngle);
        const iy2 = cy + innerRadius * Math.sin(endAngle);

        path = `M${ix1},${iy1} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} L${ix2},${iy2} A${innerRadius},${innerRadius} 0 ${largeArc},0 ${ix1},${iy1} Z`;
      } else {
        path = `M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`;
      }

      slicesHtml += `<path d="${path}" fill="${color}" stroke="#fff" stroke-width="2"/>`;

      // 标签
      const midAngle = currentAngle + angle / 2;
      const labelR = donut ? (radius + innerRadius) / 2 : radius * 0.65;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);
      const pct = Math.round(d.value / total * 100);

      if (pct > 5) {
        labelsHtml += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="12" font-weight="bold">${pct}%</text>`;
      }

      // 图例
      labelsHtml += `<g transform="translate(0, ${size + 10 + i * 20})"><rect width="12" height="12" fill="${color}" rx="2"/><text x="18" y="10" fill="#333" font-size="12">${d.label} (${pct}%)</text></g>`;

      currentAngle = endAngle;
    });

    const svgHeight = size + 10 + data.length * 20 + 10;
    el.innerHTML = `<svg width="${size}" height="${svgHeight}" viewBox="0 0 ${size} ${svgHeight}">${slicesHtml}${labelsHtml}</svg>`;
  },

  /**
   * 仪表盘图表
   * @param {HTMLElement|string} container - 容器
   * @param {number} value - 当前值
   * @param {Object} options - { max, color, label, size }
   */
  gauge(container, value, options = {}) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    const {
      max = 100,
      color = '#ff6034',
      label = '',
      size = 200
    } = options;

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 20;
    const strokeWidth = 12;

    // 半圆弧
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;
    const pct = Math.min(value / max, 1);
    const currentAngle = startAngle + pct * Math.PI;

    // 背景弧
    const bgX1 = cx + radius * Math.cos(startAngle);
    const bgY1 = cy + radius * Math.sin(startAngle);
    const bgX2 = cx + radius * Math.cos(endAngle);
    const bgY2 = cy + radius * Math.sin(endAngle);

    // 前景弧
    const fgX = cx + radius * Math.cos(currentAngle);
    const fgY = cy + radius * Math.sin(currentAngle);
    const largeArc = pct > 0.5 ? 1 : 0;

    el.innerHTML = `
      <svg width="${size}" height="${size / 2 + 40}" viewBox="0 0 ${size} ${size / 2 + 40}">
        <path d="M${bgX1},${bgY1} A${radius},${radius} 0 1,1 ${bgX2},${bgY2}"
          fill="none" stroke="#e5e5e5" stroke-width="${strokeWidth}" stroke-linecap="round"/>
        <path d="M${bgX1},${bgY1} A${radius},${radius} 0 ${largeArc},1 ${fgX},${fgY}"
          fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
        <text x="${cx}" y="${cy - 10}" text-anchor="middle" fill="#333" font-size="28" font-weight="bold">${Math.round(pct * 100)}%</text>
        ${label ? `<text x="${cx}" y="${cy + 14}" text-anchor="middle" fill="#999" font-size="13">${label}</text>` : ''}
      </svg>`;
  },

  /** 生成平滑曲线路径 */
  _smoothPath(points) {
    if (points.length < 2) return '';
    if (points.length === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;

    let path = `M${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    return path;
  }
};

/* ============================================================
 *  23. Export Utility - 导出工具
 * ============================================================ */
const ExportUtil = {
  /**
   * 从表格元素导出CSV
   * @param {HTMLElement|string} tableElement - 表格元素
   * @param {string} [filename='export.csv'] - 文件名
   */
  tableToCSV(tableElement, filename = 'export.csv') {
    const table = typeof tableElement === 'string' ? document.querySelector(tableElement) : tableElement;
    if (!table) return;

    const rows = table.querySelectorAll('tr');
    const csvData = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll('th, td');
      const rowData = Array.from(cells).map(cell => {
        let text = cell.textContent.trim().replace(/"/g, '""');
        return `"${text}"`;
      });
      csvData.push(rowData.join(','));
    });

    this._downloadCSV(csvData.join('\n'), filename);
  },

  /**
   * 从表格元素导出Excel
   * @param {HTMLElement|string} tableElement - 表格元素
   * @param {string} [filename='export.xls'] - 文件名
   */
  tableToExcel(tableElement, filename = 'export.xls') {
    const table = typeof tableElement === 'string' ? document.querySelector(tableElement) : tableElement;
    if (!table) return;

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
        <body>${table.outerHTML}</body>
      </html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    this._downloadBlob(blob, filename);
  },

  /**
   * 从数据数组导出CSV
   * @param {Array<Object>} data - 数据数组
   * @param {Array<string>} headers - 表头
   * @param {string} [filename='export.csv'] - 文件名
   */
  dataToCSV(data, headers, filename = 'export.csv') {
    if (!data || data.length === 0) return;

    const headerRow = headers.map(h => `"${h}"`).join(',');
    const rows = data.map(item => {
      return headers.map(h => {
        const val = item[h] !== undefined ? String(item[h]).replace(/"/g, '""') : '';
        return `"${val}"`;
      }).join(',');
    });

    const csv = [headerRow, ...rows].join('\n');
    this._downloadCSV(csv, filename);
  },

  _downloadCSV(csvContent, filename) {
    // 添加BOM以支持中文
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    this._downloadBlob(blob, filename);
  },

  _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

/* ============================================================
 *  24. Global Page Loading - 全局页面加载
 * ============================================================ */
const PageLoader = {
  _el: null,

  /** 显示全局加载 */
  show() {
    if (this._el) return;

    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = `
      <div class="page-loader-inner">
        <div class="page-loader-spinner"></div>
        <div class="page-loader-text">加载中...</div>
      </div>`;

    // 添加样式
    loader.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;';

    const style = document.createElement('style');
    style.textContent = `
      .page-loader-spinner {
        width: 40px; height: 40px;
        border: 3px solid #e5e5e5;
        border-top-color: #ff6034;
        border-radius: 50%;
        animation: page-loader-spin 0.8s linear infinite;
      }
      .page-loader-inner {
        display: flex; flex-direction: column; align-items: center; gap: 12px;
      }
      .page-loader-text {
        color: #999; font-size: 14px;
      }
      @keyframes page-loader-spin {
        to { transform: rotate(360deg); }
      }`;

    document.head.appendChild(style);
    document.body.appendChild(loader);
    this._el = loader;
  },

  /** 隐藏全局加载 */
  hide() {
    if (!this._el) return;

    this._el.style.opacity = '0';
    this._el.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      if (this._el) {
        this._el.remove();
        this._el = null;
      }
    }, 300);
  }
};
