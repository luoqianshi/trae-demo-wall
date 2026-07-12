const mock = require('../../utils/mock.js')

Page({
  data: {
    detail: null,
    showVote: false,
    selectedOption: ''
  },

  onLoad(options) {
    const id = options.id
    const detail = mock.getIssueById(id)
    this.setData({ detail })
  },

  downloadMaterial(e) {
    const name = e.currentTarget.dataset.name
    wx.showToast({ title: `下载 ${name}`, icon: 'none' })
  },

  goToOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/work-order/detail?id=${id}` })
  },

  submitFeedback() {
    wx.showToast({ title: '意见提交功能开发中', icon: 'none' })
  },

  showVoteModal() {
    this.setData({ showVote: true })
  },

  hideVoteModal() {
    this.setData({ showVote: false, selectedOption: '' })
  },

  selectOption(e) {
    const option = e.currentTarget.dataset.option
    this.setData({ selectedOption: option })
  },

  submitVote() {
    if (!this.data.selectedOption) {
      wx.showToast({ title: '请选择表决选项', icon: 'none' })
      return
    }
    wx.showToast({ title: '表决成功', icon: 'success' })
    this.setData({ showVote: false, selectedOption: '' })
  }
})
