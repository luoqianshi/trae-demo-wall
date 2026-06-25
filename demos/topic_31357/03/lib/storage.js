/**
 * 存储管理模块 - 基于IndexedDB + localStorage实现本地持久化存储
 * 负责PRD历史文件管理、API配置存储
 */

const DB_NAME = 'PRDGeneratorDB';
const DB_VERSION = 1;
const PRD_STORE = 'prdFiles';
const CONFIG_STORE = 'config';

class StorageManager {
  constructor() {
    this.db = null;
  }

  /**
   * 初始化IndexedDB
   */
  async init() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // PRD文件存储
        if (!db.objectStoreNames.contains(PRD_STORE)) {
          const prdStore = db.createObjectStore(PRD_STORE, { keyPath: 'id' });
          prdStore.createIndex('createTime', 'createTime', { unique: false });
          prdStore.createIndex('pageUrl', 'pageUrl', { unique: false });
        }
        // 配置存储
        if (!db.objectStoreNames.contains(CONFIG_STORE)) {
          db.createObjectStore(CONFIG_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * 保存PRD文件记录
   */
  async savePRD(prdData) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PRD_STORE], 'readwrite');
      const store = transaction.objectStore(PRD_STORE);
      const record = {
        id: prdData.id || this.generateId(),
        fileName: prdData.fileName,
        content: prdData.content,
        pageUrl: prdData.pageUrl || '',
        pageName: prdData.pageName || '',
        createTime: prdData.createTime || Date.now(),
      };
      const request = store.put(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取所有PRD文件列表（按时间倒序）
   */
  async getAllPRDs() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PRD_STORE], 'readonly');
      const store = transaction.objectStore(PRD_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result.sort((a, b) => b.createTime - a.createTime);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取单个PRD文件
   */
  async getPRD(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PRD_STORE], 'readonly');
      const store = transaction.objectStore(PRD_STORE);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除单个PRD文件
   */
  async deletePRD(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PRD_STORE], 'readwrite');
      const store = transaction.objectStore(PRD_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清空所有PRD文件
   */
  async clearAllPRDs() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PRD_STORE], 'readwrite');
      const store = transaction.objectStore(PRD_STORE);
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 保存API配置
   */
  async saveConfig(key, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CONFIG_STORE], 'readwrite');
      const store = transaction.objectStore(CONFIG_STORE);
      const request = store.put({ key, value });
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取API配置
   */
  async getConfig(key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CONFIG_STORE], 'readonly');
      const store = transaction.objectStore(CONFIG_STORE);
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取所有配置
   */
  async getAllConfigs() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CONFIG_STORE], 'readonly');
      const store = transaction.objectStore(CONFIG_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const configs = {};
        request.result.forEach(item => {
          configs[item.key] = item.value;
        });
        resolve(configs);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除指定配置
   */
  async deleteConfig(key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CONFIG_STORE], 'readwrite');
      const store = transaction.objectStore(CONFIG_STORE);
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return 'prd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }
}

// 导出单例
const storageManager = new StorageManager();
