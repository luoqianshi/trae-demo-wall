// pages/meal-detail/meal-detail.js
const app = getApp()
const { mockMeals, personalityDetails } = require('../../utils/data.js')

Page({
  data: {
    statusBarHeight: 0,
    meal: null,
    personalityInfo: null,
    seatPercent: 0
  },

  onLoad(options) {
    const id = options.id
    const meal = mockMeals.find(m => m.id === id) || mockMeals[0]
    const personalityInfo = personalityDetails[meal.initiator.personality] || null
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 44,
      meal,
      personalityInfo,
      seatPercent: meal.seats.filled / meal.seats.total * 100
    })
  },

  // 返回
  onTapBack() {
    wx.navigateBack()
  },

  // 分享
  onTapShare() {
    wx.showToast({ title: '分享功能开发中', icon: 'none' })
  },

  // 申请入席
  onTapApply() {
    wx.showToast({ title: '申请已发送', icon: 'success' })
  }
})
