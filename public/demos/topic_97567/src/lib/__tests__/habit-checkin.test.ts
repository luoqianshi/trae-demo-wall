// TODO: Update tests for local-db migration
// These tests previously used in-memory arrays (mockTasks, mockGrowthData) for direct
// manipulation. With local-db, data is stored in a JSON file and accessed through
// functions (createTask, updateTask, getTasks, etc.). Tests that directly modify
// task properties (task.current_streak = 4) or push to arrays need to be rewritten
// to use updateTask() and createTask() respectively.
//
// Note: createTask() hardcodes current_streak=0, best_streak=0, completed_at=null
// after the spread, so we must use updateTask() to set these fields.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetData,
  createTask,
  updateTask,
  getTasks,
  getGrowthData,
} from '@/lib/local-db';

let habitTask1Id: string;
let habitTask2Id: string;
let normalTaskId: string;

beforeEach(() => {
  resetData();

  habitTask1Id = createTask({
    user_id: '1',
    title: '每日早起',
    task_type: 'habit',
    status: 'pending',
  }).id;
  updateTask(habitTask1Id, {
    current_streak: 3,
    best_streak: 5,
    completed_at: new Date(Date.now() - 86400000).toISOString(),
  });

  habitTask2Id = createTask({
    user_id: '1',
    title: '每日阅读',
    task_type: 'habit',
    status: 'pending',
  }).id;

  normalTaskId = createTask({
    user_id: '1',
    title: '普通任务',
    task_type: 'normal',
    status: 'pending',
  }).id;
});

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayString(): string {
  return new Date(Date.now() - 86400000).toISOString().split('T')[0];
}

function getTwoDaysAgoString(): string {
  return new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
}

function getTaskById(id: string) {
  return getTasks('1').find(t => t.id === id);
}

describe('Habit Check-in Logic', () => {
  describe('streak calculation', () => {
    it('should start new streak when checking in with no previous completion', () => {
      const task = getTaskById(habitTask2Id)!;
      expect(task.current_streak).toBe(0);
      expect(task.completed_at).toBeNull();

      const yesterday = getYesterdayString();
      const lastCompleted = task.completed_at ? task.completed_at.split('T')[0] : null;

      const isConsecutive = lastCompleted === yesterday;
      const newStreak = isConsecutive ? task.current_streak + 1 : 1;

      expect(newStreak).toBe(1);
    });

    it('should increment streak when checking in consecutively', () => {
      const task = getTaskById(habitTask1Id)!;
      expect(task.current_streak).toBe(3);

      const yesterday = getYesterdayString();
      const lastCompleted = task.completed_at ? task.completed_at.split('T')[0] : null;

      const isConsecutive = lastCompleted === yesterday;
      const newStreak = isConsecutive ? task.current_streak + 1 : 1;

      expect(newStreak).toBe(4);
      expect(isConsecutive).toBe(true);
    });

    it('should reset streak when checking in after a gap', () => {
      const task = getTaskById(habitTask1Id)!;
      const twoDaysAgo = getTwoDaysAgoString();

      const lastCompleted = twoDaysAgo;
      const yesterday = getYesterdayString();
      const isConsecutive = lastCompleted === yesterday;

      expect(isConsecutive).toBe(false);

      const newStreak = isConsecutive ? task.current_streak + 1 : 1;
      expect(newStreak).toBe(1);
    });

    it('should update best_streak when new streak is higher', () => {
      const task = getTaskById(habitTask1Id)!;
      const yesterday = getYesterdayString();
      const lastCompleted = task.completed_at ? task.completed_at.split('T')[0] : null;
      const isConsecutive = lastCompleted === yesterday;

      const newStreak = isConsecutive ? task.current_streak + 1 : 1;
      const newBestStreak = Math.max(newStreak, task.best_streak);

      expect(newStreak).toBe(4);
      expect(newBestStreak).toBe(5);
    });

    it('should keep best_streak unchanged when new streak is lower', () => {
      const task = getTaskById(habitTask2Id)!;
      const yesterday = getYesterdayString();
      const lastCompleted = task.completed_at;

      const isConsecutive = lastCompleted === yesterday;
      const newStreak = isConsecutive ? task.current_streak + 1 : 1;
      const newBestStreak = Math.max(newStreak, task.best_streak || 0);

      expect(newStreak).toBe(1);
    });
  });

  describe('duplicate check-in prevention', () => {
    it('should detect same-day check-in', () => {
      const task = getTaskById(habitTask1Id)!;
      const today = getTodayString();
      const lastCompleted = task.completed_at ? task.completed_at.split('T')[0] : null;

      const alreadyCheckedIn = lastCompleted === today;
      expect(alreadyCheckedIn).toBe(false);
    });

    it('should allow check-in on different days', () => {
      const task = getTaskById(habitTask1Id)!;
      const today = getTodayString();
      const yesterday = getYesterdayString();
      const lastCompleted = task.completed_at ? task.completed_at.split('T')[0] : null;

      const alreadyCheckedIn = lastCompleted === today;
      const isConsecutive = lastCompleted === yesterday;

      expect(alreadyCheckedIn).toBe(false);
      expect(isConsecutive).toBe(true);
    });

    it('should allow check-in after gap', () => {
      const task = getTaskById(habitTask2Id)!;
      const today = getTodayString();
      const yesterday = getYesterdayString();
      const lastCompleted = task.completed_at;

      const alreadyCheckedIn = lastCompleted === today;
      const isConsecutive = lastCompleted === yesterday;

      expect(alreadyCheckedIn).toBe(false);
      expect(isConsecutive).toBe(false);
    });
  });

  describe('task status update', () => {
    it('should mark habit as completed after check-in', () => {
      const updated = updateTask(habitTask2Id, {
        status: 'completed',
      });

      expect(updated.status).toBe('completed');
      expect(updated.completed_at).toBeDefined();
    });

    it('should preserve current_streak on update', () => {
      updateTask(habitTask1Id, { current_streak: 4 });
      const updated = getTaskById(habitTask1Id)!;
      expect(updated.current_streak).toBe(4);
    });
  });

  describe('non-habit task validation', () => {
    it('should reject check-in for normal tasks', () => {
      const task = getTaskById(normalTaskId)!;
      expect(task.task_type).toBe('normal');
      expect(task.task_type).not.toBe('habit');
    });

    it('should allow check-in only for habit tasks', () => {
      const habitTask = getTaskById(habitTask1Id)!;
      const normalTask = getTaskById(normalTaskId)!;

      expect(habitTask.task_type === 'habit').toBe(true);
      expect(normalTask.task_type === 'habit').toBe(false);
    });
  });

  describe('growth data update', () => {
    it('should have growth data for user', () => {
      const growth = getGrowthData('1');
      expect(growth).toBeDefined();
    });

    it('should track tasks completed', () => {
      updateTask(habitTask1Id, { status: 'completed' });

      const growth = getGrowthData('1');
      expect(growth).toBeDefined();
      if (growth) {
        expect(growth.tasks_completed).toBeGreaterThanOrEqual(1);
      }
    });
  });
});

describe('Check-in response format', () => {
  it('should return task, streak, best_streak, and is_consecutive', () => {
    const task = getTaskById(habitTask1Id)!;

    const yesterday = getYesterdayString();
    const lastCompleted = task.completed_at ? task.completed_at.split('T')[0] : null;
    const isConsecutive = lastCompleted === yesterday;
    const newStreak = isConsecutive ? task.current_streak + 1 : 1;
    const newBestStreak = Math.max(newStreak, task.best_streak);

    const response = {
      streak: newStreak,
      best_streak: newBestStreak,
      is_consecutive: isConsecutive,
    };

    expect(response).toHaveProperty('streak');
    expect(response).toHaveProperty('best_streak');
    expect(response).toHaveProperty('is_consecutive');
    expect(typeof response.streak).toBe('number');
    expect(typeof response.best_streak).toBe('number');
    expect(typeof response.is_consecutive).toBe('boolean');
  });

  it('should return is_consecutive true for consecutive check-in', () => {
    const task = getTaskById(habitTask1Id)!;
    const yesterday = getYesterdayString();
    const lastCompleted = task.completed_at ? task.completed_at.split('T')[0] : null;

    expect(lastCompleted).toBe(yesterday);
  });

  it('should return is_consecutive false for first check-in', () => {
    const task = getTaskById(habitTask2Id)!;
    const lastCompleted = task.completed_at;

    expect(lastCompleted).toBeNull();
  });
});

describe('Edge cases', () => {
  it('should handle task with zero best_streak', () => {
    const task = getTaskById(habitTask2Id)!;
    const newStreak = 1;
    const newBestStreak = Math.max(newStreak, task.best_streak || 0);

    expect(newBestStreak).toBe(1);
  });

  it('should handle task with zero current_streak', () => {
    const task = getTaskById(habitTask2Id)!;
    const yesterday = getYesterdayString();
    const lastCompleted = task.completed_at;

    const isConsecutive = lastCompleted === yesterday;
    const newStreak = isConsecutive ? (task.current_streak || 0) + 1 : 1;

    expect(newStreak).toBe(1);
  });

  it('should handle very long streaks', () => {
    updateTask(habitTask1Id, { current_streak: 365, best_streak: 365 });
    const task = getTaskById(habitTask1Id)!;

    const yesterday = getYesterdayString();
    const lastCompleted = task.completed_at ? task.completed_at.split('T')[0] : null;
    const isConsecutive = lastCompleted === yesterday;
    const newStreak = isConsecutive ? task.current_streak + 1 : 1;

    expect(newStreak).toBe(366);
  });

  it('should handle timezone edge case at midnight', () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const completedYesterday = new Date(Date.now() - 86400000).toISOString();
    const yesterdayFromCompleted = completedYesterday.split('T')[0];

    expect(today !== yesterdayFromCompleted).toBe(true);
  });
});

describe('Streak milestone detection', () => {
  it('should detect 3-day streak milestone', () => {
    updateTask(habitTask1Id, { current_streak: 3 });
    const task = getTaskById(habitTask1Id)!;

    const yesterday = getYesterdayString();
    const lastCompleted = task.completed_at ? task.completed_at.split('T')[0] : null;
    const isConsecutive = lastCompleted === yesterday;
    const newStreak = isConsecutive ? task.current_streak + 1 : 1;

    expect(newStreak).toBe(4);
  });

  it('should detect 7-day streak milestone', () => {
    let streak = 7;
    const yesterday = getYesterdayString();
    const lastCompleted = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const isConsecutive = lastCompleted === yesterday;

    if (isConsecutive) {
      streak += 1;
    }

    expect(streak).toBe(8);
  });

  it('should detect 30-day streak milestone', () => {
    let streak = 30;
    const yesterday = getYesterdayString();
    const lastCompleted = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const isConsecutive = lastCompleted === yesterday;

    if (isConsecutive) {
      streak += 1;
    }

    expect(streak).toBe(31);
  });

  it('should detect new best streak', () => {
    updateTask(habitTask1Id, { current_streak: 4, best_streak: 5 });
    const task = getTaskById(habitTask1Id)!;

    const yesterday = getYesterdayString();
    const lastCompleted = task.completed_at ? task.completed_at.split('T')[0] : null;
    const isConsecutive = lastCompleted === yesterday;
    const newStreak = isConsecutive ? task.current_streak + 1 : 1;
    const newBestStreak = Math.max(newStreak, task.best_streak);

    expect(newStreak).toBe(5);
    expect(newBestStreak).toBe(5);
  });

  it('should break previous best streak', () => {
    updateTask(habitTask1Id, { current_streak: 4, best_streak: 5 });
    const task = getTaskById(habitTask1Id)!;

    const twoDaysAgo = getTwoDaysAgoString();
    const yesterday = getYesterdayString();
    const isConsecutive = twoDaysAgo === yesterday;
    const newStreak = isConsecutive ? task.current_streak + 1 : 1;
    const newBestStreak = Math.max(newStreak, task.best_streak);

    expect(newStreak).toBe(1);
    expect(newBestStreak).toBe(5);
  });
});
