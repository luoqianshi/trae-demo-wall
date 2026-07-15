// pages/me/me.js
const app = getApp();
const G = require('../../utils/game.js');

Page({
  data: {
    topClock: '10:00',
    season: 1, day: 1, minute: 600,
    stats: { sing: 0, dance: 0, pop: 0, mood: 0, fans: 0 },
    seasonRank: null,
    quit: false, graduated: false,
    paused: false, allDone: false,
    mails: [], unreadCount: 0, roomLogCount: 0,
    showRestart: false,
    toast: '', toastShow: false
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this._refresh();
  },
  _refresh() {
    const g = app.globalData;
    const unread = g.mails.filter(m => !m.read).length;
    this.setData({
      topClock: G.fmtTime(g.minute),
      season: g.season, day: g.day, minute: g.minute,
      stats: g.stats, seasonRank: g.seasonRank,
      quit: g.quit, graduated: g.graduated,
      paused: g.paused, allDone: G.allDone(),
      mails: g.mails, unreadCount: unread,
      roomLogCount: g.roomLog.length
    });
  },
  onForceNextDay() {
    G.finishDay();
    this._toast('🌙 进入下一天...');
    setTimeout(() => this._refresh(), 1500);
  },
  onRestart() { this.setData({ showRestart: true }); },
  onRestartCancel() { this.setData({ showRestart: false }); },
  onRestartConfirm() {
    G.restart();
    this.setData({ showRestart: false });
    this._toast('🌸 已重新开始');
    setTimeout(() => this._refresh(), 300);
  },
  _toast(msg) {
    this.setData({ toast: msg, toastShow: true });
    if (this._tT) clearTimeout(this._tT);
    this._tT = setTimeout(() => this.setData({ toastShow: false }), 1500);
  }
});
