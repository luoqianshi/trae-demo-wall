// miniprogram/pages/review-submit/review-submit.js
const { call } = require('../../utils/request.js');

Page({
  data: {
    reviewId: '',
    healthList: [
      { key: 'good', label: '良好' },
      { key: 'normal', label: '一般' },
      { key: 'need_attention', label: '需关注' }
    ],
    form: {
      images: [],
      healthStatus: 'good',
      content: '',
      rating: 5
    }
  },

  onLoad(options) {
    this.setData({ reviewId: options.id || '' });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  chooseHealth(e) {
    this.setData({ 'form.healthStatus': e.currentTarget.dataset.key });
  },

  chooseRating(e) {
    this.setData({ 'form.rating': Number(e.currentTarget.dataset.rating) });
  },

  chooseImage() {
    const remain = 9 - this.data.form.images.length;
    if (remain <= 0) return;
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newUrls = (res.tempFiles || []).map(f => f.tempFilePath);
        this.setData({ 'form.images': this.data.form.images.concat(newUrls) });
      },
      fail: () => {
        wx.chooseImage({
          count: remain,
          success: (res2) => {
            this.setData({ 'form.images': this.data.form.images.concat(res2.tempFilePaths || []) });
          }
        });
      }
    });
  },

  removeImage(e) {
    const idx = e.currentTarget.dataset.index;
    const images = this.data.form.images.slice();
    images.splice(idx, 1);
    this.setData({ 'form.images': images });
  },

  submit() {
    if (this.data.form.images.length === 0) return wx.showToast({ title: '请至少上传 1 张照片', icon: 'none' });
    if (!this.data.form.content) return wx.showToast({ title: '请填写文字描述', icon: 'none' });

    wx.showLoading({ title: '提交中' });
    call('reviewSubmit', {
      reviewId: this.data.reviewId,
      content: this.data.form.content,
      images: this.data.form.images,
      healthStatus: this.data.form.healthStatus,
      rating: this.data.form.rating
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '提交成功', icon: 'success' });
      setTimeout(() => wx.navigateBack({ delta: 1 }), 800);
    }).catch(() => wx.hideLoading());
  }
});
