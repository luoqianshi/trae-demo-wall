// miniprogram/pages/reviews/reviews.js
const { call } = require('../../utils/request.js');
const { reviewStatusLabel } = require('../../utils/format.js');

Page({
  data: {
    list: []
  },

  onShow() {
    this.load();
  },

  load() {
    wx.showLoading({ title: '加载中' });
    call('reviewListByUser').then((data) => {
      const list = (data || []).map(r => {
        const color = r.status === 'done' ? '#e9f4dc' : '#fff4d6';
        const textColor = r.status === 'done' ? '#5a8a3e' : '#d9a23e';
        return {
          ...r,
          statusText: reviewStatusLabel(r.status),
          statusColor: color,
          statusTextColor: textColor
        };
      });
      this.setData({ list });
      wx.hideLoading();
    }).catch(() => wx.hideLoading());
  },

  submitReview(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/review-submit/review-submit?id=' + id });
  }
});
