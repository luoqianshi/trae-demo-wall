Page({
  data: {
    statusBarHeight: 44,
    userInfo: {
      nickName: '',
      avatarUrl: ''
    }
  },

  onLoad() {
    this.setData({
      statusBarHeight: wx.getSystemInfoSync().statusBarHeight
    });
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    } else {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          this.setData({ userInfo: res.userInfo });
          wx.setStorageSync('userInfo', res.userInfo);
        },
        fail: () => {
          console.log('用户未授权');
        }
      });
    }
  },

  goToPage(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url,
      fail: () => {
        wx.showToast({
          title: '页面开发中',
          icon: 'none'
        });
      }
    });
  },

  inviteFriend() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  onShareAppMessage() {
    return {
      title: '一起来聚点，发现好去处',
      path: '/pages/index/index'
    };
  }
});
