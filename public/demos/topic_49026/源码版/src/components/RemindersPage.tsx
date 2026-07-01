// [HMR-TOUCH] 2026-06-20: 实现手动添加提醒功能 + 修复头部计数 Bug
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Bell, Plus, Check, X, Clock, Calendar, Tag, Flag, Trash2,
  Activity, Lightbulb, Newspaper, Cake, TrendingUp, User, FileText,
  ChevronLeft,
} from 'lucide-react'
import { BackHeader } from './BackHeader'
import {
  generateReminders,
  type Reminder,
  type ReminderType,
  type ReminderPriority,
} from '../lib/reminders'
import {
  getManualReminders,
  addManualReminder,
  deleteManualReminder,
  completeReminder,
  uncompleteReminder,
  getCompletedReminders,
  getCompletedIds,
  parseDateTime,
  formatDateForInput,
  getTodayStr,
} from '../lib/manualReminders'
import { SummaryPanel } from './SummaryPanel'

interface RemindersPageProps {
  onClose?: () => void
}

type TimeGroup = 'today' | 'tomorrow' | 'week' | 'all'

const TIME_GROUP_LABELS: Record<TimeGroup, string> = {
  today: '今天',
  tomorrow: '明天',
  week: '本周',
  all: '全部',
}

function getReminderIcon(type: ReminderType) {
  switch (type) {
    case 'task': return Check
    case 'news': return Newspaper
    case 'birthday': return Cake
    case 'milestone': return Flag
    case 'health': return Activity
    case 'finance': return TrendingUp
    case 'memory': return Lightbulb
    case 'person': return User
    default: return Bell
  }
}

function getReminderTypeLabel(type: ReminderType): string {
  switch (type) {
    case 'task': return '待办'
    case 'news': return '资讯'
    case 'birthday': return '生日'
    case 'milestone': return '日程'
    case 'health': return '健康'
    case 'finance': return '财务'
    case 'memory': return '记忆'
    case 'person': return '关怀'
    default: return '提醒'
  }
}

function getPriorityStyle(priority: ReminderPriority): string {
  switch (priority) {
    case 'high': return 'bg-zen-rose/15 text-zen-rose'
    case 'medium': return 'bg-zen-amber/15 text-zen-amber'
    case 'low': return 'bg-ink-muted/10 text-ink-muted'
    default: return 'bg-ink-muted/10 text-ink-muted'
  }
}

function getPriorityLabel(priority: ReminderPriority): string {
  switch (priority) {
    case 'high': return '高'
    case 'medium': return '中'
    case 'low': return '低'
    default: return '低'
  }
}

// 根据 dueDate 判断属于哪个时间分组
function resolveTimeGroup(reminder: Reminder): TimeGroup {
  if (!reminder.dueDate) return 'all'
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const oneDay = 86400000
  const diff = reminder.dueDate - startOfToday
  if (diff < 0) return 'today' // 已过期归到今天
  if (diff < oneDay) return 'today'
  if (diff < oneDay * 2) return 'tomorrow'
  if (diff < oneDay * 7) return 'week'
  return 'all'
}

function formatDueDate(dueDate?: number): string | null {
  if (!dueDate) return null
  const diffMs = dueDate - Date.now()
  const diffDays = Math.ceil(diffMs / 86400000)
  if (diffDays < 0) return '已过期'
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays <= 7) return `还有${diffDays}天`
  return new Date(dueDate).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

export function RemindersPage({ onClose }: RemindersPageProps) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [manualReminders, setManualReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActiveGroup] = useState<TimeGroup>('today')
  const [activeType, setActiveType] = useState<ReminderType | 'all'>('all')
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [completedRecords, setCompletedRecords] = useState(() => getCompletedReminders())
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [showCompleted, setShowCompleted] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const initializedRef = useRef(false)

  // 加载手动提醒
  const loadManualReminders = useCallback(() => {
    setManualReminders(getManualReminders())
  }, [])

  useEffect(() => {
    // StrictMode 守卫
    if (initializedRef.current) return
    initializedRef.current = true

    // 加载已完成状态
    setCompleted(getCompletedIds())

    setLoading(true)
    // 添加15秒超时，防止AI服务不可用时永久加载
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI服务暂时不可用，请稍后重试')), 15000)
    )
    Promise.race([generateReminders(), timeoutPromise])
      .then((data) => {
        // 去重
        const seenIds = new Set<string>()
        const seenContents = new Set<string>()
        const deduped = data.filter((r) => {
          if (seenIds.has(r.id)) return false
          const contentKey = r.content.slice(0, 30)
          if (seenContents.has(contentKey)) return false
          seenIds.add(r.id)
          seenContents.add(contentKey)
          return true
        })
        setReminders(deduped)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load reminders:', err)
        setLoading(false)
        // AI服务不可用时仍显示手动提醒，不阻塞用户
        if (manualReminders.length === 0) {
          setReminders([])
        }
      })

    loadManualReminders()
  }, [loadManualReminders])

  // 监听提醒更新事件（自然语言创建/完成状态变化时触发）
  useEffect(() => {
    const handler = () => {
      loadManualReminders()
      setCompleted(getCompletedIds())
      setCompletedRecords(getCompletedReminders())
    }
    window.addEventListener('hengzhou-reminders-updated', handler)
    return () => window.removeEventListener('hengzhou-reminders-updated', handler)
  }, [loadManualReminders])

  // 合并自动提醒 + 手动提醒
  const allReminders = useMemo(() => {
    return [...manualReminders, ...reminders]
  }, [reminders, manualReminders])

  const visibleReminders = useMemo(
    () => allReminders.filter((r) => !dismissed.has(r.id) && !completed.has(r.id)),
    [allReminders, dismissed, completed]
  )

  // 可用的类型筛选
  const availableTypes = useMemo(() => {
    const types = new Set<ReminderType>()
    visibleReminders.forEach((r) => types.add(r.type))
    return Array.from(types)
  }, [visibleReminders])

  // 按时间分组
  const groupedReminders = useMemo(() => {
    const groups: Record<TimeGroup, Reminder[]> = {
      today: [],
      tomorrow: [],
      week: [],
      all: [],
    }
    visibleReminders.forEach((r) => {
      const g = resolveTimeGroup(r)
      if (g !== 'all') groups[g].push(r)
      groups.all.push(r)
    })
    return groups
  }, [visibleReminders])

  // 当前分组下、经过类型筛选的提醒
  const currentReminders = useMemo(() => {
    const list = groupedReminders[activeGroup] || []
    if (activeType === 'all') return list
    return list.filter((r) => r.type === activeType)
  }, [groupedReminders, activeGroup, activeType])

  // BUG-2 修复：头部计数使用 currentReminders（已筛选）而非 groupedReminders（未筛选）
  const headerCount = currentReminders.length

  const handleComplete = (reminder: Reminder) => {
    // 持久化完成状态
    completeReminder({ id: reminder.id, title: reminder.title, source: reminder.source })
    // 更新本地状态
    setCompleted((prev) => new Set(prev).add(reminder.id))
    setCompletedRecords(getCompletedReminders())
    // 如果是手动/自然语言提醒，completeReminder 已从存储中移除
    if (reminder.source === 'manual' || reminder.source === 'nl_input') {
      loadManualReminders()
    }
  }

  const handleUncomplete = (id: string) => {
    uncompleteReminder(id)
    setCompleted(getCompletedIds())
    setCompletedRecords(getCompletedReminders())
    loadManualReminders()
  }

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id))
  }

  const handleDeleteManual = (id: string) => {
    deleteManualReminder(id)
    loadManualReminders()
  }

  const handleAddSuccess = () => {
    loadManualReminders()
    setShowAddModal(false)
    // 切换到"全部"视图以便用户看到新添加的提醒
    setActiveGroup('all')
  }

  return (
    <div className="flex flex-col h-full bg-canvas page-enter">
      {/* 头部 */}
      <div className="px-6 py-5 border-b border-ink-muted/10 bg-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zen-terracotta/10 flex items-center justify-center">
              <Bell className="w-4.5 h-4.5 text-zen-terracotta" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold text-ink-primary">提醒中心</h2>
              <p className="text-xs text-ink-tertiary">
                共 {headerCount} 条提醒
              </p>
            </div>
          </div>
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
          {/* 时光总结入口 */}
          <button
            onClick={() => setShowSummary(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zen-indigo/10 border border-zen-indigo/20 text-xs font-medium text-zen-indigo hover:bg-zen-indigo/20 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            时光总结
          </button>
          {!onClose && (
            <button
              onClick={() => {
                const testReminder: Reminder = {
                  id: `test-${Date.now()}`,
                  type: 'task',
                  title: '测试提醒',
                  content: '这是一条测试提醒，验证提醒自动弹出功能是否正常工作。如果你看到了这条消息，说明提醒弹出功能运转正常。',
                  source: 'test',
                  priority: 'high',
                  actionable: true,
                  dueDate: Date.now(),
                }
                window.dispatchEvent(new CustomEvent('hengzhou-test-reminder', { detail: testReminder }))
              }}
              className="px-2.5 py-1 rounded-lg text-2xs font-medium bg-zen-indigo/10 text-zen-indigo hover:bg-zen-indigo/20 transition-colors"
              aria-label="测试提醒弹出"
            >
              测试弹出
            </button>
          )}
        </div>

        {/* 时间分组筛选标签 */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {(Object.keys(TIME_GROUP_LABELS) as TimeGroup[]).map((group) => {
            const count = groupedReminders[group]?.length || 0
            return (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  activeGroup === group
                    ? 'bg-zen-terracotta text-white'
                    : 'bg-canvas text-ink-secondary hover:bg-canvas-warm'
                }`}
              >
                {TIME_GROUP_LABELS[group]}
                {count > 0 && (
                  <span className={`ml-1 ${activeGroup === group ? 'text-white/70' : 'text-ink-muted'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* 类型筛选标签 */}
        {availableTypes.length > 1 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveType('all')}
              className={`px-2.5 py-1 rounded-md text-2xs font-medium transition-colors whitespace-nowrap ${
                activeType === 'all'
                  ? 'bg-ink-primary/10 text-ink-primary'
                  : 'bg-canvas text-ink-tertiary hover:bg-canvas-warm'
              }`}
            >
              全部类型
            </button>
            {availableTypes.map((type) => {
              const Icon = getReminderIcon(type)
              return (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-2xs font-medium transition-colors whitespace-nowrap ${
                    activeType === type
                      ? 'bg-ink-primary/10 text-ink-primary'
                      : 'bg-canvas text-ink-tertiary hover:bg-canvas-warm'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {getReminderTypeLabel(type)}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 提醒列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-tertiary">
            <div className="w-8 h-8 border-2 border-ink-muted/20 border-t-zen-terracotta rounded-full animate-spin mb-3" />
            <p className="text-sm">正在生成提醒...</p>
          </div>
        ) : currentReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-tertiary">
            <Bell className="w-10 h-10 text-ink-muted/30 mb-3" />
            <p className="text-sm">
              {activeGroup === 'today' && '今天暂无提醒'}
              {activeGroup === 'tomorrow' && '明天暂无提醒'}
              {activeGroup === 'week' && '本周暂无提醒'}
              {activeGroup === 'all' && '暂无提醒'}
            </p>
            {activeGroup !== 'all' && (
              <p className="text-xs text-ink-muted mt-1">试试切换到"全部"查看所有提醒</p>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zen-terracotta/10 text-zen-terracotta text-sm font-medium hover:bg-zen-terracotta/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加一条提醒
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentReminders.map((reminder, idx) => (
              <ReminderRow
                key={`${reminder.id}-${idx}`}
                reminder={reminder}
                onComplete={() => handleComplete(reminder)}
                onDismiss={() => handleDismiss(reminder.id)}
                onDelete={reminder.source === 'manual' || reminder.source === 'nl_input' ? () => handleDeleteManual(reminder.id) : undefined}
              />
            ))}
          </div>
        )}

        {/* 已完成区域 */}
        {completedRecords.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-sm text-ink-tertiary hover:text-ink-secondary transition-colors"
            >
              <Check className="w-4 h-4 text-zen-sage" />
              已完成 ({completedRecords.length})
              <span className="text-xs">{showCompleted ? '收起' : '展开'}</span>
            </button>
            {showCompleted && (
              <div className="mt-3 space-y-2">
                {completedRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-lg bg-surface/50 border border-ink-muted/5 p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Check className="w-3.5 h-3.5 text-zen-sage flex-shrink-0" />
                      <span className="text-sm text-ink-tertiary line-through truncate">{rec.title}</span>
                      <span className="text-2xs text-ink-muted flex-shrink-0">
                        {rec.source === 'nl_input' ? '语音' : rec.source === 'manual' ? '手动' : '自动'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-2xs text-ink-muted">
                        {new Date(rec.completedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => handleUncomplete(rec.id)}
                        className="text-2xs text-ink-muted hover:text-zen-terracotta transition-colors"
                      >
                        恢复
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 浮动 + 按钮 */}
      <button
        onClick={() => setShowAddModal(true)}
        className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-zen-terracotta text-white shadow-lg hover:bg-zen-terracotta/90 transition-colors flex items-center justify-center"
        aria-label="添加提醒"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* 添加提醒弹窗 */}
      {showAddModal && (
        <AddReminderModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* 时光总结面板 */}
      {showSummary && (
        <SummaryPanel onClose={() => setShowSummary(false)} />
      )}
    </div>
  )
}

// 单条提醒卡片
function ReminderRow({
  reminder,
  onComplete,
  onDismiss,
  onDelete,
}: {
  reminder: Reminder
  onComplete: () => void
  onDismiss: () => void
  onDelete?: () => void
}) {
  const Icon = getReminderIcon(reminder.type)
  const dueLabel = formatDueDate(reminder.dueDate)
  const isManual = reminder.source === 'manual'
  const isNL = reminder.source === 'nl_input'

  return (
    <div className={`rounded-xl bg-surface border p-4 hover:shadow-md transition-all ${
      isManual ? 'border-zen-sage/30 bg-zen-sage/5' : isNL ? 'border-zen-indigo/30 bg-zen-indigo/5' : 'border-ink-muted/10 hover:border-ink-muted/20'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isManual ? 'bg-zen-sage/10 text-zen-sage' : isNL ? 'bg-zen-indigo/10 text-zen-indigo' : 'bg-canvas border border-ink-muted/10 text-ink-secondary'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium text-ink-primary">{reminder.title}</span>
              <span className={`text-2xs px-1.5 py-0.5 rounded-full font-medium ${getPriorityStyle(reminder.priority)}`}>
                {getPriorityLabel(reminder.priority)}
              </span>
              {isManual && (
                <span className="text-2xs px-1.5 py-0.5 rounded-full bg-zen-sage/15 text-zen-sage font-medium">
                  手动
                </span>
              )}
              {isNL && (
                <span className="text-2xs px-1.5 py-0.5 rounded-full bg-zen-indigo/15 text-zen-indigo font-medium">
                  语音
                </span>
              )}
              {reminder.time && (
                <span className="text-2xs px-1.5 py-0.5 rounded-full bg-zen-rose/15 text-zen-rose">
                  {reminder.time}
                </span>
              )}
              {dueLabel && (
                <span className="flex items-center gap-0.5 text-2xs text-ink-muted">
                  <Clock className="w-3 h-3" />
                  {dueLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="w-5 h-5 rounded flex items-center justify-center text-ink-muted hover:text-zen-rose transition-colors"
                  aria-label="删除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onDismiss}
                className="w-5 h-5 rounded flex items-center justify-center text-ink-muted hover:text-ink-secondary transition-colors"
                aria-label="忽略"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-sm text-ink-secondary leading-relaxed">{reminder.content}</p>
          {reminder.actionable && (
            <button
              onClick={onComplete}
              className="mt-2 inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-zen-sage/15 text-zen-sage hover:bg-zen-sage/25 transition-colors"
            >
              <Check className="w-3 h-3" />
              标记完成
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 添加提醒弹窗（完整表单实现）
// ============================================================

const TYPE_OPTIONS: { value: ReminderType; label: string; icon: typeof Bell }[] = [
  { value: 'task', label: '待办', icon: Check },
  { value: 'milestone', label: '日程', icon: Flag },
  { value: 'health', label: '健康', icon: Activity },
  { value: 'finance', label: '财务', icon: TrendingUp },
  { value: 'birthday', label: '生日', icon: Cake },
  { value: 'person', label: '关怀', icon: User },
  { value: 'memory', label: '记忆', icon: Lightbulb },
]

const PRIORITY_OPTIONS: { value: ReminderPriority; label: string; style: string }[] = [
  { value: 'high', label: '高优先', style: 'bg-zen-rose/15 text-zen-rose border-zen-rose/30' },
  { value: 'medium', label: '中优先', style: 'bg-zen-amber/15 text-zen-amber border-zen-amber/30' },
  { value: 'low', label: '低优先', style: 'bg-ink-muted/10 text-ink-muted border-ink-muted/20' },
]

function AddReminderModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<ReminderType>('task')
  const [priority, setPriority] = useState<ReminderPriority>('medium')
  const [dateStr, setDateStr] = useState('')
  const [timeStr, setTimeStr] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const todayStr = getTodayStr()

  const handleSave = () => {
    setError('')

    if (!content.trim()) {
      setError('请输入提醒内容')
      return
    }

    setSaving(true)

    try {
      const dueDate = parseDateTime(dateStr, timeStr || undefined)

      addManualReminder({
        title: title.trim(),
        content: content.trim(),
        type,
        priority,
        dueDate,
        time: timeStr || undefined,
      })

      setSaving(false)
      onSuccess()
    } catch (err) {
      setSaving(false)
      setError(err instanceof Error ? err.message : '保存失败，请重试')
    }
  }

  // 快捷日期选择
  const setQuickDate = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    setDateStr(formatDateForInput(d.getTime()))
    if (!timeStr) setTimeStr('09:00')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-ink-primary/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗主体 */}
      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 z-10">
          <BackHeader
            title="添加提醒"
            onBack={onClose}
          />
        </div>

        {/* 表单内容 */}
        <div className="px-6 py-5 space-y-5">
          {/* 标题 */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary mb-1.5">
              <Tag className="w-3.5 h-3.5" />
              标题 <span className="text-ink-muted">（可选）</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给提醒起个名字..."
              maxLength={30}
              className="w-full px-3 py-2 rounded-lg border border-ink-muted/20 bg-canvas text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-zen-terracotta/40 focus:ring-2 focus:ring-zen-terracotta/10 transition-all"
            />
          </div>

          {/* 内容 */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary mb-1.5">
              <FileText className="w-3.5 h-3.5" />
              内容 <span className="text-zen-rose">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="提醒你做什么？比如：周五下午3点开会、给妈妈打电话..."
              rows={3}
              maxLength={200}
              className="w-full px-3 py-2 rounded-lg border border-ink-muted/20 bg-canvas text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-zen-terracotta/40 focus:ring-2 focus:ring-zen-terracotta/10 transition-all resize-none"
            />
            <p className="text-2xs text-ink-muted mt-1 text-right">{content.length}/200</p>
          </div>

          {/* 类型选择 */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary mb-2">
              <Bell className="w-3.5 h-3.5" />
              类型
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isActive = type === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      isActive
                        ? 'bg-zen-terracotta/10 text-zen-terracotta border-zen-terracotta/30'
                        : 'bg-canvas text-ink-tertiary border-ink-muted/15 hover:border-ink-muted/30'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 优先级 */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary mb-2">
              <Flag className="w-3.5 h-3.5" />
              优先级
            </label>
            <div className="flex gap-1.5">
              {PRIORITY_OPTIONS.map((opt) => {
                const isActive = priority === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setPriority(opt.value)}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      isActive
                        ? opt.style
                        : 'bg-canvas text-ink-tertiary border-ink-muted/15 hover:border-ink-muted/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 日期与时间 */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary mb-2">
              <Calendar className="w-3.5 h-3.5" />
              提醒时间 <span className="text-ink-muted">（可选）</span>
            </label>

            {/* 快捷选择 */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <button
                onClick={() => setQuickDate(0)}
                className="px-2.5 py-1 rounded-md text-2xs font-medium bg-canvas text-ink-tertiary border border-ink-muted/15 hover:border-zen-terracotta/30 hover:text-zen-terracotta transition-all"
              >
                今天
              </button>
              <button
                onClick={() => setQuickDate(1)}
                className="px-2.5 py-1 rounded-md text-2xs font-medium bg-canvas text-ink-tertiary border border-ink-muted/15 hover:border-zen-terracotta/30 hover:text-zen-terracotta transition-all"
              >
                明天
              </button>
              <button
                onClick={() => setQuickDate(3)}
                className="px-2.5 py-1 rounded-md text-2xs font-medium bg-canvas text-ink-tertiary border border-ink-muted/15 hover:border-zen-terracotta/30 hover:text-zen-terracotta transition-all"
              >
                3天后
              </button>
              <button
                onClick={() => setQuickDate(7)}
                className="px-2.5 py-1 rounded-md text-2xs font-medium bg-canvas text-ink-tertiary border border-ink-muted/15 hover:border-zen-terracotta/30 hover:text-zen-terracotta transition-all"
              >
                下周
              </button>
              <button
                onClick={() => { setDateStr(''); setTimeStr('') }}
                className="px-2.5 py-1 rounded-md text-2xs font-medium bg-canvas text-ink-tertiary border border-ink-muted/15 hover:border-ink-muted/30 transition-all"
              >
                清除
              </button>
            </div>

            {/* 日期 + 时间输入 */}
            <div className="flex gap-2">
              <input
                type="date"
                value={dateStr}
                min={todayStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-ink-muted/20 bg-canvas text-sm text-ink-primary focus:outline-none focus:border-zen-terracotta/40 focus:ring-2 focus:ring-zen-terracotta/10 transition-all"
              />
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-32 px-3 py-2 rounded-lg border border-ink-muted/20 bg-canvas text-sm text-ink-primary focus:outline-none focus:border-zen-terracotta/40 focus:ring-2 focus:ring-zen-terracotta/10 transition-all"
              />
            </div>
            {!dateStr && (
              <p className="text-2xs text-ink-muted mt-1">不设时间则归类为"全部"</p>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="rounded-lg bg-zen-rose/10 border border-zen-rose/20 px-3 py-2">
              <p className="text-xs text-zen-rose">{error}</p>
            </div>
          )}
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
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-zen-terracotta text-white hover:bg-zen-terracotta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                创建提醒
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
