import { useEffect, useState } from 'react'
import {
  Heart, ChevronDown, Plus, BookOpen, Pencil, User,
  Briefcase, Brain, Sparkles, Link2, TrendingUp,
  Shield, Clock, MapPin, Calendar, Star
} from 'lucide-react'
import { useUIStore } from '../stores/useUIStore'
import { useDataStore } from '../stores/useDataStore'
import { PersonEditor } from './PersonEditor'
import { MemoryEditor } from './MemoryEditor'
import { DiaryEditor } from './DiaryEditor'
import { MiniGraph } from './KnowledgeGraph'
import type { Person, Memory, DiaryEntry } from '../types'

function relationshipLabel(r: string): string {
  const map: Record<string, string> = {
    spouse: '配偶', family: '家人', colleague: '同事', friend: '朋友',
    leader: '领导', mentor: '导师', subordinate: '下属', client: '客户',
    rival: '对手', other: '其他',
  }
  return map[r] || r
}

export function Sidebar() {
  const sidebarTab = useUIStore((s) => s.sidebarTab)
  const setSidebarTab = useUIStore((s) => s.setSidebarTab)
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null)
  const [showPersonEditor, setShowPersonEditor] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | undefined>(undefined)
  const [showMemoryEditor, setShowMemoryEditor] = useState(false)
  const [showDiaryEditor, setShowDiaryEditor] = useState(false)

  const persons = useDataStore((s) => s.persons)
  const memories = useDataStore((s) => s.memories)
  const diaries = useDataStore((s) => s.diaries)
  const loadPersons = useDataStore((s) => s.loadPersons)
  const loadMemories = useDataStore((s) => s.loadMemories)
  const loadDiaries = useDataStore((s) => s.loadDiaries)

  useEffect(() => {
    loadPersons()
    loadMemories()
    loadDiaries()
  }, [loadPersons, loadMemories, loadDiaries])

  const handleAddPerson = () => {
    setEditingPerson(undefined)
    setShowPersonEditor(true)
  }

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person)
    setShowPersonEditor(true)
  }

  const handleClosePersonEditor = () => {
    setShowPersonEditor(false)
    setEditingPerson(undefined)
  }

  const getPersonMemories = (personName: string): Memory[] => {
    return memories
      .filter((m) => m.content.includes(personName) && m.confirmed)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
  }

  return (
    <div className="theme-adaptive p-4 space-y-4">
      {showPersonEditor && <PersonEditor person={editingPerson} onClose={handleClosePersonEditor} />}
      {showMemoryEditor && <MemoryEditor onClose={() => setShowMemoryEditor(false)} />}
      {showDiaryEditor && <DiaryEditor onClose={() => setShowDiaryEditor(false)} />}

      {/* 标签切换 */}
      <div className="flex gap-1 bg-canvas rounded-lg p-1">
        <button
          onClick={() => setSidebarTab('people')}
          className={`theme-tab flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
            sidebarTab === 'people'
              ? 'bg-surface text-ink-primary shadow-sm'
              : 'text-ink-tertiary hover:text-ink-secondary'
          }`}
        >
          人物
        </button>
        <button
          onClick={() => setSidebarTab('memory')}
          className={`theme-tab flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
            sidebarTab === 'memory'
              ? 'bg-surface text-ink-primary shadow-sm'
              : 'text-ink-tertiary hover:text-ink-secondary'
          }`}
        >
          记忆
        </button>
        <button
          onClick={() => setSidebarTab('diary')}
          className={`theme-tab flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
            sidebarTab === 'diary'
              ? 'bg-surface text-ink-primary shadow-sm'
              : 'text-ink-tertiary hover:text-ink-secondary'
          }`}
        >
          日记
        </button>
      </div>

      {/* 添加按钮 */}
      {sidebarTab === 'people' && (
        <button
          onClick={handleAddPerson}
          className="theme-add-btn w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-ink-muted/30 text-xs text-ink-tertiary hover:text-ink-secondary hover:border-ink-muted/50 transition-colors"
          aria-label="添加人物"
        >
          <Plus className="w-3.5 h-3.5" />
          添加人物
        </button>
      )}
      {sidebarTab === 'memory' && (
        <button
          onClick={() => setShowMemoryEditor(true)}
          className="theme-add-btn w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-ink-muted/30 text-xs text-ink-tertiary hover:text-ink-secondary hover:border-ink-muted/50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          添加记忆
        </button>
      )}
      {sidebarTab === 'diary' && (
        <button
          onClick={() => setShowDiaryEditor(true)}
          className="theme-add-btn w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-ink-muted/30 text-xs text-ink-tertiary hover:text-ink-secondary hover:border-ink-muted/50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          写日记
        </button>
      )}

      {/* 内容区域 */}
      {sidebarTab === 'people' && (
        <div className="space-y-3">
          {persons.length === 0 && (
            <div className="text-center py-6 space-y-2">
              <div className="w-10 h-10 rounded-full bg-zen-terracotta/10 flex items-center justify-center mx-auto">
                <User className="w-5 h-5 text-zen-terracotta" />
              </div>
              <p className="text-xs text-ink-tertiary">还没有人物档案</p>
              <button
                onClick={handleAddPerson}
                className="text-xs px-3 py-1.5 rounded-full bg-zen-terracotta/10 text-zen-terracotta hover:bg-zen-terracotta/20 transition-colors"
              >
                添加第一个人物
              </button>
            </div>
          )}
          {persons.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              expanded={expandedPerson === person.id}
              onToggle={() =>
                setExpandedPerson(expandedPerson === person.id ? null : person.id)
              }
              onEdit={() => handleEditPerson(person)}
              memories={getPersonMemories(person.name)}
              persons={persons}
              onSelectPerson={(id) => setExpandedPerson(id)}
            />
          ))}
        </div>
      )}

      {sidebarTab === 'memory' && (
        <div className="space-y-3">
          {memories.length === 0 && (
            <div className="text-center py-6 space-y-2">
              <div className="w-10 h-10 rounded-full bg-zen-sage/10 flex items-center justify-center mx-auto">
                <Brain className="w-5 h-5 text-zen-sage" />
              </div>
              <p className="text-xs text-ink-tertiary">还没有记忆</p>
              <button
                onClick={() => setShowMemoryEditor(true)}
                className="text-xs px-3 py-1.5 rounded-full bg-zen-sage/10 text-zen-sage hover:bg-zen-sage/20 transition-colors"
              >
                添加第一条记忆
              </button>
            </div>
          )}
          {memories.slice(0, 15).map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      )}

      {sidebarTab === 'diary' && (
        <div className="space-y-3">
          {diaries.length === 0 && (
            <div className="text-center py-6 space-y-2">
              <div className="w-10 h-10 rounded-full bg-zen-indigo/10 flex items-center justify-center mx-auto">
                <BookOpen className="w-5 h-5 text-zen-indigo" />
              </div>
              <p className="text-xs text-ink-tertiary">还没有日记</p>
              <button
                onClick={() => setShowDiaryEditor(true)}
                className="text-xs px-3 py-1.5 rounded-full bg-zen-indigo/10 text-zen-indigo hover:bg-zen-indigo/20 transition-colors"
              >
                写第一篇日记
              </button>
            </div>
          )}
          {diaries.slice(0, 15).map((entry) => (
            <DiaryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   大五人格雷达图（SVG）
   ============================================================ */
function BigFiveRadar({ personality }: { personality: Person['profile']['personality'] }) {
  const size = 80
  const center = size / 2
  const radius = 28
  const traits = [
    { key: 'openness', label: '开放性', value: personality.openness },
    { key: 'conscientiousness', label: '尽责', value: personality.conscientiousness },
    { key: 'extraversion', label: '外向', value: personality.extraversion },
    { key: 'agreeableness', label: '宜人', value: personality.agreeableness },
    { key: 'neuroticism', label: '神经质', value: personality.neuroticism },
  ]
  const angleStep = (Math.PI * 2) / 5

  const points = traits.map((t, i) => {
    const angle = i * angleStep - Math.PI / 2
    const r = (t.value / 100) * radius
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
  }).join(' ')

  const gridPoints = [0.2, 0.4, 0.6, 0.8, 1].map(scale => {
    return traits.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2
      const r = scale * radius
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
    }).join(' ')
  })

  return (
    <div className="theme-radar flex flex-col items-center">
      <svg width={size} height={size} className="shrink-0">
        {/* 背景网格 */}
        {gridPoints.map((pts, idx) => (
          <polygon
            key={idx}
            points={pts}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-ink-muted/20"
          />
        ))}
        {/* 轴线 */}
        {traits.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-ink-muted/20"
            />
          )
        })}
        {/* 数据区域 */}
        <polygon
          points={points}
          fill="currentColor"
          fillOpacity="0.15"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-zen-terracotta"
        />
      </svg>
      <div className="flex gap-1 mt-1 flex-wrap justify-center">
        {personality.mbti && (
          <span className="text-2xs px-1.5 py-0.5 rounded bg-zen-terracotta/10 text-zen-terracotta font-medium">
            {personality.mbti}
          </span>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   关系温度曲线（迷你折线图）
   ============================================================ */
function SentimentSparkline({ history }: { history: Person['sentimentHistory'] }) {
  if (history.length < 2) return null
  const width = 120
  const height = 28
  const padding = 2

  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp)
  const minT = sorted[0].timestamp
  const maxT = sorted[sorted.length - 1].timestamp
  const rangeT = maxT - minT || 1

  const points = sorted.map((p) => {
    const x = padding + ((p.timestamp - minT) / rangeT) * (width - padding * 2)
    const y = height - padding - ((p.value + 100) / 200) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-zen-terracotta"
      />
      {sorted.map((p, i) => {
        const x = padding + ((p.timestamp - minT) / rangeT) * (width - padding * 2)
        const y = height - padding - ((p.value + 100) / 200) * (height - padding * 2)
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="2"
            fill="currentColor"
            className="text-zen-terracotta"
          />
        )
      })}
    </svg>
  )
}

/* ============================================================
   人物卡片（企业级丰满版）
   ============================================================ */
function PersonCard({
  person,
  expanded,
  onToggle,
  onEdit,
  memories,
  persons,
  onSelectPerson,
}: {
  person: Person
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  memories: Memory[]
  persons: Person[]
  onSelectPerson: (id: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'personality' | 'timeline' | 'relations'>('overview')

  const nameColor =
    person.sentiment >= 70
      ? 'bg-zen-sage/20 text-zen-sage'
      : person.sentiment >= 40
        ? 'bg-zen-amber/10 text-zen-amber'
        : 'bg-zen-rose/10 text-zen-rose'

  const p = person.profile

  return (
    <div className="theme-card group">
      {/* 卡片头部 */}
      <div
        onClick={onToggle}
        className="theme-card-header flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-canvas-warm transition-colors cursor-pointer"
      >
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${nameColor}`}
        >
          {person.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink-primary">{person.name}</span>
            <span className="text-xs text-ink-tertiary">{relationshipLabel(person.relationship)}</span>
            {p.identity.age && (
              <span className="text-2xs text-ink-muted">{p.identity.age}岁</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-1.5 rounded-full bg-ink-muted/10 overflow-hidden max-w-20">
              <div
                className={`h-full rounded-full transition-all ${
                  person.sentiment >= 70
                    ? 'bg-zen-sage'
                    : person.sentiment >= 40
                      ? 'bg-zen-amber'
                      : 'bg-zen-rose'
                }`}
                style={{ width: `${Math.max(0, person.sentiment)}%` }}
              />
            </div>
            <span className="text-xs text-ink-tertiary">{person.sentiment}°</span>
            {person.sentimentHistory.length > 1 && (
              <SentimentSparkline history={person.sentimentHistory} />
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="w-6 h-6 rounded flex items-center justify-center text-ink-muted hover:text-ink-secondary hover:bg-canvas transition-colors opacity-0 group-hover:opacity-100"
          aria-label="编辑人物"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <ChevronDown
          className={`w-3.5 h-3.5 text-ink-tertiary transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* 展开后的丰满档案 */}
      {expanded && (
        <div className="mt-1 space-y-0">
          {/* 子标签切换 */}
          <div className="flex gap-0.5 px-3 mb-2">
            {[
              { key: 'overview' as const, label: '概览', icon: User },
              { key: 'personality' as const, label: '性格', icon: Brain },
              { key: 'timeline' as const, label: '时间线', icon: Clock },
              { key: 'relations' as const, label: '关系网', icon: Link2 },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveTab(tab.key)
                }}
                className={`theme-tab flex items-center gap-1 px-2 py-1 rounded text-2xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-zen-terracotta/10 text-zen-terracotta'
                    : 'text-ink-tertiary hover:text-ink-secondary'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* === 概览页 === */}
          {activeTab === 'overview' && (
            <div className="px-3 pb-3 space-y-3">
              {/* 身份信息 */}
              <div className="theme-card-section bg-canvas/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-ink-secondary">
                  <User className="w-3.5 h-3.5 text-zen-terracotta" />
                  身份信息
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-2xs text-ink-tertiary">
                  {p.identity.nicknames.length > 0 && (
                    <div>昵称：{p.identity.nicknames.join('、')}</div>
                  )}
                  {p.identity.zodiac && <div>星座：{p.identity.zodiac}</div>}
                  {p.identity.hometown && <div>籍贯：{p.identity.hometown}</div>}
                  {p.identity.currentCity && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {p.identity.currentCity}
                    </div>
                  )}
                  {p.identity.birthday && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {p.identity.birthday}
                    </div>
                  )}
                </div>
              </div>

              {/* 职业信息 */}
              {p.career.company && (
                <div className="theme-card-section bg-canvas/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-ink-secondary">
                    <Briefcase className="w-3.5 h-3.5 text-zen-terracotta" />
                    职业信息
                  </div>
                  <div className="text-2xs text-ink-tertiary space-y-1">
                    <div>
                      {p.career.company}
                      {p.career.title && ` · ${p.career.title}`}
                      {p.career.department && `（${p.career.department}）`}
                    </div>
                    {p.career.strengths.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-ink-muted">优势：</span>
                        {p.career.strengths.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-zen-sage/10 text-zen-sage">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.career.careerHistory.length > 0 && (
                      <div className="space-y-0.5 mt-1">
                        {p.career.careerHistory.map((h, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-ink-muted w-16 shrink-0">{h.period}</span>
                            <span>{h.company} · {h.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 偏好与价值观 */}
              <div className="grid grid-cols-2 gap-2">
                {p.preferences.likes.length > 0 && (
                  <div className="theme-card-section bg-canvas/50 rounded-lg p-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-2xs font-medium text-ink-secondary">
                      <Sparkles className="w-3 h-3 text-zen-sage" />
                      喜好
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.preferences.likes.slice(0, 6).map((like, i) => (
                        <span key={i} className="text-2xs px-1.5 py-0.5 rounded-full bg-zen-sage/10 text-zen-sage">
                          {like}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {p.values.coreValues.length > 0 && (
                  <div className="theme-card-section bg-canvas/50 rounded-lg p-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-2xs font-medium text-ink-secondary">
                      <Star className="w-3 h-3 text-zen-amber" />
                      价值观
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.values.coreValues.map((v, i) => (
                        <span key={i} className="text-2xs px-1.5 py-0.5 rounded-full bg-zen-amber/10 text-zen-amber">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 社交角色 */}
              <div className="theme-card-section bg-canvas/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-ink-secondary">
                  <Shield className="w-3.5 h-3.5 text-zen-terracotta" />
                  关系定位
                </div>
                <div className="text-2xs text-ink-tertiary space-y-1">
                  <div><span className="text-ink-muted">TA在我生活中：</span>{p.socialRole.roleInMyLife}</div>
                  <div><span className="text-ink-muted">我在TA生活中：</span>{p.socialRole.myRoleInTheirLife}</div>
                  <div className="flex gap-3 mt-1">
                    <div>信任度 <span className="font-medium text-ink-secondary">{p.socialRole.trustLevel}</span>/100</div>
                    <div>亲密度 <span className="font-medium text-ink-secondary">{p.socialRole.intimacyLevel}</span>/100</div>
                    <div>权力 <span className="font-medium text-ink-secondary">
                      {p.socialRole.powerDynamic === 'equal' ? '平等' :
                        p.socialRole.powerDynamic === 'superior' ? '我主导' :
                        p.socialRole.powerDynamic === 'subordinate' ? 'TA主导' : '复杂'}
                    </span></div>
                  </div>
                </div>
              </div>

              {/* 沟通风格 */}
              {p.preferences.communicationStyle && (
                <div className="theme-card-section bg-canvas/50 rounded-lg p-2.5">
                  <div className="text-2xs text-ink-tertiary leading-relaxed">
                    <span className="text-ink-muted">沟通风格：</span>
                    {p.preferences.communicationStyle}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === 性格页 === */}
          {activeTab === 'personality' && (
            <div className="px-3 pb-3 space-y-3">
              <div className="theme-card-section flex gap-3 bg-canvas/50 rounded-lg p-3">
                <BigFiveRadar personality={p.personality} />
                <div className="flex-1 space-y-1.5">
                  <div className="text-xs font-medium text-ink-secondary">性格画像</div>
                  <p className="text-2xs text-ink-tertiary leading-relaxed">{p.personality.description}</p>
                  <div className="grid grid-cols-2 gap-1 text-2xs">
                    <div className="flex justify-between px-2 py-1 rounded bg-canvas">
                      <span className="text-ink-muted">开放性</span>
                      <span className="font-medium">{p.personality.openness}</span>
                    </div>
                    <div className="flex justify-between px-2 py-1 rounded bg-canvas">
                      <span className="text-ink-muted">尽责性</span>
                      <span className="font-medium">{p.personality.conscientiousness}</span>
                    </div>
                    <div className="flex justify-between px-2 py-1 rounded bg-canvas">
                      <span className="text-ink-muted">外向性</span>
                      <span className="font-medium">{p.personality.extraversion}</span>
                    </div>
                    <div className="flex justify-between px-2 py-1 rounded bg-canvas">
                      <span className="text-ink-muted">宜人性</span>
                      <span className="font-medium">{p.personality.agreeableness}</span>
                    </div>
                    <div className="flex justify-between px-2 py-1 rounded bg-canvas col-span-2">
                      <span className="text-ink-muted">神经质（情绪稳定性）</span>
                      <span className="font-medium">{p.personality.neuroticism}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 动机与恐惧 */}
              <div className="grid grid-cols-2 gap-2">
                {p.values.motivations.length > 0 && (
                  <div className="theme-card-section bg-canvas/50 rounded-lg p-2.5 space-y-1.5">
                    <div className="text-2xs font-medium text-ink-secondary flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-zen-sage" />
                      驱动因素
                    </div>
                    {p.values.motivations.map((m, i) => (
                      <div key={i} className="text-2xs text-ink-tertiary">• {m}</div>
                    ))}
                  </div>
                )}
                {p.values.fears.length > 0 && (
                  <div className="theme-card-section bg-canvas/50 rounded-lg p-2.5 space-y-1.5">
                    <div className="text-2xs font-medium text-ink-secondary flex items-center gap-1">
                      <Heart className="w-3 h-3 text-zen-rose" />
                      担忧/恐惧
                    </div>
                    {p.values.fears.map((f, i) => (
                      <div key={i} className="text-2xs text-ink-tertiary">• {f}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* 目标 */}
              {p.values.goals.length > 0 && (
                <div className="theme-card-section bg-canvas/50 rounded-lg p-2.5 space-y-1.5">
                  <div className="text-2xs font-medium text-ink-secondary">目标与愿望</div>
                  <div className="flex flex-wrap gap-1">
                    {p.values.goals.map((g, i) => (
                      <span key={i} className="text-2xs px-2 py-0.5 rounded-full bg-zen-terracotta/10 text-zen-terracotta">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === 时间线页 === */}
          {activeTab === 'timeline' && (
            <div className="px-3 pb-3">
              {/* 关系温度历史 */}
              {person.sentimentHistory.length > 0 && (
                <div className="theme-card-section mb-3 bg-canvas/50 rounded-lg p-3">
                  <div className="text-xs font-medium text-ink-secondary mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-zen-terracotta" />
                    关系温度变化
                  </div>
                  <div className="space-y-1.5">
                    {person.sentimentHistory.map((pt, i) => (
                      <div key={i} className="theme-timeline-item flex items-center gap-2 text-2xs">
                        <span className="text-ink-muted w-14 shrink-0">{formatTimeAgo(pt.timestamp)}</span>
                        <div className="w-16 h-1.5 rounded-full bg-ink-muted/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pt.value >= 70 ? 'bg-zen-sage' : pt.value >= 40 ? 'bg-zen-amber' : 'bg-zen-rose'
                            }`}
                            style={{ width: `${Math.max(0, pt.value)}%` }}
                          />
                        </div>
                        <span className="font-medium w-6">{pt.value}°</span>
                        <span className="text-ink-tertiary flex-1 truncate">{pt.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 事件时间线 */}
              {person.timeline.length > 0 && (
                <div className="theme-timeline space-y-0 ml-2 pl-3 border-l-2 border-ink-muted/10">
                  {person.timeline.map((event) => (
                    <div key={event.id} className="theme-timeline-item relative pb-3">
                      <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-zen-terracotta/40 ring-2 ring-surface" />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-ink-secondary">{event.title}</span>
                          <span className="text-2xs text-ink-muted">{formatTimeAgo(event.timestamp)}</span>
                        </div>
                        <p className="text-2xs text-ink-tertiary leading-relaxed">{event.description}</p>
                        <div className="flex gap-1">
                          <span className={`text-2xs px-1.5 py-0.5 rounded ${
                            event.sentiment >= 70 ? 'bg-zen-sage/10 text-zen-sage' :
                            event.sentiment >= 40 ? 'bg-zen-amber/10 text-zen-amber' :
                            'bg-zen-rose/10 text-zen-rose'
                          }`}>
                            {event.sentiment >= 70 ? '积极' : event.sentiment >= 40 ? '中性' : '消极'} {event.sentiment}°
                          </span>
                          <span className="text-2xs px-1.5 py-0.5 rounded bg-canvas text-ink-muted">
                            {event.type === 'first_met' ? '初识' :
                             event.type === 'milestone' ? '里程碑' :
                             event.type === 'conflict' ? '冲突' :
                             event.type === 'reconciliation' ? '和解' :
                             event.type === 'shared_experience' ? '共同经历' :
                             event.type === 'commitment' ? '承诺' : '观察'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 相关记忆 */}
              {memories.length > 0 && (
                <div className="mt-3 pt-3 border-t border-ink-muted/10">
                  <div className="text-xs font-medium text-ink-secondary mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-zen-terracotta" />
                    相关记忆
                  </div>
                  <div className="space-y-2">
                    {memories.map((mem) => (
                      <div key={mem.id} className="text-2xs text-ink-tertiary bg-canvas/50 rounded p-2">
                        <p className="leading-relaxed">{mem.content}</p>
                        <span className="text-ink-muted mt-1 block">{formatTimeAgo(mem.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === 关系网页 === */}
          {activeTab === 'relations' && (
            <div className="px-3 pb-3 space-y-3">
              {/* 迷你知识图谱 */}
              <MiniGraph persons={persons} onSelectPerson={(id) => {
                onSelectPerson(id)
              }} />

              {/* 关系图谱 */}
              {person.connections.length > 0 && (
                <div className="theme-card-section bg-canvas/50 rounded-lg p-3 space-y-2">
                  <div className="text-xs font-medium text-ink-secondary flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-zen-terracotta" />
                    关系网络
                  </div>
                  <div className="space-y-2">
                    {person.connections.map((conn, i) => (
                      <div key={i} className="theme-connection flex items-center gap-2 text-2xs">
                        <div className="w-6 h-6 rounded-full bg-canvas flex items-center justify-center text-xs font-medium text-ink-secondary">
                          {conn.targetPersonName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-ink-secondary">{conn.targetPersonName}</span>
                            <span className="text-ink-muted">
                              {conn.relationType === 'family' ? '家人' :
                               conn.relationType === 'colleague' ? '同事' :
                               conn.relationType === 'friend' ? '朋友' :
                               conn.relationType === 'partner' ? '伙伴' :
                               conn.relationType === 'rival' ? '对手' :
                               conn.relationType === 'introduced_by' ? '介绍人' : '其他'}
                            </span>
                          </div>
                          <p className="text-ink-tertiary truncate">{conn.description}</p>
                        </div>
                        <div className="shrink-0">
                          <div className="w-12 h-1.5 rounded-full bg-ink-muted/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-zen-terracotta"
                              style={{ width: `${conn.strength}%` }}
                            />
                          </div>
                          <div className="text-center text-2xs text-ink-muted mt-0.5">{conn.strength}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 共同经历 */}
              {p.sharedExperiences.length > 0 && (
                <div className="theme-card-section bg-canvas/50 rounded-lg p-3 space-y-2">
                  <div className="text-xs font-medium text-ink-secondary">共同经历</div>
                  <div className="space-y-2">
                    {p.sharedExperiences.map((se) => (
                      <div key={se.id} className="text-2xs space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink-secondary">{se.title}</span>
                          <span className="text-ink-muted">{se.date}</span>
                        </div>
                        <p className="text-ink-tertiary">{se.description}</p>
                        <div className="flex gap-1">
                          <span className={`px-1.5 py-0.5 rounded ${
                            se.sentiment >= 70 ? 'bg-zen-sage/10 text-zen-sage' :
                            se.sentiment >= 40 ? 'bg-zen-amber/10 text-zen-amber' :
                            'bg-zen-rose/10 text-zen-rose'
                          }`}>
                            {se.sentiment}°
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-canvas text-ink-muted">
                            {se.category === 'travel' ? '旅行' :
                             se.category === 'work' ? '工作' :
                             se.category === 'family' ? '家庭' :
                             se.category === 'crisis' ? '危机' :
                             se.category === 'celebration' ? '庆祝' : '日常'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 互动统计 */}
              <div className="theme-card-section bg-canvas/50 rounded-lg p-3 space-y-2">
                <div className="text-xs font-medium text-ink-secondary">互动统计</div>
                <div className="grid grid-cols-2 gap-2 text-2xs">
                  <div className="flex justify-between px-2 py-1 rounded bg-canvas">
                    <span className="text-ink-muted">互动次数</span>
                    <span className="font-medium">{person.interactionStats.totalCount}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 rounded bg-canvas">
                    <span className="text-ink-muted">平均温度</span>
                    <span className="font-medium">{person.interactionStats.avgSentiment}°</span>
                  </div>
                </div>
                {person.interactionStats.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-ink-muted text-2xs">常聊话题：</span>
                    {person.interactionStats.topics.map((t, i) => (
                      <span key={i} className="text-2xs px-1.5 py-0.5 rounded-full bg-canvas text-ink-tertiary">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const days = Math.floor(diff / 86400000)
  if (days > 365) return `${Math.floor(days / 365)}年前`
  if (days > 30) return `${Math.floor(days / 30)}个月前`
  if (days > 0) return `${days}天前`
  const hours = Math.floor(diff / 3600000)
  if (hours > 0) return `${hours}小时前`
  return '刚刚'
}

function MemoryCard({ memory }: { memory: Memory }) {
  const daysAgo = Math.floor(
    (Date.now() - memory.createdAt) / (1000 * 60 * 60 * 24)
  )

  const timeLabel =
    daysAgo === 0
      ? '今天'
      : daysAgo === 1
      ? '昨天'
      : daysAgo < 7
      ? `${daysAgo}天前`
      : daysAgo < 30
      ? `${Math.floor(daysAgo / 7)}周前`
      : `${Math.floor(daysAgo / 30)}月前`

  const typeLabels: Record<string, string> = {
    preference: '偏好',
    commitment: '承诺',
    event: '事件',
    insight: '洞察',
    emotion: '情绪',
    habit: '习惯',
    goal: '目标',
    fear: '恐惧',
    value: '价值观',
  }

  return (
    <div className="theme-card bg-surface rounded-xl border border-ink-muted/20 p-3 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs px-1.5 py-0.5 rounded bg-canvas text-ink-tertiary">
          {typeLabels[memory.type] || memory.type}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            memory.confidence === 'high'
              ? 'bg-zen-sage/10 text-zen-sage'
              : 'bg-zen-amber/10 text-zen-amber'
          }`}
        >
          {memory.confirmed ? '已确认' : '待确认'}
        </span>
        {memory.relatedPersonIds.length > 0 && (
          <span className="text-2xs px-1.5 py-0.5 rounded bg-canvas text-ink-muted">
            关联{memory.relatedPersonIds.length}人
          </span>
        )}
        <span className="text-xs text-ink-tertiary ml-auto">{timeLabel}</span>
      </div>
      <p className="text-sm text-ink-secondary leading-relaxed">{memory.content}</p>
      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {memory.tags.map((tag, i) => (
            <span key={i} className="text-2xs px-1.5 py-0.5 rounded-full bg-canvas text-ink-muted">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function DiaryCard({ entry }: { entry: DiaryEntry }) {
  const daysAgo = Math.floor(
    (Date.now() - entry.timestamp) / (1000 * 60 * 60 * 24)
  )

  const timeLabel =
    daysAgo === 0
      ? '今天'
      : daysAgo === 1
      ? '昨天'
      : daysAgo < 7
      ? `${daysAgo}天前`
      : daysAgo < 30
      ? `${Math.floor(daysAgo / 7)}周前`
      : `${Math.floor(daysAgo / 30)}月前`

  return (
    <div className="theme-card bg-surface rounded-xl border border-ink-muted/20 p-3 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="w-3.5 h-3.5 text-ink-tertiary" />
        <span className="text-xs text-ink-tertiary ml-auto">{timeLabel}</span>
      </div>
      <p className="text-sm text-ink-secondary leading-relaxed line-clamp-3">{entry.content}</p>
      {entry.analysis && (
        <div className="flex items-center gap-2 text-2xs">
          <span className={`px-1.5 py-0.5 rounded ${
            entry.analysis.moodScore >= 30 ? 'bg-zen-sage/10 text-zen-sage' :
            entry.analysis.moodScore >= -30 ? 'bg-zen-amber/10 text-zen-amber' :
            'bg-zen-rose/10 text-zen-rose'
          }`}>
            情绪 {entry.analysis.moodScore > 0 ? '+' : ''}{entry.analysis.moodScore}
          </span>
          {entry.analysis.mentionedPeople.length > 0 && (
            <span className="text-ink-muted">
              提及：{entry.analysis.mentionedPeople.join('、')}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {entry.emotions.map((emo, i) => (
          <span key={i} className="text-xs px-1.5 py-0.5 rounded-full bg-zen-rose/10 text-zen-rose">
            {emo}
          </span>
        ))}
        {entry.tags.map((tag, i) => (
          <span key={i} className="text-xs px-1.5 py-0.5 rounded-full bg-canvas text-ink-tertiary">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
