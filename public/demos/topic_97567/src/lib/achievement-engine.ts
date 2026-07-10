import { achievementDefinitions, type AchievementCondition } from './data-models';

type Stats = Record<string, number | boolean>;

function numericCondition(field: string, threshold: number): AchievementCondition {
  return {
    evaluate: (stats) => (stats[field] as number) >= threshold,
    progress: (stats) => Math.min(1, (stats[field] as number) / threshold),
    threshold: { field, value: threshold },
  };
}

function booleanCondition(field: string): AchievementCondition {
  return {
    evaluate: (stats) => !!stats[field],
    progress: (stats) => (stats[field] ? 1 : 0),
    threshold: null,
  };
}

function compositeCondition(
  check: (stats: Stats) => boolean,
  fields: string[]
): AchievementCondition {
  return {
    evaluate: (stats) => check(stats),
    progress: (stats) => {
      const met = fields.filter(f => !!stats[f]).length;
      return fields.length > 0 ? met / fields.length : 0;
    },
    threshold: null,
  };
}

export const ACHIEVEMENT_CONDITIONS: Record<string, AchievementCondition> = {
  records_1: numericCondition('records_count', 1),
  records_3: numericCondition('records_count', 3),
  records_7: numericCondition('records_count', 7),
  records_14: numericCondition('records_count', 14),
  records_30: numericCondition('records_count', 30),
  records_66: numericCondition('records_count', 66),
  records_100: numericCondition('records_count', 100),
  records_200: numericCondition('records_count', 200),
  streak_3: numericCondition('streak_days', 3),
  streak_7: numericCondition('streak_days', 7),
  streak_14: numericCondition('streak_days', 14),
  streak_21: numericCondition('streak_days', 21),
  streak_30: numericCondition('streak_days', 30),
  streak_66: numericCondition('streak_days', 66),
  streak_100: numericCondition('streak_days', 100),
  streak_365: numericCondition('streak_days', 365),
  challenge_first: numericCondition('challenges_completed', 1),
  challenge_bronze_5: numericCondition('bronze_completed', 5),
  challenge_silver_1: numericCondition('silver_completed', 1),
  challenge_gold_1: numericCondition('gold_completed', 1),
  challenge_all_types: compositeCondition(
    (s) => (s.bronze_completed as number) > 0 && (s.silver_completed as number) > 0 && (s.gold_completed as number) > 0,
    ['bronze_completed', 'silver_completed', 'gold_completed']
  ),
  challenge_10: numericCondition('challenges_completed', 10),
  task_first: numericCondition('completed_tasks', 1),
  task_5: numericCondition('completed_tasks', 5),
  task_10: numericCondition('completed_tasks', 10),
  interact_first: numericCondition('snowball_interactions', 1),
  interact_10: numericCondition('snowball_interactions', 10),
  interact_50: numericCondition('snowball_interactions', 50),
  interact_100: numericCondition('snowball_interactions', 100),
  hidden_midnight: booleanCondition('midnight_record'),
  hidden_clicker: numericCondition('snowball_clicks', 100),
  hidden_perfect: booleanCondition('record_500_words'),
  first_procrastination: numericCondition('procrastination_count', 1),
};

export function evaluateCondition(achievementId: string, stats: Stats): boolean {
  const condition = ACHIEVEMENT_CONDITIONS[achievementId];
  if (!condition) return false;
  return condition.evaluate(stats);
}

export function calculateProgress(achievementId: string, stats: Stats): number {
  const condition = ACHIEVEMENT_CONDITIONS[achievementId];
  if (!condition) return 0;
  return condition.progress(stats);
}

export function getAchievementsByCategory(): Record<string, typeof achievementDefinitions> {
  const grouped: Record<string, typeof achievementDefinitions> = {};
  for (const ach of achievementDefinitions) {
    if (!grouped[ach.category]) grouped[ach.category] = [];
    grouped[ach.category].push(ach);
  }
  return grouped;
}

const CATEGORY_ORDER: Record<string, string[]> = {
  '记录': ['records_1', 'records_3', 'records_7', 'records_14', 'records_30', 'records_66', 'records_100', 'records_200'],
  '连续': ['streak_3', 'streak_7', 'streak_14', 'streak_21', 'streak_30', 'streak_66', 'streak_100', 'streak_365'],
  '挑战': ['challenge_first', 'challenge_bronze_5', 'challenge_silver_1', 'challenge_gold_1', 'challenge_all_types', 'challenge_10'],
  '任务': ['task_first', 'task_5', 'task_10'],
  '互动': ['interact_first', 'interact_10', 'interact_50', 'interact_100'],
};

export function getAchievementChain(category: string): typeof achievementDefinitions {
  const order = CATEGORY_ORDER[category];
  if (!order) return [];
  return order
    .map(id => achievementDefinitions.find(a => a.id === id))
    .filter(Boolean) as typeof achievementDefinitions;
}
