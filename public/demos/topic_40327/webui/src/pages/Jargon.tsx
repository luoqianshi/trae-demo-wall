import { useState, useEffect, useCallback } from 'react'
import { BookOpen, TrendingUp, Clock, RefreshCw, Loader2, Search, X, Trash2 } from 'lucide-react'
import { fetchJargonList, fetchJargonStats, deleteJargon } from '../lib/api'
import type { JargonEntry } from '../types/api'

export function Jargon() {
  const [entries, setEntries] = useState<JargonEntry[]>([])
  const [stats, setStats] = useState<{ total: number; recent_7d?: number }>({ total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [listData, statsData] = await Promise.all([fetchJargonList(500), fetchJargonStats()])
      if (listData.success) setEntries(listData.entries || [])
      if (statsData.success) setStats(statsData.stats || { total: 0 })
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: number, word: string) => {
    if (!confirm(`确认删除黑话「${word}」？此操作不可撤销。`)) return
    try {
      const res = await deleteJargon(id)
      if (res.success) {
        setEntries(prev => prev.filter(e => e.id !== id))
        setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }))
      }
    } catch { /* 静默失败 */ }
  }

  const filtered = search
    ? entries.filter(e => e.word.includes(search) || e.meaning.includes(search))
    : entries

  // 按频次降序排列
  const sorted = [...filtered].sort((a, b) => b.frequency - a.frequency)

  return (
    <div className="space-y-4">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">黑话/新词词典</h1>
          <p className="text-sm text-muted-foreground mt-1">
            自动从群聊中学习新词汇，记录释义与使用频次
          </p>
        </div>
        <button onClick={load} className="btn btn-outline text-xs flex items-center gap-1">
          <RefreshCw className="h-3.5 w-3.5" />刷新
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--accent) / 0.1)' }}>
            <BookOpen className="h-5 w-5" style={{ color: 'hsl(var(--accent))' }} />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">已收录词汇</p>
          </div>
        </div>
        <div className="rounded-xl card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
            <TrendingUp className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.recent_7d ?? '-'}</p>
            <p className="text-xs text-muted-foreground">近7日新增</p>
          </div>
        </div>
        <div className="rounded-xl card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--success) / 0.1)' }}>
            <Clock className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} />
          </div>
          <div>
            <p className="text-2xl font-bold">{sorted.filter(e => e.frequency >= 5).length}</p>
            <p className="text-xs text-muted-foreground">高频词汇 (≥5次)</p>
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索词汇或释义..."
          className="input text-sm pl-9 pr-8 w-full"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* 词汇表格 */}
      <div className="rounded-2xl card card-glow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
            <span className="ml-2 text-muted-foreground">加载中...</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <BookOpen className="h-10 w-10 opacity-30" />
            <p className="text-sm">{search ? '没有匹配的词汇' : '暂无学习到的黑话/新词'}</p>
            <p className="text-xs opacity-60">等待 Bot 在群聊中自动发现新词汇...</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">词汇</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">释义</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground w-20">频次</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell w-24">来源</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell w-40">最近更新</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground w-16">操作</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(entry => (
                  <tr
                    key={entry.id}
                    className="border-b transition-colors hover:brightness-105"
                    style={{ borderColor: 'hsl(var(--border) / 0.1)' }}
                  >
                    <td className="py-3 px-4">
                      <span className="font-semibold" style={{ color: 'hsl(var(--accent))' }}>
                        {entry.word}
                      </span>
                      {/* 移动端释义 */}
                      <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">{entry.meaning || '暂无释义'}</p>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">
                      {entry.meaning || '暂无释义'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className="inline-flex items-center gap-1 font-medium"
                        style={{ color: entry.frequency >= 5 ? '#4ade80' : entry.frequency >= 3 ? '#facc15' : 'hsl(var(--text-muted))' }}
                      >
                        <TrendingUp className="h-3.5 w-3.5" />
                        {entry.frequency}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell">
                      {entry.source || '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground text-xs hidden lg:table-cell">
                      {entry.updated_at || entry.created_at || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(entry.id, entry.word)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}