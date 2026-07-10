import { NextRequest } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const allTasks = db.getTasks(userId);
    const bigTasks = allTasks
      .filter((t: any) => t.task_type === 'big')
      .map((t: any) => ({ id: t.id, title: t.title, progress: t.progress || 0 }));
    return createSuccessResponse({ tasks: bigTasks });
  } catch (error: any) {
    console.error('Error in tasks/big route:', error);
    return createErrorResponse(error.message || 'Failed to get big tasks');
  }
}
