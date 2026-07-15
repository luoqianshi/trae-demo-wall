export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} 分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} 小时` : `${h} 小时 ${m} 分钟`
}

export function formatDate(dateInput: string | number | Date, opts: 'full' | 'simple' | 'with-time' = 'simple'): string {
  const d = typeof dateInput === 'object' ? dateInput : new Date(dateInput)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  if (opts === 'simple') return `${y}-${m}-${day}`
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (opts === 'with-time') return `${m}-${day} ${hh}:${mm}`
  return `${y}年${m}月${day}日 ${hh}:${mm}`
}

export function weekdayZh(dateStr: string): string {
  const d = new Date(dateStr)
  return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
}

export function greetingText(name = '叔叔阿姨'): string {
  const h = new Date().getHours()
  if (h < 6) return `${name}，夜深了，早点休息哦 🌙`
  if (h < 9) return `${name}，早上好呀 ☀️`
  if (h < 12) return `${name}，上午好！`
  if (h < 14) return `${name}，中午好，记得按时吃饭 🍚`
  if (h < 18) return `${name}，下午好！`
  if (h < 22) return `${name}，晚上好！`
  return `${name}，不早啦，少刷会儿手机早点睡 🌃`
}

export function todayText(): string {
  const d = new Date()
  const m = d.getMonth() + 1, day = d.getDate()
  const w = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][d.getDay()]
  return `${d.getFullYear()}年${m}月${day}日 · ${w}`
}

export function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return String(n)
}
