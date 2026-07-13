// pages/home/home.js
const app = getApp()
const { mockMeals } = require('../../utils/data.js')

Page({
  data: {
    userState: 'seated', // guest | tested | seated
    city: '成都',
    userInfo: {},
    meals: [],
    recommendations: [],
    hotMeals: [],
    myMeal: null,
    filterPills: ['全部', '火锅', '川菜', '粤菜', '日料', '烧烤'],
    activeFilter: 0,
    statusBarHeight: 0,
    // 食人格数据
    personalityInfo: null
  },

  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 44,
      userInfo: app.globalData.userInfo,
      userState: app.globalData.userState,
      city: app.globalData.currentCity,
      meals: mockMeals,
      recommendations: mockMeals.slice(0, 2),
      hotMeals: mockMeals.slice(2),
      myMeal: mockMeals[0],
      personalityInfo: app.globalData.personalityTypes[app.globalData.userInfo.personality]
    })
  },

  onShow() {
    // 同步用户状态
    this.setData({
      userState: app.globalData.userState,
      userInfo: app.globalData.userInfo
    })
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
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

  // 通知铃铛
  onTapNotification() {
    wx.switchTab({ url: '/pages/messages/messages' })
  },

  // 食人格卡片点击
  onTapPersonality() {
    wx.navigateTo({ url: '/pages/personality-result/personality-result' })
  },

  // 发起饭局
  onTapCreateMeal() {
    wx.navigateTo({ url: '/pages/meal-create/meal-create' })
  },

  // 输入入席码
  onTapInviteCode() {
    wx.navigateTo({ url: '/pages/invite-code/invite-code' })
  },

  // 开始食人格测试
  onStartTest() {
    wx.navigateTo({ url: '/pages/personality-quiz/personality-quiz' })
  },

  // 查看全部推荐
  onTapSeeAllRecommend() {
    wx.switchTab({ url: '/pages/meal-list/meal-list' })
  },

  // 查看全部饭局
  onTapSeeAllMeals() {
    wx.switchTab({ url: '/pages/meal-list/meal-list' })
  },

  // 饭局卡片点击
  onTapMealCard(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/meal-detail/meal-detail?id=${id}` })
  },

  // 即将开始的饭局点击
  onTapUpcomingMeal() {
    wx.navigateTo({ url: '/pages/meal-detail/meal-detail?id=meal_001' })
  },

  // 筛选pill点击
  onTapFilter(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ activeFilter: index })
  },

  // 申请入席
  onTapApply(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: '申请已发送', icon: 'success' })
  },

  // 切换状态 (用于演示)
  switchState(e) {
    const state = e.currentTarget.dataset.state
    app.setUserState(state)
    this.setData({ userState: state })
  }
})
