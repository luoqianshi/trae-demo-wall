'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { CelebrationEffect } from './CelebrationEffect';
import { achievementDefinitions } from '@/lib/data-models';

const CELEBRATION_EVENT = 'global-celebration';

const TYPE_PRIORITY: Record<string, number> = {
  breakthrough: 100,
  challenge: 80,
  streak: 60,
  late_night: 40,
  normal: 20,
  question_answer: 10,
};

const LEVEL_PRIORITY: Record<string, number> = {
  transformation: 5,
  major: 4,
  growth: 3,
  minor: 2,
  micro: 1,
};

export interface CelebrationPayload {
  type: 'breakthrough' | 'streak' | 'late_night' | 'normal' | 'challenge' | 'question_answer';
  achievementId?: string;
  achievementLevel?: string;
  streakDays?: number;
  message?: string;
  difficulty?: 'bronze' | 'silver' | 'gold';
  reward?: Record<string, any>;
  milestoneReward?: { score: number; title: string } | null;
}

let celebrationQueue: CelebrationPayload[] = [];
let isShowing = false;

// 修复 R8-4: 客户端成就去重 —— 使用 sessionStorage 追踪当前会话中已庆祝过的成就 ID
// 防止同一成就在单次会话中被重复推入庆祝队列（React Strict Mode、页面跳转等场景）
const CELEBRATED_ACHIEVEMENTS_KEY = 'celebrated_achievements';

function getCelebratedAchievementIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = sessionStorage.getItem(CELEBRATED_ACHIEVEMENTS_KEY);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function markAchievementsCelebrated(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const celebrated = getCelebratedAchievementIds();
    ids.forEach(id => celebrated.add(id));
    sessionStorage.setItem(CELEBRATED_ACHIEVEMENTS_KEY, JSON.stringify([...celebrated]));
  } catch {
    // sessionStorage 不可用时静默失败
  }
}

function getPriority(payload: CelebrationPayload): number {
  const typePriority = TYPE_PRIORITY[payload.type] || 0;
  let levelPriority = 0;
  
  if (payload.achievementLevel) {
    levelPriority = LEVEL_PRIORITY[payload.achievementLevel] || 0;
  } else if (payload.difficulty) {
    levelPriority = payload.difficulty === 'gold' ? 3 : payload.difficulty === 'silver' ? 2 : 1;
  }
  
  return typePriority + levelPriority;
}

export function triggerGlobalCelebration(payload: CelebrationPayload) {
  if (typeof window === 'undefined') return;
  
  const priority = getPriority(payload);
  const item = { ...payload, _priority: priority } as CelebrationPayload & { _priority: number };
  
  const insertIndex = celebrationQueue.findIndex(
    (q) => (q as any)._priority < priority
  );
  
  if (insertIndex === -1) {
    celebrationQueue.push(item);
  } else {
    celebrationQueue.splice(insertIndex, 0, item);
  }
  
  window.dispatchEvent(new CustomEvent(CELEBRATION_EVENT + '-queue', { 
    detail: { queued: true } 
  }));
}

export function triggerAchievementCelebration(achievementIds: string[]) {
  if (typeof window === 'undefined' || achievementIds.length === 0) return;

  // 修复 R8-4: 过滤掉当前会话中已庆祝过的成就 ID，防止反复触发
  const celebrated = getCelebratedAchievementIds();
  const newIds = achievementIds.filter(id => !celebrated.has(id));
  if (newIds.length === 0) return;

  // 标记为已庆祝
  markAchievementsCelebrated(newIds);

  const sorted = [...newIds].sort((a, b) => {
    const achA = achievementDefinitions.find(def => def.id === a);
    const achB = achievementDefinitions.find(def => def.id === b);
    const priorityA = achA ? LEVEL_PRIORITY[achA.level] || 0 : 0;
    const priorityB = achB ? LEVEL_PRIORITY[achB.level] || 0 : 0;
    return priorityB - priorityA;
  });

  const primaryAchId = sorted[0];
  const primaryAch = achievementDefinitions.find(def => def.id === primaryAchId);

  triggerGlobalCelebration({
    type: 'breakthrough',
    achievementId: primaryAchId,
    achievementLevel: primaryAch?.level,
    message: primaryAch ? `达成成就：${primaryAch.icon} ${primaryAch.title}` : undefined,
  });
}

export function triggerChallengeCelebration(data: {
  difficulty: 'bronze' | 'silver' | 'gold';
  reward: Record<string, any>;
  milestoneReward?: { score: number; title: string } | null;
}) {
  triggerGlobalCelebration({
    type: 'challenge',
    difficulty: data.difficulty,
    reward: data.reward,
    milestoneReward: data.milestoneReward,
    message: data.milestoneReward ? '里程碑达成！' : undefined,
  });
}

export function celebrationQueueLength(): number {
  return celebrationQueue.length;
}

export function getNextCelebration(): CelebrationPayload | null {
  if (celebrationQueue.length === 0) return null;
  return celebrationQueue.shift() || null;
}

export function clearCelebrationQueue() {
  celebrationQueue = [];
}

export default function GlobalCelebration() {
  const [active, setActive] = useState(false);
  const [payload, setPayload] = useState<CelebrationPayload | null>(null);
  const processingRef = useRef(false);

  const processQueue = useCallback(() => {
    if (processingRef.current || isShowing) return;
    
    const next = getNextCelebration();
    if (next) {
      processingRef.current = true;
      isShowing = true;
      setPayload(next);
      setActive(true);
    }
  }, []);

  const handleComplete = useCallback(() => {
    setActive(false);
    setPayload(null);
    processingRef.current = false;
    isShowing = false;
    
    setTimeout(() => {
      processQueue();
    }, 300);
  }, [processQueue]);

  useEffect(() => {
    const handler = () => {
      processQueue();
    };

    window.addEventListener(CELEBRATION_EVENT + '-queue', handler);
    
    processQueue();
    
    return () => {
      window.removeEventListener(CELEBRATION_EVENT + '-queue', handler);
    };
  }, [processQueue]);

  if (!payload) return null;

  return (
    <CelebrationEffect
      isActive={active}
      type={payload.type}
      onComplete={handleComplete}
      streakDays={payload.streakDays}
      message={payload.message}
      difficulty={payload.difficulty}
      reward={payload.reward}
      milestoneReward={payload.milestoneReward}
    />
  );
}
