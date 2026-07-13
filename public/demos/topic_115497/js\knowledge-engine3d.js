// ============================================================
// js/knowledge-engine3d.js
// 知识星图 · 3D 知识星系引擎（2D/3D 双模式 · 3D 渲染层）
// 基于 Three.js r169，将 2D StarMap 的知识图谱映射到 3D 空间：
// 知识节点 → 3D 粒子球（level 决定 Z 轴深度），连线 → 3D 流光，
// 已掌握节点 → 翠绿星座连线，支持 OrbitControls 旋转/缩放 + WASD 飞行穿梭。
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ====== 着色器（内联，简化版：有机运动 + 距离衰减 + 高亮增亮） ======

const vertexShader = /* glsl */`
  attribute float aSize;
  attribute vec3  aColor;
  attribute float aOffset;
  attribute float aNodeIndex;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSizeScale;
  uniform float uHighlightIdx;

  varying vec3  vColor;
  varying float vHighlight;

  void main() {
    vec3 pos = position;
    // 有机运动：sin/cos 驱动粒子在球面附近抖动
    pos.x += sin(uTime * 0.5 + aOffset) * 1.2;
    pos.y += cos(uTime * 0.4 + aOffset * 1.3) * 1.2;
    pos.z += sin(uTime * 0.3 + aOffset * 0.7) * 1.2;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // 高亮增亮（悬停节点时该节点所有粒子加大加亮）
    float highlight = step(0.5, 1.0 - abs(aNodeIndex - uHighlightIdx));
    vHighlight = highlight;

    float ps = aSize * uSizeScale * uPixelRatio * (1.0 + highlight * 0.6)
             * (300.0 / max(-mvPosition.z, 1.0));
    gl_PointSize = clamp(ps, 1.0, 128.0);

    vColor = aColor * (1.0 + highlight * 0.4);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */`
  precision highp float;
  varying vec3  vColor;
  varying float vHighlight;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float alpha = smoothstep(0.5, 0.0, d);
    alpha = pow(alpha, 1.5);
    if (alpha < 0.01) discard;

    vec3 col = vColor * (1.0 + alpha * 0.5);
    gl_FragColor = vec4(col, alpha);
  }
`;

// ====== 常量 ======

// 掌握度颜色（灰 / 金 / 翠绿），与 2D 版 sprites 一致
const MASTERY_COLORS = [
  [0.4, 0.4, 0.533],   // 0 未学 #666688
  [0.831, 0.686, 0.416], // 1 在学 #d4af6a
  [0.416, 0.831, 0.541], // 2 已掌握 #6ad48a
];
const MASTERY_BRIGHTNESS = [0.6, 1.0, 1.4];
const MASTERY_SIZE = [0.85, 1.0, 1.25];

// ====== 辅助函数 ======

function hexToRgbArr(hex) {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

// ====== KnowledgeEngine3D ======

export class KnowledgeEngine3D {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.canvas = null;

    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = 4.0;
    this.mouse = new THREE.Vector2(-2, -2);

    this.starMap = null;

    // 3D 对象
    this.nodePoints = null;          // THREE.Points — 所有知识节点粒子
    this.particleNodeMap = [];       // particleIndex → nodeIndex
    this.connectionLines = null;     // THREE.LineSegments — 连线
    this.constellationLines = null;  // THREE.LineSegments — 星座连线
    this.flowPoints = null;          // THREE.Points — 连线流光粒子
    this.flowData = [];              // [{fromPos:Vector3, toPos:Vector3, t, speed}]
    this.ambientStars = null;        // THREE.Points — 环境星尘
    this.nodeCenters = [];           // 每个节点的 3D 中心位置（Vector3）

    this.clock = new THREE.Clock();
    this.rafId = null;
    this.isRunning = false;

    this.hoveredNodeIndex = -1;
    this.highlightIdx = -1;

    this.keys = {};
    this.isMobile = (navigator.maxTouchPoints > 0) || (window.innerWidth < 768);

    this._onResize = null;
    this._onClick = null;
    this._onPointerMove = null;
    this._onKeyDown = null;
    this._onKeyUp = null;
    this._starmapReadyHandler = null;
    this._masteryChangedHandler = null;
    this._starmapRebuiltHandler = null;
  }

  // ====== 初始化场景 / 相机 / 渲染器 / 控制器 ======

  init(canvas) {
    this.canvas = canvas;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0705, 0.0035);

    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    this.camera.position.set(0, 35, 130);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0705, 1);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 25;
    this.controls.maxDistance = 350;
    this.controls.target.set(0, 0, 0);

    this._bindEvents();
    this._listenStarMapEvents();
  }

  // ====== 从 2D StarMap 构建 3D 场景 ======

  buildFromStarMap(starMap) {
    this.starMap = starMap;
    this._clearSceneObjects();
    if (!starMap || !starMap.nodes || starMap.nodes.length === 0) return;

    const cx = starMap.W / 2;
    const cy = starMap.H / 2;
    const scale = 0.4;

    // 计算每个节点的 3D 中心位置
    this.nodeCenters = starMap.nodes.map(node => new THREE.Vector3(
      (node.x - cx) * scale,
      -(node.y - cy) * scale,
      (node.level - 2.5) * 30
    ));

    this._buildNodeParticles(starMap);
    this._buildConnections();
    this._buildConstellationLines();
    this._buildFlowParticles();
    this._buildAmbientStars();
  }

  // ====== 构建知识节点 3D 粒子球 ======

  _buildNodeParticles(starMap) {
    const particlesPerNode = this.isMobile ? 45 : 80;
    const totalParticles = starMap.nodes.length * particlesPerNode;

    const positions = new Float32Array(totalParticles * 3);
    const sizes = new Float32Array(totalParticles);
    const colors = new Float32Array(totalParticles * 3);
    const offsets = new Float32Array(totalParticles);
    const nodeIndices = new Float32Array(totalParticles);
    this.particleNodeMap = new Array(totalParticles);

    let pIdx = 0;
    for (let ni = 0; ni < starMap.nodes.length; ni++) {
      const node = starMap.nodes[ni];
      const center = this.nodeCenters[ni];
      const nodeRadius = 3 + node.level * 0.8; // level 越高粒子球越大
      const mastery = node.mastery;

      const baseColor = MASTERY_COLORS[mastery];
      const brightness = MASTERY_BRIGHTNESS[mastery];
      const sizeMult = MASTERY_SIZE[mastery];

      for (let i = 0; i < particlesPerNode; i++) {
        // 球面分布
        const r = nodeRadius * (0.4 + Math.random() * 0.6);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[pIdx * 3]     = center.x + r * Math.sin(phi) * Math.cos(theta);
        positions[pIdx * 3 + 1] = center.y + r * Math.sin(phi) * Math.sin(theta);
        positions[pIdx * 3 + 2] = center.z + r * Math.cos(phi);

        sizes[pIdx] = (1.0 + Math.random() * 0.8) * sizeMult;
        colors[pIdx * 3]     = baseColor[0] * brightness;
        colors[pIdx * 3 + 1] = baseColor[1] * brightness;
        colors[pIdx * 3 + 2] = baseColor[2] * brightness;
        offsets[pIdx] = Math.random() * Math.PI * 2;
        nodeIndices[pIdx] = ni;
        this.particleNodeMap[pIdx] = ni;
        pIdx++;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));
    geo.setAttribute('aNodeIndex', new THREE.BufferAttribute(nodeIndices, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSizeScale: { value: 1.0 },
        uHighlightIdx: { value: -1 },
      },
    });

    this.nodePoints = new THREE.Points(geo, mat);
    this.nodePoints.frustumCulled = false;
    this.scene.add(this.nodePoints);
  }

  // ====== 构建连线（LineSegments） ======

  _buildConnections() {
    if (!this.starMap || this.starMap.connections.length === 0) return;
    const pts = [];
    for (const conn of this.starMap.connections) {
      const fi = this.starMap.nodes.indexOf(conn.from);
      const ti = this.starMap.nodes.indexOf(conn.to);
      if (fi < 0 || ti < 0) continue;
      const fc = this.nodeCenters[fi];
      const tc = this.nodeCenters[ti];
      pts.push(fc.x, fc.y, fc.z, tc.x, tc.y, tc.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xd4af6a,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.connectionLines = new THREE.LineSegments(geo, mat);
    this.scene.add(this.connectionLines);
  }

  // ====== 构建星座连线（已掌握节点间翠绿发光线） ======

  _buildConstellationLines() {
    if (this.constellationLines) {
      this.scene.remove(this.constellationLines);
      this.constellationLines.geometry.dispose();
      this.constellationLines.material.dispose();
      this.constellationLines = null;
    }
    if (!this.starMap || this.starMap.connections.length === 0) return;

    const pts = [];
    for (const conn of this.starMap.connections) {
      if (conn.from.mastery !== 2 || conn.to.mastery !== 2) continue;
      const fi = this.starMap.nodes.indexOf(conn.from);
      const ti = this.starMap.nodes.indexOf(conn.to);
      if (fi < 0 || ti < 0) continue;
      const fc = this.nodeCenters[fi];
      const tc = this.nodeCenters[ti];
      pts.push(fc.x, fc.y, fc.z, tc.x, tc.y, tc.z);
    }
    if (pts.length === 0) return;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x6ad48a,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.constellationLines = new THREE.LineSegments(geo, mat);
    this.scene.add(this.constellationLines);
  }

  // ====== 构建连线流光粒子 ======

  _buildFlowParticles() {
    if (!this.starMap || this.starMap.connections.length === 0) return;
    const perConn = 4;
    const total = this.starMap.connections.length * perConn;
    this.flowData = [];

    for (const conn of this.starMap.connections) {
      const fi = this.starMap.nodes.indexOf(conn.from);
      const ti = this.starMap.nodes.indexOf(conn.to);
      if (fi < 0 || ti < 0) continue;
      const fc = this.nodeCenters[fi];
      const tc = this.nodeCenters[ti];
      for (let i = 0; i < perConn; i++) {
        this.flowData.push({
          fromPos: fc,
          toPos: tc,
          t: i / perConn,
          speed: 0.003 + Math.random() * 0.002,
        });
      }
    }

    const positions = new Float32Array(this.flowData.length * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xd4af6a,
      size: 2.5,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.flowPoints = new THREE.Points(geo, mat);
    this.flowPoints.frustumCulled = false;
    this.scene.add(this.flowPoints);
  }

  // ====== 构建环境星尘 ======

  _buildAmbientStars() {
    const count = this.isMobile ? 250 : 500;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
      sizes[i] = 0.5 + Math.random() * 1.0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    const mat = new THREE.PointsMaterial({
      color: 0xd4af6a,
      size: 1.2,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.ambientStars = new THREE.Points(geo, mat);
    this.ambientStars.frustumCulled = false;
    this.scene.add(this.ambientStars);
  }

  // ====== 动画循环 ======

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this._animate();
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  _animate() {
    if (!this.isRunning) return;
    this.rafId = requestAnimationFrame(() => this._animate());

    const dt = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // 更新着色器时间
    if (this.nodePoints) {
      this.nodePoints.material.uniforms.uTime.value = elapsed;
      this.nodePoints.material.uniforms.uHighlightIdx.value = this.hoveredNodeIndex;
    }

    // 更新流光粒子位置
    if (this.flowPoints && this.flowData.length > 0) {
      const posAttr = this.flowPoints.geometry.attributes.position;
      for (let i = 0; i < this.flowData.length; i++) {
        const fd = this.flowData[i];
        fd.t += fd.speed;
        if (fd.t > 1) fd.t -= 1;
        const x = fd.fromPos.x + (fd.toPos.x - fd.fromPos.x) * fd.t;
        const y = fd.fromPos.y + (fd.toPos.y - fd.fromPos.y) * fd.t;
        const z = fd.fromPos.z + (fd.toPos.z - fd.fromPos.z) * fd.t;
        posAttr.array[i * 3]     = x;
        posAttr.array[i * 3 + 1] = y;
        posAttr.array[i * 3 + 2] = z;
      }
      posAttr.needsUpdate = true;
    }

    // 环境星尘缓慢旋转
    if (this.ambientStars) {
      this.ambientStars.rotation.y += 0.0003;
      this.ambientStars.rotation.x += 0.0001;
    }

    // WASD 飞行
    this._updateWASD(dt);

    // 控制器
    this.controls.update();

    // 渲染
    this.renderer.render(this.scene, this.camera);
  }

  // ====== WASD 飞行控制 ======

  _updateWASD(dt) {
    const speed = 60 * dt;
    if (speed === 0) return;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 0.001) return;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();

    const move = new THREE.Vector3();
    if (this.keys.w) move.add(forward);
    if (this.keys.s) move.sub(forward);
    if (this.keys.a) move.sub(right);
    if (this.keys.d) move.add(right);
    if (this.keys.q) move.y -= 1;
    if (this.keys.e) move.y += 1;

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed);
      this.camera.position.add(move);
      this.controls.target.add(move);
    }
  }

  // ====== 射线检测（点击/悬停节点） ======

  _raycast() {
    if (!this.nodePoints || !this.starMap) return -1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.nodePoints);
    if (intersects.length > 0) {
      return this.particleNodeMap[intersects[0].index] ?? -1;
    }
    return -1;
  }

  // ====== 掌握度变化 → 更新粒子颜色/尺寸 + 重建星座线 ======

  updateMastery() {
    if (!this.nodePoints || !this.starMap) return;
    const colors = this.nodePoints.geometry.attributes.aColor.array;
    const sizes = this.nodePoints.geometry.attributes.aSize.array;
    const particlesPerNode = this.isMobile ? 45 : 80;

    for (let ni = 0; ni < this.starMap.nodes.length; ni++) {
      const node = this.starMap.nodes[ni];
      const mastery = node.mastery;
      const baseColor = MASTERY_COLORS[mastery];
      const brightness = MASTERY_BRIGHTNESS[mastery];
      const sizeMult = MASTERY_SIZE[mastery];

      for (let i = 0; i < particlesPerNode; i++) {
        const pIdx = ni * particlesPerNode + i;
        if (pIdx >= colors.length / 3) break;
        colors[pIdx * 3]     = baseColor[0] * brightness;
        colors[pIdx * 3 + 1] = baseColor[1] * brightness;
        colors[pIdx * 3 + 2] = baseColor[2] * brightness;
        sizes[pIdx] = (1.0 + (sizes[pIdx] % 0.8)) * sizeMult; // 保留随机分量
      }
    }
    this.nodePoints.geometry.attributes.aColor.needsUpdate = true;
    this.nodePoints.geometry.attributes.aSize.needsUpdate = true;

    // 重建星座连线
    this._buildConstellationLines();
  }

  // ====== 窗口适配 ======

  onResize(w, h) {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  // ====== 事件绑定 ======

  _bindEvents() {
    this._onResize = () => {
      this.onResize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this._onResize);

    this._onPointerMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // 悬停检测
      const idx = this._raycast();
      if (idx !== this.hoveredNodeIndex) {
        this.hoveredNodeIndex = idx;
        this.canvas.style.cursor = idx >= 0 ? 'pointer' : 'grab';
      }
    };
    this.canvas.addEventListener('pointermove', this._onPointerMove);

    this._onClick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const idx = this._raycast();
      if (idx >= 0 && this.starMap && this.starMap.nodes[idx]) {
        // 粒子爆开效果（2D 粒子 burst）
        const node = this.starMap.nodes[idx];
        if (node.particles) {
          for (const p of node.particles) p.burst = 0.8;
        }
        this.starMap.showInfoCard(node);
      }
    };
    this.canvas.addEventListener('click', this._onClick);

    // WASD 键盘
    this._onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (k in this.keys || 'wasdqe'.includes(k)) {
        this.keys[k] = true;
        if ('wasdqe'.includes(k)) e.preventDefault();
      }
    };
    this._onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = false;
    };
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
  }

  // ====== 监听 2D StarMap 事件 ======

  _listenStarMapEvents() {
    this._starmapReadyHandler = (e) => {
      if (e.detail) this.buildFromStarMap(e.detail);
    };
    window.addEventListener('starmap-ready', this._starmapReadyHandler);

    this._masteryChangedHandler = () => {
      this.updateMastery();
    };
    window.addEventListener('mastery-changed', this._masteryChangedHandler);

    this._starmapRebuiltHandler = (e) => {
      if (e.detail) this.buildFromStarMap(e.detail);
      else if (window.app) this.buildFromStarMap(window.app);
    };
    window.addEventListener('starmap-rebuilt', this._starmapRebuiltHandler);
  }

  // ====== 清理 3D 对象 ======

  _clearSceneObjects() {
    const objs = [this.nodePoints, this.connectionLines, this.constellationLines,
                  this.flowPoints, this.ambientStars];
    for (const obj of objs) {
      if (obj) {
        this.scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      }
    }
    this.nodePoints = null;
    this.connectionLines = null;
    this.constellationLines = null;
    this.flowPoints = null;
    this.ambientStars = null;
    this.flowData = [];
    this.particleNodeMap = [];
    this.nodeCenters = [];
  }

  // ====== 完全释放 ======

  dispose() {
    this.stop();
    this._clearSceneObjects();

    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('starmap-ready', this._starmapReadyHandler);
    window.removeEventListener('mastery-changed', this._masteryChangedHandler);
    window.removeEventListener('starmap-rebuilt', this._starmapRebuiltHandler);

    if (this.canvas) {
      this.canvas.removeEventListener('pointermove', this._onPointerMove);
      this.canvas.removeEventListener('click', this._onClick);
    }
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);

    if (this.controls) this.controls.dispose();
    if (this.renderer) this.renderer.dispose();
  }
}

// 功能描述：知识星图 3D 知识星系引擎 ES module。导出 KnowledgeEngine3D 类，
// 基于 Three.js r169 将 2D StarMap 的知识图谱映射到 3D 空间。核心功能：
// (1) buildFromStarMap 从 2D 读取知识节点，将每个节点渲染为 ~80 粒子构成的 3D 粒子球，
//     level 映射 Z 轴深度（基础 level1→z=-45 远景，拓展 level4→z=45 近景）；
// (2) 连线渲染为 3D LineSegments + 流光粒子（from→to 单向流动，暗示学习先后顺序）；
// (3) 已掌握(mastery=2)节点间自动形成翠绿(#6ad48a)星座连线，视觉化知识体系成形；
// (4) 掌握度驱动粒子颜色（灰/金/绿）与亮度/尺寸（0.6x/1.0x/1.4x），知识星系逐渐点亮；
// (5) 自定义顶点+片段着色器实现有机运动+径向辉光+距离衰减+悬停高亮增亮；
// (6) OrbitControls 旋转/缩放/平移 + WASD/QE 飞行穿梭（相机水平移动+升降）；
// (7) Raycaster 射线检测点击/悬停节点，点击弹出含预计学习时长/推荐资源的信息卡（复用 2D）；
// (8) 环境星尘（500 粒子）+ FogExp2 雾化营造宇宙深度感；
// (9) 通过 CustomEvent（starmap-ready/mastery-changed/starmap-rebuilt）与 2D StarMap 状态同步；
// (10) 移动端自动降质（粒子减半 45/节点、星尘减半 250、仅触控 OrbitControls）。
