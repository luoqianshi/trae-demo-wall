// 极简状态层（事件订阅）
(function (global) {
  'use strict';
  function createStore(initial) {
    let state = initial;
    const listeners = new Set();
    return {
      get() { return state; },
      set(patch) {
        state = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
        listeners.forEach(fn => fn(state));
      },
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
    };
  }
  global.createStore = createStore;
})(window);
