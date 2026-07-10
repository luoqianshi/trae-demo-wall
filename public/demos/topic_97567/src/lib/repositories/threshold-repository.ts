// Threshold repository: per-user urgency thresholds.

import { readData, withTransaction } from './base';
import type { Threshold } from '../types/entities';

export function getThresholds(userId: string, type?: string, bigTaskId?: string): Threshold[] {
  const data = readData();
  let result = data.thresholds.filter((t) => t.user_id === userId);
  if (type) result = result.filter((t) => t.type === type);
  if (bigTaskId) result = result.filter((t) => t.big_task_id === bigTaskId);
  return result;
}

export function upsertThresholds(userId: string, thresholdData: any): Threshold[] {
  return withTransaction((data) => {
    const existingIdx = data.thresholds.findIndex(
      (t) =>
        t.user_id === userId &&
        t.type === thresholdData.type &&
        t.big_task_id === thresholdData.big_task_id,
    );
    if (existingIdx !== -1) {
      data.thresholds[existingIdx] = { ...data.thresholds[existingIdx], ...thresholdData };
    } else {
      data.thresholds.push({ user_id: userId, ...thresholdData });
    }
    return data.thresholds;
  });
}
