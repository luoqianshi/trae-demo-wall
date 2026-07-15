// ===== 工具函数 =====
const Util = {
  // 时间格式化：刚刚/几分钟前/几小时前/昨天/日期
  timeAgo(timestamp) {
    if (!timestamp) return '未知'
    const now = Date.now()
    const diff = now - timestamp
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour

    if (diff < minute) return '刚刚'
    if (diff < hour) return Math.floor(diff / minute) + '分钟前'
    if (diff < day) return Math.floor(diff / hour) + '小时前'
    if (diff < 2 * day) return '昨天'
    if (diff < 7 * day) return Math.floor(diff / day) + '天前'
    const d = new Date(timestamp)
    return (d.getMonth() + 1) + '月' + d.getDate() + '日'
  },

  // 格式化日期 yyyy-MM-dd
  formatDate(timestamp) {
    if (!timestamp) return ''
    const d = new Date(timestamp)
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
  },

  // 计算两点距离（米）
  getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000 // 地球半径（米）
    const toRad = (deg) => deg * Math.PI / 180
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
  },

  // 格式化距离
  formatDistance(meters) {
    if (meters < 1000) return meters + 'm'
    return (meters / 1000).toFixed(1) + 'km'
  },

  // 生成唯一 ID
  genId(prefix = 'id') {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
  },

  // 显示 Toast 提示
  toast(message, duration = 2000) {
    const el = document.createElement('div')
    el.className = 'toast'
    el.textContent = message
    document.body.appendChild(el)
    setTimeout(() => el.classList.add('show'), 10)
    setTimeout(() => {
      el.classList.remove('show')
      setTimeout(() => el.remove(), 300)
    }, duration)
  },

  // 显示加载中
  showLoading(message = '加载中...') {
    let el = document.getElementById('global-loading')
    if (!el) {
      el = document.createElement('div')
      el.id = 'global-loading'
      el.className = 'loading-overlay'
      el.innerHTML = `<div class="loading-spinner"></div><div class="loading-text">${message}</div>`
      document.body.appendChild(el)
    }
    el.style.display = 'flex'
  },

  // 隐藏加载中
  hideLoading() {
    const el = document.getElementById('global-loading')
    if (el) el.style.display = 'none'
  },

  // 图片压缩（Base64 → 压缩 Base64）
  compressImage(file, maxSize = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          let { width, height } = img
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height * maxSize) / width
              width = maxSize
            } else {
              width = (width * maxSize) / height
              height = maxSize
            }
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
        img.onerror = reject
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  },

  // 生成随机昵称
  randomNickname() {
    const adjectives = ['爱心', '温暖', '善良', '勇敢', '快乐', '温柔', '活泼', '安静']
    const animals = ['猫猫', '狗狗', '兔兔', '熊熊', '鸟鸟', '鱼鱼', '鹿鹿']
    return adjectives[Math.floor(Math.random() * adjectives.length)] +
           animals[Math.floor(Math.random() * animals.length)]
  },

  // 计算生日倒计时
  daysUntilBirthday(birthday) {
    if (!birthday) return null
    const now = new Date()
    const birth = new Date(birthday)
    let next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
    if (next < now) {
      next = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate())
    }
    return Math.ceil((next - now) / 86400000)
  },

  // 获取等级
  getLevel(friendly) {
    if (friendly >= 5000) return 'Lv.5 爱心大使'
    if (friendly >= 2000) return 'Lv.4 爱心达人'
    if (friendly >= 800) return 'Lv.3 爱心志愿者'
    if (friendly >= 200) return 'Lv.2 爱心行动派'
    return 'Lv.1 爱心新人'
  }
}
