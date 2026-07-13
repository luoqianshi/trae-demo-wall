/**
 * BWT 粒子系统 - Canvas 基础粒子动画
 * 用于 BWT AI 助手 Hero 区域的背景装饰效果
 *
 * 特性：
 * - 粒子随机漂浮并在近距离时绘制连线
 * - 鼠标交互：附近粒子被吸引并绘制鼠标连线
 * - 移动端自动降级以提升性能
 * - 无外部依赖，纯 Canvas 2D 实现
 */

class BWTParticles {
  /**
   * @param {HTMLCanvasElement} canvas - 目标 canvas 元素
   * @param {Object} options - 配置项
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // ---------- 合并默认配置 ----------
    const defaults = {
      particleCount: 80,
      maxLineDistance: 150,
      mouseRadius: 200,
      mouseForce: 0.02,
      baseSpeed: 0.3,
      color: '#00D4AA',
      bgColor: '#0A0E1A',
    };

    this.config = Object.assign({}, defaults, options);

    // ---------- 移动端检测 ----------
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile) {
      this.config.particleCount = 30;
      this.config.mouseRadius = 0;   // 禁用鼠标交互
      this.config.mouseForce = 0;
    }

    // ---------- 状态 ----------
    this.particles = [];
    this.mouse = { x: null, y: null };
    this.animationId = null;
    this._boundResize = this._onResize.bind(this);
    this._boundMouseMove = this._onMouseMove.bind(this);
    this._boundMouseLeave = this._onMouseLeave.bind(this);

    // 初始化尺寸
    this._updateSize();

    // 创建粒子
    this._createParticles();
  }

  // ========================
  //  公共方法
  // ========================

  /** 启动动画循环并绑定事件 */
  init() {
    window.addEventListener('resize', this._boundResize);
    if (!this.isMobile) {
      this.canvas.addEventListener('mousemove', this._boundMouseMove);
      this.canvas.addEventListener('mouseleave', this._boundMouseLeave);
    }
    this._animate();
  }

  /** 停止动画并移除所有事件监听 */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    window.removeEventListener('resize', this._boundResize);
    if (!this.isMobile) {
      this.canvas.removeEventListener('mousemove', this._boundMouseMove);
      this.canvas.removeEventListener('mouseleave', this._boundMouseLeave);
    }
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // ========================
  //  私有方法 - 初始化
  // ========================

  /** 根据父容器自动检测并更新 canvas 尺寸 */
  _updateSize() {
    const parent = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;

    if (parent) {
      const rect = parent.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;
    } else {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    }

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(dpr, dpr);
  }

  /** 创建粒子数组 */
  _createParticles() {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(this._createParticle());
    }
  }

  /** 创建单个粒子对象 */
  _createParticle() {
    const minRadius = 1.5;
    const maxRadius = 3;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    const minOpacity = 0.2;
    const maxOpacity = 0.6;
    const opacity = minOpacity + Math.random() * (maxOpacity - minOpacity);
    const speed = 0.1 + Math.random() * (this.config.baseSpeed - 0.1);
    const angle = Math.random() * Math.PI * 2;

    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      opacity,
    };
  }

  // ========================
  //  私有方法 - 事件处理
  // ========================

  /** 窗口尺寸变化时更新 canvas 和粒子位置 */
  _onResize() {
    const oldWidth = this.width;
    const oldHeight = this.height;

    this._updateSize();

    // 按比例迁移粒子位置，避免粒子全部堆在角落
    const scaleX = this.width / oldWidth;
    const scaleY = this.height / oldHeight;
    for (const p of this.particles) {
      p.x *= scaleX;
      p.y *= scaleY;
    }
  }

  /** 鼠标移动事件 - 记录鼠标坐标 */
  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  }

  /** 鼠标离开画布时清除坐标 */
  _onMouseLeave() {
    this.mouse.x = null;
    this.mouse.y = null;
  }

  // ========================
  //  私有方法 - 动画循环
  // ========================

  /** 主动画循环 */
  _animate() {
    this._update();
    this._draw();
    this.animationId = requestAnimationFrame(() => this._animate());
  }

  /** 更新所有粒子位置 */
  _update() {
    for (const p of this.particles) {
      // ---- 鼠标吸引力 ----
      if (this.mouse.x !== null && this.config.mouseForce > 0) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.config.mouseRadius && dist > 0) {
          // 距离越近力越强，产生柔和吸引效果
          const force = this.config.mouseForce * (1 - dist / this.config.mouseRadius);
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      // ---- 速度阻尼：防止粒子因为鼠标力越跑越快 ----
      p.vx *= 0.99;
      p.vy *= 0.99;

      // ---- 确保最低速度（保持漂浮感） ----
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const minSpeed = 0.1;
      if (speed < minSpeed) {
        const angle = Math.atan2(p.vy, p.vx);
        p.vx = Math.cos(angle) * minSpeed;
        p.vy = Math.sin(angle) * minSpeed;
      }

      // ---- 更新位置 ----
      p.x += p.vx;
      p.y += p.vy;

      // ---- 屏幕边缘环绕 ----
      if (p.x < -10) p.x = this.width + 10;
      else if (p.x > this.width + 10) p.x = -10;

      if (p.y < -10) p.y = this.height + 10;
      else if (p.y > this.height + 10) p.y = -10;
    }
  }

  /** 绘制帧：背景 -> 连线 -> 粒子 */
  _draw() {
    const ctx = this.ctx;
    const maxDist = this.config.maxLineDistance;

    // 清除并填充背景
    ctx.fillStyle = this.config.bgColor;
    ctx.fillRect(0, 0, this.width, this.height);

    // ---- 粒子之间的连线 ----
    ctx.lineWidth = 0.6;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          // 透明度随距离线性衰减：从 0.15（最近）到 0（最远）
          const lineOpacity = 0.15 * (1 - dist / maxDist);
          ctx.strokeStyle = this._rgba(this.config.color, lineOpacity);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // ---- 鼠标到附近粒子的连线 ----
    if (this.mouse.x !== null && this.config.mouseRadius > 0) {
      for (const p of this.particles) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.config.mouseRadius) {
          // 鼠标连线比粒子间连线稍亮
          const lineOpacity = 0.25 * (1 - dist / this.config.mouseRadius);
          ctx.strokeStyle = this._rgba(this.config.color, lineOpacity);
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(this.mouse.x, this.mouse.y);
          ctx.stroke();
          ctx.lineWidth = 0.6; // 还原默认线宽
        }
      }
    }

    // ---- 绘制粒子 ----
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.radius), 0, Math.PI * 2);
      ctx.fillStyle = this._rgba(this.config.color, p.opacity);
      ctx.fill();
    }
  }

  // ========================
  //  工具方法
  // ========================

  /**
   * 将 hex 颜色 + 透明度转换为 rgba 字符串
   * @param {string} hex - 十六进制颜色，如 '#00D4AA'
   * @param {number} alpha - 透明度 0~1
   * @returns {string} rgba 颜色字符串
   */
  _rgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }
}

// 暴露到全局，方便非模块化引用
if (typeof window !== 'undefined') {
  window.BWTParticles = BWTParticles;
}
