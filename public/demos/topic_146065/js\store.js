/* ========== store.js — 集中式状态管理 + pub/sub + localStorage ========== */

const Store = (() => {
  'use strict';

  const STORAGE_KEY = 'foodCatcher';

  // 全局状态
  let state = {
    foods: [],
    filter: 'all',        // all | pending | done
    currentPage: 'home',  // home | discover | profile
    currentFoodId: null,  // 详情页查看的 ID
    editingId: null,      // 编辑中的 ID
    checkInId: null,      // 打卡中的 ID
    discoverCategory: null // 发现页选中的分类
  };

  let listeners = [];
  let nextId = 1;

  // 从 localStorage 加载
  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.foods && Array.isArray(data.foods)) {
          state.foods = data.foods;
          // 计算 nextId
          const maxId = state.foods.reduce((max, f) => Math.max(max, f.id || 0), 0);
          nextId = maxId + 1;
        }
      }
    } catch (e) {
      console.warn('[Store] load failed:', e);
    }
  }

  // 持久化到 localStorage（只存 foods）
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        foods: state.foods
      }));
    } catch (e) {
      console.warn('[Store] save failed:', e);
    }
  }

  // 订阅状态变更
  function subscribe(fn) {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter(l => l !== fn);
    };
  }

  // 通知所有订阅者
  function notify() {
    save();
    listeners.forEach(fn => {
      try { fn(state); } catch (e) { console.error('[Store] listener error:', e); }
    });
  }

  // 获取状态
  function getState() {
    return state;
  }

  // 修改状态（统一入口）
  function setState(patch) {
    Object.assign(state, patch);
    notify();
  }

  // 生成新 ID
  function genId() {
    return nextId++;
  }

  // 初始化加载
  load();

  return {
    getState,
    setState,
    subscribe,
    save,
    load,
    genId
  };
})();
