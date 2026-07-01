import { safeStreamChat, isBackendUnavailable, type LLMMessage } from './ai'
import { generateDemoReply } from './demoReply'
import { buildSystemPromptV2, extractUserPreferences, mergeUserPreferences } from './soul'
import { retrieveContext, type RetrievalResult } from './rag'
import { extractMemoriesFromConversation, saveExtractedMemories } from './memoryExtractor'
import { pluginEngine } from './pluginEngine'
import { findCachedQuery, cacheQuery } from './queryCache'
import { getResponseStyleParams } from './config'
import { detectIntent, type ConversationIntent } from './conversationIntent'
import { classifyQuery } from './queryClassifier'
import { detectHallucination } from './hallucinationDetector'
import { agenticRAG, type AgentStep } from './agenticRAG'
import { runMCPTools, type MCPToolCall } from './mcpProtocol'
import type { GraphRAGResult } from './graphRAG'
import type { Memory } from '../types'
import { buildSocialIntelligenceContext } from './socialIntelligence'
import { validateReply, type ReplyValidationResult } from './replyValidator'
import { hasValueSignal, extractValueSignalsFast, mergeValueSystem, extractValueSystemWithAI } from './valueSystem'

export interface ChatPipelineOptions {
  userContent: string
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>
  onStream: (chunk: string) => void
  onAgentStep?: (step: AgentStep) => void  // Agentic RAG 思考步骤回调
}

export interface ChatPipelineResult {
  response: string
  model: string
  retrieval: RetrievalResult
  durationMs: number
  mode?: 'live' | 'demo'
  intent?: ConversationIntent | null  // 检测到的对话意图
  agentSteps?: AgentStep[]            // Agentic RAG 思考步骤
  graphRAG?: GraphRAGResult           // GraphRAG 关系链结果
  mcpCalls?: MCPToolCall[]            // MCP 工具调用记录
  thoughtProcess?: string             // 自然语言思考过程
}

// OPT-7: 会话级上下文缓存（最近 3 轮的检索结果）
// 追问场景下继承上一轮的人物和记忆上下文
const conversationContext: {
  recentRetrievals: RetrievalResult[]
  recentEntities: Set<string>
} = {
  recentRetrievals: [],
  recentEntities: new Set(),
}

/** 重置会话上下文（新对话时调用） */
export function resetConversationContext() {
  conversationContext.recentRetrievals = []
  conversationContext.recentEntities.clear()
}

export async function processUserMessage(options: ChatPipelineOptions): Promise<ChatPipelineResult> {
  const { userContent, messages, onStream } = options
  const startTime = Date.now()

  // 检测对话意图（记住/删除/修改/提醒/新增人物）
  const intent = detectIntent(userContent)

  const cached = await findCachedQuery(userContent)
  if (cached.entry) {
    const retrieval = cached.entry.ragResult as RetrievalResult
    return {
      response: cached.entry.llmResponse,
      model: `cached-${cached.method}`,
      retrieval,
      durationMs: Date.now() - startTime,
      intent,
    }
  }

  // OPT-7: 多轮上下文累积 — 追问场景下继承上一轮的检索结果
  const isFollowUp = userContent.length < 20 &&
    /(他|她|它|这个|那个|怎么办|怎么说|然后呢|继续|呢|吧)/.test(userContent) &&
    conversationContext.recentRetrievals.length > 0

  // 判断是否使用 Agentic RAG（复杂查询使用多步检索，简单查询直接检索）
  // FIX: 后端不可用时禁用 Agentic RAG（需要 AI 调用）
  const isComplexQuery = !isFollowUp && !isBackendUnavailable() && userContent.length >= 8 &&
    /(谁.*认识|谁.*介绍|人脉|关系.*怎么样|温度|疏远|亲近|冷淡|怎么.*办|如何.*应对|建议|分析|帮我.*找|为什么|原因)/.test(userContent)

  let retrieval: RetrievalResult
  let agentSteps: AgentStep[] | undefined
  let thoughtProcess: string | undefined

  if (isComplexQuery && options.onAgentStep) {
    // === Agentic RAG 路径：规划 → 检索 → 评估 → 补充 → 图谱扩展 → 综合 ===
    const agenticResult = await agenticRAG(userContent, options.onAgentStep)
    retrieval = agenticResult.retrievalResult
    agentSteps = agenticResult.steps
    thoughtProcess = agenticResult.thoughtProcess
    console.log('[ChatPipeline] Agentic RAG 完成:', agenticResult.iterations, '轮迭代,',
      agenticResult.totalDuration, 'ms')
  } else {
    // === 标准检索路径 ===
    // FIX: 添加 5 秒超时保护，防止嵌入重试导致长时间卡顿
    let freshRetrieval: RetrievalResult
    try {
      freshRetrieval = await Promise.race([
        retrieveContext(userContent),
        new Promise<RetrievalResult>((_, reject) =>
          setTimeout(() => reject(new Error('检索超时')), 5000)
        ),
      ])
    } catch (retrievalErr) {
      console.warn('[ChatPipeline] 检索超时或失败，使用空结果降级:', retrievalErr)
      freshRetrieval = {
        memories: [],
        people: [],
        diaries: [],
        context: '',
        method: 'keyword',
        tiers: { hot: 0, warm: 0, cold: 0 },
        sources: [],
      }
    }

    if (isFollowUp && conversationContext.recentRetrievals.length > 0) {
      // 追问：合并上一轮的检索结果（去重，上一轮优先）
      const lastRetrieval = conversationContext.recentRetrievals[conversationContext.recentRetrievals.length - 1]
      const existingIds = new Set(freshRetrieval.memories.map(m => m.id))
      const inherited = lastRetrieval.memories.filter(m => !existingIds.has(m.id)).slice(0, 3)

      retrieval = {
        ...freshRetrieval,
        memories: [...freshRetrieval.memories, ...inherited],
        people: [...freshRetrieval.people, ...lastRetrieval.people.filter(p =>
          !freshRetrieval.people.find(np => np.id === p.id)
        )],
      }
      console.log('[ChatPipeline] 检测到追问，继承上一轮上下文:', inherited.length, '条记忆')
    } else {
      retrieval = freshRetrieval
    }
  }

  // 更新会话上下文
  conversationContext.recentRetrievals.push(retrieval)
  if (conversationContext.recentRetrievals.length > 3) {
    conversationContext.recentRetrievals.shift()
  }
  retrieval.people.forEach(p => conversationContext.recentEntities.add(p.name))

  const pluginCtx = {
    userInput: userContent,
    messages: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    memories: retrieval.memories,
    people: retrieval.people,
    diaries: retrieval.diaries,
    userProfile: localStorage.getItem('hengzhou-user-profile') || '',
  }

  const pluginResult = await pluginEngine.beforeChat(pluginCtx)
  const finalInput = pluginResult.modifiedInput || userContent
  const extraPrompt = pluginResult.extraSystemPrompt || ''

  // === MCP 工具调用 ===
  // 企业级技术降维：Anthropic MCP → 个人 AI 助手工具调用
  // AI 自动判断是否需要查询日历、通讯录、日记、关系图谱
  let mcpCalls: MCPToolCall[] = []
  let mcpContext = ''
  try {
    const mcpResult = await runMCPTools(userContent)
    mcpCalls = mcpResult.calls
    mcpContext = mcpResult.enhancedContext
    if (mcpCalls.length > 0) {
      console.log('[ChatPipeline] MCP 工具调用:', mcpCalls.length, '个工具')
    }
  } catch (e) {
    console.warn('[ChatPipeline] MCP 工具调用失败:', e)
  }

  // Soul 系统：从用户消息中自动提取偏好（轻量级 heuristics，不调用 AI）
  try {
    const prefUpdates = extractUserPreferences(userContent, '')
    if (prefUpdates) {
      mergeUserPreferences(prefUpdates)
      console.log('[Soul] 用户偏好已更新:', prefUpdates)
    }
  } catch {
    // 偏好提取失败不影响主流程
  }

  // 价值体系：从用户消息中提取价值观（先快速规则，后AI深度提取）
  try {
    if (hasValueSignal(userContent)) {
      // 第一步：快速规则提取（同步，不调 AI）
      const fastResult = extractValueSignalsFast(userContent)
      if (fastResult) {
        mergeValueSystem(fastResult)
        console.log('[ValueSystem] 快速规则提取:', fastResult)
      }
      // 第二步：AI 深度提取（异步，不阻塞主流程）
      extractValueSystemWithAI(userContent, messages.map(m => ({ role: m.role, content: m.content })))
        .then((aiResult) => {
          if (aiResult) {
            mergeValueSystem(aiResult)
            console.log('[ValueSystem] AI深度提取:', aiResult)
          }
        })
        .catch((e) => console.warn('[ValueSystem] AI提取失败:', e))
    }
  } catch {
    // 价值观提取失败不影响主流程
  }

  // 社交智能上下文：差序格局+面子评估+高语境信号+人情账本
  const targetPerson = retrieval.people[0]
  let socialContext = ''
  try {
    socialContext = buildSocialIntelligenceContext(targetPerson, userContent, retrieval.memories)
    if (socialContext) {
      console.log('[SocialIntelligence] 社交智能上下文已注入')
    }
  } catch (e) {
    console.warn('[SocialIntelligence] 上下文生成失败:', e)
  }

  const systemPrompt =
    buildSystemPromptV2({
      relevantMemories: retrieval.memories,
      relevantPeople: retrieval.people,
      recentMessages: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    }) + (extraPrompt ? '\n\n' + extraPrompt : '') + (mcpContext ? '\n\n' + mcpContext : '') + (socialContext ? '\n\n' + socialContext : '')

  const history: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-10).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: finalInput },
  ]

  // 根据用户设置的回复风格获取温度和字数参数
  const styleParams = getResponseStyleParams()

  // OPT-4: 动态 temperature — 事实查询用低温度减少创造性，情绪支持用较高温度增加共情
  const classification = classifyQuery(userContent)
  const dynamicTemp = classification.type === 'fact_lookup'
    ? 0.2
    : classification.type === 'emotional_support'
    ? 0.7
    : 0.4

  let fullContent = ''
  let model = 'unknown'
  let mode: 'live' | 'demo' = 'live'
  let stream: AsyncIterable<string>

  try {
    const streamResult = await safeStreamChat(history, {
      temperature: dynamicTemp,
      maxTokens: styleParams.maxTokens,
    })
    stream = streamResult.stream
    model = streamResult.model
    mode = streamResult.mode

    if (mode === 'demo') {
      // demo 模式下 safeStreamChat 返回的 stream 已经模拟了逐字输出
      for await (const chunk of stream) {
        fullContent += chunk
        onStream(fullContent)
      }
    } else {
      for await (const chunk of stream) {
        fullContent += chunk
        onStream(fullContent)
      }
    }
  } catch (apiError) {
    // AI API 不可用时，降级到 Demo 预设回复
    console.warn('[ChatPipeline] AI API 不可用，降级到 Demo 模式:', apiError)

    // FIX: 不再因 intent 提前返回空响应，Demo 模式下也展示预设回复
    // API 不可用时，走 Demo 预设回复，模拟流式输出
    const demoText = generateDemoReply(userContent, {
      hasPeople: retrieval.people.length > 0,
      hasMemories: retrieval.memories.length > 0,
    })
    for (const ch of demoText.split('')) {
      fullContent += ch
      onStream(fullContent)
      await new Promise(r => setTimeout(r, 8))
    }
    mode = 'demo'
    model = 'demo-local'
  }

  // 空回复检测：API 不可用时流可能返回空内容
  // FIX: 空回复时降级到 Demo 回复，而非抛出错误
  if (!fullContent.trim()) {
    console.warn('[ChatPipeline] AI 返回空回复，降级到 Demo 模式')
    const fallbackText = generateDemoReply(userContent, {
      hasPeople: retrieval.people.length > 0,
      hasMemories: retrieval.memories.length > 0,
    })
    for (const ch of fallbackText.split('')) {
      fullContent += ch
      onStream(fullContent)
      await new Promise(r => setTimeout(r, 8))
    }
    mode = 'demo'
    model = 'demo-local'
  }

  // OPT-4: 事后幻觉检测 — 提取 AI 响应中的事实声明，与记忆库比对
  const hallucinationCheck = detectHallucination(fullContent, retrieval.memories)
  if (hallucinationCheck.suspected) {
    console.warn('[Hallucination] 疑似幻觉:', hallucinationCheck.suspectedFacts)
  }

  // 社交智能校验：国情合规+面子风险+六情机检测
  let replyValidation: ReplyValidationResult | undefined
  try {
    replyValidation = validateReply(fullContent, userContent, targetPerson, retrieval.memories)
    if (!replyValidation.passed) {
      console.warn('[ReplyValidator] 回复校验未通过:', {
        qualityScore: replyValidation.qualityScore,
        issues: replyValidation.culturalCompliance.issues.length,
        faceRisk: replyValidation.faceRisk,
        negativeTriggers: replyValidation.negativeTriggers.length,
      })
    }
  } catch (e) {
    console.warn('[ReplyValidator] 校验失败:', e)
  }

  cacheQuery(userContent, retrieval, fullContent).catch(() => {})

  extractMemoriesFromConversation(userContent, fullContent)
    .then(async (extraction) => {
      if (extraction.memories.length > 0) {
        const afterCtx = { ...pluginCtx, memories: extraction.memories as unknown as Memory[] }
        const processed = await pluginEngine.afterMemoryExtract(
          extraction.memories as unknown as Memory[],
          afterCtx
        )
        const saved = await saveExtractedMemories(
          { ...extraction, memories: processed as unknown as typeof extraction.memories },
          'auto-extract'
        )
        // 通知提醒系统重新检查（新记忆可能包含待办/承诺等需要提醒的内容）
        if (saved && saved.length > 0) {
          window.dispatchEvent(new CustomEvent('hengzhou-new-memory'))
        }
        return saved
      }
      return []
    })
    .catch((e) => console.warn('[ChatPipeline] memory extraction failed', e))

  return {
    response: fullContent,
    model,
    retrieval,
    durationMs: Date.now() - startTime,
    mode: mode === 'demo' ? 'demo' : 'live',
    intent,
    agentSteps,
    graphRAG: retrieval.graphRAG,
    mcpCalls: mcpCalls.length > 0 ? mcpCalls : undefined,
    thoughtProcess,
  }
}
