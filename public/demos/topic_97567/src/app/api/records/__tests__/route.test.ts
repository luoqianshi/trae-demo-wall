import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockAuthenticateRequest = vi.fn();
const mockCreateErrorResponse = vi.fn();
const mockCreateSuccessResponse = vi.fn();
const mockGetRecords = vi.fn();
const mockCreateRecord = vi.fn();
const mockCreateRecordWithScore = vi.fn();
const mockUpdateRecord = vi.fn();
const mockDeleteRecord = vi.fn();

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
  getRecords: mockGetRecords,
  createRecord: mockCreateRecord,
  createRecordWithScore: mockCreateRecordWithScore,
  updateRecord: mockUpdateRecord,
  deleteRecord: mockDeleteRecord,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthenticateRequest.mockResolvedValue({
    success: true,
    context: { userId: '1' },
  });
  mockGetRecords.mockReturnValue([]);
});

describe('GET /api/records', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/records');
    const response = await GET(request as any);
    expect(response.status).toBe(401);
  });

  it('should return records for authenticated user', async () => {
    const mockRecords = [
      { id: 'rec-1', content: 'Test record 1', record_type: 'success' },
      { id: 'rec-2', content: 'Test record 2', record_type: 'challenge' },
    ];
    mockGetRecords.mockReturnValue(mockRecords);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/records');
    const response = await GET(request as any);
    const data = await response.json();

    expect(mockGetRecords).toHaveBeenCalledWith('1');
    // R5-2.2: GET 响应现在包含 type 字段映射（record_type → type）
    expect(data.records).toEqual([
      { id: 'rec-1', content: 'Test record 1', record_type: 'success', type: 'success' },
      { id: 'rec-2', content: 'Test record 2', record_type: 'challenge', type: 'challenge' },
    ]);
  });

  it('should return empty array when no records exist', async () => {
    mockGetRecords.mockReturnValue([]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/records');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(data.records).toEqual([]);
  });
});

describe('POST /api/records', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test content' }),
    });
    const response = await POST(request as any);
    expect(response.status).toBe(401);
  });

  it('should create record with valid content', async () => {
    const newRecord = { id: 'rec-new', content: 'Test content', record_type: 'success' };
    mockCreateRecordWithScore.mockReturnValue(newRecord);

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test content' }),
    });
    const response = await POST(request as any);
    const data = await response.json();

    expect(mockCreateRecordWithScore).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: '1',
        content: 'Test content',
        record_type: 'success',
        mood: 'happy',
      }),
      '1',
      'RECORD_CREATED'
    );
    // R5-2.2: POST 响应现在包含 type 字段映射（record_type → type）
    expect(data.record).toEqual({ ...newRecord, type: newRecord.record_type });
    expect(response.status).toBe(201);
  });

  it('should use createRecordWithScore when skip_score is not true', async () => {
    const newRecord = { id: 'rec-new', content: 'Test content' };
    mockCreateRecordWithScore.mockReturnValue(newRecord);

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test content' }),
    });
    await POST(request as any);

    expect(mockCreateRecordWithScore).toHaveBeenCalled();
    expect(mockCreateRecord).not.toHaveBeenCalled();
  });

  it('should use createRecord (no score) when skip_score is true', async () => {
    const newRecord = { id: 'rec-new', content: 'Test content' };
    mockCreateRecord.mockReturnValue(newRecord);

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test content', skip_score: true }),
    });
    await POST(request as any);

    expect(mockCreateRecord).toHaveBeenCalled();
    expect(mockCreateRecordWithScore).not.toHaveBeenCalled();
  });

  it('should return 400 when content is missing', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Content is required and must be a string');
  });

  it('should return 400 when content is not a string', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 123 }),
    });
    const response = await POST(request as any);
    
    expect(response.status).toBe(400);
  });

  it('should return 400 when content exceeds 10000 characters', async () => {
    const { POST } = await import('../route');
    const longContent = 'a'.repeat(10001);
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: longContent }),
    });
    const response = await POST(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Content must be less than 10000 characters');
  });

  it('should return 400 for invalid record type', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test', type: 'invalid' }),
    });
    const response = await POST(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid record type');
  });

  it('should return 400 for invalid mood', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test', mood: 'invalid_mood' }),
    });
    const response = await POST(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid mood');
  });

  it('should accept all valid record types', async () => {
    const validTypes = ['success', 'challenge', 'insight', 'question'];

    for (const type of validTypes) {
      mockCreateRecordWithScore.mockReturnValue({ id: `rec-${type}`, content: 'Test', record_type: type });
      const { POST } = await import('../route');
      const request = new Request('http://localhost/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Test', type }),
      });
      const response = await POST(request as any);
      expect(response.status).toBe(201);
    }
  });

  it('should accept all valid moods', async () => {
    const validMoods = ['happy', 'calm', 'excited', 'tired', 'anxious', 'sad', 'proud', 'grateful', 'neutral'];

    for (const mood of validMoods) {
      mockCreateRecordWithScore.mockReturnValue({ id: `rec-${mood}`, content: 'Test', mood });
      const { POST } = await import('../route');
      const request = new Request('http://localhost/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Test', mood }),
      });
      const response = await POST(request as any);
      expect(response.status).toBe(201);
    }
  });
});

describe('DELETE /api/records', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { DELETE } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'rec-1' }),
    });
    const response = await DELETE(request as any);
    expect(response.status).toBe(401);
  });

  it('should delete record by id', async () => {
    mockDeleteRecord.mockReturnValue(true);
    // 修复 H-12 引入的回归：owner 校验需要 getRecords 返回该记录
    mockGetRecords.mockReturnValue([{ id: 'rec-1', user_id: '1' }]);

    const { DELETE } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'rec-1' }),
    });
    const response = await DELETE(request as any);

    expect(mockDeleteRecord).toHaveBeenCalledWith('rec-1');
  });

  it('should return 400 when id is missing', async () => {
    const { DELETE } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await DELETE(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Record ID is required');
  });
});

describe('PATCH /api/records', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { PATCH } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'rec-1', type: 'challenge' }),
    });
    const response = await PATCH(request as any);
    expect(response.status).toBe(401);
  });

  it('should update record type', async () => {
    const updatedRecord = { id: 'rec-1', type: 'challenge' };
    mockUpdateRecord.mockReturnValue(updatedRecord);
    // 修复 H-12 引入的回归：owner 校验需要 getRecords 返回该记录
    mockGetRecords.mockReturnValue([{ id: 'rec-1', user_id: '1' }]);

    const { PATCH } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'rec-1', type: 'challenge' }),
    });
    const response = await PATCH(request as any);
    const data = await response.json();

    expect(mockUpdateRecord).toHaveBeenCalledWith('rec-1', { record_type: 'challenge' });
    expect(data.record).toEqual(updatedRecord);
  });

  it('should update record tags', async () => {
    const updatedRecord = { id: 'rec-1', tags: ['work', 'important'] };
    mockUpdateRecord.mockReturnValue(updatedRecord);
    // 修复 H-12 引入的回归：owner 校验需要 getRecords 返回该记录
    mockGetRecords.mockReturnValue([{ id: 'rec-1', user_id: '1' }]);

    const { PATCH } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'rec-1', tags: ['work', 'important'] }),
    });
    const response = await PATCH(request as any);

    expect(mockUpdateRecord).toHaveBeenCalledWith('rec-1', { tags: ['work', 'important'] });
  });

  it('should return 400 when id is missing', async () => {
    const { PATCH } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'challenge' }),
    });
    const response = await PATCH(request as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Record ID is required');
  });
});
