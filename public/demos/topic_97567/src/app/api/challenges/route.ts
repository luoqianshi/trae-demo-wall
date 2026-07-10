import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';
import { completeChallengeWithScore } from '@/lib/repositories/challenge-repository';

interface Challenge {
  id: string;
  challenge_type: 'bronze' | 'silver' | 'gold';
  difficulty: 1 | 2 | 3;
  title: string;
  description: string;
  duration_days: number;
  category: string;
  completion_criteria: {
    record_required?: boolean;
    required_tags?: string[];
    required_questions?: string[];
    action_required?: boolean;
    action_description?: string;
    milestones?: Array<{ day: number; reward: { score: number; title: string } }>;
  };
  reward: { score: number; badge_fragments?: number; badge_id?: string; special_reward?: string };
  is_active: boolean;
  is_recurring: boolean;
  display_order: number;
  created_at: string;
}

interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  progress: number;
  current_day: number;
  streak_days: number;
  make_up_count: number;
  max_make_ups: number;
  started_at: string;
  completed_at: string | null;
  last_progress_at: string | null;
  daily_records: Array<{ date: string; completed: boolean; record_id?: string; completed_at?: string }>;
  challenge?: Challenge;
}

const CHALLENGE_SEEDS = [
  {
    challenge_type: 'bronze' as const,
    difficulty: 1,
    title: '微笑时刻',
    description: '记录一件让你微笑的事，留意生活中的小确幸',
    duration_days: 1,
    category: 'emotion',
    completion_criteria: {
      record_required: true,
      required_tags: ['开心', '欣慰', '感动', '温暖'],
      required_questions: ['这件事为什么让你微笑？'],
    },
    reward: { score: 5, badge_fragments: 1 },
    is_active: true,
    is_recurring: true,
    display_order: 1,
  },
  {
    challenge_type: 'bronze' as const,
    difficulty: 1,
    title: '感恩练习',
    description: '记录一个你想感谢的人，感受善意的温暖',
    duration_days: 1,
    category: 'social',
    completion_criteria: {
      record_required: true,
      required_questions: ['他/她做了什么？', '你的真实感受是什么？'],
    },
    reward: { score: 5, badge_fragments: 1 },
    is_active: true,
    is_recurring: true,
    display_order: 2,
  },
  {
    challenge_type: 'bronze' as const,
    difficulty: 1,
    title: '新知收获',
    description: '记录今天学到的新东西，积累起来就是巨大进步',
    duration_days: 1,
    category: 'growth',
    completion_criteria: {
      record_required: true,
      required_questions: ['你从哪里学到的？', '可以怎么应用？'],
    },
    reward: { score: 5, badge_fragments: 1 },
    is_active: true,
    is_recurring: true,
    display_order: 3,
  },
  {
    challenge_type: 'bronze' as const,
    difficulty: 1,
    title: '善意发现',
    description: '记录今天你帮助他人或他人帮助你的瞬间',
    duration_days: 1,
    category: 'social',
    completion_criteria: {
      record_required: true,
      required_tags: ['善意', '帮助', '温暖'],
      required_questions: ['这件事让你有什么感受？'],
    },
    reward: { score: 5, badge_fragments: 1 },
    is_active: true,
    is_recurring: true,
    display_order: 4,
  },
  {
    challenge_type: 'bronze' as const,
    difficulty: 1,
    title: '自我肯定',
    description: '记录今天你做得好的一件事，给自己一些认可',
    duration_days: 1,
    category: 'emotion',
    completion_criteria: {
      record_required: true,
      required_questions: ['你为什么觉得自己做得好？'],
    },
    reward: { score: 5, badge_fragments: 1 },
    is_active: true,
    is_recurring: true,
    display_order: 5,
  },
  {
    challenge_type: 'bronze' as const,
    difficulty: 1,
    title: '自然连接',
    description: '记录今天与自然接触的瞬间，哪怕只是感受一阵风',
    duration_days: 1,
    category: 'health',
    completion_criteria: {
      record_required: true,
      required_questions: ['这个瞬间给你带来了什么？'],
    },
    reward: { score: 5, badge_fragments: 1 },
    is_active: true,
    is_recurring: true,
    display_order: 6,
  },
  {
    challenge_type: 'silver' as const,
    difficulty: 2,
    title: '7天正向日记',
    description: '连续7天，每天记录一件积极的事，养成正向思维习惯',
    duration_days: 7,
    category: 'emotion',
    completion_criteria: {
      record_required: true,
      required_questions: ['这件事的积极影响是什么？'],
      milestones: [
        { day: 3, reward: { score: 5, title: '起步者' } },
        { day: 7, reward: { score: 10, title: '坚持者' } },
      ],
    },
    reward: { score: 20, badge_id: 'silver_persistence' },
    is_active: true,
    is_recurring: false,
    display_order: 10,
  },
  {
    challenge_type: 'silver' as const,
    difficulty: 2,
    title: '健康追踪',
    description: '7天内完成5次运动相关记录，让身体和心灵一起成长',
    duration_days: 7,
    category: 'health',
    completion_criteria: {
      record_required: true,
      required_tags: ['运动', '健身', '跑步', '瑜伽', '锻炼'],
      milestones: [
        { day: 3, reward: { score: 5, title: '动起来' } },
        { day: 7, reward: { score: 8, title: '活力派' } },
      ],
    },
    reward: { score: 15, badge_id: 'silver_vitality' },
    is_active: true,
    is_recurring: false,
    display_order: 11,
  },
  {
    challenge_type: 'silver' as const,
    difficulty: 2,
    title: '社交连接',
    description: '7天内完成3次帮助他人的行动并记录感受',
    duration_days: 7,
    category: 'social',
    completion_criteria: {
      record_required: true,
      required_questions: ['你做了什么？', '对方的反应是什么？', '这对你有什么改变？'],
      milestones: [
        { day: 3, reward: { score: 5, title: '温暖萌芽' } },
        { day: 7, reward: { score: 10, title: '连接达人' } },
      ],
    },
    reward: { score: 25, badge_id: 'silver_warmth' },
    is_active: true,
    is_recurring: false,
    display_order: 12,
  },
  {
    challenge_type: 'gold' as const,
    difficulty: 3,
    title: '早起勇士',
    description: '连续21天在7:00前起床并记录，养成早起习惯',
    duration_days: 21,
    category: 'health',
    completion_criteria: {
      record_required: true,
      action_required: true,
      action_description: '每天7:00前起床',
      required_questions: ['今天几点起床的？', '晨间计划是什么？', '起床时的状态如何？'],
      milestones: [
        { day: 3, reward: { score: 10, title: '早起新手' } },
        { day: 7, reward: { score: 20, title: '一周达人' } },
        { day: 14, reward: { score: 30, title: '半月战士' } },
      ],
    },
    reward: { score: 50, badge_id: 'gold_early_riser', special_reward: 'exclusive_avatar_frame' },
    is_active: true,
    is_recurring: false,
    display_order: 20,
  },
  {
    challenge_type: 'gold' as const,
    difficulty: 3,
    title: '感恩日记',
    description: '连续30天每天记录3件值得感恩的事，培养感恩心态',
    duration_days: 30,
    category: 'emotion',
    completion_criteria: {
      record_required: true,
      required_questions: ['第一件感恩的事', '第二件感恩的事', '第三件感恩的事', '为什么感恩？'],
      milestones: [
        { day: 7, reward: { score: 15, title: '感恩萌芽' } },
        { day: 14, reward: { score: 25, title: '感恩生长' } },
        { day: 21, reward: { score: 35, title: '感恩绽放' } },
      ],
    },
    reward: { score: 60, badge_id: 'gold_gratitude_master', special_reward: 'gratitude_mode_unlock' },
    is_active: true,
    is_recurring: false,
    display_order: 21,
  },
  {
    challenge_type: 'gold' as const,
    difficulty: 3,
    title: '突破舒适圈',
    description: '21天内完成7个"第一次"，勇敢突破自我',
    duration_days: 21,
    category: 'growth',
    completion_criteria: {
      record_required: true,
      action_required: true,
      action_description: '完成一个你从未做过的事',
      required_questions: ['你做了什么"第一次"？', '行动前的感受是什么？', '行动后的发现是什么？'],
      milestones: [
        { day: 3, reward: { score: 8, title: '勇敢迈步' } },
        { day: 7, reward: { score: 15, title: '破冰者' } },
        { day: 14, reward: { score: 25, title: '蜕变中' } },
      ],
    },
    reward: { score: 100, badge_id: 'gold_breakthrough', special_reward: 'courage_diary_template' },
    is_active: true,
    is_recurring: false,
    display_order: 22,
  },
];

function getDailyBronzeChallenge(challenges: Challenge[]): Challenge[] {
  const bronzeChallenges = challenges.filter(c => c.challenge_type === 'bronze');
  if (bronzeChallenges.length === 0) return [];
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const selectedIndex = dayOfYear % bronzeChallenges.length;
  return [bronzeChallenges[selectedIndex]];
}

function ensureChallengesSeeded(): Challenge[] {
  let challenges = db.getChallenges() as Challenge[];
  if (challenges.length === 0) {
    challenges = CHALLENGE_SEEDS.map((seed, index) => ({
      ...seed,
      difficulty: seed.difficulty as 1 | 2 | 3,
      id: `challenge_${index + 1}`,
      created_at: new Date().toISOString(),
    }));
    db.setChallenges(challenges);
  }
  return challenges;
}

function getTodayDateString(): string {
  // 修复 R5-4.3: 使用本地日期而非 UTC，避免非 UTC 时区凌晨可一天打卡两次
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function checkMilestones(
  challenge: Challenge,
  currentDay: number,
): { milestone: { day: number; reward: { score: number; title: string } } } | null {
  const milestones = challenge.completion_criteria?.milestones;
  if (!milestones || milestones.length === 0) return null;
  const matched = milestones.find(m => m.day === currentDay);
  return matched ? { milestone: matched } : null;
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;
  const difficultyFilter = request.nextUrl.searchParams.get('difficulty');
  const categoryFilter = request.nextUrl.searchParams.get('category');
  const statusFilter = request.nextUrl.searchParams.get('status');

  try {
    const allChallenges = ensureChallengesSeeded();

    let filteredChallenges = [...allChallenges].map(c => ({ ...c, type: c.challenge_type }));

    const bronzeChallenges = filteredChallenges.filter(c => c.type === 'bronze');
    const nonBronzeChallenges = filteredChallenges.filter(c => c.type !== 'bronze');
    const dailyBronze = getDailyBronzeChallenge(allChallenges).map(c => ({ ...c, type: c.challenge_type }));
    filteredChallenges = [...dailyBronze, ...nonBronzeChallenges];

    if (difficultyFilter) {
      filteredChallenges = filteredChallenges.filter(c => c.difficulty === parseInt(difficultyFilter));
    }
    if (categoryFilter) {
      filteredChallenges = filteredChallenges.filter(c => c.category === categoryFilter);
    }

    let userChallenges = db.getUserChallenges(userId).map(uc => ({
      ...uc,
      challenge: allChallenges.find(c => c.id === uc.challenge_id)
        ? { ...allChallenges.find(c => c.id === uc.challenge_id), type: allChallenges.find(c => c.id === uc.challenge_id)!.challenge_type }
        : undefined,
    }));

    if (statusFilter) {
      userChallenges = userChallenges.filter(uc => uc.status === statusFilter);
    } else {
      userChallenges = userChallenges.filter(uc => uc.status === 'active' || uc.status === 'completed');
    }

    return createSuccessResponse({
      challenges: filteredChallenges,
      user_challenges: userChallenges,
    });
  } catch (error: any) {
    console.error('Error in GET /api/challenges:', error);
    return createErrorResponse(error.message || 'Failed to get challenges');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const { challenge_id } = await request.json();

    if (!challenge_id) {
      return createErrorResponse('challenge_id is required', 400);
    }

    const allChallenges = ensureChallengesSeeded();
    const challenge = allChallenges.find(c => c.id === challenge_id);
    if (!challenge) {
      return createErrorResponse('Challenge not found', 404);
    }

    const existingUserChallenges = db.getUserChallenges(userId);
    const existingUC = existingUserChallenges.find(
      (uc: any) => uc.challenge_id === challenge_id && uc.status === 'active'
    );
    if (existingUC) {
      return createErrorResponse('Already joined this challenge', 409);
    }

    const newUserChallenge = db.createUserChallenge({
      user_id: userId,
      challenge_id,
      status: 'active',
      progress: 0,
      current_day: 1,
      streak_days: 0,
      make_up_count: 0,
      max_make_ups: 2,
      started_at: new Date().toISOString(),
      completed_at: null,
      last_progress_at: null,
      daily_records: [],
    });

    return createSuccessResponse({
      user_challenge: {
        ...newUserChallenge,
        challenge: { ...challenge, type: challenge.challenge_type },
      },
    }, 201);
  } catch (error: any) {
    console.error('Error in POST /api/challenges:', error);
    return createErrorResponse(error.message || 'Failed to join challenge');
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const { user_challenge_id, action, record_id, tags, questions_answered, action_confirmed } = await request.json();

    if (!user_challenge_id) {
      return createErrorResponse('user_challenge_id is required', 400);
    }

    if (!action || !['progress', 'complete', 'abandon', 'make_up'].includes(action)) {
      return createErrorResponse('action must be "progress", "complete", "abandon", or "make_up"', 400);
    }

    const userChallenges = db.getUserChallenges(userId);
    const userChallenge = userChallenges.find((uc: any) => uc.id === user_challenge_id);

    if (!userChallenge) {
      return createErrorResponse('User challenge not found', 404);
    }

    if (userChallenge.status !== 'active') {
      return createErrorResponse('Challenge is not active', 400);
    }

    const allChallenges = ensureChallengesSeeded();
    const challenge = allChallenges.find(c => c.id === userChallenge.challenge_id);
    const challengeWithtype = challenge ? { ...challenge, type: challenge.challenge_type } : undefined;
    const now = new Date().toISOString();
    const today = getTodayDateString();

    if (action === 'abandon') {
      const updatedUC = db.updateUserChallenge(user_challenge_id, {
        status: 'abandoned',
      });
      return createSuccessResponse({
        user_challenge: {
          ...updatedUC,
          challenge: challengeWithtype,
        },
      });
    }

    if (action === 'make_up') {
      if (userChallenge.make_up_count >= userChallenge.max_make_ups) {
        return createErrorResponse('Make-up limit reached', 400);
      }

      const dailyRecords = userChallenge.daily_records || [];
      // 修复 R5-4.3: make_up 分支也用本地日期，与 getTodayDateString 一致
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      const yesterdayRecord = dailyRecords.find((r: any) => r.date === yesterdayStr);
      if (yesterdayRecord && yesterdayRecord.completed) {
        return createErrorResponse('Yesterday already completed', 400);
      }

      const updatedRecords = yesterdayRecord
        ? dailyRecords.map((r: any) =>
            r.date === yesterdayStr
              ? { ...r, completed: true, completed_at: now }
              : r
          )
        : [...dailyRecords, { date: yesterdayStr, completed: true, completed_at: now }];

      const newMakeUpCount = userChallenge.make_up_count + 1;
      const newProgress = Math.min(userChallenge.progress + 1, challenge?.duration_days || 1);
      const newStreakDays = userChallenge.streak_days + 1;

      const updatedUC = db.updateUserChallenge(user_challenge_id, {
        daily_records: updatedRecords,
        make_up_count: newMakeUpCount,
        progress: newProgress,
        streak_days: newStreakDays,
        last_progress_at: now,
      });

      return createSuccessResponse({
        user_challenge: {
          ...updatedUC,
          challenge: challengeWithtype,
        },
      });
    }

    if (action === 'progress') {
      const criteria = challenge?.completion_criteria || {};

      if (criteria.required_tags && criteria.required_tags.length > 0) {
        const providedTags: string[] = tags || [];
        const hasMatch = criteria.required_tags.some((tag: string) => providedTags.includes(tag));
        if (!hasMatch) {
          return createErrorResponse(`Record must include at least one of these tags: ${criteria.required_tags.join(', ')}`, 400);
        }
      }

      if (criteria.required_questions && criteria.required_questions.length > 0) {
        const answered: string[] = questions_answered || [];
        const allAnswered = criteria.required_questions.every((_: string, i: number) => answered[i]);
        if (!allAnswered) {
          return createErrorResponse('All required questions must be answered', 400);
        }
      }

      if (criteria.action_required && !action_confirmed) {
        return createErrorResponse(`Action required: ${criteria.action_description || 'complete the required action'}`, 400);
      }

      const dailyRecords = userChallenge.daily_records || [];
      const todayRecord = dailyRecords.find((r: any) => r.date === today);
      if (todayRecord && todayRecord.completed) {
        return createErrorResponse('Already completed today', 400);
      }

      const updatedRecords = todayRecord
        ? dailyRecords.map((r: any) =>
            r.date === today
              ? { ...r, completed: true, record_id: record_id || undefined, completed_at: now }
              : r
          )
        : [...dailyRecords, { date: today, completed: true, record_id: record_id || undefined, completed_at: now }];

      const newProgress = Math.min(userChallenge.progress + 1, challenge?.duration_days || 1);
      const newCurrentDay = userChallenge.current_day + 1;
      const newStreakDays = userChallenge.streak_days + 1;

      let milestoneReward = null;
      const milestoneResult = challenge ? checkMilestones(challenge, newCurrentDay - 1) : null;
      if (milestoneResult) {
        milestoneReward = milestoneResult.milestone.reward;
      }

      if (newProgress >= (challenge?.duration_days || 1)) {
        const finalReward = challenge?.reward || {} as Challenge['reward'];

        // 原子化改造：挑战完成 + 积分发放 在同一事务中完成（单次文件写入）
        // 替代原 R2-F1 的 updateUserChallenge + addScoreEvent 两步操作
        // 严格原子语义：挑战更新与积分发放要么全部成功，要么全部回滚
        const completionUpdates = {
          status: 'completed' as const,
          progress: newProgress,
          current_day: newCurrentDay,
          streak_days: newStreakDays,
          daily_records: updatedRecords,
          completed_at: now,
          last_progress_at: now,
        };

        const updatedUC = finalReward.score
          ? completeChallengeWithScore(
              user_challenge_id,
              userId,
              completionUpdates,
              'CHALLENGE_COMPLETED',
              user_challenge_id,
              finalReward.score, // 使用挑战定义中的 reward.score，保证前端显示与后端加分一致
            ).userChallenge
          : db.updateUserChallenge(user_challenge_id, completionUpdates);

        // milestone 奖励加分（与挑战完成奖励独立，可同时获得）
        if (milestoneReward && milestoneReward.score) {
          db.addScoreEvent({
            user_id: userId,
            action: 'MILESTONE_REACHED',
            score: milestoneReward.score,
            ref_id: user_challenge_id,
            created_at: now,
          });
        }

        return createSuccessResponse({
          user_challenge: {
            ...updatedUC,
            challenge: challengeWithtype,
          },
          reward: finalReward,
          milestone_reward: milestoneReward,
          completed: true,
        });
      }

      const updatedUC = db.updateUserChallenge(user_challenge_id, {
        progress: newProgress,
        current_day: newCurrentDay,
        streak_days: newStreakDays,
        daily_records: updatedRecords,
        last_progress_at: now,
      });

      // milestone 奖励加分（非完成场景下的 milestone 达成，与挑战完成分支逻辑一致）
      if (milestoneReward && milestoneReward.score) {
        db.addScoreEvent({
          user_id: userId,
          action: 'MILESTONE_REACHED',
          score: milestoneReward.score,
          ref_id: user_challenge_id,
          created_at: now,
        });
      }

      return createSuccessResponse({
        user_challenge: {
          ...updatedUC,
          challenge: challengeWithtype,
        },
        milestone_reward: milestoneReward,
      });
    }

    if (action === 'complete') {
      // 修复 R2-F2: 移除绕过完成条件的 'complete' action，必须通过 'progress' 满足条件后完成
      return createErrorResponse('Direct completion is not allowed. Use progress action to meet completion criteria.', 400);
    }

    return createErrorResponse('Invalid action', 400);
  } catch (error: any) {
    console.error('Error in PUT /api/challenges:', error);
    return createErrorResponse(error.message || 'Failed to update challenge');
  }
}
