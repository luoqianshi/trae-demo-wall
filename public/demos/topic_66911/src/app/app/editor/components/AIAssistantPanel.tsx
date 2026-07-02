'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Bot,
  Send,
  Settings,
  X,
  Sparkles,
  Wand2,
  BookOpen,
  Languages,
  MessageSquare,
  FileText,
  Lightbulb,
  Loader2,
  Copy,
  CheckCheck,
  Quote,
  PenLine,
  GraduationCap,
  Briefcase,
  ScrollText,
  AlertTriangle,
  CheckCircle,
  ScanEye,
  ClipboardList,
  Search,
  GitBranch,
} from 'lucide-react'
import { callAI, polishContent, type PolishType } from '../../../../lib/editor-api'
import type { Editor as TiptapEditor } from '@tiptap/react'
import type { Document } from '../../../../lib/editor-types'

/* ============================================================
   类型定义
   ============================================================ */

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/** 写作角色 */
type WritingPersona = 'academic' | 'general' | 'official'

interface AIAssistantPanelProps {
  isOpen: boolean
  onClose: () => void
  onInsertText?: (text: string) => void
  /** 编辑器实例，用于获取全文内容 */
  editor?: TiptapEditor | null
  /** 当前文档 */
  currentDoc?: Document | null
}

/* ============================================================
   写作角色配置
   ============================================================ */

interface PersonaConfig {
  id: WritingPersona
  label: string
  icon: React.ElementType
  systemPrompt: string
  description: string
}

const personaConfigs: PersonaConfig[] = [
  {
    id: 'academic',
    label: '学术',
    icon: GraduationCap,
    description: '学术论文风格',
    systemPrompt:
      '你是一位资深学术写作专家，擅长中文学术论文的润色、翻译、大纲生成和引用格式检查。' +
      '你的回答应当严谨、规范、逻辑清晰，使用学术化的中文表达。' +
      '在润色时保持原文的学术观点和专业术语，仅优化语言表达和逻辑结构。',
  },
  {
    id: 'general',
    label: '通用',
    icon: MessageSquare,
    description: '日常写作风格',
    systemPrompt:
      '你是一位全能写作助手，擅长各类中文写作场景。' +
      '你的回答应当自然流畅、通俗易懂，适合一般性的写作需求。' +
      '在润色时注重可读性和表达清晰度，使文字更加生动有趣。',
  },
  {
    id: 'official',
    label: '公文',
    icon: ScrollText,
    description: '公文报告风格',
    systemPrompt:
      '你是一位公文写作专家，擅长各类正式公文、报告、通知、请示等文体的撰写和润色。' +
      '你的回答应当庄重、规范、条理分明，符合公文写作的格式要求和语言规范。' +
      '在润色时保持公文的正式性和权威性，使用规范的政治术语和公文用语。',
  },
]

/* ============================================================
   快捷操作定义
   ============================================================ */

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  prompt: string
  color: string
}

const quickActions: QuickAction[] = [
  { id: 'polish', label: '润色段落', icon: Wand2, prompt: '请润色以下段落，使其更加学术化：', color: 'text-ochre' },
  { id: 'polish_academic', label: '学术润色', icon: GraduationCap, prompt: '请对以下内容进行学术润色，提升表达的严谨性和规范性：', color: 'text-indigo' },
  { id: 'translate', label: '英译中', icon: Languages, prompt: '请将以下英文翻译为中文：', color: 'text-ochre' },
  { id: 'outline', label: '生成大纲', icon: FileText, prompt: '请根据以下主题生成论文大纲：', color: 'text-cinnabar' },
  { id: 'expand', label: '扩展论述', icon: BookOpen, prompt: '请扩展以下论述，增加更多论据和引用：', color: 'text-[#6B8E5A]' },
  { id: 'peer-review', label: '同行评审', icon: ScanEye, prompt: '请以审稿人视角评审以下论文，指出优点、不足和修改建议：', color: 'text-purple-600' },
  { id: 'paper-search', label: '论文检索', icon: Search, prompt: '请在 arXiv 上检索以下主题的相关论文，并给出简要摘要：', color: 'text-blue-600' },
  { id: 'agent', label: 'Agent模式', icon: GitBranch, prompt: '请对我的论文草稿进行多步骤改进：1.检查结构 2.优化表达 3.补充引用：', color: 'text-green-600' },
  { id: 'summarize', label: '总结要点', icon: Lightbulb, prompt: '请总结以下内容的要点：', color: 'text-ochre' },
  { id: 'chat', label: '自由对话', icon: MessageSquare, prompt: '', color: 'text-ink-secondary' },
]

/* ============================================================
   工具函数
   ============================================================ */

/** 将长文本按指定长度分段，优先在句子边界处分割 */
function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length)
    if (end < text.length) {
      const searchRange = text.slice(Math.max(start, end - 100), end)
      const lastPunct = Math.max(
        searchRange.lastIndexOf('。'),
        searchRange.lastIndexOf('？'),
        searchRange.lastIndexOf('！'),
        searchRange.lastIndexOf('\n')
      )
      if (lastPunct > 0) {
        end = Math.max(start, end - 100) + lastPunct + 1
      }
    }
    chunks.push(text.slice(start, end).trim())
    start = end
  }
  return chunks.filter((c) => c.length > 0)
}

/* ============================================================
   主组件
   ============================================================ */

export default function AIAssistantPanel({
  isOpen,
  onClose,
  onInsertText,
  editor,
  currentDoc,
}: AIAssistantPanelProps) {
  /* ---- 状态 ---- */
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [persona, setPersona] = useState<WritingPersona>('academic')
  const [showPersonaMenu, setShowPersonaMenu] = useState(false)

  /* 引用格式检查状态 */
  const [citationChecking, setCitationChecking] = useState(false)
  const [citationResult, setCitationResult] = useState<string | null>(null)

  /* 同行评审状态 */
  const [peerReviewing, setPeerReviewing] = useState(false)

  /* ---- 全文润色状态 */
  const [polishingAll, setPolishingAll] = useState(false)
  const [polishProgress, setPolishProgress] = useState(0)
  const [showPolishConfirm, setShowPolishConfirm] = useState(false)

  /* ---- 段落润色状态 */
  const [polishingParagraph, setPolishingParagraph] = useState(false)
  const [polishType, setPolishType] = useState<PolishType>('standard')
  const [polishResult, setPolishResult] = useState<string | null>(null)
  const [showPolishResult, setShowPolishResult] = useState(false)
  const [polishDiffMarkup, setPolishDiffMarkup] = useState<string>('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const personaMenuRef = useRef<HTMLDivElement>(null)

  /* ---- 获取当前角色的 systemPrompt ---- */
  const currentPersona = personaConfigs.find((p) => p.id === persona) || personaConfigs[0]

  /* ---- 自动滚动到底部 ---- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* ---- 打开时聚焦输入框 ---- */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  /* ---- Esc 关闭面板 ---- */
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  /* ---- 点击外部关闭角色菜单 ---- */
  useEffect(() => {
    if (!showPersonaMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (personaMenuRef.current && !personaMenuRef.current.contains(e.target as Node)) {
        setShowPersonaMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPersonaMenu])

  /* ---- 复制消息内容 ---- */
  const handleCopy = useCallback(async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // 静默失败
    }
  }, [])

  /* ---- 发送消息（核心 AI 调用） ---- */
  const handleSend = async (text?: string) => {
    const content = text || input.trim()
    if (!content || loading) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const reply = await callAI(content, {
        systemPrompt: currentPersona.systemPrompt,
        temperature: 0.7,
        maxTokens: 2048,
      })

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply || '抱歉，无法获取回复。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: err?.message || '连接智囊服务失败，请检查雅设中的配置是否正确。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  /* ---- 快捷操作 ---- */
  const handleQuickAction = (action: QuickAction) => {
    if (action.prompt) {
      setInput(action.prompt)
      inputRef.current?.focus()
    }
  }

  /* ---- 引用格式检查 ---- */
  const handleCitationCheck = async () => {
    const docText = editor?.getText() || currentDoc?.plainText || ''
    if (!docText.trim()) {
      const warningMsg: Message = {
        id: `warning-${Date.now()}`,
        role: 'assistant',
        content: '当前文档为空，请先输入一些内容后再进行引用格式检查。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, warningMsg])
      return
    }

    setCitationChecking(true)
    setCitationResult(null)

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: '【引用格式检查】请检查以下论文的引用格式是否正确：',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const prompt = `请对以下论文内容进行引用格式检查，重点关注：
1. 引用标注是否规范（如 [1]、(作者, 年份) 等）
2. 参考文献列表格式是否符合 GB/T 7714 标准
3. 文中引用与参考文献列表是否一一对应
4. 是否存在引用缺失或格式错误

论文内容：
${docText.slice(0, 6000)}

请以清单形式列出发现的问题，并给出修改建议。如果没有问题，请明确说明"引用格式检查通过"。`

      const reply = await callAI(prompt, {
        systemPrompt:
          '你是学术论文引用格式审稿专家，精通 GB/T 7714 等中文学术引用规范。' +
          '请仔细检查引用格式，列出所有问题并给出具体修改建议。',
        temperature: 0.3,
        maxTokens: 2048,
      })

      setCitationResult(reply)

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: err?.message || '引用格式检查失败，请检查智囊配置。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setCitationChecking(false)
    }
  }

  /* ---- 同行评审（全文档） ---- */
  const handlePeerReview = async () => {
    const docText = editor?.getText() || currentDoc?.plainText || ''
    if (!docText.trim()) {
      const warningMsg: Message = {
        id: `warning-${Date.now()}`,
        role: 'assistant',
        content: '当前文档为空，请先撰写一些内容后再进行同行评审。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, warningMsg])
      return
    }

    setPeerReviewing(true)

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: '【同行评审】请以审稿人视角对以下论文草稿进行评审：',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const prompt = `请以专业审稿人视角，对以下论文草稿进行全面评审。请按以下结构输出评审意见：

**总体评价**：用2-3句话概括论文质量和贡献
**优点**（3-5条）：指出论文的亮点和创新之处
**不足**（3-5条）：指出需要改进的地方
**修改建议**：给出具体的改进方向和做法
**结构检查**：论文的逻辑结构是否合理
**语言表达**：学术表达的规范性如何
**引用建议**：是否缺少关键文献引用

论文内容：
${docText.slice(0, 8000)}`

      const reply = await callAI(prompt, {
        systemPrompt:
          '你是一位资深学术审稿人，负责评估学术论文的质量。' +
          '请全面、客观地给出评审意见，既肯定优点也指出不足，给出具体的修改建议。' +
          '评审风格应严谨、专业、有建设性。使用中文评审。',
        temperature: 0.3,
        maxTokens: 4096,
      })

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply || '评审未果，请稍后重试。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: err?.message || '同行评审失败，请检查智囊配置。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setPeerReviewing(false)
    }
  }

  /* ---- 段落润色 ---- */
  const handleParagraphPolish = async (type: PolishType = 'standard') => {
    const selectedText = editor?.state.selection ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to) : ''
    const textToPolish = selectedText.trim() || input.trim()
    if (!textToPolish.trim()) {
      const warningMsg: Message = {
        id: `warning-${Date.now()}`,
        role: 'assistant',
        content: '请先选中要润色的文本，或在输入框中输入要润色的内容。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, warningMsg])
      return
    }

    setPolishingParagraph(true)
    setPolishType(type)
    setPolishResult(null)
    setShowPolishResult(false)

    try {
      const result = await polishContent(textToPolish, type)

      if (result.error) {
        throw new Error(result.error)
      }

      setPolishResult(result.polishedText)
      setPolishDiffMarkup(result.diffMarkup)
      setShowPolishResult(true)
    } catch (err: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: err?.message || '段落润色失败，请检查智囊配置。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setPolishingParagraph(false)
    }
  }

  /* ---- 应用润色结果 ---- */
  const applyPolishResult = () => {
    if (polishResult && editor) {
      editor.chain().focus().insertContent(polishResult).run()
      setShowPolishResult(false)
      setPolishResult(null)
      setPolishDiffMarkup('')
    }
  }

  /* ---- 全文润色 ---- */
  const handleFullPolish = async () => {
    const docText = editor?.getText() || currentDoc?.plainText || ''
    if (!docText.trim()) {
      const warningMsg: Message = {
        id: `warning-${Date.now()}`,
        role: 'assistant',
        content: '当前文档为空，请先输入一些内容后再进行全文润色。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, warningMsg])
      return
    }

    setShowPolishConfirm(true)
  }

  /** 确认后开始全文润色 */
  const confirmFullPolish = async () => {
    setShowPolishConfirm(false)
    const docText = editor?.getText() || currentDoc?.plainText || ''
    const chunks = chunkText(docText, 3000)

    setPolishingAll(true)
    setPolishProgress(0)

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: `【全文润色】正在对全文进行润色，共 ${chunks.length} 段...`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])

    const polishedChunks: string[] = []

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        setPolishProgress(Math.round(((i + 1) / chunks.length) * 100))

        const prompt = `请对以下段落进行润色，使其表达更加流畅、规范。保持原文的核心观点和专业术语不变，仅优化语言表达：

${chunk}

请直接输出润色后的文本，不要添加任何解释或标注。`

        const reply = await callAI(prompt, {
          systemPrompt: currentPersona.systemPrompt,
          temperature: 0.5,
          maxTokens: 2048,
        })

        polishedChunks.push(reply.trim())
      }

      const polishedText = polishedChunks.join('\n\n')

      /* 替换原文 */
      if (editor) {
        editor.chain().focus().selectAll().insertContent(polishedText).run()
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `全文润色完成！共处理 ${chunks.length} 段内容，原文已替换为润色后的版本。`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: err?.message || '全文润色失败，请检查智囊配置。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setPolishingAll(false)
      setPolishProgress(0)
    }
  }

  /* ---- 键盘发送（Shift+Enter 换行） ---- */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="fixed right-0 top-0 h-full w-[380px] liquid-glass shadow-xl z-50 flex flex-col animate-slide-in-right"
      role="complementary"
      aria-label="智囊面板"
    >
      {/* Left ochre vertical accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-ochre/60 rounded-r" />

      {/* Top ink-divider */}
      <div className="ink-divider" />

      {/* ==================== Header ==================== */}
      <div className="flex items-center justify-between px-4 py-3 ink-divider shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-ochre to-cinnabar flex items-center justify-center shadow-sm">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-display font-semibold text-ink">智囊</h2>
            <p className="text-[11px] text-ink-muted">学术写作智能辅助</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const settingsBtn = document.querySelector('[data-ai-settings-trigger]') as HTMLElement
              settingsBtn?.click()
            }}
            className="p-1.5 rounded-[10px] text-ink-muted hover:bg-ochre/5 hover:text-ink transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
            aria-label="智囊配置"
            title="智囊配置"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[10px] text-ink-muted hover:bg-ochre/5 hover:text-ink transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
            aria-label="关闭智囊"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ==================== 写作角色切换 Tab ==================== */}
      <div className="px-3 pt-3 pb-2 ink-divider shrink-0">
        <div className="relative" ref={personaMenuRef}>
          <div className="flex items-center gap-1.5">
            {personaConfigs.map((p) => {
              const Icon = p.icon
              const active = persona === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${active
                    ? 'border-ochre/40 bg-ochre/5 text-ochre golden-glow'
                    : 'border-ochre/15 text-ink-muted hover:text-ink-secondary hover:border-ochre/30'
                    }`}
                  title={p.description}
                >
                  <Icon className={`w-3.5 h-3.5 transition-transform duration-[250ms] ${active ? '' : 'hover:rotate-12'}`} />
                  {p.label}
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-ink-light mt-1.5 text-center">
            当前角色：{currentPersona.description}
          </p>
        </div>
      </div>

      {/* ==================== Messages area ==================== */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* ---- 空状态：快捷操作网格 ---- */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-full bg-ochre/5 flex items-center justify-center mb-4 animate-empty-float">
              <Sparkles className="w-8 h-8 text-ochre" />
            </div>
            <h3 className="text-base font-display font-semibold text-ink mb-1.5">智囊助手</h3>
            <p className="text-xs text-ink-muted mb-6 max-w-[260px] leading-relaxed">
              选择一个快捷操作，或直接输入你的问题
            </p>

            {/* 快捷操作网格 */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-[280px]">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-[14px] border border-ochre/10 bg-paper hover:bg-ochre/5 hover:border-ochre/20 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
                  >
                    <Icon className={`w-5 h-5 ${action.color}`} aria-hidden="true" />
                    <span className="text-xs font-medium text-ink">{action.label}</span>
                  </button>
                )
              })}
            </div>

            {/* 新增功能按钮 */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-[280px] mt-2">
              <button
                onClick={handleCitationCheck}
                disabled={citationChecking}
                className="flex flex-col items-center gap-1.5 p-3 rounded-[14px] border border-ochre/10 bg-paper hover:bg-ochre/5 hover:border-ochre/20 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 disabled:opacity-50"
              >
                <Quote className="w-5 h-5 text-cinnabar" />
                <span className="text-xs font-medium text-ink">
                  {citationChecking ? '检查中...' : '引用格式检查'}
                </span>
              </button>
              <button
                onClick={handlePeerReview}
                disabled={peerReviewing}
                className="flex flex-col items-center gap-1.5 p-3 rounded-[14px] border border-ochre/10 bg-paper hover:bg-ochre/5 hover:border-ochre/20 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 disabled:opacity-50"
              >
                <ScanEye className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-medium text-ink">
                  {peerReviewing ? '评审中...' : '同行评审'}
                </span>
              </button>
              <button
                onClick={handleFullPolish}
                disabled={polishingAll}
                className="flex flex-col items-center gap-1.5 p-3 rounded-[14px] border border-ochre/10 bg-paper hover:bg-ochre/5 hover:border-ochre/20 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 disabled:opacity-50"
              >
                <PenLine className="w-5 h-5 text-[#6B8E5A]" />
                <span className="text-xs font-medium text-ink">
                  {polishingAll ? '润色中...' : '全文润色'}
                </span>
              </button>
              <button
                onClick={() => handleParagraphPolish('standard')}
                disabled={polishingParagraph}
                className="flex flex-col items-center gap-1.5 p-3 rounded-[14px] border border-ochre/10 bg-paper hover:bg-ochre/5 hover:border-ochre/20 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 disabled:opacity-50"
              >
                <Wand2 className="w-5 h-5 text-ochre" />
                <span className="text-xs font-medium text-ink">
                  {polishingParagraph ? '润色中...' : '段落润色'}
                </span>
              </button>
            </div>

            <p className="text-[11px] text-ink-light mt-4">
              按 Esc 关闭面板 · Shift+Enter 换行
            </p>
          </div>
        )}

        {/* ---- 消息列表 ---- */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${msg.role === 'assistant' ? 'animate-msg-left' : 'animate-msg-right'}`}
          >
            <div
              className={`max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-sm leading-relaxed relative group ${msg.role === 'user'
                ? 'bg-ochre/5 text-ink rounded-br-sm border border-ochre/10'
                : 'liquid-glass-dark text-ink rounded-bl-sm'
                }`}
            >
              {/* AI 消息左侧小印章装饰 */}
              {msg.role === 'assistant' && (
                <div className="absolute left-0 top-3 w-1.5 h-1.5 rounded-full bg-ochre/50 -translate-x-[3px]" />
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* 复制按钮（仅助手消息） */}
              {msg.role === 'assistant' && (
                <button
                  onClick={() => handleCopy(msg.id, msg.content)}
                  className="absolute -bottom-1 right-2 p-1 rounded-[8px] bg-paper border border-ochre/10 text-ink-muted hover:text-ink hover:border-ochre/20 opacity-0 group-hover:opacity-100 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
                  aria-label="复制回复"
                  title="复制"
                >
                  {copiedId === msg.id ? (
                    <CheckCheck className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* ---- 加载指示器 ---- */}
        {loading && (
          <div className="flex justify-start">
            <div className="liquid-glass-dark rounded-[14px] rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-ochre animate-spin" />
              <span className="text-xs text-ink-muted">智囊思考中...</span>
            </div>
          </div>
        )}

        {/* ---- 全文润色进度条 ---- */}
        {polishingAll && (
          <div className="flex justify-start">
            <div className="liquid-glass-dark rounded-[14px] rounded-bl-sm px-4 py-3 w-full max-w-[85%]">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-4 h-4 text-ochre animate-spin" />
                <span className="text-xs text-ink-muted">正在全文润色...</span>
                <span className="text-xs text-ochre font-medium">{polishProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-ink/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ochre to-cinnabar rounded-full transition-all duration-300"
                  style={{ width: `${polishProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ==================== 输入区域 ==================== */}
      <div className="ink-divider p-3 shrink-0">
        {/* 快捷操作栏（有消息时显示） */}
        {messages.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-hide">
            {quickActions.slice(0, 4).map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    if (action.id === 'polish_academic') {
                      handleParagraphPolish('academic')
                    } else if (action.id === 'polish_business') {
                      handleParagraphPolish('business')
                    } else {
                      handleQuickAction(action)
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-ochre/10 text-[11px] font-medium text-ink-secondary hover:bg-ochre/5 hover:-translate-y-px transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] whitespace-nowrap active:scale-[0.97] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 relative"
                >
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3 rounded-full ${action.color.replace('text-', 'bg-')}`} />
                  <Icon className={`w-3 h-3 ${action.color} ml-1`} aria-hidden="true" />
                  {action.label}
                </button>
              )
            })}
            <button
              onClick={handleCitationCheck}
              disabled={citationChecking}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-ochre/10 text-[11px] font-medium text-ink-secondary hover:bg-ochre/5 hover:-translate-y-px transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] whitespace-nowrap active:scale-[0.97] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 disabled:opacity-50 relative"
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3 rounded-full bg-cinnabar" />
              <Quote className="w-3 h-3 text-cinnabar ml-1" />
              引用检查
            </button>
            <button
              onClick={handleFullPolish}
              disabled={polishingAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-ochre/10 text-[11px] font-medium text-ink-secondary hover:bg-ochre/5 hover:-translate-y-px transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] whitespace-nowrap active:scale-[0.97] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 disabled:opacity-50 relative"
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3 rounded-full bg-[#6B8E5A]" />
              <PenLine className="w-3 h-3 text-[#6B8E5A] ml-1" />
              全文润色
            </button>
            <button
              onClick={() => handleParagraphPolish('standard')}
              disabled={polishingParagraph}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-ochre/10 text-[11px] font-medium text-ink-secondary hover:bg-ochre/5 hover:-translate-y-px transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] whitespace-nowrap active:scale-[0.97] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 disabled:opacity-50 relative"
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3 rounded-full bg-ochre" />
              <Wand2 className="w-3 h-3 text-ochre ml-1" />
              段落润色
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请赐教..."
            rows={1}
            className="input-field flex-1 resize-none px-3 py-2.5 text-sm max-h-32"
            aria-label="输入消息"
          />
          <button
            onClick={(e) => {
              const btn = e.currentTarget
              const ripple = document.createElement('span')
              ripple.className = 'ink-ripple'
              const rect = btn.getBoundingClientRect()
              const size = Math.max(rect.width, rect.height)
              ripple.style.width = ripple.style.height = `${size}px`
              ripple.style.left = `${e.clientX - rect.left - size / 2}px`
              ripple.style.top = `${e.clientY - rect.top - size / 2}px`
              btn.appendChild(ripple)
              ripple.addEventListener('animationend', () => ripple.remove())
              handleSend()
            }}
            disabled={!input.trim() || loading}
            className="btn-primary p-2.5 rounded-[12px] shrink-0 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="发送消息"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ==================== 全文润色确认对话框 ==================== */}
      {showPolishConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-ink/20 backdrop-blur-sm">
          <div className="liquid-glass rounded-[20px] shadow-2xl w-[320px] mx-4 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-cinnabar" />
              <h3 className="text-sm font-display font-semibold text-ink">确认全文润色</h3>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed mb-4">
              全文润色将使用智囊对当前文档的所有内容进行逐段润色，并<b>替换原文</b>。
              <br />
              <br />
              建议先保存当前版本，以便在需要时恢复。是否继续？
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPolishConfirm(false)}
                className="px-3 py-1.5 rounded-[10px] text-xs font-medium text-ink-secondary hover:bg-ochre/5 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                取消
              </button>
              <button
                onClick={confirmFullPolish}
                className="btn-primary px-3 py-1.5 text-xs"
              >
                确认润色
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 段落润色结果对话框 ==================== */}
      {showPolishResult && polishResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-ink/20 backdrop-blur-sm">
          <div className="liquid-glass rounded-[20px] shadow-2xl w-[90%] max-w-[500px] mx-4 p-5 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-ochre" />
                <h3 className="text-sm font-display font-semibold text-ink">段落润色结果</h3>
              </div>
              <button
                onClick={() => {
                  setShowPolishResult(false)
                  setPolishResult(null)
                  setPolishDiffMarkup('')
                }}
                className="p-1 rounded-[8px] text-ink-muted hover:bg-ochre/5 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                <X className="w-4 h-4 text-ink-secondary" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              <div>
                <p className="text-xs font-medium text-ink-secondary mb-1.5">润色类型</p>
                <span className="text-xs px-2 py-1 rounded-full bg-ink/5 text-ink-secondary">
                  {{ standard: '标准润色', academic: '学术润色', business: '商业润色', creative: '创意润色' }[polishType]}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-ink-secondary mb-1.5">对比结果</p>
                <div className="bg-paper rounded-[14px] p-3 text-xs leading-relaxed max-h-[200px] overflow-y-auto">
                  <style>{`
                    .diff-add { background-color: #E8F5E9; text-decoration: underline; text-decoration-color: #4CAF50; }
                    .diff-del { background-color: #FFEBEE; text-decoration: line-through; text-decoration-color: #F44336; }
                  `}</style>
                  <div dangerouslySetInnerHTML={{ __html: polishDiffMarkup.replace(/\n/g, '<br/>') }} />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-ink-secondary mb-1.5">润色后文本</p>
                <div className="bg-paper border border-ochre/10 rounded-[14px] p-3 text-xs leading-relaxed max-h-[200px] overflow-y-auto">
                  {polishResult}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 ink-divider">
              <button
                onClick={() => {
                  setShowPolishResult(false)
                  setPolishResult(null)
                  setPolishDiffMarkup('')
                }}
                className="px-3 py-1.5 rounded-[10px] text-xs font-medium text-ink-secondary hover:bg-ochre/5 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                取消
              </button>
              <button
                onClick={applyPolishResult}
                className="btn-primary px-3 py-1.5 text-xs"
              >
                应用到文档
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
