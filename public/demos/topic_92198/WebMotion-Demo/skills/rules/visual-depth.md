---
name: visual-depth
description: WebMotion 视觉深度规则 — 让画面从平面变为立体
metadata:
  tags: visual-depth, layers, depth, atmosphere, design-thinking
---

# 视觉深度规则 — 让画面从平面变为立体

## 核心原则
WebMotion 做的是视频不是 PPT。每一帧都应该有视觉深度——有层次、有光影、有质感、有运动。

## 三层深度架构
每个场景都必须包含三层结构：
1. 背景层 — 创造空间感和氛围
2. 内容层 — 传递核心信息
3. 前景层 — 增加细节和运动感

### 背景层设计思维
- 背景不是纯色，而是有氛围的空间
- 径向渐变创造空间纵深感
- 暗角（vignette）引导视线到中心
- 漂浮粒子让画面"活"起来
- 微弱网格创造科技感（当内容适合时）

### 内容层设计思维
- 元素不是平面贴片，它们有材质和光感
- 渐变填充让形状有体积感
- 辉光让元素看起来在发光
- 模糊滤镜创造景深效果
- 混合模式让元素与背景融合

### 前景层设计思维
- 粒子用加法混合（blendMode: 'lighter'）产生真正的发光效果
- 装饰元素应该有微弱运动（呼吸/漂浮）
- 前景模糊创造镜头感

## 可用 API
- utils.fx.backgroundAtmosphere(options) — 大气背景
- utils.createParticles + utils.updateParticles + utils.drawParticles — 粒子系统
- registerElement 的 gradient/filter/blendMode/glowColor/glowIntensity 属性
- utils.noise(x, y) / utils.fbm(x, y) — 有机扰动
- ctx.filter — Canvas 2D 滤镜
- ctx.globalCompositeOperation — 混合模式

## 禁止事项
- 纯色背景（#000000 或任何单色填充整个画布）
- 所有元素在同一 Z 层（没有前景/背景区分）
- 静止画面（没有任何粒子或微动元素）
- 所有元素清晰度相同（没有景深变化）
