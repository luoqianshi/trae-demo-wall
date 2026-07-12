const mock = require('../../utils/mock.js')
const app = getApp()

Page({
  data: {
    detail: null,
    currentRole: 'owner',
    showProgressModal: false,
    progressText: ''
  },

  onLoad(options) {
    const id = options.id
    const detail = mock.getWorkOrderById(id)
    this.setData({
      detail,
      currentRole: app.globalData.currentRole
    })
  },

  submitProgress() {
    if (this.data.currentRole === 'property') {
      this.setData({ showProgressModal: true })
    } else {
      wx.showToast({ title: '仅物业人员可操作', icon: 'none' })
    }
  },

  hideProgressModal() {
    this.setData({ showProgressModal: false, progressText: '' })
  },

  onProgressInput(e) {
    this.setData({ progressText: e.detail.value })
  },

  confirmProgress() {
    if (!this.data.progressText.trim()) {
      wx.showToast({ title: '请输入进展说明', icon: 'none' })
      return
    }
    wx.showToast({ title: '进展已提交', icon: 'success' })
    this.setData({ showProgressModal: false, progressText: '' })
  },

  acceptOrder() {
    wx.showToast({ title: '已接单', icon: 'success' })
  },

  assignOrder() {
    wx.showToast({ title: '转派功能开发中', icon: 'none' })
  },

  acceptancePass() {
    wx.showToast({ title: '验收通过', icon: 'success' })
  },

  acceptanceReject() {
    wx.showToast({ title: '已退回', icon: 'none' })
  },

  rateOrder() {
    wx.showToast({ title: '评价功能开发中', icon: 'none' })
  },

  callPhone() {
    if (this.data.detail && this.data.detail.phone) {
      wx.showToast({ title: `拨打 ${this.data.detail.phone}`, icon: 'none' })
    }
  }
})
