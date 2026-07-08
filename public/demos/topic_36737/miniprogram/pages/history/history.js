const api = require('../../utils/api')

const app = getApp()

function getBaseUrl() {
  return (app.globalData && app.globalData.baseUrl) || 'http://127.0.0.1:8001'
}

function withBaseUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const baseUrl = getBaseUrl().replace(/\/$/, '')
  const path = String(url).startsWith('/') ? url : `/${url}`
  return `${baseUrl}${path}`
}

function toPageAssetPath(url) {
  let path = String(url || '').trim().replace(/\\/g, '/')
  if (!path) return ''
  if (/^(\.\/|\.\.\/)/.test(path)) return path
  path = path.replace(/^\/+/, '')
  if (path.startsWith('miniprogram/')) {
    path = path.slice('miniprogram/'.length)
  }
  return `../../${path}`
}

function normalizeImageUrl(url) {
  const value = String(url || '').trim()
  if (!value) return ''

  const localFromHttp = value.match(/^https?:\/\/[^/]+\/((?:static|assets)\/.+)$/i)
  if (localFromHttp) {
    return toPageAssetPath(localFromHttp[1])
  }

  if (/^(https?:|wxfile:|cloud:|data:|blob:)/i.test(value)) {
    return value
  }

  return toPageAssetPath(value)
}

function toArray(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      return []
    }
  }
  return []
}

function truncateText(text, maxLength) {
  const value = String(text || '').trim()
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength)}...`
}

function formatPrice(value) {
  const price = Number(value || 0)
  return Number.isInteger(price) ? String(price) : price.toFixed(1)
}

function formatTime(value) {
  if (!value) return '刚刚'

  const raw = String(value)
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const date = new Date(normalized)

  if (Number.isNaN(date.getTime())) {
    return raw.slice(0, 16)
  }

  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${month}月${day}日 ${hour}:${minute}`
}

function normalizeDish(dish = {}) {
  const imageUrl = normalizeImageUrl(dish.image_url)
  return {
    ...dish,
    name: dish.name || '粤菜',
    priceText: formatPrice(dish.price),
    image_url: imageUrl,
    tags: Array.isArray(dish.tags) ? dish.tags : [],
    reason: dish.reason || dish.description || dish.features || '符合本次口味与预算需求。'
  }
}

function normalizeRecord(record = {}, index) {
  const dishes = toArray(record.recommended_dishes).map(normalizeDish)
  const total = Number(record.total_price || dishes.reduce((sum, dish) => sum + Number(dish.price || 0), 0))
  const id = record.id || `${record.created_at || Date.now()}-${index}`
  const summary = truncateText(record.user_input || '本次点餐推荐', 30)

  return {
    id,
    createdAtText: formatTime(record.created_at),
    userInput: record.user_input || '',
    summary,
    dishes,
    visibleDishes: dishes.slice(0, 3),
    hiddenDishCount: Math.max(dishes.length - 3, 0),
    totalPriceText: formatPrice(total),
    expanded: false
  }
}

function extractRecords(result) {
  if (Array.isArray(result)) return result
  if (result && Array.isArray(result.records)) return result.records
  if (result && Array.isArray(result.items)) return result.items
  if (result && Array.isArray(result.data)) return result.data
  return []
}

Page({
  data: {
    records: [],
    loading: true,
    pageReady: false,
    errorText: ''
  },

  onShow() {
    this.loadHistory()
  },

  onPullDownRefresh() {
    this.loadHistory({ refreshing: true })
  },

  async loadHistory(options = {}) {
    if (!options.refreshing) {
      this.setData({
        loading: true,
        errorText: ''
      })
    }

    try {
      const result = await api.get('/api/history?limit=20')
      const records = extractRecords(result).map(normalizeRecord)

      this.setData({
        records,
        loading: false,
        pageReady: true,
        errorText: ''
      })
    } catch (error) {
      this.setData({
        loading: false,
        pageReady: true,
        errorText: '历史记录暂时加载失败，请稍后再试'
      })
    } finally {
      if (options.refreshing) {
        wx.stopPullDownRefresh()
      }
    }
  },

  toggleRecord(event) {
    const id = event.currentTarget.dataset.id
    const records = this.data.records.map((record) => {
      if (String(record.id) !== String(id)) return record
      return {
        ...record,
        expanded: !record.expanded
      }
    })

    this.setData({ records })
  },

  onHistoryOrder(event) {
    const id = event.currentTarget.dataset.id
    const records = this.data.records.map((record) => {
      if (String(record.id) !== String(id)) return record
      return { ...record, ordered: true }
    })
    this.setData({ records })
    wx.showToast({ title: '下单成功！', icon: 'success' })
  },

  goChat() {
    wx.switchTab({
      url: '/pages/chat/chat'
    })
  }
})
