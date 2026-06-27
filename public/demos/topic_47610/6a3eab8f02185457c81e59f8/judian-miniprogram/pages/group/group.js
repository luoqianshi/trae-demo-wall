Page({
  data: {
    statusBarHeight: 44
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
  },

  onReady() {
  },

  onShow() {
  },

  onHide() {
  },

  onUnload() {
  },

  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  showQRCode() {
    wx.showToast({
      title: '展示二维码',
      icon: 'none'
    });
  },

  goToFillNeed() {
    wx.navigateTo({
      url: '/pages/need/need'
    });
  },

  goToCandidates() {
    wx.navigateTo({
      url: '/pages/filter/filter'
    });
  }
});
