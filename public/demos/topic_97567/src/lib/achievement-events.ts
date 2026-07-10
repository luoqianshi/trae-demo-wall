const ACHIEVEMENT_EVENT_BUS = 'achievement-state-change';

export interface AchievementStateEvent {
  type: 'unlocked' | 'progress';
  achievementIds?: string[];
  action?: string;
  timestamp: number;
}

type AchievementStateHandler = (event: AchievementStateEvent) => void;

const handlers = new Set<AchievementStateHandler>();

export function emitAchievementStateChange(event: AchievementStateEvent) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ACHIEVEMENT_EVENT_BUS, { detail: event }));
  }
}

export function onAchievementStateChange(handler: AchievementStateHandler): () => void {
  handlers.add(handler);

  let windowHandler: ((e: Event) => void) | null = null;

  if (typeof window !== 'undefined') {
    windowHandler = (e: Event) => {
      try { handler((e as CustomEvent<AchievementStateEvent>).detail); } catch { /* swallow */ }
    };
    window.addEventListener(ACHIEVEMENT_EVENT_BUS, windowHandler);
  }

  return () => {
    handlers.delete(handler);
    if (windowHandler && typeof window !== 'undefined') {
      window.removeEventListener(ACHIEVEMENT_EVENT_BUS, windowHandler);
    }
  };
}

export function trackUserAction(action: string) {
  emitAchievementStateChange({
    type: 'progress',
    action,
    timestamp: Date.now(),
  });
}
