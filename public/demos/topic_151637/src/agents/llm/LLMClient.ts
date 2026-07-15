/**
 * LLM 客户端 — OpenAI 兼容 API。
 *
 * 支持：
 *  - complete(): 普通补全（推理模型自动回退流式）
 *  - streamComplete(): 流式补全（逐 token 回调，用于报告生成进度推送）
 *  - completeJSON<T>(): 结构化 JSON 输出（解析失败重试 1 次）
 *  - completeWithTools(): Function-calling 工具调用（CodingAgent 主循环）
 *
 * 推理模型（如 GLM-5.2）兼容：
 *  - 非流式调用可能返回 choices: null，此时自动回退到流式
 *  - 流式模式跳过 reasoning_content，只收集 content（最终答案）
 */

import OpenAI from 'openai'

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
  tool_call_id?: string
  name?: string
}

export interface LLMConfig {
  apiKey?: string
  baseURL?: string
  model?: string
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: object
  }
}

export interface ToolCallResponse {
  content: string | null
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
}

export class LLMClient {
  private client: OpenAI
  private model: string
  private apiKey: string
  private baseURL: string

  constructor(config?: LLMConfig) {
    const apiKey = config?.apiKey || process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY 未配置。请在 .env 中设置 OPENAI_API_KEY。')
    }
    this.apiKey = apiKey
    this.baseURL = config?.baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    this.client = new OpenAI({
      apiKey,
      baseURL: this.baseURL,
    })
    this.model = config?.model || process.env.LLM_MODEL || 'gpt-4o-mini'
  }

  /** 暴露 LLM 配置（供 PiAgent 使用） */
  getConfig(): { apiKey: string; baseURL: string; model: string } {
    return { apiKey: this.apiKey, baseURL: this.baseURL, model: this.model }
  }

  /** Function-calling 工具调用（CodingAgent 主循环） */
  async completeWithTools(
    messages: Message[],
    tools: ToolDefinition[],
    opts?: { temperature?: number }
  ): Promise<ToolCallResponse> {
    const temperature = opts?.temperature ?? 0.3
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
      tools: tools.length > 0 ? (tools as any) : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      temperature,
    })

    const choice = res.choices?.[0]?.message
    if (!choice) {
      throw new Error('LLM 返回空 choices')
    }

    return {
      content: choice.content || null,
      tool_calls: choice.tool_calls as any || undefined,
    }
  }

  /**
   * 流式 Function-calling 工具调用。
   * 逐 token 回调思考内容，同时累积 tool_calls。
   * 用于 CodingAgent 实时展示 LLM 推理过程。
   */
  async streamCompleteWithTools(
    messages: Message[],
    tools: ToolDefinition[],
    onToken: (text: string) => void,
    opts?: { temperature?: number }
  ): Promise<ToolCallResponse> {
    const temperature = opts?.temperature ?? 0.3
    let fullContent = ''
    const toolCallsAcc: Map<number, { id: string; name: string; arguments: string }> = new Map()

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
      tools: tools.length > 0 ? (tools as any) : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      temperature,
      stream: true,
    })

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta
      if (!delta) continue

      // 收集思考文本（content + reasoning_content）
      const text = delta.content ?? ''
      if (text) {
        fullContent += text
        onToken(text)
      }

      // 累积流式 tool_calls
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index
          if (!toolCallsAcc.has(idx)) {
            toolCallsAcc.set(idx, {
              id: tc.id || '',
              name: tc.function?.name || '',
              arguments: tc.function?.arguments || '',
            })
          } else {
            const existing = toolCallsAcc.get(idx)!
            if (tc.id) existing.id = tc.id
            if (tc.function?.name) existing.name = tc.function.name
            if (tc.function?.arguments) existing.arguments += tc.function.arguments
          }
        }
      }
    }

    const tool_calls = toolCallsAcc.size > 0
      ? Array.from(toolCallsAcc.values()).map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: tc.arguments },
        }))
      : undefined

    return {
      content: fullContent || null,
      tool_calls,
    }
  }

  /** 普通补全 — 推理模型 choices 为 null 时自动回退流式 */
  async complete(
    messages: Message[],
    opts?: { temperature?: number }
  ): Promise<string> {
    const temperature = opts?.temperature ?? 0.3
    try {
      const res = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as any,
        temperature
      })
      const content = res.choices?.[0]?.message?.content
      if (content) return content
      // choices 为 null/空 或 content 为空 — 推理模型回退流式
    } catch {
      // 非流式调用异常 — 回退流式
    }
    return this.streamComplete(messages, undefined, opts)
  }

  /** 流式补全：逐 token 回调，最终返回完整字符串 */
  async streamComplete(
    messages: Message[],
    onToken?: (delta: string) => void,
    opts?: { temperature?: number }
  ): Promise<string> {
    let full = ''
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
      temperature: opts?.temperature ?? 0.3,
      stream: true
    })
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta
      if (!delta) continue
      // reasoning_content 是推理过程，跳过；只收集 content（最终答案）
      const text = delta.content ?? ''
      if (text) {
        full += text
        onToken?.(text)
      }
    }
    return full
  }

  /** 结构化 JSON 输出：解析失败重试 1 次 */
  async completeJSON<T>(
    messages: Message[],
    opts?: { temperature?: number }
  ): Promise<T> {
    const lastError: Error[] = []
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await this.complete(messages, {
          temperature: opts?.temperature ?? 0.1
        })
        if (!raw || !raw.trim()) {
          throw new Error('LLM 返回空内容')
        }
        // 尝试提取 JSON（LLM 可能包裹在 markdown 代码块中）
        const jsonStr = this.extractJSON(raw)
        return JSON.parse(jsonStr) as T
      } catch (e) {
        lastError.push(e instanceof Error ? e : new Error(String(e)))
        if (attempt === 1) {
          throw new Error(
            `LLM 返回非 JSON（重试 1 次后仍失败）: ${lastError[0].message}`
          )
        }
      }
    }
    throw new Error('unreachable')
  }

  /** 从可能包含 markdown 代码块的字符串中提取 JSON */
  private extractJSON(raw: string): string {
    const trimmed = raw.trim()
    // ```json\n{...}\n``` or ```\n{...}\n```
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim()
    }
    // 直接是 JSON
    return trimmed
  }
}
