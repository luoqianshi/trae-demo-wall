// pages/review/review.js
const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    task: null,
    readCount: 0,        // 已读次数
    targetCount: 3,      // 目标次数
    reading: false,
    finished: false,
  },

  onLoad() {
    const task = app.globalData.currentTask;
    if (!task) {
      wx.navigateBack();
      return;
    }
    this.setData({ task });
  },

  // 开始读一遍(模拟,点击即记录一次)
  onRead() {
    if (this.data.reading || this.data.finished) return;
    this.setData({ reading: true });
    // 简单模拟"朗读"过程:1.5 秒
    setTimeout(() => {
      const count = this.data.readCount + 1;
      this.setData({
        readCount: count,
        reading: false,
        finished: count >= this.data.targetCount,
      });
    }, 1500);
  },

  // 完成复习打卡
  async onFinish() {
    wx.showLoading({ title: '提交中...' });
    try {
      const data = await api.finishReview(this.data.task.record_id, this.data.readCount);
      wx.hideLoading();
      wx.showToast({
        title: data.finished ? '🎉 全部复习完成!' : '✓ 打卡成功',
        icon: 'none',
        duration: 1500,
      });
      setTimeout(() => {
        app.globalData.currentTask = null;
        wx.navigateBack();
      }, 1500);
    } catch (e) {
      wx.hideLoading();
    }
  },

  // 跳过(标记不读了,但仍记录今天已读)
  onSkip() {
    wx.showModal({
      title: '提示',
      content: '确定跳过本次复习吗?(不计入打卡)',
      success: (res) => {
        if (res.confirm) {
          app.globalData.currentTask = null;
          wx.navigateBack();
        }
      },
    });
  },
});
