/* ============================================================
   state.js — 全局状态管理
   单例模式，维护应用全局状态，提供订阅/发布机制
   ============================================================ */

const AppState = (() => {
  const listeners = {};

  const state = {
    /* 文稿 */
    scriptText: '',

    /* AI 识别结果 */
    analysisResults: [],

    /* 当前选中的包装点 ID */
    selectedResultId: null,

    /* 是否正在分析中 */
    isAnalyzing: false,

    /* 当前主题 */
    theme: 'dark', // 'dark' | 'light'

    /* 当前强调色 */
    accent: 'amber', // 'amber' | 'blue'

    /* 预览相关 */
    previewPlaying: false,
    previewProgress: 0,
    previewTemplateId: null,

    /* 导出 */
    exportJobCounter: 0,
    exportJobs: [],
    exportFormat: 'mov-prores4444',
    exportResolution: '1080x1700',
    exportFps: 25,
    exportDuration: 3,
    isExporting: false,

    /* KIMI 配置（运行时，持久化在 localStorage） */
    kimiEnabled: false,
    kimiApiKey: '',
    kimiMode: 'rules-first',
  };

  function get(key) {
    if (key) return state[key];
    return { ...state };
  }

  function set(key, value) {
    const old = state[key];
    state[key] = value;
    if (old !== value) {
      emit(key, value, old);
      emit('change', { key, value, old });
    }
  }

  function setMultiple(obj) {
    Object.entries(obj).forEach(([key, value]) => {
      set(key, value);
    });
  }

  function on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
    return () => {
      listeners[event] = listeners[event].filter(cb => cb !== callback);
    };
  }

  function emit(event, ...args) {
    if (listeners[event]) {
      listeners[event].forEach(cb => cb(...args));
    }
  }

  // 计算属性
  function getSelectedResult() {
    if (!state.selectedResultId) return null;
    return state.analysisResults.find(r => r.id === state.selectedResultId) || null;
  }

  function getResultsCount() {
    return state.analysisResults.length;
  }

  return { get, set, setMultiple, on, emit, getSelectedResult, getResultsCount };
})();

// 挂载到全局
window.AppState = AppState;