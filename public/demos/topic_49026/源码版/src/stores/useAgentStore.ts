import { create } from 'zustand'
import type { Agent, ReviewStep } from '../types'

const defaultAgents: Agent[] = [
  { id: 'orchestrator', name: '编排器', role: '任务分解与调度', description: '统筹协调各 Agent 工作，负责任务分解与调度', status: 'idle', avatar: '🎛️', color: 'zen-terracotta', capabilities: ['任务分解', 'Agent调度', '进度追踪'], tools: ['task_ledger', 'progress_ledger'], stats: { totalCalls: 0, avgLatency: 0, successRate: 1, lastActiveAt: 0 } },
  { id: 'researcher', name: '研究员', role: '深度信息检索与分析', description: '深度检索与分析信息，为决策提供事实依据', status: 'idle', avatar: '🔬', color: 'zen-indigo', capabilities: ['RAG检索', '关联分析', '信息摘要'], tools: ['semantic_search', 'tiered_search', 'knowledge_graph'], stats: { totalCalls: 0, avgLatency: 0, successRate: 1, lastActiveAt: 0 } },
  { id: 'writer', name: '方案写手', role: '起草具体可执行方案', description: '起草具体可执行的方案与个性化建议', status: 'idle', avatar: '✍️', color: 'zen-sage', capabilities: ['方案起草', '个性化建议', '行动规划'], tools: ['prompt_builder', 'context_assembler'], stats: { totalCalls: 0, avgLatency: 0, successRate: 1, lastActiveAt: 0 } },
  { id: 'relation', name: '关系顾问', role: '人际关系角度审核', description: '从人际关系角度审核并优化沟通策略', status: 'idle', avatar: '🤝', color: 'zen-rose', capabilities: ['关系分析', '沟通建议', '冲突调解'], tools: ['person_profile', 'sentiment_tracker'], stats: { totalCalls: 0, avgLatency: 0, successRate: 1, lastActiveAt: 0 } },
  { id: 'psych', name: '心理顾问', role: '情绪与心理健康审核', description: '关注情绪与心理健康，提供支持与评估', status: 'idle', avatar: '🧠', color: 'zen-violet', capabilities: ['情绪识别', '压力评估', '心理支持'], tools: ['mood_analyzer', 'stress_detector'], stats: { totalCalls: 0, avgLatency: 0, successRate: 1, lastActiveAt: 0 } },
  { id: 'practical', name: '生活顾问', role: '可行性与资源审核', description: '评估可行性与资源，规划生活事务', status: 'idle', avatar: '📋', color: 'zen-amber', capabilities: ['可行性评估', '资源规划', '时间管理'], tools: ['calendar_check', 'budget_calculator'], stats: { totalCalls: 0, avgLatency: 0, successRate: 1, lastActiveAt: 0 } },
  { id: 'critic', name: '批判顾问', role: '风险识别与漏洞审查', description: '识别风险与漏洞，提出备选方案', status: 'idle', avatar: '🔍', color: 'zen-slate', capabilities: ['风险评估', '漏洞识别', '备选方案'], tools: ['risk_matrix', 'scenario_planner'], stats: { totalCalls: 0, avgLatency: 0, successRate: 1, lastActiveAt: 0 } },
  { id: 'synthesizer', name: '综合员', role: '多意见整合与冲突调和', description: '整合多方意见，调和冲突并排序优先级', status: 'idle', avatar: '⚖️', color: 'zen-teal', capabilities: ['意见整合', '冲突调和', '优先级排序'], tools: ['consensus_builder', 'priority_matrix'], stats: { totalCalls: 0, avgLatency: 0, successRate: 1, lastActiveAt: 0 } },
  { id: 'host', name: '主持人', role: '最终定稿与质量把关', description: '最终定稿与质量把关，输出高质量结果', status: 'idle', avatar: '🎯', color: 'zen-crimson', capabilities: ['质量把关', '最终定稿', '个性化润色'], tools: ['quality_checker', 'style_adapter'], stats: { totalCalls: 0, avgLatency: 0, successRate: 1, lastActiveAt: 0 } },
]

interface AgentStoreState {
  agents: Agent[]
  reviewSteps: ReviewStep[]
  setAgents: (agents: Agent[]) => void
  setAgentStatus: (id: string, status: Agent['status']) => void
  setReviewSteps: (steps: ReviewStep[]) => void
  clearReviewSteps: () => void
}

export const useAgentStore = create<AgentStoreState>((set) => ({
  agents: defaultAgents,
  reviewSteps: [],
  setAgents: (agents) => set({ agents }),
  setAgentStatus: (id, status) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, status } : a)),
    })),
  setReviewSteps: (reviewSteps) => set({ reviewSteps }),
  clearReviewSteps: () => set({ reviewSteps: [] }),
}))
