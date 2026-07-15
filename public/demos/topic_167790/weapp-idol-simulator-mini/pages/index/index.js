// pages/index/index.js
const app = getApp();
const G = require('../../utils/game.js');

function deltaLabel(d) {
  const out = [];
  Object.keys(d).forEach(k => {
    const sign = d[k] > 0 ? '+' : '';
    out.push({ k: kMap(k), val: sign + d[k], up: d[k] > 0 });
  });
  return out;
}
function kMap(k) {
  return ({ sing: '唱', dance: '舞', pop: '人气', mood: '心情' })[k] || k;
}
function deltaText(d) {
  if (!d) return '';
  const parts = Object.keys(d).map(function(k) {
    const sign = d[k] > 0 ? '+' : '';
    return kMap(k) + ' ' + sign + d[k];
  });
  return parts.length ? ' · ' + parts.join(' ') : '';
}

Page({
  data: {
    topClock: '10:00',
    season: 1, day: 1, minute: 600,
    stats: { sing: 0, dance: 0, pop: 0, mood: 0 },
    schedule: [],
    segCount: 0,
    paused: false,
    allDone: false,
    showEndDay: false,
    showRanking: false,
    showGraduate: false,
    showQuit: false,
    showQuitConfirm: false,
    showDanmaku: false,
    danmakuLines: [],
    rankData: { meIdx: 0, myScore: 0, isTop: false, npcs: [] },
    toast: '', toastShow: false
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this._refresh();
    if (!this._tick) {
      this._tick = setInterval(() => this._onTick(), 1000);
    }
  },
  onUnload() { if (this._tick) { clearInterval(this._tick); this._tick = null; } },
  _onTick() {
    const g = app.globalData;
    if (g.busy || g.paused) return;
    if (g.minute >= app.DAY_END_MIN) {
      if (G.allDone()) {
        g.paused = true;
        this.setData({ showEndDay: true, paused: true });
      } else {
        G.finishDay();
      }
      return;
    }
    g.minute += 1;
    G.tryAutoRoomSpawn();
    app.save();
    this._refresh();
    // 所有行程完成时弹窗提示(不暂停,时间继续走)
    if (G.allDone() && !this.data.showEndDay && !this._endDayNoted && g.minute < app.DAY_END_MIN) {
      this._endDayNoted = true;
      this.setData({ showEndDay: true });
    }
  },
  _refresh() {
    const g = app.globalData;
    G.buildTodaySchedule();
    G.autoExpireSchedule();
    const schedule = g.todaySchedule.map((s, i) => ({
      key: s.key, name: s.name, emo: s.emo, loc: s.loc,
      minute: s.minute, endMin: s.endMin,
      prevEndMin: i > 0 ? g.todaySchedule[i - 1].endMin : s.minute,
      done: s.done, skipped: s.skipped, missed: s.missed,
      isFree: s.isFree, freeChoice: s.freeChoice,
      deltaText: s.done && !s.skipped ? deltaText(s.actualDelta) : ''
    }));
    this.setData({
      topClock: G.fmtTime(g.minute),
      season: g.season, day: g.day, minute: g.minute,
      stats: g.stats,
      schedule, segCount: g.todaySchedule.length,
      paused: g.paused,
      allDone: G.allDone()
    });
  },
  onDo(e) {
    const idx = e.currentTarget.dataset.idx;
    const act = e.currentTarget.dataset.act;
    const cur = G.doActivity(act === 'skip');
    if (!cur) return;
    const action = act === 'skip' ? '💤 休息' : '▶ 参加';
    this._toast(`${action} ${cur.name}`);
    this._refresh();
    // 检查完成 — 弹窗提示,不暂停
    if (G.allDone()) {
      this._endDayNoted = true;
      setTimeout(() => this.setData({ showEndDay: true }), 100);
    }
  },
  onFreeChoice(e) {
    const choiceKey = e.currentTarget.dataset.choice;
    const cur = G.doFreeChoice(choiceKey);
    if (!cur) return;
    this._toast(`🆓 选择了 ${cur.name}`);
    this._refresh();
    if (G.allDone()) {
      this._endDayNoted = true;
      setTimeout(() => this.setData({ showEndDay: true }), 100);
    }
  },
  onEndDay() {
    this.setData({ showEndDay: true });
  },
  onContinue() {
    G.continueFreeTime();
    this.setData({ showEndDay: false });
    this._toast('🕐 时间继续流动');
  },
  onEndDayConfirm() {
    this.setData({ showEndDay: false });
    const lost = G.finishDay();
    if (lost && lost.length) this._toast('💔 ' + lost.length + ' 封邮件超时未回');
    setTimeout(() => {
      this._afterFinish();
    }, 1500);
  },
  onCloseEndDay() { /* 不关,需要按钮操作 */ },
  _afterFinish() {
    const g = app.globalData;
    if (g.seasonRank != null && g._rankNpcs) {
      const meIdx = g._rankMeIdx;
      const myScore = g._rankScore;
      const isTop = meIdx < app.TOP_RANK;
      this.setData({
        showRanking: true,
        rankData: {
          meIdx: meIdx + 1, myScore: Math.round(myScore), isTop,
          npcs: g._rankNpcs.slice(0, 12).map(n => ({ name: n.name, score: Math.round(n.score), isMe: n.isMe }))
        }
      });
    } else {
      this._refresh();
    }
  },
  onNextSeason() {
    const g = app.globalData;
    if (g.season >= app.MAX_SEASON) {
      G.graduate();
      this.setData({ showRanking: false, showGraduate: true });
      return;
    }
    const r = G.nextSeason();
    if (r === 'graduated') {
      this.setData({ showRanking: false, showGraduate: true });
    } else {
      this.setData({ showRanking: false });
      g.seasonRank = null;
      app.save();
      this._toast('✨ 第 ' + g.season + ' 季开始');
      this._refresh();
    }
  },
  onQuit() {
    // 生成弹幕
    const fans = ['小琪','阿鹿','七七','昭昭','沐晴','南风','云兮','禾禾','落落','夏沫'];
    const msgs = [
      '不要走!姐姐不要走!',
      '我们会更努力的,别离开!',
      '没有你我不行的!',
      '求求你别退团!',
      '我哭了,姐姐别走',
      '你走了我怎么办',
      '再想想好不好?',
      '我不想你退团',
      '姐姐别走!抱抱',
      '你答应过我们的!',
      '我的心好痛',
      '没有你的舞台没有意义',
      '再坚持一下好吗?',
      '我们永远支持你,别走',
      '哭了,求你别退'
    ];
    const lines = [];
    for (let i = 0; i < 15; i++) {
      lines.push({
        idx: i,
        av: fans[Math.floor(Math.random() * fans.length)].charAt(0),
        text: msgs[Math.floor(Math.random() * msgs.length)],
        top: Math.floor(Math.random() * 1000) + 60,
        delay: Math.random() * 1.5,
        dur: 3 + Math.random() * 2
      });
    }
    this.setData({ showDanmaku: true, danmakuLines: lines });
    // 3.5秒后弹确认窗
    setTimeout(() => {
      this.setData({ showDanmaku: false, showQuitConfirm: true });
    }, 3500);
  },
  onCancelQuit() {
    this.setData({ showQuitConfirm: false });
    this._toast('💪 粉丝们需要你!');
  },
  onQuitConfirm() {
    G.quitGame();
    this.setData({ showRanking: false, showQuitConfirm: false, showQuit: true });
  },
  onRestart() { G.restart(); this.setData({ showGraduate: false, showQuit: false }); this._refresh(); this._toast('🌸 重新开始'); },
  onCloseRank() { /* need buttons */ },
  _toast(msg) {
    this.setData({ toast: msg, toastShow: true });
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.setData({ toastShow: false }), 1500);
  }
});
