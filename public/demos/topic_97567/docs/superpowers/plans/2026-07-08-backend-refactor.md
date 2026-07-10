# 雪球日记后端系统全面重构实施计划

> **For agentic workers:** 本计划遵循 loop 命令的"分析-执行-审查-迭代"闭环。每个阶段完成后启动 subagent 审查，根据审查结果决定是否进入下一轮迭代。

**Goal:** 通过分层架构重构后端系统，从根本上解决数据丢失、并发竞态、类型不安全等历史问题，保持 API 契约和业务逻辑不变。

**Architecture:** 三层架构（API Routes → Repositories → Storage Adapter）。引入文件锁、事务、WAL 保障数据可靠性；按实体拆分 God Object；强化类型安全；保持 API 路由请求/响应格式完全兼容（前端无感）。

**Tech Stack:** Next.js 16.2.4 API Routes + TypeScript + Vitest 4.1.5 + 本地 JSON 文件持久化

---

## 一、第一性原理根因分析

### 1.1 为什么会有反复的 bug 和数据丢失？

| 根因 | 表现 | 历史bug |
|------|------|---------|
| **持久化层无事务** | 多步操作中间失败留下不一致状态 | R2-F1 挑战完成+发积分非原子 |
| **cachedData 全局可变单例** | 多请求竞态、测试隔离差 | D-5 缓存失效未重置；vitest fileParallelism: false |
| **无文件锁** | 多进程并发写入互相覆盖 | D-4 非原子写入（已用 tmp+rename 缓解，非根本解决）|
| **类型安全缺失** | 12 个 any[] 字段，strict: false | D-5 procrastination steps 字段名不一致 |
| **local-db.ts God Object** | 600+ 行，所有实体 CRUD 混在一起 | H-10/H-11/H-12 多处 bug 集中爆发 |
| **API 路由直接耦合 db** | 无法替换持久化实现 | 测试必须 mock fs |
| **无 WAL/备份机制** | 文件损坏无法恢复 | R2-C1 JSON.parse 失败只能抛错 |

### 1.2 核心约束（来自用户需求）

1. **严禁动前端**：API 路由的请求/响应格式必须保持完全兼容
2. **保留业务逻辑**：所有业务规则迁移不变（任务分类、挑战完成条件、积分计算等）
3. **性能不低于重构前**：不能引入显著额外开销
4. **解决数据丢失**：这是第一优先级

### 1.3 重构原则（遵循 karpathy-guidelines）

- **Simplicity First**：最小代码解决问题，不引入未被请求的抽象
- **Surgical Changes**：保持函数签名兼容，API 路由只改 import 路径
- **YAGNI**：不为未来 SQLite 切换预留接口（除非用户要求）
- **Goal-Driven**：每个阶段有明确的可验证成功标准

---

## 二、架构设计

### 2.1 目标架构

```
┌─────────────────────────────────────────────────────┐
│  API Routes (保持接口契约不变)                        │
│  src/app/api/**  (30+ 路由文件)                      │
│  只改: import * as db from '@/lib/local-db'          │
│        → 改为从具体 repository 导入（或保持兼容）     │
├─────────────────────────────────────────────────────┤
│  Repository Layer (数据访问，按实体拆分)              │
│  src/lib/repositories/                               │
│  - task-repository.ts                                │
│  - record-repository.ts                              │
│  - challenge-repository.ts                           │
│  - ... (12 个实体)                                   │
│  每个 repository 接收 storage 实例，职责单一          │
├─────────────────────────────────────────────────────┤
│  Storage Adapter (持久化核心)                        │
│  src/lib/storage/                                    │
│  - json-storage.ts: 文件锁+事务+WAL+原子写+自动备份   │
│  - types.ts: Storage 接口定义                        │
│  - lock.ts: 文件锁实现                               │
└─────────────────────────────────────────────────────┘

向后兼容: src/lib/local-db.ts 改为 re-export 所有 repository 函数
         → 现有 import * as db from '@/lib/local-db' 无需改动
```

### 2.2 数据可靠性保障机制

```
写入流程（事务）:
1. acquireLock()          // 获取文件锁（lockfile + retry）
2. beginTransaction()    // 快照当前 cachedData
3. applyChanges()        // 修改内存数据
4. writeWAL()            // 写入 WAL 日志文件
5. commitToMainFile()    // 原子写入主文件（tmp + rename）
6. clearWAL()            // 清理 WAL
7. releaseLock()         // 释放锁

崩溃恢复流程（启动时）:
1. 检查是否存在 .wal 文件
2. 若存在，重放 WAL 到主文件
3. 校验主文件完整性
4. 若损坏，从 .bak 恢复
```

---

## 三、任务分解

### 阶段 1：存储原语层（核心，解决数据丢失）

**Files:**
- Create: `src/lib/storage/types.ts`
- Create: `src/lib/storage/lock.ts`
- Create: `src/lib/storage/json-storage.ts`
- Create: `src/lib/storage/wal.ts`
- Create: `src/lib/storage/__tests__/json-storage.test.ts`
- Create: `src/lib/storage/__tests__/lock.test.ts`

#### Task 1.1: 定义 Storage 类型与接口

- [ ] **Step 1: 创建 types.ts**

```typescript
// src/lib/storage/types.ts
export interface StorageTransaction {
  commit(): void;
  rollback(): void;
}

export interface JsonStorage {
  read<T>(): T;
  write<T>(data: T): void;
  beginTransaction<T>(): StorageTransaction & { snapshot: T };
  withTransaction<T>(fn: () => T): T;
}
```

- [ ] **Step 2: 验证类型导出**

Run: `npx tsc --noEmit src/lib/storage/types.ts`
Expected: 无错误

#### Task 1.2: 实现文件锁（lockfile + retry）

- [ ] **Step 1: 编写失败测试**

```typescript
// src/lib/storage/__tests__/lock.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { acquireLock, releaseLock } from '../lock';

describe('FileLock', () => {
  const lockFile = path.join(process.cwd(), 'data', '.test.lock');

  beforeEach(() => { try { fs.unlinkSync(lockFile); } catch {} });
  afterEach(() => { try { fs.unlinkSync(lockFile); } catch {} });

  it('should acquire lock successfully', () => {
    const handle = acquireLock(lockFile, { timeout: 1000, retryInterval: 50 });
    expect(handle).toBeDefined();
    expect(fs.existsSync(lockFile)).toBe(true);
    handle.release();
    expect(fs.existsSync(lockFile)).toBe(false);
  });

  it('should throw when lock cannot be acquired within timeout', () => {
    const h1 = acquireLock(lockFile, { timeout: 1000, retryInterval: 50 });
    expect(() => acquireLock(lockFile, { timeout: 200, retryInterval: 50 }))
      .toThrow(/Failed to acquire lock/);
    h1.release();
  });

  it('should auto-release stale lock after TTL', () => {
    // 写入一个带旧时间戳的锁文件
    fs.writeFileSync(lockFile, JSON.stringify({ pid: 99999, acquiredAt: Date.now() - 60000 }));
    const handle = acquireLock(lockFile, { timeout: 1000, retryInterval: 50, staleTtl: 5000 });
    expect(handle).toBeDefined();
    handle.release();
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npx vitest run src/lib/storage/__tests__/lock.test.ts`
Expected: FAIL（lock.ts 不存在）

- [ ] **Step 3: 实现 lock.ts**

```typescript
// src/lib/storage/lock.ts
import * as fs from 'fs';
import * as path from 'path';

export interface LockOptions {
  timeout: number;        // 总超时 ms
  retryInterval: number;  // 重试间隔 ms
  staleTtl?: number;      // 锁过期时间 ms（默认 30000）
}

export interface LockHandle {
  release(): void;
}

export function acquireLock(lockFile: string, opts: LockOptions): LockHandle {
  const staleTtl = opts.staleTtl ?? 30000;
  const deadline = Date.now() + opts.timeout;

  while (true) {
    if (tryAcquire(lockFile, staleTtl)) {
      return {
        release: () => {
          try { fs.unlinkSync(lockFile); } catch { /* ignore */ }
        },
      };
    }
    if (Date.now() >= deadline) {
      throw new Error(`Failed to acquire lock on ${lockFile} within ${opts.timeout}ms`);
    }
    sleep(opts.retryInterval);
  }
}

function tryAcquire(lockFile: string, staleTtl: number): boolean {
  const dir = path.dirname(lockFile);
  try { fs.mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }

  if (fs.existsSync(lockFile)) {
    try {
      const raw = fs.readFileSync(lockFile, 'utf-8');
      const meta = JSON.parse(raw);
      if (Date.now() - meta.acquiredAt < staleTtl) return false; // 锁仍有效
      // 锁过期，抢占
    } catch {
      // 锁文件损坏，抢占
    }
  }

  try {
    const tmp = `${lockFile}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ pid: process.pid, acquiredAt: Date.now() }));
    fs.renameSync(tmp, lockFile);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number): void {
  const start = Date.now();
  while (Date.now() - start < ms) { /* busy wait */ }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npx vitest run src/lib/storage/__tests__/lock.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/storage/lock.ts src/lib/storage/__tests__/lock.test.ts
git commit -m "feat(storage): add file lock with TTL and retry"
```

#### Task 1.3: 实现 WAL（Write-Ahead Log）

- [ ] **Step 1: 编写失败测试**

```typescript
// src/lib/storage/__tests__/wal.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { writeWAL, replayWAL, clearWAL, walExists } from '../wal';

describe('WAL', () => {
  const walFile = path.join(process.cwd(), 'data', '.test.wal');
  const mainFile = path.join(process.cwd(), 'data', '.test-main.json');

  beforeEach(() => {
    try { fs.unlinkSync(walFile); } catch {}
    try { fs.unlinkSync(mainFile); } catch {}
  });
  afterEach(() => {
    try { fs.unlinkSync(walFile); } catch {}
    try { fs.unlinkSync(mainFile); } catch {}
  });

  it('should write WAL entry and detect its existence', () => {
    writeWAL(walFile, { op: 'set', data: { foo: 1 } });
    expect(walExists(walFile)).toBe(true);
  });

  it('should replay WAL to main file', () => {
    fs.writeFileSync(mainFile, JSON.stringify({ foo: 0 }));
    writeWAL(walFile, { op: 'replace', data: { foo: 999 } });
    replayWAL(walFile, mainFile);
    const result = JSON.parse(fs.readFileSync(mainFile, 'utf-8'));
    expect(result.foo).toBe(999);
    expect(walExists(walFile)).toBe(false); // replay 后清理
  });

  it('should clear WAL without replay', () => {
    writeWAL(walFile, { op: 'replace', data: {} });
    clearWAL(walFile);
    expect(walExists(walFile)).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npx vitest run src/lib/storage/__tests__/wal.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现 wal.ts**

```typescript
// src/lib/storage/wal.ts
import * as fs from 'fs';
import * as path from 'path';

export type WALEntry = {
  op: 'replace';
  data: unknown;
  timestamp: string;
};

export function writeWAL(walFile: string, entry: Omit<WALEntry, 'timestamp'>): void {
  const dir = path.dirname(walFile);
  try { fs.mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
  const fullEntry: WALEntry = { ...entry, timestamp: new Date().toISOString() };
  // 原子写入 WAL
  const tmp = `${walFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(fullEntry), 'utf-8');
  fs.renameSync(tmp, walFile);
}

export function walExists(walFile: string): boolean {
  return fs.existsSync(walFile);
}

export function replayWAL(walFile: string, mainFile: string): void {
  if (!fs.existsSync(walFile)) return;
  try {
    const entry: WALEntry = JSON.parse(fs.readFileSync(walFile, 'utf-8'));
    if (entry.op === 'replace') {
      const dir = path.dirname(mainFile);
      try { fs.mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
      const tmp = `${mainFile}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(entry.data, null, 2), 'utf-8');
      fs.renameSync(tmp, mainFile);
    }
    clearWAL(walFile);
  } catch (e) {
    console.error('[WAL] replay failed:', e);
    // 备份损坏的 WAL 供分析
    try { fs.copyFileSync(walFile, `${walFile}.corrupt-${Date.now()}`); } catch { /* ignore */ }
    clearWAL(walFile);
  }
}

export function clearWAL(walFile: string): void {
  try { fs.unlinkSync(walFile); } catch { /* ignore */ }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npx vitest run src/lib/storage/__tests__/wal.test.ts`
Expected: PASS

#### Task 1.4: 实现 JsonStorage（文件锁+事务+WAL+原子写+自动备份）

- [ ] **Step 1: 编写失败测试（含并发场景）**

```typescript
// src/lib/storage/__tests__/json-storage.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createJsonStorage } from '../json-storage';

describe('JsonStorage', () => {
  const dataFile = path.join(process.cwd(), 'data', '.test-storage.json');
  let storage: ReturnType<typeof createJsonStorage>;

  beforeEach(() => {
    try { fs.unlinkSync(dataFile); } catch {}
    try { fs.unlinkSync(`${dataFile}.wal`); } catch {}
    try { fs.unlinkSync(`${dataFile}.bak`); } catch {}
    storage = createJsonStorage(dataFile, { lockTimeout: 2000, retryInterval: 20 });
  });
  afterEach(() => {
    try { fs.unlinkSync(dataFile); } catch {}
    try { fs.unlinkSync(`${dataFile}.wal`); } catch {}
    try { fs.unlinkSync(`${dataFile}.bak`); } catch {}
  });

  it('should initialize with default data when file missing', () => {
    const data = storage.read<{ items: number[] }>();
    expect(data).toEqual({ items: [] });
  });

  it('should persist writes atomically', () => {
    storage.write({ items: [1, 2, 3] });
    const raw = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    expect(raw.items).toEqual([1, 2, 3]);
  });

  it('should rollback transaction on error', () => {
    storage.write<{ items: number[] }>({ items: [1] });
    expect(() => {
      storage.withTransaction((tx) => {
        tx.data.items.push(2);
        throw new Error('simulated failure');
      });
    }).toThrow();
    const data = storage.read<{ items: number[] }>();
    expect(data.items).toEqual([1]); // 回滚
  });

  it('should commit transaction on success', () => {
    storage.write<{ items: number[] }>({ items: [1] });
    storage.withTransaction((tx) => {
      tx.data.items.push(2);
      return tx.data;
    });
    const data = storage.read<{ items: number[] }>();
    expect(data.items).toEqual([1, 2]);
  });

  it('should recover from WAL on restart', () => {
    storage.write<{ items: number[] }>({ items: [1] });
    // 模拟崩溃：手动写 WAL 但不更新主文件
    const walFile = `${dataFile}.wal`;
    fs.writeFileSync(walFile, JSON.stringify({
      op: 'replace',
      data: { items: [1, 2, 3] },
      timestamp: new Date().toISOString(),
    }));
    // 重新创建 storage 实例（模拟重启）
    storage = createJsonStorage(dataFile, { lockTimeout: 2000, retryInterval: 20 });
    const data = storage.read<{ items: number[] }>();
    expect(data.items).toEqual([1, 2, 3]);
  });

  it('should backup before write', () => {
    storage.write({ items: [1] });
    storage.write({ items: [1, 2] });
    expect(fs.existsSync(`${dataFile}.bak`)).toBe(true);
    const bak = JSON.parse(fs.readFileSync(`${dataFile}.bak`, 'utf-8'));
    expect(bak.items).toEqual([1]); // 上一次的内容
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npx vitest run src/lib/storage/__tests__/json-storage.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现 json-storage.ts**

```typescript
// src/lib/storage/json-storage.ts
import * as fs from 'fs';
import * as path from 'path';
import { acquireLock, type LockHandle } from './lock';
import { writeWAL, replayWAL, clearWAL, walExists } from './wal';

export interface StorageOptions {
  lockTimeout: number;
  retryInterval: number;
  staleTtl?: number;
}

export interface TransactionContext<T> {
  data: T;
  commit(): void;
  rollback(): void;
}

export function createJsonStorage<T = unknown>(dataFile: string, opts: StorageOptions) {
  const lockFile = `${dataFile}.lock`;
  const walFile = `${dataFile}.wal`;
  const bakFile = `${dataFile}.bak`;
  let cache: T | null = null;
  let lockHeld: LockHandle | null = null; // 进程内重入保护

  // 启动时恢复 WAL
  if (walExists(walFile)) {
    replayWAL(walFile, dataFile);
  }

  function ensureLock(): LockHandle {
    if (lockHeld) return lockHeld;
    lockHeld = acquireLock(lockFile, {
      timeout: opts.lockTimeout,
      retryInterval: opts.retryInterval,
      staleTtl: opts.staleTtl,
    });
    return lockHeld;
  }

  function releaseLock(): void {
    if (lockHeld) {
      lockHeld.release();
      lockHeld = null;
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
      console.error(`[JsonStorage] JSON.parse failed for ${dataFile}`);
      // 尝试从备份恢复
      if (fs.existsSync(bakFile)) {
        try {
          const bakRaw = fs.readFileSync(bakFile, 'utf-8');
          cache = JSON.parse(bakRaw) as T;
          console.warn(`[JsonStorage] Recovered from .bak file`);
          return cache;
        } catch { /* ignore */ }
      }
      // 备份损坏文件
      try { fs.copyFileSync(dataFile, `${dataFile}.corrupt-${Date.now()}`); } catch { /* ignore */ }
      throw new Error(`Database file ${dataFile} is corrupted and no valid backup exists`);
    }
  }

  function writeInternal(data: T): void {
    const dir = path.dirname(dataFile);
    try { fs.mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }

    // 备份当前文件
    if (fs.existsSync(dataFile)) {
      try { fs.copyFileSync(dataFile, bakFile); } catch { /* ignore */ }
    }

    // 写 WAL
    writeWAL(walFile, { op: 'replace', data });

    // 原子写入主文件
    const tmp = `${dataFile}.tmp.${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    try {
      fs.renameSync(tmp, dataFile);
    } catch {
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
      try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    }

    // 清理 WAL
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
      ensureLock();
      const original = readInternal();
      // 深拷贝快照
      const snapshot = JSON.parse(JSON.stringify(original)) as T;
      let committed = false;
      let result: U;
      try {
        const ctx: TransactionContext<T> = {
          get data() { return cache!; },
          set data(v: T) { cache = v; },
          commit() {
            writeInternal(cache as T);
            committed = true;
          },
          rollback() {
            cache = snapshot;
          },
        };
        // 让 fn 直接操作 cache
        cache = JSON.parse(JSON.stringify(original)) as T;
        result = fn(ctx);
        if (!committed) {
          writeInternal(cache as T);
        }
        return result;
      } catch (e) {
        cache = snapshot;
        throw e;
      } finally {
        releaseLock();
      }
    },
    // 用于测试
    _resetCache() {
      cache = null;
      releaseLock();
    },
  };
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npx vitest run src/lib/storage/__tests__/json-storage.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/storage/
git commit -m "feat(storage): add JsonStorage with lock, WAL, transaction, backup"
```

---

### 阶段 2：类型安全强化

**Files:**
- Create: `src/lib/types/entities.ts`
- Modify: `src/lib/local-db.ts` (LocalData 接口)

#### Task 2.1: 定义所有实体强类型

- [ ] **Step 1: 创建 entities.ts**

```typescript
// src/lib/types/entities.ts
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export type TaskType = 'normal' | 'quick' | 'big' | 'habit';
export type TaskStatus = 'pending' | 'completed';

export interface Task {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  description: string | null;
  task_type: TaskType;
  status: TaskStatus;
  importance: number | null;
  urgency: number | null;
  quadrant: number | null;
  due_date: string | null;
  parent_id: string | null;
  progress: number;
  frequency: string | null;
  target_count: number | null;
  current_streak: number;
  best_streak: number;
  reminder_time: string | null;
  completed_at: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export type RecordType = 'success' | 'reflection' | 'gratitude' | 'challenge';

export interface Record {
  id: string;
  user_id: string;
  record_type: RecordType;
  title?: string;
  content: string;
  tags: string[];
  mood?: string;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  challenge_type: 'bronze' | 'silver' | 'gold';
  difficulty: 1 | 2 | 3;
  title: string;
  description: string;
  duration_days: number;
  category: string;
  completion_criteria: {
    record_required?: boolean;
    required_tags?: string[];
    required_questions?: string[];
    action_required?: boolean;
    action_description?: string;
    milestones?: Array<{ day: number; reward: { score: number; title: string } }>;
  };
  reward: { score: number; badge_fragments?: number; badge_id?: string; special_reward?: string };
  is_active: boolean;
  is_recurring: boolean;
  display_order: number;
  created_at: string;
}

export type UserChallengeStatus = 'active' | 'completed' | 'failed' | 'abandoned';

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  status: UserChallengeStatus;
  progress: number;
  current_day: number;
  streak_days: number;
  make_up_count: number;
  max_make_ups: number;
  started_at: string;
  completed_at: string | null;
  last_progress_at: string | null;
  daily_records: Array<{ date: string; completed: boolean; record_id?: string; completed_at?: string }>;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface ProcrastinationSession {
  id: string;
  user_id: string;
  goal: string;
  current_state: string;
  steps: Array<{ task: string; completed: boolean }>;
  current_step_index: number;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  record_id: string;
  role: 'assistant' | 'user';
  content: string;
  created_at: string;
}

export interface EncouragementPost {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  remind_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Threshold {
  user_id: string;
  type: string;
  big_task_id: string | null;
  critical: number;
  high: number;
  medium: number;
  low: number;
  none: number;
}

export interface GrowthData {
  id: string;
  user_id: string;
  date: string;
  achievements_count: number;
  tasks_completed: number;
  records_count: number;
  created_at: string;
}

export interface ScoreEvent {
  id: string;
  user_id: string;
  action: string;
  score: number;
  ref_id?: string;
  created_at: string;
}

export interface UserInteraction {
  user_id: string;
  type: 'snowball_interaction' | 'snowball_click';
  count: number;
  updated_at: string;
}

export interface LocalData {
  users: User[];
  goals: Goal[];
  tasks: Task[];
  records: Record[];
  thresholds: Threshold[];
  growthData: GrowthData[];
  userAchievements: UserAchievement[];
  procrastinationSessions: ProcrastinationSession[];
  conversations: Conversation[];
  challenges: Challenge[];
  userChallenges: UserChallenge[];
  encouragementPosts: EncouragementPost[];
  encouragementLikes: EncouragementLike[];
  reminders: Reminder[];
  userSettings: UserSettings[];
  userInteractions: UserInteraction[];
  scoreEvents: ScoreEvent[];
}

// 暂保留为部分扩展类型（历史数据可能字段不全）
export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface EncouragementLike {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  settings: Record<string, unknown>;
}
```

- [ ] **Step 2: 验证类型**

Run: `npx tsc --noEmit`
Expected: 无新增错误

- [ ] **Step 3: 提交**

```bash
git add src/lib/types/entities.ts
git commit -m "feat(types): add strong types for all entities"
```

---

### 阶段 3：按实体拆分 local-db.ts（Repository 模式）

**Files:**
- Create: `src/lib/repositories/index.ts` (re-export 所有 repository)
- Create: `src/lib/repositories/task-repository.ts`
- Create: `src/lib/repositories/record-repository.ts`
- Create: `src/lib/repositories/challenge-repository.ts`
- Create: `src/lib/repositories/user-repository.ts`
- Create: `src/lib/repositories/achievement-repository.ts`
- Create: `src/lib/repositories/procrastination-repository.ts`
- Create: `src/lib/repositories/reminder-repository.ts`
- Create: `src/lib/repositories/encouragement-repository.ts`
- Create: `src/lib/repositories/score-repository.ts`
- Create: `src/lib/repositories/conversation-repository.ts`
- Create: `src/lib/repositories/growth-repository.ts`
- Create: `src/lib/repositories/threshold-repository.ts`
- Modify: `src/lib/local-db.ts` (改为 re-export，保持向后兼容)

#### Task 3.1: 创建 repository 基础设施

- [ ] **Step 1: 创建 repository-base.ts**

```typescript
// src/lib/repositories/base.ts
import { createJsonStorage, type StorageOptions } from '../storage/json-storage';
import type { LocalData } from '../types/entities';

const DATA_FILE = process.env.LOCAL_DB_FILE || `${process.cwd()}/data/local-db.json`;

const defaultOpts: StorageOptions = {
  lockTimeout: 5000,
  retryInterval: 50,
  staleTtl: 30000,
};

export const storage = createJsonStorage<LocalData>(DATA_FILE, defaultOpts);

export function getDefaultData(): LocalData {
  const now = new Date().toISOString();
  const today = now.split('T')[0];
  return {
    users: [{
      id: '1', email: 'user@snowball.diary', name: '雪球用户',
      avatar_url: '', created_at: now, updated_at: now,
    }],
    goals: [], tasks: [], records: [],
    thresholds: [{
      user_id: '1', type: 'normal', big_task_id: null,
      critical: 1, high: 3, medium: 7, low: 14, none: 30,
    }],
    growthData: [{
      id: '1', user_id: '1', date: today,
      achievements_count: 0, tasks_completed: 0, records_count: 0, created_at: now,
    }],
    userAchievements: [], procrastinationSessions: [], conversations: [],
    challenges: [], userChallenges: [], encouragementPosts: [],
    encouragementLikes: [], reminders: [], userSettings: [],
    userInteractions: [], scoreEvents: [],
  };
}

export function readData(): LocalData {
  const data = storage.read<LocalData>();
  // 确保所有字段存在（向后兼容）
  const defaults = getDefaultData();
  return { ...defaults, ...data };
}

export function writeData(data: LocalData): void {
  storage.write(data);
}

export function withTransaction<T>(fn: (data: LocalData) => T): T {
  return storage.withTransaction((ctx) => {
    const data = { ...getDefaultData(), ...(ctx.data as LocalData) };
    return fn(data);
  });
}

export function resetData(): void {
  storage._resetCache();
  try {
    const fs = require('fs');
    if (fs.existsSync(DATA_FILE)) fs.unlinkSync(DATA_FILE);
  } catch { /* ignore */ }
}
```

#### Task 3.2: 迁移 Task Repository

- [ ] **Step 1: 创建 task-repository.ts（保持所有函数签名与 local-db.ts 一致）**

```typescript
// src/lib/repositories/task-repository.ts
import { readData, writeData, withTransaction } from './base';
import { calculateUrgency, calculateQuadrant, DEFAULT_THRESHOLDS } from '../quadrant-utils';
import type { Task } from '../types/entities';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function getTasks(userId: string, goalId?: string | null, parentId?: string | null): Task[] {
  const data = readData();
  let tasks = data.tasks.filter(t => t.user_id === userId);
  if (goalId !== undefined && goalId !== null) tasks = tasks.filter(t => t.goal_id === goalId);
  if (parentId !== undefined && parentId !== null) tasks = tasks.filter(t => t.parent_id === parentId);
  return tasks;
}

export function createTask(taskData: Partial<Task> & { user_id: string }): Task {
  return withTransaction((data) => {
    const task_type = taskData.task_type || 'normal';
    const importance = task_type === 'quick' || task_type === 'habit'
      ? null : (taskData.importance || 3);
    const urgency = taskData.due_date
      ? calculateUrgency(taskData.due_date, DEFAULT_THRESHOLDS) : null;
    const quadrant = importance && urgency
      ? calculateQuadrant(importance, urgency) : null;

    const newTask: Task = {
      id: generateId(),
      user_id: taskData.user_id,
      goal_id: taskData.goal_id ?? null,
      title: taskData.title || '',
      description: taskData.description || null,
      task_type,
      status: taskData.status || 'pending',
      importance,
      urgency,
      quadrant,
      due_date: taskData.due_date || null,
      parent_id: taskData.parent_id || null,
      progress: 0,
      frequency: taskData.frequency || null,
      target_count: taskData.target_count || null,
      current_streak: 0,
      best_streak: 0,
      reminder_time: taskData.reminder_time || null,
      completed_at: null,
      order_index: taskData.order_index || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    data.tasks.push(newTask);
    return newTask;
  });
}

// ... updateTask, deleteTask, recalcParentProgress 保持原逻辑，使用 withTransaction
```

- [ ] **Step 2: 保持原 local-db.ts 的测试通过**

Run: `npx vitest run src/lib/__tests__/local-db.test.ts`
Expected: PASS（通过 re-export 兼容）

#### Task 3.3: 迁移其余 11 个 repository

按相同模式迁移：
- record-repository.ts
- challenge-repository.ts
- user-repository.ts
- achievement-repository.ts
- procrastination-repository.ts
- reminder-repository.ts
- encouragement-repository.ts
- score-repository.ts
- conversation-repository.ts
- growth-repository.ts
- threshold-repository.ts

每个 repository：
1. 保持原函数签名
2. 使用 `withTransaction` 包装写操作
3. 使用强类型

#### Task 3.4: local-db.ts 改为 re-export

- [ ] **Step 1: 重写 local-db.ts**

```typescript
// src/lib/local-db.ts (向后兼容层)
// 重构后：所有实现已迁移到 src/lib/repositories/
// 本文件仅作为 re-export，保持现有 import * as db from '@/lib/local-db' 兼容

export {
  getTasks, createTask, updateTask, deleteTask,
} from './repositories/task-repository';

export {
  getRecords, getRecord, createRecord, updateRecord, deleteRecord,
} from './repositories/record-repository';

// ... 其余 re-export

export { resetData } from './repositories/base';
```

- [ ] **Step 2: 运行全部测试**

Run: `npm run test`
Expected: 698/698 PASS（无回归）

- [ ] **Step 3: 提交**

```bash
git add src/lib/repositories/ src/lib/local-db.ts
git commit -m "refactor: split local-db.ts into entity repositories with transaction support"
```

---

### 阶段 4：业务逻辑原子性改造

**Files:**
- Modify: `src/app/api/challenges/route.ts`（挑战完成+发积分用事务）
- Modify: `src/app/api/tasks/[id]/route.ts`（任务完成+growthData 用事务）
- Modify: `src/lib/score-engine.ts`（addScoreEvent 支持事务上下文）

#### Task 4.1: 挑战完成+发积分原子化

- [ ] **Step 1: 在 challenge-repository 添加 completeChallenge 事务方法**

```typescript
// src/lib/repositories/challenge-repository.ts
export function completeChallengeWithScore(
  userChallengeId: string,
  userId: string,
  updates: Partial<UserChallenge>,
  scoreAction: string,
  scoreRefId?: string,
): { userChallenge: UserChallenge; scoreAwarded: boolean } {
  return withTransaction((data) => {
    const idx = data.userChallenges.findIndex(uc => uc.id === userChallengeId);
    if (idx === -1) throw new Error('User challenge not found');

    data.userChallenges[idx] = {
      ...data.userChallenges[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // 在同一事务内写入积分事件
    let scoreAwarded = false;
    try {
      data.scoreEvents.push({
        id: generateId(),
        user_id: userId,
        action: scoreAction,
        score: SCORE_VALUES[scoreAction as keyof typeof SCORE_VALUES] || 0,
        ref_id: scoreRefId,
        created_at: new Date().toISOString(),
      });
      scoreAwarded = true;
    } catch (e) {
      console.error('[challenges] addScoreEvent failed:', e);
    }

    return { userChallenge: data.userChallenges[idx], scoreAwarded };
  });
}
```

- [ ] **Step 2: 修改 challenges/route.ts 使用新方法**

替换 PUT 中的 progress 完成分支，调用 `completeChallengeWithScore`。

- [ ] **Step 3: 编写测试验证原子性**

```typescript
// src/lib/repositories/__tests__/challenge-repository.test.ts
it('should rollback score if challenge update fails', () => {
  // 模拟 updateChallenge 抛错，验证 scoreEvents 未增长
});
```

- [ ] **Step 4: 运行测试**

Run: `npx vitest run src/lib/repositories/__tests__/challenge-repository.test.ts`
Expected: PASS

---

### 阶段 5：测试计划

#### Task 5.1: 单元测试补全

- [ ] 为每个 repository 编写单元测试（CRUD + 边界）
- [ ] 目标：repository 层测试覆盖率 ≥ 80%

#### Task 5.2: 集成测试（API 路由）

- [ ] 保持现有 698 测试通过
- [ ] 新增并发写入测试

```typescript
// src/lib/storage/__tests__/concurrency.test.ts
import { describe, it, expect } from 'vitest';
import { createJsonStorage } from '../json-storage';
import * as path from 'path';
import * as fs from 'fs';

describe('Concurrency', () => {
  it('should handle 100 concurrent writes without data loss', async () => {
    const file = path.join(process.cwd(), 'data', '.concurrent-test.json');
    try { fs.unlinkSync(file); } catch {}
    const storage = createJsonStorage(file, { lockTimeout: 10000, retryInterval: 10 });

    const promises = Array.from({ length: 100 }, (_, i) =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          storage.withTransaction((tx) => {
            const data = tx.data as { counter: number };
            data.counter = (data.counter || 0) + 1;
          });
          resolve();
        }, Math.random() * 50);
      })
    );

    await Promise.all(promises);
    const result = storage.read<{ counter: number }>();
    expect(result.counter).toBe(100);
    try { fs.unlinkSync(file); } catch {}
  }, 30000);
});
```

#### Task 5.3: 边界测试

- [ ] 空数据初始化
- [ ] 超大 JSON（1MB+）读写
- [ ] 损坏文件恢复（从 .bak）
- [ ] WAL 重放
- [ ] 锁过期抢占

#### Task 5.4: 压力测试

- [ ] 使用 autocannon 或自写脚本对 API 路由压测
- [ ] 对比重构前后响应时间 P95

#### Task 5.5: 回归测试

- [ ] `npm run test` 必须全部通过（698 测试无回归）
- [ ] `npm run build` 成功
- [ ] TypeScript 编译无错误

---

## 四、验收标准

| # | 标准 | 验证方式 |
|---|------|---------|
| 1 | 698 现有测试全部通过 | `npm run test` |
| 2 | 新增并发测试通过（100 并发写入无丢失） | `npx vitest run src/lib/storage/__tests__/concurrency.test.ts` |
| 3 | 新增事务测试通过（多步操作中间失败可回滚） | `npx vitest run src/lib/repositories/__tests__/` |
| 4 | `npm run build` 成功 | `npm run build` |
| 5 | TypeScript 编译无错误 | `npx tsc --noEmit` |
| 6 | API 响应格式与重构前完全一致 | 对比重构前后 API 响应 |
| 7 | 性能不低于重构前（P95 响应时间不增加） | 压力测试对比 |
| 8 | 数据丢失问题根治 | 模拟崩溃、并发、损坏场景验证 |

---

## 五、Loop 迭代策略

### 第一轮（本计划）
- 完成阶段 1-5
- 启动 subagent 审查
- 评估审查结果

### 第二轮（视审查结果）
- 修复审查发现的问题
- 补充测试覆盖
- 性能优化

### 终止条件
- 无明显功能性 bug
- 所有测试通过
- 数据丢失问题根治
- 性能不低于重构前
- 代码结构清晰

---

## 六、风险与缓解

| 风险 | 缓解 |
|------|------|
| 文件锁开销影响性能 | 锁超时设置为 5s，retry 间隔 50ms，单次操作 < 100ms |
| 事务回滚导致状态丢失 | 深拷贝快照，确保回滚完整 |
| WAL 文件占用磁盘 | 每次成功写入后清理 WAL |
| 向后兼容破坏 | local-db.ts 作为 re-export 层，API 路由无需改动 |
| 测试 mock 失效 | 新增测试使用真实 storage（临时文件），不 mock fs |
