import { describe, it, expect } from 'vitest';
import {
  extractToken,
  extractUserIdFromToken,
  authenticateRequest,
  createErrorResponse,
  createSuccessResponse,
  type AuthResult,
  type AuthContext,
} from '../api-auth';

// 修复 R2-C1: 测试真实实现而非本地重定义函数

function createMockRequest(options: {
  headers?: Record<string, string>;
}): any {
  const headers: Record<string, string> = options.headers || {};
  return {
    headers: {
      get: (name: string) => headers[name] || null,
    },
  };
}

describe('extractToken', () => {
  it('should extract token from Bearer authorization header', () => {
    const request = createMockRequest({
      headers: { Authorization: 'Bearer test-token-123' },
    });
    expect(extractToken(request)).toBe('test-token-123');
  });

  it('should return null when no authorization header', () => {
    const request = createMockRequest({});
    expect(extractToken(request)).toBeNull();
  });

  it('should return null when authorization header is empty', () => {
    const request = createMockRequest({
      headers: { Authorization: '' },
    });
    expect(extractToken(request)).toBeNull();
  });

  it('should return non-Bearer authorization scheme as-is (not stripped)', () => {
    const request = createMockRequest({
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    });
    // extractToken only strips 'Bearer ' prefix, other schemes pass through
    expect(extractToken(request)).toBe('Basic dXNlcjpwYXNz');
  });
});

describe('extractUserIdFromToken', () => {
  it('should extract userId from local token', () => {
    const result = extractUserIdFromToken('local-token-user123');
    expect(result).toBe('user123');
  });

  it('should extract userId from mock-jwt-token format', () => {
    const result = extractUserIdFromToken('mock-jwt-token-user456');
    expect(result).toBe('user456');
  });

  it('should return null for unknown token format (D-2 fix)', () => {
    // 修复 D-2: 未知 token 格式不再 fallback 到本地用户
    const result = extractUserIdFromToken('regular-jwt-token');
    expect(result).toBeNull();
  });

  it('should return null for JWT-style tokens (D-2 fix)', () => {
    const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
    const result = extractUserIdFromToken(jwtToken);
    expect(result).toBeNull();
  });

  it('should handle local-token- with empty userId', () => {
    const result = extractUserIdFromToken('local-token-');
    expect(result).toBe('');
  });

  it('should handle token with special characters in userId', () => {
    const result = extractUserIdFromToken('local-token-user-1');
    expect(result).toBe('user-1');
  });

  it('should extract userId from token with underscores', () => {
    const result = extractUserIdFromToken('local-token-user_test_123');
    expect(result).toBe('user_test_123');
  });
});

describe('createErrorResponse', () => {
  it('should create error response with 401 status', async () => {
    const response = createErrorResponse('Unauthorized', 401);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should create error response with default 500 status', () => {
    const response = createErrorResponse('Internal Server Error');
    expect(response.status).toBe(500);
  });

  it('should create error response with custom status', () => {
    const response = createErrorResponse('Not Found', 404);
    expect(response.status).toBe(404);
  });
});

describe('createSuccessResponse', () => {
  it('should create success response with default 200 status', () => {
    const response = createSuccessResponse({ data: 'test' });
    expect(response.status).toBe(200);
  });

  it('should create success response with custom status', () => {
    const response = createSuccessResponse({ data: 'created' }, 201);
    expect(response.status).toBe(201);
  });

  it('should include success true in body', async () => {
    const response = createSuccessResponse({ data: 'test' });
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('should include data in body', async () => {
    const response = createSuccessResponse({ tasks: [] });
    const body = await response.json();
    expect(body.tasks).toEqual([]);
  });
});

describe('authenticateRequest', () => {
  it('should fail when no authorization header', async () => {
    const request = createMockRequest({});
    const result = await authenticateRequest(request);
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
  });

  it('should succeed with valid local-token', async () => {
    const request = createMockRequest({
      headers: { Authorization: 'Bearer local-token-user123' },
    });
    const result = await authenticateRequest(request);
    expect(result.success).toBe(true);
    expect(result.context?.userId).toBe('user123');
  });

  it('should succeed with mock-jwt-token', async () => {
    const request = createMockRequest({
      headers: { Authorization: 'Bearer mock-jwt-token-user456' },
    });
    const result = await authenticateRequest(request);
    expect(result.success).toBe(true);
    expect(result.context?.userId).toBe('user456');
  });

  it('should fail with unknown token format (D-2 fix)', async () => {
    // 修复 D-2: 未知 token 格式不再 fallback 到本地用户，防止越权
    const request = createMockRequest({
      headers: { Authorization: 'Bearer unknown-token-format' },
    });
    const result = await authenticateRequest(request);
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
  });

  it('should fail with raw JWT token (D-2 fix)', async () => {
    const request = createMockRequest({
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.sig' },
    });
    const result = await authenticateRequest(request);
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
  });
});

describe('AuthResult type', () => {
  it('should have success true with context for valid auth', () => {
    const result: AuthResult = {
      success: true,
      context: {
        userId: 'user123',
      },
    };
    expect(result.success).toBe(true);
    expect(result.context?.userId).toBe('user123');
  });

  it('should have success false with error for invalid auth', () => {
    const result: AuthResult = {
      success: false,
      error: 'Invalid token',
      statusCode: 401,
    };
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid token');
    expect(result.statusCode).toBe(401);
  });
});

describe('AuthContext type', () => {
  it('should have required userId field', () => {
    const context: AuthContext = {
      userId: 'user123',
    };
    expect(context.userId).toBe('user123');
  });
});
