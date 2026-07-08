App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'knowa-dev',
        traceUser: true,
      })
    }

    const systemInfo = wx.getSystemInfoSync()
    this.globalData.statusBarHeight = systemInfo.statusBarHeight || 20
    this.globalData.navBarHeight = 44

    this.globalData = {
      userInfo: null,
      grade: '三年级',
      subject: '数学',
      historyList: [],
      statusBarHeight: systemInfo.statusBarHeight || 20,
      navBarHeight: 44
    }
  },

  globalData: {
    userInfo: null,
    statusBarHeight: 20,
    navBarHeight: 44
  }
})
