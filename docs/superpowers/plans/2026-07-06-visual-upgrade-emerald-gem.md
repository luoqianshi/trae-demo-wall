# 墨绿宝石视觉升级 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 TRAE 作品墙从单一翠绿暗色主题升级为墨绿宝石风格，包括色彩/字体令牌重构、全屏沉浸 Hero、磨砂玻璃导航栏、默认筛选改为最新发布、ProjectCard 升级、以及 6 张分类默认 SVG 插画。

**Architecture:** 通过更新 Tailwind config + main.css 的设计令牌层实现全局色彩/字体切换，然后逐一精修关键组件（HeroSection、Navbar、ProjectCard、ProjectGrid）。默认插画用 SVG 文件 + Vite 静态 import 方式加载。ParticleCanvas 的粒子颜色也需同步更新。

**Tech Stack:** Vue 3 (Composition API) + Pinia + Tailwind CSS + Vite + 纯 CSS 动画

**Spec:** `docs/superpowers/specs/2026-07-06-visual-upgrade-emerald-gem-design.md`

---

### Task 1: 更新 Tailwind 配色与字体令牌

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: 替换 tailwind.config.js 的全部配色和字体**

将 `tailwind.config.js` 的 `theme.extend` 部分替换为以下内容（保留 borderRadius 和 maxWidth 不变）：

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'trae-bg': '#0a0f0d',
        'trae-bg-elevated': '#0f1714',
        'trae-surface': '#0f1714',
        'trae-card': '#131e1a',
        'trae-tag': '#1a2820',
        'trae-tag-hover': '#243530',
        'trae-border': '#1e2d27',
        'trae-border-strong': '#2a3f37',
        'trae-accent': '#10b981',
        'trae-accent-deep': '#047857',
        'trae-accent-glow': '#34d399',
        'trae-gold': '#fbbf24',
        'trae-silver': '#a1a1aa',
        'trae-bronze': '#b45309',
        'trae-text': '#e8f5ee',
        'trae-text-secondary': '#8fa89e',
        'trae-text-tertiary': '#b8c9c1',
        'trae-text-muted': '#6b8278',
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        serif: ['Noto Serif SC', 'Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'trae-card': '16px',
        'trae-pill': '9999px',
        'trae-input': '8px',
      },
      maxWidth: {
        'trae-container': '1280px',
      },
      boxShadow: {
        'trae-glow': '0 0 24px rgba(16, 185, 129, 0.12)',
        'trae-glow-strong': '0 0 48px rgba(16, 185, 129, 0.2)',
        'trae-card-hover': '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(52, 211, 153, 0.15)',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Commit**

```bash
git add tailwind.config.js
git commit -m "refactor: 更新 Tailwind 配色为墨绿宝石色谱 + 新字体系统"
```

---

### Task 2: 更新 main.css 字体导入与组件样式

**Files:**
- Modify: `src/assets/styles/main.css`

- [ ] **Step 1: 替换 main.css 全部内容**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Noto+Sans+SC:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

:root {
  --trae-bg: #0a0f0d;
  --trae-bg-elevated: #0f1714;
  --trae-card: #131e1a;
  --trae-border: #1e2d27;
  --trae-accent: #10b981;
  --trae-accent-deep: #047857;
  --trae-accent-glow: #34d399;
  --trae-accent-soft: rgba(16, 185, 129, 0.15);
  --trae-text: #e8f5ee;
  --trae-text-muted: #6b8278;
  --glass-bg: rgba(15, 23, 20, 0.6);
  --glass-border: rgba(52, 211, 153, 0.12);
  --glass-blur: 20px;
  --font-display: 'Noto Serif SC', 'Fraunces', Georgia, serif;
  --font-body: 'Noto Sans SC', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

@layer base {
  html {
    scroll-behavior: smooth;
  }
  body {
    @apply bg-trae-bg text-trae-text font-sans leading-relaxed;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }
}

@layer components {
  .btn-primary {
    @apply inline-flex items-center gap-1.5 px-6 py-3 rounded-trae-pill bg-trae-accent text-trae-bg font-semibold text-sm
           hover:bg-trae-accent-deep hover:-translate-y-0.5 hover:shadow-trae-glow-strong
           transition-all duration-200 cursor-pointer border-none;
  }
  .btn-glass {
    @apply inline-flex items-center gap-1.5 px-6 py-3 rounded-trae-pill text-trae-text
           border border-trae-accent-glow/20 font-medium text-sm
           transition-all duration-200 cursor-pointer;
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
  }
  .btn-glass:hover {
    @apply border-trae-accent-glow/40 -translate-y-0.5;
    box-shadow: 0 0 24px rgba(16, 185, 129, 0.15);
  }
  .tag-pill {
    @apply inline-flex items-center px-4 py-1.5 rounded-trae-pill bg-trae-tag text-trae-text-tertiary
           text-sm font-medium cursor-pointer transition-all duration-200
           hover:bg-trae-tag-hover hover:text-trae-text;
  }
  .tag-pill.active {
    @apply bg-trae-accent text-trae-bg;
  }
  .trae-input {
    @apply w-full px-4 py-3 bg-trae-tag border border-trae-border-strong rounded-trae-input
           text-trae-text text-sm outline-none
           placeholder:text-trae-text-muted
           focus:border-trae-accent focus:ring-2 focus:ring-trae-accent/20
           transition-all duration-200;
  }
  .trae-card {
    @apply bg-trae-card border border-trae-border rounded-trae-card overflow-hidden
           transition-all duration-300;
  }
  .trae-card:hover {
    @apply border-trae-accent-glow/30 shadow-trae-card-hover -translate-y-1;
  }
  .glass-panel {
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--glass-border);
  }
}

@keyframes skeleton-slide {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.skeleton-pulse {
  background: linear-gradient(90deg, #131e1a 25%, #1a2820 50%, #131e1a 75%);
  background-size: 200% 100%;
  animation: skeleton-slide 1.5s ease-in-out infinite;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/assets/styles/main.css
git commit -m "refactor: 更新 main.css 为墨绿宝石风格 + 玻璃效果组件"
```

---

### Task 3: 更新 ParticleCanvas 粒子颜色

**Files:**
- Modify: `src/components/ParticleCanvas.vue`

- [ ] **Step 1: 将 ACCENT 颜色从旧翠绿改为墨绿宝石色**

在 `src/components/ParticleCanvas.vue` 第 16 行，将：

```js
const ACCENT = { r: 34, g: 197, b: 94 }
```

改为：

```js
const ACCENT = { r: 16, g: 185, b: 129 }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ParticleCanvas.vue
git commit -m "refactor: ParticleCanvas 粒子颜色同步为墨绿宝石色"
```

---

### Task 4: 更新 Navbar 为磨砂玻璃顶栏

**Files:**
- Modify: `src/components/Navbar.vue`

- [ ] **Step 1: 替换 Navbar.vue 的 template 和 style 部分**

将 `<template>` 内的 nav class 和 `<style scoped>` 部分替换。保留 `<script setup>` 不变。

将整个 `<template>` 替换为：

```html
<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-8 transition-all duration-300"
    :class="scrolled ? 'glass-nav-scrolled' : 'glass-nav-top'"
  >
    <router-link to="/" class="flex items-center gap-2.5 no-underline min-w-0">
      <img :src="logoUrl" alt="TRAE" class="w-7 h-7 shrink-0" />
      <span class="text-trae-text font-bold text-base tracking-wide whitespace-nowrap flex items-center" style="font-family: var(--font-display);">
        <span class="typewriter-base">TRAE</span>
        <span
          class="typewriter-insert"
          :class="{ 'typewriter-visible': showInsert }"
        >{{ insertText }}</span>
        <span class="typewriter-cursor" :class="{ 'typewriter-cursor-blink': cursorBlink }"></span>
        <span class="typewriter-base"> Demo Wall</span>
      </span>
    </router-link>
  </nav>
</template>
```

将整个 `<style scoped>` 替换为：

```css
<style scoped>
.glass-nav-top {
  background: rgba(10, 15, 13, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid transparent;
}

.glass-nav-scrolled {
  background: rgba(10, 15, 13, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid;
  border-image: linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.15), transparent) 1;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
}

.typewriter-insert {
  display: inline;
  color: #34d399;
  opacity: 1;
}

.typewriter-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: currentColor;
  margin-left: 1px;
  vertical-align: text-bottom;
}

.typewriter-cursor-blink {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Navbar.vue
git commit -m "feat: Navbar 升级为磨砂玻璃顶栏 + 衬线品牌字体"
```

---

### Task 5: 重写 HeroSection 为全屏沉浸式

**Files:**
- Modify: `src/components/HeroSection.vue`

- [ ] **Step 1: 替换 HeroSection.vue 全部内容**

```html
<template>
  <section class="hero-section relative min-h-[90vh] flex items-center justify-center overflow-hidden">
    <!-- 流动墨绿渐变背景 -->
    <div class="hero-bg absolute inset-0 pointer-events-none">
      <div class="hero-glow hero-glow-1"></div>
      <div class="hero-glow hero-glow-2"></div>
      <div class="hero-glow hero-glow-3"></div>
      <div class="hero-noise"></div>
      <div class="hero-fade-bottom"></div>
    </div>

    <!-- 内容区 -->
    <div class="relative z-[1] max-w-trae-container mx-auto px-8 text-center">
      <!-- 顶部标签 -->
      <div class="hero-reveal hero-reveal-0 inline-flex items-center gap-2 px-4 py-1.5 border border-trae-accent-glow/30 rounded-trae-pill text-trae-accent-glow text-[13px] bg-trae-accent/8 mb-8 font-mono">
        <span class="w-1.5 h-1.5 rounded-full bg-trae-accent-glow shadow-[0_0_8px_rgba(52,211,153,1)] animate-pulse"></span>
        TRAE 作品墙
      </div>

      <!-- 大标题 -->
      <h1 class="hero-reveal hero-reveal-1 text-[clamp(40px,7vw,80px)] font-bold leading-[1.15] tracking-tight mb-6 text-trae-text" style="font-family: var(--font-display);">
        探索 AI 编程的<br />
        <span class="bg-gradient-to-br from-trae-accent-glow via-trae-accent to-trae-accent-deep bg-clip-text text-transparent">无限可能</span>
      </h1>

      <!-- 副标题 -->
      <p class="hero-reveal hero-reveal-2 text-trae-text-secondary text-lg md:text-xl max-w-[600px] mx-auto mb-10">
        汇聚开发者智慧，发现 TRAE 创意作品
      </p>

      <!-- 按钮组 -->
      <div class="hero-reveal hero-reveal-3 flex flex-wrap items-center justify-center gap-4 mb-12">
        <a
          href="https://trae-idea-incubator.netlify.app/"
          target="_blank"
          rel="noopener"
          class="btn-primary"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          灵感孵化舱
        </a>
        <a
          href="https://luoqianshi.github.io/TRAE-AI-Creativity-Competition-Idea-Hall/"
          target="_blank"
          rel="noopener"
          class="btn-glass"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          TRAE Idea Hall
        </a>
        <a
          href="https://www.trae.cn/ai-creativity?utm_source=community"
          target="_blank"
          rel="noopener"
          class="btn-glass"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
          大赛官网
        </a>
      </div>

      <!-- 统计数据 -->
      <div class="hero-reveal hero-reveal-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-sm">
        <span class="text-trae-text-muted">
          <span class="text-trae-accent-glow font-semibold">{{ totalProjects }}</span> 作品
        </span>
        <span class="text-trae-text-muted/40">·</span>
        <span class="text-trae-text-muted">
          <span class="text-trae-accent-glow font-semibold">{{ formatStat(totalViews) }}</span> 浏览
        </span>
        <span class="text-trae-text-muted/40">·</span>
        <span class="text-trae-text-muted">
          <span class="text-trae-accent-glow font-semibold">{{ formatStat(totalLikes) }}</span> 赞
        </span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useProjectStore } from '@/stores/projectStore'

const store = useProjectStore()
const totalProjects = ref(0)
const totalViews = ref(0)
const totalLikes = ref(0)

onMounted(async () => {
  await store.loadIndex()
  if (store.indexData) {
    totalProjects.value = store.indexData.stats?.totalProjects || store.allProjects.length || 0
    totalViews.value = store.indexData.stats?.totalViews || 0
    totalLikes.value = store.indexData.stats?.totalLikes || 0
  }
})

function formatStat(n) {
  if (!n) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}
</script>

<style scoped>
.hero-section {
  background: var(--trae-bg);
}

/* 三层径向渐变光晕 */
.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.5;
}

.hero-glow-1 {
  width: 600px;
  height: 600px;
  top: -10%;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(16, 185, 129, 0.25), transparent 70%);
  animation: glow-drift-1 20s ease-in-out infinite;
}

.hero-glow-2 {
  width: 500px;
  height: 500px;
  bottom: 0%;
  left: 15%;
  background: radial-gradient(circle, rgba(4, 120, 87, 0.2), transparent 70%);
  animation: glow-drift-2 25s ease-in-out infinite;
}

.hero-glow-3 {
  width: 450px;
  height: 450px;
  bottom: 10%;
  right: 10%;
  background: radial-gradient(circle, rgba(52, 211, 153, 0.15), transparent 70%);
  animation: glow-drift-3 30s ease-in-out infinite;
}

@keyframes glow-drift-1 {
  0%, 100% { transform: translateX(-50%) translateY(0) scale(1); }
  50% { transform: translateX(-40%) translateY(30px) scale(1.1); }
}

@keyframes glow-drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -20px) scale(1.15); }
}

@keyframes glow-drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-30px, 20px) scale(0.9); }
}

/* noise 纹理 */
.hero-noise {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* 底部渐隐 */
.hero-fade-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(to bottom, transparent, var(--trae-bg));
}

/* 入场动画 */
.hero-reveal {
  opacity: 0;
  transform: translateY(20px);
  animation: hero-fade-in 0.8s ease-out forwards;
}

.hero-reveal-0 { animation-delay: 0.1s; }
.hero-reveal-1 { animation-delay: 0.2s; }
.hero-reveal-2 { animation-delay: 0.4s; }
.hero-reveal-3 { animation-delay: 0.6s; }
.hero-reveal-4 { animation-delay: 0.8s; }

@keyframes hero-fade-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HeroSection.vue
git commit -m "feat: 重写 HeroSection 为全屏沉浸式墨绿宝石风格"
```

---

### Task 6: 默认筛选改为「最新发布」

**Files:**
- Modify: `src/stores/projectStore.js`

- [ ] **Step 1: 将 store 的 sortBy 默认值从 'views' 改为 'newest'**

在 `src/stores/projectStore.js` 第 11 行，将：

```js
    sortBy: 'views',
```

改为：

```js
    sortBy: 'newest',
```

注意：store 中 `filter()` 方法的 `case 'newest':` 分支已正确实现按 `createdAt` 降序排列，无需修改。`SortSelect.vue` 中已有 `value="newest"` 对应「最新发布」选项，无需修改。

- [ ] **Step 2: Commit**

```bash
git add src/stores/projectStore.js
git commit -m "feat: 默认排序改为最新发布"
```

---

### Task 7: 创建类别映射工具函数

**Files:**
- Create: `src/utils/categoryMapper.js`

- [ ] **Step 1: 创建 categoryMapper.js**

```js
/**
 * 将作品 tag 映射到默认插画的类别 key。
 * 实际数据中只有 5 个 tag：学习工作、生活娱乐、社会服务、社会公益、硬件交互。
 * 加上 general 作为兜底类别，共 6 张插画。
 */
const TAG_TO_CATEGORY = {
  '学习工作': 'study',
  '生活娱乐': 'entertainment',
  '社会服务': 'service',
  '社会公益': 'charity',
  '硬件交互': 'hardware',
}

/**
 * 根据作品的 tags 数组返回对应的插画类别 key。
 * @param {string[]|undefined} tags
 * @returns {string} 类别 key，如 'study'、'general'
 */
export function categorizeTag(tags) {
  if (!tags || tags.length === 0) return 'general'
  const firstTag = tags[0]
  return TAG_TO_CATEGORY[firstTag] || 'general'
}

/**
 * 所有支持的类别列表。
 */
export const ALL_CATEGORIES = ['study', 'entertainment', 'service', 'charity', 'hardware', 'general']
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/categoryMapper.js
git commit -m "feat: 创建 tag 到插画类别的映射工具"
```

---

### Task 8: 生成 6 张默认 SVG 插画

**Files:**
- Create: `src/assets/default-illustrations/study.svg`
- Create: `src/assets/default-illustrations/entertainment.svg`
- Create: `src/assets/default-illustrations/service.svg`
- Create: `src/assets/default-illustrations/charity.svg`
- Create: `src/assets/default-illustrations/hardware.svg`
- Create: `src/assets/default-illustrations/general.svg`

- [ ] **Step 1: 使用 canvas-design skill 生成 6 张 SVG**

每张 SVG 为 600x338 (16:9)，统一视觉规范：
- 背景：墨绿渐变 `#0f1714` → `#1e2d27`
- 线条：`#10b981`（主色）和 `#34d399`（高光），1.5px 描边
- 几何抽象风格，不画具象物体
- 右下角小 TRAE 品牌标记（文字 "TRAE"，opacity 0.2）

**study.svg** — 意象：翻开的书页 + 光线。用两个平行四边形表示翻开的书，上方有放射状光线线条。

**entertainment.svg** — 意象：游戏手柄轮廓 + 像素方块。用圆角矩形和圆形组合成抽象手柄，周围散落小方块。

**service.svg** — 意象：服务窗口 + 连接节点。用圆角矩形框表示服务窗口，内部有节点连线。

**charity.svg** — 意象：心形轮廓 + 伸展的手。用贝塞尔曲线画抽象心形，周围有同心圆光环。

**hardware.svg** — 意象：芯片 + 电路连线。用方形表示芯片，引脚用短线条，周围有电路走线。

**general.svg** — 意象：抽象宝石切面 + TRAE 轮廓。用多边形组合表示宝石切面，有内部折射线。

每张 SVG 的基本结构模板（以 study.svg 为例）：

```svg
<svg width="600" height="338" viewBox="0 0 600 338" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f1714"/>
      <stop offset="100%" stop-color="#1e2d27"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="600" height="338" fill="url(#bg)"/>
  <rect width="600" height="338" fill="url(#glow)"/>
  <!-- 插画主体（各类别不同）-->
  <g stroke="#10b981" stroke-width="1.5" fill="none" opacity="0.6" stroke-linecap="round" stroke-linejoin="round">
    <!-- 翻开的书页 -->
    <path d="M200 130 L300 110 L300 220 L200 240 Z"/>
    <path d="M400 130 L300 110 L300 220 L400 240 Z"/>
    <!-- 光线 -->
    <line x1="300" y1="80" x2="270" y2="50" stroke="#34d399"/>
    <line x1="300" y1="80" x2="300" y2="40" stroke="#34d399"/>
    <line x1="300" y1="80" x2="330" y2="50" stroke="#34d399"/>
  </g>
  <!-- TRAE 品牌标记 -->
  <text x="560" y="320" font-family="JetBrains Mono, monospace" font-size="11" fill="#34d399" opacity="0.2" text-anchor="end">TRAE</text>
</svg>
```

按上述模板和意象描述，为 6 个类别分别创建完整的 SVG 文件。

- [ ] **Step 2: Commit**

```bash
git add src/assets/default-illustrations/
git commit -m "feat: 生成 6 张墨绿宝石风格分类默认插画"
```

---

### Task 9: 更新 ProjectCard 样式与默认插画

**Files:**
- Modify: `src/components/ProjectCard.vue`

- [ ] **Step 1: 替换 ProjectCard.vue 全部内容**

```html
<template>
  <router-link
    :to="`/project/${project.id}`"
    class="trae-card block no-underline group"
  >
    <div class="aspect-video relative overflow-hidden bg-gradient-to-br from-trae-bg-elevated to-trae-bg">
      <img
        v-if="project.thumbnail"
        :src="project.thumbnail"
        :alt="project.title"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <img
        v-else
        :src="getDefaultIllustration(project.tags)"
        :alt="project.title"
        loading="lazy"
        class="w-full h-full object-cover"
      />
      <div v-if="project.type" class="absolute top-3 right-3 px-2.5 py-1 rounded-trae-pill text-[11px] font-medium glass-panel"
        :class="project.type === 'external' ? 'text-trae-accent-glow' : 'text-blue-400'"
      >
        {{ project.type === 'external' ? '在线体验' : '本地预览' }}
      </div>
    </div>

    <div class="p-4">
      <h3 class="text-base font-semibold text-trae-text mb-3 line-clamp-1 group-hover:text-trae-accent-glow transition-colors">
        {{ project.title }}
      </h3>
      <div class="flex items-center justify-between">
        <span class="tag-pill !py-1 !px-2.5 !text-[11px] cursor-default">
          {{ project.tags?.[0] || '未分类' }}
        </span>
        <div class="flex items-center gap-3 text-trae-text-muted text-xs font-mono">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            <span class="text-trae-accent-glow/80">{{ formatNumber(project.views) }}</span>
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            <span class="text-trae-accent-glow/80">{{ project.likes }}</span>
          </span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import studyImg from '@/assets/default-illustrations/study.svg'
import entertainmentImg from '@/assets/default-illustrations/entertainment.svg'
import serviceImg from '@/assets/default-illustrations/service.svg'
import charityImg from '@/assets/default-illustrations/charity.svg'
import hardwareImg from '@/assets/default-illustrations/hardware.svg'
import generalImg from '@/assets/default-illustrations/general.svg'
import { categorizeTag } from '@/utils/categoryMapper'

defineProps({
  project: {
    type: Object,
    required: true,
  },
})

const illustrationMap = {
  study: studyImg,
  entertainment: entertainmentImg,
  service: serviceImg,
  charity: charityImg,
  hardware: hardwareImg,
  general: generalImg,
}

function getDefaultIllustration(tags) {
  const category = categorizeTag(tags)
  return illustrationMap[category] || illustrationMap.general
}

function formatNumber(n) {
  if (!n) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProjectCard.vue
git commit -m "feat: ProjectCard 升级为墨绿宝石风格 + 分类默认插画"
```

---

### Task 10: 更新 ProjectGrid 章节标题样式

**Files:**
- Modify: `src/components/ProjectGrid.vue`

- [ ] **Step 1: 替换 ProjectGrid.vue 的标题部分**

将 `<template>` 中的标题区域（第 4-11 行）替换为：

```html
      <div class="flex items-baseline gap-4 mb-12">
        <div class="w-1 h-10 rounded-full bg-gradient-to-b from-trae-accent-glow to-trae-accent-deep"></div>
        <h2 class="text-4xl font-bold text-trae-text" style="font-family: var(--font-display);">
          作品<span class="bg-gradient-to-br from-trae-accent-glow to-trae-accent-deep bg-clip-text text-transparent">展示</span>
        </h2>
        <span class="ml-auto font-mono text-sm text-trae-text-muted">
          {{ store.projectCount }} 个作品
        </span>
      </div>
```

其余部分不变。

- [ ] **Step 2: Commit**

```bash
git add src/components/ProjectGrid.vue
git commit -m "feat: 章节标题升级为衬线体 + 宝石绿装饰竖线"
```

---

### Task 11: 更新 HomeView 免责声明样式

**Files:**
- Modify: `src/views/HomeView.vue`

- [ ] **Step 1: 更新免责声明条样式**

将 HomeView.vue 第 7-16 行的 disclaimer banner 替换为：

```html
      <div class="pt-16 bg-trae-bg">
        <div class="border-b border-trae-accent-glow/8 bg-trae-bg-elevated/30">
          <p class="text-center text-xs text-trae-text-muted py-2 tracking-wide">
            本站为社区爱好者自发搭建的作品展示页，非 TRAE 官方网站。
          </p>
        </div>
        <div class="w-full">
          <img :src="bannerUrl" alt="Banner" class="w-full" />
        </div>
      </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/HomeView.vue
git commit -m "refactor: HomeView 免责声明样式适配新主题"
```

---

### Task 12: 构建验证

- [ ] **Step 1: 运行本地构建**

```bash
cd /workspace/trae-demo-wall && node_modules/.bin/vite build 2>&1 | tail -20
```

Expected: 构建成功，无报错。如果遇到模块导入错误，检查 SVG 文件路径和 import 语句是否匹配。

- [ ] **Step 2: 检查构建产物中是否包含新字体和插画**

```bash
ls dist/assets/default-illustrations/ 2>/dev/null || echo "SVGs bundled in JS"
grep -r "Noto Serif" dist/assets/*.css | head -3
```

- [ ] **Step 3: Commit（如有修复）**

如果构建发现问题，修复后提交：

```bash
git add -A
git commit -m "fix: 修复构建问题"
```
