/**
 * state.js — 中心状态管理
 * 全局状态读写、变更通知、订阅机制
 */
var State = (function() {
  'use strict';

  var _listeners = {};
  var _state = {
    status: Config.STATUS.IDLE,
    phase: Config.PHASE.COMPANION,
    demoMode: false,
    onboardingActive: false,
    onboardingStep: 0,
    restConversationActive: false,
    restConversationStep: 0,
    currentRestEventId: null,
    capabilityPanelOpen: false,
    settingsPanelOpen: false
  };

  // ===== 订阅机制 =====

  function on(event, callback) {
    if (!_listeners[event]) {
      _listeners[event] = [];
    }
    _listeners[event].push(callback);
  }

  function off(event, callback) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(function(cb) { return cb !== callback; });
  }

  function emit(event, data) {
    if (!_listeners[event]) return;
    _listeners[event].forEach(function(cb) {
      try { cb(data); } catch (e) { console.warn('[State] emit error:', event, e); }
    });
  }

  // ===== 状态读写 =====

  function get(key) {
    if (key) return _state[key];
    return _state;
  }

  function set(key, value) {
    var old = _state[key];
    _state[key] = value;
    if (old !== value) {
      emit('change:' + key, { old: old, new: value });
      emit('change', { key: key, old: old, new: value });
    }
  }

  function setMultiple(updates) {
    Object.keys(updates).forEach(function(key) {
      set(key, updates[key]);
    });
  }

  // ===== 便捷方法 =====

  function getStatus() {
    return _state.status;
  }

  function setStatus(status) {
    set('status', status);
  }

  function getPhase() {
    return _state.phase;
  }

  function setPhase(phase) {
    set('phase', phase);
  }

  function isDemoMode() {
    return _state.demoMode;
  }

  function setDemoMode(mode) {
    set('demoMode', mode);
  }

  function isOnboardingActive() {
    return _state.onboardingActive;
  }

  function setOnboardingActive(active) {
    set('onboardingActive', active);
  }

  function getOnboardingStep() {
    return _state.onboardingStep;
  }

  function setOnboardingStep(step) {
    set('onboardingStep', step);
  }

  function isRestConversationActive() {
    return _state.restConversationActive;
  }

  function setRestConversationActive(active) {
    set('restConversationActive', active);
  }

  function getRestConversationStep() {
    return _state.restConversationStep;
  }

  function setRestConversationStep(step) {
    set('restConversationStep', step);
  }

  function getCurrentRestEventId() {
    return _state.currentRestEventId;
  }

  function setCurrentRestEventId(id) {
    set('currentRestEventId', id);
  }

  // ===== 用户画像 =====

  function getProfile() {
    return LTStorage.getProfile();
  }

  function updateProfile(updates) {
    LTStorage.updateProfile(updates);
    emit('profile:updated', updates);
  }

  // ===== 设置 =====

  function getSettings() {
    return LTStorage.getSettings();
  }

  function updateSettings(updates) {
    LTStorage.updateSettings(updates);
    emit('settings:updated', updates);
  }

  // ===== 作息基线 =====

  function updateScheduleBaseline(baseline) {
    var profile = getProfile();
    profile.sleepTime = baseline.sleepTime || profile.sleepTime || Config.DEFAULTS.SLEEP_TIME;
    profile.wakeUpTime = baseline.wakeUpTime || profile.wakeUpTime || Config.DEFAULTS.WAKE_UP_TIME;
    LTStorage.saveProfile(profile);
    emit('schedule:updated', baseline);
  }

  function setWorkDays(days) {
    var settings = getSettings();
    settings.workDays = days;
    LTStorage.saveSettings(settings);
    emit('workdays:updated', days);
  }

  // ===== 重置 =====

  function reset() {
    LTStorage.clearAll();
    _state = {
      status: Config.STATUS.IDLE,
      phase: Config.PHASE.COMPANION,
      demoMode: false,
      onboardingActive: false,
      onboardingStep: 0,
      restConversationActive: false,
      restConversationStep: 0,
      currentRestEventId: null,
      capabilityPanelOpen: false,
      settingsPanelOpen: false
    };
    emit('reset');
  }

  // ===== 公开 API =====
  return {
    on: on,
    off: off,
    emit: emit,
    get: get,
    set: set,
    setMultiple: setMultiple,
    getStatus: getStatus,
    setStatus: setStatus,
    getPhase: getPhase,
    setPhase: setPhase,
    isDemoMode: isDemoMode,
    setDemoMode: setDemoMode,
    isOnboardingActive: isOnboardingActive,
    setOnboardingActive: setOnboardingActive,
    getOnboardingStep: getOnboardingStep,
    setOnboardingStep: setOnboardingStep,
    isRestConversationActive: isRestConversationActive,
    setRestConversationActive: setRestConversationActive,
    getRestConversationStep: getRestConversationStep,
    setRestConversationStep: setRestConversationStep,
    getCurrentRestEventId: getCurrentRestEventId,
    setCurrentRestEventId: setCurrentRestEventId,
    getProfile: getProfile,
    updateProfile: updateProfile,
    getSettings: getSettings,
    updateSettings: updateSettings,
    updateScheduleBaseline: updateScheduleBaseline,
    setWorkDays: setWorkDays,
    reset: reset
  };
})();