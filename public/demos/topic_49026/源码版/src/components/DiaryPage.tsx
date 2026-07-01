// [HMR-TOUCH] 2026-06-20: 日记页面 — 日记列表/编辑 + 明日日程 + 时光总结
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  BookOpen, Plus, Calendar, Clock, FileText, TrendingUp, TrendingDown,
  Sun, Moon, ChevronRight, ChevronLeft, ChevronDown, X, Sparkles, Activity, AlertCircle,
  Check, Tag,
} from 'lucide-react'
import { BackHeader } from './BackHeader'
import { db } from '../lib/db'
import { useDataStore } from '../stores/useDataStore'
import { generateReminders, type Reminder } from '../lib/reminders'
import { generateDailySummary, generateMonthlySummary, generateYearlySummary } from '../lib/summaryEngine'
import { SummaryPanel } from './SummaryPanel'
import type { DiaryEntry } from '../types'

interface DiaryPageProps {
  onClose?: () => void
}

type Tab = 'diary' | 'tomorrow' | 'summary'

const TAB_CONFIG: { key: Tab; label: string; icon: typeof BookOpen }[] = [
  { key: 'diary', label: '日记', icon: BookOpen },
  { key: 'tomorrow', label: '明日日程', icon: Sun },
  { key: 'summary', label: '时光总结', icon: Sparkles },
]

function getMoodStyle(score: number): { color: string; bg: string; label: string; icon: typeof Sun } {
  if (score >= 40) return { color: 'text-zen-sage', bg: 'bg-zen-sage/10', label: '愉悦', icon: Sun }
  if (score >= 10) return { color: 'text-zen-sage', bg: 'bg-zen-sage/5', label: '平静', icon: Sun }
  if (score >= -10) return { color: 'text-ink-secondary', bg: 'bg-ink-muted/5', label: '平淡', icon: Moon }
  if (score >= -30) return { color: 'text-zen-indigo', bg: 'bg-zen-indigo/10', label: '低落', icon: Moon }
  if (score >= -50) return { color: 'text-zen-indigo', bg: 'bg-zen-indigo/15', label: '焦虑', icon: TrendingDown }
  return { color: 'text-zen-rose', bg: 'bg-zen-rose/10', label: '沉重', icon: TrendingDown }
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${month}月${day}日 周${weekdays[d.getDay()]}`
}

function isTomorrow(timestamp: number): boolean {
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const startOfTomorrow = tomorrow.getTime()
  const endOfTomorrow = startOfTomorrow + 86400000
  return timestamp >= startOfTomorrow && timestamp < endOfTomorrow
}

function isToday(timestamp: number): boolean {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const endOfToday = startOfToday + 86400000
  return timestamp >= startOfToday && timestamp < endOfToday
}

function MoodSparkline({ diaries }: { diaries: DiaryEntry[] }) {
  const recent = diaries.slice(-7).filter(d => d.analysis?.moodScore != null)
  if (recent.length < 2) return null

  const W = 240, H = 36
  const points = recent.map((d, i) => ({
    x: (i / (recent.length - 1)) * W,
    y: H - ((d.analysis!.moodScore! + 50) / 100) * H,
    mood: d.analysis!.moodScore!
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const fillPath = `${linePath} L ${W} ${H} L 0 ${H} Z`

  return (
    <div className="px-3 py-2">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-zen-sage, #7BAF7B)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--color-zen-sage, #7BAF7B)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#moodGrad)" />
        <path d={linePath} fill="none" stroke="var(--color-zen-sage, #7BAF7B)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={p.mood >= 0 ? 'var(--color-zen-sage, #7BAF7B)' : 'var(--color-zen-indigo, #5B6ABF)'} />
        ))}
      </svg>
    </div>
  )
}

export function DiaryPage({ onClose }: DiaryPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('diary')
  const [diaries, setDiaries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [tomorrowReminders, setTomorrowReminders] = useState<Reminder[]>([])
  const [showSummaryPanel, setShowSummaryPanel] = useState(false)
  const [summaryType, setSummaryType] = useState<'daily' | 'monthly' | 'yearly'>('monthly')

  const { addDiary } = useDataStore()

  const loadDiaries = useCallback(async () => {
    try {
      const all = await db.diaries.orderBy('timestamp').reverse().toArray()
      setDiaries(all)
    } catch (err) {
      console.error('Failed to load diaries:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTomorrowReminders = useCallback(async () => {
    try {
      // 添加10秒超时，防止AI服务不可用时阻塞日记页面
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      )
      const all = await Promise.race([generateReminders(), timeoutPromise])
      const tomorrow = all.filter((r) => r.dueDate && isTomorrow(r.dueDate))
      // 也包含没有具体日期但属于待办类型的提醒
      const noDate = all.filter((r) => !r.dueDate && r.type === 'task')
      setTomorrowReminders([...tomorrow, ...noDate.slice(0, 3)])
    } catch (err) {
      console.error('Failed to load tomorrow reminders:', err)
      // AI不可用时静默降级，不影响日记页面正常使用
    }
  }, [])

  useEffect(() => {
    loadDiaries()
    loadTomorrowReminders()
  }, [loadDiaries, loadTomorrowReminders])

  const handleSaveDiary = async (content: string, emotions: string[], tags: string[]) => {
    const entry: DiaryEntry = {
      id: `d-${Date.now()}`,
      timestamp: Date.now(),
      content,
      type: 'text',
      emotions,
      tags,
      isDemo: false,
    }
    await addDiary(entry)
    await loadDiaries()
    setShowEditor(false)
  }

  // 统计数据
  const stats = useMemo(() => {
    if (diaries.length === 0) return null
    const scores = diaries.filter((d) => d.analysis?.moodScore).map((d) => d.analysis!.moodScore)
    const avgMood = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const thisMonth = diaries.filter((d) => {
      const dt = new Date(d.timestamp)
      const now = new Date()
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()
    }).length
    const allEmotions = diaries.flatMap((d) => d.emotions || [])
    const emotionCounts: Record<string, number> = {}
    allEmotions.forEach((e) => { emotionCounts[e] = (emotionCounts[e] || 0) + 1 })
    const topEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    return { total: diaries.length, avgMood, thisMonth, topEmotions }
  }, [diaries])

  const openSummary = (type: 'daily' | 'monthly' | 'yearly') => {
    setSummaryType(type)
    setShowSummaryPanel(true)
  }

  return (
    <div className="flex flex-col h-full bg-canvas page-enter">
      {/* 头部 */}
      <div className="px-6 py-5 border-b border-ink-muted/10 bg-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zen-indigo/10 flex items-center justify-center">
              <BookOpen className="w-4.5 h-4.5 text-zen-indigo" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold text-ink-primary">日记</h2>
              <p className="text-xs text-ink-tertiary">
                {stats ? `共 ${stats.total} 篇 · 本月 ${stats.thisMonth} 篇` : '加载中...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditor(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zen-indigo/10 border border-zen-indigo/20 text-xs font-medium text-zen-indigo hover:bg-zen-indigo/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              写日记
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="inline-flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-zen-terracotta, #C97B5E)' }}
                aria-label="返回"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
                返回
              </button>
            )}
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex gap-2 mt-4">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-zen-indigo text-white'
                    : 'bg-canvas text-ink-secondary hover:bg-canvas-warm'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-24 scroll-fade-bottom">
        {/* === 日记列表 === */}
        {activeTab === 'diary' && (
          <>
            {/* 情绪概览 */}
            {stats && stats.total > 0 && (
              <div className="rounded-xl bg-surface border border-ink-muted/10 p-4 mb-4">
                <h3 className="text-sm font-medium text-ink-primary mb-3 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-zen-indigo" />
                  情绪概览
                </h3>
                <MoodSparkline diaries={diaries} />
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full ${getMoodStyle(stats.avgMood).bg} text-2xl font-serif font-bold ${getMoodStyle(stats.avgMood).color}`}>
                      {stats.avgMood > 0 ? '+' : ''}{stats.avgMood}
                    </div>
                    <div className="text-2xs text-ink-muted mt-0.5">平均情绪</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-serif font-bold text-ink-primary">{stats.total}</div>
                    <div className="text-2xs text-ink-muted mt-0.5">总篇数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-serif font-bold text-zen-indigo">{stats.thisMonth}</div>
                    <div className="text-2xs text-ink-muted mt-0.5">本月</div>
                  </div>
                </div>
                {stats.topEmotions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-ink-muted/10">
                    {stats.topEmotions.map(([emotion, count]) => (
                      <span key={emotion} className="text-2xs px-2 py-0.5 rounded-full bg-zen-rose/10 text-zen-rose font-medium">
                        {emotion} ×{count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 日记列表 */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-ink-tertiary">
                <div className="w-8 h-8 border-2 border-ink-muted/20 border-t-zen-indigo rounded-full animate-spin mb-3" />
                <p className="text-sm">加载日记中...</p>
              </div>
            ) : diaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-ink-tertiary">
                <BookOpen className="w-10 h-10 text-ink-muted/30 mb-3" />
                <p className="text-sm">还没有日记</p>
                <p className="text-xs text-ink-muted mt-1">点击"写日记"记录今天的故事</p>
              </div>
            ) : (
              <div className="space-y-3">
                {diaries.map((diary) => (
                  <DiaryCard key={diary.id} diary={diary} />
                ))}
              </div>
            )}
          </>
        )}

        {/* === 明日日程 === */}
        {activeTab === 'tomorrow' && (
          <TomorrowSchedule reminders={tomorrowReminders} />
        )}

        {/* === 时光总结 === */}
        {activeTab === 'summary' && (
          <SummaryTab onOpen={openSummary} />
        )}
      </div>

      {/* 日记编辑器 */}
      {showEditor && (
        <DiaryEditorModal
          onSave={handleSaveDiary}
          onClose={() => setShowEditor(false)}
        />
      )}

      {/* 时光总结面板 */}
      {showSummaryPanel && (
        <SummaryPanel
          defaultTab={summaryType}
          onClose={() => setShowSummaryPanel(false)}
        />
      )}
    </div>
  )
}

// ============================================================
// 日记卡片
// ============================================================
function DiaryCard({ diary }: { diary: DiaryEntry }) {
  const [expanded, setExpanded] = useState(false)
  const mood = diary.analysis?.moodScore
  const moodStyle = mood !== undefined ? getMoodStyle(mood) : null
  const isLong = diary.content.length > 150

  return (
    <div className="flex gap-2">
      <div
        className="w-1 rounded-full flex-shrink-0 self-stretch"
        style={{
          background: (diary.analysis?.moodScore ?? 0) > 10 ? 'var(--color-zen-sage)' : (diary.analysis?.moodScore ?? 0) < -10 ? 'var(--color-zen-rose)' : 'var(--color-zen-indigo)',
          opacity: 0.7
        }}
      />
      <div className="flex-1 min-w-0">
    <div className="rounded-xl bg-surface border border-ink-muted/10 p-4 hover:shadow-md transition-all">
      {/* 日期 + 情绪 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(diary.timestamp)}
        </div>
        {moodStyle && mood !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${moodStyle.bg} ${moodStyle.color}`}>
            <moodStyle.icon className="w-3 h-3" />
            <span className="text-2xs font-medium">{moodStyle.label} {mood > 0 ? '+' : ''}{mood}</span>
          </div>
        )}
      </div>

      {/* 内容 */}
      <p className={`text-sm text-ink-secondary leading-relaxed ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
        {diary.content}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-xs text-zen-indigo hover:underline mt-1 transition-colors"
        >
          {expanded ? '收起' : '展开全文'}
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* 情绪标签 */}
      {diary.emotions && diary.emotions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {diary.emotions.map((emotion) => (
            <span key={emotion} className="text-2xs px-2 py-0.5 rounded-full bg-zen-rose/10 text-zen-rose font-medium">
              {emotion}
            </span>
          ))}
          {diary.tags?.map((tag) => (
            <span key={tag} className="text-2xs px-2 py-0.5 rounded-full bg-ink-muted/8 text-ink-muted">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* AI 洞察 */}
      {expanded && diary.analysis && (
        <div className="mt-3 pt-3 border-t border-ink-muted/10 space-y-2">
          {diary.analysis.keyTopics && diary.analysis.keyTopics.length > 0 && (
            <div>
              <span className="text-2xs font-medium text-ink-muted">关键话题：</span>
              <span className="text-2xs text-ink-secondary ml-1">{diary.analysis.keyTopics.join(' · ')}</span>
            </div>
          )}
          {diary.analysis.mentionedPeople && diary.analysis.mentionedPeople.length > 0 && (
            <div>
              <span className="text-2xs font-medium text-ink-muted">提及人物：</span>
              <span className="text-2xs text-ink-secondary ml-1">{diary.analysis.mentionedPeople.join(' · ')}</span>
            </div>
          )}
          {diary.analysis.insights && diary.analysis.insights.length > 0 && (
            <div>
              <span className="text-2xs font-medium text-zen-indigo">AI 洞察：</span>
              {diary.analysis.insights.map((insight, i) => (
                <p key={i} className="text-2xs text-ink-secondary mt-0.5">· {insight}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
      </div>
    </div>
  )
}

// ============================================================
// 明日日程
// ============================================================
function TomorrowSchedule({ reminders }: { reminders: Reminder[] }) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = `${tomorrow.getMonth() + 1}月${tomorrow.getDate()}日`
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const tomorrowWeekday = weekdays[tomorrow.getDay()]

  if (reminders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-ink-tertiary">
        <Sun className="w-10 h-10 text-ink-muted/30 mb-3" />
        <p className="text-sm">明天暂无日程</p>
        <p className="text-xs text-ink-muted mt-1">享受轻松的一天</p>
      </div>
    )
  }

  return (
    <div>
      {/* 明日日期头 */}
      <div className="rounded-xl bg-gradient-to-br from-zen-amber/10 to-zen-terracotta/10 border border-zen-amber/20 p-4 mb-4">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-zen-amber" />
          <div>
            <h3 className="text-base font-serif font-semibold text-ink-primary">明日日程</h3>
            <p className="text-xs text-ink-muted">{tomorrowStr} 周{tomorrowWeekday} · {reminders.length} 项待办</p>
          </div>
        </div>
      </div>

      {/* 日程列表 */}
      <div className="space-y-2">
        {reminders.map((reminder, idx) => (
          <div key={`${reminder.id}-${idx}`} className="rounded-xl bg-surface border border-ink-muted/10 p-3.5 hover:shadow-sm transition-all">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zen-amber/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-zen-amber" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-ink-primary">{reminder.title}</span>
                  {reminder.time && (
                    <span className="text-2xs px-1.5 py-0.5 rounded-full bg-zen-rose/15 text-zen-rose font-medium">
                      {reminder.time}
                    </span>
                  )}
                  {reminder.priority === 'high' && (
                    <span className="text-2xs px-1.5 py-0.5 rounded-full bg-zen-rose/15 text-zen-rose">高</span>
                  )}
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">{reminder.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 提示 */}
      <div className="mt-4 rounded-lg bg-zen-indigo/5 border border-zen-indigo/10 p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-zen-indigo flex-shrink-0 mt-0.5" />
        <p className="text-xs text-ink-secondary">
          日程来源于记忆中的承诺和健康目标。在对话中告诉衡舟你的计划，它会自动帮你整理到日程中。
        </p>
      </div>
    </div>
  )
}

// ============================================================
// 时光总结标签
// ============================================================
function SummaryTab({ onOpen }: { onOpen: (type: 'daily' | 'monthly' | 'yearly') => void }) {
  const summaryCards = [
    {
      type: 'daily' as const,
      title: '每日总结',
      desc: '回顾今天的对话和记忆，提炼关键事项和明日待办',
      icon: Sun,
      color: 'zen-amber',
    },
    {
      type: 'monthly' as const,
      title: '月度总结',
      desc: '回顾本月的关键事件、关系变化和情绪趋势',
      icon: Moon,
      color: 'zen-indigo',
    },
    {
      type: 'yearly' as const,
      title: '年度总结',
      desc: '回顾这一年的成长轨迹、重要里程碑和人生感悟',
      icon: Sparkles,
      color: 'zen-sage',
    },
  ]

  return (
    <div>
      <div className="rounded-xl bg-gradient-to-br from-zen-indigo/10 to-zen-sage/10 border border-zen-indigo/20 p-4 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-zen-indigo" />
          <div>
            <h3 className="text-base font-serif font-semibold text-ink-primary">时光总结</h3>
            <p className="text-xs text-ink-muted">日 · 月 · 年 的人生回顾</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.type}
              onClick={() => onOpen(card.type)}
              className="w-full rounded-xl bg-surface border border-ink-muted/10 p-4 hover:shadow-md hover:border-ink-muted/20 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${card.color}/10 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 text-${card.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-ink-primary mb-0.5">{card.title}</h4>
                  <p className="text-xs text-ink-muted leading-relaxed">{card.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-ink-secondary transition-colors flex-shrink-0" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// 日记编辑器弹窗
// ============================================================
function DiaryEditorModal({
  onSave,
  onClose,
}: {
  onSave: (content: string, emotions: string[], tags: string[]) => void
  onClose: () => void
}) {
  const [content, setContent] = useState('')
  const [emotions, setEmotions] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [emotionInput, setEmotionInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  const today = new Date()
  const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const todayWeekday = weekdays[today.getDay()]

  const handleAddEmotion = () => {
    const trimmed = emotionInput.trim()
    if (trimmed && !emotions.includes(trimmed)) {
      setEmotions([...emotions, trimmed])
      setEmotionInput('')
    }
  }

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleSave = () => {
    if (!content.trim()) return
    setSaving(true)
    onSave(content.trim(), emotions, tags)
  }

  const QUICK_EMOTIONS = ['开心', '焦虑', '疲惫', '感恩', '迷茫', '平静', '愤怒', '温暖']
  const QUICK_TAGS = ['工作', '家庭', '健康', '朋友', '反思', '成长']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-primary/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 z-10">
          <BackHeader
            title="写日记"
            subtitle={`${todayStr} 周${todayWeekday}`}
            onBack={onClose}
          />
        </div>

        {/* 表单 */}
        <div className="px-6 py-5 space-y-5">
          {/* 内容 */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary mb-1.5">
              <FileText className="w-3.5 h-3.5" />
              今天想记录什么？
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下今天发生的事、你的感受和想法..."
              rows={6}
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-ink-muted/20 bg-canvas text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-zen-indigo/40 focus:ring-2 focus:ring-zen-indigo/10 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* 情绪标签 */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              情绪标签
            </label>
            {/* 快捷情绪 */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_EMOTIONS.map((emotion) => {
                const isSelected = emotions.includes(emotion)
                return (
                  <button
                    key={emotion}
                    onClick={() => {
                      if (isSelected) {
                        setEmotions(emotions.filter((e) => e !== emotion))
                      } else {
                        setEmotions([...emotions, emotion])
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-zen-rose/15 text-zen-rose border-zen-rose/30'
                        : 'bg-canvas text-ink-tertiary border-ink-muted/15 hover:border-ink-muted/30'
                    }`}
                  >
                    {emotion}
                  </button>
                )
              })}
            </div>
            {/* 自定义情绪输入 */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={emotionInput}
                onChange={(e) => setEmotionInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmotion() } }}
                placeholder="自定义情绪..."
                maxLength={10}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-ink-muted/20 bg-canvas text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-zen-indigo/40 transition-all"
              />
              <button
                onClick={handleAddEmotion}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-canvas border border-ink-muted/15 text-ink-secondary hover:border-ink-muted/30 transition-all"
              >
                添加
              </button>
            </div>
            {/* 已选情绪 */}
            {emotions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {emotions.map((emotion) => (
                  <span key={emotion} className="flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full bg-zen-rose/10 text-zen-rose">
                    {emotion}
                    <button onClick={() => setEmotions(emotions.filter((e) => e !== emotion))}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 话题标签 */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary mb-2">
              <Tag className="w-3.5 h-3.5" />
              话题标签
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_TAGS.map((tag) => {
                const isSelected = tags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      if (isSelected) {
                        setTags(tags.filter((t) => t !== tag))
                      } else {
                        setTags([...tags, tag])
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-zen-indigo/15 text-zen-indigo border-zen-indigo/30'
                        : 'bg-canvas text-ink-tertiary border-ink-muted/15 hover:border-ink-muted/30'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                placeholder="自定义标签..."
                maxLength={10}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-ink-muted/20 bg-canvas text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-zen-indigo/40 transition-all"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-canvas border border-ink-muted/15 text-ink-secondary hover:border-ink-muted/30 transition-all"
              >
                添加
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full bg-zen-indigo/10 text-zen-indigo">
                    {tag}
                    <button onClick={() => setTags(tags.filter((t) => t !== tag))}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="sticky bottom-0 bg-surface flex gap-2 px-6 py-4 border-t border-ink-muted/10 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-canvas text-ink-secondary hover:bg-canvas-warm transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-zen-indigo text-white hover:bg-zen-indigo/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                保存日记
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

