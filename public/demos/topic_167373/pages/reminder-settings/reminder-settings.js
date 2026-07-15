const { appSettingsRepository } = require('../../data/repositories/index.js');
const AppSettings = require('../../data/models/app-settings.js');
const app = getApp();

Page({
  data: {
    reminderEnabled: false,
    reminderTime: '09:00',
    reminderHour: 9,
    reminderMinute: 0,
    repeatDays: [
      { label: '一', value: true, calendarDay: 2 },
      { label: '二', value: true, calendarDay: 3 },
      { label: '三', value: true, calendarDay: 4 },
      { label: '四', value: true, calendarDay: 5 },
      { label: '五', value: true, calendarDay: 6 },
      { label: '六', value: true, calendarDay: 7 },
      { label: '日', value: true, calendarDay: 1 }
    ]
  },

  onLoad() {
    this.loadSettings();
  },

  loadSettings() {
    const settings = appSettingsRepository.getSettings();
    const daysArray = settings.getRepeatDaysArray();

    // 顺序：周一到周日
    const order = [2, 3, 4, 5, 6, 7, 1];
    const repeatDays = this.data.repeatDays.map((d, i) => ({
      ...d,
      value: daysArray[i] !== undefined ? daysArray[i] : true
    }));

    this.setData({
      reminderEnabled: settings.reminderEnabled,
      reminderTime: settings.getReminderTime(),
      reminderHour: settings.reminderHour,
      reminderMinute: settings.reminderMinute,
      repeatDays
    });
  },

  onToggleEnabled(e) {
    this.setData({ reminderEnabled: e.detail.value });
  },

  onTimeChange(e) {
    const [hour, minute] = e.detail.value.split(':').map(Number);
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    this.setData({
      reminderHour: hour,
      reminderMinute: minute,
      reminderTime: timeStr
    });
  },

  onDayToggle(e) {
    const index = e.currentTarget.dataset.index;
    const repeatDays = [...this.data.repeatDays];
    repeatDays[index] = { ...repeatDays[index], value: !repeatDays[index].value };
    this.setData({ repeatDays });
  },

  onSave() {
    const settings = appSettingsRepository.getSettings();
    settings.reminderEnabled = this.data.reminderEnabled;
    settings.reminderHour = this.data.reminderHour;
    settings.reminderMinute = this.data.reminderMinute;
    settings.reminderRepeatDays = this.data.repeatDays.map(d => d.value ? '1' : '0').join(',');

    appSettingsRepository.saveSettings(settings);

    // PT-mp-007 修复：
    // 微信小程序没有后台定时器能力，"定时闹钟"在纯前端只能采用
    // "应用回到前台时按设置时间检查并提示"的方案。
    // 真正的服务端推送需要业务后端 + 订阅消息模板，不在本应用范围内。
    // 这里清除今日提醒去重，让用户在下次进入应用时按设定时间收到提示。
    if (this.data.reminderEnabled) {
      try {
        wx.removeStorageSync('pt_last_reminder_date');
      } catch (e) {}
    }

    // 修复 PT-mp-008：保存后立即退出。
    // 不在 onSave 内同步弹 modal，否则会阻塞 setTimeout 的 navigateBack，
    // 用户感觉"点击保存按钮没有退出"。
    wx.showToast({
      title: this.data.reminderEnabled ? '已保存，应用前台时按设定时间提醒' : '已保存',
      icon: 'success',
      duration: 1500
    });
    setTimeout(() => wx.navigateBack(), 1200);
  },

  requestNotificationPermission() {
    // PT-mp-007 修复：旧版依赖 wx.requestSubscribeMessage 但 tmplIds 为空，
    // 订阅不会成功。保留方法体以兼容可能的未来订阅消息能力。
    wx.showToast({
      title: '请在应用前台时接收提醒',
      icon: 'none',
      duration: 2000
    });
  }
});
