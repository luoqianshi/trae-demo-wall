// pages/meal-list/meal-list.js
const app = getApp()
const { mockMeals } = require('../../utils/data.js')

Page({
  data: {
    statusBarHeight: 0,
    city: '成都',
    meals: [],
    timeFilters: ['全部', '今天', '明天', '本周', '旅行计划'],
    activeTime: 0,
    cuisineFilters: ['川菜', '粤菜', '日料', '烧烤'],
    activeCuisine: -1,
    extraFilters: ['预算', '人数']
  },

  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 44,
      city: app.globalData.currentCity || '成都',
      meals: mockMeals
    })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  // 城市选择
  onTapCity() {
    wx.showActionSheet({
      itemList: ['成都', '北京', '上海', '广州', '深圳'],
      success: (res) => {
        const cities = ['成都', '北京', '上海', '广州', '深圳']
        this.setData({ city: cities[res.tapIndex] })
        app.globalData.currentCity = cities[res.tapIndex]
      }
    })
  },

  // 搜索
  onTapSearch() {
    wx.showToast({ title: '搜索功能开发中', icon: 'none' })
  },

  // 时间筛选
  onTapTimeFilter(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ activeTime: index })
  },

  // 菜系筛选
  onTapCuisineFilter(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ activeCuisine: this.data.activeCuisine === index ? -1 : index })
  },

  // 额外筛选
  onTapExtraFilter(e) {
    const label = e.currentTarget.dataset.label
    wx.showToast({ title: `${label}筛选开发中`, icon: 'none' })
  },

  // 饭局卡片点击
  onTapMealCard(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/meal-detail/meal-detail?id=${id}` })
  },

  // 申请入席
  onTapApply(e) {
    wx.showToast({ title: '申请已发送', icon: 'success' })
  }
})
