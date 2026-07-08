// pages/index/index.js
const app = getApp();
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    today: '',
    isLearnDay: false,
    tasks: [],
    subjectMap: {},
    loading: true,
    streak: 0,
    userInfo: null,
  },

  onShow() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true, userInfo: app.globalData.userInfo });
    try {
      const subjectMap = await util.getSubjectMap();
      const data = await api.getTodayReview();

      // 给每个任务附上学科信息
      const tasks = data.tasks.map(t => ({
        ...t,
        subject: subjectMap[t.subject_code] || { name: t.subject_code, icon: '📘' },
      }));

      // 单独取统计的连续天数
      let streak = 0;
      try {
        const stats = await api.getStats();
        streak = stats.streak;
      } catch (e) {}

      this.setData({
        today: data.today,
        isLearnDay: data.is_learn_day,
        tasks,
        subjectMap,
        streak,
        loading: false,
      });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  // 跳转到复习页
  onReview(e) {
    const task = e.currentTarget.dataset.task;
    // 把任务暂存到全局,避免重复请求
    app.globalData.currentTask = task;
    wx.navigateTo({ url: '/pages/review/review' });
  },

  // 去学新
  goLearn() {
    wx.switchTab({ url: '/pages/learn/learn' });
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },
});
