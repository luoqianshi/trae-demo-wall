/**
 * @fileoverview 全局事件总线模块
 * @description 提供发布-订阅模式的事件总线，用于模块间解耦通信。
 *              支持事件注册、取消、一次性监听，以及最大监听器数限制。
 * @module event-bus
 * @example
 *   import { EventBus } from './event-bus.js';
 *   EventBus.on('conversation:parsed', (data) => { ... });
 *   EventBus.emit('conversation:parsed', { sessionId, messages });
 *   EventBus.off('conversation:parsed', handler);
 */

/**
 * @typedef {Function} EventHandler
 * @param {...*} args - 事件传递的参数
 */

/**
 * @typedef {Object} EventEntry
 * @property {EventHandler} handler - 事件处理函数
 * @property {boolean} once - 是否为一次性监听器
 */

/**
 * 全局事件总线单例
 * @description 采用发布-订阅模式，维护一个事件名称到处理函数数组的映射表。
 *              每个事件类型最多允许 50 个监听器，防止内存泄漏。
 */
export const EventBus = (() => {
  'use strict';

  /** @type {Map<string, EventEntry[]>} 事件映射表 */
  const _events = new Map();

  /** @type {number} 单个事件最大监听器数量 */
  const MAX_LISTENERS = 50;

  /**
   * 注册事件监听器
   * @param {string} event - 事件名称（推荐使用 'module:action' 命名风格）
   * @param {EventHandler} handler - 事件处理函数
   * @returns {EventBus} 返回自身以支持链式调用
   * @throws {Error} 当 handler 不是函数时抛出 TypeError
   * @throws {Error} 当监听器数量超过上限时抛出 Error
   */
  function on(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError(`EventBus.on: handler 必须是函数，收到 ${typeof handler}`);
    }

    const listeners = _events.get(event) || [];

    if (listeners.length >= MAX_LISTENERS) {
      console.warn(
        `EventBus: 事件 "${event}" 的监听器数量已达上限 (${MAX_LISTENERS})，` +
        '可能存在内存泄漏，请检查是否正确移除了监听器。'
      );
    }

    listeners.push({ handler, once: false });
    _events.set(event, listeners);

    return api;
  }

  /**
   * 注册一次性事件监听器，触发一次后自动移除
   * @param {string} event - 事件名称
   * @param {EventHandler} handler - 事件处理函数
   * @returns {EventBus} 返回自身以支持链式调用
   */
  function once(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError(`EventBus.once: handler 必须是函数，收到 ${typeof handler}`);
    }

    const listeners = _events.get(event) || [];
    listeners.push({ handler, once: true });
    _events.set(event, listeners);

    return api;
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {EventHandler} [handler] - 要移除的处理函数。
   *   若不传则移除该事件的所有监听器。
   * @returns {EventBus} 返回自身以支持链式调用
   */
  function off(event, handler) {
    if (!handler) {
      // 未指定 handler，移除该事件的所有监听器
      _events.delete(event);
      return api;
    }

    const listeners = _events.get(event);
    if (!listeners) return api;

    // 过滤掉匹配的 handler
    const filtered = listeners.filter((entry) => entry.handler !== handler);

    if (filtered.length === 0) {
      _events.delete(event);
    } else {
      _events.set(event, filtered);
    }

    return api;
  }

  /**
   * 触发事件，通知所有已注册的监听器
   * @param {string} event - 事件名称
   * @param {...*} args - 传递给监听器的参数
   * @returns {boolean} 如果有监听器被调用则返回 true，否则返回 false
   */
  function emit(event, ...args) {
    const listeners = _events.get(event);
    if (!listeners || listeners.length === 0) return false;

    // 先复制一份监听器列表，防止在遍历过程中被修改
    const snapshot = listeners.slice();

    for (const entry of snapshot) {
      try {
        entry.handler(...args);
      } catch (error) {
        console.error(
          `EventBus: 事件 "${event}" 的监听器执行出错:`,
          error
        );
      }

      // 一次性监听器触发后移除
      if (entry.once) {
        off(event, entry.handler);
      }
    }

    return true;
  }

  /**
   * 移除所有事件的所有监听器
   */
  function clear() {
    _events.clear();
  }

  /**
   * 获取指定事件的监听器数量（主要用于调试和测试）
   * @param {string} event - 事件名称
   * @returns {number} 监听器数量
   */
  function listenerCount(event) {
    const listeners = _events.get(event);
    return listeners ? listeners.length : 0;
  }

  /**
   * 获取所有已注册的事件名称（主要用于调试）
   * @returns {string[]} 事件名称数组
   */
  function eventNames() {
    return Array.from(_events.keys());
  }

  // 对外暴露的公共 API
  const api = Object.freeze({
    on,
    once,
    off,
    emit,
    clear,
    listenerCount,
    eventNames,
  });

  return api;
})();
