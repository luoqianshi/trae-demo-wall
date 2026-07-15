// pages/flip/flip.js
const app = getApp();
const G = require('../../utils/game.js');

function makeMailsView(mails) {
  return mails.map(m => {
    const ttl = m.expiresDay - app.globalData.day;
    let ttlClass = '', ttlText = '';
    if (m.reply) { ttlText = '✓ 已回复'; }
    else if (ttl <= 0) { ttlClass = 'urgent'; ttlText = '⚠️ 已超时'; }
    else if (ttl <= 1) { ttlClass = 'urgent'; ttlText = '⏰ 还剩 1 天'; }
    else if (ttl <= 2) { ttlClass = 'warn'; ttlText = '⏰ 还剩 ' + ttl + ' 天'; }
    else { ttlText = '还剩 ' + ttl + ' 天'; }
    return Object.assign({}, m, { ttlClass, ttlText, avatarChar: m.avatar.charAt(0) });
  });
}

Page({
  data: {
    topClock: '10:00',
    season: 1, day: 1,
    mails: [], unreadCount: 0,
    showConv: false, curMail: null, quickReplies: [], myInput: '',
    toast: '', toastShow: false
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
      // 更新未读 badge
      const unread = app.globalData.mails.filter(m => !m.read).length;
      this.getTabBar().updateBadge(unread ? String(unread) : '');
    }
    G.ensureMails();
    this._refresh();
    if (!this._tick) this._tick = setInterval(() => this._refresh(), 1000);
  },
  onUnload() { if (this._tick) { clearInterval(this._tick); this._tick = null; } },
  _refresh() {
    const g = app.globalData;
    const mails = makeMailsView(g.mails);
    const unreadCount = mails.filter(m => !m.read).length;
    // 更新自定义 tabBar badge
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateBadge(unreadCount ? String(unreadCount) : '');
    }
    this.setData({
      topClock: G.fmtTime(g.minute),
      season: g.season, day: g.day,
      mails, unreadCount
    });
  },
  onOpenMail(e) {
    const id = e.currentTarget.dataset.id;
    const g = app.globalData;
    const m = g.mails.find(x => x.id === id);
    if (!m) return;
    m.read = true;
    app.save();
    m.avatarChar = m.avatar.charAt(0);
    const replies = G.genMailReplies(m.text);
    this.setData({ showConv: true, curMail: m, quickReplies: replies, myInput: '' });
    this._refresh();
  },
  onCloseConv() { this.setData({ showConv: false }); },
  onInput(e) { this.setData({ myInput: e.detail.value }); },
  onQuickReply(e) {
    const idx = e.currentTarget.dataset.idx;
    const reply = this.data.quickReplies[idx];
    if (!reply) return;
    this._doReply(reply.text, reply.delta);
  },
  onSend() {
    const v = (this.data.myInput || '').trim();
    if (!v) return;
    this._doReply(v, { pop: +1, mood: +2 });
  },
  _doReply(text, delta) {
    const m = this.data.curMail;
    if (!m || m.reply) return;
    m.reply = text;
    const g = app.globalData;
    Object.keys(delta).forEach(k => { g.stats[k] = G.clamp(g.stats[k] + delta[k], 0, 100); });
    app.save();
    this._toast('✅ 已回复');
    this.setData({ showConv: false, myInput: '' });
    this._refresh();
  },
  _toast(msg) {
    this.setData({ toast: msg, toastShow: true });
    if (this._tT) clearTimeout(this._tT);
    this._tT = setTimeout(() => this.setData({ toastShow: false }), 1500);
  }
});
