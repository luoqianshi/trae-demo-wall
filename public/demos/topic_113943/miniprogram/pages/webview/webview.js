// pages/webview/webview.js
// 用于在外部链接中打开商家商品页（需在微信小程序后台配置业务域名）
Page({
  data: {
    url: '',
    title: ''
  },

  onLoad(options) {
    const url = decodeURIComponent(options.url || '');
    const title = decodeURIComponent(options.title || '商品详情');
    if (!url) {
      wx.showToast({ title: '链接无效', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    wx.setNavigationBarTitle({ title });
    this.setData({ url, title });
  }
});
