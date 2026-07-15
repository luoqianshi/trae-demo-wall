// app.js
const storageManager = require('./data/storage/storage-manager.js');
const { appSettingsRepository, recordRepository } = require('./data/repositories');
const { getStartOfToday, getEndOfToday } = require('./utils/date-utils.js');
const STORAGE_KEYS = require('./data/storage/storage-keys.js');

App({
  /**
   * 全局数据
   */
  globalData: {
    version: '1.0.0',
    systemInfo: null,
    isFirstLaunch: true,
    hasAcceptedTerms: false,
    hasAcceptedDisclaimer: false
  },

  /**
   * 应用启动时执行
   * pages[0] = home 启动时直接渲染首页（避免 welcome 作首屏时被销毁造成空白）
   * 首次启动若未走完三步 → onLaunch 内 reLaunch 到 welcome
   */
  onLaunch() {
    console.log('[App] 排便健康记录工具启动');

    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;
      console.log('[App] 系统信息:', systemInfo.platform, systemInfo.system);
    } catch (e) {
      console.error('[App] 获取系统信息失败:', e);
    }

    try {
      storageManager.init();
      const settings = appSettingsRepository.getSettings();
      this.globalData.isFirstLaunch = !settings.hasCompletedOnboarding;
      this.globalData.hasAcceptedTerms = !!settings.hasAcceptedTerms;
      this.globalData.hasAcceptedDisclaimer = !!settings.hasAcceptedDisclaimer;
      console.log('[App] 是否首次启动:', this.globalData.isFirstLaunch);

      // 修复 PT-mp-welcome-003：未完成三步才主动跳 welcome
      const needOnboarding = !(
        settings.hasCompletedOnboarding &&
        settings.hasAcceptedTerms &&
        settings.hasAcceptedDisclaimer
      );
      if (needOnboarding) {
        // 推迟到下一帧再跳，让 home 至少渲染一次避免空白闪屏
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/welcome/welcome' });
        }, 0);
      }
    } catch (e) {
      console.error('[App] 初始化存储失败:', e);
    }
  },

  /**
   * PT-mp-007 修复：每次应用回到前台时，检查本地"提醒"条件
   * 由于微信小程序不开放后台定时器，订阅消息又需后端，
   * 这里采用"进入应用时按设置时间提示 + 振动 + 角标" 的本地方案。
   * 每日最多弹一次（通过 lastReminderDate 记录去重）。
   */
  onShow() {
    this.checkAndTriggerReminder();
  },

  /**
   * 检查并触发本地提醒
   * 触发条件：
   *   1) 提醒启用
   *   2) 今天在重复日列表中
   *   3) 当前时间 ≥ 提醒时间
   *   4) 今天还没有任何记录
   *   5) 今天还没弹过提醒
   */
  checkAndTriggerReminder() {
    try {
      const settings = appSettingsRepository.getSettings();
      if (!settings || !settings.reminderEnabled) return;

      const now = new Date();
      const dayIdx = now.getDay(); // 0=周日, 1=周一 ... 6=周六
      const days = settings.getRepeatDaysArray();
      // getRepeatDaysArray 索引 0=周日，6=周六；与 Date.getDay() 一致
      if (!days[dayIdx]) return;

      const curMinutes = now.getHours() * 60 + now.getMinutes();
      const remMinutes = (settings.reminderHour || 0) * 60 + (settings.reminderMinute || 0);
      if (curMinutes < remMinutes) return;

      // 今日是否已记录
      const startOfDay = getStartOfToday();
      const endOfDay = getEndOfToday();
      const todayRecords = recordRepository.getRecordsByDate(startOfDay, endOfDay);
      if (todayRecords && todayRecords.length > 0) return;

      // 今日已弹过则跳过
      const lastDate = wx.getStorageSync(STORAGE_KEYS.LAST_REMINDER_DATE || 'lastReminderDate');
      const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      if (lastDate === todayStr) return;

      // 标记已弹
      try {
        wx.setStorageSync(STORAGE_KEYS.LAST_REMINDER_DATE || 'lastReminderDate', todayStr);
      } catch (e) {
        console.error('[App] 写提醒去重失败', e);
      }

      // 触发本地提示
      const timeText = settings.getReminderTime ? settings.getReminderTime() : '设定时间';
      wx.showModal({
        title: '⏰ 排便提醒',
        content: `现在是 ${timeText}，今天还没有记录哦，记得保持健康习惯！`,
        confirmText: '去记录',
        cancelText: '稍后',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/home/home' });
          }
        }
      });
      try { wx.vibrateShort({ type: 'light' }); } catch (e) {}
    } catch (e) {
      console.error('[App] checkAndTriggerReminder error:', e);
    }
  },

  /**
   * 显示全局错误
   */
  showError(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 显示全局加载
   */
  showLoading(title = '加载中...') {
    wx.showLoading({
      title: title,
      mask: true
    });
  },

  /**
   * 隐藏加载
   */
  hideLoading() {
    wx.hideLoading();
  }
});
