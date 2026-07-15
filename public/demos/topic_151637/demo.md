# DataPilot 数据领航员 — 初赛 Demo 作品帖

---

## 【标签】

学习工作

---

## 【标题】

学习工作 — DataPilot 数据领航员

---

## 1. Demo 简介

### 是什么

DataPilot 数据领航员是一款基于 **Electron + React + TypeScript** 的桌面端对话式数据分析 Agent 应用。用户只需输入自然语言分析目标（如"分析茅台近一年股价走势"），Agent 便会自主完成数据获取、分析计算、图表生成、报告撰写全流程，最终产出可保存复用的可视化看板。

### 面向谁

- 需要做行业研究但缺乏编程能力的产品经理、运营人员
- 需要快速获取市场趋势洞察的创业者、投资人
- 需要数据分析支撑报告的学生和研究人员
- 日常工作中频繁处理临时数据分析需求的职场人士

### 主要功能

1. **Goal-Driven 对话式分析**：输入自然语言分析目标，Agent 自主决定分析方法、图表选型与报告结构，无需手动配置任何参数。支持 5 个内置示例数据集（茅台股价、深圳房价、微博热搜、GitHub 趋势、各省 GDP），也支持本地上传 CSV/Excel 文件。

2. **Python 沙箱自纠错执行**：Agent 生成的代码在隔离的 Python 沙箱中执行（pandas / numpy / plotly / duckdb / akshare / scikit-learn），出错时自动修复重试，用户无需关心底层实现。

3. **看板持久化与复用**：分析结果自动保存为可交互看板，支持 SQLite 持久化存储，关闭应用后随时回看，形成个人数据资产沉淀。

> [待填充：此处插入产品截图 1 — 应用首页概览，展示"一段对话，完成全部"的入口界面]

> [待填充：此处插入产品截图 2 — 分析工作台，展示三栏布局（数据源选择 + 对话输入 + Agent 执行时间线）]

> [待填充：此处插入产品截图 3 — 看板页面，展示已保存的交互式看板列表和详情]

---

## 2. Demo 创作思路

### 灵感来源

在 3 年数据分析工作中，我反复做"临时分析 -> 出图 -> 存档"这个动作数千次。每次都是：打开 Excel 选数据、写公式、做透视表、调图表样式、写结论——整个过程至少 30 分钟。而市面上现有工具要么只做可视化（如 Tableau，学习成本高），要么只做对话（如 ChatGPT，无法持久化看板），缺少一个从"数据获取 -> 分析 -> 可视化 -> 解读 -> 沉淀"的完整闭环。

### 想解决的问题

数据分散在各个平台，非技术人员缺乏从数据中快速提取洞察的能力。核心痛点有三：

- **工具门槛高**：现有 BI 工具需要配置数据源、建模、写 SQL，普通用户难以快速上手
- **环节割裂**：数据获取、分析、可视化、解读需要在多个工具间切换，效率低下
- **结果不可复用**：临时分析做完即丢，下次想看同样的分析又要重新做一遍

### 为什么做这个方向

选择桌面端而非 Web 端，有三个关键判断：

1. **数据隐私**：用户上传的数据和 LLM API Key 存储在本地，不上传到任何服务器
2. **Python 沙箱可控**：通过 Electron 的 child_process 管理 Python 子进程，JSON-RPC 2.0 通信，不暴露端口，安全可控
3. **Goal-Driven Agent 理念**：不预设分析方法，Agent 根据数据特征和目标自主决策——这比传统"模板化 BI"更灵活，也更符合 AI 时代的交互范式

---

## 3. Demo 体验地址

> [待填充：请三选一，并将体验方式填入下方]

**方式一（推荐）：打包为 Windows 可执行文件**

> [待填充：运行 `npm run build:win` 打包后，将生成的安装包上传到网盘/GitHub Release，在此处附上下载链接]

**方式二：从源码运行**

```bash
# 前置要求：Node.js 20.19+、Python 3.10+
git clone <仓库地址>
cd datapilot-desktop
npm install
pip install -r src/sandbox/python/requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 OPENAI_API_KEY（支持 OpenAI / DeepSeek 等兼容 API）

# 启动开发模式
npm run dev
```

> [待填充：如使用方式二，请附上 GitHub 仓库地址]

**方式三：上传 HTML 格式文件**

> [待填充：如果无法打包或提供源码，可将交互式 HTML 体验文件打包为 Zip 上传到社区]

---

## 4. TRAE 实践过程

### 开发环境

整个项目使用 **TRAE Work** 完成开发，从需求梳理、架构设计、代码编写到测试调试，全部由 TRAE 的 AI Agent 协同完成。

### 关键开发步骤

1. **项目初始化与架构搭建**：通过 TRAE 对话，描述"一个基于 Electron 的桌面端数据分析 Agent 应用"的需求，TRAE 生成了完整的项目骨架，包括 Electron 三进程架构、React 前端框架、PocketFlow.js Agent 编排层、Python 沙箱通信协议。

2. **Agent 系统设计与实现**：与 TRAE 多轮对话，逐步细化 Agent 的 Goal-Driven 设计理念——从最初的简单流水线，演进到 Orchestrator 调度模式（5 个专业 Agent：DeepResearch / Analysis / Plot / Report），最后重构为单一 CodingAgent 自主调用 6 个工具的统一架构。

3. **Python 沙箱对接**：通过 TRAE 实现了 Node.js 与 Python 子进程之间的 JSON-RPC 2.0 通信协议，支持代码执行、结果回传、错误捕获与自纠错循环，同时确保沙箱隔离安全。

4. **UI 组件开发**：使用 TRAE 生成了三栏布局分析工作台（数据源选择 + 对话输入 + Agent 时间线）、Plotly 图表渲染、Markdown 报告渲染、看板管理等核心 UI 组件，遵循白色极简主题设计规范。

5. **测试与调试**：TRAE 协写了沙箱单元测试（12 个用例）和 Playwright E2E 测试，确保核心链路稳定。

> [待填充：此处插入 TRAE 开发截图 1 — 展示在 TRAE Work 中与 AI 对话，描述项目需求或架构设计的过程]

> [待填充：此处插入 TRAE 开发截图 2 — 展示 TRAE 生成关键代码模块的过程，如 Agent 系统、沙箱通信或 UI 组件]

> [待填充：此处插入 TRAE 开发截图 3 — 展示 TRAE 辅助调试或测试的过程，如修复 Bug、运行测试用例]

### 关键 Session ID

以下 Session ID 对应上述开发过程中的关键任务对话，用于证明本作品由 TRAE 开发完成：

> [待填充：Session ID 1 — 对应"项目初始化与架构搭建"阶段的对话，在 TRAE 中双击对话复制 Session ID]
> 
> [待填充：Session ID 2 — 对应"Agent 系统设计与实现"或"Python 沙箱对接"阶段的对话]
> 
> [待填充：Session ID 3 — 对应"UI 组件开发"或"测试调试"阶段的对话]
> 
> [待填充：如有更多关键 Session ID，可继续追加，建议不少于 3 个]

### 技术栈一览

| 层 | 选型 | 说明 |
|---|------|------|
| 桌面框架 | Electron 31 + electron-vite | 跨平台桌面应用，本地管理 Python 沙箱 |
| 前端 | React 18 + TypeScript + Zustand 4 | 三栏布局分析工作台 |
| Agent 框架 | PocketFlow.js 1.0.4 | ~100 行极简框架，Orchestrator 调度模式 |
| 图表 | Plotly.js + react-plotly.js | 交互式数据可视化 |
| 沙箱 | Python child_process + JSON-RPC 2.0 | 零 Docker 依赖，stdio 双向通信 |
| 存储 | better-sqlite3 (WAL 模式) | 看板持久化，本地存储 |
| 测试 | Vitest + Playwright | 单元测试 + E2E 测试 |

### 项目结构

```
datapilot-desktop/
├── src/
│   ├── main/              # Electron 主进程（IPC 注册、Python 运行时检测）
│   ├── preload/           # contextBridge 安全 API
│   ├── renderer/          # React 前端（3 页面 + 6 组件 + Zustand）
│   ├── agents/            # CodingAgent + 6 工具（web_search/sandbox/chart/report/...）
│   ├── sandbox/           # Python 沙箱（harness.py + SandboxManager.ts）
│   ├── storage/           # SQLite 持久化
│   └── types/             # 跨进程共享类型
├── resources/samples/     # 5 份内置样例数据
├── tests/                 # 沙箱单元测试 + E2E 测试
└── docs/                  # 架构文档 + Agent 设计文档
```

---

## 报名帖链接

> [待填充：请附上你在 TRAE 社区已经审核通过的报名帖链接]

---

## 开发心得（补充）

> [待填充（可选但建议填写）：分享一下开发过程中踩过的坑、解决思路、或者使用 TRAE 的心得体会。比如：
> - 从多 Agent 流水线重构为单一 CodingAgent 的决策过程
> - JSON-RPC 2.0 沙箱通信协议的设计取舍
> - 200K 上下文窗口的滑动窗口压缩策略
> - TRAE 帮你解决了哪些你原本搞不定的问题]