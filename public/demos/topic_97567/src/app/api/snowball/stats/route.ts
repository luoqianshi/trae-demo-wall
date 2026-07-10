import { NextRequest } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';
import { calculateTotalStats, type Record, type Task } from '@/lib/snowball-score-calculator';
import { calculateEventScore, calculateTodayEventScore } from '@/lib/score-engine';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const records = db.getRecords(userId) as Record[];
    // 修复 R5-2.1: 添加 task_type→type 字段映射，否则 calculateTaskScore 中
    // t.type 恒为 undefined，导致 quickCompleted/habitCheckins/bigTaskCompleted 全为 0
    const tasks = db.getTasks(userId).map((t: any) => ({ ...t, type: t.task_type })) as Task[];
    const totalScore = calculateEventScore(userId);
    const todayScore = calculateTodayEventScore(userId);
    const displayStats = calculateTotalStats(records, tasks);

    return createSuccessResponse({
      totalScore,
      todayScore,
      todayStreak: displayStats.todayStreak,
      recordCount: displayStats.recordCount,
      taskCompletedCount: displayStats.taskCompletedCount,
    });
  } catch (error) {
    console.error('Failed to fetch snowball stats:', error);
    return createErrorResponse('获取雪球数据失败', 500);
  }
}
