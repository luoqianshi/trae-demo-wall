import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Trash2, User, Bot, Sparkles, X, ArrowLeft } from 'lucide-react'
import { sendLocalChat } from '../lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export function LocalChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = useCallback(async () => {
    const content = input.trim()
    if (!content || loading) return

    setInput('')
    setError('')

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)

    setLoading(true)
    try {
      const history = newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
      const res = await sendLocalChat(content, history)
      if (!res.success) throw new Error('回复失败')

      const botMsg: Message = {
        id: `b_${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '发送失败'
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleClear = useCallback(() => {
    setMessages([])
    setError('')
  }, [])

  // 消息分组：连续同发送者的消息归为一组
  const groupedMessages = useMemo(() => {
    const groups: { sender: 'user' | 'assistant'; messages: Message[] }[] = []
    for (const msg of messages) {
      const last = groups[groups.length - 1]
      if (last && last.sender === msg.role) {
        last.messages.push(msg)
      } else {
        groups.push({ sender: msg.role, messages: [msg] })
      }
    }
    return groups
  }, [messages])

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    return isToday ? time : `${d.getMonth() + 1}/${d.getDate()} ${time}`
  }

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: 'calc(100vh - 3.5rem)' }}>
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:opacity-80"
            style={{ background: 'hsl(var(--surface-elevated))', border: '1px solid hsl(var(--border) / 0.5)' }}
            title="返回"
          >
            <ArrowLeft className="h-4 w-4" style={{ color: 'hsl(var(--text-secondary))' }} />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }}>
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 flex-shrink-0"
                style={{ background: loading ? 'hsl(38, 92%, 50%)' : 'hsl(142, 76%, 45%)', borderColor: 'hsl(var(--surface))' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>本地聊天室</h2>
              <p className="text-[11px]" style={{ color: 'hsl(var(--text-muted))' }}>
                {loading ? '正在输入...' : '独立对话 · 必定回复'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleClear}
          disabled={messages.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 hover:opacity-80"
          style={{
            color: 'hsl(var(--text-muted))',
            border: '1px solid hsl(var(--border) / 0.5)',
            opacity: messages.length === 0 ? 0.35 : 1,
          }}
          title="清空对话"
        >
          <Trash2 className="h-3.5 w-3.5" />
          清空对话
        </button>
      </div>

      {/* 消息列表 */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center h-full text-center px-8 pb-20">
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-3xl flex items-center justify-center"
                style={{ background: 'hsl(var(--primary) / 0.08)' }}>
                <Sparkles className="h-10 w-10" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div className="absolute inset-0 rounded-3xl animate-pulse"
                style={{ boxShadow: '0 0 40px hsl(var(--primary) / 0.15)' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--text-primary))' }}>
              开始和瞳瞳聊天吧
            </h3>
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: 'hsl(var(--text-muted))' }}>
              和瞳瞳一对一聊天的小角落，每条消息都会认真回复你～
            </p>
          </div>
        ) : (
          <div className="px-4 py-4 max-w-4xl mx-auto space-y-1">
            {groupedMessages.map((group) => (
              <div key={group.messages[0].id} className={group.messages.length > 1 ? 'space-y-0.5' : ''}>
                {group.messages.map((msg, idx) => {
                  const isFirst = idx === 0
                  const isLast = idx === group.messages.length - 1
                  const isUser = group.sender === 'user'

                  return (
                    <div key={msg.id}>
                      {/* 首条消息：显示头像和名字 */}
                      {isFirst && (
                        <div className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} mt-4 first:mt-0`}>
                          {/* 头像 */}
                          <div className="relative flex-shrink-0">
                            <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                              style={isUser
                                ? { background: 'hsl(var(--text-muted) / 0.15)' }
                                : { background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }}>
                              {isUser
                                ? <User className="h-4 w-4" style={{ color: 'hsl(var(--text-secondary))' }} />
                                : <Bot className="h-4 w-4 text-white" />}
                            </div>
                          </div>

                          {/* 名字 + 时间 + 气泡 */}
                          <div className={`flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start'}`} style={{ maxWidth: 'calc(100% - 48px)' }}>
                            <div className={`flex items-center gap-2 mb-1 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                              <span className="text-[11px] font-medium" style={{ color: 'hsl(var(--text-muted))' }}>
                                {isUser ? '我' : '瞳瞳'}
                              </span>
                              <span className="text-[10px]" style={{ color: 'hsl(var(--text-muted) / 0.6)' }}>
                                {formatTime(msg.timestamp)}
                              </span>
                            </div>
                            <div
                              className="rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words"
                              style={isUser ? {
                                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)',
                                color: 'white',
                                borderBottomRightRadius: isLast ? '0.5rem' : '1rem',
                              } : {
                                background: 'hsl(var(--surface-elevated))',
                                border: '1px solid hsl(var(--border) / 0.5)',
                                color: 'hsl(var(--text-primary))',
                                borderBottomLeftRadius: isLast ? '0.5rem' : '1rem',
                              }}
                            >
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 非首条消息：无头像，紧贴上一消息 */}
                      {!isFirst && (
                        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={isUser ? 'mr-10' : 'ml-10'} style={{ maxWidth: 'calc(100% - 48px)' }}>
                            <div
                              className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${isUser ? 'ml-auto' : ''}`}
                              style={isUser ? {
                                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)',
                                color: 'white',
                                borderBottomRightRadius: isLast ? '0.5rem' : '1rem',
                              } : {
                                background: 'hsl(var(--surface-elevated))',
                                border: '1px solid hsl(var(--border) / 0.5)',
                                color: 'hsl(var(--text-primary))',
                                borderBottomLeftRadius: isLast ? '0.5rem' : '1rem',
                              }}
                            >
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* 加载指示器 */}
        {loading && (
          <div className="px-4 py-4 max-w-4xl mx-auto">
            <div className="flex items-end gap-2.5 mt-4">
              <div className="relative flex-shrink-0">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }}>
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 flex-shrink-0"
                  style={{ background: 'hsl(38, 92%, 50%)', borderColor: 'hsl(var(--surface))' }} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium mb-1 px-1" style={{ color: 'hsl(var(--text-muted))' }}>瞳瞳</span>
                <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2"
                  style={{
                    background: 'hsl(var(--surface-elevated))',
                    border: '1px solid hsl(var(--border) / 0.5)',
                    borderBottomLeftRadius: '0.5rem',
                  }}>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full animate-bounce" style={{ background: 'hsl(var(--primary))', animationDelay: '0ms' }} />
                    <div className="h-2 w-2 rounded-full animate-bounce" style={{ background: 'hsl(var(--primary))', animationDelay: '150ms' }} />
                    <div className="h-2 w-2 rounded-full animate-bounce" style={{ background: 'hsl(var(--primary))', animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="px-4 py-4 max-w-4xl mx-auto flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs"
              style={{
                background: 'hsl(0 84% 60% / 0.1)',
                color: 'hsl(0 84% 60%)',
                border: '1px solid hsl(0 84% 60% / 0.2)',
              }}>
              <X className="h-3 w-3" />
              {error}
              <button
                onClick={() => setError('')}
                className="ml-1 hover:opacity-70"
                style={{ color: 'inherit' }}>
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="flex-shrink-0 px-4 py-3"
        style={{ borderTop: '1px solid hsl(var(--border) / 0.5)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2 rounded-2xl px-1 py-1 transition-all duration-150"
            style={{
              background: 'hsl(var(--surface))',
              border: '1px solid hsl(var(--border) / 0.5)',
              boxShadow: '0 1px 3px hsl(var(--border) / 0.1)',
            }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，Enter 发送，Shift+Enter 换行..."
              rows={1}
              disabled={loading}
              className="flex-1 resize-none bg-transparent px-3 py-1.5 text-sm outline-none"
              style={{
                color: 'hsl(var(--text-primary))',
                minHeight: '28px',
                maxHeight: '120px',
                opacity: loading ? 0.5 : 1,
              }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 120) + 'px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150"
              style={{
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)'
                  : 'transparent',
                opacity: !input.trim() || loading ? 0.35 : 1,
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              }}
            >
              <Send className="h-4 w-4" style={{ color: input.trim() && !loading ? 'white' : 'hsl(var(--text-muted))' }} />
            </button>
          </div>
          <p className="text-[10px] mt-1.5 text-center" style={{ color: 'hsl(var(--text-muted) / 0.5)' }}>
            Enter 发送 · Shift+Enter 换行
          </p>
        </div>
      </div>
    </div>
  )
}