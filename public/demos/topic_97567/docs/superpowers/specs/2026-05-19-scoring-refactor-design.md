# 加分系统重构设计文档

## 目标

消除当前三源并行的计分混乱（records 重算 + tasks 重算 + score_events 事件），改为纯事件驱动架构。总分 = 所有 score_events 累加，前端与后端保持一致。

## 架构决策

**纯事件驱动（方案 A）**：每个加分操作在后端写入一条 `score_event`，总分 = `score_events` 全加总。

**取消重算**：
- `calculateTotalStats` 不再计算 `records.length × 10` 和 `calculateTaskScore`
- records 和 tasks 数组只用于展示数据（recordCount、taskCompletedCount、todayStreak 等）
- `calculateStreakScore` 和 `calculateChallengeScore` 函数不再被调用，保留为死代码或移除

**任务不再删除**：完成任务后标记 `status: 'archived'` 而非删除，保证数据完整。事件在 PATCH 到 `completed` 时即写入，无需在 DELETE 中补记。

---

## 分数事件表

| action | 分值 | 写入时机 | 写入位置 |
|--------|------|---------|---------|
| `RECORD_CREATED` | 5 | 用户创建记录 | POST `/api/records` |
| `TASK_NORMAL_COMPLETED` | 5 | 完成普通任务 | PATCH `/api/tasks/[id]` → status: completed |
| `TASK_QUICK_COMPLETED` | 2 | 完成快速任务 | 同上 |
| `BIG_TASK_COMPLETED` | 10 | 完成长任务 | 同上 |
| `SUBTASK_COMPLETED` | 5 | 完成子任务 | 同上 |
| `HABIT_CHECKIN` | 5 | 习惯打卡 | 同上 |
| `CHALLENGE_MILESTONE` | 5 | 挑战里程碑达成（非最后一天） | PATCH `/api/challenges` → progress |
| `CHALLENGE_COMPLETED_SILVER` | 10 | 白银挑战完成 | 同上（最后一天里程碑/完成时，不写 `CHALLENGE_MILESTONE`） |
| `CHALLENGE_COMPLETED_GOLD` | 30 | 黄金挑战完成 | 同上 |
| `STREAK_7` | 5 | 连续记录第 7 天 | POST `/api/records` |
| `STREAK_14` | 12 | 连续记录第 14 天 | 同上 |
| `STREAK_30` | 30 | 连续记录第 30 / 60 / 90 ... 天 | 同上（每 30 天触发一次） |

---

## 模块改造

### 1. score-engine.ts

保持现有三个函数，调整 `addScoreEvent` 支持动态分值（某些场景需要传入自定义分值）：

```typescript
// 当前：signature 为 (userId, action, refId?)
// action 只能从 SCORE_VALUES 查表
// 改为：支持动态分值
addScoreEvent(userId, action, score, refId?)
```

`calculateEventScore(userId)` 保持不变——返回所有事件的 `score` 总和，作为总分的唯一来源。

### 2. snowball-score-calculator.ts

`calculateTotalStats` 改为只返回展示数据，不再计算总分：

```typescript
export function calculateTotalStats(records, tasks) {
  const todayData = calculateTodayScore(records, tasks);
  const todayStreak = calculateStreakDays(records);
  // 不再计算 totalScore、recordScore、taskScore

  return {
    todayScore: todayData.todayScore,         // 今日分数（纯展示）
    todayStreak,                                // 连续天数（纯展示）
    recordCount: records.length,               // 记录数（纯展示）
    taskCompletedCount: calculateCompletedCount(tasks), // 已完成任务数（纯展示）
  };
}
```

总分由 `calculateEventScore(userId)` 在 stats route 中提供。

### 3. POST /api/records （创建记录）

```typescript
// 1. 创建记录（现有逻辑不变）
const record = db.createRecord({ ... });

// 2. 写入 RECORD_CREATED 事件
addScoreEvent(userId, 'RECORD_CREATED', 5, record.id);

// 3. 检测连续天数里程碑
const streakDays = calculateStreakDays(db.getRecords(userId));
const existingEvents = db.getScoreEvents(userId);
const existingStreaks = existingEvents
  .filter(e => e.action.startsWith('STREAK_'))
  .map(e => parseInt(e.action.split('_')[1]));

const milestones = [7, 14, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];
for (const m of milestones) {
  if (streakDays === m && !existingStreaks.includes(m)) {
    const action = `STREAK_${m}` as const;
    addScoreEvent(userId, action, SCORE_VALUES[action], null);
    break;
  }
}
```

### 4. PATCH /api/tasks/[id]（完成任务）

```typescript
//