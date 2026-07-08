// 全部朋友圈列表
const { request } = require('../../utils/request');

Page({
  data: {
    items: [],
    page: 1,
    size: 20,
    total: 0,
    total_available: 0,
    loading: true,
    noMore: false
  },

  onLoad() {
    this.loadMoments();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, noMore: false, items: [] });
    this.loadMoments();
  },

  onReachBottom() {
    if (this.data.noMore) return;
    this.setData({ page: this.data.page + 1 });
    this.loadMoments(true);
  },

  loadMoments(append = false) {
    this.setData({ loading: !append });
    request('GET', `/api/moments?page=${this.data.page}&size=${this.data.size}`)
      .then(data => {
        const items = append ? this.data.items.concat(data.items) : data.items;
        this.setData({
          items,
          total: data.total,
          total_available: data.total_available,
          noMore: items.length >= data.total,
          loading: false
        });
        wx.stopPullDownRefresh();
      })
      .catch(() => {
        this.setData({ loading: false });
        wx.stopPullDownRefresh();
      });
  },

  previewPhoto(e) {
    const urls = e.currentTarget.dataset.urls;
    const current = e.currentTarget.dataset.url;
    if (!urls || urls.length === 0) return;
    wx.previewImage({ urls, current });
  }
});
