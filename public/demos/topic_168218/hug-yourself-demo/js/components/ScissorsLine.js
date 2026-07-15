'use strict';

/**
 * ScissorsLine - 课题分离剪的连线剪断交互组件
 *
 * 实现一条带虚线连线连接"我的事情"和"他的事情"两个端点，
 * 用户横向滑动剪刀图标，当剪刀越过中线时触发剪断动画：
 *   1) 原线闪烁一下后隐藏
 *   2) 两段断线显示并向两侧弹开（附带旋转）
 *   3) 剪断点产生火花粒子后淡出
 *   4) 触发 onCut 回调
 *
 * 同时支持触摸事件（移动端）和鼠标事件（PC 调试），内部归一化处理。
 *
 * 使用方式：
 *   const container = document.getElementById('scissors-container');
 *   const scissors = new ScissorsLine(container, {
 *     onCut: () => { console.log('剪断了！'); }
 *   });
 *   scissors.render();
 *
 *   // 需要重置时：
 *   scissors.reset();
 */

class ScissorsLine {
  // ============================================================
  // SVG 视图常量
  // ============================================================

  /** @type {number} SVG viewBox 宽度 */
  static VIEW_BOX_W = 300;
  /** @type {number} SVG viewBox 高度 */
  static VIEW_BOX_H = 120;
  /** @type {number} 连线左端点 X */
  static LINE_X_LEFT = 50;
  /** @type {number} 连线右端点 X */
  static LINE_X_RIGHT = 250;
  /** @type {number} 中线 X（剪断触发点） */
  static LINE_X_MID = 150;
  /** @type {number} 连线 Y 坐标 */
  static LINE_Y = 50;
  /** @type {number} 剪刀图标 Y 坐标（刀片交叉点与连线对齐） */
  static SCISSORS_Y = 58;

  /** @private 样式是否已注入 */
  static _stylesInjected = false;

  // ============================================================
  // 构造函数
  // ============================================================

  /**
   * @param {HTMLElement} container - 容器 DOM 元素
   * @param {Object}      [options]          - 配置项
   * @param {Function}    [options.onCut]    - 剪断成功回调
   * @param {string}      [options.colorVar] - CSS 颜色变量名，默认 '--brand-accent'
   */
  constructor(container, options = {}) {
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error('[ScissorsLine] 有效的容器元素(container)是必需的');
    }

    /** @type {HTMLElement} 容器元素 */
    this.container = container;

    /** @type {Function|null} 剪断回调 */
    this._cutCallback = typeof options.onCut === 'function' ? options.onCut : null;

    /** @type {string} CSS 颜色变量名 */
    this._colorVar = options.colorVar || '--brand-accent';

    // ---- SVG 元素引用 ----
    /** @type {SVGElement|null} 主 SVG */
    this._svg = null;
    /** @type {SVGPathElement|null} 完整虚线连线 */
    this._lineFull = null;
    /** @type {SVGPathElement|null} 左半断线 */
    this._lineBrokenLeft = null;
    /** @type {SVGPathElement|null} 右半断线 */
    this._lineBrokenRight = null;
    /** @type {SVGGElement|null} 剪刀图标组 */
    this._scissorsGroup = null;
    /** @type {SVGGElement|null} 火花容器 */
    this._sparkGroup = null;

    // ---- 交互状态 ----
    /** @type {boolean} 是否已剪断 */
    this._cut = false;
    /** @type {boolean} 是否正在拖动 */
    this._dragging = false;
    /** @type {number} 剪刀当前 X 位置（SVG viewBox 坐标） */
    this._scissorsX = ScissorsLine.LINE_X_LEFT;
    /** @type {number} 拖动起始时的指针 X（视口坐标） */
    this._startPointerX = 0;
    /** @type {number} 拖动起始时的剪刀 X */
    this._startScissorsX = 0;

    // 确保样式已注入
    this.constructor._ensureStyles();

    // 绑定的事件处理函数引用（用于解绑）
    this._boundHandlers = {
      touchStart: this._onTouchStart.bind(this),
      touchMove:  this._onTouchMove.bind(this),
      touchEnd:   this._onTouchEnd.bind(this),
      mouseDown:  this._onMouseDown.bind(this),
      mouseMove:  this._onMouseMove.bind(this),
      mouseUp:    this._onMouseUp.bind(this),
    };
  }

  // ============================================================
  // 公共 API
  // ============================================================

  /**
   * 渲染组件到容器中
   * @returns {ScissorsLine} 自身，支持链式调用
   */
  render() {
    this._createSVG();
    this._bindEvents();
    this._updateScissorsPosition(ScissorsLine.LINE_X_LEFT);
    return this;
  }

  /**
   * 注册（或替换）剪断成功回调
   * @param {Function} callback - 回调函数
   * @returns {ScissorsLine} 自身，支持链式调用
   */
  onCut(callback) {
    this._cutCallback = typeof callback === 'function' ? callback : null;
    return this;
  }

  /**
   * 重置到初始状态
   *    - 恢复完整虚线，隐藏断线
   *    - 剪刀回到左端，可拖动
   *    - 清除火花粒子
   * @returns {ScissorsLine} 自身，支持链式调用
   */
  reset() {
    this._cut = false;
    this._dragging = false;

    // ---- 恢复连线 ----
    if (this._lineFull) {
      this._lineFull.style.transition = 'opacity 0.3s ease';
      this._lineFull.style.opacity = '1';
    }
    if (this._lineBrokenLeft) {
      this._lineBrokenLeft.style.transition = 'none';
      this._lineBrokenLeft.style.opacity = '0';
      this._lineBrokenLeft.style.transform = 'none';
    }
    if (this._lineBrokenRight) {
      this._lineBrokenRight.style.transition = 'none';
      this._lineBrokenRight.style.opacity = '0';
      this._lineBrokenRight.style.transform = 'none';
    }

    // ---- 重置剪刀位置 ----
    this._scissorsX = ScissorsLine.LINE_X_LEFT;
    this._updateScissorsPosition(ScissorsLine.LINE_X_LEFT);

    // 恢复剪刀可拖动
    if (this._scissorsGroup) {
      this._scissorsGroup.style.pointerEvents = 'auto';
      this._scissorsGroup.style.opacity = '1';
      this._scissorsGroup.style.cursor = 'grab';
    }

    // ---- 清除火花 ----
    if (this._sparkGroup) {
      this._sparkGroup.innerHTML = '';
    }

    return this;
  }

  /**
   * 销毁组件：解绑事件、清空容器
   */
  destroy() {
    this._unbindEvents();
    this.container.innerHTML = '';
  }

  // ============================================================
  // SVG 构建
  // ============================================================

  /**
   * 创建完整的 SVG DOM 结构
   * @private
   */
  _createSVG() {
    this.container.innerHTML = '';

    const ns = 'http://www.w3.org/2000/svg';
    const { LINE_X_LEFT, LINE_X_RIGHT, LINE_X_MID, LINE_Y, SCISSORS_Y } = ScissorsLine;

    // ---- 主 SVG ----
    this._svg = document.createElementNS(ns, 'svg');
    this._svg.setAttribute('viewBox', `0 0 ${ScissorsLine.VIEW_BOX_W} ${ScissorsLine.VIEW_BOX_H}`);
    this._svg.setAttribute('width', '100%');
    this._svg.setAttribute('height', '100%');
    this._svg.style.display = 'block';
    this._svg.style.overflow = 'visible';
    this._svg.classList.add('scissors-line-svg');
    this._svg.style.setProperty('--scissors-color', `var(${this._colorVar})`);

    // ---- 1) 完整虚线（初始可见） ----
    this._lineFull = document.createElementNS(ns, 'path');
    this._lineFull.setAttribute('d', 'M 50 50 Q 150 20 250 50');
    this._lineFull.setAttribute('fill', 'none');
    this._lineFull.setAttribute('stroke', `var(${this._colorVar})`);
    this._lineFull.setAttribute('stroke-width', '3');
    this._lineFull.setAttribute('stroke-dasharray', '8, 5');
    this._lineFull.setAttribute('stroke-linecap', 'round');
    this._lineFull.classList.add('scissors-line-full');
    this._svg.appendChild(this._lineFull);

    // ---- 2) 左半断线（初始透明） ----
    this._lineBrokenLeft = document.createElementNS(ns, 'path');
    this._lineBrokenLeft.setAttribute('d', 'M 50 50 Q 100 35 150 50');
    this._lineBrokenLeft.setAttribute('fill', 'none');
    this._lineBrokenLeft.setAttribute('stroke', `var(${this._colorVar})`);
    this._lineBrokenLeft.setAttribute('stroke-width', '3');
    this._lineBrokenLeft.setAttribute('stroke-dasharray', '8, 5');
    this._lineBrokenLeft.setAttribute('stroke-linecap', 'round');
    this._lineBrokenLeft.style.opacity = '0';
    this._lineBrokenLeft.style.transformOrigin = `${LINE_X_MID}px ${LINE_Y}px`;
    this._lineBrokenLeft.classList.add('scissors-line-broken-left');
    this._svg.appendChild(this._lineBrokenLeft);

    // ---- 3) 右半断线（初始透明） ----
    this._lineBrokenRight = document.createElementNS(ns, 'path');
    this._lineBrokenRight.setAttribute('d', 'M 150 50 Q 200 35 250 50');
    this._lineBrokenRight.setAttribute('fill', 'none');
    this._lineBrokenRight.setAttribute('stroke', `var(${this._colorVar})`);
    this._lineBrokenRight.setAttribute('stroke-width', '3');
    this._lineBrokenRight.setAttribute('stroke-dasharray', '8, 5');
    this._lineBrokenRight.setAttribute('stroke-linecap', 'round');
    this._lineBrokenRight.style.opacity = '0';
    this._lineBrokenRight.style.transformOrigin = `${LINE_X_MID}px ${LINE_Y}px`;
    this._lineBrokenRight.classList.add('scissors-line-broken-right');
    this._svg.appendChild(this._lineBrokenRight);

    // ---- 4) 剪刀图标组 ----
    this._scissorsGroup = document.createElementNS(ns, 'g');
    this._scissorsGroup.classList.add('scissors-line-scissors');
    this._scissorsGroup.style.cursor = 'grab';
    this._scissorsGroup.style.pointerEvents = 'auto';
    this._scissorsGroup.style.opacity = '1';

    // 4a) 不可见的宽大点击区域，方便移动端触摸
    const hitArea = document.createElementNS(ns, 'rect');
    hitArea.setAttribute('x', '-18');
    hitArea.setAttribute('y', '-18');
    hitArea.setAttribute('width', '36');
    hitArea.setAttribute('height', '32');
    hitArea.setAttribute('fill', 'transparent');
    this._scissorsGroup.appendChild(hitArea);

    // 4b) 剪刀左把手（圆环）
    const leftRing = document.createElementNS(ns, 'circle');
    leftRing.setAttribute('cx', '-8');
    leftRing.setAttribute('cy', '5');
    leftRing.setAttribute('r', '4');
    leftRing.setAttribute('fill', 'none');
    leftRing.setAttribute('stroke', `var(${this._colorVar})`);
    leftRing.setAttribute('stroke-width', '2.5');
    this._scissorsGroup.appendChild(leftRing);

    // 4c) 剪刀右把手（圆环）
    const rightRing = document.createElementNS(ns, 'circle');
    rightRing.setAttribute('cx', '8');
    rightRing.setAttribute('cy', '5');
    rightRing.setAttribute('r', '4');
    rightRing.setAttribute('fill', 'none');
    rightRing.setAttribute('stroke', `var(${this._colorVar})`);
    rightRing.setAttribute('stroke-width', '2.5');
    this._scissorsGroup.appendChild(rightRing);

    // 4d) 剪刀左刀片（交叉到右侧）
    const leftBlade = document.createElementNS(ns, 'line');
    leftBlade.setAttribute('x1', '-8');
    leftBlade.setAttribute('y1', '5');
    leftBlade.setAttribute('x2', '5');
    leftBlade.setAttribute('y2', '-16');
    leftBlade.setAttribute('stroke', `var(${this._colorVar})`);
    leftBlade.setAttribute('stroke-width', '3');
    leftBlade.setAttribute('stroke-linecap', 'round');
    this._scissorsGroup.appendChild(leftBlade);

    // 4e) 剪刀右刀片（交叉到左侧）
    const rightBlade = document.createElementNS(ns, 'line');
    rightBlade.setAttribute('x1', '8');
    rightBlade.setAttribute('y1', '5');
    rightBlade.setAttribute('x2', '-5');
    rightBlade.setAttribute('y2', '-16');
    rightBlade.setAttribute('stroke', `var(${this._colorVar})`);
    rightBlade.setAttribute('stroke-width', '3');
    rightBlade.setAttribute('stroke-linecap', 'round');
    this._scissorsGroup.appendChild(rightBlade);

    // 4f) 剪刀中轴螺丝
    const pivot = document.createElementNS(ns, 'circle');
    pivot.setAttribute('cx', '0');
    pivot.setAttribute('cy', '-3');
    pivot.setAttribute('r', '2.5');
    pivot.setAttribute('fill', '#fff');
    pivot.setAttribute('stroke', `var(${this._colorVar})`);
    pivot.setAttribute('stroke-width', '2');
    this._scissorsGroup.appendChild(pivot);

    this._svg.appendChild(this._scissorsGroup);

    // ---- 5) 火花容器 ----
    this._sparkGroup = document.createElementNS(ns, 'g');
    this._sparkGroup.classList.add('scissors-line-sparks');
    this._svg.appendChild(this._sparkGroup);

    this.container.appendChild(this._svg);
  }

  // ============================================================
  // 事件绑定 / 解绑
  // ============================================================

  /**
   * 绑定触摸和鼠标事件
   * @private
   */
  _bindEvents() {
    // 触摸事件（移动端）
    this._scissorsGroup.addEventListener('touchstart', this._boundHandlers.touchStart, { passive: false });
    document.addEventListener('touchmove', this._boundHandlers.touchMove, { passive: false });
    document.addEventListener('touchend', this._boundHandlers.touchEnd, { passive: false });

    // 鼠标事件（PC 调试）
    this._scissorsGroup.addEventListener('mousedown', this._boundHandlers.mouseDown);
  }

  /**
   * 解绑所有事件
   * @private
   */
  _unbindEvents() {
    this._scissorsGroup.removeEventListener('touchstart', this._boundHandlers.touchStart);
    document.removeEventListener('touchmove', this._boundHandlers.touchMove);
    document.removeEventListener('touchend', this._boundHandlers.touchEnd);

    this._scissorsGroup.removeEventListener('mousedown', this._boundHandlers.mouseDown);
    document.removeEventListener('mousemove', this._boundHandlers.mouseMove);
    document.removeEventListener('mouseup', this._boundHandlers.mouseUp);
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
    if (this._cut) return;
    e.preventDefault();
    const touch = e.touches[0];
    this._startDrag(touch.clientX);
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
    this._onDrag(touch.clientX);
  }

  /**
   * touchend 处理
   * @param {TouchEvent} e
   * @private
   */
  _onTouchEnd(/* e */) {
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
    if (this._cut) return;
    e.preventDefault();
    this._startDrag(e.clientX);

    // 在 document 上监听 move/up，确保鼠标移出元素也能捕获
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
    this._onDrag(e.clientX);
  }

  /**
   * mouseup 处理
   * @param {MouseEvent} e
   * @private
   */
  _onMouseUp(/* e */) {
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
   * @param {number} clientX - 起始指针 X（视口坐标）
   * @private
   */
  _startDrag(clientX) {
    this._dragging = true;
    this._startPointerX = clientX;
    this._startScissorsX = this._scissorsX;
    this._scissorsGroup.style.cursor = 'grabbing';
  }

  /**
   * 拖拽中：更新剪刀位置，检测是否触发剪断
   * @param {number} clientX - 当前指针 X（视口坐标）
   * @private
   */
  _onDrag(clientX) {
    if (!this._dragging || this._cut) return;

    // 将视口坐标的增量换算为 SVG viewBox 坐标的增量
    const rect = this.container.getBoundingClientRect();
    const dxViewport = clientX - this._startPointerX;
    const dxSVG = (dxViewport / rect.width) * ScissorsLine.VIEW_BOX_W;

    // 计算新 X，并限制在 [LINE_X_LEFT, LINE_X_RIGHT] 范围内
    const newX = Math.max(
      ScissorsLine.LINE_X_LEFT,
      Math.min(ScissorsLine.LINE_X_RIGHT, this._startScissorsX + dxSVG)
    );

    this._updateScissorsPosition(newX);

    // 检测是否越过中线
    if (newX >= ScissorsLine.LINE_X_MID) {
      this._triggerCut();
    }
  }

  /**
   * 结束拖拽
   * @private
   */
  _endDrag() {
    this._dragging = false;
    this._scissorsGroup.style.cursor = 'grab';
  }

  /**
   * 更新剪刀图标在 SVG 中的位置
   * @param {number} x - SVG viewBox X 坐标
   * @private
   */
  _updateScissorsPosition(x) {
    this._scissorsX = x;
    this._scissorsGroup.setAttribute('transform', `translate(${x}, ${ScissorsLine.SCISSORS_Y})`);
  }

  // ============================================================
  // 剪断动画
  // ============================================================

  /**
   * 触发剪断动画序列：
   *   1) 完整虚线闪烁一次
   *   2) 完整虚线隐藏，两段断线显示
   *   3) 断线向两侧弹开（left 向左下，right 向右上），各旋转少量角度
   *   4) 在剪断点添加 1-2 个火花粒子，随后淡出
   *   5) 触发 onCut 回调
   * @private
   */
  _triggerCut() {
    if (this._cut) return;
    this._cut = true;

    // 禁用剪刀可拖动状态
    this._scissorsGroup.style.pointerEvents = 'none';
    this._scissorsGroup.style.cursor = 'default';

    // ---- 阶段 1：闪烁 ----
    this._lineFull.style.transition = 'opacity 0.08s ease';
    this._lineFull.style.opacity = '0';

    setTimeout(() => {
      this._lineFull.style.opacity = '1';
    }, 80);

    // ---- 阶段 2：隐藏完整线，显示断线，弹开动画 ----
    setTimeout(() => {
      // 隐藏完整线
      this._lineFull.style.transition = 'opacity 0.15s ease';
      this._lineFull.style.opacity = '0';

      // 显示断线
      this._lineBrokenLeft.style.transition = 'none';
      this._lineBrokenLeft.style.opacity = '1';
      this._lineBrokenRight.style.transition = 'none';
      this._lineBrokenRight.style.opacity = '1';

      // 在下一帧触发弹开动画（确保 opacity 已生效）
      requestAnimationFrame(() => {
        this._lineBrokenLeft.style.transition =
          'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        this._lineBrokenRight.style.transition =
          'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';

        // left 向左下弹开，right 向右上弹开，各旋转少量角度
        this._lineBrokenLeft.style.transform = 'translate(-25px, 18px) rotate(-10deg)';
        this._lineBrokenRight.style.transform = 'translate(25px, -18px) rotate(10deg)';
      });

      // 创建火花粒子
      this._createSparks(ScissorsLine.LINE_X_MID, ScissorsLine.LINE_Y);

      // 触发回调
      if (typeof this._cutCallback === 'function') {
        // 用 setTimeout 让回调异步执行，不阻塞动画
        setTimeout(() => {
          this._cutCallback();
        }, 0);
      }
    }, 180);
  }

  // ============================================================
  // 火花粒子效果
  // ============================================================

  /**
   * 在指定位置创建 1-2 个火花装饰粒子，随即向外扩散并淡出
   * @param {number} x - SVG viewBox X
   * @param {number} y - SVG viewBox Y
   * @private
   */
  _createSparks(x, y) {
    const ns = 'http://www.w3.org/2000/svg';
    const sparkCount = 1 + Math.floor(Math.random() * 2); // 1 或 2

    for (let i = 0; i < sparkCount; i++) {
      const spark = document.createElementNS(ns, 'circle');
      const r = 2 + Math.random() * 3; // 半径 2~5
      spark.setAttribute('cx', x);
      spark.setAttribute('cy', y);
      spark.setAttribute('r', String(r));
      spark.setAttribute('fill', 'none');
      spark.setAttribute('stroke', `var(${this._colorVar})`);
      spark.setAttribute('stroke-width', '1.5');
      spark.style.opacity = '1';

      this._sparkGroup.appendChild(spark);

      // 随机扩散方向与距离
      const angle = Math.random() * Math.PI * 2;
      const distance = 12 + Math.random() * 20;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      // 下一帧触发动画
      requestAnimationFrame(() => {
        spark.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
        spark.style.transform = `translate(${tx}px, ${ty}px)`;
        spark.style.opacity = '0';
      });

      // 动画结束后移除 DOM 元素
      setTimeout(() => {
        spark.remove();
      }, 600);
    }
  }

  // ============================================================
  // 静态样式注入
  // ============================================================

  /**
   * 确保组件样式已注入到页面（仅在首次调用时注入）
   * @private
   */
  static _ensureStyles() {
    if (ScissorsLine._stylesInjected) return;
    ScissorsLine._stylesInjected = true;

    const style = document.createElement('style');
    style.textContent = `
      /* ---- ScissorsLine 容器基础样式 ---- */
      .scissors-line-svg {
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
      }

      /* ---- 剪刀拖动状态 ---- */
      .scissors-line-scissors {
        transition: opacity 0.3s ease;
        will-change: transform;
      }

      /* ---- 断线弹开过渡（由 JS 控制 transition） ---- */
      .scissors-line-broken-left,
      .scissors-line-broken-right {
        will-change: transform, opacity;
      }
    `;

    document.head.appendChild(style);
  }
}

// ============================================================
// 暴露到全局
// ============================================================

window.ScissorsLine = ScissorsLine;