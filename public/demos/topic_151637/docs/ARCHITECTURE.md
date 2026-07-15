# DataPilot 桌面应用架构文档

> DataPilot · 数据领航员 — 对话式数据分析 Agent 桌面应用
> 技术栈：Electron + React + TypeScript + PocketFlow.js

座右铭：**"真正的创新源于简洁与美感的平衡。专注于呈现最本质的价值，去除所有不必要的干扰。"**

---

## 目录

1. [架构概览](#1-架构概览)
2. [进程架构](#2-进程架构)
3. [Agent 编排架构](#3-agent-编排架构)
4. [沙箱架构](#4-沙箱架构)
5. [IPC 通道表](#5-ipc-通道表)
6. [数据持久化](#6-数据持久化)
7. [安全](#7-安全)
8. [主题与设计](#8-主题与设计)

---

## 1. 架构概览

DataPilot 采用 **goal-driven**（目标驱动）核心理念：给 Agent 目标 + harness + 风格指导，不预设数据处理逻辑，让 Agent 自主决定分析方法、图表选型、报告结构。整个应用围绕"三进程 Electron 架构 + Agent 编排层 + Python 沙箱"四层结构展开。

### 1.1 四层结构

```
┌─────────────────────────────────────────────────────────────────┐
│                      Renderer (React 18)                        │
│   HomePage / AnalyzePage / DashboardsPage                       │
│   Zustand store · react-plotly.js · marked+dompurify            │
└───────────────▲───────────────────────────▲─────────────────────┘
                │ contextBridge             │ IPC 推送
                │ (window.datapilot)         │ (agent:progress/...)
┌───────────────┴───────────────────────────┴─────────────────────┐
│                       Preload (context bridge)                  │
│   强类型 DataPilotAPI · agent / data / storage 命名空间          │
└───────────────▲─────────────────────────────────────────────────┘
                │ ipcRenderer.invoke / ipcMain.handle
┌───────────────┴─────────────────────────────────────────────────┐
│                  Main Process (Node.js)                         │
│   IPC 注册 · SQLiteStore · 样例数据(Node fs) · Python 运行时检测 │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │            PocketFlow.js Agent 编排层                     │  │
│   │   Orchestrator → DeepResearch / Analysis / Plot / Report  │  │
│   └───────────────▲──────────────────────────────▲───────────┘  │
│                   │ sandbox.execute                │ LLM 调用     │
│   ┌───────────────┴──────────────────┐  ┌──────────┴──────────┐ │
│   │  SandboxManager (child_process)   │  │   LLMClient          │ │
│   │  JSON-RPC 2.0 over stdio          │  │   OpenAI 兼容 API    │ │
│   └───────────────▲──────────────────┘  └─────────────────────┘ │
│                   │ stdin/stdout (换行分隔 JSON)                  │
│   ┌───────────────┴──────────────────────────────────────────┐  │
│   │              Python 沙箱 (harness.py)                    │  │
│   │   pandas · numpy · plotly · duckdb · akshare · sklearn   │  │
│   └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 客户端形态 | Electron 桌面应用 | 本地管理 Python 沙箱、访问文件系统、数据隐私 |
| Agent 框架 | PocketFlow.js v1.0.4 | ~100 行极简框架，Node/Flow/action 路由天然支持多 Agent |
| 沙箱方案 | Node.js `child_process` 子进程 | 零 Docker 依赖，JSON-RPC over stdio 通信 |
| Agent 间通信 | Shared Storage（共享存储） | 数据分析是顺序流水线，共享存储比消息队列简单 |
| 通信协议 | JSON-RPC 2.0 | 行分隔 JSON，stdio 双向通信，无端口暴露 |
| LLM | OpenAI 兼容 API | 支持 OpenAI / DeepSeek / 本地模型 |
| 状态管理 | Zustand v4 | 轻量、TS 友好、无样板代码 |
| 迁移策略 | 抛弃旧 Python 代码全新重写 | goal-driven 理念，不预设逻辑 |

---

## 2. 进程架构

Electron 三进程架构严格隔离主进程、预加载脚本与渲染进程，遵循安全最佳实践。

### 2.1 Main Process（`src/main/`）

主进程运行在 Node.js 环境，拥有完整系统访问权限，负责应用生命周期、窗口管理、IPC 注册与 Python 沙箱调度。

#### `index.ts` — 应用入口

- 应用生命周期：`app.whenReady()` 创建 `BrowserWindow`，`window-all-closed` 退出应用（非 macOS）
- 窗口配置：`width: 1440, height: 900, minWidth: 1024, minHeight: 700`
- 安全配置：`contextIsolation: true, nodeIntegration: false, sandbox: true`
- 开发模式加载 `process.env.ELECTRON_RENDERER_URL`，生产模式加载 `../renderer/index.html`
- 注册所有 IPC 处理器（从 `./ipc/` 导入 `registerAgentIPC` / `registerDataIPC` / `registerStorageIPC`）
- **Python 运行时检测**：启动时 `execSync('python --version')`，失败则向渲染层发送 `agent:error` 警告
- `before-quit` 钩子：调用 `SandboxManager.stopAll()` 清理子进程 + 关闭 `SQLiteStore`
- 顶部 `import 'dotenv/config'` 加载 `.env` 环境变量

```typescript
import 'dotenv/config'
import { app, BrowserWindow } from 'electron'
import { execSync } from 'child_process'

function checkPythonRuntime(): boolean {
  try {
    execSync('python --version', { stdio: 'pipe', timeout: 5000 })
    return true
  } catch {
    return false
  }
}
```

#### `config.ts` — 路径与全局配置

通过 `app.isPackaged` 区分开发与生产路径，确保打包后资源可正确访问：

```typescript
import { app } from 'electron'
import { join } from 'path'

export { AGENT_CONFIG } from '../agents/shared/config'

const isDev = !app.isPackaged

export const PATHS = {
  samples: isDev
    ? join(process.env.APP_ROOT || process.cwd(), 'resources/samples')
    : join(process.resourcesPath, 'samples'),
  pythonHarness: isDev
    ? join(__dirname, '../../src/sandbox/python/harness.py')
    : join(process.resourcesPath, 'sandbox-python/harness.py'),
  database: join(app.getPath('userData'), 'datapilot.db'),
  logs: join(app.getPath('userData'), 'logs')
}

export const SANDBOX_CONFIG = {
  timeout: 30_000,         // 单次执行默认超时 30s
  maxOutputSize: 1_000_000  // stdout 最大 1MB
}
```

`AGENT_CONFIG` 从 `src/agents/shared/config.ts` re-export，使该配置不依赖 Electron，可供测试与 Agent 模块直接复用：

```typescript
export const AGENT_CONFIG = {
  maxIterations: 10,   // Orchestrator 迭代上限
  retryLimit: 3         // Analysis 自纠错次数
}
```

#### `ipc/agent.ipc.ts` — Agent IPC 处理器

核心调度入口，维护单例资源与会话状态：

- **单例 `SandboxManager` + `LLMClient`**（模块级实例，跨会话复用）
- 维护 `activeSessionId` 与 `control` 对象（`{ cancelled: boolean }`）
- `agent:run` 处理流程：
  1. 生成 `sessionId`（`crypto.randomUUID()`）
  2. `sandbox.start(sessionId)` 启动 Python 子进程
  3. 若选了 `datasetId`，先加载样例到沙箱并构造 `DatasetContext`
  4. 调用 `runAgent()`，通过 `onProgress` 回调向渲染层推送实时进度
  5. `finally` 中 `sandbox.stop(sessionId)` 清理子进程
- `agent:cancel` 处理：`sandbox.stop(sessionId)` + 置 `control.cancelled = true`

```typescript
const sandbox = new SandboxManager()
const llm = new LLMClient()
let activeSessionId: string | null = null
const control = { cancelled: false }

ipcMain.handle('agent:run', async (_event, { goal, datasetId }) => {
  const sessionId = crypto.randomUUID()
  activeSessionId = sessionId
  control.cancelled = false
  await sandbox.start(sessionId)

  let dataset: DatasetContext | undefined
  if (datasetId) {
    dataset = await loadDatasetForSandbox(sandbox, sessionId, datasetId)
  }

  try {
    const result = await runAgent(goal, dataset, llm, sandbox, sessionId, control, (event) => {
      mainWindow.webContents.send('agent:progress', event)
    })
    mainWindow.webContents.send('agent:complete', result)
    return result
  } catch (error) {
    mainWindow.webContents.send('agent:error', { message: error.message })
    throw error
  } finally {
    await sandbox.stop(sessionId)
    activeSessionId = null
  }
})
```

#### `ipc/data.ipc.ts` — 数据源 IPC

- `data:listSamples`：纯 Node `fs` 读取 `resources/samples/*.schema.json`，返回样例列表
- `data:loadSample(id)`：读取 schema.json + CSV 前 10 行（Node `fs`），构造 `DatasetContext`
- `data:upload(filePath)`：起**短命沙箱**（`start → loadData → describe → stop`），xlsx/parquet 等格式必须由 Python 解析
- `data:preview(datasetId)`：返回前 50 行 + describe 统计
- 导出 `loadDatasetForSandbox(sandbox, sessionId, datasetId)` 供 agent.ipc 复用

#### `ipc/storage.ipc.ts` — 存储 IPC

`SQLiteStore` 的薄封装，将 CRUD 操作映射到对应 IPC 通道：

- `storage:list` → `sqliteStore.listDashboards()`
- `storage:get` → `sqliteStore.getDashboard(id)`
- `storage:save` → `sqliteStore.saveDashboard(dashboard)`
- `storage:delete` → `sqliteStore.deleteDashboard(id)`

### 2.2 Preload（`src/preload/`）

预加载脚本通过 `contextBridge` 向渲染进程暴露安全 API，是主进程与渲染进程间唯一的通信桥梁。

#### `index.ts` — 上下文桥接

通过 `contextBridge.exposeInMainWorld('datapilot', api)` 暴露三个命名空间（`agent` / `data` / `storage`）。

**关键设计**：所有 IPC 监听器（`onProgress` / `onComplete` / `onError`）返回 **cleanup 函数**，供 React 组件在 `useEffect` 卸载时移除监听，避免内存泄漏与重复绑定。

```typescript
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  agent: {
    run: (goal: string, datasetId?: string) =>
      ipcRenderer.invoke('agent:run', { goal, datasetId }),
    cancel: (sessionId: string) =>
      ipcRenderer.invoke('agent:cancel', sessionId),
    onProgress: (callback: (event: ProgressEvent) => void) => {
      const listener = (_e: unknown, event: ProgressEvent) => callback(event)
      ipcRenderer.on('agent:progress', listener)
      return () => ipcRenderer.removeListener('agent:progress', listener)
    },
    onComplete: (callback: (result: AgentResult) => void) => {
      const listener = (_e: unknown, result: AgentResult) => callback(result)
      ipcRenderer.on('agent:complete', listener)
      return () => ipcRenderer.removeListener('agent:complete', listener)
    },
    onError: (callback: (error: Error) => void) => {
      const listener = (_e: unknown, error: Error) => callback(error)
      ipcRenderer.on('agent:error', listener)
      return () => ipcRenderer.removeListener('agent:error', listener)
    }
  },
  data: {
    listSamples: () => ipcRenderer.invoke('data:listSamples'),
    loadSample: (id: string) => ipcRenderer.invoke('data:loadSample', id),
    uploadFile: (filePath: string) => ipcRenderer.invoke('data:upload', filePath),
    preview: (datasetId: string) => ipcRenderer.invoke('data:preview', datasetId)
  },
  storage: {
    listDashboards: () => ipcRenderer.invoke('storage:list'),
    getDashboard: (id: string) => ipcRenderer.invoke('storage:get', id),
    saveDashboard: (dashboard: Dashboard) => ipcRenderer.invoke('storage:save', dashboard),
    deleteDashboard: (id: string) => ipcRenderer.invoke('storage:delete', id)
  }
}

contextBridge.exposeInMainWorld('datapilot', api)
```

#### `api.d.ts` — 类型声明

定义 `DataPilotAPI` 类型接口，为 `window.datapilot` 提供强类型支持。`agent` / `data` / `storage` 三个命名空间的方法签名均与 `src/types/shared.ts` 中的类型对齐，确保渲染进程与主进程类型一致。

```typescript
export interface DataPilotAPI {
  agent: {
    run: (goal: string, datasetId?: string) => Promise<SharedStore>
    cancel: (sessionId: string) => Promise<void>
    onProgress: (callback: (event: ProgressEvent) => void) => () => void
    onComplete: (callback: (result: AgentResult) => void) => () => void
    onError: (callback: (error: Error) => void) => () => void
  }
  data: {
    listSamples: () => Promise<DatasetSummary[]>
    loadSample: (id: string) => Promise<DatasetContext>
    uploadFile: (filePath: string) => Promise<DatasetContext>
    preview: (datasetId: string) => Promise<DescribeResult>
  }
  storage: {
    listDashboards: () => Promise<DashboardSummary[]>
    getDashboard: (id: string) => Promise<Dashboard | null>
    saveDashboard: (dashboard: Dashboard) => Promise<void>
    deleteDashboard: (id: string) => Promise<void>
  }
}
```

### 2.3 Renderer（`src/renderer/`）

渲染进程是面向用户的 React 前端，运行在沙箱化的浏览器环境中，无法直接访问 Node.js API。

#### 技术栈

- **React 18** — UI 框架
- **React Router 6** — 路由管理，使用 `HashRouter` 适配 Electron `file://` 协议
- **Zustand v4** — 状态管理（轻量、TS 友好、无样板代码）

#### 页面结构

| 页面 | 路由 | 职责 |
|------|------|------|
| `HomePage` | `/` | 居中大标题 "DataPilot"（衬线字体）+ 座右铭引用 + 快速入口卡片 |
| `AnalyzePage` | `/analyze` | 三栏布局，核心分析工作台 |
| `DashboardsPage` | `/dashboards` | 看板列表（卡片网格）+ 详情查看 + 删除 |

**AnalyzePage 三栏布局**：

```
┌──────────────┬─────────────────────────────┬──────────────────┐
│  左栏 280px  │      中栏 flex-1            │   右栏 400px     │
│              │                             │                  │
│ DataSource   │  ChatPanel                  │  结果面板(Tab)   │
│ Selector     │  (目标输入 + 运行按钮)       │                  │
│ +            │                             │  - 数据预览      │
│ DataPreview  │  AgentTimeline              │  - ChartView     │
│ (表格预览)    │  (步骤时间线 + 代码展开)     │  - ReportView    │
└──────────────┴─────────────────────────────┴──────────────────┘
```

#### 六大核心组件

| 组件 | 职责 | 关键依赖 |
|------|------|----------|
| `DataSourceSelector` | 样例数据列表 + 文件上传按钮 | `window.datapilot.data` |
| `DataPreview` | 前 10 行表格 + 列类型标签 | — |
| `ChatPanel` | 目标 textarea + 运行按钮 | Zustand `runAgent` |
| `AgentTimeline` | 竖向时间线，每步 agent 缩写 + action + reasoning + 可展开代码块 | Zustand `agentSteps` |
| `ChartView` | Plotly figure 渲染 + 白色主题覆盖 | `react-plotly.js/factory` + `plotly.js-dist-min` |
| `ReportView` | Markdown 渲染 + 图表嵌入 + 保存看板按钮 | `marked` + `dompurify` |

**ChartView 关键实现**：使用 factory 模式避免默认导出问题，渲染前覆盖 layout 为白色主题：

```typescript
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-dist-min'

const Plot = createPlotlyComponent(Plotly)

function applyTheme(figure: any) {
  figure.layout = {
    ...figure.layout,
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    font: { ...figure.layout?.font, color: '#1a1a1a', family: '"Inter Tight", sans-serif' },
    title: { ...figure.layout?.title, font: { family: 'var(--font-serif)', size: 16 }, x: 0 }
  }
  return figure
}
```

> bdata 编码已由 `harness.py` 解码，前端无需再处理，直接接收纯 JSON。

#### Zustand Store（`appStore.ts`）

集中管理所有前端状态，包含实时进度处理逻辑：

```typescript
interface AppState {
  // 数据源
  datasets: DatasetSummary[]
  selectedDataset: DatasetContext | null
  // Agent 会话
  agentRunning: boolean
  agentSteps: AgentStep[]
  charts: ChartSpec[]
  report: Report | null
  agentError: string | null
  goal: string
  // 看板
  dashboards: DashboardSummary[]
  // Actions
  loadSamples: () => Promise<void>
  selectDataset: (id: string) => Promise<void>
  runAgent: (goal: string) => Promise<void>
  cancelAgent: () => Promise<void>
  handleProgress: (event: ProgressEvent) => void
  handleComplete: (result: SharedStore) => void
  loadDashboards: () => Promise<void>
  saveDashboard: () => Promise<void>
}
```

**实时进度处理**：`handleProgress` 按事件类型分发处理，`handleComplete` 用最终 `shared.steps` 替换全部 steps（作为权威数据源）：

| 事件类型 | 来源 Agent | UI 行为 |
|----------|-----------|---------|
| `orchestrator_decision` | Orchestrator | 追加 step（agent: orchestrator, action, reasoning） |
| `agent_step` | DeepResearch | 追加 step（agent, action: data_fetch, result: finding.summary） |
| `code_generated` | Analysis | 追加 step（agent: analysis, action: execute_code, code, error） |
| `chart_ready` | Plot | 追加 chart + step（agent: plot, action: generate_chart） |
| `report_section` | Report | 设置 report（实时显示报告） |
| `error` | 任意 | 设置 agentError |

---

## 3. Agent 编排架构

Agent 编排层基于 PocketFlow.js 构建，采用 **Orchestrator Pattern**（中央调度 + action 路由）。核心理念是 goal-driven：给 Agent 目标 + 能力 + 风格，不预设步骤。

### 3.1 PocketFlow.js v1.0.4

从安装源码逐行验证的核心 API：

```typescript
class Node<S, P> {
  maxRetries: number;       // 总尝试次数（非重试次数！）
  wait: number;             // 重试间隔毫秒
  currentRetry: number;

  async prep(shared: S): Promise<unknown>           // 读 shared
  async exec(prepRes: unknown): Promise<unknown>    // 核心逻辑
  async post(shared: S, prepRes: unknown, execRes: unknown): Promise<Action | undefined>  // 写回 + 返回 action
  async execFallback(prepRes: unknown, error: Error): Promise<unknown>  // 重试耗尽后降级

  next(node): this        // 默认 action 连接（返回 target node）
  on(action: string, node): this  // 指定 action 连接（返回 this）
}

class Flow<S, P> {
  start: BaseNode;
  // _orchestrate: while 循环，从 start 开始，按 action 路由到后继 node
  // getNextNode(action) 返回 undefined 时 Flow 结束
}
```

**关键语义确认（源码验证）**：

1. **`maxRetries` 是总尝试次数**，不是重试次数。`super(1, 1)` = 仅 1 次尝试；要实现"3 次纠错"需 `super(4, 1)` 或在 `exec` 内部自实现循环。
2. **`Flow._orchestrate` 每次取后继节点后 clone 运行**（通过 `Object.assign` 拷贝实例字段），因此"sub-agent → default → orchestrator"的环能正常工作。
3. **`getNextNode(action)` 查不到后继时返回 `undefined`**，Flow 结束（会打印 `console.warn`）。
4. **节点每轮被 clone**，`Object.assign` 拷贝实例字段（如 `this.llm`），但**可变运行状态必须放进 SharedStore**，不能放在节点实例上。
5. **`.next(node)` 返回 target node**，`.on(action, node)` 返回 this（支持链式调用）。

### 3.2 Flow 拓扑

Orchestrator 作为中央调度节点，通过 action 路由到 4 个子 Agent，子 Agent 完成后经 `next()`（默认 action）回到 Orchestrator 形成循环，直到 Orchestrator 返回 `'done'` 路由到终端节点。

```
                        ┌──on('deep_research')──→ deepResearch ──next──┐
                        │                                                │
                        ├──on('analysis')────────→ analysis ────next─────┤
                        │                                                │
orchestrator ───────────┼──on('plot')────────────→ plot ────────next─────┼──→ orchestrator (循环)
                        │                                                │
                        ├──on('report')──────────→ report ──────next─────┘
                        │
                        └──on('done')────────────→ terminal (空 Node, Flow 结束)
```

**拓扑构建代码**（`src/agents/index.ts`）：

```typescript
export function createDataPilotFlow(
  llm: LLMClient, sandbox: SandboxManager, sessionId: string
): Flow<SharedStore> {
  const orchestrator = new OrchestratorNode(llm)
  const deepResearch = new DeepResearchNode(llm, sandbox, () => sessionId)
  const analysis = new AnalysisNode(llm, sandbox, () => sessionId)
  const plot = new PlotNode(llm, sandbox, () => sessionId)
  const report = new ReportNode(llm)
  const terminal = new Node<SharedStore>()  // 空终端

  orchestrator.on('deep_research', deepResearch)
              .on('analysis', analysis)
              .on('plot', plot)
              .on('report', report)
              .on('done', terminal)

  deepResearch.next(orchestrator)   // default action → 回到 Orchestrator
  analysis.next(orchestrator)
  plot.next(orchestrator)
  report.next(orchestrator)

  return new Flow<SharedStore>(orchestrator)
}
```

> **设计决策**：用空 `Node<SharedStore>` 作为 `'done'` 终端 sink，避免 PocketFlow 的 "Flow ends" `console.warn`。

### 3.3 Agent Nodes

#### 1. OrchestratorNode（`src/agents/orchestrator/OrchestratorNode.ts`）

- 构造：`super(1, 0)` — 决策类调用，仅 1 次尝试，不重试
- `prep`：读 `goal` + `dataset_summary` + `completed_steps` + `iteration`
- `exec`：LLM 返回 `OrchestratorDecision` JSON（`{ action, reasoning, task }`）
- `post`：写入 `shared.currentTask` / `shared.currentAction`，记录 step，推送 `orchestrator_decision` 事件
- **终止保护**：检查 `shared.cancelled` 或 `shared.iteration >= MAX_ITERATIONS`，命中则返回 `'done'`

```typescript
export class OrchestratorNode extends Node<SharedStore> {
  constructor(private llm: LLMClient) { super(1, 0) }

  async post(shared: SharedStore, prepRes: any, execRes: OrchestratorDecision) {
    shared.iteration++
    shared.currentTask = execRes.task
    shared.currentAction = execRes.action
    shared.steps.push({ /* orchestrator 决策 step */ })
    shared.onProgress?.({ type: 'orchestrator_decision', data: execRes, ... })

    // 取消或迭代上限保护
    if (shared.cancelled || shared.iteration >= AGENT_CONFIG.maxIterations) {
      return 'done'
    }
    return execRes.action
  }
}
```

#### 2. DeepResearchNode（`src/agents/deep-research/DeepResearchNode.ts`）

- 构造：`super(2, 1)` — 2 次尝试，间隔 1s（应对瞬时 LLM API 错误）
- `prep`：读 `shared.currentTask`、`shared.goal`、`shared.dataset`
- `exec`：LLM 生成 Python 代码（akshare 获取金融数据 / 数据保存为 CSV）→ `sandbox.execute` → 解析结果为 `ResearchFinding`
- `post`：结果 push 到 `shared.researchFindings`，推送 `agent_step` 事件，返回 `'default'`
- v1 优先支持 akshare 路径，Web 搜索预留接口

#### 3. AnalysisNode（`src/agents/analysis/AnalysisNode.ts`）

- 构造：`super(2, 1)` — Node 层仅用于瞬时 LLM API 错误重试
- **自纠错循环在 `exec` 内部实现**（`while` 循环 `maxFix=3`），**不是** PocketFlow 的 `maxRetries`
- 原因：PocketFlow 重试是对同一输入重复调用，而纠错需要把上一次 `stderr` 喂回 LLM 重新生成代码

```typescript
async exec(input: ExecInput): Promise<AnalysisResult> {
  let code = await this.generateCode(input)
  let retries = 0
  const maxFix = AGENT_CONFIG.retryLimit  // 3
  while (retries <= maxFix) {
    const res = await this.sandbox.execute(this.sessionId(), code)
    if (!res.stderr) {
      return { title: input.task, code, stdout: res.stdout, stderr: '', result: res.result, ... }
    }
    if (retries < maxFix) {
      code = await this.fixCode(input, code, res.stderr)  // 喂回 stderr 重新生成
    }
    retries++
  }
  return { ..., stderr: lastErr }
}
```

- `post`：写入 `shared.analysisResults`，推送 `code_generated` 事件，返回 `'default'`

#### 4. PlotNode（`src/agents/plot/PlotNode.ts`）

- 构造：`super(2, 1)`
- `prep`：读 `shared.analysisResults` + `shared.styleGuide` + `shared.currentTask`
- `exec`：LLM 生成 Plotly Python 代码 → `sandbox.execute` → 从 `ExecuteResult.figures` 提取 figure（bdata 已由 harness 解码）
- `post`：构造 `ChartSpec` push 到 `shared.chartSpecs`，推送 `chart_ready` 事件，返回 `'default'`

#### 5. ReportNode（`src/agents/report/ReportNode.ts`）

- 构造：`super(2, 1)`
- `prep`：读 `shared.researchFindings` + `shared.analysisResults` + `shared.chartSpecs`
- `exec`：使用 `streamComplete` 逐 token 推送 `report_section` 事件（实现报告实时显示）
- `post`：`parseReport()` 将 Markdown 按 `##` 标题切分为 `ReportSection[]`，写入 `shared.report`，返回 `'default'`

### 3.4 SharedStore

所有 Agent 间的通信枢纽，可变运行状态集中存放（因为节点每轮被 clone，实例状态不可靠）：

```typescript
export interface SharedStore {
  sessionId: string
  goal: string                          // 用户自然语言目标
  styleGuide: StyleGuide                // 美学风格指导（含座右铭）
  dataset?: DatasetContext              // 当前数据集
  researchFindings: ResearchFinding[]   // DeepResearch 产出
  analysisResults: AnalysisResult[]     // Analysis 产出
  chartSpecs: ChartSpec[]               // Plot 产出
  report?: Report                       // Report 产出
  steps: AgentStep[]                    // 审计日志
  iteration: number                     // Orchestrator 迭代计数
  errors: string[]                      // 累积错误
  currentTask: string                   // Orchestrator → sub-agent 任务传递
  currentAction: OrchestratorAction | null  // 当前 action
  cancelled: boolean                    // 取消信号
  onProgress?: (event: ProgressEvent) => void  // 向 UI 推送
}
```

> **设计要点**：`currentTask` / `currentAction` / `cancelled` 经 SharedStore 传递，因为 PocketFlow action 只是字符串，无法承载任务描述。`AGENT_CONFIG` 位于 `src/agents/shared/config.ts`（不依赖 Electron），供测试与 Agent 模块复用。

### 3.5 取消机制

取消采用**信号轮询**模式，确保运行中的 Flow 能在下一轮 Orchestrator 决策时优雅退出：

```
渲染进程                      主进程 IPC 层                    Agent Flow
   │                              │                              │
   │ agent:cancel                 │                              │
   ├─────────────────────────────►│                              │
   │                              │ control.cancelled = true     │
   │                              │ sandbox.stop(sessionId)      │
   │                              ├──────────────────────────────┤
   │                              │                              │
   │                              │  setInterval 每 200ms         │
   │                              │  sync: shared.cancelled =    │
   │                              │    control.cancelled          │
   │                              │                              │
   │                              │            OrchestratorNode.post()  │
   │                              │            检查 shared.cancelled     │
   │                              │            命中 → return 'done'      │
   │                              │                              │
   │  agent:complete / error      │                              │
   │◄─────────────────────────────┤                              │
```

1. IPC 层 `agent:cancel` 置 `control.cancelled = true`，同时 `sandbox.stop(sessionId)` 终止 Python 子进程
2. `setInterval` 每 200ms 将 `control.cancelled` 同步到 `shared.cancelled`（因 Flow 运行在异步循环中，无法直接中断）
3. `OrchestratorNode.post()` 检查 `shared.cancelled`，命中则返回 `'done'`，Flow 经终端节点结束

---

## 4. 沙箱架构

Python 沙箱通过 Node.js `child_process` 子进程管理，零 Docker 依赖，使用 JSON-RPC 2.0 over stdio 双向通信。

### 4.1 通信协议（JSON-RPC 2.0）

- **Node.js → Python**：通过 stdin 写入（换行分隔的 JSON）
- **Python → Node.js**：通过 stdout 输出（换行分隔的 JSON）
- 每行一个完整的 JSON-RPC 消息，按 `id` 字段匹配请求与响应

```typescript
export interface RPCRequest {
  jsonrpc: '2.0'
  id: string | number
  method: 'ping' | 'execute' | 'load_data' | 'query' | 'describe' | 'list_variables' | 'reset'
  params: Record<string, unknown>
}

export interface RPCResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: ExecuteResult | LoadDataResult | QueryResult | DescribeResult | string[]
  error?: { code: number; message: string; traceback?: string }
}
```

**支持的 7 个方法**：

| 方法 | 用途 | 返回 |
|------|------|------|
| `ping` | 心跳检测（启动时验证 Python 就绪） | `'pong'` |
| `execute(code)` | 执行任意 Python 代码 | `ExecuteResult` |
| `load_data(source, format)` | 加载 CSV/Excel/Parquet/JSON 到命名空间 | `LoadDataResult` |
| `query(sql)` | 用 duckdb 对 DataFrame 执行 SQL | `QueryResult` |
| `describe(handle)` | 返回 schema + head + describe 统计 | `DescribeResult` |
| `list_variables()` | 列出当前命名空间变量 | `string[]` |
| `reset()` | 清空命名空间 | — |

### 4.2 SandboxManager（`src/sandbox/SandboxManager.ts`）

管理 Python 子进程生命周期，支持多会话隔离：

- **`STARTUP_TIMEOUT = 30s`**（与 `defaultTimeout` 解耦）—— Python 首次导入 pandas/plotly 耗时数秒，启动心跳必须给予充足时间
- **多会话支持**：`Map<sessionId, ChildProcess>`，每个会话独立 Python 进程
- **`PendingRequest` 携带 `sessionId`**：`stop(sessionId)` 和 `handleExit(sessionId)` 仅 reject 匹配 `pending.sessionId === sessionId` 的请求，避免误杀其它会话的 pending 请求
- **Plotly bdata 解码在 `harness.py` 完成**，前端接收纯 JSON，无需二次处理

```typescript
interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
  timer: NodeJS.Timeout
  sessionId: string          // 会话隔离关键字段
}

export class SandboxManager {
  private static readonly STARTUP_TIMEOUT = 30_000
  private processes: Map<string, ChildProcess> = new Map()
  private pending: Map<string, PendingRequest> = new Map()

  async start(sessionId: string): Promise<void>
  // spawn(python, [harness.py], { stdio: ['pipe', 'pipe', 'pipe'] })
  // 启动后用 STARTUP_TIMEOUT 发 ping 验证就绪

  async execute(sessionId: string, code: string, timeout?: number): Promise<ExecuteResult>
  async loadData(sessionId: string, source: string, format: string): Promise<LoadDataResult>
  async query(sessionId: string, sql: string): Promise<QueryResult>
  async describe(sessionId: string, handle?: string): Promise<DescribeResult>
  async listVariables(sessionId: string): Promise<string[]>
  async reset(sessionId: string): Promise<void>
  async stop(sessionId: string): Promise<void>
  async stopAll(): Promise<void>   // app 退出时调用，kill 所有子进程
}
```

**核心实现要点**：

- `spawn` 时设置 `cwd` 为临时目录（`app.getPath('temp')/datapilot-sandbox/<sessionId>`）
- stdout 逐行解析：`child.stdout.on('data', chunk => { buffer += chunk; 按换行分割 → JSON.parse → 匹配 pending.id → resolve })`
- 超时控制：`setTimeout(() => { child.kill('SIGKILL'); reject(new Error('timeout')) }, timeout)`
- `stopAll()`：遍历所有 process，`kill('SIGKILL')`

### 4.3 harness.py（`src/sandbox/python/harness.py`）

Python REPL 沙箱入口，预导入数据分析全栈库：

**预导入库**：

| 库 | 命名空间 | 用途 |
|----|----------|------|
| pandas | `pd` | 数据处理 |
| numpy | `np` | 数值计算 |
| plotly.express | `px` | 快速图表 |
| plotly.graph_objects | `go` | 精细图表 |
| duckdb | `duckdb` | SQL 查询引擎 |
| akshare | `ak` | 金融数据获取 |
| scikit-learn | — | 机器学习 |
| statsmodels | — | 统计建模 |

**`_create_namespace`** 提供预置变量：

```python
def _create_namespace():
    return {
        'pd': pd, 'np': np, 'plt': plt,
        'px': px, 'go': go, 'duckdb': duckdb,
        'ak': ak, 'figures': [],  # Plotly figure 列表（自动序列化）
        'df': None                 # 加载数据后赋值
    }
```

**命名空间约定**：

- `result` 变量 = 结构化返回值（自动序列化为 JSON）
- `figures` 列表 = Plotly figure 对象（自动 `to_dict()` + bdata 解码）
- 加载的数据默认命名为 `df`

**`ExecuteResult` 结构**（含 stdout、stderr、result、figures）：

```python
{
  "stdout": "hello world\n",
  "stderr": "",
  "result": 42,                  # result 变量的值（JSON 可序列化）
  "figures": [                   # Plotly figure dict 数组（bdata 已解码）
    { "data": [...], "layout": {...} }
  ]
}
```

**figure 序列化**：调用 `fig.to_dict()`，遍历 traces 的 `x/y/z/values/customdata`，解码 bdata 编码（base64 二进制数据）转为 list，确保前端可直接渲染。

**主循环**：逐行读 `sys.stdin`，JSON 解析 → 分发方法 → JSON 响应写入 `sys.stdout`（每行一个 JSON）。每个请求 try/except 包裹，错误写入响应的 `error` 字段。

---

## 5. IPC 通道表

所有 IPC 通道集中定义在 `src/types/ipc.ts`，渲染进程经 preload 桥接调用，主进程在 `register*IPC` 中注册处理器。

```typescript
export const IPC = {
  AGENT_RUN: 'agent:run', AGENT_CANCEL: 'agent:cancel',
  AGENT_PROGRESS: 'agent:progress', AGENT_COMPLETE: 'agent:complete', AGENT_ERROR: 'agent:error',
  DATA_LIST_SAMPLES: 'data:listSamples', DATA_LOAD_SAMPLE: 'data:loadSample',
  DATA_UPLOAD: 'data:upload', DATA_PREVIEW: 'data:preview',
  STORAGE_LIST: 'storage:list', STORAGE_GET: 'storage:get',
  STORAGE_SAVE: 'storage:save', STORAGE_DELETE: 'storage:delete'
} as const
```

### 5.1 完整通道表

| 通道 | 方向 | 用途 |
|------|------|------|
| `agent:run` | renderer → main | 启动 Agent Flow（传入 goal + datasetId） |
| `agent:cancel` | renderer → main | 取消运行中的 Agent（置 cancelled 信号 + 停沙箱） |
| `agent:progress` | main → renderer | 实时进度事件推送（orchestrator_decision / code_generated / chart_ready 等） |
| `agent:complete` | main → renderer | Agent 执行完成，返回完整 SharedStore |
| `agent:error` | main → renderer | 错误通知（含 Python 运行时缺失等） |
| `data:listSamples` | renderer → main | 列出可用样例数据集 |
| `data:loadSample` | renderer → main | 按 ID 加载样例数据 |
| `data:upload` | renderer → main | 上传文件（起短命沙箱解析 xlsx/parquet） |
| `data:preview` | renderer → main | 预览数据集（前 50 行 + describe 统计） |
| `storage:list` | renderer → main | 列出所有看板 |
| `storage:get` | renderer → main | 按 ID 获取单个看板 |
| `storage:save` | renderer → main | 保存看板（INSERT OR REPLACE） |
| `storage:delete` | renderer → main | 按 ID 删除看板 |

### 5.2 数据流示例

```
用户输入目标 → ChatPanel → appStore.runAgent()
  → window.datapilot.agent.run(goal, datasetId)
  → ipcRenderer.invoke('agent:run')
  → ipcMain.handle('agent:run')
  → SandboxManager.start() → runAgent() → Flow.run()
      ├─ OrchestratorNode → onProgress('orchestrator_decision')
      │      → ipcMain → 'agent:progress' → onProgress callback → appStore.handleProgress
      ├─ AnalysisNode (自纠错) → onProgress('code_generated')
      │      → 'agent:progress' → appStore.handleProgress → AgentTimeline 实时追加
      ├─ PlotNode → onProgress('chart_ready')
      │      → 'agent:progress' → appStore.handleProgress → ChartView 渲染
      └─ ReportNode → onProgress('report_section')
             → 'agent:progress' → appStore.handleProgress → ReportView 实时显示
  → Flow 结束
  → mainWindow.webContents.send('agent:complete', shared)
  → appStore.handleComplete → 用 shared.steps 替换全部 steps（权威数据源）
```

---

## 6. 数据持久化

### 6.1 SQLiteStore（`src/storage/SQLiteStore.ts`）

基于 `better-sqlite3`（同步 API，适合 Electron 主进程），实现看板持久化。

**WAL 模式**：启用 Write-Ahead Logging 支持并发读，提升性能。

```typescript
import Database from 'better-sqlite3'

export class SQLiteStore {
  private db: Database.Database

  constructor(dbPath: string) {
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')  // WAL 模式
    this.init()
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        goal TEXT NOT NULL,
        dataset_id TEXT,
        report TEXT NOT NULL,      -- JSON array of Report
        charts TEXT NOT NULL,      -- JSON array of ChartSpec
        steps TEXT NOT NULL,       -- JSON array of AgentStep
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)
  }

  saveDashboard(dashboard: Dashboard): void    // INSERT OR REPLACE（upsert）
  getDashboard(id: string): Dashboard | null
  listDashboards(): DashboardSummary[]
  deleteDashboard(id: string): void
  close(): void
}
```

**`dashboards` 表结构**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT PRIMARY KEY | 看板唯一 ID |
| `title` | TEXT NOT NULL | 看板标题 |
| `goal` | TEXT NOT NULL | 分析目标 |
| `dataset_id` | TEXT | 数据集 ID |
| `report` | TEXT NOT NULL | 报告（JSON 字符串） |
| `charts` | TEXT NOT NULL | 图表规格（JSON 数组） |
| `steps` | TEXT NOT NULL | Agent 步骤（JSON 数组） |
| `created_at` | TEXT NOT NULL | 创建时间 |
| `updated_at` | TEXT NOT NULL | 更新时间 |

**upsert 策略**：使用 `INSERT OR REPLACE` 实现存不存在则插入、存在则更新。

### 6.2 原生模块处理

`better-sqlite3` 是原生 Node 模块，需匹配 Electron 的 Node ABI：

- `package.json` 的 `scripts.postinstall` 配置 `"electron-builder install-app-deps"`
- `electron.vite.config.ts` 中 `main.build.rollupOptions.external: ['better-sqlite3']`
- 安装时 `postinstall` 钩子自动按 Electron ABI 重新编译原生模块

---

## 7. 安全

DataPilot 遵循 Electron 安全最佳实践，多层防御保护用户数据与系统安全。

### 7.1 进程隔离

```typescript
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,      // 上下文隔离：渲染进程与 preload 独立上下文
    nodeIntegration: false,     // 禁用 Node.js 集成：渲染进程无法访问 require/process
    sandbox: true,               // 沙箱模式：渲染进程受限运行
    preload: join(__dirname, '../preload/index.js')
  }
})
```

- **`contextIsolation: true`**：渲染进程无法直接访问 Node.js API，必须经 `contextBridge` 暴露的白名单接口
- **`nodeIntegration: false`**：DevTools 控制台中 `require` / `process` 不可用
- **`sandbox: true`**：渲染进程在受限沙箱中运行，限制文件系统与系统 API 访问

### 7.2 XSS 防护

- **DOMPurify** 在渲染进程对 Markdown 渲染后的 HTML 进行清洗，移除恶意脚本与不安全标签
- `ReportView` 使用 `marked` 解析 Markdown → `dompurify.sanitize()` 清洗 → 安全渲染

```typescript
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const rawHtml = marked.parse(reportMarkdown)
const safeHtml = DOMPurify.sanitize(rawHtml)  // 清洗 XSS
```

### 7.3 内容安全策略（CSP）

`index.html` 中配置严格的 CSP，限制资源加载来源：

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self';">
```

- `default-src 'self'`：默认仅允许加载同源资源
- `script-src 'self'`：仅允许执行同源脚本，禁止内联脚本与远程脚本

### 7.4 沙箱隔离

- **无远程代码执行**：所有 Python 代码运行在沙箱化的 `child_process` 子进程中，与主应用隔离
- **进程隔离**：每个会话独立 Python 进程，工作目录设为 temp 目录（`app.getPath('temp')/datapilot-sandbox/<sessionId>`）
- **超时保护**：单次执行默认 30s 超时，超时后 `SIGKILL` 终止子进程
- **仅 stdio 通信**：沙箱无网络端口暴露，所有通信经 stdin/stdout
- **进程回收**：应用退出时 `SandboxManager.stopAll()` 清理所有子进程，确保无残留 `python.exe`

### 7.5 安全验证清单

| 检查项 | 通过标准 |
|--------|----------|
| contextIsolation | 渲染进程无法访问 `require`/`process` |
| 沙箱超时 | `while True: pass` 30 秒后被 kill |
| 沙箱隔离 | 两个会话变量不串扰 |
| 进程回收 | 关闭应用后任务管理器无残留 `python.exe` |
| XSS 防护 | Markdown 渲染经 DOMPurify 清洗 |
| CSP | DevTools Network 无被拦截的远程脚本 |

---

## 8. 主题与设计

DataPilot 采用极简白色主题，美学座右铭刻入项目规范与每个 Agent 的 system prompt：**"真正的创新源于简洁与美感的平衡。专注于呈现最本质的价值，去除所有不必要的干扰。"**

### 8.1 色彩系统

| 变量 | 值 | 用途 |
|------|-----|------|
| `--color-bg` | `#ffffff` | 主背景 |
| `--color-surface` | `#fafaf9` | 表面层（卡片） |
| `--color-surface-alt` | `#f5f5f4` | 三级面（代码块背景） |
| `--color-ink` | `#1a1a1a` | 主文字 |
| `--color-ink-secondary` | `#3f3f46` | 次文字 |
| `--color-ink-muted` | `#71717a` / `#a1a1aa` | 弱化文字 |
| `--color-rule` | `#e7e5e4` | 分割线 |
| `--color-accent` | `#c2410c` | 品牌高亮（暖橙，仅用于关键数字和品牌点） |

### 8.2 排版

| 变量 | 字体族 | 用途 |
|------|--------|------|
| `--font-serif` | `"Tiempos Text", "Charter", "Source Serif 4", "Songti SC", "Noto Serif CJK SC", serif` | 标题 |
| `--font-sans` | `"Inter Tight", "Inter", -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif` | 正文 |
| `--font-mono` | `"JetBrains Mono", "Cascadia Code", Consolas, monospace` | 代码 |

字体本地化支持离线桌面应用：`resources/fonts/` 放 woff2 文件，`index.html` 用 `@font-face` 声明，theme.css fallback 链保持不变。

### 8.3 节奏

| 变量 | 值 |
|------|-----|
| `--space-section` | 96px（段间距） |
| `--space-card` | 24px（卡片内间距） |
| `--radius-card` | 12px（卡片圆角） |
| `--radius-button` | 6px（按钮/标签圆角） |
| `--border-rule` | `1px solid #e7e5e4` |
| `--shadow-line` | `0 1px 0 #e7e5e4`（仅模拟边线） |
| `--transition` | 150ms ease |

### 8.4 设计禁令

为保持极简美学，主题规范明确禁止以下设计：

- 禁止渐变背景
- 禁止大块色彩填充（除 `#fafaf9` / `#f5f5f4` 表面层）
- 禁止装饰性阴影（仅 `0 1px 0 #e7e5e4` 模拟边线）
- 禁止 emoji 装饰
- 禁止阴影 + 圆角组合制造"漂浮感"
- 禁止紫粉 / 深色风格
- 品牌高亮色 `#c2410c` 仅用于关键数字和品牌点

### 8.5 图表选型原则

`STYLE_GUIDE.chartPrinciples` 指导 Plot Agent 自主选型：

- 时序数据优先折线图，多系列用不同灰度区分
- 分类对比优先水平柱状图，按值降序排列
- 占比构成 ≤ 6 类用环形图，> 6 类用柱状图
- 相关性用散点图 + 趋势线
- 图表标题左对齐，衬线字体
- 坐标轴线 `#e7e5e4`，网格线 `#f5f5f4`
- 数据标签直接标注，减少图例依赖

### 8.6 座右铭注入

座右铭嵌入每个 Agent 的 system prompt 头部，确保生成的所有内容（代码、图表、报告）均遵循极简美学：

```
你是 DataPilot 的 [角色] Agent。

座右铭：真正的创新源于简洁与美感的平衡。专注于呈现最本质的价值，去除所有不必要的干扰。

...
```

`STYLE_GUIDE.motto` 字段同步传递给 Plot 与 Report Agent，使可视化与报告风格一致。

---

## 附录：项目目录结构

```
datapilot-desktop/
├── package.json
├── electron.vite.config.ts
├── electron-builder.yml
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
├── .env.example
├── resources/
│   ├── samples/                # 5 个示例 CSV + schema.json
│   └── fonts/                  # 本地 woff2 字体
├── src/
│   ├── main/                   # Electron 主进程
│   │   ├── index.ts            # 应用入口 + 窗口 + IPC 注册 + Python 检测
│   │   ├── config.ts           # PATHS / SANDBOX_CONFIG / AGENT_CONFIG
│   │   └── ipc/
│   │       ├── agent.ipc.ts    # Agent 调度 + 取消
│   │       ├── data.ipc.ts     # 样例加载 + 文件上传
│   │       └── storage.ipc.ts  # 看板 CRUD
│   ├── preload/
│   │   ├── index.ts            # contextBridge 安全 API
│   │   └── api.d.ts            # DataPilotAPI 类型声明
│   ├── renderer/
│   │   ├── index.html          # HTML 入口 + CSP + 字体声明
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx         # HashRouter + 导航
│   │       ├── pages/          # HomePage / AnalyzePage / DashboardsPage
│   │       ├── components/     # 6 个核心组件
│   │       ├── store/appStore.ts
│   │       └── styles/         # theme.css / globals.css
│   ├── agents/                 # PocketFlow 多 Agent 系统
│   │   ├── index.ts            # Flow 构建 + runAgent
│   │   ├── llm/LLMClient.ts
│   │   ├── shared/             # types / config / styleGuide / capabilities / prompts
│   │   ├── orchestrator/
│   │   ├── deep-research/
│   │   ├── analysis/
│   │   ├── plot/
│   │   └── report/
│   ├── sandbox/
│   │   ├── SandboxManager.ts
│   │   ├── Protocol.ts
│   │   └── python/
│   │       ├── harness.py
│   │       ├── requirements.txt
│   │       └── capabilities.json
│   ├── storage/SQLiteStore.ts
│   └── types/
│       ├── ipc.ts              # IPC 通道常量与载荷类型
│       └── shared.ts           # 跨进程共享类型（无 Node 依赖）
├── tests/
│   ├── sandbox.test.ts        # 沙箱单元测试（12/12）
│   └── e2e.test.ts             # Playwright Electron e2e
└── docs/
    ├── ARCHITECTURE.md         # 本文档
    └── AGENT_DESIGN.md         # Agent 设计与场景验证
```
