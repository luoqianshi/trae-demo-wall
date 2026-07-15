/**
 * CodingAgent — 单一编码 Agent，自主调用工具完成数据科学任务。
 *
 * 核心循环：
 *   1. 构建 system prompt（含工具定义 + 数据集上下文 + 前序结果）
 *   2. LLM 调用 → 返回 tool_calls 或纯文本 answer
 *   3. 如果是 tool_calls → 并行执行工具 → 结果追加到消息 → 回到步骤 2
 *   4. 如果是纯文本 → 任务完成，汇总结果
 *   5. 上下文窗口管理：每轮检查 token 数，超限时压缩
 *
 * 与旧多阶段流水线的区别：
 *   - 不再有 Orchestrator 决策路由 → LLM 自己决定调用哪个工具
 *   - 不再有固定分析/图表/报告阶段 → LLM 自主决定流程
 *   - 200K 上下文窗口 → 支持长对话和复杂多步骤任务
 */

import type { LLMClient } from '../llm/LLMClient'
import type { SandboxManager } from '../../sandbox/SandboxManager'
import type { DatasetContext } from '../../types/shared'
import {
  type AgentContext,
  type AgentMessage,
  type AgentProgressEvent,
  type CodingAgentResult,
  type ToolCall,
  type ToolResult,
  DEFAULT_CODING_AGENT_CONFIG,
} from './types'
import { buildSystemPrompt } from './prompts'
import { compressContext, getContextSize } from './context'
import { TOOL_DEFINITIONS, executeTool, toolResultToMessage, type ToolExecutorDeps } from './tools/registry'

export class CodingAgent {
  private config = DEFAULT_CODING_AGENT_CONFIG

  constructor(
    private llm: LLMClient,
    private sandbox: SandboxManager,
  ) {}

  /**
   * 运行 Agent 完成用户目标。
   */
  async run(ctx: AgentContext): Promise<CodingAgentResult> {
    // 结果收集
    const charts: CodingAgentResult['charts'] = []
    const executedCode: string[] = []
    const reportContent = { value: '' }
    const pendingFigures: ToolExecutorDeps['pendingFigures'] = []

    const toolDeps: ToolExecutorDeps = {
      sandbox: this.sandbox,
      sessionId: ctx.sessionId,
      llm: this.llm,
      dataset: ctx.dataset,
      styleId: ctx.styleId,
      apiPort: ctx.apiPort,
      charts,
      executedCode,
      reportContent,
      executeTimeout: this.config.executeTimeout,
      pendingFigures,
    }

    const toolCalls: CodingAgentResult['toolCalls'] = []
    const errors: string[] = []

    // 构建初始消息
    const datasetSummary = this.buildDatasetSummary(ctx.dataset)
    const priorSummary = this.buildPriorSummary(ctx)
    const systemPrompt = buildSystemPrompt(ctx.goal, datasetSummary, priorSummary, ctx.styleId, ctx.customStylePrompt)

    const messages: AgentMessage[] = [
      { role: 'system', content: systemPrompt },
    ]

    // 多轮对话历史
    if (ctx.conversationHistory && ctx.conversationHistory.length > 0) {
      const historySummary = ctx.conversationHistory
        .map((m) => `${m.role === 'user' ? '用户' : '助手'}: ${m.content.slice(0, 500)}`)
        .join('\n')
      messages.push({
        role: 'user',
        content: `[之前的对话历史]\n${historySummary}\n\n现在请继续处理用户目标："${ctx.goal}"`,
      })
    } else {
      messages.push({
        role: 'user',
        content: ctx.goal,
      })
    }

    // 工具定义
    const tools = TOOL_DEFINITIONS.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }))

    // === 主循环 ===
    let iteration = 0
    let finalAnswer = ''

    while (iteration < this.config.maxIterations) {
      if (ctx.cancelled) {
        finalAnswer = '任务已被用户取消。'
        break
      }

      iteration++

      // 上下文压缩检查
      const contextSize = getContextSize(messages)
      if (contextSize > this.config.compressThreshold) {
        const { messages: compressed, compressed: didCompress } = compressContext(messages, {
          maxTokens: this.config.maxContextTokens,
          compressThreshold: this.config.compressThreshold,
        })
        if (didCompress) {
          messages.length = 0
          messages.push(...compressed)
          this.emitProgress(ctx, 'thinking', `上下文窗口压缩 (${contextSize} → ${getContextSize(messages)} tokens)`)
        }
      }

      // LLM 调用（流式 — 实时展示思考过程）
      let accumulatedThinking = ''

      let llmResponse: {
        content: string | null
        tool_calls?: Array<{
          id: string
          type: 'function'
          function: { name: string; arguments: string }
        }>
      }

      try {
        llmResponse = await this.callLLMStreaming(messages, tools, (token) => {
          accumulatedThinking += token
          this.emitProgress(ctx, 'thinking', accumulatedThinking, {
            iteration,
            thinking: accumulatedThinking,
          })
        })
      } catch (err) {
        const errorMsg = `LLM 调用失败: ${err instanceof Error ? err.message : String(err)}`
        errors.push(errorMsg)
        this.emitProgress(ctx, 'error', errorMsg)
        finalAnswer = `任务执行失败: ${errorMsg}`
        break
      }

      // 发送 token 用量（供 UI 显示上下文窗口进度）
      const currentTokens = getContextSize(messages)
      const maxTokens = ctx.maxTokens || 200_000
      this.emitProgress(ctx, 'token_usage', '', {
        estimated: currentTokens,
        max: maxTokens,
      })

      // 判断是否有 tool_calls
      if (llmResponse.tool_calls && llmResponse.tool_calls.length > 0) {
        // 思考完成 → 折叠
        if (accumulatedThinking) {
          this.emitProgress(ctx, 'thinking_complete', accumulatedThinking, {
            iteration,
            thinking: accumulatedThinking,
            toolCalls: llmResponse.tool_calls.map((tc) => tc.function.name),
          })
        }

        // 添加 assistant 消息（含 tool_calls）
        messages.push({
          role: 'assistant',
          content: llmResponse.content,
          tool_calls: llmResponse.tool_calls,
        })

        // 并行执行工具
        const toolResults: ToolResult[] = []
        for (const tc of llmResponse.tool_calls) {
          const toolCall: ToolCall = {
            id: tc.id,
            name: tc.function.name as ToolCall['name'],
            arguments: JSON.parse(tc.function.arguments),
          }

          this.emitProgress(ctx, 'tool_call', `调用 ${toolCall.name}`, toolCall)

          const startTime = Date.now()
          const result = await executeTool(toolCall, toolDeps)
          const durationMs = Date.now() - startTime

          toolCalls.push({ name: toolCall.name, success: result.success, durationMs })
          toolResults.push(result)

          if (result.success) {
            this.emitProgress(ctx, 'tool_result', `✓ ${toolCall.name} (${durationMs}ms)`, result)
            // generate_dashboard 成功后发射 dashboard_generated 事件
            if (toolCall.name === 'generate_dashboard' && result.data) {
              this.emitProgress(ctx, 'dashboard_generated', '看板已生成', result.data)
            }
          } else {
            errors.push(result.error || `工具 ${toolCall.name} 执行失败`)
            this.emitProgress(ctx, 'error', `✗ ${toolCall.name}: ${result.error}`, result)
          }
        }

        // 将工具结果追加到消息
        for (const tr of toolResults) {
          messages.push(toolResultToMessage(tr))
        }
      } else {
        // 纯文本回答 = 最终答案，不是思考。
        // 把已流式展示的 thinking 步骤替换为最终答案。
        if (accumulatedThinking) {
          this.emitProgress(ctx, 'replace_thinking', accumulatedThinking, {
            iteration,
          })
        }
        messages.push({
          role: 'assistant',
          content: llmResponse.content,
        })
        finalAnswer = llmResponse.content || '任务完成。'
        break
      }
    }

    // 迭代耗尽
    if (iteration >= this.config.maxIterations && !finalAnswer) {
      finalAnswer = `已达到最大迭代次数 (${this.config.maxIterations})。已执行的分析结果已汇总。`
    }

    // 构建最终结果
    const analysisResults: CodingAgentResult['analysisResults'] = []
    const codeSet = new Set<string>()
    for (const code of executedCode) {
      if (!codeSet.has(code)) {
        codeSet.add(code)
        analysisResults.push({
          title: `代码片段 ${analysisResults.length + 1}`,
          code,
          stdout: '',
          stderr: '',
          result: null,
          durationMs: 0,
          retries: 0,
        })
      }
    }

    this.emitProgress(ctx, 'complete', 'Agent 执行完成', {
      iterations: iteration,
      charts: charts.length,
      analysis: analysisResults.length,
      hasReport: !!reportContent.value,
    })

    return {
      goal: ctx.goal,
      answer: finalAnswer,
      executedCode,
      analysisResults,
      charts,
      report: reportContent.value
        ? { title: ctx.goal, content: reportContent.value }
        : undefined,
      dashboardHTML: toolDeps.dashboardHTML,
      toolCalls,
      errors,
      iterations: iteration,
    }
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 流式调用 LLM（支持 function-calling），逐 token 回调思考内容。
   */
  private async callLLMStreaming(
    messages: AgentMessage[],
    tools: Array<{
      type: 'function'
      function: { name: string; description: string; parameters: object }
    }>,
    onToken: (token: string) => void
  ): Promise<{
    content: string | null
    tool_calls?: Array<{
      id: string
      type: 'function'
      function: { name: string; arguments: string }
    }>
  }> {
    return this.llm.streamCompleteWithTools(
      messages.map((m) => ({
        role: m.role,
        content: m.content || '',
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
        ...(m.name ? { name: m.name } : {}),
      })),
      tools,
      onToken,
      { temperature: 0.3 }
    )
  }

  /**
   * 构建数据集上下文摘要。
   */
  private buildDatasetSummary(dataset?: DatasetContext): string {
    if (!dataset) return '数据集：无（用户未上传数据文件）'

    const cols = dataset.schema.columns.join(', ')
    let summary = `数据集：${dataset.name || '已上传'}
- 列名: ${cols}
- 数据类型: ${JSON.stringify(dataset.schema.dtypes)}
- 形状: ${dataset.schema.shape[0]} 行 × ${dataset.schema.shape[1]} 列
${dataset.samplePath ? `- 文件路径: ${dataset.samplePath}` : ''}
${dataset.head ? `- 前 5 行样本:\n${JSON.stringify(dataset.head, null, 2)}` : ''}`

    return summary
  }

  /**
   * 构建前序结果摘要。
   */
  private buildPriorSummary(ctx: AgentContext): string {
    if (!ctx.priorResults) return ''

    const parts: string[] = ['## 前序会话已累积的结果']

    const analysisResults = ctx.priorResults.analysisResults as any[] | undefined
    if (analysisResults && analysisResults.length > 0) {
      parts.push(`- 分析结果: ${analysisResults.length} 条`)
      for (const a of analysisResults.slice(0, 3)) {
        const preview = typeof a.result === 'string' ? a.result.slice(0, 100) : JSON.stringify(a.result).slice(0, 100)
        parts.push(`  - "${a.title}": ${preview}`)
      }
    }

    if (ctx.priorResults.chartSpecs && (ctx.priorResults.chartSpecs as any[]).length > 0) {
      parts.push(`- 图表: ${(ctx.priorResults.chartSpecs as any[]).length} 个`)
    }

    if (ctx.priorResults.report) {
      parts.push(`- 报告: 已生成`)
    }

    return parts.length > 1 ? parts.join('\n') : ''
  }

  /**
   * 发送进度事件。
   */
  private emitProgress(
    ctx: AgentContext,
    type: AgentProgressEvent['type'],
    message: string,
    data?: unknown
  ): void {
    ctx.onProgress?.({
      type,
      message,
      data,
      timestamp: new Date().toISOString(),
    })
  }
}