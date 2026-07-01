// 手动提醒管理 — 基于 localStorage 持久化
// 用户可通过 UI 手动创建提醒，与自动生成的提醒合并展示
// 也支持自然语言创建的提醒（来源标记为 'nl_input'）

import type { Reminder, ReminderType, ReminderPriority } from './reminders'

const STORAGE_KEY = 'hengzhou-manual-reminders'
const COMPLETED_KEY = 'hengzhou-completed-reminders'

export interface ManualReminderInput {
  title: string
  content: string
  type: ReminderType
  priority: ReminderPriority
  dueDate?: number
  time?: string
}

/** 从 localStorage 读取所有手动提醒 */
export function getManualReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Reminder[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

/** 添加一条手动提醒，返回完整 Reminder 对象 */
export function addManualReminder(input: ManualReminderInput): Reminder {
  const reminder: Reminder = {
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    title: input.title.trim() || '自定义提醒',
    content: input.content.trim(),
    source: 'manual',
    priority: input.priority,
    actionable: true,
    dueDate: input.dueDate,
    time: input.time,
  }

  const existing = getManualReminders()
  existing.push(reminder)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))

  // 触发刷新事件
  window.dispatchEvent(new CustomEvent('hengzhou-reminders-updated'))

  return reminder
}

/** 添加一条自然语言创建的提醒 */
export function addNaturalLanguageReminder(input: ManualReminderInput): Reminder {
  const reminder: Reminder = {
    id: `nl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    title: input.title.trim() || '提醒',
    content: input.content.trim(),
    source: 'nl_input',
    priority: input.priority,
    actionable: true,
    dueDate: input.dueDate,
    time: input.time,
  }

  const existing = getManualReminders()
  existing.push(reminder)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))

  // 触发刷新事件
  window.dispatchEvent(new CustomEvent('hengzhou-reminders-updated'))

  return reminder
}

/** 删除一条手动提醒 */
export function deleteManualReminder(id: string): void {
  const existing = getManualReminders()
  const filtered = existing.filter((r) => r.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))

  window.dispatchEvent(new CustomEvent('hengzhou-reminders-updated'))
}

// === 完成状态持久化 ===

interface CompletedRecord {
  id: string
  completedAt: number
  title: string
  source: string
}

/** 获取已完成的提醒列表 */
export function getCompletedReminders(): CompletedRecord[] {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CompletedRecord[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

/** 获取已完成提醒的 ID 集合 */
export function getCompletedIds(): Set<string> {
  return new Set(getCompletedReminders().map(r => r.id))
}

/** 标记提醒为已完成（不删除，持久化到 localStorage） */
export function completeReminder(reminder: { id: string; title: string; source: string }): void {
  const existing = getCompletedReminders()
  // 避免重复添加
  if (existing.some(r => r.id === reminder.id)) return

  existing.push({
    id: reminder.id,
    completedAt: Date.now(),
    title: reminder.title,
    source: reminder.source,
  })
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(existing))

  // 如果是手动/自然语言提醒，从活跃列表中移除
  const manualReminders = getManualReminders()
  const filtered = manualReminders.filter(r => r.id !== reminder.id)
  if (filtered.length !== manualReminders.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  }

  window.dispatchEvent(new CustomEvent('hengzhou-reminders-updated'))
}

/** 取消完成状态（恢复提醒） */
export function uncompleteReminder(id: string): void {
  const existing = getCompletedReminders()
  const filtered = existing.filter(r => r.id !== id)
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(filtered))

  window.dispatchEvent(new CustomEvent('hengzhou-reminders-updated'))
}

/** 清除所有已完成记录 */
export function clearCompletedReminders(): void {
  localStorage.removeItem(COMPLETED_KEY)
  window.dispatchEvent(new CustomEvent('hengzhou-reminders-updated'))
}

// === 自然语言日期解析 ===

/**
 * 从自然语言文本中解析日期和时间
 * 支持：明天、后天、大后天、周五/星期五、下周一、X月X日、X月X号、
 *       今天/明天 + 下午3点/上午10点/晚上8点、3小时后、后天下午等
 */
export function parseNaturalLanguageDate(text: string): { dueDate?: number; time?: string; cleanTitle: string } {
  let dueDate: number | undefined
  let time: string | undefined
  let cleanTitle = text

  const now = new Date()

  // === 1. 解析"X小时后" / "X分钟后" ===
  const hourMatch = text.match(/(\d+)\s*小时后/)
  if (hourMatch) {
    dueDate = Date.now() + parseInt(hourMatch[1]) * 3600000
    cleanTitle = cleanTitle.replace(hourMatch[0], '').trim()
  }

  const minMatch = text.match(/(\d+)\s*分钟后/)
  if (minMatch) {
    dueDate = Date.now() + parseInt(minMatch[1]) * 60000
    cleanTitle = cleanTitle.replace(minMatch[0], '').trim()
  }

  // === 2. 解析相对日期 ===
  if (!dueDate) {
    const dayMap: Record<string, number> = {
      '今天': 0, '今日': 0,
      '明天': 1, '明日': 1,
      '后天': 2,
      '大后天': 3,
    }

    for (const [keyword, days] of Object.entries(dayMap)) {
      if (text.includes(keyword)) {
        const target = new Date(now)
        target.setDate(target.getDate() + days)
        target.setHours(9, 0, 0, 0) // 默认早上9点
        dueDate = target.getTime()
        cleanTitle = cleanTitle.replace(new RegExp(keyword, 'g'), '').trim()
        break
      }
    }
  }

  // === 3. 解析"周X" / "星期X" / "下周X" ===
  if (!dueDate) {
    const weekdayMap: Record<string, number> = {
      '周一': 1, '星期一': 1, '礼拜一': 1,
      '周二': 2, '星期二': 2, '礼拜二': 2,
      '周三': 3, '星期三': 3, '礼拜三': 3,
      '周四': 4, '星期四': 4, '礼拜四': 4,
      '周五': 5, '星期五': 5, '礼拜五': 5,
      '周六': 6, '星期六': 6, '礼拜六': 6,
      '周日': 0, '星期日': 0, '星期天': 0, '礼拜日': 0, '礼拜天': 0,
    }

    // 检查"下周X"
    const nextWeekMatch = text.match(/下周([一二三四五六日天])/)
    if (nextWeekMatch) {
      const dayChar = nextWeekMatch[1]
      const fullKey = `周${dayChar}` in weekdayMap ? `周${dayChar}` : `星期${dayChar}`
      const targetDay = weekdayMap[fullKey] ?? (dayChar === '日' || dayChar === '天' ? 0 : 0)
      const currentDay = now.getDay()
      let daysUntil = targetDay - currentDay
      if (daysUntil <= 0) daysUntil += 7 // 下周
      daysUntil += 7 // "下周" = 7天后再加偏移
      const target = new Date(now)
      target.setDate(target.getDate() + daysUntil)
      target.setHours(9, 0, 0, 0)
      dueDate = target.getTime()
      cleanTitle = cleanTitle.replace(/下周[一二三四五六日天]/, '').trim()
    } else {
      // 检查"周X" / "星期X"（本周）
      for (const [keyword, targetDay] of Object.entries(weekdayMap)) {
        if (text.includes(keyword)) {
          const currentDay = now.getDay()
          let daysUntil = targetDay - currentDay
          if (daysUntil < 0) daysUntil += 7 // 已过，下周
          if (daysUntil === 0) daysUntil = 0 // 今天
          const target = new Date(now)
          target.setDate(target.getDate() + daysUntil)
          target.setHours(9, 0, 0, 0)
          dueDate = target.getTime()
          cleanTitle = cleanTitle.replace(new RegExp(keyword, 'g'), '').trim()
          break
        }
      }
    }
  }

  // === 4. 解析"X月X日" / "X月X号" ===
  if (!dueDate) {
    const dateMatch = text.match(/(\d{1,2})月(\d{1,2})[日号]/)
    if (dateMatch) {
      const month = parseInt(dateMatch[1])
      const day = parseInt(dateMatch[2])
      const target = new Date(now.getFullYear(), month - 1, day, 9, 0, 0, 0)
      // 如果日期已过，设为明年
      if (target.getTime() < Date.now()) {
        target.setFullYear(target.getFullYear() + 1)
      }
      dueDate = target.getTime()
      cleanTitle = cleanTitle.replace(dateMatch[0], '').trim()
    }
  }

  // === 5. 解析时间（上午/下午/晚上 X点） ===
  const timeMatch = text.match(/(上午|下午|晚上|傍晚|中午)?\s*(\d{1,2})[点时](\d{1,2})?分?/)
  if (timeMatch) {
    let hour = parseInt(timeMatch[2])
    const minute = timeMatch[3] ? parseInt(timeMatch[3]) : 0
    const period = timeMatch[1]

    if (period === '下午' && hour < 12) hour += 12
    if (period === '晚上' && hour < 12) hour += 12
    if (period === '中午' && hour < 12) hour = 12
    if (period === '傍晚' && hour < 12) hour += 18 - hour // 傍晚6点

    time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

    // 如果已有 dueDate，更新时间部分
    if (dueDate) {
      const target = new Date(dueDate)
      target.setHours(hour, minute, 0, 0)
      dueDate = target.getTime()
    } else {
      // 没有日期，默认今天
      const target = new Date(now)
      target.setHours(hour, minute, 0, 0)
      // 如果时间已过，设为明天
      if (target.getTime() < Date.now()) {
        target.setDate(target.getDate() + 1)
      }
      dueDate = target.getTime()
    }

    cleanTitle = cleanTitle.replace(timeMatch[0], '').trim()
  }

  // 清理多余空格和标点
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').replace(/^[，,、\s]+|[，,、\s]+$/g, '').trim()

  return { dueDate, time, cleanTitle }
}

/** 将日期字符串 + 时间字符串转为时间戳 */
export function parseDateTime(dateStr: string, timeStr?: string): number | undefined {
  if (!dateStr) return undefined
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return undefined

  if (timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return new Date(year, month - 1, day, hours || 0, minutes || 0).getTime()
  }
  // 默认设为当天 09:00
  return new Date(year, month - 1, day, 9, 0).getTime()
}

/** 格式化日期为 YYYY-MM-DD（用于 date input 默认值） */
export function formatDateForInput(timestamp?: number): string {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 格式化时间为 HH:MM（用于 time input 默认值） */
export function formatTimeForInput(timestamp?: number): string {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

/** 获取今天的日期字符串，用于 date input 的 min 属性 */
export function getTodayStr(): string {
  return formatDateForInput(Date.now())
}
