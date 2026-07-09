const { generateMessageWithFallback } = require('../../services/ai');
const { saveHistory } = require('../../services/storage');
const { getSettings } = require('../../services/storage');
const { STYLES, CHANNELS } = require('../../utils/constants');

Page({
  data: {
    scene: '',
    style: '',
    channel: '',
    studentName: '',
    description: '',
    generatedContent: '',
    isFallback: false,
    isGenerating: false,
    settings: {},
    styles: STYLES,
    channels: CHANNELS
  },

  onLoad() {
    const settings = getSettings();
    this.setData({
      settings,
      style: settings.defaultStyle || 'gentle',
      channel: settings.defaultChannel || 'wechat'
    });
  },

  onShow() {
    const settings = getSettings();
    this.setData({ settings });
  },

  onSceneChange(e) {
    this.setData({ scene: e.detail.value });
  },

  onStyleTap(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ style: id });
  },

  onChannelTap(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ channel: id });
  },

  onStudentNameInput(e) {
    this.setData({ studentName: e.detail.value });
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  async onGenerate() {
    const { scene, style, channel, studentName, description, settings } = this.data;

    if (!studentName.trim()) {
      wx.showToast({
        title: '请填写学生姓名',
        icon: 'none'
      });
      return;
    }

    if (!scene) {
      wx.showToast({
        title: '请选择沟通场景',
        icon: 'none'
      });
      return;
    }

    this.setData({ isGenerating: true });
    wx.showLoading({ title: '生成中...' });

    try {
      const result = await generateMessageWithFallback({
        scene,
        style,
        channel,
        studentName: studentName.trim(),
        description: description.trim(),
        settings
      });

      wx.hideLoading();

      if (result.success) {
        this.setData({
          generatedContent: result.content,
          isFallback: result.isFallback,
          isGenerating: false
        });

        // 保存历史记录
        saveHistory({
          studentName: studentName.trim(),
          scene,
          style,
          channel,
          content: result.content,
          isFallback: result.isFallback
        });

        if (result.isFallback) {
          wx.showToast({
            title: '当前无网络，已使用本地模板',
            icon: 'none',
            duration: 3000
          });
        }
      }
    } catch (err) {
      wx.hideLoading();
      this.setData({ isGenerating: false });
      wx.showToast({
        title: '生成失败，请重试',
        icon: 'error'
      });
    }
  },

  onRegenerate() {
    this.onGenerate();
  },

  onEdit(e) {
    this.setData({ generatedContent: e.detail.content });
  }

});
