import { NextRequest } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';
import { DEFAULT_THRESHOLDS, Thresholds } from '@/lib/quadrant-utils';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const allThresholds = db.getThresholds(userId);

    const normalRow = allThresholds.find((t: any) => t.type === 'normal' && !t.big_task_id);
    const bigRows = allThresholds.filter((t: any) => t.type === 'big');

    const normal: Thresholds = normalRow ? {
      critical: normalRow.critical,
      high: normalRow.high,
      medium: normalRow.medium,
      low: normalRow.low,
      none: normalRow.none,
    } : DEFAULT_THRESHOLDS;

    const big_tasks: Record<string, Thresholds> = {};
    for (const row of bigRows) {
      if (row.big_task_id) {
        big_tasks[row.big_task_id] = {
          critical: row.critical,
          high: row.high,
          medium: row.medium,
          low: row.low,
          none: row.none,
        };
      }
    }

    return createSuccessResponse({ normal, big_tasks });
  } catch (error: any) {
    console.error('Error in thresholds route:', error);
    return createErrorResponse(error.message || 'Failed to get thresholds');
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const { type, thresholds, big_task_id } = await request.json();

    if (!type || !thresholds) {
      return createErrorResponse('type and thresholds are required', 400);
    }

    if (type === 'big' && !big_task_id) {
      return createErrorResponse('big_task_id is required when type=big', 400);
    }

    const validThresholds: Thresholds = {
      critical: Math.max(0, Number(thresholds.critical) || DEFAULT_THRESHOLDS.critical),
      high: Math.max(0, Number(thresholds.high) || DEFAULT_THRESHOLDS.high),
      medium: Math.max(0, Number(thresholds.medium) || DEFAULT_THRESHOLDS.medium),
      low: Math.max(0, Number(thresholds.low) || DEFAULT_THRESHOLDS.low),
      none: Math.max(0, Number(thresholds.none) || DEFAULT_THRESHOLDS.none),
    };

    db.upsertThresholds(userId, {
      type,
      big_task_id: big_task_id || null,
      ...validThresholds,
    });

    return createSuccessResponse({ thresholds: validThresholds });
  } catch (error: any) {
    console.error('Error in thresholds route:', error);
    return createErrorResponse(error.message || 'Failed to update thresholds');
  }
}
