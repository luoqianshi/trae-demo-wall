/**
 * 忆路同行 - 事件总线
 * 发布订阅模式，实现模块间零耦合通信
 *
 * 注意：使用函数构造函数而非 class 声明，确保全局 EventBus 指向实例
 */

(function() {
  'use strict';

  // 事件总线构造函数（使用传统函数而非 class，避免全局作用域污染）
  function EventBusClass() {
    this.events = {};
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  EventBusClass.prototype.on = function(event, callback) {
    if (typeof callback !== 'function') {
      console.warn('[EventBus] callback must be a function');
      return function() {};
    }

    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(callback);

    // 返回取消订阅函数
    var self = this;
    return function() {
      self.off(event, callback);
    };
  };

  /**
   * 订阅事件（只执行一次）
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  EventBusClass.prototype.once = function(event, callback) {
    var self = this;
    var onceWrapper = function(data) {
      self.off(event, onceWrapper);
      callback(data);
    };
    return this.on(event, onceWrapper);
  };

  /**
   * 发布事件
   * @param {string} event - 事件名称
   * @param {*} data - 传递的数据
   */
  EventBusClass.prototype.emit = function(event, data) {
    if (!this.events[event]) {
      return;
    }

    this.events[event].forEach(function(callback) {
      try {
        callback(data);
      } catch (error) {
        console.error('[EventBus] Error in event "' + event + '":', error);
      }
    });
  };

  /**
   * 取消订阅
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  EventBusClass.prototype.off = function(event, callback) {
    if (!this.events[event]) {
      return;
    }

    this.events[event] = this.events[event].filter(function(cb) {
      return cb !== callback;
    });

    // 清理空数组
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  };

  /**
   * 取消某个事件的所有订阅
   * @param {string} event - 事件名称
   */
  EventBusClass.prototype.offAll = function(event) {
    delete this.events[event];
  };

  /**
   * 获取某个事件的订阅数量
   * @param {string} event - 事件名称
   * @returns {number}
   */
  EventBusClass.prototype.listenerCount = function(event) {
    return this.events[event] ? this.events[event].length : 0;
  };

  /**
   * 获取所有已注册的事件名称
   * @returns {string[]}
   */
  EventBusClass.prototype.getEvents = function() {
    return Object.keys(this.events);
  };

  // 创建全局单例实例
  var eventBusInstance = new EventBusClass();

  // 暴露到全局作用域：使用 var 确保 EventBus 全局变量指向实例
  // var 允许重复声明，避免多次加载时报错
  var EventBus = eventBusInstance;

  // 同时挂载到 window（双重保险，兼容各种使用方式）
  if (typeof window !== 'undefined') {
    window.EventBus = eventBusInstance;
  }

  // 标准事件定义
  var EVENTS = {
    // 个人档案
    PROFILE_UPDATED: 'profile:updated',
    PROFILE_CREATED: 'profile:created',

    // 回忆相关
    MEMORY_ADDED: 'memory:added',
    MEMORY_VIEWED: 'memory:viewed',

    // 游戏相关
    GAME_COMPLETED: 'game:completed',
    GAME_STARTED: 'game:started',

    // 情绪记录
    MOOD_RECORDED: 'mood:recorded',

    // 进度保存
    PROGRESS_SAVED: 'progress:saved',

    // 语音故事
    VOICE_RECORDED: 'voice:recorded',
    VOICE_PLAYED: 'voice:played',

    // 音乐疗法
    MUSIC_PLAYED: 'music:played',
    MUSIC_LIKED: 'music:liked',

    // 照片回忆
    PHOTO_VIEWED: 'photo:viewed',
    PHOTO_UPLOADED: 'photo:uploaded',

    // 时间轴
    TIMELINE_EVENT_ADDED: 'timeline:event:added',
    TIMELINE_EVENT_EDITED: 'timeline:event:edited',

    // 系统
    APP_READY: 'app:ready',
    ERROR_OCCURRED: 'error:occurred'
  };

  // 暴露事件常量
  if (typeof window !== 'undefined') {
    window.EVENTS = EVENTS;
  }

  console.log('[EventBus] 事件总线已初始化（实例模式）');
})();
