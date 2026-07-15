/**
 * event-bus.js · 极简发布订阅
 *
 * 用途：桥接层（web-serial / mock-replay）emit 事件 → 上层消费者订阅
 * 契约：事件对象来自 firmware/protocol.md v1.0，字段已通过 JSON.parse
 */
export class EventBus {
  constructor() {
    this._listeners = new Map(); // type → Set<fn>
    this._wildcard = new Set();  // '*' 订阅所有
  }

  on(type, fn) {
    if (type === '*') {
      this._wildcard.add(fn);
      return () => this._wildcard.delete(fn);
    }
    if (!this._listeners.has(type)) this._listeners.set(type, new Set());
    this._listeners.get(type).add(fn);
    return () => this._listeners.get(type).delete(fn);
  }

  emit(event) {
    const type = event && event.type;
    if (type && this._listeners.has(type)) {
      for (const fn of this._listeners.get(type)) {
        try { fn(event); } catch (e) { console.error('[EventBus]', type, e); }
      }
    }
    for (const fn of this._wildcard) {
      try { fn(event); } catch (e) { console.error('[EventBus] *', e); }
    }
  }
}
