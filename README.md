# TRAE Demo Wall

> Ship Faster with **TRAE**. Built with TRAE. Built by Friends.

一站式体验 [TRAE AI 创造力大赛](https://forum.trae.cn/c/38-category/40-category/40) 初赛区网页/前端作品。

Python 爬虫自动采集论坛数据，Vue 3 + Vite 构建，GitHub Actions 自动部署到 GitHub Pages。

**视觉风格：墨绿宝石** — 沉稳、精致、有生命力，像一块被打磨过的翡翠。

[在线访问](https://luoqianshi.github.io/trae-demo-wall/) · [效果演示](#demo-gallery)

---

## What it does

| Capability | Detail | Tech |
|---|---|---|
| **Data Pipeline** | 从 Discourse 论坛自动爬取作品，过滤 web/前端项目，生成索引 + 分页 JSON | Python + requests + BeautifulSoup |
| **Lazy Loading** | 首屏仅加载轻量索引，滚动时按需加载分页，每次增量 12 条 | Pinia + IntersectionObserver |
| **Live Preview** | 详情页以 16:9 iframe 沙盒预览 Demo，支持外部链接和本地部署 | iframe sandbox |
| **Particle BG** | Canvas 2D 粒子背景，80 粒子 + 鼠标吸引 + 距离连线，墨绿宝石色调 | `requestAnimationFrame` |
| **Typewriter** | 品牌标题循环打字机效果，纯 JS `setTimeout` 实现 | — |
| **Glass Nav** | 液态玻璃质感导航栏，滚动感知 blur 强度变化 + 渐变边框 | `backdrop-filter` |
| **Immersive Hero** | 全屏沉浸式 Hero，三层流动光晕 + noise 纹理 + staggered 入场动画 | CSS `@keyframes` |
| **Card Hover** | 项目卡片悬停时边框发光、阴影扩散、图片微缩放、标题变色 | CSS transition |
| **Default Illustrations** | 6 张墨绿宝石风格 SVG 插画，按作品类别自动匹配无缩略图的作品 | SVG + tag 映射 |

---

## Demo Gallery

以下均为独立 HTML 文件，**无需构建**即可在浏览器中直接运行，完整复现项目核心动效：

| Demo | 本地打开 | 在线预览 | 关键技术 |
|---|---|---|---|
| 🟢 Particle System | [`demos/particle-effect.html`](./demos/particle-effect.html) | [在线体验](https://luoqianshi.github.io/trae-demo-wall/demos-showcase/particle-effect.html) | 80 粒子 · 距离连线 · 鼠标交互 · 实时 FPS |
| ⌨️ Typewriter Nav | [`demos/typewriter-effect.html`](./demos/typewriter-effect.html) | [在线体验](https://luoqianshi.github.io/trae-demo-wall/demos-showcase/typewriter-effect.html) | 80ms 打字 / 40ms 删除 / 5s 停顿循环 |
| 🧊 Glass Navbar | [`demos/glass-navbar.html`](./demos/glass-navbar.html) | [在线体验](https://luoqianshi.github.io/trae-demo-wall/demos-showcase/glass-navbar.html) | `backdrop-filter: blur()` · 滚动感知过渡 |
| 🃏 Card Hover | [`demos/card-hover.html`](./demos/card-hover.html) | [在线体验](https://luoqianshi.github.io/trae-demo-wall/demos-showcase/card-hover.html) | 边框发光 · 阴影扩散 · 图片缩放 · 标题变色 |
| ♾️ Lazy Loading | [`demos/lazy-loading.html`](./demos/lazy-loading.html) | [在线体验](https://luoqianshi.github.io/trae-demo-wall/demos-showcase/lazy-loading.html) | 骨架屏 shimmer · IntersectionObserver · 无限滚动 |

> 提示：在线预览链接需要项目部署到 GitHub Pages 后生效。本地开发时直接在浏览器中打开 `demos/*.html` 即可。

---

## Tech Stack

| Layer | Choice | Note |
|---|---|---|
| Framework | Vue 3.5 | Composition API + `<script setup>` |
| Router | Vue Router 4 | `createWebHashHistory()` — GitHub Pages 兼容 |
| State | Pinia 3 | 分页缓存 + 过滤排序 + 懒加载状态 |
| Styling | TailwindCSS 3 | Custom Design Tokens |
| Build | Vite 8 | `base: './'` 相对路径部署 |
| Crawler | Python 3.11 | requests + BeautifulSoup4 + lxml |
| Deploy | GitHub Pages | GitHub Actions CI/CD |

---

## Core Architecture

### Static JSON Pipeline

```
forum.trae.cn
     │
     ▼
┌─────────────┐    ┌─────────────────────┐
│  scraper.py │───▶│  src/data/index.json │  (lightweight index)
│  filter.py  │    │  (title/thumb/tags)  │
│  downloader │    └─────────────────────┘
│  extractor  │              │
└─────────────┘              ▼
                    ┌─────────────────────┐
                    │ pages/page-{N}.json │  (20 per page)
                    │ (full detail)       │
                    └─────────────────────┘
```

- `index.json` — 轻量摘要，用于首屏渲染 + 过滤/排序
- `pages/page-{N}.json` — 每页 20 条完整数据，按需懒加载

### Crawler Flow

1. **List** — 遍历论坛 JSON API 所有页面，初筛标题/摘要关键词
2. **Detail** — 对候选帖调用详情 API，解析 `cooked` HTML
3. **Resolve** — 优先提取外部在线链接 → 其次下载 ZIP/HTML 附件 → 解压查找入口文件
4. **Output** — 生成索引 + 分页 JSON，本地作品存入 `public/demos/`

### Frontend State

```js
// Pinia Store
indexData        // 索引（首屏加载）
pageCache        // { pageNum: projects[] }
loadedPages      // Set，避免重复请求
visibleCount     // 当前可见数量，每次 +12
filteredProjects // 过滤排序后的完整列表
```

滚动至 `sentinel` 元素进入视口时触发 `loadMore()`：
- 计算目标页码 → 加载对应分页 JSON → 合并到可见列表 → 更新 `visibleCount`

---

## Key Decisions

| Problem | Decision | Why |
|---|---|---|
| GitHub Pages 路由 404 | `createWebHashHistory()` | Subpath 部署下 history 模式会导致刷新 404 |
| 数据文件 404 | Build 时 `cp -r src/data public/data` | Vite 不会自动复制 `src/` 下非源码文件到 `dist/` |
| 首屏加载过慢 | 索引 + 分页双层 JSON | `index.json` 仅含摘要，首屏 < 50KB |
| 浏览器缓存旧 JS | Cache-busting URL params | 强制刷新获取最新构建 |
| 爬虫 ZIP 路径 | `urljoin()` 处理相对路径 | Discourse 附件 URL 可能为相对路径 `/uploads/...` |
| 无效标签 | Store getter 过滤 `['65-tag', '68-tag']` | 论坛内部标签对用户无意义 |
| 默认排序 | 按 `createdAt` 降序 | 用户优先看到最新发布的作品 |
| 无缩略图占位 | 按 tag 分类匹配 SVG 插画 | 避免单调的首字母方块，提升视觉一致性 |

---

## Design System

### Colors（墨绿宝石色谱）

| Token | Hex | Usage |
|---|---|---|
| `trae-bg` | `#0a0f0d` | 主背景，近黑墨绿 |
| `trae-bg-elevated` | `#0f1714` | 卡片/面板背景 |
| `trae-card` | `#131e1a` | 悬浮卡片 |
| `trae-border` | `#1e2d27` | 边框/分割线 |
| `trae-accent` | `#10b981` | 主强调色（emerald-500） |
| `trae-accent-deep` | `#047857` | hover/active 深翡翠 |
| `trae-accent-glow` | `#34d399` | 高光发光色（emerald-400） |
| `trae-text` | `#e8f5ee` | 主文字，带绿调的白 |
| `trae-text-secondary` | `#8fa89e` | 次要文字 |
| `trae-text-muted` | `#6b8278` | 辅助/禁用文字 |

### Typography

| Purpose | Font | Note |
|---|---|---|
| Display（大标题） | **Noto Serif SC**（思源宋体） | 衬线体，用于 Hero/章节标题，典雅气质 |
| Body（正文/卡片） | **Noto Sans SC**（思源黑体） | 比 Inter 更有中文阅读质感 |
| Mono（数据/标签） | **JetBrains Mono** | 开发者气质，等宽数字 |

### Components

| Class | Style |
|---|---|
| `.btn-primary` | 实心宝石绿 pill，`hover:-translate-y-0.5 hover:shadow-trae-glow-strong` |
| `.btn-secondary` | 透明 + 深绿边框，`hover:border-trae-accent hover:text-trae-accent-glow` |
| `.btn-glass` | 磨砂玻璃质感，`backdrop-filter: blur(20px)` + 宝石绿边框 |
| `.tag-pill` | 深绿灰 pill，`.active` → 宝石绿 bg + 深绿 text |
| `.trae-card` | `#131e1a` bg，`hover:border-trae-accent-glow/30 hover:shadow-trae-card-hover` |
| `.glass-panel` | `backdrop-filter: blur(20px)` + 半透明背景 + 宝石绿边框 |

---

## CI/CD

`.github/workflows/crawl-and-deploy.yml`

| Trigger | Behavior |
|---|---|
| `push` to `main` | Skip crawler, build & deploy only |
| `schedule` (weekly Sun 18:00) | Run crawler → build → deploy |
| `workflow_dispatch` | Optional `skip_crawl` input |

```yaml
# Simplified flow
1. Checkout
2. Setup Python 3.11 (conditional)
3. Install & Run crawler (conditional)
4. Setup Node.js 20
5. npm ci + npm run build
6. Deploy to GitHub Pages
```

---

## Dev

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build

# Run crawler (requires Python 3.11+)
cd crawler && pip install -r requirements.txt && python scraper.py
```

---

## License

MIT

---

*本站为社区爱好者自发搭建的作品展示页，非 TRAE 官方网站。*
*数据来自 [TRAE 社区论坛](https://forum.trae.cn)。*
*作者 [@骆谦实](https://forum.trae.cn/u/%E9%AA%86%E8%B0%A2%E5%AE%9E/summary)*
