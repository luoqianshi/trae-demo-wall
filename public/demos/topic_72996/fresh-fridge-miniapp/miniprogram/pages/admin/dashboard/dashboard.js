const Cloud = require('../../../utils/cloud.js')

Page({
  data: {
    loading: true,
    core: {
      totalUsers: 0,
      todayNewUsers: 0,
      totalSubmissions: 0,
      pendingSubmissions: 0,
      totalFoods: 0
    },
    fridge: {
      totalFridge: 0,
      expiredFridge: 0,
      avgFridgePerUser: 0,
      expiryRate: 0
    },
    submissionTrend: [],
    trendMax: 0,
    reminder: {
      reminderOpenRate: 0,
      notificationOn: 0,
      totalUsers: 0
    },
    topFoods: [],
    topMaxScore: 0
  },

  onLoad: function () {
    this.loadDashboard()
  },

  onPullDownRefresh: function () {
    this.loadDashboard().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  loadDashboard: function () {
    this.setData({ loading: true })
    return Cloud.callFunction('adminManager', { action: 'getDashboard' }).then(res => {
      const result = res.data
      if (result && result.success) {
        const data = result.data
        const trendMax = Math.max.apply(null, data.submissionTrend.map(i => i.count).concat([1]))
        const topMaxScore = Math.max.apply(null, data.topFoods.map(i => i.hotScore).concat([1]))

        this.setData({
          core: data.core,
          fridge: data.fridge,
          submissionTrend: data.submissionTrend,
          trendMax,
          reminder: data.reminder,
          topFoods: data.topFoods,
          topMaxScore,
          loading: false
        })
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: (result && result.message) || '加载失败', icon: 'none' })
      }
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  onGoAudit: function () {
    wx.navigateTo({ url: '/pages/admin/audit/audit' })
  },

  onPreviewTopImage: function (e) {
    const { urls, current } = e.currentTarget.dataset
    if (urls && urls.length) {
      wx.previewImage({ current, urls })
    }
  }
})
