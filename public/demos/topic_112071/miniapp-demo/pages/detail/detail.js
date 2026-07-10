const app = getApp()

Page({
  data: {
    house: {},
    isCollected: false
  },

  onLoad(options) {
    const id = parseInt(options.id)
    const house = app.globalData.houses.find(h => h.id === id)
    if (house) {
      this.setData({ house })
      app.globalData.currentHouse = house
    }
  },

  onVRTap() {
    wx.navigateTo({
      url: '/pages/panorama/panorama'
    })
  },

  onCollectTap() {
    this.setData({ isCollected: !this.data.isCollected })
    wx.showToast({
      title: this.data.isCollected ? '已收藏' : '取消收藏',
      icon: 'none'
    })
  },

  onChatTap() {
    const house = this.data.house
    wx.navigateTo({
      url: `/pages/chat/chat?landlordId=${house.landlordId || 1}&houseId=${house.id}`
    })
  },

  onBookTap() {
    wx.showModal({
      title: '预定房源',
      content: '支付 20 元预定金锁定该房源意向，房东确认后双方可交换联系方式。',
      confirmText: '去支付',
      confirmColor: '#c45d3e',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '支付中...' })
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({ title: '支付成功！', icon: 'success' })
            // 模拟更新房源状态
            const house = this.data.house
            house.status = 'booked'
            this.setData({ house })
          }, 1500)
        }
      }
    })
  }
})
