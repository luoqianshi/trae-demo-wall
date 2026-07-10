import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockAuthenticateRequest = vi.fn();
const mockCreateErrorResponse = vi.fn();
const mockCreateSuccessResponse = vi.fn();

vi.mock('@/lib/api-auth', () => ({
  authenticateRequest: mockAuthenticateRequest,
  createErrorResponse: mockCreateErrorResponse,
  createSuccessResponse: mockCreateSuccessResponse,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthenticateRequest.mockResolvedValue({
    success: true,
    context: { userId: '1' },
  });
  mockCreateErrorResponse.mockImplementation((msg: string, status: number) =>
    new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } })
  );
  mockCreateSuccessResponse.mockImplementation((data: any) =>
    new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
  );
});

describe('GET /api/tasks/thresholds', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/thresholds');
    const response = await GET(request as any);
    expect(response.status).toBe(401);
  });

  it('should return default thresholds when no custom thresholds exist', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/thresholds');
    const response = await GET(request as any);
    expect(response).toBeDefined();
    const data = await response.json();
    expect(data).toHaveProperty('normal');
    expect(data.normal).toHaveProperty('critical');
    expect(data.normal).toHaveProperty('high');
    expect(data.normal).toHaveProperty('medium');
    expect(data.normal).toHaveProperty('low');
    expect(data.normal).toHaveProperty('none');
  });

  it('should return big_tasks object even if empty', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/thresholds');
    const response = await GET(request as any);
    const data = await response.json();
    expect(data).toHaveProperty('big_tasks');
    expect(typeof data.big_tasks).toBe('object');
  });
});

describe('PUT /api/tasks/thresholds', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/tasks/thresholds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'normal', thresholds: { critical: 1, high: 3, medium: 7, low: 14, none: 30 } }),
    });
    const response = await PUT(request as any);
    expect(response.status).toBe(401);
  });

  it('should return 400 when type is missing', async () => {
    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/tasks/thresholds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thresholds: { critical: 1, high: 3, medium: 7, low: 14, none: 30 } }),
    });
    const response = await PUT(request as any);
    expect(response.status).toBe(400);
  });

  it('should return 400 when thresholds is missing', async () => {
    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/tasks/thresholds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'normal' }),
    });
    const response = await PUT(request as any);
    expect(response.status).toBe(400);
  });

  it('should return 400 when type is big but big_task_id is missing', async () => {
    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/tasks/thresholds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'big',
        thresholds: { critical: 1, high: 3, medium: 7, low: 14, none: 30 },
      }),
    });
    const response = await PUT(request as any);
    expect(response.status).toBe(400);
  });

  it('should update normal thresholds successfully', async () => {
    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/tasks/thresholds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'normal',
        thresholds: { critical: 2, high: 5, medium: 10, low: 20, none: 45 },
      }),
    });
    const response = await PUT(request as any);
    expect(response).toBeDefined();
    const data = await response.json();
    expect(data).toHaveProperty('thresholds');
    expect(data.thresholds.critical).toBe(2);
    expect(data.thresholds.high).toBe(5);
  });

  it('should update big task thresholds with big_task_id', async () => {
    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/tasks/thresholds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'big',
        big_task_id: 'task-123',
        thresholds: { critical: 1, high: 2, medium: 5, low: 10, none: 20 },
      }),
    });
    const response = await PUT(request as any);
    expect(response).toBeDefined();
  });

  it('should sanitize threshold values to non-negative numbers', async () => {
    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/tasks/thresholds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'normal',
        thresholds: { critical: -5, high: 'abc', medium: null, low: 10, none: 20 },
      }),
    });
    const response = await PUT(request as any);
    const data = await response.json();
    expect(data.thresholds.critical).toBe(0);
    expect(data.thresholds.high).toBe(3);
  });

  it('should use defaults for invalid threshold values', async () => {
    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/tasks/thresholds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'normal',
        thresholds: { critical: 'invalid', high: 3, medium: 7, low: 14, none: 30 },
      }),
    });
    const response = await PUT(request as any);
    const data = await response.json();
    expect(data.thresholds.critical).toBeDefined();
  });
});

describe('Threshold validation', () => {
  it('should handle partial threshold updates', async () => {
    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/tasks/thresholds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'normal',
        thresholds: { critical: 1, high: 3 },
      }),
    });
    const response = await PUT(request as any);
    const data = await response.json();
    expect(data.thresholds.critical).toBe(1);
    expect(data.thresholds.high).toBe(3);
  });
});
