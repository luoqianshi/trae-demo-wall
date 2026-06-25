import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Activity, Brain, Bot, FileText, RefreshCw, Eye, ChevronRight, ChevronDown,
  MessageSquare, Clock, ArrowLeft, ArrowRight, AtSign, Image, Search, X,
  Loader2, Send, Sparkles, XCircle, Users, User,
} from 'lucide-react'
import { fetchChatRecent, createEventSource } from '../lib/api'
import type { ChatMessage } from '../types/api'

interface StageEvent {
  session_id: string
  session_name: string
  stage: string
  detail: string
  round_text: string
  agent_state: string
  timestamp: number
  msg_id?: string
  preview_uri?: string
  preview_category?: string
  preview_time?: string
  response_summary?: string
  preview_html_uri?: string
  preview_txt_uri?: string
  preview_json_uri?: string
  token_estimate?: {
    prompt_chars: number
    completion_chars: number
    total_chars: number
    estimated_tokens: number
  }
  eval_relevance?: number
  eval_coherence?: number
  eval_engagement?: number
  eval_safety?: number
  eval_persona?: number
  eval_overall?: number
  eval_comment?: string
  planner_thought?: string
}

interface PreviewItem {
  html_path: string
  txt_path: string
  json_path?: string
  category: string
  time: string
  uri: string
  msg_id?: string
  response_summary?: string
  preview_html_uri?: string
  preview_txt_uri?: string
  preview_json_uri?: string
  token_estimate?: {
    prompt_chars: number
    completion_chars: number
    total_chars: number
    estimated_tokens: number
  }
  eval_relevance?: number
  eval_coherence?: number
  eval_engagement?: number
  eval_safety?: number
  eval_persona?: number
  eval_overall?: number
  eval_comment?: string
  planner_thought?: string
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 10_000) return '刚刚'
  if (diff < 60_000) return `${Math.round(diff / 1000)}秒前`
  if (diff < 3600_000) return `${Math.round(diff / 60_000)}分钟前`
  return `${Math.round(diff / 3600_000)}小时前`
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function truncate(s: string, n: number): string {
  if (!s) return ''
  return s.length > n ? s.slice(0, n) + '...' : s
}

function getAuthHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('yf_auth_token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [msgsLoading, setMsgsLoading] = useState(true)

  const [stages, setStages] = useState<Map<string, StageEvent>>(new Map())
  const [sseConnected, setSseConnected] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const [previews, setPreviews] = useState<PreviewItem[]>([])
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'html' | 'txt' | 'json'>('html')
  const [showPreview, setShowPreview] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const [detailMessage, setDetailMessage] = useState<ChatMessage | null>(null)
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set())

  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('yara-monitor-sidebar') !== 'false')
  const [defaultGroupSet, setDefaultGroupSet] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async (silent = false) => {
    if (!silent) setMsgsLoading(true)
    try {
      const data = await fetchChatRecent(200)
      setMessages(data.messages || [])
    } catch {} finally { if (!silent) setMsgsLoading(false) }
  }, [])

  useEffect(() => { loadMessages() }, [loadMessages])

  // 定期轮询消息（3秒），实现实时更新（静默模式，不显示加载动画）
  useEffect(() => {
    const timer = setInterval(() => loadMessages(true), 3000)
    return () => clearInterval(timer)
  }, [loadMessages])

  useEffect(() => {
    const es = createEventSource('/monitor/stages/stream')
    es.onopen = () => setSseConnected(true)
    es.onerror = () => setSseConnected(false)
    es.onmessage = (event) => {
      try {
        const evt: StageEvent = JSON.parse(event.data)
        if (evt.stage === 'preview_saved' && evt.preview_uri) {
          const newItem: PreviewItem = {
            html_path: '', txt_path: '',
            category: evt.preview_category || '',
            time: evt.preview_time || '',
            uri: evt.preview_uri || '',
            msg_id: evt.msg_id,
            response_summary: evt.response_summary,
            preview_html_uri: evt.preview_html_uri,
            preview_txt_uri: evt.preview_txt_uri,
            preview_json_uri: evt.preview_json_uri,
            token_estimate: evt.token_estimate,
            eval_relevance: evt.eval_relevance,
            eval_coherence: evt.eval_coherence,
            eval_engagement: evt.eval_engagement,
            eval_safety: evt.eval_safety,
            eval_persona: evt.eval_persona,
            eval_overall: evt.eval_overall,
            eval_comment: evt.eval_comment,
            planner_thought: evt.planner_thought,
          }
          setPreviews(prev => {
            // 用 json_path 去重，因为 URI 可能因 URL 编码差异而不同
            const key = newItem.preview_json_uri || newItem.uri
            if (prev.some(p => (p.preview_json_uri || p.uri) === key)) return prev
            const next = [newItem, ...prev]
            next.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            // 限制最多保留 500 条，避免内存无限增长但也不会太快挤掉旧预览
            if (next.length > 500) next.length = 500
            return next
          })
          return
        }
        setStages(prev => {
          const next = new Map(prev)
          evt.stage === 'removed' ? next.delete(evt.session_id) : next.set(evt.session_id, evt)
          return next
        })
      } catch {}
    }
    return () => { es.close(); setSseConnected(false) }
  }, [])

  const loadPreviews = useCallback(async () => {
    try {
      const resp = await fetch('/api/monitor/previews', { headers: getAuthHeaders() })
      const data = await resp.json()
      if (data.success) {
        setPreviews(prev => {
          // 用 json_path 作主键去重，比 uri 更可靠（不受 URL 编码差异影响）
          const seen = new Set<string>(prev.map(p => p.preview_json_uri || p.uri))
          const merged = [...prev]
          for (const p of (data.previews || [])) {
            const key = p.preview_json_uri || p.uri
            if (!seen.has(key)) {
              seen.add(key)
              merged.push(p)
            }
          }
          merged.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          // 限制最多保留 100 条
          if (merged.length > 100) merged.length = 100
          return merged
        })
      }
    } catch {}
  }, [])

  useEffect(() => { loadPreviews() }, [loadPreviews])

  // 定期轮询预览列表（5秒），确保 SSE 遗漏时也能同步
  useEffect(() => {
    const timer = setInterval(() => loadPreviews(), 5000)
    return () => clearInterval(timer)
  }, [loadPreviews])

  const viewPreview = useCallback(async (uri: string, type: 'html' | 'txt' | 'json') => {
    if (!uri) return
    setPreviewLoading(true)
    setPreviewError('')
    try {
      const resp = await fetch(uri, { headers: getAuthHeaders() })
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`)
      }
      const content = await resp.text()
      if (type === 'json') {
        try {
          setPreviewContent(JSON.stringify(JSON.parse(content), null, 2))
        } catch {
          setPreviewContent(content)
        }
      } else {
        setPreviewContent(content)
      }
      setPreviewType(type)
      setShowPreview(true)
    } catch (err: any) {
      setPreviewError(`加载失败: ${err.message || '未知错误'}`)
      setPreviewContent(null)
      setShowPreview(true)
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  const toggleDetail = (key: string) => {
    setExpandedDetails(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next })
  }

  const groupMap = new Map<string, ChatMessage[]>()
  for (const msg of messages) {
    const gid = msg.group_id || 'private'
    if (!groupMap.has(gid)) groupMap.set(gid, [])
    groupMap.get(gid)!.push(msg)
  }

  // 群列表：按最新消息时间排序（API 返回 DESC，msgs[0] 即最新）
  const groupList = Array.from(groupMap.entries())
    .map(([gid, msgs]) => {
      const lastMsg = msgs[0]
      const groupName = msgs.find(m => m.group_name)?.group_name || ''
      const stage = stages.get(gid)
      return {
        id: gid,
        name: gid === 'private' ? '私聊' : (groupName || gid),
        msgCount: msgs.length,
        lastTime: lastMsg?.timestamp || 0,
        lastContent: lastMsg?.content || '',
        isActive: stage != null && stage.stage !== 'removed',
        stage,
      }
    })
    .sort((a, b) => b.lastTime - a.lastTime)

  // 默认选中最新聊天的群（API 返回 DESC，msgs[0] 即最新）
  useEffect(() => {
    // 仅在尚未设置默认群且消息已加载且有群列表时执行
    if (defaultGroupSet || messages.length === 0) return
    const groups = Array.from(groupMap.entries())
      .map(([gid, msgs]) => {
        const lastMsg = msgs[0]
        return { id: gid, lastTime: lastMsg?.timestamp || 0 }
      })
      .sort((a, b) => b.lastTime - a.lastTime)
    if (groups.length > 0) {
      setSelectedGroup(groups[0].id)
      setDefaultGroupSet(true)
    }
  }, [messages.length, defaultGroupSet, selectedGroup])

  const filteredMessages = selectedGroup
    ? messages.filter(m => (m.group_id || 'private') === selectedGroup)
    : messages
  const searchedMessages = searchQuery
    ? filteredMessages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()) || m.sender.toLowerCase().includes(searchQuery.toLowerCase()))
    : filteredMessages

  // 精确匹配：消息是否有关联的预览（仅按 msg_id 精确匹配）
  // 用于「详情」徽章显示——只有真正触发了处理的消息才显示
  const hasExactPreview = (msg: ChatMessage): boolean => {
    const expectedCategory = msg.direction === 'in' ? 'planner' : 'replyer'
    // 出站消息：优先用 reply_to_msg_id 精确关联触发回复的入站消息
    // 入站消息：直接用自身 ID
    // 兼容旧出站数据（无 reply_to_msg_id）：退回到时间戳匹配
    const matchMsgId = msg.direction === 'in'
      ? msg.id
      : (msg.reply_to_msg_id || (() => {
          const sessID = msg.group_id || msg.sender_id
          const msgTime = msg.timestamp
          const prevIn = messages
            .filter(m => m.direction === 'in' && (m.group_id || m.sender_id) === sessID && m.timestamp <= msgTime && m.id !== msg.id)
            .sort((a, b) => b.timestamp - a.timestamp)[0]
          return prevIn?.id
        })())

    // 精确 msg_id 匹配：优先用后端写入的 msg_id 精确关联
    if (matchMsgId && previews.some(p => p.msg_id === matchMsgId && p.category === expectedCategory)) {
      return true
    }

    // 无精确 msg_id 匹配时，回退到时间窗口匹配（兼容 SSE 事件延迟到达、ID 格式差异等场景）
    const sessID = msg.group_id || msg.sender_id
    const msgTime = msg.timestamp
    const hasTimeWindowMatch = previews.some(p => {
      if (p.category !== expectedCategory) return false
      const pTime = new Date(p.time).getTime()
      return Math.abs(pTime - msgTime) < 30_000 && p.uri.includes(sessID)
    })

    // 入站消息批次过滤：如果该消息是批次中非最后一条（30秒内有更晚的入站消息），
    // 说明 planner 只处理了批次中最后一条，此消息不应显示详情徽章
    if (hasTimeWindowMatch && msg.direction === 'in') {
      const hasLaterInBatch = messages.some(m =>
        m.direction === 'in' &&
        m.id !== msg.id &&
        (m.group_id || m.sender_id) === sessID &&
        m.timestamp > msgTime &&
        m.timestamp - msgTime < 30_000
      )
      if (hasLaterInBatch) return false
    }

    return hasTimeWindowMatch
  }

  const getRelatedPreviews = (msg: ChatMessage): PreviewItem[] => {
    const expectedCategory = msg.direction === 'in' ? 'planner' : 'replyer'

    // 确定用于匹配预览的 ID
    // - 入站消息：用自己的 ID
    // - 出站消息：优先用 reply_to_msg_id 精确关联；兼容旧数据退回时间戳匹配
    const resolveMatchId = (): string | undefined => {
      if (msg.direction === 'in') return msg.id
      if (msg.reply_to_msg_id) return msg.reply_to_msg_id
      // 兼容旧数据（无 reply_to_msg_id）：找同会话中该消息之前最近的一条入站消息
      const sessID = msg.group_id || msg.sender_id
      const msgTime = msg.timestamp
      const prevIn = messages
        .filter(m => m.direction === 'in' && (m.group_id || m.sender_id) === sessID && m.timestamp <= msgTime && m.id !== msg.id)
        .sort((a, b) => b.timestamp - a.timestamp)[0]
      return prevIn?.id || msg.id
    }

    const matchMsgId = resolveMatchId()

    // 精确匹配：matchMsgId + category 同时匹配
    // 能匹配到的说明消息确实被处理了，直接返回，不走批次过滤
    if (matchMsgId) {
      const byMsgID = previews.filter(p => p.msg_id === matchMsgId && p.category === expectedCategory)
      if (byMsgID.length > 0) return byMsgID
      // 没有精确匹配的预览，说明这条消息未被处理
      // 但入站消息可能因为批次合并（同session30秒内有更晚消息）而被跳过，
      // 只有确定是"批次中非最后一条"才隐藏按钮
      if (msg.direction === 'in') {
        const sessID = msg.group_id || msg.sender_id
        const msgTime = msg.timestamp
        const hasLaterInBatch = messages.some(m =>
          m.direction === 'in' &&
          m.id !== msg.id &&
          (m.group_id || m.sender_id) === sessID &&
          m.timestamp > msgTime &&
          m.timestamp - msgTime < 30_000
        )
        if (hasLaterInBatch) return []
      }
      // 无精确 msg_id 匹配时，回退到时间窗口匹配（兼容 SSE 事件延迟/ID 格式差异等场景）
    }

    // 退回到时间窗口匹配（兼容旧预览文件，无 msg_id 的场景）
    const sessID = msg.group_id || msg.sender_id
    const msgTime = msg.timestamp
    const matched = previews.filter(p => {
      if (p.category !== expectedCategory) return false
      const pTime = new Date(p.time).getTime()
      return Math.abs(pTime - msgTime) < 30_000 && p.uri.includes(sessID)
    })

    // 入站消息批次过滤（仅无精确 msg_id 匹配时才需要时间窗口匹配，且需要过滤批次中非最后一条）
    if (msg.direction === 'in' && matched.length > 0) {
      const hasLaterInBatch = messages.some(m =>
        m.direction === 'in' &&
        m.id !== msg.id &&
        (m.group_id || m.sender_id) === sessID &&
        m.timestamp > msgTime &&
        m.timestamp - msgTime < 30_000
      )
      if (hasLaterInBatch) return []
    }

    return matched
  }

  const selectedStage = selectedGroup ? stages.get(selectedGroup) : undefined

  const stats = {
    messages: filteredMessages.length,
    inCount: filteredMessages.filter(m => m.direction === 'in').length,
    outCount: filteredMessages.filter(m => m.direction === 'out').length,
    previews: previews.length,
    plannerCount: previews.filter(p => p.category === 'planner').length,
    replyerCount: previews.filter(p => p.category === 'replyer').length,
    groups: groupList.length,
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 p-4">
      <div className="shrink-0 flex flex-col rounded-2xl card card-glow transition-all duration-200 overflow-hidden"
        style={{ width: sidebarCollapsed ? '52px' : '220px', minWidth: sidebarCollapsed ? '52px' : '220px' }}>
        <div className="flex items-center gap-2 px-2 py-3 border-b shrink-0" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
          {!sidebarCollapsed && <Users className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--primary))' }} />}
          {!sidebarCollapsed && <span className="text-sm font-semibold">群聊</span>}
          {sseConnected && !sidebarCollapsed && <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />}
          <button onClick={() => { setSidebarCollapsed(v => { localStorage.setItem('yara-monitor-sidebar', String(!v)); return !v }) }}
            className="shrink-0 rounded-lg p-1.5 flex items-center justify-center transition-colors hover:bg-accent/20"
            style={{ marginLeft: sidebarCollapsed ? 'auto' : 'auto', marginRight: sidebarCollapsed ? 'auto' : '0' }}
            title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}>
            {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" style={{ color: 'hsl(var(--text-muted))' }} /> : <ChevronDown className="h-3.5 w-3.5" style={{ color: 'hsl(var(--text-muted))' }} />}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-1.5 space-y-0.5">
          {groupList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Users className="h-6 w-6 opacity-20" style={{ color: 'hsl(var(--text-muted))' }} />
              {!sidebarCollapsed && <p className="text-xs text-center" style={{ color: 'hsl(var(--text-muted))' }}>暂无会话</p>}
            </div>
          ) : (
            groupList.map(group => {
              const isSelected = selectedGroup === group.id
              return (
                <button key={group.id}
                  onClick={() => setSelectedGroup(isSelected ? null : group.id)}
                  title={group.name}
                  className="w-full rounded-lg text-left text-xs transition-colors hover:bg-accent/20"
                  style={{
                    background: isSelected ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                    border: isSelected ? '1px solid hsl(var(--primary) / 0.25)' : '1px solid transparent',
                    padding: sidebarCollapsed ? '6px' : '6px 8px',
                  }}>
                  <div className="flex items-center gap-2" style={{ justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold"
                        style={{ background: group.isActive ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--text-muted) / 0.08)', color: group.isActive ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))' }}>
                        {group.id === 'private'
                          ? <User className="h-3.5 w-3.5" />
                          : <span>{group.name.slice(0, 1)}</span>}
                        {group.isActive && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />}
                      </span>
                      {!sidebarCollapsed && (
                        <div className="min-w-0">
                          <div className="truncate font-medium text-xs" style={{ color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--text-primary))' }}>
                            {group.name}
                          </div>
                          <div className="truncate text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>
                            {truncate(group.lastContent, 16)}
                          </div>
                        </div>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="badge text-[10px] shrink-0" style={{ background: 'hsl(var(--primary) / 0.08)', color: 'hsl(var(--primary))' }}>{group.msgCount}</span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="border-t px-2 py-2 shrink-0" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>
              <span>{stats.groups} 个群</span>
              <div className="flex gap-1">
                <span style={{ color: 'hsl(var(--primary))' }}>预览 {stats.previews}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>{stats.groups}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5" style={{ color: 'hsl(var(--text-muted))' }}><MessageSquare className="h-3.5 w-3.5" />{stats.messages}</span>
            <span className="flex items-center gap-1.5" style={{ color: 'hsl(var(--primary))' }}><ArrowLeft className="h-3.5 w-3.5" />{stats.inCount}</span>
            <span className="flex items-center gap-1.5" style={{ color: 'hsl(var(--accent))' }}><ArrowRight className="h-3.5 w-3.5" />{stats.outCount}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'hsl(var(--text-muted))' }} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索消息..." className="input text-xs pl-7 pr-6 w-48" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3 w-3" style={{ color: 'hsl(var(--text-muted))' }} /></button>}
            </div>
            <button onClick={() => loadMessages()} className="btn btn-outline text-xs flex items-center gap-1"><RefreshCw className="h-3.5 w-3.5" />刷新</button>
          </div>
        </div>

        {selectedGroup && selectedStage && selectedStage.stage !== 'removed' && (
          <div className="mb-3 rounded-xl px-4 py-2.5 flex items-center gap-2 flex-wrap" style={{ background: 'hsl(var(--primary) / 0.06)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
            <span className="badge badge-primary text-[10px] flex items-center gap-1">
              {selectedStage.stage === 'planner' ? <><Brain className="h-3 w-3" />规划器</> : <><Bot className="h-3 w-3" />回复器</>}
            </span>
            {selectedStage.agent_state && <span className="badge text-[10px]">{selectedStage.agent_state}</span>}
            {selectedStage.detail && <span className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>{selectedStage.detail}</span>}
            <span className="ml-auto text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>{formatRelativeTime(selectedStage.timestamp)}</span>
          </div>
        )}

        <div className="flex-1 rounded-2xl card card-glow overflow-auto" ref={timelineRef}>
          {msgsLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color: 'hsl(var(--primary))' }} /><span className="ml-2" style={{ color: 'hsl(var(--text-muted))' }}>加载中...</span></div>
          ) : searchedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Clock className="h-10 w-10 opacity-30" />
              <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>暂无聊天记录</p>
              <p className="text-xs opacity-60" style={{ color: 'hsl(var(--text-muted))' }}>当机器人处理新消息时，记录会实时展示在这里</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {searchedMessages.map((msg, idx) => {
                const isDetailOpen = detailMessage?.id === msg.id
                const relatedPreviews = isDetailOpen ? getRelatedPreviews(msg) : []
                const hasExact = hasExactPreview(msg)

                return (
                  <div key={msg.id || `msg-${idx}`}>
                    <div className="flex items-start gap-3 rounded-xl px-4 py-2.5 cursor-pointer transition-colors hover:brightness-110"
                      onClick={() => setDetailMessage(isDetailOpen ? null : msg)}
                      style={{ background: msg.direction === 'in' ? 'hsl(var(--primary) / 0.03)' : 'hsl(var(--accent) / 0.03)', border: `1px solid ${isDetailOpen ? (msg.direction === 'in' ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--accent) / 0.2)') : (msg.direction === 'in' ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--accent) / 0.08)')}` }}>
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                        style={{ background: msg.direction === 'in' ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--accent) / 0.12)', color: msg.direction === 'in' ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }}>
                        {msg.direction === 'in' ? <MessageSquare className="h-3 w-3" /> : <Send className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-xs font-medium">{msg.sender || msg.sender_id}</span>
                          {msg.is_at_me && <span className="badge badge-pink text-[10px]"><AtSign className="h-2.5 w-2.5 inline mr-0.5" />@我</span>}
                          {msg.has_image && <span className="badge badge-blue text-[10px]"><Image className="h-2.5 w-2.5 inline mr-0.5" />图片</span>}
                          {hasExact && <span className="badge text-[10px]" style={{ background: 'hsl(var(--primary) / 0.08)', color: 'hsl(var(--primary))' }}><Eye className="h-2.5 w-2.5 inline mr-0.5" />详情</span>}
                          <span className="text-[10px] ml-auto" style={{ color: 'hsl(var(--text-muted))' }}>{formatTimestamp(msg.timestamp)}</span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    </div>

                    {isDetailOpen && (
                      <div className="ml-9 mt-1 mb-2 rounded-xl overflow-hidden"
                        style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border) / 0.3)' }}>
                        <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: 'hsl(var(--border) / 0.2)' }}>
                          <Activity className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
                          <span className="text-xs font-semibold">处理过程</span>
                          {relatedPreviews.length === 0 && <span className="text-[10px] ml-2" style={{ color: 'hsl(var(--text-muted))' }}>暂无处理记录</span>}
                          <button onClick={() => setDetailMessage(null)} className="ml-auto"><XCircle className="h-3.5 w-3.5 hover:text-primary" style={{ color: 'hsl(var(--text-muted))' }} /></button>
                        </div>

                        {relatedPreviews.length > 0 && (
                          <div className="p-3 space-y-1.5">
                            {relatedPreviews.map((p, pi) => {
                              const isPlanner = p.category === 'planner'
                              const detailKey = `detail-${msg.id}-${pi}`
                              const isExpanded = expandedDetails.has(detailKey)

                              return (
                                <div key={pi} className="rounded-lg overflow-hidden"
                                  style={{ borderLeft: `3px solid ${isPlanner ? 'hsl(var(--primary))' : 'hsl(var(--accent))'}`, background: isPlanner ? 'hsl(var(--primary) / 0.04)' : 'hsl(var(--accent) / 0.04)' }}>
                                  <div className="flex items-center gap-2 px-3 py-1.5 cursor-pointer"
                                    onClick={() => toggleDetail(detailKey)}>
                                    {isPlanner
                                      ? <Brain className="h-3.5 w-3.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                                      : <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: 'hsl(var(--accent))' }} />}
                                    <span className="text-[11px] font-semibold" style={{ color: isPlanner ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }}>
                                      {isPlanner ? '规划器' : '回复器'}
                                    </span>
                                    <span className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>{p.time}</span>
                                    <span className="ml-auto flex items-center gap-1">
                                      <button onClick={e => { e.stopPropagation(); viewPreview(p.preview_html_uri || p.uri, 'html') }} className="btn btn-outline text-[10px] px-2 py-0.5"><Eye className="h-3 w-3" />Prompt</button>
                                      <button onClick={e => { e.stopPropagation(); viewPreview(p.preview_txt_uri || p.uri.replace('.html', '.txt'), 'txt') }} className="btn btn-outline text-[10px] px-2 py-0.5"><FileText className="h-3 w-3" /></button>
                                      {p.preview_json_uri && (
                                        <button onClick={e => { e.stopPropagation(); viewPreview(p.preview_json_uri!, 'json') }} className="btn btn-outline text-[10px] px-2 py-0.5" title="JSON 结构">{'{ }'}</button>
                                      )}
                                      {isExpanded ? <ChevronDown className="h-3 w-3" style={{ color: 'hsl(var(--text-muted))' }} /> : <ChevronRight className="h-3 w-3" style={{ color: 'hsl(var(--text-muted))' }} />}
                                    </span>
                                  </div>
                                  {p.response_summary && !isExpanded && (
                                    <div className="px-3 pb-1.5 text-[11px] leading-relaxed" style={{ color: 'hsl(var(--text-muted))', maxHeight: '2.5em', overflow: 'hidden' }}>
                                      {truncate(p.response_summary, 120)}
                                    </div>
                                  )}
                                  {isExpanded && p.response_summary && (
                                    <div className="mx-3 mb-2 p-2.5 rounded-lg text-[11px] leading-relaxed whitespace-pre-wrap"
                                      style={{ background: isPlanner ? 'hsl(var(--primary) / 0.06)' : 'hsl(var(--accent) / 0.06)', color: 'hsl(var(--text-secondary))' }}>
                                      {p.response_summary}
                                    </div>
                                  )}
                                  {isPlanner && p.planner_thought && isExpanded && (
                                    <div className="mx-3 mb-2 p-2.5 rounded-lg" style={{ background: 'hsl(var(--primary) / 0.06)' }}>
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <Brain className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
                                        <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--primary))' }}>推理过程</span>
                                      </div>
                                      <div className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: 'hsl(var(--text-secondary))', maxHeight: '200px', overflow: 'auto' }}>
                                        {p.planner_thought}
                                      </div>
                                    </div>
                                  )}
                                  {!isPlanner && p.eval_overall !== undefined && isExpanded && (
                                    <div className="mx-3 mb-2 p-2.5 rounded-lg" style={{ background: 'hsl(var(--accent) / 0.06)' }}>
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--accent))' }}>效果自评</span>
                                        <span className="text-[13px] font-bold" style={{ color: p.eval_overall >= 7 ? '#4ade80' : p.eval_overall >= 5 ? '#facc15' : '#ef4444' }}>
                                          {p.eval_overall.toFixed(1)}/10
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-5 gap-1.5 text-[10px]">
                                        {[
                                          { label: '相关性', val: p.eval_relevance },
                                          { label: '连贯性', val: p.eval_coherence },
                                          { label: '趣味性', val: p.eval_engagement },
                                          { label: '安全性', val: p.eval_safety },
                                          { label: '人设', val: p.eval_persona },
                                        ].map(d => (
                                          <div key={d.label} className="text-center">
                                            <div style={{ color: 'hsl(var(--text-muted))' }} className="mb-0.5">{d.label}</div>
                                            <div className="font-semibold" style={{ color: (d.val ?? 0) >= 7 ? '#4ade80' : (d.val ?? 0) >= 5 ? '#facc15' : '#ef4444' }}>
                                              {d.val ?? '-'}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      {p.eval_comment && (
                                        <div className="mt-1.5 text-[10px] italic" style={{ color: 'hsl(var(--text-muted))' }}>"{p.eval_comment}"</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setShowPreview(false); setPreviewError('') }}>
          <div className="rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[85vh] flex flex-col"
            style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
                <h3 className="text-sm font-semibold">Prompt 预览</h3>
                <span className="badge text-[10px]">{previewType.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                {previewContent && (
                  <button onClick={() => navigator.clipboard.writeText(previewContent)} className="text-xs px-3 py-1 rounded-lg" style={{ background: 'hsl(var(--surface-hover))', color: 'hsl(var(--text-secondary))' }}>
                    复制全部
                  </button>
                )}
                <button onClick={() => { setShowPreview(false); setPreviewError('') }} className="text-xs px-3 py-1 rounded-lg" style={{ background: 'hsl(var(--surface-hover))', color: 'hsl(var(--text-secondary))' }}>关闭</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-5">
              {previewLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color: 'hsl(var(--primary))' }} /></div>
              ) : previewError ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <XCircle className="h-10 w-10" style={{ color: 'hsl(var(--error))' }} />
                  <p className="text-sm" style={{ color: 'hsl(var(--error))' }}>{previewError}</p>
                </div>
              ) : previewContent ? (
                previewType === 'html' ? (
                  <iframe srcDoc={previewContent} className="w-full rounded-lg" style={{ border: '1px solid hsl(var(--border))', background: '#0f172a', height: '60vh', minHeight: '200px' }} sandbox="allow-same-origin allow-scripts" />
                ) : (
                  <pre className="text-xs whitespace-pre-wrap font-mono p-4 rounded-lg" style={{ background: '#0f172a', color: '#e2e8f0', maxHeight: '60vh', overflow: 'auto' }}>{previewContent}</pre>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
