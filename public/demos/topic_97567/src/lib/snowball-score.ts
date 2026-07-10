export type SnowballStage = 'snowflake' | 'small_ball' | 'ball';

export interface SnowballStageConfig {
  stage: SnowballStage;
  minScore: number;
  maxScore: number;
  size: number;
  label: string;
}

export const SCORE_VALUES = {
  RECORD_CREATED: 5,
  TASK_NORMAL_COMPLETED: 5,
  TASK_QUICK_COMPLETED: 2,
  HABIT_CHECKIN: 5,
  SUBTASK_COMPLETED: 5,
  BIG_TASK_COMPLETED: 10,
  CHALLENGE_COMPLETED: 20,
  // MILESTONE_REACHED 的实际分数由挑战定义中的 milestone.reward.score 决定
  // 这里设为 0 作为占位，前端不依赖此值做乐观更新（改用 refreshStats 同步）
  MILESTONE_REACHED: 0,
} as const;

export type ScoreAction = keyof typeof SCORE_VALUES;

export const SNOWBALL_STAGES: SnowballStageConfig[] = [
  { stage: 'snowflake', minScore: 0, maxScore: 49, size: 300, label: '雪粒' },
  { stage: 'small_ball', minScore: 50, maxScore: 199, size: 375, label: '小雪球' },
  { stage: 'ball', minScore: 200, maxScore: Infinity, size: 450, label: '雪球' },
];

export function getSnowballStageByScore(score: number): SnowballStageConfig {
  return SNOWBALL_STAGES.find(s => score >= s.minScore && score <= s.maxScore) || SNOWBALL_STAGES[0];
}

export function getNextStageThresholdByScore(score: number): number | null {
  const current = getSnowballStageByScore(score);
  if (current.stage === 'ball') return null;
  const nextIndex = SNOWBALL_STAGES.findIndex(s => s.stage === current.stage) + 1;
  return SNOWBALL_STAGES[nextIndex]?.minScore ?? null;
}

export function getSnowballStage(scoreOrRecords: number): SnowballStageConfig {
  return getSnowballStageByScore(scoreOrRecords);
}

export function getNextStageThreshold(scoreOrRecords: number): number | null {
  return getNextStageThresholdByScore(scoreOrRecords);
}

export function getScoreProgress(currentScore: number): { current: number; next: number; progress: number } {
  const currentStage = getSnowballStageByScore(currentScore);
  if (currentStage.stage === 'ball') {
    return { current: currentScore, next: currentScore, progress: 100 };
  }
  const min = currentStage.minScore;
  const next = SNOWBALL_STAGES.find(s => s.minScore > currentScore);
  const max = next ? next.minScore : currentStage.maxScore;
  const range = max - min;
  const progress = range > 0 ? Math.min(100, Math.round(((currentScore - min) / range) * 100)) : 100;
  return { current: currentScore, next: max, progress };
}
