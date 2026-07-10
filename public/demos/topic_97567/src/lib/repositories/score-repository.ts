// Score repository: score events tracking.

import { readData, withTransaction, generateId } from './base';
import type { ScoreEvent } from '../types/entities';

export function addScoreEvent(eventData: Omit<ScoreEvent, 'id'>): ScoreEvent {
  return withTransaction((data) => {
    const newEvent: ScoreEvent = {
      id: generateId(),
      ...eventData,
    };
    data.scoreEvents.push(newEvent);
    return newEvent;
  });
}

export function getScoreEvents(userId: string): ScoreEvent[] {
  const data = readData();
  return data.scoreEvents.filter((e) => e.user_id === userId);
}
