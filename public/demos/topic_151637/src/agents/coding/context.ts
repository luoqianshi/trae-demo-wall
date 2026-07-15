/**
 * 200K 上下文窗口管理器 — 滑动窗口 + 摘要压缩。
 *
 * 策略：
 *   1. 按 token 估算公式（1 token ≈ 4 字符中文 / 3 字符英文）跟踪总 token 数
 *   2. 当 token 数超过 compressThreshold（默认 160K），触发压缩：
 *      - 保留 system prompt + 最近 N 条消息（必需上下文）
 *      - 中间消息压缩为一条 assistant 摘要（保留关键发现和工具调用结果）
 *   3. 如果压缩后仍超限，强制截断最早的消息
 */

import type { AgentMessage } from './types'

export interface ContextWindowConfig {
  maxTokens: number
  compressThreshold: number
  /** 保留最近 N 条消息不被压缩 */
  keepRecent: number
}

const DEFAULT_CONFIG: ContextWindowConfig = {
  maxTokens: 200_000,
  compressThreshold: 160_000,
  keepRecent: 8,
}

/**
 * 粗略估算消息的 token 数。
 * 中英文混合：1 token ≈ 3.5 字符（保守估计）
 */
function estimateTokens(messages: AgentMessage[]): number {
  let total = 0
  for (const msg of messages) {
    // content
    if (typeof msg.content === 'string') {
      total += Math.ceil(msg.content.length / 3.5)
    }
    // tool_calls
    if (msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        total += Math.ceil(tc.function.arguments.length / 3.5) + 10 // name + overhead
      }
    }
    // role overhead
    total += 4
  }
  return total
}

/**
 * 从消息列表中提取关键信息用于摘要。
 */
function extractKeyPoints(messages: AgentMessage[]): string {
  const points: string[] = []

  for (const msg of messages) {
    if (msg.role === 'tool' && msg.content) {
      // 工具调用结果：截取前 200 字符
      const preview = msg.content.slice(0, 200)
      points.push(`[工具结果] ${preview}${msg.content.length > 200 ? '...' : ''}`)
    } else if (msg.role === 'assistant' && msg.content) {
      // assistant 思考：截取关键句
      const lines = msg.content.split('\n').filter((l) => l.trim().length > 0)
      const keyLines = lines.slice(0, 3)
      if (keyLines.length > 0) {
        points.push(`[思考] ${keyLines.join(' ').slice(0, 300)}`)
      }
    }
  }

  if (points.length === 0) return '（无关键信息）'
  return points.join('\n')
}

/**
 * 压缩消息列表，保留 system prompt + 最近 N 条，中间压缩为摘要。
 *
 * @returns 压缩后的消息 + 是否发生了压缩
 */
export function compressContext(
  messages: AgentMessage[],
  config: Partial<ContextWindowConfig> = {}
): { messages: AgentMessage[]; compressed: boolean } {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const estimated = estimateTokens(messages)

  if (estimated < cfg.compressThreshold) {
    return { messages, compressed: false }
  }

  // 找 system prompt 索引
  const systemIdx = messages.findIndex((m) => m.role === 'system')
  const systemMsg = systemIdx >= 0 ? [messages[systemIdx]] : []
  const nonSystem = systemIdx >= 0 ? messages.slice(systemIdx + 1) : messages

  // 如果非 system 消息很少，不压缩
  if (nonSystem.length <= cfg.keepRecent + 2) {
    return { messages, compressed: false }
  }

  // 保留最近 N 条
  const recent = nonSystem.slice(-cfg.keepRecent)
  const middle = nonSystem.slice(0, nonSystem.length - cfg.keepRecent)

  // 中间消息压缩为一条摘要
  const summary = extractKeyPoints(middle)
  const summaryMsg: AgentMessage = {
    role: 'assistant',
    content: `[上下文摘要 — 之前的对话已压缩]\n以下是从更早的对话中提取的关键信息：\n\n${summary}\n\n[摘要结束]`,
  }

  const compressed = [...systemMsg, summaryMsg, ...recent]
  const newEstimate = estimateTokens(compressed)

  // 如果压缩后仍超限，强制截断
  if (newEstimate > cfg.maxTokens) {
    return forceTruncate(compressed, cfg.maxTokens)
  }

  return { messages: compressed, compressed: true }
}

/**
 * 强制截断：保留 system prompt + 最后 N 条，其余丢弃。
 */
function forceTruncate(messages: AgentMessage[], maxTokens: number): { messages: AgentMessage[]; compressed: boolean } {
  const systemIdx = messages.findIndex((m) => m.role === 'system')
  const systemMsg = systemIdx >= 0 ? [messages[systemIdx]] : []

  const tail = systemIdx >= 0 ? messages.slice(systemIdx + 1) : messages

  // 从后往前保留，直到接近 token 上限
  const kept: AgentMessage[] = []
  let currentTokens = systemMsg.length > 0 ? estimateTokens(systemMsg) : 0

  for (let i = tail.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens([tail[i]])
    if (currentTokens + msgTokens > maxTokens * 0.95) break
    kept.unshift(tail[i])
    currentTokens += msgTokens
  }

  const truncationNotice: AgentMessage = {
    role: 'assistant',
    content: `[注意] 上下文窗口已满，早期消息已被截断。当前保留最近 ${kept.length} 条消息。`,
  }

  return {
    messages: [...systemMsg, truncationNotice, ...kept],
    compressed: true,
  }
}

/**
 * 获取当前上下文窗口的 token 估算值。
 */
export function getContextSize(messages: AgentMessage[]): number {
  return estimateTokens(messages)
}