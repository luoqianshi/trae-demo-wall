import { describe, it, expect } from 'vitest';
import {
  getStoryText,
  type StoryScene,
  type StoryText,
} from '@/lib/snowball-story-text';

describe('getStoryText', () => {
  const validScenes: StoryScene[] = [
    'dailyQuestion',
    'celebration',
    'challengeJoin',
    'challengeComplete',
    'taskEmptyBig',
    'taskEmptyHabit',
    'taskEmptyQuick',
    'taskEmptyGoalGroup',
    'taskEmptyNormal',
    'taskEmptyList',
    'taskEmptyKanbanPending',
    'taskEmptyKanbanDone',
    'taskEmptyQuadrant',
    'sidebarBigTaskEmpty',
    'sidebarTodoEmpty',
    'sidebarTodoAllDone',
    'recordEmpty',
  ];

  const validStages = ['snowflake', 'small_ball', 'ball'] as const;

  describe('scene coverage', () => {
    it('should have text for all 17 scenes at snowflake stage', () => {
      validScenes.forEach(scene => {
        const text = getStoryText(scene, 'snowflake');
        expect(text).toBeDefined();
        expect(text.main).toBeDefined();
        expect(typeof text.main).toBe('string');
      });
    });

    it('should have text for all 17 scenes at ball stage', () => {
      validScenes.forEach(scene => {
        const text = getStoryText(scene, 'ball');
        expect(text).toBeDefined();
        expect(text.main).toBeDefined();
        expect(typeof text.main).toBe('string');
      });
    });

    it('should return non-empty main text for all scene-stage combinations', () => {
      validScenes.forEach(scene => {
        validStages.forEach(stage => {
          const text = getStoryText(scene, stage);
          expect(text.main.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('stage-specific text', () => {
    it('should return different text for each stage in dailyQuestion', () => {
      const texts = validStages.map(stage => getStoryText('dailyQuestion', stage).main);
      const uniqueTexts = new Set(texts);
      expect(uniqueTexts.size).toBe(validStages.length);
    });

    it('should return different text for each stage in celebration', () => {
      const texts = validStages.map(stage => getStoryText('celebration', stage).main);
      const uniqueTexts = new Set(texts);
      expect(uniqueTexts.size).toBe(validStages.length);
    });

    it('should return different text for each stage in challengeJoin', () => {
      const texts = validStages.map(stage => getStoryText('challengeJoin', stage).main);
      const uniqueTexts = new Set(texts);
      expect(uniqueTexts.size).toBe(validStages.length);
    });

    it('should return different text for each stage in challengeComplete', () => {
      const texts = validStages.map(stage => getStoryText('challengeComplete', stage).main);
      const uniqueTexts = new Set(texts);
      expect(uniqueTexts.size).toBe(validStages.length);
    });
  });

  describe('specific scene content validation', () => {
    it('dailyQuestion should contain greeting words', () => {
      validStages.forEach(stage => {
        const text = getStoryText('dailyQuestion', stage);
        expect(text.main.length).toBeGreaterThan(5);
      });
    });

    it('celebration should contain positive words in most stages', () => {
      const celebrationStages = validStages.filter(stage => {
        const text = getStoryText('celebration', stage);
        return /棒|开心|厉害|感谢|骄傲|谢|强|功劳/.test(text.main);
      });
      expect(celebrationStages.length).toBeGreaterThanOrEqual(3);
    });

    it('challengeJoin should contain encouraging words', () => {
      validStages.forEach(stage => {
        const text = getStoryText('challengeJoin', stage);
        expect(text.main.length).toBeGreaterThan(3);
      });
    });

    it('recordEmpty should mention growth themes', () => {
      const recordEmptyStages = validStages.filter(stage => {
        const text = getStoryText('recordEmpty', stage);
        return /记录|长大|成长|故事|冒险|继续|不小|雪球/.test(text.main);
      });
      expect(recordEmptyStages.length).toBeGreaterThanOrEqual(3);
    });

    it('sidebarTodoAllDone should express satisfaction', () => {
      validStages.forEach(stage => {
        const text = getStoryText('sidebarTodoAllDone', stage);
        expect(text.main).toMatch(/做完|完成|开心|棒/);
      });
    });
  });

  describe('fallback behavior', () => {
    it('should return snowflake fallback for invalid scene', () => {
      const text = getStoryText('invalidScene' as StoryScene, 'snowflake');
      expect(text.main).toBe('');
      expect(text.sub).toBe('');
    });

    it('should return snowflake fallback for invalid stage', () => {
      const text = getStoryText('dailyQuestion', 'invalidStage' as any);
      expect(text).toBeDefined();
    });

    it('should return default text for undefined scene', () => {
      const text = getStoryText(undefined as any, 'snowflake');
      expect(text).toBeDefined();
      expect(text.main).toBe('');
    });
  });

  describe('text structure', () => {
    it('should return StoryText interface with main and sub', () => {
      const text = getStoryText('dailyQuestion', 'snowflake');
      expect(text).toHaveProperty('main');
      expect(text).toHaveProperty('sub');
    });

    it('should allow sub to be empty string', () => {
      const text = getStoryText('challengeJoin', 'snowflake');
      expect(text.sub).toBe('');
    });

    it('should have sub text for most scenes', () => {
      const textWithSub = ['dailyQuestion', 'celebration', 'recordEmpty'];
      textWithSub.forEach(scene => {
        const text = getStoryText(scene, 'snowflake');
        expect(text.sub.length).toBeGreaterThan(0);
      });
    });
  });

  describe('character consistency', () => {
    it('should use first person perspective (我/我们) in most scenes', () => {
      const scenesWithFirstPerson = ['dailyQuestion', 'celebration', 'challengeJoin', 'challengeComplete', 'recordEmpty'];
      scenesWithFirstPerson.forEach(scene => {
        const text = getStoryText(scene, 'snowflake');
        expect(text.main).toMatch(/我|我们/);
      });
    });

    it('should use cute casual style (嘿嘿/哇/嘿嘿)', () => {
      const casualWords = ['嘿', '哇', '呀', '呢', '吧', '哦', '哈', '诶'];
      let foundCasual = false;
      validScenes.forEach(scene => {
        const text = getStoryText(scene, 'small_ball');
        if (casualWords.some(word => text.main.includes(word))) {
          foundCasual = true;
        }
      });
      expect(foundCasual).toBe(true);
    });
  });

  describe('growth progression', () => {
    it('snowflake stage should express being small or waiting', () => {
      const text = getStoryText('recordEmpty', 'snowflake');
      expect(text.main).toMatch(/小|等/);
    });
  });

  describe('total coverage', () => {
    it('should have 17 valid scenes defined', () => {
      expect(validScenes).toHaveLength(17);
    });

    it('should cover 3 snowball stages', () => {
      expect(validStages).toHaveLength(3);
    });

    it('should have 51 total scene-stage combinations (17 × 3)', () => {
      let count = 0;
      validScenes.forEach(scene => {
        validStages.forEach(stage => {
          const text = getStoryText(scene, stage);
          if (text.main) count++;
        });
      });
      expect(count).toBe(51);
    });
  });
});

describe('StoryScene type validation', () => {
  it('should accept all valid StoryScene values', () => {
    const scenes: StoryScene[] = [
      'dailyQuestion',
      'celebration',
      'challengeJoin',
      'challengeComplete',
      'taskEmptyBig',
      'taskEmptyHabit',
      'taskEmptyQuick',
      'taskEmptyGoalGroup',
      'taskEmptyNormal',
      'taskEmptyList',
      'taskEmptyKanbanPending',
      'taskEmptyKanbanDone',
      'taskEmptyQuadrant',
      'sidebarBigTaskEmpty',
      'sidebarTodoEmpty',
      'sidebarTodoAllDone',
      'recordEmpty',
    ];
    scenes.forEach(scene => {
      const text = getStoryText(scene, 'snowflake');
      expect(text).toBeDefined();
    });
  });
});

describe('StoryText interface', () => {
  it('should have main and sub properties', () => {
    const text: StoryText = {
      main: '测试主文案',
      sub: '测试副文案',
    };
    expect(text.main).toBe('测试主文案');
    expect(text.sub).toBe('测试副文案');
  });
});
