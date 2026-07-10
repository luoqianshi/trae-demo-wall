import { describe, it, expect } from 'vitest';
import { detectPattern, detectComparison, discover } from '../discovery-engine';
import type { ProfileRecord } from '../user-profile';

function createRecord(tags: string[], daysAgo: number = 0, content: string = 'test'): ProfileRecord {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    content,
    tags,
    mood: 'neutral',
    created_at: date.toISOString(),
  };
}

describe('detectPattern', () => {
  it('returns null when less than 3 records', () => {
    const records = [
      createRecord(['运动']),
      createRecord(['运动']),
    ];
    expect(detectPattern(records)).toBeNull();
  });

  it('returns null when no tag appears 3+ times', () => {
    const records = [
      createRecord(['运动']),
      createRecord(['阅读']),
      createRecord(['写作']),
      createRecord(['休息']),
      createRecord(['冥想']),
    ];
    expect(detectPattern(records)).toBeNull();
  });

  it('returns pattern when tag appears 3+ times in recent 5 records', () => {
    const records = [
      createRecord(['运动']),
      createRecord(['运动']),
      createRecord(['阅读']),
      createRecord(['运动']),
      createRecord(['休息']),
    ];
    const result = detectPattern(records);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('pattern');
    expect(result?.title).toContain('运动');
  });

  it('returns pattern from content keywords when tags are empty', () => {
    const records = [
      createRecord([], 0, '今天学习了新的编程知识'),
      createRecord([], 0, '继续学习编程，感觉进步了'),
      createRecord([], 0, '学习让我很开心'),
      createRecord([], 0, '休息一下'),
      createRecord([], 0, '又来学习了'),
    ];
    const result = detectPattern(records);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('pattern');
    expect(result?.title).toContain('学习');
  });

  it('combines tags and content keywords for pattern detection', () => {
    const records = [
      createRecord(['运动'], 0, '今天跑步了'),
      createRecord([], 0, '去健身房锻炼'),
      createRecord(['健康'], 0, '运动让人精神好'),
      createRecord([], 0, '散步放松'),
      createRecord([], 0, '其他事情'),
    ];
    const result = detectPattern(records);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('pattern');
  });
});

describe('detectComparison', () => {
  it('returns null when less than 3 records', () => {
    const records = [createRecord([]), createRecord([])];
    expect(detectComparison(records)).toBeNull();
  });

  it('returns null when no previous week records', () => {
    const records = [
      createRecord([], 1),
      createRecord([], 2),
      createRecord([], 3),
    ];
    expect(detectComparison(records)).toBeNull();
  });

  it('returns null when change is less than 30%', () => {
    const records = [
      createRecord([], 1),
      createRecord([], 2),
      createRecord([], 8),
      createRecord([], 9),
    ];
    expect(detectComparison(records)).toBeNull();
  });

  it('returns comparison when recent records increase by more than 30%', () => {
    const records = [
      createRecord([], 1),
      createRecord([], 2),
      createRecord([], 3),
      createRecord([], 4),
      createRecord([], 8),
    ];
    const result = detectComparison(records);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('comparison');
    expect(result?.title).toContain('加速成长');
  });
});

describe('discover', () => {
  it('prioritizes pattern over comparison', () => {
    const records = [
      createRecord(['运动']),
      createRecord(['运动']),
      createRecord(['运动']),
      createRecord([], 1),
      createRecord([], 2),
      createRecord([], 8),
      createRecord([], 9),
      createRecord([], 10),
    ];
    const result = discover(records);
    expect(result.hasDiscovery).toBe(true);
    expect(result.discovery?.type).toBe('pattern');
  });

  it('returns hasDiscovery false when no pattern detected', () => {
    const records = [
      createRecord(['运动']),
      createRecord(['阅读']),
      createRecord(['写作']),
    ];
    const result = discover(records);
    expect(result.hasDiscovery).toBe(false);
  });

  it('detects pattern from content when tags are missing', () => {
    const records = [
      createRecord([], 0, '今天完成了编程任务'),
      createRecord([], 0, '编程遇到bug但解决了'),
      createRecord([], 0, '编程学习笔记'),
    ];
    const result = discover(records);
    expect(result.hasDiscovery).toBe(true);
    expect(result.discovery?.type).toBe('pattern');
    expect(result.discovery?.title).toContain('编程');
  });
});
