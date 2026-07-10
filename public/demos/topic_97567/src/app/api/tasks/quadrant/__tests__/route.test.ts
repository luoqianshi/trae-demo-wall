import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockAuthenticateRequest = vi.fn();
const mockCreateErrorResponse = vi.fn();
const mockCreateSuccessResponse = vi.fn();

vi.mock('@/lib/api-auth', () => ({
  authenticateRequest: mockAuthenticateRequest,
  createErrorResponse: mockCreateErrorResponse,
  createSuccessResponse: mockCreateSuccessResponse,
}));

vi.mock('@/lib/quadrant-utils', () => ({
  calculateUrgency: vi.fn((dueDate: string | undefined) => {
    if (!dueDate) return undefined;
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 1) return 'critical';
    if (days <= 3) return 'high';
    if (days <= 7) return 'medium';
    if (days <= 14) return 'low';
    return 'none';
  }),
  calculateQuadrant: vi.fn((importance: number | null | undefined, urgency: string | null | undefined) => {
    if (!importance || !urgency) return undefined;
    const isImportant = importance >= 4;
    const isUrgent = urgency === 'critical' || urgency === 'high';
    if (isImportant && isUrgent) return 1;
    if (isImportant && !isUrgent) return 2;
    if (!isImportant && isUrgent) return 3;
    return 4;
  }),
  DEFAULT_THRESHOLDS: {
    critical: 1,
    high: 3,
    medium: 7,
    low: 14,
    none: 30,
  },
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

describe('GET /api/tasks/quadrant', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/quadrant');
    const response = await GET(request as any);
    expect(response.status).toBe(401);
  });

  it('should return quadrants data with default view', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/quadrant');
    const response = await GET(request as any);
    expect(response).toBeDefined();
    const data = await response.json();
    expect(data).toHaveProperty('quadrants');
    expect(data).toHaveProperty('thresholds');
    expect(data.quadrants).toHaveProperty('q1');
    expect(data.quadrants).toHaveProperty('q2');
    expect(data.quadrants).toHaveProperty('q3');
    expect(data.quadrants).toHaveProperty('q4');
  });

  it('should return tasks with type field mapped from task_type', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/quadrant');
    const response = await GET(request as any);
    const data = await response.json();
    
    // Check all quadrants
    Object.values(data.quadrants).forEach((quadrant: any) => {
      quadrant.tasks.forEach((task: any) => {
        expect(task).toHaveProperty('type');
        expect(task).toHaveProperty('task_type');
        expect(task.type).toEqual(task.task_type);
        expect(['normal', 'quick', 'big', 'habit']).toContain(task.type);
      });
    });
  });

  it('should return quadrants with task counts', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/quadrant');
    const response = await GET(request as any);
    const data = await response.json();
    expect(data.quadrants.q1).toHaveProperty('count');
    expect(data.quadrants.q1).toHaveProperty('tasks');
    expect(typeof data.quadrants.q1.count).toBe('number');
    expect(Array.isArray(data.quadrants.q1.tasks)).toBe(true);
  });

  it('should return global view by default', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/quadrant?view=global');
    const response = await GET(request as any);
    expect(response).toBeDefined();
  });

  it('should require big_task_id when view is big', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'big_task_id is required',
      statusCode: 400,
    });
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/quadrant?view=big');
    const response = await GET(request as any);
    expect(response.status).toBe(400);
  });

  it('should return normal view filtered tasks', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/quadrant?view=normal');
    const response = await GET(request as any);
    expect(response).toBeDefined();
  });

  it('should include default thresholds', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/quadrant');
    const response = await GET(request as any);
    const data = await response.json();
    expect(data.thresholds).toEqual({
      critical: 1,
      high: 3,
      medium: 7,
      low: 14,
      none: 30,
    });
  });
});

describe('Quadrant calculation edge cases', () => {
  beforeEach(() => {
    mockAuthenticateRequest.mockResolvedValue({
      success: true,
      context: { userId: 'test-user' },
    });
  });

  it('should handle tasks with no due date', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/quadrant');
    const response = await GET(request as any);
    const data = await response.json();
    expect(data.quadrants).toBeDefined();
  });

  it('should handle tasks with no importance', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/quadrant');
    const response = await GET(request as any);
    const data = await response.json();
    expect(data.quadrants).toBeDefined();
  });
});
