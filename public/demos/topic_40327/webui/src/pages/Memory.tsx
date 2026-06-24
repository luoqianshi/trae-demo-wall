import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Trash2,
  RefreshCw,
  Loader2,
  Database,
  Brain,
  Layers,
  X
} from 'lucide-react'
import {
  fetchMemoryStats,
  searchMemory,
  ingestMemory,
  deleteMemory,
  fetchMemoryList,
} from '../lib/api'
import type { MemoryHitDetail } from '../types/api'

type SearchMode = 'hybrid' | 'semantic' | 'keyword' | 'graph'
type SourceKind = 'chat' | 'fact' | 'summary' | 'note' | 'all'

export function Memory() {
  const [memories, setMemories] = useState<MemoryHitDetail[]>([])
  const [stats, setStats] = useState<{ memory_fragments: number; vector_entries: number; index_entries: number } | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('hybrid')
  const [sourceKind, setSourceKind] = useState<SourceKind>('all')
  const searchLimit = 20

  const [ingestDialogOpen, setIngestDialogOpen] = useState(false)
  const [ingestContent, setIngestContent] = useState('')
  const [ingestSessionId, setIngestSessionId] = useState('')
  const [ingestGroupId, setIngestGroupId] = useState('')
  const [ingestUserId, setIngestUserId] = useState('')
  const [ingestSourceKind, setIngestSourceKind] = useState('chat')
  const [ingesting, setIngesting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [statsResult, listResult] = await Promise.all([
        fetchMemoryStats(),
        fetchMemoryList(100),
      ])
      setStats(statsResult)
      setMemories(listResult.data || [])
      setTotal(listResult.total || 0)
    } catch (err) {
      setMessage('加载记忆系统数据失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      await loadData()
      return
    }
    try {
      setSearching(true)
      const sourceKinds = sourceKind === 'all' ? [] : [sourceKind]
      const result = await searchMemory({
        query: searchQuery,
        limit: searchLimit,
        search_mode: searchMode,
        source_kinds: sourceKinds,
      })
      setMemories(result.hits || [])
      setTotal(result.total_hits || 0)
      setMessage(`找到 ${result.total_hits} 条相关记忆`)
    } catch (err) {
      setMessage('搜索失败')
    } finally {
      setSearching(false)
    }
  }

  async function handleIngest() {
    if (!ingestContent.trim()) {
      setMessage('内容不能为空')
      return
    }
    try {
      setIngesting(true)
      await ingestMemory({
        content: ingestContent,
        session_id: ingestSessionId || undefined,
        group_id: ingestGroupId || undefined,
        user_id: ingestUserId || undefined,
        source_kind: ingestSourceKind,
      })
      setMessage('记忆片段已添加')
      setIngestDialogOpen(false)
      await loadData()
    } catch (err) {
      setMessage('添加记忆失败')
    } finally {
      setIngesting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除这条记忆片段？')) return
    try {
      await deleteMemory(id)
      setMessage('记忆片段已删除')
      await loadData()
    } catch (err) {
      setMessage('删除失败')
    }
  }

  function getSourceKindLabel(kind: string) {
    const labels: Record<string, string> = {
      'chat': '对话消息',
      'fact': '人物事实',
      'summary': '对话摘要',
      'note': '笔记',
      'user': '用户添加',
      'debug': '调试',
    }
    return labels[kind] || kind
  }

  function getSourceKindColor(kind: string) {
    return kind === 'chat' || kind === 'summary' ? 'badge badge-blue' : 'badge badge-pink'
  }

  return (
    <div className="space-y-6 p-6 aurora-bg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-tracking text-gradient">记忆系统管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理 YaraFlow 的长期记忆系统，支持搜索、添加和删除记忆片段
          </p>
        </div>
        <button
          onClick={loadData}
          className="btn btn-outline"
          aria-label="刷新记忆数据"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          刷新
        </button>
      </div>

      {message && (
        <div className="card border-green-500/20 bg-green-500/8 p-4 text-sm text-green-700 flex items-center justify-between" role="alert">
          <span className="font-medium">{message}</span>
          <button onClick={() => setMessage('')} aria-label="关闭提示" className="p-1 rounded-lg hover:bg-green-500/10 transition-colors">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
        <div className="card card-glow-blue card-hover rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">记忆片段</p>
              <p className="text-2xl font-bold font-tabular text-primary">
                {loading ? '…' : stats?.memory_fragments || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card card-glow-pink card-hover rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Brain className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">向量索引</p>
              <p className="text-2xl font-bold font-tabular text-accent">
                {loading ? '…' : stats?.vector_entries || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card card-glow-blue card-hover rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">倒排索引</p>
              <p className="text-2xl font-bold font-tabular text-primary">
                {loading ? '…' : stats?.index_entries || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card rounded-xl border border-primary/10 bg-gradient-to-r from-primary/3 to-accent/3 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} aria-hidden="true" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索记忆片段..."
              aria-label="搜索记忆片段"
              className="input w-full pl-10 pr-3"
            />
          </div>

          <select
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value as SearchMode)}
            aria-label="搜索模式"
            className="input"
          >
            <option value="hybrid">混合搜索</option>
            <option value="semantic">语义搜索</option>
            <option value="keyword">关键词搜索</option>
            <option value="graph">图谱搜索</option>
          </select>

          <select
            value={sourceKind}
            onChange={(e) => setSourceKind(e.target.value as SourceKind)}
            aria-label="来源筛选"
            className="input"
          >
            <option value="all">全部来源</option>
            <option value="chat">对话消息</option>
            <option value="fact">人物事实</option>
            <option value="summary">对话摘要</option>
            <option value="note">笔记</option>
          </select>

          <button
            onClick={handleSearch}
            disabled={searching}
            className="btn btn-primary"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
            {searching ? '搜索中…' : '搜索'}
          </button>

          <button
            onClick={() => setIngestDialogOpen(true)}
            aria-label="添加记忆片段"
            className="btn btn-accent"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            添加记忆
          </button>
        </div>
      </div>

      <div className="card card-hover rounded-xl border border-accent/10 overflow-hidden">
        <div className="flex items-center justify-between border-b border-accent/10 px-5 py-3.5">
          <span className="text-sm font-bold text-accent">共 {total} 条记忆</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-accent" aria-hidden="true" />
            <span className="ml-3 text-accent font-medium">正在加载...</span>
          </div>
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-accent/20 via-primary/20 to-purple-500/20 border border-accent/20 flex items-center justify-center">
              <Brain size={44} className="text-accent/80" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground mb-1">暂无记忆片段</p>
              <p className="text-sm text-muted-foreground">与 YaraFlow 对话，记忆会自动添加</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-accent/10">
            {memories.map((mem) => (
              <div key={mem.fragment_id} className="flex items-start gap-4 px-5 py-4 hover:bg-accent/5 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground">
                    {mem.content}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={getSourceKindColor(mem.source_kind)}>
                      {getSourceKindLabel(mem.source_kind)}
                    </span>
                    {mem.score !== undefined && (
                      <span className="badge-blue">
                        匹配度：{(mem.score * 100).toFixed(1)}%
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground font-medium">
                      访问 {mem.access_count} 次
                    </span>
                    {mem.group_id && (
                      <span className="text-xs text-muted-foreground font-medium">
                        群组：{mem.group_id}
                      </span>
                    )}
                    {mem.user_id && (
                      <span className="text-xs text-muted-foreground font-medium">
                        用户：{mem.user_id}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground font-medium">
                      {mem.created_at}
                    </span>
                    {mem.expires_at && (
                      <span className="badge badge-pink">
                        过期：{mem.expires_at}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleDelete(mem.fragment_id)}
                    className="rounded-xl border border-red-500/20 p-2 text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                    aria-label="删除记忆片段"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ingestDialogOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setIngestDialogOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ 
              background: 'hsl(var(--surface))',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'hsl(var(--primary) / 0.1)' }}
                >
                  <Plus className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--text-primary))' }}>添加记忆片段</h2>
              </div>
              <button 
                onClick={() => setIngestDialogOpen(false)} 
                aria-label="关闭对话框" 
                className="p-2 rounded-lg"
                style={{ color: 'hsl(var(--text-muted))' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="memory-content" className="mb-2 block text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>
                  记忆内容 <span style={{ color: 'hsl(var(--accent))' }}>*</span>
                </label>
                <textarea
                  id="memory-content"
                  value={ingestContent}
                  onChange={(e) => setIngestContent(e.target.value)}
                  placeholder="例如：用户小明喜欢草莓蛋糕，不喜欢香菜"
                  className="input w-full min-h-[120px] resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="memory-source-kind" className="mb-2 block text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>来源类型</label>
                  <select
                    id="memory-source-kind"
                    value={ingestSourceKind}
                    onChange={(e) => setIngestSourceKind(e.target.value)}
                    className="input w-full"
                  >
                    <option value="chat">对话消息</option>
                    <option value="fact">人物事实</option>
                    <option value="summary">对话摘要</option>
                    <option value="note">笔记</option>
                    <option value="user">用户添加</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="memory-group-id" className="mb-2 block text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>群组 ID</label>
                  <input
                    id="memory-group-id"
                    value={ingestGroupId}
                    onChange={(e) => setIngestGroupId(e.target.value)}
                    placeholder="可选"
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="memory-session-id" className="mb-2 block text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>会话 ID</label>
                  <input
                    id="memory-session-id"
                    value={ingestSessionId}
                    onChange={(e) => setIngestSessionId(e.target.value)}
                    placeholder="可选"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label htmlFor="memory-user-id" className="mb-2 block text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>用户 ID</label>
                  <input
                    id="memory-user-id"
                    value={ingestUserId}
                    onChange={(e) => setIngestUserId(e.target.value)}
                    placeholder="可选"
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                onClick={() => setIngestDialogOpen(false)}
                className="btn btn-outline"
              >
                取消
              </button>
              <button
                onClick={handleIngest}
                disabled={ingesting}
                className="btn btn-accent"
              >
                {ingesting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                {ingesting ? '添加中…' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
