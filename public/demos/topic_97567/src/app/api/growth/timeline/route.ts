import { NextRequest } from 'next/server';
import * as db from '@/lib/local-db';
import { achievementDefinitions } from '@/lib/data-models';
import { SNOWBALL_STAGES, getSnowballStage, type SnowballStage } from '@/lib/snowball-score';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

interface TimelineEvent {
  date: string;
  type: 'record' | 'stage_change' | 'achievement' | 'challenge';
  title: string;
  description: string;
  emoji: string;
  metadata?: Record<string, any>;
}

function detectStageChanges(
  recordsByDate: Map<string, number>,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  let cumulativeRecords = 0;
  let prevStage: SnowballStage | null = null;

  const sortedDates = Array.from(recordsByDate.keys()).sort();

  for (const date of sortedDates) {
    cumulativeRecords += recordsByDate.get(date) || 0;
    const currentStage = getSnowballStage(cumulativeRecords).stage;

    if (prevStage !== null && currentStage !== prevStage) {
      const prevConfig = SNOWBALL_STAGES.find(s => s.stage === prevStage);
      const currConfig = SNOWBALL_STAGES.find(s => s.stage === currentStage);
      events.push({
        date: `${date}T12:00:00.000Z`,
        type: 'stage_change',
        title: '雪球进化了！',
        description: `雪球从${prevConfig?.label || prevStage}变成了${currConfig?.label || currentStage}`,
        emoji: '\uD83C\uDF89',
        metadata: {
          from_stage: prevConfig?.label || prevStage,
          to_stage: currConfig?.label || currentStage,
        },
      });
    }
    prevStage = currentStage;
  }

  return events;
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 30;

    const events: TimelineEvent[] = [];

    const records = db.getRecords(userId);
    const recordsByDate = new Map<string, number>();

    for (const record of records) {
      const dateKey = record.created_at.split('T')[0];
      recordsByDate.set(dateKey, (recordsByDate.get(dateKey) || 0) + 1);

      const typeLabel =
        record.record_type === 'success' ? '小成功' :
        record.record_type === 'habit' ? '好习惯' :
        record.record_type === 'progress' ? '进步' :
        record.record_type === 'reflection' ? '感悟' : '记录';

      events.push({
        date: record.created_at,
        type: 'record',
        title: `记录了${typeLabel}`,
        description: `${record.content.slice(0, 50)}${record.content.length > 50 ? '...' : ''}`,
        emoji: '\u2744\uFE0F',
        metadata: {
          content: record.content,
          record_type: record.record_type,
          mood: record.mood,
          tags: record.tags,
        },
      });
    }

    const stageChangeEvents = detectStageChanges(recordsByDate);
    events.push(...stageChangeEvents);

    const userAchievements = db.getUserAchievements(userId);
    for (const ua of userAchievements) {
      const definition = achievementDefinitions.find(a => a.id === ua.achievement_id);
      if (definition) {
        events.push({
          date: ua.unlocked_at,
          type: 'achievement',
          title: `解锁成就：${definition.title}`,
          description: definition.description,
          emoji: '\uD83C\uDFC6',
          metadata: {
            achievement_id: definition.id,
            achievement_icon: definition.icon,
            achievement_level: definition.level,
          },
        });
      }
    }

    const userChallenges = db.getUserChallenges(userId);
    const allChallenges = db.getChallenges();
    const challengeMap = new Map(allChallenges.map((c: any) => [c.id, c]));

    const completedChallenges = userChallenges.filter((uc: any) => uc.status === 'completed');
    for (const uc of completedChallenges) {
      const challenge = challengeMap.get(uc.challenge_id);

      events.push({
        date: uc.completed_at || uc.started_at,
        type: 'challenge',
        title: `完成挑战：${challenge?.title || '未知挑战'}`,
        description: challenge?.description || '坚持就是胜利！',
        emoji: '🎮',
        metadata: {
          challenge_id: uc.challenge_id,
          difficulty: challenge?.type || 'bronze',
        },
      });
    }

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return createSuccessResponse({ events: events.slice(0, limit) });
  } catch (error: any) {
    console.error('Error in GET /api/growth/timeline:', error);
    return createErrorResponse(error.message || 'Failed to get timeline');
  }
}
