# 雪球得分逻辑重构 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消除三套独立计分机制，建立单一真相源（后端权威 + 事件驱动），使前端显示的分数与后端一致。

**Architecture:** 采用混合方案——记录/任务分数继续从原始数据重算（幂等），连续天数和挑战分数通过 score_events 事件累加。新增 Score Engine 模块作为统一写入入口，前端 addScore 改为刷新驱动（非乐观累加）。

**Tech Stack:** Next.js 16 App Router, TypeScript, Vitest, JSON 文件存储（local-db.ts）

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/snowball-score.ts` | Modify | 移除 CHALLENGE_MILESTONE / CHALLENGE_COMPLETED 常量 |
| `src/lib/local-db.ts` | Modify | 新增 scoreEvents 集合 + CRUD；移除 snowball_size / total_score |
| `src/lib/score-engine.ts` | Create | 统一分数写入入口（addScoreEvent / addChallengeScoreEvent / calculateEventScore） |
| `src/lib/snowball-score-calculator.ts` | Modify | calculateTotalStats 移除 streakScore/challengeScore，新增 eventScore 参数 |
| `src/app/api/snowball/stats/route.ts` | Modify | 读取事件分数，传入 calculateTotalStats |
| `src/app/api/records/route.ts` | Modify | 创建记录时检测今日首条，写入 STREAK_DAY 事件 |
| `src/app/api/challenges/route.ts` | Modify | 3 处 updateGrowthData 替换为 addChallengeScoreEvent |
| `src/contexts/SnowballContext.tsx` | Modify | addScore 改为刷新驱动，保留动画 |
| `src/app/page.tsx` | Modify | addScore('CHALLENGE_MILESTONE') 替换为 refreshStats() |
| `src/hooks/useRecords.ts` | Modify | 移除 calculateStreakDays，改用 Context |
| `src/lib/__tests__/snowball-score.test.ts` | Modify | 移除 CHALLENGE_MILESTONE / CHALLENGE_COMPLETED 断言 |
| `src/lib/__tests__/local-db.test.ts` | Modify | 新增 scoreEvents CRUD 测试 |
| `src/lib/__tests__/score-engine.test.ts` | Create | Score Engine 单元测试 |
| `src/lib/__tests__/snowball-score-calculator.test.ts` | Modify | 移除 streak/challenge 分数测试，新增 eventScore 测试 |
| `src/app/api/snowball/stats/__tests__/route.test.ts` | Modify | 更新 mock 适配新签名 |

---

### Task 1: 更新 SCORE_VALUES 常量

**Files:**
- Modify: `src/lib/snowball-score.ts:11-21`
- Modify: `src/lib/__tests__/snowball-score.test.ts:14-43`

- [ ] **Step 1: 更新测试——移除 CHALLENGE_MILESTONE / CHALLENGE_COMPLETED 断言**

在 `src/lib/__tests__/snowball-score.test.ts` 中，修改 "should have all required score actions" 测试：

```typescript
it('should have all required score actions', () => {
  expect(SCORE_VALUES).toHaveProperty('RECORD_CREATED');
  expect(SCORE_VALUES).toHaveProperty('TASK_NORMAL_COMPLETED');
  expect(SCORE_VALUES).toHaveProperty('TASK_QUICK_COMPLETED');
  expect(SCORE_VALUES).toHaveProperty('HABIT_CHECKIN');
  expect(SCORE_VALUES).toHaveProperty('SUBTASK_COMPLETED');
  expect(SCORE_VALUES).toHaveProperty('BIG_TASK_COMPLETED');
  expect(SCORE_VALUES).toHaveProperty('STREAK_DAY');
});
```

修改 "should have reasonable score values" 测试，移除两行：

```typescript
it('should have reasonable score values', () => {
  expect(SCORE_VALUES.RECORD_CREATED).toBe(10);
  expect(SCORE_VALUES.TASK_NORMAL_COMPLETED).toBe(5);
  expect(SCORE_VALUES.TASK_QUICK_COMPLETED).toBe(2);
  expect(SCORE_VALUES.HABIT_CHECKIN).toBe(3);
  expect(SCORE_VALUES.SUBTASK_COMPLETED).toBe(5);
  expect(SCORE_VALUES.BIG_TASK_COMPLETED).toBe(8);
  expect(SCORE_VALUES.STREAK_DAY).toBe(3);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/lib/__tests__/snowball-score.test.ts`
Expected: PASS（因为测试先改了，常量还没改，但测试不再检查那两个字段所以会通过。实际上这步是验证测试修改本身无误）

- [ ] **Step 3: 更新 SCORE_VALUES 常量**

在 `src/lib/snowball-score.ts` 中：

```typescript
export const SCORE_VALUES = {
  RECORD_CREATED: 10,
  TASK_NORMAL_COMPLETED: 5,
  TASK_QUICK_COMPLETED: 2,
  HABIT_CHECKIN: 3,
  SUBTASK_COMPLETED: 5,
  BIG_TASK_COMPLETED: 8,
  STREAK_DAY: 3,
} as const;
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/lib/__tests__/snowball-score.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/snowball-score.ts src/lib/__tests__/snowball-score.test.ts
git commit -m "refactor: remove CHALLENGE_MILESTONE and CHALLENGE_COMPLETED from SCORE_VALUES"
```

---

### Task 2: 新增 score_events 数据层

**Files:**
- Modify: `src/lib/local-db.ts:15-44` (LocalData 接口)
- Modify: `src/lib/local-db.ts:46-98` (种子数据)
- Modify: `src/lib/local-db.ts` (新增 CRUD 函数)
- Modify: `src/lib/__tests__/local-db.test.ts`

- [ ] **Step 1: 写失败测试——scoreEvents CRUD**

在 `src/lib/__tests__/local-db.test.ts` 末尾（`describe('Local DB')` 内部）新增：

```typescript
describe('ScoreEvent operations', () => {
  it('should add and retrieve score events', () => {
    const event = addScoreEvent({
      user_id: testUserId,
      action: 'STREAK_DAY',
      score: 3,
      created_at: new Date().toISOString(),
    });
    expect(event.id).toBeDefined();
    expect(event.action).toBe('STREAK_DAY');
    expect(event.score).toBe(3);

    const events = getScoreEvents(testUserId);
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('STREAK_DAY');
  });

  it('should filter score events by user_id', () => {
    addScoreEvent({
      user_id: testUserId,
      action: 'RECORD_CREATED',
      score: 10,
      created_at: new Date().toISOString(),
    });
    addScoreEvent({
      user_id: 'other-user',
      action: 'RECORD_CREATED',
      score: 10,
      created_at: new Date().toISOString(),
    });

    const events = getScoreEvents(testUserId);
    expect(events).toHaveLength(1);
  });

  it('should return empty array for user with no events', () => {
    const events = getScoreEvents('non-existent-user');
    expect(events).toEqual([]);
  });
});
```

同时在文件顶部 import 中新增 `addScoreEvent`, `getScoreEvents`。

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/lib/__tests__/local-db.test.ts`
Expected: FAIL — `addScoreEvent is not defined`

- [ ] **Step 3: 实现 scoreEvents 数据层**

在 `src/lib/local-db.ts` 中：

1. 在 `LocalData` 接口新增字段：

```typescript
scoreEvents: Array<{
  id: string;
  user_id: string;
  action: string;
  score: number;
  ref_id?: string;
  created_at: string;
}>;
```

2. 在 `getDefaultData()` 返回值中新增：

```typescript
scoreEvents: [],
```

3. 新增 CRUD 函数（在文件末尾 `incrementUserInteraction` 之后）：

```typescript
export function addScoreEvent(eventData: Omit<{
  id: string;
  user_id: string;
  action: string;
  score: number;
  ref_id?: string;
  created_at: string;
}, 'id'>) {
  const data = loadData();
  const newEvent = {
    id: generateId(),
    ...eventData,
  };
  data.scoreEvents.push(newEvent);
  saveData();
  return newEvent;
}

export function getScoreEvents(userId: string) {
  const data = loadData();
  return data.scoreEvents.filter((e: any) => e.user_id === userId);
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/lib/__tests__/local-db.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/local-db.ts src/lib/__tests__/local-db.test.ts
git commit -m "feat: add scoreEvents collection to local-db with CRUD operations"
```

---

### Task 3: 创建 Score Engine 模块

**Files:**
- Create: `src/lib/score-engine.ts`
- Create: `src/lib/__tests__/score-engine.test.ts`

- [ ] **Step 1: 写失败测试——Score Engine 核心函数**

创建 `src/lib/__tests__/score-engine.test.ts`：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAddScoreEvent = vi.fn();
const mockGetScoreEvents = vi.fn();

vi.mock('@/lib/local-db', () => ({
  addScoreEvent: mockAddScoreEvent,
  getScoreEvents: mockGetScoreEvents,
}));

import {
  addScoreEvent,
  addChallengeScoreEvent,
  calculateEventScore,
} from '../score-engine';
import { SCORE_VALUES } from '../snowball-score';

beforeEach(() => {
  vi.clearAllMocks();
  mockAddScoreEvent.mockImplementation((data: any) => ({
    id: 'test-id',
    ...data,
  }));
});

describe('addScoreEvent', () => {
  it('should write a score event with SCORE_VALUES lookup', () => {
    const event = addScoreEvent('user-1', 'STREAK_DAY');
    expect(mockAddScoreEvent).toHaveBeenCalledWith({
      user_id: 'user-1',
      action: 'STREAK_DAY',
      score: SCORE_VALUES.STREAK_DAY,
      ref_id: undefined,
      created_at: expect.any(String),
    });
    expect(event.score).toBe(SCORE_VALUES.STREAK_DAY);
  });

  it('should pass ref_id when provided', () => {
    addScoreEvent('user-1', 'RECORD_CREATED', 'record-123');
    expect(mockAddScoreEvent).toHaveBeenCalledWith(
      expect.objectContaining({ ref_id: 'record-123' })
    );
  });
});

describe('addChallengeScoreEvent', () => {
  it('should write a CHALLENGE_MILESTONE event with dynamic score', () => {
    const event = addChallengeScoreEvent('user-1', 'challenge-1', 5, true);
    expect(mockAddScoreEvent).toHaveBeenCalledWith({
      user_id: 'user-1',
      action: 'CHALLENGE_MILESTONE',
      score: 5,
      ref_id: 'challenge-1',
      created_at: expect.any(String),
    });
    expect(event.score).toBe(5);
  });

  it('should write a CHALLENGE_COMPLETED event with dynamic score', () => {
    const event = addChallengeScoreEvent('user-1', 'challenge-2', 20, false);
    expect(mockAddScoreEvent).toHaveBeenCalledWith({
      user_id: 'user-1',
      action: 'CHALLENGE_COMPLETED',
      score: 20,
      ref_id: 'challenge-2',
      created_at: expect.any(String),
    });
    expect(event.score).toBe(20);
  });
});

describe('calculateEventScore', () => {
  it('should sum all event scores for a user', () => {
    mockGetScoreEvents.mockReturnValue([
      { id: '1', user_id: 'user-1', action: 'STREAK_DAY', score: 3, created_at: '2026-05-19T10:00:00.000Z' },
      { id: '2', user_id: 'user-1', action: 'CHALLENGE_MILESTONE', score: 5, created_at: '2026-05-19T11:00:00.000Z' },
      { id: '3', user_id: 'user-1', action: 'CHALLENGE_COMPLETED', score: 20, created_at: '2026-05-19T12:00:00.000Z' },
    ]);
    expect(calculateEventScore('user-1')).toBe(28);
  });

  it('should return 0 for user with no events', () => {
    mockGetScoreEvents.mockReturnValue([]);
    expect(calculateEventScore('user-1')).toBe(0);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/lib/__tests__/score-engine.test.ts`
Expected: FAIL — `Cannot find module '../score-engine'`

- [ ] **Step 3: 创建 score-engine.ts**

创建 `src/lib/score-engine.ts`：

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

export function addChallengeScoreEvent(userId: string, challengeId: string, score: number, isMilestone: boolean) {
  return db.addScoreEvent({
    user_id: userId,
    action: isMilestone ? 'CHALLENGE_MILESTONE' : 'CHALLENGE_COMPLETED',
    score,
    ref_id: challengeId,
    created_at: new Date().toISOString(),
  });
}

export function calculateEventScore(userId: string): number {
  const events = db.getScoreEvents(userId);
  return events.reduce((sum: number, event: any) => sum + event.score, 0);
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/lib/__tests__/score-engine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/score-engine.ts src/lib/__tests__/score-engine.test.ts
git commit -m "feat: create score-engine module with addScoreEvent, addChallengeScoreEvent, calculateEventScore"
```

---

### Task 4: 重构 snowball-score-calculator.ts

**Files:**
- Modify: `src/lib/snowball-score-calculator.ts`
- Modify: `src/lib/__tests__/snowball-score-calculator.test.ts`

- [ ] **Step 1: 写失败测试——calculateTotalStats 接受 eventScore 参数**

在 `src/lib/__tests__/snowball-score-calculator.test.ts` 的 `describe('calculateTotalStats')` 中新增：

```typescript
describe('eventScore parameter', () => {
  it('should include eventScore in totalScore', () => {
    const records: Record[] = [
      { created_at: todayDateStr() + 'T10:00:00.000Z' },
    ];
    const tasks: Task[] = [];
    const result = calculateTotalStats(records, tasks, 42);
    expect(result.totalScore).toBe(SCORE_VALUES.RECORD_CREATED + 42);
  });

  it('should work without eventScore parameter (backward compatible)', () => {
    const records: Record[] = [
      { created_at: todayDateStr() + 'T10:00:00.000Z' },
    ];
    const tasks: Task[] = [];
    const result = calculateTotalStats(records, tasks);
    expect(result.totalScore).toBe(SCORE_VALUES.RECORD_CREATED);
  });

  it('should treat undefined eventScore as 0', () => {
    const records: Record[] = [];
    const tasks: Task[] = [];
    const result = calculateTotalStats(records, tasks, undefined);
    expect(result.totalScore).toBe(0);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/lib/__tests__/snowball-score-calculator.test.ts`
Expected: FAIL — `calculateTotalStats` 当前签名不接受 `eventScore` 作为第 3 个参数（第 3 个是 `challenges`）

- [ ] **Step 3: 重构 calculateTotalStats**

在 `src/lib/snowball-score-calculator.ts` 中：

1. 修改 `calculateTotalStats` 签名和实现：

```typescript
export function calculateTotalStats(
  records: Record[],
  tasks: Task[],
  eventScore?: number
) {
  const recordScore = records.length * SCORE_VALUES.RECORD_CREATED;
  const taskBreakdown = calculateTaskScore(tasks);
  const todayData = calculateTodayScore(records, tasks);
  const todayStreak = calculateStreakDays(records);
  const totalScore = recordScore + taskBreakdown.taskScore + (eventScore || 0);

  return {
    totalScore,
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

2. 保留 `calculateStreakScore`、`calculateChallengeScore`、`ChallengeCompletion` 类型的导出（向后兼容），但 `calculateTotalStats` 不再使用它们。

- [ ] **Step 4: 更新现有测试**

在 `src/lib/__tests__/snowball-score-calculator.test.ts` 中：

1. 修改 "should sum record score, task score, streak score, and challenge score" 测试——移除 challenges 参数，调整期望值：

```typescript
it('should sum record score, task score, and event score', () => {
  const records: Record[] = [
    { created_at: todayDateStr() + 'T04:00:00.000Z' },
    { created_at: todayDateStr() + 'T05:00:00.000Z' },
    { created_at: daysAgoDateStr(1) + 'T04:00:00.000Z' },
  ];
  const tasks: Task[] = [
    createTask({ status: 'completed', completed_at: todayDateStr() + 'T04:00:00.000Z' }),
  ];
  const eventScore = 18;
  const result = calculateTotalStats(records, tasks, eventScore);

  const expectedRecordScore = 3 * SCORE_VALUES.RECORD_CREATED;
  const expectedTaskScore = SCORE_VALUES.TASK_NORMAL_COMPLETED;
  const expectedTotal = expectedRecordScore + expectedTaskScore + eventScore;

  expect(result.totalScore).toBe(expectedTotal);
});
```

2. 修改 "should work without challenges parameter" 测试——不再传 challenges：

```typescript
it('should work without eventScore parameter', () => {
  const records: Record[] = [
    { created_at: todayDateStr() + 'T10:00:00.000Z' },
  ];
  const tasks: Task[] = [
    createTask({ status: 'completed', completed_at: todayDateStr() + 'T10:00:00.000Z' }),
  ];
  const result = calculateTotalStats(records, tasks);

  expect(result.totalScore).toBe(SCORE_VALUES.RECORD_CREATED + SCORE_VALUES.TASK_NORMAL_COMPLETED);
});
```

3. 修改 integration 测试中的 `calculateTotalStats` 调用，移除 challenges 参数。

4. 移除 `ChallengeCompletion` 的 import（如果不再使用）。

- [ ] **Step 5: 运行测试确认通过**

Run: `npx vitest run src/lib/__tests__/snowball-score-calculator.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/snowball-score-calculator.ts src/lib/__tests__/snowball-score-calculator.test.ts
git commit -m "refactor: calculateTotalStats uses eventScore instead of streak/challenge recalculation"
```

---

### Task 5: 更新 /api/snowball/stats 路由

**Files:**
- Modify: `src/app/api/snowball/stats/route.ts`
- Modify: `src/app/api/snowball/stats/__tests__/route.test.ts`

- [ ] **Step 1: 更新 stats 路由**

在 `src/app/api/snowball/stats/route.ts` 中：

```typescript
import { NextRequest } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';
import { calculateTotalStats, type Record, type Task } from '@/lib/snowball-score-calculator';
import { calculateEventScore } from '@/lib/score-engine';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const records = db.getRecords(userId) as Record[];
    const tasks = db.getTasks(userId) as Task[];
    const eventScore = calculateEventScore(userId);
    const stats = calculateTotalStats(records, tasks, eventScore);

    return createSuccessResponse(stats);
  } catch (error) {
    console.error('Failed to fetch snowball stats:', error);
    return createErrorResponse('获取雪球数据失败', 500);
  }
}
```

- [ ] **Step 2: 更新 stats 路由测试**

在 `src/app/api/snowball/stats/__tests__/route.test.ts` 中：

1. 新增 score-engine mock：

```typescript
vi.mock('@/lib/score-engine', () => ({
  calculateEventScore: vi.fn(() => 0),
}));
```

2. 更新 snowball-score-calculator mock，使 `calculateTotalStats` 接受 `eventScore` 参数：

```typescript
vi.mock('@/lib/snowball-score-calculator', () => ({
  calculateTotalStats: vi.fn((records: any[], tasks: any[], eventScore?: number) => ({
    totalScore: records.length * 10 + tasks.filter((t: any) => t.status === 'completed').length * 5 + (eventScore || 0),
    todayScore: 0,
    todayStreak: 0,
    recordCount: records.length,
    taskCompletedCount: tasks.filter((t: any) => t.status === 'completed').length,
  })),
}));
```

3. 新增测试——验证 eventScore 被传入：

```typescript
it('should pass eventScore to calculateTotalStats', async () => {
  const { calculateEventScore } = await import('@/lib/score-engine');
  (calculateEventScore as any).mockReturnValue(42);

  const { GET } = await import('../route');
  const request = new Request('http://localhost/api/snowball/stats');
  await GET(request as any);

  const { calculateTotalStats } = await import('@/lib/snowball-score-calculator');
  expect(calculateTotalStats).toHaveBeenCalledWith(
    expect.any(Array),
    expect.any(Array),
    42
  );
});
```

- [ ] **Step 3: 运行测试确认通过**

Run: `npx vitest run src/app/api/snowball/stats/__tests__/route.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/api/snowball/stats/route.ts src/app/api/snowball/stats/__tests__/route.test.ts
git commit -m "feat: stats API reads eventScore from score-engine"
```

---

### Task 6: 更新 /api/records 路由——添加 STREAK_DAY 事件

**Files:**
- Modify: `src/app/api/records/route.ts`

- [ ] **Step 1: 更新 records 路由 POST handler**

在 `src/app/api/records/route.ts` 中，修改 POST handler：

1. 新增 import：

```typescript
import { addScoreEvent } from '@/lib/score-engine';
```

2. 在 `db.createRecord(...)` 调用之前，检测今日首条记录：

```typescript
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const { content, type, tags, mood, related_task_id } = await request.json();

    if (!content || typeof content !== 'string') {
      return createErrorResponse('Content is required and must be a string', 400);
    }

    if (content.length > 10000) {
      return createErrorResponse('Content must be less than 10000 characters', 400);
    }

    const validRecordTypes = ['success', 'challenge', 'insight', 'question'];
    if (type && !validRecordTypes.includes(type)) {
      return createErrorResponse('Invalid record type', 400);
    }

    const validMoods = ['happy', 'calm', 'excited', 'tired', 'anxious', 'sad', 'proud', 'grateful', 'neutral'];
    if (mood && !validMoods.includes(mood)) {
      return createErrorResponse('Invalid mood', 400);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const existingRecords = db.getRecords(userId);
    const todayRecordCount = existingRecords.filter(
      (r: any) => r.created_at && r.created_at.startsWith(todayStr)
    ).length;

    const record = db.createRecord({
      user_id: userId,
      content,
      record_type: type || 'success',
      tags: tags || [],
      mood: mood || 'happy',
      related_goal_id: null,
      related_task_id,
    });

    if (todayRecordCount === 0) {
      addScoreEvent(userId, 'STREAK_DAY');
    }

    return createSuccessResponse({ record }, 201);
  } catch (error: unknown) {
    console.error('Error in records route:', error);
    return createErrorResponse((error as Error).message || 'Failed to create record');
  }
}
```

- [ ] **Step 2: 运行现有 records 测试确认不破坏**

Run: `npx vitest run src/app/api/records/__tests__/route.test.ts`
Expected: PASS（如果 mock 了 score-engine）或需要更新 mock

- [ ] **Step 3: Commit**

```bash
git add src/app/api/records/route.ts
git commit -m "feat: add STREAK_DAY score event on first record of the day"
```

---

### Task 7: 更新 /api/challenges 路由——使用 Score Engine

**Files:**
- Modify: `src/app/api/challenges/route.ts`

- [ ] **Step 1: 替换 3 处 updateGrowthData 为 addChallengeScoreEvent**

在 `src/app/api/challenges/route.ts` 中：

1. 新增 import：

```typescript
import { addChallengeScoreEvent } from '@/lib/score-engine';
```

2. 替换第 1 处（约第 558-563 行，里程碑奖励）：

将：
```typescript
if (milestoneResult) {
  milestoneReward = milestoneResult.milestone.reward;
  const growthData = db.getGrowthData(userId);
  if (growthData) {
    db.updateGrowthData(userId, {
      total_score: (growthData.total_score || 0) + milestoneReward.score,
    });
  }
}
```

替换为：
```typescript
if (milestoneResult) {
  milestoneReward = milestoneResult.milestone.reward;
  addChallengeScoreEvent(userId, userChallenge.challenge_id, milestoneReward.score, true);
}
```

3. 替换第 2 处（约第 568-575 行，挑战完成奖励在 progress action 中）：

将：
```typescript
if (newProgress >= (challenge?.duration_days || 1)) {
  const finalReward = challenge?.reward || {} as Challenge['reward'];
  if (finalReward.score) {
    const growthData = db.getGrowthData(userId);
    if (growthData) {
      db.updateGrowthData(userId, {
        total_score: (growthData.total_score || 0) + finalReward.score,
      });
    }
  }
```

替换为：
```typescript
if (newProgress >= (challenge?.duration_days || 1)) {
  const finalReward = challenge?.reward || {} as Challenge['reward'];
  if (finalReward.score) {
    addChallengeScoreEvent(userId, userChallenge.challenge_id, finalReward.score, false);
  }
```

4. 替换第 3 处（约第 616-623 行，complete action 中的奖励）：

将：
```typescript
if (action === 'complete') {
  const finalReward = challenge?.reward || {} as Challenge['reward'];
  if (finalReward.score) {
    const growthData = db.getGrowthData(userId);
    if (growthData) {
      db.updateGrowthData(userId, {
        total_score: (growthData.total_score || 0) + finalReward.score,
      });
    }
  }
```

替换为：
```typescript
if (action === 'complete') {
  const finalReward = challenge?.reward || {} as Challenge['reward'];
  if (finalReward.score) {
    addChallengeScoreEvent(userId, userChallenge.challenge_id, finalReward.score, false);
  }
```

- [ ] **Step 2: 运行 challenges 测试确认不破坏**

Run: `npx vitest run src/app/api/challenges/__tests__/route.test.ts`
Expected: PASS（可能需要更新 mock）

- [ ] **Step 3: Commit**

```bash
git add src/app/api/challenges/route.ts
git commit -m "refactor: challenges route uses score-engine instead of direct growthData writes"
```

---

### Task 8: 清理 local-db.ts——移除 snowball_size 和 total_score

**Files:**
- Modify: `src/lib/local-db.ts`

- [ ] **Step 1: 移除 createRecord 中的 snowball_size += 2**

在 `src/lib/local-db.ts` 的 `createRecord` 函数中，删除：

```typescript
const growthIdx = data.growthData.findIndex((g: any) => g.user_id === recordData.user_id);
if (growthIdx !== -1) {
  data.growthData[growthIdx].records_count += 1;
  data.growthData[growthIdx].snowball_size += 2;
}
```

替换为：

```typescript
const growthIdx = data.growthData.findIndex((g: any) => g.user_id === recordData.user_id);
if (growthIdx !== -1) {
  data.growthData[growthIdx].records_count += 1;
}
```

- [ ] **Step 2: 移除 updateTask 中的 snowball_size += 5**

在 `src/lib/local-db.ts` 的 `updateTask` 函数中，删除 `snowball_size += 5` 行：

将：
```typescript
if (updates.status === 'completed' && wasNotCompleted) {
  const growthIdx = data.growthData.findIndex((g: any) => g.user_id === task.user_id);
  if (growthIdx !== -1) {
    data.growthData[growthIdx].tasks_completed += 1;
    data.growthData[growthIdx].snowball_size += 5;
  }
}
```

替换为：

```typescript
if (updates.status === 'completed' && wasNotCompleted) {
  const growthIdx = data.growthData.findIndex((g: any) => g.user_id === task.user_id);
  if (growthIdx !== -1) {
    data.growthData[growthIdx].tasks_completed += 1;
  }
}
```

- [ ] **Step 3: 移除种子数据中的 snowball_size: 0**

在 `getDefaultData()` 的 `growthData` 种子数据中，删除 `snowball_size: 0` 行：

```typescript
growthData: [
  {
    id: '1',
    user_id: '1',
    date: today,
    achievements_count: 0,
    tasks_completed: 0,
    records_count: 0,
    created_at: now,
  },
],
```

- [ ] **Step 4: 运行 local-db 测试确认通过**

Run: `npx vitest run src/lib/__tests__/local-db.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/local-db.ts
git commit -m "refactor: remove snowball_size magic numbers from local-db"
```

---

### Task 9: 重构前端——SnowballContext + page.tsx + useRecords.ts

**Files:**
- Modify: `src/contexts/SnowballContext.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/hooks/useRecords.ts`

- [ ] **Step 1: 重构 SnowballContext.addScore 为刷新驱动**

在 `src/contexts/SnowballContext.tsx` 中，修改 `addScore` 回调：

将当前的乐观累加实现：
```typescript
const addScore = useCallback((action: ScoreAction) => {
  const score = SCORE_VALUES[action];
  setLastAddedScore(score);
  setLastAddedAction(action);
  setStats(prev => ({
    ...prev,
    totalScore: prev.totalScore + score,
    todayScore: prev.todayScore + score,
    taskCompletedCount:
      action.startsWith('TASK_') || action === 'SUBTASK_COMPLETED' || action === 'BIG_TASK_COMPLETED'
        ? prev.taskCompletedCount + 1
        : prev.taskCompletedCount,
    recordCount: action === 'RECORD_CREATED' ? prev.recordCount + 1 : prev.recordCount,
  }));
  setTimeout(() => {
    setLastAddedScore(0);
    setLastAddedAction(null);
  }, 2000);

  refreshStats().catch(err => console.error('refreshStats failed:', err));

  if (refreshTimerRef.current) {
    clearTimeout(refreshTimerRef.current);
  }
  refreshTimerRef.current = setTimeout(() => {
    refreshStats().catch(err => console.error('refreshStats retry failed:', err));
  }, 1000);
}, [refreshStats]);
```

替换为刷新驱动实现：
```typescript
const addScore = useCallback((action: ScoreAction) => {
  const score = SCORE_VALUES[action];
  setLastAddedScore(score);
  setLastAddedAction(action);
  setTimeout(() => {
    setLastAddedScore(0);
    setLastAddedAction(null);
  }, 2000);

  refreshStats().catch(err => console.error('refreshStats failed:', err));
}, [refreshStats]);
```

同时移除 `refreshTimerRef` 相关代码（不再需要 1 秒后重试）：

删除：
```typescript
const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

删除 cleanup effect：
```typescript
useEffect(() => {
  return () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
  };
}, []);
```

- [ ] **Step 2: 更新 page.tsx——替换 addScore('CHALLENGE_MILESTONE')**

在 `src/app/page.tsx` 中：

1. 修改 `useSnowball` 解构，新增 `refreshStats`：

```typescript
const { addScore, refreshStats } = useSnowball();
```

2. 将第 277 行的 `addScore('CHALLENGE_MILESTONE')` 替换为：

```typescript
if (isCompleted || hasMilestone) {
  refreshStats();
}
```

3. 更新传递给子组件的 props（第 483、546 行），新增 `refreshStats`：

```typescript
addScore={addScore}
refreshStats={refreshStats}
```

4. 更新组件 props 类型定义（约第 610 行）：

```typescript
addScore: (action: import('@/lib/snowball-score').ScoreAction) => void;
refreshStats: () => Promise<void>;
```

5. 在接收 props 的组件解构中新增 `refreshStats`。

- [ ] **Step 3: 更新 useRecords.ts——移除 calculateStreakDays**

在 `src/hooks/useRecords.ts` 中：

1. 删除 `calculateStreakDays` 函数（第 237-255 行）：

```typescript
// 删除整个函数
const calculateStreakDays = (): number => {
  let streakCount = 1;
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  for (let i = 0; i < sortedRecords.length; i++) {
    const recordDate = new Date(sortedRecords[i].created_at);
    recordDate.setHours(0, 0, 0, 0);
    const expectedDate = new Date();
    expectedDate.setHours(0, 0, 0, 0);
    expectedDate.setDate(expectedDate.getDate() - i);
    if (recordDate.getTime() === expectedDate.getTime()) {
      streakCount++;
    } else {
      break;
    }
  }
  return streakCount;
};
```

2. 修改 `getFeedbackMessage` 中的 streak 引用——改用 `streakDays` state（由外部传入或从 SnowballContext 获取）：

将 `getFeedbackMessage` 中 `case 'streak'` 分支的 `calculateStreakDays()` 调用改为使用已有的 `streakDays` state：

```typescript
case 'streak': {
  return `连续第${streakDays}天！🔥`;
}
```

注意：`streakDays` state 已在 hook 中定义（第 102 行 `const [streakDays, setStreakDays] = useState(1)`），且之前由 `calculateStreakDays()` 设置。现在改为从 SnowballContext 获取。

3. 新增 SnowballContext 引入：

```typescript
import { useSnowball } from '@/contexts/SnowballContext';
```

在 hook 函数体内新增：

```typescript
const { stats } = useSnowball();
```

4. 将 `streakDays` state 的初始化改为从 Context 获取：

```typescript
const streakDays = stats.todayStreak || 1;
```

删除 `setStreakDays` 调用（不再需要本地 state 管理）。

5. 移除 `streakDays` 和 `setStreakDays` 的 useState 声明。

- [ ] **Step 4: 运行 TypeScript 类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: Commit**

```bash
git add src/contexts/SnowballContext.tsx src/app/page.tsx src/hooks/useRecords.ts
git commit -m "refactor: frontend uses refresh-driven scoring, removes optimistic update and local streak calc"
```

---

### Task 10: 全量验证——运行所有测试 + TypeScript 检查

**Files:**
- 可能需要修复的测试文件

- [ ] **Step 1: 运行全量测试**

Run: `npx vitest run`
Expected: 所有测试通过

- [ ] **Step 2: 运行 TypeScript 类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: 修复任何失败的测试或类型错误**

根据具体错误逐一修复。常见问题：
- challenges 路由测试可能需要 mock score-engine
- records 路由测试可能需要 mock score-engine
- stats 路由测试的 mock 可能需要更新

- [ ] **Step 4: 再次运行全量测试确认**

Run: `npx vitest run`
Expected: 所有测试通过

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: update test mocks and fix type errors after score logic refactor"
```

---

## Self-Review Checklist

### 1. Spec Coverage

| Spec 变更 | 对应 Task |
|-----------|----------|
| 4.1 新增 Score Engine 模块 | Task 3 |
| 4.2 后端重算纳入挑战事件分数 | Task 4 + Task 5 |
| 4.3 /api/snowball/stats 读取挑战事件 | Task 5 |
| 4.4 挑战路由使用 Score Engine | Task 7 |
| 4.5 local-db 移除 snowball_size 和 total_score | Task 8 |
| 4.6 前端 addScore 改为 API 返回值驱动 | Task 9 |
| 4.7 统一连续天数计算 | Task 9 (useRecords) + Task 6 (STREAK_DAY 事件) |
| 4.8 local-db 新增 score_events 集合 | Task 2 |
| 已确认决策1: 挑战分数由等级决定 | Task 1 (移除常量) + Task 7 (动态分数) |
| 已确认决策2: 连续天数自动加 STREAK_DAY | Task 6 |
| 已确认决策3: 删除 snowball_size 和 total_score | Task 8 |

### 2. Placeholder Scan

- ✅ 无 TBD / TODO / implement later
- ✅ 无 "add appropriate error handling"
- ✅ 无 "write tests for the above"（所有测试代码已写出）
- ✅ 无 "similar to Task N"
- ✅ 所有步骤包含具体代码

### 3. Type Consistency

- `ScoreEvent` 接口在 local-db.ts 定义，score-engine.ts 使用 `db.addScoreEvent` 传入 `Omit<..., 'id'>`
- `calculateTotalStats` 签名从 `(records, tasks, challenges?)` 改为 `(records, tasks, eventScore?)`
- `addChallengeScoreEvent(userId, challengeId, score, isMilestone)` 在 score-engine.ts 定义，challenges/route.ts 调用
- `addScoreEvent(userId, action, refId?)` 在 score-engine.ts 定义，records/route.ts 调用
- `calculateEventScore(userId)` 在 score-engine.ts 定义，stats/route.ts 调用
- `ScoreAction` 类型不再包含 `CHALLENGE_MILESTONE` / `CHALLENGE_COMPLETED`
