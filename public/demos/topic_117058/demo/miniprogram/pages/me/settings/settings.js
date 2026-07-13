const app = getApp();

Page({
  data: { isPhotoBlur: false },

  onShow() {
    const user = app.globalData.currentUser;
    this.setData({ isPhotoBlur: user ? user.isPhotoBlur : false });
  },

  onBlurChange(e) {
    const user = app.globalData.currentUser;
    if (user) {
      user.isPhotoBlur = e.detail.value;
      wx.setStorageSync('userInfo', user);
    }
  },

  clearSwiped() {
    wx.removeStorageSync('swipedIds');
    wx.showToast({ title: '已清除', icon: 'success' });
  },

  clearCache() {
    wx.clearStorageSync();
    wx.showToast({ title: '已清除', icon: 'success' });
  },

  logout() {
    wx.removeStorageSync('userInfo');
    app.globalData.isLogin = false;
    app.globalData.currentUser = null;
    wx.reLaunch({ url: '/pages/login/index' });
  },

  deleteAccount() {
    wx.showModal({
      title: '注销账号',
      content: '注销后所有数据将被删除，此操作不可恢复。确认注销？',
      confirmColor: '#FF5252',
      success: res => {
        if (res.confirm) {
          wx.clearStorageSync();
          app.globalData.isLogin = false;
          app.globalData.currentUser = null;
          wx.reLaunch({ url: '/pages/login/index' });
        }
      }
    });
  }
});
