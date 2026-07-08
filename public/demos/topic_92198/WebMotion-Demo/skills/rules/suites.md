---
name: 视觉套件系统
description: 根据内容类型自动选择专业视觉套件组合，打破单一渲染方式的局限
priority: critical
---

# 视觉套件系统规则 — 让每个场景都有独特的视觉语言

## 核心原则
WebMotion 内置多个专业视觉套件。不同内容类型需要不同的视觉语言——数据用图表，创意用生成艺术，概念用形状变形。一套文案中的不同场景应使用不同套件组合，让视频有丰富的视觉变化，而不是从头到尾一种风格。

## 可用套件及访问方式

| 套件 | 访问路径 | 类型 | 适用场景 |
|------|---------|------|---------|
| D3.js | utils.d3 | 数据可视化 | 图表、地图、数据驱动图形 |
| Three.js | utils.THREE | 3D 引擎 | 3D 场景、着色器、沉浸式体验 |
| GSAP | utils.gsap | 动画引擎 | 复杂时间轴、交错特效、精确控制 |
| Anime.js | utils.anime | JS 动画 | 交错特效、弹簧物理 |
| p5.js | utils.p5 | 创意编程 | 生成艺术、有机形状、流场 |
| Flubber | utils.flubber | SVG 变形 | 形状过渡、路径插值 |
| Lottie | utils.lottie | 动态图形 | AE 动画播放、微交互 |
| Canvas 2D | ctx（原生） | 2D 绘图 | 基础渲染、像素级控制 |
| VisualFX | utils.fx | 特效库 | 渐变文字、玻璃态、粒子、光线 |

## 套件选择思维框架

### 从内容推导套件
不要问"我想用什么套件"，要问"这个内容需要什么视觉语言"：
- 内容有**数字和对比** → D3.js 让数据可视化
- 内容有**抽象概念** → Canvas 2D + VisualFX 玻璃态让概念具象化
- 内容有**创意和品牌** → p5.js 生成艺术创造独特视觉
- 内容有**形态变化** → Flubber 让形状平滑变形
- 内容有**空间和结构** → Three.js 让概念立体化
- 内容有**动效细节** → Lottie 播放精致微交互

### 同步 vs 异步套件
WebMotion 是逐帧同步渲染（每帧调用渲染函数，t 为当前时间）：
- **同步套件**（D3、Flubber、p5 数学函数）：直接调用，结果立即可用
- **异步套件**（GSAP、Anime.js、Lottie）：不能直接运行动画，使用方式：
  - GSAP：用 `gsap.parseEase()` 获取缓动函数、`gsap.utils.distribute()` 计算交错、`gsap.utils.mapRange()` 做范围映射
  - Anime.js：用 `anime.stagger()` 计算交错延迟，应用到 registerElement 的 animInDelay
  - Lottie：预加载动画，每帧 `goToAndStop(frame, true)` 同步渲染

### Canvas 集成模式
所有套件的输出最终都要合成到 Canvas 2D 画布：
- D3：生成 SVG path 字符串 → `new Path2D(path)` → `ctx.fill(path2d)`
- p5：实例模式创建离屏 canvas → `ctx.drawImage(p5Canvas, x, y)`
- Flubber：插值生成 SVG path → `new Path2D(morphedPath)` → `ctx.fill(path2d)`
- Lottie：渲染到独立 canvas → `ctx.drawImage(lottieCanvas, x, y, w, h)`
- GSAP/Anime：计算数值 → 通过 registerElement 或 ctx 绘制

## 默认排列组合

### 多场景策略
一套文案生成多场景时，不同场景使用不同套件组合：

| 场景类型 | 套件组合 | 视觉特征 |
|---------|---------|---------|
| 开场标题 | Canvas 2D + GSAP 缓动 + VisualFX 动态文字 + 粒子 | 震撼开场 |
| 数据展示 | D3.js 比例尺 + Canvas 渲染 + 渐变填充 + 粒子 | 专业可信 |
| 概念解释 | Canvas 2D + VisualFX 玻璃态 + GSAP 交错 + 暗角 | 清晰高级 |
| 创意过渡 | p5.js 生成艺术 + Canvas 合成 + 加法混合 | 艺术流动 |
| 形状转换 | Flubber 变形 + 渐变填充 + 辉光 | 流畅变身 |
| 立体展示 | Three.js 着色器 + Bloom 辉光 + 环境光 | 沉浸立体 |
| 结尾收束 | Canvas 2D + 粒子汇聚 + 渐变文字 | 完美收尾 |

### 最低多样性要求
- 5 场景以上：至少使用 3 种不同套件组合
- 3-4 场景：至少使用 2 种不同套件组合
- 2 场景以下：每个场景使用不同套件

## 禁止事项
- 所有场景都用同一种渲染方式（如全部纯 Canvas 2D fillText）
- 异步套件直接运行动画（如 `gsap.to()` 不 seek 直接运行）
- 套件使用与内容类型不匹配（如纯文字场景用 D3 画图表）
- 忽略套件能力，所有效果都从零手写（应优先使用套件的现成功能）
