import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReturnDetection } from '@/hooks/useReturnDetection';

const LAST_ACTIVE_KEY = 'last_active_date';

describe('useReturnDetection', () => {
  const mockStorage: Record<string, string> = {};
  
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      return mockStorage[key] || null;
    });
    
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      mockStorage[key] = value;
    });
    
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
      delete mockStorage[key];
    });
    
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-05-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should return isReturning false when no last active date exists', async () => {
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current.isReturning).toBe(false);
      });
    });

    it('should return isReturning false when user was active today', async () => {
      mockStorage[LAST_ACTIVE_KEY] = '2026-05-15';
      
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current.isReturning).toBe(false);
      });
    });

    it('should return isReturning false when user was active 2 days ago', async () => {
      mockStorage[LAST_ACTIVE_KEY] = '2026-05-13';
      
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current.isReturning).toBe(false);
      });
    });

    it('should return isReturning true when user was inactive for 3 or more days', async () => {
      mockStorage[LAST_ACTIVE_KEY] = '2026-05-11';
      
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current.isReturning).toBe(true);
      });
    });

    it('should return isReturning true when user was inactive for exactly 3 days', async () => {
      mockStorage[LAST_ACTIVE_KEY] = '2026-05-12';
      
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current.isReturning).toBe(true);
      });
    });

    it('should return correct daysInactive when returning after 5 days', async () => {
      mockStorage[LAST_ACTIVE_KEY] = '2026-05-10';
      
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current.daysInactive).toBe(5);
      });
    });

    it('should return correct daysInactive when returning after 3 days', async () => {
      mockStorage[LAST_ACTIVE_KEY] = '2026-05-12';
      
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current.daysInactive).toBe(3);
      });
    });

    it('should return 0 daysInactive when active today', async () => {
      mockStorage[LAST_ACTIVE_KEY] = '2026-05-15';
      
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current.daysInactive).toBe(0);
      });
    });
  });

  describe('markActive', () => {
    it('should update last active date to today', async () => {
      mockStorage[LAST_ACTIVE_KEY] = '2026-05-10';
      
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current.isReturning).toBe(true);
      });
      
      act(() => {
        result.current.markActive();
      });
      
      expect(mockStorage[LAST_ACTIVE_KEY]).toBe('2026-05-15');
    });

    it('should set isReturning to false after markActive', async () => {
      mockStorage[LAST_ACTIVE_KEY] = '2026-05-10';
      
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current.isReturning).toBe(true);
      });
      
      act(() => {
        result.current.markActive();
      });
      
      expect(result.current.isReturning).toBe(false);
    });

    it('should set daysInactive to 0 after markActive', async () => {
      mockStorage[LAST_ACTIVE_KEY] = '2026-05-10';
      
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current.daysInactive).toBe(5);
      });
      
      act(() => {
        result.current.markActive();
      });
      
      expect(result.current.daysInactive).toBe(0);
    });
  });

  describe('dismissWelcome', () => {
    it('should set dismissed state to true', async () => {
      mockStorage[LAST_ACTIVE_KEY] = '2026-05-10';
      
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current.isReturning).toBe(true);
      });
      
      act(() => {
        result.current.dismissWelcome();
      });
      
      expect(result.current.isReturning).toBe(false);
    });

    it('should call markActive when dismissed', async () => {
      mockStorage[LAST_ACTIVE_KEY] = '2026-05-10';
      
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current.isReturning).toBe(true);
      });
      
      act(() => {
        result.current.dismissWelcome();
      });
      
      expect(mockStorage[LAST_ACTIVE_KEY]).toBe('2026-05-15');
    });
  });

  describe('return value structure', () => {
    it('should return all required properties', async () => {
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current).toHaveProperty('isReturning');
        expect(result.current).toHaveProperty('daysInactive');
        expect(result.current).toHaveProperty('markActive');
        expect(result.current).toHaveProperty('dismissWelcome');
      });
    });

    it('should have markActive as a function', async () => {
      const { result } = renderHook(() => useReturnDetection());
      
      expect(typeof result.current.markActive).toBe('function');
    });

    it('should have dismissWelcome as a function', async () => {
      const { result } = renderHook(() => useReturnDetection());
      
      expect(typeof result.current.dismissWelcome).toBe('function');
    });

    it('should have isReturning as boolean', async () => {
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(typeof result.current.isReturning).toBe('boolean');
      });
    });

    it('should have daysInactive as number', async () => {
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(typeof result.current.daysInactive).toBe('number');
      });
    });
  });

  describe('consecutive returns', () => {
    it('should handle user returning, being active, then returning again', async () => {
      mockStorage[LAST_ACTIVE_KEY] = '2026-05-10';

      const { result } = renderHook(() => useReturnDetection());

      await waitFor(() => {
        expect(result.current.isReturning).toBe(true);
        expect(result.current.daysInactive).toBe(5);
      });

      act(() => {
        result.current.dismissWelcome();
      });

      expect(result.current.isReturning).toBe(false);

      vi.setSystemTime(new Date('2026-05-19T12:00:00'));

      const { result: result2 } = renderHook(() => useReturnDetection());

      await waitFor(() => {
        expect(result2.current.isReturning).toBe(true);
        expect(result2.current.daysInactive).toBe(4);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty localStorage', async () => {
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current.isReturning).toBe(false);
        expect(result.current.daysInactive).toBe(0);
      });
    });

    it('should handle very old date', async () => {
      mockStorage[LAST_ACTIVE_KEY] = '2020-01-01';
      
      const { result } = renderHook(() => useReturnDetection());
      
      await waitFor(() => {
        expect(result.current.isReturning).toBe(true);
        expect(result.current.daysInactive).toBeGreaterThan(2000);
      });
    });
  });
});
