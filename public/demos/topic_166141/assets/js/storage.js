// storage.js - 本地存储封装（localStorage）
// 所有用户数据都通过此模块持久化

const Storage = (() => {
  const KEYS = {
    PROFILE: 'emperor_profile_v1',
    TODOS: 'emperor_todos_v1',
    DIARY: 'emperor_diary_v1',
    SETTINGS: 'emperor_settings_v1',
    ADDED_CITIES: 'emperor_added_cities_v1',
    LAST_SHICHEN: 'emperor_last_shichen_v1',
    SCRIPT: 'emperor_script_v1',
    SCRIPT_MERGED: 'emperor_script_merged_v1'
  };

  // 已知顶层 key 白名单(导入存档只接受这些 key,防止恶意注入未知字段)
  const ALLOWED_KEYS = new Set(Object.values(KEYS));

  // 各 key 的 schema 校验(只做粗粒度类型检查,允许未来扩展字段)
  function validate(key, val) {
    if (val === null || val === undefined) return false;
    switch (key) {
      case KEYS.PROFILE:
        return typeof val === 'object' && !Array.isArray(val);
      case KEYS.TODOS:
        return Array.isArray(val);
      case KEYS.DIARY:
        return typeof val === 'object' && Array.isArray(val.entries);
      case KEYS.SETTINGS:
        return typeof val === 'object' && !Array.isArray(val);
      case KEYS.ADDED_CITIES:
        return Array.isArray(val) && val.every(x => typeof x === 'string');
      case KEYS.LAST_SHICHEN:
        return typeof val === 'string';
      case KEYS.SCRIPT:
        return typeof val === 'object' && !Array.isArray(val);
      case KEYS.SCRIPT_MERGED:
        return typeof val === 'object' && !Array.isArray(val);
      default:
        return false;
    }
  }

  function get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('Storage.get error', e);
      return fallback;
    }
  }

  function set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      console.warn('Storage.set error', e);
      return false;
    }
  }

  function del(key) {
    localStorage.removeItem(key);
  }

  function clearAll() {
    Object.values(KEYS).forEach(del);
  }

  function exportAll() {
    const dump = {};
    Object.entries(KEYS).forEach(([k, v]) => {
      dump[k] = get(v);
    });
    return JSON.stringify(dump, null, 2);
  }

  function importAll(jsonStr) {
    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (e) {
      console.warn('Storage.import: 不是合法 JSON', e);
      return false;
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      console.warn('Storage.import: 顶层结构非法');
      return false;
    }
    // 只接受已知顶层 key,且必须通过 schema 校验
    let accepted = 0;
    Object.entries(KEYS).forEach(([_, v]) => {
      if (data[v] === undefined) return; // 没提供该字段,跳过
      if (!ALLOWED_KEYS.has(v)) return; // 防御性二次校验
      if (!validate(v, data[v])) {
        console.warn('Storage.import: 字段 ' + v + ' 校验失败,已跳过');
        return;
      }
      set(v, data[v]);
      accepted++;
    });
    return accepted > 0;
  }

  return { KEYS, get, set, del, clearAll, exportAll, importAll };
})();
