import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockAuthenticateRequest, mockCreateErrorResponse, mockCreateSuccessResponse } = vi.hoisted(() => {
  return {
    mockAuthenticateRequest: vi.fn(),
    mockCreateErrorResponse: vi.fn(),
    mockCreateSuccessResponse: vi.fn(),
  };
});

vi.mock('@/lib/api-auth', () => ({
  authenticateRequest: mockAuthenticateRequest,
  createErrorResponse: mockCreateErrorResponse,
  createSuccessResponse: mockCreateSuccessResponse,
}));

vi.mock('next/server', () => {
  class MockNextResponse {
    private _body: any;
    private _status: number;
    private _headers: Headers;

    constructor(body: any, init?: ResponseInit) {
      this._body = typeof body === 'string' ? JSON.parse(body) : body;
      this._status = init?.status || 200;
      this._headers = new Headers(init?.headers);
    }

    static json(data: any, init?: ResponseInit) {
      return new MockNextResponse(JSON.stringify(data), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      });
    }

    async json() {
      return this._body;
    }

    get status() {
      return this._status;
    }
  }

  return { NextResponse: MockNextResponse, NextRequest: Request };
});

import { resetData as resetLocalDb } from '@/lib/local-db';
import { GET, POST, DELETE } from '@/app/api/tasks/route';

beforeEach(() => {
  vi.clearAllMocks();
  resetLocalDb();
  mockAuthenticateRequest.mockResolvedValue({
    success: true,
    context: { userId: '1' },
  });
  mockCreateErrorResponse.mockImplementation((msg: string, status: number) =>
    new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } })
  );
  mockCreateSuccessResponse.mockImplementation((data: any, status?: number) =>
    new Response(JSON.stringify({ success: true, ...data }), { status: status || 200, headers: { 'Content-Type': 'application/json' } })
  );
});

function createRequest(options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  url?: string;
}) {
  const headers = new Headers(options.headers);
  const init: RequestInit = { method: options.method || 'GET', headers };
  if (options.body) {
    init.body = JSON.stringify(options.body);
    init.headers = new Headers({
      ...options.headers,
      'Content-Type': 'application/json',
    });
  }
  return new Request(options.url || 'http://localhost/api/tasks', init);
}

describe('GET /api/tasks', () => {
  it('should return tasks for authenticated user', async () => {
    const req = createRequest({
      headers: { Authorization: 'Bearer local-token-1' },
    });
    const res = await GET(req as any);
    const data = await res.json();
    expect(data).toHaveProperty('tasks');
  });

  it('should return tasks with type field mapped from task_type', async () => {
    const req = createRequest({
      headers: { Authorization: 'Bearer local-token-1' },
    });
    const res = await GET(req as any);
    const data = await res.json();
    
    data.tasks.forEach((task: any) => {
      expect(task).toHaveProperty('type');
      expect(task).toHaveProperty('task_type');
      expect(task.type).toEqual(task.task_type);
      expect(['normal', 'quick', 'big', 'habit']).toContain(task.type);
    });
  });

  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const req = createRequest({});
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });

  it('should filter tasks by status', async () => {
    const req = createRequest({
      headers: { Authorization: 'Bearer local-token-1' },
      url: 'http://localhost/api/tasks?status=completed',
    });
    const res = await GET(req as any);
    const data = await res.json();
    expect(data).toHaveProperty('tasks');
  });
});

describe('POST /api/tasks', () => {
  it('should create a normal task for authenticated user', async () => {
    const req = createRequest({
      method: 'POST',
      headers: { Authorization: 'Bearer local-token-1' },
      body: { title: 'Test Task', type: 'normal' },
    });
    const res = await POST(req as any);
    const data = await res.json();
    expect(data.task.title).toBe('Test Task');
    expect(data.task.task_type).toBe('normal');
    expect(data.task.type).toBe('normal');
  });

  it('should return created task with type field mapped from task_type', async () => {
    const req = createRequest({
      method: 'POST',
      headers: { Authorization: 'Bearer local-token-1' },
      body: { title: 'Test Task', type: 'quick' },
    });
    const res = await POST(req as any);
    const data = await res.json();
    
    expect(data.task).toHaveProperty('type');
    expect(data.task).toHaveProperty('task_type');
    expect(data.task.type).toEqual(data.task.task_type);
    expect(data.task.type).toBe('quick');
  });

  it('should create a quick task when type is quick', async () => {
    const req = createRequest({
      method: 'POST',
      headers: { Authorization: 'Bearer local-token-1' },
      body: { title: 'Quick Task', type: 'quick' },
    });
    const res = await POST(req as any);
    const data = await res.json();
    expect(data.task.task_type).toBe('quick');
  });

  it('should create a big task with type=big', async () => {
    const req = createRequest({
      method: 'POST',
      headers: { Authorization: 'Bearer local-token-1' },
      body: { title: 'Big Task', type: 'big' },
    });
    const res = await POST(req as any);
    const data = await res.json();
    expect(data.task.task_type).toBe('big');
  });

  it('should create a subtask with parent_id', async () => {
    const parentReq = createRequest({
      method: 'POST',
      headers: { Authorization: 'Bearer local-token-1' },
      body: { title: 'Parent Task', type: 'big' },
    });
    const parentRes = await POST(parentReq as any);
    const parentData = await parentRes.json();

    const subtaskReq = createRequest({
      method: 'POST',
      headers: { Authorization: 'Bearer local-token-1' },
      body: {
        title: 'Subtask',
        type: 'normal',
        parent_id: parentData.task.id,
      },
    });
    const res = await POST(subtaskReq as any);
    const data = await res.json();
    expect(data.task.parent_id).toBe(parentData.task.id);
  });

  it('should create a habit task with habit fields', async () => {
    const req = createRequest({
      method: 'POST',
      headers: { Authorization: 'Bearer local-token-1' },
      body: {
        title: 'Daily Exercise',
        type: 'habit',
        frequency: 'daily',
        target_count: 3,
      },
    });
    const res = await POST(req as any);
    const data = await res.json();
    expect(data.task.task_type).toBe('habit');
  });

  it('should return 400 when title is missing', async () => {
    const req = createRequest({
      method: 'POST',
      headers: { Authorization: 'Bearer local-token-1' },
      body: { description: 'no title' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Title is required and must be a string');
  });

  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const req = createRequest({
      method: 'POST',
      body: { title: 'Test' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('should default type to normal when not specified', async () => {
    const req = createRequest({
      method: 'POST',
      headers: { Authorization: 'Bearer local-token-1' },
      body: { title: 'Task without type' },
    });
    const res = await POST(req as any);
    const data = await res.json();
    expect(data.task.task_type).toBe('normal');
  });
});

describe('DELETE /api/tasks', () => {
  it('should delete a task', async () => {
    const createReq = createRequest({
      method: 'POST',
      headers: { Authorization: 'Bearer local-token-1' },
      body: { title: 'Task to Delete', type: 'normal' },
    });
    const createRes = await POST(createReq as any);
    const createData = await createRes.json();

    const deleteReq = createRequest({
      method: 'DELETE',
      headers: { Authorization: 'Bearer local-token-1' },
      body: { id: createData.task.id },
    });
    const res = await DELETE(deleteReq as any);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('should return 400 when task id is missing', async () => {
    const req = createRequest({
      method: 'DELETE',
      headers: { Authorization: 'Bearer local-token-1' },
      body: {},
    });
    const res = await DELETE(req as any);
    expect(res.status).toBe(400);
  });

  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const req = createRequest({
      method: 'DELETE',
      body: { id: '1' },
    });
    const res = await DELETE(req as any);
    expect(res.status).toBe(401);
  });
});
