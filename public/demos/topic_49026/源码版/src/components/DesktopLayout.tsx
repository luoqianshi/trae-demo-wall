import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare,
  Brain,
  Users,
  Bell,
  Settings,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  BookOpen,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { useUIStore, type ActiveNav } from '../stores/useUIStore'
import { useDataStore } from '../stores/useDataStore'
import { useConversationStore } from '../stores/useConversationStore'
import { MainStage } from './MainStage'
import { MemoryPage } from './MemoryPage'
import { RelationsPage } from './RelationsPage'
import { RemindersPage } from './RemindersPage'
import { SettingsPage } from './SettingsPage'
import { DiaryPage } from './DiaryPage'
import { MemoryConstellation } from './MemoryConstellation'
import { ErrorBoundary } from './ErrorBoundary'
import { LayoutToggle } from './LayoutToggle'
import { extractPersonsFromMessage, getPersonRelationLabel, type ExtractedPerson } from '../lib/personNER'
import type { Person, Memory } from '../types'

// ============================================================
// Layout Mode 管理 — 存储于 localStorage
// ============================================================

export type LayoutMode = 'mobile' | 'desktop' | 'auto'
export type ResolvedLayout = 'mobile' | 'desktop'

const LAYOUT_MODE_KEY = 'hengzhou-layout-mode'
const LAYOUT_MODE_EVENT = 'hengzhou:layout-mode-change'

export function getLayoutMode(): LayoutMode {
  if (typeof window === 'undefined') return 'auto'
  const stored = localStorage.getItem(LAYOUT_MODE_KEY)
  if (stored === 'mobile' || stored === 'desktop' || stored === 'auto') return stored
  return 'auto'
}

export function setLayoutMode(mode: LayoutMode): void {
  localStorage.setItem(LAYOUT_MODE_KEY, mode)
  window.dispatchEvent(new CustomEvent(LAYOUT_MODE_EVENT))
}

export function resolveLayoutMode(mode: LayoutMode): ResolvedLayout {
  if (mode === 'auto') {
    return window.innerWidth > 1024 ? 'desktop' : 'mobile'
  }
  return mode
}

// ============================================================
// 常量定义
// ============================================================

const NAV_ITEMS: { nav: ActiveNav; icon: LucideIcon; label: string }[] = [
  { nav: '对话', icon: MessageSquare, label: '对话' },
  { nav: '记忆', icon: Brain, label: '记忆' },
  { nav: '关系', icon: Users, label: '关系' },
  { nav: '提醒', icon: Bell, label: '提醒' },
  { nav: '日记', icon: BookOpen, label: '日记' },
  { nav: '设置', icon: Settings, label: '设置' },
]

const RELATIONSHIP_LABELS: Record<Person['relationship'], string> = {
  spouse: '伴侣',
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

const MEMORY_TYPE_LABELS: Record<Memory['type'], string> = {
  preference: '偏好',
  commitment: '承诺',
  event: '事件',
  insight: '洞察',
  emotion: '情绪',
  habit: '习惯',
  goal: '目标',
  fear: '担忧',
  value: '价值观',
}

// ============================================================
// 工具函数
// ============================================================

function getRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return '刚刚'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// ============================================================
// 侧边信息栏 — 上下文面板
// ============================================================

interface ContextSidebarProps {
  collapsed: boolean
  onCollapse: () => void
}

function ContextSidebar({ collapsed, onCollapse }: ContextSidebarProps) {
  const lastRetrievalInfo = useUIStore((s) => s.lastRetrievalInfo)
  const setActiveNav = useUIStore((s) => s.setActiveNav)
  const persons = useDataStore((s) => s.persons)
  const memories = useDataStore((s) => s.memories)
  const messages = useConversationStore((s) => s.messages)

  // 追踪对话前记忆数，用于计算"本次对话新增"
  const memCountBeforeChat = useRef<number | null>(null)
  const [newMemCount, setNewMemCount] = useState(0)
  const [showGuide, setShowGuide] = useState(false)

  // 当消息从0变为≥2（首轮对话完成）时，锁定基准并启动引导
  const hasConversation = messages.length >= 2

  // 对话切换时重置引导状态
  useEffect(() => {
    if (messages.length === 0) {
      memCountBeforeChat.current = null
      setNewMemCount(0)
      setShowGuide(false)
    }
  }, [messages.length])

  // 首轮对话完成时：锁定基准 + 延迟显示引导
  useEffect(() => {
    if (!hasConversation) return
    // 首次进入对话时锁定基准
    if (memCountBeforeChat.current === null) {
      memCountBeforeChat.current = memories.length
    }
    // 计算新增记忆数
    if (memCountBeforeChat.current !== null && memories.length > memCountBeforeChat.current) {
      setNewMemCount(memories.length - memCountBeforeChat.current)
    }
    // 延迟显示引导，让评委先看完AI回复
    if (!showGuide) {
      const timer = setTimeout(() => setShowGuide(true), 600)
      return () => clearTimeout(timer)
    }
  }, [hasConversation, showGuide, memories.length])

  // 从 lastRetrievalInfo 中查找相关人物的完整信息（过滤掉 SELF 人物）
  const relatedPeople: Person[] = (lastRetrievalInfo?.people || [])
    .map((p) => persons.find((person) => person.id === p.id))
    .filter((p): p is Person => p !== undefined && p.id !== 'p-self')

  // NER 实时提取：从最近的用户消息中提取人物
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
  const nerPersons: ExtractedPerson[] = lastUserMessage
    ? extractPersonsFromMessage(lastUserMessage.content)
    : []

  // 过滤掉已在数据库中匹配到的人物（按名称去重）
  const existingNames = new Set(relatedPeople.map((p) => p.name))
  const newPersonsFromNER = nerPersons.filter(
    (np) => !existingNames.has(np.displayName) && !existingNames.has(np.raw)
  )

  // 近期记忆（取前 5 条）
  const recentMemories = memories.slice(0, 5)

  if (collapsed) return null

  return (
    <div className="p-5 space-y-5" data-guide="context-sidebar">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-sm font-semibold text-ink-primary">上下文</h3>
        <button
          onClick={onCollapse}
          className="p-1.5 rounded-lg text-ink-tertiary hover:text-ink-primary hover:bg-ink-muted/10 transition-colors"
          aria-label="折叠侧边栏"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* 本次对话引导 — 首轮回复后置顶显示，引导评委探索 */}
      {showGuide && (
        <div className="rounded-2xl bg-gradient-to-br from-zen-sage/8 to-zen-indigo/8 border border-zen-sage/20 p-3 shadow-sm" style={{ animation: 'guide-fade-in 0.4s ease-out both' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-zen-sage" />
            <span className="text-xs font-medium text-ink-primary">本次对话</span>
          </div>
          <div className="space-y-1 mb-2.5">
            {newMemCount > 0 && (
              <p className="text-[11px] text-ink-secondary">
                衡舟新增了 <span className="text-zen-sage font-semibold">{newMemCount}</span> 条记忆
              </p>
            )}
            {newPersonsFromNER.length > 0 && (
              <p className="text-[11px] text-ink-secondary">
                识别了 <span className="text-zen-indigo font-semibold">{newPersonsFromNER.length}</span> 个新人物
              </p>
            )}
            {newMemCount === 0 && newPersonsFromNER.length === 0 && (
              <p className="text-[11px] text-ink-secondary">衡舟正在分析对话内容…</p>
            )}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveNav('记忆')}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-surface/80 text-ink-secondary text-[10px] font-medium hover:bg-surface hover:text-ink-primary transition-colors border border-ink-muted/10"
            >
              <Brain className="w-3 h-3" />
              查看记忆
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => setActiveNav('关系')}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-surface/80 text-ink-secondary text-[10px] font-medium hover:bg-surface hover:text-ink-primary transition-colors border border-ink-muted/10"
            >
              <Users className="w-3 h-3" />
              关系图谱
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}

      {/* P1-1: 记忆星图 — 替代静态检索信息 */}
      {lastRetrievalInfo && (
        <div className="rounded-2xl bg-surface/80 border border-ink-muted/10 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-zen-sage" />
            <span className="text-xs font-medium text-ink-secondary">记忆星图</span>
          </div>
          <MemoryConstellation
            memories={memories.slice(0, 12)}
            isGenerating={false}
          />
          <div className="mt-2 space-y-0.5 text-[10px] text-ink-tertiary">
            <p>
              方式：{lastRetrievalInfo.method === 'semantic' ? '语义检索' : lastRetrievalInfo.method === 'hybrid' ? '混合检索' : '关键词匹配'}
            </p>
            <p>
              引用记忆 {lastRetrievalInfo.memoryCount} 条
              {lastRetrievalInfo.diaryCount > 0 && ` · 日记 ${lastRetrievalInfo.diaryCount} 篇`}
              {lastRetrievalInfo.peopleCount > 0 && ` · 人物 ${lastRetrievalInfo.peopleCount} 个`}
            </p>
          </div>
        </div>
      )}

      {/* 相关人物 */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Users className="w-3.5 h-3.5 text-zen-indigo" />
          <span className="text-xs font-medium text-ink-secondary">相关人物</span>
        </div>
        {relatedPeople.length > 0 || newPersonsFromNER.length > 0 ? (
          <div className="space-y-2">
            {/* 数据库中已匹配的人物 */}
            {relatedPeople.map((person) => (
              <div
                key={person.id}
                className="rounded-2xl bg-surface/80 border border-ink-muted/10 p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-ink-primary">{person.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zen-indigo/10 text-zen-indigo">
                    {RELATIONSHIP_LABELS[person.relationship] || '其他'}
                  </span>
                </div>
                {person.traits && person.traits.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {person.traits.slice(0, 3).map((trait, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-canvas-warm text-ink-tertiary"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {/* NER 实时提取的新人物（未在数据库中） */}
            {newPersonsFromNER.map((np, i) => (
              <div
                key={`ner-${i}`}
                className="rounded-2xl bg-surface/50 border border-dashed border-zen-sage/30 p-3 shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-ink-primary">{np.displayName}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zen-sage/15 text-zen-sage font-medium">
                      新增
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink-muted/10 text-ink-tertiary">
                      {getPersonRelationLabel(np)}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-ink-muted mt-0.5">
                  {np.isRelational ? '对话中提及' : '对话中出现'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-surface/50 border border-dashed border-ink-muted/20 p-4 text-center">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-14 h-14 mb-3">
                <div className="absolute inset-0 rounded-full bg-zen-sage/5 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-zen-sage/20" />
                <div className="absolute inset-2.5 rounded-full border border-zen-sage/15" />
                <Users className="w-full h-full text-zen-sage/40" />
              </div>
              <p className="text-xs text-ink-tertiary text-center leading-relaxed">
                对话中提及的人物<br />将自动显示在此
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 近期记忆 */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Brain className="w-3.5 h-3.5 text-zen-terracotta" />
          <span className="text-xs font-medium text-ink-secondary">近期记忆</span>
        </div>
        {recentMemories.length > 0 ? (
          <div className="space-y-2">
            {recentMemories.map((memory) => (
              <div
                key={memory.id}
                className="rounded-2xl bg-surface/80 border border-ink-muted/10 p-3 shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zen-terracotta/10 text-zen-terracotta">
                    {MEMORY_TYPE_LABELS[memory.type] || memory.type}
                  </span>
                  <span className="text-[10px] text-ink-muted">
                    {getRelativeTime(memory.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-ink-secondary line-clamp-2 mt-1.5 leading-relaxed">
                  {memory.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-surface/50 border border-dashed border-ink-muted/20 p-4 text-center">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-10 h-10 mb-2 rounded-lg bg-zen-terracotta/8 flex items-center justify-center">
                <Brain className="w-4 h-4 text-zen-terracotta/40 animate-pulse" />
              </div>
              <p className="text-xs text-ink-tertiary text-center">暂无记忆记录</p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

// ============================================================
// 桌面端布局主组件
// ============================================================

export function DesktopLayout() {
  const activeNav = useUIStore((s) => s.activeNav)
  const setActiveNav = useUIStore((s) => s.setActiveNav)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderPage = () => {
    switch (activeNav) {
      case '对话':
        return (
          <ErrorBoundary>
            <MainStage />
          </ErrorBoundary>
        )
      case '提醒':
        return (
          <ErrorBoundary>
            <RemindersPage />
          </ErrorBoundary>
        )
      case '记忆':
        return (
          <ErrorBoundary>
            <MemoryPage />
          </ErrorBoundary>
        )
      case '关系':
        return (
          <ErrorBoundary>
            <RelationsPage />
          </ErrorBoundary>
        )
      case '日记':
        return (
          <ErrorBoundary>
            <DiaryPage />
          </ErrorBoundary>
        )
      case '设置':
        return (
          <ErrorBoundary>
            <SettingsPage />
          </ErrorBoundary>
        )
      default:
        return (
          <ErrorBoundary>
            <MainStage />
          </ErrorBoundary>
        )
    }
  }

  // 侧边信息栏仅在对话页面显示
  const showSideInfo = activeNav === '对话'

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{
        background: 'var(--color-canvas, #FAF8F5)',
      }}
    >
      {/* === 左侧导航栏 === */}
      <aside
        className="flex flex-col w-[220px] flex-shrink-0 border-r border-ink-muted/10"
        style={{
          background: 'var(--color-surface, rgba(255,255,255,0.72))',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        {/* Logo 区域 */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zen-sage to-zen-indigo flex items-center justify-center shadow-sm">
              <Sparkles className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <div className="font-serif text-lg font-semibold text-ink-primary leading-tight">
                衡舟
              </div>
              <div className="text-[10px] text-ink-tertiary leading-tight">你的第二大脑</div>
            </div>
          </div>
        </div>

        {/* 导航项 */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {NAV_ITEMS.map(({ nav, icon: Icon, label }) => {
            const isActive = activeNav === nav
            return (
              <button
                key={nav}
                onClick={() => setActiveNav(nav)}
                data-guide={`nav-${nav === '记忆' ? 'memory' : nav === '关系' ? 'relations' : ''}`}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-zen-sage/10 text-zen-sage'
                    : 'text-ink-secondary hover:bg-ink-muted/5 hover:text-ink-primary'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-sm ${isActive ? 'font-medium' : ''}`}>{label}</span>
              </button>
            )
          })}
        </nav>

        {/* 底部信息 */}
        <div className="px-5 py-3 border-t border-ink-muted/10 flex items-center justify-between">
          <p className="text-[10px] text-ink-muted">衡舟 v2.0 · 本地优先</p>
          <LayoutToggle />
        </div>
      </aside>

      {/* === 右侧主内容区 === */}
      <div className="flex-1 flex overflow-hidden">
        {/* 主操作区 */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">{renderPage()}</main>

        {/* 侧边信息栏 */}
        {showSideInfo && (
          <>
            <aside
              className={`flex-shrink-0 border-l border-ink-muted/10 overflow-y-auto overflow-x-hidden transition-all duration-300 ${
                sidebarCollapsed ? 'w-0 opacity-0' : 'w-[360px] opacity-100'
              }`}
              style={{
                background: 'var(--color-surface, rgba(255,255,255,0.5))',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              }}
            >
              <ErrorBoundary>
                <ContextSidebar
                  collapsed={sidebarCollapsed}
                  onCollapse={() => setSidebarCollapsed(true)}
                />
              </ErrorBoundary>
            </aside>

            {/* 折叠状态下的展开按钮 */}
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="flex-shrink-0 w-10 flex items-center justify-center border-l border-ink-muted/10 text-ink-tertiary hover:text-ink-primary hover:bg-ink-muted/5 transition-colors"
                style={{
                  background: 'var(--color-surface, rgba(255,255,255,0.5))',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
                aria-label="展开侧边栏"
              >
                <PanelRightOpen className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
