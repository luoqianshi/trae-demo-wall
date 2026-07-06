const Cloud = require('../../../utils/cloud.js')
const regionsData = require('../../../data/regions.js')

const PAGE_SIZE = 10

Page({
  data: {
    title: '',
    content: '',
    scope: 'all', // all | region
    selectedProvince: '',
    provinceNames: [],
    provinceIndex: 0,
    // 预览
    previewCount: 0,
    showPreview: false,
    previewing: false,
    sending: false,
    // 历史
    history: [],
    page: 1,
    hasMore: true,
    loadingHistory: false,
    loadingMore: false
  },

  onLoad: function () {
    this.initProvinces()
    this.loadHistory(true)
  },

  onPullDownRefresh: function () {
    this.loadHistory(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadHistory(false)
    }
  },

  initProvinces: function () {
    const provinces = regionsData.getProvinces ? regionsData.getProvinces() : regionsData
    const provinceNames = provinces.map(p => p.name)
    this.setData({ provinceNames })
  },

  onTitleInput: function (e) {
    this.setData({ title: e.detail.value, showPreview: false })
  },

  onContentInput: function (e) {
    this.setData({ content: e.detail.value, showPreview: false })
  },

  onScopeChange: function (e) {
    this.setData({ scope: e.detail.value, showPreview: false })
  },

  onProvinceChange: function (e) {
    const index = Number(e.detail.value)
    this.setData({
      provinceIndex: index,
      selectedProvince: this.data.provinceNames[index],
      showPreview: false
    })
  },

  onPreview: function () {
    if (!this.validateForm()) return

    this.setData({ previewing: true, showPreview: false })
    const region = this.data.scope === 'region'
      ? { province: this.data.selectedProvince }
      : null

    Cloud.callFunction('adminManager', {
      action: 'pushMessage',
      title: this.data.title,
      content: this.data.content,
      scope: this.data.scope,
      region,
      isPreview: true
    }).then(res => {
      const result = res.data
      this.setData({ previewing: false })
      if (result && result.success) {
        this.setData({
          showPreview: true,
          previewCount: result.data.targetCount
        })
      } else {
        wx.showToast({ title: (result && result.message) || '预览失败', icon: 'none' })
      }
    }).catch(() => {
      this.setData({ previewing: false })
      wx.showToast({ title: '预览失败', icon: 'none' })
    })
  },

  validateForm: function () {
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请输入消息标题', icon: 'none' })
      return false
    }
    if (!this.data.content.trim()) {
      wx.showToast({ title: '请输入消息内容', icon: 'none' })
      return false
    }
    if (this.data.scope === 'region' && !this.data.selectedProvince) {
      wx.showToast({ title: '请选择地区', icon: 'none' })
      return false
    }
    return true
  },

  onSend: function () {
    if (!this.validateForm()) return
    if (this.data.sending) return

    const scopeText = this.data.scope === 'all' ? '全部用户' : `${this.data.selectedProvince}地区用户`
    wx.showModal({
      title: '确认推送',
      content: `将推送至${scopeText}，确认发送？`,
      confirmColor: '#FF6B35',
      success: (res) => {
        if (res.confirm) {
          this.doSend()
        }
      }
    })
  },

  doSend: function () {
    this.setData({ sending: true })
    wx.showLoading({ title: '推送中...', mask: true })

    const region = this.data.scope === 'region'
      ? { province: this.data.selectedProvince }
      : null

    Cloud.callFunction('adminManager', {
      action: 'pushMessage',
      title: this.data.title,
      content: this.data.content,
      scope: this.data.scope,
      region,
      isPreview: false
    }).then(res => {
      wx.hideLoading()
      const result = res.data
      this.setData({ sending: false })
      if (result && result.success) {
        wx.showToast({ title: result.message || '推送成功', icon: 'success' })
        this.setData({
          title: '',
          content: '',
          showPreview: false,
          previewCount: 0
        })
        this.loadHistory(true)
      } else {
        wx.showToast({ title: (result && result.message) || '推送失败', icon: 'none' })
      }
    }).catch(() => {
      wx.hideLoading()
      this.setData({ sending: false })
      wx.showToast({ title: '推送失败', icon: 'none' })
    })
  },

  loadHistory: function (reset) {
    if (this.data.loadingHistory) return Promise.resolve()
    const page = reset ? 1 : this.data.page + 1

    if (reset) {
      this.setData({ loadingHistory: true })
    } else {
      this.setData({ loadingMore: true })
    }

    return Cloud.callFunction('adminManager', {
      action: 'getPushHistory',
      page,
      pageSize: PAGE_SIZE
    }).then(res => {
      const result = res.data
      if (result && result.success) {
        const newList = result.data.list
        const history = reset ? newList : [...this.data.history, ...newList]
        this.setData({
          history,
          page,
          hasMore: result.data.hasMore,
          loadingHistory: false,
          loadingMore: false
        })
      } else {
        this.setData({ loadingHistory: false, loadingMore: false })
      }
    }).catch(() => {
      this.setData({ loadingHistory: false, loadingMore: false })
    })
  }
})
