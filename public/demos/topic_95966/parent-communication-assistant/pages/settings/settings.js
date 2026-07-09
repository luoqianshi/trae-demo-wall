const { getSettings, saveSettings, clearHistory } = require('../../services/storage');
const { SUBJECTS, GRADES, STYLES, CHANNELS } = require('../../utils/constants');


Page({
  data: {
    settings: {
      teacherName: '',
      subject: '',
      grade: '',
      defaultStyle: 'gentle',
      defaultChannel: 'wechat'
    },
    apiKey: '',
    apiKeyMasked: '',
    hasApiKey: false,
    subjects: SUBJECTS,
    grades: GRADES,
    styles: STYLES,
    channels: CHANNELS
  },

  onLoad() {
    this.loadSettings();
    this.loadApiKeyStatus();
  },

  loadSettings() {
    const settings = getSettings();
    this.setData({ settings });
  },

  loadApiKeyStatus() {
    const key = wx.getStorageSync('comm_api_token') || '';
    const masked = key ? `${key.substring(0, 6)}...${key.substring(key.length - 4)}` : '';
    this.setData({
      apiKey: key,
      apiKeyMasked: masked,
      hasApiKey: !!key
    });
  },

  onTeacherNameInput(e) {
    this.setData({
      'settings.teacherName': e.detail.value
    });
  },

  onSubjectChange(e) {
    const index = e.detail.value;
    this.setData({
      'settings.subject': this.data.subjects[index]
    });
  },

  onGradeChange(e) {
    const index = e.detail.value;
    this.setData({
      'settings.grade': this.data.grades[index]
    });
  },

  onStyleChange(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({
      'settings.defaultStyle': id
    });
  },

  onChannelChange(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({
      'settings.defaultChannel': id
    });
  },

  onApiKeyInput(e) {
    this.setData({ apiKey: e.detail.value });
  },

  onSaveApiKey() {
    const key = this.data.apiKey.trim();
    if (!key) {
      wx.showToast({ title: '请输入 API Key', icon: 'none' });
      return;
    }
    wx.setStorageSync('comm_api_token', key);
    this.loadApiKeyStatus();
    wx.showToast({ title: 'API Key 已保存', icon: 'success' });
  },

  onClearApiKey() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除已保存的 API Key 吗？',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('comm_api_token');
          this.setData({ apiKey: '', apiKeyMasked: '', hasApiKey: false });
          wx.showToast({ title: '已清除', icon: 'success' });
        }
      }
    });
  },

  onSave() {
    saveSettings(this.data.settings);
    const app = getApp();
    app.globalData.settings = this.data.settings;
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  onClearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？此操作不可恢复。',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          clearHistory();
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },

  onExportHistory() {
    const { exportHistory } = require('../../services/storage');
    const content = exportHistory();
    
    if (!content) {
      wx.showToast({ title: '暂无记录可导出', icon: 'none' });
      return;
    }
    
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  },

  onAbout() {
    wx.showModal({
      title: '关于家长沟通助手',
      content: '版本：1.0.0\n\n一款帮助中小学教师快速生成专业得体家长沟通话术的小程序。\n\n数据仅存储在本地，保护学生隐私。',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
