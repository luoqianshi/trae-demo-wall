import { NextRequest } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';
import { DEFAULT_THRESHOLDS, calculateUrgency, calculateQuadrant, Thresholds } from '@/lib/quadrant-utils';

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
  const enriched = { ...task, type: task.task_type };
  if (!task.due_date || !task.importance) return enriched;
  const urgency = calculateUrgency(task.due_date, thresholds);
  const quadrant = calculateQuadrant(task.importance, urgency);
  return { ...enriched, urgency, quadrant };
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const url = new URL(request.url);
    const view = url.searchParams.get('view') || 'global';
    const bigTaskId = url.searchParams.get('big_task_id');

    if (view === 'big' && !bigTaskId) {
      return createErrorResponse('big_task_id is required when view=big', 400);
    }

    const allTasks = db.getTasks(userId);
    let filteredTasks = allTasks;

    if (view === 'big' && bigTaskId) {
      filteredTasks = allTasks.filter((t: any) => t.parent_id === bigTaskId);
    } else if (view === 'normal') {
      filteredTasks = allTasks.filter((t: any) => t.task_type === 'normal');
    } else {
      filteredTasks = allTasks.filter((t: any) => !t.parent_id);
    }

    const thresholds = getUserThresholds(userId);
    filteredTasks = filteredTasks.map((t: any) => enrichTaskWithUrgency(t, thresholds));

    const quadrants = buildQuadrants(filteredTasks);
    return createSuccessResponse({
      quadrants,
      thresholds,
    });
  } catch (error: any) {
    console.error('Error in quadrant route:', error);
    return createErrorResponse(error.message || 'Failed to get quadrant data');
  }
}

function buildQuadrants(tasks: any[]) {
  const q1Tasks = tasks.filter(t => t.quadrant === 1);
  const q2Tasks = tasks.filter(t => t.quadrant === 2);
  const q3Tasks = tasks.filter(t => t.quadrant === 3);
  const q4Tasks = tasks.filter(t => t.quadrant === 4 || t.quadrant === undefined);

  return {
    q1: { count: q1Tasks.length, tasks: q1Tasks },
    q2: { count: q2Tasks.length, tasks: q2Tasks },
    q3: { count: q3Tasks.length, tasks: q3Tasks },
    q4: { count: q4Tasks.length, tasks: q4Tasks },
  };
}
