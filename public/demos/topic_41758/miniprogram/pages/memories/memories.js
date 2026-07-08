// 记忆时间线
const { request } = require('../../utils/request');

Page({
  data: {
    items: [],
    loading: true,
    filters: [
      { key: '', label: '全部' },
      { key: 'photo', label: '📷 照片' },
      { key: 'moment', label: '📝 朋友圈' },
      { key: 'chat', label: '💬 聊天' }
    ],
    activeFilter: '',
    keyword: '',
    total: 0,
    total_moments: 0,
    moments_on_timeline: 0,
    show_moments_more: false
  },

  onLoad(options) {
    if (options && options.source) this.setData({ activeFilter: options.source });
    this.loadMemories();
  },

  onShow() {
    // 从详情页返回时保持列表
  },

  onPullDownRefresh() {
    this.loadMemories();
  },

  switchFilter(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.key });
    this.loadMemories();
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onKeywordConfirm() {
    this.loadMemories();
  },

  clearKeyword() {
    this.setData({ keyword: '' });
    this.loadMemories();
  },

  loadMemories() {
    this.setData({ loading: true });
    const params = {};
    if (this.data.activeFilter) params.source = this.data.activeFilter;
    if (this.data.keyword) params.keyword = this.data.keyword;

    request('GET', '/api/memories', params)
      .then(data => {
        this.setData({
          items: data.items || [],
          total: data.total,
          total_moments: data.total_moments || 0,
          moments_on_timeline: data.moments_on_timeline || 0,
          show_moments_more: (data.total_moments || 0) > (data.moments_on_timeline || 0),
          loading: false
        });
        wx.stopPullDownRefresh();
      })
      .catch(() => {
        this.setData({ loading: false });
        wx.stopPullDownRefresh();
      });
  },

  // 点击卡片
  tapPhotoGroup(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/photo-group-detail/photo-group-detail?id=${id}` });
  },

  tapChatSummary(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/chat-summary-detail/chat-summary-detail?id=${id}` });
  },

  tapMoment(e) {
    // 单条朋友圈详情：简单做弹层显示完整信息
    const m = e.currentTarget.dataset.data;
    if (!m) return;
    wx.showModal({
      title: m.occurred_at_text || '朋友圈',
      content: (m.content && m.content.text || '') + (m.location_name ? '\n📍 ' + m.location_name : ''),
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#7c5cfc'
    });
  },

  goAllMoments() {
    wx.navigateTo({ url: '/pages/moments-all/moments-all' });
  },

  previewPhoto(e) {
    const urls = e.currentTarget.dataset.urls;
    const current = e.currentTarget.dataset.url;
    if (!urls || urls.length === 0) return;
    wx.previewImage({ urls, current });
  }
});
