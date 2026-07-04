/* =================================================================
   CodeBeat 节奏编程 - 事件总线（发布/订阅）
   ================================================================= */

/**
 * 轻量级发布/订阅事件总线。
 * 用于解耦游戏核心、UI、音频、特效等模块的通信。
 */
class EventBus {
  constructor() {
    /** @type {Object<string, Function[]>} */
    this.events = {};
  }

  /**
   * 订阅事件。
   * @param {string} event - 事件名称。
   * @param {Function} listener - 事件回调，接收 emit 传入的数据。
   * @returns {Function} 取消订阅的函数。
   */
  on(event, listener) {
    if (typeof listener !== 'function') {
      console.warn(`EventBus.on: 事件 ${event} 的 listener 必须是函数`);
      return () => {};
    }
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
    return () => this.off(event, listener);
  }

  /**
   * 一次性订阅，触发后自动移除。
   * @param {string} event - 事件名称。
   * @param {Function} listener - 事件回调。
   * @returns {Function} 取消订阅的函数。
   */
  once(event, listener) {
    const wrapper = (data) => {
      listener(data);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  /**
   * 取消订阅事件。
   * @param {string} event - 事件名称。
   * @param {Function} listener - 要移除的回调。
   */
  off(event, listener) {
    if (!this.events[event]) return;
    const idx = this.events[event].indexOf(listener);
    if (idx !== -1) this.events[event].splice(idx, 1);
  }

  /**
   * 发布事件，同步通知所有订阅者。
   * @param {string} event - 事件名称。
   * @param {*} [data] - 传递给监听者的数据。
   */
  emit(event, data) {
    if (!this.events[event]) return;
    // 复制数组避免监听者在回调中 off 导致索引错乱
    const listeners = this.events[event].slice();
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (err) {
        console.error(`EventBus 事件 ${event} 处理出错:`, err);
      }
    }
  }
}

/** 全局事件总线实例。 */
const eventBus = new EventBus();
