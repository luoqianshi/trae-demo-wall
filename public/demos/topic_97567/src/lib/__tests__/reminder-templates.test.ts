import { describe, it, expect, vi } from 'vitest';
import { REMINDER_TEMPLATES, getReminderText, type ReminderType } from '../reminder-templates';

describe('Reminder Templates', () => {
  describe('REMINDER_TEMPLATES', () => {
    it('should have all reminder types defined', () => {
      expect(REMINDER_TEMPLATES).toHaveProperty('daily');
      expect(REMINDER_TEMPLATES).toHaveProperty('caring');
      expect(REMINDER_TEMPLATES).toHaveProperty('welcome_back');
      expect(REMINDER_TEMPLATES).toHaveProperty('milestone');
    });

    it('should have at least one template per reminder type', () => {
      expect(REMINDER_TEMPLATES.daily.length).toBeGreaterThan(0);
      expect(REMINDER_TEMPLATES.caring.length).toBeGreaterThan(0);
      expect(REMINDER_TEMPLATES.welcome_back.length).toBeGreaterThan(0);
      expect(REMINDER_TEMPLATES.milestone.length).toBeGreaterThan(0);
    });

    it('should have 3 templates per reminder type', () => {
      expect(REMINDER_TEMPLATES.daily).toHaveLength(3);
      expect(REMINDER_TEMPLATES.caring).toHaveLength(3);
      expect(REMINDER_TEMPLATES.welcome_back).toHaveLength(3);
      expect(REMINDER_TEMPLATES.milestone).toHaveLength(3);
    });

    it('should have non-empty template strings', () => {
      Object.values(REMINDER_TEMPLATES).forEach(templates => {
        templates.forEach(template => {
          expect(template).toBeDefined();
          expect(typeof template).toBe('string');
          expect(template.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('getReminderText', () => {
    it('should return a string from the specified type', () => {
      const types: ReminderType[] = ['daily', 'caring', 'welcome_back', 'milestone'];
      types.forEach(type => {
        const text = getReminderText(type);
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
      });
    });

    it('should return only templates from the specified type', () => {
      const types: ReminderType[] = ['daily', 'caring', 'welcome_back', 'milestone'];
      types.forEach(type => {
        const text = getReminderText(type);
        expect(REMINDER_TEMPLATES[type]).toContain(text);
      });
    });

    it('should return different templates over multiple calls (random distribution)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const text1 = getReminderText('daily');
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const text2 = getReminderText('daily');
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      const text3 = getReminderText('daily');

      expect(text1).not.toEqual(text2);
      expect(text2).not.toEqual(text3);

      vi.restoreAllMocks();
    });

    it('should handle boundary cases for Math.random', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(getReminderText('daily')).toBe(REMINDER_TEMPLATES.daily[0]);

      vi.spyOn(Math, 'random').mockReturnValue(0.999999);
      expect(getReminderText('daily')).toBe(REMINDER_TEMPLATES.daily[2]);

      vi.restoreAllMocks();
    });
  });
});
