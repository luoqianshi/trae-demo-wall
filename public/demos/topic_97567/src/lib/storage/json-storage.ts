// JsonStorage: the core persistence primitive.
//
// Combines:
// - File lock (concurrent-write protection)
// - WAL (crash-recovery durability)
// - Atomic write (tmp + rename)
// - Automatic backup (.bak file)
// - Transaction with snapshot-and-rollback
//
// Usage:
//   const storage = createJsonStorage<MyData>('/path/to/db.json', opts);
//   storage.write({ foo: 1 });
//   const data = storage.read();
//   storage.withTransaction((tx) => { tx.data.foo = 2; });

import * as fs from 'fs';
import * as path from 'path';
import { acquireLock } from './lock';
import { writeWAL, replayWAL, clearWAL, walExists } from './wal';
import type { JsonStorage, StorageOptions, TransactionContext } from './types';

// Re-export types for consumers that import from this module
export type { StorageOptions, JsonStorage, TransactionContext };

/**
 * Create a JsonStorage instance bound to a specific data file.
 *
 * @param dataFile Absolute path to the main JSON data file
 * @param opts    Storage options (lockTimeout, retryInterval, staleTtl)
 */
export function createJsonStorage<T = unknown>(
  dataFile: string,
  opts: StorageOptions,
): JsonStorage<T> {
  const lockFile = `${dataFile}.lock`;
  const walFile = `${dataFile}.wal`;
  const bakFile = `${dataFile}.bak`;
  let cache: T | null = null;
  // Reference-counted lock: a transaction holding the lock may call
  // read()/write() internally without releasing the lock early.
  // Each ensureLock() increments the count; releaseLock() decrements it;
  // the actual lock release happens only when the count reaches zero.
  let lockCount = 0;
  let lockHeld: ReturnType<typeof acquireLock> | null = null;
  // Transaction nesting depth: nested withTransaction calls execute on
  // the outer transaction's working copy and do not auto-commit.
  let transactionDepth = 0;

  // Crash recovery: replay WAL if present at startup
  if (walExists(walFile)) {
    replayWAL(walFile, dataFile);
  }

  function ensureLock(): ReturnType<typeof acquireLock> {
    if (lockCount > 0) {
      lockCount++;
      return lockHeld!;
    }
    lockHeld = acquireLock(lockFile, {
      timeout: opts.lockTimeout,
      retryInterval: opts.retryInterval,
      staleTtl: opts.staleTtl,
    });
    lockCount = 1;
    return lockHeld;
  }

  function releaseLock(): void {
    if (lockCount > 0) {
      lockCount--;
      if (lockCount === 0 && lockHeld) {
        lockHeld.release();
        lockHeld = null;
      }
    }
  }

  function readInternal(): T {
    if (cache) return cache;
    if (!fs.existsSync(dataFile)) {
      return {} as T;
    }
    const raw = fs.readFileSync(dataFile, 'utf-8');
    try {
      cache = JSON.parse(raw) as T;
      return cache;
    } catch (e) {
      console.error(`[JsonStorage] JSON.parse failed for ${dataFile}:`, e);
      // Attempt recovery from backup
      if (fs.existsSync(bakFile)) {
        try {
          const bakRaw = fs.readFileSync(bakFile, 'utf-8');
          cache = JSON.parse(bakRaw) as T;
          console.warn(`[JsonStorage] Recovered from .bak file`);
          return cache;
        } catch { /* backup also corrupt, fall through */ }
      }
      // Preserve the corrupt file for post-mortem, then surface error
      try { fs.copyFileSync(dataFile, `${dataFile}.corrupt-${Date.now()}`); } catch { /* ignore */ }
      throw new Error(`Database file ${dataFile} is corrupted and no valid backup exists`);
    }
  }

  function writeInternal(data: T): void {
    const dir = path.dirname(dataFile);
    try { fs.mkdirSync(dir, { recursive: true }); } catch { /* dir exists */ }

    // 1. Backup current file (for disaster recovery)
    if (fs.existsSync(dataFile)) {
      try { fs.copyFileSync(dataFile, bakFile); } catch { /* ignore backup failure */ }
    }

    // 1.5 写入保护：如果新数据的关键数组长度小于当前文件，打印警告
    // 这有助于发现 dev mode 下空 cache 覆盖有数据文件的问题
    // 覆盖 LocalData 中所有用户数据数组，防止意外清空任何业务数据
    if (fs.existsSync(dataFile)) {
      try {
        const currentRaw = fs.readFileSync(dataFile, 'utf-8');
        const current = JSON.parse(currentRaw) as Record<string, unknown>;
        const incoming = data as Record<string, unknown>;
        // 所有业务数据数组（与 getDefaultData() 中的字段保持一致）
        const protectedKeys = [
          'users',           // 用户账户
          'goals',           // 目标
          'tasks',           // 任务
          'records',         // 雪球日记记录
          'thresholds',      // 阈值配置
          'growthData',      // 成长数据
          'userAchievements',// 用户成就
          'procrastinationSessions', // 拖延会话
          'conversations',   // 雪球问答对话
          'challenges',      // 挑战定义
          'userChallenges',  // 用户挑战参与
          'encouragementPosts', // 鼓励帖
          'encouragementLikes', // 鼓励点赞
          'reminders',       // 提醒
          'userSettings',    // 用户设置
          'userInteractions',// 用户交互
          'scoreEvents',     // 积分事件
        ];
        for (const key of protectedKeys) {
          const currentLen = Array.isArray(current[key]) ? (current[key] as unknown[]).length : 0;
          const incomingLen = Array.isArray(incoming[key]) ? (incoming[key] as unknown[]).length : 0;
          if (currentLen > 0 && incomingLen === 0) {
            console.warn(
              `[JsonStorage] Warning: write would reduce "${key}" from ${currentLen} to ${incomingLen}. ` +
              `This may indicate a stale cache overwriting valid data. File: ${dataFile}`
            );
          }
        }
      } catch { /* ignore read errors, proceed with write */ }
    }

    // 2. Write WAL (durability: crash after this point can be replayed)
    writeWAL(walFile, { op: 'replace', data });

    // 3. Atomic write to main file (tmp + rename)
    const tmp = `${dataFile}.tmp.${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    try {
      fs.renameSync(tmp, dataFile);
    } catch {
      // rename may fail on Windows if target is locked; fall back to direct write
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
      try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    }

    // 4. Clear WAL (main file is now authoritative)
    clearWAL(walFile);
    cache = data;
  }

  return {
    read<U = T>(): U {
      ensureLock();
      try {
        return readInternal() as unknown as U;
      } finally {
        releaseLock();
      }
    },

    write<U = T>(data: U): void {
      ensureLock();
      try {
        writeInternal(data as unknown as T);
      } finally {
        releaseLock();
      }
    },

    withTransaction<U>(fn: (ctx: TransactionContext<T>) => U): U {
      // Nested transaction: execute on the outer transaction's working copy.
      // No new snapshot, no auto-commit — the outer transaction owns commit/rollback.
      // This prevents nested transactions from prematurely committing or releasing locks.
      if (transactionDepth > 0) {
        const nestedCtx: TransactionContext<T> = {
          get data() { return cache as T; },
          set data(v: T) { cache = v; },
          commit() { /* no-op: outer transaction commits */ },
          rollback() { throw new Error('Cannot rollback nested transaction independently'); },
        };
        transactionDepth++;
        try {
          return fn(nestedCtx);
        } finally {
          transactionDepth--;
        }
      }

      // Outer transaction
      ensureLock();
      const original = readInternal();
      // Deep-copy snapshot for rollback
      const snapshot = JSON.parse(JSON.stringify(original)) as T;
      let committed = false;

      // Set cache to a working copy that fn can mutate safely
      cache = JSON.parse(JSON.stringify(original)) as T;
      transactionDepth = 1;

      try {
        const ctx: TransactionContext<T> = {
          get data() { return cache as T; },
          set data(v: T) { cache = v; },
          commit() {
            writeInternal(cache as T);
            committed = true;
          },
          rollback() {
            cache = snapshot;
          },
        };

        const result = fn(ctx);
        // Auto-commit if fn did not explicitly commit/rollback and did not throw
        if (!committed) {
          writeInternal(cache as T);
        }
        return result;
      } catch (e) {
        // Rollback on error
        cache = snapshot;
        throw e;
      } finally {
        transactionDepth = 0;
        releaseLock();
      }
    },

    _resetCache() {
      cache = null;
      lockCount = 0;
      transactionDepth = 0;
      if (lockHeld) {
        lockHeld.release();
        lockHeld = null;
      }
    },
  };
}
