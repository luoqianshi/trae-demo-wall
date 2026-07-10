// Procrastination repository: session CRUD.

import { readData, withTransaction, generateId } from './base';
import type { ProcrastinationSession } from '../types/entities';

export function getProcrastinationSessions(userId: string): ProcrastinationSession[] {
  const data = readData();
  return data.procrastinationSessions.filter((s) => s.user_id === userId);
}

export function getProcrastinationSession(sessionId: string): ProcrastinationSession | null {
  const data = readData();
  return data.procrastinationSessions.find((s) => s.id === sessionId) || null;
}

export function createProcrastinationSession(sessionData: {
  user_id: string;
  goal: string;
  current_state: string;
  steps: Array<{ task: string; completed: boolean }>;
}): ProcrastinationSession {
  return withTransaction((data) => {
    const newSession: ProcrastinationSession = {
      id: generateId(),
      user_id: sessionData.user_id,
      goal: sessionData.goal,
      current_state: sessionData.current_state,
      steps: sessionData.steps,
      current_step_index: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.procrastinationSessions.push(newSession);
    return newSession;
  });
}

export function updateProcrastinationSession(sessionId: string, updates: any): ProcrastinationSession {
  return withTransaction((data) => {
    const idx = data.procrastinationSessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) throw new Error('Session not found');
    data.procrastinationSessions[idx] = {
      ...data.procrastinationSessions[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return data.procrastinationSessions[idx];
  });
}
