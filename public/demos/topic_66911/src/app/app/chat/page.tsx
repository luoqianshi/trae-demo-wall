'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  getChatSessions,
  getChatMessages,
  createChatSession,
  deleteChatSession,
  type ChatSession,
  type ChatMessage,
} from '../../../lib/api'
import { getAIConfig, saveAIConfig } from '../../../lib/editor-api'
import { discoverModels, type AIModel } from '../../../lib/ai-model-discovery'
import type { AIProvider, AIProviderConfig } from '../../../lib/editor-types'
import {
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Loader2,
  Sparkles,
  Copy,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Check,
  FileText,
  Search,
  PenTool,
  BookOpen,
  Clock,
  Edit3,
  X,
  ChevronDown,
  Wand2,
  Scissors,
  Expand,
  SpellCheck,
  ListOrdered,
  ChevronRight,
  Zap,
  Cpu,
  PanelLeftClose,
  PanelLeftOpen,
  MessageCircle,
  Feather,
} from 'lucide-react'
import { useToast } from '../../../components/ui/Toast'
import {
  aiPromptTemplates,
  renderPromptTemplate,
  type AIPromptTemplate,
} from '../../../lib/ai-prompts'

/* ===== Constants ===== */

const SUGGESTED_PROMPTS = [
  { icon: FileText, title: '代拟论文提要', description: '依据论文内容，生成结构化提要', color: 'bg-ochre/10 text-ochre' },
  { icon: Search, title: '剖析此篇典籍', description: '深入解读典籍要旨与方法', color: 'bg-indigo/10 text-indigo' },
  { icon: PenTool, title: '润色论文架构', description: '改进论文逻辑脉络与段落组织', color: 'bg-cinnabar/10 text-cinnabar' },
  { icon: BookOpen, title: '推荐相关典籍', description: '依据研究方向，推荐相关典籍', color: 'bg-ochre/10 text-ochre' },
]

const MAX_INPUT_LENGTH = 4000

function getAiConfigHeader(): string {
  try {
    const config = getAIConfig()
    return config ? JSON.stringify(config) : ''
  } catch {
    return ''
  }
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

/* ===== Sub-components ===== */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-1">
      {[0, 200, 400].map((delay) => (
        <div
          key={delay}
          className="w-2 h-2 rounded-full bg-ink/60 animate-[ink-dot-bounce_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}

function CodeBlock({ children, className, ...props }: any) {
  const code = String(children).replace(/\n$/, '')
  const language = className?.replace('language-', '') || 'text'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-ink/10">
      <div className="flex items-center justify-between px-4 py-2 bg-ink/5 border-b border-ink/10">
        <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ochre transition-colors">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? '已抄录' : '抄录'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto bg-paper">
        <code className={`text-sm font-mono text-ink ${className || ''}`} {...props}>
          {children}
        </code>
      </pre>
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          if (inline) {
            return <code className="px-1.5 py-0.5 rounded-md bg-ink/5 text-cinnabar text-sm font-mono" {...props}>{children}</code>
          }
          return <CodeBlock className={className}>{children}</CodeBlock>
        },
        p({ children }) { return <p className="mb-3 last:mb-0 leading-[1.8] text-[15px]">{children}</p> },
        h1({ children }) { return <h1 className="font-display text-xl mb-3 mt-5 text-ink leading-[1.4]">{children}</h1> },
        h2({ children }) { return <h2 className="font-serif text-lg font-semibold mb-2 mt-4 text-ink leading-[1.4]">{children}</h2> },
        h3({ children }) { return <h3 className="font-serif text-base font-semibold mb-2 mt-3 text-ink-secondary leading-[1.4]">{children}</h3> },
        ul({ children }) { return <ul className="mb-3 ml-5 list-disc space-y-1.5 marker:text-ochre/40">{children}</ul> },
        ol({ children }) { return <ol className="mb-3 ml-5 list-decimal space-y-1.5 marker:text-ochre/40">{children}</ol> },
        li({ children }) { return <li className="text-ink leading-[1.8]">{children}</li> },
        blockquote({ children }) { return <blockquote className="border-l-2 border-ochre/30 pl-4 py-1 my-3 italic text-ink-muted">{children}</blockquote> },
        table({ children }) { return <div className="overflow-x-auto my-3"><table className="w-full border-collapse border border-ink/10 rounded-lg">{children}</table></div> },
        th({ children }) { return <th className="border border-ink/10 px-3 py-2 bg-ink/5 text-left text-sm font-semibold text-ink">{children}</th> },
        td({ children }) { return <td className="border border-ink/10 px-3 py-2 text-sm text-ink">{children}</td> },
        hr() { return <hr className="my-4 border-ink/10" /> },
        a({ children, href }) {
          return <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo hover:text-ochre underline underline-offset-2 decoration-indigo/30 hover:decoration-ochre/50 transition-colors">{children}</a>
        },
        strong({ children }) { return <strong className="font-semibold text-ink">{children}</strong> },
        em({ children }) { return <em className="italic text-ink-secondary">{children}</em> },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

/* ===== Ink Brush Tail for User Messages ===== */

function InkBrushTail() {
  return (
    <div className="absolute -bottom-2 right-4 w-4 h-4 overflow-hidden">
      <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-b-[12px] border-b-ochre/15" />
    </div>
  )
}

/* ===== Main Page ===== */

export default function ChatPage() {
  const searchParams = useSearchParams()
  const sessionIdFromUrl = searchParams.get('session')
  const { success, error: toastError } = useToast()

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [titleInput, setTitleInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [promptMenuOpen, setPromptMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [aiConfig, setAiConfig] = useState<AIProviderConfig | null>(null)
  const [models, setModels] = useState<AIModel[]>([])
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [modelsLoading, setModelsLoading] = useState(false)
  const [temperature, setTemperature] = useState(0.7)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const promptMenuRef = useRef<HTMLDivElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    error,
  } = useChat({
    api: '/api/chat',
    headers: { 'x-ai-config': getAiConfigHeader() },
    onError: (err) => {
      let msg = '智囊回复未果，请稍后再试'
      try {
        const data = JSON.parse(err.message)
        if (data.error) msg = data.error
      } catch {}
      toastError(msg)
    },
  })

  /* ---- Effects ---- */

  useEffect(() => {
    loadSessions()
    loadAIConfig()
  }, [])

  useEffect(() => {
    if (sessionIdFromUrl) setCurrentSession(sessionIdFromUrl)
  }, [sessionIdFromUrl])

  useEffect(() => {
    if (currentSession) loadMessages(currentSession)
  }, [currentSession])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitle])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  useEffect(() => {
    if (!promptMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (promptMenuRef.current && !promptMenuRef.current.contains(e.target as Node)) setPromptMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [promptMenuOpen])

  useEffect(() => {
    if (!modelMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) setModelMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [modelMenuOpen])

  useEffect(() => {
    if (!currentSession) return
    try {
      const toSave = messages.map((m) => ({
        id: m.id,
        sessionId: currentSession,
        role: m.role,
        content: m.content,
        createdAt: new Date().toISOString(),
      }))
      sessionStorage.setItem(`chat_messages_${currentSession}`, JSON.stringify(toSave))
    } catch {}
  }, [messages, currentSession])

  /* ---- Data Loading ---- */

  async function loadSessions() {
    try {
      const data = await getChatSessions()
      setSessions(data)
      if (data.length > 0 && !currentSession && !sessionIdFromUrl) setCurrentSession(data[0].id)
    } catch (err) {
      console.error('Failed to load sessions:', err)
      toastError(typeof err === 'string' ? err : (err as Error)?.message || '论道列表加载未果')
    } finally {
      setSessionsLoading(false)
    }
  }

  async function loadAIConfig() {
    try {
      const config = getAIConfig()
      setAiConfig(config)
      if (config) {
        await loadModels(config.provider as AIProvider, config.baseUrl, config.apiKey)
        if (config.temperature) setTemperature(config.temperature)
      }
    } catch (err) {
      console.error('Failed to load AI config:', err)
    }
  }

  async function loadModels(provider: AIProvider, baseUrl?: string, apiKey?: string) {
    setModelsLoading(true)
    try {
      const res = await fetch('/api/discover-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, baseUrl, apiKey }),
      })
      const data = await res.json()
      if (res.ok) setModels(data.models || [])
    } catch (err) {
      console.error('Failed to load models:', err)
    } finally {
      setModelsLoading(false)
    }
  }

  const handleModelChange = async (modelId: string) => {
    if (!aiConfig) return
    const newConfig: AIProviderConfig = { ...aiConfig, model: modelId }
    saveAIConfig(newConfig)
    setAiConfig(newConfig)
    setModelMenuOpen(false)
    success(`已切换到模型: ${modelId}`)
  }

  const handleTemperatureChange = (newTemp: number) => {
    setTemperature(newTemp)
    if (aiConfig) {
      const newConfig: AIProviderConfig = { ...aiConfig, temperature: newTemp }
      saveAIConfig(newConfig)
    }
  }

  async function loadMessages(sessionId: string) {
    try {
      const data = await getChatMessages(sessionId)
      const sdkMessages = data.map((m) => ({ id: m.id, role: m.role, content: m.content }))
      setMessages(sdkMessages as any)
    } catch (err) {
      console.error('Failed to load messages:', err)
      toastError(typeof err === 'string' ? err : (err as Error)?.message || '消息加载未果')
    }
  }

  async function handleNewSession() {
    try {
      const session = await createChatSession('新论')
      setSessions((prev) => [session, ...prev])
      setCurrentSession(session.id)
      success('论道已开')
    } catch (err) {
      console.error('Failed to create session:', err)
      toastError(typeof err === 'string' ? err : (err as Error)?.message || '论道创建未果')
    }
  }

  async function handleDeleteSession(sessionId: string) {
    try {
      await deleteChatSession(sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (currentSession === sessionId) setCurrentSession(null)
      success('论道已除')
    } catch (err) {
      console.error('Failed to delete session:', err)
      toastError(typeof err === 'string' ? err : (err as Error)?.message || '论道删除未果')
    }
  }

  const handleCopy = useCallback(async (content: string, msgId: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(msgId)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const handleRegenerate = useCallback(async () => {
    if (!currentSession || messages.length < 2) return
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUserMsg) return
  }, [currentSession, messages])

  function checkAiConfig(): boolean {
    try {
      const config = getAIConfig()
      if (!config) {
        toastError('请先于雅设中配置智囊来源（如 OpenAI、DeepSeek 等）')
        return false
      }
      const needsApiKey = config.provider !== 'ollama'
      if (!config.provider || !config.model || (needsApiKey && !config.apiKey)) {
        toastError('智囊配置未全，请前往雅设页面填写来源、API Key 与模型名称')
        return false
      }
      return true
    } catch {
      toastError('智囊配置格式有误，请前往雅设页面重新配置')
      return false
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!checkAiConfig()) return
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  const handleSuggestedPrompt = (prompt: string) => {
    if (!checkAiConfig()) return
    if (!currentSession) {
      handleNewSession().then(() => {
        setTimeout(() => {
          handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>)
        }, 100)
      })
    } else {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>)
    }
  }

  const promptIcons: Record<string, React.ElementType> = {
    academic_polish: Wand2,
    generate_abstract: FileText,
    continue_writing: BookOpen,
    make_shorter: Scissors,
    make_longer: Expand,
    fix_grammar: SpellCheck,
    format_references: ListOrdered,
  }

  const handlePromptTemplate = async (template: AIPromptTemplate) => {
    if (!checkAiConfig()) return
    setPromptMenuOpen(false)

    const text = input.trim()
    if (!text) {
      toastError('请先输入待处理之文本')
      return
    }

    const userPrompt = renderPromptTemplate(template, text)

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: `【${template.name}】\n\n${text}`,
    }

    setMessages((prev: any) => [...prev, userMsg])

    try {
      const config = getAIConfig()
      if (!config) {
        toastError('智囊未设')
        return
      }

      let targetUrl: string
      let headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const isOllama = config.provider === 'ollama'

      if (config.provider === 'deepseek') {
        targetUrl = `${config.baseUrl || 'https://api.deepseek.com'}/chat/completions`
        headers['Authorization'] = `Bearer ${config.apiKey}`
      } else if (config.provider === 'openai') {
        targetUrl = `${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`
        headers['Authorization'] = `Bearer ${config.apiKey}`
      } else if (config.provider === 'ollama') {
        targetUrl = `${config.baseUrl || 'http://localhost:11434'}/api/generate`
      } else if (config.provider === 'grok') {
        targetUrl = `${config.baseUrl || 'https://api.x.ai/v1'}/chat/completions`
        headers['Authorization'] = `Bearer ${config.apiKey}`
      } else if (config.provider === 'cherry') {
        targetUrl = `${config.baseUrl || 'http://localhost:23333/v1'}/chat/completions`
        headers['Authorization'] = `Bearer ${config.apiKey}`
      } else {
        targetUrl = `${config.baseUrl}/chat/completions`
        if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`
      }

      const messagesPayload = []
      if (template.systemPrompt) messagesPayload.push({ role: 'system', content: template.systemPrompt })
      messagesPayload.push({ role: 'user', content: userPrompt })

      const requestBody = isOllama
        ? { model: config.model || 'llama3.2', prompt: `${template.systemPrompt}\n\n${userPrompt}`, stream: false, options: { temperature: template.temperature ?? 0.7 } }
        : { model: config.model, messages: messagesPayload, temperature: template.temperature ?? 0.7, max_tokens: template.maxTokens ?? 2048 }

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, headers, body: requestBody, isOllama }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }))
        throw new Error(err.error?.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const content = isOllama ? data.choices?.[0]?.message?.content || data.response || '' : data.choices?.[0]?.message?.content || ''

      setMessages((prev: any) => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant' as const, content }])
    } catch (err: any) {
      toastError(err.message || '智囊调用未果')
    }
  }

  /* ---- Title editing ---- */

  const currentSessionData = sessions.find((s) => s.id === currentSession)

  const handleStartEditTitle = () => {
    if (!currentSessionData) return
    setEditingTitle(currentSessionData.id)
    setTitleInput(currentSessionData.title)
  }

  const handleSaveTitle = () => {
    if (!editingTitle || !titleInput.trim()) {
      setEditingTitle(null)
      return
    }
    setSessions((prev) => prev.map((s) => (s.id === editingTitle ? { ...s, title: titleInput.trim() } : s)))
    setEditingTitle(null)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveTitle()
    if (e.key === 'Escape') setEditingTitle(null)
  }

  const filteredSessions = searchQuery.trim()
    ? sessions.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sessions

  /* ============================
     Render
     ============================ */

  return (
    <div className="flex h-[calc(100vh-56px-64px)] md:h-[calc(100vh-56px)] animate-page-enter">
      {/* ======== SIDEBAR ======== */}
      <aside
        className={`
          flex-shrink-0 flex flex-col liquid-glass rounded-none rounded-r-[20px]
          transition-all duration-300 overflow-hidden
          ${sidebarOpen ? 'w-64' : 'w-0'}
        `}
      >
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-lg text-ink tracking-wide">墨谈阁</h1>
            <button
              onClick={handleNewSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-primary text-sm font-serif hover:bg-ink transition-all relative overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite]" />
              <Plus className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">新建</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索..."
              className="input-field w-full pl-9 pr-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {sessionsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-ochre" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="px-2 py-12 text-center">
              <MessageCircle className="w-8 h-8 text-ink-light mx-auto mb-3 opacity-40" />
              <p className="font-serif text-sm text-ink-light">{searchQuery ? '未找到相关论道' : '尚无论道'}</p>
              {!searchQuery && (
                <button onClick={handleNewSession} className="mt-3 px-4 py-2 rounded-xl text-sm font-serif text-ochre border border-ochre/20 hover:bg-ochre/5 transition-all">
                  开启首次论道
                </button>
              )}
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setCurrentSession(session.id)}
                className={`
                  group flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer mb-1 transition-all
                  ${
                    currentSession === session.id
                      ? 'bg-ochre/5 border-l-[3px] border-ochre'
                      : 'hover:bg-ink/[0.03] border-l-[3px] border-transparent'
                  }
                `}
              >
                {/* Ink-dot indicator */}
                <div className="flex-shrink-0 mt-1.5">
                  <div className={`w-2 h-2 rounded-full ${currentSession === session.id ? 'bg-ochre' : 'bg-ink/20'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm text-ink truncate leading-snug">{session.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-ink-light flex-shrink-0" />
                    <span className="font-serif text-xs text-ink-light">{formatTime(session.updatedAt)}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteSession(session.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-cinnabar/10 transition-all flex-shrink-0 mt-0.5"
                >
                  <Trash2 className="w-3 h-3 text-cinnabar" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="ink-divider" />
      </aside>

      {/* ======== MAIN CHAT AREA ======== */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 liquid-glass rounded-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl hover:bg-ink/[0.03] text-ink-muted hover:text-ink transition-all"
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            {currentSessionData ? (
              editingTitle === currentSessionData.id ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={titleInputRef}
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={handleSaveTitle}
                    className="input-field px-2.5 py-1 text-sm"
                  />
                  <button onClick={handleSaveTitle} className="p-1 rounded hover:bg-ink/[0.03] text-ochre transition-colors">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditingTitle(null)} className="p-1 rounded hover:bg-ink/[0.03] text-ink-muted transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h2 className="font-serif text-sm font-semibold text-ink">{currentSessionData.title}</h2>
                  <button onClick={handleStartEditTitle} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-ink/[0.03] text-ink-muted transition-all">
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-ochre/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-ochre" />
                </div>
                <div>
                  <h2 className="font-display text-ink text-sm">学术智囊</h2>
                  <p className="font-serif text-xs text-ink-muted">论道堂 · AI 辅助治学</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Model selector */}
            <div className="relative" ref={modelMenuRef}>
              <button
                onClick={() => { if (aiConfig) setModelMenuOpen(!modelMenuOpen) }}
                disabled={!aiConfig}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl liquid-glass text-sm text-ink-secondary hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate font-serif text-xs">{aiConfig?.model || '未设'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {modelMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 liquid-glass rounded-[20px] shadow-lg z-50 py-2">
                  <div className="px-4 py-2.5 border-b border-ink/10">
                    <p className="text-xs font-medium text-ink font-serif">选择模型</p>
                    <p className="text-[10px] text-ink-muted mt-0.5">{aiConfig?.provider?.toUpperCase()} Provider</p>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto py-1">
                    {modelsLoading ? (
                      <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-ochre" /></div>
                    ) : models.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-ink-muted font-serif">暂无可用模型</div>
                    ) : (
                      models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => handleModelChange(model.id)}
                          className={`w-full px-4 py-2.5 text-left transition-colors ${aiConfig?.model === model.id ? 'bg-ochre/5 text-ochre' : 'hover:bg-ink/[0.03] text-ink-secondary'}`}
                        >
                          <div className="font-medium truncate text-sm">{model.name}</div>
                          {model.description && <div className="text-xs text-ink-muted truncate mt-0.5">{model.description}</div>}
                        </button>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-3 border-t border-ink/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-ink-muted font-serif"><Zap className="w-3 h-3 inline mr-1" />温度</span>
                      <span className="text-xs font-medium text-ochre font-serif">{temperature.toFixed(1)}</span>
                    </div>
                    <input
                      type="range" min="0" max="2" step="0.1" value={temperature}
                      onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
                      className="w-full h-1.5 rounded-full bg-ink/10 appearance-none cursor-pointer accent-ochre"
                    />
                    <div className="flex justify-between text-[10px] text-ink-light mt-1 font-serif">
                      <span>精确</span><span>创意</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {currentSession && <span className="font-serif text-xs text-ink-light">{messages.length} 条</span>}
          </div>
        </header>

        {/* Messages or Empty State */}
        {!currentSession || messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
            <div className="max-w-2xl w-full text-center">
              {/* Classical Chinese poem empty state */}
              <div className="mb-10">
                <div className="inline-block relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-ochre/20 via-ochre/10 to-ochre/5 flex items-center justify-center golden-glow">
                    <Bot className="w-12 h-12 text-ochre" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-ochre flex items-center justify-center shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>

              <h1 className="font-display text-xl text-ink mb-6">有何可以效劳？</h1>

              {/* Classical poem */}
              <div className="mb-10 max-w-sm mx-auto">
                <p className="font-serif text-ink-muted/60 text-sm leading-[2.2] tracking-widest">
                  海内存知己，天涯若比邻
                </p>
                <p className="font-serif text-ink-muted/40 text-xs mt-2 tracking-wider">
                  —— 王勃《送杜少府之任蜀州》
                </p>
              </div>

              <p className="font-serif text-[15px] text-ink-muted mb-10 max-w-md mx-auto leading-[1.8]">
                吾乃学术智囊，可为阁下解惑论文著述、典籍研读、治学之法等诸般学问
              </p>

              {/* Suggested prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedPrompt(prompt.title)}
                    className="flex items-start gap-3 p-4 rounded-[20px] liquid-glass liquid-glass-hover cursor-pointer text-left group hover:golden-glow transition-all"
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${prompt.color} group-hover:scale-110 transition-transform`}>
                      <prompt.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-serif font-medium text-ink text-sm">{prompt.title}</div>
                      <div className="font-serif text-xs text-ink-muted mt-1 leading-relaxed">{prompt.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              {!currentSession && (
                <button
                  onClick={handleNewSession}
                  className="mt-8 btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-[20px]"
                >
                  <Plus className="w-4 h-4" />
                  开启新论
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'animate-msg-right flex-row-reverse' : 'animate-msg-left'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-ochre/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-ochre" />
                    </div>
                  )}

                  <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="relative">
                      <div
                        className={`px-5 py-3 rounded-2xl font-serif text-[15px] leading-[1.8] ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-br from-ochre/10 to-ochre/5 text-ink rounded-br-sm'
                            : 'liquid-glass rounded-bl-sm text-ink border-l-[3px] border-l-gradient-to-b border-l-ochre border-l-cinnabar'
                        }`}
                        style={
                          msg.role === 'assistant'
                            ? { borderLeft: '3px solid', borderImage: 'linear-gradient(to bottom, #C4843A, #B8432F) 1' }
                            : undefined
                        }
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none">
                            <MarkdownContent content={msg.content} />
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                      </div>

                      {/* Ink brush tail for user messages */}
                      {msg.role === 'user' && <InkBrushTail />}

                      {/* "墨" watermark for AI messages */}
                      {msg.role === 'assistant' && (
                        <span
                          className="absolute bottom-1 right-2 font-serif text-ink/[0.06] text-2xl select-none pointer-events-none"
                          aria-hidden="true"
                        >
                          墨
                        </span>
                      )}
                    </div>

                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-0.5 ml-1 opacity-0 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-ink-muted hover:text-ochre hover:bg-ink/[0.03] transition-all"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedId === msg.id ? '已抄录' : '抄录'}
                        </button>
                        {index === messages.length - 1 && (
                          <button onClick={handleRegenerate} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-ink-muted hover:text-ochre hover:bg-ink/[0.03] transition-all">
                            <RotateCcw className="w-3 h-3" />再议
                          </button>
                        )}
                        <button className="p-1 rounded-lg text-ink-muted hover:text-ochre hover:bg-ink/[0.03] transition-all">
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button className="p-1 rounded-lg text-ink-muted hover:text-cinnabar hover:bg-cinnabar/10 transition-all">
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <span className="font-serif text-xs text-ink-muted px-1">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-ochre flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 animate-[fadeInUp_0.3s_ease-out_forwards]">
                  <div className="w-8 h-8 rounded-full bg-ochre/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-ochre" />
                  </div>
                  <div className="liquid-glass rounded-2xl rounded-bl-sm px-5 py-3" style={{ borderLeft: '3px solid', borderImage: 'linear-gradient(to bottom, #C4843A, #B8432F) 1' }}>
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input Area - Scroll / Writing style */}
        <div className="flex-shrink-0">
          {/* Ink divider above input */}
          <div className="max-w-3xl mx-auto px-4">
            <div className="h-px bg-gradient-to-r from-transparent via-ink/15 to-transparent" />
          </div>

          <div className="max-w-3xl mx-auto px-4 pb-4 pt-3">
            <form
              onSubmit={(e) => { if (checkAiConfig()) handleSubmit(e) }}
              className="liquid-glass rounded-[20px] p-4 focus-within:shadow-lg focus-within:shadow-ochre/5 transition-all relative overflow-hidden"
            >
              {/* Subtle paper texture overlay */}
              <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] pointer-events-none rounded-[20px]" />

              <div className="flex items-end gap-3 relative z-10">
                {/* Prompt template selector */}
                <div className="relative flex-shrink-0" ref={promptMenuRef}>
                  <button
                    type="button"
                    onClick={() => setPromptMenuOpen(!promptMenuOpen)}
                    disabled={!currentSession || isLoading}
                    className="w-9 h-9 rounded-xl liquid-glass text-ink-muted flex items-center justify-center hover:text-ochre disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="选择文式模板"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>

                  {promptMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-72 liquid-glass rounded-[20px] shadow-lg z-50 py-2">
                      <div className="px-4 py-2.5 border-b border-ink/10">
                        <p className="text-xs font-medium text-ink font-serif">选择文式模板</p>
                        <p className="text-[10px] text-ink-muted mt-0.5 font-serif">将当前输入作为模板参数</p>
                      </div>
                      <div className="max-h-[280px] overflow-y-auto py-1">
                        {aiPromptTemplates.map((template) => {
                          const Icon = promptIcons[template.id] || Sparkles
                          return (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => handlePromptTemplate(template)}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-ink/[0.03] transition-colors"
                            >
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${template.color}15`, color: template.color }}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-ink font-serif">{template.name}</p>
                                <p className="text-[10px] text-ink-muted truncate font-serif">{template.description}</p>
                              </div>
                              <ChevronRight className="w-3 h-3 text-ink-light flex-shrink-0" />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Textarea - scroll paper style */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={currentSession ? '落笔于此，以墨会友...' : '点击"新建"开始论道'}
                  disabled={!currentSession || isLoading}
                  rows={1}
                  className="flex-1 bg-transparent border-0 resize-none font-serif text-ink text-[15px] leading-[1.8] placeholder:text-ink-light/60 outline-none min-h-[28px] max-h-[200px] py-1"
                />

                {/* Send button - quill/pen feel */}
                <div className="flex items-center gap-2 flex-shrink-0 pb-0.5">
                  <span className={`font-serif text-[10px] ${input.length > MAX_INPUT_LENGTH * 0.9 ? 'text-cinnabar' : 'text-ink-light'}`}>
                    {input.length}/{MAX_INPUT_LENGTH}
                  </span>
                  <button
                    type="submit"
                    disabled={!input.trim() || !currentSession || isLoading}
                    className="btn-primary rounded-xl px-5 py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Feather className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </form>
            <p className="text-center font-serif text-[10px] text-ink-light mt-2">智囊所答仅供参考，重要信息请自行核实</p>
          </div>
        </div>
      </main>
    </div>
  )
}
