// 多线程发散分析
// 基于当前对话，让 LLM 从多个角度并行分析

import { chatCompletion } from './ai'
import { retrieveContext } from './rag'

export interface AnalysisBranch {
  id: string
  agentId: string
  agentName: string
  agentIcon: string
  perspective: string
  color: string
  thoughts: string[]
}

const perspectives = [
  {
    id: 'writer',
    name: '方案写手',
    icon: '✍️',
    perspective: '直接建议',
    color: 'zen-terracotta',
    prompt: '从"给出最直接、可执行的建议"角度，分析用户当前面临的问题。列出2-3条具体行动建议。',
  },
  {
    id: 'relation',
    name: '关系顾问',
    icon: '🤝',
    perspective: '人际关系',
    color: 'zen-sage',
    prompt: '从"人际关系和沟通策略"角度，分析用户当前面临的问题。涉及哪些人？关系如何处理？',
  },
  {
    id: 'psych',
    name: '心理顾问',
    icon: '🧠',
    perspective: '心理状态',
    color: 'zen-indigo',
    prompt: '从"心理健康和情绪管理"角度，分析用户当前面临的问题。情绪状态如何？需要什么心理支持？',
  },
  {
    id: 'practical',
    name: '生活顾问',
    icon: '📋',
    perspective: '可行性',
    color: 'zen-amber',
    prompt: '从"现实可行性和资源评估"角度，分析用户当前面临的问题。时间、金钱、精力是否允许？风险是什么？',
  },
]

export async function runDivergentAnalysis(userRequest: string): Promise<AnalysisBranch[]> {
  const retrieval = await retrieveContext(userRequest)
  const context = retrieval.context

  // 并行调用 4 个角度的分析
  const results = await Promise.all(
    perspectives.map(async (p) => {
      const response = await chatCompletion(
        [
          {
            role: 'system',
            content: `你是${p.name}。${p.prompt}\n\n请用简洁的 bullet points 输出，每条不超过30字。只输出分析内容，不要加标题或总结。`,
          },
          {
            role: 'user',
            content: `【用户问题】\n${userRequest}\n\n【背景信息】\n${context}\n\n请从"${p.perspective}"角度分析。`,
          },
        ],
        { temperature: 0.7, maxTokens: 512, preferDoubao: true }  // OPT-2: 发散分析用豆包
      )

      // 解析 bullet points
      const thoughts = response
        .split('\n')
        .map((line) => line.replace(/^[-•*]\s*/, '').trim())
        .filter((line) => line.length > 5 && line.length < 100)
        .slice(0, 4)

      return {
        id: p.id,
        agentId: p.id,
        agentName: p.name,
        agentIcon: p.icon,
        perspective: p.perspective,
        color: p.color,
        thoughts: thoughts.length > 0 ? thoughts : ['暂无具体建议'],
      }
    })
  )

  return results
}
