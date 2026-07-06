const app = getApp()
const Cloud = require('../../utils/cloud.js')
const Storage = require('../../utils/storage.js')

Page({
  data: {
    seasonal: true,
    expiry: true,
    overstock: true,
    hasPrefs: false,
    prefsId: null,
    loading: true,
    saving: false
  },

  onLoad: function (options) {
    this.loadSettings()
  },

  loadSettings: function () {
    const userId = app.globalData.userInfo && app.globalData.userInfo.openid
    const fallbackOpenid = Storage.getOpenid()
    const targetId = userId || fallbackOpenid

    if (!targetId) {
      this.setData({ loading: false })
      return
    }

    Cloud.query('userPreferences', { userId: targetId }).then(res => {
      if (res.success && res.data && res.data.length > 0) {
        const prefs = res.data[0]
        const ns = prefs.notificationSettings || {}
        this.setData({
          hasPrefs: true,
          prefsId: prefs._id,
          seasonal: ns.seasonal !== false,
          expiry: ns.expiry !== false,
          overstock: ns.overstock !== false,
          loading: false
        })
      } else {
        this.setData({ loading: false })
      }
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  onToggleSeasonal: function (e) {
    this.setData({ seasonal: e.detail.value })
    this.saveSettings()
  },

  onToggleExpiry: function (e) {
    this.setData({ expiry: e.detail.value })
    this.saveSettings()
  },

  onToggleOverstock: function (e) {
    this.setData({ overstock: e.detail.value })
    this.saveSettings()
  },

  saveSettings: function () {
    if (this.data.saving) return
    this.setData({ saving: true })

    const userId = app.globalData.userInfo && app.globalData.userInfo.openid
    const fallbackOpenid = Storage.getOpenid()
    const targetId = userId || fallbackOpenid

    if (!targetId) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      this.setData({ saving: false })
      return
    }

    const notificationSettings = {
      seasonal: this.data.seasonal,
      expiry: this.data.expiry,
      overstock: this.data.overstock
    }

    wx.showLoading({ title: '保存中...' })

    const doSave = (id) => {
      if (id) {
        return Cloud.update('userPreferences', id, {
          notificationSettings,
          updateTime: new Date()
        })
      }
      return Cloud.add('userPreferences', {
        userId: targetId,
        notificationSettings,
        favoriteCategories: [],
        tastePreferences: [],
        createTime: new Date(),
        updateTime: new Date()
      })
    }

    doSave(this.data.prefsId).then((addResult) => {
      wx.hideLoading()
      this.setData({ saving: false, hasPrefs: true })

      if (!this.data.prefsId && addResult && addResult.data) {
        this.setData({ prefsId: addResult.data._id })
      }

      const cached = Storage.getUserPreferences()
      Storage.setUserPreferences({
        ...(cached || {}),
        notificationSettings
      })

      wx.showToast({ title: '已保存', icon: 'success' })
    }).catch(() => {
      wx.hideLoading()
      this.setData({ saving: false })
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  }
})
