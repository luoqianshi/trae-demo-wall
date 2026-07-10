import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockAuthenticateRequest = vi.fn();
const mockCreateErrorResponse = vi.fn();
const mockCreateSuccessResponse = vi.fn();
const mockGetProcrastinationSessions = vi.fn();
const mockGetProcrastinationSession = vi.fn();
const mockCreateProcrastinationSession = vi.fn();
const mockUpdateProcrastinationSession = vi.fn();

vi.mock('@/lib/api-auth', () => ({
  authenticateRequest: mockAuthenticateRequest,
  createErrorResponse: (...args: any[]) => {
    const [msg, status] = args;
    return new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } });
  },
  createSuccessResponse: (...args: any[]) => {
    const [data, status = 200] = args;
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  },
}));

vi.mock('@/lib/local-db', () => ({
  getProcrastinationSessions: mockGetProcrastinationSessions,
  getProcrastinationSession: mockGetProcrastinationSession,
  createProcrastinationSession: mockCreateProcrastinationSession,
  updateProcrastinationSession: mockUpdateProcrastinationSession,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthenticateRequest.mockResolvedValue({
    success: true,
    context: { userId: '1' },
  });
  mockGetProcrastinationSessions.mockReturnValue([]);
});

describe('GET /api/procrastination', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/procrastination');
    const response = await GET(request as any);
    expect(response.status).toBe(401);
  });

  it('should return all sessions for authenticated user', async () => {
    const mockSessions = [
      { id: 'sess-1', goal: 'Study math', status: 'active' },
      { id: 'sess-2', goal: 'Clean room', status: 'completed' },
    ];
    mockGetProcrastinationSessions.mockReturnValue(mockSessions);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/procrastination');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(mockGetProcrastinationSessions).toHaveBeenCalledWith('1');
    expect(data.sessions).toEqual(mockSessions);
  });

  it('should return empty array when no sessions exist', async () => {
    mockGetProcrastinationSessions.mockReturnValue([]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/procrastination');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(data.sessions).toEqual([]);
  });

  it('should return single session by id', async () => {
    const mockSession = { id: 'sess-1', user_id: '1', goal: 'Study math', status: 'active' };
    mockGetProcrastinationSession.mockReturnValue(mockSession);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/procrastination?id=sess-1');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(mockGetProcrastinationSession).toHaveBeenCalledWith('sess-1');
    expect(data.session).toEqual(mockSession);
  });

  it('should return 404 when session not found', async () => {
    mockGetProcrastinationSession.mockReturnValue(null);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/procrastination?id=nonexistent');
    const response = await GET(request as any);
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Session not found');
  });

});

describe('POST /api/procrastination', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/procrastination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'Test goal', steps: [{ description: 'Step 1' }] }),
    });
    const response = await POST(request as any);
    expect(response.status).toBe(401);
  });

  it('should create session with valid data', async () => {
    const newSession = { id: 'sess-new', goal: 'Test goal', status: 'active' };
    mockCreateProcrastinationSession.mockReturnValue(newSession);

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/procrastination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: 'Test goal',
        current_state: 'feeling stuck',
        steps: [{ description: 'Step 1' }, { description: 'Step 2' }],
      }),
    });
    const response = await POST(request as any);
    const data = await response.json();
    
    expect(mockCreateProcrastinationSession).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: '1',
        goal: 'Test goal',
        current_state: 'feeling stuck',
        steps: [{ description: 'Step 1' }, { description: 'Step 2' }],
      })
    );
    expect(data.session).toEqual(newSession);
  });

  it('should return 400 when goal is missing', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/procrastination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps: [{ description: 'Step 1' }] }),
    });
    const response = await POST(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Goal is required');
  });

  it('should return 400 when steps are missing', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/procrastination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'Test goal' }),
    });
    const response = await POST(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Steps are required');
  });

  it('should return 400 when steps is not an array', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/procrastination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'Test goal', steps: 'not an array' }),
    });
    const response = await POST(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Steps are required');
  });

  it('should return 400 when steps is empty array', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/procrastination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'Test goal', steps: [] }),
    });
    const response = await POST(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Steps are required');
  });

});

describe('PUT /api/procrastination', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/procrastination', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: 'sess-1', step_index: 0 }),
    });
    const response = await PUT(request as any);
    expect(response.status).toBe(401);
  });

  it('should complete step and update session', async () => {
    const existingSession = {
      id: 'sess-1',
      user_id: '1',
      steps: [
        { description: 'Step 1', completed: false },
        { description: 'Step 2', completed: false },
      ],
      current_step_index: 0,
      status: 'active',
    };
    mockGetProcrastinationSession.mockReturnValue(existingSession);
    
    const updatedSession = {
      ...existingSession,
      steps: [
        { description: 'Step 1', completed: true },
        { description: 'Step 2', completed: false },
      ],
      current_step_index: 1,
    };
    mockUpdateProcrastinationSession.mockReturnValue(updatedSession);

    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/procrastination', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: 'sess-1', step_index: 0 }),
    });
    const response = await PUT(request as any);
    const data = await response.json();
    
    expect(data.session.steps[0].completed).toBe(true);
    expect(data.session.current_step_index).toBe(1);
  });

  it('should mark session as completed when all steps done', async () => {
    const existingSession = {
      id: 'sess-1',
      user_id: '1',
      steps: [
        { description: 'Step 1', completed: false },
      ],
      current_step_index: 0,
      status: 'active',
    };
    mockGetProcrastinationSession.mockReturnValue(existingSession);
    
    const updatedSession = {
      ...existingSession,
      steps: [
        { description: 'Step 1', completed: true },
      ],
      current_step_index: 1,
      status: 'completed',
    };
    mockUpdateProcrastinationSession.mockReturnValue(updatedSession);

    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/procrastination', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: 'sess-1', step_index: 0 }),
    });
    const response = await PUT(request as any);
    const data = await response.json();
    
    expect(data.session.status).toBe('completed');
  });

  it('should return 400 when session_id is missing', async () => {
    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/procrastination', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_index: 0 }),
    });
    const response = await PUT(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Session ID is required');
  });

  it('should return 400 when step_index is missing', async () => {
    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/procrastination', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: 'sess-1' }),
    });
    const response = await PUT(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Step index is required');
  });

  it('should return 404 when session not found', async () => {
    mockGetProcrastinationSession.mockReturnValue(null);

    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/procrastination', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: 'nonexistent', step_index: 0 }),
    });
    const response = await PUT(request as any);
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Session not found');
  });

  it('should return 400 when step_index is out of bounds', async () => {
    const existingSession = {
      id: 'sess-1',
      user_id: '1',
      steps: [
        { description: 'Step 1', completed: false },
      ],
      current_step_index: 0,
      status: 'active',
    };
    mockGetProcrastinationSession.mockReturnValue(existingSession);

    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/procrastination', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: 'sess-1', step_index: 5 }),
    });
    const response = await PUT(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Step index out of bounds');
  });

  it('should handle negative step_index', async () => {
    const existingSession = {
      id: 'sess-1',
      user_id: '1',
      steps: [
        { description: 'Step 1', completed: false },
      ],
      current_step_index: 0,
      status: 'active',
    };
    mockGetProcrastinationSession.mockReturnValue(existingSession);

    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/procrastination', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: 'sess-1', step_index: -1 }),
    });
    const response = await PUT(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Step index out of bounds');
  });
});
