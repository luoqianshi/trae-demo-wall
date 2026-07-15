function formatTime(seconds) {
  if (seconds < 0) seconds = 0
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`
  }
  return `${pad(m)}:${pad(s)}`
}

function formatMinutes(minutes) {
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
}

function pad(n) {
  return n.toString().padStart(2, '0')
}

function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getWeekRange() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: formatDateStr(monday),
    end: formatDateStr(sunday)
  }
}

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: formatDateStr(start),
    end: formatDateStr(end)
  }
}

function formatDateStr(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatDateTime(timestamp) {
  const d = new Date(timestamp)
  return `${formatDateStr(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function generateRoomCode() {
  return Math.random().toString().slice(2, 8)
}

function isToday(dateStr) {
  return dateStr === getToday()
}

function calcLevel(totalMinutes) {
  return Math.max(1, Math.floor(totalMinutes / 600) + 1)
}

function getLevelName(level) {
  const names = ['', '见习专注者', '初级专注者', '中级专注者', '高级专注者', '资深专注者',
    '专注达人', '专注大师', '专注宗师', '专注至尊', '专注之神'
  ]
  return names[Math.min(level, 10)] || '专注之神'
}

function getModeName(mode) {
  const map = {
    pomodoro: '番茄专注',
    selfstudy: '自由自习',
    reading: '阅读模式'
  }
  return map[mode] || '未知模式'
}

function getModeIcon(mode) {
  const map = {
    pomodoro: '🍅',
    selfstudy: '📚',
    reading: '📖'
  }
  return map[mode] || '📝'
}

function parseQueryString() {
  const query = {}
  const search = window.location.search.substring(1)
  const pairs = search.split('&')
  pairs.forEach(pair => {
    const [key, value] = pair.split('=')
    if (key) query[key] = decodeURIComponent(value || '')
  })
  return query
}

function navigateTo(url) {
  window.location.href = url
}

function switchTab(url) {
  window.location.href = url
}

function showToast(title, icon = 'none', duration = 2000) {
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.innerHTML = `<span>${title}</span>`
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), duration)
}

function showModal(options) {
  return new Promise((resolve) => {
    const modal = document.createElement('div')
    modal.className = 'modal-overlay'
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-title">${options.title || ''}</div>
        ${options.editable ? `
          <input type="text" class="modal-input" placeholder="${options.placeholderText || ''}" />
        ` : ''}
        <div class="modal-content">${options.content || ''}</div>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" data-action="cancel">${options.cancelText || '取消'}</button>
          <button class="modal-btn modal-btn-confirm" data-action="confirm">${options.confirmText || '确定'}</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
    
    const input = modal.querySelector('.modal-input')
    const cancelBtn = modal.querySelector('[data-action="cancel"]')
    const confirmBtn = modal.querySelector('[data-action="confirm"]')
    
    const close = (action) => {
      modal.remove()
      resolve({
        confirm: action === 'confirm',
        content: input ? input.value : ''
      })
    }
    
    cancelBtn.addEventListener('click', () => close('cancel'))
    confirmBtn.addEventListener('click', () => close('confirm'))
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close('cancel')
    })
    
    if (input) input.focus()
  })
}

const Util = {
  formatTime,
  formatMinutes,
  pad,
  getToday,
  getWeekRange,
  getMonthRange,
  formatDateStr,
  formatDateTime,
  generateId,
  generateRoomCode,
  isToday,
  calcLevel,
  getLevelName,
  getModeName,
  getModeIcon,
  parseQueryString,
  navigateTo,
  switchTab,
  showToast,
  showModal
}
