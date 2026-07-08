// ===== 本地存储模块 (Storage) =====
window.HomeStash = window.HomeStash || {}
HomeStash.storage = (function () {
  const { STORAGE_KEYS, DEFAULT_AI_CONFIG, DEFAULT_APP_CONFIG } = HomeStash.constants

  function load(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : defaultValue
    } catch (e) {
      console.warn('Storage load failed:', key, e)
      return defaultValue
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.warn('Storage save failed:', key, e)
      return false
    }
  }

  function clear(key) {
    try { localStorage.removeItem(key) } catch (e) { /* ignore */ }
  }

  // 物品
  function loadItems() { return load(STORAGE_KEYS.items, []) }
  function saveItems(items) { return save(STORAGE_KEYS.items, items) }
  function clearItems() { clear(STORAGE_KEYS.items) }

  // AI 配置（合并默认值，避免旧配置缺字段）
  function loadAIConfig() {
    const stored = load(STORAGE_KEYS.aiConfig, {})
    return Object.assign({}, DEFAULT_AI_CONFIG, stored)
  }
  function saveAIConfig(config) { return save(STORAGE_KEYS.aiConfig, config) }

  // 应用配置（合并默认值）
  function loadAppConfig() {
    const stored = load(STORAGE_KEYS.appConfig, {})
    const merged = Object.assign({}, DEFAULT_APP_CONFIG, stored)
    merged.reminder = Object.assign({}, DEFAULT_APP_CONFIG.reminder, stored.reminder || {})
    return merged
  }
  function saveAppConfig(config) { return save(STORAGE_KEYS.appConfig, config) }

  // 成员
  function loadMembers() { return load(STORAGE_KEYS.members, []) }
  function saveMembers(members) { return save(STORAGE_KEYS.members, members) }

  // 聊天历史
  function loadChatHistory() { return load(STORAGE_KEYS.chatHistory, []) }
  function saveChatHistory(history) { return save(STORAGE_KEYS.chatHistory, history) }

  // 搜索历史（最多 10 条，去重）
  function loadSearchHistory() { return load(STORAGE_KEYS.searchHistory, []) }
  function saveSearchHistory(history) { return save(STORAGE_KEYS.searchHistory, history) }
  function addSearchHistory(keyword) {
    if (!keyword || !keyword.trim()) return
    const history = loadSearchHistory().filter(k => k !== keyword)
    history.unshift(keyword)
    saveSearchHistory(history.slice(0, 10))
  }

  return {
    load, save, clear,
    loadItems, saveItems, clearItems,
    loadAIConfig, saveAIConfig,
    loadAppConfig, saveAppConfig,
    loadMembers, saveMembers,
    loadChatHistory, saveChatHistory,
    loadSearchHistory, saveSearchHistory, addSearchHistory
  }
})()
