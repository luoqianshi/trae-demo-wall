function formatTime(date) {
  if (typeof date === 'string') {
    return date
  }
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  return `${year}-${formatNumber(month)}-${formatNumber(day)} ${formatNumber(hour)}:${formatNumber(minute)}`
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function getStatusText(status) {
  const map = {
    draft: '草稿',
    collecting: '意见征集中',
    voting: '待表决',
    processing: '处理中',
    waiting_acceptance: '待验收',
    acceptance: '待验收',
    completed: '已完成',
    archived: '已归档',
    terminated: '已终止',
    pending: '待处理',
    dispatched: '已派单',
    overdue: '已超时'
  }
  return map[status] || status
}

function getStatusClass(status) {
  const map = {
    draft: 'tag-muted',
    collecting: '',
    voting: 'tag-warn',
    processing: '',
    waiting_acceptance: 'tag-warn',
    acceptance: 'tag-warn',
    completed: '',
    archived: 'tag-muted',
    terminated: 'tag-danger',
    pending: 'tag-warn',
    dispatched: '',
    overdue: 'tag-danger'
  }
  return map[status] || ''
}

module.exports = {
  formatTime,
  getStatusText,
  getStatusClass
}
