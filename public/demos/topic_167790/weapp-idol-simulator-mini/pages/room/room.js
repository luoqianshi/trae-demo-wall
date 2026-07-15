// pages/room/room.js
const app = getApp();
const G = require('../../utils/game.js');

Page({
  data: {
    topClock: '10:00',
    season: 1, day: 1,
    logs: [],
    myInput: '',
    quickReplies: [],
    lastId: '',
    toast: '', toastShow: false
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    if (app.globalData.roomLog.length === 0) G.seedRoomLog();
    this._refresh();
    if (!this._tick) this._tick = setInterval(() => this._refresh(), 1500);
  },
  onUnload() { if (this._tick) { clearInterval(this._tick); this._tick = null; } },
  _refresh() {
    G.tryAutoRoomSpawn();
    const g = app.globalData;
    const logs = g.roomLog.map((m, i) => {
      const prev = i > 0 ? g.roomLog[i - 1] : null;
      const showHead = !(prev && prev.who === m.who && prev.me === m.me);
      return {
        idx: i, who: m.who, text: m.text, me: m.me,
        av: m.me ? '我' : m.who.charAt(0),
        timeLabel: G.chatTimeLabel(m),
        showHead: !!showHead,
        hiddenStyle: showHead ? '' : 'visibility:hidden'
      };
    });
    this.setData({
      topClock: G.fmtTime(g.minute),
      season: g.season, day: g.day,
      logs, lastId: logs.length ? 'msg-' + (logs.length - 1) : ''
    });
    // 根据最新粉丝消息生成快捷回复 (仅当粉丝消息变化时)
    const lastFan = g.roomLog.filter(function(m) { return !m.me; }).pop();
    const fanText = lastFan ? lastFan.text : '';
    if (fanText && fanText !== this._lastFanText) {
      this._lastFanText = fanText;
      this.setData({ quickReplies: G.genRoomReplies(fanText) });
    }
  },
  onInput(e) { this.setData({ myInput: e.detail.value }); },
  onQuickReply(e) {
    const idx = e.currentTarget.dataset.idx;
    const reply = this.data.quickReplies[idx];
    if (!reply) return;
    this._sendText(reply.text, reply.delta);
  },
  onSend() {
    const v = (this.data.myInput || '').trim();
    if (!v) return;
    this.setData({ myInput: '' });
    this._sendText(v, { pop: +1, mood: +2 });
  },
  _sendText(text, delta) {
    const g = app.globalData;
    if (delta) Object.keys(delta).forEach(function(k) { g.stats[k] = G.clamp(g.stats[k] + delta[k], 0, 100); });
    G.pushRoom('我', text, true);
    app.save();
    this._toast('💬 已发送');
    this._refresh();
    // 1.5s 后粉丝接话
    setTimeout(() => {
      const line = G.genFanLine();
      G.pushRoom(line.who, G.pickRoomChatterText(text));
      app.save();
      this._refresh();
    }, 1500);
    // 心情好 2.8s 后再来一条
    if (g.stats.mood >= 70) {
      setTimeout(() => {
        const line2 = G.genFanLine();
        const replies = ['太真实了!', '哈哈哈笑死 😂', '+1 姐妹说得对'];
        G.pushRoom(line2.who, replies[Math.floor(Math.random() * replies.length)]);
        app.save();
        this._refresh();
      }, 2800);
    }
  },
  _toast(msg) {
    this.setData({ toast: msg, toastShow: true });
    if (this._tT) clearTimeout(this._tT);
    this._tT = setTimeout(() => this.setData({ toastShow: false }), 1500);
  }
});
