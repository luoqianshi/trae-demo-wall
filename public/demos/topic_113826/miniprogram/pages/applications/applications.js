// miniprogram/pages/applications/applications.js
const { call } = require('../../utils/request.js');
const { formatDate, applicationStatusLabel } = require('../../utils/format.js');

Page({
  data: {
    list: []
  },

  onShow() {
    this.load();
  },

  load() {
    wx.showLoading({ title: '加载中' });
    call('applicationMy').then((data) => {
      const list = (data || []).map(a => {
        const color = a.status === 'approved' ? '#e9f4dc' : a.status === 'rejected' ? '#fbe4df' : '#fff4d6';
        const textColor = a.status === 'approved' ? '#5a8a3e' : a.status === 'rejected' ? '#b5513f' : '#d9a23e';
        return {
          ...a,
          statusText: applicationStatusLabel(a.status),
          statusColor: color,
          statusTextColor: textColor,
          createTimeText: formatDate(a.createTime)
        };
      });
      this.setData({ list });
      wx.hideLoading();
    }).catch(() => wx.hideLoading());
  }
});
