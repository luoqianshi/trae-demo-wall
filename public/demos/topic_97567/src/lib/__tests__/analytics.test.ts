import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analytics, type AnalyticsEvent } from '../analytics';

describe('Analytics', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('setToken', () => {
    it('should set the token correctly', () => {
      analytics.setToken('test-token');
    });

    it('should accept null token', () => {
      analytics.setToken(null);
    });
  });

  describe('track', () => {
    beforeEach(() => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      ) as any;
    });

    it('should not fetch when token is not set', async () => {
      analytics.setToken(null);
      await analytics.track('test_event');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch analytics endpoint when token is set', async () => {
      analytics.setToken('test-token');
      await analytics.track('test_event');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should send correct request format', async () => {
      analytics.setToken('test-token');
      await analytics.track('test_event', { key: 'value' });
      
      expect(fetch).toHaveBeenCalledWith('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({ event_name: 'test_event', params: { key: 'value' } }),
      });
    });

    it('should handle fetch errors gracefully', async () => {
      analytics.setToken('test-token');
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as any;
      
      await expect(analytics.track('test_event')).resolves.not.toThrow();
    });

    it('should work without params', async () => {
      analytics.setToken('test-token');
      await analytics.track('test_event');
      
      expect(fetch).toHaveBeenCalledWith('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({ event_name: 'test_event', params: undefined }),
      });
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      ) as any;
      analytics.setToken('test-token');
    });

    it('should track record create event', async () => {
      await analytics.trackRecordCreate('rec1', 'success', 'happy', 150, true);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('record_create'),
        })
      );
    });

    it('should track record start event', async () => {
      await analytics.trackRecordStart('home');
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('record_start'),
        })
      );
    });

    it('should track procrastination start event', async () => {
      await analytics.trackProcrastinationStart('work');
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('procrastination_start'),
        })
      );
    });

    it('should track procrastination step complete event', async () => {
      await analytics.trackProcrastinationStepComplete('ses1', 2, 5);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('procrastination_step_complete'),
        })
      );
    });

    it('should track procrastination complete event', async () => {
      await analytics.trackProcrastinationComplete('ses1', 5, 120);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('procrastination_complete'),
        })
      );
    });

    it('should track achievement unlock event', async () => {
      await analytics.trackAchievementUnlock('ach1', 7);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('achievement_unlock'),
        })
      );
    });

    it('should track snowball interact event', async () => {
      await analytics.trackSnowballInteract('pet', 'stage1');
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('snowball_interact'),
        })
      );
    });

    it('should track reminder receive event', async () => {
      await analytics.trackReminderReceive('daily');
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('reminder_receive'),
        })
      );
    });

    it('should track reminder open event', async () => {
      await analytics.trackReminderOpen('daily', 3600);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('reminder_open'),
        })
      );
    });

    it('should track onboarding step event', async () => {
      await analytics.trackOnboardingStep(1, 'welcome');
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('onboarding_step'),
        })
      );
    });

    it('should track challenge join event', async () => {
      await analytics.trackChallengeJoin('30-days');
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('challenge_join'),
        })
      );
    });

    it('should track challenge complete event', async () => {
      await analytics.trackChallengeComplete('30-days', 2592000);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('challenge_complete'),
        })
      );
    });

    it('should track challenge progress event', async () => {
      await analytics.trackChallengeProgress('30-days', 15, 30);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('challenge_progress'),
        })
      );
    });

    it('should track challenge abandon event', async () => {
      await analytics.trackChallengeAbandon('30-days', 10, 30);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('challenge_abandon'),
        })
      );
    });

    it('should track challenge make up event', async () => {
      await analytics.trackChallengeMakeUp('30-days', 2, 3);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('challenge_make_up'),
        })
      );
    });

    it('should track milestone unlock event', async () => {
      await analytics.trackMilestoneUnlock(7, '30-days', 'badge');
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('milestone_unlock'),
        })
      );
    });

    it('should track badge unlock event', async () => {
      await analytics.trackBadgeUnlock('badge1', 'bronze', 'chall1');
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('badge_unlock'),
        })
      );
    });

    it('should track page view event', async () => {
      await analytics.trackPageView('home');
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('page_view'),
        })
      );
    });

    it('should track AI feedback view event', async () => {
      await analytics.trackAIFeedbackView('encouragement', 'rec1');
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('ai_feedback_view'),
        })
      );
    });
  });
});
