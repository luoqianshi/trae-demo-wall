import { NextRequest } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

export async function PUT(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const { name, avatar_url } = await request.json();

    const user = db.updateUser(userId, { name, avatar_url });
    return createSuccessResponse({ user });
  } catch (error: any) {
    console.error('Error in profile route:', error);
    return createErrorResponse(error.message || 'Failed to update profile');
  }
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const user = db.getUser(userId);

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    return createSuccessResponse({ user });
  } catch (error: any) {
    console.error('Error in profile route:', error);
    return createErrorResponse(error.message || 'Failed to get profile');
  }
}
