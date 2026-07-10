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

import { resetData as resetLocalDb, createTask, getScoreEvents, getTasks } from '@/lib/local-db';
import { POST } from '../route';

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

describe('POST /api/tasks/[id]/checkin', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const request = new Request('http://localhost/api/tasks/task-1/checkin', { method: 'POST' });
    const response = await POST(request as any, { params: Promise.resolve({ id: 'task-1' }) });
    expect(response.status).toBe(401);
  });

  it('should return 404 when task not found', async () => {
    const request = new Request('http://localhost/api/tasks/non-existent/checkin', { method: 'POST' });
    const response = await POST(request as any, { params: Promise.resolve({ id: 'non-existent' }) });
    expect(response.status).toBe(404);
  });

  it('should return 400 when task is not a habit', async () => {
    const task = createTask({ user_id: '1', title: 'Normal Task', task_type: 'normal' });
    const request = new Request(`http://localhost/api/tasks/${task.id}/checkin`, { method: 'POST' });
    const response = await POST(request as any, { params: Promise.resolve({ id: task.id }) });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Not a habit task');
  });

  it('should return 409 when already checked in today', async () => {
    const task = createTask({
      user_id: '1',
      title: 'Habit Task',
      task_type: 'habit',
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    const request = new Request(`http://localhost/api/tasks/${task.id}/checkin`, { method: 'POST' });
    const response = await POST(request as any, { params: Promise.resolve({ id: task.id }) });
    expect(response.status).toBe(409);
  });

  it('should successfully check in and award HABIT_CHECKIN score', async () => {
    const task = createTask({ user_id: '1', title: 'Habit Task', task_type: 'habit' });
    const request = new Request(`http://localhost/api/tasks/${task.id}/checkin`, { method: 'POST' });
    const response = await POST(request as any, { params: Promise.resolve({ id: task.id }) });
    const data = await response.json();

    expect(data.streak).toBe(1);
    expect(data.best_streak).toBe(1);
    expect(data.is_consecutive).toBe(false);

    // Verify score event was written atomically
    const events = getScoreEvents('1');
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('HABIT_CHECKIN');
    expect(events[0].ref_id).toBe(task.id);
  });

  it('should increment streak for consecutive check-in', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const task = createTask({
      user_id: '1',
      title: 'Habit Task',
      task_type: 'habit',
      current_streak: 3,
      best_streak: 5,
      completed_at: yesterday.toISOString(),
    });

    const request = new Request(`http://localhost/api/tasks/${task.id}/checkin`, { method: 'POST' });
    const response = await POST(request as any, { params: Promise.resolve({ id: task.id }) });
    const data = await response.json();

    expect(data.streak).toBe(4);
    expect(data.best_streak).toBe(5);
    expect(data.is_consecutive).toBe(true);
  });

  it('should reset streak when not consecutive', async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const task = createTask({
      user_id: '1',
      title: 'Habit Task',
      task_type: 'habit',
      current_streak: 5,
      best_streak: 10,
      completed_at: twoDaysAgo.toISOString(),
    });

    const request = new Request(`http://localhost/api/tasks/${task.id}/checkin`, { method: 'POST' });
    const response = await POST(request as any, { params: Promise.resolve({ id: task.id }) });
    const data = await response.json();

    expect(data.streak).toBe(1); // reset to 1
    expect(data.best_streak).toBe(10); // unchanged
    expect(data.is_consecutive).toBe(false);
  });

  it('should update task status to completed after check-in', async () => {
    const task = createTask({ user_id: '1', title: 'Habit Task', task_type: 'habit' });
    const request = new Request(`http://localhost/api/tasks/${task.id}/checkin`, { method: 'POST' });
    await POST(request as any, { params: Promise.resolve({ id: task.id }) });

    const tasks = getTasks('1');
    const updated = tasks.find((t) => t.id === task.id);
    expect(updated?.status).toBe('completed');
    expect(updated?.completed_at).toBeDefined();
    expect(updated?.current_streak).toBe(1);
  });
});
