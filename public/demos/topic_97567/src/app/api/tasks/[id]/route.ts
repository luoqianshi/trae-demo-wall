import { NextRequest } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';
import { calculateUrgency, calculateQuadrant, DEFAULT_THRESHOLDS } from '@/lib/quadrant-utils';

export async function GET(
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
    const tasks = db.getTasks(userId);
    const task = tasks.find((t: any) => t.id === id);
    if (!task) return createErrorResponse('Task not found', 404);

    const subtasks = tasks.filter((t: any) => t.parent_id === id);

    if (task.due_date && task.importance) {
      const urgency = calculateUrgency(task.due_date, DEFAULT_THRESHOLDS);
      const quadrant = calculateQuadrant(task.importance, urgency);
      (task as any).urgency = urgency;
      (task as any).quadrant = quadrant;
    }

    return createSuccessResponse({ task: { ...task, type: task.task_type, subtasks } });
  } catch (error: any) {
    console.error('Error in task detail route:', error);
    return createErrorResponse(error.message || 'Failed to get task');
  }
}

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

    // 修复 R2-H2: PATCH 也需要校验任务归属
    const userTasks = db.getTasks(userId);
    if (!userTasks.find((t: any) => t.id === id)) {
      return createErrorResponse('Task not found', 404);
    }

    const allowedFields = ['title', 'description', 'due_date', 'importance', 'status', 'goal_id', 'frequency', 'target_count', 'reminder_time', 'progress', 'thresholds'];
    const filteredUpdates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    const wasCompleted = updates.status === 'completed';
    let taskType: string | undefined;
    let wasAlreadyCompleted = false;
    let parentId: string | null = null;

    if (wasCompleted) {
      const currentTask = userTasks.find((t: any) => t.id === id);
      taskType = currentTask?.task_type;
      wasAlreadyCompleted = currentTask?.status === 'completed';
      parentId = currentTask?.parent_id ?? null;
      // completed_at 由 repository 层(completeTaskWithScore/updateTask)统一设置
    }

    if (wasCompleted && !wasAlreadyCompleted) {
      // 原子化：任务完成 + 积分发放在同一事务中，避免部分成功
      let action: string;
      if (taskType === 'quick') action = 'TASK_QUICK_COMPLETED';
      else if (taskType === 'big') action = 'BIG_TASK_COMPLETED';
      else if (taskType === 'habit') action = 'HABIT_CHECKIN';
      else if (parentId) action = 'SUBTASK_COMPLETED';
      else action = 'TASK_NORMAL_COMPLETED';
      const task = db.completeTaskWithScore(id, filteredUpdates, userId, action as any, id);
      return createSuccessResponse({ task: { ...task, type: task.task_type } });
    }

    const task = db.updateTask(id, filteredUpdates);
    return createSuccessResponse({ task: { ...task, type: task.task_type } });
  } catch (error: any) {
    console.error('Error in task patch route:', error);
    return createErrorResponse(error.message || 'Failed to update task');
  }
}

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
    // 修复 D-3: 校验任务属于当前用户
    const userTasks = db.getTasks(userId);
    if (!userTasks.find((t: any) => t.id === id)) {
      return createErrorResponse('Task not found', 404);
    }

    db.deleteTask(id);
    return createSuccessResponse({ success: true });
  } catch (error: any) {
    console.error('Error in task delete route:', error);
    return createErrorResponse(error.message || 'Failed to delete task');
  }
}
