import { describe, it, expect, beforeEach } from 'vitest';
import { resetData, createTask, completeTaskWithScore, updateTask, getScoreEvents, getTasks } from '@/lib/local-db';

beforeEach(() => {
  resetData();
});

describe('completeTaskWithScore', () => {
  it('should throw when task does not exist', () => {
    expect(() => {
      completeTaskWithScore('non-existent', { status: 'completed' }, '1', 'TASK_NORMAL_COMPLETED', 'non-existent');
    }).toThrow('Task not found');
  });

  it('should update task and award score when completing a pending task', () => {
    const task = createTask({ user_id: '1', title: 'Test Task', task_type: 'normal' });
    const updated = completeTaskWithScore(task.id, { status: 'completed' }, '1', 'TASK_NORMAL_COMPLETED', task.id);

    expect(updated.status).toBe('completed');
    expect(updated.completed_at).toBeDefined();

    const events = getScoreEvents('1');
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('TASK_NORMAL_COMPLETED');
    expect(events[0].ref_id).toBe(task.id);
  });

  it('should NOT award score when updating task without status=completed', () => {
    const task = createTask({ user_id: '1', title: 'Test Task', task_type: 'normal' });
    const updated = completeTaskWithScore(task.id, { title: 'Updated Title' }, '1', 'TASK_NORMAL_COMPLETED', task.id);

    expect(updated.title).toBe('Updated Title');
    expect(updated.status).toBe('pending');

    const events = getScoreEvents('1');
    expect(events).toHaveLength(0);
  });

  it('should NOT award score when task was already completed (idempotency)', () => {
    const task = createTask({ user_id: '1', title: 'Test Task', task_type: 'normal' });

    // First completion — should award score
    completeTaskWithScore(task.id, { status: 'completed' }, '1', 'TASK_NORMAL_COMPLETED', task.id);
    expect(getScoreEvents('1')).toHaveLength(1);

    // Second completion — should NOT award score again
    completeTaskWithScore(task.id, { status: 'completed' }, '1', 'TASK_NORMAL_COMPLETED', task.id);
    expect(getScoreEvents('1')).toHaveLength(1); // still only 1 event
  });

  it('should increment growthData.tasks_completed when task transitions to completed', () => {
    const task = createTask({ user_id: '1', title: 'Test Task', task_type: 'normal' });
    completeTaskWithScore(task.id, { status: 'completed' }, '1', 'TASK_NORMAL_COMPLETED', task.id);

    const tasks = getTasks('1');
    // Verify the task is completed
    expect(tasks.find((t) => t.id === task.id)?.status).toBe('completed');
  });

  it('should clear completed_at when uncompleting a task', () => {
    const task = createTask({ user_id: '1', title: 'Test Task', task_type: 'normal' });

    // Complete the task first
    completeTaskWithScore(task.id, { status: 'completed' }, '1', 'TASK_NORMAL_COMPLETED', task.id);

    // Uncomplete it
    const updated = updateTask(task.id, { status: 'pending' });
    expect(updated.status).toBe('pending');
    expect(updated.completed_at).toBeNull();
  });
});
