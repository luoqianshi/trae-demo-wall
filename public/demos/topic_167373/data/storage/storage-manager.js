// storage-manager.js
// 微信小程序本地存储管理器，统一封装 wx.getStorageSync / wx.setStorageSync / wx.removeStorageSync / wx.clearStorageSync

const DEFAULT_INIT_FLAG = false;

const storageManager = {
  initialized: DEFAULT_INIT_FLAG,

  /**
   * 初始化。微信小程序的 wx.*Sync 是同步 API，无需异步初始化。
   * 这里仅标记 initialized 状态，便于上层判断是否完成初始化。
   */
  init() {
    this.initialized = true;
    console.log('[StorageManager] initialized');
    return this.initialized;
  },

  /**
   * 读取一个 key 的值
   * @param {string} key
   * @param {*} defaultValue 当 key 不存在或读取失败时返回的默认值
   */
  get(key, defaultValue) {
    if (!key) return defaultValue;
    try {
      const value = wx.getStorageSync(key);
      if (value === '' || value === null || value === undefined) {
        return defaultValue;
      }
      return value;
    } catch (e) {
      console.error('[StorageManager.get] error, key=' + key, e);
      return defaultValue;
    }
  },

  /**
   * 写入一个 key 的值
   * @param {string} key
   * @param {*} value
   * @returns {boolean} 是否成功
   */
  set(key, value) {
    if (!key) return false;
    try {
      wx.setStorageSync(key, value);
      return true;
    } catch (e) {
      console.error('[StorageManager.set] error, key=' + key, e);
      return false;
    }
  },

  /**
   * 删除一个 key
   * @param {string} key
   */
  remove(key) {
    if (!key) return false;
    try {
      wx.removeStorageSync(key);
      return true;
    } catch (e) {
      console.error('[StorageManager.remove] error, key=' + key, e);
      return false;
    }
  },

  /**
   * 清空所有本地存储（谨慎使用）
   */
  clear() {
    try {
      wx.clearStorageSync();
      return true;
    } catch (e) {
      console.error('[StorageManager.clear] error', e);
      return false;
    }
  },

  /**
   * 获取当前存储信息
   * @returns {object} { keys, currentSize, limitSize, initialized }
   */
  getInfo() {
    let info = {
      keys: [],
      currentSize: 0,
      limitSize: 0,
      initialized: this.initialized
    };
    try {
      const res = wx.getStorageInfoSync();
      info.keys = res.keys || [];
      info.currentSize = res.currentSize || 0;
      info.limitSize = res.limitSize || 0;
    } catch (e) {
      console.error('[StorageManager.getInfo] error', e);
    }
    return info;
  }
};

module.exports = storageManager;
