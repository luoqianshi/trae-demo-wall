/**
 * AI私人咖啡甜度师 - 数据层
 * 基于 localStorage 持久化用户画像和历史记录
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'coffee_sweetness_data_v1';

  // 默认数据结构
  function defaultData() {
    return {
      profile: {
        basePreference: 5.0,   // 基准甜度偏好 0-10
        adaptCount: 0,          // 学习次数
        totalRecords: 0,        // 总推荐记录数
        createdAt: Date.now()
      },
      history: [],              // 推荐历史数组
      nickname: '咖啡探索者',
      settings: {
        healthGoal: 'none',     // 默认健康目标
        dailySugarLimit: 25     // 每日糖摄入上限(g)，WHO建议
      }
    };
  }

  // 读取全部数据
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      var data = JSON.parse(raw);
      // 合并默认值，防止旧版本缺字段
      var base = defaultData();
      data.profile = Object.assign(base.profile, data.profile || {});
      data.settings = Object.assign(base.settings, data.settings || {});
      data.history = data.history || [];
      return data;
    } catch (e) {
      console.warn('[Store] 数据读取失败，重置为默认', e);
      return defaultData();
    }
  }

  // 保存全部数据
  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('[Store] 数据保存失败', e);
      return false;
    }
  }

  // ============ Profile 操作 ============
  function getProfile() {
    return load().profile;
  }

  function updateProfile(updater) {
    var data = load();
    data.profile = updater(data.profile);
    save(data);
    return data.profile;
  }

  // ============ History 操作 ============
  function getHistory() {
    return load().history;
  }

  function addHistory(record) {
    var data = load();
    data.history.unshift(record);
    // 最多保留 200 条
    if (data.history.length > 200) data.history = data.history.slice(0, 200);
    data.profile.totalRecords = (data.profile.totalRecords || 0) + 1;
    save(data);
    return data.history;
  }

  function updateHistoryFeedback(id, feedback) {
    var data = load();
    for (var i = 0; i < data.history.length; i++) {
      if (data.history[i].id === id) {
        data.history[i].feedback = feedback;
        break;
      }
    }
    save(data);
  }

  function clearHistory() {
    var data = load();
    data.history = [];
    save(data);
  }

  // ============ 统计 ============
  function getStats() {
    var data = load();
    var history = data.history;
    var totalSugar = 0;
    var todaySugar = 0;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayTs = today.getTime();

    var moodCount = {};
    var drinkCount = {};

    for (var i = 0; i < history.length; i++) {
      var r = history[i];
      totalSugar += r.grams || 0;
      if (r.timestamp >= todayTs) todaySugar += r.grams || 0;
      if (r.input && r.input.mood) moodCount[r.input.mood] = (moodCount[r.input.mood] || 0) + 1;
      if (r.input && r.input.drink) drinkCount[r.input.drink] = (drinkCount[r.input.drink] || 0) + 1;
    }

    return {
      totalRecords: history.length,
      totalSugar: Math.round(totalSugar * 10) / 10,
      todaySugar: Math.round(todaySugar * 10) / 10,
      dailyLimit: data.settings.dailySugarLimit,
      avgSugar: history.length > 0 ? Math.round((totalSugar / history.length) * 10) / 10 : 0,
      topMood: topKey(moodCount),
      topDrink: topKey(drinkCount),
      basePreference: data.profile.basePreference
    };
  }

  function topKey(obj) {
    var max = 0, key = null;
    for (var k in obj) {
      if (obj[k] > max) { max = obj[k]; key = k; }
    }
    return key;
  }

  // ============ Settings ============
  function getSettings() { return load().settings; }
  function updateSettings(updater) {
    var data = load();
    data.settings = updater(data.settings);
    save(data);
    return data.settings;
  }
  function getNickname() { return load().nickname; }
  function setNickname(name) {
    var data = load();
    data.nickname = name || '咖啡探索者';
    save(data);
  }

  // ============ 重置 ============
  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    return defaultData();
  }

  // ============ 导出 ============
  global.Store = {
    load: load,
    save: save,
    getProfile: getProfile,
    updateProfile: updateProfile,
    getHistory: getHistory,
    addHistory: addHistory,
    updateHistoryFeedback: updateHistoryFeedback,
    clearHistory: clearHistory,
    getStats: getStats,
    getSettings: getSettings,
    updateSettings: updateSettings,
    getNickname: getNickname,
    setNickname: setNickname,
    resetAll: resetAll
  };
})(window);
