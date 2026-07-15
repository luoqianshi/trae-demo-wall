'use strict';

/**
 * VerticalScissorsLine - 竖向课题分离剪连线剪断交互组件
 *
 * 实现一条竖向虚线连接上下两个端点，用户沿竖向拖动剪刀图标，
 * 当剪刀越过中线时触发剪断动画，并调用 onCut 回调。
 */
class VerticalScissorsLine {
  /** @type {number} SVG viewBox 宽度 */
  static VIEW_BOX_W = 120;
  /** @type {number} SVG viewBox 高度 */
  static VIEW_BOX_H = 300;
  /** @type {number} 连线上端点 Y */
  static LINE_Y_TOP = 50;
  /** @type {number} 连线下端点 Y */
  static LINE_Y_BOTTOM = 250;
  /** @type {number} 中线 Y（剪断触发点） */
  static LINE_Y_MID = 150;
  /** @type {number} 连线 X 坐标 */
  static LINE_X = 60;
  /** @type {number} 剪刀图标 X 坐标（刀片交叉点与连线对齐） */
  static SCISSORS_X = 52;

  /** @private 样式是否已注入 */
  static _stylesInjected = false;

  /**
   * @param {HTMLElement} container - 容器 DOM 元素
   * @param {Object}      [options]          - 配置项
   * @param {Function}    [options.onCut]    - 剪断成功回调
   * @param {string}      [options.colorVar] - CSS 颜色变量名，默认 '--brand-accent'
   */
  constructor(container, options = {}) {
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error('[VerticalScissorsLine] 有效的容器元素(container)是必需的');
    }

    this.container = container;
    this._cutCallback = typeof options.onCut === 'function' ? options.onCut : null;
    this._colorVar = options.colorVar || '--brand-accent';

    this._svg = null;
    this._lineFull = null;
    this._lineBrokenTop = null;
    this._lineBrokenBottom = null;
    this._scissorsGroup = null;
    this._sparkGroup = null;

    this._cut = false;
    this._dragging = false;
    this._scissorsY = VerticalScissorsLine.LINE_Y_TOP;
    this._startPointerY = 0;
    this._startScissorsY = 0;

    this.constructor._ensureStyles();

    this._boundHandlers = {
      touchStart: this._onTouchStart.bind(this),
      touchMove:  this._onTouchMove.bind(this),
      touchEnd:   this._onTouchEnd.bind(this),
      mouseDown:  this._onMouseDown.bind(this),
      mouseMove:  this._onMouseMove.bind(this),
      mouseUp:    this._onMouseUp.bind(this),
    };
  }

  render() {
    this._createSVG();
    this._bindEvents();
    this._updateScissorsPosition(VerticalScissorsLine.LINE_Y_TOP);
    return this;
  }

  onCut(callback) {
    this._cutCallback = typeof callback === 'function' ? callback : null;
    return this;
  }

  reset() {
    this._cut = false;
    this._dragging = false;

    if (this._lineFull) {
      this._lineFull.style.transition = 'opacity 0.3s ease';
      this._lineFull.style.opacity = '1';
    }
    if (this._lineBrokenTop) {
      this._lineBrokenTop.style.transition = 'none';
      this._lineBrokenTop.style.opacity = '0';
      this._lineBrokenTop.style.transform = 'none';
    }
    if (this._lineBrokenBottom) {
      this._lineBrokenBottom.style.transition = 'none';
      this._lineBrokenBottom.style.opacity = '0';
      this._lineBrokenBottom.style.transform = 'none';
    }

    this._scissorsY = VerticalScissorsLine.LINE_Y_TOP;
    this._updateScissorsPosition(VerticalScissorsLine.LINE_Y_TOP);

    if (this._scissorsGroup) {
      this._scissorsGroup.style.pointerEvents = 'auto';
      this._scissorsGroup.style.opacity = '1';
      this._scissorsGroup.style.cursor = 'grab';
    }

    if (this._sparkGroup) {
      this._sparkGroup.innerHTML = '';
    }

    return this;
  }

  destroy() {
    this._unbindEvents();
    this.container.innerHTML = '';
  }

  _createSVG() {
    this.container.innerHTML = '';

    const ns = 'http://www.w3.org/2000/svg';
    const { LINE_X, LINE_Y_TOP, LINE_Y_BOTTOM, LINE_Y_MID, SCISSORS_X } = VerticalScissorsLine;

    this._svg = document.createElementNS(ns, 'svg');
    this._svg.setAttribute('viewBox', `0 0 ${VerticalScissorsLine.VIEW_BOX_W} ${VerticalScissorsLine.VIEW_BOX_H}`);
    this._svg.setAttribute('width', '100%');
    this._svg.setAttribute('height', '100%');
    this._svg.style.display = 'block';
    this._svg.style.overflow = 'visible';
    this._svg.classList.add('vertical-scissors-line-svg');
    this._svg.style.setProperty('--scissors-color', `var(${this._colorVar})`);

    // 完整虚线
    this._lineFull = document.createElementNS(ns, 'path');
    this._lineFull.setAttribute('d', `M ${LINE_X} ${LINE_Y_TOP} Q ${LINE_X + 30} ${LINE_Y_MID} ${LINE_X} ${LINE_Y_BOTTOM}`);
    this._lineFull.setAttribute('fill', 'none');
    this._lineFull.setAttribute('stroke', `var(${this._colorVar})`);
    this._lineFull.setAttribute('stroke-width', '3');
    this._lineFull.setAttribute('stroke-dasharray', '8, 5');
    this._lineFull.setAttribute('stroke-linecap', 'round');
    this._lineFull.classList.add('vertical-scissors-line-full');
    this._svg.appendChild(this._lineFull);

    // 上半断线
    this._lineBrokenTop = document.createElementNS(ns, 'path');
    this._lineBrokenTop.setAttribute('d', `M ${LINE_X} ${LINE_Y_TOP} Q ${LINE_X + 15} ${(LINE_Y_TOP + LINE_Y_MID) / 2} ${LINE_X} ${LINE_Y_MID}`);
    this._lineBrokenTop.setAttribute('fill', 'none');
    this._lineBrokenTop.setAttribute('stroke', `var(${this._colorVar})`);
    this._lineBrokenTop.setAttribute('stroke-width', '3');
    this._lineBrokenTop.setAttribute('stroke-dasharray', '8, 5');
    this._lineBrokenTop.setAttribute('stroke-linecap', 'round');
    this._lineBrokenTop.style.opacity = '0';
    this._lineBrokenTop.style.transformOrigin = `${LINE_X}px ${LINE_Y_MID}px`;
    this._lineBrokenTop.classList.add('vertical-scissors-line-broken-top');
    this._svg.appendChild(this._lineBrokenTop);

    // 下半断线
    this._lineBrokenBottom = document.createElementNS(ns, 'path');
    this._lineBrokenBottom.setAttribute('d', `M ${LINE_X} ${LINE_Y_MID} Q ${LINE_X + 15} ${(LINE_Y_MID + LINE_Y_BOTTOM) / 2} ${LINE_X} ${LINE_Y_BOTTOM}`);
    this._lineBrokenBottom.setAttribute('fill', 'none');
    this._lineBrokenBottom.setAttribute('stroke', `var(${this._colorVar})`);
    this._lineBrokenBottom.setAttribute('stroke-width', '3');
    this._lineBrokenBottom.setAttribute('stroke-dasharray', '8, 5');
    this._lineBrokenBottom.setAttribute('stroke-linecap', 'round');
    this._lineBrokenBottom.style.opacity = '0';
    this._lineBrokenBottom.style.transformOrigin = `${LINE_X}px ${LINE_Y_MID}px`;
    this._lineBrokenBottom.classList.add('vertical-scissors-line-broken-bottom');
    this._svg.appendChild(this._lineBrokenBottom);

    // 剪刀图标组（旋转 90°，使剪刀沿竖向）
    this._scissorsGroup = document.createElementNS(ns, 'g');
    this._scissorsGroup.classList.add('vertical-scissors-line-scissors');
    this._scissorsGroup.style.cursor = 'grab';
    this._scissorsGroup.style.pointerEvents = 'auto';
    this._scissorsGroup.style.opacity = '1';

    const hitArea = document.createElementNS(ns, 'rect');
    hitArea.setAttribute('x', '-18');
    hitArea.setAttribute('y', '-18');
    hitArea.setAttribute('width', '32');
    hitArea.setAttribute('height', '36');
    hitArea.setAttribute('fill', 'transparent');
    this._scissorsGroup.appendChild(hitArea);

    // 剪刀图形（已在 HorizontalScissorsLine 中验证，旋转 90° 后沿竖向）
    const leftRing = document.createElementNS(ns, 'circle');
    leftRing.setAttribute('cx', '-8');
    leftRing.setAttribute('cy', '5');
    leftRing.setAttribute('r', '4');
    leftRing.setAttribute('fill', 'none');
    leftRing.setAttribute('stroke', `var(${this._colorVar})`);
    leftRing.setAttribute('stroke-width', '2.5');
    this._scissorsGroup.appendChild(leftRing);

    const rightRing = document.createElementNS(ns, 'circle');
    rightRing.setAttribute('cx', '8');
    rightRing.setAttribute('cy', '5');
    rightRing.setAttribute('r', '4');
    rightRing.setAttribute('fill', 'none');
    rightRing.setAttribute('stroke', `var(${this._colorVar})`);
    rightRing.setAttribute('stroke-width', '2.5');
    this._scissorsGroup.appendChild(rightRing);

    const leftBlade = document.createElementNS(ns, 'line');
    leftBlade.setAttribute('x1', '-8');
    leftBlade.setAttribute('y1', '5');
    leftBlade.setAttribute('x2', '5');
    leftBlade.setAttribute('y2', '-16');
    leftBlade.setAttribute('stroke', `var(${this._colorVar})`);
    leftBlade.setAttribute('stroke-width', '3');
    leftBlade.setAttribute('stroke-linecap', 'round');
    this._scissorsGroup.appendChild(leftBlade);

    const rightBlade = document.createElementNS(ns, 'line');
    rightBlade.setAttribute('x1', '8');
    rightBlade.setAttribute('y1', '5');
    rightBlade.setAttribute('x2', '-5');
    rightBlade.setAttribute('y2', '-16');
    rightBlade.setAttribute('stroke', `var(${this._colorVar})`);
    rightBlade.setAttribute('stroke-width', '3');
    rightBlade.setAttribute('stroke-linecap', 'round');
    this._scissorsGroup.appendChild(rightBlade);

    const pivot = document.createElementNS(ns, 'circle');
    pivot.setAttribute('cx', '0');
    pivot.setAttribute('cy', '-3');
    pivot.setAttribute('r', '2.5');
    pivot.setAttribute('fill', '#fff');
    pivot.setAttribute('stroke', `var(${this._colorVar})`);
    pivot.setAttribute('stroke-width', '2');
    this._scissorsGroup.appendChild(pivot);

    this._svg.appendChild(this._scissorsGroup);

    this._sparkGroup = document.createElementNS(ns, 'g');
    this._sparkGroup.classList.add('vertical-scissors-line-sparks');
    this._svg.appendChild(this._sparkGroup);

    this.container.appendChild(this._svg);
  }

  _bindEvents() {
    this._scissorsGroup.addEventListener('touchstart', this._boundHandlers.touchStart, { passive: false });
    document.addEventListener('touchmove', this._boundHandlers.touchMove, { passive: false });
    document.addEventListener('touchend', this._boundHandlers.touchEnd, { passive: false });
    this._scissorsGroup.addEventListener('mousedown', this._boundHandlers.mouseDown);
  }

  _unbindEvents() {
    this._scissorsGroup.removeEventListener('touchstart', this._boundHandlers.touchStart);
    document.removeEventListener('touchmove', this._boundHandlers.touchMove);
    document.removeEventListener('touchend', this._boundHandlers.touchEnd);
    this._scissorsGroup.removeEventListener('mousedown', this._boundHandlers.mouseDown);
    document.removeEventListener('mousemove', this._boundHandlers.mouseMove);
    document.removeEventListener('mouseup', this._boundHandlers.mouseUp);
  }

  _onTouchStart(e) {
    if (this._cut) return;
    e.preventDefault();
    const touch = e.touches[0];
    this._startDrag(touch.clientY);
  }

  _onTouchMove(e) {
    if (!this._dragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    this._onDrag(touch.clientY);
  }

  _onTouchEnd() {
    if (!this._dragging) return;
    this._endDrag();
  }

  _onMouseDown(e) {
    if (this._cut) return;
    e.preventDefault();
    this._startDrag(e.clientY);
    document.addEventListener('mousemove', this._boundHandlers.mouseMove);
    document.addEventListener('mouseup', this._boundHandlers.mouseUp);
  }

  _onMouseMove(e) {
    if (!this._dragging) return;
    e.preventDefault();
    this._onDrag(e.clientY);
  }

  _onMouseUp() {
    if (!this._dragging) return;
    document.removeEventListener('mousemove', this._boundHandlers.mouseMove);
    document.removeEventListener('mouseup', this._boundHandlers.mouseUp);
    this._endDrag();
  }

  _startDrag(clientY) {
    this._dragging = true;
    this._startPointerY = clientY;
    this._startScissorsY = this._scissorsY;
    this._scissorsGroup.style.cursor = 'grabbing';
  }

  _onDrag(clientY) {
    if (!this._dragging || this._cut) return;

    const rect = this.container.getBoundingClientRect();
    const dyViewport = clientY - this._startPointerY;
    const dySVG = (dyViewport / rect.height) * VerticalScissorsLine.VIEW_BOX_H;

    const newY = Math.max(
      VerticalScissorsLine.LINE_Y_TOP,
      Math.min(VerticalScissorsLine.LINE_Y_BOTTOM, this._startScissorsY + dySVG)
    );

    this._updateScissorsPosition(newY);

    if (newY >= VerticalScissorsLine.LINE_Y_MID) {
      this._triggerCut();
    }
  }

  _endDrag() {
    this._dragging = false;
    this._scissorsGroup.style.cursor = 'grab';
  }

  _updateScissorsPosition(y) {
    this._scissorsY = y;
    // 旋转 90° 使剪刀沿竖向，且刀片朝上
    this._scissorsGroup.setAttribute(
      'transform',
      `translate(${VerticalScissorsLine.SCISSORS_X}, ${y}) rotate(90)`
    );
  }

  _triggerCut() {
    if (this._cut) return;
    this._cut = true;

    this._scissorsGroup.style.pointerEvents = 'none';
    this._scissorsGroup.style.cursor = 'default';

    // 阶段 1：完整线闪烁
    this._lineFull.style.transition = 'opacity 0.12s ease';
    this._lineFull.style.opacity = '0';

    setTimeout(() => {
      this._lineFull.style.opacity = '1';
    }, 120);

    // 阶段 2：隐藏完整线，显示断线并弹开（放慢动画）
    setTimeout(() => {
      this._lineFull.style.transition = 'opacity 0.25s ease';
      this._lineFull.style.opacity = '0';

      this._lineBrokenTop.style.transition = 'none';
      this._lineBrokenTop.style.opacity = '1';
      this._lineBrokenBottom.style.transition = 'none';
      this._lineBrokenBottom.style.opacity = '1';

      requestAnimationFrame(() => {
        this._lineBrokenTop.style.transition =
          'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)';
        this._lineBrokenBottom.style.transition =
          'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)';

        // 上半向左上弹开，下半向右下弹开
        this._lineBrokenTop.style.transform = 'translate(-18px, -25px) rotate(-10deg)';
        this._lineBrokenBottom.style.transform = 'translate(18px, 25px) rotate(10deg)';
      });

      this._createSparks(VerticalScissorsLine.LINE_X, VerticalScissorsLine.LINE_Y_MID);

      if (typeof this._cutCallback === 'function') {
        setTimeout(() => {
          this._cutCallback();
        }, 150);
      }
    }, 300);
  }

  _createSparks(x, y) {
    const ns = 'http://www.w3.org/2000/svg';
    const sparkCount = 1 + Math.floor(Math.random() * 2);

    for (let i = 0; i < sparkCount; i++) {
      const spark = document.createElementNS(ns, 'circle');
      const r = 2 + Math.random() * 3;
      spark.setAttribute('cx', x);
      spark.setAttribute('cy', y);
      spark.setAttribute('r', String(r));
      spark.setAttribute('fill', 'none');
      spark.setAttribute('stroke', `var(${this._colorVar})`);
      spark.setAttribute('stroke-width', '1.5');
      spark.style.opacity = '1';

      this._sparkGroup.appendChild(spark);

      const angle = Math.random() * Math.PI * 2;
      const distance = 12 + Math.random() * 20;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      requestAnimationFrame(() => {
        spark.style.transition = 'transform 0.7s ease-out, opacity 0.7s ease-out';
        spark.style.transform = `translate(${tx}px, ${ty}px)`;
        spark.style.opacity = '0';
      });

      setTimeout(() => {
        spark.remove();
      }, 800);
    }
  }

  static _ensureStyles() {
    if (VerticalScissorsLine._stylesInjected) return;
    VerticalScissorsLine._stylesInjected = true;

    const style = document.createElement('style');
    style.textContent = `
      .vertical-scissors-line-svg {
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
      }
      .vertical-scissors-line-scissors {
        transition: opacity 0.3s ease;
        will-change: transform;
      }
      .vertical-scissors-line-broken-top,
      .vertical-scissors-line-broken-bottom {
        will-change: transform, opacity;
      }
    `;
    document.head.appendChild(style);
  }
}

window.VerticalScissorsLine = VerticalScissorsLine;
