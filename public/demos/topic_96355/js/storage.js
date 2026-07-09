/* ============================================================
   storage.js — LocalStorage 数据持久化模块
   ============================================================ */
const Storage = (() => {
  const SESSIONS_KEY = "shenghuojia_sessions";
  const SETTINGS_KEY = "shenghuojia_settings";
  const SEED_KEY = "shenghuojia_seeded";

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn("Storage read failed:", key, e);
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Storage write failed:", key, e);
    }
  }

  return {
    getAllSessions() {
      const list = read(SESSIONS_KEY, []);
      return list.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    },
    saveSession(session) {
      const list = read(SESSIONS_KEY, []);
      list.push(session);
      write(SESSIONS_KEY, list);
    },
    deleteSession(id) {
      const list = read(SESSIONS_KEY, []).filter(s => s.id !== id);
      write(SESSIONS_KEY, list);
    },
    getSession(id) {
      return read(SESSIONS_KEY, []).find(s => s.id === id) || null;
    },
    clearAll() {
      write(SESSIONS_KEY, []);
    },
    getSettings() {
      return read(SETTINGS_KEY, { threshold: 50, demoMode: true, theme: "dark" });
    },
    saveSettings(settings) {
      write(SETTINGS_KEY, { ...this.getSettings(), ...settings });
    },
    isSeeded() {
      return read(SEED_KEY, false);
    },
    markSeeded() {
      write(SEED_KEY, true);
    },
    bulkSaveSessions(sessions) {
      const existing = read(SESSIONS_KEY, []);
      write(SESSIONS_KEY, [...existing, ...sessions]);
    }
  };
})();
