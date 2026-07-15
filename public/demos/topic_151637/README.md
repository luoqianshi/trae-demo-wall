# DataPilot · 数据领航员

> 真正的创新源于简洁与美感的平衡。专注于呈现最本质的价值，去除所有不必要的干扰。

DataPilot 是一个基于 Electron + React + TypeScript + PocketFlow.js 的桌面端对话式数据分析 Agent 平台。它能自主规划并执行复杂场景的数据分析——从联网搜索公开数据、编写 SQL、纠正错误、执行查询，到使用 Python 进行数据处理与可视化，最终生成完整的分析报告。

## 核心特性

- **Goal-Driven Agent**：给定目标 + harness + 风格指导，Agent 自主选择分析方法
- **多 Agent 协作**：Orchestrator → DeepResearch / Analysis / Plot / Report，基于 PocketFlow.js 编排
- **Python 沙箱**：JSON-RPC 2.0 协议，支持 pandas / numpy / plotly / duckdb / akshare / scikit-learn
- **自纠错循环**：代码执行出错时自动修复重试（最多 3 次）
- **实时进度**：Agent 每一步思考、代码、图表通过 IPC 实时推送到 UI
- **看板持久化**：SQLite 存储分析结果，随时回看
- **极简美学**：白底 + serif/sans/mono 三字体 + 石灰色阶 + 橙色点缀

## 快速开始

### 前置要求

- Node.js 20.19+
- Python 3.10+

### 安装

```bash
# 克隆项目
git clone <repo-url>
cd datapilot-desktop

# 安装依赖
npm install

# 安装 Python 依赖
pip install -r src/sandbox/python/requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API Key
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENAI_API_KEY` | LLM API Key（必填） | — |
| `OPENAI_BASE_URL` | LLM API 地址 | `https://api.openai.com/v1` |
| `LLM_MODEL` | 模型名称 | `gpt-4o-mini` |
| `PYTHON_PATH` | Python 可执行文件路径 | `python` |
| `SANDBOX_TIMEOUT` | 沙箱默认超时（毫秒） | `30000` |

> 支持 OpenAI / DeepSeek 等兼容 OpenAI API 的模型。DeepSeek 示例：`OPENAI_BASE_URL=https://api.deepseek.com/v1`，`LLM_MODEL=deepseek-chat`

### 运行

```bash
# 开发模式
npm run dev

# 类型检查
npm run typecheck

# 单元测试
npm run test

# E2E 测试（需 API Key）
npx playwright test

# 打包
npm run build:win
```

## 架构概览

```
┌─────────────────────────────────────────────────┐
│                  Electron App                    │
│                                                  │
│  ┌──────────┐  IPC   ┌────────────────────┐     │
│  │ Renderer │◄──────►│  Main Process      │     │
│  │ React UI │        │  ┌──────────────┐  │     │
│  │          │        │  │ Agent Flow   │  │     │
│  │ Analyze  │        │  │ (PocketFlow) │  │     │
│  │ Page     │        │  └──────┬───────┘  │     │
│  └──────────┘        │         │          │     │
│                      │  ┌──────▼───────┐  │     │
│                      │  │  Sandbox     │  │     │
│                      │  │  (Python)    │  │     │
│                      │  └──────────────┘  │     │
│                      └────────────────────┘     │
└─────────────────────────────────────────────────┘
```

详细架构文档：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Agent 设计

| Agent | 职责 | 重试策略 |
|-------|------|----------|
| Orchestrator | 调度决策，决定下一步执行哪个 Agent | 1 次 |
| DeepResearch | 联网搜索公开数据（akshare） | 2 次 |
| Analysis | 数据处理、统计分析、SQL 查询 | 2 次 + 自纠错循环 3 次 |
| Plot | 生成 Plotly 图表 | 2 次 |
| Report | 生成 Markdown 分析报告 | 2 次 |

详细设计文档：[docs/AGENT_DESIGN.md](docs/AGENT_DESIGN.md)

## 内置样例数据

| 样例 | 描述 | 场景 |
|------|------|------|
| 茅台股价 | 近一年日线数据 | 趋势分析 / 回测 |
| 深圳房价 | 各区二手房均价 | 对比分析 / 预测 |
| 微博热搜 | 热搜话题分布 | 异动归因 |
| GitHub 趋势 | 语言/仓库排行 | 排名分析 |
| 各省 GDP | 省级经济数据 | 地域对比 |

## 技术栈

- **桌面框架**：Electron 31 + electron-vite
- **前端**：React 18 + TypeScript + React Router 6 + Zustand 4
- **图表**：Plotly.js via react-plotly.js
- **Markdown**：marked + DOMPurify
- **Agent 框架**：PocketFlow.js 1.0.4
- **存储**：better-sqlite3 (SQLite WAL)
- **沙箱**：Python child_process + JSON-RPC 2.0
- **测试**：Vitest (单元) + Playwright (E2E)

## 项目结构

```
datapilot-desktop/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts      # 应用入口
│   │   ├── config.ts     # 路径与配置
│   │   └── ipc/          # IPC handlers
│   ├── preload/          # Electron 预加载脚本
│   ├── renderer/         # React 前端
│   │   └── src/
│   │       ├── pages/    # 3 个页面
│   │       ├── components/# 6 个组件
│   │       ├── store/    # Zustand store
│   │       └── styles/   # CSS 主题
│   ├── agents/           # PocketFlow Agent 系统
│   │   ├── orchestrator/
│   │   ├── deep-research/
│   │   ├── analysis/
│   │   ├── plot/
│   │   ├── report/
│   │   ├── llm/          # LLM Client
│   │   └── shared/       # 共享类型与配置
│   ├── sandbox/          # Python 沙箱
│   │   ├── SandboxManager.ts
│   │   └── python/harness.py
│   ├── storage/          # SQLite 存储
│   └── types/            # 跨进程共享类型
├── resources/
│   └── samples/          # 5 份样例数据
├── tests/                # E2E 测试
└── docs/                 # 架构与设计文档
```

## License

MIT
