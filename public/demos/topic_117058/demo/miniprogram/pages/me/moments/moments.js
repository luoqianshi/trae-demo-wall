Page({
  data: {
    content: '',
    photos: [],
    moments: [],
    lastPublishDate: ''
  },

  onLoad() {
    this.loadMoments();
  },

  loadMoments() {
    this.setData({
      moments: wx.getStorageSync('moments') || [],
      lastPublishDate: wx.getStorageSync('lastPublishDate') || ''
    });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  addPhoto() {
    wx.chooseMedia({
      count: 3 - this.data.photos.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: res => {
        const selected = (res.tempFiles || []).map(file => file.tempFilePath);
        this.setData({ photos: [...this.data.photos, ...selected].slice(0, 3) });
      }
    });
  },

  removePhoto(e) {
    const photos = [...this.data.photos];
    photos.splice(e.currentTarget.dataset.index, 1);
    this.setData({ photos });
  },

  publishMoment() {
    const today = this.getToday();
    if (this.data.lastPublishDate === today) {
      wx.showToast({ title: '今天已发布过动态', icon: 'none' });
      return;
    }
    if (!this.data.content.trim() && this.data.photos.length === 0) {
      wx.showToast({ title: '写点文字或添加图片吧', icon: 'none' });
      return;
    }
    const moment = {
      momentId: `moment_${Date.now()}`,
      content: this.data.content.trim(),
      photos: this.data.photos,
      dateText: today,
      createdAt: new Date().toISOString()
    };
    const moments = [moment, ...this.data.moments];
    wx.setStorageSync('moments', moments);
    wx.setStorageSync('lastPublishDate', today);
    this.setData({ moments, lastPublishDate: today, content: '', photos: [] });
    wx.showToast({ title: '动态已发布', icon: 'success' });
  },

  getToday() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
});
