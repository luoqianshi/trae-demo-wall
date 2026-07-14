// ============================================================
// js/particle-system3d.js
// 中华文化粒子云引擎 · 3D 粒子系统（Task 2 核心）
// 维护 BufferGeometry + ShaderMaterial + Points，负责粒子初始化、
// 主题切换、目标位置 morph 动画、质量分级与资源释放。
// ============================================================

import * as THREE from 'three';
import { SimplexNoise } from './simplex-noise.js';
import { particleVertexShader } from './shaders/particle.vert.glsl.js';
import { particleFragmentShader } from './shaders/particle.frag.glsl.js';

const DEFAULT_PALETTE = ['#d4af6a', '#f4d77e', '#c4ad7a', '#8b6929'];
const DEFAULT_PARTICLE_COUNT = 60000;
const MORPH_DURATION = 1.5; // 秒

export class ParticleSystem3D {
  /**
   * @param {object} opts
   * @param {THREE.Scene} opts.scene
   * @param {object|null} [opts.theme] 主题包，可为 null（使用默认）
   * @param {number} [opts.maxParticles] 粒子缓冲区上限
   */
  constructor({ scene, theme = null, maxParticles = 100000 }) {
    this.scene = scene;
    this.maxParticles = Math.max(1, Math.floor(maxParticles));
    this.activeParticles = 0;

    // CPU 端 Simplex 噪声：用于粒子初始位置 / 目标位置生成的柔和扰动
    this.simplex = new SimplexNoise(20240705);

    // 主题：默认一个金墨占位
    this.theme = theme || {
      name: '默认',
      palette: DEFAULT_PALETTE,
      particleCount: DEFAULT_PARTICLE_COUNT
    };

    // 质量分级
    this.quality = 'high';

    // morph 动画状态
    this.morphProgress = 0;       // 0→1
    this.morphActive = false;

    // ====== BufferGeometry 与 attribute ======
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.targets   = new Float32Array(this.maxParticles * 3);
    this.sizes     = new Float32Array(this.maxParticles);
    this.colors    = new Float32Array(this.maxParticles * 3);
    this.offsets   = new Float32Array(this.maxParticles);

    // ====== 高亮原值副本（Task 5.4）：用于 clearHighlight 恢复 ======
    this.originalSizes  = new Float32Array(this.maxParticles);
    this.originalColors = new Float32Array(this.maxParticles * 3);
    /** @type {Set<number>} 当前被高亮/淡化修改过 attribute 的粒子索引 */
    this._highlighted = new Set();

    // 初始化全部 maxParticles 的基础位置（球面分布 + simplex 噪声偏移）与相位
    this._initSpherePositions();

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('aTarget',  new THREE.BufferAttribute(this.targets, 3));
    this.geometry.setAttribute('aSize',    new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('aColor',    new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('aOffset',  new THREE.BufferAttribute(this.offsets, 1));
    // 初始 drawRange 为 0，setTheme 后再放开
    this.geometry.setDrawRange(0, 0);

    // ====== ShaderMaterial ======
    this.material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime:          { value: 0 },
        uFlowStrength:  { value: 0.6 },
        uPixelRatio:    { value: Math.min(window.devicePixelRatio || 1, 2) },
        uSizeScale:     { value: 1.0 },
        uMorphProgress:  { value: 0 }
      }
    });

    // ====== Points 对象 ======
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false; // 粒子云跨越整个场景，禁用剔除避免闪烁
    this.scene.add(this.points);

    // 首次应用主题
    this.setTheme(this.theme);
  }

  /**
   * 初始化全部 maxParticles 粒子的基础位置：
   * 球面分布（半径 320）+ simplex 噪声径向偏移，相位 aOffset 随机
   * @private
   */
  _initSpherePositions() {
    const R = 320;
    for (let i = 0; i < this.maxParticles; i++) {
      // 均匀球面采样：黄金角螺旋 + 半径平方根
      const u = (i + 0.5) / this.maxParticles;
      const theta = Math.acos(1 - 2 * u);
      const phi = Math.PI * (1 + Math.sqrt(5)) * i;
      const st = Math.sin(theta), ct = Math.cos(theta);
      let x = R * st * Math.cos(phi);
      let y = R * ct;
      let z = R * st * Math.sin(phi);

      // simplex 径向扰动：让球壳更"星云化"
      const nx = this.simplex.noise3D(x * 0.01, y * 0.01, z * 0.01);
      const ny = this.simplex.noise3D(y * 0.013 + 11, z * 0.013 - 7, x * 0.013 + 3);
      const nz = this.simplex.noise3D(z * 0.017 - 5, x * 0.017 + 9, y * 0.017 - 2);
      x += nx * 40;
      y += ny * 40;
      z += nz * 40;

      const i3 = i * 3;
      this.positions[i3]     = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;

      // 初始 target = 基础位置（避免 morph 前出现 (0,0,0) 闪烁）
      this.targets[i3]     = x;
      this.targets[i3 + 1] = y;
      this.targets[i3 + 2] = z;

      this.sizes[i]   = 0.6 + Math.random() * 1.2;
      this.offsets[i] = Math.random() * Math.PI * 2;
    }
  }

  /**
   * 归一化调色板：兼容数组与对象两种形态，统一返回 hex 字符串数组
   * - 数组 ['hex', ...]：直接返回（剔除非字符串）
   * - 对象 { main, accent, glow, bg, bg2 }：返回 [main, accent, glow, bg2]
   *   （bg 通常为背景色太暗，不参与粒子着色；bg2 作为深色调点缀保留）
   * - 缺省：返回 DEFAULT_PALETTE
   * @param {string[]|object} palette
   * @returns {string[]}
   * @private
   */
  _normalizePalette(palette) {
    if (Array.isArray(palette)) {
      const arr = palette.filter(c => typeof c === 'string' && c);
      return arr.length ? arr : DEFAULT_PALETTE;
    }
    if (palette && typeof palette === 'object') {
      const { main, accent, glow, bg2 } = palette;
      const arr = [main, accent, glow, bg2].filter(c => typeof c === 'string' && c);
      return arr.length ? arr : DEFAULT_PALETTE;
    }
    return DEFAULT_PALETTE;
  }

  /**
   * 应用主题：根据 palette 重填 colors、根据 particleCount 调整 activeParticles
   * 兼容两种 palette 形态：
   *   - 数组：['#d4af6a', '#f4d77e', ...]（旧式 / 测试用）
   *   - 对象：{ main, accent, glow, bg, bg2 }（ThemePack schema 标准形态）
   * @param {object} themePack 主题包
   */
  setTheme(themePack) {
    if (!themePack) return;
    this.theme = themePack;

    // 归一化调色板为 hex 字符串数组
    const palette = this._normalizePalette(themePack.palette);

    // 预解析调色板为线性 RGB（THREE.Color 在 ColorManagement 下自动转线性）
    const paletteRGB = palette.map(hex => new THREE.Color(hex));

    const desired = Math.max(1, Math.min(this.maxParticles,
      Math.floor(themePack.particleCount || DEFAULT_PARTICLE_COUNT)));

    // 根据 quality 决定实际激活数量
    const active = this._qualityScaledCount(desired);
    this.activeParticles = active;
    this._desiredCount = desired;

    // 重填 colors 与 sizes（前 active 个）
    // 同时同步写入 originalColors/originalSizes 副本，供 highlight/clearHighlight 使用
    for (let i = 0; i < active; i++) {
      const c = paletteRGB[i % paletteRGB.length];
      const i3 = i * 3;
      const s = 0.6 + Math.random() * 1.2;
      this.colors[i3]     = c.r;
      this.colors[i3 + 1] = c.g;
      this.colors[i3 + 2] = c.b;
      this.sizes[i] = s;
      // 同步副本
      this.originalColors[i3]     = c.r;
      this.originalColors[i3 + 1] = c.g;
      this.originalColors[i3 + 2] = c.b;
      this.originalSizes[i] = s;
    }
    // 主题切换后清空高亮缓存（避免恢复到旧主题的颜色）
    this._highlighted.clear();

    // 标记 attribute 需更新
    this.geometry.attributes.aColor.needsUpdate = true;
    this.geometry.attributes.aSize.needsUpdate = true;
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aTarget.needsUpdate = true;

    this.geometry.setDrawRange(0, active);
  }

  /**
   * 根据 quality 计算实际激活粒子数
   * @param {number} desired 主题期望数量
   * @returns {number}
   * @private
   */
  _qualityScaledCount(desired) {
    switch (this.quality) {
      case 'low':    return Math.max(1, Math.floor(desired * 0.25));
      case 'medium': return Math.max(1, Math.floor(desired * 0.5));
      case 'high':
      default:       return desired;
    }
  }

  /**
   * 批量写入目标位置（来自 Layout 算法），触发 morph 动画 uMorphProgress 0→1
   * @param {Float32Array|number[]} positionsArray 长度 = activeParticles*3
   */
  setTargets(positionsArray) {
    if (!positionsArray) return;
    // 将当前 target 复制到 position，使 morph 从"当前形态"过渡到"新形态"
    // 第一次调用时 position 已是球面分布，无需复制
    if (this.morphActive || this.morphProgress > 0) {
      // 用当前插值结果作为新的"基础位置"，避免动画跳变
      const p = this.morphProgress;
      const n = this.activeParticles * 3;
      for (let i = 0; i < n; i++) {
        this.positions[i] = this.positions[i] * (1 - p) + this.targets[i] * p;
      }
      this.geometry.attributes.position.needsUpdate = true;
    }

    // 写入新 targets
    const n = Math.min(positionsArray.length, this.maxParticles * 3);
    for (let i = 0; i < n; i++) {
      this.targets[i] = positionsArray[i];
    }
    this.geometry.attributes.aTarget.needsUpdate = true;

    // 重启 morph 动画
    this.morphProgress = 0;
    this.morphActive = true;
    this.material.uniforms.uMorphProgress.value = 0;
  }

  /**
   * 每帧更新：推进 uTime 与 morph 动画
   * @param {number} dt 秒
   * @param {number} time 累计秒
   */
  update(dt, time) {
    this.material.uniforms.uTime.value = time;

    if (this.morphActive) {
      this.morphProgress += dt / MORPH_DURATION;
      if (this.morphProgress >= 1) {
        this.morphProgress = 1;
        this.morphActive = false;
      }
      this.material.uniforms.uMorphProgress.value = this.morphProgress;
    }
  }

  /**
   * 设置质量分级
   * @param {'high'|'medium'|'low'} level
   */
  setQuality(level) {
    if (level !== 'high' && level !== 'medium' && level !== 'low') return;
    if (level === this.quality) return;
    this.quality = level;
    // 重新计算激活数量
    const desired = this._desiredCount || this.activeParticles || DEFAULT_PARTICLE_COUNT;
    const active = this._qualityScaledCount(desired);
    this.activeParticles = active;
    this.geometry.setDrawRange(0, active);

    // low 关辉光：缩小尺寸 + 降低流场强度
    // high/medium 保留辉光
    if (level === 'low') {
      this.material.uniforms.uSizeScale.value = 0.7;
      this.material.uniforms.uFlowStrength.value = 0.4;
    } else if (level === 'medium') {
      this.material.uniforms.uSizeScale.value = 0.9;
      this.material.uniforms.uFlowStrength.value = 0.5;
    } else {
      this.material.uniforms.uSizeScale.value = 1.0;
      this.material.uniforms.uFlowStrength.value = 0.6;
    }
  }

  // ============================================================
  // Task 5.4：粒子高亮 / 群组高亮 / 清除高亮
  // 仅修改对应粒子的 aSize / aColor attribute 值并标记 needsUpdate，
  // 不重建 geometry，性能友好。原始值保存在 originalSizes/originalColors。
  // ============================================================

  /**
   * 高亮单个粒子：放大命中粒子（aSize ×3），并将邻近粒子向灰色插值淡化
   * 距离基于 targets（粒子最终位置，morph 完成后稳定）
   * @param {number} index 命中粒子索引
   * @param {number} [neighborRadius=30] 邻近判定半径（世界单位）
   * @param {number} [sizeScale=3.0]     命中粒子放大倍率
   */
  highlight(index, neighborRadius = 30, sizeScale = 3.0) {
    if (index < 0 || index >= this.activeParticles) return;
    // 先清除上一次的高亮
    this.clearHighlight();

    const ix3 = index * 3;
    const tx = this.targets[ix3];
    const ty = this.targets[ix3 + 1];
    const tz = this.targets[ix3 + 2];

    // 放大命中粒子
    this.sizes[index] = this.originalSizes[index] * sizeScale;
    this._highlighted.add(index);

    // 邻近粒子向灰色插值淡化（距离越近越淡）
    const r2 = neighborRadius * neighborRadius;
    for (let i = 0; i < this.activeParticles; i++) {
      if (i === index) continue;
      const i3 = i * 3;
      const dx = this.targets[i3]     - tx;
      const dy = this.targets[i3 + 1] - ty;
      const dz = this.targets[i3 + 2] - tz;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > r2) continue;
      // 距离归一化 0..1（越近 t 越大）
      const t = 1 - Math.sqrt(d2) / neighborRadius;
      const fade = t * 0.7; // 最大淡化 70%
      const r = this.originalColors[i3];
      const g = this.originalColors[i3 + 1];
      const b = this.originalColors[i3 + 2];
      const gray = (r + g + b) / 3;
      this.colors[i3]     = r * (1 - fade) + gray * fade;
      this.colors[i3 + 1] = g * (1 - fade) + gray * fade;
      this.colors[i3 + 2] = b * (1 - fade) + gray * fade;
      this._highlighted.add(i);
    }

    this.geometry.attributes.aSize.needsUpdate = true;
    this.geometry.attributes.aColor.needsUpdate = true;
  }

  /**
   * 高亮一组粒子（供搜索框调用）：放大匹配粒子簇，其他粒子淡化
   * @param {number[]} indices 匹配粒子的索引数组
   * @param {number} [sizeScale=2.5] 匹配粒子放大倍率
   */
  highlightGroup(indices, sizeScale = 2.5) {
    this.clearHighlight();
    if (!indices || indices.length === 0) return;

    const matchSet = new Set();
    for (let k = 0; k < indices.length; k++) {
      const idx = indices[k];
      if (idx >= 0 && idx < this.activeParticles) {
        matchSet.add(idx);
      }
    }
    if (matchSet.size === 0) return;

    // 放大匹配粒子，淡化其他粒子
    for (let i = 0; i < this.activeParticles; i++) {
      const i3 = i * 3;
      if (matchSet.has(i)) {
        this.sizes[i] = this.originalSizes[i] * sizeScale;
        // 匹配粒子保持原色（恢复确保正确）
        this.colors[i3]     = this.originalColors[i3];
        this.colors[i3 + 1] = this.originalColors[i3 + 1];
        this.colors[i3 + 2] = this.originalColors[i3 + 2];
      } else {
        // 淡化为原色的 30% + 灰度
        const r = this.originalColors[i3];
        const g = this.originalColors[i3 + 1];
        const b = this.originalColors[i3 + 2];
        const gray = (r + g + b) / 3 * 0.4;
        this.colors[i3]     = r * 0.25 + gray;
        this.colors[i3 + 1] = g * 0.25 + gray;
        this.colors[i3 + 2] = b * 0.25 + gray;
      }
      this._highlighted.add(i);
    }

    this.geometry.attributes.aSize.needsUpdate = true;
    this.geometry.attributes.aColor.needsUpdate = true;
  }

  /**
   * 清除高亮：把所有被修改过的粒子 aSize/aColor 恢复到原值
   * 仅遍历 _highlighted 集合，避免全量恢复
   */
  clearHighlight() {
    if (this._highlighted.size === 0) return;
    for (const i of this._highlighted) {
      if (i >= this.activeParticles) continue;
      const i3 = i * 3;
      this.colors[i3]     = this.originalColors[i3];
      this.colors[i3 + 1] = this.originalColors[i3 + 1];
      this.colors[i3 + 2] = this.originalColors[i3 + 2];
      this.sizes[i] = this.originalSizes[i];
    }
    this._highlighted.clear();
    this.geometry.attributes.aSize.needsUpdate = true;
    this.geometry.attributes.aColor.needsUpdate = true;
  }

  /**
   * 释放 GPU 资源
   */
  dispose() {
    if (this.points) {
      this.scene.remove(this.points);
      this.points = null;
    }
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    this.positions = null;
    this.targets = null;
    this.sizes = null;
    this.colors = null;
    this.offsets = null;
    this.originalSizes = null;
    this.originalColors = null;
    this._highlighted.clear();
    this._highlighted = null;
  }

  /**
   * 便捷访问：当前激活粒子数
   */
  get particlesCount() {
    return this.activeParticles;
  }
}

// 功能描述：3D 粒子系统核心模块。导出 ParticleSystem3D 类，构造时初始化 BufferGeometry
// 与 ShaderMaterial（顶点/片段着色器从 glsl 模块导入），并创建 THREE.Points 加入场景。
// 维护 5 个 attribute（position/aTarget/aSize/aColor/aOffset）与 5 个 uniform
// （uTime/uFlowStrength/uPixelRatio/uSizeScale/uMorphProgress），同时维护 originalSizes /
// originalColors 副本与 _highlighted 集合（Task 5.4 高亮恢复用）。
// 主要方法：
// - _normalizePalette(palette)：归一化调色板，兼容数组形态与 ThemePack schema 的对象形态
//   {main, accent, glow, bg, bg2}，统一返回 hex 字符串数组（bg 过暗不参与粒子着色）；
// - setTheme(themePack)：经 _normalizePalette 取色后重填 aColor、根据 particleCount 调整
//   activeParticles 与 drawRange，同步写入 originalColors/originalSizes 副本并清空高亮缓存；
// - setTargets(positionsArray)：将新目标写入 aTarget，并把当前插值结果固化到 position，
//   随后重启 morph 动画（uMorphProgress 在 1.5 秒内由 0 线性插值到 1）；
// - update(dt, time)：推进 uTime uniform 与 morph 动画进度；
// - setQuality(level)：high/medium/low 三档，通过缩放 drawRange 与 uSizeScale/uFlowStrength
//   实现"全部+辉光 / 减半 / 四分之一且关辉光"的分级渲染；
// - highlight(index, neighborRadius, sizeScale)（Task 5.4）：放大命中粒子 aSize×3，邻近粒子
//   （基于 targets 距离 < neighborRadius）向灰色插值淡化，仅修改被改动的粒子并标记 needsUpdate；
// - highlightGroup(indices, sizeScale)（Task 5.5 搜索高亮）：放大匹配粒子簇，其他粒子淡化，
//   供搜索框调用；
// - clearHighlight()：仅遍历 _highlighted 集合恢复 aSize/aColor 到 originalSizes/originalColors，
//   避免全量遍历，性能友好；
// - dispose()：移除 Points、释放 geometry/material 与高亮副本。
// 内部使用 SimplexNoise（CPU 端）为粒子初始位置做球面分布 + 噪声径向偏移，
// GLSL 端的 Simplex 风格流场则在着色器内用 sin/cos 近似实现，避免引入额外纹理依赖。
