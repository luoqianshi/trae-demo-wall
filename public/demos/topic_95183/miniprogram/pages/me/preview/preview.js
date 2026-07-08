const app = getApp();

Page({
  data: {
    user: {
      avatarUrls: [],
      interests: [],
      relationshipGoals: [],
      wantToDo: [],
      cannotDo: []
    }
  },

  onShow() {
    const user = app.globalData.currentUser || wx.getStorageSync('userInfo') || {};
    this.setData({
      user: {
        ...user,
        maskedWechatId: this.maskWechatId(user.wechatId)
      }
    });
  },

  maskWechatId(wechatId) {
    if (!wechatId) return '';
    if (wechatId.length <= 4) return '****';
    return `${wechatId.slice(0, 2)}******${wechatId.slice(-2)}`;
  },

  goEdit() {
    wx.navigateTo({ url: '/pages/me/edit/edit' });
  }
});
