import type { SessionData, ProjectMeta, CostMeta, ReviewReport } from '../types';

const STORAGE_KEY = 'agenttrace-session-v1';

export function saveSession(
  projectMeta: ProjectMeta,
  costMeta: CostMeta,
  transcript: string,
  report: ReviewReport | null
): void {
  try {
    const data: SessionData = {
      projectMeta,
      costMeta,
      transcript,
      report,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save session to localStorage:', e);
  }
}

export function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch (e) {
    console.warn('Failed to load session from localStorage:', e);
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear session from localStorage:', e);
  }
}

export function getDefaultProjectMeta(): ProjectMeta {
  const now = new Date();
  const formatted = now.toISOString().slice(0, 16).replace('T', ' ');
  return {
    projectName: '',
    taskGoal: '',
    tool: 'TRAE',
    modelName: '',
    startTime: formatted,
    endTime: formatted,
    durationMinutes: 30,
    status: 'success',
  };
}

export function getDefaultCostMeta(): CostMeta {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheHitTokens: 0,
    totalCost: 0,
    currency: 'USD',
    retries: 0,
    interruptions: 0,
  };
}
