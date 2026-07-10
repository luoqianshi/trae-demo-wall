# 成就庆祝触发系统修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 确保每一个成就条件达成时都能正确触发突破记录的庆祝效果，修复所有缺失或不正确的成就触发点。

**Architecture:** 分析现有成就触发系统，识别所有触发点，统一触发模式：调用 `checkAchievements({ skipCelebration: true })` → 获取返回的 `newlyUnlocked` → 如果有新成就则调用 `triggerAchievementCelebration(newlyUnlocked)`。

**Tech Stack:** Next.js App Router, TypeScript, React Hooks

---

## 问题分析

### 当前成就触发点状态

| 触发场景 | 触发位置 | 成就类型 | 现状 | 问题 |
|---------|---------|---------|------|------|
| 创建记录 | useRecords.ts | records_*, streak_*, hidden_* | ✅ 正确 | 无 |
| 创建目标 | useGoals.ts | goal_first, goal_3 | ⚠️ 部分 | 未处理返回值 |
| 完成目标 | useGoals.ts | goal_complete | ⚠️ 部分 | 未处理返回值 |
| 完成任务 | useTasks.ts | task_first, task_5, task_10 | ⚠️ 部分 | 未处理返回值 |
| 完成挑战 | useChallenges.ts | challenge_* | ⚠️ 部分 | 未处理返回值 |
| 雪球互动 | SnowballAnimation.tsx | interact_*, hidden_clicker | ❌ 缺失 | 未调用成就检查 |
| 拖延急救 | useProcrastination.ts | first_procrastination | ⚠️ 部分 | 未处理返回值 |

### 核心问题

`useAchievements.ts` 中的 `checkAchievements()` 函数：
- 默认 `skipCelebration: false`，会自动触发庆祝
- 但返回值 `newlyUnlocked` 未被各 hook 捕获和处理
- 导致庆祝效果可能触发，但无法确保 UI 反馈正确

### 正确模式（参考 useRecords.ts）

```typescript
const newlyUnlocked = await checkAchievements({ skipCelebration: true, ... });
if (newlyUnlocked.length > 0) {
  triggerAchievementCelebration(newlyUnlocked);
}
```

---

## File Structure

| File | Responsibility | Action |
|------|---------------|--------|
| `src/hooks/useGoals.ts` | 目标创建/完成触发成就 | Modify |
| `src/hooks/useTasks.ts` | 任务完成触发成就 | Modify |
| `src/hooks/useChallenges.ts` | 挑战完成触发成就 | Modify |
| `src/hooks/useProcrastination.ts` | 拖延急救触发成就 | Modify |
| `src/hooks/useAchievements.ts` | 雪球互动成就检查 | Modify |
| `src/app/components/SnowballAnimation.tsx` | 雪球互动触发成就检查 | Modify |
| `src/app/components/SnowballStageCard.tsx` | 雪球互动触发成就检查 | Modify |

---

### Task 1: 修复 useGoals.ts - 创建/完成目标后触发庆祝

**Files:**
- Modify: `src/hooks/useGoals.ts`

- [ ] **Step 1: 导入 triggerAchievementCelebration**

在文件顶部添加导入：

```typescript
import { triggerAchievementCelebration } from '@/app/components/GlobalCelebration';
```

- [ ] **Step 2: 修改 createGoal 函数**

将第 90 行的 `await checkAchievements();` 替换为：

```typescript
const newlyUnlocked = await checkAchievements({ skipCelebration: true });
if (newlyUnlocked.length > 0) {
  triggerAchievementCelebration(newlyUnlocked);
}
```

- [ ] **Step 3: 修改 updateGoal 函数**

将第 131 行的 `await checkAchievements();` 替换为：

```typescript
const newlyUnlocked = await checkAchievements({ skipCelebration: true });
if (newlyUnlocked.length > 0) {
  triggerAchievementCelebration(newlyUnlocked);
}
```

- [ ] **Step 4: 验证修改**

运行类型检查确保无错误。

---

### Task 2: 修复 useTasks.ts - 任务完成后触发庆祝

**Files:**
- Modify: `src/hooks/useTasks.ts`

- [ ] **Step 1: 导入 triggerAchievementCelebration**

在文件顶部添加导入：

```typescript
import { triggerAchievementCelebration } from '@/app/components/GlobalCelebration';
```

- [ ] **Step 2: 修改 updateTaskStatusOptimistic 函数**

将第 393 行的 `await checkAchievements();` 替换为：

```typescript
const newlyUnlocked = await checkAchievements({ skipCelebration: true });
if (newlyUnlocked.length > 0) {
  triggerAchievementCelebration(newlyUnlocked);
}
```

- [ ] **Step 3: 修改 checkinHabit 函数**

将第 499 行的 `await checkAchievements();` 替换为：

```typescript
const newlyUnlocked = await checkAchievements({ skipCelebration: true });
if (newlyUnlocked.length > 0) {
  triggerAchievementCelebration(newlyUnlocked);
}
```

- [ ] **Step 4: 验证修改**

运行类型检查确保无错误。

---

### Task 3: 修复 useChallenges.ts - 挑战完成后触发庆祝

**Files:**
- Modify: `src/hooks/useChallenges.ts`

- [ ] **Step 1: 导入 triggerAchievementCelebration**

在文件顶部添加导入：

```typescript
import { triggerAchievementCelebration } from '@/app/components/GlobalCelebration';
```

- [ ] **Step 2: 修改 completeChallenge 函数**

将第 248 行的 `await checkAchievements();` 替换为：

```typescript
const newlyUnlocked = await checkAchievements({ skipCelebration: true });
if (newlyUnlocked.length > 0) {
  triggerAchievementCelebration(newlyUnlocked);
}
```

- [ ] **Step 3: 验证修改**

运行类型检查确保无错误。

---

### Task 4: 修复 useProcrastination.ts - 拖延急救完成后触发庆祝

**Files:**
- Modify: `src/hooks/useProcrastination.ts`

- [ ] **Step 1: 导入 triggerAchievementCelebration**

在文件顶部添加导入：

```typescript
import { triggerAchievementCelebration } from '@/app/components/GlobalCelebration';
```

- [ ] **Step 2: 修改 completeStep 函数**

将第 120 行的 `checkAchievements().catch(err => console.error('checkAchievements failed:', err));` 替换为：

```typescript
checkAchievements({ skipCelebration: true })
  .then(newlyUnlocked => {
    if (newlyUnlocked.length > 0) {
      triggerAchievementCelebration(newlyUnlocked);
    }
  })
  .catch(err => console.error('checkAchievements failed:', err));
```

- [ ] **Step 3: 验证修改**

运行类型检查确保无错误。

---

### Task 5: 修复雪球互动 - 检查成就并触发庆祝

**Files:**
- Modify: `src/hooks/useAchievements.ts`
- Modify: `src/app/components/SnowballAnimation.tsx`
- Modify: `src/app/components/SnowballStageCard.tsx`

- [ ] **Step 1: 在 useAchievements.ts 添加 checkInteractAchievements 函数**

在 `useAchievements` 函数之前添加新函数：

```typescript
export async function checkInteractAchievements(token: string | null): Promise<string[]> {
  if (!token) return [];
  
  try {
    const response = await fetch('/api/achievements', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
        const achievementIds = data.newlyUnlocked.map((ach: any) => ach.id);
        emitAchievementStateChange({
          type: 'unlocked',
          achievementIds,
          timestamp: Date.now(),
        });
        triggerAchievementCelebration(achievementIds);
        return achievementIds;
      }
    }
  } catch (err) {
    console.error('Failed to check interact achievements:', err);
  }
  
  return [];
}
```

- [ ] **Step 2: 在 SnowballAnimation.tsx 导入并使用新函数**

在文件顶部添加导入：

```typescript
import { incrementSnowballInteractions, incrementSnowballClicks, checkInteractAchievements } from '@/hooks/useAchievements';
```

修改 `handleClick` 函数，在 `setTimeout` 回调中添加成就检查：

```typescript
const handleClick = useCallback(() => {
  clickCountRef.current += 1;
  incrementSnowballClicks();

  if (clickCountRef.current === 1) {
    clickTimerRef.current = setTimeout(async () => {
      if (clickCountRef.current === 1) {
        setInteractionExpression('pet');
        onInteract?.('pet');
        incrementSnowballInteractions();
        analytics.trackSnowballInteract('pet', currentStage);
        
        const token = localStorage.getItem('token');
        await checkInteractAchievements(token);
        
        setTimeout(() => setInteractionExpression(null), 900);
      }
      clickCountRef.current = 0;
    }, 250);
  }

  if (clickCountRef.current >= 2) {
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickCountRef.current = 0;
    setInteractionExpression('shake');
    onInteract?.('shake');
    incrementSnowballInteractions();
    analytics.trackSnowballInteract('shake', currentStage);
    
    setTimeout(async () => {
      const token = localStorage.getItem('token');
      await checkInteractAchievements(token);
    }, 0);
    
    setTimeout(() => setInteractionExpression(null), 900);
  }
}, [onInteract, currentStage]);
```

- [ ] **Step 3: 在 SnowballStageCard.tsx 导入并使用新函数**

在文件顶部添加导入：

```typescript
import { incrementSnowballInteractions, incrementSnowballClicks, checkInteractAchievements } from '@/hooks/useAchievements';
```

修改 onClick 处理：

```typescript
onClick={async () => {
  onInteract?.('pet');
  incrementSnowballInteractions();
  incrementSnowballClicks();
  const token = localStorage.getItem('token');
  await checkInteractAchievements(token);
}}
```

- [ ] **Step 4: 验证修改**

运行类型检查确保无错误。

---

### Task 6: 运行构建验证

- [ ] **Step 1: 运行类型检查**

```bash
npm run build
```

预期：构建成功，无类型错误。

- [ ] **Step 2: 运行测试**

```bash
npm test
```

预期：所有测试通过。

---

## 成就触发点完整覆盖验证清单

| 成就ID | 触发条件 | 触发位置 | 修复状态 |
|--------|---------|---------|---------|
| records_1 ~ records_200 | 创建记录 | useRecords.ts | ✅ 已正确 |
| streak_3 ~ streak_365 | 连续记录 | useRecords.ts | ✅ 已正确 |
| hidden_midnight | 深夜记录 | useRecords.ts | ✅ 已正确 |
| hidden_perfect | 500字记录 | useRecords.ts | ✅ 已正确 |
| goal_first | 创建第1个目标 | useGoals.ts | 🔧 待修复 |
| goal_3 | 创建第3个目标 | useGoals.ts | 🔧 待修复 |
| goal_complete | 完成目标 | useGoals.ts | 🔧 待修复 |
| task_first | 完成第1个任务 | useTasks.ts | 🔧 待修复 |
| task_5 | 完成5个任务 | useTasks.ts | 🔧 待修复 |
| task_10 | 完成10个任务 | useTasks.ts | 🔧 待修复 |
| challenge_first | 完成第1个挑战 | useChallenges.ts | 🔧 待修复 |
| challenge_bronze_5 | 完成5个青铜挑战 | useChallenges.ts | 🔧 待修复 |
| challenge_silver_1 | 完成1个白银挑战 | useChallenges.ts | 🔧 待修复 |
| challenge_gold_1 | 完成1个黄金挑战 | useChallenges.ts | 🔧 待修复 |
| challenge_all_types | 完成所有类型挑战 | useChallenges.ts | 🔧 待修复 |
| challenge_10 | 完成10个挑战 | useChallenges.ts | 🔧 待修复 |
| interact_first ~ interact_100 | 雪球互动 | SnowballAnimation.tsx | 🔧 待修复 |
| hidden_clicker | 点击雪球10次 | SnowballAnimation.tsx | 🔧 待修复 |
| first_procrastination | 首次拖延急救 | useProcrastination.ts | 🔧 待修复 |
| master_all | 解锁所有其他成就 | 自动触发 | ✅ 已正确 |
