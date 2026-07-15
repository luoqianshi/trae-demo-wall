/**
 * DataPilot Agent 系统 — PiAgent 入口。
 *
 * 架构（pi-mono 重构后）：
 *   使用 pi-agent-core 的 Agent 运行时替代原有的 CodingAgent 手动工具循环。
 *   pi-agent-core 提供：
 *    - 内置 turn-based 工具调用循环
 *    - 事件流（agent_start → turn_start → message_update → tool_execution → turn_end → agent_end）
 *    - 状态管理（AgentState）
 *    - 多 Provider LLM 支持（via pi-ai）
 *
 * 保留：runAgent() 签名不变（IPC 层兼容），输出映射为 SharedStore 格式。
 */

import { LLMClient } from './llm/LLMClient'
import { SandboxManager } from '../sandbox/SandboxManager'
import { PiAgent } from './pi/PiAgent'
import type { DatasetContext, ProgressEvent } from '../types/shared'
import { SharedStore, AgentStep } from './shared/types'
import { STYLE_GUIDE } from './shared/styleGuide'

/**
 * 运行 Agent 系统（PiAgent 实现）。
 *
 * @param goal 用户目标（自然语言）
 * @param dataset 数据集上下文（可选）
 * @param llm LLM 客户端
 * @param sandbox 沙箱管理器
 * @param sessionId 沙箱会话 ID
 * @param control 取消信号（IPC 层置 control.cancelled = true）
 * @param onProgress 进度回调
 * @param conversationHistory 多轮对话历史（文字）
 * @param priorState 前一轮 Agent 状态（累积结果快照）
 * @returns 最终的 SharedStore（兼容旧格式）
 */
export async function runAgent(
  goal: string,
  dataset: DatasetContext | undefined,
  llm: LLMClient,
  sandbox: SandboxManager,
  sessionId: string,
  control: { cancelled: boolean },
  onProgress?: (e: ProgressEvent) => void,
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[],
  priorState?: {
    sessionId?: string
    datasetId?: string
    analysisResults?: unknown[]
    chartSpecs?: unknown[]
    researchFindings?: unknown[]
    report?: unknown
  },
  styleId?: string,
  customStylePrompt?: string,
  apiPort?: number
): Promise<SharedStore> {
  const llmConfig = llm.getConfig()

  const agent = await PiAgent.create({
    sessionId,
    goal,
    dataset,
    sandbox,
    llmConfig: {
      apiKey: llmConfig.apiKey,
      baseURL: llmConfig.baseURL,
      model: llmConfig.model,
    },
    styleId,
    customStylePrompt,
    apiPort,
    conversationHistory,
    priorState: priorState
      ? {
          analysisResults: priorState.analysisResults || [],
          chartSpecs: priorState.chartSpecs || [],
          researchFindings: priorState.researchFindings || [],
          report: priorState.report || null,
        }
      : undefined,
  })

  if (onProgress) {
    agent.setProgressCallback(onProgress)
  }

  // 轮询同步取消信号
  const syncCancel = setInterval(() => {
    if (control.cancelled) {
      agent.abort()
    }
  }, 200)

  let result: Awaited<ReturnType<typeof agent.run>>
  try {
    result = await agent.run()
  } finally {
    clearInterval(syncCancel)
  }

  // 映射 PiSharedStore → SharedStore（兼容旧 IPC 输出格式）
  const shared: SharedStore = {
    sessionId,
    goal,
    styleGuide: STYLE_GUIDE,
    dataset,
    conversationHistory: conversationHistory || [],
    researchFindings: [],
    analysisResults: result.analysisResults.map(a => ({
      title: a.title,
      code: '',
      stdout: '',
      stderr: '',
      result: a.content,
      durationMs: 0,
      retries: 0,
    })),
    chartSpecs: result.charts.map(c => ({
      title: c.title,
      figure: c.figure,
      reasoning: c.reasoning,
      source: 'agent' as const,
    })),
    report: result.reportContent.value
      ? {
          title: goal,
          sections: [{ heading: '报告', content: result.reportContent.value }],
          generatedAt: new Date().toISOString(),
        }
      : undefined,
    dashboardHTML: result.dashboardHTML || undefined,
    steps: [],
    iteration: result.analysisResults.length,
    errors: [],
    currentTask: '',
    currentAction: null,
    cancelled: false,
    onProgress,
  }

  // 发送完成事件
  onProgress?.({
    type: 'complete',
    message: `Agent 执行完成 (${result.charts.length} 图表, ${result.analysisResults.length} 分析)`,
    data: {
      steps: 0,
      charts: result.charts.length,
      analysis: result.analysisResults.length,
      hasReport: !!result.reportContent.value,
      hasDashboard: !!result.dashboardHTML,
    },
    timestamp: new Date().toISOString(),
  })

  // 发送看板就绪事件
  if (result.dashboardHTML) {
    onProgress?.({
      type: 'dashboard_ready',
      message: '看板已生成',
      data: { dashboardHTML: result.dashboardHTML },
      timestamp: new Date().toISOString(),
    })
  }

  return shared
}