// pages/index/index.js
const app = getApp();

Page({
  data: {
    moods: [],
    selectedMood: '',
    peopleCount: 4,
    areas: ['全城', '天河区', '越秀区', '海珠区', '荔湾区', '白云区', '番禺区'],
    areaIndex: 0,
    budget: 200,
    durations: ['2小时', '4小时', '6小时', '全天'],
    duration: '4小时'
  },

  onLoad() {
    this.setData({
      moods: app.globalData.moods
    });
  },

  selectMood(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      selectedMood: this.data.selectedMood === id ? '' : id
    });
  },

  changePeople(e) {
    const type = e.currentTarget.dataset.type;
    let count = this.data.peopleCount;
    if (type === '1') {
      count = Math.min(count + 1, 20);
    } else {
      count = Math.max(count - 1, 1);
    }
    this.setData({ peopleCount: count });
  },

  onAreaChange(e) {
    this.setData({ areaIndex: e.detail.value });
  },

  onBudgetChange(e) {
    this.setData({ budget: e.detail.value });
  },

  selectDuration(e) {
    const duration = e.currentTarget.dataset.duration;
    this.setData({ duration });
  },

  quickSelect(e) {
    const { mood, people } = e.currentTarget.dataset;
    this.setData({
      selectedMood: mood,
      peopleCount: parseInt(people)
    });
  },

  generatePlans() {
    if (!this.data.selectedMood) {
      wx.showToast({ title: '请先选择心情风格', icon: 'none' });
      return;
    }

    const params = {
      mood: this.data.selectedMood,
      peopleCount: this.data.peopleCount,
      area: this.data.areas[this.data.areaIndex],
      budget: this.data.budget,
      duration: this.data.duration
    };

    wx.navigateTo({
      url: `/pages/plans/plans?mood=${params.mood}&people=${params.peopleCount}&area=${params.area}&budget=${params.budget}&duration=${params.duration}`
    });
  }
});
