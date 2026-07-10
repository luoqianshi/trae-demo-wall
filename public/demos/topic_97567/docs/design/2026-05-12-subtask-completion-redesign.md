# 子任务完成流程重设计

## 背景

当前子任务完成后自动删除的机制与任务三种状态（pending/in_progress/completed）存在冲突：

1. 子任务完成后立即删除，导致数据库中永远不存在 `status='completed'` 的子任务
2. 长任务进度计算失真——PATCH 端点通过 `siblings.filter(status==='completed')` 计算进度，但已删除的子任务不参与计算
3. 用户无法回看已完成的子任务
4. 无法判断"所有子任务都完成了"

## 设计决策

### 方案选择

采用方案 C：**子任务保留 + 长任务进度100%不自动完成**

- 子任务完成后标记为 `completed`，灰显保留在列表中
- 长任务进度达到100%后仍需用户手动完成
- 长任务删除时级联删除所有子任务

## 详细设计

### 1. 子任务完成流程

**变更前**：
```
用户点击完成 → 播放动画 → deleteTask → 子任务从数据库删除
```

**变更后**：
```
用户点击完成 → 播放动画 → patchTask({ status: 'completed' }) → 后端重算父任务进度 → 子任务灰显保留
```

**UI 表现**：
- 已完成子任务：灰色文字 + 删除线
- 排序：pending/in_progress 在前，completed 在后
- 可点击取消完成，恢复 pending 状态

### 2. 长任务完成流程

**行为**：
- progress < 100%：用户可手动点击完成
- progress = 100%：用户仍需手动点击完成，不自动触发

**视觉提示**：
当所有子任务已完成（progress = 100%）时，长任务卡片显示提示：
```
进度条: [██████████] 100%
提示: ✨ 所有子任务已完成，点击完成长任务
```

**级联删除**：
长任务删除时，数据库通过 `ON DELETE CASCADE` 自动删除所有子任务。

### 3. 数据库变更

检查并确保 `tasks` 表的 `parent_id` 外键配置了级联删除：

```sql
-- 如果尚未配置，需要添加迁移
ALTER TABLE tasks
DROP CONSTRAINT IF EXISTS tasks_parent_id_fkey,
ADD CONSTRAINT tasks_parent_id_fkey
FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE;
```

### 4. 后端 API 变更

| 端点 | 变更 |
|------|------|
| `PATCH /api/tasks/[id]` | 无需修改，已有父任务进度重算逻辑 |
| `DELETE /api/tasks/[id]` | 无需修改，级联删除由数据库处理 |

### 5. 前端变更

**文件**：`src/app/tasks/page.tsx`

**变更点**：

| 位置 | 变更内容 |
|------|---------|
| `handleStatusChange` 子任务分支 | `deleteTask(taskId)` → `patchTask(taskId, { status: 'completed' })` |
| `SubtaskItem` 组件 | 已完成子任务灰显+删除线 |
| 子任务排序 | `completed` 状态的排末尾 |
| `TaskCard` 进度条区域 | progress=100% 时显示提示文案 |

### 6. 完整流程图

```
用户点击子任务复选框
       ↓
播放光晕+浮动得分动画
       ↓
PATCH /api/tasks/[id] { status: 'completed' }
       ↓
后端重算父任务 progress = completed数/总数×100%
       ↓
前端乐观更新 subtasksMap
       ↓
子任务灰显+删除线，排到列表末尾
       ↓
如果 progress=100%，长任务卡片显示提示
       ↓
用户点击长任务完成按钮
       ↓
庆祝动画 + 创建记录 + DELETE 长任务
       ↓
数据库级联删除所有子任务
```

## 实现任务清单

1. [ ] 检查数据库 `parent_id` 外键是否配置 `ON DELETE CASCADE`
2. [ ] 修改 `handleStatusChange` 子任务分支：`deleteTask` → `patchTask`
3. [ ] 修改 `SubtaskItem` 组件：已完成子任务灰显+删除线
4. [ ] 添加子任务排序逻辑：completed 排末尾
5. [ ] 添加长任务 progress=100% 提示文案
6. [ ] 构建验证

## 风险与边界情况

| 风险 | 处理方式 |
|------|---------|
| 大量子任务完成后列表过长 | 已完成子任务灰显+排末尾，视觉上区分明显 |
| 用户误点完成子任务 | 支持点击取消完成，恢复 pending 状态 |
| 长任务删除后子任务成为孤儿 | 数据库级联删除确保一致性 |
