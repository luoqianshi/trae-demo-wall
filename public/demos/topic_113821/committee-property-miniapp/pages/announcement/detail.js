const mock = require('../../utils/mock.js')

Page({
  data: {
    detail: null
  },

  onLoad(options) {
    const id = options.id
    const detail = mock.getAnnouncementById(id)
    this.setData({ detail })
    if (detail) {
      wx.setNavigationBarTitle({ title: '公告详情' })
    }
  },

  downloadAttachment(e) {
    const name = e.currentTarget.dataset.name
    wx.showToast({ title: `下载 ${name}`, icon: 'none' })
  }
})
