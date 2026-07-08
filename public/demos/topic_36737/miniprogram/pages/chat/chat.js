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

function normalizeDish(dish) {
  const name = dish.name || '粤菜'
  const imageUrl = normalizeImageUrl(dish.image_url)

  return {
    ...dish,
    name,
    image_url: imageUrl,
    tags: Array.isArray(dish.tags) ? dish.tags : [],
    price: Number(dish.price || 0)
  }
}

function makeMessage(type, content, extra = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    content,
    ...extra
  }
}

Page({
  data: {
    inputValue: '',
    messages: [],
    thinking: false,
    thinkingText: '小助手正在努力执行中...',
    scrollIntoView: '',
    baseUrl: getBaseUrl()
  },

  onLoad() {
    this.addMessage(makeMessage(
      'ai',
      '你好，我是你的粤菜点餐助手。告诉我人数、口味、预算或想吃的菜，我来帮你搭配。'
    ))
  },

  onInput(event) {
    this.setData({
      inputValue: event.detail.value
    })
  },

  async onSend() {
    const text = this.data.inputValue.trim()

    if (!text || this.data.thinking) {
      return
    }

    this.addMessage(makeMessage('user', text))
    this.setData({
      inputValue: '',
      thinking: true,
      thinkingText: '小助手正在努力执行中...'
    }, () => this.scrollToBottom())

    // 分阶段切换提示文案
    this._thinkingTimer1 = setTimeout(() => {
      if (this.data.thinking) {
        this.setData({ thinkingText: '已找到推荐菜品，正在组织回复...' }, () => this.scrollToBottom())
      }
    }, 2000)

    try {
      const result = await api.post('/api/recommend', {
        user_input: text
      })
      const dishes = Array.isArray(result.recommended_dishes)
        ? result.recommended_dishes.map(normalizeDish)
        : []
      const totalPrice = Number(
        result.total_price || dishes.reduce((sum, dish) => sum + dish.price, 0)
      )

      this.addMessage(makeMessage(
        'ai',
        result.summary || '已根据你的需求推荐粤菜组合。',
        {
          dishes,
          totalPrice
        }
      ))
    } catch (error) {
      this.addMessage(makeMessage(
        'ai',
        '推荐暂时失败，请稍后再试，或换一种说法告诉我你的需求。'
      ))
    } finally {
      clearTimeout(this._thinkingTimer1)
      this.setData({
        thinking: false,
        thinkingText: '小助手正在努力执行中...'
      }, () => this.scrollToBottom())
    }
  },

  onOrder(event) {
    const msgId = event.currentTarget.dataset.msgId
    const messages = this.data.messages.map(msg => {
      if (msg.id === msgId) {
        return { ...msg, ordered: true }
      }
      return msg
    })
    this.setData({ messages })
    wx.showToast({ title: '下单成功！', icon: 'success' })
  },

  addMessage(message) {
    this.setData({
      messages: this.data.messages.concat(message)
    }, () => this.scrollToBottom())
  },

  scrollToBottom() {
    if (this.data.thinking) {
      this.setData({
        scrollIntoView: 'thinking-indicator'
      })
      return
    }

    if (!this.data.messages.length) return

    const lastMessage = this.data.messages[this.data.messages.length - 1]
    this.setData({
      scrollIntoView: `message-${lastMessage.id}`
    })
  }
})
