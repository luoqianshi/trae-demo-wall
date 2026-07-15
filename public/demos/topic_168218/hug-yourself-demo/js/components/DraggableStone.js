'use strict';

/**
 * DraggableStone - 情绪石头拖拽组件
 * 
 * 实现拖拽交互：用户将代表"情绪石头"的元素拖拽到"垃圾桶"区域，
 * 触发丢弃动画（缩小消失 + 粒子消散效果），或者弹性返回原位。
 * 
 * 同时支持触摸事件（移动端）和鼠标事件（PC 调试），内部归一化处理。
 * 
 * 使用方式：
 *   const stoneEl = document.getElementById('stone');
 *   const trashEl = document.getElementById('trashCan');
 *   const draggable = new DraggableStone(stoneEl, trashEl, {
 *     onDrop: () => { ... }  // 丢弃成功回调
 *   });
 *   draggable.bind();
 */

class DraggableStone {
  /**
   * @param {HTMLElement} stoneEl - 可拖拽的石头元素
   * @param {HTMLElement} trashCanEl - 垃圾桶目标元素
   * @param {Object} [options={}] - 配置项
   * @param {Function} [options.onDrop] - 丢弃成功后的回调函数
   */
  constructor(stoneEl, trashCanEl, options = {}) {
    // ----- 参数校验 -----
    if (!stoneEl || !(stoneEl instanceof HTMLElement)) {
      throw new Error('[DraggableStone] 有效的石头元素是必需的');
    }
    if (!trashCanEl || !(trashCanEl instanceof HTMLElement)) {
      throw new Error('[DraggableStone] 有效的垃圾桶元素是必需的');
    }

    /** @type {HTMLElement} 石头元素 */
    this.stoneEl = stoneEl;
    /** @type {HTMLElement} 垃圾桶元素 */
    this.trashCanEl = trashCanEl;

    /** @type {Function|undefined} 丢弃成功回调 */
    this.onDrop = typeof options.onDrop === 'function' ? options.onDrop : null;

    // ----- 拖拽状态 -----
    /** @type {boolean} 是否正在拖拽中 */
    this._dragging = false;
    /** @type {boolean} 是否已丢弃 */
    this._dropped = false;

    // 起始位置（相对于视口）
    /** @type {number} 触摸/鼠标起始 X */
    this._startX = 0;
    /** @type {number} 触摸/鼠标起始 Y */
    this._startY = 0;

    // 石头初始位置（getBoundingClientRect）
    /** @type {number} 石头初始 left */
    this._originLeft = 0;
    /** @type {number} 石头初始 top */
    this._originTop = 0;

    // 累计偏移
    /** @type {number} 当前累计 X 偏移 */
    this._dx = 0;
    /** @type {number} 当前累计 Y 偏移 */
    this._dy = 0;

    // ----- 石头元素初始样式保存 -----
    /** @type {string} 初始 position */
    this._origPosition = this.stoneEl.style.position || '';
    /** @type {string} 初始 transform */
    this._origTransform = this.stoneEl.style.transform || '';
    /** @type {string} 初始 transition */
    this._origTransition = this.stoneEl.style.transition || '';
    /** @type {string} 初始 z-index */
    this._origZIndex = this.stoneEl.style.zIndex || '';

    // ----- 绑定的事件处理函数引用（用于解绑） -----
    this._boundHandlers = {
      // 触摸事件
      touchStart: this._onTouchStart.bind(this),
      touchMove: this._onTouchMove.bind(this),
      touchEnd: this._onTouchEnd.bind(this),
      // 鼠标事件
      mouseDown: this._onMouseDown.bind(this),
      mouseMove: this._onMouseMove.bind(this),
      mouseUp: this._onMouseUp.bind(this),
    };
  }

  // ============================================================
  // 绑定 / 解绑 事件
  // ============================================================

  /**
   * 绑定拖拽事件（触摸 + 鼠标）
   * @returns {DraggableStone} 返回自身，支持链式调用
   */
  bind() {
    // 触摸事件（移动端）
    this.stoneEl.addEventListener('touchstart', this._boundHandlers.touchStart, { passive: false });
    document.addEventListener('touchmove', this._boundHandlers.touchMove, { passive: false });
    document.addEventListener('touchend', this._boundHandlers.touchEnd, { passive: false });

    // 鼠标事件（PC 调试）
    this.stoneEl.addEventListener('mousedown', this._boundHandlers.mouseDown);

    return this;
  }

  /**
   * 解绑所有事件
   * @returns {DraggableStone} 返回自身，支持链式调用
   */
  unbind() {
    this.stoneEl.removeEventListener('touchstart', this._boundHandlers.touchStart);
    document.removeEventListener('touchmove', this._boundHandlers.touchMove);
    document.removeEventListener('touchend', this._boundHandlers.touchEnd);

    this.stoneEl.removeEventListener('mousedown', this._boundHandlers.mouseDown);
    document.removeEventListener('mousemove', this._boundHandlers.mouseMove);
    document.removeEventListener('mouseup', this._boundHandlers.mouseUp);

    // 恢复石头样式
    this._resetStoneStyle();

    return this;
  }

  // ============================================================
  // 触摸事件处理
  // ============================================================

  /**
   * touchstart 处理
   * @param {TouchEvent} e
   * @private
   */
  _onTouchStart(e) {
    if (this._dropped) return;
    e.preventDefault();

    const touch = e.touches[0];
    this._startDrag(touch.clientX, touch.clientY);
  }

  /**
   * touchmove 处理
   * @param {TouchEvent} e
   * @private
   */
  _onTouchMove(e) {
    if (!this._dragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    this._onDrag(touch.clientX, touch.clientY);
  }

  /**
   * touchend 处理
   * @param {TouchEvent} e
   * @private
   */
  _onTouchEnd(e) {
    if (!this._dragging) return;
    this._endDrag();
  }

  // ============================================================
  // 鼠标事件处理（PC 调试）
  // ============================================================

  /**
   * mousedown 处理
   * @param {MouseEvent} e
   * @private
   */
  _onMouseDown(e) {
    if (this._dropped) return;
    e.preventDefault();

    this._startDrag(e.clientX, e.clientY);

    // 在 document 上监听 move/up，确保即使鼠标移出元素也能捕获
    document.addEventListener('mousemove', this._boundHandlers.mouseMove);
    document.addEventListener('mouseup', this._boundHandlers.mouseUp);
  }

  /**
   * mousemove 处理
   * @param {MouseEvent} e
   * @private
   */
  _onMouseMove(e) {
    if (!this._dragging) return;
    e.preventDefault();

    this._onDrag(e.clientX, e.clientY);
  }

  /**
   * mouseup 处理
   * @param {MouseEvent} e
   * @private
   */
  _onMouseUp(e) {
    if (!this._dragging) return;

    document.removeEventListener('mousemove', this._boundHandlers.mouseMove);
    document.removeEventListener('mouseup', this._boundHandlers.mouseUp);

    this._endDrag();
  }

  // ============================================================
  // 拖拽核心逻辑
  // ============================================================

  /**
   * 开始拖拽
   * 记录起始坐标和石头初始位置，添加拖动状态和缩放效果
   * 
   * @param {number} clientX - 起始 X 坐标（视口坐标）
   * @param {number} clientY - 起始 Y 坐标（视口坐标）
   * @private
   */
  _startDrag(clientX, clientY) {
    this._dragging = true;
    this._dx = 0;
    this._dy = 0;

    // 记录起始指针位置
    this._startX = clientX;
    this._startY = clientY;

    // 记录石头初始位置（用于弹性返回）
    const rect = this.stoneEl.getBoundingClientRect();
    this._originLeft = rect.left;
    this._originTop = rect.top;

    // 设置石头为固定定位以跟随指针
    const computedStyle = window.getComputedStyle(this.stoneEl);
    if (computedStyle.position === 'static') {
      this.stoneEl.style.position = 'relative';
    }

    // 提升层级，确保拖拽时在最上层
    this.stoneEl.style.zIndex = '1000';
    this.stoneEl.style.transition = 'none';

    // 添加拖动状态（缩放 1.1）
    this.stoneEl.classList.add('draggable-stone--dragging');
    this.stoneEl.style.transform = 'scale(1.1)';

    // 拖拽期间禁止页面滚动与文本选择
    document.body.classList.add('draggable-stone--locked');
  }

  /**
   * 拖拽中
   * 计算位移并应用 transform，同时检测是否在垃圾桶上方
   * 
   * @param {number} clientX - 当前指针 X 坐标
   * @param {number} clientY - 当前指针 Y 坐标
   * @private
   */
  _onDrag(clientX, clientY) {
    // 计算相对于起始位置的偏移
    this._dx = clientX - this._startX;
    this._dy = clientY - this._startY;

    // 应用位移（保持原有缩放）
    this.stoneEl.style.transform = `translate(${this._dx}px, ${this._dy}px) scale(1.1)`;

    // 检测是否在垃圾桶上方，切换视觉反馈
    const overTrash = this.isOverTrashCan(clientX, clientY);
    this.stoneEl.classList.toggle('draggable-stone--over-trash', overTrash);
    this.trashCanEl.classList.toggle('trash-can--active', overTrash);
  }

  /**
   * 结束拖拽
   * 判断是否在垃圾桶上方，决定丢弃或返回
   * 
   * @private
   */
  _endDrag() {
    this._dragging = false;
    this.stoneEl.classList.remove('draggable-stone--dragging');
    document.body.classList.remove('draggable-stone--locked');

    // 获取当前指针位置（使用最后一次记录的偏移计算）
    // 通过 getBoundingClientRect 获取石头当前位置中心
    const stoneRect = this.stoneEl.getBoundingClientRect();
    const centerX = stoneRect.left + stoneRect.width / 2;
    const centerY = stoneRect.top + stoneRect.height / 2;

    if (this.isOverTrashCan(centerX, centerY)) {
      // 在垃圾桶上方 -> 丢弃
      this.dropIntoTrash();
    } else {
      // 不在垃圾桶上方 -> 弹性返回
      this.returnToOrigin();
    }

    // 清除垃圾桶高亮状态
    this.trashCanEl.classList.remove('trash-can--active');
  }

  // ============================================================
  // 丢弃 / 返回 动画
  // ============================================================

  /**
   * 丢弃到垃圾桶
   * 石头飞向垃圾桶中心并缩小消失 -> 垃圾桶动画 -> 粒子消散效果 -> 触发回调
   */
  dropIntoTrash() {
    this._dropped = true;

    // 计算垃圾桶中心相对石头的偏移
    const stoneRect = this.stoneEl.getBoundingClientRect();
    const trashRect = this.trashCanEl.getBoundingClientRect();
    const targetDx = this._dx + (trashRect.left + trashRect.width / 2) - (stoneRect.left + stoneRect.width / 2);
    const targetDy = this._dy + (trashRect.top + trashRect.height / 2) - (stoneRect.top + stoneRect.height / 2);

    // 禁用交互，防止动画过程中再次被拖拽
    this.stoneEl.style.pointerEvents = 'none';

    // 强制重排，确保接下来设置的 transform 能触发过渡
    this.stoneEl.style.transition = 'none';
    // 取消可能存在的 CSS 动画（如石头入场动画的 forwards），避免其覆盖 transform
    this.stoneEl.style.animation = 'none';
    void this.stoneEl.offsetWidth;

    // 设置飞向垃圾桶并缩小的过渡动画
    this.stoneEl.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease';
    void this.stoneEl.offsetWidth;

    // 触发目标状态
    this.stoneEl.style.transform = `translate(${targetDx}px, ${targetDy}px) scale(0)`;
    this.stoneEl.style.opacity = '0';

    // 垃圾桶动画（弹跳效果）
    this.trashCanEl.classList.add('trash-can--drop');

    // 创建粒子消散效果
    this._createParticles();

    // 动画结束后触发回调
    setTimeout(() => {
      // 移除垃圾桶动画类
      this.trashCanEl.classList.remove('trash-can--drop');

      // 触发回调
      if (typeof this.onDrop === 'function') {
        this.onDrop();
      }
    }, 500);
  }

  /**
   * 弹性返回原位
   * 使用 CSS 过渡 + 回弹曲线实现
   */
  returnToOrigin() {
    // 使用弹性回弹曲线
    this.stoneEl.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    this.stoneEl.style.transform = 'translate(0, 0) scale(1)';

    // 动画结束后恢复样式
    const onTransitionEnd = () => {
      this.stoneEl.removeEventListener('transitionend', onTransitionEnd);
      this._resetStoneStyle();
    };
    this.stoneEl.addEventListener('transitionend', onTransitionEnd);

    // 移除跨越垃圾桶的视觉状态
    this.stoneEl.classList.remove('draggable-stone--over-trash');

    // 超时保底（防止 transitionend 未触发）
    setTimeout(() => {
      this.stoneEl.removeEventListener('transitionend', onTransitionEnd);
      this._resetStoneStyle();
    }, 600);
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  /**
   * 检测指定坐标是否在垃圾桶元素区域内
   * 使用 getBoundingClientRect 进行碰撞检测
   * 
   * @param {number} x - 检测点 X 坐标（视口坐标）
   * @param {number} y - 检测点 Y 坐标（视口坐标）
   * @returns {boolean} 是否在垃圾桶区域内
   */
  isOverTrashCan(x, y) {
    const rect = this.trashCanEl.getBoundingClientRect();

    // 加入 10px 的容差，提升用户体验
    const padding = 10;
    return (
      x >= rect.left - padding &&
      x <= rect.right + padding &&
      y >= rect.top - padding &&
      y <= rect.bottom + padding
    );
  }

  /**
   * 创建石头粉碎效果
   * 在石头当前位置生成不规则碎片向四周飞散，并伴随闪光与粉尘
   *
   * @private
   */
  _createParticles() {
    const stoneRect = this.stoneEl.getBoundingClientRect();
    const centerX = stoneRect.left + stoneRect.width / 2;
    const centerY = stoneRect.top + stoneRect.height / 2;
    const stoneColor = this._getStoneFragmentColor();

    // 1. 大碎片：模拟石头破裂后的块状残骸
    const fragmentCount = 16;
    for (let i = 0; i < fragmentCount; i++) {
      const fragment = document.createElement('div');
      fragment.className = 'draggable-stone-fragment';

      const size = 8 + Math.random() * 14;
      fragment.style.width = `${size}px`;
      fragment.style.height = `${size}px`;
      fragment.style.background = stoneColor;
      fragment.style.left = `${centerX}px`;
      fragment.style.top = `${centerY}px`;

      const angle = (Math.PI * 2 * i) / fragmentCount + (Math.random() - 0.5) * 0.6;
      const distance = 50 + Math.random() * 90;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const rotate = Math.random() * 720 - 360;

      fragment.style.setProperty('--tx', `${tx}px`);
      fragment.style.setProperty('--ty', `${ty}px`);
      fragment.style.setProperty('--rot', `${rotate}deg`);
      fragment.style.animationDelay = `${Math.random() * 0.1}s`;

      document.body.appendChild(fragment);
      fragment.addEventListener('animationend', () => fragment.remove());
    }

    // 2. 小粉尘：增强粉碎细节
    const dustCount = 18;
    for (let i = 0; i < dustCount; i++) {
      const dust = document.createElement('div');
      dust.className = 'draggable-stone-dust';

      const size = 2 + Math.random() * 5;
      dust.style.width = `${size}px`;
      dust.style.height = `${size}px`;
      dust.style.left = `${centerX}px`;
      dust.style.top = `${centerY}px`;

      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 100;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      dust.style.setProperty('--tx', `${tx}px`);
      dust.style.setProperty('--ty', `${ty}px`);
      dust.style.animationDelay = `${Math.random() * 0.15}s`;

      document.body.appendChild(dust);
      dust.addEventListener('animationend', () => dust.remove());
    }

    // 3. 中心闪光
    this._createImpactFlash(centerX, centerY);

    // 4. 粉碎文字提示
    this._createCrushLabel(centerX, centerY);
  }

  /**
   * 获取与石头相近的碎片颜色
   * @private
   */
  _getStoneFragmentColor() {
    const colors = [
      '#9E948A', '#A89F94', '#8C8278', '#B5A89C',
      '#C4B8AC', '#7D756D', '#ADA39A', '#8E867D'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * 创建中心闪光
   * @private
   */
  _createImpactFlash(x, y) {
    const flash = document.createElement('div');
    flash.className = 'draggable-stone-flash';
    flash.style.left = `${x}px`;
    flash.style.top = `${y}px`;
    document.body.appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove());
  }

  /**
   * 创建"粉碎"文字提示
   * @private
   */
  _createCrushLabel(x, y) {
    const label = document.createElement('div');
    label.className = 'draggable-stone-crush-label';
    label.textContent = '粉碎';
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
    document.body.appendChild(label);
    label.addEventListener('animationend', () => label.remove());
  }

  /**
   * 恢复石头元素的初始样式
   * @private
   */
  _resetStoneStyle() {
    this.stoneEl.style.position = this._origPosition;
    this.stoneEl.style.transform = this._origTransform;
    this.stoneEl.style.transition = this._origTransition;
    this.stoneEl.style.zIndex = this._origZIndex;
    this.stoneEl.style.opacity = '1';
    this.stoneEl.style.pointerEvents = '';
    this.stoneEl.classList.remove(
      'draggable-stone--dragging',
      'draggable-stone--over-trash'
    );
    document.body.classList.remove('draggable-stone--locked');
  }

  // ============================================================
  // 静态方法：注入 CSS 样式
  // ============================================================

  /**
   * 注入组件所需的 CSS 样式
   * 仅在首次调用时注入
   */
  static injectStyles() {
    if (DraggableStone._stylesInjected) return;
    DraggableStone._stylesInjected = true;

    const style = document.createElement('style');
    style.textContent = `
      /* ---- 拖拽时锁定页面 ---- */
      .draggable-stone--locked {
        overflow: hidden !important;
        touch-action: none !important;
      }

      .draggable-stone--locked .page-view {
        overflow: hidden !important;
      }

      /* ---- 石头拖拽状态 ---- */
      .draggable-stone--dragging {
        cursor: grabbing !important;
        user-select: none;
        -webkit-user-select: none;
        will-change: transform;
        filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2));
      }

      .draggable-stone--over-trash {
        filter: drop-shadow(0 0 20px rgba(255, 107, 107, 0.6)) !important;
        opacity: 0.7;
      }

      /* ---- 垃圾桶高亮状态 ---- */
      .trash-can--active {
        transform: scale(1.08);
        transition: transform 0.2s ease;
      }

      .trash-can--drop {
        animation: trash-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      /* ---- 大碎片：石头块状残骸 ---- */
      .draggable-stone-fragment {
        position: fixed;
        border-radius: 35% 65% 45% 55% / 55% 45% 65% 35%;
        pointer-events: none;
        z-index: 9999;
        animation: fragment-shatter 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        opacity: 1;
      }

      /* ---- 小粉尘 ---- */
      .draggable-stone-dust {
        position: fixed;
        border-radius: 50%;
        background: rgba(140, 130, 120, 0.55);
        pointer-events: none;
        z-index: 9998;
        animation: dust-fly 0.55s ease-out forwards;
        opacity: 1;
      }

      /* ---- 中心闪光 ---- */
      .draggable-stone-flash {
        position: fixed;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%);
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 10000;
        animation: flash-burst 0.35s ease-out forwards;
      }

      /* ---- 粉碎文字提示 ---- */
      .draggable-stone-crush-label {
        position: fixed;
        transform: translate(-50%, -50%);
        font-size: 14px;
        font-weight: 700;
        color: var(--brand-accent, #C38D94);
        pointer-events: none;
        z-index: 10001;
        animation: crush-label-pop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        text-shadow: 0 2px 8px rgba(255, 255, 255, 0.8);
        white-space: nowrap;
      }

      /* ============================================================ */
      /* Keyframes 动画定义                                           */
      /* ============================================================ */

      @keyframes trash-bounce {
        0%   { transform: scale(1); }
        20%  { transform: scale(0.9); }
        40%  { transform: scale(1.15); }
        60%  { transform: scale(0.95); }
        80%  { transform: scale(1.05); }
        100% { transform: scale(1); }
      }

      @keyframes fragment-shatter {
        0% {
          transform: translate(0, 0) rotate(0deg) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0.2);
          opacity: 0;
        }
      }

      @keyframes dust-fly {
        0% {
          transform: translate(0, 0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(var(--tx), var(--ty)) scale(0);
          opacity: 0;
        }
      }

      @keyframes flash-burst {
        0% {
          transform: translate(-50%, -50%) scale(0.2);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(4);
          opacity: 0;
        }
      }

      @keyframes crush-label-pop {
        0% {
          transform: translate(-50%, -50%) scale(0.2);
          opacity: 0;
        }
        40% {
          transform: translate(-50%, -50%) scale(1.2);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -140%) scale(1);
          opacity: 0;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

/** @private 静态标记，确保样式只注入一次 */
DraggableStone._stylesInjected = false;