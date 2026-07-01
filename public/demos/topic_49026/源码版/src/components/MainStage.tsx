import { useRef, useEffect, useState, useCallback } from 'react'
import { Send, Mic, Menu, MoreHorizontal, Sparkles, CheckCircle2, PenLine, Bell, Link2, MessageCircle } from 'lucide-react'
import { useConversationStore } from '../stores/useConversationStore'
import { useAgentStore } from '../stores/useAgentStore'
import { useUIStore } from '../stores/useUIStore'
import { useDataStore } from '../stores/useDataStore'
import { useThemeStore } from '../stores/useThemeStore'
import { ReminderBar } from './ReminderBar'
import { ChatDrawer } from './ChatDrawer'
import { AttachmentMenu } from './AttachmentMenu'
import { MessageContextMenu } from './MessageContextMenu'
import { InlinePersonHint } from './InlinePersonHint'
import { ScenarioCards } from './ScenarioCards'
import { ThinkingRipple } from './ThinkingRipple'
import { AgenticThinkingPanel } from './AgenticThinkingPanel'
import { GraphRAGChainDisplay } from './GraphRAGChainDisplay'
import { MCPToolIndicator } from './MCPToolIndicator'
import { CacheStatsBadge } from './CacheStatsBadge'
import { EmotionPulseBar } from './EmotionPulseBar'
import { SwipeableActionCards } from './SwipeableActionCards'
import { DivergentAnalysis } from './DivergentAnalysis'
import { generateReplySuggestions, type ReplySuggestion } from '../services'
import { processUserMessage } from '../lib/chatPipeline'
import { detectIntent } from '../lib/conversationIntent'
import { IntentConfirmCard } from './IntentConfirmCard'
import { runReviewPipeline } from '../lib/reviewPipeline'
import { suggestActions, executeAction, type ActionSuggestion } from '../lib/actionEngine'
import { reportError } from '../lib/errorReporter'
import { track } from '../lib/analytics'
import { getModel } from '../lib/config'
import type { ReviewStep } from '../types'
import type { AgentStep } from '../lib/agenticRAG'
import type { GraphRAGResult } from '../lib/graphRAG'
import type { MCPToolCall } from '../lib/mcpProtocol'

// 本地声明 Web Speech API 类型（项目未安装 @types/dom-speech-recognition）
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

interface ContextMenuState {
  open: boolean
  x: number
  y: number
  message: string
}

// === 首次使用引导：快捷指令示例 ===
interface QuickCommand {
  icon: React.ComponentType<{ className?: string }>
  text: string
  label: string
}

const QUICK_COMMANDS: QuickCommand[] = [
  { icon: PenLine, text: '记住：我老婆生日是3月15日', label: '记录信息' },
  { icon: Bell, text: '提醒我周五开会', label: '设置提醒' },
  { icon: Link2, text: '赵海明和王思亮是同学', label: '记录人物关系' },
  { icon: MessageCircle, text: '我妈让我端午节回绍兴', label: '聊聊近况' },
]

export function MainStage() {
  // === 主题状态 ===
  const currentTheme = useThemeStore((s) => s.currentTheme)

  // === 对话状态（保留） ===
  const messages = useConversationStore((s) => s.messages)
  const addMessage = useConversationStore((s) => s.addMessage)
  const setMessages = useConversationStore((s) => s.setMessages)
  const inputText = useConversationStore((s) => s.inputText)
  const setInputText = useConversationStore((s) => s.setInputText)
  const isGenerating = useConversationStore((s) => s.isGenerating)
  const setIsGenerating = useConversationStore((s) => s.setIsGenerating)

  // === Agent 状态（保留） ===
  const reviewSteps = useAgentStore((s) => s.reviewSteps)
  const setReviewSteps = useAgentStore((s) => s.setReviewSteps)
  const setAgentStatus = useAgentStore((s) => s.setAgentStatus)
  const agents = useAgentStore((s) => s.agents)

  // === UI 状态（保留） ===
  const setLastRetrievalInfo = useUIStore((s) => s.setLastRetrievalInfo)
  const lastRetrievalInfo = useUIStore((s) => s.lastRetrievalInfo)
  const setActiveNav = useUIStore((s) => s.setActiveNav)

  // === 数据状态（保留） ===
  const hasDemoData = useDataStore((s) => s.hasDemoData)
  const clearDemoData = useDataStore((s) => s.clearDemoData)

  // === Refs（保留） ===
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reviewStepsRef = useRef<ReviewStep[]>([])
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // === 状态（保留） ===
  const [streamingContent, setStreamingContent] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  const [moodPlaceholder, setMoodPlaceholder] = useState('和衡舟聊聊...')
  const [replySuggestions, setReplySuggestions] = useState<ReplySuggestion[]>([])
  // 建议回复延迟显示，避免首条消息信息过载
  const [replySuggestionsVisible, setReplySuggestionsVisible] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  // 防止 ReplySuggestions 对同一条消息重复调用
  const lastSuggestionMsgId = useRef<string | null>(null)
  const [actions, setActions] = useState<ActionSuggestion[]>([])

  // === 企业级技术降维 UI 状态 ===
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([])
  const [graphRAGResult, setGraphRAGResult] = useState<GraphRAGResult | null>(null)
  const [mcpCalls, setMcpCalls] = useState<MCPToolCall[]>([])
  const [thoughtProcess, setThoughtProcess] = useState<string | undefined>(undefined)

  // === 移动端新增状态 ===
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ open: false, x: 0, y: 0, message: '' })
  const [showDivergent, setShowDivergent] = useState(false)
  const [detectedPerson, setDetectedPerson] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  // 导览期间隐藏所有横幅
  const [guideTourActive, setGuideTourActive] = useState(false)

  useEffect(() => {
    const onGuideActive = (e: Event) => {
      const active = (e as CustomEvent).detail === true
      setGuideTourActive(active)
    }
    window.addEventListener('hengzhou-guide-active', onGuideActive)
    return () => window.removeEventListener('hengzhou-guide-active', onGuideActive)
  }, [])

  // === 工具函数（保留） ===
  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return '刚刚'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}天前`
    return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const detectMood = (text: string): string => {
    const sad = ['累', '烦', '难受', '不开心', '焦虑', '压力', '失眠', '痛苦', '难过', '郁闷', '愁']
    const happy = ['开心', '高兴', '好', '棒', '顺利', '幸福', '快乐', '成功']

    if (sad.some(w => text.includes(w))) return '我在听，慢慢说'
    if (happy.some(w => text.includes(w))) return '真好，跟我说说？'
    return '和衡舟聊聊...'
  }

  const getInputBorder = (text: string): string => {
    const sad = ['累', '烦', '难受', '不开心', '焦虑', '压力', '失眠']
    const happy = ['开心', '高兴', '好', '棒', '顺利', '幸福']
    if (sad.some(w => text.includes(w))) return 'border-zen-rose/40 focus-within:border-zen-rose/60 shadow-sm'
    if (happy.some(w => text.includes(w))) return 'border-zen-sage/40 focus-within:border-zen-sage/60 shadow-sm'
    return 'border-ink-muted/30 focus-within:border-zen-terracotta/50 shadow-sm'
  }

  const getEmotionBg = (text: string): string => {
    const sad = ['累', '烦', '难受', '不开心', '焦虑', '压力', '失眠', '孤独', '害怕', '迷茫']
    const happy = ['开心', '高兴', '好棒', '顺利', '幸福', '感谢', '期待', '喜欢', '满足', '骄傲']
    if (sad.some(w => text.includes(w))) return 'bg-zen-rose/5'
    if (happy.some(w => text.includes(w))) return 'bg-zen-sage/5'
    return ''
  }

  // === Effects（保留） ===

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, reviewSteps, streamingContent])

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [inputText])

  // 读取来自 DemoDayPage 的 pending prompt
  useEffect(() => {
    const pending = localStorage.getItem('hengzhou_pending_prompt')
    if (pending) {
      setInputText(pending)
      localStorage.removeItem('hengzhou_pending_prompt')
      textareaRef.current?.focus()
    }
  }, [setInputText])

  // 监听 Bell 按钮的滚动到提醒事件
  useEffect(() => {
    const handler = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    window.addEventListener('scroll-to-reminders', handler)
    return () => window.removeEventListener('scroll-to-reminders', handler)
  }, [])

  // 清理语音识别的副作用
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
        recognitionRef.current = null
      }
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current)
        errorTimerRef.current = null
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
  }, [])

  // 人物检测：输入文本中包含已识别人名时，显示 InlinePersonHint
  useEffect(() => {
    if (!inputText || !lastRetrievalInfo?.people || lastRetrievalInfo.people.length === 0) {
      setDetectedPerson(null)
      return
    }
    const found = lastRetrievalInfo.people.find(p => p.name && inputText.includes(p.name))
    setDetectedPerson(found?.name ?? null)
  }, [inputText, lastRetrievalInfo])

  // === 首次使用引导：首次打开且未关闭过时显示 ===
  useEffect(() => {
    const dismissed = localStorage.getItem('hengzhou-guide-dismissed')
    if (!dismissed && messages.length === 0) {
      setShowGuide(true)
    }
  }, [])

  // 用户发送第一条消息后自动隐藏引导
  useEffect(() => {
    if (messages.length > 0) {
      setShowGuide(false)
    }
  }, [messages.length])

  // === 语音输入（保留） ===
  const handleVoiceInput = useCallback(() => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // ignore
        }
      }
      setIsRecording(false)
      return
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      setError('当前浏览器不支持语音输入，建议使用 Chrome')
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      errorTimerRef.current = setTimeout(() => setError(null), 3000)
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      setIsRecording(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('')
      setInputText(transcript)
    }

    recognition.onend = () => {
      setIsRecording(false)
      if (inputText.trim()) {
        setTimeout(() => handleSend(), 100)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('Voice input error:', event.error)
      setIsRecording(false)
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError('语音识别出错，请重试')
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
        errorTimerRef.current = setTimeout(() => setError(null), 3000)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isRecording, inputText, setInputText])

  // === 数字分身建议回复 ===
  // FIX: 只在用户明确需要"帮回复某人"时触发，避免突兀弹出无关建议
  // 从用户消息中提取人名，匹配 lastRetrievalInfo.people
  const extractPersonNameFromMessage = useCallback((message: string): string | null => {
    // 常见姓氏前缀，用于验证提取的"人名"确实以姓氏开头
    const surnames = '王李张刘陈杨赵黄周吴徐孙胡朱高林何郭马罗梁宋郑谢韩唐冯于董程曹袁邓许傅沈曾彭吕苏卢蒋蔡贾丁魏薛叶阎余潘杜戴夏钟汪田任姜范方石姚谭廖邹熊金陆郝孔白崔康毛邱秦江史顾侯邵孟龙万段雷钱汤尹黎易常武乔贺赖龚文'
    // 模式1: "XX说/XX发来/XX问我/XX发消息/XX打电话/XX发微信/XX微信我/XX找我/XX发了个"
    // 限制为2-3字中文名，且首字必须是常见姓氏
    const m1 = message.match(/([\u4e00-\u9fa5]{2,3})(?:说|发来|问我|发消息|打电话|发微信|微信我|找我|发了个)/)
    if (m1 && surnames.includes(m1[1][0])) return m1[1]
    // 模式2: "帮我回复XX" / "帮我回XX" / "怎么回XX"
    const m2 = message.match(/(?:帮我回(?:复)?|怎么回(?:复)?|该怎么回)([\u4e00-\u9fa5]{2,3})/)
    if (m2 && surnames.includes(m2[1][0])) return m2[1]
    // 模式3: "XX让我/XX催我/XX约我/XX叫我去/XX邀请我"
    const m3 = message.match(/([\u4e00-\u9fa5]{2,3})(?:让我|催我|约我|叫我去|邀请我)/)
    if (m3 && surnames.includes(m3[1][0])) return m3[1]
    return null
  }, [])

  const fetchReplySuggestions = useCallback(async (targetPersonId?: string) => {
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop()
    if (!lastUserMsg) {
      console.log('[ReplySuggestions] 跳过：无用户消息')
      return
    }

    // 从消息中提取人名，匹配 retrievalInfo.people
    const personName = extractPersonNameFromMessage(lastUserMsg.content)
    const matchedPerson = personName
      ? lastRetrievalInfo?.people?.find(p => p.name === personName || p.name.includes(personName) || personName.includes(p.name))
      : undefined

    // 优先使用 targetPersonId，其次匹配人名，最后取 people[0]
    // 如果以上都未找到但提取到了人名，创建 fallback 人物对象
    const person = targetPersonId
      ? (lastRetrievalInfo?.people?.find((p) => p.id === targetPersonId) ?? { id: targetPersonId, name: personName || '对方' })
      : (matchedPerson ?? lastRetrievalInfo?.people?.[0] ?? (personName ? { id: `fallback-${personName}`, name: personName } : undefined))

    console.log('[ReplySuggestions] fetchReplySuggestions 调用', {
      targetPersonId,
      extractedName: personName,
      hasRetrievalInfo: !!lastRetrievalInfo,
      peopleCount: lastRetrievalInfo?.people?.length ?? 0,
      firstPerson: lastRetrievalInfo?.people?.[0]?.name ?? 'none',
      matchedPerson: matchedPerson?.name ?? 'none',
      resolvedPerson: person?.name ?? 'none',
      personId: person?.id ?? 'none',
    })
    if (!person?.id) {
      console.log('[ReplySuggestions] 跳过：未找到目标人物')
      return
    }

    const recentMessages = messages.slice(-10).map((m) => ({
      sender: m.role === 'user' ? '我' : ('对方' as const),
      content: m.content,
    }))

    setSuggestionsLoading(true)
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 30000)
      )
      const suggestions = await Promise.race([
        generateReplySuggestions(
          person.id,
          recentMessages,
          lastUserMsg.content,
          undefined,
          person.name
        ),
        timeoutPromise,
      ])
      setReplySuggestions(suggestions.slice(0, 3))
      // 延迟2秒显示，让用户先阅读AI回复
      setReplySuggestionsVisible(false)
      setTimeout(() => setReplySuggestionsVisible(true), 2000)
    } catch (err) {
      console.warn('[ReplySuggestions] 生成失败，降级隐藏:', err)
      setReplySuggestions([])
      setReplySuggestionsVisible(false)
    } finally {
      setSuggestionsLoading(false)
    }
  }, [messages, lastRetrievalInfo, extractPersonNameFromMessage])

  // FIX: 检测用户是否在"需要帮回复某人"的场景
  // 只有用户明确提到收到某人消息、或主动要求帮回复时，才触发建议回复
  const shouldShowReplySuggestions = useCallback((userMessage: string): boolean => {
    // 模式1: "XX说/XX发来/XX问我/XX发消息/XX打电话/XX微信"
    if (/[\u4e00-\u9fa5]{2,}(说|发来|问我|发消息|打电话|发微信|微信我|找我|发了个)/.test(userMessage)) return true
    // 模式2: "帮我回复XX/怎么回XX/怎么回复XX/该怎么回"
    if (/(帮我回|怎么回|该怎么回|帮我回复|怎么回复)/.test(userMessage)) return true
    // 模式3: "XX让我/XX催我/XX约我" — 对方主动发起的互动
    if (/[\u4e00-\u9fa5]{2,}(让我|催我|约我|叫我去|邀请我)/.test(userMessage)) return true
    return false
  }, [])

  // AI 回复完成后，仅在用户有"帮回复"意图时才获取建议
  useEffect(() => {
    if (
      !isGenerating &&
      messages.length > 0 &&
      messages[messages.length - 1].role === 'assistant'
    ) {
      // 找到最后一条用户消息
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
      // 防止对同一条消息重复调用
      if (lastUserMsg && lastUserMsg.id === lastSuggestionMsgId.current) return
      const shouldShow = lastUserMsg ? shouldShowReplySuggestions(lastUserMsg.content) : false
      console.log('[ReplySuggestions] useEffect 触发', {
        isGenerating,
        lastMsgRole: messages[messages.length - 1]?.role,
        lastUserMsg: lastUserMsg?.content?.substring(0, 50),
        shouldShowReply: shouldShow,
      })
      if (lastUserMsg && shouldShow) {
        lastSuggestionMsgId.current = lastUserMsg.id
        fetchReplySuggestions()
      } else {
        // 没有回复意图时清空旧建议
        setReplySuggestions([])
      }
    }
  }, [isGenerating, messages, fetchReplySuggestions, shouldShowReplySuggestions])

  // === 发送消息（保留） ===
  const handleSend = useCallback(async (overrideText?: string) => {
    const textToSend = overrideText ?? inputText
    if (!textToSend.trim() || isGenerating) return
    const userContent = textToSend.trim()

    track.action('send_message', { hasText: userContent.length > 0 })

    addMessage({ role: 'user', content: userContent })
    setInputText('')
    setIsGenerating(true)
    setError(null)
    setStreamingContent('')
    setActions([])
    setShowDivergent(false)
    setAgentSteps([])
    setGraphRAGResult(null)
    setMcpCalls([])
    setThoughtProcess(undefined)
    // 清空旧的检索结果和建议，避免上下文面板显示过时数据
    setLastRetrievalInfo(null)
    setReplySuggestions([])
    setReplySuggestionsVisible(false)
    lastSuggestionMsgId.current = null

    const startTime = Date.now()

    try {
      const result = await processUserMessage({
        userContent,
        messages,
        onStream: (chunk) => setStreamingContent(chunk),
        onAgentStep: (step) => setAgentSteps(prev => [...prev, step]),
      })

      // 空回复保护：API 不可用时不添加空消息，而是提示用户
      if (result.response && result.response.trim()) {
        addMessage({ role: 'assistant', content: result.response })
      } else if (result.mode !== 'demo') {
        setError('AI 服务暂时不可用，请检查 API 配置或稍后重试')
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
        errorTimerRef.current = setTimeout(() => setError(null), 6000)
      }
      setStreamingContent('')

      // 如果检测到对话意图，添加内联确认卡片
      if (result.intent) {
        addMessage({ role: 'assistant', content: '', intent: result.intent })
      }

      if (result.mode === 'demo') {
        setError('当前为示例体验模式。配置 API Key 后可获得个性化回复。')
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
        errorTimerRef.current = setTimeout(() => setError(null), 6000)
      }

      setActions(suggestActions(result.response))
      setLastRetrievalInfo({
        method: result.retrieval.method,
        memoryCount: result.retrieval.memories.length,
        diaryCount: result.retrieval.diaries.length,
        peopleCount: result.retrieval.people.length,
        people: result.retrieval.people.map((p) => ({ id: p.id, name: p.name })),
      })
      // 企业级技术降维：展示 GraphRAG / MCP / 思考过程
      setGraphRAGResult(result.graphRAG ?? null)
      setMcpCalls(result.mcpCalls ?? [])
      setThoughtProcess(result.thoughtProcess)

      if (result.model === 'cached') {
        track.perf('cache_hit', Date.now() - startTime, { query: userContent.slice(0, 50) })
      }

      track.llm('chat_response', { model: result.model, success: true }, Date.now() - startTime)
    } catch (err: any) {
      track.llm('chat_response', { model: getModel(), success: false }, Date.now() - startTime)
      track.error('chat_send', { message: err.message })
      // FIX: 针对 401/Unauthorized 提供更明确的错误提示
      const errMsg = err.message || ''
      if (errMsg.includes('Unauthorized') || errMsg.includes('401') || errMsg.includes('API Key')) {
        setError('API Key 已过期或无效，请在「设置 → API 密钥」中更新')
      } else if (errMsg.includes('所有模型均不可用')) {
        setError('AI 服务暂时不可用，请检查 API 配置或稍后重试')
      } else {
        setError(errMsg || '请求失败，请检查网络')
      }
      setStreamingContent('')

      // FIX: API 不可用时，仍然检测意图并显示确认卡片
      try {
        const fallbackIntent = detectIntent(userContent)
        if (fallbackIntent) {
          addMessage({ role: 'assistant', content: '', intent: fallbackIntent })
        }
      } catch {
        // 意图检测失败时静默忽略
      }
      reportError('chat_send', err)
    } finally {
      setIsGenerating(false)
    }
  }, [inputText, isGenerating, messages, addMessage, setInputText, setIsGenerating, setLastRetrievalInfo])

  // === 键盘事件（保留） ===
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // === 输入变化（保留） ===
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value
      setInputText(val)
      setMoodPlaceholder(detectMood(val))
    },
    [setInputText]
  )

  // === 深度分析（保留） ===
  const handleDeepReview = useCallback(async () => {
    if (isReviewing) return
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop()
    if (!lastUserMsg) return

    track.action('click_deep_review')

    setIsReviewing(true)
    setReviewSteps([])
    setError(null)
    reviewStepsRef.current = []

    const startTime = Date.now()

    try {
      const result = await runReviewPipeline(lastUserMsg.content, {
        onStep: (step) => {
          reviewStepsRef.current = [...reviewStepsRef.current, step]
          setReviewSteps(reviewStepsRef.current)
        },
        onAgentStatus: (agentId, status) => {
          setAgentStatus(agentId, status)
        }
      })

      track.llm('deep_review', { model: getModel(), success: true }, Date.now() - startTime)

      if (result.finalDraft) {
        addMessage({ role: 'assistant', content: `【深度分析】\n\n${result.finalDraft}` })
      }
    } catch (err: any) {
      track.llm('deep_review', { model: getModel(), success: false }, Date.now() - startTime)
      track.error('deep_review', { message: err.message })
      setError(err.message || '深度分析失败')
      console.error('Review pipeline error:', err)
    } finally {
      setIsReviewing(false)
      ;['writer', 'relation', 'psych', 'practical', 'host'].forEach((id) =>
        setAgentStatus(id, 'idle')
      )
    }
  }, [isReviewing, messages, setReviewSteps, setAgentStatus, addMessage])

  // === 重新生成（新增：配合上下文菜单） ===
  const handleRegenerate = useCallback(async () => {
    if (isGenerating) return
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop()
    if (!lastUserMsg) return

    track.action('regenerate_message')

    // 移除最后一条 AI 消息
    const newMessages = messages.slice()
    for (let i = newMessages.length - 1; i >= 0; i--) {
      if (newMessages[i].role === 'assistant') {
        newMessages.splice(i, 1)
        break
      }
    }
    setMessages(newMessages)

    setIsGenerating(true)
    setError(null)
    setStreamingContent('')
    setActions([])
    setShowDivergent(false)
    setAgentSteps([])
    setGraphRAGResult(null)
    setMcpCalls([])
    setThoughtProcess(undefined)

    const startTime = Date.now()

    try {
      const result = await processUserMessage({
        userContent: lastUserMsg.content,
        messages: newMessages,
        onStream: (chunk) => setStreamingContent(chunk),
        onAgentStep: (step) => setAgentSteps(prev => [...prev, step]),
      })

      addMessage({ role: 'assistant', content: result.response })
      setStreamingContent('')

      if (result.mode === 'demo') {
        setError('当前为示例体验模式。配置 API Key 后可获得个性化回复。')
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
        errorTimerRef.current = setTimeout(() => setError(null), 6000)
      }

      setActions(suggestActions(result.response))
      setLastRetrievalInfo({
        method: result.retrieval.method,
        memoryCount: result.retrieval.memories.length,
        diaryCount: result.retrieval.diaries.length,
        peopleCount: result.retrieval.people.length,
        people: result.retrieval.people.map((p) => ({ id: p.id, name: p.name })),
      })
      setGraphRAGResult(result.graphRAG ?? null)
      setMcpCalls(result.mcpCalls ?? [])
      setThoughtProcess(result.thoughtProcess)

      track.llm('chat_response', { model: result.model, success: true }, Date.now() - startTime)
    } catch (err: any) {
      track.llm('chat_response', { model: getModel(), success: false }, Date.now() - startTime)
      track.error('chat_send', { message: err.message })
      setError(err.message || '请求失败，请检查网络')
      reportError('chat_send', err)
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating, messages, setMessages, setIsGenerating, addMessage, setLastRetrievalInfo])

  // === 复制消息（新增：配合上下文菜单） ===
  const handleCopy = useCallback((text: string) => {
    void navigator.clipboard.writeText(text)
  }, [])

  // === 文件上传处理（新增：配合 AttachmentMenu） ===
  const handleFileSelect = useCallback((file: File, type: 'file' | 'image' | 'audio' | 'wechat') => {
    track.action('file_upload', { type, fileName: file.name })
    const typeLabel: Record<string, string> = {
      file: '文件',
      image: '图片',
      audio: '录音',
      wechat: '微信记录',
    }
    setError(`${typeLabel[type]}上传功能开发中，暂未完全支持`)
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(() => setError(null), 3000)
  }, [])

  // === 长按 AI 消息触发上下文菜单（新增） ===
  const handleMessageTouchStart = useCallback((e: React.TouchEvent, content: string) => {
    const touch = e.touches[0]
    longPressTimerRef.current = setTimeout(() => {
      setContextMenu({ open: true, x: touch.clientX, y: touch.clientY, message: content })
    }, 500)
  }, [])

  const handleMessageTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handleMessageContextMenu = useCallback((e: React.MouseEvent, content: string) => {
    e.preventDefault()
    setContextMenu({ open: true, x: e.clientX, y: e.clientY, message: content })
  }, [])

  // === 首次使用引导：点击"知道了"关闭并永久记录 ===
  const handleDismissGuide = useCallback(() => {
    setShowGuide(false)
    localStorage.setItem('hengzhou-guide-dismissed', 'true')
  }, [])

  // === 首次使用引导：点击快捷指令填入输入框 ===
  const handleQuickCommand = useCallback((text: string) => {
    setInputText(text)
    textareaRef.current?.focus()
  }, [setInputText])

  // === 将 ActionSuggestion 映射为 SwipeableActionCards 所需格式 ===
  const swipeableActions = actions.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    onAction: () => executeAction(a),
  }))

  return (
    <div className="flex flex-col h-full bg-canvas page-enter">
      {/* === 历史会话抽屉（根级渲染） === */}
      <ChatDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* === 消息上下文菜单（根级渲染） === */}
      <MessageContextMenu
        open={contextMenu.open}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu((s) => ({ ...s, open: false }))}
        onCopy={() => handleCopy(contextMenu.message)}
        onRegenerate={handleRegenerate}
        onDeepAnalysis={handleDeepReview}
        onDivergentAnalysis={() => setShowDivergent(true)}
        onViewSources={() => {
          if (lastRetrievalInfo) {
            setError(`检索方式：${lastRetrievalInfo.method === 'semantic' ? '语义检索' : lastRetrievalInfo.method === 'hybrid' ? '混合检索' : '关键词匹配'} · 引用 ${lastRetrievalInfo.memoryCount} 条记忆${lastRetrievalInfo.peopleCount > 0 ? ` · ${lastRetrievalInfo.peopleCount} 个人物` : ''}`)
            if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
            errorTimerRef.current = setTimeout(() => setError(null), 5000)
          } else {
            setError('暂无检索来源信息')
            if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
            errorTimerRef.current = setTimeout(() => setError(null), 3000)
          }
        }}
      />

      {/* === 顶栏 === */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-muted/10 bg-surface/80 backdrop-blur-md flex-shrink-0">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-1 -ml-1 text-ink-secondary hover:text-ink-primary transition-colors"
          aria-label="打开会话历史"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink-primary">衡舟</span>
          <CacheStatsBadge />
        </div>
        <button
          className="p-1 -mr-1 text-ink-secondary hover:text-ink-primary transition-colors"
          aria-label="更多操作"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* === 轻量提醒条 === */}
      <ReminderBar />

      {/* === 示例数据提示（保留逻辑，轻量化展示） === */}
      {hasDemoData && !guideTourActive && (
        <div className="mx-3 mt-1 px-3 py-1.5 rounded-lg bg-zen-amber/10 border border-zen-amber/20 text-xs text-ink-secondary flex items-center justify-between gap-2">
          <span className="flex-1">当前为示例数据，产生真实记录后自动隐藏</span>
          <button
            onClick={() => clearDemoData()}
            className="shrink-0 text-zen-terracotta hover:underline"
          >
            清除
          </button>
        </div>
      )}

      {/* P1-2: 情绪脉搏条 — 对话区域顶部 */}
      {messages.length > 0 && (
        <EmotionPulseBar recentMessages={messages.map(m => m.content)} />
      )}

      {/* === 消息区域 === */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3">

        {/* 空状态 — P0-3: 痛点场景卡片 */}
        {messages.length === 0 && (
          <div className="py-8">
            <ScenarioCards
              visible={messages.length === 0}
              onSelect={(question) => {
                setInputText(question)
                handleSend(question)
              }}
            />
          </div>
        )}

        {/* 消息列表 */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{
              animation: 'msg-slide-in 0.3s ease-out both',
            }}
          >
            <div
              className={`flex flex-col gap-1 max-w-[80%] ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* 意图确认卡片 */}
              {msg.intent && (
                <IntentConfirmCard
                  intent={msg.intent}
                  onResolved={() => {
                    // 卡片完成后不需要额外操作，卡片自身会显示结果
                  }}
                />
              )}
              {/* 普通消息气泡（content 非空时显示） */}
              {msg.content && (
                <div
                  onTouchStart={(e) => msg.role === 'assistant' && handleMessageTouchStart(e, msg.content)}
                  onTouchEnd={msg.role === 'assistant' ? handleMessageTouchEnd : undefined}
                  onTouchMove={msg.role === 'assistant' ? handleMessageTouchEnd : undefined}
                  onContextMenu={(e) => msg.role === 'assistant' && handleMessageContextMenu(e, msg.content)}
                  className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap select-text transition-all duration-200 ${
                    msg.role === 'user'
                      ? 'bg-zen-sage text-white rounded-2xl rounded-br-md hover:shadow-sm hover:shadow-zen-sage/20'
                      : 'bg-surface text-ink-primary border border-ink-muted/10 rounded-2xl rounded-bl-md hover:border-ink-muted/20 hover:shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              )}
              <span className="text-2xs text-ink-muted px-1">
                {getRelativeTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {/* 流式输出中 */}
        {isGenerating && streamingContent && (
          <div className="flex justify-start">
            <div className="flex flex-col gap-1 max-w-[80%] items-start">
              <div className="px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-surface text-ink-primary border border-ink-muted/10 rounded-2xl rounded-bl-md">
                {streamingContent}
                <span className="inline-block w-1.5 h-4 bg-zen-terracotta/60 ml-0.5 animate-pulse align-middle" />
              </div>
            </div>
          </div>
        )}

        {/* Agentic RAG 思考过程 — 企业级多 Agent 协作可视化 */}
        {isGenerating && !streamingContent && (
          <div className="flex justify-start">
            {agentSteps.length > 0 ? (
              <div className="w-full max-w-[85%]">
                <AgenticThinkingPanel
                  steps={agentSteps}
                  isRunning={true}
                  thoughtProcess={thoughtProcess}
                />
              </div>
            ) : (
              <div className="bg-surface border border-ink-muted/10 rounded-2xl rounded-bl-md">
                <ThinkingRipple visible={true} />
              </div>
            )}
          </div>
        )}

        {/* Agentic RAG 思考过程（生成完成后可回看） */}
        {!isGenerating && agentSteps.length > 0 && (
          <div className="flex justify-start">
            <div className="w-full max-w-[85%]">
              <AgenticThinkingPanel
                steps={agentSteps}
                isRunning={false}
                thoughtProcess={thoughtProcess}
                totalDuration={agentSteps[agentSteps.length - 1]?.timestamp - agentSteps[0]?.timestamp}
              />
            </div>
          </div>
        )}

        {/* RAG 检索来源标签（保留） */}
        {lastRetrievalInfo && messages.length > 0 && !isGenerating && (
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-canvas-warm text-2xs text-ink-tertiary">
              <div className={`w-1.5 h-1.5 rounded-full ${lastRetrievalInfo.method === 'semantic' || lastRetrievalInfo.method === 'hybrid' ? 'bg-zen-sage' : 'bg-zen-amber'}`} />
              <span>
                {lastRetrievalInfo.method === 'semantic' ? '语义检索' : lastRetrievalInfo.method === 'hybrid' ? '混合检索' : '关键词匹配'} ·
                引用 {lastRetrievalInfo.memoryCount} 条记忆
                {lastRetrievalInfo.peopleCount > 0 && ` · ${lastRetrievalInfo.peopleCount} 个人物`}
              </span>
            </div>
          </div>
        )}

        {/* GraphRAG 知识图谱关系链展示 */}
        {graphRAGResult && !isGenerating && (
          <GraphRAGChainDisplay result={graphRAGResult} />
        )}

        {/* MCP 工具调用指示器 */}
        {mcpCalls.length > 0 && !isGenerating && (
          <MCPToolIndicator calls={mcpCalls} />
        )}

        {/* 错误提示（保留） */}
        {error && (
          <div className="flex justify-center" style={{ animation: 'msg-slide-in 0.3s ease-out both' }}>
            <div className="bg-zen-rose/10 text-zen-rose text-xs px-3 py-1.5 rounded-lg text-center max-w-[85%] border border-zen-rose/20">
              {error}
            </div>
          </div>
        )}

        {/* 移动端本次对话引导（桌面端有侧边栏，此处 md:hidden） */}
        {messages.length >= 2 && !isGenerating && !error && (
          <div className="md:hidden flex justify-center" style={{ animation: 'msg-slide-in 0.3s ease-out both' }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-zen-sage/8 to-zen-indigo/8 border border-zen-sage/15 max-w-[90%]">
              <Sparkles className="w-3 h-3 text-zen-sage flex-shrink-0" />
              <span className="text-[11px] text-ink-secondary flex-1">
                去看看衡舟为你整理的
              </span>
              <button
                onClick={() => setActiveNav('记忆')}
                className="text-[11px] font-medium text-zen-sage flex items-center gap-0.5"
              >
                记忆
              </button>
              <span className="text-ink-muted/30 text-[11px]">·</span>
              <button
                onClick={() => setActiveNav('关系')}
                className="text-[11px] font-medium text-zen-indigo flex items-center gap-0.5"
              >
                关系图谱
              </button>
            </div>
          </div>
        )}

        {/* 发散分析（按需显示，由上下文菜单触发） */}
        {showDivergent && messages.length > 0 && (
          <DivergentAnalysis />
        )}

        {/* 深度分析进度可视化（保留，移动端适配） */}
        {(isReviewing || reviewSteps.length > 0) && (
          <div className="flex flex-col items-center py-3">
            {isReviewing ? (
              <div className="w-full max-w-sm space-y-2.5 px-2">
                <p className="text-sm text-ink-tertiary text-center font-medium">衡舟正在认真思考...</p>
                {agents.filter(a => a.status === 'running').length > 0 ? (
                  <div className="space-y-1.5">
                    {agents.filter(a => a.status === 'running').map((agent) => (
                      <div key={agent.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zen-terracotta/5 border border-ink-muted/10">
                        <span className="text-sm flex-shrink-0">{agent.avatar}</span>
                        <span className="text-xs text-ink-secondary flex-shrink-0">{agent.name}</span>
                        <span className="text-2xs text-ink-tertiary flex-1">正在分析...</span>
                        <div className="w-12 h-1 rounded-full bg-ink-muted/10 overflow-hidden">
                          <div className="h-full bg-zen-terracotta rounded-full animate-pulse" style={{ width: '60%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-1.5 justify-center">
                    <span className="w-2 h-2 rounded-full bg-zen-terracotta animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-zen-terracotta animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-zen-terracotta animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                <p className="text-2xs text-ink-muted text-center">
                  已完成 {agents.filter(a => a.status === 'done').length} / {agents.filter(a => a.id !== 'orchestrator').length} 个分析维度
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-zen-sage">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>深度分析完成</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* === 可滑动 Action 建议卡片（AI 回复后显示） === */}
      {messages[messages.length - 1]?.role === 'assistant' && !isGenerating && actions.length > 0 && (
        <SwipeableActionCards actions={swipeableActions} />
      )}

      {/* === 人物检测内联提示 === */}
      <InlinePersonHint
        personName={detectedPerson}
        onExpand={() => {
          if (detectedPerson) {
            const person = lastRetrievalInfo?.people?.find(p => p.name === detectedPerson)
            if (person) {
              fetchReplySuggestions(person.id)
            }
          }
        }}
      />

      {/* === 数字分身建议回复（保留，移动端适配） — 首条消息后延迟2秒出现 === */}
      {replySuggestions.length > 0 && !isGenerating && replySuggestionsVisible && (
        <div className="px-3 py-1.5">
          <div className="bg-canvas-warm rounded-xl p-2.5 border border-ink-muted/10">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                <Sparkles className="w-3.5 h-3.5 text-zen-terracotta" />
                建议回复
                {suggestionsLoading && (
                  <span className="w-1 h-1 rounded-full bg-zen-terracotta animate-pulse" />
                )}
              </div>
              <button
                onClick={() => {
                  setReplySuggestions([])
                  setSuggestionsLoading(false)
                }}
                className="text-2xs text-ink-muted hover:text-ink-secondary px-1.5 py-0.5 rounded-md hover:bg-ink-muted/10 transition-colors"
              >
                关闭
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {replySuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputText(suggestion.text)
                    setReplySuggestions([])
                  }}
                  className="flex-shrink-0 max-w-[70%] text-left px-2.5 py-1.5 rounded-lg bg-zen-terracotta/10 text-zen-terracotta text-xs hover:bg-zen-terracotta/20 transition-colors"
                  title={suggestion.reason}
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === 输入栏 === */}
      <div className="px-3 pt-2 pb-3 border-t border-ink-muted/10 bg-surface flex-shrink-0">
        {/* === 首次使用引导气泡（悬浮于输入框上方） === */}
        {showGuide && !guideTourActive && (
          <div className="relative mb-2 animate-guide-fade-in">
            <div className="bg-zen-indigo/8 border border-zen-indigo/20 rounded-2xl p-3 shadow-sm">
              <p className="text-xs font-medium text-ink-secondary mb-2">试试这样和衡舟说</p>
              <div className="space-y-0.5">
                {QUICK_COMMANDS.map((cmd) => {
                  const Icon = cmd.icon
                  return (
                    <button
                      key={cmd.text}
                      onClick={() => handleQuickCommand(cmd.text)}
                      className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-zen-indigo/10 transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5 text-zen-indigo flex-shrink-0" />
                      <span className="text-sm text-ink-primary">{cmd.text}</span>
                      <span className="text-2xs text-ink-tertiary ml-auto whitespace-nowrap">{cmd.label}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleDismissGuide}
                  className="px-3 py-1 text-xs font-medium text-zen-indigo hover:bg-zen-indigo/10 rounded-lg transition-colors"
                >
                  知道了
                </button>
              </div>
            </div>
            {/* 向下指向输入框的小三角箭头 */}
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-zen-indigo/8 border-r border-b border-zen-indigo/20 rotate-45" />
          </div>
        )}
        {isRecording && (
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zen-rose animate-pulse" />
            <span className="text-xs text-zen-rose font-medium">正在聆听...</span>
          </div>
        )}
        {/* relative 容器放在 rounded-full 外部，避免附件菜单被父容器裁剪 */}
        <div className="relative">
          <div
            className={`chat-input-bar flex items-end gap-1.5 bg-canvas-warm rounded-full border-2 ${getInputBorder(inputText)} ${getEmotionBg(inputText)} p-1.5 transition-all focus-within:shadow-md`}
            style={{
              borderColor: currentTheme === 'cinematic'
                ? 'rgba(200, 149, 109, 0.6)'
                : currentTheme === 'glass'
                  ? 'rgba(100, 95, 90, 0.35)'
                  : undefined,
              boxShadow: currentTheme === 'cinematic'
                ? '0 2px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(200, 149, 109, 0.2)'
                : inputText.trim()
                  ? '0 2px 12px rgba(0,0,0,0.06)'
                  : '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            {/* 附件菜单 */}
            <AttachmentMenu onFileSelect={handleFileSelect} />

            {/* 文本输入 */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={moodPlaceholder}
              rows={1}
              data-guide="chat-input"
              className="flex-1 bg-transparent resize-none py-1.5 px-1 text-sm text-ink-primary placeholder:text-ink-tertiary outline-none min-h-[28px] max-h-[100px]"
            />

            {/* 语音输入 */}
            <button
              onClick={handleVoiceInput}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                isRecording
                  ? 'bg-zen-rose text-white animate-pulse'
                  : 'text-ink-tertiary hover:text-ink-secondary hover:bg-ink-muted/10'
              }`}
              title={isRecording ? '点击停止录音' : '语音输入'}
              aria-label={isRecording ? '停止语音输入' : '语音输入'}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* 发送按钮 */}
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isGenerating}
              className="w-8 h-8 rounded-full bg-zen-sage flex items-center justify-center text-white hover:bg-zen-sage/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              aria-label="发送"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 全局动画 keyframes */}
      <style>{`
        @keyframes msg-slide-in {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
