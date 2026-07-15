/**
 * store.js - 轻量级状态管理器
 * 使用 Pub/Sub 模式，深合并更新 + 发布订阅机制
 * 原生 ES6+，零外部依赖
 */
'use strict';

const Store = {
  state: {
    currentUser: { name: '', firstVisit: true },
    chatSession: { messages: [], currentEmotion: null, isAnalyzing: false },
    breathing: { isActive: false, currentPhase: 'inhale', duration: 0, vibrationEnabled: true },
    trashCan: { todayStones: [], currentStone: null },
    training: { cbtCards: [], boundaryRecords: [], energyRecords: [] },
    navigation: { currentPage: 'home', history: [], transitionDirection: 'forward' }
  },

  listeners: new Map(),

  /**
   * 订阅状态变化事件
   * @param {string} key - 状态路径键（支持嵌套如 'chatSession.messages'）
   * @param {Function} callback - 回调函数 (newValue, oldValue) => void
   * @returns {Function} 取消订阅函数
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);

    // 返回取消订阅
    return () => {
      const callbacks = this.listeners.get(key);
      if (!callbacks) return;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      // 清理空数组
      if (callbacks.length === 0) {
        this.listeners.delete(key);
      }
    };
  },

  /**
   * 深度合并对象
   * @param {Object} target - 目标对象
   * @param {Object} source - 源对象
   * @returns {Object} 合并后的新对象
   */
  deepMerge(target, source) {
    // 处理 null/undefined 情况
    if (source === null || source === undefined) {
      return source;
    }

    // 如果两者都是对象且非数组，进行深度合并
    if (
      typeof target === 'object' &&
      target !== null &&
      !Array.isArray(target) &&
      typeof source === 'object' &&
      source !== null &&
      !Array.isArray(source)
    ) {
      const merged = { ...target };
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          if (Object.prototype.hasOwnProperty.call(merged, key)) {
            merged[key] = this.deepMerge(merged[key], source[key]);
          } else {
            merged[key] = source[key];
          }
        }
      }
      return merged;
    }

    // 如果都是数组，替换整个数组（保持引用更新）
    if (Array.isArray(target) && Array.isArray(source)) {
      return [...source];
    }

    // 基础类型直接替换
    return source;
  },

  /**
   * 根据点分路径获取嵌套属性
   * @param {string} path - 点分路径如 'navigation.currentPage'
   * @param {Object} obj - 从哪个对象获取
   * @returns {*} 属性值
   */
  getNested(path, obj) {
    return path.split('.').reduce((acc, key) => {
      if (acc === null || typeof acc !== 'object') return undefined;
      return acc[key];
    }, obj);
  },

  /**
   * 更新状态（深合并）并通知所有订阅者
   * @param {string} key - 状态键（支持点分路径嵌套更新）
   * @param {*} value - 新值（会与旧值深合并）
   */
  setState(key, value) {
    const keys = key.split('.');
    const rootKey = keys[0];

    // 保存旧值用于回调
    const oldValue = this.getState(key);

    // 直接更新根键情况
    if (keys.length === 1) {
      this.state[rootKey] = this.deepMerge(this.state[rootKey], value);
    } else {
      // 嵌套更新，从根开始逐层遍历
      let current = this.state;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      // 最终更新叶子节点
      const lastKey = keys[keys.length - 1];
      if (
        current[lastKey] &&
        typeof current[lastKey] === 'object' &&
        !Array.isArray(current[lastKey]) &&
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        current[lastKey] = this.deepMerge(current[lastKey], value);
      } else {
        current[lastKey] = value;
      }
    }

    // 通知所有匹配的监听器（精确匹配 + 父节点监听器）
    this.notify(key, this.getState(key), oldValue);

    // 通知根节点的监听器
    if (rootKey !== key) {
      const rootValue = this.getState(rootKey);
      this.notify(rootKey, rootValue, rootValue);
    }
  },

  /**
   * 通知订阅者状态变化
   * @param {string} key - 状态键
   * @param {*} newValue - 新值
   * @param {*} oldValue - 旧值
   */
  notify(key, newValue, oldValue) {
    if (this.listeners.has(key)) {
      const callbacks = this.listeners.get(key);
      callbacks.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(`[Store.notify] 回调执行出错 [${key}]:`, error);
        }
      });
    }
  },

  /**
   * 安全获取状态
   * @param {string} [key] - 状态键（支持点分路径嵌套）不传则返回整个 state
   * @returns {*} 状态值，路径不存在返回 undefined
   */
  getState(key) {
    if (!key) return { ...this.state };
    return this.getNested(key, this.state);
  },

  /**
   * 将指定顶级状态保存到 localStorage
   * @param {string} key - 顶级状态键
   * @returns {boolean} 是否保存成功
   */
  saveToStorage(key) {
    if (!window || !window.localStorage) {
      console.warn('[Store.saveToStorage] localStorage 不可用');
      return false;
    }

    try {
      const storageKey = `hugyourself_${key}`;
      const data = this.state[key];
      localStorage.setItem(storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`[Store.saveToStorage] 保存失败 [${key}]:`, error);
      return false;
    }
  },

  /**
   * 从 localStorage 加载数据并更新状态
   * @param {string} key - 顶级状态键
   * @param {*} defaultValue - 存储不存在或读取失败时的默认值
   * @returns {boolean} 是否加载成功
   */
  loadFromStorage(key, defaultValue) {
    if (!window || !window.localStorage) {
      console.warn('[Store.loadFromStorage] localStorage 不可用');
      if (defaultValue !== undefined) {
        this.setState(key, defaultValue);
      }
      return false;
    }

    try {
      const storageKey = `hugyourself_${key}`;
      const raw = localStorage.getItem(storageKey);

      if (raw === null) {
        // 存储不存在，使用默认值
        if (defaultValue !== undefined) {
          this.setState(key, defaultValue);
        }
        return false;
      }

      const parsed = JSON.parse(raw);
      this.setState(key, parsed);
      return true;
    } catch (error) {
      console.error(`[Store.loadFromStorage] 读取失败 [${key}]:`, error);
      // 读取失败使用默认值
      if (defaultValue !== undefined) {
        this.setState(key, defaultValue);
      }
      return false;
    }
  },

  /**
   * 重置整个 Store 到初始状态
   * 注意：会清空所有状态和监听器，谨慎使用！
   */
  reset() {
    const initialState = {
      currentUser: { name: '', firstVisit: true },
      chatSession: { messages: [], currentEmotion: null, isAnalyzing: false },
      breathing: { isActive: false, currentPhase: 'inhale', duration: 0, vibrationEnabled: true },
      trashCan: { todayStones: [], currentStone: null },
      training: { cbtCards: [], boundaryRecords: [], energyRecords: [] },
      navigation: { currentPage: 'home', history: [], transitionDirection: 'forward' }
    };

    this.state = initialState;
    this.listeners.clear();
  },
};

// 暴露到全局（Store 已在顶部声明为全局变量）
window.Store = Store;