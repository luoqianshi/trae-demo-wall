/**
 * 缓存管理 (WI-1.3)
 * 按偏好 hash 缓存方案，支持 bypass 跳过、TTL 过期、命中率统计。
 */
const config = require('../config');

class PlanCache {
  constructor() {
    this.store = new Map();
    this.stats = { hits: 0, misses: 0, sets: 0 };
  }

  static hashKey(prefs) {
    return [prefs.city, prefs.budget, prefs.weather, (prefs.mood || []).join(','), prefs.companion].join('|');
  }

  get(prefs) {
    const key = PlanCache.hashKey(prefs);
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    if (Date.now() - entry.ts > config.cache.ttlMs) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }
    this.stats.hits++;
    return entry.plans;
  }

  set(prefs, plans) {
    const key = PlanCache.hashKey(prefs);
    this.store.set(key, { plans, ts: Date.now() });
    this.stats.sets++;
  }

  clear() {
    const size = this.store.size;
    this.store.clear();
    return size;
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.store.size,
      hit_rate: total > 0 ? Math.round((this.stats.hits / total) * 100) : 0,
      ttl_ms: config.cache.ttlMs
    };
  }
}

module.exports = { PlanCache };
