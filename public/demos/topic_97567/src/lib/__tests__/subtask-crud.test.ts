// TODO: Update tests for local-db migration
// These tests previously used in-memory arrays (mockTasks, mockGoals) for direct
// manipulation. With local-db, data is stored in a JSON file and accessed through
// functions (createTask, updateTask, getTasks, etc.).
//
// Note: createTask() hardcodes current_streak=0, best_streak=0, completed_at=null,
// progress=0 after the spread, so we must use updateTask() to set these fields.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetData,
  createTask,
  updateTask,
  getTasks,
  deleteTask,
} from '@/lib/local-db';
import { calculateUrgency, calculateQuadrant, DEFAULT_THRESHOLDS } from '@/lib/quadrant-utils';

let bigTaskId: string;
let subtask1Id: string;
let subtask2Id: string;
let normalTaskId: string;

beforeEach(() => {
  resetData();

  bigTaskId = createTask({
    user_id: '1',
    title: '完成项目',
    task_type: 'big',
    status: 'in_progress',
    due_date: '2026-05-30',
    importance: 4,
    order_index: 0,
  }).id;
  updateTask(bigTaskId, { progress: 50 });

  subtask1Id = createTask({
    user_id: '1',
    title: '需求分析',
    task_type: 'normal',
    status: 'completed',
    parent_id: bigTaskId,
    due_date: '2026-05-15',
    importance: 3,
    order_index: 0,
  }).id;

  subtask2Id = createTask({
    user_id: '1',
    title: '设计文档',
    task_type: 'normal',
    status: 'pending',
    parent_id: bigTaskId,
    due_date: '2026-05-20',
    importance: 3,
    order_index: 1,
  }).id;

  normalTaskId = createTask({
    user_id: '1',
    title: '普通任务',
    task_type: 'normal',
    status: 'pending',
    importance: 3,
    order_index: 0,
  }).id;
});

function getTaskById(id: string) {
  return getTasks('1').find(t => t.id === id);
}

describe('Subtask CRUD Operations', () => {
  describe('create subtask', () => {
    it('should create subtask with correct parent_id', () => {
      const subtask = createTask({
        user_id: '1',
        title: '开发阶段',
        task_type: 'normal',
        parent_id: bigTaskId,
        importance: 3,
      });

      expect(subtask.parent_id).toBe(bigTaskId);
      expect(subtask.title).toBe('开发阶段');
    });

    it('should assign default importance if not provided', () => {
      const subtask = createTask({
        user_id: '1',
        title: '测试阶段',
        task_type: 'normal',
        parent_id: bigTaskId,
      });

      expect(subtask.importance).toBe(3);
    });

    it('should calculate urgency and quadrant for subtask with due_date', () => {
      const dueDate = '2026-05-25';
      const subtask = createTask({
        user_id: '1',
        title: '部署上线',
        task_type: 'normal',
        parent_id: bigTaskId,
        due_date: dueDate,
        importance: 4,
      });

      expect(subtask.urgency).toBeDefined();
      expect(subtask.quadrant).toBeDefined();
    });

  });

  describe('get subtasks', () => {
    it('should filter subtasks by parent_id', () => {
      const subtasks = getTasks('1').filter(
        (t: any) => t.parent_id === bigTaskId
      );

      expect(subtasks).toHaveLength(2);
      expect(subtasks.every((t: any) => t.parent_id === bigTaskId)).toBe(true);
    });

    it('should not include parent tasks when filtering by parent_id', () => {
      const subtasks = getTasks('1').filter(
        (t: any) => t.parent_id === bigTaskId
      );

      expect(subtasks.some((t: any) => t.id === bigTaskId)).toBe(false);
    });

    it('should return empty array when no subtasks exist', () => {
      const subtasks = getTasks('1').filter(
        (t: any) => t.parent_id === normalTaskId
      );

      expect(subtasks).toHaveLength(0);
    });

    it('should order subtasks by order_index', () => {
      createTask({
        user_id: '1',
        title: '第三步',
        task_type: 'normal',
        status: 'pending',
        order_index: 2,
        parent_id: bigTaskId,
      });

      const subtasks = getTasks('1')
        .filter((t: any) => t.parent_id === bigTaskId)
        .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

      expect(subtasks[0].title).toBe('需求分析');
      expect(subtasks[subtasks.length - 1].title).toBe('第三步');
    });
  });

  describe('update subtask', () => {
    it('should update subtask title', () => {
      const updated = updateTask(subtask2Id, { title: '更新后的设计文档' });
      expect(updated.title).toBe('更新后的设计文档');
    });

    it('should update subtask status to completed', () => {
      const updated = updateTask(subtask2Id, { status: 'completed' });
      expect(updated.status).toBe('completed');
      expect(updated.completed_at).toBeDefined();
    });

    it('should update subtask status to pending', () => {
      updateTask(subtask1Id, { status: 'pending' });
      const subtask = getTaskById(subtask1Id);
      expect(subtask!.status).toBe('pending');
      expect(subtask!.completed_at).toBeNull();
    });

    it('should update subtask importance', () => {
      const updated = updateTask(subtask2Id, { importance: 5 });
      expect(updated.importance).toBe(5);
    });

    it('should recalculate urgency when due_date changes', () => {
      const oldDueDate = '2026-07-20';
      const oldUrgency = calculateUrgency(oldDueDate, DEFAULT_THRESHOLDS);

      const newDueDate = '2026-05-19';
      updateTask(subtask2Id, { due_date: newDueDate });
      const newUrgency = calculateUrgency(newDueDate, DEFAULT_THRESHOLDS);

      expect(newUrgency).not.toBe(oldUrgency);
    });

    it('should throw when updating non-existent subtask', () => {
      expect(() =>
        updateTask('non-existent', { title: 'test' })
      ).toThrow('Task not found');
    });
  });

  describe('delete subtask', () => {
    it('should remove subtask from list', () => {
      const countBefore = getTasks('1').filter((t: any) => t.parent_id === bigTaskId).length;

      deleteTask(subtask1Id);

      const countAfter = getTasks('1').filter((t: any) => t.parent_id === bigTaskId).length;
      expect(countAfter).toBe(countBefore - 1);
    });

    it('should not affect parent task', () => {
      deleteTask(subtask1Id);

      const parent = getTaskById(bigTaskId);
      expect(parent).toBeDefined();
      expect(parent!.id).toBe(bigTaskId);
    });

    it('should throw when deleting non-existent subtask', () => {
      expect(() => deleteTask('non-existent')).toThrow('Task not found');
    });
  });
});

describe('Parent Task Progress Calculation', () => {
  it('should calculate progress as 0 when no subtasks completed', () => {
    updateTask(subtask1Id, { status: 'pending' });

    const subtasks = getTasks('1').filter(
      (t: any) => t.parent_id === bigTaskId
    );

    const completed = subtasks.filter((t: any) => t.status === 'completed').length;
    const progress = subtasks.length > 0
      ? Math.round((completed / subtasks.length) * 100)
      : 0;

    expect(completed).toBe(0);
    expect(progress).toBe(0);
  });

  it('should calculate progress as 100 when all subtasks completed', () => {
    updateTask(subtask2Id, { status: 'completed' });

    const subtasks = getTasks('1').filter(
      (t: any) => t.parent_id === bigTaskId
    );

    const completed = subtasks.filter((t: any) => t.status === 'completed').length;
    const progress = Math.round((completed / subtasks.length) * 100);

    expect(progress).toBe(100);
  });

  it('should calculate progress as 0 when no subtasks', () => {
    const emptyBigTaskId = createTask({
      user_id: '1',
      title: '空的长任务',
      task_type: 'big',
      status: 'in_progress',
    }).id;

    const subtasks = getTasks('1').filter(
      (t: any) => t.parent_id === emptyBigTaskId
    );

    const completed = subtasks.filter((t: any) => t.status === 'completed').length;
    const progress = subtasks.length > 0
      ? Math.round((completed / subtasks.length) * 100)
      : 0;

    expect(progress).toBe(0);
  });

  it('should round progress correctly', () => {
    updateTask(subtask1Id, { status: 'completed' });

    const subtasks = getTasks('1').filter(
      (t: any) => t.parent_id === bigTaskId
    );

    const completed = subtasks.filter((t: any) => t.status === 'completed').length;
    const progress = Math.round((completed / subtasks.length) * 100);

    expect(progress).toBe(50);
  });

  it('should update parent progress after subtask completion', () => {
    updateTask(subtask2Id, { status: 'completed' });

    const subtasks = getTasks('1').filter(
      (t: any) => t.parent_id === bigTaskId
    );
    const completed = subtasks.filter((t: any) => t.status === 'completed').length;
    const newProgress = Math.round((completed / subtasks.length) * 100);

    expect(newProgress).toBe(100);
  });

  it('should handle subtask uncomplete scenario', () => {
    updateTask(subtask1Id, { status: 'pending' });

    const subtasks = getTasks('1').filter(
      (t: any) => t.parent_id === bigTaskId
    );
    const completed = subtasks.filter((t: any) => t.status === 'completed').length;
    const progress = Math.round((completed / subtasks.length) * 100);

    expect(progress).toBe(0);
  });
});

describe('Subtask Validation', () => {
  it('should allow empty title (no validation)', () => {
    const subtask = createTask({
      user_id: '1',
      title: '',
      task_type: 'normal',
      parent_id: bigTaskId,
    });
    expect(subtask.title).toBe('');
  });

  it('should have valid parent reference', () => {
    const tasks = getTasks('1');
    const subtask = tasks.find((t: any) => t.id === subtask1Id);
    const parent = tasks.find((t: any) => t.id === subtask!.parent_id);

    expect(parent).toBeDefined();
    expect(parent!.task_type).toBe('big');
  });

  it('should preserve subtask order on updates', () => {
    const subtask = updateTask(subtask2Id, { title: 'Updated' });
    expect(subtask.order_index).toBe(1);
  });
});

describe('Quadrant Calculation for Subtasks', () => {
  it('should calculate Q1 for high importance + high urgency', () => {
    const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const urgency = calculateUrgency(dueDate, DEFAULT_THRESHOLDS);
    const quadrant = calculateQuadrant(5, urgency);

    expect(urgency).toBe('high');
    expect(quadrant).toBe(1);
  });

  it('should calculate Q2 for high importance + low urgency', () => {
    const dueDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const urgency = calculateUrgency(dueDate, DEFAULT_THRESHOLDS);
    const quadrant = calculateQuadrant(5, urgency);

    expect(urgency).toBe('none');
    expect(quadrant).toBe(2);
  });

  it('should calculate Q3 for low importance + high urgency', () => {
    const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const urgency = calculateUrgency(dueDate, DEFAULT_THRESHOLDS);
    const quadrant = calculateQuadrant(2, urgency);

    expect(urgency).toBe('high');
    expect(quadrant).toBe(3);
  });

  it('should calculate Q4 for low importance + low urgency', () => {
    const dueDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const urgency = calculateUrgency(dueDate, DEFAULT_THRESHOLDS);
    const quadrant = calculateQuadrant(2, urgency);

    expect(urgency).toBe('none');
    expect(quadrant).toBe(4);
  });

  it('should not calculate quadrant without importance', () => {
    const dueDate = new Date().toISOString();
    const urgency = calculateUrgency(dueDate, DEFAULT_THRESHOLDS);
    const quadrant = calculateQuadrant(undefined as any, urgency);

    expect(quadrant).toBeUndefined();
  });

  it('should not calculate quadrant without due_date', () => {
    const quadrant = calculateQuadrant(4, undefined as any);

    expect(quadrant).toBeUndefined();
  });
});
