// pages/invite-code/invite-code.js
const app = getApp()

Page({
  data: {
    code: '',
    canVerify: false,
    statusBarHeight: 0,
    navBarHeight: 0
  },

  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 44,
      navBarHeight: app.globalData.navBarHeight || 44
    })
  },

  // 输入处理：自动格式化为 XXXX-XXXX
  onInputCode(e) {
    let value = e.detail.value
    // 去除非字母数字，转大写
    value = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    // 截取前8位
    value = value.substring(0, 8)
    // 格式化 XXXX-XXXX
    let formatted = value
    if (value.length > 4) {
      formatted = value.substring(0, 4) + '-' + value.substring(4)
    }
    this.setData({
      code: formatted,
      canVerify: value.length >= 8
    })
  },

  // 验证入席
  onVerify() {
    if (!this.data.canVerify) return
    wx.showToast({ title: '验证成功', icon: 'success' })
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  // 了解入席码
  onLearnMore() {
    wx.showToast({ title: '功能说明', icon: 'none' })
  },

  // 返回
  onBack() {
    wx.navigateBack()
  }
})
