# 加分系统重构 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将加分系统改为纯事件驱动（6 种事件），删除所有额外加分机制，去除 records/tasks 分数重算

**Architecture:** 总分完全来自 `score_events` 累加。records 和 tasks 原始数据不再贡献分数。任务不再删除（标记 completed 即可），PATCH 完成时直接写入分数事件。

**Tech Stack:** Next.js 16 App Router, TypeScript, Vitest, JSON 文件存储

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/snowball-score.ts` | Modify | SCORE_VALUES 更新：RECORD_CREATED=5, HABIT_CHECKIN=5, BIG_TASK_COMPLETED=10, 移除 STREAK_DAY |
| `src/lib/snowball-score-calculator.ts` | Modify | calculateTotalStats 移除分数计算，仅保留展示统计；删除 calculateStreakScore/calculateChallengeScore |
| `src/lib/score-engine.ts` | Modify | 移除 addChallengeScoreEvent，新增 calculateTodayEventScore |
| `src/app/api/snowball/stats/route.ts` | Modify | 总分=纯事件累加，展示数据从 raw data 算 |
| `src/app/api/records/route.ts` | Modify | 创建记录后写入 RECORD_CREATED(+5)，移除 STREAK_DAY 逻辑 |
| `src/app/api/tasks/[id]/route.ts` | Modify | PATCH 完成任务时写入分数事件；DELETE 简化（不再写事件） |
| `src/app/api/challenges/route.ts` | Modify | 移除所有 addChallengeScoreEvent 调用 |
| `src/app/tasks/page.tsx` | Modify | 完成任务改用 PATCH（不 DELETE），更新 SCORE_TEXT_MAP |
| `src/lib/__tests__/snowball-score.test.ts` | Modify | SCORE_VALUES 断言更新 |
| `src/lib/__tests__/score-engine.test.ts` | Modify | 移除 addChallengeScoreEvent 测试，新增 calculateTodayEventScore 测试 |
| `src/lib/__tests__/snowball-score-calculator.test.ts` | Modify | 移除分数计算相关测试 |
| `src/app/api/snowball/stats/__tests__/route.test.ts` | Modify | 更新 mock 适配纯事件 |
| `src/app/api/records/__tests__/route.test.ts` | Modify | 更新 mock，移除 STREAK_DAY 测试 |
| `src/app/api/challenges/__tests__/route.test.ts` | Modify | 移除 score-engine mock |

---

### Task 1: 更新 SCORE_VALUES 常量

**Files:**
- Modify: `src/lib/snowball-score.ts:11-19`
- Modify: `src/lib/__tests__/snowball-score.test.ts`

- [ ] **Step 1: 更新测试**

在 `src/lib/__tests__/snowball-score.test.ts` 中，修改 "should have all required score actions"：
```typescript
expect(SCORE_VALUES).toHaveProperty('RECORD_CREATED');
expect(SCORE_VALUES).toHaveProperty('TASK_NORMAL_COMPLETED');
expect(SCORE_VALUES).toHaveProperty('TASK_QUICK_COMPLETED');
expect(SCORE_VALUES).toHaveProperty('HABIT_CHECKIN');
expect(SCORE_VALUES).toHaveProperty('SUBTASK_COMPLETED');
expect(SCORE_VALUES).toHaveProperty('BIG_TASK_COMPLETED');
```
（移除 STREAK_DAY 断言）

修改 "should have reasonable score values"：
```typescript
expect(SCORE_VALUES.RECORD_CREATED).toBe(5);
expect(SCORE_VALUES.TASK_NORMAL_COMPLETED).toBe(5);
expect(SCORE_VALUES.TASK_QUICK_COMPLETED).toBe(2);
expect(SCORE_VALUES.HABIT_CHECKIN).toBe(5);
expect(SCORE_VALUES.SUBTASK_COMPLETED).toBe(5);
expect(SCORE_VALUES.BIG_TASK_COMPLETED).toBe(10);
```
（RECORD_CREATED 10→5, HABIT_CHECKIN 3→5, BIG_TASK_COMPLETED 8→10, 移除 STREAK_DAY）

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/lib/__tests__/snowball-score.test.ts`
Expected: FAIL — 断言值与实际值不匹配

- [ ] **Step 3: 更新 SCORE_VALUES 常量**

在 `src/lib/snowball-score.ts` 中：

```typescript
export const SCORE_VALUES = {
  RECORD_CREATED: 5,
  TASK_NORMAL_COMPLETED: 5,
  TASK_QUICK_COMPLETED: 2,
  HABIT_CHECKIN: 5,
  SUBTASK_COMPLETED: 5,
  BIG_TASK_COMPLETED: 10,
} as const;
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/lib/__tests__/snowball-score.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/snowball-score.ts src/lib/__tests__/snowball-score.test.ts
git commit -m "refactor: update SCORE_VALUES - RECORD_CREATED=5, HABIT_CHECKIN=5, BIG_TASK=10, remove STREAK_DAY"
```

---

### Task 2: 更新 score-engine.ts——移除 addChallengeScoreEvent，新增 calculateTodayEventScore

**Files:**
- Modify: `src/lib/score-engine.ts`
- Modify: `src/lib/__tests__/score-engine.test.ts`

- [ ] **Step 1: 更新测试**

在 `src/lib/__tests__/score-engine.test.ts` 中：

1. 移除 import 中的 `addChallengeScoreEvent`：
```typescript
import {
  addScoreEvent,
  calculateEventScore,
} from '../score-engine';
```

2. 移除整个 `describe('addChallengeScoreEvent')` 块

3. 更新 `describe('calculateEventScore')` 的测试数据，移除 CHALLENGE 事件：
```typescript
describe('calculateEventScore', () => {
  it('should sum all event scores for a user', () => {
    mockGetScoreEvents.mockReturnValue([
      { id: '1', user_id: 'user-1', action: 'RECORD_CREATED', score: 5, created_at: '2026-05-19T10:00:00.000Z' },
      { id: '2', user_id: 'user-1', action: 'TASK_NORMAL_COMPLETED', score: 5, created_at: '2026-05-19T11:00:00.000Z' },
    ]);
    expect(calculateEventScore('user-1')).toBe(10);
  });

  it('should return 0 for user with no events', () => {
    mockGetScoreEvents.mockReturnValue([]);
    expect(calculateEventScore('user-1')).toBe(0);
  });
});
```

4. 新增 `calculateTodayEventScore` 测试：
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 保留 mockGetScoreEvents 等已有 mock

describe('calculateTodayEventScore', () => {
  it('should sum only today events', () => {
    const today = new Date().toISOString().split('T')[0];
    mockGetScoreEvents.mockReturnValue([
      { id: '1', user_id: 'user-1', action: 'RECORD_CREATED', score: 5, created_at: `${today}T10:00:00.000Z` },
      { id: '2', user_id: 'user-1', action: 'RECORD_CREATED', score: 5, created_at: `${today}T11:00:00.000Z` },
      { id: '3', user_id: 'user-1', action: 'RECORD_CREATED', score: 5, created_at: '2026-05-18T10:00:00.000Z' },
    ]);
    // 需要从更新后的 import 中添加 calculateTodayEventScore
    const result = calculateTodayEventScore('user-1');
    expect(result).toBe(10);
  });

  it('should return 0 if no events today', () => {
    mockGetScoreEvents.mockReturnValue([
      { id: '1', user_id: 'user-1', action: 'RECORD_CREATED', score: 5, created_at: '2026-05-18T10:00:00.000Z' },
    ]);
    const result = calculateTodayEventScore('user-1');
    expect(result).toBe(0);
  });
});
```

5. 在 import 中添加 `calculateTodayEventScore`：
```typescript
import {
  addScoreEvent,
  calculateEventScore,
  calculateTodayEventScore,
} from '../score-engine';
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/lib/__tests__/score-engine.test.ts`
Expected: FAIL — `addChallengeScoreEvent` 仍在源文件中，`calculateTodayEventScore` 未定义

- [ ] **Step 3: 更新 score-engine.ts**

```typescript
import * as db from './local-db';
import { SCORE_VALUES, type ScoreAction } from './snowball-score';

export function addScoreEvent(userId: string, action: ScoreAction, refId?: string) {
  const score = SCORE_VALUES[action];
  return db.addScoreEvent({
    user_id: userId,
    action,
    score,
    ref_id: refId,
    created_at: new Date().toISOString(),
  });
}

export function calculateEventScore(userId: string): number {
  const events = db.getScoreEvents(userId);
  return events.reduce((sum: number, event: any) => sum + event.score, 0);
}

export function calculateTodayEventScore(userId: string): number {
  const todayStr = new Date().toISOString().split('T')[0];
  const events = db.getScoreEvents(userId);
  return events
    .filter((e: any) => e.created_at && e.created_at.startsWith(todayStr))
    .reduce((sum: number, e: any) => sum + e.score, 0);
}
```

（移除了 `addChallengeScoreEvent` 函数）

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/lib/__tests__/score-engine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/score-engine.ts src/lib/__tests__/score-engine.test.ts
git commit -m "refactor: remove addChallengeScoreEvent, add calculateTodayEventScore"
```

---

### Task 3: 重构 snowball-score-calculator.ts

**Files:**
- Modify: `src/lib/snowball-score-calculator.ts`
- Modify: `src/lib/__tests__/snowball-score-calculator.test.ts`

- [ ] **Step 1: 重构 calculateTotalStats**

在 `src/lib/snowball-score-calculator.ts` 中，将 `calculateTotalStats` 改为纯展示统计：

```typescript
export function calculateTotalStats(
  records: Record[],
  tasks: Task[],
) {
  const todayData = calculateTodayScore(records, tasks);
  const todayStreak = calculateStreakDays(records);
  const taskBreakdown = calculateTaskScore(tasks);

  return {
    totalScore: 0,  // 不再计算，由 score_events 提供
    todayScore: todayData.todayScore,
    todayStreak,
    recordCount: records.length,
    taskCompletedCount: taskBreakdown.normalCompleted +
                        taskBreakdown.quickCompleted +
                        taskBreakdown.subtaskCompleted +
                        taskBreakdown.habitCheckins +
                        taskBreakdown.bigTaskCompleted,
  };
}
```

删除 `calculateStreakScore` 和 `calculateChallengeScore` 函数。

删除 `ChallengeCompletion` 接口（如果不再被引用）。

保留 `calculateStreakDays` 用于显示。

删除 `TaskScoreBreakdown` 接口中不再使用的字段（recordScore, taskScore, streakScore, challengeScore, challengeCompleted），或直接简化接口。

- 删除 `calculateStreakScore` 函数（第 71-115 行）
- 删除 `calculateChallengeScore` 函数（第 117-119 行）
- 删除 `ChallengeCompletion` 接口（第 14-16 行）
- 简化 `TaskScoreBreakdown` 接口（移除分数相关字段）

简化后的 `TaskScoreBreakdown`：

```typescript
export interface TaskScoreBreakdown {
  normalCompleted: number;
  quickCompleted: number;
  subtaskCompleted: number;
  habitCheckins: number;
  bigTaskCompleted: number;
}
```

简化后的 `calculateTaskScore`：

```typescript
export function calculateTaskScore(tasks: Task[]): TaskScoreBreakdown {
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const normalCompleted = completedTasks.filter(t =>
    (!t.type || (t.type !== 'big' && t.type !== 'quick' && t.type !== 'habit')) && !t.parent_id
  ).length;
  const quickCompleted = completedTasks.filter(t => t.type === 'quick').length;
  const subtaskCompleted = completedTasks.filter(t => t.parent_id).length;
  const habitCheckins = completedTasks.filter(t => t.type === 'habit').length;
  const bigTaskCompleted = completedTasks.filter(t => t.type === 'big').length;

  return {
    normalCompleted,
    quickCompleted,
    subtaskCompleted,
    habitCheckins,
    bigTaskCompleted,
  };
}
```

简化 `calculateTodayScore`——由于不再需要分数展示，可以直接简化。

- [ ] **Step 2: 更新测试**

在 `src/lib/__tests__/snowball-score-calculator.test.ts` 中：

1. 移除 `ChallengeCompletion` 的 import
2. 移除 `calculateStreakScore` 和 `calculateChallengeScore` 的测试
3. 更新 `calculateTotalStats` 测试，验证 `totalScore` 为 0：

```typescript
it('should return totalScore of 0 (scores come from events now)', () => {
  const result = calculateTotalStats([], []);
  expect(result.totalScore).toBe(0);
});
```

- [ ] **Step 3: 运行测试确认通过**

Run: `npx vitest run src/lib/__tests__/snowball-score-calculator.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/snowball-score-calculator.ts src/lib/__tests__/snowball-score-calculator.test.ts
git commit -m "refactor: calculateTotalStats no longer computes scores, removes streak/challenge score functions"
```

---

### Task 4: 更新 stats 路由——使用纯事件分数

**Files:**
- Modify: `src/app/api/snowball/stats/route.ts`
- Modify: `src/app/api/snowball/stats/__tests__/route.test.ts`

- [ ] **Step 1: 更新路由**

在 `src/app/api/snowball/stats/route.ts` 中：

```typescript
import { NextRequest } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';
import { calculateTotalStats, type Record, type Task } from '@/lib/snowball-score-calculator';
import { calculateEventScore, calculateTodayEventScore } from '@/lib/score-engine';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const records = db.getRecords(userId) as Record[];
    const tasks = db.getTasks(userId) as Task[];
    const totalScore = calculateEventScore(userId);
    const todayScore = calculateTodayEventScore(userId);
    const displayStats = calculateTotalStats(records, tasks);

    return createSuccessResponse({
      totalScore,
      todayScore,
      todayStreak: displayStats.todayStreak,
      recordCount: displayStats.recordCount,
      taskCompletedCount: displayStats.taskCompletedCount,
    });
  } catch (error) {
    console.error('Failed to fetch snowball stats:', error);
    return createErrorResponse('获取雪球数据失败', 500);
  }
}
```

- [ ] **Step 2: 更新测试**

在 `src/app/api/snowball/stats/__tests__/route.test.ts` 中：

1. 更新 `snowball-score-calculator` mock，使 `calculateTotalStats` 返回 `totalScore: 0`：

```typescript
const { mockCalculateTotalStats, mockCalculateEventScore, mockCalculateTodayEventScore } = vi.hoisted(() => ({
  mockCalculateTotalStats: vi.fn(() => ({
    totalScore: 0,
    todayScore: 0,
    todayStreak: 0,
    recordCount: 0,
    taskCompletedCount: 0,
  })),
  mockCalculateEventScore: vi.fn(() => 0),
  mockCalculateTodayEventScore: vi.fn(() => 0),
}));

vi.mock('@/lib/snowball-score-calculator', () => ({
  calculateTotalStats: mockCalculateTotalStats,
}));

vi.mock('@/lib/score-engine', () => ({
  calculateEventScore: mockCalculateEventScore,
  calculateTodayEventScore: mockCalculateTodayEventScore,
}));
```

2. 更新测试，验证 `calculateEventScore` 被调用：

```typescript
it('should use calculateEventScore for totalScore', async () => {
  mockCalculateEventScore.mockReturnValue(42);
  mockCalculateTodayEventScore.mockReturnValue(10);

  const { GET } = await import('../route');
  const request = new Request('http://localhost/api/snowball/stats');
  const response = await GET(request as any);
  const data = await response.json();

  expect(data.totalScore).toBe(42);
  expect(data.todayScore).toBe(10);
  expect(mockCalculateEventScore).toHaveBeenCalled();
  expect(mockCalculateTodayEventScore).toHaveBeenCalled();
});
```

- [ ] **Step 3: 运行测试确认通过**

Run: `npx vitest run src/app/api/snowball/stats/__tests__/route.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/api/snowball/stats/route.ts src/app/api/snowball/stats/__tests__/route.test.ts
git commit -m "feat: stats route uses pure event score for totalScore"
```

---

### Task 5: 更新 records 路由——写入 RECORD_CREATED 事件

**Files:**
- Modify: `src/app/api/records/route.ts`
- Modify: `src/app/api/records/__tests__/route.test.ts`

- [ ] **Step 1: 更新 POST handler**

在 `src/app/api/records/route.ts` 中，移除 STREAK_DAY 相关逻辑，改为写入 RECORD_CREATED：

```typescript
    const record = db.createRecord({
      user_id: userId,
      content,
      record_type: type || 'success',
      tags: tags || [],
      mood: mood || 'happy',
      related_goal_id: null,
      related_task_id,
    });

    addScoreEvent(userId, 'RECORD_CREATED');

    return createSuccessResponse({ record }, 201);
```

移除之前的 `todayStr`、`existingRecords`、`todayRecordCount` 变量。

- [ ] **Step 2: 更新测试**

在 `src/app/api/records/__tests__/route.test.ts` 中：

1. `mockAddScoreEvent` 仍保留
2. 移除 `beforeEach` 中任何与 STREAK_DAY 相关的设置
3. 如果有测试验证 STREAK_DAY 的写入，更新为验证 RECORD_CREATED

- [ ] **Step 3: 运行测试确认通过**

Run: `npx vitest run src/app/api/records/__tests__/route.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/api/records/route.ts src/app/api/records/__tests__/route.test.ts
git commit -m "feat: records route writes RECORD_CREATED event, removes STREAK_DAY"
```

---

### Task 6: 更新 tasks/[id] 路由——PATCH 完成时写入事件

**Files:**
- Modify: `src/app/api/tasks/[id]/route.ts`

- [ ] **Step 1: 更新 PATCH handler**

在 `src/app/api/tasks/[id]/route.ts` 中，在 `db.updateTask` 之后添加分数事件写入逻辑：

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;
  const { id } = await params;

  try {
    const updates = await request.json();

    const allowedFields = ['title', 'description', 'due_date', 'importance', 'status', 'goal_id', 'frequency', 'target_count', 'reminder_time', 'progress', 'thresholds'];
    const filteredUpdates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    const wasCompleted = updates.status === 'completed';
    let taskType: string | undefined;

    if (wasCompleted) {
      const allTasks = db.getTasks(userId);
      const currentTask = allTasks.find((t: any) => t.id === id);
      taskType = currentTask?.task_type;
      filteredUpdates.completed_at = new Date().toISOString();
    }

    const task = db.updateTask(id, filteredUpdates);

    if (wasCompleted) {
      let action;
      if (taskType === 'quick') action = 'TASK_QUICK_COMPLETED';
      else if (taskType === 'big') action = 'BIG_TASK_COMPLETED';
      else if (taskType === 'habit') action = 'HABIT_CHECKIN';
      else if (task.parent_id) action = 'SUBTASK_COMPLETED';
      else action = 'TASK_NORMAL_COMPLETED';
      addScoreEvent(userId, action as any, id);
    }

    return createSuccessResponse({ task: { ...task, type: task.task_type } });
  } catch (error: any) {
    console.error('Error in task patch route:', error);
    return createErrorResponse(error.message || 'Failed to update task');
  }
}
```

- [ ] **Step 2: 简化 DELETE handler**

移除分数相关逻辑：

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;
  const { id } = await params;

  try {
    db.deleteTask(id);
    return createSuccessResponse({ success: true });
  } catch (error: any) {
    console.error('Error in task delete route:', error);
    return createErrorResponse(error.message || 'Failed to delete task');
  }
}
```

（移除了 `allTasks` 的查找和 `addScoreEvent` 调用）

- [ ] **Step 3: 运行测试确认通过**

Run: `npx vitest run src/app/api/tasks/[id]/__tests__/route.test.ts`
Expected: PASS（可能需要更新 mock）

- [ ] **Step 4: Commit**

```bash
git add src/app/api/tasks/[id]/route.ts
git commit -m "feat: PATCH task completion writes score event, DELETE simplified"
```

---

### Task 7: 更新 challenges 路由——移除 score 事件写入

**Files:**
- Modify: `src/app/api/challenges/route.ts`
- Modify: `src/app/api/challenges/__tests__/route.test.ts`

- [ ] **Step 1: 移除 import**

在 `src/app/api/challenges/route.ts` 中，移除：
```typescript
import { addChallengeScoreEvent } from '@/lib/score-engine';
```

- [ ] **Step 2: 移除 3 处 addChallengeScoreEvent 调用**

1. milestone 奖励（约第 559 行）：直接移除 `addChallengeScoreEvent(...)` 调用，保留 `milestoneReward` 的赋值供前端展示
2. progress 完成奖励（约第 565 行）：移除整个 `if (finalReward.score) { addChallengeScoreEvent(...) }` 块
3. complete 奖励（约第 609 行）：同样移除

- [ ] **Step 3: 更新测试**

在 `src/app/api/challenges/__tests__/route.test.ts` 中，移除 `@/lib/score-engine` 的 mock。

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/app/api/challenges/__tests__/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/challenges/route.ts src/app/api/challenges/__tests__/route.test.ts
git commit -m "refactor: challenges route no longer writes score events"
```

---

### Task 8: 更新 tasks/page.tsx——完成时 PATCH 而非 DELETE

**Files:**
- Modify: `src/app/tasks/page.tsx`

- [ ] **Step 1: 更新 SCORE_TEXT_MAP**

```typescript
const SCORE_TEXT_MAP: Record<string, string> = {
  quick: '+2分 ⚡',
  normal: '+5分 ⚡',
  habit: '+5分 🔥',
  big: '+10分 🎯',
  subtask: '+5分 ✅',
};
```

- [ ] **Step 2: 修改完成任务的逻辑**

在完成任务的分支（第 635-670 行），将 DELETE 调用改为 PATCH 调用：

当前代码：
```typescript
        // 3. 删除任务
        const deleteSuccess = await deleteTask(taskId);
        if (!deleteSuccess) {
          throw new Error('Failed to delete task');
        }
```

改为：
```typescript
        // 3. 标记任务为已完成（不再删除，分数事件由后端 PATCH 写入）
        const updateSuccess = await updateTaskStatus(taskId, 'completed');
        if (!updateSuccess) {
          throw new Error('Failed to complete task');
        }
```

确保 `updateTaskStatus` 在 `useTasks` 的返回值中可用。如果当前 `useTasks` 没有暴露 `updateTaskStatus`，则使用 `updateTask(taskId, { status: 'completed', completed_at: new Date().toISOString() })`。

- [ ] **Step 3: 运行 TypeScript 检查**

Run: `npx tsc --noEmit`
Expected: 通过

- [ ] **Step 4: Commit**

```bash
git add src/app/tasks/page.tsx
git commit -m "refactor: task completion uses PATCH instead of DELETE, update score text"
```

---

### Task 9: 全量验证

**Files:**
- 所有已修改文件

- [ ] **Step 1: 运行全量测试**

Run: `npx vitest run`
Expected: 所有测试通过

- [ ] **Step 2: 检查前端 addScore('RECORD_CREATED') 调用**

所有前端调用 `addScore('RECORD_CREATED')` 现在对应 +5 分（之前 +10）。确认 SCORE_VALUES 已自动适配。

查看 page.tsx 中的 RECORD_CREATED 调用（约第 211/220/248/262/677 行）——它们使用 `addScore('RECORD_CREATED')`，值从 SCORE_VALUES 读取，所以不需要修改代码。

- [ ] **Step 3: 运行 TypeScript 检查**

Run: `npx tsc --noEmit`
Expected: 通过

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: full test pass and type check after scoring system refactor"
```
