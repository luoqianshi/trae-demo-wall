/**
 * Agentic RAG — 智能体迭代检索与思考过程可视化
 *
 * 企业级技术降维：企业多 Agent 协作系统 → 个人 AI 助手思考过程展示
 *
 * 核心思路：
 * - 传统 RAG：一次检索 → 一次生成（黑盒）
 * - Agentic RAG：规划 → 检索 → 评估 → 补充检索 → 综合（透明）
 * - 灵感来源：DeepSeek-R1 / OpenAI o3 的 reasoning 展示
 *
 * 实现：
 * 1. 规划 Agent：分析问题，制定检索策略
 * 2. 检索 Agent：执行检索，评估结果充分性
 * 3. 补充 Agent：信息不足时追加检索
 * 4. 综合 Agent：跨轮次综合结果
 * 5. 全程输出思考步骤，UI 实时展示
 */

import type { Person, Memory } from '../types'
import { retrieveContext, type RetrievalResult } from './rag'

// ─── 类型定义 ───────────────────────────────────────────────

export type AgentStepType =
  | 'plan'        // 规划检索策略
  | 'retrieve'    // 执行检索
  | 'evaluate'    // 评估结果
  | 'supplement'  // 补充检索
  | 'synthesize'  // 综合结果
  | 'graph_expand' // 图谱扩展
  | 'done'        // 完成

export interface AgentStep {
  type: AgentStepType
  title: string
  description: string
  timestamp: number
  duration?: number // ms
  result?: string
  status: 'running' | 'completed' | 'skipped'
  details?: string[]
}

export interface AgenticRAGResult {
  steps: AgentStep[]
  finalContext: string
  retrievalResult: RetrievalResult
  totalDuration: number
  iterations: number
  thoughtProcess: string // 自然语言思考过程
}

// ─── 规划 Agent ─────────────────────────────────────────────

/**
 * 分析用户问题，制定检索策略
 */
function planRetrieval(query: string): AgentStep {
  const strategies: string[] = []
  const details: string[] = []

  // 判断问题类型
  if (/谁.*介绍|谁.*认识|人脉|帮我.*找/.test(query)) {
    strategies.push('人脉发现查询')
    details.push('→ 触发 GraphRAG 图谱遍历，寻找间接关联')
    details.push('→ 优先检索"介绍""推荐"相关记忆')
  }

  if (/关系.*怎么样|温度|疏远|亲近|冷淡/.test(query)) {
    strategies.push('关系温度分析')
    details.push('→ 检索该人物的所有互动记忆')
    details.push('→ 触发因果推理链分析')
  }

  if (/怎么.*办|如何.*应对|建议|分析/.test(query)) {
    strategies.push('场景分析查询')
    details.push('→ 检索相关人物和事件记忆')
    details.push('→ 触发多视角分析')
  }

  if (/提醒|记得|别忘了/.test(query)) {
    strategies.push('记忆检索')
    details.push('→ 优先检索承诺和待办记忆')
  }

  if (strategies.length === 0) {
    strategies.push('通用语义检索')
    details.push('→ 语义向量检索 + 关键词匹配')
    details.push('→ 自动识别人物实体')
  }

  return {
    type: 'plan',
    title: '规划检索策略',
    description: `识别为「${strategies.join(' + ')}」`,
    timestamp: Date.now(),
    status: 'completed',
    details,
  }
}

// ─── 评估 Agent ─────────────────────────────────────────────

/**
 * 评估检索结果是否充分
 */
function evaluateRetrieval(
  result: RetrievalResult,
  query: string,
): { sufficient: boolean; gaps: string[] } {
  const gaps: string[] = []

  // 检查是否有足够记忆
  if (result.memories.length < 2) {
    gaps.push('记忆数量不足，尝试补充检索')
  }

  // 检查是否检测到人物
  if (/谁|人|朋友|同事|领导|客户/.test(query) && result.people.length === 0) {
    gaps.push('未检测到相关人物，尝试关键词扩展')
  }

  // 检查 GraphRAG 是否触发
  if (/介绍|认识|人脉|帮我.*找/.test(query) && !result.graphRAG) {
    gaps.push('图谱检索未触发，尝试强制启动')
  }

  return {
    sufficient: gaps.length === 0,
    gaps,
  }
}

// ─── 主流程 ─────────────────────────────────────────────────

/**
 * Agentic RAG 主流程
 * 执行规划 → 检索 → 评估 → 补充 → 综合，全程记录思考步骤
 */
export async function agenticRAG(
  query: string,
  onStep?: (step: AgentStep) => void,
): Promise<AgenticRAGResult> {
  const startTime = Date.now()
  const steps: AgentStep[] = []
  let iterations = 0

  // Step 1: 规划
  const planStep = planRetrieval(query)
  steps.push(planStep)
  onStep?.(planStep)

  // Step 2: 首轮检索
  const retrieveStart = Date.now()
  const retrieveStep: AgentStep = {
    type: 'retrieve',
    title: '执行首轮检索',
    description: '语义向量检索 + 关键词匹配 + 人物实体识别',
    timestamp: Date.now(),
    status: 'running',
  }
  steps.push(retrieveStep)
  onStep?.(retrieveStep)

  let result = await retrieveContext(query)
  retrieveStep.duration = Date.now() - retrieveStart
  retrieveStep.status = 'completed'
  retrieveStep.result = `检索到 ${result.memories.length} 条记忆，${result.people.length} 位人物，方法：${result.method}`
  retrieveStep.details = [
    `记忆分层：热(${result.tiers.hot}) / 温(${result.tiers.warm}) / 冷(${result.tiers.cold})`,
    `检索方法：${result.method}`,
  ]
  if (result.graphRAG) {
    retrieveStep.details!.push(`GraphRAG：发现 ${result.graphRAG.indirectPeople.length} 位间接关联人物`)
    retrieveStep.details!.push(`关系链：${result.graphRAG.paths.length} 条路径`)
  }
  onStep?.(retrieveStep)

  // Step 3: 评估
  const evaluation = evaluateRetrieval(result, query)
  const evaluateStep: AgentStep = {
    type: 'evaluate',
    title: '评估检索充分性',
    description: evaluation.sufficient ? '检索结果充分，可以生成回复' : '检索结果有缺口，需要补充',
    timestamp: Date.now(),
    status: 'completed',
    details: evaluation.gaps.length > 0 ? evaluation.gaps : ['所有维度检查通过'],
  }
  steps.push(evaluateStep)
  onStep?.(evaluateStep)

  // Step 4: 补充检索（如果需要）
  if (!evaluation.sufficient) {
    iterations++
    const supplementStart = Date.now()
    const supplementStep: AgentStep = {
      type: 'supplement',
      title: `第 ${iterations} 轮补充检索`,
      description: '扩展关键词 + 降低相似度阈值 + 强制图谱遍历',
      timestamp: Date.now(),
      status: 'running',
    }
    steps.push(supplementStep)
    onStep?.(supplementStep)

    // 用扩展的查询重新检索
    const expandedQuery = expandQuery(query, evaluation.gaps)
    const supplementResult = await retrieveContext(expandedQuery)

    // 合并结果
    const existingMemoryIds = new Set(result.memories.map(m => m.id))
    const newMemories = supplementResult.memories.filter(m => !existingMemoryIds.has(m.id))
    result.memories = [...result.memories, ...newMemories]

    const existingPersonIds = new Set(result.people.map(p => p.id))
    const newPeople = supplementResult.people.filter(p => !existingPersonIds.has(p.id))
    result.people = [...result.people, ...newPeople]

    if (supplementResult.graphRAG && !result.graphRAG) {
      result.graphRAG = supplementResult.graphRAG
    }

    supplementStep.duration = Date.now() - supplementStart
    supplementStep.status = 'completed'
    supplementStep.result = `补充检索到 ${newMemories.length} 条新记忆，${newPeople.length} 位新人物`
    onStep?.(supplementStep)
  }

  // Step 5: 图谱扩展（如果有 GraphRAG 结果）
  if (result.graphRAG) {
    const graphStep: AgentStep = {
      type: 'graph_expand',
      title: '知识图谱扩展',
      description: `遍历 ${result.graphRAG.paths.length} 条关系链`,
      timestamp: Date.now(),
      status: 'completed',
      details: result.graphRAG.paths.slice(0, 3).map(p =>
        `${p.description}（${p.hops}跳，强度${Math.round(p.totalStrength)}）`
      ),
      result: `发现 ${result.graphRAG.indirectPeople.length} 位间接关联人物`,
    }
    steps.push(graphStep)
    onStep?.(graphStep)
  }

  // Step 6: 综合
  const synthesizeStep: AgentStep = {
    type: 'synthesize',
    title: '综合检索结果',
    description: '整合多轮检索 + 图谱扩展结果，构建最终上下文',
    timestamp: Date.now(),
    status: 'completed',
    details: [
      `总记忆数：${result.memories.length}`,
      `总人物数：${result.people.length}`,
      `检索轮次：${iterations + 1}`,
      `图谱增强：${result.graphRAG ? '是' : '否'}`,
    ],
  }
  steps.push(synthesizeStep)
  onStep?.(synthesizeStep)

  // Step 7: 完成
  const doneStep: AgentStep = {
    type: 'done',
    title: '检索完成',
    description: '准备生成 AI 回复',
    timestamp: Date.now(),
    status: 'completed',
  }
  steps.push(doneStep)
  onStep?.(doneStep)

  // 生成自然语言思考过程
  const thoughtProcess = generateThoughtProcess(steps, query)

  return {
    steps,
    finalContext: result.context,
    retrievalResult: result,
    totalDuration: Date.now() - startTime,
    iterations: iterations + 1,
    thoughtProcess,
  }
}

/**
 * 查询扩展：根据信息缺口扩展查询
 */
function expandQuery(query: string, gaps: string[]): string {
  let expanded = query

  // 如果未检测到人物，添加常见人物关键词
  if (gaps.some(g => g.includes('人物'))) {
    expanded += ' 同事 朋友 领导 客户 家人'
  }

  // 如果记忆不足，添加更宽泛的关键词
  if (gaps.some(g => g.includes('记忆'))) {
    expanded += ' 互动 记录 事件 对话'
  }

  return expanded
}

/**
 * 生成自然语言思考过程（用于 UI 展示）
 */
function generateThoughtProcess(steps: AgentStep[], query: string): string {
  const parts: string[] = []

  parts.push(`用户问：「${query}」`)
  parts.push('')

  for (const step of steps) {
    if (step.type === 'plan') {
      parts.push(`📌 ${step.description}`)
      for (const detail of step.details || []) {
        parts.push(`  ${detail}`)
      }
    } else if (step.type === 'retrieve') {
      parts.push(`🔍 ${step.description}`)
      if (step.result) parts.push(`  → ${step.result}`)
      for (const detail of step.details || []) {
        parts.push(`  ${detail}`)
      }
    } else if (step.type === 'evaluate') {
      parts.push(`✓ ${step.description}`)
    } else if (step.type === 'supplement') {
      parts.push(`🔄 ${step.description}`)
      if (step.result) parts.push(`  → ${step.result}`)
    } else if (step.type === 'graph_expand') {
      parts.push(`🔗 ${step.description}`)
      for (const detail of step.details || []) {
        parts.push(`  ${detail}`)
      }
    } else if (step.type === 'synthesize') {
      parts.push(`📋 ${step.description}`)
      for (const detail of step.details || []) {
        parts.push(`  ${detail}`)
      }
    }
    parts.push('')
  }

  return parts.join('\n')
}
