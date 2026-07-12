App({
  globalData: {
    userInfo: null,
    appName: "墨金旅居"
  },
  onLaunch() {
    const logs = wx.getStorageSync("logs") || []
    logs.unshift(Date.now())
    wx.setStorageSync("logs", logs.slice(0, 20))
  }
})
