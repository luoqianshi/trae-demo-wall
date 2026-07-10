import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { triggerAchievementCelebration } from '@/app/components/GlobalCelebration';
import { emitAchievementStateChange } from '@/lib/achievement-events';

const INTERACTIONS_KEY = 'snowball_interactions_count';
const CLICKS_KEY = 'snowball_clicks_count';

export function getSnowballInteractions(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(INTERACTIONS_KEY) || '0', 10);
}

export async function incrementSnowballInteractions(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  const current = getSnowballInteractions() + 1;
  localStorage.setItem(INTERACTIONS_KEY, String(current));
  await syncInteractionToServer('snowball_interaction');
  return current;
}

export function getSnowballClicks(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(CLICKS_KEY) || '0', 10);
}

export async function incrementSnowballClicks(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  const current = getSnowballClicks() + 1;
  localStorage.setItem(CLICKS_KEY, String(current));
  await syncInteractionToServer('snowball_click');
  return current;
}

async function syncInteractionToServer(type: 'snowball_interaction' | 'snowball_click'): Promise<string[]> {
  const token = localStorage.getItem('token');
  if (!token) return [];
  
  try {
    const response = await fetch('/api/achievements', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
        const achievementIds = data.newlyUnlocked.map((ach: any) => ach.id);
        emitAchievementStateChange({
          type: 'unlocked',
          achievementIds,
          timestamp: Date.now(),
        });
        triggerAchievementCelebration(achievementIds);
        return achievementIds;
      }
    }
  } catch (err) {
    console.error('syncInteractionToServer failed:', err);
  }
  
  return [];
}

export async function checkInteractAchievements(token: string | null): Promise<string[]> {
  if (!token) return [];

  try {
    const response = await fetch('/api/achievements', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
        const achievementIds = data.newlyUnlocked.map((ach: any) => ach.id);
        emitAchievementStateChange({
          type: 'unlocked',
          achievementIds,
          timestamp: Date.now(),
        });
        triggerAchievementCelebration(achievementIds);
        return achievementIds;
      }
    }
  } catch (err) {
    console.error('Failed to check interact achievements:', err);
  }

  return [];
}

export function useAchievements() {
  const { token } = useAuth();
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<string[]>([]);
  const [error, setError] = useState('');

  const checkAchievements = useCallback(async (options?: {
    skipCelebration?: boolean;
    midnight_record?: boolean;
    record_500_words?: boolean;
  }): Promise<string[]> => {
    if (!token) return [];

    try {
      const response = await fetch('/api/achievements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          midnight_record: options?.midnight_record ?? false,
          record_500_words: options?.record_500_words ?? false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
          const achievementIds = data.newlyUnlocked.map((ach: any) => ach.id);
          setNewlyUnlockedAchievements(achievementIds);

          emitAchievementStateChange({
            type: 'unlocked',
            achievementIds,
            timestamp: Date.now(),
          });

          if (!options?.skipCelebration) {
            triggerAchievementCelebration(achievementIds);
          }
          return achievementIds;
        }
      }
    } catch (err) {
      console.error('Failed to check achievements:', err);
      setError('检查成就失败');
    }

    return [];
  }, [token]);

  const resetNewlyUnlocked = useCallback(() => {
    setNewlyUnlockedAchievements([]);
  }, []);

  return {
    newlyUnlockedAchievements,
    error,
    checkAchievements,
    resetNewlyUnlocked,
  };
}
