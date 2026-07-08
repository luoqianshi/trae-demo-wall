/**
 * @fileoverview M5 本地存储模块
 * @description 负责所有浏览器端数据的持久化，包括会话历史、AI 配置、用户偏好设置。
 *              采用 IndexedDB + LocalStorage 混合方案，IndexedDB 不可用时自动降级到 LocalStorage。
 * @module storage
 * @example
 *   import { StorageAPI } from './storage.js';
 *   await StorageAPI.saveSession({ id: 's1', title: '新会话', createdAt: Date.now(), ... });
 *   const sessions = await StorageAPI.getAllSessions();
 *   const prefs = await StorageAPI.getPreferences();
 */

// ============================================================
// 常量定义
// ============================================================

/** @type {string} IndexedDB 数据库名称 */
const DB_NAME = 'ycjs_database';

/** @type {number} IndexedDB 数据库版本 */
const DB_VERSION = 1;

/** @type {string} 会话 Object Store 名称 */
const STORE_SESSIONS = 'sessions';

/** @type {string} 消息 Object Store 名称 */
const STORE_MESSAGES = 'messages';

// LocalStorage 键名常量
const LS_KEY_PROVIDERS = 'ycjs_providers';
const LS_KEY_PREFERENCES = 'ycjs_preferences';
const LS_KEY_ACTIVE_SESSION = 'ycjs_active_session';
const LS_KEY_APP_VERSION = 'ycjs_app_version';

// 降级存储键名前缀（IndexedDB 不可用时使用 LocalStorage）
const FALLBACK_PREFIX = 'ycjs_fallback_';
const FALLBACK_SESSIONS = FALLBACK_PREFIX + 'sessions';
const FALLBACK_MESSAGES = FALLBACK_PREFIX + 'messages';

/** @type {number} 单个会话最大消息数量 */
const MAX_MESSAGES_PER_SESSION = 1000;

// ============================================================
// 用户偏好默认值
// ============================================================

/**
 * 用户偏好设置默认值
 * @type {UserPreferences}
 */
const DEFAULT_PREFERENCES = Object.freeze({
  theme: 'light',
  fontSize: 'medium',
  defaultTone: 'casual',
  maxHistorySessions: 50,
  autoSave: true,
});

// ============================================================
// IndexedDB 连接管理
// ============================================================

/** @type {IDBDatabase|null} 数据库实例缓存 */
let _dbInstance = null;

/** @type {boolean} IndexedDB 是否可用 */
let _indexedDBAvailable = true;

/**
 * 打开 IndexedDB 数据库连接
 * @returns {Promise<IDBDatabase>} 数据库连接实例
 */
function _openDB() {
  return new Promise((resolve, reject) => {
    // 如果已有缓存的实例且未关闭，直接返回
    if (_dbInstance && !_dbInstance.closed) {
      resolve(_dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 创建 sessions store（keyPath: id）
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
      }

      // 创建 messages store（keyPath: id，并建立 sessionId 索引）
      if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
        const msgStore = db.createObjectStore(STORE_MESSAGES, { keyPath: 'id' });
        msgStore.createIndex('sessionId', 'sessionId', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      _dbInstance = event.target.result;
      _indexedDBAvailable = true;
      resolve(_dbInstance);
    };

    request.onerror = (event) => {
      _indexedDBAvailable = false;
      const error = event.target.error;
      console.warn('Storage: IndexedDB 打开失败，将降级到 LocalStorage', error);
      reject(new Error(`IndexedDB 不可用: ${error?.message || '未知错误'}`));
    };

    request.onblocked = () => {
      console.warn('Storage: IndexedDB 升级被阻塞，请关闭其他使用该数据库的标签页');
      reject(new Error('IndexedDB 升级被阻塞'));
    };
  });
}

/**
 * 检查 IndexedDB 是否可用
 * @returns {Promise<boolean>}
 */
async function _isIndexedDBAvailable() {
  if (!_indexedDBAvailable) return false;
  try {
    await _openDB();
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// 通用事务操作封装
// ============================================================

/**
 * 在指定 Object Store 上执行读写事务
 * @param {'readonly'|'readwrite'} mode - 事务模式
 * @param {string} storeName - Object Store 名称
 * @param {function(IDBObjectStore): IDBRequest} callback - 在事务中执行的操作
 * @returns {Promise<*>} 请求结果
 */
async function _tx(mode, storeName, callback) {
  const db = await _openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => {}; // 事务完成的空回调，确保事务正常提交
    tx.onerror = () => reject(tx.error);
  });
}

// ============================================================
// 降级方案：LocalStorage 存取辅助函数
// ============================================================

/**
 * 从 LocalStorage 读取 JSON 数据
 * @param {string} key - 键名
 * @param {*} fallback - 解析失败时的默认返回值
 * @returns {*} 解析后的数据或默认值
 */
function _lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`Storage: LocalStorage 读取 "${key}" 失败`, e);
    return fallback;
  }
}

/**
 * 向 LocalStorage 写入 JSON 数据
 * @param {string} key - 键名
 * @param {*} value - 要存储的值（将自动 JSON 序列化）
 * @returns {boolean} 是否写入成功
 */
function _lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Storage: LocalStorage 写入 "${key}" 失败`, e);
    return false;
  }
}

// ============================================================
// 降级方案：会话操作（使用 LocalStorage）
// ============================================================

/**
 * 降级获取所有会话
 * @returns {Promise<Object[]>}
 */
async function _fallbackGetAllSessions() {
  return _lsGet(FALLBACK_SESSIONS, []);
}

/**
 * 降级保存所有会话
 * @param {Object[]} sessions
 */
async function _fallbackSaveAllSessions(sessions) {
  _lsSet(FALLBACK_SESSIONS, sessions);
}

/**
 * 降级获取指定会话的消息
 * @param {string} sessionId
 * @returns {Promise<Object[]>}
 */
async function _fallbackGetMessages(sessionId) {
  const allMessages = _lsGet(FALLBACK_MESSAGES, []);
  return allMessages.filter((m) => m.sessionId === sessionId);
}

/**
 * 降级保存消息
 * @param {string} sessionId
 * @param {Object[]} messages
 */
async function _fallbackSaveMessages(sessionId, messages) {
  const allMessages = _lsGet(FALLBACK_MESSAGES, []);
  // 先移除旧消息，再追加新消息
  const filtered = allMessages.filter((m) => m.sessionId !== sessionId);
  const merged = filtered.concat(messages);
  _lsSet(FALLBACK_MESSAGES, merged);
}

// ============================================================
// 公共 API
// ============================================================

/**
 * 本地存储 API
 * @namespace StorageAPI
 */
const StorageAPI = {

  // ----------------------------------------------------------
  // 会话操作
  // ----------------------------------------------------------

  /**
   * 保存/更新会话
   * @param {Object} session - 会话对象，必须包含 id 字段
   * @param {string} session.id - 会话唯一标识
   * @param {string} [session.title] - 会话标题
   * @param {number} [session.createdAt] - 创建时间戳
   * @param {number} [session.updatedAt] - 更新时间戳
   * @param {Object} [session.settings] - 会话设置
   * @returns {Promise<void>}
   */
  async saveSession(session) {
    if (!session || !session.id) {
      throw new Error('Storage.saveSession: session 对象必须包含 id 字段');
    }

    const data = {
      id: String(session.id),
      title: session.title || '',
      createdAt: session.createdAt || Date.now(),
      updatedAt: session.updatedAt || Date.now(),
      settings: session.settings || {},
    };

    if (await _isIndexedDBAvailable()) {
      await _tx('readwrite', STORE_SESSIONS, (store) => store.put(data));
    } else {
      // 降级：读取 -> 更新 -> 写回
      const sessions = await _fallbackGetAllSessions();
      const idx = sessions.findIndex((s) => s.id === data.id);
      if (idx >= 0) {
        sessions[idx] = data;
      } else {
        sessions.push(data);
      }
      await _fallbackSaveAllSessions(sessions);
    }
  },

  /**
   * 获取指定会话
   * @param {string} id - 会话 ID
   * @returns {Promise<Object|null>} 会话对象，不存在时返回 null
   */
  async getSession(id) {
    if (!id) return null;

    if (await _isIndexedDBAvailable()) {
      return _tx('readonly', STORE_SESSIONS, (store) => store.get(String(id)));
    } else {
      const sessions = await _fallbackGetAllSessions();
      return sessions.find((s) => s.id === String(id)) || null;
    }
  },

  /**
   * 获取所有会话（按 updatedAt 降序排列）
   * @returns {Promise<Object[]>} 会话列表
   */
  async getAllSessions() {
    if (await _isIndexedDBAvailable()) {
      const all = await _tx('readonly', STORE_SESSIONS, (store) => store.getAll());
      // 按 updatedAt 降序排列
      return Array.isArray(all) ? all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)) : [];
    } else {
      const sessions = await _fallbackGetAllSessions();
      return sessions.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
  },

  /**
   * 删除指定会话及其关联的所有消息
   * @param {string} id - 会话 ID
   * @returns {Promise<void>}
   */
  async deleteSession(id) {
    if (!id) return;

    if (await _isIndexedDBAvailable()) {
      // 先删除关联消息
      await _tx('readwrite', STORE_MESSAGES, async (store) => {
        const index = store.index('sessionId');
        const request = index.openCursor(IDBKeyRange.only(String(id)));
        return new Promise((resolve, reject) => {
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              cursor.delete();
              cursor.continue();
            } else {
              resolve();
            }
          };
          request.onerror = () => reject(request.error);
        });
      });
      // 再删除会话本身
      await _tx('readwrite', STORE_SESSIONS, (store) => store.delete(String(id)));
    } else {
      // 降级删除
      const sessions = await _fallbackGetAllSessions();
      await _fallbackSaveAllSessions(sessions.filter((s) => s.id !== String(id)));
      const allMessages = _lsGet(FALLBACK_MESSAGES, []);
      _lsSet(FALLBACK_MESSAGES, allMessages.filter((m) => m.sessionId !== String(id)));
    }
  },

  // ----------------------------------------------------------
  // 消息操作
  // ----------------------------------------------------------

  /**
   * 保存消息列表（先删除旧消息再写入新消息）
   * @param {string} sessionId - 所属会话 ID
   * @param {Object[]} messages - 消息数组，每条必须包含 id 和 sessionId
   * @returns {Promise<void>}
   */
  async saveMessages(sessionId, messages) {
    if (!sessionId) {
      throw new Error('Storage.saveMessages: sessionId 不能为空');
    }
    if (!Array.isArray(messages)) {
      throw new Error('Storage.saveMessages: messages 必须是数组');
    }

    // 单会话消息数量限制
    if (messages.length > MAX_MESSAGES_PER_SESSION) {
      console.warn(
        `Storage: 会话 "${sessionId}" 的消息数量 (${messages.length}) ` +
        `超过限制 (${MAX_MESSAGES_PER_SESSION})，将截断保存。`
      );
      messages = messages.slice(0, MAX_MESSAGES_PER_SESSION);
    }

    // 为每条消息确保必需字段
    const normalized = messages.map((msg, index) => ({
      id: msg.id || `${sessionId}_msg_${index}_${Date.now()}`,
      sessionId: String(sessionId),
      sender: msg.sender || '',
      senderRole: msg.senderRole || 'other',
      content: msg.content || '',
      timestamp: msg.timestamp || undefined,
      order: msg.order != null ? msg.order : index,
    }));

    if (await _isIndexedDBAvailable()) {
      const db = await _openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_MESSAGES], 'readwrite');
        const store = tx.objectStore(STORE_MESSAGES);
        const index = store.index('sessionId');

        // 先删除该会话的旧消息
        const deleteRequest = index.openCursor(IDBKeyRange.only(String(sessionId)));
        deleteRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            // 旧消息删除完毕，写入新消息
            for (const msg of normalized) {
              store.put(msg);
            }
          }
        };
        deleteRequest.onerror = () => reject(deleteRequest.error);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } else {
      await _fallbackSaveMessages(sessionId, normalized);
    }
  },

  /**
   * 获取指定会话的所有消息（按 order 升序排列）
   * @param {string} sessionId - 会话 ID
   * @returns {Promise<Object[]>} 消息列表
   */
  async getMessages(sessionId) {
    if (!sessionId) return [];

    if (await _isIndexedDBAvailable()) {
      const messages = await _tx('readwrite', STORE_MESSAGES, (store) => {
        const index = store.index('sessionId');
        return index.getAll(String(sessionId));
      });
      return Array.isArray(messages)
        ? messages.sort((a, b) => (a.order || 0) - (b.order || 0))
        : [];
    } else {
      const messages = await _fallbackGetMessages(sessionId);
      return messages.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  },

  // ----------------------------------------------------------
  // AI Provider 配置
  // ----------------------------------------------------------

  /**
   * 获取 AI Provider 配置列表
   * @returns {Promise<Object[]>} Provider 配置数组
   */
  async getProviders() {
    return _lsGet(LS_KEY_PROVIDERS, []);
  },

  /**
   * 保存 AI Provider 配置列表
   * @param {Object[]} providers - Provider 配置数组
   * @returns {Promise<void>}
   */
  async saveProviders(providers) {
    if (!Array.isArray(providers)) {
      throw new Error('Storage.saveProviders: providers 必须是数组');
    }
    _lsSet(LS_KEY_PROVIDERS, providers);
  },

  /**
   * 获取当前活跃的 Provider
   * @returns {Promise<Object|null>} 当前活跃 Provider 配置，未设置时返回 null
   */
  async getActiveProvider() {
    const activeId = _lsGet(LS_KEY_ACTIVE_SESSION, null);
    if (!activeId) return null;

    // 注意：活跃 Provider ID 存储在 ycjs_active_session 中
    // 这里尝试从 providers 中查找匹配项
    const providers = await StorageAPI.getProviders();
    return providers.find((p) => p.id === activeId) || providers[0] || null;
  },

  // ----------------------------------------------------------
  // 用户偏好设置
  // ----------------------------------------------------------

  /**
   * 获取用户偏好设置（缺失字段使用默认值填充）
   * @returns {Promise<Object>} 用户偏好设置对象
   */
  async getPreferences() {
    const saved = _lsGet(LS_KEY_PREFERENCES, {});
    // 合并默认值，确保所有字段都有值
    return {
      ...DEFAULT_PREFERENCES,
      ...saved,
    };
  },

  /**
   * 保存用户偏好设置（支持部分更新）
   * @param {Object} prefs - 偏好设置对象（支持部分字段）
   * @returns {Promise<void>}
   */
  async savePreferences(prefs) {
    if (!prefs || typeof prefs !== 'object') {
      throw new Error('Storage.savePreferences: prefs 必须是对象');
    }
    // 合并现有设置与新的部分设置
    const current = await StorageAPI.getPreferences();
    const merged = { ...current, ...prefs };
    _lsSet(LS_KEY_PREFERENCES, merged);
  },

  // ----------------------------------------------------------
  // 数据导入导出
  // ----------------------------------------------------------

  /**
   * 导出所有数据
   * @returns {Promise<Object>} 导出数据对象
   */
  async exportAll() {
    const sessions = await StorageAPI.getAllSessions();

    // 收集每个会话的消息
    const messagesMap = {};
    for (const session of sessions) {
      messagesMap[session.id] = await StorageAPI.getMessages(session.id);
    }

    const providers = await StorageAPI.getProviders();
    const preferences = await StorageAPI.getPreferences();

    return {
      version: DB_VERSION,
      exportAt: Date.now(),
      sessions,
      messages: messagesMap,
      providers,
      preferences,
    };
  },

  /**
   * 导入数据（覆盖现有数据）
   * @param {Object} data - 导入数据对象
   * @returns {Promise<boolean>} 是否导入成功
   */
  async importAll(data) {
    if (!data || typeof data !== 'object') {
      console.error('Storage.importAll: 数据格式无效');
      return false;
    }

    try {
      // 先清空现有数据
      await StorageAPI.clearAll();

      // 导入会话
      if (Array.isArray(data.sessions)) {
        for (const session of data.sessions) {
          await StorageAPI.saveSession(session);
        }
      }

      // 导入消息
      if (data.messages && typeof data.messages === 'object') {
        for (const [sessionId, messages] of Object.entries(data.messages)) {
          if (Array.isArray(messages)) {
            await StorageAPI.saveMessages(sessionId, messages);
          }
        }
      }

      // 导入 Provider 配置
      if (Array.isArray(data.providers)) {
        await StorageAPI.saveProviders(data.providers);
      }

      // 导入偏好设置
      if (data.preferences && typeof data.preferences === 'object') {
        await StorageAPI.savePreferences(data.preferences);
      }

      return true;
    } catch (error) {
      console.error('Storage.importAll: 导入失败', error);
      return false;
    }
  },

  // ----------------------------------------------------------
  // 清理与工具方法
  // ----------------------------------------------------------

  /**
   * 清除所有数据（包括 IndexedDB 和 LocalStorage 中的 ycjs_ 开头的键）
   * @returns {Promise<void>}
   */
  async clearAll() {
    // 清除 IndexedDB
    if (await _isIndexedDBAvailable()) {
      const db = await _openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(
          [STORE_SESSIONS, STORE_MESSAGES],
          'readwrite'
        );
        tx.objectStore(STORE_SESSIONS).clear();
        tx.objectStore(STORE_MESSAGES).clear();

        tx.oncomplete = () => {
          // 清除 LocalStorage 中的应用数据
          _clearLocalStorage();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      });
    } else {
      _clearLocalStorage();
    }
  },

  /**
   * 获取当前存储空间的估计使用量（字节）
   * @returns {Promise<number>} 估计字节数
   */
  async getStorageSize() {
    let totalBytes = 0;

    // 估算 LocalStorage 占用
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ycjs_')) {
        const value = localStorage.getItem(key);
        totalBytes += (key.length + (value?.length || 0)) * 2; // UTF-16 编码，每字符 2 字节
      }
    }

    // 如果 IndexedDB 可用，尝试估算其用量
    if (await _isIndexedDBAvailable() && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        // usage 是整个 origin 的用量，这里只能提供近似值
        if (estimate.usage) {
          totalBytes += estimate.usage;
        }
      } catch {
        // 忽略估算失败
      }
    }

    return totalBytes;
  },
};

/**
 * 清除 LocalStorage 中所有 ycjs_ 开头的键
 * @private
 */
function _clearLocalStorage() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('ycjs_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

export { StorageAPI };
