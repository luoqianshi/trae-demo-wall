/* 全局命名空间 —— 兼容 file:// 的 classic script 模式 */
window.App = window.App || {};

(function (App) {
  'use strict';

  var KEY = 'fanren_xiuxian_demo_v1';

  // 境界体系（Demo：练气 -> 筑基 -> 金丹 -> 元婴）
  var REALMS = [
    { name: '练气', sub: '一层', need: 0 },
    { name: '练气', sub: '三层', need: 60 },
    { name: '练气', sub: '圆满', need: 150 },
    { name: '筑基', sub: '初期', need: 300 },
    { name: '筑基', sub: '中期', need: 520 },
    { name: '金丹', sub: '初成', need: 800 },
    { name: '金丹', sub: '圆满', need: 1200 },
    { name: '元婴', sub: '初显', need: 1800 }
  ];

  var defaults = function () {
    return {
      name: '无名散修',
      cultivation: 0,          // 修为值
      streak: 0,               // 连续打卡天数
      lastCheckDate: '',       // 上次打卡日期 yyyy-mm-dd
      unlockedGongfa: ['baduanjin'], // 已解锁功法
      todayTasksDone: {},      // { 'yyyy-mm-dd': [taskId...] }
      divinationLog: [],       // 问卜日志
      baziRecords: [],         // 命盘记录
      faceRecords: [],         // 面相状态记录
      chatHistory: [],         // AI 对话
      createdAt: Date.now()
    };
  };

  var state = null;

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      state = raw ? Object.assign(defaults(), JSON.parse(raw)) : defaults();
    } catch (e) {
      state = defaults();
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function get() { if (!state) load(); return state; }

  function set(patch) {
    Object.assign(get(), patch);
    save();
  }

  function reset() {
    state = defaults();
    save();
  }

  // 计算当前境界
  function currentRealm() {
    var c = get().cultivation;
    var idx = 0;
    for (var i = 0; i < REALMS.length; i++) {
      if (c >= REALMS[i].need) idx = i;
    }
    return { index: idx, realm: REALMS[idx] };
  }

  // 距离下一境界的进度 0..1
  function realmProgress() {
    var c = get().cultivation;
    var cur = currentRealm();
    var next = REALMS[cur.index + 1];
    if (!next) return { pct: 1, next: null, cur: cur.realm, remain: 0 };
    var base = cur.realm.need;
    var span = next.need - base;
    var pct = Math.max(0, Math.min(1, (c - base) / span));
    return { pct: pct, next: next, cur: cur.realm, remain: next.need - c };
  }

  // 增加修为，返回是否升级
  function addCultivation(amount) {
    var before = currentRealm().index;
    set({ cultivation: get().cultivation + amount });
    var after = currentRealm().index;
    return after > before ? currentRealm().realm : null;
  }

  // 今日日期字符串
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // 每日任务打卡；同一任务当天只记一次
  function markTaskDone(taskId) {
    var t = today();
    var map = get().todayTasksDone;
    if (!map[t]) map[t] = [];
    if (map[t].indexOf(taskId) >= 0) return false; // 已完成
    map[t].push(taskId);
    set({ todayTasksDone: map });
    return true;
  }

  function isTaskDone(taskId) {
    var map = get().todayTasksDone;
    var arr = map[today()] || [];
    return arr.indexOf(taskId) >= 0;
  }

  // 打卡（更新连续天数）
  function checkIn() {
    var t = today();
    var last = get().lastCheckDate;
    if (last === t) return; // 今天已经算过
    var streak = get().streak;
    // 判断是否连续
    var y = new Date(); y.setDate(y.getDate() - 1);
    var yesterday = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
    streak = (last === yesterday) ? streak + 1 : 1;
    set({ streak: streak, lastCheckDate: t });
  }

  function unlockGongfa(id) {
    var list = get().unlockedGongfa;
    if (list.indexOf(id) < 0) { list.push(id); set({ unlockedGongfa: list }); return true; }
    return false;
  }
  function isGongfaUnlocked(id) { return get().unlockedGongfa.indexOf(id) >= 0; }

  function pushLog(field, item) {
    var arr = get()[field] || [];
    arr.unshift(item);
    if (arr.length > 50) arr = arr.slice(0, 50);
    var patch = {}; patch[field] = arr; set(patch);
  }

  App.Store = {
    REALMS: REALMS,
    load: load, save: save, get: get, set: set, reset: reset,
    currentRealm: currentRealm, realmProgress: realmProgress, addCultivation: addCultivation,
    today: today, markTaskDone: markTaskDone, isTaskDone: isTaskDone, checkIn: checkIn,
    unlockGongfa: unlockGongfa, isGongfaUnlocked: isGongfaUnlocked, pushLog: pushLog
  };
})(window.App);
