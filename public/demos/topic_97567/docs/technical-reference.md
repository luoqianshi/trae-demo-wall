# 雪球日记技术文档

> 版本：v3 当前代码快照（2026-05-18）
> 本文档反映代码实际状态，替代 `docs/architecture.md` 和 `docs/api-design.md` 中的过时描述

---

## 一、系统架构总览

### 1.1 实际技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | Next.js | 16.2.4 | App Router，RSC + Client Components |
| UI 库 | React | 19.2.4 | — |
| 样式 | Tailwind CSS | 4 | 实用优先 CSS |
| 动画 | Framer Motion | 12.38.0 | 雪球动画、庆祝效果 |
| 数据可视化 | Recharts | 3.8.1 | 成长轨迹图表 |
| 后端 | Next.js Route Handlers | — | 无独立后端服务 |
| 数据存储 | JSON 文件（local-db.ts） | — | 服务端文件读写，非数据库 |
| 认证 | 伪认证（api-auth.ts） | — | 占位实现，不验证签名 |
| AI 服务 | 智谱 AI GLM-4-Flash | — | 主 AI 服务，OpenAI 为 fallback |
| 测试 | Vitest | 4.1.5 | 单元测试 |
| 部署 | Vercel | — | Next.js 官方托管 |

### 1.2 架构拓扑

```
┌─────────────────────────────────────────────────────┐
│                    浏览器                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ React 组件│  │ Context  │  │  Hooks   │          │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘          │
│        └──────────────┼─────────────┘               │
│                       │ fetch()                      │
└───────────────────────┼─────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────┐
│              Next.js Route Handlers                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │/api/   │ │/api/   │ │/api/   │ │/api/   │       │
│  │tasks   │ │records │ │ai/*    │ │auth/*  │ ...   │
│  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘       │
│      └──────────┼──────────┼──────────┘             │
│                 │          │                         │
│  ┌──────────────▼──┐  ┌───▼────────┐               │
│  │  local-db.ts    │  │ 智谱 AI API │               │
│  │ (JSON 文件读写) │  │ (HTTP 调用) │               │
│  └─────────────────┘  └────────────┘               │
└─────────────────────────────────────────────────────┘
```

### 1.3 关键架构决策

| 决策 | 当前状态 | 说明 |
|------|---------|------|
| 数据存储 | JSON 文件 | `data/local-db.json`，全量读写，无并发保护 |
| 认证 | 伪认证 | `local-token-1` 硬编码，不验证签名 |
| 目标(Goals) | 已废弃 | 功能已被长任务(type='big')替代，代码残留待清理 |
| 雪球阶段 | 3 阶段 | 雪粒(0-49) / 小雪球(50-199) / 雪球(200+) |
| 分数制 | 已实现 | 所有行为转化为分数驱动雪球成长 |
| API 版本 | 无前缀 | `/api/xxx`，非 `/api/v1/xxx` |

---

## 二、API 端点完整参考

### 2.1 通用约定

**认证方式**：所有 API（登录/注册除外）需在请求头携带 `Authorization: Bearer <token>`

**响应格式**：
```json
// 成功
{ "success": true, ...data }

// 失败
{ "error": "错误信息" }
```

**数据源**：所有 API 使用 `local-db.ts`（JSON 文件读写），无 Supabase 接入

---

### 2.2 认证 API

#### POST /api/auth/login

用户登录（占位实现，不验证密码）

**请求体**：
```json
{ "email": "string" }
```

**响应**：
```json
{ "success": true, "user": { "id": "1", "email": "...", "name": "..." }, "token": "local-token-1" }
```

> ⚠️ 当前实现：无论 email 是什么，都返回 userId=1 和固定 token。不验证密码。

#### POST /api/auth/register

用户注册（占位实现）

**请求体**：
```json
{ "email": "string", "name": "string" }
```

**响应**：
```json
{ "success": true, "user": { "id": "1", "email": "...", "name": "..." }, "token": "local-token-1" }
```

> ⚠️ 当前实现：不创建新用户，直接返回 userId=1。

#### GET /api/auth/profile

获取当前用户信息

**响应**：
```json
{ "success": true, "user": { "id": "1", "email": "...", "name": "...", "avatar_url": "..." } }
```

#### PUT /api/auth/profile

更新用户信息

**请求体**：
```json
{ "name": "string", "avatar_url": "string" }
```

---

### 2.3 任务 API

#### GET /api/tasks

获取任务列表，支持多种视图

**查询参数**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| view | string | `goal` | 视图模式：`goal`（目标分组）/ `kanban`（看板）/ `list`（列表） |
| type | string | — | 按任务类型筛选：`quick` / `normal` / `big` / `habit` |
| status | string | — | 按状态筛选：`pending` / `completed` |
| goal_id | string | — | 按目标 ID 筛选 |

**响应（view=goal）**：
```json
{
  "success": true,
  "tasks": [...],
  "groups": {
    "quick": [...],
    "normal": [...],
    "big": [...],
    "habits": [...]
  },
  "stats": {
    "total_tasks": 10,
    "pending": 7,
    "completed": 3,
    "independent_tasks": 5,
    "by_type": { "quick": 2, "normal": 3, "big": 1, "habit": 4 }
  },
  "goals": [...]
}
```

#### POST /api/tasks

创建任务

**请求体**：
```json
{
  "title": "string (必填, ≤200字)",
  "type": "quick | normal | big | habit",
  "goal_id": "string | null",
  "description": "string",
  "due_date": "ISO date string",
  "importance": "1-5 (quick/habit 自动为 null)",
  "parent_id": "string | null",
  "frequency": "daily | weekly | custom (仅 habit)",
  "target_count": "number (仅 habit)",
  "reminder_time": "string (仅 habit)",
  "thresholds": { "critical": 1, "high": 3, "medium": 7, "low": 14, "none": 30 } (仅 big)
}
```

#### PUT /api/tasks

更新任务（部分更新语义，违反 REST PUT 规范）

**请求体**：
```json
{
  "id": "string (必填)",
  "title": "string",
  "description": "string",
  "due_date": "ISO date string",
  "importance": "1-5",
  "status": "pending | completed",
  "goal_id": "string | null",
  "completion_notes": "string",
  "create_record": "boolean (status=completed 时自动创建记录)"
}
```

> ⚠️ 已知问题：PUT 不处理父任务进度重算，应使用 PATCH /api/tasks/[id]

#### DELETE /api/tasks

删除任务

**请求体**：
```json
{ "id": "string (必填)" }
```

#### GET /api/tasks/[id]

获取单个任务详情（big 类型自动包含子任务列表）

#### PATCH /api/tasks/[id]

部分更新任务（推荐使用，替代 PUT）

**请求体**：
```json
{
  "title": "string",
  "description": "string",
  "status": "pending | completed",
  "importance": "1-5",
  "due_date": "ISO date string",
  "goal_id": "string | null",
  "frequency": "daily | weekly | custom",
  "target_count": "number",
  "reminder_time": "string",
  "progress": "number"
}
```

**自动副作用**：
- 自动重算紧急度和四象限
- 子任务状态变更时自动更新父任务进度
- 长任务自身状态变更时重算自身进度

#### DELETE /api/tasks/[id]

删除任务（含子任务级联删除）

#### GET /api/tasks/[id]/subtasks

获取父任务的子任务列表（按 order_index 排序）

#### POST /api/tasks/[id]/subtasks

创建子任务（自动设置 parent_id 和 type='normal'）

**请求体**：
```json
{ "title": "string", "description": "string", "importance": "1-5", "due_date": "ISO date string" }
```

#### POST /api/tasks/[id]/checkin

习惯打卡

**响应**：
```json
{
  "success": true,
  "task": { ... },
  "streak": 5,
  "best_streak": 10,
  "is_consecutive": true
}
```

> 409 表示今日已打卡（防重复）

#### GET /api/tasks/big

获取长任务精简列表（供记录页关联使用）

**响应**：
```json
{ "success": true, "tasks": [{ "id": "...", "title": "...", "progress": 50 }] }
```

#### GET /api/tasks/quadrant

获取四象限数据

**查询参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| view | string | `global` / `normal` / `big` |
| big_task_id | string | view=big 时指定长任务 ID |

#### GET /api/tasks/thresholds

获取紧急度阈值配置

#### PUT /api/tasks/thresholds

更新紧急度阈值配置

**请求体**：
```json
{
  "type": "normal | big",
  "thresholds": { "critical": 1, "high": 3, "medium": 7, "low": 14, "none": 30 },
  "big_task_id": "string (type=big 时必填)"
}
```

---

### 2.4 记录 API

#### GET /api/records

获取用户记录列表（按创建时间倒序）

#### POST /api/records

创建记录

**请求体**：
```json
{
  "content": "string (必填, ≤10000字)",
  "type": "success | challenge | insight | question",
  "tags": ["string"],
  "mood": "happy | calm | excited | tired | anxious | sad | proud | grateful | neutral",
  "related_task_id": "string (主字段，关联长任务)",
  "related_goal_id": "string (遗留字段，向后兼容)"
}
```

> 📌 `related_task_id` 是当前主字段，关联长任务(type='big')。`related_goal_id` 为遗留字段，仅用于兼容旧数据。

#### PATCH /api/records

更新记录（仅支持 type 和 tags 字段）

**请求体**：
```json
{ "id": "string (必填)", "type": "string", "tags": ["string"] }
```

#### DELETE /api/records

删除记录（级联删除关联对话）

**请求体**：
```json
{ "id": "string (必填)" }
```

#### GET /api/records/follow-up

获取记录的对话历史

**查询参数**：`record_id=string`

#### POST /api/records/follow-up

保存对话消息

**请求体**：
```json
{ "record_id": "string", "role": "assistant | user", "content": "string" }
```

---

### 2.5 成就 API

#### GET /api/achievements

获取成就列表（含解锁状态和进度）

**响应**：
```json
{
  "success": true,
  "achievements": [{
    "id": "records_1",
    "title": "启程",
    "description": "第1条记录",
    "icon": "🌱",
    "level": "micro | minor | growth | major | transformation",
    "category": "记录 | 连续 | 挑战 | 任务 | 目标 | 互动 | 隐藏 | 急救 | 大师",
    "unlocked": false,
    "unlocked_at": "ISO timestamp | undefined",
    "progress": 0.5
  }]
}
```

#### POST /api/achievements

检测并解锁成就

**请求体**：
```json
{
  "midnight_record": "boolean (深夜记录标记)",
  "record_500_words": "boolean (500字以上记录标记)"
}
```

**响应**：
```json
{ "success": true, "newlyUnlocked": [{ "id": "...", "title": "...", ... }] }
```

#### PATCH /api/achievements

记录雪球互动（用于互动类成就）

**请求体**：
```json
{ "type": "snowball_interaction | snowball_click" }
```

---

### 2.6 挑战 API

#### GET /api/challenges

获取挑战列表和用户参与状态

**查询参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| difficulty | string | 按难度筛选：`1`(青铜) / `2`(白银) / `3`(黄金) |
| category | string | 按分类筛选 |
| status | string | 按参与状态筛选：`active` / `completed` / `abandoned` |

**响应**：
```json
{
  "success": true,
  "challenges": [{
    "id": "challenge_1",
    "type": "bronze | silver | gold",
    "difficulty": 1,
    "title": "微笑时刻",
    "description": "...",
    "duration_days": 1,
    "category": "emotion",
    "completion_criteria": { ... },
    "reward": { "snowball_size": 5, "badge_fragments": 1 },
    "is_active": true,
    "is_recurring": true
  }],
  "user_challenges": [{
    "id": "...",
    "challenge_id": "challenge_1",
    "status": "active | completed | abandoned",
    "progress": 3,
    "current_day": 4,
    "streak_days": 3,
    "make_up_count": 0,
    "max_make_ups": 2,
    "daily_records": [...],
    "challenge": { ... }
  }]
}
```

> ⚠️ 已知问题：reward 中的 `snowball_size` 与分数制不同步，待统一。

#### POST /api/challenges

加入挑战

**请求体**：
```json
{ "challenge_id": "string (必填)" }
```

> 409 表示已加入该挑战

#### PUT /api/challenges

更新挑战进度

**请求体**：
```json
{
  "user_challenge_id": "string (必填)",
  "action": "progress | complete | abandon | make_up",
  "record_id": "string (action=progress 时)",
  "tags": ["string"],
  "questions_answered": ["string"],
  "action_confirmed": "boolean"
}
```

---

### 2.7 雪球 API

#### GET /api/snowball/stats

获取雪球统计数据（从 records/tasks 实时计算）

**响应**：
```json
{
  "success": true,
  "totalScore": 150,
  "todayScore": 25,
  "todayStreak": 3,
  "recordCount": 15,
  "taskCompletedCount": 8
}
```

---

### 2.8 奖励 API

#### GET /api/rewards

获取奖励列表和当前装备

**响应**：
```json
{
  "success": true,
  "unlocked": {
    "decorations": ["none", "scarf"],
    "colors": ["white", "pink"],
    "themes": ["clear_sky"],
    "titles": ["初心者", "行动派"]
  },
  "available": {
    "decorations": [{ "id": "none", "name": "无装饰", "condition": "默认", "unlocked": true }, ...],
    "colors": [...],
    "themes": [...],
    "titles": [...]
  },
  "currentSettings": {
    "decoration": "scarf",
    "color": "pink",
    "theme": "clear_sky",
    "title": "行动派"
  }
}
```

**奖励类别**：

| 类别 | 项目数 | 解锁条件示例 |
|------|--------|-------------|
| 装饰品 | 5 | 默认/连续7天/连续15天/20条记录/100条记录 |
| 颜色 | 5 | 默认/10条记录/25条记录/50条记录/100条记录 |
| 背景主题 | 4 | 默认/连续7天/连续15天/连续30天 |
| 称号 | 16 | 各种成就条件 |

#### PUT /api/rewards

装备奖励

**请求体**：
```json
{ "type": "decoration | color | theme | title", "value": "string" }
```

> 403 表示奖励尚未解锁

---

### 2.9 提醒 API

#### GET /api/reminders

获取用户提醒列表

#### POST /api/reminders

创建提醒

**请求体**：
```json
{ "time": "string (必填, 如 '09:00')", "label": "string" }
```

#### PUT /api/reminders

更新提醒

**请求体**：
```json
{ "id": "string (必填)", "time": "string", "enabled": "boolean", "label": "string" }
```

#### DELETE /api/reminders

删除提醒

**查询参数**：`id=string`

---

### 2.10 AI API

#### POST /api/ai/feedback

获取 AI 反馈（核心 AI 接口）

**请求体**：
```json
{
  "record_content": "string (记录内容)",
  "goal_title": "string (关联长任务标题)",
  "goal_progress": "number (关联长任务进度)",
  "quick": "boolean (快速模式，返回简短反馈)",
  "record_id": "string (追问模式)",
  "follow_up_question": "string (追问问题)",
  "follow_up_answer": "string (追问回答)",
  "feedback_level": "string (反馈级别)"
}
```

**响应**：
```json
{
  "feedback": "string (普通反馈)",
  "is_follow_up": true,
  "follow_up": "string (追问内容)"
}
```

#### POST /api/ai/question

获取每日问题

**请求体**：
```json
{ "time_of_day": "morning | afternoon | evening", "recent_tags": ["string"] }
```

#### POST /api/ai/auto-tag

自动标签

**请求体**：
```json
{ "content": "string" }
```

**响应**：
```json
{ "type": "success | habit | progress | reflection", "tags": ["string"] }
```

#### POST /api/ai/emotion

情绪分析

**请求体**：
```json
{ "content": "string" }
```

**响应**：
```json
{ "emotion": "positive | neutral | negative | anxious | low", "confidence": 0.85 }
```

#### POST /api/ai/task-breakdown

任务分解（使用 OpenAI API）

**请求体**：
```json
{ "goal": "string (目标描述)" }
```

**响应**：
```json
{ "tasks": [{ "title": "...", "description": "...", "difficulty": 1, "order": 1 }] }
```

#### POST /api/ai/step-breakdown

步骤拆解（拖延干预用）

**请求体**：
```json
{ "goal": "string", "current_state": "string" }
```

#### POST /api/ai/growth-report

成长报告（使用 OpenAI API）

**请求体**：
```json
{ "time_range": "week | month | quarter" }
```

**响应**：
```json
{ "report": "string (Markdown 格式)" }
```

---

### 2.11 其他 API

#### GET /api/growth/timeline

获取成长时间线数据

#### GET /api/analytics

埋点事件上报（当前未实现实际分析逻辑）

**请求体**：
```json
{ "event": "string", "properties": {} }
```

#### GET /api/encouragement

获取鼓励墙内容

> ⚠️ 该功能可能未实装，前端未发现使用入口

#### POST /api/encouragement

添加鼓励内容

#### GET /api/procrastination

拖延干预（当前返回固定建议，未接入 AI）

---

### 2.12 已废弃 API（待清理）

| 端点 | 状态 | 说明 |
|------|------|------|
| GET/POST/PUT/DELETE /api/goals | 已废弃 | 功能已被长任务(type='big')替代 |
| useGoals hook | 已废弃 | GoalsContext 全局挂载，需移除 |
| GoalsContext / GoalsProvider | 已废弃 | 全局 Provider，需移除 |

---

## 三、数据模型

### 3.1 存储实现

所有数据存储在 `data/local-db.json` 文件中，通过 `src/lib/local-db.ts` 提供读写接口。

**存储结构**：
```typescript
interface LocalData {
  users: Array<{ id, email, name, avatar_url, created_at, updated_at }>;
  goals: any[];          // 已废弃，残留数据
  tasks: any[];          // 核心数据
  records: any[];        // 核心数据
  thresholds: any[];     // 紧急度阈值配置
  growthData: any[];     // 成长数据
  userAchievements: Array<{ user_id, achievement_id, unlocked_at }>;
  procrastinationSessions: any[];
  conversations: any[];
  challenges: any[];     // 挑战定义（种子数据）
  userChallenges: any[];
  encouragementPosts: any[];
  encouragementLikes: any[];
  reminders: any[];
  userSettings: any[];
  userInteractions: Array<{ user_id, type, count, updated_at }>;
}
```

> ⚠️ 所有集合（除 users 和 userAchievements 外）使用 `any[]` 类型，无类型约束。

### 3.2 核心实体

#### 任务（Task）

```typescript
interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  task_type: 'quick' | 'normal' | 'big' | 'habit';  // 数据库字段名
  type: 'quick' | 'normal' | 'big' | 'habit';        // API 响应字段名
  status: 'pending' | 'completed';
  importance?: number;       // 1-5，quick/habit 为 null
  due_date?: string;
  urgency?: UrgencyLevel;   // 自动计算
  quadrant?: QuadrantType;  // 自动计算
  parent_id?: string | null;
  progress?: number;        // 0-100，big 类型由子任务完成比例计算
  goal_id?: string | null;  // 遗留字段，关联 goals 表
  frequency?: 'daily' | 'weekly' | 'custom';  // 仅 habit
  target_count?: number;    // 仅 habit
  current_streak?: number;  // 仅 habit
  best_streak?: number;     // 仅 habit
  reminder_time?: string;   // 仅 habit
  completed_at?: string | null;
  order_index?: number;
  created_at: string;
  updated_at: string;
}
```

> 📌 `task_type` 是数据库存储字段名，API 响应中会映射为 `type`。

#### 记录（Record）

```typescript
interface Record {
  id: string;
  user_id: string;
  content: string;
  record_type: 'success' | 'challenge' | 'insight' | 'question';
  tags: string[];
  mood: string;
  related_task_id?: string;   // 主字段，关联长任务
  related_goal_id?: string;   // 遗留字段，向后兼容
  created_at: string;
  updated_at: string;
}
```

#### 雪球分数

```typescript
const SCORE_VALUES = {
  RECORD_CREATED: 10,
  TASK_NORMAL_COMPLETED: 5,
  TASK_QUICK_COMPLETED: 2,
  HABIT_CHECKIN: 3,
  SUBTASK_COMPLETED: 5,
  BIG_TASK_COMPLETED: 8,
  CHALLENGE_MILESTONE: 15,
  CHALLENGE_COMPLETED: 15,
  STREAK_DAY: 3,
};

const SNOWBALL_STAGES = [
  { stage: 'snowflake', minScore: 0,   maxScore: 49,    label: '雪粒' },
  { stage: 'small_ball', minScore: 50,  maxScore: 199,   label: '小雪球' },
  { stage: 'ball',       minScore: 200, maxScore: Infinity, label: '雪球' },
];
```

---

## 四、前端架构

### 4.1 Context 层次

```
ClientProviders (Toast + ErrorBoundary + Analytics)
  └── SnowballProvider (分数/阶段/统计)
       └── RecordsProvider (记录 CRUD + AI 反馈 + 庆祝 + 对话)
            └── GoalsProvider (已废弃，残留)
```

### 4.2 Hooks 清单

| Hook | 职责 | 代码行数 | 状态 |
|------|------|---------|------|
| useAuth | 认证状态管理 | 60 | 占位实现 |
| useTasks | 任务 CRUD + 统计 + 四象限 + 子任务 + 习惯打卡 | 538 | 职责过重 |
| useRecords | 记录 CRUD + AI 反馈 + 庆祝 + 对话 + 连续天数 | 735 | 职责过重 |
| useChallenges | 挑战管理 | — | 正常 |
| useAchievements | 成就检测 | — | 正常 |
| useGoals | 目标管理 | — | 已废弃 |
| useProcrastination | 拖延干预 | — | 正常 |
| useReminders / useReminder | 提醒管理 | — | 正常 |
| useTips | 每日提示 | — | 正常 |
| usePageView | 页面浏览埋点 | — | 正常 |
| useReturnDetection | 回归检测 | — | 正常 |

### 4.3 组件清单

| 组件 | 文件 | 说明 |
|------|------|------|
| SnowballAnimation | SnowballAnimation.tsx | 雪球动画（3阶段视觉） |
| SnowballCharacter | SnowballCharacter.tsx | 雪球角色共享组件 |
| SnowballStageCard | SnowballStageCard.tsx | 雪球状态卡片 |
| SnowballGuide | SnowballGuide.tsx | 雪球引导 |
| CelebrationEffect | CelebrationEffect.tsx | 庆祝效果（5种类型） |
| CelebrationDialog | CelebrationDialog.tsx | 任务完成弹窗 |
| ChallengeCelebration | ChallengeCelebration.tsx | 挑战完成弹窗 |
| GlobalCelebration | GlobalCelebration.tsx | 全局庆祝管理 |
| FeedbackBubble | FeedbackBubble.tsx | 反馈气泡 |
| DailyQuestion | DailyQuestion.tsx | 每日问题 |
| QuickRecord | QuickRecord.tsx | 快速记录 |
| RecordCard | RecordCard.tsx | 记录卡片 |
| ChallengePanel | ChallengePanel.tsx | 挑战面板 |
| ChallengeCard | ChallengeCard.tsx | 挑战卡片 |
| ChallengeDetail | ChallengeDetail.tsx | 挑战详情 |
| ChallengeRecordForm | ChallengeRecordForm.tsx | 挑战记录表单 |
| ChallengeStats | ChallengeStats.tsx | 挑战统计 |
| CreateTaskModal | CreateTaskModal.tsx | 创建任务弹窗 |
| AchievementBadge | AchievementBadge.tsx | 成就徽章 |
| BadgeCollection | BadgeCollection.tsx | 徽章集合 |
| HomeSidebar | HomeSidebar.tsx | 首页侧边栏 |
| Navbar | Navbar.tsx | 导航栏 |
| NavSnowball | NavSnowball.tsx | 导航栏雪球组件 |
| OnboardingFlow | OnboardingFlow.tsx | 新手引导 |
| ReturnWelcome | ReturnWelcome.tsx | 回归欢迎 |
| GrowthChart | GrowthChart.tsx | 成长图表 |
| GrowthTimeline | GrowthTimeline.tsx | 成长时间线 |
| RewardDisplay | RewardDisplay.tsx | 奖励展示 |
| ReminderSettings | ReminderSettings.tsx | 提醒设置 |
| EncouragementWall | EncouragementWall.tsx | 鼓励墙 |
| AIFeedback | AIFeedback.tsx | AI 反馈 |
| TipCard | TipCard.tsx | 提示卡片 |
| DotCheckbox | DotCheckbox.tsx | 圆点复选框 |
| EmptyStateSnowball | EmptyStateSnowball.tsx | 空状态雪球 |
| ConfirmDialog | ConfirmDialog.tsx | 确认弹窗 |
| Toast | Toast.tsx | 消息提示 |
| Skeleton | Skeleton.tsx | 骨架屏 |
| ErrorBoundary | ErrorBoundary.tsx | 错误边界 |
| ClientProviders | ClientProviders.tsx | 客户端 Provider 集合 |

---

## 五、已知问题与重构指南

### 5.1 P0：阻塞生产

#### 5.1.1 认证系统需实现

**现状**：`api-auth.ts` 不验证任何签名，`useAuth` 硬编码 `local-token-1`，登录/注册 API 不验证密码

**重构方案**：
1. 接入 Supabase Auth 或实现 JWT 签发/验证
2. 登录 API 验证密码后签发真实 token
3. `authenticateRequest` 验证 token 签名和过期时间
4. `useAuth` 通过 SDK 管理登录状态

#### 5.1.2 数据层需引入 Repository 抽象

**现状**：所有 API 路由直接 `import * as db from '@/lib/local-db'`，与 JSON 文件存储硬耦合

**重构方案**：
1. 定义 `ITaskRepository` / `IRecordRepository` 等接口
2. 将 `local-db.ts` 重构为 `LocalJsonRepository` 实现
3. 未来创建 `SupabaseRepository` 实现
4. API 路由通过依赖注入获取 Repository 实例

---

### 5.2 P1：影响核心体验

#### 5.2.1 Goals 残留清理

**现状**：`/api/goals` 路由、`useGoals` hook、`GoalsContext`/`GoalsProvider` 仍存在，但功能已被长任务替代

**清理清单**：
- [ ] 移除 `/api/goals` 路由
- [ ] 移除 `useGoals` hook
- [ ] 移除 `GoalsContext` / `GoalsProvider`
- [ ] 从 `layout.tsx` 移除 `GoalsProvider`
- [ ] 清理 `local-db.ts` 中的 goals 相关函数
- [ ] 清理 `HomeSidebar.tsx` 中的 goals 引用
- [ ] 清理任务 API 中 `goal_id` 字段（评估是否保留为向后兼容）

#### 5.2.2 任务 API 语义统一

**现状**：`PUT /api/tasks` 和 `PATCH /api/tasks/[id]` 功能重叠，PUT 不处理父任务进度重算

**重构方案**：
1. 废弃 `PUT /api/tasks`，所有更新走 `PATCH /api/tasks/[id]`
2. 前端 `useTasks.updateTaskStatusOptimistic` 统一使用 PATCH
3. 或将 PUT 改为真正的全量替换语义

#### 5.2.3 挑战奖励与分数制统一

**现状**：挑战 API 的 reward 使用 `snowball_size`（如 +5、+20），但雪球系统已切换为分数制

**重构方案**：
1. 挑战 reward 字段从 `snowball_size` 改为 `score`
2. 前端挑战完成时调用 `addScore('CHALLENGE_MILESTONE')` 或 `addScore('CHALLENGE_COMPLETED')`
3. 移除挑战 API 中直接操作 `growthData.snowball_size` 的代码

#### 5.2.4 Hooks 职责拆分

**现状**：`useRecords`（735行）和 `useTasks`（538行）各管理 6-8 个不相关职责

**拆分方案**：

```
useRecords →
  useRecordCRUD        (records, createRecord, deleteRecord, updateRecord)
  useRecordFeedback    (feedbackMap, loadingFeedbackMap, fetchFeedback)
  useConversation      (conversationsMap, followUpMap, answerFollowUp, continueChat)
  useCelebration       (celebrationType, showCelebration, feedbackMessage)

useTasks →
  useTaskCRUD          (tasks, createTask, updateTask, deleteTask)
  useTaskStats         (stats, goals)
  useQuadrant          (fetchQuadrantData, fetchThresholds, updateThresholds)
  useSubtasks          (fetchSubtasks, createSubtask)
  useHabitCheckin      (checkinHabit)
  useOptimisticUpdate  (updateTaskStatusOptimistic)
```

---

### 5.3 P2：提升可维护性

#### 5.3.1 类型安全加固

**现状**：`local-db.ts` 中 11 个集合使用 `any[]`，Hooks 中 `records`/`goals` 状态为 `any[]`

**重构方案**：
1. 为 `local-db.ts` 中每个集合定义具体类型接口
2. API 路由的请求/响应使用 Zod 做运行时验证
3. Hooks 的状态使用具体类型替代 `any`

#### 5.3.2 追问判断逻辑改进

**现状**：判断 AI 回复是否为追问基于字符串匹配（`？`/`说说`/`分享`/`能`/`可以`），在 `useRecords.ts` 中重复出现

**重构方案**：
1. 让 `/api/ai/feedback` 在响应中显式返回 `is_follow_up: boolean`
2. 前端只依赖结构化字段，不依赖内容字符串匹配
3. 将判断逻辑提取为独立函数

#### 5.3.3 错误处理统一

**现状**：API 响应格式不一致（有的包裹 `{ success: true }`，有的不包裹），Hooks 错误处理方式各异

**重构方案**：
1. 统一 API 响应格式：`{ success: boolean, data?: T, error?: string }`
2. 创建 `useApiCall` 封装统一的错误处理和认证检查
3. 401 响应自动跳转登录页

#### 5.3.4 成就定义统一

**现状**：`data-models.ts` 中 `cond_rule` 字符串和 `achievement-engine.ts` 中条件函数需手动同步

**重构方案**：
1. 删除 `cond_rule` 字符串，统一使用 `achievement-engine.ts` 中的条件函数
2. 或将条件函数内联到 `achievementDefinitions` 中

---

### 5.4 P3：改善代码质量

#### 5.4.1 页面组件拆分

**现状**：`tasks/page.tsx`（1108行）内联了 5 种任务卡片组件

**重构方案**：
1. 提取 TaskCard / KanbanCard / QuadrantTaskCard 为独立组件文件
2. 提取视图切换逻辑为 `useTaskView` hook
3. 常量配置（SCORE_TEXT_MAP 等）移入 `lib/` 目录

#### 5.4.2 Context Provider 按需加载

**现状**：`GoalsProvider` 在全局 layout 挂载但已废弃，`RecordsProvider` 全局挂载但非所有页面需要

**重构方案**：
1. 移除 `GoalsProvider`
2. 将 `RecordsProvider` 从全局 layout 移到实际使用的页面
3. 或让 Context 真正管理共享状态，避免重复 API 调用

#### 5.4.3 鼓励墙功能确认

**现状**：`/api/encouragement` 路由存在，但前端可能无使用入口

**待确认**：是否保留或清理

---

## 六、重构优先级路线图

```
Phase 1（1周）：清理与同步
├── 清理 Goals 残留代码
├── 废弃 PUT /api/tasks，统一 PATCH
├── 挑战奖励字段从 snowball_size 改为 score
├── 追问判断改用 is_follow_up 结构化字段
└── 成就定义统一为单一真相源

Phase 2（2-3周）：数据层重构
├── 定义 Repository 接口
├── 重构 local-db.ts 为 LocalJsonRepository
├── API 路由切换到 Repository 接口
└── 类型安全加固（消除 any）

Phase 3（2-3周）：认证与安全
├── 接入 Supabase Auth 或实现 JWT
├── 登录/注册 API 实现真实验证
├── 统一错误处理和 401 跳转
└── API 限流和输入验证（Zod）

Phase 4（2-3周）：前端架构优化
├── 拆分 useRecords / useTasks
├── 提取页面组件为独立文件
├── Context Provider 按需加载
└── 引入任务完成状态机
```

---

*本文档基于 2026-05-18 代码快照生成，替代 `docs/architecture.md` 和 `docs/api-design.md` 中的过时描述。*
