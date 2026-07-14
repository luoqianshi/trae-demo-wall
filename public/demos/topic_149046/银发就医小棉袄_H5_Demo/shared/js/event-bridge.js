/**
 * @trae-gen true
 * @trae-review-status reviewed
 * @trae-module shared-js
 */

// 银发就医小棉袄 事件桥接器
// 基于 localStorage storage 事件实现跨页面通信
// 事件命名空间：silvercare:event:{事件名}
// 零依赖，仅使用浏览器原生 API
//
// 设计说明：
// - 同页面通信：window.dispatchEvent(CustomEvent) 触发当前页面监听器
// - 跨页面通信：localStorage.setItem 触发其他页面的 storage 事件
//   （storage 事件不会在写入页面自身触发，故同页面需单独 dispatch）
const EventBridge = (function () {
  'use strict';

  var NAMESPACE = 'silvercare:event:';

  // 监听器映射表：eventName -> Map<originalCallback, wrappedCallback>
  // wrappedCallback 是绑定到 window 自定义事件上的包装函数，用于精确 off
  var listenerMap = new Map();

  // storage 事件统一处理器（仅安装一次）
  var storageListenerInstalled = false;

  // 安装全局 storage 事件监听，用于接收跨页面事件
  function ensureStorageListener() {
    if (storageListenerInstalled) return;
    storageListenerInstalled = true;
    window.addEventListener('storage', handleStorageEvent);
  }

  // 处理跨页面 storage 事件
  function handleStorageEvent(e) {
    if (!e.key || e.key.indexOf(NAMESPACE) !== 0) return;
    var eventName = e.key.substring(NAMESPACE.length);
    var entries = listenerMap.get(eventName);
    if (!entries || entries.size === 0) return;

    // 解析 payload（{ data, timestamp }）
    var data = null;
    if (e.newValue) {
      try {
        var payload = JSON.parse(e.newValue);
        data = payload ? payload.data : null;
      } catch (err) {
        console.error('[EventBridge] storage 事件 payload 解析失败:', err);
        data = null;
      }
    }

    // 通知该事件的全部监听器
    entries.forEach(function (originalCallback) {
      try {
        originalCallback(data);
      } catch (err) {
        console.error('[EventBridge] 监听器执行异常:', err);
      }
    });
  }

  return {
    // 预定义事件常量
    EVENTS: {
      THEME_CHANGED: 'theme:changed',
      RECORDING_DONE: 'recording:done',
      SUMMARY_GENERATED: 'summary:generated',
      SAFETY_ALERT: 'safety:alert',
      MEDICATION_TAKEN: 'medication:taken',
      SHARE_UPDATED: 'share:updated'
    },

    // 监听事件
    // 同页面：绑定到 window 自定义事件（silvercare:event:{event}）
    // 跨页面：由全局 storage 事件统一分发
    on: function (event, callback) {
      if (!event || typeof callback !== 'function') return;

      ensureStorageListener();

      if (!listenerMap.has(event)) {
        listenerMap.set(event, new Map());
      }

      // 包装函数：从 CustomEvent.detail 取出数据传给业务回调
      var wrapped = function (e) {
        try {
          callback(e.detail);
        } catch (err) {
          console.error('[EventBridge] 监听器执行异常:', err);
        }
      };

      listenerMap.get(event).set(callback, wrapped);
      window.addEventListener(NAMESPACE + event, wrapped);
    },

    // 发送事件（同页面 + 跨页面）
    emit: function (event, data) {
      if (!event) return;

      // 1) 同页面派发：window.dispatchEvent 触发当前页面监听器
      try {
        window.dispatchEvent(new CustomEvent(NAMESPACE + event, { detail: data }));
      } catch (err) {
        console.error('[EventBridge] 同页面派发失败:', err);
      }

      // 2) 跨页面派发：写入 localStorage 触发其他页面的 storage 事件
      //    payload 携带 timestamp，保证相同内容也能触发 storage 事件
      try {
        var payload = JSON.stringify({ data: data, timestamp: Date.now() });
        localStorage.setItem(NAMESPACE + event, payload);
      } catch (err) {
        console.error('[EventBridge] 跨页面派发失败:', err);
      }
    },

    // 取消监听
    // 指定 callback：仅移除该回调；未指定：移除该事件的全部监听
    off: function (event, callback) {
      if (!event || !listenerMap.has(event)) return;
      var entries = listenerMap.get(event);

      if (typeof callback === 'function') {
        var wrapped = entries.get(callback);
        if (wrapped) {
          window.removeEventListener(NAMESPACE + event, wrapped);
          entries.delete(callback);
        }
        if (entries.size === 0) listenerMap.delete(event);
      } else {
        entries.forEach(function (wrapped) {
          window.removeEventListener(NAMESPACE + event, wrapped);
        });
        listenerMap.delete(event);
      }
    }
  };
})();
