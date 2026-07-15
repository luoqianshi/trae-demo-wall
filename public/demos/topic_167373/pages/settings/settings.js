const { recordRepository, userProfileRepository, appSettingsRepository } = require('../../data/repositories/index.js');
const { exportToText, exportToCsv } = require('../../utils/export-utils.js');
const UserProfile = require('../../data/models/user-profile.js');
const app = getApp();

Page({
  data: {
    userProfile: null,
    boboEnabled: true,
    appVersion: '1.0.0'
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const profile = userProfileRepository.getProfile();
    const settings = appSettingsRepository.getSettings();

    this.setData({
      userProfile: profile,
      reminderEnabled: settings.reminderEnabled,
      reminderTime: settings.getReminderTime(),
      // V0.2.0
      boboEnabled: settings.boboEnabled !== false
    });
  },

  // V0.2.0 波波开关
  onBoboToggle(e) {
    const enabled = !!e.detail.value;
    try {
      const settings = appSettingsRepository.getSettings();
      settings.boboEnabled = enabled;
      appSettingsRepository.saveSettings(settings);
      this.setData({ boboEnabled: enabled });
    } catch (err) {
      console.error('[settings] toggle bobo error:', err);
    }
  },

  onEditProfile() {
    wx.navigateTo({ url: '/pages/profile-setup/profile-setup' });
  },

  onReminderSettings() {
    wx.navigateTo({ url: '/pages/reminder-settings/reminder-settings' });
  },

  onExportData() {
    const records = recordRepository.getAllRecords();
    const profile = userProfileRepository.getProfile();
    // 让用户选择导出格式
    wx.showActionSheet({
      itemList: ['复制为文本（推荐）', '复制为表格（CSV）'],
      success: (res) => {
        if (res.tapIndex === 0) {
          const text = exportToText(records, profile);
          this.copyToClipboard(text, '已复制为文本，可粘贴到任意位置');
        } else if (res.tapIndex === 1) {
          const csv = exportToCsv(records);
          this.copyToClipboard(csv, '已复制为表格（CSV），可粘贴到 Excel / 飞书表格');
        }
      }
    });
  },

  copyToClipboard(data, msg) {
    wx.setClipboardData({
      data: data,
      success: () => {
        wx.showModal({
          title: '导出成功',
          content: msg,
          showCancel: false
        });
      }
    });
  },

  onClearData() {
    wx.showModal({
      title: '清除所有数据',
      content: '此操作将删除所有记录，且无法恢复。是否继续？',
      confirmColor: '#EA4335',
      success: (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '再次确认',
            content: '请输入"确认"以继续',
            editable: true,
            success: (r2) => {
              if (r2.confirm && r2.content === '确认') {
                recordRepository.clearAll();
                userProfileRepository.clear();
                wx.showToast({ title: '已清除', icon: 'success' });
                this.loadData();
              }
            }
          });
        }
      }
    });
  },

  onShowDisclaimer() {
    wx.showModal({
      title: '医疗免责声明',
      content: '本应用仅作为健康记录工具，所有分析和建议仅供参考，不能替代专业医生的诊断和建议。如有健康问题，请咨询专业医生。',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  onShowPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '本应用所有数据均存储在您的设备本地，不上传任何服务器。我们重视您的隐私安全。',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});
