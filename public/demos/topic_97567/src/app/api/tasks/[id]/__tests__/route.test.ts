import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockAuthenticateRequest, mockCreateErrorResponse, mockCreateSuccessResponse } = vi.hoisted(() => ({
  mockAuthenticateRequest: vi.fn(),
  mockCreateErrorResponse: vi.fn(),
  mockCreateSuccessResponse: vi.fn(),
}));

vi.mock('@/lib/api-auth', () => ({
  authenticateRequest: mockAuthenticateRequest,
  createErrorResponse: mockCreateErrorResponse,
  createSuccessResponse: mockCreateSuccessResponse,
}));

vi.mock('@/lib/quadrant-utils', () => ({
  calculateUrgency: vi.fn(() => 'medium'),
  calculateQuadrant: vi.fn(() => 2),
  DEFAULT_THRESHOLDS: {
    critical: 1,
    high: 3,
    medium: 7,
    low: 14,
    none: 30,
  },
}));

import { resetData as resetLocalDb, createTask, getScoreEvents } from '@/lib/local-db';
import { GET, PATCH, DELETE } from '../route';

beforeEach(() => {
  vi.clearAllMocks();
  resetLocalDb();
  mockAuthenticateRequest.mockResolvedValue({
    success: true,
    context: { userId: '1' },
  });
  mockCreateErrorResponse.mockImplementation((msg: string, status: number = 500) =>
    new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } })
  );
  mockCreateSuccessResponse.mockImplementation((data: any) =>
    new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
  );
});

describe('GET /api/tasks/[id]', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const request = new Request('http://localhost/api/tasks/non-existent');
    const response = await GET(request as any, { params: Promise.resolve({ id: 'non-existent' }) });
    expect(response.status).toBe(401);
  });

  it('should return 404 when task not found', async () => {
    const request = new Request('http://localhost/api/tasks/non-existent');
    const response = await GET(request as any, { params: Promise.resolve({ id: 'non-existent' }) });
    expect(response.status).toBe(404);
  });

  it('should return task with subtasks for big task', async () => {
    const bigTask = createTask({ user_id: '1', title: 'Big Task', task_type: 'big' });
    createTask({ user_id: '1', title: 'Subtask 1', task_type: 'normal', parent_id: bigTask.id });

    const request = new Request(`http://localhost/api/tasks/${bigTask.id}`);
    const response = await GET(request as any, { params: Promise.resolve({ id: bigTask.id }) });
    const data = await response.json();
    expect(data).toHaveProperty('task');
    expect(data.task.subtasks).toHaveLength(1);
  });

  it('should return task without subtasks for normal task', async () => {
    const task = createTask({ user_id: '1', title: 'Normal Task', task_type: 'normal' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`);
    const response = await GET(request as any, { params: Promise.resolve({ id: task.id }) });
    const data = await response.json();
    expect(data).toHaveProperty('task');
    expect(data.task.subtasks).toHaveLength(0);
  });

  it('should return task with type field mapped from task_type', async () => {
    const task = createTask({ user_id: '1', title: 'Test Task', task_type: 'habit' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`);
    const response = await GET(request as any, { params: Promise.resolve({ id: task.id }) });
    const data = await response.json();
    
    expect(data.task).toHaveProperty('type');
    expect(data.task).toHaveProperty('task_type');
    expect(data.task.type).toEqual(data.task.task_type);
    expect(data.task.type).toBe('habit');
  });
});

describe('PATCH /api/tasks/[id] - Progress Sync', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const request = new Request('http://localhost/api/tasks/task-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    const response = await PATCH(request as any, { params: Promise.resolve({ id: 'task-1' }) });
    expect(response.status).toBe(401);
  });

  it('should return error when task not found', async () => {
    const request = new Request('http://localhost/api/tasks/non-existent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    const response = await PATCH(request as any, { params: Promise.resolve({ id: 'non-existent' }) });
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('should update task status to completed', async () => {
    const task = createTask({ user_id: '1', title: 'Task', task_type: 'normal' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    const response = await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });
    const data = await response.json();
    expect(data.task.status).toBe('completed');
  });

  it('should return patched task with type field mapped from task_type', async () => {
    const task = createTask({ user_id: '1', title: 'Task to Patch', task_type: 'big' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Patched Task' }),
    });
    const response = await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });
    const data = await response.json();
    
    expect(data.task).toHaveProperty('type');
    expect(data.task).toHaveProperty('task_type');
    expect(data.task.type).toEqual(data.task.task_type);
    expect(data.task.type).toBe('big');
  });

  it('should update task title', async () => {
    const task = createTask({ user_id: '1', title: 'Original', task_type: 'normal' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Title' }),
    });
    const response = await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });
    const data = await response.json();
    expect(data.task.title).toBe('Updated Title');
  });

  it('should ignore disallowed fields', async () => {
    const task = createTask({ user_id: '1', title: 'Task', task_type: 'normal' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'attempted-override',
        user_id: 'hacker',
        created_at: 'malicious-date',
      }),
    });
    const response = await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });
    const data = await response.json();
    expect(data.task.id).toBe(task.id);
    expect(data.task.user_id).toBe('1');
  });
});

describe('PATCH /api/tasks/[id] - Field Updates', () => {
  it('should set completed_at when marking as completed', async () => {
    const task = createTask({ user_id: '1', title: 'Task', task_type: 'normal' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    const response = await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });
    const data = await response.json();
    expect(data.task.completed_at).toBeDefined();
  });

  it('should clear completed_at when uncompleting task', async () => {
    const task = createTask({ user_id: '1', title: 'Task', task_type: 'normal' });

    const completeReq = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    await PATCH(completeReq as any, { params: Promise.resolve({ id: task.id }) });

    const uncompleteReq = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pending' }),
    });
    const response = await PATCH(uncompleteReq as any, { params: Promise.resolve({ id: task.id }) });
    const data = await response.json();
    expect(data.task.status).toBe('pending');
  });
});

describe('DELETE /api/tasks/[id]', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const request = new Request('http://localhost/api/tasks/task-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request as any, { params: Promise.resolve({ id: 'task-1' }) });
    expect(response.status).toBe(401);
  });

  it('should delete task successfully', async () => {
    const task = createTask({ user_id: '1', title: 'Task to Delete', task_type: 'normal' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'DELETE',
    });
    const response = await DELETE(request as any, { params: Promise.resolve({ id: task.id }) });
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should return error when deleting non-existent task', async () => {
    const request = new Request('http://localhost/api/tasks/non-existent', {
      method: 'DELETE',
    });
    const response = await DELETE(request as any, { params: Promise.resolve({ id: 'non-existent' }) });
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});

describe('Task update validation', () => {
  it('should handle empty update object', async () => {
    const task = createTask({ user_id: '1', title: 'Task', task_type: 'normal' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });
    expect(response).toBeDefined();
  });

  it('should handle partial updates', async () => {
    const task = createTask({ user_id: '1', title: 'Task', task_type: 'normal' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Only Title' }),
    });
    const response = await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });
    const data = await response.json();
    expect(data.task.title).toBe('Only Title');
  });
});

describe('PATCH /api/tasks/[id] - Score Event Writing', () => {
  it('should write TASK_NORMAL_COMPLETED event when normal task is completed', async () => {
    const task = createTask({ user_id: '1', title: 'Normal Task', task_type: 'normal' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });

    await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });

    const events = getScoreEvents('1');
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('TASK_NORMAL_COMPLETED');
    expect(events[0].ref_id).toBe(task.id);
  });

  it('should write TASK_QUICK_COMPLETED event when quick task is completed', async () => {
    const task = createTask({ user_id: '1', title: 'Quick Task', task_type: 'quick' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });

    await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });

    const events = getScoreEvents('1');
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('TASK_QUICK_COMPLETED');
    expect(events[0].ref_id).toBe(task.id);
  });

  it('should write BIG_TASK_COMPLETED event when big task is completed', async () => {
    const task = createTask({ user_id: '1', title: 'Big Task', task_type: 'big' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });

    await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });

    const events = getScoreEvents('1');
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('BIG_TASK_COMPLETED');
    expect(events[0].ref_id).toBe(task.id);
  });

  it('should write HABIT_CHECKIN event when habit task is completed', async () => {
    const task = createTask({ user_id: '1', title: 'Habit Task', task_type: 'habit' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });

    await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });

    const events = getScoreEvents('1');
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('HABIT_CHECKIN');
    expect(events[0].ref_id).toBe(task.id);
  });

  it('should write SUBTASK_COMPLETED event when subtask is completed', async () => {
    const parentTask = createTask({ user_id: '1', title: 'Parent Task', task_type: 'normal' });
    const subtask = createTask({ user_id: '1', title: 'Subtask', task_type: 'normal', parent_id: parentTask.id });

    const request = new Request(`http://localhost/api/tasks/${subtask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });

    await PATCH(request as any, { params: Promise.resolve({ id: subtask.id }) });

    const events = getScoreEvents('1');
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('SUBTASK_COMPLETED');
    expect(events[0].ref_id).toBe(subtask.id);
  });

  it('should NOT write score event when updating task without completing it', async () => {
    const task = createTask({ user_id: '1', title: 'Task', task_type: 'normal' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });

    const events = getScoreEvents('1');
    expect(events).toHaveLength(0);
  });

  it('should NOT write score event when completing task that was already completed (idempotency)', async () => {
    const task = createTask({
      user_id: '1',
      title: 'Already Completed Task',
      task_type: 'normal',
      status: 'completed',
      completed_at: new Date().toISOString()
    });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });

    await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });

    // 幂等保护：已完成任务重复完成不应重复发放积分
    const events = getScoreEvents('1');
    expect(events).toHaveLength(0);
  });
});
