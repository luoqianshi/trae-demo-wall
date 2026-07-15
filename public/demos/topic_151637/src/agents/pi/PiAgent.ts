/**
 * PiAgent — 基于 pi-agent-core 的 Agent 封装。
 *
 * 替换原有的 CodingAgent，使用 pi-mono 的 Agent 运行时实现：
 *  - 工具调用循环（内置 turn-based loop）
 *  - 事件流（agent_start → turn_start → message_update → tool_execution → turn_end → agent_end）
 *  - 状态管理（AgentState）
 *  - 多 Provider LLM 支持（via pi-ai）
 *
 * 注意：pi-mono 包是纯 ESM，Electron 主进程是 CJS，
 * 因此使用动态 import() 加载，通过静态工厂方法 PiAgent.create() 创建。
 */

import type { AgentEvent, AgentMessage } from '@earendil-works/pi-agent-core'
import type { Model } from '@earendil-works/pi-ai'
import type { SandboxManager } from '../../sandbox/SandboxManager'
import type { DatasetContext, ProgressEvent } from '../../types/shared'
import { createTools } from './tools'
import { buildSystemPrompt } from '../coding/prompts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentClass = any

export interface PiAgentOptions {
  sessionId: string
  goal: string
  dataset?: DatasetContext
  sandbox: SandboxManager
  /** LLM 配置 */
  llmConfig: {
    apiKey: string
    baseURL?: string
    model: string
  }
  /** 图表风格 */
  styleId?: string
  customStylePrompt?: string
  /** API 端口（供看板查询 SQL） */
  apiPort?: number
  /** 对话历史 */
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
  /** 先前的会话状态 */
  priorState?: {
    analysisResults?: unknown[]
    chartSpecs?: unknown[]
    researchFindings?: unknown[]
    report?: unknown
  }
}

/** 被工具写入的共享可变状态 */
export interface PiSharedStore {
  reportContent: { value: string }
  charts: Array<{ title: string; figure: object; reasoning: string }>
  pendingFigures: Array<{ figure: object; reasoning: string }>
  executedCode: string[]
  dashboardHTML: string | null
  analysisResults: Array<{ title: string; content: string; timestamp: number }>
  researchFindings: unknown[]
}

/** 动态导入缓存 */
let _AgentClass: AgentClass | null = null

async function getAgentClass(): Promise<AgentClass> {
  if (!_AgentClass) {
    const mod = await import('@earendil-works/pi-agent-core')
    _AgentClass = mod.Agent
  }
  return _AgentClass
}

export class PiAgent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private agent: any
  private sandbox: SandboxManager
  private sessionId: string
  private goal: string
  private onProgress: (event: ProgressEvent) => void

  /** 工具输出写入的共享存储 */
  readonly sharedStore: PiSharedStore = {
    reportContent: { value: '' },
    charts: [],
    pendingFigures: [],
    executedCode: [],
    dashboardHTML: null,
    analysisResults: [],
    researchFindings: [],
  }

  /** 静态工厂方法：异步创建 PiAgent 实例 */
  static async create(options: PiAgentOptions): Promise<PiAgent> {
    const instance = new PiAgent(options)
    await instance.init(options)
    return instance
  }

  private constructor(options: PiAgentOptions) {
    this.sandbox = options.sandbox
    this.sessionId = options.sessionId
    this.goal = options.goal
    this.onProgress = () => {}
  }

  private async init(options: PiAgentOptions): Promise<void> {
    const AgentClass = await getAgentClass()

    // 创建模型
    const model = this.createModel(options.llmConfig)

    // 创建工具
    const tools = createTools({
      sandbox: this.sandbox,
      sessionId: this.sessionId,
      sharedStore: this.sharedStore,
      styleId: options.styleId,
      apiPort: options.apiPort,
    })

    // 构建系统提示词
    const datasetSummary = this.buildDatasetSummary(options.dataset)
    const priorSummary = this.buildPriorSummary(options)
    const systemPrompt = buildSystemPrompt(
      options.goal,
      datasetSummary,
      priorSummary,
      options.styleId,
      options.customStylePrompt,
    )

    // 创建 Agent
    this.agent = new AgentClass({
      initialState: {
        systemPrompt,
        model,
        tools,
        thinkingLevel: 'off',
      },
      toolExecution: 'parallel',
      getApiKey: () => options.llmConfig.apiKey,
      convertToLlm: (msgs: AgentMessage[]) => msgs.filter(
        m => ['user', 'assistant', 'toolResult'].includes(m.role)
      ) as AgentMessage[],
    })

    // 事件映射
    this.agent.subscribe((event: AgentEvent) => this.handleEvent(event))

    // 如果有历史对话，注入
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      for (const msg of options.conversationHistory) {
        this.agent.state.messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: Date.now(),
        })
      }
    }
  }

  /** 创建 pi-ai Model（支持自定义 baseURL） */
  private createModel(config: { apiKey: string; baseURL?: string; model: string }): Model<'openai-completions'> {
    const baseUrl = config.baseURL || 'https://api.openai.com/v1'
    return {
      id: config.model,
      name: config.model,
      api: 'openai-completions',
      provider: 'openai',
      baseUrl,
      reasoning: false,
      input: ['text'],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 16384,
    }
  }

  /** 设置进度回调 */
  setProgressCallback(cb: (event: ProgressEvent) => void): void {
    this.onProgress = cb
  }

  /** 运行 Agent */
  async run(): Promise<PiSharedStore> {
    const now = new Date().toISOString()

    this.onProgress({
      type: 'agent_step',
      agent: 'pi-agent',
      message: `开始分析任务：${this.goal}`,
      data: { type: 'thinking', reasoning: `开始分析任务：${this.goal}` },
      timestamp: now,
    })

    await this.agent.prompt(this.goal)

    // 等待 Agent 完成
    await this.agent.waitForIdle()

    // 如果生成了看板，发出事件
    if (this.sharedStore.dashboardHTML) {
      this.onProgress({
        type: 'dashboard_ready',
        message: '看板已生成',
        data: { dashboardHTML: this.sharedStore.dashboardHTML },
        timestamp: new Date().toISOString(),
      })
    }

    this.onProgress({
      type: 'complete',
      message: `Agent 执行完成 (${this.sharedStore.charts.length} 图表, ${this.sharedStore.analysisResults.length} 分析)`,
      data: {
        report: this.sharedStore.reportContent.value,
        chartSpecs: this.sharedStore.charts.map(c => c.figure),
        analysisResults: this.sharedStore.analysisResults,
        dashboardHTML: this.sharedStore.dashboardHTML,
      },
      timestamp: new Date().toISOString(),
    })

    return this.sharedStore
  }

  /** 中止运行 */
  abort(): void {
    this.agent?.abort()
  }

  /** pi-agent-core 事件 → ProgressEvent 映射 */
  private handleEvent(event: AgentEvent): void {
    const ts = new Date().toISOString()

    switch (event.type) {
      case 'agent_start': {
        this.onProgress({
          type: 'agent_step',
          agent: 'pi-agent',
          message: 'Agent 已启动',
          data: { type: 'thinking', reasoning: 'Agent 已启动' },
          timestamp: ts,
        })
        break
      }

      case 'message_update': {
        const ae = event.assistantMessageEvent
        if (ae.type === 'text_delta' && ae.delta) {
          this.onProgress({
            type: 'agent_step',
            agent: 'pi-agent',
            message: ae.delta,
            data: { type: 'thinking', reasoning: ae.delta },
            timestamp: ts,
          })
        }
        break
      }

      case 'tool_execution_start': {
        this.onProgress({
          type: 'agent_step',
          agent: 'pi-agent',
          message: `调用 ${event.toolName}`,
          data: {
            type: 'tool_call',
            name: event.toolName,
            toolCallId: event.toolCallId,
            args: event.args,
          },
          timestamp: ts,
        })
        break
      }

      case 'tool_execution_end': {
        if (event.isError) {
          this.onProgress({
            type: 'error',
            message: `工具 ${event.toolName} 执行失败: ${JSON.stringify(event.result)}`,
            timestamp: ts,
          })
        } else {
          // 根据工具名映射到对应的事件类型
          const toolName = event.toolName
          if (toolName === 'sandbox_execute') {
            this.onProgress({
              type: 'code_generated',
              message: `✓ ${toolName} 完成`,
              data: { name: toolName, toolCallId: event.toolCallId, result: event.result },
              timestamp: ts,
            })
          } else if (toolName === 'generate_chart') {
            this.onProgress({
              type: 'chart_ready',
              message: `✓ ${toolName} 完成`,
              data: { name: toolName, toolCallId: event.toolCallId, result: event.result },
              timestamp: ts,
            })
          } else if (toolName === 'generate_report') {
            this.onProgress({
              type: 'report_section',
              message: `✓ ${toolName} 完成`,
              data: { name: toolName, toolCallId: event.toolCallId, result: event.result },
              timestamp: ts,
            })
          } else if (toolName === 'generate_dashboard') {
            this.onProgress({
              type: 'dashboard_ready',
              message: '看板已生成',
              data: { name: toolName, dashboardHTML: this.sharedStore.dashboardHTML },
              timestamp: ts,
            })
          }
        }
        break
      }

      case 'turn_end': {
        this.onProgress({
          type: 'agent_step',
          agent: 'pi-agent',
          message: 'Turn 完成',
          data: { type: 'thinking_complete' },
          timestamp: ts,
        })
        break
      }

      case 'agent_end': {
        // 最终事件在 run() 中处理
        break
      }
    }
  }

  private buildDatasetSummary(dataset?: DatasetContext): string {
    if (!dataset) return '数据集：无（用户未上传数据文件）'

    const cols = (dataset.schema as any)?.columns
      ? (dataset.schema as any).columns.join(', ')
      : (dataset.schema as any)?.map?.((c: any) => c.name).join(', ') || '未知'

    let summary = `数据集：${dataset.name || '已上传'}
- 列名: ${cols}
- 形状: ${(dataset.schema as any)?.shape?.[0] || '?'} 行 × ${(dataset.schema as any)?.shape?.[1] || '?'} 列
${(dataset as any).samplePath ? `- 文件路径: ${(dataset as any).samplePath}` : ''}
${(dataset as any).head ? `- 前 5 行样本:\n${JSON.stringify((dataset as any).head, null, 2)}` : ''}`

    return summary
  }

  private buildPriorSummary(options: PiAgentOptions): string {
    if (!options.priorState) return ''

    const parts: string[] = ['## 前序会话已累积的结果']

    const analysisResults = options.priorState.analysisResults as any[] | undefined
    if (analysisResults && analysisResults.length > 0) {
      parts.push(`- 分析结果: ${analysisResults.length} 条`)
    }

    if (options.priorState.chartSpecs && (options.priorState.chartSpecs as any[]).length > 0) {
      parts.push(`- 图表: ${(options.priorState.chartSpecs as any[]).length} 个`)
    }

    if (options.priorState.report) {
      parts.push(`- 报告: 已生成`)
    }

    return parts.length > 1 ? parts.join('\n') : ''
  }
}