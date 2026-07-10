import { NextRequest } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;
  const { id } = await params;

  try {
    const subtasks = db.getTasks(userId, null, id);
    return createSuccessResponse({ subtasks });
  } catch (error: any) {
    console.error('Error in subtasks route:', error);
    return createErrorResponse(error.message || 'Failed to get subtasks');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;
  const { id } = await params;

  try {
    const { title, description, importance, due_date } = await request.json();

    if (!title) return createErrorResponse('Title is required', 400);

    // 修复 R3-1 IDOR: 校验父任务归属于当前用户，防止跨用户挂载子任务
    // 返回 404 而非 403 以避免泄露父任务存在性（与 R2-F4/F5/F6 防御模式一致）
    const parentTask = db.getTasks(userId).find((t: any) => t.id === id);
    if (!parentTask) {
      return createErrorResponse('Parent task not found', 404);
    }

    const subtask = db.createTask({
      title,
      description: description || null,
      task_type: 'normal',
      importance: importance || 3,
      due_date: due_date || null,
      parent_id: id,
      goal_id: null,
      user_id: userId,
      status: 'pending',
      progress: 0,
    });

    return createSuccessResponse({ subtask }, 201);
  } catch (error: any) {
    console.error('Error in subtasks route:', error);
    return createErrorResponse(error.message || 'Failed to create subtask');
  }
}
