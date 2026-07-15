# MiniFish WebManage

> 创作者的 AI 成长导航员 — 一站式多平台内容创作运营仪表盘

## 项目简介

MiniFish 是一款面向 **抖音、小红书、B 站** 内容创作者的 AI 驱动创作运营平台。它将热点情报、AI 辅助创作、多模型对比生成、音视频内容分析、成长路径规划、多平台账号管理等能力整合在一个统一的暗色玻璃态界面中，帮助创作者提升内容生产效率和数据驱动决策能力。

### 设计目的

1. **打破平台孤岛**：在一个界面管理抖音、小红书、B 站多平台账号 Cookie 和数据同步
2. **AI 能力平民化**：接入多家主流 AI 模型（DeepSeek、MiMo、OpenCode Go 等），支持多模型同时对比生成，降低 AI 使用门槛
3. **数据驱动创作**：实时热点榜单、素材库、选题推荐，让创作者快速抓住流量风口
4. **全链路创作辅助**：从选题发现 → AI 生成文案 → 音视频分析 → 成长教练评估，覆盖创作全流程
5. **安全优先**：平台 Cookie 通过浏览器扩展配对方式提交，API Key 加密存储，Token 仅存内存，不落本地存储

---

## 技术栈

| 层面 | 技术选择 | 说明 |
|---|---|---|
| 前端框架 | **Vue 3** (Options API) | 全局 `createApp`，无 SFC 单文件组件 |
| 图表库 | **ECharts 5** + **echarts-wordcloud** | 仪表盘/雷达图/趋势图/词云 |
| 构建方式 | **零构建** | 无 Webpack/Vite，普通 `<script>` 标签直接引入 |
| HTTP 通信 | **原生 Fetch API** | 自封装 REST Client，支持 SSE 流式、202 异步任务、401 自动刷新 |
| 样式方案 | **原生 CSS** (CSS 变量) | 暗色玻璃态主题，模块化 CSS 文件 |
| 外部依赖 | CDN 加载 | Vue 3、ECharts 通过 unpkg/jsdelivr 引入，无需 npm 安装 |
| 后端对接 | REST + SSE | 对接 NestJS API + Python Worker（独立项目） |

---

## 功能模块

### 已完成 ✅

| 模块 | 说明 |
|---|---|
| **用户认证** | 注册/登录/退出、JWT Access Token（内存存储）+ HttpOnly Refresh Cookie 自动续期 |
| **创作仪表盘** | 今日数据概览、AI 能力雷达、任务列表、实时数据卡片 |
| **数据情报** | 实时热点/上升榜/总榜、素材库（按平台筛选）、选题候选→一键创建任务 |
| **创作工作室** | SSE 流式 AI 对话、多轮上下文、反馈（👍👎）、重新生成、Artifact 文件下载 |
| **成长教练** | 创作者能力雷达图、案例库浏览、AI 评估与采用建议、成长路径阶段卡片 |
| **媒体分析** | 视频/音频文件上传、调用多模态模型进行内容分析（摘要/主题/情绪/结构/亮点）、语音转写 |
| **AI 模型管理** | 支持 13 个 AI Provider、增删改查连接、一键测试连通性、密钥加密存储不回显、用量统计、2–3 模型同时对比生成 |
| **平台账号管理** | 抖音/小红书/B 站账号管理、浏览器扩展安全配对、增删查改、凭据有效性检测、快速切换活跃账号、全局账号同步 |
| **通知系统** | 通知列表、未读红点、单条/全部标记已读 |
| **个人设置** | 昵称修改、同步策略配置 |
| **暗色玻璃态 UI** | 全站统一暗色主题、毛玻璃卡片、渐变强调色、响应式布局 |

### 即将开放 🚧

以下功能在 UI 中已标记"即将开放"并禁用，后端契约尚未提供：
- 全局搜索
- 邀请好友
- 日报/画像导出
- 支付与 Credits 计费
- 意见反馈
- 头像更换
- AI 调用日志页面

---

## 依赖要求

### 浏览器
- Chrome / Edge / Firefox 等现代浏览器（需支持 ES2020+、Fetch API、AbortController、SSE）
- 推荐分辨率：1280×800 及以上

### 后端服务（必需）
前端本身是纯静态文件，但完整功能需要搭配后端服务。后端独立项目（非本仓库）需包含：

| 服务 | 技术 | 默认端口 | 说明 |
|---|---|---|---|
| NestJS API | Node.js + NestJS + PostgreSQL | 3100 | 核心 REST API、认证、任务调度 |
| Worker API | Python FastAPI | 8100 | 媒体处理、AI 调用代理 |
| Worker | Python asyncio | — | 队列消费者，处理异步任务（Cookie检测、媒体分析等） |
| PostgreSQL | PostgreSQL 15+ | 54329 | 用户、账号、任务、连接等持久化存储 |
| MinIO | MinIO 对象存储 | 9000/9001 | 媒体文件、Artifact 存储 |

后端项目默认 Base URL：`http://127.0.0.1:3100/api/v1`

### 浏览器扩展（平台账号必需）
安全提交抖音/小红书/B 站 Cookie 需要配套的 **Chrome/Edge 扩展程序**：
1. 用户在 Web 页面点击"添加账号"→ 选择平台 → 获取一次性配对码（10 分钟有效）
2. 在已登录目标平台的浏览器中，扩展读取该域名下的 Cookie
3. 扩展将 Cookie 通过 `x-minifish-pairing` 请求头提交到配对会话端点
4. 后端加密存储 Cookie，前端永远不接触明文 Cookie

**安全设计要点**：
- Cookie 不出现在页面 DOM / localStorage / sessionStorage 中
- API Key 加密存储，列表接口仅返回掩码（如 `sk-****abcd`）
- Access Token 仅存 JavaScript 内存变量，页面关闭即丢失
- Refresh Token 使用 HttpOnly + Secure Cookie，JS 无法读取
- 所有服务端文本输出均按纯文本转义展示，不注入 HTML

### CDN 依赖（可选本地化）
页面通过 CDN 加载以下库，离线部署时需下载到本地并修改 `index.html` 中的引用路径：
- Vue 3（`https://unpkg.com/vue@3/dist/vue.global.prod.js`）
- ECharts 5（`https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js`）
- ECharts-WordCloud（`https://cdn.jsdelivr.net/npm/echarts-wordcloud@2/dist/echarts-wordcloud.min.js`）
- Google Fonts（Inter / Source Serif 4 字体）

---

## 本地运行

### 快速预览（Demo 模式）
无需后端，直接启动静态服务器即可浏览界面（写操作禁用，显示演示数据）：

```bash
# 方式一：使用 npx http-server（推荐）
npx http-server -p 8000 -c-1 --cors

# 方式二：使用 Python
python -m http.server 8000

# 然后浏览器访问
# http://127.0.0.1:8000
```

> ⚠️ **不要直接双击 `index.html` 用 `file://` 协议打开**——浏览器安全策略会阻止 fetch/XHR 请求和模块加载。

### 对接真实后端
确保后端服务在 `http://127.0.0.1:3100` 正常运行，或在页面加载前设置自定义 API 地址：

```html
<script>
  window.MiniFishConfig = { apiBaseUrl: 'https://your-server.com/api/v1' };
</script>
<script src="src/app/api/client.js"></script>
```

然后启动静态服务器（需开启 CORS）：

```bash
npx http-server -p 8000 -c-1 --cors
```

访问 `http://127.0.0.1:8000`，使用已注册账号登录即可使用全部功能。

### 默认测试账号（本地开发环境）
- 邮箱：`d**@************ifish.local`
- 密码：`MiniFish-Local-Test-2026!`

---

## 目录结构

```
MiniFish-WebManage/
├── index.html                  # 单页应用入口（所有模板内联）
├── README.md                   # 本文件
└── src/
    ├── app/
    │   ├── main.js             # Vue 应用主逻辑（data/computed/methods/watch）
    │   ├── icons.js            # SVG 图标库
    │   ├── api/                # API Client 封装
    │   │   ├── client.js       # 核心 HTTP 客户端（Fetch/SSE/Token刷新/错误处理）
    │   │   ├── core.js         # 账号/连接器/任务/作业 API
    │   │   ├── ai.js           # AI Provider/连接/模型/对比 API
    │   │   ├── coach.js        # 成长教练 API
    │   │   ├── dashboard.js    # 仪表盘数据 API
    │   │   ├── media.js        # 媒体上传/分析 API
    │   │   ├── studio.js       # 创作工作室会话/消息/Artifact API
    │   │   └── trends.js       # 热点/素材/候选 API
    │   ├── charts/             # ECharts 图表渲染模块
    │   │   ├── dashboard-charts.js
    │   │   ├── intelligence-charts.js
    │   │   ├── ai-charts.js
    │   │   └── media-charts.js
    │   ├── data/               # 公共数据配置与模拟数据
    │   │   ├── provider-registry.js  # 13个AI Provider注册表（模型/BaseURL/凭证类型）
    │   │   ├── accounts.js
    │   │   ├── ai-models.js
    │   │   ├── coach.js
    │   │   ├── dashboard.js
    │   │   ├── intelligence.js
    │   │   ├── media.js
    │   │   ├── pricing.js
    │   │   └── studio.js
    │   └── features/           # 侧边栏功能注册（控制入口显示）
    │       ├── dashboard.js
    │       ├── intelligence.js
    │       ├── studio.js
    │       ├── coach.js
    │       ├── media.js
    │       ├── ai.js
    │       ├── cookie.js       # 平台账号入口（合并到用户菜单）
    │       └── settings.js
    └── styles/                 # 样式文件（CSS变量 + 模块化）
        ├── main.css            # 入口（import其他CSS）
        ├── theme.css           # 暗色主题变量定义
        ├── layout.css          # 布局/侧边栏/导航
        ├── components.css      # 按钮/卡片/表单/弹窗/通用组件
        └── features.css        # 各功能页面专属样式
```

---

## 支持的 AI Provider

当前已内置 13 个 AI Provider 配置：

| Provider | 凭证类型 | 默认 Base URL |
|---|---|---|
| DeepSeek | API Key | `https://api.deepseek.com` |
| 小米 MiMo | API Key / Token Plan | `https://api.xiaomimimo.com/v1` / `https://token-plan-cn.xiaomimimo.com/v1` |
| OpenCode Go | API Key | — |
| 通义千问 / Qwen | API Key | — |
| 智谱 GLM | API Key | — |
| 月之暗面 Kimi | API Key | — |
| 百度文心 | API Key | — |
| 字节豆包 | API Key | — |
| OpenAI | API Key | `https://api.openai.com/v1` |
| Anthropic Claude | API Key | — |
| Google Gemini | API Key | — |
| Groq | API Key | — |
| OpenRouter | API Key | — |
| Ollama（本地） | — | `http://localhost:11434/v1` |
| 自定义 | API Key | 可手动填写 |

> 注：部分 Provider 的 Base URL 需要根据官方文档填写，列表中标"—"的请查阅对应服务商文档。

---

## 平台账号 Cookie 配对流程

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Web页面  │     │ 后端API   │     │浏览器扩展 │     │目标平台   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │ 1.创建配对会话  │                │                │
     │───────────────>│                │                │
     │                │                │                │
     │ 2.返回配对码    │                │                │
     │<───────────────│                │                │
     │                │                │                │
     │ 3.用户在扩展中输入配对码         │                │
     │────────────────────────────────>│                │
     │                │                │                │
     │                │                │ 4.读取平台Cookie │
     │                │                │───────────────>│
     │                │                │<───────────────│
     │                │                │                │
     │                │ 5.提交Cookie    │                │
     │                │<───────────────│（带pairing头）  │
     │                │                │                │
     │                │ 6.加密存储，创建账号记录          │
     │                │───┐            │                │
     │                │<──┘            │                │
     │                │                │                │
     │ 7.刷新账号列表  │                │                │
     │<───────────────│                │                │
```

---

## 开发约定

- **零构建原则**：不使用任何打包工具，HTML 直接引用 JS/CSS 文件
- **版本号缓存控制**：通过 `?v=xx` 查询参数控制浏览器缓存，更新文件时递增版本号
- **Options API**：所有 Vue 组件逻辑使用 Options API（data/computed/methods/watch）
- **IIFE 模块化**：JS 文件使用 `(function(){ ... })()` 立即执行函数封装，通过 `window.MiniFish*` 命名空间暴露
- **无 npm 依赖**：前端不使用任何需要 npm install 的包，所有第三方库通过 CDN 加载
- **Demo 模式降级**：未登录或后端不可达时，页面自动进入 Demo 模式展示模拟数据，写操作禁用
- **不暴露敏感信息**：API Key 掩码显示，Cookie 永不回显到前端

---

## 免责声明

- 本项目仅用于学习和个人创作辅助，请勿用于违反各平台服务条款的用途
- 使用平台 Cookie 功能需遵守抖音、小红书、B 站等平台的用户协议和相关法律法规
- AI 生成内容仅供参考，创作者需对发布内容负责
- 本项目不内置任何 AI 服务商的 API Key，用户需自行申请并承担相关费用

---

## 版本信息

- **前端版本**：v1.0
- **后端契约版本**：参见后端项目 `openapi.json`
- **最后更新**：2026-07-15
