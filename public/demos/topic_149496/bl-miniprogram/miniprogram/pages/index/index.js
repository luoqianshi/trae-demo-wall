// pages/index/index.js
const app = getApp()
const cloud = require('../../utils/cloud.js')
const util = require('../../utils/util.js')

Page({
  data: {
    userInfo: null,
    creditConfig: {},
    helpList: [],
    idleList: [],
    loading: true,
    community: '',
    locationText: ''
  },

  onShow() {
    // 设置tabbar选中
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }

    // 检查登录状态
    if (!app.globalData.isLogin) {
      this.setData({ loading: false })
      return
    }

    const userInfo = app.globalData.userInfo || {}
    let locationText = '未获取定位'
    if (userInfo.location && userInfo.location.lat) {
      locationText = `${userInfo.location.lat.toFixed(4)}, ${userInfo.location.lng.toFixed(4)}`
    }

    this.setData({
      userInfo,
      community: userInfo.community || '',
      locationText
    })
    this.updateCreditConfig()
    this.loadData()
  },

  updateCreditConfig() {
    if (app.globalData.userInfo) {
      const creditConfig = util.getCreditLevel(app.globalData.userInfo.credit_score || 0)
      this.setData({ creditConfig })
    }
  },

  async loadData() {
    try {
      const userLocation = app.globalData.userInfo && app.globalData.userInfo.location
      const [helpRes, idleRes] = await Promise.all([
        cloud.getList({ type: 'help', page: 1, pageSize: 5, userLocation }),
        cloud.getList({ type: 'idle', page: 1, pageSize: 4, userLocation })
      ])

      const helpList = helpRes.success ? helpRes.list.map(item => ({
        ...item,
        distanceText: util.formatDistance(item.distance),
        typeConfig: util.getHelpTypeConfig(item.type)
      })) : []

      const idleList = idleRes.success ? idleRes.list.map(item => ({
        ...item,
        distanceText: util.formatDistance(item.distance)
      })) : []

      this.setData({
        helpList,
        idleList,
        loading: false
      })
    } catch (err) {
      console.error('加载首页数据失败:', err)
      this.setData({ loading: false })
    }
  },

  // 跳转到互助列表
  goHelp() {
    wx.switchTab({ url: '/pages/help/list/list' })
  },

  // 跳转到闲置列表
  goIdle() {
    wx.switchTab({ url: '/pages/idle/list/list' })
  },

  // 发布互助
  goPublishHelp() {
    if (!app.checkLogin()) return
    wx.navigateTo({ url: '/pages/help/publish/publish' })
  },

  // 发布闲置
  goPublishIdle() {
    if (!app.checkLogin()) return
    wx.navigateTo({ url: '/pages/idle/publish/publish' })
  },

  // 查看互助详情
  goHelpDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/help/detail/detail?id=${id}` })
  },

  // 查看闲置详情
  goIdleDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/idle/detail/detail?id=${id}` })
  },

  // 去登录
  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
