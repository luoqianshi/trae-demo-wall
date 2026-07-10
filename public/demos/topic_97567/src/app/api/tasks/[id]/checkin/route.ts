import { NextRequest } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

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
    const tasks = db.getTasks(userId);
    const task = tasks.find((t: any) => t.id === id);
    if (!task) return createErrorResponse('Task not found', 404);
    if (task.task_type !== 'habit') return createErrorResponse('Not a habit task', 400);

    // 修复 R5-4.3: 习惯打卡用本地日期判断今日/昨日，避免 UTC+8 跨日双打卡
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const lastCompleted = task.completed_at ? (() => {
      const d = new Date(task.completed_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })() : null;

    if (lastCompleted === today) {
      return createErrorResponse('Already checked in today', 409);
    }

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
    const isConsecutive = lastCompleted === yesterday;

    const newStreak = isConsecutive ? (task.current_streak || 0) + 1 : 1;
    const newBestStreak = Math.max(newStreak, task.best_streak || 0);

    // 原子化：习惯打卡 + 积分发放在同一事务中，避免部分成功
    const updated = db.completeTaskWithScore(id, {
      current_streak: newStreak,
      best_streak: newBestStreak,
      status: 'completed',
    }, userId, 'HABIT_CHECKIN', id);

    return createSuccessResponse({
      task: updated,
      streak: newStreak,
      best_streak: newBestStreak,
      is_consecutive: isConsecutive,
    });
  } catch (error: any) {
    console.error('Error in checkin route:', error);
    return createErrorResponse(error.message || 'Failed to check in');
  }
}
