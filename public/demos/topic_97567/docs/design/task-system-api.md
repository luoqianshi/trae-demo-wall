# 任务系统 API 设计文档 V2.5

> 设计日期: 2026-05-08
> 状态: 待开发
> 关联设计: [任务系统设计方案](./task-system-design.md)

---

## 一、API 端点概览

### 1.1 任务 CRUD

| 方法 | 端点 | 描述 | 认证 |
|-----|------|------|------|
| `GET` | `/api/tasks` | 获取任务列表（支持视图筛选） | ✅ |
| `POST` | `/api/tasks` | 创建任务 | ✅ |
| `GET` | `/api/tasks/{id}` | 获取单个任务详情 | ✅ |
| `PATCH` | `/api/tasks/{id}` | 更新任务 | ✅ |
| `DELETE` | `/api/tasks/{id}` | 删除任务 | ✅ |

### 1.2 子任务

| 方法 | 端点 | 描述 | 认证 |
|-----|------|------|------|
| `GET` | `/api/tasks/{id}/subtasks` | 获取子任务列表 | ✅ |
| `POST` | `/api/tasks/{id}/subtasks` | 添加子任务 | ✅ |
| `PATCH` | `/api/tasks/{id}/subtasks/{subtaskId}` | 更新子任务 | ✅ |
| `DELETE` | `/api/tasks/{id}/subtasks/{subtaskId}` | 删除子任务 | ✅ |

### 1.3 四象限与阈值

| 方法 | 端点 | 描述 | 认证 |
|-----|------|------|------|
| `GET` | `/api/tasks/quadrant` | 获取四象限分布数据 | ✅ |
| `GET` | `/api/tasks/thresholds` | 获取紧急度阈值配置 | ✅ |
| `PUT` | `/api/tasks/thresholds` | 更新紧急度阈值配置 | ✅ |

---

## 二、请求/响应详细定义

### 2.1 GET /api/tasks

获取任务列表，支持多种视图和筛选。

**Query 参数**:

```typescript
{
  view?: 'goal' | 'list' | 'kanban' | 'quadrant';  // 视图类型，默认 'goal'
  type?: 'quick' | 'normal' | 'big' | 'habit';      // 按任务类型筛选
  status?: 'pending' | 'in_progress' | 'completed';  // 按状态筛选
  goal_id?: string;                                  // 长任务ID，获取子任务时用
}
```

**响应** (view='goal'):

```typescript
{
  success: true;
  data: {
    groups: {
      quick: Task[];      // ⚡ 快速任务
      normal: Task[];     // 📋 普通任务
      big: Task[];        // 🎯 长任务（含子任务）
      habits: Task[];     // 🔄 习惯
    };
    stats: {
      total: number;
      pending: number;
      in_progress: number;
      completed: number;
      by_type: {
        quick: number;
        normal: number;
        big: number;
        habit: number;
      };
    };
  };
}
```

**响应** (view='list'):

```typescript
{
  success: true;
  data: {
    tasks: Task[];        // 平铺的任务列表
    total: number;
  };
}
```

**响应** (view='kanban'):

```typescript
{
  success: true;
  data: {
    columns: {
      pending: Task[];      // 待完成
      in_progress: Task[];  // 进行中
      completed: Task[];    // 已完成
    };
    total: number;
  };
}
```

---

### 2.2 POST /api/tasks

创建新任务，根据类型不同，请求体字段不同。

**请求头**:
```
Content-Type: application/json
Authorization: Bearer {token}
```

**请求体** - 快速任务:

```typescript
{
  type: 'quick';
  title: string;        // 必填，任务标题
}
```

**请求体** - 普通任务:

```typescript
{
  type: 'normal';
  title: string;                    // 必填
  description?: string;             // 可选
  importance: 1 | 2 | 3 | 4 | 5;    // 必填，默认 3
  due_date?: string;                // 可选，ISO 8601 格式
}
```

**请求体** - 长任务:

```typescript
{
  type: 'big';
  title: string;                    // 必填
  description?: string;             // 可选
  importance: 1 | 2 | 3 | 4 | 5;    // 必填，默认 3
  due_date?: string;                // 可选，ISO 8601 格式
  thresholds?: {                    // 可选，子任务紧急度阈值
    critical: number;   // 默认 1
    high: number;       // 默认 3
    medium: number;     // 默认 7
    low: number;        // 默认 14
    none: number;       // 默认 30
  };
}
```

**请求体** - 习惯:

```typescript
{
  type: 'habit';
  title: string;                              // 必填
  description?: string;                       // 可选
  frequency: 'daily' | 'weekly' | 'custom';   // 必填
  target_count?: number;                      // 可选，每周目标次数
  reminder_time?: string;                     // 可选，HH:MM 格式
}
```

**响应**:

```typescript
{
  success: true;
  data: {
    task: Task;           // 创建的任务详情
  };
}
```

**错误响应**:

```typescript
{
  success: false;
  error: {
    code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'INTERNAL_ERROR';
    message: string;
    details?: Record<string, string>;  // 字段级错误信息
  };
}
```

---

### 2.3 GET /api/tasks/{id}

获取单个任务详情。

**路径参数**:
- `id`: 任务 ID

**响应**:

```typescript
{
  success: true;
  data: {
    task: Task;
  };
}
```

---

### 2.4 PATCH /api/tasks/{id}

更新任务信息。

**请求体** (部分更新):

```typescript
{
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  importance?: 1 | 2 | 3 | 4 | 5;
  due_date?: string | null;
  // ... 其他可更新字段
}
```

**响应**:

```typescript
{
  success: true;
  data: {
    task: Task;           // 更新后的任务
  };
}
```

---

### 2.5 DELETE /api/tasks/{id}

删除任务。

**响应**:

```typescript
{
  success: true;
  data: {
    message: 'Task deleted successfully';
  };
}
```

---

### 2.6 GET /api/tasks/{id}/subtasks

获取长任务的子任务列表。

**响应**:

```typescript
{
  success: true;
  data: {
    subtasks: Task[];     // 子任务列表
    total: number;
    progress: number;     // 完成进度 0-100
  };
}
```

---

### 2.7 POST /api/tasks/{id}/subtasks

为长任务添加子任务。

**请求体**:

```typescript
{
  title: string;                    // 必填
  description?: string;             // 可选
  importance: 1 | 2 | 3 | 4 | 5;    // 必填，默认 3
  due_date?: string;                // 可选
}
```

**响应**:

```typescript
{
  success: true;
  data: {
    subtask: Task;        // 创建的子任务
    parent: Task;         // 更新后的父任务（含新进度）
  };
}
```

---

### 2.8 GET /api/tasks/quadrant

获取四象限分布数据。

**Query 参数**:

```typescript
{
  view: 'global' | 'big' | 'normal';  // 必填
  big_task_id?: string;               // 当 view='big' 时必填
}
```

**响应** (view='global'):

```typescript
{
  success: true;
  data: {
    quadrants: {
      q1: {                             // 🔥 立即做（重要+紧急）
        count: number;
        tasks: Task[];
      };
      q2: {                             // 📅 计划做（重要+不紧急）
        count: number;
        tasks: Task[];
      };
      q3: {                             // 📋 委托（不重要+紧急）
        count: number;
        tasks: Task[];
      };
      q4: {                             // 🗑️ 删除（不重要+不紧急）
        count: number;
        tasks: Task[];
      };
    };
    thresholds: {                       // 使用的阈值配置
      critical: number;
      high: number;
      medium: number;
      low: number;
      none: number;
    };
  };
}
```

---

### 2.9 GET /api/tasks/thresholds

获取用户的紧急度阈值配置。

**响应**:

```typescript
{
  success: true;
  data: {
    normal: {              // 普通任务默认阈值
      critical: number;    // 默认 1
      high: number;        // 默认 3
      medium: number;      // 默认 7
      low: number;         // 默认 14
      none: number;        // 默认 30
    };
    big_tasks: {           // 各长任务的自定义阈值
      [big_task_id: string]: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        none: number;
      };
    };
  };
}
```

---

### 2.10 PUT /api/tasks/thresholds

更新紧急度阈值配置。

**请求体**:

```typescript
{
  type: 'normal' | 'big';    // 更新哪种类型的阈值
  big_task_id?: string;      // 当 type='big' 时必填
  thresholds: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    none: number;
  };
}
```

**响应**:

```typescript
{
  success: true;
  data: {
    thresholds: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      none: number;
    };
  };
}
```

---

## 三、数据模型

### 3.1 Task 模型

```typescript
interface Task {
  // 基础信息
  id: string;
  title: string;
  description?: string;
  type: 'quick' | 'normal' | 'big' | 'habit';
  
  // 状态
  status: 'pending' | 'in_progress' | 'completed';
  
  // 优先级（普通任务/长任务/子任务）
  importance?: 1 | 2 | 3 | 4 | 5;  // 1=极低, 5=极高
  
  // 紧急度（自动计算）
  due_date?: string;           // ISO 8601 格式
  urgency?: 'critical' | 'high' | 'medium' | 'low' | 'none';
  quadrant?: 1 | 2 | 3 | 4;    // 四象限位置
  
  // 长任务特有
  parent_id?: string;          // 子任务指向父任务
  progress?: number;           // 0-100，基于子任务完成度
  total_subtasks?: number;
  completed_subtasks?: number;
  thresholds?: {               // 子任务紧急度阈值
    critical: number;
    high: number;
    medium: number;
    low: number;
    none: number;
  };
  
  // 习惯特有
  frequency?: 'daily' | 'weekly' | 'custom';
  target_count?: number;       // 每周目标次数
  current_streak?: number;     // 当前连续天数
  best_streak?: number;        // 最佳连续天数
  reminder_time?: string;      // 提醒时间 HH:MM
  
  // 元数据
  user_id: string;
  created_at: string;          // ISO 8601 格式
  updated_at: string;
  completed_at?: string;
}
```

### 3.2 数据库表结构

```sql
-- 任务表
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('quick', 'normal', 'big', 'habit')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  
  -- 优先级
  importance INTEGER CHECK (importance BETWEEN 1 AND 5),
  
  -- 紧急度（自动计算）
  due_date TIMESTAMP,
  urgency TEXT CHECK (urgency IN ('critical', 'high', 'medium', 'low', 'none')),
  quadrant INTEGER CHECK (quadrant BETWEEN 1 AND 4),
  
  -- 长任务关联
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  
  -- 习惯字段
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'custom')),
  target_count INTEGER,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  reminder_time TEXT,
  
  -- 元数据
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- 阈值配置表
CREATE TABLE task_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('normal', 'big')),
  big_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  critical INTEGER DEFAULT 1,
  high INTEGER DEFAULT 3,
  medium INTEGER DEFAULT 7,
  low INTEGER DEFAULT 14,
  none INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, type, big_task_id)
);

-- 索引
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_type ON tasks(type);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_quadrant ON tasks(quadrant);
```

---

## 四、业务逻辑

### 4.1 紧急度计算

```typescript
function calculateUrgency(
  dueDate: string | undefined,
  thresholds: Thresholds
): 'critical' | 'high' | 'medium' | 'low' | 'none' | undefined {
  if (!dueDate) return undefined;
  
  const daysUntilDue = Math.ceil(
    (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysUntilDue <= thresholds.critical) return 'critical';  // 🔥
  if (daysUntilDue <= thresholds.high) return 'high';          // ⚡
  if (daysUntilDue <= thresholds.medium) return 'medium';      // 📅
  if (daysUntilDue <= thresholds.low) return 'low';            // ⏰
  return 'none';                                               // 🗓️
}
```

### 4.2 四象限计算

```typescript
function calculateQuadrant(
  importance: number | undefined,
  urgency: string | undefined
): 1 | 2 | 3 | 4 | undefined {
  if (!importance || !urgency) return undefined;
  
  const isImportant = importance >= 4;  // 4或5分为重要
  
  const urgencyLevel = {
    'critical': 4, 'high': 3, 'medium': 2, 'low': 1, 'none': 0
  }[urgency] ?? 0;
  
  const isUrgent = urgencyLevel >= 3;   // critical或high为紧急
  
  if (isImportant && isUrgent) return 1;      // 🔥 立即做
  if (isImportant && !isUrgent) return 2;     // 📅 计划做
  if (!isImportant && isUrgent) return 3;     // 📋 委托
  return 4;                                    // 🗑️ 删除
}
```

### 4.3 长任务进度计算

```typescript
function calculateBigTaskProgress(subtasks: Task[]): number {
  if (subtasks.length === 0) return 0;
  
  const completed = subtasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / subtasks.length) * 100);
}
```

---

## 五、错误码

| 错误码 | 描述 | HTTP 状态码 |
|-------|------|-----------|
| `VALIDATION_ERROR` | 请求参数验证失败 | 400 |
| `UNAUTHORIZED` | 未授权，Token 无效或过期 | 401 |
| `FORBIDDEN` | 无权访问该资源 | 403 |
| `NOT_FOUND` | 任务不存在 | 404 |
| `INVALID_TASK_TYPE` | 无效的任务类型 | 400 |
| `INVALID_IMPORTANCE` | 无效的重要性级别 | 400 |
| `INVALID_DATE_FORMAT` | 日期格式错误 | 400 |
| `INTERNAL_ERROR` | 服务器内部错误 | 500 |

---

## 六、变更记录

| 日期 | 变更内容 |
|-----|---------|
| 2026-05-08 | 初始 API 设计 |

---

## 相关文档

- [任务系统设计方案](./task-system-design.md)
- [项目状态文档](../PROJECT_STATUS.md)
