import { NextRequest } from 'next/server';
import { extractToken, extractUserIdFromToken, createSuccessResponse } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request);

    if (!token) {
      return createSuccessResponse({});
    }

    const userId = extractUserIdFromToken(token);

    if (!userId) {
      return createSuccessResponse({});
    }

    const { event_name, params } = await request.json();

    if (!event_name) {
      return createSuccessResponse({});
    }


    return createSuccessResponse({});
  } catch (error: unknown) {
    console.error('[Analytics] Unexpected error:', error);
    return createSuccessResponse({});
  }
}
