// 暖心时刻 - AI 识别高能量温暖时刻
const { request } = require('../../utils/request');

Page({
  data: {
    activeTab: 'year',
    loading: true,
    items: [],
    total: 0,
    aiSummary: '',
    aiWarmMessage: '',
    warmEvidence: [],
    stats: {
      total_episodes: 0,
      total_days: 0,
      best_mood: ''
    },
    expandedId: ''
  },

  onLoad() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  loadData() {
    this.setData({ loading: true });
    return request('GET', '/api/warm-moments', { mode: this.data.activeTab, page: 1, size: 20 })
      .then(data => {
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
          aiWarmMessage: data.ai_warm_message || '',
          warmEvidence: data.warm_evidence || [],
          stats: data.stats || { total_episodes: 0, total_days: 0, best_mood: '' },
          loading: false,
          expandedId: ''
        });
      })
      .catch(() => {
        this.setData({ loading: false });
      });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;
    this.setData({ activeTab: tab });
    this.loadData();
  },

  toggleExpand(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      expandedId: this.data.expandedId === id ? '' : id
    });
  },

  previewPhoto(e) {
    const urls = e.currentTarget.dataset.urls;
    const current = e.currentTarget.dataset.url;
    if (!urls || urls.length === 0) return;
    wx.previewImage({ urls, current });
  }
});
