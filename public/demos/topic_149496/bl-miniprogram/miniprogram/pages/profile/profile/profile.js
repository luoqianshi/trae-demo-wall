// pages/profile/profile/profile.js
const app = getApp()
const cloud = require('../../../utils/cloud.js')
const util = require('../../../utils/util.js')

Page({
  data: {
    userInfo: null,
    creditConfig: {},
    nextLevel: null,
    progress: 0,
    loading: true
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 })
    }
    this.loadUserInfo()
  },

  async loadUserInfo() {
    if (!app.globalData.isLogin) {
      this.setData({ loading: false })
      return
    }

    try {
      const res = await cloud.getUserInfo(app.globalData.openid)
      if (res.success) {
        const userInfo = res.user
        app.setUserInfo({ ...userInfo, openid: app.globalData.openid })
        const creditConfig = util.getCreditLevel(userInfo.credit_score || 0)
        const nextLevel = this.getNextLevel(userInfo.credit_score || 0)
        const progress = this.calcProgress(userInfo.credit_score || 0)

        this.setData({ userInfo, creditConfig, nextLevel, progress, loading: false })
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
      this.setData({ loading: false })
    }
  },

  getNextLevel(score) {
    const { CREDIT_LEVELS } = require('../../../utils/constants.js')
    for (let i = 0; i < CREDIT_LEVELS.length; i++) {
      if (score >= CREDIT_LEVELS[i].min && score <= CREDIT_LEVELS[i].max) {
        return CREDIT_LEVELS[i + 1] || null
      }
    }
    return null
  },

  calcProgress(score) {
    const { CREDIT_LEVELS } = require('../../../utils/constants.js')
    for (const level of CREDIT_LEVELS) {
      if (score >= level.min && score <= level.max) {
        return Math.min(100, ((score - level.min) / (level.max - level.min)) * 100)
      }
    }
    return 100
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  goEdit() {
    wx.navigateTo({ url: '/pages/profile/edit/edit' })
  },

  goRecords() {
    wx.navigateTo({ url: '/pages/profile/records/records' })
  },

  // 更新定位
  async updateLocation() {
    const confirm = await util.showConfirm('更新当前位置？发布的信息将使用新位置计算距离')
    if (!confirm) return

    util.showLoading('定位中...')
    try {
      const res = await new Promise((resolve, reject) => {
        wx.getLocation({
          type: 'gcj02',
          success: resolve,
          fail: reject
        })
      })
      const location = { lat: res.latitude, lng: res.longitude }
      const updateRes = await cloud.updateProfile({ location })
      if (updateRes.success) {
        util.hideLoading()
        util.showToast('定位更新成功', 'success')
        this.loadUserInfo()
      } else {
        util.hideLoading()
        util.showToast(updateRes.message || '更新失败')
      }
    } catch (err) {
      util.hideLoading()
      console.error('定位失败:', err)
      if (err.errMsg && err.errMsg.indexOf('auth deny') > -1) {
        util.showToast('请在设置中开启定位权限')
      } else {
        util.showToast('定位失败')
      }
    }
  }
})
