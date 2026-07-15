/**
 * 跨进程共享类型定义 — 无 Node 依赖，renderer 与 main/agents 共用。
 *
 * 所有需要在前端和后端之间传递的类型都放在这里，
 * 避免 renderer 引入 Node 类型（如 child_process、Buffer 等）。
 */

// === Orchestrator ===

export type OrchestratorAction = 'deep_research' | 'analysis' | 'plot' | 'report' | 'done'

export interface OrchestratorDecision {
  action: OrchestratorAction
  reasoning: string
  task: string
}

// === 风格指导 ===

export interface StyleGuide {
  motto: string
  theme: {
    bg: string
    ink: string
    accent: string
    rule: string
    fontSerif: string
    fontSans: string
    fontMono: string
  }
  rules: string[]
  chartPrinciples: string[]
}

// === 数据集 ===

export interface DatasetContext {
  id: string
  name: string
  source: 'sample' | 'upload' | 'akshare' | 'github' | 'web'
  schema: {
    columns: string[]
    dtypes: Record<string, string>
    shape: [number, number]
  }
  head: Record<string, unknown>[]
  samplePath?: string
}

export interface DatasetSummary {
  id: string
  name: string
  description: string
  source?: 'sample' | 'upload'
  rowCount?: number
  columns?: string[]
}

// === Agent 结果 ===

export interface ResearchFinding {
  source: string
  query: string
  summary: string
  data?: Record<string, unknown>[]
  timestamp: string
}

export interface AnalysisResult {
  title: string
  code: string
  stdout: string
  stderr: string
  result: unknown
  tables?: unknown[]
  durationMs: number
  retries: number
}

export interface ChartSpec {
  title: string
  figure: object
  reasoning: string
  source: string
}

// === 报告 ===

export interface Report {
  title: string
  sections: ReportSection[]
  generatedAt: string
}

export interface ReportSection {
  heading: string
  content: string
  chartRefs?: string[]
}

// === 审计日志 ===

export interface AgentStep {
  agent: string
  action: string
  reasoning: string
  timestamp: string
  durationMs: number
  code?: string
  result?: unknown
  error?: string
}

// === 进度事件 ===

export interface ProgressEvent {
  type:
    | 'orchestrator_decision'
    | 'agent_start'
    | 'agent_step'
    | 'code_generated'
    | 'chart_ready'
    | 'report_section'
    | 'token_usage'
    | 'dashboard_ready'
    | 'error'
    | 'complete'
  agent?: string
  message: string
  data?: unknown
  timestamp: string
}

// === 看板持久化 ===

export interface Dashboard {
  id: string
  title: string
  goal: string
  datasetId?: string
  report: string
  charts: unknown[]
  steps: unknown[]
  /** 看板 HTML（自包含文件，由 Agent 的 generate_dashboard 工具生成） */
  dashboardHTML?: string | null
  createdAt: string
  updatedAt: string
}

export interface DashboardSummary {
  id: string
  title: string
  datasetId?: string
  createdAt: string
}
