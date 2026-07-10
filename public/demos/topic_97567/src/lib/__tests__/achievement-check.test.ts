import { describe, it, expect, beforeEach } from 'vitest';
import { achievementDefinitions } from '@/lib/data-models';
import {
  resetData,
  checkAndUnlockAchievements,
  getUserAchievements,
  getUserStats,
  createRecord,
  createTask,
  updateTask,
  createProcrastinationSession,
  getUserInteractions,
  incrementUserInteraction,
} from '@/lib/local-db';

beforeEach(() => {
  resetData();
});

function makeStats(overrides: {
  records_count?: number;
  completed_tasks?: number;
  streak_days?: number;
  progress?: number;
  procrastination_count?: number;
  challenges_completed?: number;
  bronze_completed?: number;
  silver_completed?: number;
  gold_completed?: number;
  snowball_interactions?: number;
  snowball_clicks?: number;
  midnight_record?: boolean;
  record_500_words?: boolean;
} = {}) {
  return {
    records_count: 0,
    completed_tasks: 0,
    streak_days: 0,
    progress: 0,
    procrastination_count: 0,
    ...overrides,
  };
}

describe('Achievement Definitions', () => {
  it('should have 34 achievements defined', () => {
    expect(achievementDefinitions).toHaveLength(34);
  });

  it('should have unique achievement IDs', () => {
    const ids = achievementDefinitions.map(a => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(achievementDefinitions.length);
  });

  it('should have all required properties for each achievement', () => {
    achievementDefinitions.forEach(achievement => {
      expect(achievement).toHaveProperty('id');
      expect(achievement).toHaveProperty('title');
      expect(achievement).toHaveProperty('description');
      expect(achievement).toHaveProperty('icon');
      expect(achievement).toHaveProperty('level');
      expect(achievement).toHaveProperty('category');
    });
  });

  it('should have valid level values', () => {
    const validLevels = ['micro', 'minor', 'growth', 'major', 'transformation'];
    achievementDefinitions.forEach(achievement => {
      expect(validLevels).toContain(achievement.level);
    });
  });
});

describe('All achievement conditions', () => {
  const conditionTests: Array<{ id: string; passingStats: any; failingStats: any }> = [
    { id: 'records_1', passingStats: { records_count: 1 }, failingStats: { records_count: 0 } },
    { id: 'records_3', passingStats: { records_count: 3 }, failingStats: { records_count: 2 } },
    { id: 'records_7', passingStats: { records_count: 7 }, failingStats: { records_count: 6 } },
    { id: 'records_14', passingStats: { records_count: 14 }, failingStats: { records_count: 13 } },
    { id: 'records_30', passingStats: { records_count: 30 }, failingStats: { records_count: 29 } },
    { id: 'records_66', passingStats: { records_count: 66 }, failingStats: { records_count: 65 } },
    { id: 'records_100', passingStats: { records_count: 100 }, failingStats: { records_count: 99 } },
    { id: 'records_200', passingStats: { records_count: 200 }, failingStats: { records_count: 199 } },
    { id: 'streak_3', passingStats: { streak_days: 3 }, failingStats: { streak_days: 2 } },
    { id: 'streak_7', passingStats: { streak_days: 7 }, failingStats: { streak_days: 6 } },
    { id: 'streak_14', passingStats: { streak_days: 14 }, failingStats: { streak_days: 13 } },
    { id: 'streak_21', passingStats: { streak_days: 21 }, failingStats: { streak_days: 20 } },
    { id: 'streak_30', passingStats: { streak_days: 30 }, failingStats: { streak_days: 29 } },
    { id: 'streak_66', passingStats: { streak_days: 66 }, failingStats: { streak_days: 65 } },
    { id: 'streak_100', passingStats: { streak_days: 100 }, failingStats: { streak_days: 99 } },
    { id: 'streak_365', passingStats: { streak_days: 365 }, failingStats: { streak_days: 364 } },
    { id: 'challenge_first', passingStats: { challenges_completed: 1 }, failingStats: { challenges_completed: 0 } },
    { id: 'challenge_bronze_5', passingStats: { bronze_completed: 5 }, failingStats: { bronze_completed: 4 } },
    { id: 'challenge_silver_1', passingStats: { silver_completed: 1 }, failingStats: { silver_completed: 0 } },
    { id: 'challenge_gold_1', passingStats: { gold_completed: 1 }, failingStats: { gold_completed: 0 } },
    { id: 'challenge_all_types', passingStats: { bronze_completed: 1, silver_completed: 1, gold_completed: 1 }, failingStats: { bronze_completed: 1, silver_completed: 0, gold_completed: 1 } },
    { id: 'challenge_10', passingStats: { challenges_completed: 10 }, failingStats: { challenges_completed: 9 } },
    { id: 'task_first', passingStats: { completed_tasks: 1 }, failingStats: { completed_tasks: 0 } },
    { id: 'task_5', passingStats: { completed_tasks: 5 }, failingStats: { completed_tasks: 4 } },
    { id: 'task_10', passingStats: { completed_tasks: 10 }, failingStats: { completed_tasks: 9 } },
    { id: 'interact_first', passingStats: { snowball_interactions: 1 }, failingStats: { snowball_interactions: 0 } },
    { id: 'interact_10', passingStats: { snowball_interactions: 10 }, failingStats: { snowball_interactions: 9 } },
    { id: 'interact_50', passingStats: { snowball_interactions: 50 }, failingStats: { snowball_interactions: 49 } },
    { id: 'interact_100', passingStats: { snowball_interactions: 100 }, failingStats: { snowball_interactions: 99 } },
    { id: 'hidden_midnight', passingStats: { midnight_record: true }, failingStats: { midnight_record: false } },
    { id: 'hidden_clicker', passingStats: { snowball_clicks: 100 }, failingStats: { snowball_clicks: 99 } },
    { id: 'hidden_perfect', passingStats: { record_500_words: true }, failingStats: { record_500_words: false } },
    { id: 'first_procrastination', passingStats: { procrastination_count: 1 }, failingStats: { procrastination_count: 0 } },
  ];

  for (const { id, passingStats, failingStats } of conditionTests) {
    it(`should unlock ${id} with passing stats`, () => {
      const unlocked = checkAndUnlockAchievements('1', makeStats(passingStats));
      expect(unlocked).toContain(id);
    });

    it(`should not unlock ${id} with failing stats`, () => {
      const unlocked = checkAndUnlockAchievements('1', makeStats(failingStats));
      expect(unlocked).not.toContain(id);
    });
  }
});

describe('master_all unlock logic', () => {
  it('should unlock master_all when all other achievements are unlocked', () => {
    const allStats = makeStats({
      records_count: 200,
      streak_days: 365,
      completed_tasks: 10,
      procrastination_count: 1,
      challenges_completed: 10,
      bronze_completed: 5,
      silver_completed: 1,
      gold_completed: 1,
      snowball_interactions: 100,
      snowball_clicks: 100,
      midnight_record: true,
      record_500_words: true,
    });
    const unlocked = checkAndUnlockAchievements('1', allStats);
    expect(unlocked).toContain('master_all');
  });

  it('should not unlock master_all when some achievements are missing', () => {
    const partialStats = makeStats({
      records_count: 200,
      streak_days: 365,
      completed_tasks: 10,
      procrastination_count: 1,
    });
    const unlocked = checkAndUnlockAchievements('1', partialStats);
    expect(unlocked).not.toContain('master_all');
  });
});

describe('idempotency', () => {
  it('should not unlock same achievement twice', () => {
    const stats = makeStats({ records_count: 1 });

    const unlocked1 = checkAndUnlockAchievements('1', stats);
    const unlocked2 = checkAndUnlockAchievements('1', stats);

    expect(unlocked1).toContain('records_1');
    expect(unlocked2).not.toContain('records_1');
  });

  it('should not duplicate achievement in userAchievements', () => {
    const stats = makeStats({ records_count: 1 });

    checkAndUnlockAchievements('1', stats);
    checkAndUnlockAchievements('1', stats);

    const userAchievements = getUserAchievements('1');
    const records1Count = userAchievements.filter(
      a => a.achievement_id === 'records_1'
    ).length;

    expect(records1Count).toBe(1);
  });
});

describe('edge cases', () => {
  it('should handle zero values', () => {
    const stats = makeStats({ records_count: 0, completed_tasks: 0 });
    const unlocked = checkAndUnlockAchievements('1', stats);

    expect(unlocked).toHaveLength(0);
  });

  it('should handle negative values', () => {
    const stats = makeStats({ streak_days: -1 });
    const unlocked = checkAndUnlockAchievements('1', stats);

    expect(unlocked).not.toContain('streak_3');
  });

  it('should handle missing properties', () => {
    const stats = { records_count: 1 };
    const unlocked = checkAndUnlockAchievements('1', stats as any);

    expect(unlocked).toContain('records_1');
  });

  it('should unlock exactly at threshold', () => {
    expect(checkAndUnlockAchievements('1', makeStats({ records_count: 7 }))).toContain('records_7');
  });

  it('should not unlock one below threshold', () => {
    expect(checkAndUnlockAchievements('1', makeStats({ records_count: 6 }))).not.toContain('records_7');
  });

  it('should handle very large values', () => {
    const unlocked = checkAndUnlockAchievements('1', makeStats({ records_count: 999999 }));
    expect(unlocked).toContain('records_200');
  });
});

describe('getUserAchievements', () => {
  it('should return empty array for user with no achievements', () => {
    const achievements = getUserAchievements('1');
    expect(achievements).toHaveLength(0);
  });

  it('should return achievements for specific user after unlocking', () => {
    const stats = makeStats({ records_count: 1 });
    checkAndUnlockAchievements('1', stats);

    const userAchievements = getUserAchievements('1');
    expect(userAchievements).toHaveLength(1);
    expect(userAchievements[0].achievement_id).toBe('records_1');
  });

  it('should return all achievements for user', () => {
    const stats = makeStats({ records_count: 3, completed_tasks: 1 });
    checkAndUnlockAchievements('1', stats);

    const achievements = getUserAchievements('1');
    expect(achievements.length).toBeGreaterThanOrEqual(2);
  });
});

describe('getUserStats', () => {
  it('should calculate correct stats for user', () => {
    for (let i = 0; i < 5; i++) {
      createRecord({ user_id: '1', content: `Record ${i}`, record_type: 'success', tags: [], mood: 'happy' });
    }

    for (let i = 0; i < 3; i++) {
      const task = createTask({ user_id: '1', title: `Task ${i}`, task_type: 'normal' });
      updateTask(task.id, { status: 'completed' });
    }

    const stats = getUserStats('1');

    expect(stats.records_count).toBe(5);
    expect(stats.completed_tasks).toBe(3);
    expect(stats).toHaveProperty('challenges_completed');
    expect(stats).toHaveProperty('bronze_completed');
    expect(stats).toHaveProperty('silver_completed');
    expect(stats).toHaveProperty('gold_completed');
  });

  it('should return 0 for empty data', () => {
    resetData();
    const stats = getUserStats('nonexistent');

    expect(stats.records_count).toBe(0);
    expect(stats.completed_tasks).toBe(0);
    expect(stats.streak_days).toBe(0);
    expect(stats.challenges_completed).toBe(0);
  });
});

describe('User Interactions', () => {
  it('should start with zero interactions', () => {
    const interactions = getUserInteractions('1');
    expect(interactions.snowball_interactions).toBe(0);
    expect(interactions.snowball_clicks).toBe(0);
  });

  it('should increment snowball_interaction count', () => {
    const count1 = incrementUserInteraction('1', 'snowball_interaction');
    expect(count1).toBe(1);
    const count2 = incrementUserInteraction('1', 'snowball_interaction');
    expect(count2).toBe(2);
    const interactions = getUserInteractions('1');
    expect(interactions.snowball_interactions).toBe(2);
  });

  it('should increment snowball_click count', () => {
    for (let i = 0; i < 10; i++) {
      incrementUserInteraction('1', 'snowball_click');
    }
    const interactions = getUserInteractions('1');
    expect(interactions.snowball_clicks).toBe(10);
  });

  it('should track interactions independently per user', () => {
    incrementUserInteraction('1', 'snowball_interaction');
    incrementUserInteraction('1', 'snowball_interaction');
    incrementUserInteraction('2', 'snowball_interaction');

    expect(getUserInteractions('1').snowball_interactions).toBe(2);
    expect(getUserInteractions('2').snowball_interactions).toBe(1);
  });
});


