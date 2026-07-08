// app.js — 时光胶囊小程序入口

const { request } = require('./utils/request');

App({
  // 演示模式：true 时不连后端，用 mock 数据跑完整 UI
  devMode: true,

  globalData: {
    token: '',
    userInfo: null,
    isLoggedIn: false,

    // 导入流程
    selectedPhotoIds: [],
    selectedChatIds: [],
    uploadQueue: [],
    uploadProgress: {},

    // 胶囊缓存（减少请求）
    capsuleList: [],
    capsuleFilter: 'all',
    capsulesLastFetch: 0
  },

  onLaunch() {
    this.checkLogin();
  },

  onError(error) {
    console.error('[App Error]', error);
    wx.showToast({ title: '应用出现异常，请重启', icon: 'none', duration: 2000 });
  },

  // 检查登录态
  checkLogin() {
    const token = wx.getStorageSync('token');
    if (!token) return;

    this.globalData.token = token;
    request('GET', '/api/user/me')
      .then(data => {
        this.globalData.userInfo = data.user;
        this.globalData.isLoggedIn = true;
      })
      .catch(() => {
        wx.removeStorageSync('token');
        this.globalData.token = '';
        this.globalData.isLoggedIn = false;
      });
  },

  // 手机号授权登录
  // 由页面 button open-type="getPhoneNumber" 触发，
  // e.detail.code 传给后端换取 token
  handlePhoneLogin(e) {
    return new Promise((resolve, reject) => {
      const { code, errMsg } = e.detail;

      // 用户拒绝授权
      if (!code) {
        reject(new Error(errMsg || '授权已取消'));
        return;
      }

      wx.showLoading({ title: '授权中...', mask: true });

      request('POST', '/api/auth/phone', { code })
        .then(data => {
          wx.setStorageSync('token', data.token);
          this.globalData.token = data.token;
          this.globalData.userInfo = data.user;
          this.globalData.isLoggedIn = true;
          wx.hideLoading();
          resolve(data.user);
        })
        .catch(err => {
          wx.hideLoading();
          reject(err);
        });
    });
  },

  // 退出登录
  logout() {
    wx.removeStorageSync('token');
    this.globalData.token = '';
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    this.globalData.capsuleList = [];
    wx.reLaunch({ url: '/pages/index/index' });
  }
});
