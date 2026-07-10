import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

export interface ReminderItem {
  id: string;
  time: string;
  enabled: boolean;
  label: string;
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const reminders = db.getReminders(userId);
    return createSuccessResponse({ reminders });
  } catch (error: any) {
    console.error('Error in GET /api/reminders:', error);
    return createErrorResponse(error.message || 'Failed to get reminders');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const body = await request.json();
    const { time, label } = body;

    if (!time || typeof time !== 'string') {
      return createErrorResponse('Time is required', 400);
    }

    const reminder = db.createReminder({
      user_id: userId,
      time,
      label: label || '提醒',
    });

    const reminders = db.getReminders(userId);

    return createSuccessResponse({ reminder, reminders });
  } catch (error: any) {
    console.error('Error in POST /api/reminders:', error);
    return createErrorResponse(error.message || 'Failed to create reminder');
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const body = await request.json();
    const { id, time, enabled, label } = body;

    if (!id) {
      return createErrorResponse('Reminder ID is required', 400);
    }

    // 修复 R2-F5: 校验 reminder 归属
    const existingReminder = db.getReminder(id);
    if (!existingReminder || existingReminder.user_id !== userId) {
      return createErrorResponse('Reminder not found', 404);
    }

    const updates: Record<string, any> = {};
    if (time !== undefined) updates.time = time;
    if (enabled !== undefined) updates.enabled = enabled;
    if (label !== undefined) updates.label = label;

    db.updateReminder(id, updates);

    const reminders = db.getReminders(userId);
    return createSuccessResponse({ reminders });
  } catch (error: any) {
    console.error('Error in PUT /api/reminders:', error);
    return createErrorResponse(error.message || 'Failed to update reminder');
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return createErrorResponse('Reminder ID is required', 400);
    }

    // 修复 R2-F5: 校验 reminder 归属
    const existingReminder = db.getReminder(id);
    if (!existingReminder || existingReminder.user_id !== userId) {
      return createErrorResponse('Reminder not found', 404);
    }

    db.deleteReminder(id);

    const reminders = db.getReminders(userId);
    return createSuccessResponse({ reminders });
  } catch (error: any) {
    console.error('Error in DELETE /api/reminders:', error);
    return createErrorResponse(error.message || 'Failed to delete reminder');
  }
}
