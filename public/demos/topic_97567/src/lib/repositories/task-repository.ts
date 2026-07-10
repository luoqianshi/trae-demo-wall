// Task repository: CRUD operations for tasks.
// Migrated from local-db.ts with transactional writes.

import { readData, withTransaction, generateId } from './base';
import { calculateUrgency, calculateQuadrant, DEFAULT_THRESHOLDS } from '../quadrant-utils';
import { SCORE_VALUES } from '../snowball-score';
import type { Task, ScoreEvent } from '../types/entities';

export function getTasks(userId: string, goalId?: string | null, parentId?: string | null): Task[] {
  const data = readData();
  let tasks = data.tasks.filter((t) => t.user_id === userId);
  if (goalId !== undefined && goalId !== null) tasks = tasks.filter((t) => t.goal_id === goalId);
  if (parentId !== undefined && parentId !== null) tasks = tasks.filter((t) => t.parent_id === parentId);
  return tasks;
}

export function createTask(taskData: any): Task {
  return withTransaction((data) => {
    const task_type: string = taskData.task_type || 'normal';
    const importance = task_type === 'quick' || task_type === 'habit' ? null : (taskData.importance || 3);
    const urgency = taskData.due_date ? calculateUrgency(taskData.due_date, DEFAULT_THRESHOLDS) : null;
    const quadrant = importance && urgency ? calculateQuadrant(importance, urgency) : null;

    const newTask: any = {
      id: generateId(),
      ...taskData,
      task_type,
      status: taskData.status || 'pending',
      importance,
      urgency,
      quadrant,
      goal_id: taskData.goal_id ?? null,
      parent_id: taskData.parent_id || null,
      progress: taskData.progress ?? 0,
      frequency: taskData.frequency || null,
      target_count: taskData.target_count || null,
      current_streak: taskData.current_streak ?? 0,
      best_streak: taskData.best_streak ?? 0,
      reminder_time: taskData.reminder_time || null,
      completed_at: taskData.completed_at ?? null,
      order_index: taskData.order_index || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    data.tasks.push(newTask);
    return newTask;
  });
}

export function updateTask(taskId: string, updates: any): Task {
  return withTransaction((data) => {
    const idx = data.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) throw new Error('Task not found');

    const oldTask = data.tasks[idx];
    const wasNotCompleted = oldTask.status !== 'completed';

    const appliedUpdates: any = { ...updates };
    if (updates.status === 'completed' && wasNotCompleted) {
      appliedUpdates.completed_at = new Date().toISOString();
    } else if (updates.status !== 'completed' && oldTask.status === 'completed') {
      appliedUpdates.completed_at = null;
    }

    data.tasks[idx] = { ...oldTask, ...appliedUpdates, updated_at: new Date().toISOString() };
    const task = data.tasks[idx];

    if (task.due_date && task.importance) {
      const urgency = calculateUrgency(task.due_date, DEFAULT_THRESHOLDS);
      task.urgency = urgency ?? null;
      task.quadrant = calculateQuadrant(task.importance, urgency) ?? null;
    }

    if (updates.status === 'completed' && wasNotCompleted) {
      const growthIdx = data.growthData.findIndex((g) => g.user_id === task.user_id);
      if (growthIdx !== -1) {
        data.growthData[growthIdx].tasks_completed += 1;
      }
    }

    if (task.parent_id) {
      recalcParentProgress(data, task.parent_id);
    }

    return data.tasks[idx];
  });
}

/**
 * Atomically update a task and award score if it transitions to completed.
 *
 * Combines updateTask + addScoreEvent into a single transaction to prevent
 * partial state on failure (e.g., task marked complete but no score awarded).
 */
export function completeTaskWithScore(
  taskId: string,
  updates: any,
  userId: string,
  scoreAction: keyof typeof SCORE_VALUES,
  scoreRefId?: string,
): Task {
  return withTransaction((data) => {
    const idx = data.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) throw new Error('Task not found');

    const oldTask = data.tasks[idx];
    const wasNotCompleted = oldTask.status !== 'completed';

    const appliedUpdates: any = { ...updates };
    if (updates.status === 'completed' && wasNotCompleted) {
      appliedUpdates.completed_at = new Date().toISOString();
    } else if (updates.status !== 'completed' && oldTask.status === 'completed') {
      appliedUpdates.completed_at = null;
    }

    data.tasks[idx] = { ...oldTask, ...appliedUpdates, updated_at: new Date().toISOString() };
    const task = data.tasks[idx];

    if (task.due_date && task.importance) {
      const urgency = calculateUrgency(task.due_date, DEFAULT_THRESHOLDS);
      task.urgency = urgency ?? null;
      task.quadrant = calculateQuadrant(task.importance, urgency) ?? null;
    }

    if (updates.status === 'completed' && wasNotCompleted) {
      const growthIdx = data.growthData.findIndex((g) => g.user_id === task.user_id);
      if (growthIdx !== -1) {
        data.growthData[growthIdx].tasks_completed += 1;
      }
      // Award score atomically in the same transaction
      const scoreEvent: ScoreEvent = {
        id: generateId(),
        user_id: userId,
        action: scoreAction,
        score: SCORE_VALUES[scoreAction],
        ref_id: scoreRefId,
        created_at: new Date().toISOString(),
      };
      data.scoreEvents.push(scoreEvent);
    }

    if (task.parent_id) {
      recalcParentProgress(data, task.parent_id);
    }

    return data.tasks[idx];
  });
}

export function deleteTask(taskId: string): boolean {
  return withTransaction((data) => {
    const idx = data.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) throw new Error('Task not found');

    data.tasks.splice(idx, 1);

    // Cascade delete subtasks
    for (let i = data.tasks.length - 1; i >= 0; i--) {
      if (data.tasks[i].parent_id === taskId) {
        data.tasks.splice(i, 1);
      }
    }

    return true;
  });
}

function recalcParentProgress(data: any, parentId: string): void {
  const parentIdx = data.tasks.findIndex((t: any) => t.id === parentId);
  if (parentIdx === -1) return;
  const subtasks = data.tasks.filter((t: any) => t.parent_id === parentId);
  if (subtasks.length > 0) {
    const completed = subtasks.filter((s: any) => s.status === 'completed').length;
    data.tasks[parentIdx].progress = Math.round((completed / subtasks.length) * 100);
  }
}
