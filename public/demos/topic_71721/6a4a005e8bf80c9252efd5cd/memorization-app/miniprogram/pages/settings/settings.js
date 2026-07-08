// pages/settings/settings.js
const app = getApp();
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    semesterList: util.SEMESTERS,
    semesterLabel: '',
    learnPerWeek: 2,
  },

  onShow() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.loadUser();
  },

  async loadUser() {
    try {
      const user = await api.getUserInfo();
      app.globalData.userInfo = user;
      this.setData({
        userInfo: user,
        semesterLabel: util.semesterLabel(user.semester),
        learnPerWeek: user.learn_per_week,
      });
    } catch (e) {}
  },

  // 切换学期
  async onSemesterChange() {
    const that = this;
    wx.showActionSheet({
      itemList: util.SEMESTERS.map(s => s.label),
      async success(res) {
        const sem = util.SEMESTERS[res.tapIndex];
        try {
          const user = await api.updateSettings(sem.value, null);
          app.globalData.userInfo = user;
          that.setData({ userInfo: user, semesterLabel: sem.label });
          wx.showToast({ title: '已更新', icon: 'success' });
        } catch (e) {}
      },
    });
  },

  // 切换学新频率
  async onFreqChange(e) {
    const freq = Number(e.currentTarget.dataset.freq);
    if (freq === this.data.learnPerWeek) return;
    try {
      const user = await api.updateSettings(null, freq);
      app.globalData.userInfo = user;
      this.setData({ learnPerWeek: freq, userInfo: user });
      wx.showToast({ title: '已更新', icon: 'success' });
    } catch (e) {}
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗?',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          wx.reLaunch({ url: '/pages/login/login' });
        }
      },
    });
  },
});
