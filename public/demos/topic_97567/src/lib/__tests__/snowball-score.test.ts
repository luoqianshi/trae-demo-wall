import { describe, it, expect } from 'vitest';
import {
  SCORE_VALUES,
  SNOWBALL_STAGES,
  getSnowballStageByScore,
  getSnowballStage,
  getNextStageThresholdByScore,
  getNextStageThreshold,
  getScoreProgress,
  type SnowballStage,
  type ScoreAction,
} from '@/lib/snowball-score';

describe('SCORE_VALUES', () => {
  it('should have all required score actions', () => {
    expect(SCORE_VALUES).toHaveProperty('RECORD_CREATED');
    expect(SCORE_VALUES).toHaveProperty('TASK_NORMAL_COMPLETED');
    expect(SCORE_VALUES).toHaveProperty('TASK_QUICK_COMPLETED');
    expect(SCORE_VALUES).toHaveProperty('HABIT_CHECKIN');
    expect(SCORE_VALUES).toHaveProperty('SUBTASK_COMPLETED');
    expect(SCORE_VALUES).toHaveProperty('BIG_TASK_COMPLETED');
  });

  it('should have positive score values', () => {
    // MILESTONE_REACHED 的实际分数由挑战定义中的 milestone.reward.score 决定
    // 在 SCORE_VALUES 中设为 0 作为占位，前端不依赖此值做乐观更新
    Object.entries(SCORE_VALUES).forEach(([key, score]) => {
      if (key === 'MILESTONE_REACHED') {
        expect(score).toBe(0); // 占位值，实际分数来自挑战定义
      } else {
        expect(score).toBeGreaterThan(0);
      }
    });
  });

  it('should have reasonable score values', () => {
    expect(SCORE_VALUES.RECORD_CREATED).toBe(5);
    expect(SCORE_VALUES.TASK_NORMAL_COMPLETED).toBe(5);
    expect(SCORE_VALUES.TASK_QUICK_COMPLETED).toBe(2);
    expect(SCORE_VALUES.HABIT_CHECKIN).toBe(5);
    expect(SCORE_VALUES.SUBTASK_COMPLETED).toBe(5);
    expect(SCORE_VALUES.BIG_TASK_COMPLETED).toBe(10);
  });

  it('should have BIG_TASK_COMPLETED higher than TASK_NORMAL_COMPLETED', () => {
    expect(SCORE_VALUES.BIG_TASK_COMPLETED).toBeGreaterThan(SCORE_VALUES.TASK_NORMAL_COMPLETED);
  });
});

describe('SNOWBALL_STAGES', () => {
  it('should have 3 stages', () => {
    expect(SNOWBALL_STAGES).toHaveLength(3);
  });

  it('should have correct stage order', () => {
    expect(SNOWBALL_STAGES[0].stage).toBe('snowflake');
    expect(SNOWBALL_STAGES[1].stage).toBe('small_ball');
    expect(SNOWBALL_STAGES[2].stage).toBe('ball');
  });

  it('should have correct threshold ranges', () => {
    expect(SNOWBALL_STAGES[0].minScore).toBe(0);
    expect(SNOWBALL_STAGES[0].maxScore).toBe(49);

    expect(SNOWBALL_STAGES[1].minScore).toBe(50);
    expect(SNOWBALL_STAGES[1].maxScore).toBe(199);

    expect(SNOWBALL_STAGES[2].minScore).toBe(200);
    expect(SNOWBALL_STAGES[2].maxScore).toBe(Infinity);
  });

  it('should have continuous thresholds', () => {
    for (let i = 1; i < SNOWBALL_STAGES.length; i++) {
      expect(SNOWBALL_STAGES[i].minScore).toBe(SNOWBALL_STAGES[i - 1].maxScore + 1);
    }
  });

  it('should have correct labels', () => {
    expect(SNOWBALL_STAGES[0].label).toBe('雪粒');
    expect(SNOWBALL_STAGES[1].label).toBe('小雪球');
    expect(SNOWBALL_STAGES[2].label).toBe('雪球');
  });

  it('should have increasing sizes', () => {
    for (let i = 1; i < SNOWBALL_STAGES.length; i++) {
      expect(SNOWBALL_STAGES[i].size).toBeGreaterThan(SNOWBALL_STAGES[i - 1].size);
    }
  });
});

describe('getSnowballStageByScore', () => {
  it('should return snowflake for score 0', () => {
    const stage = getSnowballStageByScore(0);
    expect(stage.stage).toBe('snowflake');
  });

  it('should return snowflake for score 49', () => {
    const stage = getSnowballStageByScore(49);
    expect(stage.stage).toBe('snowflake');
  });

  it('should return small_ball for score 50', () => {
    const stage = getSnowballStageByScore(50);
    expect(stage.stage).toBe('small_ball');
  });

  it('should return small_ball for score 199', () => {
    const stage = getSnowballStageByScore(199);
    expect(stage.stage).toBe('small_ball');
  });

  it('should return ball for score 200', () => {
    const stage = getSnowballStageByScore(200);
    expect(stage.stage).toBe('ball');
  });

  it('should return ball for score 499', () => {
    const stage = getSnowballStageByScore(499);
    expect(stage.stage).toBe('ball');
  });

  it('should return ball for score 500', () => {
    const stage = getSnowballStageByScore(500);
    expect(stage.stage).toBe('ball');
  });

  it('should return ball for very large scores', () => {
    const stage = getSnowballStageByScore(1000000);
    expect(stage.stage).toBe('ball');
  });

  it('should return snowflake for negative scores', () => {
    const stage = getSnowballStageByScore(-10);
    expect(stage.stage).toBe('snowflake');
  });

  it('should include all stage properties in result', () => {
    const stage = getSnowballStageByScore(100);
    expect(stage).toHaveProperty('stage');
    expect(stage).toHaveProperty('minScore');
    expect(stage).toHaveProperty('maxScore');
    expect(stage).toHaveProperty('size');
    expect(stage).toHaveProperty('label');
  });
});

describe('getSnowballStage (compat alias)', () => {
  it('should behave identically to getSnowballStageByScore', () => {
    const scores = [0, 49, 50, 199, 200, 499, 500, 999, 1000];
    scores.forEach(score => {
      expect(getSnowballStage(score)).toEqual(getSnowballStageByScore(score));
    });
  });
});

describe('getNextStageThresholdByScore', () => {
  it('should return null for ball stage', () => {
    expect(getNextStageThresholdByScore(200)).toBeNull();
    expect(getNextStageThresholdByScore(10000)).toBeNull();
  });

  it('should return next stage minScore for snowflake', () => {
    expect(getNextStageThresholdByScore(0)).toBe(50);
    expect(getNextStageThresholdByScore(49)).toBe(50);
  });

  it('should return next stage minScore for small_ball', () => {
    expect(getNextStageThresholdByScore(50)).toBe(200);
    expect(getNextStageThresholdByScore(199)).toBe(200);
  });

  it('should return null for ball (final stage)', () => {
    expect(getNextStageThresholdByScore(200)).toBeNull();
    expect(getNextStageThresholdByScore(499)).toBeNull();
  });
});

describe('getNextStageThreshold (compat alias)', () => {
  it('should behave identically to getNextStageThresholdByScore', () => {
    const scores = [0, 50, 200, 500, 1000];
    scores.forEach(score => {
      expect(getNextStageThreshold(score)).toEqual(getNextStageThresholdByScore(score));
    });
  });
});

describe('getScoreProgress', () => {
  it('should return 100% progress for ball', () => {
    const progress = getScoreProgress(200);
    expect(progress.progress).toBe(100);
    expect(progress.current).toBe(200);
    expect(progress.next).toBe(200);
  });

  it('should return 0% progress at stage start', () => {
    expect(getScoreProgress(0).progress).toBe(0);
    expect(getScoreProgress(50).progress).toBe(0);
  });

  it('should return 100% progress for final stage', () => {
    expect(getScoreProgress(200).progress).toBe(100);
  });

  it('should return near 100% progress at stage end', () => {
    expect(getScoreProgress(49).progress).toBe(98);
    expect(getScoreProgress(199).progress).toBe(99);
  });

  it('should return correct progress for mid-stage scores', () => {
    const progress = getScoreProgress(25);
    expect(progress.progress).toBe(50);
  });

  it('should cap progress at 100%', () => {
    const progress = getScoreProgress(100);
    expect(progress.progress).toBeLessThanOrEqual(100);
  });

  it('should include current, next, and progress in result', () => {
    const progress = getScoreProgress(100);
    expect(progress).toHaveProperty('current');
    expect(progress).toHaveProperty('next');
    expect(progress).toHaveProperty('progress');
  });

  it('should have progress as a valid percentage', () => {
    const scores = [0, 10, 25, 49, 50, 100, 150, 199, 200, 300];
    scores.forEach(score => {
      const progress = getScoreProgress(score);
      expect(progress.progress).toBeGreaterThanOrEqual(0);
      expect(progress.progress).toBeLessThanOrEqual(100);
    });
  });
});

describe('Score calculation integration', () => {
  it('should calculate correct total score for typical user journey', () => {
    const records = 10;
    const normalTasks = 5;
    const quickTasks = 3;
    const habits = 2;
    const subtasks = 4;

    const total =
      records * SCORE_VALUES.RECORD_CREATED +
      normalTasks * SCORE_VALUES.TASK_NORMAL_COMPLETED +
      quickTasks * SCORE_VALUES.TASK_QUICK_COMPLETED +
      habits * SCORE_VALUES.HABIT_CHECKIN +
      subtasks * SCORE_VALUES.SUBTASK_COMPLETED;

    expect(total).toBe(10 * 5 + 5 * 5 + 3 * 2 + 2 * 5 + 4 * 5);
    expect(total).toBe(50 + 25 + 6 + 10 + 20);
    expect(total).toBe(111);
  });

  it('should reach small_ball stage with few activities', () => {
    const record = 8;
    const normalTasks = 2;
    const total = record * SCORE_VALUES.RECORD_CREATED + normalTasks * SCORE_VALUES.TASK_NORMAL_COMPLETED;
    expect(total).toBe(50);

    const stage = getSnowballStageByScore(total);
    expect(stage.stage).toBe('small_ball');
  });

  it('should require significant effort to reach ball stage', () => {
    const records = 20;
    const normalTasks = 20;

    const score = records * SCORE_VALUES.RECORD_CREATED +
                  normalTasks * SCORE_VALUES.TASK_NORMAL_COMPLETED;
    expect(score).toBe(20 * 5 + 20 * 5);
    expect(score).toBe(100 + 100);
    expect(score).toBe(200);

    const stage = getSnowballStageByScore(score);
    expect(stage.stage).toBe('ball');
  });
});
