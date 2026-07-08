'use client';

/**
 * LivingTree3D —— 程序化生成的数字生命树
 *
 * 基于 React Three Fiber + Three.js 实现，品质对标 Apple Vision Pro Demo / Refik Anadol 数字艺术。
 *
 * 架构概览：
 * 1. L-System 程序生成枝条（一级→五级），树干使用 CatmullRomCurve3 轻微扭曲，所有枝条几何合并为单个 BufferGeometry。
 * 2. 树叶：InstancedBufferGeometry + 自定义着色器（相机朝向 billboard + 着色器内漂浮动画），500–800 片。
 * 3. 树根：与枝条相同的 L-System 逻辑向下生长，代表“长期记忆”。
 * 4. 树干能量流：树干内部的内层管道 + 流动着色器，模拟“树液”脉动流动。
 * 5. 空间环境：半透明网格地面、上方体积聚光灯、指数雾、星尘粒子。
 * 6. 成长阶段映射：通过修改生成参数（而非缩放）控制枝条数量与树叶密度。
 * 7. 家庭元素：5 条主枝对应家庭成员，颜色微调区分；树叶代表家庭故事，树根代表长期记忆。
 * 8. 性能：枝条/根系合并几何、叶子实例化、其余均为静态几何 + 着色器内动画，每帧仅更新少量 uniform。
 */

import * as THREE from 'three';
import type { JSX } from 'react';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import TreeCanvas2D from './tree-canvas-2d';

/* ============================================================================
 * 类型与常量
 * ========================================================================== */

export type GrowthStage = 'seed' | 'sprout' | 'young' | 'mature' | 'bloom' | 'fruit' | 'eternal';

export interface FamilyMember {
  id: string;
  name: string;
  color: string;
}

export interface LivingTree3DProps {
  growthStage?: GrowthStage;
  familyMembers?: FamilyMember[];
  memoryCount?: number;
  className?: string;
}

/** 单个成长阶段对应的生成参数（不使用缩放，而是真正改变生成量） */
interface StageParams {
  trunkHeight: number; // 树干高度（世界单位）
  maxLevel: number; // 枝条递归最大层级（1–5）
  branchFactor: number; // 平均分叉数
  leafCount: number; // 树叶数量
  leafSpawnLevel: number; // 从该层级起的枝梢生成树叶
  rootCount: number; // 主根数量
  rootDepth: number; // 根系递归深度
  energy: number; // 树液能量强度 0–1
}

const STAGE_PARAMS: Record<GrowthStage, StageParams> = {
  seed: { trunkHeight: 0.35, maxLevel: 0, branchFactor: 0, leafCount: 0, leafSpawnLevel: 99, rootCount: 4, rootDepth: 1, energy: 0.15 },
  sprout: { trunkHeight: 0.6, maxLevel: 2, branchFactor: 2, leafCount: 60, leafSpawnLevel: 2, rootCount: 6, rootDepth: 2, energy: 0.35 },
  young: { trunkHeight: 0.9, maxLevel: 3, branchFactor: 2, leafCount: 240, leafSpawnLevel: 2, rootCount: 10, rootDepth: 2, energy: 0.55 },
  mature: { trunkHeight: 1.15, maxLevel: 4, branchFactor: 3, leafCount: 500, leafSpawnLevel: 2, rootCount: 14, rootDepth: 3, energy: 0.75 },
  bloom: { trunkHeight: 1.25, maxLevel: 5, branchFactor: 3, leafCount: 640, leafSpawnLevel: 2, rootCount: 16, rootDepth: 3, energy: 0.9 },
  fruit: { trunkHeight: 1.3, maxLevel: 5, branchFactor: 3, leafCount: 700, leafSpawnLevel: 2, rootCount: 16, rootDepth: 3, energy: 1.0 },
  eternal: { trunkHeight: 1.4, maxLevel: 5, branchFactor: 3, leafCount: 800, leafSpawnLevel: 1, rootCount: 18, rootDepth: 4, energy: 1.0 },
};

/** 默认家庭成员（主枝颜色微调，控制在银/冷色系内） */
const DEFAULT_FAMILY: FamilyMember[] = [
  { id: 'papa', name: '爸爸', color: '#9fb4d8' },
  { id: 'mama', name: '妈妈', color: '#d8b8c8' },
  { id: 'child', name: '孩子', color: '#b8d8d0' },
  { id: 'elder', name: '老人', color: '#d8d4b8' },
  { id: 'pet', name: '宠物', color: '#c8b8d8' },
];

/** 树叶颜色渐变：银白 / 冰蓝 / 淡青 */
const LEAF_PALETTE = ['#e0e8f0', '#a0d8f0', '#b0f0e0'].map((c) => new THREE.Color(c));

const BARK_COLOR = new THREE.Color('#8a8a9a'); // 银灰色树皮
const ROOT_COLOR = new THREE.Color('#5a5a6a'); // 深银灰树根
const SAP_COLOR = new THREE.Color('#5e9ef5'); // 冰蓝树液
const GROUND_COLOR = new THREE.Color('#1a1a2a'); // 数字地面网格
const BG_COLOR = '#05070d'; // 深蓝黑背景 / 雾

/* ============================================================================
 * 工具函数
 * ========================================================================== */

/** 确定性伪随机数（mulberry32），保证树形在重渲染间稳定 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 生成一个垂直于 dir 的随机单位向量 */
function randomPerpendicular(dir: THREE.Vector3, rng: () => number): THREE.Vector3 {
  const v = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5);
  v.addScaledVector(dir, -v.dot(dir));
  if (v.lengthSq() < 1e-5) v.set(1, 0, 0);
  return v.normalize();
}

/** 将方向向量绕一个随机垂直轴旋转 angle 弧度 */
function rotateDirection(dir: THREE.Vector3, angle: number, rng: () => number): THREE.Vector3 {
  const axis = randomPerpendicular(dir, rng);
  const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
  return dir.clone().applyQuaternion(q).normalize();
}

/** 枝条/根的描述：包含曲线、粗细、层级与递归所需的端点信息 */
interface BranchDesc {
  curve: THREE.CatmullRomCurve3;
  radiusStart: number;
  radiusEnd: number;
  level: number;
  familyIndex: number | null; // 主枝对应家庭成员索引
  endPos: THREE.Vector3;
  endDir: THREE.Vector3;
  length: number;
}

/** 由起点、方向、长度构建一条轻微弯曲的枝条曲线 */
function makeBranch(
  start: THREE.Vector3,
  dir: THREE.Vector3,
  length: number,
  r0: number,
  r1: number,
  level: number,
  familyIndex: number | null,
  rng: () => number,
): BranchDesc {
  const end = start.clone().add(dir.clone().multiplyScalar(length));
  const mid = start.clone().lerp(end, 0.5);
  const perp = randomPerpendicular(dir, rng);
  mid.addScaledVector(perp, length * (0.08 + rng() * 0.14));
  const curve = new THREE.CatmullRomCurve3([start.clone(), mid, end.clone()]);
  return { curve, radiusStart: r0, radiusEnd: r1, level, familyIndex, endPos: end, endDir: dir.clone(), length };
}

/** 计算枝条颜色：树皮色与家庭色的柔和混合（主枝及其后代轻微染色） */
function branchColor(familyIndex: number | null, familyColors: THREE.Color[]): THREE.Color {
  const base = BARK_COLOR.clone();
  if (familyIndex === null || familyColors.length === 0) return base;
  return base.lerp(familyColors[familyIndex % familyColors.length], 0.28);
}

/**
 * 创建一段两端粗细不同（锥形）的管道几何。
 * 使用 Frenet 标架沿 CatmullRom 曲线扫描，半径沿长度线性递减，附带顶点色与沿长度方向的 uv.x。
 */
function createTaperedTubeGeometry(
  curve: THREE.CatmullRomCurve3,
  radiusStart: number,
  radiusEnd: number,
  tubularSegments: number,
  radialSegments: number,
  color: THREE.Color,
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const point = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const radius = radiusStart + (radiusEnd - radiusStart) * t;
    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = Math.cos(v);
      const nx = N.x * cos + B.x * sin;
      const ny = N.y * cos + B.y * sin;
      const nz = N.z * cos + B.z * sin;
      const inv = 1 / (Math.hypot(nx, ny, nz) || 1);
      const nrmX = nx * inv;
      const nrmY = ny * inv;
      const nrmZ = nz * inv;
      positions.push(point.x + nrmX * radius, point.y + nrmY * radius, point.z + nrmZ * radius);
      normals.push(nrmX, nrmY, nrmZ);
      uvs.push(t, j / radialSegments);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = a + (radialSegments + 1);
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setIndex(indices);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geo;
}

/* ============================================================================
 * 着色器
 * ========================================================================== */

/** 树叶顶点着色器：billboard + 着色器内漂浮漂移 */
const LEAF_VERT = /* glsl */ `
  attribute vec3 aOffset;
  attribute float aScale;
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aPhase;

  uniform float uTime;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vPhase;
  varying vec2 vUv;

  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vPhase = aPhase;
    vUv = uv;

    // 世界空间内的轻微漂浮（不同叶子相位不同）
    vec3 drift = vec3(
      cos(uTime * 0.7 + aPhase * 1.3),
      sin(uTime * 0.8 + aPhase),
      sin(uTime * 0.5 + aPhase * 0.7)
    ) * 0.035;
    vec3 center = aOffset + drift;

    // billboard：在视图空间内放置四边形，使其始终朝向相机
    vec4 mvCenter = modelViewMatrix * vec4(center, 1.0);
    vec4 mvPos = mvCenter + vec4(position * aScale, 0.0);
    gl_Position = projectionMatrix * mvPos;
  }
`;

/** 树叶片元着色器：柔圆光点 + 轻微闪烁 */
const LEAF_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vPhase;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - 0.5;
    float d = length(p);
    float mask = smoothstep(0.5, 0.15, d);
    if (mask < 0.01) discard;
    // 每片叶子独立相位的轻微闪烁
    float twinkle = 0.85 + 0.15 * sin(uTime * 1.5 + vPhase * 3.0);
    gl_FragColor = vec4(vColor * twinkle, mask * vAlpha);
  }
`;

/** 树干能量流（树液）顶点着色器 */
const SAP_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** 树液片元着色器：沿管道长度方向滚动的脉动高斯带，自根部流向树冠 */
const SAP_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;

  varying vec2 vUv;

  void main() {
    float u = vUv.x; // 0 = 根部, 1 = 树冠
    float pulse = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float t = fract(u - uTime * 0.12 + fi * 0.34);
      float g = exp(-pow((t - 0.5) * 7.0, 2.0));
      pulse += g;
    }
    float base = 0.08;
    float a = (base + pulse * 0.7) * uIntensity;
    gl_FragColor = vec4(uColor, a);
  }
`;

/** 地面网格顶点着色器：传递世界 XZ 坐标 */
const GROUND_VERT = /* glsl */ `
  varying vec2 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

/** 地面网格片元着色器：程序化网格 + 径向淡出 */
const GROUND_FRAG = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;

  varying vec2 vWorld;

  void main() {
    vec2 p = vWorld;
    vec2 g = abs(fract(p) - 0.5);
    float gridLine = 1.0 - smoothstep(0.46, 0.5, max(g.x, g.y));

    float r = length(vWorld);
    float fade = 1.0 - smoothstep(3.0, 5.8, r);

    float a = gridLine * 0.30 * fade;
    a += fade * 0.03; // 地面淡淡的底色
    gl_FragColor = vec4(uColor, a);
  }
`;

/** 根部辉光片元着色器（圆形径向渐变，叠加发光） */
const GLOW_VERT = /* glsl */ `
  varying float vR;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vR = length(wp.xz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const GLOW_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vR;
  void main() {
    float a = smoothstep(2.2, 0.0, vR) * 0.5;
    gl_FragColor = vec4(uColor, a);
  }
`;

/** 星尘顶点着色器：缓慢漂移 + 闪烁 + 透视点大小 */
const STAR_VERT = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;

  uniform float uTime;

  varying float vTw;

  void main() {
    vec3 pos = position;
    pos.x += sin(uTime * 0.2 + aPhase) * 0.15;
    pos.y += cos(uTime * 0.15 + aPhase * 1.3) * 0.12;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    vTw = 0.5 + 0.5 * sin(uTime * 1.2 + aPhase * 2.0);
    gl_PointSize = aSize * (300.0 / -mv.z);
  }
`;
const STAR_FRAG = /* glsl */ `
  precision highp float;
  varying float vTw;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vec3(0.8, 0.88, 1.0), a * vTw * 0.8);
  }
`;

/* ============================================================================
 * 资源构建（纯函数，返回所有 Three.js 对象）
 * ========================================================================== */

interface TreeAssets {
  branchGeometry: THREE.BufferGeometry;
  rootGeometry: THREE.BufferGeometry;
  sapGeometry: THREE.BufferGeometry;
  groundGeometry: THREE.BufferGeometry;
  glowGeometry: THREE.BufferGeometry;
  leafGeometry: THREE.BufferGeometry;
  stardustGeometry: THREE.BufferGeometry;

  branchMaterial: THREE.MeshStandardMaterial;
  rootMaterial: THREE.MeshStandardMaterial;
  sapMaterial: THREE.ShaderMaterial;
  groundMaterial: THREE.ShaderMaterial;
  glowMaterial: THREE.ShaderMaterial;
  leafMaterial: THREE.ShaderMaterial;
  stardustMaterial: THREE.ShaderMaterial;

  leafMesh: THREE.Mesh;
  stardust: THREE.Points;

  stage: StageParams;
}

function buildTree(stage: StageParams, family: FamilyMember[], memoryCount: number): TreeAssets {
  const rng = mulberry32(20240607); // 固定种子，保证形状稳定（阶段改变的是参数而非形状随机性）
  const familyColors = family.map((f) => new THREE.Color(f.color));

  /* ---------- 树干（轻微 S 型扭曲，非直线） ---------- */
  const H = stage.trunkHeight;
  const bendX = (rng() - 0.5) * 0.5;
  const bendZ = (rng() - 0.5) * 0.5;
  const trunkPts = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(bendX * 0.4, H * 0.33, bendZ * 0.3),
    new THREE.Vector3(-bendX * 0.3, H * 0.66, -bendZ * 0.35),
    new THREE.Vector3(bendX * 0.15, H, bendZ * 0.12),
  ];
  const trunkCurve = new THREE.CatmullRomCurve3(trunkPts);
  const trunkR0 = 0.1 + 0.05 * H;
  const trunkR1 = trunkR0 * 0.45;

  const branches: BranchDesc[] = [
    { curve: trunkCurve, radiusStart: trunkR0, radiusEnd: trunkR1, level: 0, familyIndex: null, endPos: trunkPts[3].clone(), endDir: new THREE.Vector3(0, 1, 0), length: H },
  ];

  /* ---------- 5 条主枝（对应家庭成员） ---------- */
  const MAIN_COUNT = stage.maxLevel >= 1 ? 5 : 0;
  for (let i = 0; i < MAIN_COUNT; i++) {
    const ang = (i / MAIN_COUNT) * Math.PI * 2 + (rng() - 0.5) * 0.5;
    const t = THREE.MathUtils.clamp(0.5 + 0.42 * (i / MAIN_COUNT) + (rng() - 0.5) * 0.05, 0, 1);
    const start = trunkCurve.getPointAt(t);
    const radial = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
    const dir = radial.multiplyScalar(0.8).add(new THREE.Vector3(0, 0.7, 0)).normalize();
    const len = H * (0.55 + rng() * 0.25);
    const r0 = trunkR1 * (0.7 + rng() * 0.15);
    const desc = makeBranch(start, dir, len, r0, r0 * 0.5, 1, i, rng);
    branches.push(desc);
    growBranches(desc, stage, rng, branches);
  }

  /* ---------- 递归生成子枝（L-System） ---------- */
  function growBranches(parent: BranchDesc, st: StageParams, rnd: () => number, out: BranchDesc[]) {
    const nextLevel = parent.level + 1;
    if (nextLevel > st.maxLevel || st.branchFactor === 0) return;
    // 分叉数随层级递减：低层级 3–4 个、高层级 2–3 个，保证 mature+ 总枝条 ≥ 200
    const childCount =
      st.branchFactor === 2
        ? rnd() < 0.5 ? 1 : 2
        : nextLevel <= 2 ? (rnd() < 0.3 ? 4 : 3) : (rnd() < 0.5 ? 2 : 3);
    for (let c = 0; c < childCount; c++) {
      const angle = THREE.MathUtils.degToRad(15 + rnd() * 30); // 15–45 度随机偏移
      const dir = rotateDirection(parent.endDir, angle, rnd);
      // 低层级向上偏置，塑造树冠形态
      const upBias = nextLevel <= 2 ? 0.25 : nextLevel === 3 ? 0.1 : 0.0;
      dir.lerp(new THREE.Vector3(0, 1, 0), upBias).normalize();
      const len = parent.length * (0.7 + rnd() * 0.15); // 长度递减
      const r0 = parent.radiusEnd * (0.6 + rnd() * 0.12); // 粗细递减
      const child = makeBranch(parent.endPos, dir, len, r0, r0 * 0.5, nextLevel, parent.familyIndex, rnd);
      out.push(child);
      growBranches(child, st, rnd, out);
    }
  }

  /* ---------- 构建并合并枝条几何 ---------- */
  const branchGeos: THREE.BufferGeometry[] = [];
  for (const b of branches) {
    const tubular = Math.min(Math.max(6, Math.floor(b.length * 18)), 24);
    const radial = b.level === 0 ? 8 : b.level <= 2 ? 6 : 5;
    const col = branchColor(b.familyIndex, familyColors);
    branchGeos.push(createTaperedTubeGeometry(b.curve, b.radiusStart, b.radiusEnd, tubular, radial, col));
  }
  const branchGeometry = mergeGeometries(branchGeos, false) ?? new THREE.BufferGeometry();
  branchGeos.forEach((g) => g.dispose());

  /* ---------- 树根（向下生长的 L-System，代表长期记忆） ---------- */
  const rootCount = THREE.MathUtils.clamp(stage.rootCount + Math.floor((memoryCount || 0) / 50), 4, 26);
  const roots: BranchDesc[] = [];
  for (let i = 0; i < rootCount; i++) {
    const ang = (i / rootCount) * Math.PI * 2 + (rng() - 0.5) * 0.4;
    const radial = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
    const dir = radial.multiplyScalar(0.9).add(new THREE.Vector3(0, -(0.5 + rng() * 0.5), 0)).normalize();
    const len = 0.5 + rng() * 0.5;
    const r0 = trunkR0 * 0.6;
    const desc = makeBranch(new THREE.Vector3(0, 0, 0), dir, len, r0, r0 * 0.3, 0, null, rng);
    roots.push(desc);
    growRoots(desc, stage.rootDepth, rng, roots);
  }

  function growRoots(parent: BranchDesc, maxDepth: number, rnd: () => number, out: BranchDesc[]) {
    const nl = parent.level + 1;
    if (nl > maxDepth) return;
    const childCount = rnd() < 0.5 ? 1 : 2;
    for (let c = 0; c < childCount; c++) {
      const angle = THREE.MathUtils.degToRad(20 + rnd() * 30);
      const dir = rotateDirection(parent.endDir, angle, rnd);
      dir.lerp(new THREE.Vector3(0, -1, 0), 0.3).normalize(); // 向下偏置
      const len = parent.length * (0.65 + rnd() * 0.15);
      const r0 = parent.radiusEnd * 0.6;
      const child = makeBranch(parent.endPos, dir, len, r0, r0 * 0.4, nl, null, rnd);
      out.push(child);
      growRoots(child, maxDepth, rnd, out);
    }
  }

  const rootGeos: THREE.BufferGeometry[] = [];
  for (const b of roots) {
    const tubular = Math.min(Math.max(6, Math.floor(b.length * 16)), 18);
    const radial = 5;
    rootGeos.push(createTaperedTubeGeometry(b.curve, b.radiusStart, b.radiusEnd, tubular, radial, ROOT_COLOR));
  }
  const rootGeometry = mergeGeometries(rootGeos, false) ?? new THREE.BufferGeometry();
  rootGeos.forEach((g) => g.dispose());

  /* ---------- 树干能量流（内层管道 + 流动着色器） ---------- */
  const sapGeometry = createTaperedTubeGeometry(trunkCurve, trunkR0 * 0.28, trunkR1 * 0.4, 40, 6, new THREE.Color(1, 1, 1));

  /* ---------- 地面 / 根部辉光 ---------- */
  const groundGeometry = new THREE.CircleGeometry(6, 64);
  const glowGeometry = new THREE.CircleGeometry(2.2, 48);

  /* ---------- 树叶（实例化 + 自定义着色器） ---------- */
  interface LeafData {
    pos: THREE.Vector3;
    color: THREE.Color;
    size: number;
    alpha: number;
    phase: number;
  }
  const leaves: LeafData[] = [];
  const spawnBranches = branches.filter((b) => b.level >= stage.leafSpawnLevel && b.level <= stage.maxLevel && b.familyIndex !== null);
  if (stage.leafCount > 0 && spawnBranches.length > 0) {
    for (let i = 0; i < stage.leafCount; i++) {
      const b = spawnBranches[Math.floor(rng() * spawnBranches.length)];
      const t = 0.6 + rng() * 0.4;
      const pos = b.curve.getPointAt(t);
      const j = 0.09;
      pos.x += (rng() - 0.5) * j;
      pos.y += (rng() - 0.5) * j;
      pos.z += (rng() - 0.5) * j;
      const col = LEAF_PALETTE[Math.floor(rng() * LEAF_PALETTE.length)].clone();
      if (b.familyIndex !== null && familyColors.length) {
        col.lerp(familyColors[b.familyIndex % familyColors.length], 0.2);
      }
      leaves.push({
        pos,
        color: col,
        size: 0.05 + rng() * 0.1, // 0.05–0.15
        alpha: 0.3 + rng() * 0.5, // 0.3–0.8
        phase: rng() * Math.PI * 2,
      });
    }
  }

  const leafGeometry = new THREE.InstancedBufferGeometry();
  leafGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  leafGeometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  leafGeometry.setIndex([0, 1, 2, 0, 2, 3]);
  const leafN = leaves.length;
  if (leafN > 0) {
    const offsets = new Float32Array(leafN * 3);
    const scales = new Float32Array(leafN);
    const colors = new Float32Array(leafN * 3);
    const alphas = new Float32Array(leafN);
    const phases = new Float32Array(leafN);
    leaves.forEach((l, i) => {
      offsets[i * 3] = l.pos.x;
      offsets[i * 3 + 1] = l.pos.y;
      offsets[i * 3 + 2] = l.pos.z;
      scales[i] = l.size;
      colors[i * 3] = l.color.r;
      colors[i * 3 + 1] = l.color.g;
      colors[i * 3 + 2] = l.color.b;
      alphas[i] = l.alpha;
      phases[i] = l.phase;
    });
    leafGeometry.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
    leafGeometry.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1));
    leafGeometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3));
    leafGeometry.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(alphas, 1));
    leafGeometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
    leafGeometry.instanceCount = leafN;
  } else {
    leafGeometry.instanceCount = 0;
  }

  /* ---------- 星尘 ---------- */
  const starN = 170;
  const starPos = new Float32Array(starN * 3);
  const starPhase = new Float32Array(starN);
  const starSize = new Float32Array(starN);
  for (let i = 0; i < starN; i++) {
    const r = 3 + rng() * 6;
    const a = rng() * Math.PI * 2;
    starPos[i * 3] = Math.cos(a) * r;
    starPos[i * 3 + 1] = -0.5 + rng() * 7;
    starPos[i * 3 + 2] = Math.sin(a) * r;
    starPhase[i] = rng() * Math.PI * 2;
    starSize[i] = 1 + rng() * 2.5;
  }
  const stardustGeometry = new THREE.BufferGeometry();
  stardustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  stardustGeometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(starPhase, 1));
  stardustGeometry.setAttribute('aSize', new THREE.Float32BufferAttribute(starSize, 1));

  /* ---------- 材质 ---------- */
  const branchMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.5,
    metalness: 0.4,
    transparent: true,
    opacity: 0.92,
    depthWrite: true,
    side: THREE.FrontSide,
  });

  const rootMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.7,
    metalness: 0.2,
    transparent: true,
    opacity: 0.78,
    depthWrite: true,
    side: THREE.FrontSide,
  });

  const sapMaterial = new THREE.ShaderMaterial({
    vertexShader: SAP_VERT,
    fragmentShader: SAP_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: SAP_COLOR.clone() },
      uIntensity: { value: stage.energy },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const groundMaterial = new THREE.ShaderMaterial({
    vertexShader: GROUND_VERT,
    fragmentShader: GROUND_FRAG,
    uniforms: { uColor: { value: GROUND_COLOR.clone() } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const glowMaterial = new THREE.ShaderMaterial({
    vertexShader: GLOW_VERT,
    fragmentShader: GLOW_FRAG,
    uniforms: { uColor: { value: SAP_COLOR.clone() } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const leafMaterial = new THREE.ShaderMaterial({
    vertexShader: LEAF_VERT,
    fragmentShader: LEAF_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const stardustMaterial = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  /* ---------- 网格对象 ---------- */
  const leafMesh = new THREE.Mesh(leafGeometry, leafMaterial);
  leafMesh.frustumCulled = false; // 实例化几何包围盒不准确，关闭剔除避免消失

  const stardust = new THREE.Points(stardustGeometry, stardustMaterial);
  stardust.frustumCulled = false;

  return {
    branchGeometry,
    rootGeometry,
    sapGeometry,
    groundGeometry,
    glowGeometry,
    leafGeometry,
    stardustGeometry,
    branchMaterial,
    rootMaterial,
    sapMaterial,
    groundMaterial,
    glowMaterial,
    leafMaterial,
    stardustMaterial,
    leafMesh,
    stardust,
    stage,
  };
}

function disposeAssets(a: TreeAssets): void {
  a.branchGeometry.dispose();
  a.rootGeometry.dispose();
  a.sapGeometry.dispose();
  a.groundGeometry.dispose();
  a.glowGeometry.dispose();
  a.leafGeometry.dispose();
  a.stardustGeometry.dispose();
  a.branchMaterial.dispose();
  a.rootMaterial.dispose();
  a.sapMaterial.dispose();
  a.groundMaterial.dispose();
  a.glowMaterial.dispose();
  a.leafMaterial.dispose();
  a.stardustMaterial.dispose();
}

/* ============================================================================
 * 场景组件（运行在 Canvas 内，可使用 useFrame）
 * ========================================================================== */

function TreeScene({ assets }: { assets: TreeAssets }) {
  const swayRef = useRef<THREE.Group>(null);
  const { leafMaterial, sapMaterial, stardustMaterial } = assets;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    leafMaterial.uniforms.uTime.value = t;
    sapMaterial.uniforms.uTime.value = t;
    stardustMaterial.uniforms.uTime.value = t;
    // 树冠极轻微的随风摇曳（绕根部基点）
    if (swayRef.current) {
      swayRef.current.rotation.z = Math.sin(t * 0.5) * 0.012;
      swayRef.current.rotation.x = Math.cos(t * 0.4) * 0.009;
    }
  });

  return (
    <>
      <color attach="background" args={[BG_COLOR]} />
      <fogExp2 attach="fog" args={[BG_COLOR, 0.085]} />

      {/* 灯光：冷调环境光 + 半球光 + 上方柔和聚光灯 + 根部冰蓝点光 */}
      <ambientLight intensity={0.6} color={'#6a7a9a'} />
      <hemisphereLight color={'#90a0c8'} groundColor={'#0a0a14'} intensity={0.5} />
      <spotLight
        position={[4, 9, 5]}
        angle={0.75}
        penumbra={1}
        intensity={2.0}
        decay={0}
        distance={0}
        color={'#d0e0ff'}
      />
      <pointLight position={[0, 0.4, 0]} intensity={1.3} distance={4} decay={0} color={'#5e9ef5'} />

      {/* 地面 / 根部辉光（固定，不随树冠摇曳） */}
      <mesh geometry={assets.groundGeometry} material={assets.groundMaterial} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-2} />
      <mesh geometry={assets.glowGeometry} material={assets.glowMaterial} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} renderOrder={-1} />

      {/* 树根 */}
      <mesh geometry={assets.rootGeometry} material={assets.rootMaterial} />

      {/* 树冠（枝条 + 树液 + 树叶）整体轻微摇曳 */}
      <group ref={swayRef}>
        <mesh geometry={assets.branchGeometry} material={assets.branchMaterial} />
        <mesh geometry={assets.sapGeometry} material={assets.sapMaterial} renderOrder={2} />
        <primitive object={assets.leafMesh} />
      </group>

      {/* 远景星尘 */}
      <primitive object={assets.stardust} />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={4}
        maxDistance={12}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI * 0.49}
        enableDamping
        dampingFactor={0.08}
        autoRotate
        autoRotateSpeed={0.35}
        target={[0, 1.0, 0]}
      />
    </>
  );
}

/* ============================================================================
 * 默认导出组件
 * ========================================================================== */

/** 检测当前环境是否支持 WebGL（沙箱/无 GPU 环境可能禁用） */
function useWebGLSupport(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const testCanvas = document.createElement('canvas');
      const gl =
        testCanvas.getContext('webgl2') ||
        testCanvas.getContext('webgl') ||
        testCanvas.getContext('experimental-webgl');
      setSupported(!!gl);
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
}

export default function LivingTree3D(props: LivingTree3DProps): JSX.Element {
  const { growthStage = 'mature', familyMembers, memoryCount = 0, className } = props;
  const family = familyMembers && familyMembers.length > 0 ? familyMembers : DEFAULT_FAMILY;
  const stage = STAGE_PARAMS[growthStage];

  const webglSupported = useWebGLSupport();

  // 家庭成员身份串作为依赖键（避免数组引用变化导致重复生成）
  const familyKey = family.map((f) => `${f.id}:${f.color}`).join('|');

  // 依赖中用 familyKey（派生字符串）而非 family 数组引用，以避免父组件重渲染导致的重复生成
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const assets = useMemo(() => buildTree(stage, family, memoryCount), [stage, familyKey, memoryCount]);

  // 资源释放：依赖变化或卸载时销毁几何与材质，防止显存泄漏
  useEffect(() => {
    return () => disposeAssets(assets);
  }, [assets]);

  // WebGL 不可用 → 降级到 2D Canvas
  if (webglSupported === false) {
    return (
      <TreeCanvas2D
        growthStage={growthStage}
        familyMembers={family}
        memoryCount={memoryCount}
        className={className}
      />
    );
  }

  // 检测中 → 显示加载占位
  if (webglSupported === null) {
    return (
      <div className={className} style={{ width: '100%', height: '100%', position: 'relative', background: BG_COLOR }} />
    );
  }

  return (
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [4.8, 1.5, 5.4], fov: 42, near: 0.1, far: 60 }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <TreeScene assets={assets} />
        </Suspense>
      </Canvas>
    </div>
  );
}
