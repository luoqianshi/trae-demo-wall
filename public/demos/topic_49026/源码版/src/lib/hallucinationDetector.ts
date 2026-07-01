/**
 * 幻觉检测器
 * 从 AI 响应中提取事实声明，与记忆库比对
 * 标记可能编造的内容
 */

import type { Memory } from '../types'

export interface HallucinationResult {
  suspected: boolean
  suspectedFacts: string[]
  confidence: number
}

// 疑似事实声明的模式（AI 可能编造的内容特征）
const FACT_PATTERNS = [
  /(?:上周|上个月|前几天|最近|之前|刚才|昨天)你[^\d]{5,40}/g,
  /你(?:投|买|订|约|报|参加|去了|说了|答应|同意|拒绝)[^\d]{3,30}/g,
  /(?:那家|那个|那次|那件)[^\d]{3,20}(?:的)?(?:反馈|结果|消息|回复)/g,
]

export function detectHallucination(
  aiResponse: string,
  memories: Memory[]
): HallucinationResult {
  const suspectedFacts: string[] = []

  for (const pattern of FACT_PATTERNS) {
    const matches = aiResponse.match(pattern) || []
    for (const match of matches) {
      // 检查该事实是否在记忆库中有依据
      const hasBasis = memories.some(m =>
        m.content.includes(match.slice(2, Math.min(10, match.length)))
      )
      if (!hasBasis) {
        suspectedFacts.push(match)
      }
    }
  }

  return {
    suspected: suspectedFacts.length > 0,
    suspectedFacts,
    confidence: suspectedFacts.length > 0 ? 0.7 : 0.9,
  }
}
