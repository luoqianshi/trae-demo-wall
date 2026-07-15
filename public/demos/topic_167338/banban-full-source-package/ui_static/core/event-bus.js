/* ================================================================
 * Banban Core — Event Bus  v1.0
 * 事件总线：发布/订阅 + 批量模式
 *
 * 所有状态变更都通过事件通知，各页面订阅后自动更新
 * ================================================================ */

const BanbanEventBus = (() => {
  'use strict';

  // ===== 事件类型常量 =====
  const EVENTS = {
    // 节点相关
    NODE_CREATED: 'node.created',
    NODE_UPDATED: 'node.updated',
    NODE_DELETED: 'node.deleted',
    NODE_COMPLETED: 'node.completed',
    NODE_MOVED: 'node.moved',

    // 关系相关
    RELATION_CREATED: 'relation.created',
    RELATION_UPDATED: 'relation.updated',
    RELATION_DELETED: 'relation.deleted',

    // 日程块相关
    SCHEDULE_CREATED: 'schedule.created',
    SCHEDULE_UPDATED: 'schedule.updated',
    SCHEDULE_DELETED: 'schedule.deleted',
    SCHEDULE_MOVED: 'schedule.moved',
    SCHEDULE_RESIZED: 'schedule.resized',

    // 专注会话相关
    FOCUS_STARTED: 'focus.started',
    FOCUS_UPDATED: 'focus.updated',
    FOCUS_PAUSED: 'focus.paused',
    FOCUS_RESUMED: 'focus.resumed',
    FOCUS_COMPLETED: 'focus.completed',
    FOCUS_CANCELLED: 'focus.cancelled',

    // 习惯相关
    HABIT_INSTANCE_CREATED: 'habit.instance_created',
    HABIT_INSTANCE_UPDATED: 'habit.instance_updated',
    HABIT_INSTANCE_COMPLETED: 'habit.instance_completed',

    // 计划版本相关
    PLAN_DRAFT_CREATED: 'plan.draft_created',
    PLAN_DRAFT_UPDATED: 'plan.draft_updated',
    PLAN_CONFIRMED: 'plan.confirmed',
    PLAN_APPLIED: 'plan.applied',

    // 批量变更
    BATCH_STARTED: 'batch.started',
    BATCH_ENDED: 'batch.ended',
    BATCH_CHANGED: 'batch.changed',

    // 存储同步
    STORE_HYDRATED: 'store.hydrated',
    STORE_SYNCED: 'store.synced',

    // 导航上下文
    NAVIGATE: 'navigate',
  };

  // ===== 内部状态 =====
  const _listeners = new Map();    // eventName -> Set<callback>
  let _batchDepth = 0;
  let _batchedEvents = [];
  let _lastEventId = 0;

  // ================================================================
  // 订阅
  // ================================================================
  function on(eventName, callback) {
    if (!_listeners.has(eventName)) {
      _listeners.set(eventName, new Set());
    }
    _listeners.get(eventName).add(callback);

    // 返回取消订阅函数
    return () => off(eventName, callback);
  }

  function off(eventName, callback) {
    const set = _listeners.get(eventName);
    if (set) {
      set.delete(callback);
    }
  }

  function once(eventName, callback) {
    const wrapper = (data) => {
      callback(data);
      off(eventName, wrapper);
    };
    return on(eventName, wrapper);
  }

  // 订阅所有事件（通配符）
  function onAny(callback) {
    return on('*', callback);
  }

  // ================================================================
  // 发布
  // ================================================================
  function emit(eventName, data) {
    const event = {
      id: ++_lastEventId,
      type: eventName,
      data: data || {},
      timestamp: Date.now(),
    };

    // 批量模式：先缓存
    if (_batchDepth > 0) {
      _batchedEvents.push(event);
      return;
    }

    _emitImmediate(eventName, event);
  }

  function _emitImmediate(eventName, event) {
    // 具体事件的监听器
    const listeners = _listeners.get(eventName);
    if (listeners) {
      listeners.forEach(cb => {
        try { cb(event.data, event); }
        catch (e) { console.error(`[EventBus] 事件 ${eventName} 处理错误:`, e); }
      });
    }

    // 通配符监听器
    const allListeners = _listeners.get('*');
    if (allListeners) {
      allListeners.forEach(cb => {
        try { cb(eventName, event.data, event); }
        catch (e) { console.error('[EventBus] 通配符处理错误:', e); }
      });
    }
  }

  // ================================================================
  // 批量模式
  // ================================================================
  function startBatch() {
    if (_batchDepth === 0) {
      _batchedEvents = [];
      emit(EVENTS.BATCH_STARTED, {});
    }
    _batchDepth++;
  }

  function endBatch() {
    _batchDepth--;
    if (_batchDepth <= 0) {
      _batchDepth = 0;
      const events = [..._batchedEvents];
      _batchedEvents = [];

      if (events.length > 0) {
        // 逐个发布
        events.forEach(evt => {
          _emitImmediate(evt.type, evt);
        });

        // 发布批量变更事件（用于整体重渲染优化）
        const batchEvent = {
          id: ++_lastEventId,
          type: EVENTS.BATCH_CHANGED,
          data: { events },
          timestamp: Date.now(),
        };
        _emitImmediate(EVENTS.BATCH_CHANGED, batchEvent);
      }

      _emitImmediate(EVENTS.BATCH_ENDED, {
        id: ++_lastEventId,
        type: EVENTS.BATCH_ENDED,
        data: { count: events.length },
        timestamp: Date.now(),
      });
    }
  }

  // 便捷：批量执行一个函数
  function batch(fn) {
    startBatch();
    try {
      const result = fn();
      endBatch();
      return result;
    } catch (e) {
      // 出错也要结束批量模式
      _batchDepth = 0;
      _batchedEvents = [];
      throw e;
    }
  }

  // ================================================================
  // 调试工具
  // ================================================================
  function getListenerCount(eventName) {
    if (eventName) {
      return _listeners.get(eventName)?.size || 0;
    }
    let total = 0;
    _listeners.forEach(set => total += set.size);
    return total;
  }

  function getActiveEvents() {
    return Array.from(_listeners.keys());
  }

  // ================================================================
  // 公开 API
  // ================================================================
  return {
    EVENTS,

    // 订阅
    on,
    off,
    once,
    onAny,

    // 发布
    emit,

    // 批量
    startBatch,
    endBatch,
    batch,

    // 调试
    getListenerCount,
    getActiveEvents,
  };
})();

// 暴露到全局
if (typeof window !== 'undefined') {
  window.BanbanEventBus = BanbanEventBus;
  window.EventBus = BanbanEventBus;
}
