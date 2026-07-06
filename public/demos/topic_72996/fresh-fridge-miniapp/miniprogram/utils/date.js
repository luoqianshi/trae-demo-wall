const DateUtils = {
  formatDate: (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const minute = String(d.getMinutes()).padStart(2, '0')
    const second = String(d.getSeconds()).padStart(2, '0')

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute)
      .replace('ss', second)
  },

  formatTime: (date) => {
    return DateUtils.formatDate(date, 'HH:mm')
  },

  formatDateTime: (date) => {
    return DateUtils.formatDate(date, 'YYYY-MM-DD HH:mm')
  },

  getDaysDiff: (date1, date2) => {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    const diffTime = Math.abs(d2 - d1)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  },

  isExpired: (date) => {
    const d = new Date(date)
    const now = new Date()
    return d < now
  },

  getExpireStatus: (date) => {
    const d = new Date(date)
    const now = new Date()
    const diffDays = DateUtils.getDaysDiff(now, d)

    if (diffDays < 0) return { status: 'expired', days: Math.abs(diffDays) }
    if (diffDays === 0) return { status: 'today', days: 0 }
    if (diffDays <= 3) return { status: 'warning', days: diffDays }
    if (diffDays <= 7) return { status: 'soon', days: diffDays }
    return { status: 'fresh', days: diffDays }
  },

  getExpireStatusText: (date) => {
    const status = DateUtils.getExpireStatus(date)
    switch (status.status) {
      case 'expired':
        return `已过期${status.days}天`
      case 'today':
        return '今天到期'
      case 'warning':
        return `${status.days}天后到期`
      case 'soon':
        return `${status.days}天后到期`
      case 'fresh':
        return `${status.days}天后到期`
      default:
        return ''
    }
  },

  getExpireStatusColor: (date) => {
    const status = DateUtils.getExpireStatus(date)
    switch (status.status) {
      case 'expired':
        return '#F44336'
      case 'today':
        return '#FF6B35'
      case 'warning':
        return '#FFC107'
      case 'soon':
        return '#FFC107'
      case 'fresh':
        return '#4CAF50'
      default:
        return '#999999'
    }
  },

  addDays: (date, days) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
  },

  getWeekDay: (date) => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days[new Date(date).getDay()]
  },

  getSeason: (date) => {
    const month = new Date(date).getMonth() + 1
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'autumn'
    return 'winter'
  },

  getSeasonName: (date) => {
    const season = DateUtils.getSeason(date)
    const names = {
      spring: '春季',
      summer: '夏季',
      autumn: '秋季',
      winter: '冬季'
    }
    return names[season] || ''
  },

  isToday: (date) => {
    const d = new Date(date)
    const now = new Date()
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    )
  },

  isYesterday: (date) => {
    const d = new Date(date)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return (
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate()
    )
  },

  isThisWeek: (date) => {
    const d = new Date(date)
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    return d >= startOfWeek && d <= endOfWeek
  },

  isThisMonth: (date) => {
    const d = new Date(date)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  },

  toTimestamp: (date) => {
    return new Date(date).getTime()
  },

  fromTimestamp: (timestamp) => {
    return new Date(timestamp)
  }
}

module.exports = DateUtils