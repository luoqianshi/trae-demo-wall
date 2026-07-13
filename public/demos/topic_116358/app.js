App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-d4gxb243yd5142c3c',
        traceUser: true
      })
    }
    this.globalData = {}
  },
  globalData: {}
})