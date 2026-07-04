/* =================================================================
   CodeBeat 节奏编程 - 对象池
   ================================================================= */

/**
 * 通用对象池，用于复用频繁创建/销毁的 DOM 对象（如下落音符）。
 * 减少 GC 压力，提升游戏循环稳定性。
 *
 * @template T
 */
class ObjectPool {
  /**
   * @param {Function} factory - 创建新对象的工厂函数，无参数。
   * @param {Function} resetFn - 重置并初始化对象：resetFn(obj, ...args)。
   * @param {Function} cleanupFn - 回收对象时的清理：cleanupFn(obj)。
   * @param {number} [initialSize=20] - 初始预创建数量。
   */
  constructor(factory, resetFn, cleanupFn, initialSize = 20) {
    if (typeof factory !== 'function' || typeof resetFn !== 'function' || typeof cleanupFn !== 'function') {
      throw new Error('ObjectPool 需要传入 factory、resetFn、cleanupFn 三个函数');
    }
    /** @type {Function} */
    this.factory = factory;
    /** @type {Function} */
    this.resetFn = resetFn;
    /** @type {Function} */
    this.cleanupFn = cleanupFn;
    /** @type {T[]} 空闲对象池 */
    this.pool = [];
    /** @type {number} 已创建对象总数上限参考 */
    this.maxSize = Math.max(initialSize * 2, 100);

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  /**
   * 从池中获取一个对象，并用 resetFn 初始化。
   * @param {...*} args - 传递给 resetFn 的参数。
   * @returns {T}
   */
  acquire(...args) {
    const obj = this.pool.length > 0 ? this.pool.pop() : this.factory();
    obj.__inPool = false;
    this.resetFn(obj, ...args);
    return obj;
  }

  /**
   * 将对象回收到池中。
   * 幂等：已被回收的对象不会重复入池。
   * @param {T} obj - 要回收的对象。
   */
  release(obj) {
    if (!obj || obj.__inPool) return;
    this.cleanupFn(obj);
    obj.__inPool = true;
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  /**
   * 清空池（释放所有缓存对象）。
   */
  clear() {
    for (const obj of this.pool) {
      this.cleanupFn(obj);
    }
    this.pool.length = 0;
  }

  /**
   * 获取当前池大小。
   * @returns {number}
   */
  size() {
    return this.pool.length;
  }
}
