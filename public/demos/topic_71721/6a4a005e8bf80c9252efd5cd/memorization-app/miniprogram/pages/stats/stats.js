// pages/stats/stats.js
const app = getApp();
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    stats: null,
    learnList: [],
    subjectMap: {},
    loading: true,
  },

  onShow() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [stats, learnList, subjectMap] = await Promise.all([
        api.getStats(),
        api.getLearnList(),
        util.getSubjectMap(),
      ]);
      // 给学习记录附学科信息
      const list = learnList.map(l => ({
        ...l,
        subject: subjectMap[l.subject_code] || { name: l.subject_code, icon: '📘' },
        progress: Math.round((l.completed_rounds.length / l.total_rounds) * 100),
      }));
      this.setData({ stats, learnList: list, subjectMap, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },
});
