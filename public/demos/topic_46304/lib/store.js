/* ============================================================
 * 内存存储层 - IGA Pages serverless 部署专用
 *
 * 替代 better-sqlite3，使用 globalThis 在 serverless 实例间保持数据。
 * 注意：数据不持久化，实例回收后丢失。
 * ============================================================ */

const globalStore = globalThis.__IGA_STORE__ || (globalThis.__IGA_STORE__ = {
  novels: [],
  settings: new Map(),
  ai_models: [],
});

module.exports = {
  // ===== novels =====
  getAllNovels() {
    return [...globalStore.novels].sort((a, b) =>
      new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
    );
  },
  getNovel(id) {
    return globalStore.novels.find(n => n.id === id) || null;
  },
  insertNovel(novel) {
    globalStore.novels.push(novel);
    return novel;
  },
  updateNovel(id, updates) {
    const idx = globalStore.novels.findIndex(n => n.id === id);
    if (idx >= 0) {
      Object.assign(globalStore.novels[idx], updates);
      return true;
    }
    return false;
  },
  deleteNovel(id) {
    const idx = globalStore.novels.findIndex(n => n.id === id);
    if (idx >= 0) {
      globalStore.novels.splice(idx, 1);
      return true;
    }
    return false;
  },

  // ===== settings (key-value) =====
  getSetting(key) {
    return globalStore.settings.get(key) || null;
  },
  setSetting(key, value) {
    globalStore.settings.set(key, value);
  },
  getAllSettings() {
    const result = {};
    for (const [key, value] of globalStore.settings) {
      result[key] = value;
    }
    return result;
  },
  deleteSetting(key) {
    return globalStore.settings.delete(key);
  },

  // ===== ai_models =====
  getAllModels() {
    return [...globalStore.ai_models];
  },
  insertModel(model) {
    globalStore.ai_models.push(model);
    return model;
  },
  deleteModel(id) {
    const idx = globalStore.ai_models.findIndex(m => m.id === id);
    if (idx >= 0) {
      globalStore.ai_models.splice(idx, 1);
      return true;
    }
    return false;
  },
};
