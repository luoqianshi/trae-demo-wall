// utils/util.js - 工具函数

// 格式化时间
function formatTime(date) {
  if (!date) return ''
  if (typeof date === 'string') date = new Date(date)
  if (typeof date === 'number') date = new Date(date)

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()

  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

// 相对时间（刚刚、x分钟前、x小时前、x天前）
function timeAgo(date) {
  if (!date) return ''
  if (typeof date === 'string') date = new Date(date)
  if (typeof date === 'number') date = new Date(date)

  const now = new Date()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return minutes + '分钟前'
  if (hours < 24) return hours + '小时前'
  if (days < 7) return days + '天前'
  return formatTime(date).split(' ')[0]
}

// 格式化日期（仅日期）
function formatDate(date) {
  if (!date) return ''
  if (typeof date === 'string') date = new Date(date)
  if (typeof date === 'number') date = new Date(date)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return [year, month, day].map(formatNumber).join('-')
}

// 显示提示
function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({ title, icon, duration })
}

function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true })
}

function hideLoading() {
  wx.hideLoading()
}

// 显示模态框
function showConfirm(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success(res) {
        resolve(res.confirm)
      }
    })
  })
}

// 统一网络错误处理：根据错误信息返回友好的提示文案
function handleNetError(err, defaultMsg = '操作失败') {
  console.error(defaultMsg + ':', err)
  let msg = defaultMsg
  if (err && err.errMsg) {
    if (err.errMsg.indexOf('timeout') > -1) {
      msg = '请求超时，请检查网络后重试'
    } else if (err.errMsg.indexOf('fail') > -1 || err.errMsg.indexOf('network') > -1) {
      msg = '网络连接失败，请检查网络设置'
    }
  } else if (err && err.message && err.message.indexOf('cloud function') > -1) {
    msg = '服务暂时不可用，请稍后重试'
  }
  showToast(msg)
  return msg
}

// 复制到剪贴板
function copyToClipboard(data) {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data: String(data),
      success() {
        resolve(true)
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

// 根据积分获取信用等级
function getCreditLevel(score) {
  if (score >= 501) return { level: '社区之星', color: '#FAAD14', icon: '👑', gradient: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)' }
  if (score >= 201) return { level: '邻里达人', color: '#722ED1', icon: '🏆', gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' }
  if (score >= 101) return { level: '活跃邻居', color: '#1890FF', icon: '⭐', gradient: 'linear-gradient(135deg, #4FACFE 0%, #00C6FB 100%)' }
  if (score >= 51) return { level: '热心邻居', color: '#52C41A', icon: '🌿', gradient: 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)' }
  return { level: '新邻居', color: '#A0AEC0', icon: '🌱', gradient: 'linear-gradient(135deg, #A0AEC0 0%, #CBD5E0 100%)' }
}

// 根据值获取类型配置
function getHelpTypeConfig(type) {
  const { HELP_TYPES } = require('./constants')
  return HELP_TYPES.find(t => t.value === type) || HELP_TYPES[4]
}

function getCategoryConfig(category) {
  const { IDLE_CATEGORIES } = require('./constants')
  return IDLE_CATEGORIES.find(c => c.value === category) || IDLE_CATEGORIES[5]
}

// 防抖
function debounce(fn, delay = 500) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 校验手机号
function isPhone(value) {
  return /^1[3-9]\d{9}$/.test(value)
}

// 校验微信号
function isWechat(value) {
  return /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/.test(value)
}

// Haversine公式计算两点间距离（公里）
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 格式化距离显示
function formatDistance(km) {
  if (km === null || km === undefined) return ''
  if (km < 1) return Math.round(km * 1000) + 'm'
  return km.toFixed(1) + 'km'
}

// 格式化聊天时间（今天显示时分，昨天显示"昨天 时分"，一周内显示星期几，更早显示日期）
function formatChatTime(date) {
  if (!date) return ''
  if (typeof date === 'string') date = new Date(date)
  if (typeof date === 'number') date = new Date(date)

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today - msgDate) / (24 * 60 * 60 * 1000))

  const time = [date.getHours(), date.getMinutes()].map(formatNumber).join(':')

  if (diffDays === 0) {
    return time
  } else if (diffDays === 1) {
    return '昨天 ' + time
  } else if (diffDays < 7) {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekDays[date.getDay()] + ' ' + time
  } else {
    return [date.getMonth() + 1, date.getDate()].map(formatNumber).join('-') + ' ' + time
  }
}

module.exports = {
  formatTime,
  formatNumber,
  timeAgo,
  formatDate,
  showToast,
  showLoading,
  hideLoading,
  showConfirm,
  handleNetError,
  copyToClipboard,
  getCreditLevel,
  getHelpTypeConfig,
  getCategoryConfig,
  debounce,
  isPhone,
  isWechat,
  calcDistance,
  formatDistance,
  formatChatTime
}
