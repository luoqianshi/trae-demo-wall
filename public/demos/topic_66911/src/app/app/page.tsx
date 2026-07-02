'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../lib/auth-context'
import { useToast } from '../../components/ui/Toast'
import {
  getPlans,
  getPapers,
  getKnowledge,
  getChatSessions,
  getOverviewStatistics,
  type Plan,
  type Paper,
  type KnowledgeEntry,
  type ChatSession,
} from '../../lib/api'
import {
  PenTool,
  MessageSquare,
  BookOpen,
  Target,
  Flame,
  FileEdit,
} from 'lucide-react'

/* ===== Writing Stats ===== */

interface WritingStats {
  dailyWords: Record<string, number>
  hourlyDistribution: Record<string, number>
  lastWritingDate: string | null
  streakDays: number
  totalWords: number
}

const WRITING_STATS_KEY = 'caijianji_writing_stats'

function loadWritingStats(): WritingStats {
  if (typeof window === 'undefined') {
    return { dailyWords: {}, hourlyDistribution: {}, lastWritingDate: null, streakDays: 0, totalWords: 0 }
  }
  try {
    const raw = localStorage.getItem(WRITING_STATS_KEY)
    if (!raw) {
      return { dailyWords: {}, hourlyDistribution: {}, lastWritingDate: null, streakDays: 0, totalWords: 0 }
    }
    return JSON.parse(raw) as WritingStats
  } catch {
    return { dailyWords: {}, hourlyDistribution: {}, lastWritingDate: null, streakDays: 0, totalWords: 0 }
  }
}

/* ===== Time periods for hourly chart (7 segments) ===== */

const TIME_PERIODS = [
  { label: '子', hours: [0, 1] },
  { label: '卯', hours: [5, 6, 7] },
  { label: '午', hours: [11, 12, 13] },
  { label: '未', hours: [13, 14, 15] },
  { label: '申', hours: [15, 16, 17] },
  { label: '酉', hours: [17, 18, 19] },
  { label: '亥', hours: [21, 22, 23] },
]

/* ===== Main Page ===== */

export default function DashboardPage() {
  const { user } = useAuth()
  const { success, error } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [papers, setPapers] = useState<Paper[]>([])
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [writingStats, setWritingStats] = useState<WritingStats>(loadWritingStats())

  useEffect(() => {
    loadData()
    const interval = setInterval(() => setWritingStats(loadWritingStats()), 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    try {
      const [plansData, papersData, knowledgeData, chatData, statsData] = await Promise.all([
        getPlans().catch(() => []),
        getPapers().catch(() => []),
        getKnowledge().catch(() => []),
        getChatSessions().catch(() => []),
        getOverviewStatistics().catch(() => null),
      ])
      setPlans(plansData)
      setPapers(papersData)
      setKnowledge(knowledgeData)
      setChatSessions(chatData)
      setStats(statsData)
      setWritingStats(loadWritingStats())
      success('数据已就')
    } catch (err) {
      console.error('Failed to load dashboard:', err)
      error('数据未就')
    } finally {
      setLoading(false)
    }
  }

  /* --- Computed data --- */

  const today = new Date().toISOString().split('T')[0]
  const todayWords = writingStats.dailyWords[today] || 0

  const weeklyWords = (() => {
    let total = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      total += writingStats.dailyWords[d.toISOString().split('T')[0]] || 0
    }
    return total
  })()

  const hourlyChartData = (() => {
    const data = TIME_PERIODS.map((p) => {
      const value = p.hours.reduce((sum, h) => sum + (writingStats.hourlyDistribution[String(h)] || 0), 0)
      return { ...p, value }
    })
    const maxVal = Math.max(...data.map((d) => d.value), 1)
    return data.map((d) => ({ ...d, pct: (d.value / maxVal) * 100 }))
  })()

  const recentDays = (() => {
    const days: { date: string; day: string; words: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      days.push({
        date: dateStr,
        day: d.toLocaleDateString('zh-CN', { weekday: 'short' }),
        words: writingStats.dailyWords[dateStr] || 0,
      })
    }
    return days
  })()

  const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  /* --- Heatmap ink-wash color scale --- */
  const heatmapColor = (words: number, maxWords: number) => {
    if (words === 0) return 'bg-[#F5F0E8]/60'
    const ratio = words / maxWords
    if (ratio < 0.25) return 'bg-[#E8DCC8]'
    if (ratio < 0.5) return 'bg-[#D4B896]'
    if (ratio < 0.75) return 'bg-[#C4A070]'
    return 'bg-[#8B5E3C]'
  }

  const maxDayWords = Math.max(...recentDays.map((d) => d.words), 1)

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* ===== Welcome Area — 书房入口 ===== */}
      <div className="mb-10 animate-float-in" style={{ animationDelay: '0ms' }}>
        <div className="relative">
          {/* Decorative classical quote — faded ink */}
          <p className="font-serif text-ink/[0.12] text-5xl md:text-7xl font-bold absolute -top-4 -left-2 select-none pointer-events-none leading-none tracking-widest">
            学而不思则罔
          </p>
          {/* Main welcome */}
          <div className="relative z-10 pt-6">
            <p className="font-serif text-ink-light text-xs tracking-widest mb-2">{dateStr}</p>
            <h1 className="font-display text-3xl md:text-4xl text-ink tracking-wide leading-tight">
              {user?.displayName || user?.username}
            </h1>
            <p className="font-serif text-ink-muted text-base md:text-lg mt-2 tracking-wider">别来无恙，执笔安好</p>
          </div>
        </div>
      </div>

      {/* ===== Statistics Cards — 四象 ===== */}
      <div className="mb-10">
        <h2 className="font-display text-xl text-ink tracking-wider mb-5 flex items-center gap-3">
          <span className="w-1 h-5 rounded-full bg-ochre/60" />
          文房四象
        </h2>
        {/* First two cards — larger */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {[
            { icon: <FileEdit className="w-5 h-5" />, value: stats?.totalDocuments || papers.length, label: '文档数', char: '筆', color: 'border-l-ochre', textColor: 'text-ochre', delay: 80 },
            { icon: <PenTool className="w-5 h-5" />, value: writingStats.totalWords.toLocaleString(), label: '总字数', char: '紙', color: 'border-l-indigo', textColor: 'text-indigo', delay: 160 },
          ].map((item) => (
            <div
              key={item.label}
              className={`liquid-glass liquid-glass-hover rounded-2xl p-6 animate-card-float cursor-default border-l-[3px] ${item.color} relative overflow-hidden`}
              style={{ animationDelay: `${item.delay}ms` }}
            >
              {/* Classical Chinese watermark */}
              <span className="absolute -right-3 -bottom-3 text-[7rem] font-display font-bold text-ink/[0.04] leading-none select-none pointer-events-none">
                {item.char}
              </span>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className={item.textColor}>{item.icon}</span>
                  <span className="font-serif text-ink-muted text-sm tracking-wider">{item.label}</span>
                </div>
                <div className={`font-display text-4xl ${item.textColor}`}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Last two cards — smaller */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { icon: <Flame className="w-5 h-5" />, value: weeklyWords.toLocaleString(), label: '本周写作', char: '墨', color: 'border-l-cinnabar', textColor: 'text-cinnabar', delay: 240 },
            { icon: <Target className="w-5 h-5" />, value: writingStats.streakDays, label: '连续天数', char: '策', color: 'border-l-[#C4A070]', textColor: 'text-[#C4A070]', delay: 320 },
          ].map((item) => (
            <div
              key={item.label}
              className={`liquid-glass liquid-glass-hover rounded-2xl p-5 animate-card-float cursor-default border-l-[3px] ${item.color} relative overflow-hidden`}
              style={{ animationDelay: `${item.delay}ms` }}
            >
              {/* Classical Chinese watermark */}
              <span className="absolute -right-2 -bottom-2 text-[6rem] font-display font-bold text-ink/[0.04] leading-none select-none pointer-events-none">
                {item.char}
              </span>
              <div className="relative z-10 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.textColor} opacity-80`}>
                  {item.icon}
                </div>
                <div>
                  <div className={`font-display text-2xl ${item.textColor}`}>{item.value}</div>
                  <div className="font-serif text-ink-muted text-sm tracking-wider">{item.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ink-divider my-8" />

      {/* ===== Bar Chart — 近七日笔耕 ===== */}
      <div className="mb-10 animate-float-in" style={{ animationDelay: '400ms' }}>
        <h2 className="font-display text-xl text-ink tracking-wider mb-5 flex items-center gap-3">
          <span className="w-1 h-5 rounded-full bg-cinnabar/60" />
          近七日笔耕
        </h2>
        <div className="liquid-glass rounded-2xl p-6 relative overflow-hidden">
          {/* Ink-wash background texture */}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/[0.02] via-transparent to-ink/[0.03] rounded-2xl pointer-events-none" />
          <div className="relative z-10 flex items-end gap-3 h-36">
            {hourlyChartData.map((item, i) => (
              <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
                {item.value > 0 && <span className="text-[10px] text-ink-muted font-serif">{item.value}</span>}
                <div
                  className="w-full rounded-t-lg animate-bar-grow"
                  style={{
                    height: item.value > 0 ? `${Math.max((item.pct / 100) * 100, 8)}px` : '4px',
                    background: item.value > 0
                      ? 'linear-gradient(to top, #8B5E3C, #C4A882, #B5453A)'
                      : 'rgba(139,94,60,0.08)',
                    opacity: item.value > 0 ? 0.55 + (item.pct / 100) * 0.45 : 0.3,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
                <span className="font-serif text-[10px] text-ink-muted tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ink-divider my-8" />

      {/* ===== Heatmap — 七日热力 ===== */}
      <div className="mb-10 animate-float-in" style={{ animationDelay: '480ms' }}>
        <h2 className="font-display text-xl text-ink tracking-wider mb-5 flex items-center gap-3">
          <span className="w-1 h-5 rounded-full bg-ochre/60" />
          七日热力
        </h2>
        <div className="liquid-glass rounded-2xl p-6">
          <div className="grid grid-cols-7 gap-3">
            {recentDays.map((day) => (
              <div
                key={day.date}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
                  day.date === today
                    ? 'golden-glow ring-1 ring-ochre/40'
                    : ''
                } ${heatmapColor(day.words, maxDayWords)}`}
              >
                <span className="font-serif text-[10px] text-ink-muted">{day.day}</span>
                <span className={`font-display text-sm mt-0.5 ${day.words > 0 ? 'text-ink' : 'text-ink/30'}`}>
                  {day.words > 0 ? day.words : '-'}
                </span>
              </div>
            ))}
          </div>
          {/* Ink-wash scale legend */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="font-serif text-[10px] text-ink-muted">淡</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-[#F5F0E8]/60" />
              <div className="w-3 h-3 rounded-sm bg-[#E8DCC8]" />
              <div className="w-3 h-3 rounded-sm bg-[#D4B896]" />
              <div className="w-3 h-3 rounded-sm bg-[#C4A070]" />
              <div className="w-3 h-3 rounded-sm bg-[#8B5E3C]" />
            </div>
            <span className="font-serif text-[10px] text-ink-muted">浓</span>
          </div>
        </div>
      </div>

      <div className="ink-divider my-8" />

      {/* ===== Quick Actions — 快捷入口 ===== */}
      <div className="animate-float-in" style={{ animationDelay: '560ms' }}>
        <h2 className="font-display text-xl text-ink tracking-wider mb-5 flex items-center gap-3">
          <span className="w-1 h-5 rounded-full bg-indigo/60" />
          快捷入口
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { href: '/app/editor', icon: <PenTool className="w-5 h-5 text-ochre" />, label: '新建文档', subtitle: '落笔成文' },
            { href: '/app/chat', icon: <MessageSquare className="w-5 h-5 text-indigo" />, label: 'AI 对话', subtitle: '以文会友' },
            { href: '/app/papers', icon: <BookOpen className="w-5 h-5 text-cinnabar" />, label: '文献管理', subtitle: '博览群书' },
            { href: '/app/plans', icon: <Target className="w-5 h-5 text-ochre" />, label: '写作计划', subtitle: '谋篇布局' },
          ].map((item, i) => (
            <Link key={item.label} href={item.href}>
              <div
                className="liquid-glass liquid-glass-hover rounded-2xl p-6 flex flex-col items-center gap-3 animate-card-float cursor-pointer group relative overflow-hidden"
                style={{ animationDelay: `${560 + i * 100}ms` }}
              >
                {/* Hover ink splash background */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-ochre/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <span className="font-serif text-sm text-ink tracking-wider">{item.label}</span>
                  <span className="font-serif text-[10px] text-ink-muted tracking-widest">{item.subtitle}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom breathing room */}
      <div className="h-8" />
    </div>
  )
}
