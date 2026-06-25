# Agent Everywhere

类 SOLO 的多端 Agent 控制台：通过 WebSocket 将本地或远程 Agent 暴露给手机、平板、桌面浏览器等入口。

## 功能特性

- **多 Agent 支持** - Claude Code / Codex / 自定义 Agent
- **交互式终端** - xterm.js 全屏终端，直接转接 Agent CLI
- **三栏布局** - 左侧 Agent/会话、中间终端、右侧状态/文件/记忆
- **Agent 原生会话** - 读取 Claude Code / Codex 磁盘会话记录
- **Agent 记忆查看** - 读取 CLAUDE.md 和 ~/.claude/ 全局配置
- **TODO 监控** - 从 Agent 会话中解析 TODO 列表
- **文件管理** - 文件树浏览、创建、编辑、删除、重命名、搜索
- **Git 集成** - 状态查看、Stage/Unstage、Commit、Diff 查看器
- **后台任务** - 非交互式提交任务给 Agent 执行
- **终端会话管理** - 列出活跃 PTY 会话，强制关闭
- **系统监控** - CPU/内存/磁盘使用率
- **访问控制** - 可选 `AGENT_ACCESS_TOKEN` 保护远程访问

## 快速开始

### 1. 安装依赖

```bash
# 后端
pip install -r requirements.txt

# 前端
cd client && npm install
```

### 2. 启动服务

```bash
# 真实 Agent 模式
python run.py

# Mock 模式（无需安装 Agent，用于测试）
USE_MOCK=true python run.py
```

访问 http://localhost:8000

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `USE_MOCK` | 使用 Mock Agent 测试 | `false` |
| `PORT` | 服务端口号 | `8000` |
| `AGENT_WORKSPACES` | 可从客户端选择的工作目录，使用系统路径分隔符分隔 | 当前项目目录 |
| `AGENT_ACCESS_TOKEN` | 可选 Bearer/token 鉴权，远程设备需在设置里填写 | 空 |

## 项目结构

```
agent-everywhere/
├── client/                    # React + TypeScript 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── Terminal/      # xterm.js 终端组件
│   │   │   ├── Panels/        # 左右面板组件
│   │   │   │   ├── LeftPanel.tsx   # Agent 选择 + 会话列表
│   │   │   │   └── RightPanel.tsx  # 状态/文件/记忆 Tab
│   │   │   ├── Sidebar/       # 旧版侧边栏（已弃用）
│   │   │   ├── DiffPanel/     # Diff 查看面板
│   │   │   └── ui/            # shadcn/ui 基础组件
│   │   ├── stores/            # Zustand 状态管理
│   │   │   ├── agentStore.ts
│   │   │   ├── consoleStore.ts
│   │   │   └── workspaceStore.ts
│   │   └── types/             # TypeScript 类型定义
│   └── package.json
├── gateway/                   # Python FastAPI 服务端
│   ├── adapters/              # Agent 适配器 (Claude, Codex, Mock)
│   ├── routes/                # REST API 路由模块
│   │   ├── agent.py           # Agent 列表 + 工作区
│   │   ├── session.py         # 旧版聊天会话
│   │   ├── file.py            # 文件 CRUD
│   │   ├── git.py             # Git 操作
│   │   ├── terminal.py        # 终端会话管理
│   │   ├── task.py            # 后台任务
│   │   ├── system.py          # 系统监控
│   │   └── agent_memory.py    # Agent 记忆 + TODO
│   ├── models.py              # 共享数据模型
│   ├── deps.py                # 共享状态 + 工具函数
│   ├── terminal.py            # PTY 终端管理
│   └── server.py              # FastAPI 入口 (WebSocket + 路由注册)
├── docs/
│   └── api.html               # API 文档 (深色主题)
├── run.py                     # 启动脚本
└── requirements.txt           # Python 依赖
```

## API 概览

共 28 个 REST 端点 + 2 个 WebSocket 端点，详见 [API 文档](docs/api.html)。

| 模块 | 端点 | 说明 |
|------|------|------|
| Agent | `GET /api/agents` | 列出可用 Agent |
| 工作区 | `GET /api/workspaces` | 列出工作目录 |
| 会话 | `GET/POST /api/sessions` | 旧版聊天会话 |
| 文件 | `GET/POST/PUT/DELETE /api/files` | 文件 CRUD |
| 文件 | `POST /api/files/rename` | 重命名/移动 |
| 文件 | `GET /api/files/search` | 按名称搜索 |
| Git | `GET /api/git/status,log,diff` | Git 只读操作 |
| Git | `POST /api/git/add,reset,commit,checkout` | Git 写操作 |
| Git | `GET /api/git/branches` | 分支列表 |
| 终端 | `GET/DELETE /api/terminal/sessions` | PTY 会话管理 |
| 任务 | `POST/GET/DELETE /api/tasks/run,{id}` | 后台任务 |
| 记忆 | `GET /api/agent/memory` | Agent 记忆文件 |
| 记忆 | `GET /api/agent/todo` | Agent TODO 列表 |
| 记忆 | `GET /api/agent/sessions` | Agent 原生会话 |
| 系统 | `GET /api/health` | 健康检查 |
| 系统 | `GET /api/system/info` | 系统资源 |
| WS | `/ws/{session_id}` | 旧版聊天 WebSocket |
| WS | `/ws/terminal/{session_id}` | 交互式终端 WebSocket |

## 开发指南

### 添加新 Agent 适配器

1. 在 `gateway/adapters/` 创建新适配器类
2. 继承 `BaseAdapter`
3. 实现 `get_info()` 和 `execute()` 方法
4. 在 `server.py` 的 `_setup_adapters()` 中注册

### 添加新 API 路由

1. 在 `gateway/routes/` 创建新模块
2. 定义 `APIRouter` 和 `state = None` 占位
3. 在 `gateway/routes/__init__.py` 导出 router
4. 在 `server.py` 的 `_setup_routes()` 中 include

### 前端开发

```bash
cd client
npm run dev      # 开发模式
npm run build    # 生产构建
```

## License

MIT
