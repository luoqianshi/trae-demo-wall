import { NextRequest, NextResponse } from 'next/server';

export interface AuthContext {
  userId: string;
}

export interface AuthResult {
  success: boolean;
  context?: AuthContext;
  error?: string;
  statusCode?: number;
}

const LOCAL_USER_ID = '1';

export function extractToken(request: NextRequest): string | null {
  return request.headers.get('Authorization')?.replace('Bearer ', '') || null;
}

export function extractUserIdFromToken(token: string): string | null {
  if (token.startsWith('local-token-')) {
    return token.replace('local-token-', '');
  }
  if (token.startsWith('mock-jwt-token-')) {
    return token.replace('mock-jwt-token-', '');
  }
  // 修复 D-2: 未知 token 格式不再 fallback 到本地用户，防止越权
  console.warn('[Auth] Unknown token format, rejected. Token prefix:', token.substring(0, 10));
  return null;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    const token = extractToken(request);

    if (!token) {
      return {
        success: false,
        error: 'Authorization token required',
        statusCode: 401,
      };
    }

    const userId = extractUserIdFromToken(token);

    if (!userId) {
      return {
        success: false,
        error: 'Invalid token',
        statusCode: 401,
      };
    }

    return {
      success: true,
      context: {
        userId,
      },
    };
  } catch (err) {
    console.error('[Auth] authenticateRequest failed:', err);
    return {
      success: false,
      error: 'Authentication failed',
      statusCode: 500,
    };
  }
}

export function createErrorResponse(message: string, statusCode: number = 500): NextResponse {
  return NextResponse.json({ error: message }, { status: statusCode });
}

export function createSuccessResponse<T extends Record<string, unknown>>(
  data: T,
  statusCode: number = 200,
): NextResponse {
  return NextResponse.json({ success: true, ...data }, { status: statusCode });
}
