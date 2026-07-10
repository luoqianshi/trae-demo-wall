const app = getApp()

Page({
  data: {
    messages: [],
    inputValue: '',
    currentHouse: null
  },

  onLoad(options) {
    const houseId = options.houseId ? parseInt(options.houseId) : 1
    const house = app.globalData.houses.find(h => h.id === houseId)
    
    // 从全局数据获取聊天记录
    const msgData = app.globalData.messages.find(m => m.houseId === houseId)
    
    this.setData({
      currentHouse: house,
      messages: msgData ? msgData.chatHistory : []
    })
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value })
  },

  onSend() {
    const content = this.data.inputValue.trim()
    if (!content) return

    const now = new Date()
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`

    const newMsg = {
      id: Date.now(),
      from: 'tenant',
      type: 'text',
      content: content,
      time: timeStr
    }

    const messages = [...this.data.messages, newMsg]
    this.setData({ 
      messages,
      inputValue: ''
    })

    // 模拟房东自动回复
    setTimeout(() => {
      const replies = [
        '好的，您还有其他问题吗？',
        '房子目前还在，随时可以看房',
        '租金可以稍微商量，您预算多少？',
        '小区环境很好，24小时保安',
        '水电费是民用的，比较便宜'
      ]
      const reply = {
        id: Date.now() + 1,
        from: 'landlord',
        type: 'text',
        content: replies[Math.floor(Math.random() * replies.length)],
        time: timeStr
      }
      this.setData({
        messages: [...this.data.messages, reply]
      })
    }, 1500)
  }
})
