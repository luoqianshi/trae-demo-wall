/**
 * CodingAgent 核心类型 — 单一编码 Agent，自主调用工具完成数据科学任务。
 *
 * 与旧多阶段流水线的区别：
 *   - 不再有 Orchestrator / Analysis / Plot / Report 分阶段 Agent
 *   - 一个 CodingAgent 自主决策：执行代码、搜索、生成图表、撰写报告
 *   - 工具调用采用 OpenAI function-calling 格式
 *   - 200K 上下文窗口（滑动窗口 + 摘要压缩）
 */

import type { ExecuteResult } from '../../sandbox/Protocol'
import type { DatasetContext } from '../../types/shared'

// ============================================================
// 工具定义
// ============================================================

/** 工具名称枚举 */
export type ToolName =
  | 'sandbox_execute'
  | 'web_search'
  | 'web_fetch'
  | 'generate_chart'
  | 'generate_report'

/** 工具参数 schema（OpenAI function-calling 格式） */
export interface ToolDefinition {
  name: ToolName
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, {
      type: string
      description: string
      enum?: string[]
      items?: { type: string }
    }>
    required: string[]
  }
}

/** 工具调用请求 */
export interface ToolCall {
  id: string
  name: ToolName
  arguments: Record<string, unknown>
}

/** 工具调用结果 */
export interface ToolResult {
  toolCallId: string
  name: ToolName
  success: boolean
  output: string      // 给 LLM 看的文本摘要
  data?: unknown      // 结构化数据（图表、报告等）
  error?: string
}

// ============================================================
// 消息类型
// ============================================================

/** 消息角色 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

/** 对话消息（扩展 OpenAI 格式） */
export interface AgentMessage {
  role: MessageRole
  content: string | null
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string  // JSON string
    }
  }>
  tool_call_id?: string
  name?: string
}

// ============================================================
// Agent 配置
// ============================================================

export interface CodingAgentConfig {
  /** 最大迭代次数（每次迭代 = 一次 LLM 调用 + 工具执行） */
  maxIterations: number
  /** 上下文窗口 token 上限 */
  maxContextTokens: number
  /** 触发压缩的 token 阈值 */
  compressThreshold: number
  /** LLM 调用超时 (ms) */
  llmTimeout: number
  /** 单次代码执行超时 (ms) */
  executeTimeout: number
}

export const DEFAULT_CODING_AGENT_CONFIG: CodingAgentConfig = {
  maxIterations: 30,
  maxContextTokens: 200_000,
  compressThreshold: 160_000,
  llmTimeout: 120_000,
  executeTimeout: 120_000,
}

// ============================================================
// 执行上下文
// ============================================================

export interface AgentContext {
  sessionId: string
  goal: string
  dataset?: DatasetContext
  /** 图表风格 ID（minimal-dark / clean-white / data-journal / warm-paper / modern-glass） */
  styleId?: string
  /** 自定义风格 prompt（用户自定义风格时使用） */
  customStylePrompt?: string
  /** API 端口（主进程内嵌 Express 服务，供看板 iframe 查询 SQL） */
  apiPort?: number
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
  priorResults?: {
    analysisResults?: unknown[]
    chartSpecs?: unknown[]
    researchFindings?: unknown[]
    report?: unknown
  }
  cancelled: boolean
  onProgress?: (event: AgentProgressEvent) => void
}

// ============================================================
// 进度事件
// ============================================================

export interface AgentProgressEvent {
  type: 'thinking' | 'thinking_complete' | 'replace_thinking' | 'tool_call' | 'tool_result' | 'code_executed' | 'chart_generated' | 'report_generated' | 'dashboard_generated' | 'token_usage' | 'complete' | 'error'
  message: string
  data?: unknown
  timestamp: string
}

// ============================================================
// 最终结果
// ============================================================

export interface CodingAgentResult {
  goal: string
  answer: string        // LLM 最终回答（自然语言总结）
  // 工具产出物
  executedCode: string[]
  analysisResults: Array<{
    title: string
    code: string
    stdout: string
    stderr: string
    result: unknown
    durationMs: number
    retries: number
  }>
  charts: Array<{
    title: string
    figure: object
    reasoning: string
  }>
  report?: {
    title: string
    content: string
  }
  /** 生成的看板 HTML（自包含文件） */
  dashboardHTML?: string
  // 审计
  toolCalls: Array<{ name: string; success: boolean; durationMs: number }>
  errors: string[]
  iterations: number
}