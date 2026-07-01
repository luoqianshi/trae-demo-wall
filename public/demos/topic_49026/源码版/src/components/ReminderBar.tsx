import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { generateReminders, type Reminder } from '../lib/reminders'

export function ReminderBar() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [dismissed, setDismissed] = useState(() => {
    try {
      const dismissedAt = sessionStorage.getItem('hengzhou-reminder-dismissed')
      if (!dismissedAt) return false
      const dismissedDate = new Date(dismissedAt).toDateString()
      return dismissedDate === new Date().toDateString()
    } catch {
      return false
    }
  })

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem('hengzhou-reminder-dismissed', new Date().toISOString())
    } catch { /* ignore */ }
  }

  useEffect(() => {
    generateReminders().then(setReminders).catch(console.error)
  }, [])

  const now = Date.now()
  const upcoming = reminders
    .filter((r) => r.dueDate && r.dueDate > now)
    .sort((a, b) => (a.dueDate || Infinity) - (b.dueDate || Infinity))

  const nextReminder = upcoming[0]

  if (!nextReminder || dismissed) return null

  const timeStr = new Date(nextReminder.dueDate as number).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const isUrgent =
    nextReminder.priority === 'high' ||
    (nextReminder.dueDate as number) - now < 30 * 60 * 1000

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 mx-3 mt-2 rounded-lg"
      style={{
        background: isUrgent
          ? 'color-mix(in srgb, var(--color-zen-amber, #C4A35A) 12%, var(--color-surface, #FFFFFF))'
          : 'color-mix(in srgb, var(--color-zen-sage, #7AAF8E) 12%, var(--color-surface, #FFFFFF))',
        borderLeft: `3px solid ${isUrgent ? 'var(--color-zen-amber, #C4A35A)' : 'var(--color-zen-sage, #7AAF8E)'}`,
      }}
    >
      <Bell
        size={14}
        color={isUrgent ? 'var(--color-zen-amber, #C4A35A)' : 'var(--color-zen-sage, #7AAF8E)'}
      />
      <span
        className="flex-1 text-xs"
        style={{ color: 'var(--color-ink-primary, #1C1917)' }}
      >
        {timeStr} · {nextReminder.title}
      </span>
      <button
        onClick={handleDismiss}
        className="p-0.5"
        style={{ color: 'var(--color-ink-tertiary, #A8A29E)' }}
      >
        <X size={14} />
      </button>
    </div>
  )
}
