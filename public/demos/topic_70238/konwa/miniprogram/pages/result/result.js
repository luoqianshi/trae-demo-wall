const { getMockResult } = require('../../utils/mockData.js')

Page({
  data: {
    result: null,
    expandedId: null
  },

  onLoad(options) {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20
    })

    if (options.data) {
      try {
        const result = JSON.parse(decodeURIComponent(options.data))
        this.setData({ result })
      } catch (e) {
        this.loadMockData()
      }
    } else {
      this.loadMockData()
    }
  },

  loadMockData() {
    const result = getMockResult()
    this.setData({ result })
  },

  toggleExpand(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      expandedId: this.data.expandedId === id ? null : id
    })
  },

  goToAnalysis() {
    const dataStr = encodeURIComponent(JSON.stringify(this.data.result))
    wx.navigateTo({
      url: `/pages/analysis/analysis?data=${dataStr}`
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
