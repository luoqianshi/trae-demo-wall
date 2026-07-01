import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, X, Clock, ChevronRight, Volume2 } from 'lucide-react'
import { generateReminders, type Reminder, type ReminderType } from '../lib/reminders'
import { useUIStore } from '../stores/useUIStore'

const SHOWN_KEY = 'hengzhou-shown-reminders'
const CHECK_INTERVAL = 60_000 // 60 秒检查一次
const DUE_THRESHOLD = 5 * 60 * 1000 // 5 分钟内到期的提醒视为"即将到期"
const AUTO_DISMISS = 15_000 // 15 秒自动消失

function getReminderIcon(type: ReminderType) {
  switch (type) {
    case 'task': return '✓'
    case 'news': return '📰'
    case 'birthday': return '🎂'
    case 'milestone': return '🏁'
    case 'health': return '💪'
    case 'finance': return '💰'
    case 'memory': return '💡'
    case 'person': return '👤'
    default: return '🔔'
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return 'border-l-zen-rose'
    case 'medium': return 'border-l-zen-amber'
    default: return 'border-l-zen-sage'
  }
}

function formatDueLabel(dueDate?: number): string {
  if (!dueDate) return ''
  const diffMs = dueDate - Date.now()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 0) return '已到期'
  if (diffMin === 0) return '现在'
  if (diffMin < 60) return `${diffMin} 分钟后`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} 小时后`
  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay} 天后`
}

export function ReminderNotification() {
  const [activeReminder, setActiveReminder] = useState<Reminder | null>(null)
  const queueRef = useRef<Reminder[]>([])
  const setActiveNav = useUIStore((s) => s.setActiveNav)

  // 获取已展示过的提醒 ID（按天重置）
  const getShownIds = useCallback((): Set<string> => {
    const today = new Date().toISOString().slice(0, 10)
    const key = `${SHOWN_KEY}-${today}`
    try {
      const raw = sessionStorage.getItem(key)
      return new Set(raw ? JSON.parse(raw) : [])
    } catch {
      return new Set()
    }
  }, [])

  // 标记提醒已展示
  const markShown = useCallback((id: string) => {
    const today = new Date().toISOString().slice(0, 10)
    const key = `${SHOWN_KEY}-${today}`
    const shown = getShownIds()
    shown.add(id)
    sessionStorage.setItem(key, JSON.stringify([...shown]))
  }, [getShownIds])

  // 检查到期提醒
  const checkReminders = useCallback(async () => {
    try {
      const reminders = await generateReminders()
      const shown = getShownIds()
      const now = Date.now()

      // 筛选需要弹出的提醒：
      // 1. 有 dueDate 且在 5 分钟内到期或已过期
      // 2. 高优先级且无 dueDate（立即提醒）
      const dueReminders = reminders.filter((r) => {
        if (shown.has(r.id)) return false
        if (r.dueDate) {
          return r.dueDate <= now + DUE_THRESHOLD
        }
        return r.priority === 'high'
      })

      if (dueReminders.length > 0) {
        queueRef.current = [...queueRef.current, ...dueReminders]
      }
    } catch (e) {
      console.error('[ReminderNotification] check failed:', e)
    }
  }, [getShownIds])

  // 从队列中取出下一条提醒展示
  useEffect(() => {
    if (!activeReminder && queueRef.current.length > 0) {
      const next = queueRef.current[0]
      queueRef.current = queueRef.current.slice(1)
      setActiveReminder(next)
      markShown(next.id)

      // 语音朗读
      if (localStorage.getItem('hengzhou-voice-enabled') === 'true') {
        try {
          const utterance = new SpeechSynthesisUtterance(
            `${next.title}。${next.content}`
          )
          utterance.lang = 'zh-CN'
          utterance.rate = 0.9
          speechSynthesis.speak(utterance)
        } catch {
          /* 语音 API 不可用，忽略 */
        }
      }
    }
  }, [activeReminder, markShown])

  // 初始检查 + 定时检查 + 窗口聚焦检查
  useEffect(() => {
    // 延迟 3 秒后首次检查，等待应用加载完成
    const initialTimer = setTimeout(() => checkReminders(), 3000)
    const interval = setInterval(() => checkReminders(), CHECK_INTERVAL)

    // 窗口重新聚焦时检查
    const handleFocus = () => checkReminders()
    window.addEventListener('focus', handleFocus)

    // 监听对话产生新记忆事件（从 chatPipeline 触发）
    const handleNewMemory = () => {
      // 延迟 2 秒等待记忆保存完成后检查
      setTimeout(() => checkReminders(), 2000)
    }
    window.addEventListener('hengzhou-new-memory', handleNewMemory)

    // 监听测试提醒事件
    const handleTestReminder = (e: Event) => {
      const customEvent = e as CustomEvent<Reminder>
      if (customEvent.detail) {
        queueRef.current = [customEvent.detail, ...queueRef.current]
      }
    }
    window.addEventListener('hengzhou-test-reminder', handleTestReminder as EventListener)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('hengzhou-new-memory', handleNewMemory)
      window.removeEventListener('hengzhou-test-reminder', handleTestReminder as EventListener)
    }
  }, [checkReminders])

  // 自动消失
  useEffect(() => {
    if (!activeReminder) return
    const timer = setTimeout(() => setActiveReminder(null), AUTO_DISMISS)
    return () => clearTimeout(timer)
  }, [activeReminder])

  if (!activeReminder) return null

  const handleDismiss = () => setActiveReminder(null)
  const handleViewAll = () => {
    setActiveReminder(null)
    setActiveNav('提醒')
  }

  const dueLabel = formatDueLabel(activeReminder.dueDate)
  const isVoiceOn = localStorage.getItem('hengzhou-voice-enabled') === 'true'

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex justify-center px-3 pt-2 pointer-events-none"
      style={{ animation: 'slide-down 0.3s ease-out' }}
    >
      <div
        className={`pointer-events-auto w-full max-w-[480px] bg-surface border border-ink-muted/20 border-l-4 ${getPriorityColor(activeReminder.priority)} rounded-xl shadow-xl overflow-hidden`}
      >
        {/* 顶部条 */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-1.5 text-xs text-ink-tertiary">
            <Bell className="w-3 h-3 text-zen-terracotta" />
            <span>衡舟提醒</span>
            {dueLabel && (
              <span className="flex items-center gap-0.5 ml-1 text-zen-terracotta">
                <Clock className="w-3 h-3" />
                {dueLabel}
              </span>
            )}
            {isVoiceOn && (
              <Volume2 className="w-3 h-3 text-zen-indigo ml-1" />
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="w-6 h-6 rounded flex items-center justify-center text-ink-muted hover:text-ink-secondary hover:bg-canvas-warm transition-colors"
            aria-label="关闭提醒"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 内容区 */}
        <div
          className="px-4 pb-3 pt-1 cursor-pointer"
          onClick={handleViewAll}
        >
          <div className="flex items-start gap-2.5">
            <span className="text-lg flex-shrink-0 mt-0.5">
              {getReminderIcon(activeReminder.type)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink-primary">
                {activeReminder.title}
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed mt-0.5 line-clamp-2">
                {activeReminder.content}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-muted flex-shrink-0 mt-1" />
          </div>
        </div>

        {/* 进度条（自动消失倒计时） */}
        <div className="h-0.5 bg-ink-muted/10">
          <div
            className="h-full bg-zen-terracotta/30"
            style={{
              animation: `shrink ${AUTO_DISMISS}ms linear forwards`,
            }}
          />
        </div>
      </div>

      {/* 内联动画样式 */}
      <style>{`
        @keyframes slide-down {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
