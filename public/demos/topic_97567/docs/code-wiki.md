# 雪球日记 - Code Wiki

> **项目**: 雪球日记 (Snowball Diary)  
> **版本**: V3.0 本地持久化版  
> **最后更新**: 2026-06-03

---

## 📑 目录

1. [项目概述](#1-项目概述)
2. [系统架构](#2-系统架构)
3. [项目结构](#3-项目结构)
4. [核心模块详解](#4-核心模块详解)
5. [数据模型](#5-数据模型)
6. [API 路由](#6-api-路由)
7. [组件体系](#7-组件体系)
8. [工具函数库](#8-工具函数库)
9. [依赖关系](#9-依赖关系)
10. [运行方式](#10-运行方式)
11. [开发规范](#11-开发规范)

---

## 1. 项目概述

### 1.1 项目简介

雪球日记是一个通过记录微小成功、用"滚雪球"可视化成长轨迹的 AI 陪伴工具，帮助用户建立正向反馈循环。

### 1.2 核心特性

| 特性 | 描述 |
|------|------|
| 📝 3秒记录法 | 快速记录小成功，AI 自动打标签 |
| ❄️ 雪球成长系统 | 记录越多，雪球越大，从雪粒变成雪人 |
| 🎯 任务管理 | 四象限优先级、习惯打卡、长任务分解 |
| 🏆 成就系统 | 37 个成就等你解锁 |
| 🤖 AI 陪伴 | 智能反馈、每日提问、拖延急救 |
| 🎨 精美动画 | Framer Motion 驱动的流畅交互 |

### 1.3 技术栈

| 类别 | 技术 |
|------|------|
| **前端框架** | Next.js 16.2.4 + React 19.2.4 |
| **样式方案** | Tailwind CSS 4 |
| **动画库** | Framer Motion 12.38.0 |
| **数据可视化** | Recharts 3.8.1 |
| **数据存储** | 本地 JSON 文件 (`data/local-db.json`) |
| **AI 服务** | 智谱 AI GLM-4-Flash |
| **测试框架** | Vitest 4.1.5 |

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端应用层                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   页面路由   │  │   状态管理   │  │   UI 组件   │             │
│  │  (App Router)│  │  (Context)  │  │ (Components)│             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API 网关层                                │
│              Next.js API Routes (App Router)                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ /tasks  │ │/records │ │/ai/*    │ │/auth    │ │/challenges│  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
└───────┼───────────┼───────────┼───────────┼───────────┼─────────┘
        │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        业务逻辑层                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  local-db.ts│  │achievement- │  │snowball-    │             │
│  │  (数据持久化)│  │ engine.ts   │  │ score.ts    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        数据存储层                                │
│                    data/local-db.json                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

```
用户操作 → React Hooks → API Routes → local-db.ts → local-db.json
                ↓
         Context Provider → 组件重渲染 → UI 更新
```

---

## 3. 项目结构

```
snowball-diary-new/
├── data/
│   └── local-db.json              # 本地数据库文件（持久化）
├── public/
│   └── images/
│       └── snowball-stages/       # 雪球阶段图片资源
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API 路由
│   │   │   ├── achievements/      # 成就系统 API
│   │   │   ├── ai/                # AI 服务 API
│   │   │   ├── auth/              # 认证 API
│   │   │   ├── challenges/        # 挑战系统 API
│   │   │   ├── procrastination/   # 拖延急救 API
│   │   │   ├── records/           # 记录 API
│   │   │   ├── reminders/         # 提醒 API
│   │   │   ├── snowball/          # 雪球统计 API
│   │   │   └── tasks/             # 任务 API
│   │   ├── components/            # React 组件
│   │   ├── auth/                  # 认证页面
│   │   ├── profile/               # 个人资料页面
│   │   ├── records/               # 记录页面
│   │   ├── review/                # 回顾页面
│   │   ├── tasks/                 # 任务页面
│   │   ├── layout.tsx             # 根布局
│   │   ├── page.tsx               # 首页
│   │   └── globals.css            # 全局样式
│   ├── contexts/                  # React Context
│   │   ├── RecordsContext.tsx     # 记录状态管理
│   │   └── SnowballContext.tsx    # 雪球状态管理
│   ├── hooks/                     # 自定义 Hooks
│   │   ├── useAuth.ts             # 认证 Hook
│   │   ├── useTasks.ts            # 任务 Hook
│   │   ├── useRecords.ts          # 记录 Hook
│   │   ├── useChallenges.ts       # 挑战 Hook
│   │   ├── useAchievements.ts     # 成就 Hook
│   │   └── ...
│   ├── lib/                       # 工具函数库
│   │   ├── local-db.ts            # 本地数据库操作
│   │   ├── data-models.ts         # 数据模型定义
│   │   ├── snowball-score.ts      # 雪球分数计算
│   │   ├── achievement-engine.ts  # 成就引擎
│   │   └── ...
│   └── test/                      # 测试配置
├── docs/                          # 项目文档
├── package.json
├── next.config.ts
└── README.md
```

---

## 4. 核心模块详解

### 4.1 数据持久化层 (`src/lib/local-db.ts`)

**职责**: 所有数据的本地 JSON 文件持久化操作

**核心函数**:

| 函数 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `loadData()` | 加载本地数据库 | - | `LocalData` |
| `saveData()` | 保存数据到文件 | - | `void` |
| `getUser(userId)` | 获取用户信息 | `string` | `User \| null` |
| `getTasks(userId)` | 获取任务列表 | `string` | `Task[]` |
| `createTask(taskData)` | 创建任务 | `object` | `Task` |
| `updateTask(taskId, updates)` | 更新任务 | `string, object` | `Task` |
| `deleteTask(taskId)` | 删除任务 | `string` | `boolean` |
| `getRecords(userId)` | 获取记录列表 | `string` | `Record[]` |
| `createRecord(recordData)` | 创建记录 | `object` | `Record` |
| `checkAndUnlockAchievements(userId, stats)` | 检查并解锁成就 | `string, object` | `string[]` |

**数据结构**:
```typescript
interface LocalData {
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
```

### 4.2 雪球分数系统 (`src/lib/snowball-score.ts`)

**职责**: 管理雪球成长阶段和分数计算

**核心类型**:
```typescript
type SnowballStage = 'snowflake' | 'small_ball' | 'ball';
type ScoreAction = 'RECORD_CREATED' | 'TASK_NORMAL_COMPLETED' | 'TASK_QUICK_COMPLETED' | 'HABIT_CHECKIN' | 'SUBTASK_COMPLETED' | 'BIG_TASK_COMPLETED';
```

**分数配置**:
```typescript
const SCORE_VALUES = {
  RECORD_CREATED: 5,           // 创建记录
  TASK_NORMAL_COMPLETED: 5,    // 完成普通任务
  TASK_QUICK_COMPLETED: 2,     // 完成快速任务
  HABIT_CHECKIN: 5,            // 习惯打卡
  SUBTASK_COMPLETED: 5,        // 完成子任务
  BIG_TASK_COMPLETED: 10,      // 完成长任务
};
```

**雪球阶段**:
```typescript
const SNOWBALL_STAGES = [
  { stage: 'snowflake', minScore: 0, maxScore: 49, size: 300, label: '雪粒' },
  { stage: 'small_ball', minScore: 50, maxScore: 199, size: 375, label: '小雪球' },
  { stage: 'ball', minScore: 200, maxScore: Infinity, size: 450, label: '雪球' },
];
```

**核心函数**:

| 函数 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `getSnowballStageByScore(score)` | 根据分数获取阶段 | `number` | `SnowballStageConfig` |
| `getNextStageThresholdByScore(score)` | 获取下一阶段阈值 | `number` | `number \| null` |
| `getScoreProgress(currentScore)` | 获取进度百分比 | `number` | `{current, next, progress}` |

### 4.3 成就引擎 (`src/lib/achievement-engine.ts`)

**职责**: 成就条件评估和解锁逻辑

**成就定义** (`src/lib/data-models.ts`):
```typescript
interface AchievementDefinition {
  id: string;           // 成就唯一标识
  title: string;        // 成就标题
  description: string;  // 成就描述
  icon: string;         // 成就图标
  level: 'micro' | 'minor' | 'growth' | 'major' | 'transformation';
  category: string;     // 成就分类
}
```

**成就分类**:
- **记录类**: 记录数量里程碑 (1, 3, 7, 14, 30, 66, 100, 200条)
- **连续类**: 连续记录天数 (3, 7, 14, 21, 30, 66, 100, 365天)
- **挑战类**: 挑战完成情况
- **任务类**: 任务完成数量
- **互动类**: 与雪球互动次数
- **隐藏类**: 特殊条件触发
- **大师类**: 解锁所有其他成就

**核心函数**:

| 函数 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `evaluateCondition(achievementId, stats)` | 评估成就条件 | `string, object` | `boolean` |
| `getAchievementProgress(achievementId, stats)` | 获取成就进度 | `string, object` | `number` |

### 4.4 四象限工具 (`src/lib/quadrant-utils.ts`)

**职责**: 任务优先级四象限计算

**核心类型**:
```typescript
type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';
type QuadrantType = 'q1' | 'q2' | 'q3' | 'q4';

interface Thresholds {
  critical: number;   // 紧急阈值（天）
  high: number;       // 高优先级阈值
  medium: number;     // 中优先级阈值
  low: number;        // 低优先级阈值
  none: number;       // 无优先级阈值
}
```

**核心函数**:

| 函数 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `calculateUrgency(dueDate, thresholds)` | 计算紧急程度 | `string, Thresholds` | `UrgencyLevel \| null` |
| `calculateQuadrant(importance, urgency)` | 计算象限 | `number, UrgencyLevel` | `QuadrantType \| null` |

### 4.5 状态管理 Context

#### 4.5.1 SnowballContext (`src/contexts/SnowballContext.tsx`)

**职责**: 全局雪球状态管理

**提供的状态**:
```typescript
interface SnowballContextValue {
  stats: SnowballStats;           // 统计数据
  stage: SnowballStage;           // 当前阶段
  stageLabel: string;             // 阶段标签
  nextThreshold: number | null;   // 下一阶段阈值
  progress: { current, next, progress }; // 进度信息
  addScore: (action: ScoreAction) => void;  // 添加分数
  refreshStats: () => Promise<void>;        // 刷新统计
  lastAddedScore: number;         // 最后添加的分数
  lastAddedAction: ScoreAction | null;      // 最后添加的动作
}
```

#### 4.5.2 RecordsContext (`src/contexts/RecordsContext.tsx`)

**职责**: 记录相关状态管理，包括记录列表、反馈、庆祝效果等

**提供的状态**:
```typescript
interface RecordsContextValue {
  records: Record[];              // 记录列表
  goals: Goal[];                  // 目标列表
  loading: boolean;               // 加载状态
  error: string | null;           // 错误信息
  createRecord: (data, options) => Promise<Record>;  // 创建记录
  deleteRecord: (id) => Promise<boolean>;            // 删除记录
  updateRecord: (id, data) => Promise<Record>;       // 更新记录
  feedbackMap: Record<string, Feedback>;             // 反馈映射
  celebrationType: string | null; // 庆祝类型
  showCelebration: boolean;       // 是否显示庆祝
  streakDays: number;             // 连续天数
}
```

---

## 5. 数据模型

### 5.1 任务模型 (Task)

```typescript
interface Task {
  id: string;                    // 唯一标识
  title: string;                 // 标题
  description?: string;          // 描述
  type: 'quick' | 'normal' | 'big' | 'habit';  // 任务类型
  status: 'pending' | 'completed';              // 状态
  
  // 四象限相关
  importance?: number;           // 重要程度 (1-5)
  due_date?: string;             // 截止日期
  urgency?: UrgencyLevel;        // 紧急程度
  quadrant?: QuadrantType;       // 象限类型
  
  // 层级关系
  parent_id?: string | null;     // 父任务ID
  progress?: number;             // 进度百分比
  subtasks?: Task[];             // 子任务列表
  
  // 习惯特有
  frequency?: HabitFrequency;    // 频率
  target_count?: number;         // 目标次数
  current_streak?: number;       // 当前连续
  best_streak?: number;          // 最佳连续
  reminder_time?: string;        // 提醒时间
  
  user_id: string;               // 用户ID
  completed_at?: string | null;  // 完成时间
  order_index?: number;          // 排序索引
  created_at: string;            // 创建时间
  updated_at: string;            // 更新时间
}
```

### 5.2 记录模型 (Record)

```typescript
interface Record {
  id: string;                    // 唯一标识
  user_id: string;               // 用户ID
  content: string;               // 记录内容
  record_type: 'success' | 'reflection' | 'mood';  // 记录类型
  tags: string[];                // 标签列表
  images?: string[];             // 图片列表
  mood?: string;                 // 心情
  related_task_id?: string;      // 关联任务ID
  created_at: string;            // 创建时间
  updated_at: string;            // 更新时间
}
```

### 5.3 挑战模型 (Challenge)

```typescript
interface Challenge {
  id: string;                    // 唯一标识
  title: string;                 // 标题
  description: string;           // 描述
  type: 'bronze' | 'silver' | 'gold' | 'daily';  // 难度类型
  requirement: number;           // 完成要求
  reward: {
    snowball_size: number;       // 雪球大小奖励
    title?: string;              // 称号奖励
  };
  milestones?: Array<{           // 里程碑
    progress: number;            // 进度要求
    reward: { snowball_size: number; title: string };
  }>;
}

interface UserChallenge {
  id: string;                    // 唯一标识
  user_id: string;               // 用户ID
  challenge_id: string;          // 挑战ID
  status: 'active' | 'completed' | 'abandoned';  // 状态
  progress: number;              // 当前进度
  started_at: string;            // 开始时间
  completed_at?: string;         // 完成时间
  last_checkin?: string;         // 最后打卡
}
```

### 5.4 拖延急救会话 (ProcrastinationSession)

```typescript
interface ProcrastinationSession {
  id: string;                    // 唯一标识
  user_id: string;               // 用户ID
  goal: string;                  // 目标
  current_state: string;         // 当前状态
  steps: Array<{                 // 步骤列表
    description: string;         // 步骤描述
    completed: boolean;          // 是否完成
  }>;
  current_step_index: number;    // 当前步骤索引
  status: 'active' | 'completed';// 状态
  created_at: string;            // 创建时间
  updated_at: string;            // 更新时间
}
```

---

## 6. API 路由

### 6.1 任务 API (`/api/tasks`)

| 方法 | 路径 | 描述 | 请求体 |
|------|------|------|--------|
| GET | `/api/tasks` | 获取任务列表 | - |
| POST | `/api/tasks` | 创建任务 | `{title, type, ...}` |
| PUT | `/api/tasks` | 更新任务状态 | `{id, status}` |
| DELETE | `/api/tasks` | 删除任务 | `{id}` |
| GET | `/api/tasks/[id]` | 获取任务详情 | - |
| PATCH | `/api/tasks/[id]` | 更新任务 | `{title, status, ...}` |
| GET | `/api/tasks/[id]/subtasks` | 获取子任务 | - |
| POST | `/api/tasks/[id]/subtasks` | 创建子任务 | `{title, ...}` |
| POST | `/api/tasks/[id]/checkin` | 习惯打卡 | - |
| GET | `/api/tasks/quadrant` | 四象限数据 | `?view=global` |
| GET | `/api/tasks/thresholds` | 获取阈值 | - |
| PUT | `/api/tasks/thresholds` | 更新阈值 | `{type, thresholds}` |

### 6.2 记录 API (`/api/records`)

| 方法 | 路径 | 描述 | 请求体 |
|------|------|------|--------|
| GET | `/api/records` | 获取记录列表 | - |
| POST | `/api/records` | 创建记录 | `{content, type, mood, tags}` |
| PATCH | `/api/records` | 更新记录 | `{id, content, tags}` |
| DELETE | `/api/records` | 删除记录 | `{id}` |
| POST | `/api/records/[id]/follow-up` | 跟进回答 | `{answer}` |

### 6.3 AI API (`/api/ai`)

| 方法 | 路径 | 描述 | 请求体 |
|------|------|------|--------|
| POST | `/api/ai/auto-tag` | 自动标签 | `{content}` |
| POST | `/api/ai/emotion` | 情感分析 | `{content}` |
| POST | `/api/ai/feedback` | 生成反馈 | `{record}` |
| POST | `/api/ai/question` | 每日问题 | - |
| POST | `/api/ai/step-breakdown` | 步骤分解 | `{goal, currentState}` |
| POST | `/api/ai/task-breakdown` | 任务分解 | `{title}` |
| POST | `/api/ai/growth-report` | 成长报告 | - |

### 6.4 挑战 API (`/api/challenges`)

| 方法 | 路径 | 描述 | 请求体 |
|------|------|------|--------|
| GET | `/api/challenges` | 获取挑战列表 | - |
| POST | `/api/challenges` | 加入挑战 | `{challengeId}` |
| PATCH | `/api/challenges` | 更新进度 | `{userChallengeId, progress}` |
| DELETE | `/api/challenges` | 放弃挑战 | `{userChallengeId}` |
| POST | `/api/challenges/[id]/makeup` | 补打卡 | `{userChallengeId}` |

### 6.5 拖延急救 API (`/api/procrastination`)

| 方法 | 路径 | 描述 | 请求体 |
|------|------|------|--------|
| GET | `/api/procrastination` | 获取会话列表 | - |
| POST | `/api/procrastination` | 创建会话 | `{goal, currentState}` |
| PATCH | `/api/procrastination` | 更新会话 | `{sessionId, currentStepIndex, status}` |

### 6.6 雪球统计 API (`/api/snowball/stats`)

| 方法 | 路径 | 描述 | 返回值 |
|------|------|------|--------|
| GET | `/api/snowball/stats` | 获取雪球统计 | `{totalScore, todayScore, todayStreak, recordCount, taskCompletedCount}` |

---

## 7. 组件体系

### 7.1 布局组件

| 组件 | 路径 | 描述 |
|------|------|------|
| `Navbar` | `app/components/Navbar.tsx` | 顶部导航栏 |
| `HomeSidebar` | `app/components/HomeSidebar.tsx` | 首页侧边栏 |
| `ClientProviders` | `app/components/ClientProviders.tsx` | 客户端 Provider 包装 |

### 7.2 雪球相关组件

| 组件 | 路径 | 描述 |
|------|------|------|
| `SnowballAnimation` | `app/components/SnowballAnimation.tsx` | 雪球动画效果 |
| `SnowballCharacter` | `app/components/SnowballCharacter.tsx` | 雪球角色形象 |
| `SnowballStageCard` | `app/components/SnowballStageCard.tsx` | 雪球阶段卡片 |
| `SnowballGuide` | `app/components/SnowballGuide.tsx` | 雪球引导组件 |

### 7.3 记录相关组件

| 组件 | 路径 | 描述 |
|------|------|------|
| `QuickRecord` | `app/components/QuickRecord.tsx` | 快速记录表单 |
| `RecordCard` | `app/components/RecordCard.tsx` | 记录卡片 |
| `DailyQuestion` | `app/components/DailyQuestion.tsx` | 每日问题 |
| `FeedbackBubble` | `app/components/FeedbackBubble.tsx` | 反馈气泡 |

### 7.4 任务相关组件

| 组件 | 路径 | 描述 |
|------|------|------|
| `CreateTaskModal` | `app/components/CreateTaskModal.tsx` | 创建任务弹窗 |
| `ChallengeCard` | `app/components/ChallengeCard.tsx` | 挑战卡片 |
| `ChallengePanel` | `app/components/ChallengePanel.tsx` | 挑战面板 |
| `ChallengeRecordForm` | `app/components/ChallengeRecordForm.tsx` | 挑战记录表单 |

### 7.5 庆祝效果组件

| 组件 | 路径 | 描述 |
|------|------|------|
| `CelebrationEffect` | `app/components/CelebrationEffect.tsx` | 庆祝动画效果 |
| `CelebrationDialog` | `app/components/CelebrationDialog.tsx` | 庆祝弹窗 |
| `GlobalCelebration` | `app/components/GlobalCelebration.tsx` | 全局庆祝管理 |

### 7.6 其他功能组件

| 组件 | 路径 | 描述 |
|------|------|------|
| `GoalStateForm` | `app/components/GoalStateForm.tsx` | 目标状态表单（拖延急救） |
| `OnboardingFlow` | `app/components/OnboardingFlow.tsx` | 新手引导流程 |
| `TipCard` | `app/components/TipCard.tsx` | 提示卡片 |
| `EncouragementWall` | `app/components/EncouragementWall.tsx` | 鼓励墙 |
| `GrowthTimeline` | `app/components/GrowthTimeline.tsx` | 成长时间线 |

---

## 8. 工具函数库

### 8.1 Hooks 列表

| Hook | 路径 | 描述 |
|------|------|------|
| `useAuth` | `hooks/useAuth.ts` | 认证状态管理 |
| `useTasks` | `hooks/useTasks.ts` | 任务数据管理 |
| `useRecords` | `hooks/useRecords.ts` | 记录数据管理 |
| `useChallenges` | `hooks/useChallenges.ts` | 挑战数据管理 |
| `useAchievements` | `hooks/useAchievements.ts` | 成就数据管理 |
| `useProcrastination` | `hooks/useProcrastination.ts` | 拖延急救管理 |
| `useReminders` | `hooks/useReminders.ts` | 提醒管理 |
| `useTips` | `hooks/useTips.ts` | 提示管理 |
| `usePageView` | `hooks/usePageView.ts` | 页面浏览追踪 |
| `useReturnDetection` | `hooks/useReturnDetection.ts` | 用户回归检测 |

### 8.2 工具函数列表

| 文件 | 描述 |
|------|------|
| `lib/local-db.ts` | 本地数据库操作 |
| `lib/data-models.ts` | 数据模型和成就定义 |
| `lib/snowball-score.ts` | 雪球分数系统 |
| `lib/snowball-score-calculator.ts` | 分数计算工具 |
| `lib/snowball-story-text.ts` | 雪球故事文本 |
| `lib/achievement-engine.ts` | 成就引擎 |
| `lib/achievement-events.ts` | 成就事件追踪 |
| `lib/quadrant-utils.ts` | 四象限计算工具 |
| `lib/discovery-engine.ts` | 发现引擎 |
| `lib/analytics.ts` | 数据分析工具 |
| `lib/api-auth.ts` | API 认证中间件 |
| `lib/user-profile.ts` | 用户资料工具 |
| `lib/time-colors.ts` | 时间颜色工具 |
| `lib/reminder-templates.ts` | 提醒模板 |
| `lib/score-engine.ts` | 计分引擎 |

---

## 9. 依赖关系

### 9.1 模块依赖图

```
┌─────────────────────────────────────────────────────────────────┐
│                          页面层                                 │
│     page.tsx    tasks/page.tsx    records/page.tsx             │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────────┐ ┌──────────┐ ┌─────────────────┐
│   Components    │ │  Hooks   │ │    Contexts     │
│  (UI Components)│ │(useTasks,│ │(SnowballContext,│
│                 │ │useRecords)│ │RecordsContext) │
└────────┬────────┘ └────┬─────┘ └────────┬────────┘
         │               │                │
         └───────────────┼────────────────┘
                         ▼
              ┌──────────────────┐
              │   API Routes     │
              │  (/api/tasks,    │
              │   /api/records)  │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │   local-db.ts    │
              │  (数据持久化层)   │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  local-db.json   │
              │   (数据文件)     │
              └──────────────────┘
```

### 9.2 核心依赖关系

```
useTasks
├── useAuth (获取 token)
├── useAchievements (成就检查)
└── fetch('/api/tasks') → API Routes → local-db.ts

useRecords
├── useAuth (获取 token)
└── fetch('/api/records') → API Routes → local-db.ts

SnowballContext
├── useAuth (获取 token)
└── fetch('/api/snowball/stats') → API Routes → local-db.ts

页面组件
├── Hooks (useTasks, useRecords, useChallenges)
├── Contexts (useSnowball, useRecordsContext)
└── Components (UI 组件)
```

### 9.3 外部依赖

**生产依赖**:
```json
{
  "framer-motion": "^12.38.0",    // 动画库
  "next": "16.2.4",               // 框架
  "react": "19.2.4",              // UI 库
  "react-dom": "19.2.4",
  "recharts": "^3.8.1",           // 图表库
  "pdf-parse": "^2.4.5",          // PDF 解析
  "pdfkit": "^0.18.0"             // PDF 生成
}
```

**开发依赖**:
```json
{
  "@tailwindcss/postcss": "^4",   // Tailwind CSS
  "@testing-library/react": "^16.3.2",  // 测试库
  "@types/node": "^20",
  "@types/react": "^19",
  "eslint": "^9",                 // 代码检查
  "tailwindcss": "^4",
  "typescript": "^5",
  "vitest": "^4.1.5"              // 测试框架
}
```

---

## 10. 运行方式

### 10.1 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问应用
open http://localhost:3000
```

### 10.2 生产构建

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

### 10.3 测试

```bash
# 运行单元测试
npm run test

# 运行测试（监听模式）
npm run test:watch

# 运行测试缺口分析
npm run test:gap

# 生成测试缺口报告
npm run test:gap:report
```

### 10.4 代码检查

```bash
# 运行 ESLint
npm run lint
```

### 10.5 数据管理

```bash
# 数据文件位置
data/local-db.json

# 重置数据
rm data/local-db.json
# 然后重启应用
```

---

## 11. 开发规范

### 11.1 代码风格

- **TypeScript**: 所有代码使用 TypeScript，严格类型检查
- **ESLint**: 使用 Next.js 默认 ESLint 配置
- **Tailwind CSS**: 使用 Tailwind CSS v4，遵循原子类命名

### 11.2 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `QuickRecord.tsx` |
| Hooks | camelCase (use前缀) | `useTasks.ts` |
| 工具函数 | camelCase | `local-db.ts` |
| 类型/接口 | PascalCase | `Task`, `Record` |
| 常量 | UPPER_SNAKE_CASE | `SCORE_VALUES` |
| API 路由 | kebab-case | `/api/tasks/route.ts` |

### 11.3 文件组织

```
├── app/
│   ├── api/              # API 路由（按资源分组）
│   ├── components/       # 共享组件
│   └── [page]/           # 页面路由
├── contexts/             # React Context
├── hooks/                # 自定义 Hooks
├── lib/                  # 工具函数
└── test/                 # 测试配置
```

### 11.4 设计规范

**颜色系统**:
- 主色调: `#FFB6C1` (粉色), `#87CEEB` (蓝色)
- 背景色: `#FFF8F0` (暖奶油色)
- 卡片: `bg-white rounded-3xl shadow-lg`

**组件样式**:
- 按钮: `bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl`
- 输入框: `bg-[#FFF8F0]/50 border-gray-200 rounded-2xl`
- 卡片左侧装饰: `border-l-4 border-l-[#FFB6C1]`

### 11.5 Git 规范

- **分支命名**: `feature/xxx`, `fix/xxx`, `refactor/xxx`
- **提交信息**: 使用 Conventional Commits
  - `feat: 添加新功能`
  - `fix: 修复 bug`
  - `refactor: 重构代码`
  - `docs: 更新文档`
  - `test: 添加测试`

---

## 附录

### A. 环境变量

```env
# AI 服务（可选）
ZHIPU_API_KEY=your_zhipu_api_key
OPENAI_API_KEY=your_openai_api_key  # fallback
```

### B. 项目文档索引

| 文档 | 路径 | 描述 |
|------|------|------|
| 项目状态 | `docs/project-status.md` | 迭代记录和变更日志 |
| 架构设计 | `docs/architecture.md` | 系统架构和数据流 |
| API 设计 | `docs/api-design.md` | API 接口规范 |
| 数据模型 | `docs/data-model.md` | 详细数据模型 |
| 项目复盘 | `docs/项目复盘报告.md` | 错误分析和经验总结 |

### C. 快速参考

**常用命令**:
```bash
npm run dev      # 开发
npm run build    # 构建
npm run test     # 测试
npm run lint     # 检查
```

**关键文件**:
- 数据文件: `data/local-db.json`
- 主入口: `src/app/page.tsx`
- 布局: `src/app/layout.tsx`
- 数据库: `src/lib/local-db.ts`

---

*本文档由 AI 自动生成，最后更新于 2026-06-03*
