'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Bot,
  Send,
  X,
  Sparkles,
  Wand2,
  FileText,
  Lightbulb,
  Loader2,
  Copy,
  CheckCheck,
  GripVertical,
  ChevronRight,
} from 'lucide-react'
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

interface AIChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  editor: TiptapEditor | null
  currentDoc: Document | null
}

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
  {
    id: 'summarize',
    label: '总结全文',
    icon: Lightbulb,
    prompt: '请对以下全文内容进行总结，提炼核心观点和主要结论：',
    color: 'text-ochre',
  },
  {
    id: 'polish',
    label: '润色当前段落',
    icon: Wand2,
    prompt: '请润色以下段落，使其表达更加流畅、学术化：',
    color: 'text-[#6B8E5A]',
  },
  {
    id: 'outline',
    label: '生成大纲',
    icon: FileText,
    prompt: '请根据以下内容生成论文大纲，包含各级标题和要点：',
    color: 'text-indigo',
  },
]

/* ============================================================
   工具函数
   ============================================================ */

/** 生成唯一消息 ID */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** 获取当前文档内容 */
function getDocumentContent(editor: TiptapEditor | null, currentDoc: Document | null): string {
  if (editor) {
    return editor.getText() || ''
  }
  if (currentDoc) {
    return currentDoc.plainText || ''
  }
  return ''
}

/** 获取当前选中的文本 */
function getSelectedText(editor: TiptapEditor | null): string {
  if (!editor) return ''
  const { from, to } = editor.state.selection
  if (from === to) return ''
  return editor.state.doc.textBetween(from, to)
}

/* ============================================================
   主组件
   ============================================================ */

export default function AIChatSidebar({
  isOpen,
  onClose,
  editor,
  currentDoc,
}: AIChatSidebarProps) {
  /* ---- 状态 ---- */
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [width, setWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const resizeStartXRef = useRef(0)
  const resizeStartWidthRef = useRef(320)

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

  /* ---- 拖动调整宽度 ---- */
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = resizeStartXRef.current - e.clientX
      const newWidth = Math.max(260, Math.min(480, resizeStartWidthRef.current + delta))
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

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

  /* ---- 预留 AI 调用接口 ---- */
  const callAIAPI = async (prompt: string): Promise<string> => {
    // TODO: 接入真实 AI API
    console.log('[AIChatSidebar] AI 调用预留接口:', prompt)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('这是智囊的预留回复。实际集成时，请在此处接入真实 API。')
      }, 1000)
    })
  }

  /* ---- 发送消息（核心 AI 调用） ---- */
  const handleSend = async (text?: string) => {
    const content = text || input.trim()
    if (!content || loading) return

    const userMsg: Message = {
      id: generateId('user'),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const reply = await callAIAPI(content)

      const assistantMsg: Message = {
        id: generateId('assistant'),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      const errorMsg: Message = {
        id: generateId('error'),
        role: 'assistant',
        content: err?.message || '智囊回复未果，请稍后重试。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  /* ---- 快捷操作 ---- */
  const handleQuickAction = async (action: QuickAction) => {
    const docContent = getDocumentContent(editor, currentDoc)
    const selectedText = getSelectedText(editor)

    let prompt = action.prompt
    let context = ''

    if (action.id === 'polish') {
      // 润色当前段落：优先使用选中文本
      if (selectedText.trim()) {
        context = selectedText
      } else if (docContent.trim()) {
        // 如果没有选中，使用光标所在段落
        context = docContent
      }
    } else {
      // 总结全文 / 生成大纲：使用全文
      if (docContent.trim()) {
        context = docContent
      }
    }

    if (!context.trim()) {
      const warningMsg: Message = {
        id: generateId('warning'),
        role: 'assistant',
        content: '当前文档为空，请先输入一些内容后再使用此功能。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, warningMsg])
      return
    }

    const fullPrompt = `${prompt}\n\n${context.slice(0, 4000)}`
    await handleSend(fullPrompt)
  }

  /* ---- 引用当前文档内容 ---- */
  const handleQuoteDocument = () => {
    const docContent = getDocumentContent(editor, currentDoc)
    if (!docContent.trim()) {
      const warningMsg: Message = {
        id: generateId('warning'),
        role: 'assistant',
        content: '当前文档为空，无法引用内容。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, warningMsg])
      return
    }

    const quoted = `【引用当前文档】\n${docContent.slice(0, 2000)}${docContent.length > 2000 ? '\n...（内容已截断）' : ''}`
    setInput((prev) => {
      const separator = prev.trim() ? '\n\n' : ''
      return prev + separator + quoted
    })
    inputRef.current?.focus()
  }

  /* ---- 键盘发送（Shift+Enter 换行） ---- */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  /* ---- 开始拖动调整宽度 ---- */
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    resizeStartXRef.current = e.clientX
    resizeStartWidthRef.current = width
    setIsResizing(true)
  }

  if (!isOpen) return null

  return (
    <div
      ref={sidebarRef}
      className="fixed right-0 top-0 h-full bg-paper border-l border-border shadow-xl z-50 flex flex-col animate-slide-in-right"
      style={{ width: `${width}px` }}
      role="complementary"
      aria-label="智囊侧边栏"
    >
      {/* 拖动调整宽度的把手 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center z-10 group -ml-1.5"
        onMouseDown={handleResizeStart}
        title="拖动调整宽度"
      >
        <div className="w-1 h-8 rounded-full bg-border group-hover:bg-ochre transition-colors" />
      </div>

      {/* ==================== Header ==================== */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ochre to-cinnabar flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">论道</h2>
            <p className="text-[11px] text-ink-muted">智能写作辅助</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-ink-muted hover:bg-paper-dark hover:text-ink transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
          aria-label="关闭智囊"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ==================== Messages area ==================== */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* ---- 空状态：快捷操作 ---- */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-full bg-ochre-bg flex items-center justify-center mb-4 animate-empty-float">
              <Sparkles className="w-8 h-8 text-ochre" />
            </div>
            <h3 className="text-base font-semibold text-ink mb-1.5">论道</h3>
            <p className="text-xs text-ink-muted mb-6 max-w-[240px] leading-relaxed">
              选择快捷操作，或直接输入你的问题
            </p>

            {/* 快捷操作按钮 */}
            <div className="flex flex-col gap-2 w-full max-w-[260px]">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-paper hover:bg-paper-dark hover:border-ink-light transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 text-left"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-paper flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${action.color}`} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-ink block">{action.label}</span>
                      <span className="text-[11px] text-ink-muted truncate block">
                        {action.id === 'summarize' && '提炼全文核心观点'}
                        {action.id === 'polish' && '优化选中段落表达'}
                        {action.id === 'outline' && '自动生成论文大纲'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-light shrink-0" />
                  </button>
                )
              })}
            </div>

            <p className="text-[11px] text-ink-light mt-6">
              按 Esc 关闭面板 · Shift+Enter 换行
            </p>
          </div>
        )}

        {/* ---- 消息列表 ---- */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed relative group ${
                msg.role === 'user'
                  ? 'bg-ochre text-white rounded-br-sm'
                  : 'bg-paper-dark text-ink rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* 复制按钮（仅助手消息） */}
              {msg.role === 'assistant' && (
                <button
                  onClick={() => handleCopy(msg.id, msg.content)}
                  className="absolute -bottom-1 right-2 p-1 rounded-md bg-paper border border-border text-ink-muted hover:text-ink hover:border-ink-light opacity-0 group-hover:opacity-100 transition-all active:scale-90 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
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
            <div className="bg-paper-dark rounded-xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-ochre animate-spin" />
              <span className="text-xs text-ink-muted">智囊思考中...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ==================== 输入区域 ==================== */}
      <div className="border-t border-border p-3 shrink-0">
        {/* 快捷操作栏（有消息时显示） */}
        {messages.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-hide">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-border text-[11px] font-medium text-ink-secondary hover:bg-paper-dark hover:border-ink-light transition-all whitespace-nowrap active:scale-[0.97] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
                >
                  <Icon className={`w-3 h-3 ${action.color}`} aria-hidden="true" />
                  {action.label}
                </button>
              )
            })}
            <button
              onClick={handleQuoteDocument}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-border text-[11px] font-medium text-ink-secondary hover:bg-paper-dark hover:border-ink-light transition-all whitespace-nowrap active:scale-[0.97] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
            >
              <FileText className="w-3 h-3 text-ochre" />
              引用文档
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
            className="flex-1 resize-none px-3 py-2.5 text-sm bg-paper border border-border rounded-xl text-ink placeholder:text-ink-light focus:outline-none focus:border-ochre focus:ring-1 focus:ring-ochre/20 transition-all max-h-32"
            aria-label="输入消息"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-ochre text-white hover:bg-ink transition-all duration-150 active:scale-90 disabled:opacity-40 disabled:pointer-events-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/40"
            aria-label="发送消息"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
