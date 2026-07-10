'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useSnowball } from '@/contexts/SnowballContext';

export interface Challenge {
  id: string;
  type: 'bronze' | 'silver' | 'gold';
  difficulty: 1 | 2 | 3;
  title: string;
  description: string;
  duration_days: number;
  category: string;
  completion_criteria: {
    record_required?: boolean;
    required_tags?: string[];
    required_questions?: string[];
    action_required?: boolean;
    action_description?: string;
    milestones?: Array<{ day: number; reward: { score: number; title: string } }>;
  };
  reward: Record<string, any>;
  is_active: boolean;
  is_recurring: boolean;
  display_order: number;
  created_at: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  progress: number;
  current_day: number;
  streak_days: number;
  make_up_count: number;
  max_make_ups: number;
  started_at: string;
  completed_at: string | null;
  last_progress_at: string | null;
  daily_records: Array<{ date: string; completed: boolean; record_id?: string; completed_at?: string }>;
  challenge?: Challenge;
}

export interface ChallengeBadge {
  id: string;
  challenge_id: string;
  name: string;
  icon: string;
  level: 'bronze' | 'silver' | 'gold';
  description: string;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  source_challenge_id: string;
  unlocked_at: string;
}

export interface ChallengeStats {
  completed_count: number;
  streak_days: number;
  longest_streak: number;
  total_snowball: number;
  badge_progress: {
    bronze: { earned: number; total: number };
    silver: { earned: number; total: number };
    gold: { earned: number; total: number };
  };
}

export interface CompletionData {
  tags?: string[];
  questions_answered?: boolean[];
  action_confirmed?: boolean;
  record_id?: string;
}

export function useChallenges() {
  const { token } = useAuth();
  const { refreshStats } = useSnowball();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [progressSuccess, setProgressSuccess] = useState(false);
  const [milestoneReached, setMilestoneReached] = useState<{ score: number; title: string } | null>(null);

  const fetchChallenges = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/challenges', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges || []);
        setUserChallenges(data.user_challenges || []);
      } else {
        setError('获取挑战失败');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
      setError('获取挑战失败');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const bronzeChallenges = useMemo(() => challenges.filter(c => c.type === 'bronze'), [challenges]);
  const silverChallenges = useMemo(() => challenges.filter(c => c.type === 'silver'), [challenges]);
  const goldChallenges = useMemo(() => challenges.filter(c => c.type === 'gold'), [challenges]);

  const dailyChallenge = useMemo<Challenge | null>(() => {
    if (bronzeChallenges.length === 0) return null;
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const index = dayOfYear % bronzeChallenges.length;
    return bronzeChallenges[index];
  }, [bronzeChallenges]);

  const activeChallenge = useMemo<UserChallenge | null>(() => {
    return userChallenges.find(uc =>
      uc.status === 'active' &&
      uc.challenge &&
      (uc.challenge.type === 'silver' || uc.challenge.type === 'gold')
    ) || null;
  }, [userChallenges]);

  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!token) return;
    setLoading(true);
    setError('');
    setJoinSuccess(false);
    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ challenge_id: challengeId }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setError('你已经参加了这个挑战');
        } else {
          setError(data.error || '参加挑战失败');
        }
        setTimeout(() => setError(''), 3000);
        return;
      }
      setJoinSuccess(true);
      setTimeout(() => setJoinSuccess(false), 3000);
      await fetchChallenges();
    } catch (err) {
      console.error('Failed to join challenge:', err);
      setError('参加挑战失败');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  }, [token, fetchChallenges]);

  const updateProgress = useCallback(async (userChallengeId: string, completionData: CompletionData) => {
    if (!token) return;
    setLoading(true);
    setError('');
    setProgressSuccess(false);
    setMilestoneReached(null);
    try {
      const response = await fetch('/api/challenges', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_challenge_id: userChallengeId,
          action: 'progress',
          tags: completionData.tags,
          questions_answered: completionData.questions_answered,
          action_confirmed: completionData.action_confirmed,
          record_id: completionData.record_id,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || '更新进度失败');
        setTimeout(() => setError(''), 3000);
        return;
      }
      setProgressSuccess(true);
      setTimeout(() => setProgressSuccess(false), 3000);
      if (data.milestone_reward) {
        setMilestoneReached(data.milestone_reward);
      }
      // 挑战完成/milestone 达成后，后端会写入对应分数的 scoreEvent。
      // 前端不调用 addScore（固定 20 分与挑战实际 reward.score 可能不一致），
      // 直接 refreshStats 同步真实分数，避免瞬时显示不一致。
      refreshStats();
      await fetchChallenges();
      return data;
    } catch (err) {
      console.error('Failed to update challenge progress:', err);
      setError('更新进度失败');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  }, [token, fetchChallenges, refreshStats]);

  const abandonChallenge = useCallback(async (userChallengeId: string) => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/challenges', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_challenge_id: userChallengeId,
          action: 'abandon',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || '放弃挑战失败');
        setTimeout(() => setError(''), 3000);
        return;
      }
      await fetchChallenges();
    } catch (err) {
      console.error('Failed to abandon challenge:', err);
      setError('放弃挑战失败');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  }, [token, fetchChallenges]);

  const makeUpChallenge = useCallback(async (userChallengeId: string) => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/challenges', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_challenge_id: userChallengeId,
          action: 'make_up',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || '补签失败');
        setTimeout(() => setError(''), 3000);
        return;
      }
      await fetchChallenges();
    } catch (err) {
      console.error('Failed to make up challenge:', err);
      setError('补签失败');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  }, [token, fetchChallenges]);

  const fetchChallengeStats = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/challenges/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Failed to fetch challenge stats:', err);
    }
  }, [token]);

  const checkDailyChallengeProgress = useCallback(async () => {
    if (!dailyChallenge) return;
    // 修复 R5-4.3: 使用本地日期，与 challenges API 的 getTodayDateString 一致
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const activeBronzeUC = userChallenges.find(uc =>
      uc.status === 'active' &&
      uc.challenge_id === dailyChallenge.id
    );
    if (!activeBronzeUC) return;
    const todayCompleted = activeBronzeUC.daily_records?.some(
      r => r.date === todayStr && r.completed
    );
    if (todayCompleted) return;
    await updateProgress(activeBronzeUC.id, {
      tags: dailyChallenge.completion_criteria?.required_tags,
      questions_answered: dailyChallenge.completion_criteria?.required_questions?.map(() => true) || [],
      action_confirmed: true,
    });
  }, [dailyChallenge, userChallenges, updateProgress]);

  return {
    challenges,
    userChallenges,
    dailyChallenge,
    activeChallenge,
    bronzeChallenges,
    silverChallenges,
    goldChallenges,
    stats,
    loading,
    error,
    joinSuccess,
    progressSuccess,
    milestoneReached,
    joinChallenge,
    updateProgress,
    abandonChallenge,
    makeUpChallenge,
    fetchChallengeStats,
    checkDailyChallengeProgress,
    refetch: fetchChallenges,
  };
}
