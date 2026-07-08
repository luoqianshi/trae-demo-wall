---
name: shader-art
description: WebMotion 着色器与 3D 效果规则 — 用代码创造视觉奇观
metadata:
  tags: shader-art, shader, 3d, webgl, threejs, design-thinking
---

# 着色器与 3D 效果规则 — 用代码创造视觉奇观

## 核心原则
Three.js 不只是旋转方块的工具。它是 WebGL 的完整封装，能实现 Shadertoy 级别的视觉奇观。当你选择 3D 模式时，目标是创造 2D Canvas 无法实现的效果。

## ShaderMaterial 设计思维
- 着色器是控制 GPU 的直接方式，能实现 CPU 不可能的视觉效果
- uniforms 传入时间和参数，每帧更新驱动动画
- vertexShader 控制形状变化（位移、波动、形变）
- fragmentShader 控制颜色和光照（渐变、噪声、光线步进）

## 后处理设计思维
- Bloom（辉光）让发光物体真正发光，是 3D 视觉质感的关键
- 景深让画面有镜头感
- 色差和噪点创造胶片质感

## GPU 粒子设计思维
- BufferGeometry + Points + ShaderMaterial 实现十万级粒子
- 粒子运动全部在顶点着色器中计算，CPU 零开销
- 片元着色器中用 gl_PointCoord 画软边圆盘

## Raymarching 设计思维
- SDF（有符号距离函数）定义物体形状，无需顶点数据
- 光线步进循环实现体积渲染
- 域折叠创造分形艺术

## 可用 API（3D 模式）
- utils.createShader(opts) — 创建 ShaderMaterial
- utils.createParticles(count, positions, options) — 创建 GPU 粒子
- utils.addBloom(strength, radius, threshold) — 启用辉光后处理
- utils.createGradientTexture(colors) — 创建渐变纹理
- THREE.ShaderMaterial, THREE.BufferGeometry, THREE.Points — 完整 Three.js API

## 何时使用 3D
- 内容本身涉及立体概念（球体、晶格、空间关系）
- 需要 ShaderMaterial 实现的流体/有机效果
- 需要 Bloom 后处理的发光场景
- 需要 GPU 粒子的大规模粒子效果

## 禁止事项
- 3D 模式只用 BoxGeometry + MeshPhongMaterial 旋转（这是 demo 不是设计）
- 着色器中没有 uTime uniform（无法动画）
- 不使用 addBloom（发光物体没有辉光质感）
