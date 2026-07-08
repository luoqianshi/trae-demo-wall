/**
 * 忆路同行 - LocalStorage 封装
 * 提供类型安全的本地数据存储
 */

const StorageKeys = {
  PROFILE: 'ml_profile',
  TIMELINE: 'ml_timeline',
  PHOTOS: 'ml_photos',
  VOICE_STORIES: 'ml_voice_stories',
  MUSIC_PREFS: 'ml_music_prefs',
  GAME_RECORDS: 'ml_game_records',
  MOOD_RECORDS: 'ml_mood_records',
  SETTINGS: 'ml_settings'
};

class Storage {
  /**
   * 获取数据
   * @param {string} key - 存储键
   * @param {*} defaultValue - 默认值
   * @returns {*}
   */
  static get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      if (data === null) {
        return defaultValue;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error(`[Storage] 读取 "${key}" 失败:`, error);
      return defaultValue;
    }
  }

  /**
   * 存储数据
   * @param {string} key - 存储键
   * @param {*} value - 要存储的数据
   */
  static set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);

      // 发布进度保存事件
      if (window.EventBus) {
        window.EventBus.emit(EVENTS.PROGRESS_SAVED, { key, timestamp: Date.now() });
      }

      return true;
    } catch (error) {
      console.error(`[Storage] 写入 "${key}" 失败:`, error);

      // 检查是否是容量超限
      if (error.name === 'QuotaExceededError') {
        console.warn('[Storage] 本地存储空间不足，请清理部分数据');
      }

      return false;
    }
  }

  /**
   * 删除数据
   * @param {string} key - 存储键
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[Storage] 删除 "${key}" 失败:`, error);
      return false;
    }
  }

  /**
   * 检查键是否存在
   * @param {string} key - 存储键
   * @returns {boolean}
   */
  static has(key) {
    return localStorage.getItem(key) !== null;
  }

  /**
   * 获取所有以指定前缀开头的键
   * @param {string} prefix - 前缀
   * @returns {string[]}
   */
  static keysWithPrefix(prefix) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * 清空所有以 ml_ 开头的数据
   */
  static clearAll() {
    const keys = this.keysWithPrefix('ml_');
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`[Storage] 已清空 ${keys.length} 条数据`);
  }

  /**
   * 获取已使用存储空间（近似值）
   * @returns {number} 字节数
   */
  static getUsedSpace() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        total += key.length + (localStorage.getItem(key) || '').length;
      }
    }
    return total * 2; // UTF-16 编码，每个字符2字节
  }

  /**
   * 导出所有数据为 JSON
   * @returns {string}
   */
  static exportAll() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ml_')) {
        data[key] = this.get(key);
      }
    }
    return JSON.stringify(data, null, 2);
  }

  /**
   * 从 JSON 导入数据
   * @param {string} jsonString - JSON 字符串
   */
  static importAll(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      Object.entries(data).forEach(([key, value]) => {
        this.set(key, value);
      });
      return true;
    } catch (error) {
      console.error('[Storage] 导入数据失败:', error);
      return false;
    }
  }
}

// 暴露存储键常量
window.StorageKeys = StorageKeys;
window.Storage = Storage;

console.log('[Storage] 存储模块已初始化');
