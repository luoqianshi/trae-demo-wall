import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAddScoreEvent, mockGetScoreEvents } = vi.hoisted(() => ({
  mockAddScoreEvent: vi.fn(),
  mockGetScoreEvents: vi.fn(),
}));

vi.mock('@/lib/local-db', () => ({
  addScoreEvent: mockAddScoreEvent,
  getScoreEvents: mockGetScoreEvents,
}));

import {
  addScoreEvent,
  calculateEventScore,
  calculateTodayEventScore,
} from '../score-engine';
import { SCORE_VALUES } from '../snowball-score';

beforeEach(() => {
  vi.clearAllMocks();
  mockAddScoreEvent.mockImplementation((data: any) => ({
    id: 'test-id',
    ...data,
  }));
});

describe('addScoreEvent', () => {
  it('should write a score event with SCORE_VALUES lookup', () => {
    const event = addScoreEvent('user-1', 'RECORD_CREATED');
    expect(mockAddScoreEvent).toHaveBeenCalledWith({
      user_id: 'user-1',
      action: 'RECORD_CREATED',
      score: SCORE_VALUES.RECORD_CREATED,
      ref_id: undefined,
      created_at: expect.any(String),
    });
    expect(event.score).toBe(SCORE_VALUES.RECORD_CREATED);
  });

  it('should pass ref_id when provided', () => {
    addScoreEvent('user-1', 'RECORD_CREATED', 'record-123');
    expect(mockAddScoreEvent).toHaveBeenCalledWith(
      expect.objectContaining({ ref_id: 'record-123' })
    );
  });
});

describe('calculateEventScore', () => {
  it('should sum all event scores for a user', () => {
    mockGetScoreEvents.mockReturnValue([
      { id: '1', user_id: 'user-1', action: 'RECORD_CREATED', score: 5, created_at: '2026-05-19T10:00:00.000Z' },
      { id: '2', user_id: 'user-1', action: 'TASK_NORMAL_COMPLETED', score: 5, created_at: '2026-05-19T11:00:00.000Z' },
    ]);
    expect(calculateEventScore('user-1')).toBe(10);
  });

  it('should return 0 for user with no events', () => {
    mockGetScoreEvents.mockReturnValue([]);
    expect(calculateEventScore('user-1')).toBe(0);
  });
});

describe('calculateTodayEventScore', () => {
  it('should sum only events created today', () => {
    const today = new Date().toISOString().split('T')[0];
    mockGetScoreEvents.mockReturnValue([
      { id: '1', user_id: 'user-1', action: 'RECORD_CREATED', score: 5, created_at: `${today}T10:00:00.000Z` },
      { id: '2', user_id: 'user-1', action: 'RECORD_CREATED', score: 5, created_at: `${today}T11:00:00.000Z` },
      { id: '3', user_id: 'user-1', action: 'RECORD_CREATED', score: 5, created_at: '2026-05-18T10:00:00.000Z' },
    ]);
    expect(calculateTodayEventScore('user-1')).toBe(10);
  });

  it('should return 0 if no events today', () => {
    mockGetScoreEvents.mockReturnValue([
      { id: '1', user_id: 'user-1', action: 'RECORD_CREATED', score: 5, created_at: '2026-05-18T10:00:00.000Z' },
    ]);
    expect(calculateTodayEventScore('user-1')).toBe(0);
  });
});
