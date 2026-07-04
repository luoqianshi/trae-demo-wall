/* =================================================================
   CodeBeat 节奏编程 - 有限状态机
   ================================================================= */

/**
 * 通用有限状态机，用于管理游戏各阶段（menu / countdown / playing / paused / result）。
 * 支持显式状态转换、进入/离开/变化监听。
 */
class StateMachine {
  /**
   * @param {string} [initialState='menu'] - 初始状态。
   */
  constructor(initialState = 'menu') {
    /** @type {string} 当前状态 */
    this.state = initialState;
    /** @type {Map<string, Set<string>>} 允许的状态转换表 */
    this.transitions = new Map();
    /** @type {Object<string, Function[]>} 进入某状态的监听 */
    this.enterListeners = {};
    /** @type {Object<string, Function[]>} 离开某状态的监听 */
    this.leaveListeners = {};
    /** @type {Function[]} 任意状态变化的监听 */
    this.changeListeners = [];
  }

  /**
   * 注册允许的状态转换。
   * @param {string} from - 起始状态。
   * @param {string} to - 目标状态。
   */
  addTransition(from, to) {
    if (!this.transitions.has(from)) {
      this.transitions.set(from, new Set());
    }
    this.transitions.get(from).add(to);
  }

  /**
   * 批量注册转换。
   * @param {string} from - 起始状态。
   * @param {string[]} toList - 目标状态数组。
   */
  addTransitions(from, toList) {
    for (const to of toList) {
      this.addTransition(from, to);
    }
  }

  /**
   * 检查是否可以转换到目标状态。
   * @param {string} to - 目标状态。
   * @returns {boolean}
   */
  canTransition(to) {
    if (to === this.state) return false;
    const allowed = this.transitions.get(this.state);
    return allowed ? allowed.has(to) : false;
  }

  /**
   * 执行状态转换。
   * @param {string} to - 目标状态。
   * @param {Object} [data={}] - 随转换携带的附加数据。
   * @returns {boolean} 转换是否成功。
   */
  transition(to, data = {}) {
    if (!this.canTransition(to)) {
      console.warn(`StateMachine: 无效的状态转换 ${this.state} -> ${to}`);
      return false;
    }

    const from = this.state;
    const payload = { from, to, data };

    this._emitLeave(from, payload);
    this.state = to;
    this._emitEnter(to, payload);
    this._emitChange(payload);

    return true;
  }

  /**
   * 获取当前状态。
   * @returns {string}
   */
  getState() {
    return this.state;
  }

  /**
   * 监听进入某个状态。
   * @param {string} state - 要监听的状态。
   * @param {Function} listener - 回调，参数为 { from, to, data }。
   * @returns {Function} 取消监听函数。
   */
  onEnter(state, listener) {
    return this._addListener(this.enterListeners, state, listener);
  }

  /**
   * 监听离开某个状态。
   * @param {string} state - 要监听的状态。
   * @param {Function} listener - 回调，参数为 { from, to, data }。
   * @returns {Function} 取消监听函数。
   */
  onLeave(state, listener) {
    return this._addListener(this.leaveListeners, state, listener);
  }

  /**
   * 监听任意状态变化。
   * @param {Function} listener - 回调，参数为 { from, to, data }。
   * @returns {Function} 取消监听函数。
   */
  onChange(listener) {
    if (typeof listener !== 'function') return () => {};
    this.changeListeners.push(listener);
    return () => {
      const idx = this.changeListeners.indexOf(listener);
      if (idx !== -1) this.changeListeners.splice(idx, 1);
    };
  }

  /**
   * @private
   * @param {Object<string, Function[]>} store
   * @param {string} key
   * @param {Function} listener
   * @returns {Function}
   */
  _addListener(store, key, listener) {
    if (typeof listener !== 'function') return () => {};
    if (!store[key]) store[key] = [];
    store[key].push(listener);
    return () => {
      if (!store[key]) return;
      const idx = store[key].indexOf(listener);
      if (idx !== -1) store[key].splice(idx, 1);
    };
  }

  _emitLeave(state, payload) {
    this._emit(this.leaveListeners, state, payload);
  }

  _emitEnter(state, payload) {
    this._emit(this.enterListeners, state, payload);
  }

  _emitChange(payload) {
    const listeners = this.changeListeners.slice();
    for (const listener of listeners) {
      try {
        listener(payload);
      } catch (err) {
        console.error('StateMachine change 监听出错:', err);
      }
    }
  }

  _emit(store, key, payload) {
    if (!store[key]) return;
    const listeners = store[key].slice();
    for (const listener of listeners) {
      try {
        listener(payload);
      } catch (err) {
        console.error(`StateMachine ${key} 监听出错:`, err);
      }
    }
  }
}

/** 全局游戏状态机实例。 */
const gameStateMachine = new StateMachine('menu');
