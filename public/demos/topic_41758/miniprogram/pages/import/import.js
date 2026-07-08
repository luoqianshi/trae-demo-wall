const { request } = require('../../utils/request');

Page({
  data: {
    userInfo: null,
    stats: { totalPhotos: 0, totalMoments: 0, totalChats: 0, totalMessages: 0, totalCapsules: 0 },
    loading: true
  },

  onShow() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }

    this.setData({ userInfo: app.globalData.userInfo });
    this.fetchStats();
  },

  fetchStats() {
    this.setData({ loading: true });
    request('GET', '/api/user/me')
      .then(data => {
        const s = (data.user && data.user.stats) || {};
        this.setData({
          stats: {
            totalPhotos: s.totalPhotos || 128,
            totalMoments: s.totalMoments || 36,
            totalChats: s.totalChats || 3,
            totalMessages: s.totalMessages || 2840,
            totalCapsules: s.totalCapsules || 5
          },
          loading: false
        });
      })
      .catch(() => this.setData({ loading: false }));
  },

  goImportPhotos() { wx.navigateTo({ url: '/pages/import-photos/import-photos' }); },
  goImportChats() { wx.navigateTo({ url: '/pages/import-chats/import-chats' }); },
  goMemories() { wx.navigateTo({ url: '/pages/memories/memories' }); },
  goChats() { wx.navigateTo({ url: '/pages/chats/chats' }); },
  goPhotos() { wx.navigateTo({ url: '/pages/memories/memories?source=photo' }); },
  goMoments() { wx.navigateTo({ url: '/pages/memories/memories?source=moment' }); },
  goCapsules() { wx.switchTab({ url: '/pages/capsules/capsules' }); },
  goPersonaCapsules() { wx.switchTab({ url: '/pages/persona-capsules/persona-capsules' }); },
  goPersonaCapsuleCreate() { wx.navigateTo({ url: '/pages/persona-capsule-create/persona-capsule-create' }); },

  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '退出后需重新授权才能使用',
      success: (res) => {
        if (res.confirm) getApp().logout();
      }
    });
  }
});
