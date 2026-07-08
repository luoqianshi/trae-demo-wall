// 照片组详情页
const { request } = require('../../utils/request');

Page({
  data: {
    groupId: '',
    group: null,
    photos: [],
    loading: true,
    page: 1,
    size: 30,
    total: 0
  },

  onLoad(options) {
    this.setData({ groupId: options.id || '' });
    this.loadGroup();
  },

  onPullDownRefresh() {
    this.setData({ page: 1 });
    this.loadGroup();
  },

  onReachBottom() {
    if (this.data.photos.length >= this.data.total) return;
    this.setData({ page: this.data.page + 1 });
    this.loadGroup(true);
  },

  loadGroup(append = false) {
    this.setData({ loading: !append });
    request('GET', `/api/photos/groups/${this.data.groupId}?page=${this.data.page}&size=${this.data.size}`)
      .then(data => {
        const group = data.group;
        const photos = data.photos || [];
        wx.setNavigationBarTitle({ title: group.period_label });
        this.setData({
          group,
          photos: append ? this.data.photos.concat(photos) : photos,
          total: data.total,
          loading: false
        });
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
  },

  goAllPhotos() {
    wx.navigateTo({ url: '/pages/photos-all/photos-all' });
  }
});
