// Challenge repository: CRUD for challenge definitions and user challenges.

import { readData, withTransaction, generateId } from './base';
import { SCORE_VALUES } from '../snowball-score';
import type { Challenge, UserChallenge, ScoreEvent } from '../types/entities';

export function getChallenges(): Challenge[] {
  const data = readData();
  return data.challenges as Challenge[];
}

export function setChallenges(challenges: Challenge[]): void {
  withTransaction((data) => {
    data.challenges = challenges;
  });
}

export function getUserChallenges(userId: string): UserChallenge[] {
  const data = readData();
  return data.userChallenges.filter((uc) => uc.user_id === userId);
}

export function createUserChallenge(userChallenge: any): UserChallenge {
  return withTransaction((data) => {
    const newChallenge = { ...userChallenge, id: generateId() };
    data.userChallenges.push(newChallenge);
    return newChallenge;
  });
}

export function updateUserChallenge(userChallengeId: string, updates: any): UserChallenge {
  return withTransaction((data) => {
    const idx = data.userChallenges.findIndex((uc) => uc.id === userChallengeId);
    if (idx === -1) throw new Error('User challenge not found');
    data.userChallenges[idx] = {
      ...data.userChallenges[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return data.userChallenges[idx];
  });
}

/**
 * Atomically complete a user challenge and award the corresponding score.
 *
 * This method exists to enable future refactoring of challenges/route.ts
 * so that challenge-completion + score-award become a single atomic
 * transaction. The current route uses separate updateUserChallenge +
 * addScoreEvent calls with try/catch + idempotency guards (R2-F1 fix),
 * which is already robust in practice but not strictly atomic.
 *
 * Usage:
 *   const result = completeChallengeWithScore(ucId, userId, updates, 'CHALLENGE_COMPLETED', ucId);
 *   // result.userChallenge — updated challenge
 *   // result.scoreAwarded  — whether score was written
 *
 * 当 scoreOverride 提供时，使用挑战定义中的 reward.score 而非固定的 SCORE_VALUES。
 * 这保证后端实际加分与前端显示的 challenge.reward.score 一致。
 */
export function completeChallengeWithScore(
  userChallengeId: string,
  userId: string,
  updates: Partial<UserChallenge>,
  scoreAction: keyof typeof SCORE_VALUES,
  scoreRefId?: string,
  scoreOverride?: number,
): { userChallenge: UserChallenge; scoreAwarded: boolean } {
  return withTransaction((data) => {
    const idx = data.userChallenges.findIndex((uc) => uc.id === userChallengeId);
    if (idx === -1) throw new Error('User challenge not found');

    data.userChallenges[idx] = {
      ...data.userChallenges[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Score event is written in the same transaction — atomic with the challenge update.
    // If this fails, the entire transaction rolls back (no partial state).
    // 使用 scoreOverride（挑战定义中的 reward.score）保证前端显示与后端加分一致
    const scoreEvent: ScoreEvent = {
      id: generateId(),
      user_id: userId,
      action: scoreAction,
      score: scoreOverride ?? SCORE_VALUES[scoreAction],
      ref_id: scoreRefId,
      created_at: new Date().toISOString(),
    };
    data.scoreEvents.push(scoreEvent);

    return {
      userChallenge: data.userChallenges[idx],
      scoreAwarded: true,
    };
  });
}
