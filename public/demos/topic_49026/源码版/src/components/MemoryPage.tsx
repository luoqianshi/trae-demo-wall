import { useState, useMemo, useEffect } from 'react'
import { Search, X, Brain, Tag, Clock, CheckCircle2, Circle, ChevronLeft } from 'lucide-react'
import { useDataStore } from '../stores/useDataStore'
import { getUserProfileObject } from '../lib/prompts'
import { SkeletonList } from './Skeleton'
import type { Memory } from '../types'

// 将记忆内容中的用户本人姓名替换为第二人称"你"
function replaceUserNameWithYou(content: string): string {
  const profile = getUserProfileObject()
  const userName = profile.name?.trim()
  if (!userName || userName.length < 2) return content
  // 替换全名（如"陈志远"→"你"）
  let result = content.replace(new RegExp(userName, 'g'), '你')
  // 如果全名 ≥ 3 字，也尝试替换名（如"志远"→"你"），避免误替换单字
  if (userName.length >= 3) {
    const givenName = userName.slice(1) // 去掉姓
    if (givenName.length >= 2) {
      result = result.replace(new RegExp(givenName, 'g'), '你')
    }
  }
  return result
}

interface MemoryPageProps {
  onClose?: () => void
}

const TYPE_LABELS: Record<Memory['type'], string> = {
  preference: '偏好',
  commitment: '承诺',
  event: '事件',
  insight: '洞察',
  emotion: '情绪',
  habit: '习惯',
  goal: '目标',
  fear: '担忧',
  value: '价值观',
  health: '健康',
}

const TYPE_STYLES: Record<Memory['type'], string> = {
  preference: 'bg-zen-indigo/15 text-zen-indigo',
  commitment: 'bg-zen-terracotta/15 text-zen-terracotta',
  event: 'bg-zen-amber/15 text-zen-amber',
  insight: 'bg-zen-sage/15 text-zen-sage',
  emotion: 'bg-zen-rose/15 text-zen-rose',
  habit: 'bg-zen-indigo/15 text-zen-indigo',
  goal: 'bg-zen-sage/15 text-zen-sage',
  fear: 'bg-zen-rose/15 text-zen-rose',
  value: 'bg-zen-amber/15 text-zen-amber',
  health: 'bg-zen-rose/15 text-zen-rose',
}

const CONFIDENCE_LABELS: Record<Memory['confidence'], string> = {
  high: '高',
  medium: '中',
  low: '低',
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - ts
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffHour < 24) return `${diffHour} 小时前`
  if (diffDay < 7) return `${diffDay} 天前`
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' })
}

export function MemoryPage({ onClose }: MemoryPageProps) {
  const memories = useDataStore((s) => s.memories)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeType, setActiveType] = useState<Memory['type'] | 'all'>('all')
  const [showUnconfirmedOnly, setShowUnconfirmedOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 首次加载骨架屏：数据到达后关闭
  useEffect(() => {
    if (memories.length > 0) setIsLoading(false)
    else {
      const timer = setTimeout(() => setIsLoading(false), 800)
      return () => clearTimeout(timer)
    }
  }, [memories.length])

  // 可用的类型（基于实际数据）
  const availableTypes = useMemo(() => {
    const types = new Set<Memory['type']>()
    memories.forEach((m) => types.add(m.type))
    return Array.from(types).sort((a, b) => (TYPE_LABELS[a] || a).localeCompare(TYPE_LABELS[b] || b, 'zh-CN'))
  }, [memories])

  // 过滤后的记忆
  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      // 类型筛选
      if (activeType !== 'all' && m.type !== activeType) return false
      // 确认状态筛选
      if (showUnconfirmedOnly && m.confirmed) return false
      // 搜索筛选
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const inContent = m.content.toLowerCase().includes(q)
        const inTags = m.tags.some((t) => t.toLowerCase().includes(q))
        if (!inContent && !inTags) return false
      }
      return true
    })
  }, [memories, activeType, showUnconfirmedOnly, searchQuery])

  const confirmedCount = memories.filter((m) => m.confirmed).length
  const unconfirmedCount = memories.length - confirmedCount

  // 按日期分组
  const groupedMemories = useMemo(() => {
    const groups: { date: string; label: string; items: typeof filteredMemories }[] = []
    let currentDate = ''
    for (const m of filteredMemories) {
      const dateStr = new Date(m.createdAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
      if (dateStr !== currentDate) {
        currentDate = dateStr
        groups.push({ date: dateStr, label: dateStr, items: [m] })
      } else {
        groups[groups.length - 1].items.push(m)
      }
    }
    return groups
  }, [filteredMemories])

  return (
    <div className="flex flex-col h-full bg-canvas page-enter">
      {/* 头部 */}
      <div className="px-6 py-5 border-b border-ink-muted/10 bg-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zen-indigo/10 flex items-center justify-center">
              <Brain className="w-4.5 h-4.5 text-zen-indigo" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold text-ink-primary">记忆库</h2>
              <p className="text-xs text-ink-tertiary">
                共 {memories.length} 条 · 已确认 {confirmedCount} · 待确认 {unconfirmedCount}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-zen-terracotta, #C4704A)' }}
              aria-label="返回"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
              返回
            </button>
          )}
        </div>

        {/* 搜索栏 */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索记忆内容或标签..."
            className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-canvas border border-ink-muted/20 text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-zen-indigo/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-ink-muted hover:text-ink-secondary"
              aria-label="清除搜索"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 类型筛选标签 */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeType === 'all'
                ? 'bg-zen-indigo text-white'
                : 'bg-canvas text-ink-secondary hover:bg-canvas-warm'
            }`}
          >
            全部
            <span className={`ml-1 ${activeType === 'all' ? 'text-white/70' : 'text-ink-muted'}`}>
              {memories.length}
            </span>
          </button>
          {availableTypes.map((type) => {
            const count = memories.filter((m) => m.type === type).length
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  activeType === type
                    ? 'bg-zen-indigo text-white'
                    : 'bg-canvas text-ink-secondary hover:bg-canvas-warm'
                }`}
              >
                {TYPE_LABELS[type]}
                <span className={`ml-1 ${activeType === type ? 'text-white/70' : 'text-ink-muted'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* 待确认筛选开关 */}
        <button
          onClick={() => setShowUnconfirmedOnly((v) => !v)}
          className={`mt-2 inline-flex items-center gap-1.5 text-2xs px-2.5 py-1 rounded-md transition-colors ${
            showUnconfirmedOnly
              ? 'bg-zen-amber/15 text-zen-amber'
              : 'bg-canvas text-ink-tertiary hover:bg-canvas-warm'
          }`}
        >
          {showUnconfirmedOnly ? <Circle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
          {showUnconfirmedOnly ? '仅看待确认' : '显示全部确认状态'}
        </button>
      </div>

      {/* 记忆列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 scroll-fade-bottom">
        {isLoading ? (
          <SkeletonList count={4} />
        ) : filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-tertiary">
            <Brain className="w-10 h-10 text-ink-muted/30 mb-3" />
            <p className="text-sm">
              {searchQuery ? '未找到匹配的记忆' : '暂无记忆'}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              {searchQuery ? '尝试更换关键词或清除筛选' : '通过对话或日记记录来积累记忆'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedMemories.map(group => (
              <div key={group.date}>
                <div className="text-2xs text-ink-muted font-medium px-1 py-2 sticky top-0 bg-canvas/90 backdrop-blur-sm z-10">
                  {group.label}
                </div>
                {group.items.map((memory, i) => (
                  <div key={memory.id} className="list-item-enter" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
                    <MemoryCard memory={memory} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 单条记忆卡片
function MemoryCard({ memory }: { memory: Memory }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const contentText = replaceUserNameWithYou(memory.content)
  const isLong = contentText.length > 60

  return (
    <div className="rounded-xl bg-surface border border-ink-muted/10 p-4 hover:shadow-md hover:border-ink-muted/20 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-2xs px-1.5 py-0.5 rounded-full font-medium ${TYPE_STYLES[memory.type]}`}>
            {TYPE_LABELS[memory.type]}
          </span>
          <span className="text-2xs px-1.5 py-0.5 rounded-full bg-ink-muted/10 text-ink-muted">
            置信度 {CONFIDENCE_LABELS[memory.confidence]}
          </span>
          {memory.confirmed ? (
            <span className="flex items-center gap-0.5 text-2xs text-zen-sage">
              <CheckCircle2 className="w-3 h-3" />
              已确认
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-2xs text-zen-amber">
              <Circle className="w-3 h-3" />
              待确认
            </span>
          )}
        </div>
        <span className="flex items-center gap-0.5 text-2xs text-ink-muted flex-shrink-0">
          <Clock className="w-3 h-3" />
          {formatTimestamp(memory.createdAt)}
        </span>
      </div>

      <span className="text-sm text-ink-secondary leading-relaxed">
        {isExpanded ? contentText : contentText.slice(0, 60) + (isLong ? '...' : '')}
        {isLong && (
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="text-xs text-zen-indigo ml-1 hover:underline"
          >
            {isExpanded ? '收起' : '展开'}
          </button>
        )}
      </span>

      {/* 标签 */}
      {memory.tags.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          <Tag className="w-3 h-3 text-ink-muted" />
          {memory.tags.map((tag, i) => (
            <span
              key={i}
              className="text-2xs px-1.5 py-0.5 rounded bg-canvas text-ink-tertiary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 关联信息 */}
      {(memory.relatedPersonIds.length > 0 || memory.relatedMemoryIds.length > 0) && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-ink-muted/5 text-2xs text-ink-muted">
          {memory.relatedPersonIds.length > 0 && (
            <span>关联人物 {memory.relatedPersonIds.length}</span>
          )}
          {memory.relatedMemoryIds.length > 0 && (
            <span>关联记忆 {memory.relatedMemoryIds.length}</span>
          )}
        </div>
      )}
    </div>
  )
}
