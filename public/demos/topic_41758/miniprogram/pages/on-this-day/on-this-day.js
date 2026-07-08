// N年今日 - 详情页
const { request } = require('../../utils/request');

Page({
  data: {
    dateText: '',
    weekdayText: '',
    years: [],
    loading: true
  },

  onLoad() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  loadData() {
    this.setData({ loading: true });
    return request('GET', '/api/on-this-day/detail')
      .then(data => {
        // 预处理：为照片和朋友圈添加 URL 列表（WXML 不支持 map 表达式）
        if (data.years && data.years.length) {
          data.years.forEach(y => {
            // 照片 URL 列表
            if (y.photos && y.photos.length) {
              y.photo_urls = y.photos.map(p => p.url);
            } else {
              y.photo_urls = [];
            }
            // 朋友圈的图片 URL 列表
            if (y.moments && y.moments.length) {
              y.moments.forEach(m => {
                if (m.content && m.content.media && m.content.media.length) {
                  // 已经是 URL 数组，保持不变
                }
              });
            }
          });
        }
        this.setData({
          dateText: data.date_text,
          weekdayText: data.weekday_text,
          years: data.years || [],
          loading: false
        });
      })
      .catch(() => {
        this.setData({ loading: false });
      });
  },

  // 预览照片
  previewPhoto(e) {
    const urls = e.currentTarget.dataset.urls;
    const current = e.currentTarget.dataset.url;
    if (!urls || urls.length === 0) return;
    wx.previewImage({ urls, current });
  },

  // 点击朋友圈
  tapMoment(e) {
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

  // 点击聊天会话
  tapChat(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/chat-detail/chat-detail?id=${id}` });
  }
});
