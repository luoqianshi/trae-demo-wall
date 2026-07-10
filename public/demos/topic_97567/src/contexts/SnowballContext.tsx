'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  SnowballStage,
  SCORE_VALUES,
  ScoreAction,
  getSnowballStageByScore,
  getNextStageThresholdByScore,
  getScoreProgress,
} from '@/lib/snowball-score';

export interface SnowballStats {
  totalScore: number;
  todayScore: number;
  todayStreak: number;
  recordCount: number;
  taskCompletedCount: number;
}

export interface SnowballContextValue {
  stats: SnowballStats;
  stage: SnowballStage;
  stageLabel: string;
  nextThreshold: number | null;
  progress: { current: number; next: number; progress: number };
  addScore: (action: ScoreAction) => void;
  refreshStats: () => Promise<void>;
  lastAddedScore: number;
  lastAddedAction: ScoreAction | null;
}

const defaultStats: SnowballStats = {
  totalScore: 0,
  todayScore: 0,
  todayStreak: 0,
  recordCount: 0,
  taskCompletedCount: 0,
};

const SnowballContext = createContext<SnowballContextValue>({
  stats: defaultStats,
  stage: 'snowflake',
  stageLabel: '雪粒',
  nextThreshold: 50,
  progress: { current: 0, next: 50, progress: 0 },
  addScore: () => {},
  refreshStats: async () => {},
  lastAddedScore: 0,
  lastAddedAction: null,
});

export function useSnowball() {
  return useContext(SnowballContext);
}

export function SnowballProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [stats, setStats] = useState<SnowballStats>(defaultStats);
  const [lastAddedScore, setLastAddedScore] = useState(0);
  const [lastAddedAction, setLastAddedAction] = useState<ScoreAction | null>(null);
  const initializedRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshStats = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/snowball/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats({
            totalScore: data.totalScore ?? 0,
            todayScore: data.todayScore ?? 0,
            todayStreak: data.todayStreak ?? 0,
            recordCount: data.recordCount ?? 0,
            taskCompletedCount: data.taskCompletedCount ?? 0,
          });
        }
      }
    } catch (err) {
      console.error('Failed to refresh snowball stats:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token && !initializedRef.current) {
      initializedRef.current = true;
      refreshStats();
    }
    if (!token) {
      initializedRef.current = false;
    }
  }, [token, refreshStats]);

  const addScore = useCallback((action: ScoreAction) => {
    const score = SCORE_VALUES[action];
    setLastAddedScore(score);
    setLastAddedAction(action);
    setStats(prev => ({
      ...prev,
      totalScore: prev.totalScore + score,
      todayScore: prev.todayScore + score,
      taskCompletedCount:
        action.startsWith('TASK_') || action === 'SUBTASK_COMPLETED' || action === 'BIG_TASK_COMPLETED'
          ? prev.taskCompletedCount + 1
          : prev.taskCompletedCount,
      recordCount: action === 'RECORD_CREATED' ? prev.recordCount + 1 : prev.recordCount,
    }));
    setTimeout(() => {
      setLastAddedScore(0);
      setLastAddedAction(null);
    }, 2000);

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = setTimeout(() => {
      refreshStats().catch(err => console.error('refreshStats failed:', err));
    }, 800);
  }, [refreshStats]);

  const stageConfig = getSnowballStageByScore(stats.totalScore);
  const stage = stageConfig.stage;
  const nextThreshold = getNextStageThresholdByScore(stats.totalScore);
  const progress = getScoreProgress(stats.totalScore);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  // 修复 H-4: useMemo 包裹 value 对象，避免每次渲染创建新对象触发所有消费者 re-render
  const value = useMemo<SnowballContextValue>(() => ({
    stats,
    stage,
    stageLabel: stageConfig.label,
    nextThreshold,
    progress,
    addScore,
    refreshStats,
    lastAddedScore,
    lastAddedAction,
  }), [stats, stage, stageConfig.label, nextThreshold, progress, addScore, refreshStats, lastAddedScore, lastAddedAction]);

  return (
    <SnowballContext.Provider value={value}>
      {children}
    </SnowballContext.Provider>
  );
}
