/**
 * ============================================================
 * MiniGameCore v2 — 独立迷你游戏引擎
 * 功能：VFX粒子系统 + 程序化音效 + Canvas工具集
 * 设计原则：高内聚、低耦合，完全不依赖主线游戏代码
 * 调用方式：MiniGameCore.VFX.createExplosion(ctx, x, y, options)
 * ============================================================
 */
;(function() {
'use strict';

const MiniGameCore = {
  version: '2.0.0',

  // ============================================================
  // 1. VFX 特效引擎
  // ============================================================
  VFX: {
    // 粒子池
    _particles: [],

    /**
     * 创建爆炸特效（多层次）
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {object} opts
     */
    createExplosion(ctx, x, y, opts) {
      const {
        color = '#ffaa00',
        color2 = '#ff4400',
        color3 = '#ffffff',
        count = 40,
        speed = 200,
        size = 6,
        life = 0.8,
        shockwave = true
      } = opts || {};

      const particles = [];

      // 层1：冲击波（白色核心）
      if (shockwave) {
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2;
          particles.push({
            x, y, vx: Math.cos(a) * speed * 0.3, vy: Math.sin(a) * speed * 0.3,
            life: 0.3, maxLife: 0.3, size: 8 + i * 4, color: '#ffffff',
            type: 'shockwave', alpha: 0.8
          });
        }
      }

      // 层2：主爆炸粒子（混合颜色）
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = speed * (0.3 + Math.random() * 0.7);
        const col = i < count * 0.6 ? color : (i < count * 0.85 ? color2 : color3);
        particles.push({
          x, y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: life * (0.5 + Math.random() * 0.5),
          maxLife: life,
          size: size * (0.5 + Math.random() * 0.8),
          color: col,
          type: 'spark',
          gravity: 30 + Math.random() * 60,
          drag: 0.98
        });
      }

      // 层3：烟尘（半透明圆）
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = speed * 0.1 * Math.random();
        particles.push({
          x, y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd - 20,
          life: 1.0, maxLife: 1.0,
          size: 15 + Math.random() * 20,
          color: 'rgba(200, 180, 150, 0.3)',
          type: 'smoke',
          drag: 0.95
        });
      }

      this._particles.push(...particles);
      return particles;
    },

    /**
     * 创建拖尾粒子
     */
    createTrail(ctx, x, y, color, count) {
      for (let i = 0; i < (count || 3); i++) {
        this._particles.push({
          x: x + (Math.random() - 0.5) * 4,
          y: y + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 0.3, maxLife: 0.3,
          size: 2 + Math.random() * 3,
          color: color,
          type: 'trail',
          drag: 0.9
        });
      }
    },

    /**
     * 创建命中特效（火花散射）
     */
    createHitSparks(ctx, x, y, color) {
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 80 + Math.random() * 150;
        this._particles.push({
          x, y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 0.3, maxLife: 0.3,
          size: 2 + Math.random() * 3,
          color: color || '#ffdd44',
          type: 'spark',
          gravity: 100,
          drag: 0.95
        });
      }
    },

    /**
     * 创建气泡喷射
     */
    createBubbleBurst(ctx, x, y, count, color) {
      for (let i = 0; i < (count || 8); i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 30 + Math.random() * 80;
        this._particles.push({
          x, y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd - 40,
          life: 0.8, maxLife: 0.8,
          size: 2 + Math.random() * 4,
          color: color || 'rgba(150, 220, 255, 0.6)',
          type: 'bubble',
          gravity: -20,
          drag: 0.96,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 2 + Math.random() * 3
        });
      }
    },

    /**
     * 创建连击特效（屏幕闪光）
     */
    createComboFlash(ctx, W, H, comboCount) {
      const intensity = Math.min(comboCount / 30, 1);
      ctx.save();
      ctx.globalAlpha = 0.15 * intensity;
      ctx.fillStyle = comboCount >= 30 ? '#ff4444' : (comboCount >= 20 ? '#ffaa00' : '#ffdd44');
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // 边缘光
      ctx.save();
      const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.5);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0)');
      grad.addColorStop(0.85, `rgba(255,255,255,${0.3 * intensity})`);
      grad.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },

    /**
     * 更新所有粒子
     */
    updateParticles(dt) {
      for (let i = this._particles.length - 1; i >= 0; i--) {
        const p = this._particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.gravity) p.vy += p.gravity * dt;
        if (p.drag) { p.vx *= p.drag; p.vy *= p.drag; }
        if (p.wobble !== undefined) {
          p.wobble += p.wobbleSpeed * dt;
          p.x += Math.sin(p.wobble) * 15 * dt;
        }
        p.life -= dt;
        if (p.life <= 0) {
          this._particles.splice(i, 1);
        }
      }
    },

    /**
     * 渲染所有粒子
     */
    renderParticles(ctx) {
      ctx.save();
      this._particles.forEach(p => {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha * (p.alpha || 1);

        if (p.type === 'smoke') {
          // 烟雾：模糊圆
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + (1 - alpha) * 0.5), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'bubble') {
          // 气泡：空心圆+高光
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = p.color.replace('0.6', '0.15');
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          // 高光
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.beginPath();
          ctx.arc(p.x - p.size * 0.25, p.y - p.size * 0.25, p.size * 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'shockwave') {
          // 冲击波：光晕
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - alpha), 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // 默认火花
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.3 + 0.7 * alpha), 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
      ctx.restore();
    },

    /**
     * 清空粒子
     */
    clearParticles() {
      this._particles = [];
    }
  },

  // ============================================================
  // 2. 程序化音效引擎（完全独立，不依赖主线AudioSystem）
  // ============================================================
  Audio: {
    _ctx: null,
    _enabled: true,
    _masterVol: 0.3,

    _getCtx() {
      if (!this._ctx) {
        try {
          this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
          this._enabled = false;
        }
      }
      return this._ctx;
    },

    _resume() {
      const ctx = this._getCtx();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
    },

    /**
     * 播放鱼/敌人被击中音效
     */
    playHit(vol) {
      this._resume();
      if (!this._enabled) return;
      const ctx = this._getCtx();
      if (!ctx) return;
      const v = this._masterVol * (vol || 1);
      const now = ctx.currentTime;

      // 短促冲击
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
      gain.gain.setValueAtTime(v * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    },

    /**
     * 播放爆炸音效
     */
    playExplosion(vol) {
      this._resume();
      if (!this._enabled) return;
      const ctx = this._getCtx();
      if (!ctx) return;
      const v = this._masterVol * (vol || 1);
      const now = ctx.currentTime;

      // 低频轰隆
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
      gain.gain.setValueAtTime(v * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      // 噪声层
      const len = Math.ceil(ctx.sampleRate * 0.2);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(v * 0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      src.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      src.start(now);
    },

    /**
     * 播放鱼捕获/收集音效
     */
    playCatch(vol) {
      this._resume();
      if (!this._enabled) return;
      const ctx = this._getCtx();
      if (!ctx) return;
      const v = this._masterVol * (vol || 1);
      const now = ctx.currentTime;

      // 上升音
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(v * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    },

    /**
     * 播放连击音效
     */
    playCombo(vol) {
      this._resume();
      if (!this._enabled) return;
      const ctx = this._getCtx();
      if (!ctx) return;
      const v = this._masterVol * (vol || 1);
      const now = ctx.currentTime;

      // 和弦上升
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0, now + i * 0.06);
        gain.gain.linearRampToValueAtTime(v * 0.12, now + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.2);
      });
    },

    /**
     * 播放宝藏/收集音效
     */
    playTreasure(vol) {
      this._resume();
      if (!this._enabled) return;
      const ctx = this._getCtx();
      if (!ctx) return;
      const v = this._masterVol * (vol || 1);
      const now = ctx.currentTime;

      // 金币提示音
      [880, 1108, 1318, 1760].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(v * 0.2, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.3);
      });

      // 混响噪声
      const len = Math.ceil(ctx.sampleRate * 0.1);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(v * 0.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      src.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      src.start(now);
    },

    /**
     * 播放射击音效
     */
    playShoot(vol) {
      this._resume();
      if (!this._enabled) return;
      const ctx = this._getCtx();
      if (!ctx) return;
      const v = this._masterVol * (vol || 1);
      const now = ctx.currentTime;

      const len = Math.ceil(ctx.sampleRate * 0.08);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.01));
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(v * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2000, now);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
    },

    /**
     * 播放技能/升级音效
     */
    playPowerup(vol) {
      this._resume();
      if (!this._enabled) return;
      const ctx = this._getCtx();
      if (!ctx) return;
      const v = this._masterVol * (vol || 1);
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.3);
      gain.gain.setValueAtTime(v * 0.2, now);
      gain.gain.linearRampToValueAtTime(v * 0.15, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    },

    /**
     * 播放BOSS战警告
     */
    playBossWarning(vol) {
      this._resume();
      if (!this._enabled) return;
      const ctx = this._getCtx();
      if (!ctx) return;
      const v = this._masterVol * (vol || 1);
      const now = ctx.currentTime;

      [220, 220, 110, 110].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.3);
        gain.gain.setValueAtTime(0, now + i * 0.3);
        gain.gain.linearRampToValueAtTime(v * 0.2, now + i * 0.3 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.3 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.3);
        osc.stop(now + i * 0.3 + 0.25);
      });
    },

    /**
     * 设置主音量
     */
    setVolume(vol) {
      this._masterVol = Math.max(0, Math.min(1, vol));
    }
  },

  // ============================================================
  // 3. Canvas渲染工具集
  // ============================================================
  Canvas: {
    /**
     * 绘制发光文字（带shadow）
     */
    drawGlowText(ctx, text, x, y, color, size, glowColor) {
      ctx.save();
      ctx.shadowColor = glowColor || color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = color;
      ctx.font = `bold ${size}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 8;
      ctx.fillText(text, x, y);
      ctx.restore();
    },

    /**
     * 绘制玻璃面板（半透明圆角矩形）
     */
    drawGlassPanel(ctx, x, y, w, h, opts) {
      const {
        bgColor = 'rgba(0, 10, 30, 0.7)',
        borderColor = 'rgba(100, 200, 255, 0.3)',
        radius = 10,
        glow = false
      } = opts || {};

      ctx.save();
      ctx.fillStyle = bgColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;

      if (glow) {
        ctx.shadowColor = borderColor;
        ctx.shadowBlur = 20;
      }

      this._roundRect(ctx, x, y, w, h, radius);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 玻璃高光
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      this._roundRect(ctx, x, y, w, h, radius);
      ctx.fill();

      ctx.restore();
    },

    _roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    },

    /**
     * 绘制进度条（渐变色）
     */
    drawProgressBar(ctx, x, y, w, h, progress, color1, color2) {
      ctx.save();
      // 背景
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      this._roundRect(ctx, x, y, w, h, h/2);
      ctx.fill();

      // 前景
      if (progress > 0) {
        const grad = ctx.createLinearGradient(x, y, x + w * progress, y);
        grad.addColorStop(0, color1 || '#44aaff');
        grad.addColorStop(1, color2 || '#66ddff');
        ctx.fillStyle = grad;
        ctx.shadowColor = color1 || '#44aaff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        this._roundRect(ctx, x, y, Math.max(h, w * progress), h, h/2);
        ctx.fill();
      }
      ctx.restore();
    },

    /**
     * 绘制发光图标
     */
    drawIcon(ctx, cx, cy, size, type, color) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      switch(type) {
        case 'heart':
          ctx.beginPath();
          ctx.moveTo(0, size * 0.3);
          ctx.bezierCurveTo(-size * 0.3, -size * 0.2, -size, 0, 0, size * 0.5);
          ctx.bezierCurveTo(size, 0, size * 0.3, -size * 0.2, 0, size * 0.3);
          ctx.fill();
          break;
        case 'star':
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const a = -Math.PI/2 + i * Math.PI * 2/5;
            const r1 = i === 0 ? size * 0.5 : ((i % 2 === 0) ? size * 0.5 : size * 0.2);
            const method = i === 0 ? 'moveTo' : 'lineTo';
            ctx[method](Math.cos(a) * r1, Math.sin(a) * r1);
          }
          ctx.closePath();
          ctx.fill();
          break;
        case 'fish':
          ctx.beginPath();
          ctx.ellipse(0, 0, size * 0.5, size * 0.25, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(size * 0.4, 0);
          ctx.lineTo(size * 0.7, -size * 0.25);
          ctx.lineTo(size * 0.7, size * 0.25);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.arc(size * -0.15, -size * 0.08, size * 0.05, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          break;
        case 'shark':
          ctx.beginPath();
          ctx.moveTo(-size * 0.4, 0);
          ctx.quadraticCurveTo(0, -size * 0.3, size * 0.4, -size * 0.15);
          ctx.lineTo(size * 0.5, 0);
          ctx.lineTo(size * 0.4, size * 0.15);
          ctx.quadraticCurveTo(0, size * 0.3, -size * 0.4, 0);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(size * 0.4, -size * 0.15);
          ctx.lineTo(size * 0.7, -size * 0.3);
          ctx.lineTo(size * 0.5, -size * 0.1);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.arc(size * -0.1, -size * 0.05, size * 0.06, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          break;
        case 'sub':
          ctx.beginPath();
          ctx.ellipse(0, 0, size * 0.4, size * 0.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(0, -size * 0.05, size * 0.15, size * 0.12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(size * 0.15, 0, size * 0.06, 0, Math.PI * 2);
          ctx.fillStyle = '#aaddff';
          ctx.fill();
          break;
        case 'octopus':
          ctx.beginPath();
          ctx.arc(0, -size * 0.05, size * 0.3, 0, Math.PI * 2);
          ctx.fill();
          for (let i = 0; i < 6; i++) {
            const a = i * Math.PI / 3 + Math.PI/6;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * size * 0.25, Math.sin(a) * size * 0.25);
            ctx.quadraticCurveTo(
              Math.cos(a) * size * 0.4, Math.sin(a) * size * 0.45,
              Math.cos(a) * size * 0.5, Math.sin(a) * size * 0.5
            );
            ctx.lineWidth = size * 0.1;
            ctx.stroke();
          }
          break;
      }
      ctx.restore();
    }
  },

  // ============================================================
  // 4. 屏幕震动效果
  // ============================================================
  ScreenShake: {
    _intensity: 0,
    _duration: 0,
    _timer: 0,
    _offsetX: 0,
    _offsetY: 0,

    trigger(intensity, duration) {
      this._intensity = intensity;
      this._duration = duration;
      this._timer = duration;
    },

    update(dt) {
      if (this._timer > 0) {
        this._timer -= dt;
        const decay = this._timer / this._duration;
        this._offsetX = (Math.random() - 0.5) * this._intensity * decay * 2;
        this._offsetY = (Math.random() - 0.5) * this._intensity * decay * 2;
        if (this._timer <= 0) {
          this._offsetX = 0;
          this._offsetY = 0;
        }
      }
    },

    getOffset() {
      return { x: this._offsetX, y: this._offsetY };
    },

    isShaking() {
      return this._timer > 0;
    }
  }
};

// 暴露到全局
window.MiniGameCore = MiniGameCore;

})();