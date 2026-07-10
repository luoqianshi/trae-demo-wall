import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useAchievements } from './useAchievements';
import { analytics } from '@/lib/analytics';
import { triggerAchievementCelebration } from '@/app/components/GlobalCelebration';

interface Step {
  task: string;
  completed: boolean;
}

interface ProcrastinationSession {
  id: string;
  user_id: string;
  goal: string;
  current_state: string;
  steps: Step[];
  current_step_index: number;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

export function useProcrastination() {
  const { token } = useAuth();
  const { checkAchievements } = useAchievements();
  const [activeSession, setActiveSession] = useState<ProcrastinationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createSession = useCallback(async (goal: string, currentState: string) => {
    if (!token) return null;
    setLoading(true);
    setError('');
    try {
      const breakdownResponse = await fetch('/api/ai/step-breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ goal, current_state: currentState }),
      });
      if (!breakdownResponse.ok) {
        const errorData = await breakdownResponse.json();
        if (errorData.safety_alert) {
          setError(errorData.error);
        } else {
          throw new Error('生成步骤失败');
        }
        return null;
      }
      const breakdownData = await breakdownResponse.json();
      const steps = breakdownData.steps;

      const sessionResponse = await fetch('/api/procrastination', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          goal,
          current_state: currentState,
          steps,
        }),
      });
      if (!sessionResponse.ok) {
        throw new Error('创建会话失败');
      }
      const sessionData = await sessionResponse.json();
      setActiveSession(sessionData.session);

      analytics.trackProcrastinationStart(goal);

      checkAchievements({ skipCelebration: true })
        .then(newlyUnlocked => {
          if (newlyUnlocked.length > 0) {
            triggerAchievementCelebration(newlyUnlocked);
          }
        })
        .catch(err => console.error('checkAchievements failed:', err));

      return sessionData.session;
    } catch (err) {
      setError('创建会话失败');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const completeStep = useCallback(async (stepIndex: number) => {
    if (!token || !activeSession) return null;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/procrastination', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: activeSession.id,
          step_index: stepIndex,
        }),
      });
      if (!response.ok) {
        throw new Error('完成步骤失败');
      }
      const data = await response.json();
      setActiveSession(data.session);

      // Analytics: track step completion
      analytics.trackProcrastinationStepComplete(
        data.session.id,
        stepIndex,
        data.session.steps?.length || 0
      );

      if (data.session.status === 'completed') {
        const totalSteps = data.session.steps?.length || 0;
        const createdAt = new Date(data.session.created_at).getTime();
        const duration = Math.round((Date.now() - createdAt) / 1000);
        analytics.trackProcrastinationComplete(data.session.id, totalSteps, duration);
        checkAchievements({ skipCelebration: true })
          .then(newlyUnlocked => {
            if (newlyUnlocked.length > 0) {
              triggerAchievementCelebration(newlyUnlocked);
            }
          })
          .catch(err => console.error('checkAchievements failed:', err));
      }

      return data.session;
    } catch (err) {
      setError('更新步骤失败');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, activeSession]);

  const abandonSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  const resetSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  return {
    activeSession,
    loading,
    error,
    createSession,
    completeStep,
    abandonSession,
    resetSession,
  };
}
