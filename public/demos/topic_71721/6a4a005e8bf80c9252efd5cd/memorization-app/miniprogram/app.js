// app.js
App({
  globalData: {
    baseUrl: 'http://localhost:3000',  // 后端服务地址,部署时改成你的服务器
    token: '',
    userInfo: null,
  },

  onLaunch() {
    // 从本地存储恢复登录态
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token) this.globalData.token = token;
    if (userInfo) this.globalData.userInfo = userInfo;
  },

  // 保存登录态
  saveLogin(token, userInfo) {
    this.globalData.token = token;
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('token', token);
    wx.setStorageSync('userInfo', userInfo);
  },

  // 退出登录
  logout() {
    this.globalData.token = '';
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  },

  // 检查登录,未登录跳转登录页
  ensureLogin() {
    if (!this.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return false;
    }
    return true;
  },
});
