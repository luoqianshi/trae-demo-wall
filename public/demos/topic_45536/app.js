App({
  globalData: {
    apiBase: 'http://192.168.124.11:3000/api',
    token: null,
    userInfo: null,
    currentGroup: null,
    groups: []
  },

  onLaunch() {
    console.log('小程序启动')
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
    }
  }
})
