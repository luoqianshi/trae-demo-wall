export interface AnalyticsEvent {
  event_name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>;
}

class Analytics {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async track(eventName: string, params?: Record<string, any>): Promise<void> {
    if (!this.token) return;
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ event_name: eventName, params }),
      });
    } catch {
      // Analytics should never block user interaction
    }
  }

  // Convenience methods for common events
  trackRecordCreate(recordId: string, type: string, mood: string, wordCount: number, hasGoal: boolean) {
    return this.track('record_create', { record_id: recordId, type, mood, word_count: wordCount, has_goal: hasGoal });
  }

  trackRecordStart(source: string) {
    return this.track('record_start', { source });
  }

  trackProcrastinationStart(scenarioType: string) {
    return this.track('procrastination_start', { scenario_type: scenarioType });
  }

  trackProcrastinationStepComplete(sessionId: string, stepIndex: number, totalSteps: number) {
    return this.track('procrastination_step_complete', { session_id: sessionId, step_index: stepIndex, total_steps: totalSteps });
  }

  trackProcrastinationComplete(sessionId: string, totalSteps: number, duration: number) {
    return this.track('procrastination_complete', { session_id: sessionId, total_steps: totalSteps, duration });
  }

  trackAIFeedbackView(feedbackType: string, recordId: string) {
    return this.track('ai_feedback_view', { feedback_type: feedbackType, record_id: recordId });
  }

  trackAchievementUnlock(achievementId: string, daysSinceRegister: number) {
    return this.track('achievement_unlock', { achievement_id: achievementId, days_since_register: daysSinceRegister });
  }

  trackSnowballInteract(interactionType: string, snowballStage: string) {
    return this.track('snowball_interact', { interaction_type: interactionType, snowball_stage: snowballStage });
  }

  trackReminderReceive(reminderType: string) {
    return this.track('reminder_receive', { reminder_type: reminderType });
  }

  trackReminderOpen(reminderType: string, timeSinceLastActive: number) {
    return this.track('reminder_open', { reminder_type: reminderType, time_since_last_active: timeSinceLastActive });
  }

  trackOnboardingStep(stepNumber: number, stepName: string) {
    return this.track('onboarding_step', { step_number: stepNumber, step_name: stepName });
  }

  trackChallengeJoin(challengeType: string) {
    return this.track('challenge_join', { challenge_type: challengeType });
  }

  trackChallengeComplete(challengeType: string, duration: number) {
    return this.track('challenge_complete', { challenge_type: challengeType, duration });
  }

  trackChallengeProgress(challengeType: string, day: number, totalDays: number) {
    return this.track('challenge_progress', { challenge_type: challengeType, day, total_days: totalDays });
  }

  trackChallengeAbandon(challengeType: string, progress: number, totalDays: number) {
    return this.track('challenge_abandon', { challenge_type: challengeType, progress, total_days: totalDays });
  }

  trackChallengeMakeUp(challengeType: string, makeUpCount: number, maxMakeUps: number) {
    return this.track('challenge_make_up', { challenge_type: challengeType, make_up_count: makeUpCount, max_make_ups: maxMakeUps });
  }

  trackMilestoneUnlock(milestoneDay: number, challengeType: string, reward: string) {
    return this.track('milestone_unlock', { milestone_day: milestoneDay, challenge_type: challengeType, reward });
  }

  trackBadgeUnlock(badgeId: string, badgeLevel: string, sourceChallengeId: string) {
    return this.track('badge_unlock', { badge_id: badgeId, badge_level: badgeLevel, source_challenge_id: sourceChallengeId });
  }

  trackPageView(pageName: string) {
    return this.track('page_view', { page_name: pageName, timestamp: Date.now() });
  }
}

export const analytics = new Analytics();
