---
name: webmotion-best-practices
description: WebMotion MG 动画与视频包装最佳实践
metadata:
  tags: webmotion, mg-animation, canvas, video, motion-graphics
---

## 何时使用

当你在 WebMotion 项目中编写或生成 MG 动画代码时，加载此技能获取领域知识。

## 设计哲学：规则是边界，不是路径

本技能的规则文件提供的是**设计思维框架**和**技术底线**，不是效果目录或代码模板。

- 规则告诉你"不能做什么"和"应该思考什么"
- 规则不告诉你"具体怎么做"——那由内容和你的创造力决定
- 规则中的例子是**启发**，不是**可复制的实现**
- 每次创作都应从文字内容出发，独立设计独一无二的动画

**如果你发现自己只是在套用规则中的例子，说明你误解了规则的目的。**

## 项目结构

WebMotion 是一个基于 Canvas 2D / Three.js 的 MG 动画编辑器，核心文件：

- `js/app.js` — 主应用逻辑（场景管理、UI 交互、导出）
- `js/ai.js` — AI 生成动画（SYSTEM_PROMPT、API 调用）
- `js/utils.js` — 共享工具库（easing、spring、bezier、color、interpolate）
- `js/visual-editor.js` — 可视化编辑器（元素选择、拖拽、属性面板）
- `js/preview.js` — 渲染引擎（Canvas 2D + Three.js 3D 渲染）
- `js/scene.js` — 场景管理器（场景增删改、导入导出）
- `js/exporter.js` — 导出（PNG 序列、WebM、GIF）
- `js/timeline.js` — 时间轴控制器
- `js/element-registry.js` — 元素注册系统

## 场景代码结构

每个场景接收这些参数：
- 2D Canvas：`function(ctx, t, width, height, utils)` — `ctx` 是 Canvas 2D 上下文，`t` 是当前秒数
- 3D Three.js：`function(THREE, scene, camera, width, height, utils)` — 需要 `return function animate(t) { ... }`

### 元素注册（必须）

所有可编辑元素必须通过 `utils.registerElement()` 注册，然后 `.draw(ctx)` 渲染。禁止直接用 `ctx.fillText()` 或 `ctx.fillRect()` 绘制文字和形状。

装饰效果（光晕、粒子、渐变）可以直接用 `ctx` 绘制。

## 设计思维规则

这些规则提供设计思考的维度，不是效果选择目录：

- [rules/video-layout.md](rules/video-layout.md) — 视频布局思维：全帧观看、安全区、避免网页 UI 模式
- [rules/timing.md](rules/timing.md) — 时序思维：从内容节奏推导动画节奏、缓动选择原则
- [rules/text-animations.md](rules/text-animations.md) — 文字动画思维：从文字语义推导动画维度（揭示、方向、强调、出场）
- [rules/transitions.md](rules/transitions.md) — 转场思维：从叙事关系推导转场选择
- [rules/color-theory.md](rules/color-theory.md) — 色彩思维：从内容情感推导配色方案
- [rules/composition.md](rules/composition.md) — 构图思维：从内容结构推导画面布局
- [rules/effects.md](rules/effects.md) — 效果思维：效果服务于内容，克制优先
- [rules/code-quality.md](rules/code-quality.md) — 代码质量：技术底线与无路径依赖原则

## 三种使用方式

WebMotion 提供三种创作方式：

1. **编程 Agent 直接编辑** — Agent 根据文案内容，自行设计并编写动画代码。每次都是全新创作，根据文字本身的语义、情感、结构搭配合适的动画。不得套用模板或预设路径。

2. **调用 AI API 生成** — 用户在设置中配置 AI API Key，输入文案后由 AI 分析语义、生成动画代码。AI 通过 SYSTEM_PROMPT 获取所有规则知识，遵循无路径依赖原则。

3. **手动编写代码** — 用户直接在代码编辑器中编写 Canvas 2D / Three.js 动画代码。

## 导出

支持导出为 PNG 序列帧（ZIP）、WebM 视频（VP9）、GIF 动画。默认分辨率 1920×1080，可选 1080×1920 竖屏。
