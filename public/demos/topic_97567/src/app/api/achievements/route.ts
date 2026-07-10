import { NextRequest } from 'next/server';
import * as db from '@/lib/local-db';
import { achievementDefinitions } from '@/lib/data-models';
import { calculateProgress } from '@/lib/achievement-engine';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const userAchievements = db.getUserAchievements(userId);
    const unlockedIds = new Set(userAchievements.map((a: any) => a.achievement_id));
    const stats = db.getUserStats(userId);
    const interactions = db.getUserInteractions(userId);
    const fullStats = { ...stats, ...interactions };

    const result = achievementDefinitions.map(ach => ({
      id: ach.id,
      title: ach.title,
      description: ach.description,
      icon: ach.icon,
      level: ach.level,
      category: ach.category,
      unlocked: unlockedIds.has(ach.id),
      unlocked_at: userAchievements.find((ua: any) => ua.achievement_id === ach.id)?.unlocked_at || undefined,
      progress: unlockedIds.has(ach.id) ? 1 : calculateProgress(ach.id, fullStats),
    }));

    return createSuccessResponse({ achievements: result });
  } catch (error: any) {
    console.error('Error in GET /api/achievements:', error);
    return createErrorResponse(error.message || 'Failed to get achievements');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    let clientData: Record<string, any> = {};
    try {
      clientData = await request.json();
    } catch {
      clientData = {};
    }

    const stats = db.getUserStats(userId);
    const interactions = db.getUserInteractions(userId);

    const fullStats = {
      ...stats,
      ...interactions,
      midnight_record: clientData.midnight_record || false,
      record_500_words: clientData.record_500_words || false,
    };

    const newlyUnlockedIds = db.checkAndUnlockAchievements(userId, fullStats);

    const newlyUnlocked = newlyUnlockedIds.map(id => {
      const def = achievementDefinitions.find(a => a.id === id);
      return def ? { id: def.id, title: def.title, description: def.description, icon: def.icon, level: def.level, category: def.category } : { id };
    });

    return createSuccessResponse({ newlyUnlocked });
  } catch (error: any) {
    console.error('Error in POST /api/achievements:', error);
    return createErrorResponse(error.message || 'Failed to check achievements');
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const body = await request.json();
    const { type } = body;

    if (type !== 'snowball_interaction' && type !== 'snowball_click') {
      return createErrorResponse('Invalid interaction type', 400);
    }

    const newCount = db.incrementUserInteraction(userId, type);

    const stats = db.getUserStats(userId);
    const interactions = db.getUserInteractions(userId);
    const fullStats = { ...stats, ...interactions };

    const newlyUnlockedIds = db.checkAndUnlockAchievements(userId, fullStats);
    const newlyUnlocked = newlyUnlockedIds.map(id => {
      const def = achievementDefinitions.find(a => a.id === id);
      return def ? { id: def.id, title: def.title, description: def.description, icon: def.icon, level: def.level, category: def.category } : { id };
    });

    return createSuccessResponse({ count: newCount, newlyUnlocked });
  } catch (error: any) {
    console.error('Error in PATCH /api/achievements:', error);
    return createErrorResponse(error.message || 'Failed to track interaction');
  }
}
