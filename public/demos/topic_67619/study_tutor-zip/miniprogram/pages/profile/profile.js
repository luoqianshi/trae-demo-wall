Page({
  data: {
    plan: 'free',
    dailyUsed: 0,
    dailyLimit: 100,
    remaining: 100,
    loading: true
  },

  onShow() {
    this.loadUsage()
  },

  async loadUsage() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'fn-usage',
        data: { action: 'check' }
      })
      if (res.result && res.result.ok) {
        this.setData({
          plan: res.result.plan,
          dailyUsed: res.result.dailyUsed,
          dailyLimit: res.result.dailyLimit || '无限',
          remaining: res.result.remaining
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      this.setData({ loading: false })
    }
  },

  async upgrade() {
    wx.showToast({
      title: '订阅功能 W2 上线',
      icon: 'none'
    })
  }
})
