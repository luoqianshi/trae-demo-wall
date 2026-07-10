import { describe, it, expect, beforeEach } from 'vitest';
import { achievementDefinitions } from '@/lib/data-models';
import {
  evaluateCondition,
  calculateProgress,
  getAchievementsByCategory,
  getAchievementChain,
  ACHIEVEMENT_CONDITIONS,
} from '../achievement-engine';

describe('Achievement Engine', () => {
  describe('ACHIEVEMENT_CONDITIONS registry', () => {
    it('should have a condition function for every non-master achievement', () => {
      const nonMaster = achievementDefinitions.filter(a => a.id !== 'master_all');
      for (const ach of nonMaster) {
        expect(ACHIEVEMENT_CONDITIONS[ach.id]).toBeDefined();
        expect(typeof ACHIEVEMENT_CONDITIONS[ach.id].evaluate).toBe('function');
      }
    });
  });

  describe('evaluateCondition', () => {
    it('should return true for records_1 when records_count >= 1', () => {
      expect(evaluateCondition('records_1', { records_count: 1 })).toBe(true);
    });

    it('should return false for records_1 when records_count = 0', () => {
      expect(evaluateCondition('records_1', { records_count: 0 })).toBe(false);
    });

    it('should return true for challenge_all_types when all challenge types completed', () => {
      expect(evaluateCondition('challenge_all_types', {
        bronze_completed: 1,
        silver_completed: 1,
        gold_completed: 1,
      })).toBe(true);
    });

    it('should return false for challenge_all_types when missing a type', () => {
      expect(evaluateCondition('challenge_all_types', {
        bronze_completed: 1,
        silver_completed: 0,
        gold_completed: 1,
      })).toBe(false);
    });

    it('should return true for hidden_midnight when midnight_record is true', () => {
      expect(evaluateCondition('hidden_midnight', { midnight_record: true })).toBe(true);
    });

    it('should return false for hidden_midnight when midnight_record is false', () => {
      expect(evaluateCondition('hidden_midnight', { midnight_record: false })).toBe(false);
    });

    it('should return true for hidden_perfect when record_500_words is true', () => {
      expect(evaluateCondition('hidden_perfect', { record_500_words: true })).toBe(true);
    });

    it('should return false for unknown achievement id', () => {
      expect(evaluateCondition('nonexistent', { records_count: 100 })).toBe(false);
    });
  });

  describe('calculateProgress', () => {
    it('should return 1.0 for records_1 when records_count >= 1', () => {
      expect(calculateProgress('records_1', { records_count: 1 })).toBe(1);
    });

    it('should return 0.5 for records_30 when records_count = 15', () => {
      expect(calculateProgress('records_30', { records_count: 15 })).toBeCloseTo(0.5);
    });

    it('should return 0 for streak_7 when streak_days = 0', () => {
      expect(calculateProgress('streak_7', { streak_days: 0 })).toBe(0);
    });

    it('should cap progress at 1.0', () => {
      expect(calculateProgress('records_1', { records_count: 100 })).toBe(1);
    });

    it('should return 0 or 1 for boolean conditions', () => {
      expect(calculateProgress('hidden_midnight', { midnight_record: false })).toBe(0);
      expect(calculateProgress('hidden_midnight', { midnight_record: true })).toBe(1);
    });

    it('should return 0 for unknown achievement id', () => {
      expect(calculateProgress('nonexistent', { records_count: 100 })).toBe(0);
    });

    it('should calculate progress for streak achievements', () => {
      expect(calculateProgress('streak_30', { streak_days: 15 })).toBeCloseTo(0.5);
      expect(calculateProgress('streak_365', { streak_days: 182 })).toBeCloseTo(182 / 365, 1);
    });

    it('should calculate progress for interaction achievements', () => {
      expect(calculateProgress('interact_50', { snowball_interactions: 25 })).toBeCloseTo(0.5);
    });
  });

  describe('getAchievementsByCategory', () => {
    it('should group achievements by category', () => {
      const grouped = getAchievementsByCategory();
      expect(grouped['记录']).toBeDefined();
      expect(grouped['记录'].length).toBe(8);
      expect(grouped['连续']).toBeDefined();
      expect(grouped['连续'].length).toBe(8);
      expect(grouped['隐藏']).toBeDefined();
      expect(grouped['隐藏'].length).toBe(3);
    });

    it('should include all categories', () => {
      const grouped = getAchievementsByCategory();
      const categories = Object.keys(grouped);
      expect(categories).toContain('记录');
      expect(categories).toContain('连续');
      expect(categories).toContain('挑战');
      expect(categories).toContain('任务');
      expect(categories).toContain('互动');
      expect(categories).toContain('隐藏');
      expect(categories).toContain('急救');
      expect(categories).toContain('大师');
    });
  });

  describe('getAchievementChain', () => {
    it('should return ordered chain for records category', () => {
      const chain = getAchievementChain('记录');
      expect(chain[0].id).toBe('records_1');
      expect(chain[chain.length - 1].id).toBe('records_200');
    });

    it('should return ordered chain for streak category', () => {
      const chain = getAchievementChain('连续');
      expect(chain[0].id).toBe('streak_3');
      expect(chain[chain.length - 1].id).toBe('streak_365');
    });

    it('should return empty array for unknown category', () => {
      const chain = getAchievementChain('未知');
      expect(chain).toHaveLength(0);
    });
  });
});
