// 8 种心情对应的粒子系统
// 同一个 ParticleEngine 接受 mode 参数，在 update 中分支到不同的物理逻辑
(function (global) {
  'use strict';

  const TAU = Math.PI * 2;

  class Particle {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.vx = 0; this.vy = 0;
      this.life = 1;
      this.maxLife = 1;
      this.size = 1;
      this.rot = 0;
      this.vr = 0;
      this.hue = 0;
    }
  }

  class ParticleEngine {
    constructor(canvas, mood) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.mood = mood;
      this.particles = [];
      this.running = false;
      this.t = 0;
      this.spawnAcc = 0;
      this._raf = null;
      this._resize();
      window.addEventListener('resize', () => this._resize());
    }

    _resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.W = w; this.H = h;
    }

    setMood(mood) {
      this.mood = mood;
      this.particles.length = 0;
      this.t = 0;
      this.spawnAcc = 0;
    }

    start() {
      if (this.running) return;
      this.running = true;
      this._seed();
      this._loop();
    }

    stop() {
      this.running = false;
      if (this._raf) cancelAnimationFrame(this._raf);
    }

    _seed() {
      const N = 60;
      for (let i = 0; i < N; i++) {
        this._spawn(true);
      }
    }

    _spawn(initial = false) {
      const p = new Particle(Math.random() * this.W, Math.random() * this.H);
      const m = this.mood;
      p.size = 1 + Math.random() * 2.4;
      p.maxLife = 2 + Math.random() * 4;
      p.life = initial ? Math.random() * p.maxLife : p.maxLife;
      p.hue = Math.random();
      // 模式相关初值
      switch (m.particle) {
        case 'fountain':
          p.x = this.W * (0.2 + Math.random() * 0.6);
          p.y = this.H * (0.55 + Math.random() * 0.4);
          p.vx = (Math.random() - 0.5) * 1.4;
          p.vy = -1.5 - Math.random() * 2.2;
          p.size = 2 + Math.random() * 3;
          break;
        case 'rain':
          p.x = Math.random() * this.W;
          p.y = -10;
          p.vx = 0.2 + Math.random() * 0.3;
          p.vy = 4 + Math.random() * 4;
          p.size = 1 + Math.random() * 1.5;
          break;
        case 'bubble':
          p.x = Math.random() * this.W;
          p.y = this.H + 10;
          p.vx = (Math.random() - 0.5) * 0.6;
          p.vy = -0.4 - Math.random() * 0.8;
          p.size = 4 + Math.random() * 12;
          break;
        case 'heart':
          p.x = Math.random() * this.W;
          p.y = this.H + 20;
          p.vx = (Math.random() - 0.5) * 0.8;
          p.vy = -0.6 - Math.random() * 1.1;
          p.vr = (Math.random() - 0.5) * 0.04;
          p.size = 6 + Math.random() * 14;
          break;
        case 'grain':
          p.x = Math.random() * this.W;
          p.y = Math.random() * this.H;
          p.vx = 0; p.vy = 0;
          p.size = 0.5 + Math.random() * 1.2;
          p.maxLife = 0.6 + Math.random() * 0.6;
          p.life = Math.random() * p.maxLife;
          break;
        case 'bounce':
          p.x = Math.random() * this.W;
          p.y = Math.random() * this.H;
          p.vx = (Math.random() - 0.5) * 4;
          p.vy = (Math.random() - 0.5) * 4;
          p.size = 4 + Math.random() * 6;
          break;
        case 'orbit':
          p.x = this.W / 2;
          p.y = this.H / 2;
          p.vx = 0; p.vy = 0;
          p.size = 1 + Math.random() * 2;
          p.maxLife = 6 + Math.random() * 4;
          p.life = Math.random() * p.maxLife;
          p.rot = Math.random() * TAU;
          p.vr = (0.2 + Math.random() * 0.6) * (Math.random() < 0.5 ? 1 : -1);
          break;
        case 'feather':
          p.x = Math.random() * this.W;
          p.y = this.H + 10;
          p.vx = (Math.random() - 0.5) * 0.4;
          p.vy = -0.3 - Math.random() * 0.5;
          p.vr = (Math.random() - 0.5) * 0.02;
          p.size = 4 + Math.random() * 8;
          break;
      }
      this.particles.push(p);
    }

    _drawHeart(ctx, x, y, s, a) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((this.t * 0.4 + x) * 0.001);
      ctx.scale(s / 20, s / 20);
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.bezierCurveTo(0, 0, -10, 0, -10, -6);
      ctx.bezierCurveTo(-10, -14, 0, -16, 0, -8);
      ctx.bezierCurveTo(0, -16, 10, -14, 10, -6);
      ctx.bezierCurveTo(10, 0, 0, 0, 0, 6);
      ctx.closePath();
      ctx.globalAlpha = a;
      ctx.fill();
      ctx.restore();
    }

    _drawFeather(ctx, x, y, s, rot, a) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.6, s * 0.2, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, 0);
      ctx.lineTo(s * 0.6, 0);
      ctx.stroke();
      ctx.restore();
    }

    _loop() {
      if (!this.running) return;
      const dt = 1 / 60;
      this.t += dt;

      // 清屏（带一点点拖影以增加氛围）
      this.ctx.fillStyle = this.mood.palette.bg;
      this.ctx.fillRect(0, 0, this.W, this.H);

      // 颜色梯度（决定粒子色相）
      const grad = this.ctx.createLinearGradient(0, 0, this.W, this.H);
      grad.addColorStop(0, this.mood.palette.from);
      grad.addColorStop(1, this.mood.palette.to);

      // 模式相关：常驻背景纹理
      if (this.mood.particle === 'grain') {
        this._drawGrainOverlay();
      } else if (this.mood.particle === 'orbit') {
        this._drawOrbitField();
      }

      // 决定每帧生成数量
      const spawnRate = this._spawnRate();
      this.spawnAcc += spawnRate * dt;
      while (this.spawnAcc > 1) {
        this._spawn(false);
        this.spawnAcc -= 1;
      }

      // 更新 & 渲染粒子
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        this._updateParticle(p, dt);
        this._drawParticle(p, grad);
      }

      this._raf = requestAnimationFrame(() => this._loop());
    }

    _spawnRate() {
      switch (this.mood.particle) {
        case 'fountain': return 18;
        case 'rain':     return 40;
        case 'bubble':   return 4;
        case 'heart':    return 1.2;
        case 'grain':    return 6;
        case 'bounce':   return 1.5;
        case 'orbit':    return 0.3;
        case 'feather':  return 1.0;
        default:         return 5;
      }
    }

    _updateParticle(p, dt) {
      const m = this.mood.particle;
      switch (m) {
        case 'fountain':
          p.vy += 1.4 * dt;       // 重力
          p.vx *= 0.99;
          break;
        case 'rain':
          p.vx += 0.02 * Math.sin(this.t + p.y * 0.01);
          break;
        case 'bubble':
          p.vx += 0.2 * Math.sin(this.t * 1.5 + p.y * 0.01) * dt;
          p.vy *= 0.995;
          break;
        case 'heart':
          p.x += Math.sin(this.t * 1.2 + p.y * 0.01) * 0.3;
          p.rot += p.vr;
          break;
        case 'grain':
          // 老胶片噪点：原地闪烁
          break;
        case 'bounce':
          p.vy += 0.3 * dt;
          if (p.y > this.H - 20) { p.y = this.H - 20; p.vy = -Math.abs(p.vy) * 0.7; }
          if (p.x < 0 || p.x > this.W) p.vx = -p.vx;
          break;
        case 'orbit':
          p.rot += p.vr * dt;
          p.x = this.W / 2 + Math.cos(p.rot) * (60 + (p.maxLife - p.life) * 12);
          p.y = this.H / 2 + Math.sin(p.rot) * (40 + (p.maxLife - p.life) * 8);
          break;
        case 'feather':
          p.x += Math.sin(this.t * 0.6 + p.y * 0.02) * 0.4;
          p.rot += p.vr;
          break;
      }
      p.x += p.vx;
      p.y += p.vy;
    }

    _drawParticle(p, grad) {
      const ctx = this.ctx;
      const a = Math.max(0, Math.min(1, p.life / p.maxLife));
      const r = p.size;
      ctx.globalCompositeOperation = 'lighter';
      const color = this._sampleGradient(grad, p.hue);
      ctx.fillStyle = color;
      ctx.globalAlpha = a;
      switch (this.mood.particle) {
        case 'fountain':
        case 'rain':
        case 'bounce': {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, TAU);
          ctx.fill();
          break;
        }
        case 'bubble': {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, TAU);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(p.x - r * 0.4, p.y - r * 0.4, r * 0.2, 0, TAU);
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fill();
          break;
        }
        case 'heart': {
          this._drawHeart(ctx, p.x, p.y, r * 1.2, a);
          break;
        }
        case 'grain': {
          ctx.fillRect(p.x, p.y, r, r);
          break;
        }
        case 'orbit': {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, TAU);
          ctx.fill();
          break;
        }
        case 'feather': {
          this._drawFeather(ctx, p.x, p.y, r * 1.4, p.rot, a);
          break;
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    _drawGrainOverlay() {
      // 老胶片噪点：在屏幕铺一层细点 + 横纹
      const ctx = this.ctx;
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 200; i++) {
        ctx.fillRect(Math.random() * this.W, Math.random() * this.H, 1, 1);
      }
      // 横向划痕
      for (let i = 0; i < 3; i++) {
        const y = Math.random() * this.H;
        ctx.fillRect(0, y, this.W, 0.5);
      }
      // 暗角
      const vg = ctx.createRadialGradient(this.W / 2, this.H / 2, this.W * 0.3, this.W / 2, this.H / 2, this.W * 0.7);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.globalAlpha = 1;
    }

    _drawOrbitField() {
      // 银河背景：远处淡淡星点
      const ctx = this.ctx;
      ctx.globalAlpha = 0.4;
      for (let i = 0; i < 120; i++) {
        const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        const y = (Math.sin(i * 78.233) * 43758.5453) % 1;
        const px = Math.abs(x) * this.W;
        const py = Math.abs(y) * this.H;
        ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.abs(Math.sin(i + this.t)) * 0.6) + ')';
        ctx.fillRect(px, py, 1.2, 1.2);
      }
      ctx.globalAlpha = 1;
    }

    _sampleGradient(grad, t) {
      // 在 linear gradient 上抽样颜色
      const ctx = this.ctx;
      const off = document.createElement('canvas');
      off.width = 2; off.height = 2;
      const og = off.getContext('2d');
      const g2 = og.createLinearGradient(0, 0, 1, 0);
      g2.addColorStop(0, grad.addColorStop ? this.mood.palette.from : this.mood.palette.from);
      g2.addColorStop(1, this.mood.palette.to);
      og.fillStyle = g2;
      og.fillRect(0, 0, 2, 2);
      const px = og.getImageData(Math.min(1, Math.floor(t * 2)), 0, 1, 1).data;
      return 'rgb(' + px[0] + ',' + px[1] + ',' + px[2] + ')';
    }
  }

  global.ParticleEngine = ParticleEngine;
})(window);
