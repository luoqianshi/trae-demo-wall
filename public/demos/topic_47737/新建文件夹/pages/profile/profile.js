// pages/profile/profile.js
const app = getApp();

Page({
  data: {
    activeTab: 'history',
    historyList: [],
    favoritesList: [],
    historyCount: 0,
    favoritesCount: 0
  },

  onShow() {
    this.loadData();
  },

  onLoad() {
    this.loadData();
  },

  loadData() {
    const history = app.globalData.planHistory || wx.getStorageSync('planHistory') || [];
    const favorites = app.globalData.favorites || wx.getStorageSync('favorites') || [];
    
    this.setData({
      historyList: history,
      favoritesList: favorites,
      historyCount: history.length,
      favoritesCount: favorites.length
    });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    let plan;
    
    if (this.data.activeTab === 'history') {
      plan = this.data.historyList.find(p => p.id === id);
    } else {
      plan = this.data.favoritesList.find(p => p.id === id);
    }
    
    if (plan) {
      app.globalData.currentPlan = plan;
      wx.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      });
    }
  },

  toggleFavorite(e) {
    const id = e.currentTarget.dataset.id;
    const plan = this.data.favoritesList.find(p => p.id === id);
    if (plan) {
      app.toggleFavorite(plan);
      this.loadData();
      wx.showToast({
        title: '已取消收藏',
        icon: 'none'
      });
    }
  },

  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  goBudget() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  showAbout() {
    wx.showModal({
      title: '关于心情派对规划师',
      content: '版本：1.0.0\n\n一款面向朋友聚会、情侣约会和小型休闲活动场景的AI派对规划助手。\n\n让聚会不再纠结，让快乐更简单！🎉',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#FF6B6B'
    });
  }
});
