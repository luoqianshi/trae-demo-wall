import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const session = db.getProcrastinationSession(id);
      if (!session) {
        return createErrorResponse('Session not found', 404);
      }
      // 修复 R2-F4: 校验 session 归属
      if (session.user_id !== userId) {
        return createErrorResponse('Session not found', 404);
      }
      return createSuccessResponse({ session });
    }

    const sessions = db.getProcrastinationSessions(userId);
    return createSuccessResponse({ sessions });
  } catch (error: any) {
    console.error('Error in procrastination route:', error);
    return createErrorResponse(error.message || 'Failed to get sessions');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const { goal, current_state, steps } = await request.json();

    if (!goal) {
      return createErrorResponse('Goal is required', 400);
    }

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return createErrorResponse('Steps are required', 400);
    }

    const session = db.createProcrastinationSession({
      user_id: userId,
      goal,
      current_state,
      steps,
    });

    return createSuccessResponse({ session }, 201);
  } catch (error: any) {
    console.error('Error in procrastination route:', error);
    return createErrorResponse(error.message || 'Failed to create session');
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const { session_id, step_index } = await request.json();

    if (!session_id) {
      return createErrorResponse('Session ID is required', 400);
    }

    if (step_index === undefined || step_index === null) {
      return createErrorResponse('Step index is required', 400);
    }

    const existingSession = db.getProcrastinationSession(session_id);
    if (!existingSession) {
      return createErrorResponse('Session not found', 404);
    }
    // 修复 R2-F4: 校验 session 归属
    if (existingSession.user_id !== userId) {
      return createErrorResponse('Session not found', 404);
    }

    const updatedSteps = [...existingSession.steps];
    if (step_index < 0 || step_index >= updatedSteps.length) {
      return createErrorResponse('Step index out of bounds', 400);
    }
    updatedSteps[step_index] = { ...updatedSteps[step_index], completed: true };

    const allCompleted = updatedSteps.every(step => step.completed);

    const session = db.updateProcrastinationSession(session_id, {
      steps: updatedSteps,
      current_step_index: step_index + 1,
      status: allCompleted ? 'completed' : 'active',
    });

    return createSuccessResponse({ session });
  } catch (error: any) {
    console.error('Error in procrastination route:', error);
    return createErrorResponse(error.message || 'Failed to update session');
  }
}
