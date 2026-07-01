# 衡舟 — 你的关系感知第二大脑

> 职场人的记忆与关系管理助手：自动记住重要的事、关心的人，并在你需要时给出有温度的建议。

衡舟不是普通的 AI 助手。它会持续记住你是谁、你关心谁、你们之间发生过什么，并在你面对复杂决策时，结合关系背景给出多维度的建议。

## 核心特性

- **关系感知记忆**：自动从对话中提取记忆、识别人物、追踪关系温度变化
- **多维度检索**：RAG + GraphRAG + Agentic RAG 三级检索架构
- **语义缓存**：Embedding 级查询缓存，相似问题命中缓存可 35x 加速
- **本地优先**：所有数据存储在浏览器端 IndexedDB，不依赖云端数据库
- **双模型 AI**：豆包（主模型）+ DeepSeek（备用模型），双模型并行或自动降级
- **三种视觉风格**：Ink 水墨暖白 / Glass 毛玻璃 / Bento 暗色卡片
- **响应式布局**：桌面端侧边栏 + 移动端底部导航

## 技术架构

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 8 |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Zustand |
| 本地数据库 | Dexie (IndexedDB v7) |
| AI SDK | Vercel AI SDK |
| 向量检索 | Zvec 后端 + TF-IDF 降级 |
| 嵌入模型 | doubao-embedding-vision-251215 (2048维) |
| 二进制存储 | Float32Array / ArrayBuffer |
| 引导组件 | driver.js |

## 快速开始

### 方式一：Demo 包（评委推荐）

1. 解压 `hengzhou-demo.zip`
2. 用浏览器打开 `index.html`
3. 等待 5-10 秒自动初始化示例数据

### 方式二：一键启动（满血版推荐）

克隆仓库后，双击运行即可，脚本会自动完成全部步骤：

**Windows:**
```
双击 start.bat
```

**Linux / macOS:**
```bash
chmod +x start.sh
./start.sh
```

脚本会自动完成：
1. 检查 Node.js 环境
2. 安装 npm 依赖（首次约 1-3 分钟）
3. 创建 .env 配置文件（首次会在控制台提示你填写 Key）
4. 清理旧进程
5. 启动后端代理（端口 3001）
6. 启动前端开发服务器（端口 5173）
7. 自动打开浏览器

### 方式三：手动分步运行

```bash
npm install           # 安装依赖
cp .env.example .env  # 配置 API Key
npm run dev           # 前端 (localhost:5173)
npm run dev:server    # 后端 (localhost:3001)
```

## API Key 配置

项目支持两种 AI 模型，需要在设置面板中配置：

| 模型 | 用途 | 获取地址 |
|------|------|----------|
| 豆包 (Doubao) | 主对话模型 + Embedding | [火山方舟控制台](https://console.volcengine.com/ark/) |
| DeepSeek | 备用对话模型（自动降级） | [platform.deepseek.com](https://platform.deepseek.com/) |

> 也可以通过后端 `.env` 文件配置默认 Key，前端设置面板中的用户 Key 优先级更高。

## 功能页面

| 页面 | 功能 |
|------|------|
| 对话 | AI 对话、场景卡片、上下文检索、回复建议、语义缓存 |
| 记忆 | 115条记忆，按类型筛选（承诺/洞察/健康/偏好/情绪/事件/习惯） |
| 关系 | 50位人物，关系温度计，分类筛选，关系图谱 |
| 提醒 | 自动从记忆提取提醒，手动添加，标记完成 |
| 日记 | 21篇日记，情绪分析，明日日程 |
| 设置 | 个人画像、API密钥、模型选择、3种视觉风格、数据备份 |

## 存储优化

已实施的多层存储优化方案：

| 优先级 | 优化项 | 效果 |
|--------|--------|------|
| P0 | 语义缓存迁移 IndexedDB | 解除 localStorage 5MB 限制，缓存上限 30→500 |
| P0 | 嵌入向量二进制存储 | Float32Array 替代 JSON，节省 75% 空间 |
| P1 | Person 轻量列表接口 | 列表页加载量降 98%（15KB→200B/人） |
| P1 | 向量去重 | Zvec 可用时跳过本地向量存储 |
| P2 | 数据生命周期管理 | 自动清理过期对话/任务/缓存 |

## 项目结构

```
hengzhou/
├── src/
│   ├── components/     # 68 个 React 组件
│   ├── lib/            # 核心逻辑（AI、存储、检索、缓存）
│   ├── repositories/   # 数据访问层
│   ├── services/       # 业务服务层
│   ├── stores/         # Zustand 状态管理
│   ├── types/          # TypeScript 类型定义
│   └── main.tsx        # 应用入口
├── server/             # 后端代理（API Key 安全转发）
├── .zvec/              # 向量索引数据（可选）
└── dist/               # 构建产物（1.44 MB）
```

## 可用脚本

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run dev:server` | 启动后端代理服务 |
| `npm run build` | TypeScript 检查 + 构建生产版本 |
| `npm run build:preview` | 构建并启动静态预览 |
| `npm run test` | 运行全部测试（Vitest + Node test） |
| `npm run lint` | ESLint 代码检查 |

## 技术指标

- **源代码**：160 个 TypeScript 文件，37,338 行
- **构建产物**：1.44 MB（Gzip 后约 420 KB）
- **运行时存储**：~3 MB IndexedDB + ~0.3 MB localStorage
- **测试覆盖**：134 个单元测试全部通过
- **语义缓存加速**：命中时 209ms vs 首次 7315ms（35x）
- **TypeScript**：零编译错误

## 浏览器兼容性

推荐使用 Chrome、Edge、Firefox 或 Safari 的最新版本。需要支持 IndexedDB、ES2022、Fetch API。
