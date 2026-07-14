// ============================================================
// js/engine3d.js
// 中华文化粒子云引擎 · 3D WebGL 引擎（Task 2：粒子云渲染 + 自适应降质）
// 基于 Three.js r169，集成 ParticleSystem3D 与 FPS 监测驱动的质量分级
// ============================================================

// 通过 index.html 中的 import map 将 bare specifier 解析到本地 vendor
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ParticleSystem3D } from './particle-system3d.js';
import { Layouts } from './layouts.js';
import { ThemePack, validateThemePack, sanitizeThemePack } from './theme-pack.js';
import { FlightControls } from './flight-controls.js';

export class Engine3D {
  /**
   * @param {HTMLCanvasElement} canvas  # webglCanvas 元素
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.rafId = null;
    this.lastFrameTime = 0;
    this.elapsedTime = 0;          // 累计秒，用于 uTime
    this.currentTheme = null;

    /** @type {ParticleSystem3D|null} */
    this.particleSystem = null;

    // ====== FPS 监测与自适应降质 ======
    this.fpsHistory = [];          // 最近 60 帧 dt（秒）
    this.fpsHistoryMax = 60;
    this.currentFPS = 60;
    this.currentQuality = 'high';
    this.lowFpsAccum = 0;          // FPS<30 持续秒数
    this.highFpsAccum = 0;         // FPS>50 持续秒数
    this.lastToastQuality = null;  // 防止重复 toast

    this.isRunning = false;
    this._inited = false;

    // ====== Task 9.4：visibilitychange 暂停标志 ======
    /** 是否因页面隐藏而被 visibilitychange 暂停（恢复时只重启被它暂停的循环） */
    this._suspendedByVisibility = false;
    /** visibilitychange 处理函数引用（destroy 时解绑用） */
    this._onVisibilityChange = null;

    // ====== Task 5：飞行控制 / 射线检测 / 交互 ======
    /** @type {FlightControls|null} */
    this.flightControls = null;
    /** @type {THREE.Raycaster|null} */
    this.raycaster = null;
    this.raycasterThreshold = 1.0; // Points 命中精度阈值（可调 0.5~2.0）
    this._mouseNDC = new THREE.Vector2();
    this._lastHoverTime = 0;        // 悬停节流时间戳
    this._hoverThrottleMs = 50;
    this._eventsBound = false;      // canvas 事件是否已绑定
    this._mouseDownPos = null;       // mousedown 位置（用于区分点击/拖拽）
    this._mouseDownTime = 0;
    this._lastHoverIndex = -1;       // 上一次悬停命中的粒子（避免重复 highlight）
    this.suspendHover = false;       // 搜索高亮期间暂停悬停（由 main.js 设置）

    /** 当前主题的 content 数组（用于粒子索引反查内容） */
    this.currentContent = null;

    /**
     * 粒子拾取回调（由 main.js 注册，用于弹出信息卡）
     * @type {(payload:{particleIndex:number,position:THREE.Vector3,content:object,screenX:number,screenY:number}|null)=>void}
     */
    this.onParticlePicked = null;
  }

  /**
   * 初始化 Three.js 场景 / 相机 / 渲染器 / OrbitControls / 粒子系统
   * WebGL 不可用时抛出友好错误，由 main.js 捕获后 toast 提示并降级到 2D
   */
  init() {
    if (this._inited) return;
    if (typeof THREE === 'undefined') {
      throw new Error('Three.js 未加载，3D 引擎不可用');
    }
    // 检测 WebGL 支持
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) {
      throw new Error('当前浏览器不支持 WebGL，已降级为 2D 意境模式');
    }

    const w = window.innerWidth;
    const h = window.innerHeight;

    // 场景：深色背景，远雾增强空间纵深
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0705);
    this.scene.fog = new THREE.Fog(0x0a0705, 300, 2200);

    // 透视相机：60° 视场，0.1 ~ 5000 远近裁剪
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 5000);
    this.camera.position.set(0, 0, 600);

    // 渲染器：抗锯齿、透明背景、像素比限制为 2
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);

    // OrbitControls：阻尼旋转，限制缩放距离
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 0.8;
    this.controls.panSpeed = 0.6;
    this.controls.minDistance = 100;
    this.controls.maxDistance = 2500;

    // ====== Task 5.1：飞行控制器（叠加在 OrbitControls 之上） ======
    // FlightControls 构造时会禁用 OrbitControls.enableZoom，滚轮改为调速
    this.flightControls = new FlightControls({
      camera: this.camera,
      controls: this.controls,
      domElement: this.canvas
    });

    // ====== Task 5.2：射线检测器（粒子点击 / 悬停） ======
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = this.raycasterThreshold;

    // ====== 创建粒子系统（maxParticles 10 万上限） ======
    this.particleSystem = new ParticleSystem3D({
      scene: this.scene,
      theme: null,
      maxParticles: 100000
    });

    // ====== 移动端检测：触屏设备初始 medium ======
    if (typeof navigator !== 'undefined' && (navigator.maxTouchPoints || 0) > 1) {
      this.particleSystem.setQuality('medium');
      this.currentQuality = 'medium';
    }

    // ====== Task 9.4：visibilitychange 暂停 3D 渲染循环 ======
    // 页面隐藏（切标签页 / 最小化）时停止 RAF 省电，恢复时自动重启；
    // 仅恢复被 visibilitychange 主动暂停的循环，避免误启动用户手动 stop() 的引擎
    this._onVisibilityChange = () => {
      if (document.hidden) {
        if (this.isRunning) {
          this._suspendedByVisibility = true;
          this.stop();
        }
      } else {
        if (this._suspendedByVisibility) {
          this._suspendedByVisibility = false;
          this.start();
        }
      }
    };
    document.addEventListener('visibilitychange', this._onVisibilityChange);

    this._inited = true;
  }

  /**
   * 启动渲染循环
   */
  start() {
    if (!this._inited) this.init();
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    const loop = () => {
      if (!this.isRunning) return;
      const now = performance.now();
      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05);
      this.lastFrameTime = now;
      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  /**
   * 停止渲染循环
   */
  stop() {
    this.isRunning = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  /**
   * 每帧更新逻辑：粒子系统 + OrbitControls + FPS 监测驱动的自适应降质
   * @param {number} dt 秒级时间步长
   */
  update(dt) {
    if (this.controls) this.controls.update();
    // Task 5.1：飞行控制器更新（WASD/QE/Shift + 滚轮调速 + 飞行动画）
    if (this.flightControls) this.flightControls.update(dt);

    this.elapsedTime += dt;
    if (this.particleSystem) {
      this.particleSystem.update(dt, this.elapsedTime);
    }

    this._updateFPS(dt);
  }

  /**
   * FPS 滑动平均 + 自适应降质 / 升级
   * @param {number} dt 秒
   * @private
   */
  _updateFPS(dt) {
    this.fpsHistory.push(dt);
    if (this.fpsHistory.length > this.fpsHistoryMax) this.fpsHistory.shift();

    // 仅在缓冲填满后再开始评估，避免冷启动误判
    if (this.fpsHistory.length < 30) return;

    let sum = 0;
    for (let i = 0; i < this.fpsHistory.length; i++) sum += this.fpsHistory[i];
    const avgDt = sum / this.fpsHistory.length;
    this.currentFPS = avgDt > 0 ? 1 / avgDt : 0;

    if (this.currentFPS < 30) {
      this.lowFpsAccum += dt;
      this.highFpsAccum = 0;
      if (this.lowFpsAccum >= 1) {
        // 触发降级
        if (this.currentQuality === 'high') {
          this._applyQuality('medium', '检测到帧率偏低，已自动降质');
        } else if (this.currentQuality === 'medium') {
          this._applyQuality('low', '帧率持续偏低，已进一步降质');
        }
        this.lowFpsAccum = 0;
      }
    } else if (this.currentFPS > 50) {
      this.highFpsAccum += dt;
      this.lowFpsAccum = 0;
      if (this.highFpsAccum >= 2) {
        // 仅从 low 升回 medium，不直接升 high 防抖动
        if (this.currentQuality === 'low') {
          this._applyQuality('medium', '帧率恢复，已提升质量');
        }
        this.highFpsAccum = 0;
      }
    } else {
      // 30-50 之间：温和区间，重置累积
      this.lowFpsAccum = 0;
      this.highFpsAccum = 0;
    }
  }

  /**
   * 应用质量分级并 toast 提示（避免对同一档重复 toast）
   * @param {'high'|'medium'|'low'} level
   * @param {string} msg
   * @private
   */
  _applyQuality(level, msg) {
    if (!this.particleSystem || level === this.currentQuality) return;
    this.particleSystem.setQuality(level);
    this.currentQuality = level;
    if (this.lastToastQuality !== level) {
      this._toast(msg);
      this.lastToastQuality = level;
    }
  }

  /**
   * 渲染一帧
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * 视口尺寸变化
   */
  resize(w, h) {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    // 同步像素比到 material uniform
    if (this.particleSystem) {
      this.particleSystem.material.uniforms.uPixelRatio.value =
        Math.min(window.devicePixelRatio || 1, 2);
    }
  }

  /**
   * 加载主题包：应用主题 → 根据 layout 调用对应布局算法生成目标位置 → 触发 morph
   * 优先使用 Layouts 模块（Task 3 提供 galaxy/scroll/constellation/grid/text/custom）；
   * 若 layout 未识别或 Layouts 缺失，回退到球形随机分布占位
   * @param {object} themePack 主题数据包 { name, palette, particleCount, layout, content }
   */
  loadTheme(themePack) {
    if (!themePack) return;
    // Task 8 安全加固：loadTheme 入口处做 schema 校验
    // 若传入 plain object（非 ThemePack 实例），先校验 schema，再净化为安全副本后使用
    // ThemePack 实例已在构造时校验+净化，直接放行
    if (!(themePack instanceof ThemePack)) {
      const { valid, errors } = validateThemePack(themePack);
      if (!valid) {
        console.warn('[Engine3D][Security] 主题包校验失败，拒绝加载：', errors.join('; '));
        if (window.app && typeof window.app._toast === 'function') {
          window.app._toast('主题数据无效，已拒绝加载', 2500);
        }
        return;
      }
      themePack = sanitizeThemePack(themePack);
    }
    this.currentTheme = themePack;
    // Task 5.2/5.3：保存 content 数组，供点击粒子反查诗句内容
    this.currentContent = Array.isArray(themePack.content) ? themePack.content : [];
    if (!this.particleSystem) return;

    // 1. 应用主题（重填颜色 + 调整粒子数量）
    this.particleSystem.setTheme(themePack);

    // 2. 生成目标位置：优先用 Layouts 模块按 layout 字段分发
    const count = this.particleSystem.activeParticles;
    const layoutName = themePack.layout;
    let targets = null;
    try {
      if (layoutName && Layouts && typeof Layouts[layoutName] === 'function') {
        // content 数组传给布局算法（constellation / text 等会用到）
        const content = Array.isArray(themePack.content) ? themePack.content : [];
        targets = Layouts[layoutName](content, count);
      }
    } catch (err) {
      console.warn('[Engine3D] 布局算法异常，回退球形：', err.message);
      targets = null;
    }
    // 兜底：球形随机分布占位
    if (!targets || targets.length < count * 3) {
      targets = this._fallbackSphereLayout(count);
    }

    // 3. 触发 morph 动画
    this.particleSystem.setTargets(targets);
  }

  /**
   * Task 6：加载自定义目标点（文字采样 / 自定义输入）
   * 接收已计算好的目标坐标数组与可选配色，应用配色后调整 activeParticles，
   * 最后调用 setTargets 触发 morph 动画
   * @param {Float32Array|number[]} positionsArray 目标坐标数组（长度 = 粒子数 * 3）
   * @param {object} [palette] 自定义配色 { main, accent, glow, bg, bg2 }，缺省用金墨配色
   */
  loadCustomTargets(positionsArray, palette) {
    if (!this.particleSystem || !positionsArray || positionsArray.length === 0) return;

    // 构造一个最小 ThemePack 形态的临时对象，复用 setTheme 的配色与粒子数调整逻辑
    const safePalette = palette && typeof palette === 'object' ? palette : {
      main: '#d4af6a', accent: '#f4d77e', glow: '#8b6929', bg: '#0a0705', bg2: '#1a1208'
    };
    const targetCount = Math.floor(positionsArray.length / 3);
    // 限制在 maxParticles 内（ParticleSystem3D 上限 100000）
    const desired = Math.max(1, Math.min(this.particleSystem.maxParticles, targetCount));
    const customPack = {
      id: 'custom-input',
      name: '自定义文字',
      palette: safePalette,
      particleCount: desired,
      content: []
    };
    // setTheme 会归一化调色板、重填 aColor、调整 activeParticles 与 drawRange
    this.particleSystem.setTheme(customPack);

    // 同步当前主题状态（供信息卡 / HUD / 反查使用）
    this.currentTheme = { ...customPack, layout: 'custom', category: '自定义', era: '', description: '用户输入文字采样' };
    this.currentContent = [];

    // 将目标坐标写入：若 positionsArray 长度 > desired*3 则截断，不足则按 positionsArray 实际长度
    const len = Math.min(positionsArray.length, desired * 3);
    const targets = positionsArray instanceof Float32Array
      ? positionsArray.subarray(0, len)
      : new Float32Array(positionsArray.slice(0, len));
    this.particleSystem.setTargets(targets);
  }

  /**
   * Fallback 布局：球形随机分布占位（Task 3 替换为真实布局）
   * 半径 240，含 simplex 噪声扰动以让 morph 过程更自然
   * @param {number} count 粒子数
   * @returns {Float32Array} length = count*3
   * @private
   */
  _fallbackSphereLayout(count) {
    const arr = new Float32Array(count * 3);
    const R = 240;
    for (let i = 0; i < count; i++) {
      // 均匀球面采样
      const u = (i + 0.5) / count;
      const theta = Math.acos(1 - 2 * u);
      const phi = Math.PI * (1 + Math.sqrt(5)) * i;
      const st = Math.sin(theta), ct = Math.cos(theta);
      let x = R * st * Math.cos(phi);
      let y = R * ct;
      let z = R * st * Math.sin(phi);
      // 简单径向扰动
      const r = 0.7 + Math.random() * 0.6;
      x *= r; y *= r; z *= r;
      const i3 = i * 3;
      arr[i3]     = x;
      arr[i3 + 1] = y;
      arr[i3 + 2] = z;
    }
    return arr;
  }

  /**
   * 当前激活粒子数（供外部 / 验证脚本读取）
   */
  get particlesCount() {
    return this.particleSystem ? this.particleSystem.particlesCount : 0;
  }

  // ============================================================
  // Task 5：飞行导航 + 射线检测 + 粒子交互集成
  // ============================================================

  /**
   * 启用 3D 交互（切换到 3D 模式时调用）
   * 启用 FlightControls + 绑定 canvas 点击/悬停事件
   */
  enableInteraction() {
    if (this.flightControls) this.flightControls.enable();
    this._bindInteractionEvents();
  }

  /**
   * 禁用 3D 交互（切换到 2D 模式时调用）
   */
  disableInteraction() {
    if (this.flightControls) this.flightControls.disable();
    this._unbindInteractionEvents();
    if (this.particleSystem) this.particleSystem.clearHighlight();
  }

  /**
   * 绑定 canvas 鼠标事件：mousemove（悬停节流）+ mousedown/mouseup（区分点击/拖拽）
   * @private
   */
  _bindInteractionEvents() {
    if (this._eventsBound || !this.canvas) return;
    this._eventsBound = true;
    this._onMouseMove = (e) => this._handleMouseMove(e);
    this._onMouseDown = (e) => this._handleMouseDown(e);
    this._onMouseUp   = (e) => this._handleMouseUp(e);
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
  }

  /**
   * 解绑 canvas 鼠标事件
   * @private
   */
  _unbindInteractionEvents() {
    if (!this._eventsBound) return;
    this._eventsBound = false;
    if (this._onMouseMove) this.canvas.removeEventListener('mousemove', this._onMouseMove);
    if (this._onMouseDown) this.canvas.removeEventListener('mousedown', this._onMouseDown);
    if (this._onMouseUp) window.removeEventListener('mouseup', this._onMouseUp);
    this._mouseDownPos = null;
    this._lastHoverIndex = -1;
  }

  /**
   * 鼠标移动：节流 50ms 做射线检测，命中则高亮粒子
   * @param {MouseEvent} e
   * @private
   */
  _handleMouseMove(e) {
    // 搜索高亮期间暂停悬停（避免覆盖搜索高亮）
    if (this.suspendHover) return;
    const now = performance.now();
    if (now - this._lastHoverTime < this._hoverThrottleMs) return;
    this._lastHoverTime = now;

    this._updateMouseNDC(e);
    const idx = this.raycast();
    if (idx !== this._lastHoverIndex) {
      this._lastHoverIndex = idx;
      if (idx >= 0 && this.particleSystem) {
        this.particleSystem.highlight(idx);
      } else if (this.particleSystem) {
        this.particleSystem.clearHighlight();
      }
    }
  }

  /**
   * mousedown：记录起点，用于区分点击与拖拽
   * @param {MouseEvent} e
   * @private
   */
  _handleMouseDown(e) {
    this._mouseDownPos = { x: e.clientX, y: e.clientY };
    this._mouseDownTime = performance.now();
  }

  /**
   * mouseup：若位移 < 5px 且时间 < 350ms，视为点击，触发粒子拾取
   * @param {MouseEvent} e
   * @private
   */
  _handleMouseUp(e) {
    if (!this._mouseDownPos) return;
    const dx = e.clientX - this._mouseDownPos.x;
    const dy = e.clientY - this._mouseDownPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dt = performance.now() - this._mouseDownTime;
    const isClick = dist < 5 && dt < 350;
    this._mouseDownPos = null;
    if (!isClick) return; // 拖拽不触发点击

    this._updateMouseNDC(e);
    const idx = this.raycast();
    if (idx >= 0) {
      this._emitPick(idx, e.clientX, e.clientY);
    } else {
      // 点击空白：关闭信息卡
      if (this.onParticlePicked) this.onParticlePicked(null);
    }
  }

  /**
   * 更新鼠标 NDC 坐标（-1..1）
   * @param {MouseEvent} e
   * @private
   */
  _updateMouseNDC(e) {
    const rect = this.canvas.getBoundingClientRect();
    this._mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * 发射粒子拾取事件：计算屏幕坐标 + 反查 content，调用 onParticlePicked 回调
   * @param {number} idx 粒子索引
   * @param {number} clientX 屏幕坐标 X（用于信息卡定位 fallback）
   * @param {number} clientY 屏幕坐标 Y
   * @private
   */
  _emitPick(idx, clientX, clientY) {
    if (!this.particleSystem) return;
    const i3 = idx * 3;
    const positions = this.particleSystem.positions;
    const pos = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
    // 投影到屏幕坐标
    const screen = pos.clone().project(this.camera);
    const sx = (screen.x + 1) / 2 * window.innerWidth;
    const sy = (1 - screen.y) / 2 * window.innerHeight;
    const content = this.getParticleContent(idx);
    if (this.onParticlePicked) {
      this.onParticlePicked({
        particleIndex: idx,
        position: pos,
        content,
        screenX: sx,
        screenY: sy,
        clientX,
        clientY
      });
    }
  }

  /**
   * 射线检测：优先 raycaster.intersectObject(points)；若无命中，回退到 CPU 遍历
   * 返回命中粒子索引，无命中返回 -1
   * @returns {number}
   */
  raycast() {
    if (!this.raycaster || !this.camera || !this.particleSystem) return -1;
    this.raycaster.setFromCamera(this._mouseNDC, this.camera);
    this.raycaster.params.Points.threshold = this.raycasterThreshold;

    const points = this.particleSystem.points;
    if (points) {
      const hits = this.raycaster.intersectObject(points, false);
      if (hits && hits.length > 0 && hits[0].index !== undefined) {
        return hits[0].index;
      }
    }
    // 回退：相机射线方向上最近的粒子（CPU 端遍历 typed array）
    return this._raycastFallback();
  }

  /**
   * 回退射线检测：遍历所有粒子 positions，找射线垂直距离最小且在阈值内的粒子
   * 直接访问 typed array，不解构，性能友好
   * @returns {number} 命中索引或 -1
   * @private
   */
  _raycastFallback() {
    if (!this.raycaster || !this.particleSystem) return -1;
    const ray = this.raycaster.ray;
    const ox = ray.origin.x, oy = ray.origin.y, oz = ray.origin.z;
    const dx = ray.direction.x, dy = ray.direction.y, dz = ray.direction.z;
    const positions = this.particleSystem.positions;
    const count = this.particleSystem.activeParticles;
    const threshold = 2.5; // 回退阈值（世界单位）
    const threshold2 = threshold * threshold;

    let bestIdx = -1;
    let bestPerpSq = threshold2; // 仅取阈值内最近

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const px = positions[i3];
      const py = positions[i3 + 1];
      const pz = positions[i3 + 2];
      // OP = P - O
      const vx = px - ox;
      const vy = py - oy;
      const vz = pz - oz;
      // 沿射线投影 t = OP · D（必须 > 0，即粒子在相机前方）
      const t = vx * dx + vy * dy + vz * dz;
      if (t < 0) continue;
      // 垂直距离平方 = |OP|² - t²
      const opLenSq = vx * vx + vy * vy + vz * vz;
      const perpSq = opLenSq - t * t;
      if (perpSq > threshold2) continue;
      if (perpSq < bestPerpSq) {
        bestPerpSq = perpSq;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  /**
   * 通过粒子索引反查主题 content（粒子 i 对应 content[i % content.length]）
   * @param {number} index
   * @returns {object|null}
   */
  getParticleContent(index) {
    if (!this.currentContent || this.currentContent.length === 0) return null;
    const i = ((index % this.currentContent.length) + this.currentContent.length) % this.currentContent.length;
    return this.currentContent[i] || null;
  }

  /**
   * Task 5.5：相机平滑飞向目标点（供搜索框调用）
   * @param {THREE.Vector3} targetWorld
   * @param {number} [duration]
   * @param {number} [distance]
   */
  flyTo(targetWorld, duration, distance) {
    if (this.flightControls) this.flightControls.flyTo(targetWorld, duration, distance);
  }

  /**
   * Task 5.1 / Task 7.4：HUD 状态快照（供 UI 调用）
   * @returns {{speed:number,x:number,y:number,z:number,multiplier:number,particles:number,fps:number,quality:string,themeName:string}}
   */
  getHUDState() {
    const fc = this.flightControls ? this.flightControls.getHUDState() : { speed: 0, x: 0, y: 0, z: 0, multiplier: 1 };
    return {
      speed: fc.speed,
      x: fc.x,
      y: fc.y,
      z: fc.z,
      multiplier: fc.multiplier,
      particles: this.particlesCount,
      fps: Math.round(this.currentFPS),
      quality: this.currentQuality,
      // Task 7.4：当前主题名（供 HUD 主题行显示）
      themeName: this.currentTheme ? (this.currentTheme.name || '') : ''
    };
  }

  /**
   * Task 7.3：按密度系数调整 3D 粒子云的 activeParticles
   * 复制当前主题并调整 particleCount 后重新 setTheme（重算 activeParticles + drawRange + 颜色），
   * 再用当前主题的 layout 重新生成目标位置触发 morph（粒子重新聚形）。
   * @param {number} factor 0.1~1.5，相对 currentTheme.particleCount 的比例
   */
  setDensity(factor) {
    if (!this.particleSystem || !this.currentTheme) return;
    const f = Math.max(0.1, Math.min(1.5, factor));
    const base = this.currentTheme.particleCount || 80000;
    const newCount = Math.max(1000, Math.floor(base * f));
    // 复制主题并调整 particleCount（不修改原主题对象），重新 setTheme
    const adjusted = Object.assign({}, this.currentTheme, { particleCount: newCount });
    this.particleSystem.setTheme(adjusted);
    // 重新生成布局（targets 长度需匹配新 count），复用 loadTheme 的布局选择逻辑
    const count = this.particleSystem.activeParticles;
    const layoutName = this.currentTheme.layout;
    let targets = null;
    try {
      if (layoutName && Layouts && typeof Layouts[layoutName] === 'function') {
        const content = Array.isArray(this.currentTheme.content) ? this.currentTheme.content : [];
        targets = Layouts[layoutName](content, count);
      }
    } catch (err) {
      console.warn('[Engine3D] setDensity 布局异常，回退球形：', err.message);
      targets = null;
    }
    if (!targets || targets.length < count * 3) {
      targets = this._fallbackSphereLayout(count);
    }
    this.particleSystem.setTargets(targets);
  }

  /**
   * Toast 透传：复用 window.app._toast，避免与 UI 强耦合
   * @param {string} msg
   * @private
   */
  _toast(msg) {
    if (window.app && typeof window.app._toast === 'function') {
      window.app._toast(msg, 2200);
    }
  }

  /**
   * 销毁引擎，释放 WebGL 资源
   */
  destroy() {
    this.stop();
    // Task 9.4：解绑 visibilitychange 监听器，避免内存泄漏
    if (this._onVisibilityChange) {
      document.removeEventListener('visibilitychange', this._onVisibilityChange);
      this._onVisibilityChange = null;
    }
    this._suspendedByVisibility = false;
    // Task 5：禁用交互并释放飞行控制器
    this._unbindInteractionEvents();
    if (this.flightControls) {
      this.flightControls.disable();
      this.flightControls = null;
    }
    this.onParticlePicked = null;
    if (this.particleSystem) {
      this.particleSystem.dispose();
      this.particleSystem = null;
    }
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (typeof this.renderer.forceContextLoss === 'function') {
        this.renderer.forceContextLoss();
      }
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
    this._inited = false;
  }
}

// 功能描述：中华文化粒子云引擎的 3D WebGL 引擎实现。基于 Three.js r169 构建
// Scene/PerspectiveCamera/WebGLRenderer/OrbitControls，并在 init() 中创建
// ParticleSystem3D（maxParticles=100000）、FlightControls（Task 5.1 飞行控制器）与
// Raycaster（Task 5.2 射线检测器）。核心能力：
// 1) loadTheme(themePack)：调用 particleSystem.setTheme 应用主题配色与粒子数量，
//    再根据 themePack.layout 调用 Layouts 模块对应算法（galaxy/scroll/constellation/grid/text/custom）
//    生成目标位置；layout 未识别或异常时回退到 _fallbackSphereLayout 球形随机分布；最后触发 morph 动画；
//    同时保存 currentContent 供点击粒子反查诗句内容；
// 1a) Task 6 loadCustomTargets(positionsArray, palette)：接收自定义目标坐标数组与可选配色，
//    构造最小 ThemePack 形态临时对象（id='custom-input'），调用 setTheme 应用金墨配色并调整
//    activeParticles 为采样点数，同步 currentTheme/currentContent，最后 setTargets 触发 morph。
//    供 Task 6 文字采样 / 自定义输入直接渲染粒子云，绕开 Layouts 与 ThemeLoader 链路；
// 2) update(dt)：推进 elapsedTime、调用 particleSystem.update 更新 uTime/uMorphProgress、
//    执行 FPS 滑动平均（最近 60 帧）并驱动自适应降质，并调用 flightControls.update 推进飞行/飞行动画；
// 3) _updateFPS：FPS<30 持续 1 秒 → high 降到 medium、再持续 1 秒 → 降到 low；
//    FPS>50 持续 2 秒 → 从 low 升回 medium（不直接升 high 防抖动）；
//    移动端（navigator.maxTouchPoints>1）初始即 medium；
// 4) Task 5.1 飞行导航：FlightControls 在 OrbitControls 之上叠加 WASD/QE/Shift 平移、
//    滚轮调速（0.5x~5x）、速度阻尼惯性，camera.position 与 controls.target 同步平移避免冲突；
// 5) Task 5.2 射线检测：raycast() 优先 raycaster.intersectObject(points)（threshold 可调 0.5~2.0），
//    无命中时回退 _raycastFallback 遍历 positions typed array 找射线垂直距离最小且在阈值内的粒子，
//    直接访问 typed array 不解构，性能友好；
// 6) Task 5.4 悬停高亮：_handleMouseMove 节流 50ms 做射线检测，命中调用 particleSystem.highlight(idx)
//    放大粒子并淡化邻近，离开则 clearHighlight；
// 7) Task 5.3 点击拾取：_handleMouseDown/Up 区分点击/拖拽（位移<5px 且时间<350ms 视为点击），
//    命中后通过 _emitPick 计算屏幕坐标并反查 content，调用 onParticlePicked 回调弹出信息卡；
// 8) Task 5.5 搜索：flyTo(target) 委托 flightControls.flyTo 平滑飞向粒子簇中心；
// 9) getHUDState()：暴露 {speed,x,y,z,multiplier,particles,fps,quality} 供顶部 HUD 显示；
// 10) enableInteraction/disableInteraction：切换 2D/3D 模式时启用/禁用飞行控制与鼠标事件；
// 11) resize 同步 uPixelRatio；destroy 释放粒子系统 / 控制器 / 渲染器 / 飞行控制器；
// 12) 暴露 currentFPS、particlesCount、currentQuality、getHUDState 供外部读取与验证脚本调用。
// Task 8 安全加固增强：loadTheme 入口处增加 schema 校验——传入非 ThemePack 实例的 plain object 时，
// 调用 validateThemePack 校验 schema（hex 色值 / content 深度≤1000 / particleCount 1~500000 / id 非空），
// 失败则 console.warn + toast 提示并 return 拒绝加载；通过则 sanitizeThemePack 净化为安全副本再使用，
// 防止被篡改的主题数据注入恶意字符串。ThemePack 实例已在构造时校验+净化，直接放行。
// Task 9.4 visibilitychange 暂停：init() 末尾绑定 document visibilitychange 监听器——页面隐藏
// （切标签页/最小化）时若 isRunning 则 stop() 暂停 RAF 省电并置 _suspendedByVisibility=true；
// 恢复可见时仅当 _suspendedByVisibility 为真才 start() 重启，避免误启动用户手动 stop() 的引擎。
// destroy() 中 removeEventListener 解绑监听器并复位标志，防止内存泄漏。
