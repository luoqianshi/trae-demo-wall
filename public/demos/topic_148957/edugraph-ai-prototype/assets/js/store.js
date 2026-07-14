/* ===== store.js · localStorage 封装 ===== */
window.Store = (function () {
  const KEY_HISTORY = 'edugraph_history';
  const KEY_SETTINGS = 'edugraph_settings';
  const KEY_FIRST_VISIT = 'edugraph_first_visit';
  const KEY_CUSTOM_MODELS = 'edugraph_custom_models';
  const MAX_HISTORY = 20;

  // ===== 内置模型库 =====
  // 每个模型预设：value(模型ID) + label(显示名) + provider(厂商) + baseUrl(默认 Base URL)
  const BUILTIN_MODELS = [
    { value: 'gpt-4o-mini', label: 'gpt-4o-mini', provider: 'OpenAI', baseUrl: 'https://api.openai.com/v1', note: '推荐，便宜快' },
    { value: 'gpt-4o',      label: 'gpt-4o',      provider: 'OpenAI', baseUrl: 'https://api.openai.com/v1', note: '更强' },
    { value: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo', provider: 'OpenAI', baseUrl: 'https://api.openai.com/v1', note: '最便宜' },
    { value: 'glm-4-flash', label: 'glm-4-flash', provider: '智谱', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', note: '智谱免费' },
    { value: 'glm-4',       label: 'glm-4',       provider: '智谱', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', note: '智谱旗舰' },
    { value: 'qwen-turbo',  label: 'qwen-turbo',  provider: '通义', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', note: '通义千问' },
    { value: 'qwen-plus',   label: 'qwen-plus',   provider: '通义', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', note: '通义增强' },
    { value: 'deepseek-chat', label: 'deepseek-chat', provider: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', note: 'DeepSeek' },
  ];

  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('Store.get failed:', key, e);
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Store.set failed:', key, e);
      Utils.toast('存储失败，可能空间已满', 'error');
      return false;
    }
  }

  // ===== 历史 =====
  function saveHistory(item) {
    const list = getHistory();
    list.unshift({
      id: item.id || Utils.uid(),
      question: item.question,
      subject: item.subject,
      result: item.result,
      createdAt: item.createdAt || Date.now(),
    });
    // 限制最多 MAX_HISTORY 条
    const trimmed = list.slice(0, MAX_HISTORY);
    safeSet(KEY_HISTORY, trimmed);
    return trimmed;
  }

  function getHistory() {
    return safeGet(KEY_HISTORY, []);
  }

  function clearHistory() {
    safeSet(KEY_HISTORY, []);
  }

  function deleteHistory(id) {
    const list = getHistory().filter(it => it.id !== id);
    safeSet(KEY_HISTORY, list);
    return list;
  }

  // ===== 设置 =====
  const DEFAULT_SETTINGS = {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    theme: 'light',
  };

  function getSettings() {
    return Object.assign({}, DEFAULT_SETTINGS, safeGet(KEY_SETTINGS, {}));
  }

  function saveSettings(s) {
    // trim apiKey
    if (s.apiKey) s.apiKey = s.apiKey.trim();
    if (s.baseUrl) s.baseUrl = s.baseUrl.trim().replace(/\/$/, '');
    const merged = Object.assign(getSettings(), s);
    safeSet(KEY_SETTINGS, merged);
    return merged;
  }

  function hasApiKey() {
    return !!getSettings().apiKey;
  }

  // ===== 首次访问 =====
  function isFirstVisit() {
    return !localStorage.getItem(KEY_FIRST_VISIT);
  }
  function markVisited() {
    localStorage.setItem(KEY_FIRST_VISIT, '1');
  }

  // ===== 自定义模型管理 =====
  function getCustomModels() {
    return safeGet(KEY_CUSTOM_MODELS, []);
  }

  function saveCustomModels(list) {
    safeSet(KEY_CUSTOM_MODELS, list || []);
  }

  function addCustomModel(model) {
    // model: { value, label, provider, baseUrl, note }
    if (!model || !model.value) return false;
    const list = getCustomModels();
    // 去重（按 value）
    if (list.some(m => m.value === model.value) || BUILTIN_MODELS.some(m => m.value === model.value)) {
      return false;
    }
    list.push({
      value: model.value.trim(),
      label: (model.label || model.value).trim(),
      provider: (model.provider || '自定义').trim(),
      baseUrl: (model.baseUrl || 'https://api.openai.com/v1').trim().replace(/\/$/, ''),
      note: (model.note || '').trim(),
      custom: true,
    });
    saveCustomModels(list);
    return true;
  }

  function deleteCustomModel(value) {
    const list = getCustomModels().filter(m => m.value !== value);
    saveCustomModels(list);
    return list;
  }

  // 合并内置 + 自定义模型列表
  function getAllModels() {
    return BUILTIN_MODELS.concat(getCustomModels());
  }

  // 根据 model value 查找模型信息（用于自动设置 baseUrl）
  function findModel(value) {
    return getAllModels().find(m => m.value === value) || null;
  }

  return {
    saveHistory, getHistory, clearHistory, deleteHistory,
    getSettings, saveSettings, hasApiKey,
    isFirstVisit, markVisited,
    getCustomModels, addCustomModel, deleteCustomModel, getAllModels, findModel,
    BUILTIN_MODELS,
    MAX_HISTORY,
  };
})();
