import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockAuthenticateRequest = vi.fn();
const mockCreateErrorResponse = vi.fn();
const mockCreateSuccessResponse = vi.fn();
const mockGetTasks = vi.fn();

vi.mock('@/lib/api-auth', () => ({
  authenticateRequest: mockAuthenticateRequest,
  createErrorResponse: mockCreateErrorResponse,
  createSuccessResponse: mockCreateSuccessResponse,
}));

vi.mock('@/lib/local-db', () => ({
  getTasks: mockGetTasks,
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

describe('GET /api/tasks/big', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/big');
    const response = await GET(request as any);
    expect(response.status).toBe(401);
  });

  it('should return big tasks for authenticated user', async () => {
    mockGetTasks.mockReturnValue([
      { id: 'big-1', task_type: 'big', title: 'Big Task 1', progress: 50 },
      { id: 'big-2', task_type: 'big', title: 'Big Task 2', progress: 25 },
      { id: 'normal-1', task_type: 'normal', title: 'Normal Task' },
    ]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/big');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(mockGetTasks).toHaveBeenCalledWith('1');
    expect(data.tasks).toHaveLength(2);
    expect(data.tasks[0]).toHaveProperty('id', 'big-1');
    expect(data.tasks[0]).toHaveProperty('title', 'Big Task 1');
    expect(data.tasks[0]).toHaveProperty('progress', 50);
    expect(data.tasks[1]).toHaveProperty('id', 'big-2');
    expect(data.tasks[1]).toHaveProperty('title', 'Big Task 2');
    expect(data.tasks[1]).toHaveProperty('progress', 25);
  });

  it('should filter out non-big tasks from results', async () => {
    mockGetTasks.mockReturnValue([
      { id: 'normal-1', task_type: 'normal', title: 'Normal Task' },
      { id: 'quick-1', task_type: 'quick', title: 'Quick Task' },
      { id: 'habit-1', task_type: 'habit', title: 'Habit Task' },
    ]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/big');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(data.tasks).toHaveLength(0);
  });

  it('should include only id, title, and progress fields', async () => {
    mockGetTasks.mockReturnValue([
      { 
        id: 'big-1', 
        task_type: 'big', 
        title: 'Big Task', 
        progress: 75,
        description: 'Full description',
        due_date: '2026-12-31',
        importance: 5,
      },
    ]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/big');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(data.tasks[0]).toHaveProperty('id', 'big-1');
    expect(data.tasks[0]).toHaveProperty('title', 'Big Task');
    expect(data.tasks[0]).toHaveProperty('progress', 75);
    expect(data.tasks[0]).not.toHaveProperty('description');
    expect(data.tasks[0]).not.toHaveProperty('due_date');
    expect(data.tasks[0]).not.toHaveProperty('importance');
  });

  it('should default progress to 0 when undefined', async () => {
    mockGetTasks.mockReturnValue([
      { id: 'big-1', task_type: 'big', title: 'Big Task' },
    ]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/big');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(data.tasks[0]).toHaveProperty('progress', 0);
  });

  it('should return empty array when no big tasks exist', async () => {
    mockGetTasks.mockReturnValue([]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/big');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(data.tasks).toEqual([]);
  });

  it('should handle userId from auth context', async () => {
    mockAuthenticateRequest.mockResolvedValue({
      success: true,
      context: { userId: 'user-123' },
    });
    mockGetTasks.mockReturnValue([]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/big');
    await GET(request as any);
    
    expect(mockGetTasks).toHaveBeenCalledWith('user-123');
  });
});

describe('Edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticateRequest.mockResolvedValue({
      success: true,
      context: { userId: '1' },
    });
  });

  it('should handle tasks with string progress', async () => {
    mockGetTasks.mockReturnValue([
      { id: 'big-1', task_type: 'big', title: 'Big Task', progress: '50' },
    ]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/big');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(data.tasks[0].progress).toBe('50');
  });

  it('should default null progress to 0', async () => {
    mockGetTasks.mockReturnValue([
      { id: 'big-1', task_type: 'big', title: 'Big Task', progress: null },
    ]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/big');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(data.tasks[0].progress).toBe(0);
  });

  it('should handle tasks with missing title', async () => {
    mockGetTasks.mockReturnValue([
      { id: 'big-1', task_type: 'big' },
    ]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/tasks/big');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(data.tasks[0]).toHaveProperty('id', 'big-1');
    expect(data.tasks[0]).not.toHaveProperty('title');
  });
});
