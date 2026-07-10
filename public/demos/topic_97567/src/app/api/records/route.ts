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
    // 修复 R5-2.2: 添加 record_type→type 字段映射，与 tasks/challenges API 一致
    const records = db.getRecords(userId).map((r: any) => ({ ...r, type: r.record_type }));
    return createSuccessResponse({ records });
  } catch (error: unknown) {
    console.error('Error in records route:', error);
    return createErrorResponse((error as Error).message || 'Failed to get records');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const { content, type, tags, mood, related_task_id, skip_score } = await request.json();

    if (!content || typeof content !== 'string') {
      return createErrorResponse('Content is required and must be a string', 400);
    }

    if (content.length > 10000) {
      return createErrorResponse('Content must be less than 10000 characters', 400);
    }

    const validRecordTypes = ['success', 'challenge', 'insight', 'question'];
    if (type && !validRecordTypes.includes(type)) {
      return createErrorResponse('Invalid record type', 400);
    }

    const validMoods = ['happy', 'calm', 'excited', 'tired', 'anxious', 'sad', 'proud', 'grateful', 'neutral'];
    if (mood && !validMoods.includes(mood)) {
      return createErrorResponse('Invalid mood', 400);
    }

    const recordData = {
      user_id: userId,
      content,
      record_type: type || 'success',
      tags: tags || [],
      mood: mood || 'happy',
      related_goal_id: null,
      related_task_id,
    };

    // 原子化：记录创建 + 积分发放在同一事务中，避免部分成功
    const record = skip_score
      ? db.createRecord(recordData)
      : db.createRecordWithScore(recordData, userId, 'RECORD_CREATED');

    // 修复 R5-2.2: POST 响应也需添加 type 映射，与 GET 和 tasks POST 保持一致
    return createSuccessResponse({ record: { ...record, type: record.record_type } }, 201);
  } catch (error: unknown) {
    console.error('Error in records route:', error);
    return createErrorResponse((error as Error).message || 'Failed to create record');
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const { id } = await request.json();

    if (!id) {
      return createErrorResponse('Record ID is required', 400);
    }

    // 修复 D-3: 校验记录属于当前用户
    const userRecords = db.getRecords(userId);
    if (!userRecords.find((r: any) => r.id === id)) {
      return createErrorResponse('Record not found', 404);
    }

    db.deleteRecord(id);
    return createSuccessResponse({});
  } catch (error: unknown) {
    console.error('Error in records route:', error);
    return createErrorResponse((error as Error).message || 'Failed to delete record');
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const { id, type, tags } = await request.json();

    if (!id) {
      return createErrorResponse('Record ID is required', 400);
    }

    // 修复 D-3: 校验记录属于当前用户
    const userRecords = db.getRecords(userId);
    if (!userRecords.find((r: any) => r.id === id)) {
      return createErrorResponse('Record not found', 404);
    }

    const updates: Record<string, unknown> = {};
    if (type !== undefined) updates.record_type = type;
    if (tags !== undefined) updates.tags = tags;

    const record = db.updateRecord(id, updates);
    return createSuccessResponse({ record });
  } catch (error: unknown) {
    console.error('Error in records route:', error);
    return createErrorResponse((error as Error).message || 'Failed to update record');
  }
}
