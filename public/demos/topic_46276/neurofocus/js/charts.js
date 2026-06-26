/**
 * ================================================================
 * charts.js — NeuroFocus Canvas 渲染引擎 v2.0
 * ================================================================
 * 重构要点：
 * 1. RealtimeChart — 增强版多线条实时折线图（保留，优化样式）
 * 2. MultiChannelEEG — 4 通道 EEG 滚动波形图（TP9/TP10/AF7/AF8）
 * 3. HeroWave — 首页装饰波形（更克制）
 *
 * 特性：
 * - 高 DPI 适配
 * - 隐藏容器安全初始化
 * - 平滑曲线 + 渐变填充
 * - 多通道 EEG 连续滚动
 * ================================================================
 */

/**
 * 实时多线条折线图
 */
class RealtimeChart {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.maxPoints = options.maxPoints || 60;
    this.series = options.series || [];
    this.minY = options.minY ?? 0;
    this.maxY = options.maxY ?? 100;
    this.data = {};
    this.series.forEach(s => { this.data[s.key] = []; });
    this._setupCanvas();
    window.addEventListener('resize', () => this._setupCanvas());
  }

  _setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
    this.render();
  }

  _ensureCanvas() {
    if (!this.width || !this.height) this._setupCanvas();
  }

  push(point) {
    this.series.forEach(s => {
      if (point[s.key] !== undefined) {
        this.data[s.key].push(point[s.key]);
        if (this.data[s.key].length > this.maxPoints) this.data[s.key].shift();
      }
    });
    this.render();
  }

  clear() {
    this.series.forEach(s => { this.data[s.key] = []; });
    this.render();
  }

  render() {
    this._ensureCanvas();
    if (!this.width || !this.height) return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const padding = { top: 12, right: 16, bottom: 24, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    // 网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.font = '10px "SF Mono", "Cascadia Code", monospace';
    ctx.fillStyle = 'rgba(120, 144, 156, 0.6)';

    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (chartH / ySteps) * i;
      const val = this.maxY - ((this.maxY - this.minY) / ySteps) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(val), padding.left - 8, y + 3);
    }

    const xSteps = 6;
    for (let i = 0; i <= xSteps; i++) {
      const x = padding.left + (chartW / xSteps) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, h - padding.bottom);
      ctx.stroke();
    }

    // 数据线
    this.series.forEach(s => {
      const data = this.data[s.key];
      if (data.length < 2) return;
      const stepX = chartW / (this.maxPoints - 1);

      // 渐变填充
      ctx.beginPath();
      ctx.moveTo(padding.left, h - padding.bottom);
      for (let i = 0; i < data.length; i++) {
        const x = padding.left + i * stepX;
        const y = padding.top + chartH - (data[i] / this.maxY) * chartH;
        if (i === 0) ctx.lineTo(x, y);
        else {
          const prevX = padding.left + (i - 1) * stepX;
          const prevY = padding.top + chartH - (data[i - 1] / this.maxY) * chartH;
          ctx.quadraticCurveTo(prevX, prevY, (prevX + x) / 2, (prevY + y) / 2);
          ctx.lineTo(x, y);
        }
      }
      ctx.lineTo(padding.left + (data.length - 1) * stepX, h - padding.bottom);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
      grad.addColorStop(0, s.color + '25');
      grad.addColorStop(1, s.color + '00');
      ctx.fillStyle = grad;
      ctx.fill();

      // 线条
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (let i = 0; i < data.length; i++) {
        const x = padding.left + i * stepX;
        const y = padding.top + chartH - (data[i] / this.maxY) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else {
          const prevX = padding.left + (i - 1) * stepX;
          const prevY = padding.top + chartH - (data[i - 1] / this.maxY) * chartH;
          ctx.quadraticCurveTo(prevX, prevY, (prevX + x) / 2, (prevY + y) / 2);
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // 末端光点
      if (data.length > 0) {
        const lx = padding.left + (data.length - 1) * stepX;
        const ly = padding.top + chartH - (data[data.length - 1] / this.maxY) * chartH;
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(lx, ly, 6, 0, Math.PI * 2);
        ctx.fillStyle = s.color + '25';
        ctx.fill();
      }
    });
  }
}


/**
 * 多通道 EEG 滚动波形图
 * 显示 4 通道（TP9/TP10/AF7/AF8），连续滚动
 */
class MultiChannelEEG {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.channels = options.channels || Simulator.eegChannels;
    this._setupCanvas();
    window.addEventListener('resize', () => this._setupCanvas());
  }

  _setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  _ensureCanvas() {
    if (!this.width || !this.height) this._setupCanvas();
  }

  /**
   * 渲染多通道 EEG 波形
   * @param {Object} data - { TP9: [], TP10: [], AF7: [], AF8: [] }
   */
  render(data) {
    this._ensureCanvas();
    if (!this.width || !this.height) return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const channelCount = this.channels.length;
    const channelHeight = h / channelCount;
    const padding = { top: 4, right: 8, bottom: 4, left: 44 };

    ctx.clearRect(0, 0, w, h);

    this.channels.forEach((ch, idx) => {
      const waveData = data[ch.key];
      const centerY = channelHeight * idx + channelHeight / 2;
      const amplitude = channelHeight * 0.35;

      // 通道背景分隔
      if (idx > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, channelHeight * idx);
        ctx.lineTo(w, channelHeight * idx);
        ctx.stroke();
      }

      // 基线
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, centerY);
      ctx.lineTo(w - padding.right, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 通道标签
      ctx.font = '11px "SF Mono", "Cascadia Code", monospace';
      ctx.fillStyle = ch.color;
      ctx.textAlign = 'left';
      ctx.fillText(ch.label, 8, centerY + 4);

      // 波形
      if (!waveData || waveData.length < 2) return;
      const chartW = w - padding.left - padding.right;
      const stepX = chartW / (waveData.length - 1);

      ctx.beginPath();
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 1.2;
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.9;

      for (let i = 0; i < waveData.length; i++) {
        const x = padding.left + i * stepX;
        const y = centerY + waveData[i] * amplitude;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }
}


/**
 * 首页装饰波形（更克制）
 */
class HeroWave {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._tick = 0;
    this._setupCanvas();
    window.addEventListener('resize', () => this._setupCanvas());
  }

  _setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  render() {
    if (!this.width || !this.height) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    this._tick += 0.015;

    ctx.clearRect(0, 0, w, h);

    const waves = [
      { color: '#00e5ff', amp: 12, freq: 0.015, phase: 0, alpha: 0.4 },
      { color: '#7c4dff', amp: 8, freq: 0.025, phase: 1, alpha: 0.25 },
      { color: '#69f0ae', amp: 6, freq: 0.035, phase: 2, alpha: 0.15 }
    ];

    waves.forEach(wave => {
      ctx.beginPath();
      ctx.strokeStyle = wave.color;
      ctx.globalAlpha = wave.alpha;
      ctx.lineWidth = 1.5;
      const centerY = h * 0.5;
      for (let x = 0; x <= w; x += 2) {
        const y = centerY +
          Math.sin(x * wave.freq + this._tick + wave.phase) * wave.amp +
          Math.sin(x * wave.freq * 2.3 + this._tick * 1.5) * wave.amp * 0.3;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  start() {
    const loop = () => {
      this.render();
      this._rafId = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }
}
