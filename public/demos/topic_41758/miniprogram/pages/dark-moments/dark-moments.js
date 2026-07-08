// 黑暗时刻 - AI 识别低能量时刻集合
const { request } = require('../../utils/request');

Page({
  data: {
    activeTab: 'year', // year | all
    loading: true,
    items: [],
    total: 0,
    // AI 总结
    aiSummary: '',
    aiEncouragement: '',
    positiveEvidence: [],
    // 统计
    stats: {
      total_episodes: 0,
      total_days: 0,
      worst_mood: ''
    },
    // 展开的卡片 ID
    expandedId: ''
  },

  onLoad() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  // 加载数据
  loadData() {
    this.setData({ loading: true });
    return request('GET', '/api/dark-moments', { mode: this.data.activeTab, page: 1, size: 20 })
      .then(data => {
        // 预处理：为每条时刻的照片添加 url 列表（WXML 不支持 map）
        let items = data.items || [];
        items = items.map(item => {
          if (item.photos && item.photos.length) {
            item.photo_urls = item.photos.map(p => p.url);
          } else {
            item.photo_urls = [];
          }
          return item;
        });

        this.setData({
          items: items,
          total: data.total || 0,
          aiSummary: data.ai_summary || '',
          aiEncouragement: data.ai_encouragement || '',
          positiveEvidence: data.positive_evidence || [],
          stats: data.stats || { total_episodes: 0, total_days: 0, worst_mood: '' },
          loading: false,
          expandedId: ''
        });
      })
      .catch(() => {
        this.setData({ loading: false });
      });
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;
    this.setData({ activeTab: tab });
    this.loadData();
  },

  // 展开/收起卡片
  toggleExpand(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      expandedId: this.data.expandedId === id ? '' : id
    });
  },

  // 预览照片
  previewPhoto(e) {
    const urls = e.currentTarget.dataset.urls;
    const current = e.currentTarget.dataset.url;
    if (!urls || urls.length === 0) return;
    wx.previewImage({ urls, current });
  }
});
