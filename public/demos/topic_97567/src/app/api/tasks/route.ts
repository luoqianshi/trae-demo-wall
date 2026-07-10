import { NextRequest } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';
import { calculateUrgency, calculateQuadrant, DEFAULT_THRESHOLDS, Thresholds } from '@/lib/quadrant-utils';

function getUserThresholds(userId: string): Thresholds {
  try {
    const thresholds = db.getThresholds(userId, 'normal');
    if (thresholds.length > 0) {
      const t = thresholds[0];
      return {
        critical: t.critical,
        high: t.high,
        medium: t.medium,
        low: t.low,
        none: t.none,
      };
    }
  } catch (err) {
    console.error('Error getting thresholds:', err);
  }
  return DEFAULT_THRESHOLDS;
}

function enrichTaskWithUrgency(task: any, thresholds: Thresholds): any {
  if (!task.due_date || !task.importance) return task;
  const urgency = calculateUrgency(task.due_date, thresholds);
  const quadrant = calculateQuadrant(task.importance, urgency);
  return { ...task, urgency, quadrant };
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const url = new URL(request.url);
    const goalId = url.searchParams.get('goal_id');
    const status = url.searchParams.get('status');
    const view = url.searchParams.get('view') || 'goal';
    const type = url.searchParams.get('type');

    let tasks = db.getTasks(userId, goalId || undefined);
    if (type) {
      tasks = tasks.filter((t: any) => t.task_type === type);
    }
    if (status) {
      tasks = tasks.filter((t: any) => t.status === status);
    }

    const thresholds = getUserThresholds(userId);
    tasks = tasks.map((t: any) => enrichTaskWithUrgency(t, thresholds));
    tasks = tasks.map((t: any) => ({ ...t, type: t.task_type }));

    if (view === 'goal') {
      const groups: any = {
        quick: tasks.filter((t: any) => t.type === 'quick'),
        normal: tasks.filter((t: any) => t.type === 'normal'),
        big: tasks.filter((t: any) => t.type === 'big'),
        habits: tasks.filter((t: any) => t.type === 'habit'),
      };
      const stats = {
        total_tasks: tasks.length,
        pending: tasks.filter((t: any) => t.status === 'pending').length,
        completed: tasks.filter((t: any) => t.status === 'completed').length,
        independent_tasks: tasks.filter((t: any) => !t.goal_id).length,
        by_type: {
          quick: groups.quick.length,
          normal: groups.normal.length,
          big: groups.big.length,
          habit: groups.habits.length,
        },
      };

      return createSuccessResponse({ tasks, groups, stats });
    }

    if (view === 'kanban') {
      return createSuccessResponse({
        columns: {
          pending: tasks.filter((t: any) => t.status === 'pending'),
          completed: tasks.filter((t: any) => t.status === 'completed'),
        },
        total: tasks.length,
      });
    }

    return createSuccessResponse({ tasks, total: tasks.length });
  } catch (error: any) {
    console.error('Error in tasks route:', error);
    return createErrorResponse(error.message || 'Failed to get tasks');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const {
      title, description, due_date, status,
      type, importance, parent_id, goal_id,
      frequency, target_count, reminder_time, thresholds
    } = await request.json();

    if (!title || typeof title !== 'string') {
      return createErrorResponse('Title is required and must be a string', 400);
    }

    if (title.length > 200) {
      return createErrorResponse('Title must be less than 200 characters', 400);
    }

    const validTaskTypes = ['normal', 'quick', 'big', 'habit'];
    if (type && !validTaskTypes.includes(type)) {
      return createErrorResponse('Invalid task type', 400);
    }

    const validStatuses = ['pending', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return createErrorResponse('Invalid status', 400);
    }

    if (importance !== undefined && (typeof importance !== 'number' || importance < 1 || importance > 5)) {
      return createErrorResponse('Importance must be a number between 1 and 5', 400);
    }

    const taskType = type || 'normal';

    const taskData: Record<string, any> = {
      user_id: userId,
      // 修复 R2-H3: 尊重调用方传入的 goal_id，而非硬编码 null
      goal_id: goal_id ?? null,
      title,
      description: description || null,
      task_type: taskType,
      importance,
      due_date: due_date || null,
      status: status || 'pending',
      parent_id: parent_id || null,
      progress: 0,
    };

    if (taskType === 'habit') {
      taskData.frequency = frequency || 'daily';
      taskData.target_count = target_count || null;
      taskData.reminder_time = reminder_time || null;
      taskData.current_streak = 0;
      taskData.best_streak = 0;
    }

    const task = db.createTask(taskData);

    if (taskType === 'big' && thresholds) {
      db.upsertThresholds(userId, {
        type: 'big',
        big_task_id: task.id,
        critical: thresholds.critical,
        high: thresholds.high,
        medium: thresholds.medium,
        low: thresholds.low,
        none: thresholds.none,
      });
    }

    return createSuccessResponse({ task: { ...task, type: task.task_type } }, 201);
  } catch (error: any) {
    console.error('Error in tasks route:', error);
    return createErrorResponse(error.message || 'Failed to create task');
  }
}

export async function PUT(request: NextRequest) {
  return createErrorResponse('PUT /api/tasks is deprecated. Use PATCH /api/tasks/[id] instead.', 410);
}

export async function DELETE(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const { id } = await request.json();

    if (!id) {
      return createErrorResponse('Task ID is required', 400);
    }

    // 修复 D-3: 校验任务属于当前用户
    const userTasks = db.getTasks(userId);
    if (!userTasks.find((t: any) => t.id === id)) {
      return createErrorResponse('Task not found', 404);
    }

    db.deleteTask(id);
    return createSuccessResponse({ success: true });
  } catch (error: any) {
    console.error('Error in tasks route:', error);
    return createErrorResponse(error.message || 'Failed to delete task');
  }
}
