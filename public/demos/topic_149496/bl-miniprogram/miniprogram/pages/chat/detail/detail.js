// pages/chat/detail/detail.js
const app = getApp()
const cloud = require('../../../utils/cloud.js')
const util = require('../../../utils/util.js')

Page({
  data: {
    sessionId: '',
    toUserId: '',
    toNickname: '',
    itemTitle: '',
    messages: [],
    inputContent: '',
    loading: true,
    sending: false,
    scrollToView: '',
    openid: '',
    otherUser: null,
    myAvatar: '',
    myNickname: '',
    subscription: null
  },

  onLoad(options) {
    const sessionId = options.sessionId || ''
    const toUserId = options.toUserId || ''
    const toNickname = options.toNickname ? decodeURIComponent(options.toNickname) : '邻居'
    const itemTitle = options.itemTitle ? decodeURIComponent(options.itemTitle) : ''

    // 获取当前用户头像和昵称
    const userInfo = app.globalData.userInfo || {}
    const myAvatar = userInfo.avatar || ''
    const myNickname = userInfo.nickname || '我'

    this.setData({
      sessionId,
      toUserId,
      toNickname,
      itemTitle,
      openid: app.globalData.openid || '',
      myAvatar,
      myNickname
    })

    // 导航栏标题：优先显示信息标题，否则显示对方昵称
    wx.setNavigationBarTitle({ title: itemTitle || toNickname })

    if (sessionId) {
      this.loadMessages()
      this.markRead()
      this.subscribeMessages()
    }
  },

  onUnload() {
    // 取消订阅
    if (this.data.subscription) {
      this.data.subscription.close()
      this.setData({ subscription: null })
    }
  },

  // 加载消息列表
  async loadMessages() {
    try {
      const res = await cloud.getMessages({ sessionId: this.data.sessionId })
      if (res.success) {
        const messages = (res.messages || []).map((msg, index) => {
          const formatted = {
            ...msg,
            isMine: msg.from === this.data.openid,
            timeText: util.formatChatTime(msg.create_time)
          }
          // 第一条消息总是显示时间，后续消息与上一条间隔超过5分钟才显示时间
          if (index === 0) {
            formatted.showTime = true
          } else {
            const prevMsg = res.messages[index - 1]
            const prevTime = new Date(prevMsg.create_time)
            const currTime = new Date(msg.create_time)
            const diff = currTime - prevTime
            formatted.showTime = diff > 5 * 60 * 1000
          }
          return formatted
        })

        // 如果会话有关联信息标题且当前没有设置，从session中获取
        let itemTitle = this.data.itemTitle
        if (!itemTitle && res.session && res.session.item_title) {
          itemTitle = res.session.item_title
          wx.setNavigationBarTitle({ title: itemTitle })
        }

        const otherUser = res.otherUser || { nickname: this.data.toNickname }
        this.setData({
          messages,
          otherUser,
          itemTitle,
          loading: false
        })
        this.scrollToBottom()
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载消息失败:', err)
      this.setData({ loading: false })
    }
  },

  // 订阅消息（实时接收）
  subscribeMessages() {
    const db = wx.cloud.database()
    const subscription = db.collection('chat_messages')
      .where({ session_id: this.data.sessionId })
      .watch({
        onChange: (snapshot) => {
          if (snapshot.type === 'init') return
          // 有新消息变更
          this.loadMessages()
          this.markRead()
        },
        onError: (err) => {
          console.error('订阅消息失败:', err)
        }
      })
    this.setData({ subscription })
  },

  // 标记已读
  async markRead() {
    try {
      await cloud.markRead({ sessionId: this.data.sessionId })
    } catch (err) {
      console.error('标记已读失败:', err)
    }
  },

  // 输入消息
  onInput(e) {
    this.setData({ inputContent: e.detail.value })
  },

  // 发送消息
  async onSend() {
    const content = this.data.inputContent.trim()
    if (!content || this.data.sending) return

    this.setData({ sending: true, inputContent: '' })

    try {
      const res = await cloud.sendMessage({
        sessionId: this.data.sessionId,
        toUserId: this.data.toUserId,
        content
      })

      if (res.success) {
        // 如果是新会话，更新sessionId
        if (!this.data.sessionId && res.sessionId) {
          this.setData({ sessionId: res.sessionId })
          this.subscribeMessages()
        }
        // 消息会通过订阅自动刷新，这里也手动刷新一次确保
        this.loadMessages()
      } else {
        util.showToast(res.message || '发送失败')
        // 恢复输入内容
        this.setData({ inputContent: content })
      }
    } catch (err) {
      console.error('发送失败:', err)
      util.handleNetError(err, '发送失败')
      this.setData({ inputContent: content })
    } finally {
      this.setData({ sending: false })
    }
  },

  // 滚动到底部
  scrollToBottom() {
    const messages = this.data.messages
    if (messages.length > 0) {
      const lastId = 'msg-' + (messages.length - 1)
      setTimeout(() => {
        this.setData({ scrollToView: lastId })
      }, 100)
    }
  }
})
