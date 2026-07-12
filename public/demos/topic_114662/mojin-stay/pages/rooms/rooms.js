const { rooms } = require("../../utils/mock")

Page({
  data: {
    rooms
  },
  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` })
  },
  addRoom() {
    wx.showToast({ title: "可接入新增房源表单", icon: "none" })
  }
})
