// Record repository: CRUD operations for diary records.

import { readData, withTransaction, generateId } from './base';
import { SCORE_VALUES } from '../snowball-score';
import type { DiaryRecord, ScoreEvent } from '../types/entities';

export function getRecords(userId: string): DiaryRecord[] {
  const data = readData();
  return data.records
    .filter((r) => r.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getRecord(recordId: string): DiaryRecord | null {
  const data = readData();
  return data.records.find((r) => r.id === recordId) || null;
}

export function createRecord(recordData: any): DiaryRecord {
  return withTransaction((data) => {
    const newRecord: any = {
      id: generateId(),
      ...recordData,
      record_type: recordData.record_type || 'success',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    data.records.push(newRecord);

    const growthIdx = data.growthData.findIndex((g) => g.user_id === recordData.user_id);
    if (growthIdx !== -1) {
      data.growthData[growthIdx].records_count += 1;
    }

    return newRecord;
  });
}

/**
 * Atomically create a record and award score.
 *
 * Combines createRecord + addScoreEvent into a single transaction to prevent
 * partial state on failure (e.g., record created but no score awarded).
 */
export function createRecordWithScore(
  recordData: any,
  userId: string,
  scoreAction: keyof typeof SCORE_VALUES,
  scoreRefId?: string,
): DiaryRecord {
  return withTransaction((data) => {
    const newRecord: any = {
      id: generateId(),
      ...recordData,
      record_type: recordData.record_type || 'success',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    data.records.push(newRecord);

    const growthIdx = data.growthData.findIndex((g) => g.user_id === recordData.user_id);
    if (growthIdx !== -1) {
      data.growthData[growthIdx].records_count += 1;
    }

    // Award score atomically in the same transaction
    const scoreEvent: ScoreEvent = {
      id: generateId(),
      user_id: userId,
      action: scoreAction,
      score: SCORE_VALUES[scoreAction],
      ref_id: scoreRefId,
      created_at: new Date().toISOString(),
    };
    data.scoreEvents.push(scoreEvent);

    return newRecord;
  });
}

export function updateRecord(recordId: string, updates: any): DiaryRecord {
  return withTransaction((data) => {
    const idx = data.records.findIndex((r) => r.id === recordId);
    if (idx === -1) throw new Error('Record not found');
    data.records[idx] = { ...data.records[idx], ...updates, updated_at: new Date().toISOString() };
    return data.records[idx];
  });
}

export function deleteRecord(recordId: string): boolean {
  return withTransaction((data) => {
    const idx = data.records.findIndex((r) => r.id === recordId);
    if (idx === -1) throw new Error('Record not found');
    data.records.splice(idx, 1);
    data.conversations = data.conversations.filter((c) => c.record_id !== recordId);
    return true;
  });
}
