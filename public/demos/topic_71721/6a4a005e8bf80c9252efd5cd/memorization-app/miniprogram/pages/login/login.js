// pages/login/login.js
const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    nickname: '',
  },

  onInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  // 测试登录(无需微信)
  async onTestLogin() {
    const nickname = this.data.nickname || '测试同学';
    wx.showLoading({ title: '登录中...' });
    try {
      const data = await api.testLogin(nickname);
      app.saveLogin(data.token, data.user);
      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 500);
    } catch (e) {
      wx.hideLoading();
    }
  },

  // 微信登录(实际生产环境使用)
  async onWxLogin() {
    wx.showLoading({ title: '登录中...' });
    try {
      const { code } = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject });
      });
      // 实际生产中:把 code 发送到后端,后端调用 code2session 换 openid
      // 此处用 code 作为临时 openid 演示
      const userInfo = await new Promise((resolve, reject) => {
        wx.getUserProfile({ desc: '用于完善资料', success: resolve, fail: reject });
      }).catch(() => null);

      const data = await api.login(
        'wx_' + code,
        userInfo ? userInfo.userInfo.nickName : '同学',
        userInfo ? userInfo.userInfo.avatarUrl : ''
      );
      app.saveLogin(data.token, data.user);
      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 500);
    } catch (e) {
      wx.hideLoading();
      // 回退到测试登录
      this.onTestLogin();
    }
  },
});
