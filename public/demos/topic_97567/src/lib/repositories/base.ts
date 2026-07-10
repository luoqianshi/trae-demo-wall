// Repository layer base: shared storage instance and helpers.
//
// All entity repositories import from this module to access the shared
// JsonStorage instance. This keeps the storage configuration in one place
// and allows tests to reset state via resetData().

import * as fs from 'fs';
import { createJsonStorage, type StorageOptions } from '../storage/json-storage';
import type { LocalData } from '../types/entities';

const DATA_FILE = process.env.LOCAL_DB_FILE || `${process.cwd()}/data/local-db.json`;

const defaultOpts: StorageOptions = {
  lockTimeout: 5000,
  retryInterval: 50,
  staleTtl: 30000,
};

/**
 * 使用 globalThis 确保 storage 在 dev mode 热重载下保持单例。
 *
 * Next.js Turbopack 在 dev mode 下可能会重新加载模块，导致多次创建
 * storage 实例。每个实例有独立的 cache，会造成数据不一致甚至数据丢失
 * （某个实例的空 cache 覆盖了文件中的有数据）。
 *
 * 通过 globalThis 共享同一个实例，所有 API 路由都使用同一个 cache。
 */
const STORAGE_GLOBAL_KEY = '__snowballStorage__';

// 二级保障：模块级缓存。即使 globalThis 不可用（罕见环境），
// 同一模块实例内也能复用 storage，避免每次访问创建新实例。
let moduleLevelStorage: ReturnType<typeof createJsonStorage<LocalData>> | null = null;

function getStorage(): ReturnType<typeof createJsonStorage<LocalData>> {
  // 优先使用 globalThis 单例（主要路径）
  if (typeof globalThis !== 'undefined') {
    try {
      const g = globalThis as Record<string, unknown>;
      if (!g[STORAGE_GLOBAL_KEY]) {
        g[STORAGE_GLOBAL_KEY] = createJsonStorage<LocalData>(DATA_FILE, defaultOpts);
        // 首次创建时检测数据文件是否存在，不存在则写入默认数据
        ensureInitialData(g[STORAGE_GLOBAL_KEY] as ReturnType<typeof createJsonStorage<LocalData>>);
      }
      return g[STORAGE_GLOBAL_KEY] as ReturnType<typeof createJsonStorage<LocalData>>;
    } catch {
      // globalThis 可能被冻结或写入失败，降级到模块级缓存
      // 这种情况极罕见，但需要防御性处理避免模块加载失败
    }
  }
  // Fallback for environments without globalThis (should be rare)
  // 使用模块级缓存避免重复创建实例
  if (!moduleLevelStorage) {
    moduleLevelStorage = createJsonStorage<LocalData>(DATA_FILE, defaultOpts);
    ensureInitialData(moduleLevelStorage);
  }
  return moduleLevelStorage;
}

/**
 * 首次启动检测：如果数据文件不存在，写入默认数据以确保系统可启动。
 * 这避免了首次运行时 readData() 返回空对象导致的功能异常。
 *
 * 注意：在测试环境下跳过自动初始化，避免与测试隔离机制耦合
 * （测试通常通过 resetData() 期望文件不存在，自动初始化会破坏这个假设）。
 * 测试环境下由 readData() 的 default 合并逻辑提供默认数据。
 */
function ensureInitialData(storageInstance: ReturnType<typeof createJsonStorage<LocalData>>): void {
  // 测试环境跳过：避免与 resetData() 期望的"文件不存在"初始状态冲突
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  try {
    if (!fs.existsSync(DATA_FILE)) {
      storageInstance.write(getDefaultData());
      console.info(`[base] Initialized data file at ${DATA_FILE} with default data.`);
    }
  } catch (e) {
    console.warn(`[base] Failed to initialize data file:`, e);
  }
}

export const storage = getStorage();

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function getDefaultData(): LocalData {
  const now = new Date().toISOString();
  const today = now.split('T')[0];
  return {
    users: [{
      id: '1',
      email: 'user@snowball.diary',
      name: '雪球用户',
      avatar_url: '',
      created_at: now,
      updated_at: now,
    }],
    goals: [],
    tasks: [],
    records: [],
    thresholds: [{
      user_id: '1',
      type: 'normal',
      big_task_id: null,
      critical: 1,
      high: 3,
      medium: 7,
      low: 14,
      none: 30,
    }],
    growthData: [{
      id: '1',
      user_id: '1',
      date: today,
      achievements_count: 0,
      tasks_completed: 0,
      records_count: 0,
      created_at: now,
    }],
    userAchievements: [],
    procrastinationSessions: [],
    conversations: [],
    challenges: [],
    userChallenges: [],
    encouragementPosts: [],
    encouragementLikes: [],
    reminders: [],
    userSettings: [],
    userInteractions: [],
    scoreEvents: [],
  };
}

/**
 * Read the full data object, merging with defaults so that
 * missing fields (from older data files) are filled in.
 */
export function readData(): LocalData {
  const raw = storage.read<LocalData>();
  const defaults = getDefaultData();
  // Shallow-merge top-level keys: arrays from raw take precedence,
  // missing arrays fall back to defaults.
  const result = { ...defaults } as LocalData;
  (Object.keys(defaults) as Array<keyof LocalData>).forEach((key) => {
    if (raw && Array.isArray(raw[key])) {
      (result[key] as unknown[]) = raw[key] as unknown[];
    }
  });
  return result;
}

/**
 * Read data without merging defaults (for cases where the caller
 * wants to detect missing fields explicitly).
 */
export function readRawData(): LocalData | null {
  const raw = storage.read<LocalData>();
  if (!raw || typeof raw !== 'object') return null;
  return raw;
}

export function writeData(data: LocalData): void {
  storage.write(data);
}

/**
 * Execute fn within a transaction. fn receives a working copy of the
 * data that it can mutate freely. On success the changes are committed
 * atomically; on throw they are rolled back.
 *
 * IMPORTANT: fn must NOT call readData/writeData recursively (that would
 * read stale cache). It should only mutate the `data` argument.
 */
export function withTransaction<T>(fn: (data: LocalData) => T): T {
  return storage.withTransaction((ctx) => {
    // Merge defaults into the cached data so repositories see all fields
    const defaults = getDefaultData();
    const merged = { ...defaults } as LocalData;
    const raw = ctx.data as LocalData | null;
    if (raw && typeof raw === 'object') {
      (Object.keys(defaults) as Array<keyof LocalData>).forEach((key) => {
        if (Array.isArray(raw[key])) {
          (merged[key] as unknown[]) = raw[key] as unknown[];
        }
      });
    }
    // Replace cache with merged data so fn sees complete structure
    ctx.data = merged;
    return fn(merged);
  });
}

/**
 * Reset cache and delete the data file (used by tests).
 *
 * 安全保护：在 production 环境下调用会直接抛错，防止误删生产数据。
 * 如果确实需要重置（例如数据迁移），请在 staging/dev 环境下执行，
 * 或通过显式设置 NODE_ENV 进行。
 */
export function resetData(): void {
  // 生产环境保护：禁止在 production 下调用 resetData
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[resetData] Refusing to reset data in production environment. ' +
      'This operation would delete user data. Run in development/staging instead.'
    );
  }
  storage._resetCache();
  try {
    if (fs.existsSync(DATA_FILE)) {
      fs.unlinkSync(DATA_FILE);
    }
    // Also clean up auxiliary files
    [`${DATA_FILE}.lock`, `${DATA_FILE}.wal`, `${DATA_FILE}.bak`].forEach((f) => {
      try { fs.unlinkSync(f); } catch { /* not present */ }
    });
    // 清理 globalThis 上的 storage 单例，使下次访问重新创建
    // 这确保测试之间的隔离
    if (typeof globalThis !== 'undefined') {
      const g = globalThis as Record<string, unknown>;
      delete g[STORAGE_GLOBAL_KEY];
    }
    moduleLevelStorage = null;
  } catch { /* ignore */ }
}
