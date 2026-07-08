/**
 * EventBus.js — 中央事件总线
 * 模块间解耦通信的唯一通道
 * 用法: EventBus.on('scene:changed', handler); EventBus.emit('scene:changed', data);
 */
const EventBus = (function() {
  'use strict';

  const listeners = {};
  let debug = false;

  /**
   * 注册事件监听
   * @param {string} event - 事件名 (如 'scene:changed')
   * @param {Function} fn - 回调函数
   * @param {object} [opts] - { once: true }
   * @returns {Function} 取消监听的函数
   */
  function on(event, fn, opts) {
    if (!listeners[event]) listeners[event] = [];
    const entry = { fn, once: !!(opts && opts.once) };
    listeners[event].push(entry);
    return () => off(event, fn);
  }

  /**
   * 注册一次性事件监听
   */
  function once(event, fn) {
    return on(event, fn, { once: true });
  }

  /**
   * 移除事件监听
   */
  function off(event, fn) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(e => e.fn !== fn);
  }

  /**
   * 触发事件
   * @param {string} event - 事件名
   * @param {*} data - 事件数据
   */
  function emit(event, data) {
    if (debug) console.log('[EventBus]', event, data);
    if (!listeners[event]) return;
    // 复制数组以防止在回调中修改导致的问题
    const entries = listeners[event].slice();
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      try {
        entry.fn(data);
      } catch (e) {
        console.error('[EventBus] Error in handler for', event, ':', e);
      }
      if (entry.once) {
        listeners[event] = listeners[event].filter(e => e !== entry);
      }
    }
  }

  /**
   * 移除所有监听器
   */
  function clear() {
    for (const key in listeners) {
      delete listeners[key];
    }
  }

  /**
   * 开启调试模式
   */
  function enableDebug() { debug = true; }
  function disableDebug() { debug = false; }

  return { on, once, off, emit, clear, enableDebug, disableDebug };
})();