import { NextRequest } from 'next/server';
import * as db from '@/lib/local-db';
import { achievementDefinitions } from '@/lib/data-models';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

interface RewardDef {
  id: string;
  name: string;
  condition: string;
  conditionCheck: (stats: {
    streak_days: number;
    records_count: number;
    completed_tasks: number;
    all_others_unlocked: boolean;
    all_challenge_types?: boolean;
    challenges_completed?: number;
    goals_completed?: number;
    snowball_interactions?: number;
  }) => boolean;
}

const DECORATION_DEFS: RewardDef[] = [
  { id: 'none', name: '无装饰', condition: '默认', conditionCheck: () => true },
  { id: 'hat', name: '帽子', condition: '连续15天', conditionCheck: (s) => s.streak_days >= 15 },
  { id: 'scarf', name: '围巾', condition: '连续7天', conditionCheck: (s) => s.streak_days >= 7 },
  { id: 'glasses', name: '眼镜', condition: '累计20条记录', conditionCheck: (s) => s.records_count >= 20 },
  { id: 'crown', name: '皇冠', condition: '累计100条记录', conditionCheck: (s) => s.records_count >= 100 },
];

const COLOR_DEFS: RewardDef[] = [
  { id: 'white', name: '白色', condition: '默认', conditionCheck: () => true },
  { id: 'pink', name: '粉色', condition: '累计10条记录', conditionCheck: (s) => s.records_count >= 10 },
  { id: 'blue', name: '蓝色', condition: '累计25条记录', conditionCheck: (s) => s.records_count >= 25 },
  { id: 'gold', name: '金色', condition: '累计50条记录', conditionCheck: (s) => s.records_count >= 50 },
  { id: 'rainbow', name: '彩虹', condition: '累计100条记录', conditionCheck: (s) => s.records_count >= 100 },
];

const THEME_DEFS: RewardDef[] = [
  { id: 'clear_sky', name: '晴空', condition: '默认', conditionCheck: () => true },
  { id: 'starry', name: '星空', condition: '连续7天', conditionCheck: (s) => s.streak_days >= 7 },
  { id: 'flower', name: '花海', condition: '连续15天', conditionCheck: (s) => s.streak_days >= 15 },
  { id: 'aurora', name: '极光', condition: '连续30天', conditionCheck: (s) => s.streak_days >= 30 },
];

const TITLE_DEFS: RewardDef[] = [
  { id: '初心者', name: '初心者', condition: '默认', conditionCheck: () => true },
  { id: '行动派', name: '行动派', condition: '完成第1个任务', conditionCheck: (s) => s.completed_tasks >= 1 },
  { id: '坚持者', name: '坚持者', condition: '连续7天', conditionCheck: (s) => s.streak_days >= 7 },
  { id: '月度记录者', name: '月度记录者', condition: '累计30条记录', conditionCheck: (s) => s.records_count >= 30 },
  { id: '百条达人', name: '百条达人', condition: '累计100条记录', conditionCheck: (s) => s.records_count >= 100 },
  { id: '记录大师', name: '记录大师', condition: '累计200条记录', conditionCheck: (s) => s.records_count >= 200 },
  { id: '月度勇士', name: '月度勇士', condition: '连续30天', conditionCheck: (s) => s.streak_days >= 30 },
  { id: '百日达人', name: '百日达人', condition: '连续100天', conditionCheck: (s) => s.streak_days >= 100 },
  { id: '坚持大师', name: '坚持大师', condition: '连续365天', conditionCheck: (s) => s.streak_days >= 365 },
  { id: '全能挑战者', name: '全能挑战者', condition: '完成所有难度挑战', conditionCheck: (s) => !!s.all_challenge_types },
  { id: '挑战达人', name: '挑战达人', condition: '完成10个挑战', conditionCheck: (s) => (s.challenges_completed || 0) >= 10 },
  { id: '任务达人', name: '任务达人', condition: '完成10个任务', conditionCheck: (s) => s.completed_tasks >= 10 },
  { id: '圆梦者', name: '圆梦者', condition: '完成第1个目标', conditionCheck: (s) => (s.goals_completed || 0) >= 1 },
  { id: '雪球知己', name: '雪球知己', condition: '与雪球互动50次', conditionCheck: (s) => (s.snowball_interactions || 0) >= 50 },
  { id: '最佳拍档', name: '最佳拍档', condition: '与雪球互动100次', conditionCheck: (s) => (s.snowball_interactions || 0) >= 100 },
  { id: '雪球大师', name: '雪球大师', condition: '解锁所有其他成就', conditionCheck: (s) => s.all_others_unlocked },
];

function computeRewards(stats: Parameters<RewardDef['conditionCheck']>[0]) {
  const computeCategory = (defs: RewardDef[]) => {
    const unlocked: string[] = [];
    const available = defs.map(d => ({
      id: d.id,
      name: d.name,
      condition: d.condition,
      unlocked: d.conditionCheck(stats),
    }));
    for (const d of defs) {
      if (d.conditionCheck(stats)) {
        unlocked.push(d.id);
      }
    }
    return { unlocked, available };
  };

  return {
    decorations: computeCategory(DECORATION_DEFS),
    colors: computeCategory(COLOR_DEFS),
    themes: computeCategory(THEME_DEFS),
    titles: computeCategory(TITLE_DEFS),
  };
}

function buildRewardStats(userId: string) {
  const userStats = db.getUserStats(userId);
  const interactions = db.getUserInteractions(userId);
  const userAchievements = db.getUserAchievements(userId);
  const unlockedAchIds = new Set(userAchievements.map(a => a.achievement_id));
  const nonMasterAchs = achievementDefinitions.filter(a => a.id !== 'master_all');
  const allOthersUnlocked = nonMasterAchs.length > 0 && nonMasterAchs.every(a => unlockedAchIds.has(a.id));

  const userChallenges = db.getUserChallenges(userId);
  const completedUserChallenges = userChallenges.filter((uc: any) => uc.status === 'completed');
  const challenges = db.getChallenges();
  // 修复 R2-F3: difficulty 是数字(1/2/3)，challenge_type 才是字符串('bronze'/'silver'/'gold')
  const bronzeCompleted = completedUserChallenges.filter((uc: any) => {
    const ch = challenges.find((c: any) => c.id === uc.challenge_id);
    return ch && (ch.challenge_type === 'bronze' || ch.difficulty === 1);
  }).length;
  const silverCompleted = completedUserChallenges.filter((uc: any) => {
    const ch = challenges.find((c: any) => c.id === uc.challenge_id);
    return ch && (ch.challenge_type === 'silver' || ch.difficulty === 2);
  }).length;
  const goldCompleted = completedUserChallenges.filter((uc: any) => {
    const ch = challenges.find((c: any) => c.id === uc.challenge_id);
    return ch && (ch.challenge_type === 'gold' || ch.difficulty === 3);
  }).length;

  return {
    streak_days: userStats.streak_days,
    records_count: userStats.records_count,
    completed_tasks: userStats.completed_tasks,
    all_others_unlocked: allOthersUnlocked,
    all_challenge_types: bronzeCompleted > 0 && silverCompleted > 0 && goldCompleted > 0,
    challenges_completed: completedUserChallenges.length,
    snowball_interactions: interactions.snowball_interactions,
  };
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const stats = buildRewardStats(userId);
    const rewards = computeRewards(stats);

    const settings = db.getUserSettings(userId);
    const currentSettings = {
      decoration: settings?.snowball_decoration || 'none',
      color: settings?.snowball_color || 'white',
      theme: settings?.background_theme || 'clear_sky',
      title: settings?.title || '初心者',
    };

    return createSuccessResponse({
      unlocked: {
        decorations: rewards.decorations.unlocked,
        colors: rewards.colors.unlocked,
        themes: rewards.themes.unlocked,
        titles: rewards.titles.unlocked,
      },
      available: {
        decorations: rewards.decorations.available,
        colors: rewards.colors.available,
        themes: rewards.themes.available,
        titles: rewards.titles.available,
      },
      currentSettings,
    });
  } catch (error: any) {
    console.error('Error in GET /api/rewards:', error);
    return createErrorResponse(error.message || 'Failed to get rewards');
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
    const { type, value } = body;

    const validTypes = ['decoration', 'color', 'theme', 'title'];
    if (!validTypes.includes(type)) {
      return createErrorResponse('Invalid reward type. Must be one of: decoration, color, theme, title', 400);
    }
    if (!value || typeof value !== 'string') {
      return createErrorResponse('Value is required and must be a string', 400);
    }

    const valueMap: Record<string, string[]> = {
      decoration: DECORATION_DEFS.map(d => d.id),
      color: COLOR_DEFS.map(d => d.id),
      theme: THEME_DEFS.map(d => d.id),
      title: TITLE_DEFS.map(d => d.id),
    };
    if (!valueMap[type].includes(value)) {
      return createErrorResponse(`Invalid value "${value}" for type "${type}"`, 400);
    }

    const stats = buildRewardStats(userId);
    const rewards = computeRewards(stats);

    const targetCategory = rewards[type as keyof typeof rewards];
    const targetItem = targetCategory.available.find((item: { id: string; unlocked: boolean }) => item.id === value);
    if (!targetItem || !targetItem.unlocked) {
      return createErrorResponse('Reward not yet unlocked', 403);
    }

    const fieldMap: Record<string, string> = {
      decoration: 'snowball_decoration',
      color: 'snowball_color',
      theme: 'background_theme',
      title: 'title',
    };

    db.upsertUserSettings(userId, {
      [fieldMap[type]]: value,
    });

    return createSuccessResponse({});
  } catch (error: any) {
    console.error('Error in PUT /api/rewards:', error);
    return createErrorResponse(error.message || 'Failed to equip reward');
  }
}
