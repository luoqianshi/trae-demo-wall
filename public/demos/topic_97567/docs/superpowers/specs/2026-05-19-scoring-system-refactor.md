# 加分系统重构设计

## 背景

当前加分系统存在三个问题：
1. **三源并存冲突**：总分同时来自 `records` 重算、`tasks` 重算、`score_events` 累加，导致前端乐观值、动画、服务端重算三者不一致
2. **双倍加分**：任务删除时补记 `score_event`，但任务已完成时已被 `taskScore` 计算，导致短暂双倍
3. **记录统一加 10 分**：所有记录无论类型都加 10 分，不够差异化

## 目标架构：纯事件驱动

**核心公式：**

```
totalScore = score_events 全部累加
```

不再从 `records`、`tasks` 等原始数据重算分数。`records` 和 `tasks` 仅用于展示统计信息。

---

## 分数事件表

| action | 分值 | 写入时机 | 写入位置 |
|--------|------|---------|---------|
| `RECORD_CREATED` | 5 | 用户创建记录（含小成功/雪球问你/挑战记录） | POST /api/records |
| `TASK_NORMAL_COMPLETED` | 5 | 完成普通任务 | PATCH /api/tasks/[id] |
| `TASK_QUICK_COMPLETED` | 2 | 完成快速任务 | 同上 |
| `BIG_TASK_COMPLETED` | 10 | 完成长任务 | 同上 |
| `SUBTASK_COMPLETED` | 5 | 完成子任务 | 同上 |
| `HABIT_CHECKIN` | 5 | 习惯打卡 | 同上 |

**只有这 6 种加分事件，没有其他加分机制。**

### 关键规则

- **挑战不加额外分**：挑战当天的记录就是 `RECORD_CREATED` (+5)，与普通记录完全一致
- **回答追问不加分**：AI 追问本身是引导记录的工具，追问环节不加分
- **无连续天数加分**：无 STREAK_DAY、无连续天数里程碑
- **任务不再删除**：完成任务后标记 `status: 'completed'`，不再 DELETE，避免分数丢失

---

## 模块改造方案

### 1. POST /api/records（创建记录）

```
1. createRecord(...)
2. addScoreEvent('RECORD_CREATED', 5)
```

所有记录一律 +5，不分类型。

### 2. PATCH /api/tasks/[id]（完成任务）

```
1. patchTask(id, { status: 'completed', completed_at: now })
2. 根据 task.task_type 写入对应分数事件：
   - 默认（无 type / normal） → TASK_NORMAL_COMPLETED (+5)
   - task_type === 'quick'    → TASK_QUICK_COMPLETED (+2)
   - task_type === 'big'      → BIG_TASK_COMPLETED (+10)
   - 有 parent_id（子任务）   → SUBTASK_COMPLETED (+5)
   - task_type === 'habit'    → HABIT_CHECKIN (+5)
```

**任务不再删除支持：** 已完成的任务标记 `status: 'completed'`，前端任务列表过滤掉已完成的。保留数据用于历史统计。

### 3. PATCH /api/challenges（挑战进度）

挑战系统不再贡献额外分数。挑战当天的记录由 POST /api/records 处理（+5 分）。

挑战进度更新逻辑不变（里程碑检测、完成状态等），但不再写任何 score_event。

`challenges/route.ts` 中移除 `addChallengeScoreEvent` 调用。

### 4. GET /api/snowball/stats（雪球统计）

```typescript
const totalScore = calculateEventScore(userId);     // 纯事件累加
const todayScore = calculateTodayEventScore(userId); // 今日事件累加
const todayStreak = calculateStreakDays(records);    // 连续天数（仅展示）
const recordCount = records.length;                 // 仅展示
const taskCompletedCount = tasks.filter(t => t.status === 'completed').length; // 仅展示
```

不再计算 `records.length * 10` 和 `taskScore`。

### 5. 前端 SnowballContext

保持现有 `addScore` 乐观更新模式：
- 乐观更新：`setStats(prev.totalScore + score)` → 用户立刻看到加分动画
- 保留 800ms 防抖 `refreshStats()` 作为最终同步

### 6. local-db.ts schema

`score_events` 保持现有结构不变。

---

## 删除/废弃代码

| 文件/函数 | 处理 |
|-----------|------|
| `snowball-score-calculator.ts` 中 `calculateTotalStats` 的 `recordScore` 计算 | 移除 |
| `snowball-score-calculator.ts` 中 `calculateTotalStats` 的 `taskScore` 计算 | 移除 |
| `snowball-score-calculator.ts` 中 `calculateStreakScore` | 删除（死代码） |
| `snowball-score-calculator.ts` 中 `calculateChallengeScore` | 删除（死代码） |
| `score-engine.ts` 中 `addChallengeScoreEvent` | 删除（不再需要） |
| `SCORE_VALUES` 中的 `STREAK_DAY [+3]` | 移除 |
| `SCORE_VALUES` 中的 `RECORD_CREATED [10]` | 值改为 5 |

## 新增代码

| 文件/函数 | 说明 |
|-----------|------|
| `score-engine.ts` 中 `calculateTodayEventScore` | 按 `created_at` 过滤当天事件并累加 |

---

## 变更文件清单

| 文件 | 操作 |
|------|------|
| `src/lib/snowball-score.ts` | 修改：`RECORD_CREATED` 改为 5，移除 `STREAK_DAY` |
| `src/lib/snowball-score-calculator.ts` | 修改：`calculateTotalStats` 移除分数计算，仅保留展示统计 |
| `src/lib/local-db.ts` | 不变 |
| `src/lib/score-engine.ts` | 修改：移除 `addChallengeScoreEvent`，新增 `calculateTodayEventScore` |
| `src/app/api/snowball/stats/route.ts` | 修改：总分=纯事件，展示数据从 raw data 算 |
| `src/app/api/records/route.ts` | 修改：创建记录后写入 `RECORD_CREATED` 事件 |
| `src/app/api/tasks/[id]/route.ts` | 修改：PATCH 时直接写事件，DELETE 逻辑调整 |
| `src/app/api/challenges/route.ts` | 修改：移除所有 `addChallengeScoreEvent` 调用 |
| `src/contexts/SnowballContext.tsx` | 不变 |
| `src/app/tasks/page.tsx` | 修改：过滤已完成任务，移除 DELETE 调用 |
| `src/app/page.tsx` | 不变（addScore 分值在 SCORE_VALUES 统一） |
| `src/lib/__tests__/*.test.ts` | 修改：适配新分值 |
