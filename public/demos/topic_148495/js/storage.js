/**
 * storage.js — 数据持久化层
 * 封装 localStorage 操作，统一 JSON 序列化，提供类型安全的 CRUD
 */
var LTStorage = (function() {
  'use strict';

  const KEYS = {
    EVENTS: 'lt_events',
    PROFILE: 'lt_profile',
    SETTINGS: 'lt_settings',
    AI_PLAN: 'lt_ai_plan',
    ONBOARDING_DONE: 'lt_onboarding_done',
    DEMO_LOADED: 'lt_demo_loaded'
  };

  // ===== 通用操作 =====

  function getData(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[Storage] 读取失败:', key, e);
      return null;
    }
  }

  function setData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[Storage] 写入失败:', key, e);
      return false;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearAll() {
    Object.values(KEYS).forEach(function(k) {
      localStorage.removeItem(k);
    });
  }

  // ===== 事件操作 =====

  function getEvents() {
    var data = getData(KEYS.EVENTS);
    if (!data) return [];
    // 兼容 v1 旧格式 {_v:1, _t:..., data:[...]}
    if (data._v === 1 && Array.isArray(data.data)) {
      return data.data;
    }
    if (!Array.isArray(data)) {
      console.warn('[Storage] 事件数据格式异常，已重置');
      return [];
    }
    return data;
  }

  function saveEvents(events) {
    return setData(KEYS.EVENTS, events);
  }

  function addEvent(event) {
    var events = getEvents();
    event.id = event.id || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
    event.createdAt = event.createdAt || new Date().toISOString();
    events.push(event);
    saveEvents(events);
    return event;
  }

  function updateEvent(eventId, updates) {
    var events = getEvents();
    var idx = events.findIndex(function(e) { return e.id === eventId; });
    if (idx === -1) return null;
    Object.assign(events[idx], updates);
    saveEvents(events);
    return events[idx];
  }

  function getTodayEvents() {
    var today = TimeService.today();
    return getEvents().filter(function(e) {
      return e.date === today;
    });
  }

  function getWeekEvents(daysBack) {
    daysBack = daysBack || 7;
    var events = getEvents();
    var cutoff = TimeService.daysAgo(daysBack);
    return events.filter(function(e) {
      return e.date >= cutoff;
    });
  }

  // ===== 用户画像 =====

  function getProfile() {
    return getData(KEYS.PROFILE) || {};
  }

  function saveProfile(profile) {
    return setData(KEYS.PROFILE, profile);
  }

  function updateProfile(updates) {
    var profile = getProfile();
    Object.assign(profile, updates);
    return saveProfile(profile);
  }

  // ===== 设置 =====

  function getSettings() {
    return getData(KEYS.SETTINGS) || {};
  }

  function saveSettings(settings) {
    return setData(KEYS.SETTINGS, settings);
  }

  function updateSettings(updates) {
    var settings = getSettings();
    Object.assign(settings, updates);
    return saveSettings(settings);
  }

  // ===== AI 规划 =====

  function getAIPlan() {
    return getData(KEYS.AI_PLAN) || null;
  }

  function saveAIPlan(plan) {
    return setData(KEYS.AI_PLAN, plan);
  }

  // ===== 标记 =====

  function isOnboardingDone() {
    return getData(KEYS.ONBOARDING_DONE) === true;
  }

  function setOnboardingDone(done) {
    return setData(KEYS.ONBOARDING_DONE, done);
  }

  function isDemoLoaded() {
    return getData(KEYS.DEMO_LOADED) === true;
  }

  function setDemoLoaded(loaded) {
    return setData(KEYS.DEMO_LOADED, loaded);
  }

  // ===== 公开 API =====
  return {
    KEYS: KEYS,
    getData: getData,
    setData: setData,
    remove: remove,
    clearAll: clearAll,
    getEvents: getEvents,
    saveEvents: saveEvents,
    addEvent: addEvent,
    updateEvent: updateEvent,
    getTodayEvents: getTodayEvents,
    getWeekEvents: getWeekEvents,
    getProfile: getProfile,
    saveProfile: saveProfile,
    updateProfile: updateProfile,
    getSettings: getSettings,
    saveSettings: saveSettings,
    updateSettings: updateSettings,
    getAIPlan: getAIPlan,
    saveAIPlan: saveAIPlan,
    isOnboardingDone: isOnboardingDone,
    setOnboardingDone: setOnboardingDone,
    isDemoLoaded: isDemoLoaded,
    setDemoLoaded: setDemoLoaded
  };
})();