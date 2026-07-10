// Achievement repository: user achievement unlocks and stats.

import { readData, withTransaction } from './base';
import { achievementDefinitions } from '../data-models';
import { evaluateCondition } from '../achievement-engine';
import { calculateStreakDays } from '../snowball-score-calculator';
import type { UserAchievement } from '../types/entities';

export function getUserAchievements(userId: string): UserAchievement[] {
  const data = readData();
  return data.userAchievements.filter((a) => a.user_id === userId);
}

export function checkAndUnlockAchievements(
  userId: string,
  stats: {
    completed_tasks: number;
    records_count: number;
    streak_days: number;
    procrastination_count: number;
    challenges_completed?: number;
    bronze_completed?: number;
    silver_completed?: number;
    gold_completed?: number;
    snowball_interactions?: number;
    snowball_clicks?: number;
    midnight_record?: boolean;
    record_500_words?: boolean;
  },
): string[] {
  return withTransaction((data) => {
    const newlyUnlocked: string[] = [];

    for (const achievement of achievementDefinitions) {
      if (achievement.id === 'master_all') continue;
      const alreadyUnlocked = data.userAchievements.some(
        (a) => a.user_id === userId && a.achievement_id === achievement.id,
      );
      if (!alreadyUnlocked && evaluateCondition(achievement.id, stats as Record<string, any>)) {
        data.userAchievements.push({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString(),
        });
        newlyUnlocked.push(achievement.id);
      }
    }

    const allOthersUnlocked = achievementDefinitions
      .filter((a) => a.id !== 'master_all')
      .every((a) =>
        data.userAchievements.some(
          (ua) => ua.user_id === userId && ua.achievement_id === a.id,
        ),
      );

    const alreadyMasterUnlocked = data.userAchievements.some(
      (a) => a.user_id === userId && a.achievement_id === 'master_all',
    );
    if (allOthersUnlocked && !alreadyMasterUnlocked) {
      data.userAchievements.push({
        user_id: userId,
        achievement_id: 'master_all',
        unlocked_at: new Date().toISOString(),
      });
      newlyUnlocked.push('master_all');
    }

    return newlyUnlocked;
  });
}

export function getUserStats(userId: string) {
  const data = readData();
  const tasks = data.tasks.filter((t) => t.user_id === userId);
  const records = data.records.filter((r) => r.user_id === userId);
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const procrastinationCount = data.procrastinationSessions.filter((s) => s.user_id === userId).length;

  const userChallenges = data.userChallenges.filter(
    (uc) => uc.user_id === userId && uc.status === 'completed',
  );
  const challengesCompleted = userChallenges.length;
  const bronzeCompleted = userChallenges.filter((uc) => {
    const challenge = data.challenges.find((c) => c.id === uc.challenge_id);
    return challenge && (challenge.challenge_type === 'bronze' || challenge.difficulty === 1);
  }).length;
  const silverCompleted = userChallenges.filter((uc) => {
    const challenge = data.challenges.find((c) => c.id === uc.challenge_id);
    return challenge && (challenge.challenge_type === 'silver' || challenge.difficulty === 2);
  }).length;
  const goldCompleted = userChallenges.filter((uc) => {
    const challenge = data.challenges.find((c) => c.id === uc.challenge_id);
    return challenge && (challenge.challenge_type === 'gold' || challenge.difficulty === 3);
  }).length;

  const streakDays = calculateStreakDays(records as any);

  return {
    completed_tasks: completedTasks,
    records_count: records.length,
    streak_days: streakDays,
    procrastination_count: procrastinationCount,
    challenges_completed: challengesCompleted,
    bronze_completed: bronzeCompleted,
    silver_completed: silverCompleted,
    gold_completed: goldCompleted,
  };
}
