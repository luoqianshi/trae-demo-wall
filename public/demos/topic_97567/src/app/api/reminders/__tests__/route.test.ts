import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockAuthenticateRequest = vi.fn();
const mockCreateErrorResponse = vi.fn();
const mockCreateSuccessResponse = vi.fn();
const mockGetReminders = vi.fn();
const mockGetReminder = vi.fn();
const mockCreateReminder = vi.fn();
const mockUpdateReminder = vi.fn();
const mockDeleteReminder = vi.fn();

vi.mock('@/lib/api-auth', () => ({
  authenticateRequest: mockAuthenticateRequest,
  createErrorResponse: (...args: any[]) => {
    const [msg, status] = args;
    return new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } });
  },
  createSuccessResponse: (...args: any[]) => {
    const [data] = args;
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  },
}));

vi.mock('@/lib/local-db', () => ({
  getReminders: mockGetReminders,
  getReminder: mockGetReminder,
  createReminder: mockCreateReminder,
  updateReminder: mockUpdateReminder,
  deleteReminder: mockDeleteReminder,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthenticateRequest.mockResolvedValue({
    success: true,
    context: { userId: '1' },
  });
  mockGetReminders.mockReturnValue([]);
});

describe('GET /api/reminders', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/reminders');
    const response = await GET(request as any);
    expect(response.status).toBe(401);
  });

  it('should return reminders for authenticated user', async () => {
    const mockReminders = [
      { id: 'rem-1', time: '09:00', label: 'Morning Reminder', enabled: true },
      { id: 'rem-2', time: '21:00', label: 'Evening Reminder', enabled: true },
    ];
    mockGetReminders.mockReturnValue(mockReminders);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/reminders');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(mockGetReminders).toHaveBeenCalledWith('1');
    expect(data.reminders).toEqual(mockReminders);
  });

  it('should return empty array when no reminders exist', async () => {
    mockGetReminders.mockReturnValue([]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/reminders');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(data.reminders).toEqual([]);
  });
});

describe('POST /api/reminders', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: '09:00' }),
    });
    const response = await POST(request as any);
    expect(response.status).toBe(401);
  });

  it('should create reminder with valid time', async () => {
    const newReminder = { id: 'rem-new', user_id: '1', time: '09:00', label: '提醒' };
    mockCreateReminder.mockReturnValue(newReminder);
    mockGetReminders.mockReturnValue([newReminder]);

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: '09:00' }),
    });
    const response = await POST(request as any);
    const data = await response.json();
    
    expect(mockCreateReminder).toHaveBeenCalledWith({
      user_id: '1',
      time: '09:00',
      label: '提醒',
    });
    expect(data.reminder).toEqual(newReminder);
  });

  it('should create reminder with custom label', async () => {
    const newReminder = { id: 'rem-new', user_id: '1', time: '09:00', label: '自定义提醒' };
    mockCreateReminder.mockReturnValue(newReminder);
    mockGetReminders.mockReturnValue([newReminder]);

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: '09:00', label: '自定义提醒' }),
    });
    const response = await POST(request as any);
    const data = await response.json();
    
    expect(mockCreateReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        label: '自定义提醒',
      })
    );
  });

  it('should return 400 when time is missing', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Time is required');
  });

  it('should return 400 when time is not a string', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: 900 }),
    });
    const response = await POST(request as any);
    
    expect(response.status).toBe(400);
  });
});

describe('PUT /api/reminders', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/reminders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'rem-1', time: '10:00' }),
    });
    const response = await PUT(request as any);
    expect(response.status).toBe(401);
  });

  it('should update reminder time', async () => {
    mockGetReminder.mockReturnValue({ id: 'rem-1', user_id: '1', time: '09:00' });
    mockUpdateReminder.mockReturnValue({ id: 'rem-1', time: '10:00' });
    mockGetReminders.mockReturnValue([{ id: 'rem-1', time: '10:00' }]);

    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/reminders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'rem-1', time: '10:00' }),
    });
    const response = await PUT(request as any);
    
    expect(mockUpdateReminder).toHaveBeenCalledWith('rem-1', { time: '10:00' });
  });

  it('should update reminder enabled status', async () => {
    mockGetReminder.mockReturnValue({ id: 'rem-1', user_id: '1', enabled: true });
    mockUpdateReminder.mockReturnValue({ id: 'rem-1', enabled: false });
    mockGetReminders.mockReturnValue([{ id: 'rem-1', enabled: false }]);

    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/reminders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'rem-1', enabled: false }),
    });
    const response = await PUT(request as any);
    
    expect(mockUpdateReminder).toHaveBeenCalledWith('rem-1', { enabled: false });
  });

  it('should return 400 when id is missing', async () => {
    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/reminders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: '10:00' }),
    });
    const response = await PUT(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Reminder ID is required');
  });
});

describe('DELETE /api/reminders', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { DELETE } = await import('../route');
    const request = new Request('http://localhost/api/reminders?id=rem-1');
    const response = await DELETE(request as any);
    expect(response.status).toBe(401);
  });

  it('should delete reminder by id', async () => {
    mockGetReminder.mockReturnValue({ id: 'rem-1', user_id: '1' });
    mockDeleteReminder.mockReturnValue(true);
    mockGetReminders.mockReturnValue([]);

    const { DELETE } = await import('../route');
    const request = new Request('http://localhost/api/reminders?id=rem-1');
    const response = await DELETE(request as any);
    
    expect(mockDeleteReminder).toHaveBeenCalledWith('rem-1');
  });

  it('should return 400 when id is missing', async () => {
    const { DELETE } = await import('../route');
    const request = new Request('http://localhost/api/reminders');
    const response = await DELETE(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Reminder ID is required');
  });

  it('should return remaining reminders after deletion', async () => {
    mockGetReminder.mockReturnValue({ id: 'rem-1', user_id: '1' });
    mockDeleteReminder.mockReturnValue(true);
    mockGetReminders.mockReturnValue([{ id: 'rem-2', time: '10:00' }]);

    const { DELETE } = await import('../route');
    const request = new Request('http://localhost/api/reminders?id=rem-1');
    const response = await DELETE(request as any);
    const data = await response.json();
    
    expect(data.reminders).toHaveLength(1);
    expect(data.reminders[0].id).toBe('rem-2');
  });
});
