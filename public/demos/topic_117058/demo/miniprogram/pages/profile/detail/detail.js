const app = getApp();

Page({
  data: {
    user: { avatarUrls: [], interests: [], wantToDo: [], cannotDo: [] }
  },

  onLoad(options) {
    const user = (app.globalData.recommendUsers || []).find(item => item.userId === options.userId);
    if (user) this.setData({ user: { ...user, maskedWechatId: this.maskWechatId(user.wechatId) } });
  },

  maskWechatId(wechatId) {
    if (!wechatId) return '';
    if (wechatId.length <= 4) return '****';
    return `${wechatId.slice(0, 2)}******${wechatId.slice(-2)}`;
  },

  onPotato() {
    wx.showModal({
      title: '🥔 已投土豆',
      content: `已向 ${this.data.user.nickname} 投出土豆`,
      showCancel: false,
      success: () => wx.navigateBack()
    });
  },

  onPass() {
    wx.navigateBack();
  }
});
