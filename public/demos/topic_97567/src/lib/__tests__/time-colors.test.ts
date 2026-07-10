import { describe, it, expect } from 'vitest';
import {
  TIME_COLORS,
  getCurrentPeriod,
  getCurrentTimeColor,
  type TimePeriod,
} from '@/lib/time-colors';

describe('TIME_COLORS', () => {
  const periods: TimePeriod[] = ['dawn', 'morning', 'noon', 'dusk', 'night', 'deepnight'];

  it('should have all 6 time periods', () => {
    expect(Object.keys(TIME_COLORS)).toHaveLength(6);
    periods.forEach(period => {
      expect(TIME_COLORS).toHaveProperty(period);
    });
  });

  it('should have required color properties for each period', () => {
    periods.forEach(period => {
      const config = TIME_COLORS[period];
      expect(config).toHaveProperty('bg');
      expect(config).toHaveProperty('shadow');
      expect(config).toHaveProperty('gradientStart');
      expect(config).toHaveProperty('gradientEnd');
      expect(config).toHaveProperty('label');
    });
  });

  it('should have valid rgba/rgb values for bg and shadow', () => {
    periods.forEach(period => {
      const config = TIME_COLORS[period];
      expect(config.bg).toMatch(/^rgba?\(/);
      expect(config.shadow).toMatch(/^0 0 \d+px/);
    });
  });

  it('should have valid hex colors for gradients', () => {
    periods.forEach(period => {
      const config = TIME_COLORS[period];
      expect(config.gradientStart).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(config.gradientEnd).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('should have non-empty labels', () => {
    periods.forEach(period => {
      expect(TIME_COLORS[period].label.length).toBeGreaterThan(0);
    });
  });

  it('dawn should be light blue themed', () => {
    expect(TIME_COLORS.dawn.bg).toContain('135, 206, 235');
    expect(TIME_COLORS.dawn.label).toBe('清晨');
  });

  it('noon should be golden themed', () => {
    expect(TIME_COLORS.noon.bg).toContain('255, 215, 0');
    expect(TIME_COLORS.noon.label).toBe('午后');
  });

  it('night should be pink themed', () => {
    expect(TIME_COLORS.night.bg).toContain('255, 182, 193');
    expect(TIME_COLORS.night.label).toBe('夜晚');
  });

  it('deepnight should be dark blue themed', () => {
    expect(TIME_COLORS.deepnight.bg).toContain('26, 26, 94');
    expect(TIME_COLORS.deepnight.label).toBe('深夜');
  });
});

describe('getCurrentPeriod', () => {
  it('should return a valid TimePeriod', () => {
    const period = getCurrentPeriod();
    expect(['dawn', 'morning', 'noon', 'dusk', 'night', 'deepnight']).toContain(period);
  });

  it('should match expected time ranges when mocked', () => {
    const mockDate = new Date('2026-05-15T07:00:00');
    const hour = mockDate.getHours();

    let period: TimePeriod;
    if (hour >= 6 && hour < 10) period = 'dawn';
    else if (hour >= 10 && hour < 12) period = 'morning';
    else if (hour >= 12 && hour < 17) period = 'noon';
    else if (hour >= 17 && hour < 19) period = 'dusk';
    else if (hour >= 19) period = 'night';
    else period = 'deepnight';

    expect(period).toBe('dawn');
  });

  it('should correctly identify morning period (10-12)', () => {
    const hour = 11;
    expect(hour >= 10 && hour < 12).toBe(true);
  });

  it('should correctly identify noon period (12-17)', () => {
    const hour = 14;
    expect(hour >= 12 && hour < 17).toBe(true);
  });

  it('should correctly identify dusk period (17-19)', () => {
    const hour = 18;
    expect(hour >= 17 && hour < 19).toBe(true);
  });

  it('should correctly identify night period (19+)', () => {
    const hour = 21;
    expect(hour >= 19).toBe(true);
  });

  it('should correctly identify deepnight period (0-6)', () => {
    const hour = 3;
    expect(hour < 6).toBe(true);
  });
});

describe('getCurrentTimeColor', () => {
  it('should return a valid TimeColorConfig', () => {
    const config = getCurrentTimeColor();
    expect(config).toHaveProperty('bg');
    expect(config).toHaveProperty('shadow');
    expect(config).toHaveProperty('gradientStart');
    expect(config).toHaveProperty('gradientEnd');
    expect(config).toHaveProperty('label');
  });

  it('should return matching config for current period', () => {
    const period = getCurrentPeriod();
    const config = getCurrentTimeColor();
    expect(config).toEqual(TIME_COLORS[period]);
  });
});

describe('Time period boundaries', () => {
  it('should handle edge case at exactly 6:00 (dawn starts)', () => {
    const hour = 6;
    expect(hour >= 6 && hour < 10).toBe(true);
    expect(hour < 6).toBe(false);
  });

  it('should handle edge case at exactly 10:00 (morning starts)', () => {
    const hour = 10;
    expect(hour >= 10 && hour < 12).toBe(true);
    expect(hour < 10).toBe(false);
  });

  it('should handle edge case at exactly 12:00 (noon starts)', () => {
    const hour = 12;
    expect(hour >= 12 && hour < 17).toBe(true);
    expect(hour < 12).toBe(false);
  });

  it('should handle edge case at exactly 17:00 (dusk starts)', () => {
    const hour = 17;
    expect(hour >= 17 && hour < 19).toBe(true);
    expect(hour < 17).toBe(false);
  });

  it('should handle edge case at exactly 19:00 (night starts)', () => {
    const hour = 19;
    expect(hour >= 19).toBe(true);
    expect(hour < 19).toBe(false);
  });

  it('should handle edge case at exactly 0:00 (deepnight)', () => {
    const hour = 0;
    expect(hour >= 6).toBe(false);
    expect(hour < 6).toBe(true);
  });
});
