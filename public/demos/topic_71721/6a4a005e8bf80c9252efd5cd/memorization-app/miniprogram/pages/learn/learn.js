// pages/learn/learn.js
const app = getApp();
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    subjects: [],
    selectedSubject: '',
    selectedSemester: '',
    semesterList: util.SEMESTERS,
    semesterLabel: '',
    contents: [],
    learnedIds: [],     // 已学的内容 id
    loading: false,
  },

  onShow() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.init();
  },

  async init() {
    // 取用户当前学期
    const userInfo = app.globalData.userInfo || await api.getUserInfo().catch(() => ({}));
    if (userInfo) app.globalData.userInfo = userInfo;
    const semester = (userInfo && userInfo.semester) || 'grade7_1';

    this.setData({
      selectedSemester: semester,
      semesterLabel: util.semesterLabel(semester),
    });

    // 加载学科
    try {
      const subjects = await api.getSubjects();
      this.setData({ subjects });
      if (subjects.length && !this.data.selectedSubject) {
        this.setData({ selectedSubject: subjects[0].code });
      }
    } catch (e) {}

    // 加载已学列表
    try {
      const learned = await api.getLearnList();
      this.setData({ learnedIds: learned.map(l => l.content_id) });
    } catch (e) {}

    this.loadContents();
  },

  // 切换学科
  onSelectSubject(e) {
    this.setData({ selectedSubject: e.currentTarget.dataset.code });
    this.loadContents();
  },

  // 切换学期
  onSelectSemester() {
    wx.showActionSheet({
      itemList: util.SEMESTERS.map(s => s.label),
      success: (res) => {
        const sem = util.SEMESTERS[res.tapIndex];
        this.setData({
          selectedSemester: sem.value,
          semesterLabel: sem.label,
        });
        // 同时更新用户设置
        api.updateSettings(sem.value, null).catch(() => {});
        app.globalData.userInfo.semester = sem.value;
        this.loadContents();
      },
    });
  },

  async loadContents() {
    if (!this.data.selectedSubject || !this.data.selectedSemester) return;
    this.setData({ loading: true });
    try {
      const list = await api.getContents(this.data.selectedSemester, this.data.selectedSubject);
      this.setData({ contents: list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  // 查看内容详情
  onContent(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/content/content?id=${id}` });
  },

  // 标记学新
  async onLearn(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认学新',
      content: '标记为今天学的新内容?系统将自动生成 21 天复习计划。',
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '提交中...' });
        try {
          await api.learn(id);
          const learned = this.data.learnedIds.concat([id]);
          this.setData({ learnedIds: learned });
          wx.hideLoading();
          wx.showToast({ title: '已加入复习计划', icon: 'success' });
        } catch (e) {
          wx.hideLoading();
        }
      },
    });
  },
});
