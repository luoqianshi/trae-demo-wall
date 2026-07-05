Page({
  data: {
    avatarUrl: '',
    nickName: '',
    recordDays: 0,
    totalRecords: 0
  },

  onShow() {
    this.loadUserInfo()
    this.loadStats()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  loadUserInfo() {
    const app = getApp()
    const cached = app.globalData.userInfo
    if (cached) {
      this.setData({
        avatarUrl: cached.avatarUrl || '',
        nickName: cached.nickName || ''
      })
    }
  },

  loadStats() {
    const app = getApp()
    const records = app.globalData.records
    const uniqueDays = new Set(records.map(r => new Date(r.createdAt).toDateString()))
    this.setData({
      recordDays: uniqueDays.size,
      totalRecords: records.length
    })
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({ avatarUrl })
    this.saveInfo()
  },

  onNicknameInput(e) {
    this.setData({ nickName: e.detail.value })
  },

  onNicknameBlur(e) {
    this.saveInfo()
  },

  saveInfo() {
    const app = getApp()
    app.saveUserInfo({
      avatarUrl: this.data.avatarUrl,
      nickName: this.data.nickName
    })
  },

  goToAiAnalysis() {
    wx.navigateTo({ url: '/pages/ai-analysis/ai-analysis' })
  },

  viewHistory() {
    wx.switchTab({ url: '/pages/trends/trends' })
  },

  exportData() {
    wx.showToast({ title: '导出功能开发中', icon: 'none' })
  },

  clearData() {
    wx.showModal({
      title: '确认清空',
      content: '将删除所有血压记录，此操作不可恢复。',
      confirmText: '确认清空',
      confirmColor: '#B8453C',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          app.clearAllRecords()
          this.loadStats()
          wx.showToast({ title: '数据已清空', icon: 'success' })
        }
      }
    })
  }
})
