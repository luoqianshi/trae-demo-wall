// 结构化 Agent 输出类型定义

export interface AgentPlanItem {
  agentId: string
  task: string
  parallel: boolean
}

export interface AgentPlan {
  plan: AgentPlanItem[]
  reasoning: string
}

export interface ReviewVerdict {
  verdict: 'pass' | 'revise'
  comments: string[]
  confidence: number
  reasoning: string
}

export interface FinalDraft {
  draft: string
  highlights: string[]
  nextSteps: string[]
}
