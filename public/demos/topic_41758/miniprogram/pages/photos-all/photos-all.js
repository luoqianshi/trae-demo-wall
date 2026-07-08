// 全部历史照片
const { request } = require('../../utils/request');

Page({
  data: {
    photos: [],
    total: 0,
    page: 1,
    size: 30,
    loading: true,
    noMore: false
  },

  onLoad() {
    this.loadPhotos();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, photos: [], noMore: false });
    this.loadPhotos();
  },

  onReachBottom() {
    if (this.data.noMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1 });
    this.loadPhotos(true);
  },

  loadPhotos(append = false) {
    this.setData({ loading: !append });
    request('GET', '/api/photos', { page: this.data.page, size: this.data.size })
      .then(data => {
        const items = data.items || [];
        const merged = append ? this.data.photos.concat(items) : items;
        this.setData({
          photos: merged,
          total: data.total,
          noMore: merged.length >= data.total,
          loading: false
        });
        wx.setNavigationBarTitle({ title: `全部照片 · ${data.total}张` });
        if (!append) wx.stopPullDownRefresh();
      })
      .catch(() => {
        this.setData({ loading: false });
        wx.stopPullDownRefresh();
      });
  },

  previewPhoto(e) {
    const urls = this.data.photos.map(p => p.url);
    const current = e.currentTarget.dataset.url;
    wx.previewImage({ urls, current });
  }
});
