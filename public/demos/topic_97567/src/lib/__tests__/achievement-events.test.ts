import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  emitAchievementStateChange,
  onAchievementStateChange,
  trackUserAction,
  type AchievementStateEvent,
} from '../achievement-events';

describe('Achievement Events Bus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should emit and receive achievement unlocked events', () => {
    const handler = vi.fn();
    const unsubscribe = onAchievementStateChange(handler);

    emitAchievementStateChange({
      type: 'unlocked',
      achievementIds: ['task_first', 'records_1'],
      timestamp: Date.now(),
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'unlocked',
        achievementIds: ['task_first', 'records_1'],
      })
    );

    unsubscribe();
  });

  it('should emit and receive progress events', () => {
    const handler = vi.fn();
    const unsubscribe = onAchievementStateChange(handler);

    trackUserAction('habit_checkin');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'progress',
        action: 'habit_checkin',
      })
    );

    unsubscribe();
  });

  it('should unsubscribe correctly', () => {
    const handler = vi.fn();
    const unsubscribe = onAchievementStateChange(handler);

    emitAchievementStateChange({
      type: 'unlocked',
      achievementIds: ['test'],
      timestamp: Date.now(),
    });
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();

    emitAchievementStateChange({
      type: 'unlocked',
      achievementIds: ['test2'],
      timestamp: Date.now(),
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple handlers independently', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const unsub1 = onAchievementStateChange(handler1);
    const unsub2 = onAchievementStateChange(handler2);

    emitAchievementStateChange({
      type: 'unlocked',
      achievementIds: ['test'],
      timestamp: Date.now(),
    });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);

    unsub1();

    emitAchievementStateChange({
      type: 'progress',
      action: 'test_action',
      timestamp: Date.now(),
    });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(2);

    unsub2();
  });
});

describe('Achievement Priority Mechanism', () => {
  const LEVEL_PRIORITY: Record<string, number> = {
    transformation: 5,
    major: 4,
    growth: 3,
    minor: 2,
    micro: 1,
  };

  const testAchievements = [
    { id: 'task_first', level: 'micro' },
    { id: 'records_30', level: 'growth' },
    { id: 'streak_365', level: 'transformation' },
    { id: 'hidden_perfect', level: 'major' },
    { id: 'streak_14', level: 'minor' },
  ];

  it('should sort achievements by level priority (highest first)', () => {
    const sorted = [...testAchievements].sort((a, b) => {
      return (LEVEL_PRIORITY[b.level] || 0) - (LEVEL_PRIORITY[a.level] || 0);
    });

    expect(sorted[0].id).toBe('streak_365');
    expect(sorted[1].id).toBe('hidden_perfect');
    expect(sorted[2].id).toBe('records_30');
    expect(sorted[3].id).toBe('streak_14');
    expect(sorted[4].id).toBe('task_first');
  });

  it('should pick transformation achievement as primary over micro', () => {
    const ids = ['task_first', 'streak_365'];
    const sorted = [...ids].sort((a, b) => {
      const achA = testAchievements.find(t => t.id === a);
      const achB = testAchievements.find(t => t.id === b);
      return (LEVEL_PRIORITY[achB?.level || ''] || 0) - (LEVEL_PRIORITY[achA?.level || ''] || 0);
    });

    expect(sorted[0]).toBe('streak_365');
  });

  it('should pick major achievement over growth', () => {
    const ids = ['records_30', 'hidden_perfect'];
    const sorted = [...ids].sort((a, b) => {
      const achA = testAchievements.find(t => t.id === a);
      const achB = testAchievements.find(t => t.id === b);
      return (LEVEL_PRIORITY[achB?.level || ''] || 0) - (LEVEL_PRIORITY[achA?.level || ''] || 0);
    });

    expect(sorted[0]).toBe('hidden_perfect');
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle rapid subscribe/unsubscribe cycles', () => {
    const handler = vi.fn();
    const unsubs: Array<() => void> = [];

    for (let i = 0; i < 5; i++) {
      unsubs.push(onAchievementStateChange(handler));
    }

    emitAchievementStateChange({
      type: 'unlocked',
      achievementIds: ['test'],
      timestamp: Date.now(),
    });

    expect(handler).toHaveBeenCalledTimes(5);

    unsubs.forEach(unsub => unsub());

    emitAchievementStateChange({
      type: 'unlocked',
      achievementIds: ['test2'],
      timestamp: Date.now(),
    });

    expect(handler).toHaveBeenCalledTimes(5);
  });

  it('should handle duplicate unsubscribe calls gracefully', () => {
    const handler = vi.fn();
    const unsubscribe = onAchievementStateChange(handler);

    unsubscribe();
    unsubscribe();

    emitAchievementStateChange({
      type: 'progress',
      action: 'test',
      timestamp: Date.now(),
    });

    expect(handler).toHaveBeenCalledTimes(0);
  });

  it('should handle events with missing optional fields', () => {
    const handler = vi.fn();
    const unsubscribe = onAchievementStateChange(handler);

    emitAchievementStateChange({
      type: 'progress',
      timestamp: Date.now(),
    } as AchievementStateEvent);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'progress',
      })
    );

    unsubscribe();
  });

  it('should handle empty achievementIds array', () => {
    const handler = vi.fn();
    const unsubscribe = onAchievementStateChange(handler);

    emitAchievementStateChange({
      type: 'unlocked',
      achievementIds: [],
      timestamp: Date.now(),
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        achievementIds: [],
      })
    );

    unsubscribe();
  });

  it('should handle timestamp in different formats', () => {
    const handler = vi.fn();
    const unsubscribe = onAchievementStateChange(handler);

    emitAchievementStateChange({
      type: 'progress',
      timestamp: 0,
    });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: 0,
      })
    );

    emitAchievementStateChange({
      type: 'progress',
      timestamp: Number.MAX_SAFE_INTEGER,
    });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: Number.MAX_SAFE_INTEGER,
      })
    );

    unsubscribe();
  });

  it('should maintain handler order across multiple emits', () => {
    const callOrder: string[] = [];
    const handler1 = vi.fn(() => callOrder.push('handler1'));
    const handler2 = vi.fn(() => callOrder.push('handler2'));
    const handler3 = vi.fn(() => callOrder.push('handler3'));

    const unsub1 = onAchievementStateChange(handler1);
    const unsub2 = onAchievementStateChange(handler2);
    const unsub3 = onAchievementStateChange(handler3);

    emitAchievementStateChange({
      type: 'progress',
      action: 'first',
      timestamp: Date.now(),
    });

    expect(callOrder).toEqual(['handler1', 'handler2', 'handler3']);

    unsub2();

    emitAchievementStateChange({
      type: 'progress',
      action: 'second',
      timestamp: Date.now(),
    });

    expect(callOrder).toEqual(['handler1', 'handler2', 'handler3', 'handler1', 'handler3']);

    unsub1();
    unsub3();
  });
});
