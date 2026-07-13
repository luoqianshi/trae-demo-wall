# TRAE Demo Wall 项目系统讲解

> 本文档面向 AI 产品经理、TRAE 开发者运营等岗位的求职场景，对 TRAE Demo Wall 项目进行系统性拆解，覆盖产品定位、技术架构、数据管道、运营机制与项目亮点五个维度。

---

## 一、项目概述

### 1.1 一句话定位

TRAE Demo Wall 是一个面向 TRAE AI 创造力大赛社区的作品聚合展示平台，通过 Python 爬虫自动采集论坛帖子，经分类过滤与本地化处理后，以 Vue 3 构建的沉浸式画廊呈现，最终通过 GitHub Actions 实现全自动部署。

### 1.2 解决的问题

TRAE AI 创造力大赛的初赛区在社区论坛（forum.trae.cn）以帖子形式提交作品，参赛者和访客面临三个痛点：

- **发现难** — 论坛帖子按时间排列，缺乏按赛道、浏览量、热度等多维度浏览的入口
- **预览难** — 作品以外链、ZIP 附件、小程序码等多种形式提交，用户需要逐一点开帖子、下载文件才能体验
- **跟踪难** — 没有统一的数据面板来展示作品的全局分布、热度趋势

TRAE Demo Wall 将论坛数据爬取后结构化为可搜索、可筛选、可在线预览的画廊，并自动同步浏览量和点赞数，使参赛作品以最佳形态呈现给社区。

### 1.3 核心数据（截至 2026-07-12）

| 指标 | 数值 |
|------|------|
| 收录作品总数 | 5,932 |
| 累计浏览量 | 159,974 |
| 累计点赞数 | 6,364 |
| 本地化 demo 目录 | 3,347 |
| 分页数据文件 | 297 个（每页 20 条） |
| Git 提交总数 | 123 |
| 部署地址 | https://luoqianshi.github.io/trae-demo-wall/ |

### 1.4 赛道分布

| 赛道 | 作品数 | 占比 |
|------|--------|------|
| 学习工作 | 2,203 | 37.1% |
| 生活娱乐 | 2,023 | 34.1% |
| 社会服务 | 1,196 | 20.2% |
| 社会公益 | 1,055 | 17.8% |
| 硬件交互 | 218 | 3.7% |

> 注：部分作品跨多个赛道，故占比之和大于 100%。

---

## 二、产品架构

### 2.1 系统全景

整个系统由四个独立但衔接的环节组成，形成一条从社区论坛到终端用户的自动化流水线：

```
forum.trae.cn (Discourse 论坛)
        │
        ▼
┌──────────────────┐
│   爬虫层 (Python)  │  ← 增量采集、两阶段过滤、ZIP 下载解压
│  crawler/         │
└────────┬─────────┘
         │ JSON 数据文件
         ▼
┌──────────────────┐
│  前端层 (Vue 3)    │  ← 索引 + 分页懒加载、粒子背景、玻璃导航
│  src/             │
└────────┬─────────┘
         │ npm run build
         ▼
┌──────────────────┐
│  CI/CD (Actions)  │  ← 构建产物瘦身、去重、自动部署
│  .github/         │
└────────┬─────────┘
         │
         ▼
   GitHub Pages (静态托管)
```

### 2.2 数据流设计

项目采用"索引 + 分页"双层 JSON 架构，核心思路是将首屏所需数据压到最小，详情按需加载：

- **index.json**（约 50KB）— 包含所有作品的摘要信息（标题、作者、标签、缩略图、浏览量、点赞数、创建时间），用于首屏渲染、标签筛选、搜索过滤和排序。用户打开页面时只需下载这一个文件。
- **page-{N}.json**（每页 20 条）— 包含完整详情（描述、demoUrl、localPath、截图、二维码等）。当用户滚动到列表底部或点开详情页时，前端按需加载对应分页。

这个设计使得首屏加载始终保持在 50KB 以内，即使作品总数增长到上万条也不会退化。

### 2.3 技术栈选型

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| 前端框架 | Vue 3.5 (Composition API) | 轻量、响应式天然适配数据驱动的画廊场景 |
| 状态管理 | Pinia 3 | 官方推荐，API 简洁，适合中等复杂度的分页缓存与过滤逻辑 |
| 路由 | Vue Router 4 (Hash 模式) | GitHub Pages 子路径部署下避免刷新 404 |
| 样式 | TailwindCSS 3 | Design Token 驱动，保证视觉一致性，自定义墨绿宝石色板 |
| 构建工具 | Vite 8 | 快速 HMR，`base: './'` 相对路径部署兼容静态托管 |
| 爬虫 | Python 3 + requests + BeautifulSoup4 + lxml | 同步阻塞模型，依赖少，部署简单，适合低频定时任务 |
| 部署 | GitHub Pages + GitHub Actions | 零成本托管，自动 CI/CD，无需服务器 |

---

## 三、爬虫系统

### 3.1 模块架构

爬虫代码位于 `crawler/` 目录，采用三层职责划分：

| 层级 | 文件 | 职责 |
|------|------|------|
| 采集层 | `incremental_scraper.py` / `scraper.py` | 调用 Discourse 论坛 API，管理全量/增量策略 |
| 过滤处理层 | `filter.py` + `processor.py` | 判断作品类型、提取链接、下载附件、查找入口 HTML |
| 基础设施层 | `downloader.py` + `extractor.py` | 文件下载（带双重超时保护）、ZIP 解压 |

### 3.2 增量爬虫的四阶段流程

增量爬虫 `incremental_scraper.py` 是日常运行的核心，通过四阶段处理实现高效增量更新：

**阶段一：遍历帖子列表 + 同步浏览量/点赞数**

向 Discourse 论坛 API 分页请求帖子列表（`/c/38-category/40-category/40.json?page={n}`），遍历每一页的 topics。对于已收录的作品，直接从列表 API 返回的字段中读取最新的 `views` 和 `like_count`，与本地缓存对比，变化则更新内存中的项目数据。这一设计避免了为每个已有作品单独请求详情 API，仅一次列表遍历即可完成全局同步。

**阶段二：两阶段筛选新作品**

为减少详情 API 调用次数，采用轻量 + 重量两阶段过滤：

- 一阶段（轻量）：仅用帖子的标题和摘要文本进行关键词匹配，命中即归入候选
- 二阶段（重量）：一阶段未命中的候选项，请求详情 API 获取 `cooked` HTML 正文，结合正文内容做二次判断，同时检测微信小程序类型

二阶段获取的详情数据会缓存到内存中，供后续阶段直接复用，避免重复请求。

**阶段三：处理新作品**

对每个新候选帖子，解析详情数据并调用 `process_project()` 生成结构化项目字典。该函数按优先级依次尝试四种收录方式：

1. 可嵌入外链（github.io / vercel.app / netlify.app 等域名）→ `type=external`
2. 其他有效外链（自定义域名、裸 IP）→ `type=external`，仅可跳转
3. 论坛附件 ZIP/HTML → 下载、解压、查找入口 HTML → `type=local`
4. 微信小程序码 → `type=miniprogram`

均不匹配则不收录。

**阶段四：合并数据 + 仅写变更页**

将已有项目与新项目合并，按 `createdAt` 倒序排序，重新计算统计信息。写入时分两种情况：

- `index.json` 始终重写（包含全局统计和摘要，体积小）
- 分页文件采用"仅写变更页"策略：只重写内容实际发生变化的页（包含浏览量/点赞数变化的作品或新作品的页），其余页保持不变

如果没有任何数据变化（无新作品且浏览量/点赞数未变），直接退出不写任何文件。

### 3.3 HTML 入口查找算法

用户提交的 ZIP 附件结构千差万别，`processor.py` 的 `_find_entry_html()` 需要在解压后的目录中找到正确的入口 HTML：

**快速路径**：优先检查根目录是否直接存在 `index.html` 或 `main.html`，命中则立即返回。

**通用搜索**：若快速路径未命中，递归遍历整个目录树，跳过 `__MACOSX`、`node_modules`、`.git`、`dist` 等无效目录和 `._` 前缀的 macOS 元数据文件。对所有候选 HTML 按以下规则打分：

- `index.html` → 100 分
- `demo.html` → 90 分
- 文件名含 `index` → 80 分
- 文件名含 `demo` → 70 分
- 其他 HTML → 50 分
- 每多一层目录深度减 5 分

取最高分作为入口。这个算法解决了社区作品中常见的入口文件不规范问题。

### 3.4 下载器与解压器

`downloader.py` 实现了双重超时保护机制：

- **连接/读取超时**：`timeout=60s`，防止单次网络操作卡死
- **总时长上限**：`max_total_time=120s`，用 `time.monotonic()` 计算截止时间，防止服务器极慢速持续发送数据导致无限挂起

`extractor.py` 使用 Python 标准库 `zipfile.ZipFile.extractall()` 解压，简单可靠。

### 3.5 数据输出格式

每个作品最终结构化为以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 帖子 ID，格式 `topic_{数字}` |
| `forumUrl` | string | 论坛原帖链接 |
| `title` | string | 作品标题 |
| `author` | string | 作者用户名 |
| `description` | string | 纯文本描述（截取前 500 字符） |
| `tags` | string[] | 赛道标签 |
| `views` | int | 浏览量 |
| `likes` | int | 点赞数 |
| `createdAt` | string | ISO 8601 创建时间 |
| `type` | string | `external` / `local` / `miniprogram` |
| `demoUrl` | string\|null | 外部在线预览链接 |
| `localPath` | string\|null | 本地 demo 相对路径（`./demos/topic_{id}/index.html`） |
| `thumbnail` | string | 缩略图 URL |
| `screenshots` | string[] | 截图 URL（最多 5 张） |
| `qrCode` | string\|null | 小程序二维码（仅 miniprogram 类型） |

---

## 四、前端架构

### 4.1 目录结构

```
src/
├── App.vue                          # 根组件
├── main.js                          # 入口：挂载 Pinia + Router
├── assets/
│   ├── default-illustrations/       # 6 个分类默认插画 SVG
│   ├── styles/main.css              # 全局样式
│   └── trae-black.png               # Logo
├── components/                      # 11 个组件
│   ├── ParticleCanvas.vue           # 粒子背景画布
│   ├── Navbar.vue                   # 顶部导航栏（打字机动画）
│   ├── HeroSection.vue              # 首屏 Hero 区
│   ├── FilterBar.vue                # 标签筛选栏
│   ├── SearchBar.vue                # 搜索框
│   ├── SortSelect.vue               # 排序下拉
│   ├── ProjectGrid.vue              # 作品网格 + 无限滚动
│   ├── ProjectCard.vue              # 单个作品卡片
│   ├── SkeletonCard.vue             # 加载骨架屏
│   ├── ProjectDetail.vue            # 作品详情（iframe 预览）
│   └── Footer.vue                   # 页脚
├── composables/
│   └── useLazyLoad.js               # IntersectionObserver 无限加载
├── utils/
│   └── categoryMapper.js            # tag → 插画类别映射
├── stores/
│   └── projectStore.js              # Pinia 状态管理
├── router/
│   └── index.js                     # Vue Router 配置
├── views/
│   ├── HomeView.vue                 # 首页视图
│   └── DetailView.vue               # 详情页视图
└── data/
    ├── index.json                   # 汇总索引（5932 条摘要）
    └── pages/                       # 297 个分页文件
```

### 4.2 状态管理

`projectStore.js` 使用 Pinia 的 Options API 风格，管理以下核心状态：

| 状态 | 类型 | 用途 |
|------|------|------|
| `indexData` | object | 索引数据对象（含统计信息） |
| `allProjects` | array | 全部作品摘要（来自 index.json） |
| `loadedPages` | Set | 已加载的分页号集合 |
| `pageCache` | object | 分页数据缓存 `{ pageNum: projects[] }` |
| `currentTag` | string | 当前筛选标签（默认"全部"） |
| `searchQuery` | string | 搜索关键词 |
| `sortBy` | string | 排序方式（newest/views/likes） |
| `filteredProjects` | array | 过滤排序后的完整列表 |
| `visibleCount` | int | 当前可见数量（每次 +12） |
| `isLoading` | boolean | 加载状态标志 |
| `isAllLoaded` | boolean | 是否全部加载完毕 |

关键 actions 包括：

- `loadIndex()` — 加载 index.json（带 `?v=时间戳` 防缓存），填充 `allProjects` 并触发过滤
- `loadPage(pageNum)` — 按需加载分页 JSON，存入缓存
- `loadMore()` — 无限滚动核心：按 `Math.ceil((visibleCount+12)/20)` 计算所需页数，补齐未加载页，更新 `visibleCount`
- `getProjectDetail(id)` — 先在已加载分页缓存中查找，未命中则按 `id 在全局列表中的位置 / 20 + 1` 定位页号加载后返回
- `filter()` — 依次按标签、搜索词（匹配标题/作者）过滤，再按创建时间/浏览量/点赞数排序

### 4.3 无限滚动加载

`useLazyLoad.js` 基于 IntersectionObserver 实现无限滚动：

- 观察 DOM 中的 sentinel 元素（列表底部的占位符）
- `rootMargin: '200px'` 提前 200px 触发预加载，用户滚动到底部前数据已就绪
- sentinel 进入视口且未全部加载完时，调用 `store.loadMore()`
- `filteredProjects.length` 变化时（用户切换筛选条件）重建 observer

每次 `loadMore()` 增量显示 12 条作品，同时按需加载对应的分页文件（每页 20 条）。这个设计在"视觉增量"和"网络请求"之间取了平衡：用户每次看到 12 张新卡片，但网络请求按 20 条一页发起，减少请求次数。

### 4.4 视觉系统

项目采用"墨绿宝石"视觉风格，整体色调沉稳、精致，以深绿背景搭配翡翠绿强调色。

**色彩系统**：

| Token | 色值 | 用途 |
|-------|------|------|
| `trae-bg` | `#0a0f0d` | 主背景，近黑墨绿 |
| `trae-bg-elevated` | `#0f1714` | 卡片/面板背景 |
| `trae-card` | `#131e1a` | 悬浮卡片 |
| `trae-border` | `#1e2d27` | 边框/分割线 |
| `trae-accent` | `#10b981` | 主强调色 |
| `trae-accent-deep` | `#047857` | hover/active 深翡翠 |
| `trae-accent-glow` | `#34d399` | 高光发光色 |
| `trae-text` | `#e8f5ee` | 主文字 |
| `trae-text-secondary` | `#8fa89e` | 次要文字 |

**字体系统**：

| 用途 | 字体 | 特点 |
|------|------|------|
| 大标题 | Noto Serif SC（思源宋体） | 衬线体，典雅气质 |
| 正文 | Noto Sans SC（思源黑体） | 中文阅读质感 |
| 数据/标签 | JetBrains Mono | 等宽，开发者气质 |

**动效组件**：

| 组件 | 效果 | 实现 |
|------|------|------|
| ParticleCanvas | 80 粒子随机运动 + 鼠标引力吸附 + 距离连线 | Canvas 2D + `requestAnimationFrame` |
| Navbar | 打字机循环动画（输入 80ms/字，删除 40ms/字，各停顿 5s） | `setTimeout` 递归 |
| HeroSection | 三层径向渐变光晕漂移 + SVG noise 纹理 + 阶梯入场动画 | CSS `@keyframes` |
| Glass Navbar | 滚动 >50px 切换毛玻璃强度 | `backdrop-filter: blur()` |
| ProjectCard | 悬停时边框发光、阴影扩散、图片微缩放 | CSS transition |

### 4.5 作品详情页

详情页 `ProjectDetail.vue` 提供三种预览方式：

- **external 类型**：以 16:9 iframe sandbox 预览外部链接，支持 github.io / vercel.app 等可嵌入域名
- **local 类型**：同样以 iframe 预览本地 `./demos/topic_{id}/index.html`，展示爬虫下载并解压的 demo 文件
- **miniprogram 类型**：显示小程序二维码图片，提示用户扫码体验

详情页还展示作品标题、作者、发布日期、赛道标签、浏览量/点赞数、文字描述、截图网格，以及原帖链接和在线体验链接。

### 4.6 默认插画系统

当作品没有缩略图时，`categoryMapper.js` 根据作品的赛道标签匹配对应的 SVG 插画：

| 赛道 | 插画类别 |
|------|----------|
| 学习工作 | study |
| 生活娱乐 | entertainment |
| 社会服务 | service |
| 社会公益 | charity |
| 硬件交互 | hardware |
| 其他 | general |

6 张插画均采用墨绿宝石风格绘制，保证视觉一致性。

---

## 五、CI/CD 与部署

### 5.1 GitHub Actions 工作流

部署流程定义在 `.github/workflows/crawl-and-deploy.yml` 中，触发条件为 push 到 main 分支或手动触发。

**执行步骤**：

1. **Checkout** — 拉取仓库代码
2. **Setup Node.js 22** — 安装 Node.js 运行时，启用 npm 缓存
3. **Install** — `npm ci` 安装前端依赖
4. **Build** — `npm run build` 构建，构建脚本会先将 `src/data` 复制到 `public/data`，再将 `demos` 目录复制为 `demos-showcase`，最后执行 Vite 构建
5. **Optimize artifact size** — 构建产物瘦身（详见下节）
6. **Setup Pages** — 配置 GitHub Pages 环境
7. **Upload artifact** — 上传 `dist` 目录为 Pages artifact
8. **Deploy** — 部署到 GitHub Pages

### 5.2 构建产物瘦身

由于本地化的 demo 文件包含大量源码、配置、缓存目录和媒体文件，直接部署会导致产物体积过大。CI 中的 "Optimize artifact size" 步骤执行以下清理：

**删除非必要文件**：
- 源码文件（.py / .ts / .vue / .svelte / .go / .rs 等）
- 配置文件（package.json / tsconfig.json / vite.config.* 等）
- 构建锁文件（package-lock.json / yarn.lock 等）
- 缓存目录（`__pycache__` / `node_modules` / `.git` / `__MACOSX` 等）
- OS 垃圾文件（.DS_Store / `._*`）

**删除大文件**：
- ML 模型文件（.pt / .safetensors / .onnx / .h5 / .ckpt 等）
- 超过 1MB 的 .bin / .wasm 文件
- 超过 500KB 的 JSON 文件
- 超过 2MB 的图片文件
- 超过 5MB 的视频文件
- 音频文件（.mp3 / .wav）

**MD5 去重**：
对 >100KB 的文件按内容 MD5 哈希去重，相同内容只保留第一份。这一步通常能节省数十 MB 空间。

### 5.3 零成本架构

整个项目的运行成本为零：

| 资源 | 提供方 | 费用 |
|------|--------|------|
| 代码托管 | GitHub | 免费 |
| CI/CD | GitHub Actions | 免费（公开仓库） |
| 静态托管 | GitHub Pages | 免费 |
| 域名 | github.io | 免费 |
| 数据采集 | 本地运行或 CI 触发 | 免费 |

爬虫在本地运行（通过 TRAE Work 自动化），数据写入 `src/data/` 后推送至 GitHub，CI 自动构建部署。无需任何服务器、数据库或 CDN。

---

## 六、运维机制

### 6.1 每日数据更新流程

项目通过 `prompts/update.md` 文件定义了标准化的每日更新流程，可由 TRAE Work AI 助手自动执行：

| 步骤 | 内容 | 耗时 |
|------|------|------|
| Step 1 | 确认项目环境，安装依赖 | < 1 分钟 |
| Step 2 | 运行增量爬虫 `incremental_scraper.py` | 5-15 分钟 |
| Step 3 | 构建前端 `npm run build` 并验证 | < 1 分钟 |
| Step 3.5 | 404 问题检查与修复 | 1-3 分钟 |
| Step 5.5 | 安全检查（密钥扫描与替换） | 1-2 分钟 |
| Step 6 | 提交并推送到 GitHub main 分支 | 1-2 分钟 |
| Step 7 | 验证 GitHub Actions 部署状态 | 2-5 分钟 |

### 6.2 404 问题防护

社区提交的 demo 附件存在三类常见的 404 问题，更新流程中包含自动化检查与修复脚本：

| 问题类型 | 根因 | 修复方式 |
|----------|------|----------|
| macOS 元数据文件被选为入口 | `__MACOSX/._*.html` 被 `find_first_html_file()` 误选 | 重新查找正确入口，跳过 `._` 前缀和 `__MACOSX` 目录 |
| Windows 反斜杠路径 | ZIP 中使用 `\` 分隔符，解压后文件名含 `\`，浏览器请求 `/` 版本时 404 | 递归重命名所有含 `\` 的文件和目录为 `/` 结构 |
| 无有效 HTML 文件 | 项目只包含 .bat / package.json 等非 HTML 文件 | 标记为 `type=none`，前端自动隐藏"在线体验"按钮 |

### 6.3 安全防护

社区 demo 文件中经常硬编码 API Key，GitHub Push Protection 会拦截包含密钥的推送。更新流程中包含：

- 扫描 DeepSeek（`sk-` 前缀）、OpenRouter（`sk-or-v1-` 前缀）、Google（`AIza` 前缀）等常见 API Key 模式
- 将匹配的密钥替换为占位符（如 `sk-YOUR_API_KEY_HERE`）
- 检查并清理 `.env` 文件和遗留的 `.zip` 文件

### 6.4 增量更新策略

增量爬虫相比全量爬虫有三项核心优化：

**浏览量/点赞数即时同步** — 遍历论坛列表时直接从列表 API 字段读取最新数据，无需对每个已有作品单独请求详情。一次列表遍历即可完成全局同步。

**两阶段过滤** — 一阶段用标题/摘要做轻量关键词匹配，二阶段对未命中的候选项才请求详情 API 做二次判断。大幅减少详情 API 调用次数。

**仅写变更页** — 排序后只重写内容实际发生变化的分页文件（浏览量/点赞数变化的作品所在页或新作品所在页），其余页保持不变。无任何数据变化时直接退出不写文件。

---

## 七、项目演进与关键决策

### 7.1 演进时间线

项目从 2026 年 6 月启动，经历了以下关键阶段：

| 阶段 | 时间 | 关键里程碑 |
|------|------|-----------|
| 初始化 | 2026-06 | Vue 3 + Vite + TailwindCSS 项目搭建，爬虫初版，路由/Pinia/粒子背景 |
| 功能完善 | 2026-06 ~ 07 | 前端支持小程序类型展示，爬虫三项修复（分页容错/两阶段过滤/小程序支持） |
| 规模爬取 | 2026-07 | 全量爬取 3,543 个作品，逐步增量至 5,932 |
| 工程化 | 2026-07 | 404 修复脚本、安全检查流程、CI 产物瘦身、增量爬虫优化 |

### 7.2 关键技术决策

| 问题 | 决策 | 理由 |
|------|------|------|
| GitHub Pages 路由 404 | `createWebHashHistory()` | 子路径部署下 history 模式刷新会 404 |
| 数据文件 404 | 构建时 `cp -r src/data public/data` | Vite 不会自动复制 `src/` 下的非源码文件到 `dist/` |
| 首屏加载过慢 | 索引 + 分页双层 JSON | `index.json` 仅含摘要，首屏 < 50KB |
| 浏览器缓存旧 JS | `?v=${Date.now()}` 缓存破坏参数 | 强制刷新获取最新构建 |
| 无效标签 | Store getter 过滤 `['65-tag', '68-tag']` | 论坛内部标签对用户无意义 |
| 无缩略图占位 | 按 tag 分类匹配 SVG 插画 | 避免单调的首字母方块，提升视觉一致性 |
| 爬虫 ZIP 路径 | `urljoin()` 处理相对路径 | Discourse 附件 URL 可能为相对路径 |
| 下载挂起 | 双重超时（60s 连接 + 120s 总时长） | 防止慢速服务器无限挂起导致爬虫停滞 |

---

## 八、项目亮点与求职价值

### 8.1 产品思维

- **从用户痛点出发**：不是先有技术方案再找场景，而是观察到社区论坛作品发现难、预览难、跟踪难的真实痛点，再设计数据管道 + 前端画廊的解决方案
- **数据驱动的用户体验**：通过浏览量/点赞数同步、多维度排序、标签筛选等功能，让用户按需发现优质作品，而非被动浏览时间线
- **零成本规模化**：利用 GitHub Pages + Actions 的免费额度，支撑近 6000 个作品的展示和 3347 个本地 demo 的托管，无任何服务器成本

### 8.2 技术能力

- **全栈独立交付**：从 Python 爬虫到 Vue 前端再到 CI/CD，一个人完成完整的数据管道和产品交付
- **工程化思维**：增量爬虫、仅写变更页、两阶段过滤、404 自动修复、密钥安全扫描等，体现了对生产环境健壮性的关注
- **性能优化意识**：索引 + 分页双层 JSON 架构、IntersectionObserver 无限滚动、构建产物瘦身与去重、缓存破坏策略
- **视觉设计能力**：自定义墨绿宝石 Design Token、Canvas 粒子背景、玻璃质感导航、打字机动画，产品完成度高

### 8.3 运营能力

- **社区数据运营**：自动同步浏览量/点赞数，提供赛道分布统计，为社区运营提供数据看板
- **自动化运维**：通过标准化的 update.md 流程文档，实现 AI 助手可执行的每日数据更新，降低运维成本
- **安全合规意识**：密钥扫描与替换流程防止社区作品中的 API Key 泄露，配合 GitHub Push Protection 形成双重防护

### 8.4 与目标岗位的关联

**AI 产品经理**：项目展示了从需求洞察到方案设计到工程落地的完整能力链。理解 Discourse API 的数据结构、设计两阶段过滤策略、制定 404 修复和密钥安全规范，都需要产品经理对技术边界有清晰认知。同时，赛道分布统计、浏览量趋势同步等功能本身就是社区数据分析的产品化呈现。

**TRAE 开发者运营**：项目直接服务于 TRAE 社区的创作者生态，通过聚合展示参赛作品提升社区活跃度和作品发现效率。熟悉 TRAE 论坛的数据结构、理解参赛者的提交流程、设计自动化数据管道，都是开发者运营岗位的核心能力。项目本身的 123 次提交和持续迭代也展示了对社区产品的长期投入。

---

## 九、附录

### 9.1 本地开发

```bash
# 安装依赖
npm install
pip install requests beautifulsoup4 lxml

# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行增量爬虫
cd crawler && python3 incremental_scraper.py
```

### 9.2 项目结构速览

```
trae-demo-wall/
├── .github/workflows/     # CI/CD 配置
├── crawler/               # Python 爬虫（7 个脚本）
├── demos/                 # 独立 HTML 视觉效果演示
├── knowledge/             # 项目文档
├── prompts/               # AI 助手操作流程文档
├── public/
│   └── demos/             # 本地化 demo 文件（3347 个 topic 目录）
├── src/
│   ├── assets/            # 静态资源 + 默认插画
│   ├── components/        # 11 个 Vue 组件
│   ├── composables/       # 无限加载 composable
│   ├── data/              # JSON 数据（index + 297 分页）
│   ├── router/            # 路由配置
│   ├── stores/            # Pinia 状态管理
│   ├── utils/             # 工具函数
│   └── views/             # 页面视图
├── tailwind.config.js     # TailwindCSS 配置
└── vite.config.js         # Vite 构建配置
```

### 9.3 在线访问

- **线上地址**：https://luoqianshi.github.io/trae-demo-wall/
- **GitHub 仓库**：https://github.com/luoqianshi/trae-demo-wall
- **数据来源**：https://forum.trae.cn/c/38-category/40-category/40
