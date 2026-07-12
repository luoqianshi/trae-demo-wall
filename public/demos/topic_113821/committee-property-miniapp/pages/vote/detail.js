const mock = require('../../utils/mock.js')

Page({
  data: {
    detail: null,
    selectedOption: '',
    hasVoted: false
  },

  onLoad(options) {
    const id = options.id
    const detail = mock.getVoteById(id)
    this.setData({ detail })
  },

  selectOption(e) {
    const option = e.currentTarget.dataset.option
    if (this.data.hasVoted || this.data.detail.status !== 'ongoing') return
    this.setData({ selectedOption: option })
  },

  submitVote() {
    if (!this.data.selectedOption) {
      wx.showToast({ title: '请选择表决选项', icon: 'none' })
      return
    }
    wx.showModal({
      title: '确认提交',
      content: `您选择了"${this.data.selectedOption}"，确认提交吗？提交后不可修改。`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '提交中...' })
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({ title: '表决成功', icon: 'success' })
            this.setData({ hasVoted: true })
          }, 800)
        }
      }
    })
  },

  downloadMaterial(e) {
    const name = e.currentTarget.dataset.name
    wx.showToast({ title: `下载 ${name}`, icon: 'none' })
  }
})
