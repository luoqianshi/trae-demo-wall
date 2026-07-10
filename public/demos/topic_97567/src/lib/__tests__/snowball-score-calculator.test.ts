import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateTaskScore,
  calculateStreakDays,
  calculateTodayScore,
  calculateTotalStats,
  type Task,
  type Record,
} from '../snowball-score-calculator';

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    status: 'pending',
    type: undefined,
    parent_id: undefined,
    completed_at: undefined,
    ...overrides,
  };
}

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgoDateStr(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

describe('calculateTaskScore', () => {
  describe('basic task counting', () => {
    it('should return zero counts for empty task array', () => {
      const result = calculateTaskScore([]);
      expect(result.normalCompleted).toBe(0);
      expect(result.quickCompleted).toBe(0);
      expect(result.subtaskCompleted).toBe(0);
      expect(result.habitCheckins).toBe(0);
      expect(result.bigTaskCompleted).toBe(0);
    });

    it('should return zero counts when all tasks are pending', () => {
      const tasks = [
        createTask({ status: 'pending' }),
        createTask({ status: 'in_progress' }),
      ];
      const result = calculateTaskScore(tasks);
      expect(result.normalCompleted).toBe(0);
    });

    it('should count only completed tasks', () => {
      const tasks = [
        createTask({ status: 'completed' }),
        createTask({ status: 'completed' }),
        createTask({ status: 'pending' }),
      ];
      const result = calculateTaskScore(tasks);
      expect(result.normalCompleted).toBe(2);
    });
  });

  describe('task type classification', () => {
    it('should classify tasks without type as normal', () => {
      const tasks = [
        createTask({ status: 'completed', type: undefined }),
        createTask({ status: 'completed', type: undefined }),
      ];
      const result = calculateTaskScore(tasks);
      expect(result.normalCompleted).toBe(2);
      expect(result.quickCompleted).toBe(0);
    });

    it('should classify tasks with type "quick" as quick tasks', () => {
      const tasks = [
        createTask({ status: 'completed', type: 'quick' }),
      ];
      const result = calculateTaskScore(tasks);
      expect(result.quickCompleted).toBe(1);
      expect(result.normalCompleted).toBe(0);
    });

    it('should classify tasks with type "habit" as habit checkins', () => {
      const tasks = [
        createTask({ status: 'completed', type: 'habit' }),
      ];
      const result = calculateTaskScore(tasks);
      expect(result.habitCheckins).toBe(1);
      expect(result.normalCompleted).toBe(0);
    });

    it('should classify tasks with parent_id as subtasks only (not normal)', () => {
      const tasks = [
        createTask({ status: 'completed', parent_id: 'parent-1' }),
      ];
      const result = calculateTaskScore(tasks);
      expect(result.subtaskCompleted).toBe(1);
      expect(result.normalCompleted).toBe(0);
      expect(result.quickCompleted).toBe(0);
    });

    it('should classify tasks with type "big" as big tasks', () => {
      const tasks = [
        createTask({ status: 'completed', type: 'big' }),
      ];
      const result = calculateTaskScore(tasks);
      expect(result.bigTaskCompleted).toBe(1);
      expect(result.normalCompleted).toBe(0);
      expect(result.quickCompleted).toBe(0);
    });
  });



  describe('return structure', () => {
    it('should return complete TaskScoreBreakdown structure', () => {
      const result = calculateTaskScore([]);
      expect(result).toHaveProperty('normalCompleted');
      expect(result).toHaveProperty('quickCompleted');
      expect(result).toHaveProperty('subtaskCompleted');
      expect(result).toHaveProperty('habitCheckins');
      expect(result).toHaveProperty('bigTaskCompleted');
    });

    it('should return non-negative values', () => {
      const result = calculateTaskScore([]);
      expect(result.normalCompleted).toBeGreaterThanOrEqual(0);
      expect(result.quickCompleted).toBeGreaterThanOrEqual(0);
      expect(result.subtaskCompleted).toBeGreaterThanOrEqual(0);
      expect(result.habitCheckins).toBeGreaterThanOrEqual(0);
      expect(result.bigTaskCompleted).toBeGreaterThanOrEqual(0);
    });
  });
});



describe('calculateStreakDays', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return 0 for empty records', () => {
    expect(calculateStreakDays([])).toBe(0);
  });

  it('should return 1 for single record today', () => {
    const records = [{ created_at: todayDateStr() + 'T10:00:00.000Z' }];
    expect(calculateStreakDays(records)).toBe(1);
  });

  it('should count consecutive days including today', () => {
    const records: Record[] = [
      { created_at: todayDateStr() + 'T10:00:00.000Z' },
      { created_at: daysAgoDateStr(1) + 'T10:00:00.000Z' },
      { created_at: daysAgoDateStr(2) + 'T10:00:00.000Z' },
    ];
    expect(calculateStreakDays(records)).toBe(3);
  });

  it('should allow streak from yesterday when today has no record', () => {
    const records: Record[] = [
      { created_at: daysAgoDateStr(1) + 'T10:00:00.000Z' },
      { created_at: daysAgoDateStr(2) + 'T10:00:00.000Z' },
    ];
    expect(calculateStreakDays(records)).toBe(2);
  });

  it('should return 0 when neither today nor yesterday has record', () => {
    const records: Record[] = [
      { created_at: daysAgoDateStr(5) + 'T10:00:00.000Z' },
    ];
    expect(calculateStreakDays(records)).toBe(0);
  });
});

describe('calculateTodayScore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('record counting', () => {
    it('should count records created today', () => {
      const records: Record[] = [
        { created_at: todayDateStr() + 'T10:00:00.000Z' },
        { created_at: todayDateStr() + 'T15:00:00.000Z' },
      ];
      const tasks: Task[] = [];
      const result = calculateTodayScore(records, tasks);
      expect(result.todayRecords).toBe(2);
    });

    it('should not count records from previous days', () => {
      const records: Record[] = [
        { created_at: daysAgoDateStr(1) + 'T10:00:00.000Z' },
        { created_at: daysAgoDateStr(2) + 'T10:00:00.000Z' },
      ];
      const tasks: Task[] = [];
      const result = calculateTodayScore(records, tasks);
      expect(result.todayRecords).toBe(0);
    });

    it('should return 0 records when array is empty', () => {
      const result = calculateTodayScore([], []);
      expect(result.todayRecords).toBe(0);
    });
  });

  describe('task counting', () => {
    it('should count tasks completed today', () => {
      const records: Record[] = [];
      const tasks: Task[] = [
        createTask({ status: 'completed', completed_at: todayDateStr() + 'T10:00:00.000Z' }),
        createTask({ status: 'completed', completed_at: todayDateStr() + 'T15:00:00.000Z' }),
      ];
      const result = calculateTodayScore(records, tasks);
      expect(result.todayCompletedTasks).toBe(2);
    });

    it('should not count tasks completed on previous days', () => {
      const records: Record[] = [];
      const tasks: Task[] = [
        createTask({ status: 'completed', completed_at: daysAgoDateStr(1) + 'T10:00:00.000Z' }),
      ];
      const result = calculateTodayScore(records, tasks);
      expect(result.todayCompletedTasks).toBe(0);
    });

    it('should not count pending tasks', () => {
      const records: Record[] = [];
      const tasks: Task[] = [
        createTask({ status: 'pending' }),
      ];
      const result = calculateTodayScore(records, tasks);
      expect(result.todayCompletedTasks).toBe(0);
    });
  });

  describe('score calculation', () => {
    it('should return 0 score for today (scores come from score_events)', () => {
      const records: Record[] = [
        { created_at: todayDateStr() + 'T10:00:00.000Z' },
        { created_at: todayDateStr() + 'T15:00:00.000Z' },
      ];
      const tasks: Task[] = [
        createTask({ status: 'completed', completed_at: todayDateStr() + 'T04:00:00.000Z' }),
        createTask({ status: 'completed', completed_at: todayDateStr() + 'T05:00:00.000Z', type: 'quick' }),
        createTask({ status: 'completed', completed_at: todayDateStr() + 'T06:00:00.000Z', type: 'big' }),
      ];
      const result = calculateTodayScore(records, tasks);
      expect(result.todayScore).toBe(0);
    });
  });

  describe('return structure', () => {
    it('should return complete structure', () => {
      const result = calculateTodayScore([], []);
      expect(result).toHaveProperty('todayScore');
      expect(result).toHaveProperty('todayRecords');
      expect(result).toHaveProperty('todayCompletedTasks');
    });

    it('should return non-negative values', () => {
      const records: Record[] = [];
      const tasks: Task[] = [];
      const result = calculateTodayScore(records, tasks);
      expect(result.todayScore).toBeGreaterThanOrEqual(0);
      expect(result.todayRecords).toBeGreaterThanOrEqual(0);
      expect(result.todayCompletedTasks).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('calculateTotalStats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('empty input', () => {
    it('should handle empty records and tasks', () => {
      const result = calculateTotalStats([], []);
      expect(result.totalScore).toBe(0);
      expect(result.todayScore).toBe(0);
      expect(result.todayStreak).toBe(0);
      expect(result.recordCount).toBe(0);
      expect(result.taskCompletedCount).toBe(0);
    });
  });

  describe('total score calculation', () => {
    it('should return totalScore as 0 (scores come from score_events)', () => {
      const records: Record[] = [
        { created_at: todayDateStr() + 'T04:00:00.000Z' },
        { created_at: todayDateStr() + 'T05:00:00.000Z' },
        { created_at: daysAgoDateStr(1) + 'T04:00:00.000Z' },
      ];
      const tasks: Task[] = [
        createTask({ status: 'completed', completed_at: todayDateStr() + 'T04:00:00.000Z' }),
      ];
      const result = calculateTotalStats(records, tasks);
      expect(result.totalScore).toBe(0);
    });
  });

  describe('todayStreak calculation', () => {
    it('should return 0 when no streak', () => {
      const records: Record[] = [
        { created_at: daysAgoDateStr(5) + 'T10:00:00.000Z' },
      ];
      const result = calculateTotalStats(records, []);
      expect(result.todayStreak).toBe(0);
    });

    it('should calculate todayStreak as consecutive days including today', () => {
      const records: Record[] = [
        { created_at: todayDateStr() + 'T10:00:00.000Z' },
      ];
      for (let i = 1; i <= 7; i++) {
        records.push({ created_at: daysAgoDateStr(i) + 'T10:00:00.000Z' });
      }
      const result = calculateTotalStats(records, []);
      expect(result.todayStreak).toBe(8);
    });

    it('should return 1 when only today has record', () => {
      const records: Record[] = [
        { created_at: todayDateStr() + 'T10:00:00.000Z' },
      ];
      const result = calculateTotalStats(records, []);
      expect(result.todayStreak).toBe(1);
    });
  });

  describe('record count', () => {
    it('should return correct record count', () => {
      const records: Record[] = [
        { created_at: todayDateStr() + 'T10:00:00.000Z' },
        { created_at: daysAgoDateStr(1) + 'T10:00:00.000Z' },
        { created_at: daysAgoDateStr(2) + 'T10:00:00.000Z' },
      ];
      const result = calculateTotalStats(records, []);
      expect(result.recordCount).toBe(3);
    });

    it('should return 0 for empty records', () => {
      const result = calculateTotalStats([], []);
      expect(result.recordCount).toBe(0);
    });
  });

  describe('task completed count', () => {
    it('should count all completed tasks across types including big', () => {
      const records: Record[] = [];
      const tasks: Task[] = [
        createTask({ status: 'completed' }),
        createTask({ status: 'completed', type: 'quick' }),
        createTask({ status: 'completed', type: 'habit' }),
        createTask({ status: 'completed', parent_id: 'parent-1' }),
        createTask({ status: 'completed', type: 'big' }),
        createTask({ status: 'pending' }),
      ];
      const result = calculateTotalStats(records, tasks);
      expect(result.taskCompletedCount).toBe(5);
    });

    it('should return 0 for no completed tasks', () => {
      const tasks: Task[] = [
        createTask({ status: 'pending' }),
        createTask({ status: 'in_progress' }),
      ];
      const result = calculateTotalStats([], tasks);
      expect(result.taskCompletedCount).toBe(0);
    });
  });

  describe('return structure', () => {
    it('should return all required fields', () => {
      const result = calculateTotalStats([], []);
      expect(result).toHaveProperty('totalScore');
      expect(result).toHaveProperty('todayScore');
      expect(result).toHaveProperty('todayStreak');
      expect(result).toHaveProperty('recordCount');
      expect(result).toHaveProperty('taskCompletedCount');
    });

    it('should return non-negative values', () => {
      const result = calculateTotalStats([], []);
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.todayScore).toBeGreaterThanOrEqual(0);
      expect(result.todayStreak).toBeGreaterThanOrEqual(0);
      expect(result.recordCount).toBeGreaterThanOrEqual(0);
      expect(result.taskCompletedCount).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('integration: score calculator with snowball score values', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return correct counts for mixed task types', () => {
    const tasks = [
      createTask({ status: 'completed' }),
      createTask({ status: 'completed', type: 'quick' }),
      createTask({ status: 'completed', type: 'habit' }),
      createTask({ status: 'completed', parent_id: 'parent-1' }),
      createTask({ status: 'completed', type: 'big' }),
    ];
    const result = calculateTaskScore(tasks);

    expect(result.normalCompleted).toBe(1);
    expect(result.quickCompleted).toBe(1);
    expect(result.habitCheckins).toBe(1);
    expect(result.subtaskCompleted).toBe(1);
    expect(result.bigTaskCompleted).toBe(1);
  });

  it('should calculate complete user journey stats without score', () => {
    const records: Record[] = [];
    for (let i = 0; i < 30; i++) {
      records.push({ created_at: daysAgoDateStr(i) + 'T10:00:00.000Z' });
    }

    const tasks: Task[] = [];
    for (let i = 0; i < 10; i++) {
      tasks.push(createTask({ status: 'completed', completed_at: daysAgoDateStr(i) + 'T10:00:00.000Z' }));
    }
    for (let i = 0; i < 5; i++) {
      tasks.push(createTask({ status: 'completed', type: 'quick', completed_at: daysAgoDateStr(i) + 'T10:00:00.000Z' }));
    }

    const stats = calculateTotalStats(records, tasks);

    expect(stats.recordCount).toBe(30);
    expect(stats.taskCompletedCount).toBe(15);
    expect(stats.totalScore).toBe(0);
  });

  it('should handle realistic daily usage scenario', () => {
    const records: Record[] = [
      { created_at: todayDateStr() + 'T02:00:00.000Z' },
      { created_at: todayDateStr() + 'T04:00:00.000Z' },
      { created_at: daysAgoDateStr(1) + 'T01:00:00.000Z' },
      { created_at: daysAgoDateStr(1) + 'T04:00:00.000Z' },
      { created_at: daysAgoDateStr(2) + 'T02:00:00.000Z' },
    ];

    const tasks: Task[] = [
      createTask({ status: 'completed', completed_at: todayDateStr() + 'T02:00:00.000Z' }),
      createTask({ status: 'completed', type: 'habit', completed_at: todayDateStr() + 'T01:00:00.000Z' }),
      createTask({ status: 'completed', completed_at: daysAgoDateStr(1) + 'T03:00:00.000Z' }),
    ];

    const stats = calculateTotalStats(records, tasks);
    const todayStats = calculateTodayScore(records, tasks);

    expect(todayStats.todayRecords).toBe(2);
    expect(todayStats.todayCompletedTasks).toBe(2);
    expect(todayStats.todayScore).toBe(0);
    expect(stats.totalScore).toBe(0);
  });
});
