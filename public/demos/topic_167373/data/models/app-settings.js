// models/app-settings.js
// 应用设置模型（单例）

function getDefaultSettings() {
  return {
    id: 1,
    hasCompletedOnboarding: false,
    hasAcceptedTerms: false,
    hasAcceptedDisclaimer: false,
    hasSeenFabHint: false,
    defaultBristolType: 4,
    defaultColor: 'brown',
    reminderEnabled: false,
    reminderHour: 9,
    reminderMinute: 0,
    reminderRepeatDays: '1,1,1,1,1,1,1',
    // V0.2.0 波波角色配置
    boboEnabled: true,           // 波波总开关
    boboBubbleCount: 3,          // 引导气泡最大数（之后不再弹）
    boboHasMet: false,           // 是否已首次见面
    // V0.2.0-fix：波波立绘位置（首页日历页），单位 rpx
    // null 表示使用默认位置（FAB 旁）
    boboPosition: null           // { x: Number, y: Number }，屏幕坐标 rpx
  };
}

class AppSettings {
  /**
   * @param {object} options
   */
  constructor(options) {
    const defaults = getDefaultSettings();
    options = options || {};
    this.id = options.id != null ? options.id : defaults.id;
    this.hasCompletedOnboarding = options.hasCompletedOnboarding != null
      ? !!options.hasCompletedOnboarding
      : defaults.hasCompletedOnboarding;
    this.hasAcceptedTerms = options.hasAcceptedTerms != null
      ? !!options.hasAcceptedTerms
      : defaults.hasAcceptedTerms;
    this.hasAcceptedDisclaimer = options.hasAcceptedDisclaimer != null
      ? !!options.hasAcceptedDisclaimer
      : defaults.hasAcceptedDisclaimer;
    this.hasSeenFabHint = options.hasSeenFabHint != null
      ? !!options.hasSeenFabHint
      : defaults.hasSeenFabHint;
    this.defaultBristolType = options.defaultBristolType != null
      ? options.defaultBristolType
      : defaults.defaultBristolType;
    this.defaultColor = options.defaultColor || defaults.defaultColor;
    this.reminderEnabled = options.reminderEnabled != null
      ? !!options.reminderEnabled
      : defaults.reminderEnabled;
    this.reminderHour = options.reminderHour != null ? options.reminderHour : defaults.reminderHour;
    this.reminderMinute = options.reminderMinute != null ? options.reminderMinute : defaults.reminderMinute;
    this.reminderRepeatDays = options.reminderRepeatDays || defaults.reminderRepeatDays;
    // V0.2.0 波波角色配置
    this.boboEnabled = options.boboEnabled != null ? !!options.boboEnabled : defaults.boboEnabled;
    this.boboBubbleCount = options.boboBubbleCount != null && isFinite(options.boboBubbleCount)
      ? Math.max(0, Math.floor(Number(options.boboBubbleCount)))
      : defaults.boboBubbleCount;
    this.boboHasMet = options.boboHasMet != null ? !!options.boboHasMet : defaults.boboHasMet;
    // V0.2.0-fix：boboPosition
    if (options.boboPosition != null && typeof options.boboPosition === 'object') {
      const x = Number(options.boboPosition.x);
      const y = Number(options.boboPosition.y);
      if (isFinite(x) && isFinite(y)) {
        this.boboPosition = { x, y };
      } else {
        this.boboPosition = null;
      }
    } else {
      this.boboPosition = null;
    }
  }

  /**
   * 静态工厂：null/undefined 返回一份默认设置
   */
  static fromObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return new AppSettings(getDefaultSettings());
    }
    return new AppSettings({
      id: obj.id,
      hasCompletedOnboarding: obj.hasCompletedOnboarding,
      hasAcceptedTerms: obj.hasAcceptedTerms,
      hasAcceptedDisclaimer: obj.hasAcceptedDisclaimer,
      hasSeenFabHint: obj.hasSeenFabHint,
      defaultBristolType: obj.defaultBristolType,
      defaultColor: obj.defaultColor,
      reminderEnabled: obj.reminderEnabled,
      reminderHour: obj.reminderHour,
      reminderMinute: obj.reminderMinute,
      reminderRepeatDays: obj.reminderRepeatDays,
      // V0.2.0 波波角色
      boboEnabled: obj.boboEnabled,
      boboBubbleCount: obj.boboBubbleCount,
      boboHasMet: obj.boboHasMet,
      boboPosition: obj.boboPosition && typeof obj.boboPosition === 'object'
        ? { x: Number(obj.boboPosition.x), y: Number(obj.boboPosition.y) }
        : null
    });
  }

  toObject() {
    return {
      id: this.id,
      hasCompletedOnboarding: this.hasCompletedOnboarding,
      hasAcceptedTerms: this.hasAcceptedTerms,
      hasAcceptedDisclaimer: this.hasAcceptedDisclaimer,
      hasSeenFabHint: this.hasSeenFabHint,
      defaultBristolType: this.defaultBristolType,
      defaultColor: this.defaultColor,
      reminderEnabled: this.reminderEnabled,
      reminderHour: this.reminderHour,
      reminderMinute: this.reminderMinute,
      reminderRepeatDays: this.reminderRepeatDays,
      boboEnabled: this.boboEnabled,
      boboBubbleCount: this.boboBubbleCount,
      boboHasMet: this.boboHasMet,
      boboPosition: this.boboPosition ? { x: this.boboPosition.x, y: this.boboPosition.y } : null
    };
  }

  /**
   * 形如 "HH:mm" 的提醒时间字符串
   */
  getReminderTime() {
    const h = String(this.reminderHour).padStart(2, '0');
    const m = String(this.reminderMinute).padStart(2, '0');
    return h + ':' + m;
  }

  /**
   * 将 reminderRepeatDays 解析为长度为 7 的 boolean 数组
   * 索引 0 表示周日，6 表示周六
   */
  getRepeatDaysArray() {
    const result = [false, false, false, false, false, false, false];
    if (typeof this.reminderRepeatDays !== 'string') return result;
    const parts = this.reminderRepeatDays.split(',');
    for (let i = 0; i < 7 && i < parts.length; i++) {
      result[i] = parts[i] === '1' || parts[i] === 1 || parts[i] === true;
    }
    return result;
  }
}

module.exports = AppSettings;
