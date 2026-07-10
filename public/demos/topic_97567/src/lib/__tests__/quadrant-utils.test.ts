import { describe, it, expect } from 'vitest';
import {
  calculateUrgency,
  calculateQuadrant,
  calculateBigTaskProgress,
  getUrgencyDisplay,
  getImportanceStars,
  getDaysUntilDue,
  getDueDateLabel,
  URGENCY_CONFIG,
  QUADRANT_CONFIG,
  DEFAULT_THRESHOLDS,
  type Thresholds,
  type UrgencyLevel,
  type QuadrantType,
} from '@/lib/quadrant-utils';

describe('calculateUrgency', () => {
  const baseDate = new Date('2026-05-15');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(baseDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return undefined when dueDate is null', () => {
    expect(calculateUrgency(null)).toBeUndefined();
  });

  it('should return undefined when dueDate is undefined', () => {
    expect(calculateUrgency(undefined)).toBeUndefined();
  });

  it('should return undefined when dueDate is empty string', () => {
    expect(calculateUrgency('')).toBeUndefined();
  });

  it('should return critical for due date within critical threshold', () => {
    const dueDate = new Date(baseDate.getTime() + 12 * 60 * 60 * 1000).toISOString();
    expect(calculateUrgency(dueDate)).toBe('critical');
  });

  it('should return high for due date within high threshold but above critical', () => {
    const dueDate = new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateUrgency(dueDate)).toBe('high');
  });

  it('should return medium for due date within medium threshold', () => {
    const dueDate = new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateUrgency(dueDate)).toBe('medium');
  });

  it('should return low for due date within low threshold', () => {
    const dueDate = new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateUrgency(dueDate)).toBe('low');
  });

  it('should return none for due date beyond all thresholds', () => {
    const dueDate = new Date(baseDate.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateUrgency(dueDate)).toBe('none');
  });

  it('should respect custom thresholds', () => {
    const customThresholds: Thresholds = {
      critical: 0,
      high: 1,
      medium: 3,
      low: 5,
      none: 10,
    };
    const dueDate = new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateUrgency(dueDate, customThresholds)).toBe('medium');
  });

  it('should return critical for overdue tasks', () => {
    const pastDate = new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateUrgency(pastDate)).toBe('critical');
  });
});

describe('calculateQuadrant', () => {
  it('should return undefined when importance is null', () => {
    expect(calculateQuadrant(null, 'high')).toBeUndefined();
  });

  it('should return undefined when importance is undefined', () => {
    expect(calculateQuadrant(undefined, 'high')).toBeUndefined();
  });

  it('should return undefined when urgency is null', () => {
    expect(calculateQuadrant(4, null)).toBeUndefined();
  });

  it('should return undefined when both importance and urgency are null', () => {
    expect(calculateQuadrant(null, null)).toBeUndefined();
  });

  it('should return Q1 for high importance + high urgency', () => {
    expect(calculateQuadrant(5, 'critical')).toBe(1);
    expect(calculateQuadrant(4, 'high')).toBe(1);
  });

  it('should return Q2 for high importance + low urgency', () => {
    expect(calculateQuadrant(5, 'none')).toBe(2);
    expect(calculateQuadrant(4, 'low')).toBe(2);
  });

  it('should return Q3 for low importance + high urgency', () => {
    expect(calculateQuadrant(1, 'critical')).toBe(3);
    expect(calculateQuadrant(3, 'high')).toBe(3);
  });

  it('should return Q4 for low importance + low urgency', () => {
    expect(calculateQuadrant(1, 'none')).toBe(4);
    expect(calculateQuadrant(3, 'low')).toBe(4);
  });

  it('should use 4 as threshold for importance', () => {
    expect(calculateQuadrant(3, 'critical')).toBe(3);
    expect(calculateQuadrant(4, 'critical')).toBe(1);
  });

  it('should use high and critical as urgent levels', () => {
    expect(calculateQuadrant(5, 'high')).toBe(1);
    expect(calculateQuadrant(5, 'critical')).toBe(1);
    expect(calculateQuadrant(5, 'medium')).toBe(2);
  });
});

describe('calculateBigTaskProgress', () => {
  it('should return 0 for empty subtasks array', () => {
    expect(calculateBigTaskProgress([])).toBe(0);
  });

  it('should return 0 when all subtasks are incomplete', () => {
    const subtasks = [
      { status: 'pending' },
      { status: 'pending' },
    ];
    expect(calculateBigTaskProgress(subtasks)).toBe(0);
  });

  it('should return 100 when all subtasks are completed', () => {
    const subtasks = [
      { status: 'completed' },
      { status: 'completed' },
    ];
    expect(calculateBigTaskProgress(subtasks)).toBe(100);
  });

  it('should return 50 when half of subtasks are completed', () => {
    const subtasks = [
      { status: 'completed' },
      { status: 'pending' },
    ];
    expect(calculateBigTaskProgress(subtasks)).toBe(50);
  });

  it('should handle mixed statuses correctly', () => {
    const subtasks = [
      { status: 'completed' },
      { status: 'completed' },
      { status: 'pending' },
      { status: 'pending' },
    ];
    expect(calculateBigTaskProgress(subtasks)).toBe(50);
  });

  it('should round the result', () => {
    const subtasks = [
      { status: 'completed' },
      { status: 'completed' },
      { status: 'completed' },
      { status: 'pending' },
      { status: 'pending' },
    ];
    expect(calculateBigTaskProgress(subtasks)).toBe(60);
  });

  it('should handle single subtask', () => {
    expect(calculateBigTaskProgress([{ status: 'completed' }])).toBe(100);
    expect(calculateBigTaskProgress([{ status: 'pending' }])).toBe(0);
  });
});

describe('getUrgencyDisplay', () => {
  it('should return empty values for undefined urgency', () => {
    const result = getUrgencyDisplay(undefined);
    expect(result.icon).toBe('');
    expect(result.label).toBe('');
    expect(result.color).toBe('');
  });

  it('should return empty values for null urgency', () => {
    const result = getUrgencyDisplay(null);
    expect(result.icon).toBe('');
    expect(result.label).toBe('');
    expect(result.color).toBe('');
  });

  it('should return correct config for each urgency level', () => {
    expect(getUrgencyDisplay('critical')).toEqual(URGENCY_CONFIG.critical);
    expect(getUrgencyDisplay('high')).toEqual(URGENCY_CONFIG.high);
    expect(getUrgencyDisplay('medium')).toEqual(URGENCY_CONFIG.medium);
    expect(getUrgencyDisplay('low')).toEqual(URGENCY_CONFIG.low);
    expect(getUrgencyDisplay('none')).toEqual(URGENCY_CONFIG.none);
  });
});

describe('getImportanceStars', () => {
  it('should return empty string for undefined', () => {
    expect(getImportanceStars(undefined)).toBe('');
  });

  it('should return empty string for null', () => {
    expect(getImportanceStars(null)).toBe('');
  });

  it('should return empty string for 0', () => {
    expect(getImportanceStars(0)).toBe('');
  });

  it('should return correct number of stars', () => {
    expect(getImportanceStars(1)).toBe('⭐');
    expect(getImportanceStars(3)).toBe('⭐⭐⭐');
    expect(getImportanceStars(5)).toBe('⭐⭐⭐⭐⭐');
  });
});

describe('getDaysUntilDue', () => {
  const baseDate = new Date('2026-05-15');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(baseDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return undefined for null', () => {
    expect(getDaysUntilDue(null)).toBeUndefined();
  });

  it('should return undefined for undefined', () => {
    expect(getDaysUntilDue(undefined)).toBeUndefined();
  });

  it('should return 0 for today', () => {
    const today = new Date('2026-05-15').toISOString().split('T')[0];
    expect(getDaysUntilDue(today)).toBe(0);
  });

  it('should return positive number for future dates', () => {
    const future = new Date('2026-05-20').toISOString().split('T')[0];
    expect(getDaysUntilDue(future)).toBe(5);
  });

  it('should return negative number for past dates', () => {
    const past = new Date('2026-05-12').toISOString().split('T')[0];
    expect(getDaysUntilDue(past)).toBe(-3);
  });
});

describe('getDueDateLabel', () => {
  it('should return empty string for null', () => {
    expect(getDueDateLabel(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(getDueDateLabel(undefined)).toBe('');
  });

  it('should return correct labels for dates', () => {
    expect(getDueDateLabel('2020-01-01')).toBe('已过期');
    expect(getDueDateLabel('2099-12-31')).toMatch(/月后/);
  });
});

describe('DEFAULT_THRESHOLDS', () => {
  it('should have valid numeric values', () => {
    expect(DEFAULT_THRESHOLDS.critical).toBe(1);
    expect(DEFAULT_THRESHOLDS.high).toBe(3);
    expect(DEFAULT_THRESHOLDS.medium).toBe(7);
    expect(DEFAULT_THRESHOLDS.low).toBe(14);
    expect(DEFAULT_THRESHOLDS.none).toBe(30);
  });

  it('should have thresholds in ascending order', () => {
    expect(DEFAULT_THRESHOLDS.critical).toBeLessThan(DEFAULT_THRESHOLDS.high);
    expect(DEFAULT_THRESHOLDS.high).toBeLessThan(DEFAULT_THRESHOLDS.medium);
    expect(DEFAULT_THRESHOLDS.medium).toBeLessThan(DEFAULT_THRESHOLDS.low);
    expect(DEFAULT_THRESHOLDS.low).toBeLessThan(DEFAULT_THRESHOLDS.none);
  });
});
