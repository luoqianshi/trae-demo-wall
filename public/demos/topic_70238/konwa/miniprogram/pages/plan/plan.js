const { getMockResult } = require('../../utils/mockData.js')

Page({
  data: {
    result: null,
    plan: null
  },

  onLoad(options) {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20
    })

    if (options.data) {
      try {
        const result = JSON.parse(decodeURIComponent(options.data))
        this.setData({ 
          result,
          plan: result.studyPlan
        })
      } catch (e) {
        this.loadMockData()
      }
    } else {
      this.loadMockData()
    }
  },

  loadMockData() {
    const result = getMockResult()
    this.setData({ 
      result,
      plan: result.studyPlan
    })
  },

  startPractice(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({
      title: '开始练习',
      icon: 'none'
    })
  },

  startToday() {
    wx.showToast({
      title: '开始今日训练',
      icon: 'none'
    })
  },

  goBack() {
    wx.navigateBack()
  },

  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
