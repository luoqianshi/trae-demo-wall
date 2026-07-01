import { useState, useEffect } from 'react'
import {
  Bell, Activity, Lightbulb, Check, X,
  PauseCircle, PlayCircle, AlertTriangle, Newspaper,
  Cake, Flag, TrendingUp, User, Clock
} from 'lucide-react'
import {
  generateReminders,
  getDailyBudget,
  pauseTodayReminders,
  resumeReminders,
  type Reminder,
  type ReminderType,
  type ReminderPriority,
} from '../lib/reminders'
import { speak } from '../lib/voice'

const HEALTH_LOG_KEY = 'hengzhou-health-log'

type HealthLog = Record<string, string[]>

function getHealthLog(): HealthLog {
  try {
    return JSON.parse(localStorage.getItem(HEALTH_LOG_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveHealthLog(log: HealthLog): void {
  localStorage.setItem(HEALTH_LOG_KEY, JSON.stringify(log))
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function getStreak(id: string, log: HealthLog): number {
  const dates = log[id] || []
  const today = getToday()
  const set = new Set(dates)
  let streak = 0
  const d = new Date(today)
  while (set.has(d.toISOString().slice(0, 10))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
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

function getReminderTitle(type: ReminderType): string {
  switch (type) {
    case 'task': return '待办事项'
    case 'news': return '每日资讯'
    case 'birthday': return '生日提醒'
    case 'milestone': return '日程提醒'
    case 'health': return '健康关注'
    case 'finance': return '财务回顾'
    case 'memory': return '记忆回顾'
    case 'person': return '衡舟的关怀'
    default: return '提醒'
  }
}

function getReminderGradient(type: ReminderType): string {
  switch (type) {
    case 'task': return 'from-zen-terracotta/20 to-zen-terracotta/5'
    case 'news': return 'from-zen-indigo/20 to-zen-indigo/5'
    case 'birthday': return 'from-zen-sage/20 to-zen-sage/5'
    case 'milestone': return 'from-zen-amber/20 to-zen-amber/5'
    case 'health': return 'from-zen-rose/20 to-zen-rose/5'
    case 'finance': return 'from-zen-amber/20 to-zen-amber/5'
    case 'memory': return 'from-gray-400/20 to-gray-500/5'
    case 'person': return 'from-gray-400/20 to-gray-500/5'
    default: return 'from-gray-400/20 to-gray-500/5'
  }
}

function getReminderBorder(type: ReminderType): string {
  switch (type) {
    case 'task': return 'border-zen-terracotta/30'
    case 'news': return 'border-zen-indigo/30'
    case 'birthday': return 'border-zen-sage/30'
    case 'milestone': return 'border-zen-amber/30'
    case 'health': return 'border-zen-rose/30'
    case 'finance': return 'border-zen-amber/30'
    case 'memory': return 'border-ink-muted/10'
    case 'person': return 'border-ink-muted/10'
    default: return 'border-ink-muted/10'
  }
}

function getPriorityLabel(priority: ReminderPriority): { text: string; className: string } {
  switch (priority) {
    case 'high':
      return { text: '高', className: 'bg-zen-rose/15 text-zen-rose' }
    case 'medium':
      return { text: '中', className: 'bg-zen-amber/15 text-zen-amber' }
    case 'low':
      return { text: '低', className: 'bg-ink-muted/10 text-ink-muted' }
    default:
      return { text: '低', className: 'bg-ink-muted/10 text-ink-muted' }
  }
}

function getCategoryLabel(category?: string): { text: string; className: string } | null {
  switch (category) {
    case 'tech':
      return { text: '科技', className: 'bg-zen-indigo/15 text-zen-indigo' }
    case 'finance':
      return { text: '财经', className: 'bg-zen-amber/15 text-zen-amber' }
    case 'health':
      return { text: '健康', className: 'bg-zen-rose/15 text-zen-rose' }
    case 'culture':
      return { text: '文化', className: 'bg-zen-sage/15 text-zen-sage' }
    default:
      return null
  }
}

function formatCountdown(dueDate?: number): string | null {
  if (!dueDate) return null
  const diffMs = dueDate - Date.now()
  const diffDays = Math.ceil(diffMs / 86400000)
  if (diffDays < 0) return '已过期'
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '还有1天'
  if (diffDays <= 7) return `还有${diffDays}天`
  if (diffDays <= 30) return `还有${Math.ceil(diffDays / 7)}周`
  return null
}

export function ReminderCard() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [budget, setBudget] = useState(() => getDailyBudget())
  const [healthLog, setHealthLog] = useState<HealthLog>(() => getHealthLog())

  const handleCompleteHealth = (id: string) => {
    const today = getToday()
    setHealthLog((prev) => {
      const next = { ...prev, [id]: Array.from(new Set([...(prev[id] || []), today])) }
      saveHealthLog(next)
      return next
    })
    setCompleted((prev) => new Set(prev).add(id))
  }

  useEffect(() => {
    generateReminders().then(setReminders).catch(console.error)
  }, [])

  // 当用户清除示例数据后，重新生成提醒
  useEffect(() => {
    const handleDemoCleared = () => {
      generateReminders().then(setReminders).catch(console.error)
    }
    window.addEventListener('hengzhou:demo-cleared', handleDemoCleared)
    return () => window.removeEventListener('hengzhou:demo-cleared', handleDemoCleared)
  }, [])

  useEffect(() => {
    if (reminders.length > 0) {
      const first = reminders[0]
      if (first.content) {
        speak(`衡舟提醒：${first.content}`)
      }
    }
  }, [reminders[0]?.id])

  const handlePause = () => {
    pauseTodayReminders()
    setBudget(getDailyBudget())
  }

  const handleResume = () => {
    resumeReminders()
    setBudget(getDailyBudget())
    generateReminders().then(setReminders).catch(console.error)
  }

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id))
  }

  const handleComplete = (id: string) => {
    setCompleted((prev) => new Set(prev).add(id))
  }

  const visible = reminders.filter((r) => !dismissed.has(r.id) && !completed.has(r.id))
  const highPriority = visible.filter((r) => r.priority === 'high')
  const normalReminders = visible.filter((r) => r.priority !== 'high')

  if (visible.length === 0 && !budget.paused) return null

  return (
    <div className="space-y-2">
      {/* 注意力预算头部 */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {budget.paused ? (
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <PauseCircle className="w-3 h-3" />
              今日提醒已暂停
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-ink-tertiary">
              <Bell className="w-3 h-3" />
              今日提醒 <span className="text-zen-terracotta font-medium">{Math.min(budget.used, budget.max)}</span>/{budget.max}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {highPriority.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-zen-rose">
              <AlertTriangle className="w-3 h-3" />
              {highPriority.length}条高优先级
            </span>
          )}
          {budget.paused ? (
            <button
              onClick={handleResume}
              className="text-xs text-zen-terracotta hover:text-zen-terracotta/80 transition-colors"
            >
              <PlayCircle className="w-3.5 h-3.5 inline mr-0.5" />
              恢复
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="text-xs text-ink-muted hover:text-ink-secondary transition-colors"
            >
              <PauseCircle className="w-3.5 h-3.5 inline mr-0.5" />
              暂停今日
            </button>
          )}
        </div>
      </div>

      {/* 高优先级提醒 */}
      {highPriority.map((reminder) => (
        <ReminderItem
          key={reminder.id}
          reminder={reminder}
          healthLog={healthLog}
          onDismiss={() => handleDismiss(reminder.id)}
          onComplete={() => (reminder.type === 'health' ? handleCompleteHealth(reminder.id) : handleComplete(reminder.id))}
          isHighPriority
        />
      ))}

      {/* 普通提醒 */}
      {!budget.paused && normalReminders.map((reminder) => (
        <ReminderItem
          key={reminder.id}
          reminder={reminder}
          healthLog={healthLog}
          onDismiss={() => handleDismiss(reminder.id)}
          onComplete={() => (reminder.type === 'health' ? handleCompleteHealth(reminder.id) : handleComplete(reminder.id))}
        />
      ))}

      {/* 预算用完后提示 */}
      {budget.used >= budget.max && !budget.paused && normalReminders.length === 0 && (
        <p className="text-xs text-ink-muted text-center py-1">
          今日温和提醒已看完了，高优先级提醒会照常显示
        </p>
      )}
    </div>
  )
}

// 单条提醒组件
function ReminderItem({
  reminder,
  healthLog,
  onDismiss,
  onComplete,
  isHighPriority: _isHighPriority,
}: {
  reminder: Reminder
  healthLog: HealthLog
  onDismiss: () => void
  onComplete: () => void
  isHighPriority?: boolean
}) {
  const Icon = getReminderIcon(reminder.type)
  const title = getReminderTitle(reminder.type)
  const gradient = getReminderGradient(reminder.type)
  const border = getReminderBorder(reminder.type)
  const priorityLabel = getPriorityLabel(reminder.priority)
  const categoryLabel = getCategoryLabel(reminder.category)
  const countdown = formatCountdown(reminder.dueDate)

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${gradient} border ${border} p-4`}
    >
      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/5" />
      <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-white/5" />
      <div className="relative flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
          <Icon className="w-4 h-4 text-ink-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5 flex-wrap gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium text-ink-primary">{title}</span>
              {reminder.time && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-zen-rose/20 text-zen-rose">
                  {reminder.time}
                </span>
              )}
              <span className={`text-2xs px-1 py-0.5 rounded ${priorityLabel.className}`}>
                {priorityLabel.text}
              </span>
              {categoryLabel && (
                <span className={`text-2xs px-1 py-0.5 rounded ${categoryLabel.className}`}>
                  {categoryLabel.text}
                </span>
              )}
              {countdown && (
                <span className="flex items-center gap-0.5 text-2xs text-ink-muted">
                  <Clock className="w-3 h-3" />
                  {countdown}
                </span>
              )}
            </div>
            <button
              onClick={onDismiss}
              className="w-5 h-5 rounded flex items-center justify-center text-ink-muted hover:text-ink-secondary opacity-60 hover:opacity-100 transition-all flex-shrink-0"
              aria-label="忽略提醒"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-sm text-ink-secondary leading-relaxed">{reminder.content}</p>
          {reminder.actionable && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={onComplete}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-zen-sage/15 text-zen-sage hover:bg-zen-sage/25 transition-colors"
              >
                <Check className="w-3 h-3" />
                标记完成
              </button>
              {reminder.type === 'health' && getStreak(reminder.id, healthLog) > 0 && (
                <span className="text-xs text-zen-sage">
                  已连续 {getStreak(reminder.id, healthLog)} 天
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
