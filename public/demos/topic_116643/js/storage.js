/**
 * 本地存储工具
 * 使用 localStorage 缓存用户数据
 */

const STORAGE_KEYS = {
  LOGIN: 'tax_app_login',
  USER: 'tax_app_user',
  RECORDS: 'tax_app_records',
  FAVORITES: 'tax_app_favorites',
  SETTINGS: 'tax_app_settings',
  LAST_INPUT: 'tax_app_last_input'
};

const Storage = {
  get(key) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch (e) {
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  },

  // 登录状态
  isLoggedIn() {
    return !!this.get(STORAGE_KEYS.LOGIN);
  },

  login(phone) {
    this.set(STORAGE_KEYS.LOGIN, { phone, time: Date.now() });
  },

  logout() {
    this.remove(STORAGE_KEYS.LOGIN);
  },

  // 用户信息
  getUser() {
    return this.get(STORAGE_KEYS.USER) || { nickname: '', avatar: '', city: '北京' };
  },

  saveUser(user) {
    const existing = this.getUser();
    this.set(STORAGE_KEYS.USER, { ...existing, ...user });
  },

  // 测算记录
  getRecords() {
    return this.get(STORAGE_KEYS.RECORDS) || [];
  },

  saveRecord(record) {
    const records = this.getRecords();
    records.unshift({ ...record, id: Date.now(), time: new Date().toISOString() });
    if (records.length > 50) records.length = 50;
    this.set(STORAGE_KEYS.RECORDS, records);
  },

  deleteRecord(id) {
    const records = this.getRecords().filter(r => r.id !== id);
    this.set(STORAGE_KEYS.RECORDS, records);
  },

  clearRecords() {
    this.remove(STORAGE_KEYS.RECORDS);
  },

  // 收藏
  getFavorites() {
    return this.get(STORAGE_KEYS.FAVORITES) || [];
  },

  toggleFavorite(item) {
    const favs = this.getFavorites();
    const idx = favs.findIndex(f => f.id === item.id);
    if (idx > -1) {
      favs.splice(idx, 1);
    } else {
      favs.unshift(item);
    }
    this.set(STORAGE_KEYS.FAVORITES, favs);
    return idx === -1;
  },

  isFavorite(id) {
    return this.getFavorites().some(f => f.id === id);
  },

  // 设置
  getSettings() {
    return this.get(STORAGE_KEYS.SETTINGS) || { darkMode: false, pushEnabled: true };
  },

  saveSettings(settings) {
    const existing = this.getSettings();
    this.set(STORAGE_KEYS.SETTINGS, { ...existing, ...settings });
  },

  // 上次输入
  getLastInput() {
    return this.get(STORAGE_KEYS.LAST_INPUT) || null;
  },

  saveLastInput(input) {
    this.set(STORAGE_KEYS.LAST_INPUT, input);
  }
};