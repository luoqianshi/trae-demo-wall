# 成就系统全面完善 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 系统梳理并全面完善成就系统，修复已知 bug，重构为模块化架构，实现进度跟踪与展示，完善奖励关联机制，补充测试覆盖。

**Architecture:** 采用条件评估器（Condition Evaluator）模式重构成就判定逻辑，将硬编码的 conditionMap 替换为可扩展的评估函数注册表。统计数据从 localStorage 迁移到服务端 local-db，确保数据一致性。成就与奖励建立显式关联，前端增加进度条展示。

**Tech Stack:** Next.js App Router, TypeScript, Vitest, Framer Motion, local-db (JSON)

---

## File Structure

| File | Responsibility | Action |
|------|---------------|--------|
| `src/lib/data-models.ts` | 成就定义、类型、条件评估器接口 | Modify |
| `src/lib/achievement-engine.ts` | 成就条件评估引擎（新建，模块化核心） | Create |
| `src/lib/local-db.ts` | 数据持久化、getUserStats 扩展 | Modify |
| `src/lib/achievement-events.ts` | 事件总线（保持不变） | - |
| `src/hooks/useAchievements.ts` | 成就 Hook、进度计算 | Modify |
| `src/app/api/achievements/route.ts` | 成就 API（合并 check 逻辑） | Modify |
| `src/app/api/achievements/check/route.ts` | 删除（合并到主 route） | Delete |
| `src/app/api/rewards/route.ts` | 奖励 API、补充称号 | Modify |
| `src/app/components/AchievementBadge.tsx` | 成就徽章 + 进度条 | Modify |
| `src/app/profile/page.tsx` | 个人中心、进度展示 | Modify |
| `src/lib/__tests__/achievement-check.test.ts` | 成就检查测试 | Modify |
| `src/lib/__tests__/achievement-engine.test.ts` | 成就引擎测试（新建） | Create |

---

### Task 1: 修复 goal_complete 成就无法解锁的 bug

**Files:**
- Modify: `src/lib/local-db.ts:552-588`
- Test: `src/lib/__tests__/achievement-check.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// 在 achievement-check.test.ts 的 describe('checkAndUnlockAchievements') 中添加
describe('goal_complete achievement', () => {
  it('should unlock goal_complete when goals_completed >= 1', () => {
    const stats = makeStats({ goals_count: 3, goals_completed: 1 });
    const unlocked = checkAndUnlockAchievements('1', stats);
    expect(unlocked).toContain('goal_complete');
  });

  it('should not unlock goal_complete when goals_completed is 0', () => {
    const stats = makeStats({ goals_count: 3, goals_completed: 0 });
    const unlocked = checkAndUnlockAchievements('1', stats);
    expect(unlocked).not.toContain('goal_complete');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/achievement-check.test.ts -t "goal_complete"`
Expected: FAIL - goal_complete condition is hardcoded to false

- [ ] **Step 3: Add goals_completed to getUserStats return value**

In `local-db.ts`, modify `getUserStats` to count completed goals:

```typescript
export function getUserStats(userId: string) {
  const data = loadData();
  const goals = data.goals.filter((g: any) => g.user_id === userId);
  const tasks = data.tasks.filter((t: any) => t.user_id === userId);
  const records = data.records.filter((r: any) => r.user_id === userId);
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
  const procrastinationCount = data.procrastinationSessions.filter((s: any) => s.user_id === userId).length;
  const completedGoals = goals.filter((g: any) => g.status === 'completed').length;

  const userChallenges = data.userChallenges.filter((uc: any) => uc.user_id === userId && uc.status === 'completed');
  const challengesCompleted = userChallenges.length;
  const bronzeCompleted = userChallenges.filter((uc: any) => {
    const challenge = data.challenges.find((c: any) => c.id === uc.challenge_id);
    return challenge && challenge.difficulty === 'bronze';
  }).length;
  const silverCompleted = userChallenges.filter((uc: any) => {
    const challenge = data.challenges.find((c: any) => c.id === uc.challenge_id);
    return challenge && challenge.difficulty === 'silver';
  }).length;
  const goldCompleted = userChallenges.filter((uc: any) => {
    const challenge = data.challenges.find((c: any) => c.id === uc.challenge_id);
    return challenge && challenge.difficulty === 'gold';
  }).length;

  // ... streak calculation stays the same ...

  return {
    goals_count: goals.length,
    goals_completed: completedGoals,
    completed_tasks: completedTasks,
    records_count: records.length,
    streak_days: streakDays,
    progress: goals.length > 0 ? Math.max(...goals.map((g: any) => g.progress)) : 0,
    procrastination_count: procrastinationCount,
    challenges_completed: challengesCompleted,
    bronze_completed: bronzeCompleted,
    silver_completed: silverCompleted,
    gold_completed: goldCompleted,
  };
}
```

- [ ] **Step 4: Fix goal_complete condition in checkAndUnlockAchievements**

In `local-db.ts`, change line 506 from `goal_complete: false` to:

```typescript
goal_complete: (stats as any).goals_completed >= 1,
```

- [ ] **Step 5: Update checkAndUnlockAchievements stats type to include goals_completed**

Add `goals_completed` to the stats parameter type:

```typescript
export function checkAndUnlockAchievements(userId: string, stats: {
  goals_count: number;
  goals_completed?: number;
  completed_tasks: number;
  // ... rest stays the same
}): string[] {
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/achievement-check.test.ts -t "goal_complete"`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/local-db.ts src/lib/__tests__/achievement-check.test.ts
git commit -m "fix: enable goal_complete achievement by tracking goals_completed in getUserStats"
```

---

### Task 2: 修复 hidden_midnight 和 hidden_perfect 成就无法解锁的 bug

**Files:**
- Modify: `src/hooks/useRecords.ts`
- Modify: `src/hooks/useAchievements.ts`
- Modify: `src/app/api/achievements/route.ts`
- Test: `src/lib/__tests__/achievement-check.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
describe('hidden achievements', () => {
  it('should unlock hidden_midnight when midnight_record is true', () => {
    const stats = makeStats({ midnight_record: true });
    const unlocked = checkAndUnlockAchievements('1', stats);
    expect(unlocked).toContain('hidden_midnight');
  });

  it('should unlock hidden_perfect when record_500_words is true', () => {
    const stats = makeStats({ record_500_words: true });
    const unlocked = checkAndUnlockAchievements('1', stats);
    expect(unlocked).toContain('hidden_perfect');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/achievement-check.test.ts -t "hidden achievements"`
Expected: FAIL - midnight_record and record_500_words are not passed correctly

- [ ] **Step 3: Modify useAchievements to accept and pass context data**

In `useAchievements.ts`, update `checkAchievements` to accept optional context:

```typescript
const checkAchievements = useCallback(async (options?: {
  skipCelebration?: boolean;
  midnight_record?: boolean;
  record_500_words?: boolean;
}): Promise<string[]> => {
  if (!token) return [];

  try {
    const snowball_interactions = getSnowballInteractions();
    const snowball_clicks = getSnowballClicks();

    const response = await fetch('/api/achievements', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snowball_interactions,
        snowball_clicks,
        midnight_record: options?.midnight_record ?? false,
        record_500_words: options?.record_500_words ?? false,
      }),
    });
    // ... rest stays the same
  } catch (err) {
    console.error('Failed to check achievements:', err);
  }
  return [];
}, [token]);
```

- [ ] **Step 4: Modify useRecords to pass midnight_record and record_500_words when creating a record**

In `useRecords.ts`, find where `checkAchievements()` is called after `createRecord` and update:

```typescript
const currentHour = new Date().getHours();
const isMidnight = currentHour >= 22 || currentHour < 6;
const isLongRecord = (data.content || '').length >= 500;
await checkAchievements({
  midnight_record: isMidnight,
  record_500_words: isLongRecord,
});
```

- [ ] **Step 5: Verify API route already handles these fields**

In `achievements/route.ts`, confirm lines 60-61 already read `clientData.midnight_record` and `clientData.record_500_words`. They do — no change needed.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/achievement-check.test.ts -t "hidden achievements"`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useAchievements.ts src/hooks/useRecords.ts src/lib/__tests__/achievement-check.test.ts
git commit -m "fix: enable hidden_midnight and hidden_perfect achievements by passing context from useRecords"
```

---

### Task 3: 创建模块化成就引擎 (achievement-engine.ts)

**Files:**
- Create: `src/lib/achievement-engine.ts`
- Modify: `src/lib/data-models.ts`
- Test: `src/lib/__tests__/achievement-engine.test.ts`

- [ ] **Step 1: Write the test for achievement engine**

Create `src/lib/__tests__/achievement-engine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  evaluateCondition,
  calculateProgress,
  getAchievementsByCategory,
  getAchievementChain,
  ACHIEVEMENT_CONDITIONS,
} from '../achievement-engine';
import { achievementDefinitions } from '../data-models';

describe('Achievement Engine', () => {
  describe('ACHIEVEMENT_CONDITIONS registry', () => {
    it('should have a condition function for every non-master achievement', () => {
      const nonMaster = achievementDefinitions.filter(a => a.id !== 'master_all');
      for (const ach of nonMaster) {
        expect(ACHIEVEMENT_CONDITIONS[ach.id]).toBeDefined();
        expect(typeof ACHIEVEMENT_CONDITIONS[ach.id].evaluate).toBe('function');
      }
    });
  });

  describe('evaluateCondition', () => {
    it('should return true for records_1 when records_count >= 1', () => {
      expect(evaluateCondition('records_1', { records_count: 1 })).toBe(true);
    });

    it('should return false for records_1 when records_count = 0', () => {
      expect(evaluateCondition('records_1', { records_count: 0 })).toBe(false);
    });

    it('should return true for challenge_all_types when all challenge types completed', () => {
      expect(evaluateCondition('challenge_all_types', {
        bronze_completed: 1,
        silver_completed: 1,
        gold_completed: 1,
      })).toBe(true);
    });

    it('should return false for challenge_all_types when missing a type', () => {
      expect(evaluateCondition('challenge_all_types', {
        bronze_completed: 1,
        silver_completed: 0,
        gold_completed: 1,
      })).toBe(false);
    });

    it('should return true for hidden_midnight when midnight_record is true', () => {
      expect(evaluateCondition('hidden_midnight', { midnight_record: true })).toBe(true);
    });

    it('should return true for hidden_perfect when record_500_words is true', () => {
      expect(evaluateCondition('hidden_perfect', { record_500_words: true })).toBe(true);
    });
  });

  describe('calculateProgress', () => {
    it('should return 1.0 for records_1 when records_count >= 1', () => {
      expect(calculateProgress('records_1', { records_count: 1 })).toBe(1);
    });

    it('should return 0.5 for records_30 when records_count = 15', () => {
      expect(calculateProgress('records_30', { records_count: 15 })).toBeCloseTo(0.5);
    });

    it('should return 0 for streak_7 when streak_days = 0', () => {
      expect(calculateProgress('streak_7', { streak_days: 0 })).toBe(0);
    });

    it('should cap progress at 1.0', () => {
      expect(calculateProgress('records_1', { records_count: 100 })).toBe(1);
    });

    it('should return 0 or 1 for boolean conditions', () => {
      expect(calculateProgress('hidden_midnight', { midnight_record: false })).toBe(0);
      expect(calculateProgress('hidden_midnight', { midnight_record: true })).toBe(1);
    });
  });

  describe('getAchievementsByCategory', () => {
    it('should group achievements by category', () => {
      const grouped = getAchievementsByCategory();
      expect(grouped['记录']).toBeDefined();
      expect(grouped['记录'].length).toBeGreaterThan(0);
      expect(grouped['连续']).toBeDefined();
      expect(grouped['隐藏']).toBeDefined();
    });
  });

  describe('getAchievementChain', () => {
    it('should return ordered chain for records category', () => {
      const chain = getAchievementChain('记录');
      expect(chain[0].id).toBe('records_1');
      expect(chain[chain.length - 1].id).toBe('records_200');
    });

    it('should return ordered chain for streak category', () => {
      const chain = getAchievementChain('连续');
      expect(chain[0].id).toBe('streak_3');
      expect(chain[chain.length - 1].id).toBe('streak_365');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/achievement-engine.test.ts`
Expected: FAIL - module not found

- [ ] **Step 3: Add AchievementCondition interface to data-models.ts**

Append to `src/lib/data-models.ts`:

```typescript
export interface AchievementCondition {
  evaluate: (stats: Record<string, any>) => boolean;
  progress: (stats: Record<string, any>) => number;
  threshold: { field: string; value: number | boolean } | null;
}
```

- [ ] **Step 4: Create achievement-engine.ts**

Create `src/lib/achievement-engine.ts`:

```typescript
import { achievementDefinitions, type AchievementCondition } from './data-models';

type Stats = Record<string, number | boolean>;

function numericCondition(field: string, threshold: number): AchievementCondition {
  return {
    evaluate: (stats) => (stats[field] as number) >= threshold,
    progress: (stats) => Math.min(1, (stats[field] as number) / threshold),
    threshold: { field, value: threshold },
  };
}

function booleanCondition(field: string): AchievementCondition {
  return {
    evaluate: (stats) => !!stats[field],
    progress: (stats) => (stats[field] ? 1 : 0),
    threshold: null,
  };
}

function compositeCondition(check: (stats: Stats) => boolean, fields: string[]): AchievementCondition {
  return {
    evaluate: (stats) => check(stats),
    progress: (stats) => {
      const met = fields.filter(f => !!stats[f]).length;
      return fields.length > 0 ? met / fields.length : 0;
    },
    threshold: null,
  };
}

export const ACHIEVEMENT_CONDITIONS: Record<string, AchievementCondition> = {
  records_1: numericCondition('records_count', 1),
  records_3: numericCondition('records_count', 3),
  records_7: numericCondition('records_count', 7),
  records_14: numericCondition('records_count', 14),
  records_30: numericCondition('records_count', 30),
  records_66: numericCondition('records_count', 66),
  records_100: numericCondition('records_count', 100),
  records_200: numericCondition('records_count', 200),
  streak_3: numericCondition('streak_days', 3),
  streak_7: numericCondition('streak_days', 7),
  streak_14: numericCondition('streak_days', 14),
  streak_21: numericCondition('streak_days', 21),
  streak_30: numericCondition('streak_days', 30),
  streak_66: numericCondition('streak_days', 66),
  streak_100: numericCondition('streak_days', 100),
  streak_365: numericCondition('streak_days', 365),
  challenge_first: numericCondition('challenges_completed', 1),
  challenge_bronze_5: numericCondition('bronze_completed', 5),
  challenge_silver_1: numericCondition('silver_completed', 1),
  challenge_gold_1: numericCondition('gold_completed', 1),
  challenge_all_types: compositeCondition(
    (s) => (s.bronze_completed as number) > 0 && (s.silver_completed as number) > 0 && (s.gold_completed as number) > 0,
    ['bronze_completed', 'silver_completed', 'gold_completed']
  ),
  challenge_10: numericCondition('challenges_completed', 10),
  task_first: numericCondition('completed_tasks', 1),
  task_5: numericCondition('completed_tasks', 5),
  task_10: numericCondition('completed_tasks', 10),
  goal_first: numericCondition('goals_count', 1),
  goal_3: numericCondition('goals_count', 3),
  goal_complete: numericCondition('goals_completed', 1),
  interact_first: numericCondition('snowball_interactions', 1),
  interact_10: numericCondition('snowball_interactions', 10),
  interact_50: numericCondition('snowball_interactions', 50),
  interact_100: numericCondition('snowball_interactions', 100),
  hidden_midnight: booleanCondition('midnight_record'),
  hidden_clicker: numericCondition('snowball_clicks', 10),
  hidden_perfect: booleanCondition('record_500_words'),
  first_procrastination: numericCondition('procrastination_count', 1),
};

export function evaluateCondition(achievementId: string, stats: Stats): boolean {
  const condition = ACHIEVEMENT_CONDITIONS[achievementId];
  if (!condition) return false;
  return condition.evaluate(stats);
}

export function calculateProgress(achievementId: string, stats: Stats): number {
  const condition = ACHIEVEMENT_CONDITIONS[achievementId];
  if (!condition) return 0;
  return condition.progress(stats);
}

export function getAchievementsByCategory(): Record<string, typeof achievementDefinitions> {
  const grouped: Record<string, typeof achievementDefinitions> = {};
  for (const ach of achievementDefinitions) {
    if (!grouped[ach.category]) grouped[ach.category] = [];
    grouped[ach.category].push(ach);
  }
  return grouped;
}

const CATEGORY_ORDER: Record<string, string[]> = {
  '记录': ['records_1', 'records_3', 'records_7', 'records_14', 'records_30', 'records_66', 'records_100', 'records_200'],
  '连续': ['streak_3', 'streak_7', 'streak_14', 'streak_21', 'streak_30', 'streak_66', 'streak_100', 'streak_365'],
  '挑战': ['challenge_first', 'challenge_bronze_5', 'challenge_silver_1', 'challenge_gold_1', 'challenge_all_types', 'challenge_10'],
  '任务': ['task_first', 'task_5', 'task_10'],
  '目标': ['goal_first', 'goal_3', 'goal_complete'],
  '互动': ['interact_first', 'interact_10', 'interact_50', 'interact_100'],
};

export function getAchievementChain(category: string): typeof achievementDefinitions {
  const order = CATEGORY_ORDER[category];
  if (!order) return [];
  return order
    .map(id => achievementDefinitions.find(a => a.id === id))
    .filter(Boolean) as typeof achievementDefinitions;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/achievement-engine.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/achievement-engine.ts src/lib/data-models.ts src/lib/__tests__/achievement-engine.test.ts
git commit -m "feat: create modular achievement engine with condition evaluators and progress tracking"
```

---

### Task 4: 重构 local-db checkAndUnlockAchievements 使用成就引擎

**Files:**
- Modify: `src/lib/local-db.ts:460-550`
- Test: `src/lib/__tests__/achievement-check.test.ts`

- [ ] **Step 1: Write test to verify engine-based check still passes existing tests**

No new test needed — existing `achievement-check.test.ts` tests should still pass after refactoring.

- [ ] **Step 2: Refactor checkAndUnlockAchievements to use achievement engine**

Replace the hardcoded `conditionMap` in `local-db.ts`:

```typescript
import { evaluateCondition } from './achievement-engine';

export function checkAndUnlockAchievements(userId: string, stats: {
  goals_count: number;
  goals_completed?: number;
  completed_tasks: number;
  records_count: number;
  streak_days: number;
  procrastination_count: number;
  challenges_completed?: number;
  bronze_completed?: number;
  silver_completed?: number;
  gold_completed?: number;
  snowball_interactions?: number;
  snowball_clicks?: number;
  midnight_record?: boolean;
  record_500_words?: boolean;
}): string[] {
  const data = loadData();
  const newlyUnlocked: string[] = [];

  for (const achievement of achievementDefinitions) {
    if (achievement.id === 'master_all') continue;
    const alreadyUnlocked = data.userAchievements.some(
      (a: any) => a.user_id === userId && a.achievement_id === achievement.id
    );
    if (!alreadyUnlocked && evaluateCondition(achievement.id, stats as Record<string, any>)) {
      data.userAchievements.push({
        user_id: userId,
        achievement_id: achievement.id,
        unlocked_at: new Date().toISOString(),
      });
      newlyUnlocked.push(achievement.id);
    }
  }

  const allOthersUnlocked = achievementDefinitions
    .filter(a => a.id !== 'master_all')
    .every(a => data.userAchievements.some((ua: any) => ua.user_id === userId && ua.achievement_id === a.id));

  const alreadyMasterUnlocked = data.userAchievements.some(
    (a: any) => a.user_id === userId && a.achievement_id === 'master_all'
  );
  if (allOthersUnlocked && !alreadyMasterUnlocked) {
    data.userAchievements.push({
      user_id: userId,
      achievement_id: 'master_all',
      unlocked_at: new Date().toISOString(),
    });
    newlyUnlocked.push('master_all');
  }

  saveData();
  return newlyUnlocked;
}
```

- [ ] **Step 3: Run all achievement tests to verify no regression**

Run: `npx vitest run src/lib/__tests__/achievement-check.test.ts`
Expected: PASS (all existing tests still pass)

- [ ] **Step 4: Commit**

```bash
git add src/lib/local-db.ts
git commit -m "refactor: replace hardcoded conditionMap with achievement engine in checkAndUnlockAchievements"
```

---

### Task 5: 完善 getUserStats 补充挑战相关统计指标

**Files:**
- Modify: `src/lib/local-db.ts:552-588`
- Test: `src/lib/__tests__/achievement-check.test.ts`

- [ ] **Step 1: Write test for challenge stats in getUserStats**

```typescript
describe('getUserStats challenge stats', () => {
  it('should return challenges_completed count', () => {
    const stats = getUserStats('1');
    expect(stats).toHaveProperty('challenges_completed');
    expect(stats).toHaveProperty('bronze_completed');
    expect(stats).toHaveProperty('silver_completed');
    expect(stats).toHaveProperty('gold_completed');
  });
});
```

- [ ] **Step 2: Run test to verify it fails or returns undefined**

Run: `npx vitest run src/lib/__tests__/achievement-check.test.ts -t "challenge stats"`
Expected: FAIL or undefined values

- [ ] **Step 3: Add challenge stats to getUserStats (already done in Task 1 Step 3)**

Verify that `getUserStats` now returns `challenges_completed`, `bronze_completed`, `silver_completed`, `gold_completed`.

- [ ] **Step 4: Update API route to pass challenge stats to checkAndUnlockAchievements**

In `src/app/api/achievements/route.ts`, the `fullStats` object should now include challenge stats from `getUserStats`:

```typescript
const fullStats = {
  ...stats,
  snowball_interactions: clientData.snowball_interactions || 0,
  snowball_clicks: clientData.snowball_clicks || 0,
  midnight_record: clientData.midnight_record || false,
  record_500_words: clientData.record_500_words || false,
};
```

Since `stats` already includes `challenges_completed`, `bronze_completed`, etc. from `getUserStats`, the spread `...stats` covers them.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/achievement-check.test.ts -t "challenge stats"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/local-db.ts src/app/api/achievements/route.ts src/lib/__tests__/achievement-check.test.ts
git commit -m "feat: add challenge stats to getUserStats for complete achievement condition evaluation"
```

---

### Task 6: 将互动/点击计数从 localStorage 迁移到服务端

**Files:**
- Modify: `src/lib/local-db.ts` (add interaction tracking)
- Modify: `src/hooks/useAchievements.ts`
- Modify: `src/app/api/achievements/route.ts`
- Test: `src/lib/__tests__/achievement-check.test.ts`

- [ ] **Step 1: Add interaction tracking to local-db data model**

In `local-db.ts`, add `userInteractions` to `LocalData` interface:

```typescript
interface LocalData {
  // ... existing fields ...
  userInteractions: Array<{
    user_id: string;
    type: 'snowball_interaction' | 'snowball_click';
    count: number;
    updated_at: string;
  }>;
}
```

Add to `getDefaultData()`:

```typescript
userInteractions: [],
```

- [ ] **Step 2: Add getUserInteractions and incrementUserInteraction functions**

```typescript
export function getUserInteractions(userId: string): { snowball_interactions: number; snowball_clicks: number } {
  const data = loadData();
  const interactions = data.userInteractions.find((i: any) => i.user_id === userId && i.type === 'snowball_interaction');
  const clicks = data.userInteractions.find((i: any) => i.user_id === userId && i.type === 'snowball_click');
  return {
    snowball_interactions: interactions?.count || 0,
    snowball_clicks: clicks?.count || 0,
  };
}

export function incrementUserInteraction(userId: string, type: 'snowball_interaction' | 'snowball_click'): number {
  const data = loadData();
  const idx = data.userInteractions.findIndex((i: any) => i.user_id === userId && i.type === type);
  if (idx !== -1) {
    data.userInteractions[idx].count += 1;
    data.userInteractions[idx].updated_at = new Date().toISOString();
    saveData();
    return data.userInteractions[idx].count;
  }
  data.userInteractions.push({
    user_id: userId,
    type,
    count: 1,
    updated_at: new Date().toISOString(),
  });
  saveData();
  return 1;
}
```

- [ ] **Step 3: Add API endpoint for incrementing interactions**

Create or modify an API route. Add to `src/app/api/achievements/route.ts`:

```typescript
export async function PATCH(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }
  const { userId } = authResult.context;
  try {
    const body = await request.json();
    const { type } = body;
    if (type !== 'snowball_interaction' && type !== 'snowball_click') {
      return createErrorResponse('Invalid interaction type', 400);
    }
    const newCount = db.incrementUserInteraction(userId, type);
    return createSuccessResponse({ count: newCount });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to track interaction');
  }
}
```

- [ ] **Step 4: Update useAchievements to use server-side interaction tracking**

Modify `useAchievements.ts`:

```typescript
export function useAchievements() {
  const { token } = useAuth();
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<string[]>([]);

  const trackInteraction = useCallback(async (type: 'snowball_interaction' | 'snowball_click'): Promise<number> => {
    if (!token) return 0;
    try {
      const response = await fetch('/api/achievements', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.count || 0;
      }
    } catch (err) {
      console.error('Failed to track interaction:', err);
    }
    return 0;
  }, [token]);

  const checkAchievements = useCallback(async (options?: {
    skipCelebration?: boolean;
    midnight_record?: boolean;
    record_500_words?: boolean;
  }): Promise<string[]> => {
    if (!token) return [];
    try {
      const response = await fetch('/api/achievements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          midnight_record: options?.midnight_record ?? false,
          record_500_words: options?.record_500_words ?? false,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
          setNewlyUnlockedAchievements(data.newlyUnlocked);
          emitAchievementStateChange({
            type: 'unlocked',
            achievementIds: data.newlyUnlocked,
            timestamp: Date.now(),
          });
          if (!options?.skipCelebration) {
            triggerAchievementCelebration(data.newlyUnlocked);
          }
          return data.newlyUnlocked;
        }
      }
    } catch (err) {
      console.error('Failed to check achievements:', err);
    }
    return [];
  }, [token]);

  const resetNewlyUnlocked = useCallback(() => {
    setNewlyUnlockedAchievements([]);
  }, []);

  return {
    newlyUnlockedAchievements,
    checkAchievements,
    trackInteraction,
    resetNewlyUnlocked,
  };
}
```

- [ ] **Step 5: Update API route to get interactions from server instead of client**

In `achievements/route.ts` POST handler, replace client-provided interaction data with server-side data:

```typescript
const stats = db.getUserStats(userId);
const interactions = db.getUserInteractions(userId);

const fullStats = {
  ...stats,
  ...interactions,
  midnight_record: clientData.midnight_record || false,
  record_500_words: clientData.record_500_words || false,
};
```

- [ ] **Step 6: Run all achievement tests**

Run: `npx vitest run src/lib/__tests__/achievement-check.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/local-db.ts src/hooks/useAchievements.ts src/app/api/achievements/route.ts
git commit -m "feat: migrate interaction/click tracking from localStorage to server-side local-db"
```

---

### Task 7: 实现成就进度跟踪与展示功能

**Files:**
- Modify: `src/app/api/achievements/route.ts` (add progress to GET response)
- Modify: `src/app/components/AchievementBadge.tsx` (add progress bar)
- Modify: `src/app/profile/page.tsx` (add progress display)

- [ ] **Step 1: Add progress data to GET /api/achievements response**

In `achievements/route.ts` GET handler:

```typescript
import { calculateProgress } from '@/lib/achievement-engine';

export async function GET(request: NextRequest) {
  // ... auth ...
  try {
    const userAchievements = db.getUserAchievements(userId);
    const unlockedIds = new Set(userAchievements.map((a: any) => a.achievement_id));
    const stats = db.getUserStats(userId);
    const interactions = db.getUserInteractions(userId);
    const fullStats = { ...stats, ...interactions };

    const result = achievementDefinitions.map(ach => ({
      id: ach.id,
      title: ach.title,
      description: ach.description,
      icon: ach.icon,
      level: ach.level,
      category: ach.category,
      unlocked: unlockedIds.has(ach.id),
      unlocked_at: userAchievements.find((ua: any) => ua.achievement_id === ach.id)?.unlocked_at || undefined,
      progress: unlockedIds.has(ach.id) ? 1 : calculateProgress(ach.id, fullStats),
    }));

    return createSuccessResponse({ achievements: result });
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed to get achievements');
  }
}
```

- [ ] **Step 2: Update AchievementData interface in profile page**

```typescript
interface AchievementData {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: AchievementLevel;
  category: string;
  unlocked: boolean;
  unlocked_at?: string;
  progress?: number;
}
```

- [ ] **Step 3: Add progress bar to AchievementBadge component**

In `AchievementBadge.tsx`, add a progress bar for locked achievements:

After the "未解锁" section, add progress display:

```tsx
{!unlocked && typeof achievement.progress === 'number' && achievement.progress > 0 && (
  <div className="mt-2">
    <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
      <span>进度</span>
      <span>{Math.round(achievement.progress * 100)}%</span>
    </div>
    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{
          background: `linear-gradient(to right, ${tier.particleColors[0]}, ${tier.particleColors[1]})`,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${achievement.progress * 100}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  </div>
)}
```

Update `AchievementBadgeProps` to include `progress`:

```typescript
interface AchievementBadgeProps {
  achievement: {
    id: string;
    title: string;
    description: string;
    icon: string;
    level: AchievementLevel;
    category: string;
    progress?: number;
  };
  unlocked: boolean;
  unlockedAt?: string;
  isNewlyUnlocked?: boolean;
}
```

- [ ] **Step 4: Pass progress data through profile page**

In `profile/page.tsx`, pass `progress` to `AchievementBadge`:

```tsx
<AchievementBadge
  key={achievement.id}
  achievement={achievement}
  unlocked={achievement.unlocked}
  unlockedAt={achievement.unlocked_at}
  isNewlyUnlocked={newlyUnlockedIds.has(achievement.id)}
/>
```

Since `achievement` already includes `progress` from the API response, it's automatically passed.

- [ ] **Step 5: Run dev server and visually verify**

Run: `npm run dev`
Navigate to profile page, verify progress bars appear on locked achievements.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/achievements/route.ts src/app/components/AchievementBadge.tsx src/app/profile/page.tsx
git commit -m "feat: add achievement progress tracking and progress bar display"
```

---

### Task 8: 完善奖励系统 - 补充设计文档规划的称号奖励

**Files:**
- Modify: `src/app/api/rewards/route.ts`

- [ ] **Step 1: Add missing title rewards per design document**

In `rewards/route.ts`, expand `TITLE_DEFS` to match the design document's 16 title rewards:

```typescript
const TITLE_DEFS: RewardDef[] = [
  { id: '初心者', name: '初心者', condition: '默认', conditionCheck: () => true },
  { id: '行动派', name: '行动派', condition: '完成第1个任务', conditionCheck: (s) => s.completed_tasks >= 1 },
  { id: '坚持者', name: '坚持者', condition: '连续7天', conditionCheck: (s) => s.streak_days >= 7 },
  { id: '月度记录者', name: '月度记录者', condition: '累计30条记录', conditionCheck: (s) => s.records_count >= 30 },
  { id: '百条达人', name: '百条达人', condition: '累计100条记录', conditionCheck: (s) => s.records_count >= 100 },
  { id: '记录大师', name: '记录大师', condition: '累计200条记录', conditionCheck: (s) => s.records_count >= 200 },
  { id: '月度勇士', name: '月度勇士', condition: '连续30天', conditionCheck: (s) => s.streak_days >= 30 },
  { id: '百日达人', name: '百日达人', condition: '连续100天', conditionCheck: (s) => s.streak_days >= 100 },
  { id: '坚持大师', name: '坚持大师', condition: '连续365天', conditionCheck: (s) => s.streak_days >= 365 },
  { id: '全能挑战者', name: '全能挑战者', condition: '完成所有难度挑战', conditionCheck: (s) => (s as any).all_challenge_types },
  { id: '挑战达人', name: '挑战达人', condition: '完成10个挑战', conditionCheck: (s) => (s as any).challenges_completed >= 10 },
  { id: '任务达人', name: '任务达人', condition: '完成10个任务', conditionCheck: (s) => s.completed_tasks >= 10 },
  { id: '圆梦者', name: '圆梦者', condition: '完成第1个目标', conditionCheck: (s) => (s as any).goals_completed >= 1 },
  { id: '雪球知己', name: '雪球知己', condition: '与雪球互动50次', conditionCheck: (s) => (s as any).snowball_interactions >= 50 },
  { id: '最佳拍档', name: '最佳拍档', condition: '与雪球互动100次', conditionCheck: (s) => (s as any).snowball_interactions >= 100 },
  { id: '雪球大师', name: '雪球大师', condition: '解锁所有其他成就', conditionCheck: (s) => s.all_others_unlocked },
];
```

- [ ] **Step 2: Update RewardDef conditionCheck signature**

```typescript
interface RewardDef {
  id: string;
  name: string;
  condition: string;
  conditionCheck: (stats: {
    streak_days: number;
    records_count: number;
    completed_tasks: number;
    all_others_unlocked: boolean;
    all_challenge_types?: boolean;
    challenges_completed?: number;
    goals_completed?: number;
    snowball_interactions?: number;
  }) => boolean;
}
```

- [ ] **Step 3: Update computeRewards to pass extended stats**

In the GET handler, compute extended stats:

```typescript
const userStats = db.getUserStats(userId);
const interactions = db.getUserInteractions(userId);
const userAchievements = db.getUserAchievements(userId);
const unlockedAchIds = new Set(userAchievements.map(a => a.achievement_id));
const nonMasterAchs = achievementDefinitions.filter(a => a.cond_rule !== 'all_others_unlocked');
const allOthersUnlocked = nonMasterAchs.length > 0 && nonMasterAchs.every(a => unlockedAchIds.has(a.id));

const userChallenges = db.getUserChallenges(userId);
const completedUserChallenges = userChallenges.filter((uc: any) => uc.status === 'completed');
const challenges = db.getChallenges();
const bronzeCompleted = completedUserChallenges.filter((uc: any) => {
  const ch = challenges.find((c: any) => c.id === uc.challenge_id);
  return ch && ch.difficulty === 'bronze';
}).length;
const silverCompleted = completedUserChallenges.filter((uc: any) => {
  const ch = challenges.find((c: any) => c.id === uc.challenge_id);
  return ch && ch.difficulty === 'silver';
}).length;
const goldCompleted = completedUserChallenges.filter((uc: any) => {
  const ch = challenges.find((c: any) => c.id === uc.challenge_id);
  return ch && ch.difficulty === 'gold';
}).length;

const stats = {
  streak_days: userStats.streak_days,
  records_count: userStats.records_count,
  completed_tasks: userStats.completed_tasks,
  all_others_unlocked: allOthersUnlocked,
  all_challenge_types: bronzeCompleted > 0 && silverCompleted > 0 && goldCompleted > 0,
  challenges_completed: completedUserChallenges.length,
  goals_completed: userStats.goals_completed || 0,
  snowball_interactions: interactions.snowball_interactions,
};
```

- [ ] **Step 4: Update total reward count in profile page**

In `profile/page.tsx`, change the hardcoded `/18` to dynamic:

```tsx
{rewardsData && (
  <span className="text-sm text-gray-400 ml-2">
    {rewardsData.unlocked.decorations.length + rewardsData.unlocked.colors.length + rewardsData.unlocked.themes.length + rewardsData.unlocked.titles.length}/{rewardsData.available.decorations.length + rewardsData.available.colors.length + rewardsData.available.themes.length + rewardsData.available.titles.length}
  </span>
)}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/rewards/route.ts src/app/profile/page.tsx
git commit -m "feat: expand title rewards to 16 per design document and update reward stats display"
```

---

### Task 9: 删除冗余的 /api/achievements/check 端点

**Files:**
- Delete: `src/app/api/achievements/check/route.ts`
- Modify: `src/app/profile/page.tsx` (update checkAchievements to use main endpoint)

- [ ] **Step 1: Update profile page checkAchievements to use main endpoint**

In `profile/page.tsx`, change the check URL from `/api/achievements/check` to `/api/achievements`:

```typescript
const response = await fetch('/api/achievements', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ snowball_interactions: 0, snowball_clicks: 0 }),
});
```

- [ ] **Step 2: Delete the check route file**

Delete `src/app/api/achievements/check/route.ts`

- [ ] **Step 3: Run tests to verify no regression**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove redundant /api/achievements/check endpoint, consolidate to main route"
```

---

### Task 10: 编写完整的成就系统测试用例

**Files:**
- Modify: `src/lib/__tests__/achievement-check.test.ts`
- Modify: `src/lib/__tests__/achievement-engine.test.ts`

- [ ] **Step 1: Add comprehensive test coverage for all achievement conditions**

In `achievement-check.test.ts`, add tests for every achievement condition:

```typescript
describe('All achievement conditions', () => {
  const conditionTests: Array<{ id: string; passingStats: any; failingStats: any }> = [
    { id: 'records_1', passingStats: { records_count: 1 }, failingStats: { records_count: 0 } },
    { id: 'records_3', passingStats: { records_count: 3 }, failingStats: { records_count: 2 } },
    { id: 'records_7', passingStats: { records_count: 7 }, failingStats: { records_count: 6 } },
    { id: 'records_14', passingStats: { records_count: 14 }, failingStats: { records_count: 13 } },
    { id: 'records_30', passingStats: { records_count: 30 }, failingStats: { records_count: 29 } },
    { id: 'records_66', passingStats: { records_count: 66 }, failingStats: { records_count: 65 } },
    { id: 'records_100', passingStats: { records_count: 100 }, failingStats: { records_count: 99 } },
    { id: 'records_200', passingStats: { records_count: 200 }, failingStats: { records_count: 199 } },
    { id: 'streak_3', passingStats: { streak_days: 3 }, failingStats: { streak_days: 2 } },
    { id: 'streak_7', passingStats: { streak_days: 7 }, failingStats: { streak_days: 6 } },
    { id: 'streak_14', passingStats: { streak_days: 14 }, failingStats: { streak_days: 13 } },
    { id: 'streak_21', passingStats: { streak_days: 21 }, failingStats: { streak_days: 20 } },
    { id: 'streak_30', passingStats: { streak_days: 30 }, failingStats: { streak_days: 29 } },
    { id: 'streak_66', passingStats: { streak_days: 66 }, failingStats: { streak_days: 65 } },
    { id: 'streak_100', passingStats: { streak_days: 100 }, failingStats: { streak_days: 99 } },
    { id: 'streak_365', passingStats: { streak_days: 365 }, failingStats: { streak_days: 364 } },
    { id: 'challenge_first', passingStats: { challenges_completed: 1 }, failingStats: { challenges_completed: 0 } },
    { id: 'challenge_bronze_5', passingStats: { bronze_completed: 5 }, failingStats: { bronze_completed: 4 } },
    { id: 'challenge_silver_1', passingStats: { silver_completed: 1 }, failingStats: { silver_completed: 0 } },
    { id: 'challenge_gold_1', passingStats: { gold_completed: 1 }, failingStats: { gold_completed: 0 } },
    { id: 'challenge_all_types', passingStats: { bronze_completed: 1, silver_completed: 1, gold_completed: 1 }, failingStats: { bronze_completed: 1, silver_completed: 0, gold_completed: 1 } },
    { id: 'challenge_10', passingStats: { challenges_completed: 10 }, failingStats: { challenges_completed: 9 } },
    { id: 'task_first', passingStats: { completed_tasks: 1 }, failingStats: { completed_tasks: 0 } },
    { id: 'task_5', passingStats: { completed_tasks: 5 }, failingStats: { completed_tasks: 4 } },
    { id: 'task_10', passingStats: { completed_tasks: 10 }, failingStats: { completed_tasks: 9 } },
    { id: 'goal_first', passingStats: { goals_count: 1 }, failingStats: { goals_count: 0 } },
    { id: 'goal_3', passingStats: { goals_count: 3 }, failingStats: { goals_count: 2 } },
    { id: 'goal_complete', passingStats: { goals_completed: 1 }, failingStats: { goals_completed: 0 } },
    { id: 'interact_first', passingStats: { snowball_interactions: 1 }, failingStats: { snowball_interactions: 0 } },
    { id: 'interact_10', passingStats: { snowball_interactions: 10 }, failingStats: { snowball_interactions: 9 } },
    { id: 'interact_50', passingStats: { snowball_interactions: 50 }, failingStats: { snowball_interactions: 49 } },
    { id: 'interact_100', passingStats: { snowball_interactions: 100 }, failingStats: { snowball_interactions: 99 } },
    { id: 'hidden_midnight', passingStats: { midnight_record: true }, failingStats: { midnight_record: false } },
    { id: 'hidden_clicker', passingStats: { snowball_clicks: 10 }, failingStats: { snowball_clicks: 9 } },
    { id: 'hidden_perfect', passingStats: { record_500_words: true }, failingStats: { record_500_words: false } },
    { id: 'first_procrastination', passingStats: { procrastination_count: 1 }, failingStats: { procrastination_count: 0 } },
  ];

  for (const { id, passingStats, failingStats } of conditionTests) {
    it(`should unlock ${id} with passing stats`, () => {
      const unlocked = checkAndUnlockAchievements('1', makeStats(passingStats));
      expect(unlocked).toContain(id);
    });

    it(`should not unlock ${id} with failing stats`, () => {
      const unlocked = checkAndUnlockAchievements('1', makeStats(failingStats));
      expect(unlocked).not.toContain(id);
    });
  }
});
```

- [ ] **Step 2: Add master_all test using direct data manipulation**

```typescript
describe('master_all unlock logic', () => {
  it('should unlock master_all when all other achievements are unlocked', () => {
    const allStats = makeStats({
      records_count: 200,
      streak_days: 365,
      completed_tasks: 10,
      goals_count: 3,
      goals_completed: 1,
      procrastination_count: 1,
      challenges_completed: 10,
      bronze_completed: 5,
      silver_completed: 1,
      gold_completed: 1,
      snowball_interactions: 100,
      snowball_clicks: 10,
      midnight_record: true,
      record_500_words: true,
    });
    const unlocked = checkAndUnlockAchievements('1', allStats);
    expect(unlocked).toContain('master_all');
  });

  it('should not unlock master_all when some achievements are missing', () => {
    const partialStats = makeStats({
      records_count: 200,
      streak_days: 365,
      completed_tasks: 10,
      goals_count: 3,
      procrastination_count: 1,
    });
    const unlocked = checkAndUnlockAchievements('1', partialStats);
    expect(unlocked).not.toContain('master_all');
  });
});
```

- [ ] **Step 3: Add boundary value tests**

```typescript
describe('boundary values', () => {
  it('should unlock exactly at threshold', () => {
    expect(checkAndUnlockAchievements('1', makeStats({ records_count: 7 }))).toContain('records_7');
  });

  it('should not unlock one below threshold', () => {
    expect(checkAndUnlockAchievements('1', makeStats({ records_count: 6 }))).not.toContain('records_7');
  });

  it('should handle very large values', () => {
    const unlocked = checkAndUnlockAchievements('1', makeStats({ records_count: 999999 }));
    expect(unlocked).toContain('records_200');
  });
});
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run src/lib/__tests__/achievement-check.test.ts src/lib/__tests__/achievement-engine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/__tests__/achievement-check.test.ts src/lib/__tests__/achievement-engine.test.ts
git commit -m "test: add comprehensive achievement system tests covering all conditions and boundaries"
```

---

### Task 11: 运行完整测试套件验证所有改动

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 2: Run lint check**

Run: `npx next lint`
Expected: No errors

- [ ] **Step 3: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: No type errors
