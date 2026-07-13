/**
 * 打工人的工具箱 - 本地存储模块
 * 封装 chrome.storage 的封装，提供统一的数据存取接口
 * 支持数据的持久化存储、导入导出功能
 */

const Storage = (function() {
  'use strict';

  /**
   * 存储键名常量
   */
  const KEYS = {
    SETTINGS: 'settings',
    QRCODE_HISTORY: 'qrcodeHistory',
    JSON_HISTORY: 'jsonHistory',
    TODO_LIST: 'todoList',
    SAVED_TABS: 'savedTabs',
    DOWNLOAD_HISTORY: 'downloadHistory',
    COLOR_HISTORY: 'colorHistory',
    POMODORO_STATS: 'pomodoroStats'
  };

  /**
   * 默认设置
   */
  const DEFAULT_SETTINGS = {
    downloadPath: 'Downloads',
    theme: 'pixel-dark',
    toolOrder: ['qrcode', 'json-formatter', 'screenshot', 'todo', 'pomodoro', 'tab-manager', 'file-info', 'color-picker', 'downloader'],
    hiddenTools: [],
    pomodoroWorkTime: 25,
    pomodoroBreakTime: 5,
    pomodoroLongBreakTime: 15,
    pomodoroLongBreakInterval: 4
  };

  // JSON历史记录已迁移至 IndexedDB，此处不再需要 LARGE_KEYS 标记
  const LARGE_KEYS = new Set([]);

  // ===================== IndexedDB 封装 =====================
  // 数据库名称与版本
  const DB_NAME = 'WorkerToolboxDB';
  const DB_VERSION = 4;
  // 对象仓库名称
  const STORE_TODOS = 'todos';
  const STORE_PROJECTS = 'projects';
  const STORE_QRCODE = 'qrcode';
  const STORE_JSON = 'jsonHistory';

  // 数据库实例缓存，避免重复打开
  let dbInstance = null;

  /**
   * 打开 IndexedDB 数据库，若已打开则直接返回缓存实例
   * 首次打开时会创建对象仓库与索引
   * @returns {Promise<IDBDatabase>} 数据库实例
   */
  function openDB() {
    if (dbInstance) {
      return Promise.resolve(dbInstance);
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      // 数据库升级（首次打开或版本号提升时触发）
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;

        // version 0 → 1：创建 todos 仓库
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains(STORE_TODOS)) {
            const store = db.createObjectStore(STORE_TODOS, { keyPath: 'id' });
            // 按创建时间索引，用于倒序排列
            store.createIndex('createdAt', 'createdAt', { unique: false });
            // 按完成状态索引，用于过滤
            store.createIndex('completed', 'completed', { unique: false });
          }
        }

        // version 1 → 2：创建 projects 仓库 + 给 todos 加新字段索引
        if (oldVersion < 2) {
          // 创建 projects 仓库
          if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
            const projectStore = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
            projectStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // 给 todos 表加 projectId 和 dueDate 索引
          const todoStore = event.target.transaction.objectStore(STORE_TODOS);
          if (!todoStore.indexNames.contains('projectId')) {
            todoStore.createIndex('projectId', 'projectId', { unique: false });
          }
          if (!todoStore.indexNames.contains('dueDate')) {
            todoStore.createIndex('dueDate', 'dueDate', { unique: false });
          }
        }

        // version 2 → 3：创建 qrcode 仓库（二维码历史记录）
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains(STORE_QRCODE)) {
            const qrcodeStore = db.createObjectStore(STORE_QRCODE, { keyPath: 'id' });
            qrcodeStore.createIndex('createdAt', 'createdAt', { unique: false });
            qrcodeStore.createIndex('content', 'content', { unique: false });
          }
        }

        // version 3 → 4：创建 jsonHistory 仓库（JSON 格式化历史记录）
        // 从 chrome.storage.local 迁移至 IndexedDB，旧数据不保留
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains(STORE_JSON)) {
            const jsonStore = db.createObjectStore(STORE_JSON, { keyPath: 'id' });
            // 按创建时间索引，用于倒序排列
            jsonStore.createIndex('createdAt', 'createdAt', { unique: false });
            // 按类型索引（format/minify/validate 等），便于分类查询
            jsonStore.createIndex('type', 'type', { unique: false });
          }
        }
      };

      request.onsuccess = (event) => {
        dbInstance = event.target.result;
        // 数据库连接异常关闭时清空缓存，下次重新打开
        dbInstance.onclose = () => { dbInstance = null; };
        dbInstance.onerror = () => { dbInstance = null; };
        resolve(dbInstance);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * 确保数据库已打开（首次打开时创建表结构）
   * @returns {Promise<IDBDatabase>}
   */
  async function ensureDB() {
    return openDB();
  }

  /**
   * 向指定对象仓库添加或更新一条记录
   * @param {string} storeName - 仓库名称
   * @param {Object} value - 数据对象（必须包含主键）
   * @returns {Promise<void>}
   */
  function dbPut(storeName, value) {
    return ensureDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }));
  }

  /**
   * 从指定对象仓库删除一条记录
   * @param {string} storeName - 仓库名称
   * @param {string} key - 主键值
   * @returns {Promise<void>}
   */
  function dbDelete(storeName, key) {
    return ensureDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }));
  }

  /**
   * 清空指定对象仓库的所有记录
   * @param {string} storeName - 仓库名称
   * @returns {Promise<void>}
   */
  function dbClear(storeName) {
    return ensureDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }));
  }

  /**
   * 获取指定对象仓库的所有记录，可按索引和方向排序
   * 使用 openCursor 游标遍历，支持 next（正序）和 prev（倒序）
   * @param {string} storeName - 仓库名称
   * @param {string} [indexName] - 索引名称，不传则按主键
   * @param {'next'|'prev'} [direction='next'] - 排序方向
   * @returns {Promise<Array>} 记录数组
   */
  function dbGetAll(storeName, indexName, direction = 'next') {
    return ensureDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const source = indexName ? store.index(indexName) : store;
      const results = [];
      // 用游标实现方向控制（getAll 不支持 direction 参数）
      const request = source.openCursor(null, direction);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve(results);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }));
  }

  /**
   * 根据主键获取单条记录
   * @param {string} storeName - 仓库名称
   * @param {string} key - 主键值
   * @returns {Promise<Object|undefined>}
   */
  function dbGet(storeName, key) {
    return ensureDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }));
  }

  /**
   * 批量写入记录（用于导入等场景）
   * @param {string} storeName - 仓库名称
   * @param {Array} items - 数据数组
   * @returns {Promise<void>}
   */
  function dbPutAll(storeName, items) {
    return ensureDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }));
  }
  // ===================== IndexedDB 封装结束 =====================

  /**
   * 获取存储数据
   * @param {string} key - 存储键名
   * @param {*} defaultValue - 默认值
   * @returns {Promise<*>} 存储的数据
   */
  function get(key, defaultValue = null) {
    return new Promise((resolve) => {
      const storageArea = LARGE_KEYS.has(key) ? chrome.storage.local : chrome.storage.sync;
      storageArea.get([key], (result) => {
        const value = result[key];
        resolve(value !== undefined ? value : defaultValue);
      });
    });
  }

  /**
   * 设置存储数据
   * @param {string} key - 存储键名
   * @param {*} value - 要存储的值
   * @returns {Promise<void>}
   */
  function set(key, value) {
    return new Promise((resolve) => {
      const storageArea = LARGE_KEYS.has(key) ? chrome.storage.local : chrome.storage.sync;
      storageArea.set({ [key]: value }, () => {
        resolve();
      });
    });
  }

  /**
   * 删除存储数据
   * @param {string} key - 存储键名
   * @returns {Promise<void>}
   */
  function remove(key) {
    return new Promise((resolve) => {
      chrome.storage.sync.remove([key], () => {
        resolve();
      });
    });
  }

  /**
   * 获取设置
   * @returns {Promise<Object>} 设置对象
   */
  async function getSettings() {
    const settings = await get(KEYS.SETTINGS, {});
    return { ...DEFAULT_SETTINGS, ...settings };
  }

  /**
   * 保存设置
   * @param {Object} settings - 设置对象
   * @returns {Promise<void>}
   */
  async function saveSettings(settings) {
    const currentSettings = await getSettings();
    await set(KEYS.SETTINGS, { ...currentSettings, ...settings });
  }

  /**
   * 获取二维码历史记录（从 IndexedDB 读取，按创建时间倒序）
   * @returns {Promise<Array>} 历史记录数组
   */
  function getQrcodeHistory() {
    return dbGetAll(STORE_QRCODE, 'createdAt', 'prev');
  }

  /**
   * 添加二维码历史记录（写入 IndexedDB）
   * 自动去重（相同 content 只保留最新的），最多保存50条
   * @param {Object} item - 历史记录项
   * @returns {Promise<Array>} 更新后的历史记录
   */
  async function addQrcodeHistory(item) {
    const db = await ensureDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QRCODE, 'readwrite');
      const store = tx.objectStore(STORE_QRCODE);
      const index = store.index('content');
      const request = index.openCursor(IDBKeyRange.only(item.content));
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });

    const newItem = {
      id: Date.now().toString(),
      name: item.name || '',
      content: item.content,
      createdAt: new Date().toISOString()
    };
    await dbPut(STORE_QRCODE, newItem);

    const history = await getQrcodeHistory();
    if (history.length > 50) {
      const toDelete = history.slice(50);
      for (const h of toDelete) {
        await dbDelete(STORE_QRCODE, h.id);
      }
    }
    return getQrcodeHistory();
  }

  /**
   * 删除二维码历史记录（从 IndexedDB 删除）
   * @param {string} id - 记录ID
   * @returns {Promise<Array>} 更新后的历史记录
   */
  async function removeQrcodeHistory(id) {
    await dbDelete(STORE_QRCODE, id);
    return getQrcodeHistory();
  }

  /**
   * 清空二维码历史记录（清空 IndexedDB 中的 qrcode 仓库）
   * @returns {Promise<void>}
   */
  function clearQrcodeHistory() {
    return dbClear(STORE_QRCODE);
  }

  /**
   * 获取JSON历史记录（从 IndexedDB 读取，按创建时间倒序）
   * @returns {Promise<Array>} 历史记录数组
   */
  function getJsonHistory() {
    return dbGetAll(STORE_JSON, 'createdAt', 'prev');
  }

  /**
   * 添加JSON历史记录（写入 IndexedDB）
   * 最多保存 100 条（迁移到 IndexedDB 后放宽上限，单条操作无性能压力）
   * @param {Object} item - 历史记录项
   * @param {string} [item.name] - 自定义名称
   * @param {string} item.content - JSON 内容
   * @param {string} [item.type] - 类型：format/minify/validate 等
   * @returns {Promise<Array>} 更新后的历史记录
   */
  async function addJsonHistory(item) {
    const newItem = {
      id: Date.now().toString(),
      name: item.name || '', // 支持自定义名称
      content: item.content,
      type: item.type || 'format',
      createdAt: new Date().toISOString()
    };
    await dbPut(STORE_JSON, newItem);

    // 超出上限时删除最旧记录（倒序数组末尾即最旧）
    const history = await getJsonHistory();
    if (history.length > 100) {
      const toDelete = history.slice(100);
      for (const h of toDelete) {
        await dbDelete(STORE_JSON, h.id);
      }
    }
    return getJsonHistory();
  }

  /**
   * 删除JSON历史记录（从 IndexedDB 删除）
   * @param {string} id - 记录ID
   * @returns {Promise<Array>} 更新后的历史记录
   */
  async function removeJsonHistory(id) {
    await dbDelete(STORE_JSON, id);
    return getJsonHistory();
  }

  /**
   * 清空JSON历史记录（清空 IndexedDB 中的 jsonHistory 仓库）
   * @returns {Promise<void>}
   */
  function clearJsonHistory() {
    return dbClear(STORE_JSON);
  }

  // ===================== 项目（Project）CRUD =====================

  /**
   * 获取所有项目列表（按创建时间倒序）
   * @returns {Promise<Array>} 项目数组
   */
  async function getProjects() {
    return dbGetAll(STORE_PROJECTS, 'createdAt', 'prev');
  }

  /**
   * 创建新项目
   * @param {Object} project - 项目信息
   * @param {string} project.name - 项目名称
   * @param {string} [project.color] - 项目颜色
   * @returns {Promise<Object>} 创建后的项目对象
   */
  async function addProject(project) {
    const newProject = {
      id: Date.now().toString(),
      name: project.name,
      color: project.color || '#8b5cf6',
      createdAt: new Date().toISOString()
    };
    await dbPut(STORE_PROJECTS, newProject);
    return newProject;
  }

  /**
   * 更新项目信息
   * @param {string} id - 项目ID
   * @param {Object} updates - 要更新的字段
   * @returns {Promise<Object|null>} 更新后的项目对象
   */
  async function updateProject(id, updates) {
    const project = await dbGet(STORE_PROJECTS, id);
    if (!project) return null;
    const updated = { ...project, ...updates };
    await dbPut(STORE_PROJECTS, updated);
    return updated;
  }

  /**
   * 删除项目（同时将该项目下的所有 todo 标记为未分类）
   * @param {string} id - 项目ID
   * @returns {Promise<void>}
   */
  async function deleteProject(id) {
    const db = await ensureDB();
    // 将该项目下的所有 todo 的 projectId 设为 null
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TODOS, 'readwrite');
      const store = tx.objectStore(STORE_TODOS);
      const index = store.index('projectId');
      const request = index.openCursor(IDBKeyRange.only(id));
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const todo = cursor.value;
          todo.projectId = null;
          cursor.update(todo);
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    // 删除项目本身
    await dbDelete(STORE_PROJECTS, id);
  }

  /**
   * 获取项目的未完成 todo 数量
   * @param {string} projectId - 项目ID（null 表示未分类）
   * @returns {Promise<number>} 未完成数量
   */
  async function getProjectPendingCount(projectId) {
    const db = await ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TODOS, 'readonly');
      const store = tx.objectStore(STORE_TODOS);
      const index = store.index('projectId');
      const request = index.openCursor(IDBKeyRange.only(projectId));
      let count = 0;
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (!cursor.value.completed) count++;
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve(count);
      tx.onerror = () => reject(tx.error);
    });
  }

  // ===================== TODO 相关方法（支持项目和时间维度） =====================

  /**
   * 获取TODO列表（从 IndexedDB 读取，按创建时间倒序）
   * 支持按 projectId 和时间范围筛选
   * @param {Object} [filters] - 筛选条件
   * @param {string|null} [filters.projectId] - 项目ID，null 表示未分类，不传表示全部
   * @param {string} [filters.timeRange] - 时间范围：all/today/week/overdue
   * @returns {Promise<Array>} TODO列表
   */
  async function getTodoList(filters = {}) {
    const allTodos = await dbGetAll(STORE_TODOS, 'createdAt', 'prev');
    let result = allTodos;

    // 按项目筛选
    if (filters.projectId !== undefined) {
      result = result.filter(t => t.projectId === filters.projectId);
    }

    // 按时间范围筛选
    if (filters.timeRange && filters.timeRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = formatDate(today);

      if (filters.timeRange === 'today') {
        result = result.filter(t => t.dueDate === todayStr);
      } else if (filters.timeRange === 'week') {
        const weekStart = new Date(today);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // 周一为一周开始
        weekStart.setDate(diff);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // 周日为一周结束
        const weekStartStr = formatDate(weekStart);
        const weekEndStr = formatDate(weekEnd);
        result = result.filter(t => t.dueDate && t.dueDate >= weekStartStr && t.dueDate <= weekEndStr);
      } else if (filters.timeRange === 'overdue') {
        result = result.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr);
      }
    }

    return result;
  }

  /**
   * 格式化日期为 YYYY-MM-DD
   * @param {Date} date - 日期对象
   * @returns {string} 格式化后的日期字符串
   */
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 保存TODO列表（全量覆盖写入 IndexedDB，用于导入等场景）
   * @param {Array} list - TODO列表
   * @returns {Promise<void>}
   */
  async function saveTodoList(list) {
    // 先清空再批量写入，保证与传入列表完全一致
    await dbClear(STORE_TODOS);
    if (list && list.length > 0) {
      await dbPutAll(STORE_TODOS, list);
    }
  }

  /**
   * 添加TODO项（写入 IndexedDB）
   * @param {string} text - TODO内容
   * @param {Object} [options] - 可选参数
   * @param {string|null} [options.projectId] - 所属项目ID
   * @param {string|null} [options.dueDate] - 截止日期 YYYY-MM-DD
   * @returns {Promise<Array>} 更新后的列表
   */
  async function addTodo(text, options = {}) {
    const todo = {
      id: Date.now().toString(),
      text: text,
      completed: false,
      projectId: options.projectId || null,
      dueDate: options.dueDate || null,
      createdAt: new Date().toISOString()
    };
    await dbPut(STORE_TODOS, todo);
    return getTodoList();
  }

  /**
   * 切换TODO完成状态（读写 IndexedDB）
   * @param {string} id - TODO ID
   * @returns {Promise<Array>} 更新后的列表
   */
  async function toggleTodo(id) {
    const item = await dbGet(STORE_TODOS, id);
    if (item) {
      item.completed = !item.completed;
      await dbPut(STORE_TODOS, item);
    }
    return getTodoList();
  }

  /**
   * 删除TODO项（从 IndexedDB 删除）
   * @param {string} id - TODO ID
   * @returns {Promise<Array>} 更新后的列表
   */
  async function removeTodo(id) {
    await dbDelete(STORE_TODOS, id);
    return getTodoList();
  }

  /**
   * 清除已完成的TODO（使用游标删除已完成项，保留未完成项）
   * @returns {Promise<Array>} 更新后的列表
   */
  async function clearCompletedTodos() {
    const db = await ensureDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TODOS, 'readwrite');
      const store = tx.objectStore(STORE_TODOS);
      const index = store.index('completed');
      // 打开游标遍历所有 completed=true 的记录并删除
      const request = index.openCursor(IDBKeyRange.only(true));
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return getTodoList();
  }

  /**
   * 获取保存的标签页
   * @returns {Promise<Array>} 标签页列表
   */
  function getSavedTabs() {
    return get(KEYS.SAVED_TABS, []);
  }

  /**
   * 保存标签页
   * @param {Object} tab - 标签页信息
   * @returns {Promise<Array>} 更新后的列表
   */
  async function saveTab(tab) {
    const tabs = await getSavedTabs();
    // 检查是否已存在
    const exists = tabs.find(t => t.url === tab.url);
    if (!exists) {
      tabs.unshift({
        id: Date.now().toString(),
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl || '',
        savedAt: new Date().toISOString()
      });
      await set(KEYS.SAVED_TABS, tabs);
    }
    return tabs;
  }

  /**
   * 删除保存的标签页
   * @param {string} id - 标签页ID
   * @returns {Promise<Array>} 更新后的列表
   */
  async function removeSavedTab(id) {
    const tabs = await getSavedTabs();
    const newTabs = tabs.filter(tab => tab.id !== id);
    await set(KEYS.SAVED_TABS, newTabs);
    return newTabs;
  }

  /**
   * 清空保存的标签页
   * @returns {Promise<void>}
   */
  function clearSavedTabs() {
    return set(KEYS.SAVED_TABS, []);
  }

  /**
   * 获取下载历史
   * @returns {Promise<Array>} 下载历史列表
   */
  function getDownloadHistory() {
    return get(KEYS.DOWNLOAD_HISTORY, []);
  }

  /**
   * 添加下载历史
   * @param {Object} item - 下载记录
   * @returns {Promise<Array>} 更新后的列表
   */
  async function addDownloadHistory(item) {
    const history = await getDownloadHistory();
    history.unshift({
      id: Date.now().toString(),
      url: item.url,
      filename: item.filename || '',
      status: item.status || 'pending',
      createdAt: new Date().toISOString()
    });
    // 最多保存50条
    if (history.length > 50) {
      history.pop();
    }
    await set(KEYS.DOWNLOAD_HISTORY, history);
    return history;
  }

  /**
   * 更新下载历史状态
   * @param {string} id - 记录ID
   * @param {string} status - 新状态
   * @returns {Promise<Array>} 更新后的列表
   */
  async function updateDownloadStatus(id, status) {
    const history = await getDownloadHistory();
    const item = history.find(h => h.id === id);
    if (item) {
      item.status = status;
      await set(KEYS.DOWNLOAD_HISTORY, history);
    }
    return history;
  }

  /**
   * 删除下载历史
   * @param {string} id - 记录ID
   * @returns {Promise<Array>} 更新后的列表
   */
  async function removeDownloadHistory(id) {
    const history = await getDownloadHistory();
    const newHistory = history.filter(item => item.id !== id);
    await set(KEYS.DOWNLOAD_HISTORY, newHistory);
    return newHistory;
  }

  /**
   * 清空下载历史
   * @returns {Promise<void>}
   */
  function clearDownloadHistory() {
    return set(KEYS.DOWNLOAD_HISTORY, []);
  }

  /**
   * 获取取色历史
   * @returns {Promise<Array>} 取色历史列表
   */
  function getColorHistory() {
    return get(KEYS.COLOR_HISTORY, []);
  }

  /**
   * 添加取色历史
   * @param {Object} item - 取色记录 { hex, r, g, b }
   * @returns {Promise<Array>} 更新后的列表
   */
  async function addColorHistory(item) {
    const history = await getColorHistory();
    history.unshift({
      id: Date.now().toString(),
      hex: item.hex,
      r: item.r,
      g: item.g,
      b: item.b,
      createdAt: new Date().toISOString()
    });
    // 最多保存30条
    if (history.length > 30) {
      history.pop();
    }
    await set(KEYS.COLOR_HISTORY, history);
    return history;
  }

  /**
   * 删除取色历史
   * @param {string} id - 记录ID
   * @returns {Promise<Array>} 更新后的列表
   */
  async function removeColorHistory(id) {
    const history = await getColorHistory();
    const newHistory = history.filter(item => item.id !== id);
    await set(KEYS.COLOR_HISTORY, newHistory);
    return newHistory;
  }

  /**
   * 清空取色历史
   * @returns {Promise<void>}
   */
  function clearColorHistory() {
    return set(KEYS.COLOR_HISTORY, []);
  }

  /**
   * 获取番茄钟统计数据
   * @returns {Promise<Object>} 统计数据
   */
  function getPomodoroStats() {
    return get(KEYS.POMODORO_STATS, {
      todayCount: 0,
      totalCount: 0,
      totalMinutes: 0,
      lastDate: ''
    });
  }

  /**
   * 增加番茄计数
   * @param {number} minutes - 工作分钟数
   * @returns {Promise<Object>} 更新后的统计
   */
  async function incrementPomodoro(minutes) {
    const stats = await getPomodoroStats();
    const today = new Date().toDateString();
    
    if (stats.lastDate !== today) {
      stats.todayCount = 0;
      stats.lastDate = today;
    }
    
    stats.todayCount += 1;
    stats.totalCount += 1;
    stats.totalMinutes += minutes;
    
    await set(KEYS.POMODORO_STATS, stats);
    return stats;
  }

  /**
   * 导出所有数据
   * 包含 chrome.storage 中的配置与历史，以及 IndexedDB 中的 projects、todos、qrcode、jsonHistory
   * @returns {Promise<Object>} 所有数据
   */
  async function exportAllData() {
    const data = {};
    // 导出 chrome.storage 中的数据（排除已迁移到 IndexedDB 的键）
    for (const key of Object.values(KEYS)) {
      if (key === KEYS.TODO_LIST || key === KEYS.QRCODE_HISTORY || key === KEYS.JSON_HISTORY) continue;
      data[key] = await get(key, null);
    }
    // 从 IndexedDB 导出 projects、todos、qrcode、jsonHistory
    data.projects = await getProjects();
    data[KEYS.TODO_LIST] = await getTodoList();
    data[KEYS.QRCODE_HISTORY] = await getQrcodeHistory();
    data[KEYS.JSON_HISTORY] = await getJsonHistory();
    return {
      version: '1.1.0',
      exportDate: new Date().toISOString(),
      data: data
    };
  }

  /**
   * 导入数据
   * projects、todoList、qrcodeHistory 和 jsonHistory 写入 IndexedDB，其他数据写入 chrome.storage
   * @param {Object} exportData - 导出的数据
   * @returns {Promise<void>}
   */
  async function importData(exportData) {
    if (!exportData || !exportData.data) {
      throw new Error('无效的导入文件格式错误');
    }

    const data = exportData.data;
    // 先导入 projects（todo 依赖 projectId）
    if (data.projects && Array.isArray(data.projects)) {
      await dbClear(STORE_PROJECTS);
      if (data.projects.length > 0) {
        await dbPutAll(STORE_PROJECTS, data.projects);
      }
    }
    // 导入 qrcodeHistory 到 IndexedDB
    if (data[KEYS.QRCODE_HISTORY] && Array.isArray(data[KEYS.QRCODE_HISTORY])) {
      await dbClear(STORE_QRCODE);
      if (data[KEYS.QRCODE_HISTORY].length > 0) {
        await dbPutAll(STORE_QRCODE, data[KEYS.QRCODE_HISTORY]);
      }
    }
    // 导入 jsonHistory 到 IndexedDB
    if (data[KEYS.JSON_HISTORY] && Array.isArray(data[KEYS.JSON_HISTORY])) {
      await dbClear(STORE_JSON);
      if (data[KEYS.JSON_HISTORY].length > 0) {
        await dbPutAll(STORE_JSON, data[KEYS.JSON_HISTORY]);
      }
    }
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) {
        continue;
      }
      // 已在上面单独处理过的 IndexedDB 仓库，跳过
      if (key === 'projects' || key === KEYS.QRCODE_HISTORY || key === KEYS.JSON_HISTORY) continue;
      // todoList 单独处理，写入 IndexedDB
      if (key === KEYS.TODO_LIST) {
        await saveTodoList(value);
      } else {
        await set(key, value);
      }
    }
  }

  /**
   * 重置所有数据
   * 清空 chrome.storage.sync、IndexedDB 中的 projects、todos、qrcode、jsonHistory，并重新初始化默认设置
   * @returns {Promise<void>}
   */
  async function resetAllData() {
    await chrome.storage.sync.clear();
    // 清空 IndexedDB 中的数据
    try {
      await dbClear(STORE_TODOS);
      await dbClear(STORE_PROJECTS);
      await dbClear(STORE_QRCODE);
      await dbClear(STORE_JSON);
    } catch (e) {
      // 数据库未打开时忽略错误
    }
    // 重新初始化默认设置
    await set(KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  // 公开API
  return {
    KEYS,
    DEFAULT_SETTINGS,
    get,
    set,
    remove,
    getSettings,
    saveSettings,
    getQrcodeHistory,
    addQrcodeHistory,
    removeQrcodeHistory,
    clearQrcodeHistory,
    getJsonHistory,
    addJsonHistory,
    removeJsonHistory,
    clearJsonHistory,
    getProjects,
    addProject,
    updateProject,
    deleteProject,
    getProjectPendingCount,
    getTodoList,
    saveTodoList,
    addTodo,
    toggleTodo,
    removeTodo,
    clearCompletedTodos,
    getSavedTabs,
    saveTab,
    removeSavedTab,
    clearSavedTabs,
    getDownloadHistory,
    addDownloadHistory,
    updateDownloadStatus,
    removeDownloadHistory,
    clearDownloadHistory,
    getColorHistory,
    addColorHistory,
    removeColorHistory,
    clearColorHistory,
    getPomodoroStats,
    incrementPomodoro,
    exportAllData,
    importData,
    resetAllData
  };
})();
