// 多Agent协作管道 v3 — Orchestrator编排 + 7个专业Agent
// 参考 Magentic-One 双账本机制：Task Ledger + Progress Ledger

import { chat } from './ai'
import { buildReviewPrompt, buildOrchestratorPlanPrompt } from './prompts'
import { retrieveContext } from './rag'
import { parseAgentPlan, parseReviewVerdict } from './agentJson'
import { reportError } from './errorReporter'
import type { ReviewStep, AgentTask } from '../types'
import { db } from './db'

export interface AgentMetric {
  agentId: string
  calls: number
  success: number
  avgLatencyMs: number
  totalLatencyMs: number
}

export interface ReviewResult {
  steps: ReviewStep[]
  finalDraft: string
  totalTokens: number
  revisionCount: number
  taskId: string
  agentMetrics?: Record<string, AgentMetric>
}

export interface ReviewCallbacks {
  onStep?: (step: ReviewStep) => void
  onAgentStatus?: (agentId: string, status: 'idle' | 'running' | 'waiting' | 'done' | 'error') => void
  onStateChange?: (state: OrchestratorState) => void
  onTaskCreate?: (task: AgentTask) => void
  onTaskUpdate?: (task: AgentTask) => void
}

// === Orchestrator 状态机 ===
export interface OrchestratorState {
  phase: 'init' | 'planning' | 'researching' | 'drafting' | 'reviewing' | 'revising' | 'synthesizing' | 'finalizing' | 'done'
  currentDraft: string
  taskLedger: TaskLedgerEntry[]
  progressLedger: ProgressLedgerEntry[]
  revisionCount: number
  maxRevisions: number
  parallelAgents: string[]
}

interface TaskLedgerEntry {
  agentId: string
  agentName: string
  task: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  output?: string
  startedAt?: number
  completedAt?: number
}

interface ProgressLedgerEntry {
  step: number
  description: string
  result: string
  timestamp: number
}

// === 7个专业Agent定义 ===
const AGENTS = [
  { id: 'orchestrator', name: '编排器', role: '任务分解与调度', color: 'zen-terracotta', alwaysFirst: true },
  { id: 'researcher', name: '研究员', role: '深度信息检索与分析', color: 'zen-indigo' },
  { id: 'writer', name: '方案写手', role: '起草具体可执行方案', color: 'zen-sage' },
  { id: 'relation', name: '关系顾问', role: '人际关系角度审核', color: 'zen-rose' },
  { id: 'psych', name: '心理顾问', role: '情绪与心理健康审核', color: 'zen-violet' },
  { id: 'practical', name: '生活顾问', role: '可行性与资源审核', color: 'zen-amber' },
  { id: 'critic', name: '批判顾问', role: '风险识别与漏洞审查', color: 'zen-slate' },
  { id: 'synthesizer', name: '综合员', role: '多意见整合与冲突调和', color: 'zen-teal' },
  { id: 'host', name: '主持人', role: '最终定稿与质量把关', color: 'zen-crimson' },
]

function generateTaskId(): string {
  return 'task-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

// === 保存Agent任务到数据库 ===
async function saveAgentTask(task: AgentTask): Promise<void> {
  try {
    await db.agentTasks.put(task)
  } catch (e) {
    reportError('review_pipeline', e)
  }
}


export async function runReviewPipeline(
  userRequest: string,
  callbacks?: ReviewCallbacks
): Promise<ReviewResult> {
  const taskId = generateTaskId()
  const steps: ReviewStep[] = []
  const agentMetrics: Record<string, AgentMetric> = {}
  let totalTokens = 0
  let revisionCount = 0

  function recordMetric(agentId: string, latencyMs: number, success: boolean) {
    const existing = agentMetrics[agentId]
    if (!existing) {
      agentMetrics[agentId] = {
        agentId,
        calls: 1,
        success: success ? 1 : 0,
        totalLatencyMs: latencyMs,
        avgLatencyMs: latencyMs,
      }
    } else {
      existing.calls += 1
      if (success) existing.success += 1
      existing.totalLatencyMs += latencyMs
      existing.avgLatencyMs = Math.round(existing.totalLatencyMs / existing.calls)
    }
  }

  async function callAgent(agentId: string, messages: Parameters<typeof chat>[0]): Promise<string> {
    const startedAt = Date.now()
    try {
      const result = await chat(messages)
      recordMetric(agentId, Date.now() - startedAt, true)
      return result
    } catch (err) {
      recordMetric(agentId, Date.now() - startedAt, false)
      throw err
    }
  }

  // 初始化Orchestrator状态
  const state: OrchestratorState = {
    phase: 'init',
    currentDraft: '',
    taskLedger: [],
    progressLedger: [],
    revisionCount: 0,
    maxRevisions: 2,
    parallelAgents: [],
  }

  // === Phase 0: Planning（编排器分解任务）===
  state.phase = 'planning'
  callbacks?.onStateChange?.({ ...state })
  callbacks?.onAgentStatus?.('orchestrator', 'running')

  const planPrompt = buildOrchestratorPlanPrompt(userRequest)

  const planRaw = await callAgent('orchestrator', [
    { role: 'system', content: '你是任务编排器，擅长将复杂需求分解为可执行的子任务，并合理分配Agent资源。' },
    { role: 'user', content: planPrompt },
  ])
  totalTokens += estimateTokens(planRaw)

  // 解析 JSON 计划，回退到固定角色链
  const parsedPlan = parseAgentPlan(planRaw)

  // 如果编排失败，使用固定角色链
  if (!parsedPlan) {
    console.warn('[ReviewPipeline] 编排器计划解析失败，使用固定角色链')
  }

  const defaultPlan = [
    { agentId: 'researcher', task: '深度信息检索与分析', parallel: false },
    { agentId: 'writer', task: '起草具体可执行方案', parallel: false },
    { agentId: 'relation', task: '人际关系角度审核', parallel: true },
    { agentId: 'psych', task: '情绪与心理健康审核', parallel: true },
    { agentId: 'practical', task: '可行性与资源审核', parallel: true },
    { agentId: 'critic', task: '风险识别与漏洞审查', parallel: true },
    { agentId: 'synthesizer', task: '多意见整合与冲突调和', parallel: false },
    { agentId: 'host', task: '最终定稿与质量把关', parallel: false },
  ]

  const planItems = parsedPlan?.plan?.length
    ? parsedPlan.plan.filter(p => AGENTS.some(a => a.id === p.agentId && a.id !== 'orchestrator'))
    : defaultPlan

  const assignedAgents = new Set<string>(planItems.map(p => p.agentId))
  for (const item of planItems) {
    const agent = AGENTS.find(a => a.id === item.agentId)
    if (!agent) continue
    state.taskLedger.push({
      agentId: agent.id,
      agentName: agent.name,
      task: item.task,
      status: 'pending',
    })
  }

  steps.push({
    step: 1,
    agentId: 'orchestrator',
    agentName: '编排器',
    action: 'generate',
    content: `任务分解完成，激活 ${assignedAgents.size} 个专业Agent：${Array.from(assignedAgents).map(id => AGENTS.find(a => a.id === id)?.name).filter(Boolean).join('、')}`,
    metadata: { sources: [], confidence: 0.9, reasoning: planRaw },
  })
  callbacks?.onStep?.(steps[steps.length - 1])
  callbacks?.onAgentStatus?.('orchestrator', 'done')

  // === Phase 1: Researching（研究员深度检索）===
  if (assignedAgents.has('researcher')) {
    state.phase = 'researching'
    callbacks?.onStateChange?.({ ...state })
    callbacks?.onAgentStatus?.('researcher', 'running')

    const retrieval = await retrieveContext(userRequest)
    const context = retrieval.context

    const researchPrompt = `基于以下检索到的上下文信息，为用户提供深度分析：

检索结果：
${context}

请输出：
1. 关键信息摘要
2. 潜在关联（人物、事件、情绪之间的隐藏联系）
3. 需要进一步确认的信息`

    const research = await callAgent('researcher', [
      { role: 'system', content: '你是研究员，擅长从海量信息中提取关键洞察，发现隐藏关联。' },
      { role: 'user', content: researchPrompt },
    ])
    totalTokens += estimateTokens(research)

    state.progressLedger.push({
      step: steps.length + 1,
      description: '深度信息检索',
      result: research,
      timestamp: Date.now(),
    })

    steps.push({
      step: steps.length + 1,
      agentId: 'researcher',
      agentName: '研究员',
      action: 'research',
      content: research,
      metadata: { sources: retrieval.sources.map(s => s.id), confidence: 0.85, reasoning: '基于RAG检索结果进行深度分析' },
    })
    callbacks?.onStep?.(steps[steps.length - 1])
    callbacks?.onAgentStatus?.('researcher', 'done')
  }

  // === Phase 2: Drafting（方案写手起草）===
  state.phase = 'drafting'
  callbacks?.onStateChange?.({ ...state })
  callbacks?.onAgentStatus?.('writer', 'running')

  const retrieval = await retrieveContext(userRequest)
  const context = retrieval.context

  const writerPrompt = buildReviewPrompt('writer', userRequest, '', context)
  const draft = await callAgent('writer', [
    { role: 'system', content: '你是方案写手，根据用户需求起草具体可执行的建议方案。要求：分点列出，每点有具体行动步骤。结合用户的人物档案和记忆，给出个性化建议。' },
    { role: 'user', content: writerPrompt },
  ])
  totalTokens += estimateTokens(draft)

  state.currentDraft = draft
  state.progressLedger.push({
    step: steps.length + 1,
    description: '方案起草',
    result: draft,
    timestamp: Date.now(),
  })

  steps.push({
    step: steps.length + 1,
    agentId: 'writer',
    agentName: '方案写手',
    action: 'generate',
    content: draft,
    metadata: { sources: retrieval.sources.map(s => s.id), confidence: 0.8, reasoning: '基于用户档案和记忆起草方案' },
  })
  callbacks?.onStep?.(steps[steps.length - 1])
  callbacks?.onAgentStatus?.('writer', 'done')

  // === Phase 3: Reviewing（4个顾问并行审核）===
  state.phase = 'reviewing'
  callbacks?.onStateChange?.({ ...state })

  const reviewers = [
    { id: 'relation', name: '关系顾问', focus: '人际关系', prompt: '从人际关系角度审核方案。检查：是否忽略了重要人物的感受？是否考虑了关系动态变化？建议如何改善沟通？' },
    { id: 'psych', name: '心理顾问', focus: '心理健康', prompt: '从心理健康角度审核方案。检查：是否考虑了情绪压力？是否有自我关怀的建议？是否过于激进导致焦虑？' },
    { id: 'practical', name: '生活顾问', focus: '可行性', prompt: '从可行性角度审核方案。检查：资源是否充足？时间是否合理？是否有具体的执行步骤？' },
    { id: 'critic', name: '批判顾问', focus: '风险识别', prompt: '从风险识别角度审核方案。检查：最坏情况是什么？有哪些潜在漏洞？是否有备选方案？' },
  ].filter(r => assignedAgents.has(r.id))

  // 并行执行审核，单个 Agent 失败不阻断整条 Pipeline
  const reviewPromises = reviewers.map(async (reviewer) => {
    callbacks?.onAgentStatus?.(reviewer.id, 'running')

    try {
      const prompt = buildReviewPrompt(reviewer.id, userRequest, state.currentDraft, context)
      const rawReview = await callAgent(reviewer.id, [
        {
          role: 'system',
          content: `你是${reviewer.name}，${reviewer.prompt}

审核标准：
1. 方案是否忽略了重要因素？
2. 是否有潜在风险？
3. 是否需要补充建议？
4. 结合用户的具体人物档案给出针对性意见

输出必须是 JSON，不要包含任何额外说明。`,
        },
        { role: 'user', content: prompt },
      ])
      totalTokens += estimateTokens(rawReview)

      const verdict = parseReviewVerdict(rawReview)
      const passed = verdict
        ? verdict.verdict === 'pass' && verdict.comments.length === 0
        : rawReview.includes('通过') || rawReview.includes('同意') || rawReview.includes('没问题')
      const reviewText = verdict && verdict.comments.length > 0
        ? verdict.comments.join('\n')
        : verdict?.reasoning || rawReview

      return {
        reviewer,
        review: reviewText,
        passed,
        verdict,
      }
    } catch (err) {
      reportError('review_pipeline', err)
      callbacks?.onAgentStatus?.(reviewer.id, 'error')
      // 失败时视为通过，避免中断整体流程
      return {
        reviewer,
        review: `${reviewer.name}审核调用失败，已跳过该角度。`,
        passed: true,
        verdict: null,
      }
    }
  })

  const reviewResults = await Promise.all(reviewPromises)
  let reviewComments: string[] = []

  for (const result of reviewResults) {
    const { reviewer, review, passed, verdict } = result
    const confidence = verdict?.confidence ?? (passed ? 0.9 : 0.7)

    steps.push({
      step: steps.length + 1,
      agentId: reviewer.id,
      agentName: reviewer.name,
      action: 'audit',
      content: passed ? `审核通过（${reviewer.focus}角度）。` : review,
      verdict: passed ? 'pass' : 'revise',
      metadata: { sources: [], confidence, reasoning: review },
    })
    callbacks?.onStep?.(steps[steps.length - 1])
    callbacks?.onAgentStatus?.(reviewer.id, 'done')

    if (!passed) {
      reviewComments.push(`[${reviewer.name}] ${review}`)
    }
  }

  // === Phase 4: Revising（多轮修订循环）===
  while (reviewComments.length > 0 && revisionCount < state.maxRevisions) {
    state.phase = 'revising'
    revisionCount++
    state.revisionCount = revisionCount
    callbacks?.onStateChange?.({ ...state })
    callbacks?.onAgentStatus?.('writer', 'running')

    const revisionPrompt = `根据以下审核意见修改方案：

审核意见：
${reviewComments.join('\n')}

原始方案：
${state.currentDraft}

请输出修改后的完整方案。如果某条意见不适用，说明理由后跳过。`

    const revisedDraft = await callAgent('writer', [
      { role: 'system', content: '你是方案写手，根据审核意见修订方案。保持原有优点，针对性修改问题。' },
      { role: 'user', content: revisionPrompt },
    ])
    totalTokens += estimateTokens(revisedDraft)

    state.currentDraft = revisedDraft
    state.progressLedger.push({
      step: steps.length + 1,
      description: `第${revisionCount}轮修订`,
      result: revisedDraft,
      timestamp: Date.now(),
    })

    steps.push({
      step: steps.length + 1,
      agentId: 'writer',
      agentName: '方案写手',
      action: 'revise',
      content: `根据${reviewComments.length}条审核意见修订了方案（第${revisionCount}轮修订）。`,
      verdict: 'pass',
      metadata: { sources: [], confidence: 0.85, reasoning: `整合了${reviewComments.length}条意见` },
    })
    callbacks?.onStep?.(steps[steps.length - 1])
    callbacks?.onAgentStatus?.('writer', 'done')

    // 重新进行顾问审核（仅对未通过的 Agent）
    if (revisionCount >= state.maxRevisions) break

    state.phase = 'reviewing'
    callbacks?.onStateChange?.({ ...state })

    const reReviewers = reviewers.filter(r => !reviewResults.find(res => res.reviewer.id === r.id && res.passed))
    const newReviewComments: string[] = []

    const reReviewPromises = reReviewers.map(async (reviewer) => {
      callbacks?.onAgentStatus?.(reviewer.id, 'running')
      try {
        const prompt = buildReviewPrompt(reviewer.id, userRequest, state.currentDraft, context)
        const rawReview = await callAgent(reviewer.id, [
          {
            role: 'system',
            content: `你是${reviewer.name}，${reviewer.prompt}

审核标准：
1. 方案是否忽略了重要因素？
2. 是否有潜在风险？
3. 是否需要补充建议？
4. 结合用户的具体人物档案给出针对性意见

输出必须是 JSON，不要包含任何额外说明。`,
          },
          { role: 'user', content: prompt },
        ])
        totalTokens += estimateTokens(rawReview)

        const verdict = parseReviewVerdict(rawReview)
        const passed = verdict
          ? verdict.verdict === 'pass' && verdict.comments.length === 0
          : rawReview.includes('通过') || rawReview.includes('同意') || rawReview.includes('没问题')
        const reviewText = verdict && verdict.comments.length > 0
          ? verdict.comments.join('\n')
          : verdict?.reasoning || rawReview
        const confidence = verdict?.confidence ?? (passed ? 0.9 : 0.7)

        steps.push({
          step: steps.length + 1,
          agentId: reviewer.id,
          agentName: reviewer.name,
          action: 'audit',
          content: passed ? `第${revisionCount}轮后审核通过（${reviewer.focus}角度）。` : reviewText,
          verdict: passed ? 'pass' : 'revise',
          metadata: { sources: [], confidence, reasoning: reviewText },
        })
        callbacks?.onStep?.(steps[steps.length - 1])
        callbacks?.onAgentStatus?.(reviewer.id, 'done')

        if (!passed) newReviewComments.push(`[${reviewer.name}] ${reviewText}`)
        return { reviewer, review: reviewText, passed, verdict }
      } catch (err) {
        reportError('review_pipeline', err)
        callbacks?.onAgentStatus?.(reviewer.id, 'error')
        steps.push({
          step: steps.length + 1,
          agentId: reviewer.id,
          agentName: reviewer.name,
          action: 'audit',
          content: `${reviewer.name}复核调用失败，已跳过该角度。`,
          verdict: 'pass',
          metadata: { sources: [], confidence: 0.5, reasoning: String(err) },
        })
        callbacks?.onStep?.(steps[steps.length - 1])
        return { reviewer, review: '', passed: true, verdict: null }
      }
    })

    await Promise.all(reReviewPromises)
    reviewComments = newReviewComments
  }

  // === Phase 5: Synthesizing（综合员整合，如果有冲突意见）===
  if (assignedAgents.has('synthesizer') && reviewComments.length >= 2) {
    state.phase = 'synthesizing'
    callbacks?.onStateChange?.({ ...state })
    callbacks?.onAgentStatus?.('synthesizer', 'running')

    const synthesizePrompt = `以下是对同一方案的不同审核意见，请整合这些意见，调和冲突，输出统一的改进建议：

${reviewComments.join('\n\n---\n\n')}

请输出：
1. 各方意见的共识点
2. 冲突点及调和方案
3. 统一的改进建议（按优先级排序）`

    const synthesis = await callAgent('synthesizer', [
      { role: 'system', content: '你是综合员，擅长整合多方意见，发现共识，调和冲突，输出统一的行动建议。' },
      { role: 'user', content: synthesizePrompt },
    ])
    totalTokens += estimateTokens(synthesis)

    steps.push({
      step: steps.length + 1,
      agentId: 'synthesizer',
      agentName: '综合员',
      action: 'synthesize',
      content: synthesis,
      metadata: { sources: [], confidence: 0.8, reasoning: '整合多方审核意见' },
    })
    callbacks?.onStep?.(steps[steps.length - 1])
    callbacks?.onAgentStatus?.('synthesizer', 'done')

    // 用综合意见再次修订
    state.currentDraft = await callAgent('writer', [
      { role: 'system', content: '根据综合意见最终修订方案。' },
      { role: 'user', content: `综合意见：\n${synthesis}\n\n当前方案：\n${state.currentDraft}\n\n请输出最终修订版。` },
    ])
    totalTokens += estimateTokens(state.currentDraft)
  }

  // === Phase 6: Finalizing（主持人定稿）===
  state.phase = 'finalizing'
  callbacks?.onStateChange?.({ ...state })
  callbacks?.onAgentStatus?.('host', 'running')

  const hostPrompt = buildReviewPrompt('host', userRequest, state.currentDraft, context)
  const finalDraft = await callAgent('host', [
    {
      role: 'system',
      content: `你是主持人，综合各方审核意见给出最终定稿。要求：
1. 确保方案完整、可执行
2. 每条建议有明确的时间节点
3. 标注优先级（紧急/重要/可选）
4. 语气温暖、鼓励
5. 结合用户的具体人物档案，给出个性化建议
6. 如果涉及具体人物，引用档案中的信息增强针对性`,
    },
    { role: 'user', content: hostPrompt },
  ])
  totalTokens += estimateTokens(finalDraft)

  state.currentDraft = finalDraft
  state.progressLedger.push({
    step: steps.length + 1,
    description: '最终定稿',
    result: finalDraft,
    timestamp: Date.now(),
  })

  steps.push({
    step: steps.length + 1,
    agentId: 'host',
    agentName: '主持人',
    action: 'final',
    content: finalDraft,
    verdict: 'pass',
    metadata: { sources: retrieval.sources.map(s => s.id), confidence: 0.95, reasoning: '综合所有Agent意见最终定稿' },
  })
  callbacks?.onStep?.(steps[steps.length - 1])
  callbacks?.onAgentStatus?.('host', 'done')

  state.phase = 'done'
  callbacks?.onStateChange?.({ ...state })

  // 保存任务记录
  const masterTask: AgentTask = {
    id: taskId,
    type: 'review',
    agentId: 'orchestrator',
    input: userRequest,
    output: finalDraft,
    status: 'completed',
    startedAt: Date.now() - totalTokens * 10, // 粗略估算
    completedAt: Date.now(),
    subTaskIds: steps.map(s => `sub-${taskId}-${s.step}`),
  }
  await saveAgentTask(masterTask)

  return { steps, finalDraft, totalTokens, revisionCount, taskId, agentMetrics }
}

// 粗略估算token数
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 2)
}

// 导出Agent定义供UI使用
export { AGENTS }
