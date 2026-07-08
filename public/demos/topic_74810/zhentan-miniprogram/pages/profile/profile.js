Page({
  data: {
    user: {},
    nextLevelText: '',
    progressPct: 0
  },

  onLoad() {
    this.loadUserData();
  },

  onShow() {
    this.loadUserData();
  },

  loadUserData() {
    const user = wx.getStorageSync('zhentan_user') || {};
    const reviews = user.reviews || 0;
    
    let nextLevelText = '';
    let progressPct = 0;
    
    if (reviews >= 10) {
      nextLevelText = '已达最高等级';
      progressPct = 100;
    } else if (reviews >= 3) {
      nextLevelText = `还需 ${10 - reviews} 次升级真探`;
      progressPct = (reviews / 10) * 100;
    } else {
      nextLevelText = `还需 ${3 - reviews} 次升级鉴定师`;
      progressPct = (reviews / 3) * 100;
    }

    this.setData({ user, nextLevelText, progressPct });
  },

  goToMyReviews() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  }
});
