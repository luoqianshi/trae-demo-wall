// ============================================================
// js/engine2d.js
// 中华文化粒子云引擎 · 2D Canvas 引擎
// 完整迁移自单文件版《星河粒子-沉浸展.html》第 565-1498 行 <script> 块
// Simplex 流场 + 水墨拖尾 + 预渲染精灵 + 加法混合 + 6 场景 + 5 主题
// ============================================================

import { renderMultilineText } from './security.js';

// ==================== Simplex Noise 内联实现 ====================
class SimplexNoise {
  constructor(seed = Math.random()) {
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed * 2147483647;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
    this.grad3 = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[1,0],[-1,0],[0,1],[0,-1],[0,1],[0,-1]];
  }
  noise2D(xin, yin) {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t, Y0 = j - t;
    const x0 = xin - X0, y0 = yin - Y0;
    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];
    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * (this.grad3[gi0][0] * x0 + this.grad3[gi0][1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * (this.grad3[gi1][0] * x1 + this.grad3[gi1][1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * (this.grad3[gi2][0] * x2 + this.grad3[gi2][1] * y2); }
    return 70 * (n0 + n1 + n2);
  }
}

// ==================== 主题与场景数据 ====================
export const THEMES = {
  classical: { name: '古典', main:'#d4af6a', accent:'#f4d77e', glow:'#8b6929', bg:'#0a0705', bg2:'#1a1208' },
  cyan:      { name: '青绿', main:'#4a8f6b', accent:'#a8d8b8', glow:'#2d5a4a', bg:'#05120a', bg2:'#0a1f14' },
  ink:       { name: '夜墨', main:'#4a4a4a', accent:'#9a9a9a', glow:'#1a1a1a', bg:'#050505', bg2:'#121212' },
  wash:      { name: '水墨', main:'#c4ad7a', accent:'#e8dcc4', glow:'#6b5d44', bg:'#0a0805', bg2:'#1a160e' },
  cinnabar:  { name: '朱砂', main:'#c96a4a', accent:'#f4a07e', glow:'#6b2e1a', bg:'#0a0505', bg2:'#1a0c08' }
};

export const SCENES = {
  qianshan: {
    label: '千山', seal: '山',
    title: '千里江山图',
    desc: '王希孟以十八岁的少年心气，画尽天下青绿。咫尺千里，咫尺万里。',
    poem: '咫尺千里\n咫尺万里',
    author: '— 北宋 · 王希孟',
    meta: '青绿山水 · 北宋 · 1113 年',
    type: 'shanshui',
    ambience: 'mist',
    solarTerm: '立春'
  },
  yuebo: {
    label: '月泊', seal: '月',
    title: '枫桥夜泊',
    desc: '姑苏城外寒山寺，夜半钟声到客船。一缕钟声穿越千年月光。',
    poem: '月落乌啼霜满天\n江枫渔火对愁眠',
    author: '— 唐 · 张继',
    meta: '夜景 · 唐诗 · 羁旅',
    type: 'fengqiao',
    ambience: 'fireflies',
    solarTerm: '秋分'
  },
  mudan: {
    label: '牡丹', seal: '花',
    title: '牡丹亭 · 惊梦',
    desc: '良辰美景奈何天，赏心乐事谁家院。杜丽娘的一梦，是中国最动人的浪漫。',
    poem: '原来姹紫嫣红开遍\n似这般都付与断井颓垣',
    author: '— 明 · 汤显祖',
    meta: '戏曲 · 昆曲 · 明传奇',
    type: 'mudanting',
    ambience: 'petals',
    solarTerm: '谷雨'
  },
  lanting: {
    label: '兰亭', seal: '书',
    title: '兰亭集序',
    desc: '王羲之醉笔写下天下第一行书，曲水流觞间，是魏晋风度。',
    poem: '仰观宇宙之大\n俯察品类之盛',
    author: '— 东晋 · 王羲之',
    meta: '行书 · 天下第一 · 魏晋',
    type: 'lanting',
    ambience: 'ink',
    solarTerm: '上巳'
  },
  xingxiu: {
    label: '星宿', seal: '宿',
    title: '二十八星宿',
    desc: '古人仰观天象，分满天繁星为二十八宿。紫微垣中，藏着宇宙的秩序。',
    poem: '星垂平野阔\n月涌大江流',
    author: '— 唐 · 杜甫',
    meta: '天象 · 古代天文 · 星宿',
    type: 'star',
    ambience: 'stars',
    solarTerm: '冬至'
  },
  yanyu: {
    label: '烟雨', seal: '雨',
    title: '江南烟雨',
    desc: '南朝四百八十寺，多少楼台烟雨中。江南的雨，下了千年。',
    poem: '南朝四百八十寺\n多少楼台烟雨中',
    author: '— 唐 · 杜牧',
    meta: '江南 · 烟雨 · 唐诗',
    type: 'rain',
    ambience: 'rain',
    solarTerm: '清明'
  }
};

const SCENE_DURATION = 60000;

// ==================== 粒子类（持有引擎引用以访问全局状态） ====================
class Particle {
  constructor(x, y, engine) {
    this.engine = engine;
    this.x = x; this.y = y;
    this.ox = x; this.oy = y;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = (Math.random() - 0.5) * 0.6;
    this.tx = x; this.ty = y;
    this.size = Math.random() * 1.6 + 0.6;
    this.baseSize = this.size;
    this.friction = 0.90 + Math.random() * 0.06;
    this.alpha = 0;
    this.targetAlpha = 0.5 + Math.random() * 0.5;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.008 + Math.random() * 0.012;
    this.burst = 0;
    this.z = 0.3 + Math.random() * 0.7;
    this.prevTx = this.tx; this.prevTy = this.ty;
    this.morphProgress = 1;
  }
  setTarget(tx, ty) {
    this.prevTx = this.tx; this.prevTy = this.ty;
    this.tx = tx; this.ty = ty;
    this.morphProgress = 0;
  }
  update() {
    const e = this.engine;
    const mx = this.prevTx + (this.tx - this.prevTx) * this.morphProgress;
    const my = this.prevTy + (this.ty - this.prevTy) * this.morphProgress;
    const dx = mx - this.x, dy = my - this.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d > 0.5) {
      const force = d * 0.012 * (0.5 + e.animSpeed);
      this.vx += (dx / d) * force;
      this.vy += (dy / d) * force;
    }

    const ft = e.time * 0.0008;
    const n1 = e.noise.noise2D(this.x * 0.004, this.y * 0.004);
    const n2 = e.noise.noise2D(this.x * 0.012 + 100, this.y * 0.012 + 100);
    const n3 = e.noise.noise2D(this.x * 0.02 + 200, this.y * 0.02 + 200);
    const ang = (n1 * 0.6 + n2 * 0.3 + n3 * 0.1) * Math.PI * 2 + ft;
    this.vx += Math.cos(ang) * 0.18;
    this.vy += Math.sin(ang) * 0.18;

    if (e.isMouseActive) {
      const mdx = this.x - e.mouseX, mdy = this.y - e.mouseY;
      const md = Math.sqrt(mdx * mdx + mdy * mdy);
      if (md < 180 && md > 0.5) {
        const f = (180 - md) / 180 * 0.6;
        const tx = -mdy / md, ty = mdx / md;
        this.vx += tx * f + e.mouseVX * 0.04;
        this.vy += ty * f + e.mouseVY * 0.04;
        this.targetAlpha = 0.85;
      }
    }

    if (e.isMouseDown) {
      const ddx = e.mouseX - this.x, ddy = e.mouseY - this.y;
      const dd = Math.sqrt(ddx * ddx + ddy * ddy);
      if (dd < 200 && dd > 0.5) {
        this.vx += (ddx / dd) * 0.4;
        this.vy += (ddy / dd) * 0.4;
      }
    }

    if (this.burst > 0) {
      this.vx += (Math.random() - 0.5) * this.burst * 0.6;
      this.vy += (Math.random() - 0.5) * this.burst * 0.6;
      this.burst *= 0.92;
    }

    this.wobble += this.wobbleSpeed * (0.5 + e.animSpeed);
    this.vx *= this.friction;
    this.vy *= this.friction;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 4) {
      this.vx = (this.vx / speed) * 4;
      this.vy = (this.vy / speed) * 4;
    }

    this.x += this.vx;
    this.y += this.vy;

    if (d < 40) this.alpha += (this.targetAlpha - this.alpha) * 0.06;
    else if (d < 150) this.alpha += (this.targetAlpha * 0.55 - this.alpha) * 0.04;
    else this.alpha += (0.1 - this.alpha) * 0.03;

    this.targetAlpha = Math.max(0.4, this.targetAlpha * 0.995 + 0.5 * 0.005);
    this.size = this.baseSize * (0.75 + Math.sin(e.time * 0.02 + this.wobble) * 0.35);
    if (this.morphProgress < 1) this.morphProgress = Math.min(1, this.morphProgress + 0.014);
  }
  draw(sprite, spriteBlur, spritePrev) {
    const e = this.engine;
    const brightness = (0.85 + Math.sin(this.wobble + e.time * 0.03) * 0.3) * e.glowIntensity;
    // 改动4：非线性距离衰减，模拟 3D 的 300/-z 曲线（远景更小，层次感更强）
    const depthScale = 0.3 + Math.pow(this.z, 1.8) * 0.7;
    const depthAlpha = 0.35 + this.z * 0.65;
    // 改动1：远景雾化融合因子（z<0.5 时趋向背景色，模拟 3D Fog）
    const fogFactor = this.z < 0.5 ? (0.5 - this.z) * 0.8 : 0;
    const a = Math.max(0, Math.min(1, this.alpha)) * brightness * depthAlpha;
    if (a < 0.02) return;
    const s = this.size * 7 * depthScale;
    const spr = this.z < 0.5 ? spriteBlur : sprite;
    if (e.themeFade < 1 && spritePrev) {
      const sprPrev = this.z < 0.5 ? e.themeSpritesBlur[e.prevTheme] : spritePrev;
      e.ctx.globalAlpha = a * (1 - e.themeFade);
      e.ctx.drawImage(sprPrev, this.x - s / 2, this.y - s / 2, s, s);
    }
    e.ctx.globalAlpha = a * (e.themeFade < 1 ? e.themeFade : 1);
    e.ctx.drawImage(spr, this.x - s / 2, this.y - s / 2, s, s);
    // 改动1：远景雾化叠加（source-over 半透明背景色圆，模拟 3D Fog 远景融合）
    if (fogFactor > 0.01) {
      e.ctx.globalCompositeOperation = 'source-over';
      e.ctx.globalAlpha = fogFactor * 0.5;
      e.ctx.fillStyle = e.fogColor;
      e.ctx.beginPath();
      e.ctx.arc(this.x, this.y, s * 0.6, 0, Math.PI * 2);
      e.ctx.fill();
      e.ctx.globalCompositeOperation = 'lighter';
    }
  }
}

// ==================== 环境粒子 ====================
class AmbientParticle {
  constructor(type, engine) {
    this.engine = engine;
    this.type = type;
    this.reset(true);
  }
  reset(initial = false) {
    const e = this.engine;
    this.x = Math.random() * e.W;
    this.y = initial ? Math.random() * e.H : (this.type === 'rain' ? -10 : Math.random() * e.H);
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.size = Math.random() * 2 + 0.8;
    this.alpha = Math.random() * 0.5 + 0.2;
    this.life = 0;
    this.maxLife = 300 + Math.random() * 300;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.01 + Math.random() * 0.02;
    if (this.type === 'rain') {
      this.vx = -1.2;
      this.vy = 8 + Math.random() * 4;
      this.size = Math.random() * 1.2 + 0.4;
    } else if (this.type === 'petals') {
      this.vy = 0.4 + Math.random() * 0.6;
      this.vx = Math.sin(this.wobble) * 0.3;
    } else if (this.type === 'stars') {
      this.alpha = Math.random() * 0.8 + 0.2;
    }
  }
  update() {
    const e = this.engine;
    this.life++;
    this.wobble += this.wobbleSpeed;
    if (this.type === 'mist') {
      this.vx += Math.sin(this.wobble) * 0.02;
      this.vy += Math.cos(this.wobble * 0.7) * 0.015;
      this.alpha = 0.15 + Math.sin(e.time * 0.01 + this.wobble) * 0.1;
    } else if (this.type === 'fireflies') {
      this.vx += Math.sin(this.wobble) * 0.03;
      this.vy += Math.cos(this.wobble * 0.8) * 0.03;
      this.alpha = 0.3 + Math.sin(e.time * 0.05 + this.wobble) * 0.35;
    } else if (this.type === 'petals') {
      this.vx = Math.sin(this.wobble + this.life * 0.02) * 0.6;
    } else if (this.type === 'ink') {
      this.vx += e.noise.noise2D(this.x * 0.01, this.life * 0.01) * 0.1;
      this.vy += e.noise.noise2D(this.y * 0.01, this.life * 0.01) * 0.05;
      this.alpha = 0.3 + Math.sin(this.life * 0.05) * 0.2;
    } else if (this.type === 'stars') {
      this.alpha = 0.3 + Math.sin(e.time * 0.05 + this.wobble * 3) * 0.5;
    } else if (this.type === 'rain') {
      this.alpha = 0.4 + Math.random() * 0.2;
    }
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < -20 || this.x > e.W + 20 || this.y > e.H + 20 || this.y < -20 || this.life > this.maxLife) {
      this.reset();
    }
  }
  draw(color) {
    const e = this.engine;
    const a = Math.max(0, Math.min(1, this.alpha));
    if (a < 0.02) return;
    e.ctx.globalAlpha = a;
    if (this.type === 'rain') {
      e.ctx.strokeStyle = color.accent;
      e.ctx.lineWidth = this.size;
      e.ctx.beginPath();
      e.ctx.moveTo(this.x, this.y);
      e.ctx.lineTo(this.x + this.vx * 2, this.y + this.vy * 2);
      e.ctx.stroke();
    } else if (this.type === 'mist') {
      const grad = e.ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 6);
      grad.addColorStop(0, color.main);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      e.ctx.fillStyle = grad;
      e.ctx.beginPath();
      e.ctx.arc(this.x, this.y, this.size * 6, 0, Math.PI * 2);
      e.ctx.fill();
    } else {
      e.ctx.fillStyle = color.accent;
      e.ctx.beginPath();
      e.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      e.ctx.fill();
    }
  }
}

// ==================== 2D 引擎主类 ====================
export class Engine2D {
  constructor() {
    // DOM 画布
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.bgCanvas = document.getElementById('bgCanvas');
    this.bgCtx = this.bgCanvas.getContext('2d');
    this.inkCanvas = document.getElementById('inkCanvas');
    this.inkCtx = this.inkCanvas.getContext('2d');
    this.shapeCanvas = document.getElementById('shapeCanvas');
    this.shapeCtx = this.shapeCanvas.getContext('2d', { willReadFrequently: true });

    // 画布尺寸与设备像素比
    this.W = 0; this.H = 0;
    this.DPR = Math.min(window.devicePixelRatio || 1, 2);

    // 粒子集合
    this.particles = [];
    this.ambientParticles = [];

    // 当前场景与主题
    this.currentScene = 'qianshan';
    this.currentTheme = 'classical';

    // 时间与鼠标状态
    this.time = 0;
    this.mouseX = -9999; this.mouseY = -9999;
    this.lastMouseX = -9999; this.lastMouseY = -9999;
    this.mouseVX = 0; this.mouseVY = 0;
    this.isMouseActive = false;
    this.isMouseDown = false;

    // 播放状态
    this.isAutoPlay = true;
    this.playStartTime = Date.now();
    this.playProgress = 0;

    // 渲染参数
    this.particleDensity = 1.0;
    this.animSpeed = 1.0;
    this.glowIntensity = 0.65;
    this.burstTimer = 0;
    this.zoom = 1.0;
    this.panX = 0; this.panY = 0;
    this.prevTheme = 'classical';
    this.themeFade = 1;
    this.themeFadeStart = 0;
    this.ripples = [];
    this._lastClickTime = 0;
    // 改动1：远景雾化融合色（跟随主题背景色，模拟 3D Fog 远景融合）
    this.fogColor = '#0a0705';
    // 改动2：悬停高亮状态（节流检测最近粒子，对齐 3D raycaster 悬停反馈）
    this._hoverParticle = null;
    this._lastHoverTime = 0;
    // 改动3：移动端检测（对齐 3D 的 maxTouchPoints>1 初始降质策略）
    this.isMobile = typeof navigator !== 'undefined' && (navigator.maxTouchPoints || 0) > 1;
    if (this.isMobile) this.particleDensity = 0.5;

    // 噪声场
    this.noise = new SimplexNoise();

    // 性能监控
    this.fpsHistory = [];
    this.lastFrameTime = performance.now();
    this.isPageVisible = true;
    this.rafId = null;

    // 预渲染精灵与兰亭点位
    this.themeSprites = {};
    this.lantingPoints = null;

    // Toast 计时器
    this.toastTimer = null;

    // 引擎运行状态
    this._inited = false;
    this._loaderDone = false;
    this._isRunning = false;
  }

  // ==================== 预渲染发光精灵 ====================
  buildThemeSprites() {
    this.themeSprites = {};
    this.themeSpritesBlur = {};
    Object.keys(THEMES).forEach(key => {
      const t = THEMES[key];
      const size = 64;
      const off = document.createElement('canvas');
      off.width = off.height = size;
      const oc = off.getContext('2d');
      const cx = size / 2, cy = size / 2;
      const grad = oc.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
      grad.addColorStop(0, t.accent);
      grad.addColorStop(0.25, t.main);
      grad.addColorStop(0.55, t.glow);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      oc.fillStyle = grad;
      oc.fillRect(0, 0, size, size);
      oc.globalCompositeOperation = 'lighter';
      oc.globalAlpha = 0.5;
      oc.fillStyle = t.accent;
      oc.beginPath();
      oc.arc(cx, cy, 1.5, 0, Math.PI * 2);
      oc.fill();
      oc.globalAlpha = 1;
      this.themeSprites[key] = off;
      const blurOff = document.createElement('canvas');
      blurOff.width = blurOff.height = size;
      const bc = blurOff.getContext('2d');
      bc.filter = 'blur(2px)';
      bc.drawImage(off, 0, 0);
      bc.filter = 'none';
      this.themeSpritesBlur[key] = blurOff;
    });
  }

  // ==================== 形状生成器 ====================
  generateShapePoints(type, count) {
    const points = [];
    const cx = this.W / 2 + this.panX, cy = this.H / 2 + this.panY;
    const s = Math.min(this.W, this.H) * 0.36 * this.zoom;

    if (type === 'shanshui') {
      for (let layer = 0; layer < 6; layer++) {
        const lr = layer / 6;
        const ly = this.H * 0.28 + lr * this.H * 0.5;
        const ls = s * (1.5 - lr * 0.8);
        const lh = ls * (0.45 + (1 - lr) * 0.4);
        const peaks = 5 + layer;
        const perPeak = Math.floor(count / (6 * peaks));
        for (let p = 0; p < peaks; p++) {
          const px = (p + 0.5) / peaks;
          const ph = (0.4 + Math.random() * 0.5) * lh;
          const pw = 0.08 + Math.random() * 0.05;
          for (let i = 0; i < perPeak; i++) {
            const t = Math.random();
            const x = cx + (px - 0.5 + (t - 0.5) * pw) * this.W * 1.4;
            const dist = Math.abs(t - 0.5) * 2;
            const y = ly - ph * Math.exp(-dist * dist * 4) + (Math.random() - 0.5) * 8;
            points.push({ x, y });
          }
        }
        for (let i = 0; i < perPeak * 0.4; i++) {
          const t = Math.random();
          const x = cx + (t - 0.5) * this.W * 1.4;
          const y = ly + Math.sin(t * Math.PI * 10 + layer) * 12;
          points.push({ x, y });
        }
      }
    } else if (type === 'fengqiao') {
      const moonX = cx + s * 0.3, moonY = cy - s * 0.4, moonR = s * 0.28;
      for (let i = 0; i < count * 0.35; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = moonR * (0.92 + Math.random() * 0.1);
        points.push({ x: moonX + Math.cos(a) * r, y: moonY + Math.sin(a) * r });
      }
      for (let i = 0; i < count * 0.2; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = moonR * (1.05 + Math.random() * 0.4);
        points.push({ x: moonX + Math.cos(a) * r, y: moonY + Math.sin(a) * r });
      }
      const bridgeX = cx - s * 0.4, bridgeY = cy + s * 0.1, bridgeR = s * 0.4;
      for (let i = 0; i < count * 0.25; i++) {
        const a = Math.PI + Math.random() * Math.PI;
        const r = bridgeR * (0.95 + Math.random() * 0.05);
        points.push({ x: bridgeX + Math.cos(a) * r, y: bridgeY + Math.sin(a) * r });
      }
      const boatX = cx + s * 0.5, boatY = cy + s * 0.35;
      for (let i = 0; i < count * 0.2; i++) {
        const t = Math.random();
        const x = boatX + (t - 0.5) * s * 0.5;
        const y = boatY + Math.sin(t * Math.PI) * s * 0.06 + (Math.random() - 0.5) * 4;
        points.push({ x, y });
      }
    } else if (type === 'mudanting') {
      const peonyCX = cx, peonyCY = cy - s * 0.05, peonyR = s * 0.55;
      for (let layer = 0; layer < 5; layer++) {
        const lr = peonyR * (1 - layer * 0.16);
        const petals = 8 + layer * 2;
        const perPetal = Math.floor(count / 30);
        for (let p = 0; p < petals; p++) {
          const ba = (p / petals) * Math.PI * 2 + layer * 0.2;
          for (let i = 0; i < perPetal; i++) {
            const t = Math.random();
            const pa = ba + (t - 0.5) * 0.6;
            const dist = t * lr;
            const wo = (Math.random() - 0.5) * lr * 0.2 * (1 - t);
            points.push({ x: peonyCX + Math.cos(pa) * dist + wo, y: peonyCY + Math.sin(pa) * dist + wo });
          }
        }
      }
      const pavX = cx - s * 0.45, pavY = cy + s * 0.25;
      for (let i = 0; i < count * 0.15; i++) {
        const t = Math.random();
        const x = pavX + (t - 0.5) * s * 0.4;
        const y = pavY + (1 - t) * s * 0.2;
        points.push({ x, y });
      }
    } else if (type === 'lanting') {
      if (this.lantingPoints && this.lantingPoints.length > 0) {
        for (let i = 0; i < count; i++) {
          const p = this.lantingPoints[i % this.lantingPoints.length];
          points.push({ x: p.x, y: p.y });
        }
      }
    } else if (type === 'star') {
      const cons = [
        { cx: cx - s * 0.7, cy: cy - s * 0.5, n: 7 },
        { cx: cx + s * 0.7, cy: cy - s * 0.5, n: 7 },
        { cx: cx - s * 0.7, cy: cy + s * 0.5, n: 7 },
        { cx: cx + s * 0.7, cy: cy + s * 0.5, n: 7 }
      ];
      cons.forEach(c => {
        for (let i = 0; i < count * 0.18; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = s * 0.03 * (0.7 + Math.random() * 0.5);
          points.push({ x: c.cx + Math.cos(a) * r, y: c.cy + Math.sin(a) * r });
        }
        const nx = c.cx + s * 0.12 * (Math.random() > 0.5 ? 1 : -1);
        const ny = c.cy + s * 0.12 * (Math.random() > 0.5 ? 1 : -1);
        for (let i = 0; i < count * 0.05; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = s * 0.05 * (0.7 + Math.random() * 0.5);
          points.push({ x: nx + Math.cos(a) * r, y: ny + Math.sin(a) * r });
        }
      });
      for (let i = 0; i < count * 0.1; i++) {
        points.push({ x: Math.random() * this.W, y: Math.random() * this.H * 0.6 });
      }
    } else if (type === 'rain') {
      for (let i = 0; i < count * 0.5; i++) {
        const t = Math.random();
        const x = cx + (t - 0.5) * this.W * 1.3;
        const y = cy + Math.sin(t * Math.PI * 8) * s * 0.3 + (Math.random() - 0.5) * s * 0.4;
        points.push({ x, y });
      }
      for (let layer = 0; layer < 3; layer++) {
        const ly = this.H * 0.55 + layer * this.H * 0.12;
        const ls = s * (1.3 - layer * 0.3);
        const lh = ls * 0.3;
        for (let i = 0; i < count * 0.15; i++) {
          const t = Math.random();
          const x = cx + (t - 0.5) * this.W * 1.3;
          const y = ly - lh * Math.exp(-Math.abs(t - 0.5) * 4) + (Math.random() - 0.5) * 6;
          points.push({ x, y });
        }
      }
    }
    return points;
  }

  generateLantingPoints() {
    this.shapeCanvas.width = this.W;
    this.shapeCanvas.height = this.H;
    this.shapeCtx.clearRect(0, 0, this.W, this.H);
    this.shapeCtx.fillStyle = '#fff';
    this.shapeCtx.font = 'bold ' + Math.floor(Math.min(this.W, this.H) * 0.28) + 'px "Ma Shan Zheng", serif';
    this.shapeCtx.textAlign = 'center';
    this.shapeCtx.textBaseline = 'middle';
    this.shapeCtx.fillText('兰亭', this.W / 2, this.H / 2);
    const data = this.shapeCtx.getImageData(0, 0, this.W, this.H).data;
    const pts = [];
    const step = 4;
    for (let y = 0; y < this.H; y += step) {
      for (let x = 0; x < this.W; x += step) {
        const idx = (y * this.W + x) * 4;
        if (data[idx + 3] > 128) {
          pts.push({ x: x + (Math.random() - 0.5) * 2, y: y + (Math.random() - 0.5) * 2 });
        }
      }
    }
    this.lantingPoints = pts;
  }

  // ==================== 初始化 ====================
  resize() {
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    [this.canvas, this.bgCanvas, this.inkCanvas].forEach(c => {
      c.width = this.W * this.DPR;
      c.height = this.H * this.DPR;
      c.style.width = this.W + 'px';
      c.style.height = this.H + 'px';
    });
    this.ctx.scale(this.DPR, this.DPR);
    this.bgCtx.scale(this.DPR, this.DPR);
    this.inkCtx.scale(this.DPR, this.DPR);
    if (this.currentScene === 'lanting') this.generateLantingPoints();
    this.initParticles();
    this.initAmbience();
    this.drawBackground();
  }

  initParticles() {
    this.particles = [];
    const base = Math.floor(4000 * this.particleDensity);
    // 改动3：移动端上限 2500，桌面端上限 8000（对齐 3D medium 质量策略）
    const cap = this.isMobile ? 2500 : 8000;
    const count = Math.max(800, Math.min(base, cap));
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(Math.random() * this.W, Math.random() * this.H, this));
    }
    this.generateTargetPositions();
  }

  initAmbience() {
    this.ambientParticles = [];
    const scene = SCENES[this.currentScene];
    // 改动3：移动端环境粒子减半，保 60fps
    let n = scene.ambience === 'rain' ? 200 : (scene.ambience === 'stars' ? 180 : 120);
    if (this.isMobile) n = Math.floor(n / 2);
    for (let i = 0; i < n; i++) this.ambientParticles.push(new AmbientParticle(scene.ambience, this));
  }

  generateTargetPositions() {
    const scene = SCENES[this.currentScene];
    const pts = this.generateShapePoints(scene.type, this.particles.length);
    if (pts.length === 0) return;
    for (let i = 0; i < this.particles.length; i++) {
      const p = pts[i % pts.length];
      this.particles[i].setTarget(p.x, p.y);
    }
  }

  // ==================== 背景绘制（离屏静态层） ====================
  drawBackground() {
    const theme = THEMES[this.currentTheme];
    this.bgCtx.clearRect(0, 0, this.W, this.H);
    const grad = this.bgCtx.createRadialGradient(this.W / 2, this.H / 2, 0, this.W / 2, this.H / 2, Math.max(this.W, this.H) * 0.8);
    grad.addColorStop(0, theme.glow + '40');
    grad.addColorStop(0.4, theme.bg2);
    grad.addColorStop(0.8, theme.bg);
    grad.addColorStop(1, theme.bg);
    this.bgCtx.fillStyle = grad;
    this.bgCtx.fillRect(0, 0, this.W, this.H);
    this.bgCtx.globalAlpha = 0.04;
    for (let i = 0; i < 80; i++) {
      const x = (i * 137.5) % this.W;
      const y = (i * 89.3) % this.H;
      this.bgCtx.fillStyle = theme.accent;
      this.bgCtx.fillRect(x, y, 1, 1);
    }
    this.bgCtx.globalAlpha = 1;
  }

  // ==================== 主循环 ====================
  animate() {
    if (!this.isPageVisible) { this.rafId = requestAnimationFrame(() => this.animate()); return; }
    const now = performance.now();
    const dt = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.fpsHistory.push(1000 / Math.max(dt, 1));
    if (this.fpsHistory.length > 30) this.fpsHistory.shift();
    if (this.fpsHistory.length === 30 && this.fpsHistory.reduce((a, b) => a + b, 0) / 30 < 30) {
      this.adaptiveDegrade();
    }

    this.time++;
    const theme = THEMES[this.currentTheme];
    const sprite = this.themeSprites[this.currentTheme];
    const spriteBlur = this.themeSpritesBlur[this.currentTheme];
    const spritePrev = this.themeFade < 1 ? this.themeSprites[this.prevTheme] : null;

    if (this.themeFade < 1) {
      this.themeFade = Math.min(1, (performance.now() - this.themeFadeStart) / 300);
    }

    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = 'rgba(10,7,5,0.14)';
    this.ctx.fillRect(0, 0, this.W, this.H);

    this.inkCtx.globalCompositeOperation = 'destination-out';
    this.inkCtx.fillStyle = 'rgba(0,0,0,0.04)';
    this.inkCtx.fillRect(0, 0, this.W, this.H);
    this.inkCtx.globalCompositeOperation = 'lighter';

    this.ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].update();
      this.particles[i].draw(sprite, spriteBlur, spritePrev);
    }

    for (const p of this.ambientParticles) {
      p.update();
      p.draw(theme);
    }

    if (this.burstTimer > 0) this.burstTimer--;

    this.drawStarLinks(theme);

    this.ctx.globalCompositeOperation = 'lighter';
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += 4;
      r.alpha *= 0.96;
      if (r.alpha < 0.02) { this.ripples.splice(i, 1); continue; }
      this.ctx.strokeStyle = 'rgba(212,175,106,' + r.alpha.toFixed(3) + ')';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = 'source-over';

    if (this.isAutoPlay) {
      this.playProgress = ((Date.now() - this.playStartTime) % SCENE_DURATION) / SCENE_DURATION;
      const fill = document.getElementById('progressFill');
      if (fill) fill.style.width = (this.playProgress * 100) + '%';
      const elapsed = Math.floor(this.playProgress * 60);
      const td = document.getElementById('timeDisplay');
      if (td) td.textContent =
        String(Math.floor(elapsed / 60)).padStart(2, '0') + ':' + String(elapsed % 60).padStart(2, '0') + ' / 01:00';
      if (this.playProgress >= 0.99) {
        const keys = Object.keys(SCENES);
        const idx = (keys.indexOf(this.currentScene) + 1) % keys.length;
        this.switchScene(keys[idx]);
      }
    }

    this.mouseVX *= 0.85;
    this.mouseVY *= 0.85;

    this.rafId = requestAnimationFrame(() => this.animate());
  }

  drawStarLinks(theme) {
    if (this.particles.length < 2) return;
    this.ctx.globalAlpha = 0.08;
    this.ctx.strokeStyle = theme.accent;
    this.ctx.lineWidth = 0.4;
    this.ctx.beginPath();
    const checks = Math.min(200, this.particles.length / 4);
    for (let i = 0; i < checks; i++) {
      const a = this.particles[Math.floor(Math.random() * this.particles.length)];
      const b = this.particles[Math.floor(Math.random() * this.particles.length)];
      const dx = a.x - b.x, dy = a.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 900 && d2 > 4) {
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
      }
    }
    this.ctx.stroke();
  }

  // ==================== 自适应降质 ====================
  adaptiveDegrade() {
    if (this.particles.length <= 800) return;
    for (let i = 0; i < Math.floor(this.particles.length * 0.1); i++) {
      this.particles.pop();
    }
    this.showToast('检测到帧率偏低，已自动优化粒子密度');
  }

  // ==================== 场景切换 ====================
  switchScene(key) {
    if (this.currentScene === key) return;
    const scene = SCENES[key];
    this.currentScene = key;

    this.burstTimer = 50;
    for (const p of this.particles) {
      p.burst = 1.0;
    }

    const trans = document.getElementById('inkTransition');
    if (trans) {
      trans.classList.add('active');
      setTimeout(() => trans.classList.remove('active'), 400);
    }

    document.getElementById('sceneLabel').classList.add('fading');
    document.getElementById('poemCard').classList.add('fading');
    document.getElementById('seal').classList.add('fading');
    document.getElementById('colophon').classList.add('fading');

    setTimeout(() => {
      document.getElementById('sceneLabel').textContent = scene.label;
      // Task 8 安全加固：用 renderMultilineText（DOM API）替代 innerHTML，杜绝 XSS
      renderMultilineText(document.getElementById('poemText'), scene.poem);
      document.getElementById('poemAuthor').textContent = scene.author;
      document.getElementById('seal').textContent = scene.seal;
      document.getElementById('colophonTitle').textContent = scene.title;
      document.getElementById('colophonDesc').textContent = scene.desc;
      document.getElementById('colophonMeta').textContent = scene.meta + ' · ' + scene.solarTerm;

      document.getElementById('sceneLabel').classList.remove('fading');
      document.getElementById('poemCard').classList.remove('fading');
      document.getElementById('seal').classList.remove('fading');
      document.getElementById('colophon').classList.remove('fading');
    }, 300);

    document.querySelectorAll('.scene-dot').forEach(d => {
      d.classList.toggle('active', d.dataset.scene === key);
    });

    if (key === 'lanting' && (this.lantingPoints === null || this.lantingPoints.length === 0)) {
      this.generateLantingPoints();
    }

    this.generateTargetPositions();
    this.initAmbience();
    this.drawBackground();
    this.playStartTime = Date.now();
    this.playProgress = 0;
    this.showToast(scene.label + ' · ' + scene.title);
  }

  // ==================== 主题切换 ====================
  switchTheme(key) {
    if (this.currentTheme === key) return;
    this.prevTheme = this.currentTheme;
    this.currentTheme = key;
    this.themeFade = 0;
    this.themeFadeStart = performance.now();
    this.fogColor = THEMES[key].bg;
    document.querySelectorAll('.theme-ball').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === key);
    });
    this.drawBackground();
    this.showToast(THEMES[key].name + ' 主题');
  }

  _showInfoCardIfHit(x, y) {
    const poemCard = document.getElementById('poemCard');
    const infoCard = document.getElementById('infoCard');
    if (!poemCard || !infoCard) return;
    const rect = poemCard.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return;
    const scene = SCENES[this.currentScene];
    const poem = document.getElementById('infoPoem');
    const meta = document.getElementById('infoMeta');
    const source = document.getElementById('infoSource');
    const meaning = document.getElementById('infoMeaning');
    if (!poem || !meta || !source || !meaning) return;
    renderMultilineText(poem, scene.poem);
    meta.textContent = scene.author || '佚名';
    source.textContent = scene.title ? '出处 · ' + scene.title : '';
    meaning.textContent = scene.desc || '（暂无释义）';
    const cardW = 300, cardH = infoCard.offsetHeight || 220, margin = 12;
    let cx = x + margin, cy = y + margin;
    if (cx + cardW > window.innerWidth - 8) cx = x - cardW - margin;
    if (cy + cardH > window.innerHeight - 8) cy = window.innerHeight - cardH - 8;
    if (cx < 8) cx = 8;
    if (cy < 8) cy = 8;
    infoCard.style.left = cx + 'px';
    infoCard.style.top = cy + 'px';
    infoCard.classList.add('show');
  }

  hasTheme(key) {
    return Object.prototype.hasOwnProperty.call(THEMES, key);
  }

  // ==================== Toast ====================
  showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
  }

  // ==================== 墨散过渡（供主控制器模式切换调用） ====================
  playInkTransition(onDone) {
    const trans = document.getElementById('inkTransition');
    if (!trans) { onDone?.(); return; }
    trans.classList.add('active');
    setTimeout(() => {
      trans.classList.remove('active');
      onDone?.();
      // 墨散完成后通知主控制器
      if (window.app && typeof window.app._onInkScatterDone === 'function') {
        window.app._onInkScatterDone();
      }
    }, 400);
  }

  // ==================== UI 构建 ====================
  buildUI() {
    const nav = document.getElementById('sceneNav');
    Object.keys(SCENES).forEach((key) => {
      const dot = document.createElement('div');
      dot.className = 'scene-dot' + (key === this.currentScene ? ' active' : '');
      dot.dataset.scene = key;
      dot.dataset.name = SCENES[key].label;
      dot.addEventListener('click', () => this.switchScene(key));
      nav.appendChild(dot);
    });

    const picker = document.getElementById('themePicker');
    Object.keys(THEMES).forEach(key => {
      const ball = document.createElement('div');
      ball.className = 'theme-ball' + (key === this.currentTheme ? ' active' : '');
      ball.dataset.theme = key;
      ball.dataset.name = THEMES[key].name;
      ball.style.background = THEMES[key].main;
      ball.style.color = THEMES[key].accent;
      ball.addEventListener('click', () => this.switchTheme(key));
      picker.appendChild(ball);
    });

    const scene = SCENES[this.currentScene];
    document.getElementById('sceneLabel').textContent = scene.label;
    // Task 8 安全加固：用 renderMultilineText（DOM API）替代 innerHTML，杜绝 XSS
    renderMultilineText(document.getElementById('poemText'), scene.poem);
    document.getElementById('poemAuthor').textContent = scene.author;
    document.getElementById('seal').textContent = scene.seal;
    document.getElementById('colophonTitle').textContent = scene.title;
    document.getElementById('colophonDesc').textContent = scene.desc;
    document.getElementById('colophonMeta').textContent = scene.meta + ' · ' + scene.solarTerm;
  }

  // ==================== 事件绑定 ====================
  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousemove', e => {
      this.lastMouseX = this.mouseX; this.lastMouseY = this.mouseY;
      this.mouseX = e.clientX; this.mouseY = e.clientY;
      this.mouseVX = this.mouseX - this.lastMouseX;
      this.mouseVY = this.mouseY - this.lastMouseY;
      this.isMouseActive = true;
      // 改动2：节流检测最近粒子并高亮（对齐 3D raycaster 悬停反馈）
      const now = performance.now();
      if (now - this._lastHoverTime > 50) {
        this._lastHoverTime = now;
        let nearest = null, minD2 = 1600;
        for (const p of this.particles) {
          const dx = p.x - e.clientX, dy = p.y - e.clientY;
          const d2 = dx * dx + dy * dy;
          if (d2 < minD2) { minD2 = d2; nearest = p; }
        }
        if (this._hoverParticle && this._hoverParticle !== nearest) {
          this._hoverParticle.targetAlpha = 0.5 + Math.random() * 0.3;
        }
        if (nearest) {
          nearest.targetAlpha = 1;
          this._hoverParticle = nearest;
        } else {
          this._hoverParticle = null;
        }
      }
    });
    this.canvas.addEventListener('mouseleave', () => { this.isMouseActive = false; });
    this.canvas.addEventListener('mousedown', e => {
      this.isMouseDown = true;
      for (const p of this.particles) {
        const dx = p.x - e.clientX, dy = p.y - e.clientY;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 80) {
          p.burst = 0.6;
          p.targetAlpha = 1;
        }
      }
    });
    this.canvas.addEventListener('mouseup', () => { this.isMouseDown = false; });
    this.canvas.addEventListener('click', e => {
      const now = performance.now();
      if (now - this._lastClickTime < 200) return;
      this._lastClickTime = now;
      const rect = this.canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
      if (this.ripples.length < 20) this.ripples.push({ x: cx, y: cy, radius: 0, alpha: 0.8 });
      for (const p of this.particles) {
        const dx = p.x - cx, dy = p.y - cy;
        if (dx * dx + dy * dy < 40000) p.burst = Math.max(p.burst, 0.8);
      }
      for (let i = 0; i < 60; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 30;
        const p = this.particles[Math.floor(Math.random() * this.particles.length)];
        if (p) {
          p.x = e.clientX;
          p.y = e.clientY;
          p.vx = Math.cos(a) * (2 + r * 0.05);
          p.vy = Math.sin(a) * (2 + r * 0.05);
          p.burst = 0.5;
          p.targetAlpha = 1;
        }
      }
      this._showInfoCardIfHit(cx, cy);
    });

    this.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this.zoom = Math.max(0.5, Math.min(2.5, this.zoom - e.deltaY * 0.001));
      this.generateTargetPositions();
    }, { passive: false });

    this.canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        this.mouseX = e.touches[0].clientX;
        this.mouseY = e.touches[0].clientY;
        this.isMouseActive = true;
        this.isMouseDown = true;
      }
    });
    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if (e.touches.length === 1) {
        this.lastMouseX = this.mouseX; this.lastMouseY = this.mouseY;
        this.mouseX = e.touches[0].clientX;
        this.mouseY = e.touches[0].clientY;
        this.mouseVX = this.mouseX - this.lastMouseX;
        this.mouseVY = this.mouseY - this.lastMouseY;
      }
    }, { passive: false });
    this.canvas.addEventListener('touchend', () => {
      this.isMouseActive = false;
      this.isMouseDown = false;
    });

    document.addEventListener('keydown', e => {
      const keys = Object.keys(SCENES);
      if (e.key >= '1' && e.key <= '6') {
        const idx = parseInt(e.key) - 1;
        if (keys[idx]) this.switchScene(keys[idx]);
      } else if (e.key === ' ') {
        e.preventDefault();
        this.isAutoPlay = !this.isAutoPlay;
        if (this.isAutoPlay) this.playStartTime = Date.now() - this.playProgress * SCENE_DURATION;
        const btn = document.getElementById('playBtn');
        if (btn) btn.textContent = this.isAutoPlay ? '❚❚' : '▶';
      } else if (e.key === 't' || e.key === 'T') {
        const tk = Object.keys(THEMES);
        const idx = (tk.indexOf(this.currentTheme) + 1) % tk.length;
        this.switchTheme(tk[idx]);
      }
    });

    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.isAutoPlay = !this.isAutoPlay;
        if (this.isAutoPlay) this.playStartTime = Date.now() - this.playProgress * SCENE_DURATION;
        playBtn.textContent = this.isAutoPlay ? '❚❚' : '▶';
      });
    }

    const progressWrap = document.getElementById('progressWrap');
    if (progressWrap) {
      progressWrap.addEventListener('click', e => {
        const rect = e.currentTarget.getBoundingClientRect();
        this.playProgress = (e.clientX - rect.left) / rect.width;
        this.playStartTime = Date.now() - this.playProgress * SCENE_DURATION;
      });
    }

    const densitySlider = document.getElementById('densitySlider');
    if (densitySlider) {
      densitySlider.addEventListener('input', e => {
        this.particleDensity = e.target.value / 100;
        const dv = document.getElementById('densityValue');
        if (dv) dv.textContent = e.target.value + '%';
        this.initParticles();
      });
    }

    document.addEventListener('visibilitychange', () => {
      this.isPageVisible = !document.hidden;
      if (this.isPageVisible) this.lastFrameTime = performance.now();
    });
  }

  // ==================== 初始化（一次性） ====================
  init() {
    if (this._inited) return;
    this._inited = true;
    this.buildThemeSprites();
    this.buildUI();
    this.resize();
    this.bindEvents();
  }

  // ==================== 加载页动画 ====================
  _runLoader(onDone) {
    let progress = 0;
    const loaderFill = document.getElementById('loaderFill');
    const loaderTimer = setInterval(() => {
      progress += 8 + Math.random() * 12;
      if (progress >= 100) {
        progress = 100;
        clearInterval(loaderTimer);
        if (loaderFill) loaderFill.style.width = '100%';
        setTimeout(() => {
          const loader = document.getElementById('loader');
          if (loader) loader.classList.add('hide');
          onDone();
        }, 300);
      } else {
        if (loaderFill) loaderFill.style.width = progress + '%';
      }
    }, 120);
  }

  // ==================== 启动 ====================
  start() {
    if (!this._inited) this.init();
    if (this._isRunning) return;
    if (!this._loaderDone) {
      this._runLoader(() => {
        this._loaderDone = true;
        this._startLoop();
      });
    } else {
      this._startLoop();
    }
  }

  _startLoop() {
    this._isRunning = true;
    this.lastFrameTime = performance.now();
    this.playStartTime = Date.now();
    this.animate();
  }

  // ==================== 停止 ====================
  stop() {
    this._isRunning = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  // ==================== 销毁 ====================
  destroy() {
    this.stop();
    this.particles = [];
    this.ambientParticles = [];
    this.themeSprites = {};
    this.lantingPoints = null;
    this._inited = false;
    this._loaderDone = false;
  }
}

// 功能描述：中华文化粒子云引擎的 2D Canvas 引擎。完整迁移自单文件版《星河粒子-沉浸展.html》的 <script> 块，封装为 Engine2D 类。包含 SimplexNoise 噪声场、Simplex 流场粒子运动、水墨拖尾、预渲染发光精灵、加法混合、5 套主题（古典金墨/青绿/夜墨/水墨/朱砂）、6 个意境场景（千山/月泊/牡丹/兰亭/星宿/烟雨）、鼠标涡旋/点击召唤/滚轮缩放/键盘控制、自适应降质、加载页动画、墨散过渡等能力。
// 对齐 3D 同等水平的视觉能力（9 项）：(基础 5 项) 景深层次 z+depthScale/depthAlpha+blur sprite 缓存、Morph 平滑过渡 prevTx/prevTy+morphProgress lerp、主题颜色过渡 spritePrev cross-fade 300ms、点击交互 波纹+burst+信息卡、多层流场 3 频 noise2D 叠加；(精修 4 项) 远景雾化融合 fogColor+source-over 叠加模拟 3D Fog、悬停高亮 mousemove 节流检测最近粒子、移动端自动降质 maxTouchPoints 检测+粒子上限 2500+环境粒子减半、粒子尺寸非线性距离衰减 Math.pow(z,1.8) 模拟 3D 的 300/-z 曲线。
// 提供 init/start/stop/switchScene/switchTheme/resize/destroy/playInkTransition 方法，并通过 playInkTransition 在墨散完成后回调 window.app._onInkScatterDone() 通知主控制器完成模式切换。
