// app.js — 星耀 · 偶像成长手账
App({
  globalData: {
    season: 1,
    day: 1,
    minute: 10 * 60,
    stats: { sing: 30, dance: 30, pop: 20, mood: 60, fans: 60 },
    seasonRank: null,
    quit: false,
    graduated: false,
    busy: false,
    mails: [],
    roomLog: [],
    lastRoomSpawnMin: -1,
    todaySchedule: [],
    todayDate: -1,
    todaySeason: -1,
    skipCount: 0,
    paused: false,
    _mailsGenDay: -1,
    _mailsGenSeason: -1
  },
  DAY_IN_SEASON: 15,
  MAX_SEASON: 10,
  PLAYER_COUNT: 50,
  TOP_RANK: 16,
  DAY_START_MIN: 10 * 60,
  DAY_END_MIN: 24 * 60,
  MAIL_TTL_DAYS: 5,
  onLaunch() {
    const saved = wx.getStorageSync('idolState');
    if (saved) {
      Object.assign(this.globalData, saved);
      // 数据兼容: 确保必要字段存在
      if (!this.globalData.stats) this.globalData.stats = { sing: 30, dance: 30, pop: 20, mood: 60, fans: 60 };
      if (!this.globalData.stats.fans) this.globalData.stats.fans = 60;
      if (!Array.isArray(this.globalData.todaySchedule)) this.globalData.todaySchedule = [];
      if (!Array.isArray(this.globalData.mails)) this.globalData.mails = [];
      if (!Array.isArray(this.globalData.roomLog)) this.globalData.roomLog = [];
      // 如果行程数据格式过旧(缺 isFree 字段),强制重建
      if (this.globalData.todaySchedule.length > 0 && this.globalData.todaySchedule[0].isFree === undefined) {
        this.globalData.todayDate = -1;
        this.globalData.todaySchedule = [];
      }
    }
  },
  save() {
    wx.setStorageSync('idolState', this.globalData);
  }
});
