# DataPilot Desktop — Agent 设计文档

> 本文档描述 DataPilot 桌面端 Agent 系统的设计理念、架构、各 Agent 详细实现、Prompt 设计、自纠错机制、进度推送以及复杂场景规划。

---

## 1. 设计理念

### 1.1 Goal-driven（目标驱动）

DataPilot Agent 系统采用 **目标驱动** 的设计哲学：给 Agent **目标（goal）+ 运行环境（harness）+ 风格指导（style guide）**，而 **不预设具体的数据处理逻辑**。

- 目标（`goal`）：用户用自然语言表达的分析意图，例如「分析茅台近一年股价走势」。
- 运行环境（harness）：LLM 客户端、Python 沙箱、能力清单（`capabilities.json`）共同构成 Agent 可调用的工具集。
- 风格指导（`StyleGuide`）：从配色、字体到图表选型原则的全局美学约束。

Agent 依据目标与数据特征 **自主选择** 分析方法与图表类型，而不是按模板走固定流程。这一点在 Prompt 中被明确强调：

```
不要预设分析方法，根据数据特征和任务目标自主选择最合适的分析方式
```

### 1.2 座右铭

整套系统以同一句座右铭贯穿始终，它被写入 `STYLE_GUIDE.motto`，并嵌在每个 Agent 的 system prompt 头部：

> **真正的创新源于简洁与美感的平衡。专注于呈现最本质的价值，去除所有不必要的干扰。**

### 1.3 参考 PocketFlow 的极简实现哲学

DataPilot 的 Agent 调度建立在 [PocketFlow](https://github.com/PocketFlowAI/PocketFlow) 之上。PocketFlow 的核心是极简：

- 只有 `Node`（prep/exec/post 三段式）与 `Flow`（action 路由）两个原语；
- Node 之间靠 **action 字符串** 路由；
- 跨 Node 的状态通过 `SharedStore` 传递。

DataPilot 没有引入额外的框架层，而是在 PocketFlow 的 `Node` 之上直接实现 5 个业务 Agent 与 1 个 Orchestrator。这种「薄层 + 强约定」的方式与 PocketFlow 的极简哲学一致：**能用 SharedStore 解决的，就不在 Node 实例上挂状态；能用 action 路由解决的，就不引入额外的图引擎。**

---

## 2. Agent 架构总览

### 2.1 Orchestrator Pattern

整体采用 **Orchestrator 调度模式**：一个 `OrchestratorNode` 充当总调度，根据用户目标与已完成步骤决定下一步调用哪个子 Agent。

路由结构（见 `src/agents/index.ts`）：

```
orchestrator --on('deep_research')--> deepResearch --next--> orchestrator
orchestrator --on('analysis')-------> analysis -----next--> orchestrator
orchestrator --on('plot')-----------> plot ---------next--> orchestrator
orchestrator --on('report')---------> report -------next--> orchestrator
orchestrator --on('done')-----------> terminal（空 Node，Flow 结束）
```

关键约定：

- Orchestrator 的 `post()` 返回的 action（`deep_research` / `analysis` / `plot` / `report`）决定路由到哪个子 Agent。
- 子 Agent 的 `post()` 返回 **`'default'`**，回到 Orchestrator 进入下一轮调度循环。
- 当 Orchestrator 判定任务完成或触发上限时返回 **`'done'`**，路由到一个空 `Node<SharedStore>` 终端，Flow 随之结束。

每一轮迭代的流程：

1. Orchestrator 调用 LLM（`completeJSON`）得到 `OrchestratorDecision { action, reasoning, task }`；
2. `post()` 将 `currentTask` / `currentAction` 写入 SharedStore，push step，emit 进度；
3. 检查 `cancelled` 与 `MAX_ITERATIONS`，命中则返回 `'done'`，否则返回 `decision.action`。

保护机制：

- **`MAX_ITERATIONS = 10`**（`AGENT_CONFIG.maxIterations`）：防止 Orchestrator 与子 Agent 之间无限循环。
- **`cancelled` 信号**：IPC 层通过 `control.cancelled = true` 置位，Orchestrator 在 `post()` 中轮询检查，命中即返回 `'done'` 提前终止。

### 2.2 SharedStore 作为通信总线

Agent 之间的参数传递 **只能走 SharedStore**（`src/agents/shared/types.ts` 中的 `SharedStore`），原因有二：

1. **PocketFlow 的 action 只是字符串**，无法承载「给子 Agent 的任务描述」这类结构化信息。因此 DataPilot 在 SharedStore 上额外定义了 `currentTask` 与 `currentAction` 两个字段，由 Orchestrator 在 `post()` 中写入，子 Agent 在 `prep()` 中读取。
2. **可变运行状态必须放在 SharedStore 中，不能挂在 Node 实例上**。PocketFlow 的 Flow 每轮会 clone 节点，虽然用 `Object.assign` 拷贝实例字段（如 `this.llm`），但可变状态（如累积的 `analysisResults`、`steps`）若挂在实例上会随 clone 丢失或错乱。

SharedStore 的核心字段：

| 字段 | 用途 |
| --- | --- |
| `goal` | 用户目标（整次运行不变） |
| `styleGuide` | 风格指导（注入 Prompt） |
| `dataset?` | 数据集上下文 |
| `currentTask` / `currentAction` | Orchestrator → 子 Agent 的任务传递通道 |
| `researchFindings[]` | DeepResearch 累积结果 |
| `analysisResults[]` | Analysis 累积结果 |
| `chartSpecs[]` | Plot 累积结果 |
| `report?` | Report 输出 |
| `steps[]` | 审计日志（权威步骤记录） |
| `iteration` | 迭代计数 |
| `errors[]` | 错误累积 |
| `cancelled` | 取消信号 |
| `onProgress?` | 进度回调（向 IPC 层推送） |

---

## 3. 各 Agent 详细设计

### 3.1 OrchestratorNode

文件：`src/agents/orchestrator/OrchestratorNode.ts`

**Constructor**：`super(1, 0)` — `maxRetries=1, wait=0`。这是一次决策类 LLM 调用，不重试（决策失败应由上层处理，而非原地重试相同输入）。

**prep**：组装调度上下文
- `goal`：用户目标
- `dataset_summary`：由 `summarizeDataset()` 生成（`名称 (行×列)\n列: ...`），无数据集时为 `'无数据集'`
- `completed_steps`：已完成的步骤摘要（`agent: action` 逐行拼接），无则为 `'（无）'`
- `iteration`：当前迭代进度，格式 `当前/上限`（如 `3/10`）

**exec**：决策调用
- 用 `fill(ORCHESTRATOR_PROMPT, {...})` 填充模板
- 调 `llm.completeJSON<OrchestratorDecision>()` 得到结构化决策

**post**：写状态 + 路由
- `shared.iteration += 1`
- 写入 `currentTask` / `currentAction`
- push 一条 `orchestrator` 步骤到 `shared.steps`
- emit `orchestrator_decision` 进度事件
- 检查 `shared.cancelled` → 返回 `'done'`
- 检查 `shared.iteration >= AGENT_CONFIG.maxIterations` → 返回 `'done'`
- 否则返回 `decision.action`

**Prompt 设计**：列出 4 个可用 Agent（`deep_research` / `analysis` / `plot` / `report`），并提供决策原则：

- 先理解数据再分析，先分析再可视化，最后汇总报告
- 如果数据不足，先 `deep_research`
- 如果需要计算/统计/建模，用 `analysis`
- 如果分析结果需要可视化，用 `plot`
- 所有分析完成后再 `report`
- 任务完成时返回 `"done"`
- 不要重复调用同一 Agent 做相同的事

返回 JSON 结构：

```json
{
  "action": "deep_research" | "analysis" | "plot" | "report" | "done",
  "reasoning": "为什么选择这个 action",
  "task": "给子 Agent 的具体任务描述（自然语言目标）"
}
```

### 3.2 DeepResearchNode

文件：`src/agents/deep-research/DeepResearchNode.ts`

**Constructor**：`super(2, 1)` — 2 次尝试、1 次重试，用于应对瞬时的 LLM API 错误。

**prep**：`currentTask` + `goal` + `capabilities`（`CAPABILITIES_TEXT`，从 `capabilities.json` 注入）。

**exec**：
1. `fill(DEEP_RESEARCH_PROMPT, {...})` → LLM `complete()` 生成 Python 代码
2. `extractCode()` 提取 ```` ```python ... ``` ```` 代码块
3. `sandbox.execute(sessionId, code, 60_000)` — **60s 超时**
4. 将 stdout/result 汇总为 `ResearchFinding { source, query, summary, timestamp }`

**post**：
- push 到 `shared.researchFindings`
- push 步骤（`agent='deep_research'`, `action='data_fetch'`）
- emit `agent_step` 进度事件
- 返回 `'default'` 回到 Orchestrator

**能力边界**：
- v1 支持 **akshare** 获取股票、基金、宏观数据（如 `ak.stock_zh_a_hist`、`ak.fund_etf_hist_em`）
- **Web 搜索接口预留**，尚未实现
- 数据可保存为 CSV 供后续分析使用

**execFallback**：返回一个 `source='error'` 的 `ResearchFinding`，记录错误信息，不阻塞主流程。

### 3.3 AnalysisNode（自纠错循环）

文件：`src/agents/analysis/AnalysisNode.ts`

**Constructor**：`super(2, 1)` — Node 层的 maxRetries **仅用于 LLM API 瞬时错误**，不是代码纠错。

**核心设计**：自纠错循环在 `exec()` **内部** 用 `while` 实现，而非依赖 PocketFlow 的 `maxRetries`。

原因：
- PocketFlow 的 `maxRetries` 是 **对同一输入重试**，无法把上一轮的 `stderr` 喂回给 LLM；
- 而代码纠错恰恰需要「拿到错误信息 → 让 LLM 针对性地修正代码 → 重试」，因此必须自行管理循环。

**prep**：
- `task` = `shared.currentTask`
- `goal` = `shared.goal`
- `datasetSummary`：JSON 字符串，包含 `columns` / `dtypes` / `shape` / `head[0:5]`，无数据集时为 `'无数据集'`
- `capabilities` = `CAPABILITIES_TEXT`

**exec**（自纠错循环）：
```
code = generateCode(prepRes)        // 初始代码
lastErr = ''
retries = 0
maxFix = AGENT_CONFIG.retryLimit    // = 3

while retries <= maxFix:
    result = sandbox.execute(sessionId, code, 120_000)   // 120s 超时
    if 沙箱异常:
        lastErr = 异常信息
        if retries < maxFix: code = fixCode(prepRes, code, lastErr); retries++; continue
        else break
    if result.stderr 为空:           // 成功
        return AnalysisResult{...}
    // 有 stderr：尝试修复
    lastErr = result.stderr
    if retries < maxFix: code = fixCode(prepRes, code, lastErr)
    retries++

// 所有重试耗尽
return AnalysisResult{ stderr: lastErr, result: undefined, ... }
```

- **`maxFix = AGENT_CONFIG.retryLimit = 3`**：共 4 次尝试（1 次初始 + 3 次修正）
- **沙箱超时 120s**：分析任务通常最耗时（建模、回测等），给予最长时限

**post**：
- push 到 `shared.analysisResults`
- push 步骤（含 `code` / `result` / `error`）
- emit `code_generated` 进度事件，message 标注成功或失败及重试次数
- 若有 `stderr`，push 到 `shared.errors`
- 返回 `'default'`

**关键方法**：

- **`generateCode`**：`fill(ANALYSIS_PROMPT, {...})` → LLM `complete()` → `extractCode`。user 消息要求「将结构化返回值赋给 `result` 变量，Plotly figure 追加到 `figures` 列表，只返回代码不要解释」。
- **`fixCode`**：system prompt 内联 `prevCode` + `error`，要求 LLM「分析错误原因并修正代码」，`extractCode` 提取修正后的代码。
- **`extractCode`**：正则 `/```(?:python)?\s*([\s\S]*?)```/` 匹配 markdown 代码块；未匹配则返回原始文本（`trim()`）。

### 3.4 PlotNode

文件：`src/agents/plot/PlotNode.ts`

**Constructor**：`super(2, 1)`。

**prep**：
- `task` = `shared.currentTask`
- `analysisSummary`：遍历 `analysisResults`，每项拼成 `- title: 截断的 result/stdout（200 字）或错误信息`
- `capabilities` = `CAPABILITIES_TEXT`

**exec**：
1. `fill(PLOT_PROMPT, {...})` → LLM 生成 Plotly 代码
2. `extractCode` → `sandbox.execute(sessionId, code, 60_000)`（**60s 超时**）
3. 从 `ExecuteResult.figures` 提取 figure 数组
4. 每个 figure 提取 `layout.title.text` 作为标题，无标题则命名为 `图表 N`
5. 组装 `ChartSpec[]`（含 `title` / `figure` / `reasoning` / `source`）

**post**：
- `shared.chartSpecs.push(...charts)`
- push 步骤（`agent='plot'`, `action='generate_chart'`）
- **对每个 chart 单独 emit `chart_ready` 事件**（一图一推送，前端可逐张渲染）
- 返回 `'default'`

**bdata 编码**：Plotly figure 的二进制传输编码已在沙箱侧的 `harness.py` 中解码，PlotNode 拿到的 `figures` 已是结构化对象，无需再处理。

**Prompt 中的 chartPrinciples**（数据 → 图表类型映射）：
- 时序数据 → 折线图
- 分类对比 → 柱状图（降序）
- 占比构成 ≤ 6 类 → 环形图
- 相关性 → 散点图 + 趋势线
- 标题左对齐衬线字体
- 背景 `#ffffff`，坐标轴 `#e7e5e4`
- 品牌高亮色 `#c2410c` 仅用于关键数据点

### 3.5 ReportNode

文件：`src/agents/report/ReportNode.ts`

**Constructor**：`super(2, 1)`。

**prep**：
- `task` = `shared.currentTask`
- `goal` = `shared.goal`
- `researchFindings`：逐项 `- [source] summary` 拼接，无则 `'无'`
- `analysisResults`：逐项 `- title: 截断的 result/stdout（300 字）或错误信息`，无则 `'无'`
- `chartSpecs`：仅取标题 `- title`，无则 `'无'`

**exec**：
- `fill(REPORT_PROMPT, {...})`
- 调 `llm.streamComplete(messages, undefined, { temperature: 0.3 })` — **流式生成**
- `temperature: 0.3`：报告是事实性输出，降低创造性以减少幻觉

**post**：
- `parseReport(markdown)` → `Report { title, sections[], generatedAt }`
- 写入 `shared.report`
- push 步骤（含 markdown 前 200 字预览）
- emit `report_section` 进度事件
- 返回 `'default'`

**`parseReport`**：
- 提取首个 `# ` 标题作为 `Report.title`（无则默认 `'数据分析报告'`）
- 按 `## ` 标题分割为 `ReportSection[]`，首个 section 默认标题 `'执行摘要'`
- 跳过 `# ` 行本身（标题行不进正文）

**Prompt 结构**：要求生成包含四部分的结构化报告：
- **执行摘要**：核心发现和建议，简洁有力
- **数据来源与方法**：数据从哪里来，用了什么分析方法
- **分析发现**：每个发现配对应的图表引用（「如图表 X 所示」）
- **结论与建议**：基于分析结果给出可操作的建议

**风格**：简洁有力；关键数字用 `**加粗**`；不使用 emoji；标题用 `##` 标记，子标题用 `###`；图表引用格式 `如图表 {chart_title} 所示`。

---

## 4. Prompt 设计

所有 Prompt 定义在 `src/agents/shared/prompts.ts`。

### 4.1 共性约定

- **每个 Prompt 头部嵌入座右铭**：`座右铭：${MOTTO}`，确保美学约束贯穿每个 Agent。
- **`fill(template, vars)` 占位符替换**：使用正则 `/{(\w+)}/g` 一次性替换所有 `{var}` 占位符，**不是链式 `.replace`**。链式 `.replace` 存在顺序依赖问题（前一次替换的内容可能被后续 replace 误伤），`fill` 通过一次性正则替换规避了该问题。

  ```ts
  export function fill(template: string, vars: Record<string, string>): string {
    return template.replace(/{(\w+)}/g, (_, k: string) => vars[k] ?? '')
  }
  ```

- **Capabilities 注入**：`CAPABILITIES_TEXT` 由 `capabilities.ts` 从 `capabilities.json` 读取并 `JSON.stringify`，作为 `{capabilities}` 占位符注入各业务 Agent 的 Prompt，让 LLM 知道沙箱里有哪些 Python 库可用。
- **StyleGuide 注入**：`STYLE_GUIDE` 通过 SharedStore 持有，在 `runAgent()` 初始化时写入 `shared.styleGuide`；其 `chartPrinciples` 同时被硬编码进 Plot Prompt，确保可视化约束双重生效。

### 4.2 各 Agent Prompt 要点

- **Orchestrator**：列出 4 个可用 Agent，提供决策原则引导顺序（先理解数据→分析→可视化→报告）。
- **Analysis**：明确强调「不要预设分析方法，根据数据特征和任务目标自主选择最合适的分析方式」；要求把结构化结果赋给 `result`、Plotly figure 追加到 `figures`。
- **Plot**：`chartPrinciples` 提供数据 → 图表类型映射；要求 figure 追加到 `figures` 列表，不预设图表类型。
- **Report**：结构化四段式（执行摘要/数据来源与方法/分析发现/结论与建议）；关键数字加粗、无 emoji、`##` 分节。

---

## 5. 自纠错机制

### 5.1 位置

自纠错循环位于 **`AnalysisNode.exec()` 内部的 `while` 循环**，而非 PocketFlow 的 `maxRetries` 机制。

### 5.2 流程

```
generateCode(prepRes)            // 1. LLM 生成初始代码
  → sandbox.execute(120s)        // 2. 沙箱执行
  → 检查 stderr
  → 若有错误且 retries < maxFix:
      fixCode(prevCode, stderr)  // 3. LLM 分析 stderr 修正代码
      → 重试（回到步骤 2）
  → 若 stderr 为空: 返回成功结果
  → 若重试耗尽: 返回带 stderr 的 AnalysisResult，不阻塞主流程
```

### 5.3 参数

- **`maxFix = AGENT_CONFIG.retryLimit = 3`**：共 4 次尝试（1 次初始 + 3 次修正）。
- **沙箱超时**：
  - Analysis：**120s**（最长，支持建模/回测等耗时任务）
  - Plot / DeepResearch：**60s**

### 5.4 容错策略

- 若 4 次尝试后仍失败，返回 `AnalysisResult { stderr: lastErr, result: undefined, retries }`，**继续后续流程不阻塞**（Orchestrator 可基于错误信息决策是否重试或直接进入报告）。
- 沙箱执行异常（超时/进程退出）也走相同的 fixCode 重试路径。

---

## 6. 进度推送

### 6.1 ProgressEvent 类型与来源

`ProgressEvent` 定义于 `src/types/shared.ts`，各类型及其来源：

| type | 来源 | 说明 |
| --- | --- | --- |
| `orchestrator_decision` | `OrchestratorNode.post()` | 每轮调度决策（action + reasoning） |
| `agent_step` | `DeepResearchNode.post()` | 深度研究数据获取结果 |
| `code_generated` | `AnalysisNode.post()` | 代码执行结果（含重试次数、成功/失败） |
| `chart_ready` | `PlotNode.post()` | 每个图表单独推送一次 |
| `report_section` | `ReportNode.post()` | 报告生成完成 |
| `complete` | `runAgent()`（`flow.run()` 后） | 整体执行完成，含统计摘要 |
| `error` | 各处 | 错误事件 |

### 6.2 推送链路

```
Agent post() → shared.onProgress(event)
  → IPC: win.webContents.send(IPC.AGENT_PROGRESS, event)
    → renderer: appStore.handleProgress(event)
```

### 6.3 Renderer 处理（`appStore.handleProgress`）

`handleProgress` 将每个事件映射为 UI 更新：

- `orchestrator_decision`：追加到 `agentSteps`（实时时间线）
- `agent_step`：追加到 `agentSteps`
- `code_generated`：追加到 `agentSteps`（含 code/result/error）
- `chart_ready`：**追加到 `charts` 数组**（逐张渲染），同时追加 `agentSteps`
- `report_section`：**设置 `report`**
- `error`：设置 `agentError`

### 6.4 handleComplete 的权威覆盖

`handleComplete`（在 `IPC.AGENT_COMPLETE` 后调用）用最终的 `shared.steps` **整体替换** `agentSteps`、`charts`、`report`、`agentError`。

设计意图：`shared.steps` 是 **权威数据源**（完整、有序、无丢失），而 `handleProgress` 期间的增量更新只是为实时性服务的「乐观渲染」。最终以 `handleComplete` 的全量替换为准，避免增量推送过程中可能出现的遗漏或乱序。

---

## 7. 复杂场景设计（P7）

> 以下 5 个场景为 **规划中的验证场景**，因当前尚无可用 API Key，暂未完成端到端验证。每个场景给出预期的 Agent 调用链、验证点及潜在 Prompt 调优方向。

### 7.1 趋势分析

**示例目标**：「分析茅台近一年股价走势」

**预期调用链**：`DR → AN → PL → RP`

- `deep_research`：用 akshare 拉取茅台（600519）近一年日线数据
- `analysis`：计算收益率、波动率、均线等技术指标
- `plot`：折线图展示价格走势 + 均线叠加
- `report`：趋势总结与关键时点解读

**验证点**：
- akshare 接口正确性（`ak.stock_zh_a_hist`）
- 时序数据自动选用折线图
- 报告中关键涨跌幅数字加粗

**潜在调优**：若 LLM 对 akshare 函数名幻觉，需在 DeepResearch Prompt 中补充常用接口示例。

### 7.2 对比分析

**示例目标**：「对比深圳各区二手房均价」

**预期调用链**：`AN → PL → RP`

- `analysis`：分组聚合计算各区均价、中位数
- `plot`：水平柱状图（降序）对比各区
- `report`：排名与差异分析

**验证点**：
- 分类对比自动选用降序柱状图
- 多区数据排序正确性
- 报告中各区均价数字加粗

**潜在调优**：若数据来源为上传 CSV，需确认 Analysis 能正确读取并分组。

### 7.3 异动归因

**示例目标**：「分析微博热搜异常波动原因」

**预期调用链**：`AN(异常检测) → AN(归因) → PL → RP`

- `analysis`（第 1 次）：异常检测（如 Z-score / IQR 识别离群点）
- `analysis`（第 2 次）：归因分析（相关性、时间点对齐）
- `plot`：标注异常点的时序图
- `report`：异动原因推断与证据链

**验证点**：
- Orchestrator 能连续两次调度 `analysis` 且任务描述不同
- 自纠错能处理异常检测库的导入/参数错误
- 异常点在图表中高亮

**潜在调优**：可能需要在 Orchestrator Prompt 中强化「同一 Agent 可多次调用但任务须递进」的引导。

### 7.4 回测

**示例目标**：「回测茅台简单均线策略」

**预期调用链**：`DR → AN(回测) → PL → RP`

- `deep_research`：拉取历史行情
- `analysis`：实现均线交叉策略、计算收益曲线、夏普比率等
- `plot`：价格 + 买卖信号标注、净值曲线
- `report`：策略绩效评估

**验证点**：
- 回测代码耗时较长，120s 超时是否充足
- 多子图（价格+信号、净值曲线）生成
- 绩效指标数字加粗

**潜在调优**：若回测耗时超 120s，需考虑分段执行或放宽分析超时。

### 7.5 预测

**示例目标**：「预测深圳房价未来 3 个月」

**预期调用链**：`AN(回归) → PL(趋势+预测) → RP`

- `analysis`：回归/时间序列预测建模
- `plot`：历史趋势 + 预测区间（置信带）
- `report`：预测结论与不确定性说明

**验证点**：
- 预测区间在图表中正确渲染（如 Plotly 的 `upper`/`lower` bound）
- 报告明确标注预测的不确定性
- 预测值加粗

**潜在调优**：需在 Plot Prompt 中补充「预测区间用置信带」的指引；Report Prompt 中强调「预测须给出置信区间」。

---

## 8. 已知限制与未来方向

### 8.1 当前限制

- **DeepResearch v1 仅支持 akshare**：Web 搜索接口已预留但未实现，无法获取非金融/宏观数据。
- **无多轮对话**：当前为「单目标 → 单报告」模式，不支持基于上次结果的追问与迭代。
- **无 PDF 导出**：报告仅以 Markdown / 结构化 `Report` 形式呈现，暂不支持导出 PDF。
- **Prompt 调优待 P7 验证**：第 7 节的 5 个复杂场景尚未经 API Key 验证，Prompt 的实际效果待确认。

### 8.2 未来方向

- **MCP 集成**：计划接入 MCP（Model Context Protocol）工具，包括：
  - `AKShare-MCP`：将金融数据获取能力标准化为 MCP 工具
  - `Filesystem-MCP`：提供统一的文件系统访问能力
- **LLM 增强解读**：在分析结果之上叠加 LLM 的自然语言解读层，让结果更易理解。
- **Prompt 调优**：在 P7 场景验证后，根据实际 LLM 输出迭代各 Agent 的 Prompt，重点优化：
  - Orchestrator 的多步调度稳定性
  - Analysis 自纠错的首次成功率
  - Plot 的图表类型选择准确度
  - Report 的事实性与结构化程度

---

## 附录：关键文件索引

| 模块 | 文件 |
| --- | --- |
| Flow 构建与入口 | `src/agents/index.ts` |
| OrchestratorNode | `src/agents/orchestrator/OrchestratorNode.ts` |
| DeepResearchNode | `src/agents/deep-research/DeepResearchNode.ts` |
| AnalysisNode | `src/agents/analysis/AnalysisNode.ts` |
| PlotNode | `src/agents/plot/PlotNode.ts` |
| ReportNode | `src/agents/report/ReportNode.ts` |
| System Prompts | `src/agents/shared/prompts.ts` |
| 配置常量 | `src/agents/shared/config.ts` |
| SharedStore 类型 | `src/agents/shared/types.ts` |
| 风格指导 | `src/agents/shared/styleGuide.ts` |
| 能力清单注入 | `src/agents/shared/capabilities.ts` |
| LLM 客户端 | `src/agents/llm/LLMClient.ts` |
| 沙箱协议 | `src/sandbox/Protocol.ts` |
| 沙箱管理 | `src/sandbox/SandboxManager.ts` |
| 跨进程共享类型 | `src/types/shared.ts` |
| Agent IPC | `src/main/ipc/agent.ipc.ts` |
| Renderer Store | `src/renderer/src/store/appStore.ts` |
