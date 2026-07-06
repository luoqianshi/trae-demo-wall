# 视觉升级设计：墨绿宝石风格

> 日期：2026-07-06  
> 状态：已批准，待实施

## 1. 概述

对 TRAE 作品墙网站进行深度视觉风格升级，在保留 TRAE 官方元素的基础上，将整体美学方向从单一翠绿暗色主题升级为"墨绿宝石"风格——沉稳、精致、有生命力，像一块被打磨过的翡翠。

### 目标

- 在保留 TRAE 官方元素的基础上，升级整体视觉风格为墨绿宝石质感
- 将默认筛选模式从「热度」改为「最新发布」
- 重新设计更有高级感的全屏沉浸式 Hero 板块
- 为没有截图的作品按类别生成符合新 UI 风格的默认插画图

### 非目标

- 不改动数据爬取逻辑和数据结构
- 不改变路由结构（纯享模式已在之前移除）
- 不引入新的第三方动画库（优先纯 CSS 方案）

## 2. 色彩体系

将现有单一翠绿 `#22c55e` 深化为多层次的墨绿宝石色谱。

### 背景层（由深到浅）

| 变量 | 值 | 用途 |
|------|-----|------|
| `--trae-bg` | `#0a0f0d` | 主背景，近黑墨绿 |
| `--trae-bg-elevated` | `#0f1714` | 卡片/面板背景 |
| `--trae-card` | `#131e1a` | 悬浮卡片 |
| `--trae-border` | `#1e2d27` | 边框/分割线 |

### 宝石绿系（强调色）

| 变量 | 值 | 用途 |
|------|-----|------|
| `--trae-accent` | `#10b981` | 主强调色 (emerald-500) |
| `--trae-accent-deep` | `#047857` | hover/active 深翡翠 |
| `--trae-accent-glow` | `#34d399` | 高光发光色 (emerald-400) |
| `--trae-accent-soft` | `rgba(16,185,129,0.15)` | 柔光背景 |

### 文字层

| 变量 | 值 | 用途 |
|------|-----|------|
| `--trae-text` | `#e8f5ee` | 主文字，带绿调的白 |
| `--trae-text-muted` | `#6b8278` | 次要文字，灰绿 |
| `--trae-text-dim` | `#3d4f47` | 辅助/禁用 |

### 磨砂玻璃效果

| 变量 | 值 | 用途 |
|------|-----|------|
| `--glass-bg` | `rgba(15,23,20,0.6)` | 玻璃背景 |
| `--glass-border` | `rgba(52,211,153,0.12)` | 玻璃边框 |
| `--glass-blur` | `20px` | 模糊半径 |

## 3. 字体系统

用有性格的字体替代当前单调的 Inter，打造"精致、有文人气、但不失科技感"的排版风格。

### 字体选择

| 用途 | 字体 | 说明 |
|------|------|------|
| 展示 (Display) | Noto Serif SC (思源宋体) | 衬线体，用于 Hero 大标题、章节标题，带典雅气质 |
| 正文 (Body) | Noto Sans SC (思源黑体) | 比 Inter 更有中文阅读质感，干净利落 |
| 等宽 (Mono) | JetBrains Mono | 开发者气质，用于浏览量/点赞数/统计数字 |

### 字号阶梯（1.25 模数）

| 元素 | 大小 | 字重 | 字体 |
|------|------|------|------|
| Hero 主标题 | 5rem (80px) | 700 | Serif, letter-spacing: -0.02em |
| Hero 副标题 | 1.25rem (20px) | 400 | Sans |
| 章节标题 | 2.5rem (40px) | 700 | Serif |
| 卡片标题 | 1rem (16px) | 600 | Sans |
| 正文 | 0.875rem (14px) | 400 | Sans |
| 数据/标签 | 0.75rem (12px) | 500 | Mono |

### 加载方式

通过 `@import` 从 Google Fonts 加载，在 `main.css` 的 `:root` 中定义 `--font-display`、`--font-body`、`--font-mono` 变量，Tailwind config 中映射到 `font-serif`/`font-sans`/`font-mono`。

## 4. Hero 板块（全屏沉浸式）

### 布局

全屏居中布局，背景是流动的墨绿渐变 + 粒子效果。

```
┌─────────────────────────────────────────────┐
│           [流动墨绿渐变背景 + 光晕粒子]         │
│                                             │
│              ✦ TRAE 作品墙                  │  ← 小标签，mono字体
│                                             │
│          探索 AI 编程的                      │  ← 衬线大标题 5rem
│           无限可能                           │     两行排版
│                                             │
│     汇聚开发者智慧，发现 TRAE 创意作品         │  ← 副标题
│                                             │
│    [灵感孵化舱]  [TRAE Idea Hall]  [大赛官网]  │  ← 保留三个外部按钮
│                                             │
│        2,345 作品  ·  56,872 浏览  ·  1,332 赞  │  ← 统计数据 mono字体
│                                             │
└─────────────────────────────────────────────┘
```

### 背景动效（纯 CSS）

- 三层径向渐变叠加，模拟翡翠内部的光线折射
- `@keyframes` 缓慢移动光晕位置（20s 循环），呼吸感
- 细微的 noise 纹理 overlay（SVG `feTurbulence`），增加质感
- 底部渐隐到 `--trae-bg`，无缝过渡到作品列表

### 按钮升级

三个外部按钮统一为磨砂玻璃质感 + 宝石绿边框，hover 时边框发光 + 微微上浮。主按钮（灵感孵化舱）用实心宝石绿，其余两个用 glass 风格。

### 入场动画

标签 → 标题 → 副标题 → 按钮 → 数据，逐层 staggered reveal（`animation-delay` 0.1s 递增），`opacity 0→1` + `translateY 20px→0`。

### 统计数据

从 `store.stats` 读取，mono 字体 + 宝石绿数字 + 灰绿标签，用 `·` 分隔。

## 5. 默认筛选改为「最新发布」

### 改动点

- `SortSelect.vue`：`selected` 初始值 `'popular'` → `'latest'`
- `projectStore.js`：确认 `sortOption === 'latest'` 分支按 `createdAt` 字段降序排列（若该字段缺失则回退到 `publishedAt`）

## 6. ProjectCard 升级

### 布局

```
┌──────────────────────────┐
│  [缩略图/默认插画]         │  ← aspect-video
│           [在线体验]      │  ← 标签改为 glass 风格
├──────────────────────────┤
│  作品标题                  │  ← Sans 600
│  [标签]      👁 1.2k  ♥ 34 │  ← Mono 字体数据
└──────────────────────────┘
```

### 改动点

- 卡片背景用 `--trae-card` + 细微的 `1px` 宝石绿边框 `rgba(52,211,153,0.08)`
- hover：边框发光 `0 0 0 1px var(--trae-accent-glow)` + 卡片微浮 `translateY(-4px)` + 阴影加深
- 缩略图缺省时改用 canvas-design 生成的默认插画（见第 8 节）
- 浏览量/点赞数用 `font-mono` + 宝石绿数字

## 7. 导航栏升级

当前 `App.vue` 中的导航栏改为磨砂玻璃顶栏。

### 改动点

- `backdrop-filter: blur(20px)` + `background: var(--glass-bg)`
- 底部 `1px` 渐变边框 `linear-gradient(90deg, transparent, var(--trae-accent-soft), transparent)`
- 滚动时阴影渐显
- Logo + 导航链接用 Serif 字体，更有品牌感

## 8. 默认插画（canvas-design）

### 类别映射

从数据中提取所有 tag 类别，归类为 8 个大类，每个大类对应一张独特插画。

| 大类 | 涵盖标签 | 插画意象 |
|------|---------|---------|
| tools | 工具、效率、自动化 | 齿轮 + 矩形几何，墨绿渐变 |
| ai | AI、智能、对话 | 神经网络节点 + 光晕连线 |
| game | 游戏、娱乐、互动 | 手柄轮廓 + 像素方块 |
| data | 数据、图表、可视化 | 柱状图抽象 + 网格背景 |
| education | 教育、学习、文档 | 翻开的书页 + 光线 |
| design | 设计、创意、艺术 | 调色板 + 画笔笔触 |
| web | Web、应用、网站 | 浏览器窗口框 + 光标 |
| general | 其他未分类 | 抽象宝石切面 + TRAE logo 轮廓 |

### 视觉规范

- 尺寸：600×338 (16:9 比例)
- 背景：墨绿渐变 `#0f1714 → #1e2d27`
- 线条：宝石绿 `#10b981`，1.5px 细线描边，几何抽象风格
- 光晕点缀：`#34d399` 微光
- 右下角统一放一个小的 TRAE 品牌标记（轮廓 + 透明度 0.3）

### 实现

- 使用 canvas-design skill 生成 8 张 SVG 插画
- 存储到 `src/assets/default-illustrations/` 目录
- `ProjectCard.vue` 中 `v-else` 分支按类别加载对应插画
- Vite 中 SVG 加载方式：通过 `import` 静态导入或使用 `new URL('...', import.meta.url).href`

```js
// 推荐方式：静态 import
import toolsImg from '@/assets/default-illustrations/tools.svg'
import aiImg from '@/assets/default-illustrations/ai.svg'
// ... 其余 6 张

const illustrationMap = { tools: toolsImg, ai: aiImg, /* ... */ }

function getDefaultIllustration(tags) {
  const category = categorizeTag(tags?.[0])
  return illustrationMap[category] || illustrationMap.general
}
```

## 9. 实施顺序

1. **色彩 & 字体令牌**：更新 `main.css` 和 `tailwind.config.js` 中的设计令牌
2. **Hero 板块**：重写 `HeroSection.vue`
3. **导航栏**：更新 `App.vue` 中的导航栏样式
4. **默认筛选**：更新 `SortSelect.vue` 和 `projectStore.js`
5. **默认插画**：用 canvas-design 生成 8 张 SVG，创建分类工具函数
6. **ProjectCard**：更新卡片样式和缺省图逻辑
7. **章节标题 & 其他细节**：更新 `ProjectGrid.vue` 等
8. **构建验证**：本地构建确认无报错

## 10. 涉及文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/assets/styles/main.css` | 修改 | 更新色彩/字体/玻璃效果变量 |
| `tailwind.config.js` | 修改 | 映射新字体到 Tailwind |
| `src/components/HeroSection.vue` | 重写 | 全屏沉浸式 Hero |
| `src/App.vue` | 修改 | 磨砂玻璃导航栏 |
| `src/components/SortSelect.vue` | 修改 | 默认排序改为 latest |
| `src/stores/projectStore.js` | 修改 | 确认 latest 排序逻辑 |
| `src/components/ProjectCard.vue` | 修改 | 卡片样式 + 默认插画 |
| `src/components/ProjectGrid.vue` | 修改 | 章节标题样式 |
| `src/assets/default-illustrations/*.svg` | 新建 | 8 张分类默认插画 |
| `src/utils/categoryMapper.js` | 新建 | tag → 大类映射工具 |
