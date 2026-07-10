import { describe, it, expect } from 'vitest';
import {
  buildUserProfile,
  buildProfileSummary,
  type ProfileRecord,
  type UserProfile,
} from '../user-profile';

function createRecord(overrides: Partial<ProfileRecord> = {}): ProfileRecord {
  return {
    content: '测试内容',
    tags: [],
    mood: 'neutral',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

describe('buildUserProfile', () => {
  describe('empty input handling', () => {
    it('should return default profile for empty records array', () => {
      const profile = buildUserProfile([]);
      expect(profile.topicPreference).toEqual([]);
      expect(profile.emotionBaseline).toBe('neutral');
      expect(profile.growthStage).toBe('newcomer');
      expect(profile.selfTalkPattern).toBe('neutral');
    });

    it('should return default profile for null input', () => {
      const profile = buildUserProfile(null as any);
      expect(profile.topicPreference).toEqual([]);
      expect(profile.emotionBaseline).toBe('neutral');
      expect(profile.growthStage).toBe('newcomer');
      expect(profile.selfTalkPattern).toBe('neutral');
    });

    it('should return default profile for undefined input', () => {
      const profile = buildUserProfile(undefined as any);
      expect(profile.topicPreference).toEqual([]);
      expect(profile.emotionBaseline).toBe('neutral');
      expect(profile.growthStage).toBe('newcomer');
      expect(profile.selfTalkPattern).toBe('neutral');
    });
  });

  describe('topicPreference calculation', () => {
    it('should extract top 3 tags by frequency', () => {
      const records = [
        createRecord({ tags: ['运动', '健康'] }),
        createRecord({ tags: ['运动', '健身'] }),
        createRecord({ tags: ['运动'] }),
        createRecord({ tags: ['阅读', '学习'] }),
        createRecord({ tags: ['阅读'] }),
      ];
      const profile = buildUserProfile(records);
      expect(profile.topicPreference).toEqual(['运动', '阅读', '健康']);
    });

    it('should return empty array when no tags', () => {
      const records = [
        createRecord({ tags: [] }),
        createRecord({ tags: [] }),
      ];
      const profile = buildUserProfile(records);
      expect(profile.topicPreference).toEqual([]);
    });

    it('should handle records with missing tags field', () => {
      const records = [
        { content: 'test1', created_at: new Date().toISOString() } as ProfileRecord,
        { content: 'test2', tags: ['运动'], created_at: new Date().toISOString() } as ProfileRecord,
      ];
      const profile = buildUserProfile(records);
      expect(profile.topicPreference).toContain('运动');
    });

    it('should limit to 3 tags maximum', () => {
      const records = [
        createRecord({ tags: ['A', 'B', 'C', 'D', 'E'] }),
      ];
      const profile = buildUserProfile(records);
      expect(profile.topicPreference.length).toBeLessThanOrEqual(3);
    });

    it('should only analyze records within last 7 days', () => {
      const records = [
        createRecord({ tags: ['旧标签'], created_at: daysAgo(10) }),
        createRecord({ tags: ['新标签1'], created_at: daysAgo(3) }),
        createRecord({ tags: ['新标签2'], created_at: daysAgo(5) }),
        createRecord({ tags: ['新标签3'], created_at: daysAgo(6) }),
      ];
      const profile = buildUserProfile(records);
      expect(profile.topicPreference).toEqual(['新标签1', '新标签2', '新标签3']);
      expect(profile.topicPreference).not.toContain('旧标签');
    });

    it('should fall back to all records when no recent records exist', () => {
      const records = [
        createRecord({ tags: ['旧标签'], created_at: daysAgo(10) }),
        createRecord({ tags: ['旧标签'], created_at: daysAgo(15) }),
      ];
      const profile = buildUserProfile(records);
      expect(profile.topicPreference).toContain('旧标签');
    });
  });

  describe('emotionBaseline calculation', () => {
    it('should return positive for happy mood', () => {
      const records = [createRecord({ mood: 'happy' })];
      const profile = buildUserProfile(records);
      expect(profile.emotionBaseline).toBe('positive');
    });

    it('should return positive for proud mood', () => {
      const records = [createRecord({ mood: 'proud' })];
      const profile = buildUserProfile(records);
      expect(profile.emotionBaseline).toBe('positive');
    });

    it('should return positive for excited mood', () => {
      const records = [createRecord({ mood: 'excited' })];
      const profile = buildUserProfile(records);
      expect(profile.emotionBaseline).toBe('positive');
    });

    it('should return positive for grateful mood', () => {
      const records = [createRecord({ mood: 'grateful' })];
      const profile = buildUserProfile(records);
      expect(profile.emotionBaseline).toBe('positive');
    });

    it('should return neutral for calm mood', () => {
      const records = [createRecord({ mood: 'calm' })];
      const profile = buildUserProfile(records);
      expect(profile.emotionBaseline).toBe('neutral');
    });

    it('should return depressed for sad mood', () => {
      const records = [createRecord({ mood: 'sad' })];
      const profile = buildUserProfile(records);
      expect(profile.emotionBaseline).toBe('depressed');
    });

    it('should return anxious for stressed mood', () => {
      const records = [createRecord({ mood: 'stressed' })];
      const profile = buildUserProfile(records);
      expect(profile.emotionBaseline).toBe('anxious');
    });

    it('should return negative for angry mood', () => {
      const records = [createRecord({ mood: 'angry' })];
      const profile = buildUserProfile(records);
      expect(profile.emotionBaseline).toBe('negative');
    });

    it('should return negative for frustrated mood', () => {
      const records = [createRecord({ mood: 'frustrated' })];
      const profile = buildUserProfile(records);
      expect(profile.emotionBaseline).toBe('negative');
    });

    it('should return neutral for unknown mood', () => {
      const records = [createRecord({ mood: 'unknown' })];
      const profile = buildUserProfile(records);
      expect(profile.emotionBaseline).toBe('neutral');
    });

    it('should return dominant emotion when multiple records exist', () => {
      const records = [
        createRecord({ mood: 'happy' }),
        createRecord({ mood: 'happy' }),
        createRecord({ mood: 'sad' }),
      ];
      const profile = buildUserProfile(records);
      expect(profile.emotionBaseline).toBe('positive');
    });

    it('should return neutral for empty records', () => {
      const profile = buildUserProfile([]);
      expect(profile.emotionBaseline).toBe('neutral');
    });
  });

  describe('growthStage calculation', () => {
    it('should return newcomer for less than 10 records', () => {
      const records = Array(9).fill(null).map(() => createRecord());
      const profile = buildUserProfile(records);
      expect(profile.growthStage).toBe('newcomer');
    });

    it('should return newcomer for exactly 9 records', () => {
      const records = Array(9).fill(null).map(() => createRecord());
      const profile = buildUserProfile(records);
      expect(profile.growthStage).toBe('newcomer');
    });

    it('should return growing for 10-49 records', () => {
      const records = Array(25).fill(null).map(() => createRecord());
      const profile = buildUserProfile(records);
      expect(profile.growthStage).toBe('growing');
    });

    it('should return growing for exactly 49 records', () => {
      const records = Array(49).fill(null).map(() => createRecord());
      const profile = buildUserProfile(records);
      expect(profile.growthStage).toBe('growing');
    });

    it('should return mature for 50 or more records', () => {
      const records = Array(50).fill(null).map(() => createRecord());
      const profile = buildUserProfile(records);
      expect(profile.growthStage).toBe('mature');
    });

    it('should return mature for large number of records', () => {
      const records = Array(200).fill(null).map(() => createRecord());
      const profile = buildUserProfile(records);
      expect(profile.growthStage).toBe('mature');
    });
  });

  describe('selfTalkPattern calculation', () => {
    it('should return positive for positive self-talk content', () => {
      const records = [
        createRecord({ content: '今天做到了！' }),
        createRecord({ content: '继续保持进步！' }),
      ];
      const profile = buildUserProfile(records);
      expect(profile.selfTalkPattern).toBe('positive');
    });

    it('should return negative for negative self-talk content', () => {
      const records = [
        createRecord({ content: '做不到啊' }),
        createRecord({ content: '太失败了' }),
        createRecord({ content: '真是没用啊' }),
      ];
      const profile = buildUserProfile(records);
      expect(profile.selfTalkPattern).toBe('negative');
    });

    it('should return neutral when no keywords match', () => {
      const records = [
        createRecord({ content: '今天天气不错' }),
        createRecord({ content: '吃了午餐' }),
      ];
      const profile = buildUserProfile(records);
      expect(profile.selfTalkPattern).toBe('neutral');
    });

    it('should return neutral for balanced positive and negative', () => {
      const records = [
        createRecord({ content: '做到了！' }),
        createRecord({ content: '失败了一次' }),
      ];
      const profile = buildUserProfile(records);
      expect(profile.selfTalkPattern).toBe('neutral');
    });

    it('should require 1.5x ratio for pattern classification', () => {
      const records = [
        createRecord({ content: '做到了' }),
        createRecord({ content: '失败了一次' }),
      ];
      const profile = buildUserProfile(records);
      expect(profile.selfTalkPattern).toBe('neutral');
    });

    it('should detect negative pattern with 1.5x ratio', () => {
      const records = [
        createRecord({ content: '做不到' }),
        createRecord({ content: '做不到' }),
        createRecord({ content: '做不到' }),
        createRecord({ content: '失败' }),
      ];
      const profile = buildUserProfile(records);
      expect(profile.selfTalkPattern).toBe('negative');
    });

    it('should detect positive pattern with 1.5x ratio', () => {
      const records = [
        createRecord({ content: '做到了！' }),
        createRecord({ content: '做到了！' }),
        createRecord({ content: '坚持进步了' }),
        createRecord({ content: '失败了一次' }),
        createRecord({ content: '失败了一次' }),
      ];
      const profile = buildUserProfile(records);
      expect(profile.selfTalkPattern).toBe('positive');
    });

    it('should handle content with multiple keywords', () => {
      const records = [
        createRecord({ content: '做不到，太失败了，感觉自己是废物' }),
      ];
      const profile = buildUserProfile(records);
      expect(profile.selfTalkPattern).toBe('negative');
    });

    it('should handle empty content', () => {
      const records = [
        createRecord({ content: '' }),
      ];
      const profile = buildUserProfile(records);
      expect(profile.selfTalkPattern).toBe('neutral');
    });

    it('should handle undefined content', () => {
      const records = [
        { content: undefined as any, tags: [], mood: 'neutral', created_at: new Date().toISOString() },
      ];
      const profile = buildUserProfile(records);
      expect(profile.selfTalkPattern).toBe('neutral');
    });
  });

  describe('profile structure', () => {
    it('should return complete profile with all required fields', () => {
      const records = [createRecord()];
      const profile = buildUserProfile(records);
      expect(profile).toHaveProperty('topicPreference');
      expect(profile).toHaveProperty('emotionBaseline');
      expect(profile).toHaveProperty('growthStage');
      expect(profile).toHaveProperty('selfTalkPattern');
    });

    it('should return UserProfile interface type', () => {
      const records = [createRecord()];
      const profile: UserProfile = buildUserProfile(records);
      expect(Array.isArray(profile.topicPreference)).toBe(true);
      expect(typeof profile.emotionBaseline).toBe('string');
      expect(typeof profile.growthStage).toBe('string');
      expect(typeof profile.selfTalkPattern).toBe('string');
    });
  });
});

describe('buildProfileSummary', () => {
  it('should include growth stage in summary', () => {
    const profile: UserProfile = {
      topicPreference: [],
      emotionBaseline: 'neutral',
      growthStage: 'newcomer',
      selfTalkPattern: 'neutral',
    };
    const summary = buildProfileSummary(profile);
    expect(summary).toContain('新手期');
  });

  it('should include emotion baseline in summary', () => {
    const profile: UserProfile = {
      topicPreference: [],
      emotionBaseline: 'positive',
      growthStage: 'newcomer',
      selfTalkPattern: 'neutral',
    };
    const summary = buildProfileSummary(profile);
    expect(summary).toContain('积极');
  });

  it('should include self-talk pattern in summary', () => {
    const profile: UserProfile = {
      topicPreference: [],
      emotionBaseline: 'neutral',
      growthStage: 'newcomer',
      selfTalkPattern: 'positive',
    };
    const summary = buildProfileSummary(profile);
    expect(summary).toContain('积极自我对话');
  });

  it('should include topics when available', () => {
    const profile: UserProfile = {
      topicPreference: ['运动', '阅读', '写作'],
      emotionBaseline: 'neutral',
      growthStage: 'newcomer',
      selfTalkPattern: 'neutral',
    };
    const summary = buildProfileSummary(profile);
    expect(summary).toContain('运动');
    expect(summary).toContain('阅读');
    expect(summary).toContain('写作');
  });

  it('should not include topics section when empty', () => {
    const profile: UserProfile = {
      topicPreference: [],
      emotionBaseline: 'neutral',
      growthStage: 'newcomer',
      selfTalkPattern: 'neutral',
    };
    const summary = buildProfileSummary(profile);
    expect(summary).not.toContain('关注话题');
  });

  it('should separate sections with semicolon', () => {
    const profile: UserProfile = {
      topicPreference: ['运动'],
      emotionBaseline: 'positive',
      growthStage: 'growing',
      selfTalkPattern: 'positive',
    };
    const summary = buildProfileSummary(profile);
    expect(summary).toContain('；');
  });

  it('should handle mature growth stage', () => {
    const profile: UserProfile = {
      topicPreference: [],
      emotionBaseline: 'neutral',
      growthStage: 'mature',
      selfTalkPattern: 'neutral',
    };
    const summary = buildProfileSummary(profile);
    expect(summary).toContain('成熟期');
  });

  it('should handle depressed emotion baseline', () => {
    const profile: UserProfile = {
      topicPreference: [],
      emotionBaseline: 'depressed',
      growthStage: 'newcomer',
      selfTalkPattern: 'neutral',
    };
    const summary = buildProfileSummary(profile);
    expect(summary).toContain('低落');
  });

  it('should handle anxious emotion baseline', () => {
    const profile: UserProfile = {
      topicPreference: [],
      emotionBaseline: 'anxious',
      growthStage: 'newcomer',
      selfTalkPattern: 'neutral',
    };
    const summary = buildProfileSummary(profile);
    expect(summary).toContain('焦虑');
  });

  it('should handle negative self-talk pattern', () => {
    const profile: UserProfile = {
      topicPreference: [],
      emotionBaseline: 'neutral',
      growthStage: 'newcomer',
      selfTalkPattern: 'negative',
    };
    const summary = buildProfileSummary(profile);
    expect(summary).toContain('消极自我对话');
  });

  it('should handle all positive attributes', () => {
    const profile: UserProfile = {
      topicPreference: ['运动', '阅读', '冥想'],
      emotionBaseline: 'positive',
      growthStage: 'mature',
      selfTalkPattern: 'positive',
    };
    const summary = buildProfileSummary(profile);
    expect(summary).toContain('成熟期');
    expect(summary).toContain('积极');
    expect(summary).toContain('积极自我对话');
    expect(summary).toContain('运动');
  });

  it('should handle unknown growth stage values', () => {
    const profile: UserProfile = {
      topicPreference: [],
      emotionBaseline: 'neutral',
      growthStage: 'unknown_stage',
      selfTalkPattern: 'neutral',
    };
    const summary = buildProfileSummary(profile);
    expect(summary).toContain('unknown_stage');
  });

  it('should handle unknown emotion baseline values', () => {
    const profile: UserProfile = {
      topicPreference: [],
      emotionBaseline: 'unknown_emotion',
      growthStage: 'newcomer',
      selfTalkPattern: 'neutral',
    };
    const summary = buildProfileSummary(profile);
    expect(summary).toContain('unknown_emotion');
  });

  it('should return non-empty string for valid profile', () => {
    const profile: UserProfile = {
      topicPreference: [],
      emotionBaseline: 'neutral',
      growthStage: 'newcomer',
      selfTalkPattern: 'neutral',
    };
    const summary = buildProfileSummary(profile);
    expect(summary.length).toBeGreaterThan(0);
  });
});

describe('integration: buildUserProfile + buildProfileSummary', () => {
  it('should generate meaningful summary for new user', () => {
    const records = [
      createRecord({ mood: 'happy', tags: ['运动'], content: '今天跑步很舒服' }),
      createRecord({ mood: 'happy', tags: ['运动'], content: '坚持锻炼做到了' }),
      createRecord({ mood: 'excited', tags: ['运动', '健康'], content: '体能进步了' }),
    ];
    const profile = buildUserProfile(records);
    const summary = buildProfileSummary(profile);

    expect(summary).toContain('运动');
    expect(profile.topicPreference).toContain('运动');
    expect(profile.emotionBaseline).toBe('positive');
    expect(summary).toContain('积极');
  });

  it('should generate meaningful summary for struggling user', () => {
    const records = Array(20).fill(null).map((_, i) =>
      createRecord({
        mood: 'sad',
        tags: ['工作'],
        content: `感觉做不到第${i}次`,
      })
    );
    const profile = buildUserProfile(records);
    const summary = buildProfileSummary(profile);

    expect(profile.growthStage).toBe('growing');
    expect(profile.emotionBaseline).toBe('depressed');
    expect(profile.selfTalkPattern).toBe('negative');
    expect(summary).toContain('低落');
    expect(summary).toContain('消极自我对话');
  });

  it('should handle real-world mixed content', () => {
    const records = [
      createRecord({ mood: 'happy', tags: ['写作'], content: '完成了文章写作，很有成就感！' }),
      createRecord({ mood: 'okay', tags: ['阅读'], content: '今天读了一本书的第三章' }),
      createRecord({ mood: 'proud', tags: ['运动'], content: '坚持晨跑第5天，做到了！' }),
      createRecord({ mood: 'calm', tags: ['冥想'], content: '完成了10分钟冥想' }),
      createRecord({ mood: 'grateful', tags: ['人际'], content: '和朋友深入交流，很开心' }),
      createRecord({ mood: 'excited', tags: ['学习'], content: '学会了新技能，有进步！' }),
      createRecord({ mood: 'happy', tags: ['健康'], content: '早睡早起，感觉状态很好' }),
    ];
    const profile = buildUserProfile(records);

    expect(profile.topicPreference.length).toBeGreaterThan(0);
    expect(profile.emotionBaseline).toBe('positive');
    expect(profile.growthStage).toBe('newcomer');
    expect(profile.selfTalkPattern).toBe('positive');
  });
});
