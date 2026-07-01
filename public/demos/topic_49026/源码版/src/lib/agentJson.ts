// Agent 结构化 JSON 输出解析与校验工具

import type { AgentPlan, ReviewVerdict } from './agentSchemas'

const ALLOWED_AGENT_IDS = new Set([
  'researcher', 'writer', 'relation', 'psych', 'practical', 'critic', 'synthesizer', 'host',
])

function extractJsonObject(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/)
  return match ? match[0] : null
}

export function parseAgentPlan(text: string): AgentPlan | null {
  const raw = text.replace(/^```json\s*|\s*```$/g, '').trim()
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.plan) || parsed.plan.length === 0) return null
    const plan = parsed.plan
      .filter((p: any) => ALLOWED_AGENT_IDS.has(p.agentId))
      .map((p: any) => ({
        agentId: p.agentId,
        task: String(p.task || ''),
        parallel: Boolean(p.parallel),
      }))
    if (plan.length === 0) return null
    return { plan, reasoning: String(parsed.reasoning || '') }
  } catch {
    const block = extractJsonObject(raw)
    if (!block) return null
    try {
      const parsed = JSON.parse(block)
      if (!Array.isArray(parsed.plan) || parsed.plan.length === 0) return null
      const plan = parsed.plan
        .filter((p: any) => ALLOWED_AGENT_IDS.has(p.agentId))
        .map((p: any) => ({ agentId: p.agentId, task: String(p.task || ''), parallel: Boolean(p.parallel) }))
      return { plan, reasoning: String(parsed.reasoning || '') }
    } catch {
      return null
    }
  }
}

export function parseReviewVerdict(text: string): ReviewVerdict | null {
  const raw = text.replace(/^```json\s*|\s*```$/g, '').trim()
  try {
    const parsed = JSON.parse(raw)
    return normalizeVerdict(parsed)
  } catch {
    const block = extractJsonObject(raw)
    if (!block) return null
    try {
      const parsed = JSON.parse(block)
      return normalizeVerdict(parsed)
    } catch {
      return null
    }
  }
}

function normalizeVerdict(parsed: any): ReviewVerdict | null {
  const verdict = parsed.verdict === 'pass' || parsed.verdict === 'revise' ? parsed.verdict : 'revise'
  const comments = Array.isArray(parsed.comments)
    ? parsed.comments.filter((c: any) => typeof c === 'string' && c.length > 0)
    : []
  const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.7
  const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : ''
  return { verdict, comments, confidence, reasoning }
}
