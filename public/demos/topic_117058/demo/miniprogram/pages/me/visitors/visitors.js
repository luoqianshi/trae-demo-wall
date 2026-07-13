const app = getApp();

Page({
  data: {
    isMember: false,
    visitors: []
  },

  onShow() {
    const user = app.globalData.currentUser || {};
    const isMember = user.memberType !== 'none' && user.memberExpireAt && new Date(user.memberExpireAt) > new Date();
    this.setData({
      isMember,
      visitors: [
        { userId: 'v001', nickname: '奶油拿铁', identity: 'prince', age: 27, city: '上海', avatar: '#F8BBD0', timeText: '刚刚看过你' },
        { userId: 'v002', nickname: '海盐焦糖', identity: 'prince', age: 29, city: '杭州', avatar: '#B2DFDB', timeText: '1小时前访问' },
        { userId: 'v003', nickname: '蓝莓气泡', identity: 'prince', age: 25, city: '苏州', avatar: '#C5CAE9', timeText: '今天访问' }
      ]
    });
  },

  goToVip() {
    wx.navigateTo({ url: '/pages/vip/index' });
  }
});
