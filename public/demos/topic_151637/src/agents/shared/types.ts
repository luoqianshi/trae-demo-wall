/**
 * Agent 间共享存储类型 — PocketFlow Flow 的 SharedStore。
 *
 * 可变运行状态必须放在这里，不能挂在 Node 实例上
 * （PocketFlow 每轮会 clone 节点，但 Object.assign 拷贝实例字段）。
 */

import {
  StyleGuide,
  DatasetContext,
  ResearchFinding,
  AnalysisResult,
  ChartSpec,
  Report,
  AgentStep,
  ProgressEvent,
  OrchestratorAction
} from '../../types/shared'

export interface SharedStore {
  sessionId: string
  goal: string
  styleGuide: StyleGuide
  dataset?: DatasetContext

  // 多轮对话历史
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]

  // Agent 间结果累积
  researchFindings: ResearchFinding[]
  analysisResults: AnalysisResult[]
  chartSpecs: ChartSpec[]
  report?: Report
  /** 看板 HTML（自包含文件，由 generate_dashboard 工具生成） */
  dashboardHTML?: string

  // 审计日志
  steps: AgentStep[]
  iteration: number
  errors: string[]

  // Orchestrator → sub-agent 任务传递（PocketFlow action 只是字符串，无法承载任务描述）
  currentTask: string
  currentAction: OrchestratorAction | null

  // 取消信号
  cancelled: boolean

  // 进度回调（向 IPC 层推送）
  onProgress?: (event: ProgressEvent) => void
}

// Re-export 共享类型，方便 agents 统一导入
export type {
  StyleGuide,
  DatasetContext,
  ResearchFinding,
  AnalysisResult,
  ChartSpec,
  Report,
  ReportSection,
  AgentStep,
  ProgressEvent,
  OrchestratorAction,
  OrchestratorDecision
} from '../../types/shared'
