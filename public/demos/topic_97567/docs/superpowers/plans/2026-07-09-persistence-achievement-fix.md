# 持久化与成就系统修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 Next.js dev mode 下 storage 多实例导致的数据丢失、雪球问答记录消失、成就无法触发三大问题

**Architecture:** 通过 globalThis 单例模式确保 JsonStorage 在 dev mode 热重载下保持唯一实例；增加写入保护防止空数据覆盖；从 .bak 文件恢复丢失的数据

**Tech Stack:** Next.js 16.2.4 (Turbopack), TypeScript, Vitest 4.1.5

---

## 根因分析

### 核心 Bug：storage 模块多次实例化

**文件**: `src/lib/repositories/base.ts:18`
```typescript
export const storage = createJsonStorage<LocalData>(DATA_FILE, defaultOpts);
```

**问题路径**:
1. Next.js dev mode (Turbopack) 热重载时，`base.ts` 模块可能被重新加载
2. 每次重新加载都会创建新的 `storage` 实例，新实例的 `cache = null`
3. 新实例首次 `readInternal()` 从文件读取（此时可能读到空数据或旧数据）
4. 如果新实例执行 `withTransaction`，`readInternal()` 返回旧 cache（没有 records/scoreEvents）
5. `withTransaction` 中合并逻辑：`merged.records = defaults.records = []`（因为 raw 中没有 records 数组）
6. `writeInternal(merged)` 把空 records 写入文件，**覆盖了之前的有数据文件**
7. `writeInternal` 中的 backup 逻辑在覆盖前保存了 .bak 文件（这就是为什么 .bak 有数据）

**证据**:
- `data/local-db.json`: records 和 scoreEvents 为空数组
- `data/local-db.json.bak`: 有完整的 6 条 records 和 6 条 scoreEvents

### 三个用户问题的对应关系

1. **"持久化未实现"**: 实际持久化已实现，但 dev mode 下 storage 多实例导致数据被空 cache 覆盖
2. **"雪球问答记录刷新后丢失"**: records 被清空后，`/api/records/follow-up` 中 `db.getRecord(recordId)` 返回 null，返回 404，对话无法持久化
3. **"成就无法触发，加分失灵"**: records 和 scoreEvents 被清空后，`getUserStats` 返回全 0，`calculateEventScore` 返回 0，`evaluateCondition` 全 false

---

## File Structure

- **Modify**: `src/lib/repositories/base.ts` - 添加 globalThis 单例
- **Modify**: `src/lib/storage/json-storage.ts` - 添加写入保护（防空覆盖）
- **Create**: `src/lib/storage/__tests__/dev-mode-singleton.test.ts` - 单例测试
- **Modify**: `data/local-db.json` - 从 .bak 恢复数据

---

## Task 1: 添加 globalThis 单例保护

**Files:**
- Modify: `src/lib/repositories/base.ts:7-18`

- [ ] **Step 1: 编写 globalThis 单例测试**

创建 `src/lib/storage/__tests__/dev-mode-singleton.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('Storage singleton in dev mode', () => {
  it('should return the same storage instance across multiple imports', async () => {
    // 模拟 dev mode 下模块多次加载
    // 通过 globalThis 确保单例
    const globalKey = '__snowballStorage__';

    // 清理可能存在的全局变量
    if (typeof globalThis !== 'undefined' && (globalThis as any)[globalKey]) {
      delete (globalThis as any)[globalKey];
    }

    // 第一次导入
    const { storage: storage1 } = await import('../base');

    // 第二次导入（模拟热重载）
    const { storage: storage2 } = await import('../base');

    // 在 globalThis 单例保护下，应该是同一个实例
    expect(storage1).toBe(storage2);
  });
});
```

- [ ] **Step 2: 运行测试验证它失败**

Run: `cd d:\code\snowball-diary\snowball-diary-new && npx vitest run src/lib/storage/__tests__/dev-mode-singleton.test.ts`
Expected: FAIL - storage1 和 storage2 不是同一个实例

- [ ] **Step 3: 实现 globalThis 单例**

修改 `src/lib/repositories/base.ts`，将第 7-18 行替换为:

```typescript
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

function getStorage(): ReturnType<typeof createJsonStorage<LocalData>> {
  if (typeof globalThis !== 'undefined') {
    const g = globalThis as Record<string, unknown>;
    if (!g[STORAGE_GLOBAL_KEY]) {
      g[STORAGE_GLOBAL_KEY] = createJsonStorage<LocalData>(DATA_FILE, defaultOpts);
    }
    return g[STORAGE_GLOBAL_KEY] as ReturnType<typeof createJsonStorage<LocalData>>;
  }
  // Fallback for environments without globalThis (should be rare)
  return createJsonStorage<LocalData>(DATA_FILE, defaultOpts);
}

export const storage = getStorage();
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd d:\code\snowball-diary\snowball-diary-new && npx vitest run src/lib/storage/__tests__/dev-mode-singleton.test.ts`
Expected: PASS

- [ ] **Step 5: 运行全部现有测试确保无回归**

Run: `cd d:\code\snowball-diary\snowball-diary-new && npx vitest run`
Expected: 所有现有测试通过（742 测试）

- [ ] **Step 6: Commit**

```bash
cd d:\code\snowball-diary\snowball-diary-new
git add src/lib/repositories/base.ts src/lib/storage/__tests__/dev-mode-singleton.test.ts
git commit -m "fix: use globalThis singleton for storage to prevent dev mode data loss

Next.js Turbopack dev mode hot-reloads modules, creating multiple storage
instances with independent caches. A stale cache could overwrite the data
file with empty arrays, causing records and scoreEvents to be lost.

This fix ensures all API routes share a single storage instance via
globalThis, eliminating cache inconsistency."
```

---

## Task 2: 添加写入保护防止空数据覆盖

**Files:**
- Modify: `src/lib/storage/json-storage.ts:104-130` (writeInternal 函数)

- [ ] **Step 1: 编写写入保护测试**

在 `src/lib/storage/__tests__/json-storage.test.ts` 末尾添加测试:

```typescript
it('should warn when write would reduce records count significantly', () => {
  // 这个测试验证保护逻辑：当新数据的关键数组长度小于当前文件时，打印警告
  storage.write({ records: [{ id: 1 }, { id: 2 }, { id: 3 }], scoreEvents: [{ id: 1 }] });

  const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  // 尝试用空 records 覆盖
  storage.write({ records: [], scoreEvents: [{ id: 1 }] });

  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining('[JsonStorage] Warning: write would reduce')
  );

  // 数据仍然被写入（保护是警告而非阻止，因为合法的清空操作可能存在）
  const data = storage.read();
  expect(data.records).toEqual([]);

  consoleSpy.mockRestore();
});
```

- [ ] **Step 2: 运行测试验证它失败**

Run: `cd d:\code\snowball-diary\snowball-diary-new && npx vitest run src/lib/storage/__tests__/json-storage.test.ts -t "should warn when write would reduce"`
Expected: FAIL - 没有调用 console.warn

- [ ] **Step 3: 实现写入保护**

修改 `src/lib/storage/json-storage.ts` 的 `writeInternal` 函数（第 104-130 行），在 backup 之后、writeWAL 之前添加保护检查:

```typescript
  function writeInternal(data: T): void {
    const dir = path.dirname(dataFile);
    try { fs.mkdirSync(dir, { recursive: true }); } catch { /* dir exists */ }

    // 1. Backup current file (for disaster recovery)
    if (fs.existsSync(dataFile)) {
      try { fs.copyFileSync(dataFile, bakFile); } catch { /* ignore backup failure */ }
    }

    // 1.5 写入保护：如果新数据的关键数组长度小于当前文件，打印警告
    // 这有助于发现 dev mode 下空 cache 覆盖有数据文件的问题
    if (fs.existsSync(dataFile)) {
      try {
        const currentRaw = fs.readFileSync(dataFile, 'utf-8');
        const current = JSON.parse(currentRaw) as Record<string, unknown>;
        const incoming = data as Record<string, unknown>;
        const protectedKeys = ['records', 'scoreEvents', 'conversations', 'tasks', 'userAchievements'];
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

    // ... rest of writeInternal unchanged
```

注意：需要在文件顶部添加 `import { vi } from 'vitest'` 仅用于测试，实际实现中不需要。确保 `console.warn` 使用现有的 console。

- [ ] **Step 4: 运行测试验证通过**

Run: `cd d:\code\snowball-diary\snowball-diary-new && npx vitest run src/lib/storage/__tests__/json-storage.test.ts -t "should warn when write would reduce"`
Expected: PASS

- [ ] **Step 5: 运行全部测试确保无回归**

Run: `cd d:\code\snowball-diary\snowball-diary-new && npx vitest run`
Expected: 所有测试通过

- [ ] **Step 6: Commit**

```bash
cd d:\code\snowball-diary\snowball-diary-new
git add src/lib/storage/json-storage.ts src/lib/storage/__tests__/json-storage.test.ts
git commit -m "fix: add write protection warning for stale cache overwrite

When a stale cache (with empty arrays) attempts to overwrite a file with
existing data, log a warning. This helps detect dev mode cache
inconsistency issues early."
```

---

## Task 3: 从 .bak 文件恢复丢失的数据

**Files:**
- Modify: `data/local-db.json`

- [ ] **Step 1: 验证 .bak 文件数据完整性**

Run: `cd d:\code\snowball-diary\snowball-diary-new && node -e "const d=require('./data/local-db.json.bak'); console.log('records:', d.records.length, 'scoreEvents:', d.scoreEvents.length, 'conversations:', d.conversations.length)"`
Expected: records: 6, scoreEvents: 6, conversations: 0 或更多

- [ ] **Step 2: 从 .bak 恢复数据到 local-db.json**

复制 .bak 文件内容到 local-db.json:

```powershell
cd d:\code\snowball-diary\snowball-diary-new
Copy-Item -Path "data\local-db.json.bak" -Destination "data\local-db.json" -Force
```

- [ ] **Step 3: 验证恢复后的数据**

Run: `cd d:\code\snowball-diary\snowball-diary-new && node -e "const d=require('./data/local-db.json'); console.log('records:', d.records.length, 'scoreEvents:', d.scoreEvents.length)"`
Expected: records: 6, scoreEvents: 6

- [ ] **Step 4: Commit**

```bash
cd d:\code\snowball-diary\snowball-diary-new
git add data/local-db.json
git commit -m "fix: restore lost records and scoreEvents from .bak backup

Data was lost due to stale cache overwrite in dev mode. Restored from
.bak file which contains 6 records and 6 scoreEvents."
```

---

## Task 4: 端到端验证三个问题已修复

**Files:**
- 无文件修改，仅验证

- [ ] **Step 1: 重启 dev server（清除所有缓存）**

```powershell
cd d:\code\snowball-diary\snowball-diary-new
# 停止现有 dev server (如果运行中)
# 查找并停止 node 进程占用 3000 端口
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
# 启动 dev server
npm run dev
```

等待 "Ready" 消息出现。

- [ ] **Step 2: 验证 stats API 返回正确数据**

```powershell
$token = 'local-token-1'; $headers = @{'Authorization'="Bearer $token"}
Invoke-WebRequest -Uri 'http://localhost:3000/api/snowball/stats' -Method GET -Headers $headers | Select-Object -ExpandProperty Content
```

Expected: `totalScore: 30` (6 × 5), `recordCount: 6`, `todayStreak: 1`

- [ ] **Step 3: 验证 records API 返回记录**

```powershell
$token = 'local-token-1'; $headers = @{'Authorization'="Bearer $token"}
Invoke-WebRequest -Uri 'http://localhost:3000/api/records' -Method GET -Headers $headers | Select-Object -ExpandProperty Content
```

Expected: 返回 6 条 records

- [ ] **Step 4: 验证成就触发**

```powershell
$token = 'local-token-1'; $headers = @{'Authorization'="Bearer $token"; 'Content-Type'='application/json'}
Invoke-WebRequest -Uri 'http://localhost:3000/api/achievements' -Method POST -Headers $headers -Body '{}' | Select-Object -ExpandProperty Content
```

Expected: `newlyUnlocked` 包含 `records_1` 和 `records_3`（因为已有 6 条记录）

- [ ] **Step 5: 验证 follow-up API 正常工作**

```powershell
$token = 'local-token-1'; $headers = @{'Authorization'="Bearer $token"}
# 使用恢复的 record id
Invoke-WebRequest -Uri 'http://localhost:3000/api/records/follow-up?record_id=mrctgg0v0bgn1' -Method GET -Headers $headers | Select-Object -ExpandProperty Content
```

Expected: 返回 200 和 conversations 列表（可能为空，但不应 404）

- [ ] **Step 6: 创建新记录验证持久化**

```powershell
$token = 'local-token-1'; $headers = @{'Authorization'="Bearer $token"; 'Content-Type'='application/json'}
$body = '{"content":"测试持久化修复","mood":"happy","tags":[]}'
Invoke-WebRequest -Uri 'http://localhost:3000/api/records' -Method POST -Headers $headers -Body $body | Select-Object -ExpandProperty Content
```

Expected: 返回新创建的 record，包含 id

- [ ] **Step 7: 验证新记录已持久化**

```powershell
# 检查文件中是否增加了新记录
node -e "const d=require('./data/local-db.json'); console.log('records count:', d.records.length)"
```

Expected: records count: 7 (6 原有 + 1 新建)

- [ ] **Step 8: 验证 stats API 反映新记录**

```powershell
$token = 'local-token-1'; $headers = @{'Authorization'="Bearer $token"}
Invoke-WebRequest -Uri 'http://localhost:3000/api/snowball/stats' -Method GET -Headers $headers | Select-Object -ExpandProperty Content
```

Expected: `recordCount: 7`, `totalScore: 35` (30 + 5)

---

## Self-Review

### Spec coverage
- ✅ 问题1（持久化）：Task 1 (globalThis 单例) + Task 2 (写入保护) + Task 3 (数据恢复)
- ✅ 问题2（雪球问答记录）：Task 3 恢复 records 后 follow-up API 不再 404，Task 4 Step 5 验证
- ✅ 问题3（成就/加分）：Task 3 恢复 scoreEvents 后 stats API 返回正确值，Task 4 Step 2/4 验证

### Placeholder scan
- 无占位符，所有步骤都有完整代码和命令

### Type consistency
- `STORAGE_GLOBAL_KEY` 在 Task 1 中定义并使用
- `protectedKeys` 数组在 Task 2 中定义
- 所有文件路径一致
