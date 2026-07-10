import * as db from './local-db';
import { SCORE_VALUES, type ScoreAction } from './snowball-score';

// 修复 H-1: 统一使用本地日期字符串，与 snowball-score-calculator 保持一致
function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toLocalDateStrFromISO(isoStr: string): string {
  return toLocalDateStr(new Date(isoStr));
}

export function addScoreEvent(userId: string, action: ScoreAction, refId?: string) {
  const score = SCORE_VALUES[action];
  const result = db.addScoreEvent({
    user_id: userId,
    action,
    score,
    ref_id: refId,
    created_at: new Date().toISOString(),
  });
  return result;
}

export function calculateEventScore(userId: string): number {
  const events = db.getScoreEvents(userId);
  return events.reduce((sum: number, event: any) => sum + event.score, 0);
}

export function calculateTodayEventScore(userId: string): number {
  const todayStr = toLocalDateStr(new Date());
  const events = db.getScoreEvents(userId);
  return events
    .filter((e: any) => e.created_at && toLocalDateStrFromISO(e.created_at) === todayStr)
    .reduce((sum: number, e: any) => sum + e.score, 0);
}
