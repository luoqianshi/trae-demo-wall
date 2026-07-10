const app = getApp()

Page({
  data: {
    panoramaUrl: ''
  },

  onLoad() {
    const house = app.globalData.currentHouse
    if (house && house.panorama) {
      // 使用 pannellum 的在线示例作为演示
      this.setData({
        panoramaUrl: house.panorama
      })
    } else {
      wx.showToast({ title: '暂无全景数据', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  }
})
