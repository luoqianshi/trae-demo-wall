import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockAuthenticateRequest = vi.fn();
const mockCreateErrorResponse = vi.fn();
const mockCreateSuccessResponse = vi.fn();
const { mockCalculateEventScore, mockCalculateTodayEventScore } = vi.hoisted(() => ({
  mockCalculateEventScore: vi.fn(),
  mockCalculateTodayEventScore: vi.fn(),
}));

vi.mock('@/lib/api-auth', () => ({
  authenticateRequest: mockAuthenticateRequest,
  createErrorResponse: mockCreateErrorResponse,
  createSuccessResponse: mockCreateSuccessResponse,
}));

vi.mock('@/lib/score-engine', () => ({
  calculateEventScore: mockCalculateEventScore,
  calculateTodayEventScore: mockCalculateTodayEventScore,
}));


vi.mock('@/lib/snowball-score-calculator', () => ({
  calculateTotalStats: vi.fn(() => ({
    totalScore: 0,
    todayScore: 0,
    todayStreak: 0,
    recordCount: 0,
    taskCompletedCount: 0,
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockCalculateEventScore.mockReturnValue(0);
  mockCalculateTodayEventScore.mockReturnValue(0);
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

describe('GET /api/snowball/stats', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/snowball/stats');
    const response = await GET(request as any);
    expect(response.status).toBe(401);
  });

  it('should return snowball stats with all required fields', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/snowball/stats');
    const response = await GET(request as any);
    expect(response).toBeDefined();
    const data = await response.json();
    expect(data).toHaveProperty('totalScore');
    expect(data).toHaveProperty('todayScore');
    expect(data).toHaveProperty('todayStreak');
    expect(data).toHaveProperty('recordCount');
    expect(data).toHaveProperty('taskCompletedCount');
  });

  it('should return numeric values for all stats', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/snowball/stats');
    const response = await GET(request as any);
    const data = await response.json();
    expect(typeof data.totalScore).toBe('number');
    expect(typeof data.todayScore).toBe('number');
    expect(typeof data.todayStreak).toBe('number');
    expect(typeof data.recordCount).toBe('number');
    expect(typeof data.taskCompletedCount).toBe('number');
  });

  it('should return non-negative stats', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/snowball/stats');
    const response = await GET(request as any);
    const data = await response.json();
    expect(data.totalScore).toBeGreaterThanOrEqual(0);
    expect(data.todayScore).toBeGreaterThanOrEqual(0);
    expect(data.todayStreak).toBeGreaterThanOrEqual(0);
    expect(data.recordCount).toBeGreaterThanOrEqual(0);
    expect(data.taskCompletedCount).toBeGreaterThanOrEqual(0);
  });

  it('should use calculateEventScore for totalScore', async () => {
    mockCalculateEventScore.mockReturnValue(42);
    mockCalculateTodayEventScore.mockReturnValue(10);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/snowball/stats');
    const response = await GET(request as any);
    const data = await response.json();

    expect(data.totalScore).toBe(42);
    expect(data.todayScore).toBe(10);
    expect(mockCalculateEventScore).toHaveBeenCalled();
    expect(mockCalculateTodayEventScore).toHaveBeenCalled();
  });
});

describe('Snowball stats calculation', () => {
  beforeEach(() => {
    mockAuthenticateRequest.mockResolvedValue({
      success: true,
      context: { userId: 'calc-test-user' },
    });
  });

  it('should return zero stats for new user', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/snowball/stats');
    const response = await GET(request as any);
    const data = await response.json();
    expect(data.totalScore).toBe(0);
    expect(data.recordCount).toBe(0);
    expect(data.taskCompletedCount).toBe(0);
  });

  it('should separate todayScore from totalScore', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/snowball/stats');
    const response = await GET(request as any);
    const data = await response.json();
    expect(data.todayScore).toBeLessThanOrEqual(data.totalScore);
  });


});
