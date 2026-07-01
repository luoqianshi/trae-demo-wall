import { useState, useMemo, useEffect } from 'react'
import { Search, X, Users, Info, Network, Sparkles } from 'lucide-react'
import { useDataStore } from '../stores/useDataStore'
import { useUIStore } from '../stores/useUIStore'
import { getUserProfileObject } from '../lib/prompts'
import { SkeletonList } from './Skeleton'
import type { Person } from '../types'
import { PersonDetailModal } from './PersonDetailModal'
import { RelationGraph } from './RelationGraph'
import { EtiquettePanel } from './EtiquettePanel'
import { warmthLabel, warmthToColor, warmthBgGradient } from '../lib/warmthColor'

// 关系类型中文标签
const RELATIONSHIP_LABELS: Record<Person['relationship'], string> = {
  spouse: '配偶',
  family: '家人',
  colleague: '同事',
  friend: '朋友',
  leader: '领导',
  mentor: '导师',
  subordinate: '下属',
  client: '客户',
  rival: '竞争对手',
  other: '其他',
}

// 关系类型样式（使用自定义 zen 色板）
const RELATIONSHIP_STYLES: Record<Person['relationship'], string> = {
  spouse: 'bg-zen-rose/15 text-zen-rose',
  family: 'bg-zen-terracotta/15 text-zen-terracotta',
  colleague: 'bg-zen-indigo/15 text-zen-indigo',
  friend: 'bg-zen-sage/15 text-zen-sage',
  leader: 'bg-zen-amber/15 text-zen-amber',
  mentor: 'bg-zen-sage/15 text-zen-sage',
  subordinate: 'bg-zen-indigo/15 text-zen-indigo',
  client: 'bg-zen-amber/15 text-zen-amber',
  rival: 'bg-zen-rose/15 text-zen-rose',
  other: 'bg-ink-muted/10 text-ink-muted',
}

// 头像纯色组（基于 zen 色板）
const AVATAR_COLORS = [
  'bg-zen-sage',
  'bg-zen-terracotta',
  'bg-zen-rose',
  'bg-zen-indigo',
  'bg-zen-amber',
  'bg-zen-sage',
  'bg-zen-indigo',
  'bg-zen-terracotta',
]

// 根据人物 id 确定性地选取一个纯色
function getAvatarGradient(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// 取姓名首字作为头像文字
function getInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}

// 核心人物集合
const CORE_PERSONS = new Set(['林晓薇', '陈一诺', '赵海明', '王思亮', '张伟华'])

// sentiment 已是 0~100 范围，直接作为温度值使用
function sentimentToTemperature(sentiment: number): number {
  return Math.max(0, Math.min(100, Math.round(sentiment)))
}

export function RelationsPage() {
  const persons = useDataStore((s) => s.persons)
  const selectedPerson = useUIStore((s) => s.selectedPerson)
  const setSelectedPerson = useUIStore((s) => s.setSelectedPerson)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeRelationship, setActiveRelationship] = useState<Person['relationship'] | 'all'>('all')
  const [showTempInfo, setShowTempInfo] = useState(false)
  const [showGraph, setShowGraph] = useState(false)
  const [showEtiquette, setShowEtiquette] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 首次加载骨架屏
  useEffect(() => {
    if (persons.length > 0) setIsLoading(false)
    else {
      const timer = setTimeout(() => setIsLoading(false), 800)
      return () => clearTimeout(timer)
    }
  }, [persons.length])

  // 获取用户画像（从 localStorage，带默认值），用于过滤用户本人
  const userProfile = useMemo(() => getUserProfileObject(), [])

  // 过滤掉用户本人（避免"我"出现在关系列表中）
  const visiblePersons = useMemo(() => {
    const selfName = userProfile.name?.trim()
    return persons.filter((p) => {
      // 主规则：与用户同名则视为本人，过滤掉
      if (selfName && p.name === selfName) return false
      // 兜底规则：关系为"其他"且零互动的 person 通常是用户本人档案
      if (p.relationship === 'other' && p.interactionStats.totalCount === 0) return false
      return true
    })
  }, [persons, userProfile])

  // 可用的关系类型（基于实际数据）
  const availableRelationships = useMemo(() => {
    const rels = new Set<Person['relationship']>()
    visiblePersons.forEach((p) => rels.add(p.relationship))
    return Array.from(rels).sort((a, b) =>
      (RELATIONSHIP_LABELS[a] || a).localeCompare(RELATIONSHIP_LABELS[b] || b, 'zh-CN')
    )
  }, [visiblePersons])

  // 过滤后的人物列表
  const filteredPersons = useMemo(() => {
    return visiblePersons.filter((p) => {
      // 关系类型筛选
      if (activeRelationship !== 'all' && p.relationship !== activeRelationship) return false
      // 搜索筛选（按姓名）
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        if (!p.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [visiblePersons, activeRelationship, searchQuery])

  const handleSelectPerson = (id: string) => {
    setSelectedPerson(id)
  }

  return (
    <div className="flex flex-col h-full bg-canvas page-enter">
      {/* 头部 */}
      <div className="px-6 py-5 border-b border-ink-muted/10 bg-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zen-sage/10 flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-zen-sage" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-semibold text-ink-primary">关系</h2>
                <button
                  type="button"
                  onClick={() => setShowTempInfo(!showTempInfo)}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-ink-muted hover:text-ink-secondary transition-colors"
                  aria-label="温度说明"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-ink-tertiary">
                共 {visiblePersons.length} 位人物
              </p>
              {showTempInfo && (
                <div className="mt-2 p-3 bg-canvas-warm rounded-lg text-xs text-ink-secondary leading-relaxed">
                  <strong className="text-ink-primary">暖度</strong> 用色彩表达关系亲密度——暖色（陶土橙红）代表亲密温和，冷色（蓝灰）代表疏远冷淡，色彩随关系变化自然渐变。
                </div>
              )}
            </div>
          </div>
          {/* 关系图谱 + 人情世故按钮 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEtiquette(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zen-terracotta/10 border border-zen-terracotta/20 text-xs font-medium text-zen-terracotta hover:bg-zen-terracotta/20 transition-colors"
              aria-label="人情世故"
            >
              <Sparkles className="w-3.5 h-3.5" />
              人情世故
            </button>
            <button
              type="button"
              onClick={() => setShowGraph(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zen-indigo/10 border border-zen-indigo/20 text-xs font-medium text-zen-indigo hover:bg-zen-indigo/20 transition-colors"
              aria-label="关系图谱"
            >
              <Network className="w-3.5 h-3.5" />
              关系图谱
            </button>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索人物名称..."
            className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-canvas border border-ink-muted/20 text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-zen-sage/50 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-ink-muted hover:text-ink-secondary"
              aria-label="清除搜索"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 关系类型筛选标签 */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveRelationship('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeRelationship === 'all'
                ? 'bg-zen-sage text-white'
                : 'bg-canvas text-ink-secondary hover:bg-canvas-warm'
            }`}
          >
            全部
            <span className={`ml-1 ${activeRelationship === 'all' ? 'text-white/70' : 'text-ink-muted'}`}>
              {visiblePersons.length}
            </span>
          </button>
          {availableRelationships.map((rel) => {
            const count = visiblePersons.filter((p) => p.relationship === rel).length
            return (
              <button
                key={rel}
                type="button"
                onClick={() => setActiveRelationship(rel)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  activeRelationship === rel
                    ? 'bg-zen-sage text-white'
                    : 'bg-canvas text-ink-secondary hover:bg-canvas-warm'
                }`}
              >
                {RELATIONSHIP_LABELS[rel]}
                <span className={`ml-1 ${activeRelationship === rel ? 'text-white/70' : 'text-ink-muted'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 人物列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-24 scroll-fade-bottom">
        {isLoading ? (
          <SkeletonList count={5} />
        ) : filteredPersons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-tertiary">
            <Users className="w-10 h-10 text-ink-muted opacity-30 mb-3" />
            <p className="text-sm">
              {searchQuery ? '未找到匹配的人物' : '暂无人物'}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              {searchQuery ? '尝试更换关键词或清除筛选' : '通过对话记录来积累人物关系'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPersons.map((person, i) => (
              <div key={person.id} className="list-item-enter" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                <PersonRow
                  person={person}
                  onSelect={() => handleSelectPerson(person.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 关系图谱全屏视图 */}
      {showGraph && (
        <RelationGraph
          onClose={() => setShowGraph(false)}
          onSelectPerson={(id) => {
            setShowGraph(false)
            setSelectedPerson(id)
          }}
        />
      )}

      {/* 人情世故全屏面板 */}
      {showEtiquette && (
        <EtiquettePanel onClose={() => setShowEtiquette(false)} />
      )}

      {/* 人物详情弹窗 */}
      <PersonDetailModal personId={selectedPerson} onClose={() => setSelectedPerson(null)} />
    </div>
  )
}

// 单个人物行
function PersonRow({
  person,
  onSelect,
}: {
  person: Person
  onSelect: () => void
}) {
  const temperature = sentimentToTemperature(person.sentiment)
  const gradient = getAvatarGradient(person.id)
  const isCore = CORE_PERSONS.has(person.name)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 rounded-xl border border-ink-muted/10 p-3.5 hover:shadow-md hover:border-ink-muted/20 transition-all text-left relative overflow-hidden bg-surface`}
    >
      {/* 头像（渐变圆） */}
      <div className="relative flex-shrink-0">
        <div
          className={`rounded-full ${gradient} flex items-center justify-center text-white font-medium text-base ${isCore ? 'w-11 h-11' : 'w-10 h-10'}`}
        >
          {getInitial(person.name)}
        </div>
        {isCore && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-zen-terracotta border-2 border-canvas" />
        )}
      </div>

      {/* 姓名 + 关系/暖度 */}
      <div className="flex-1 min-w-0">
        <div className="mb-0.5">
          <span className="text-sm font-medium text-ink-primary truncate">{person.name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-tertiary">
          <span className={`px-1.5 py-0.5 rounded-full text-2xs font-medium ${RELATIONSHIP_STYLES[person.relationship]}`}>
            {RELATIONSHIP_LABELS[person.relationship]}
          </span>
          <span>·</span>
          <span style={{ color: warmthToColor(temperature) }}>{warmthLabel(temperature)}</span>
        </div>
        {/* 迷你温度条 */}
        <div className="mt-1 h-1 w-16 rounded-full bg-ink-muted/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.max(10, Math.min(100, temperature))}%`,
              backgroundColor: warmthToColor(temperature),
            }}
          />
        </div>
      </div>

      {/* 右侧互动统计 */}
      <div className="flex items-center gap-1 text-xs text-ink-muted flex-shrink-0">
        <Users className="w-3.5 h-3.5" />
        <span>{person.interactionStats.totalCount}</span>
      </div>
    </button>
  )
}
