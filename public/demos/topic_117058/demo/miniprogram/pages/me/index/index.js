const app = getApp();

Page({
  data: {
    user: {},
    isMember: false,
    likedMeCount: 3,
    visitorCount: 8,
    vipText: '无限滑动 · Super Like · 查看谁给我投了土豆',
    stats: { potatoes: 12, matches: 3, chats: 28 }
  },

  onShow() {
    const user = app.globalData.currentUser || wx.getStorageSync('userInfo');
    if (!user) {
      wx.redirectTo({ url: '/pages/login/index' });
      return;
    }
    app.globalData.currentUser = user;
    app.globalData.userInfo = user;
    const isMember = user.memberType !== 'none' && user.memberExpireAt && new Date(user.memberExpireAt) > new Date();
    this.setData({
      user,
      isMember,
      vipText: isMember ? `有效期至 ${this.formatDate(user.memberExpireAt)}` : '无限滑动 · Super Like · 查看谁给我投了土豆'
    });
  },

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  goToEdit() { wx.navigateTo({ url: '/pages/me/edit/edit' }); },
  quickFillWechat() {
    wx.getClipboardData({
      success: res => {
        const text = (res.data || '').trim();
        if (!text) {
          wx.showModal({
            title: '填写微信号',
            content: '微信不开放直接授权读取微信号，请复制你的微信号后点这里快速填写，或去编辑资料手动填写。',
            confirmText: '去填写',
            success: modalRes => {
              if (modalRes.confirm) this.goToEdit();
            }
          });
          return;
        }
        const user = app.globalData.currentUser || wx.getStorageSync('userInfo') || {};
        user.wechatId = text;
        app.globalData.currentUser = user;
        app.globalData.userInfo = user;
        wx.setStorageSync('userInfo', user);
        this.setData({ user });
        wx.showToast({ title: '微信号已填写', icon: 'success' });
      },
      fail: () => this.goToEdit()
    });
  },
  goToPreview() { wx.navigateTo({ url: '/pages/me/preview/preview' }); },
  goToVip() { wx.navigateTo({ url: '/pages/vip/index' }); },
  goToSettings() { wx.navigateTo({ url: '/pages/me/settings/settings' }); },
  goToMoments() { wx.navigateTo({ url: '/pages/me/moments/moments' }); },
  goToVisitors() { wx.navigateTo({ url: '/pages/me/visitors/visitors' }); },

  goToLikes() {
    if (!this.data.isMember) {
      wx.showModal({
        title: '会员专属',
        content: '查看“谁给我投了土豆”需要开通会员',
        confirmText: '去开通',
        success: res => {
          if (res.confirm) wx.navigateTo({ url: '/pages/vip/index' });
        }
      });
      return;
    }
    wx.navigateTo({ url: '/pages/match/likes/likes' });
  }
});
