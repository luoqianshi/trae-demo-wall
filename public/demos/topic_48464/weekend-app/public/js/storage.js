/**
 * 本地存储管理 (WI-2.2 / WI-2.3 / WI-2.4)
 * 统一管理 localStorage：偏好持久化、方案历史、方案收藏。
 * 所有数据存浏览器本地，不依赖后端，离线可用。
 */
(function () {
  'use strict';

  const KEYS = {
    PREFS: 'wd_prefs',
    HISTORY: 'wd_history',
    FAVORITES: 'wd_favorites'
  };
  const MAX_HISTORY = 20;
  const MAX_FAVORITES = 50;

  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function safeSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { console.warn('[Storage] 写入失败:', e.message); return false; }
  }

  // 生成方案唯一 ID
  function genId(plan) {
    return (plan.plan_name || 'plan') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  }

  // === WI-2.4 偏好持久化 ===
  function savePrefs(prefs) {
    safeSet(KEYS.PREFS, { prefs, ts: Date.now() });
  }
  function loadPrefs() {
    const data = safeGet(KEYS.PREFS, null);
    return data ? data.prefs : null;
  }
  function hasSavedPrefs() {
    return safeGet(KEYS.PREFS, null) !== null;
  }

  // === WI-2.3 方案历史记录 ===
  function addHistory(plan, prefs) {
    const history = safeGet(KEYS.HISTORY, []);
    history.unshift({ id: genId(plan), plan, prefs, ts: Date.now() });
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    safeSet(KEYS.HISTORY, history);
  }
  function getHistory() {
    return safeGet(KEYS.HISTORY, []);
  }
  function clearHistory() {
    safeSet(KEYS.HISTORY, []);
  }

  // === WI-2.2 方案收藏 ===
  function addFavorite(plan, prefs) {
    const favs = safeGet(KEYS.FAVORITES, []);
    // 去重：同名方案不重复收藏
    if (favs.some(f => f.plan.plan_name === plan.plan_name)) return false;
    favs.unshift({ id: genId(plan), plan, prefs, ts: Date.now() });
    if (favs.length > MAX_FAVORITES) favs.length = MAX_FAVORITES;
    safeSet(KEYS.FAVORITES, favs);
    return true;
  }
  function removeFavorite(id) {
    const favs = safeGet(KEYS.FAVORITES, []);
    const filtered = favs.filter(f => f.id !== id);
    safeSet(KEYS.FAVORITES, filtered);
    return filtered.length !== favs.length;
  }
  function getFavorites() {
    return safeGet(KEYS.FAVORITES, []);
  }
  function isFavorite(planName) {
    const favs = safeGet(KEYS.FAVORITES, []);
    return favs.some(f => f.plan.plan_name === planName);
  }

  // 暴露
  window.__storage = {
    savePrefs, loadPrefs, hasSavedPrefs,
    addHistory, getHistory, clearHistory,
    addFavorite, removeFavorite, getFavorites, isFavorite,
    genId
  };
})();
