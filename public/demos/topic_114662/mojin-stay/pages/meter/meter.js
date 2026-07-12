const { meters } = require("../../utils/mock")

Page({
  data: {
    meters,
    form: {
      waterEnd: "",
      electricEnd: ""
    }
  },
  input(e) {
    this.setData({ [`form.${e.currentTarget.dataset.key}`]: e.detail.value })
  },
  scan() {
    wx.showToast({ title: "可接入拍照识别", icon: "none" })
  },
  save() {
    wx.showToast({ title: "读数已保存", icon: "success" })
  }
})
