App({
  globalData: {
    userInfo: null,
    windowInfo: null,
    deviceInfo: null
  },

  onLaunch() {
    this.globalData.windowInfo = wx.getWindowInfo();
    this.globalData.deviceInfo = wx.getDeviceInfo();

    // 初始化本地存储
    this.initStorage();

    console.log('真探小程序启动');
  },

  initStorage() {
    if (!wx.getStorageSync('zhentan_initialized')) {
      const defaultData = require('./utils/data.js');
      wx.setStorageSync('zhentan_places', defaultData.places);
      wx.setStorageSync('zhentan_reviews', defaultData.reviews);
      wx.setStorageSync('zhentan_user', defaultData.currentUser);
      wx.setStorageSync('zhentan_initialized', true);
    }
  }
});
