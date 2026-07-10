// User settings & interactions repository.

import { readData, withTransaction } from './base';
import type { UserSettings, UserInteraction } from '../types/entities';

export function getUserSettings(userId: string): UserSettings | null {
  const data = readData();
  return data.userSettings.find((s) => s.user_id === userId) || null;
}

export function upsertUserSettings(userId: string, settings: any): UserSettings | null {
  return withTransaction((data) => {
    const idx = data.userSettings.findIndex((s) => s.user_id === userId);
    if (idx !== -1) {
      data.userSettings[idx] = { ...data.userSettings[idx], ...settings };
    } else {
      data.userSettings.push({ user_id: userId, ...settings });
    }
    return data.userSettings.find((s) => s.user_id === userId) || null;
  });
}

export function getUserInteractions(userId: string): {
  snowball_interactions: number;
  snowball_clicks: number;
} {
  const data = readData();
  const interactions = data.userInteractions.find(
    (i) => i.user_id === userId && i.type === 'snowball_interaction',
  );
  const clicks = data.userInteractions.find(
    (i) => i.user_id === userId && i.type === 'snowball_click',
  );
  return {
    snowball_interactions: interactions?.count || 0,
    snowball_clicks: clicks?.count || 0,
  };
}

export function incrementUserInteraction(
  userId: string,
  type: 'snowball_interaction' | 'snowball_click',
): number {
  return withTransaction((data) => {
    const idx = data.userInteractions.findIndex(
      (i) => i.user_id === userId && i.type === type,
    );
    if (idx !== -1) {
      data.userInteractions[idx].count += 1;
      data.userInteractions[idx].updated_at = new Date().toISOString();
      return data.userInteractions[idx].count;
    }
    const newInteraction: UserInteraction = {
      user_id: userId,
      type,
      count: 1,
      updated_at: new Date().toISOString(),
    };
    data.userInteractions.push(newInteraction);
    return 1;
  });
}
