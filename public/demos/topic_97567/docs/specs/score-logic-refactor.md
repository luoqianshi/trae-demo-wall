# 雪球得分逻辑重构 Spec

> 版本：v1.0 | 2026-05-18
> 状态：待评审

---

## 一、问题陈述

雪球得分系统存在**三套独立的计分机制**，互不信任、互不同步，导致用户看到的分数与实际分数不一致。

### 1.1 三套计分机制

| 机制 | 位置 | 原理 | 问题 |
|------|------|------|------|
| **前端乐观累加** | `SnowballContext.addScore()` | 用 `SCORE_VALUES[action]` 直接加到 React state | 不持久化，API 失败时分数虚高 |
| **后端实时重算** | `/api/snowball/stats` → `calculateTotalStats()` | 遍历所有 records/tasks/challenges 从头计算 | 不读 growthData，挑战写入的分数被忽略 |
| **挑战路由直写** | `/api/challenges` PUT handler | `db.updateGrowthData({ total_score: ... })` | 写入的 total_score 不被后端重算读取 |

### 1.2 具体症状

1. **分数跳变**：前端 `addScore` 乐观累加后，1 秒后 `refreshStats()` 从后端拉取重算值，分数突然变化
2. **挑战分数丢失**：挑战完成时写入 `growthData.total_score`，但 `/api/snowball/stats` 不读此字段，挑战分数在刷新后消失
3. **记录分数不一致**：`SCORE_VALUES.RECORD_CREATED = 10`，但 `local-db.ts` 中 `snowball_size += 2`
4. **连续天数计算重复**：`snowball-score-calculator.ts` 和 `useRecords.ts` 各有一个 `calculateStreakDays`，逻辑不同
5. **growthData.snowball_size 是死代码**：写入但从未被读取

---

## 二、当前架构分析

### 2.1 数据流图

```
用户操作（创建记录/完成任务/挑战打卡）
  │
  ├──→ 前端 addScore(action)
  │      ├── stats.totalScore += SCORE_VALUES[action]  ← 乐观累加
  │      ├── setTimeout → refreshStats()               ← 1秒后拉后端
  │      └── refreshStats()                            ← 立即拉后端
  │
  ├──→ 后端 API（/api/records, /api/tasks/[id]）
  │      └── local-db.createRecord() → snowball_size += 2  ← 魔法数字
  │      └── local-db.updateTask()  → snowball_size += 5  ← 魔法数字
  │
  └──→ 挑战 API（/api/challenges）
         └── db.updateGrowthData({ total_score: += score })  ← 直写，不被读取

后端重算（/api/snowball/stats）
  └── calculateTotalStats(records, tasks, challenges)
       ├── recordScore = records.length × 10
       ├── taskScore = Σ(各类型完成数 × SCORE_VALUES)
       ├── streakScore = calculateStreakScore(records)
       └── challengeScore = completedChallenges.length × 15
       → totalScore = recordScore + taskScore + streakScore + challengeScore
       ⚠️ 不读 growthData.total_score
       ⚠️ 不读 growthData.snowball_size
```

### 2.2 分数值对比

| 行为 | SCORE_VALUES | local-db 魔法数字 | 后端重算 | 挑战直写 |
|------|-------------|-------------------|---------|---------|
| 创建记录 | 10 | +2 (snowball_size) | records.length × 10 | — |
| 完成普通任务 | 5 | +5 (snowball_size) | normalCompleted × 5 | — |
| 完成快速任务 | 2 | — | quickCompleted × 2 | — |
| 子任务完成 | 5 | — | subtaskCompleted × 5 | — |
| 习惯打卡 | 3 | — | habitCheckins × 3 | — |
| 长任务完成 | 8 | — | bigTaskCompleted × 8 | — |
| 连续天数 | 3/天 | — | calculateStreakScore | — |
| 挑战里程碑 | 15 | — | — | total_score += score |
| 挑战完成 | 15 | — | completed × 15 | total_score += score |

**关键矛盾**：
- `local-db.ts` 中记录创建 `snowball_size += 2`，但 `SCORE_VALUES.RECORD_CREATED = 10`，后端重算用 10
- 挑战分数在 `total_score` 中写入，但后端重算自己算 `completedChallenges.length × 15`，不读 `total_score`
- 连续天数分数（`streakScore`）只在后端重算中计算，前端 `addScore` 从未调用 `STREAK_DAY`

### 2.3 连续天数重复实现

| 实现 | 位置 | 逻辑差异 |
|------|------|---------|
| `calculateStreakDays` (snowball-score-calculator.ts) | 后端 | 从今天/昨天开始往前数，今天没记录则检查昨天 |
| `calculateStreakDays` (useRecords.ts) | 前端 | 从最新记录开始往前数，初始 streakCount=1 |
| `calculateStreakScore` (snowball-score-calculator.ts) | 后端 | 与 calculateStreakDays 类似但返回分数 |

**差异示例**：如果今天没有记录但昨天有：
- 后端 `calculateStreakDays`：返回 1（从昨天开始数）
- 前端 `useRecords.calculateStreakDays`：返回 1（streakCount 初始值为 1，但排序后第一条是昨天的记录，i=0 时 expectedDate 是今天，recordDate 是昨天，不匹配，break，返回 1）

实际上两者在大多数情况下结果一致，但逻辑路径完全不同，维护成本高。

---

## 三、目标架构

### 3.1 设计原则

1. **单一真相源**：分数只在一个地方计算，其他地方只读取
2. **后端权威**：后端 API 是分数的唯一权威来源，前端只做展示
3. **事件驱动**：分数变更由后端事件触发，前端通过刷新获取
4. **消除魔法数字**：所有分数值通过 `SCORE_VALUES` 常量引用

### 3.2 目标数据流

```
用户操作
  │
  ├──→ 后端 API（/api/records, /api/tasks/[id], /api/challenges）
  │      └── 统一调用 scoreEngine.addScore(userId, action)
  │           ├── 写入 score_events 集合（事件溯源）
  │           └── 返回 { totalScore, todayScore, ... }
  │
  └──→ 前端
         ├── 调用 API 后用返回值更新 state（非乐观累加）
         └── 或 API 返回后调 refreshStats() 拉取真实值

后端重算（/api/snowball/stats）
  └── 仍从 records/tasks/challenges 重算（保持幂等性）
       └── 新增：也累加 score_events 中挑战里程碑等事件的分数
```

### 3.3 关键决策

**Q：后端重算 vs 事件累加？**

选择**混合方案**：
- 记录/任务/习惯/连续天数：继续从原始数据重算（幂等、可审计）
- 挑战里程碑/挑战完成：通过事件累加（因为里程碑分数不是固定的，取决于挑战难度）

理由：重算方案天然幂等，不怕重复写入；但挑战里程碑的分数是动态的（不同难度分数不同），不适合硬编码重算。

---

## 四、具体变更

### 4.1 新增：Score Engine 模块

**文件**：`src/lib/score-engine.ts`

**职责**：统一的分数计算入口，所有 API 路由通过它写入分数事件

```typescript
import { ScoreAction, SCORE_VALUES } from './snowball-score';

interface ScoreEvent {
  id: string;
  user_id: string;
  action: ScoreAction | 'CHALLENGE_MILESTONE' | 'CHALLENGE_COMPLETED';
  score: number;
  ref_id?: string;
  created_at: string;
}

export function addScoreEvent(userId: string, action: ScoreAction, refId?: string): ScoreEvent;
export function addChallengeScoreEvent(userId: string, challengeId: string, score: number, isMilestone: boolean): ScoreEvent;
export function getScoreEvents(userId: string): ScoreEvent[];
export function calculateChallengeEventScore(userId: string): number;
```

**接口设计要点**：
- `addScoreEvent`：写入标准分数事件（action 对应 SCORE_VALUES）
- `addChallengeScoreEvent`：写入挑战分数事件（分数由调用方传入，因为挑战分数是动态的）
- `getScoreEvents`：读取用户所有分数事件
- `calculateChallengeEventScore`：累加挑战相关事件的总分

### 4.2 修改：后端重算纳入挑战事件分数

**文件**：`src/lib/snowball-score-calculator.ts`

在 `calculateTotalStats` 中新增 `challengeEventScore` 参数：

```typescript
export function calculateTotalStats(
  records: Record[],
  tasks: Task[],
  challenges?: ChallengeCompletion[],
  challengeEventScore?: number  // 新增
) {
  // ...existing logic...
  const totalScore = recordScore + taskBreakdown.taskScore + streakScore + challengeScore + (challengeEventScore || 0);
  // ...
}
```

### 4.3 修改：/api/snowball/stats 读取挑战事件

**文件**：`src/app/api/snowball/stats/route.ts`

```typescript
const challengeEventScore = calculateChallengeEventScore(userId);
const stats = calculateTotalStats(records, tasks, challenges, challengeEventScore);
```

### 4.4 修改：挑战路由使用 Score Engine

**文件**：`src/app/api/challenges/route.ts`

将 3 处 `db.updateGrowthData(userId, { total_score: ... })` 替换为：

```typescript
addChallengeScoreEvent(userId, challengeId, milestoneReward.score, true);
```

### 4.5 修改：local-db.ts 移除 snowball_size 和 total_score

**文件**：`src/lib/local-db.ts`

- 移除 `createRecord` 中的 `snowball_size += 2`
- 移除 `updateTask` 中的 `snowball_size += 5`
- 移除种子数据中的 `snowball_size: 0` 和 `total_score: 0`
- 移除 `growthData` 接口中的 `snowball_size` 和 `total_score` 字段
- 移除 `updateGrowthData` 函数中对 `snowball_size` 和 `total_score` 的处理

### 4.6 修改：前端 addScore 改为 API 返回值驱动

**文件**：`src/contexts/SnowballContext.tsx`

当前 `addScore` 的行为：
```typescript
// 当前：乐观累加
setStats(prev => ({ ...prev, totalScore: prev.totalScore + score }));
refreshStats(); // 1秒后再拉后端
```

改为：
```typescript
// 新：直接刷新后端值
const refreshAndSet = async () => {
  await refreshStats(); // 从后端拉取真实值
};
refreshAndSet();
```

**权衡**：去掉乐观更新后，分数变化会有网络延迟（~200ms）。但可以保留 `lastAddedScore` 和 `lastAddedAction` 用于动画效果（显示 "+10" 飘字），只是不再修改 `stats.totalScore`。

### 4.7 修改：统一连续天数计算

**文件**：`src/hooks/useRecords.ts`

删除 `useRecords` 中的 `calculateStreakDays` 实现，改为从 `SnowballContext.stats.todayStreak` 获取（后端已计算）。

### 4.8 新增：local-db.ts 中 score_events 集合

**文件**：`src/lib/local-db.ts`

在 `LocalData` 接口中新增：
```typescript
scoreEvents: ScoreEvent[];
```

在种子数据中新增：
```typescript
scoreEvents: [],
```

新增 CRUD 函数：
```typescript
export function addScoreEvent(event: ScoreEvent): ScoreEvent;
export function getScoreEvents(userId: string): ScoreEvent[];
```

---

## 五、影响分析

### 5.1 涉及文件

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/lib/score-engine.ts` | 新增 | 统一分数计算入口 |
| `src/lib/local-db.ts` | 修改 | 新增 score_events 集合，移除 snowball_size 魔法数字 |
| `src/lib/snowball-score-calculator.ts` | 修改 | 新增 challengeEventScore 参数 |
| `src/contexts/SnowballContext.tsx` | 修改 | addScore 改为刷新驱动 |
| `src/hooks/useRecords.ts` | 修改 | 移除 calculateStreakDays，改用 Context |
| `src/app/api/snowball/stats/route.ts` | 修改 | 读取挑战事件分数 |
| `src/app/api/challenges/route.ts` | 修改 | 使用 Score Engine 替代直写 |
| `src/lib/__tests__/snowball-score-calculator.test.ts` | 修改 | 新增挑战事件分数测试 |
| `src/lib/__tests__/local-db.test.ts` | 修改 | 新增 score_events 测试 |

### 5.2 向后兼容

- `growthData.snowball_size` 和 `growthData.total_score` 字段从代码中删除，旧数据文件中如果有这两个字段会被忽略
- 后端重算逻辑保持幂等，新增的挑战事件分数是增量
- 前端 `addScore` 接口签名不变，只是内部实现改为刷新驱动

### 5.3 风险

| 风险 | 概率 | 缓解措施 |
|------|------|---------|
| 去掉乐观更新后分数变化有延迟 | 中 | 保留 lastAddedScore 动画，用户感知不到延迟 |
| score_events 集合数据量增长 | 低 | JSON 文件场景下数据量有限，可后续清理 |
| 挑战事件分数与重算分数重复计算 | 中 | 重算中移除 `completedChallenges.length × 15`，改用事件分数 |

---

## 六、验收标准

1. **分数一致性**：前端显示的总分与后端 `/api/snowball/stats` 返回值完全一致（无跳变）
2. **挑战分数持久化**：挑战完成后刷新页面，分数不丢失
3. **无魔法数字**：`local-db.ts` 中不再有 `snowball_size += N` 的硬编码
4. **单一连续天数实现**：`useRecords.ts` 中不再有独立的 `calculateStreakDays`
5. **测试覆盖**：新增 score-engine 单元测试，覆盖所有 ScoreAction 和挑战事件
6. **现有测试通过**：所有 629 个现有测试继续通过

---

## 七、已确认决策

1. **挑战完成分数**：由挑战等级决定（bronze/silver/gold 不同分数），不使用固定的 `SCORE_VALUES.CHALLENGE_COMPLETED = 15`。`CHALLENGE_COMPLETED` 从 SCORE_VALUES 中移除，改为挑战定义中的 `reward.score` 字段。
2. **连续天数分数**：在每日首次创建记录时自动加 `SCORE_VALUES.STREAK_DAY` 分数。后端在 `createRecord` 中检测是否今日首条记录，如果是则写入一个 `STREAK_DAY` 分数事件。
3. **growthData 清理**：本轮删除 `snowball_size` 和 `total_score` 字段，代码中不再保留任何引用。
