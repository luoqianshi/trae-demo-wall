# 智学伴侣 — 开发总结

## 项目概述

"智学伴侣"是一款AI驱动个性化学习助手App的纯前端交互Demo，在单一HTML页面中模拟了四个核心功能模块。用户可以在App风格的界面中浏览知识图谱、使用番茄钟进行专注计时、管理每周学习计划、查看学习数据统计看板，无需任何后端服务或外部API。

项目采用三文件架构（HTML骨架、CSS样式系统、JS交互逻辑），基于Vanilla JavaScript实现，零构建工具依赖，可直接通过 `file://` 协议打开运行。

## 技术架构

### 文件拆分

三文件按职责分离，浏览器可并行加载：

- **智学伴侣-demo.html**：语义化HTML骨架，包含App壳层（Header、Content、Tab Bar）、四个功能页面（`page-graph`、`page-timer`、`page-plan`、`page-stats`）、Sheet弹窗和导航结构
- **demo-app.css**：完整样式系统，包含CSS变量体系（8个核心变量）、App壳层布局、页面切换动画、组件样式（卡片、环形进度条、按钮、弹窗、Tab Bar）、响应式断点和 `prefers-reduced-motion` 适配
- **demo-app.js**：全部交互逻辑，采用IIFE + 命名空间模块模式组织，包含 `NavModule`、`GraphModule`、`PlanModule`、`StatsModule`、`TimerModule` 五个模块，以及集中式 `state` 对象

### 模块化方案

```
ZhiXueApp (IIFE)
├── state              // 集中式状态对象
│   ├── currentTab
│   ├── graph          // 图谱状态（节点、边、视口、拖拽）
│   ├── timer          // 计时器状态（模式、状态、番茄数）
│   └── plan           // 规划状态（当前日期、任务完成状态）
├── NavModule          // 页面导航与Tab切换
├── GraphModule        // Canvas知识图谱渲染与交互
├── TimerModule        // 番茄钟计时与白噪音
├── PlanModule         // 周计划管理与任务追踪
└── StatsModule        // 学习数据统计与可视化
```

### 数据持久化

所有用户数据通过 `localStorage` 按自然日分区存储：

| 键模式 | 数据结构 | 所属模块 |
|--------|---------|---------|
| `zhixue_focus_YYYY-MM-DD` | `{pomodoros: number, focusTime: number}` | TimerModule |
| `zhixue_plan_YYYY-MM-DD` | `{taskId: boolean}` | PlanModule |

按自然日分区的设计确保跨天数据隔离，且无需手动清理过期数据。重置功能会遍历 `localStorage` 匹配前缀删除所有相关键。

## 功能模块

### 知识图谱

以"前端开发"为演示学科，Canvas 2D渲染12个知识点节点，分层展示从基础到工程化的知识体系。节点按四种状态着色：已掌握（绿）、学习中（黄）、已解锁（紫）、未解锁（灰）。连线表示前置依赖关系，选中节点时相关连线高亮。

布局算法采用分层预计算（按layer水平分布）配合轻量力导向微调。力导向运行120帧后冻结，保证布局稳定且计算开销可控。视图支持拖拽平移和滚轮缩放，缩放范围 0.4x–3x。高DPI适配通过 `devicePixelRatio` 缩放画布实现。

点击节点弹出底部Sheet详情弹窗，显示前置知识、学习时长、掌握程度进度条和学习建议。弹窗使用 `role="dialog"` + `aria-modal="true"` 语义标记，支持Escape键和遮罩层点击关闭。

### 专注计时

标准番茄钟实现：25分钟工作 + 5分钟休息循环。SVG圆形进度条实时可视化剩余时间，`stroke-dashoffset` 过渡动画驱动。工作模式使用绿色（`--accent`），休息模式使用紫色（`--accent-secondary`）。

计时器通过 `setInterval` 每秒递减，Page Visibility API监听页面隐藏事件自动暂停计时，防止后台计时不准。白噪音通过Web Audio API生成粉红噪声，使用6级滤波器近似，音量控制在0.04。今日统计数据（番茄数、专注时长）持续写入 `localStorage`。

### 智能学习规划

周视图管理界面，包含四个子组件：环形进度条概览、7天日期选择条、任务列表、今日推荐知识点。

日期选择条为水平滚动按钮列表，自动定位到今日。点击日期切换任务视图，选中日期使用绿色pill高亮。任务卡片使用 `<button>` + `aria-pressed` 实现勾选切换，完成状态通过划线样式和绿色边框视觉反馈。每次勾选立即写入 `localStorage`，支持跨页面刷新持久化。

今日推荐从知识图谱数据中筛选"学习中"状态节点，不足时依次补充"已解锁"和"已掌握"节点，最多3个。每个推荐卡片展示知识点名称、状态标签和进度条。与计时器模块的联动通过直接读取 `state.timer.pomodorosCompleted` 实现，在页面激活时刷新。

### 学习统计看板

聚合来自知识图谱、专注计时、学习规划三个模块的数据，以可视化图表展示学习进度全貌。页面包含四个组件：概览卡片、知识掌握分布、本周任务完成趋势折线图、学习时间分布柱状图。

概览卡片通过三列网格展示今日学习时长、累计番茄数和知识掌握率，数据直接读自 `state.timer` 和 `KnowledgeGraphData.nodes`。知识掌握分布使用SVG环形进度条配合分类明细列表，展示12个知识节点在四类状态下的分布情况。

折线图使用Canvas 2D渲染，蓝色虚线表示每日总任务数，绿色实线 + 渐变填充表示已完成数，每个数据点标注圆点。X轴以周日到周六为标签，Y轴自动适配最大值。柱状图使用紫色渐变圆角矩形展示每日专注时长，柱顶标注分钟数。两个图表均通过 `setupCanvas()` 方法统一处理 `devicePixelRatio` 缩放和容器尺寸适配。

数据处理特点：本周数据通过遍历7天日期、读取 `localStorage` 中对应的 `zhixue_focus_*` 和 `zhixue_plan_*` 键聚合；所有读取操作包裹 `try-catch`，缺失数据优雅降级为0。图表仅在页面激活时渲染，非激活状态不消耗计算资源。

## 设计系统

整个项目的视觉语言基于暗黑科技风，以深色 `#0a0e1a` 为背景基调，荧光绿 `#00e5a0` 为主色调，紫色 `#6c5ce7` 和金色 `#fdcb6e` 为辅色。所有颜色值通过CSS变量统一管理，确保跨页面一致性。

组件设计遵循统一的模式：卡片使用半透明背景 + 1px边框 + 20px圆角，按钮使用pill形状（圆角50px），主要按钮以主色填充并附带发光阴影 (`box-shadow: 0 4px 20px var(--accent-glow)`)，次要按钮使用透明背景 + 边框。hover效果统一为 `translateY(-2px)` 提升和阴影增强。

动效规范严格限定使用 `transform` 和 `opacity` 两个属性，明确列出过渡属性名（不使用 `transition: all`），配合 `@media (prefers-reduced-motion: reduce)` 全局禁用动画。页面切换使用 `opacity` + `translateX` 的淡入滑入效果。

响应式通过 `@media (max-width: 480px)` 断点适配移动端，使用 `100dvh` 动态视口高度，Tab Bar底部预留 `env(safe-area-inset-bottom)` 安全区域。

## 关键决策

**Canvas vs SVG 渲染知识图谱**：选用Canvas 2D，因为节点数量可扩展至50+且需要发光效果（`shadowBlur`）。Canvas直接操作像素缓冲区，无需维护DOM节点树，拖拽和缩放时性能更稳定。而计时器和规划页的环形进度条使用SVG，因为它们是静态图表，SVG的CSS过渡动画和语义标记更合适。

**class切换 vs URL路由**：单页面Demo无需浏览器历史管理，class切换模式（`page-active` 类控制显示/隐藏）足够简洁。页面切换时通过 `tabindex="-1"` + `focus()` 管理焦点，语义由 `aria-selected` 实现。

**任务勾选用 button + aria-pressed**：纯样式定制的需求下，`<button>` 比 `<input type="checkbox">` 更灵活，比自定义 `role="checkbox"` 的div更语义明确。`aria-pressed` 是toggle button的标准模式，屏幕阅读器能正确朗读"已按下/未按下"状态。

**扁平 taskId → boolean 存储**：任务完成状态使用 `{taskId: boolean}` 的扁平map而非数组，单次写入只需更新一个键，读取时O(1)查找。无需维护数组索引的一致性。

## 合规说明

### 可访问性

- 所有Icon按钮使用 `aria-label`（Tab按钮、关闭按钮、控制按钮）
- 底部Tab按钮使用 `role="tab"` + `aria-selected` 表示导航状态
- 任务卡片使用 `aria-pressed` 表示完成状态
- 日期按钮使用 `role="option"` + `aria-selected`
- 弹窗使用 `role="dialog"` + `aria-modal="true"`
- 环形进度条SVG使用 `role="img"` + `aria-label`
- 页面切换时焦点移至新页面的 `<h2 tabindex="-1">`
- 全局 `focus-visible` 样式：2px青色outline，offet 2px
- 无 `outline: none`、无 `div onclick` 代替button

### 动效与性能

- 所有过渡使用明确属性名（`transition: opacity 0.3s, transform 0.3s`），不使用 `transition: all`
- `@media (prefers-reduced-motion: reduce)` 覆盖全部动画组件
- 知识图谱Canvas使用 `requestAnimationFrame` 渲染循环，节点渲染使用 `shadowBlur` 而非DOM阴影
- 计时器使用 `visibilitychange` 事件在页面不可见时暂停，避免后台CPU消耗
- 日期选择条使用 `scrollbar-width: none` 隐藏滚动条，`overscroll-behavior: contain` 防止弹窗内滚动穿透

### 响应式

- 三列推荐卡片在移动端变为单列
- 进度概览区在移动端从横向布局变为纵向
- 所有间距和字号在 `@media (max-width: 480px)` 中缩小
- `height: 100dvh` 适配移动端动态地址栏