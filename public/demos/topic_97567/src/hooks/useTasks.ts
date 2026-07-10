import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useAchievements } from './useAchievements';
import { trackUserAction } from '@/lib/achievement-events';
import { triggerAchievementCelebration } from '@/app/components/GlobalCelebration';
import { Thresholds, DEFAULT_THRESHOLDS, calculateUrgency, calculateQuadrant, UrgencyLevel, QuadrantType } from '@/lib/quadrant-utils';

export type TaskType = 'quick' | 'normal' | 'big' | 'habit';

export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: 'pending' | 'completed';

  importance?: number;
  due_date?: string;
  urgency?: UrgencyLevel;
  quadrant?: QuadrantType;

  parent_id?: string | null;
  progress?: number;
  subtasks?: Task[];
  thresholds?: Thresholds;

  frequency?: HabitFrequency;
  target_count?: number;
  current_streak?: number;
  best_streak?: number;
  reminder_time?: string;

  user_id: string;
  completed_at?: string | null;
  order_index?: number;
  created_at: string;
  updated_at: string;
}

export interface TaskWithGoal extends Task {
  goal?: {
    id: string;
    title: string;
    progress: number;
  } | null;
}

export interface Goal {
  id: string;
  title: string;
  progress?: number;
  total_tasks?: number;
  completed_tasks?: number;
  pending_tasks?: number;
  upcoming_tasks?: Task[];
}

export interface TaskStats {
  total_tasks: number;
  pending: number;
  completed: number;
  independent_tasks: number;
  by_type?: {
    quick: number;
    normal: number;
    big: number;
    habit: number;
  };
}

export interface TaskGroup {
  goal: Goal | null;
  goal_title?: string;
  tasks: Task[];
  isBigTask?: boolean;
  isHabit?: boolean;
  isQuick?: boolean;
  isIndependent?: boolean;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  due_date?: string;
  importance?: number;
  status?: 'pending' | 'completed';
  type: TaskType;
  parent_id?: string | null;
  frequency?: HabitFrequency;
  target_count?: number;
  reminder_time?: string;
  thresholds?: Thresholds;
}

export interface QuadrantData {
  q1: { count: number; tasks: Task[] };
  q2: { count: number; tasks: Task[] };
  q3: { count: number; tasks: Task[] };
  q4: { count: number; tasks: Task[] };
}

export interface ThresholdsData {
  normal: Thresholds;
  big_tasks: Record<string, Thresholds>;
}

export function useTasks() {
  const { token } = useAuth();
  const { checkAchievements } = useAchievements();
  const [tasks, setTasks] = useState<TaskWithGoal[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<string[]>([]);

  const fetchTasks = useCallback(async (silent?: boolean) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const url = '/api/tasks';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('获取任务失败');
      }
      const data = await response.json();
      setTasks(data.tasks || []);
      setGoals(data.goals || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
      setError('获取任务失败');
      if (!silent) {
        setTasks([]);
        setGoals([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (taskData: CreateTaskData) => {
    if (!token) return null;
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '创建任务失败');
      }
      if (data.newlyUnlockedAchievements) {
        setNewlyUnlockedAchievements(data.newlyUnlockedAchievements);
      }
      await fetchTasks(true);
      return data.task;
    } catch (err: any) {
      setError(err.message || '创建任务失败');
      return null;
    }
  };

  const updateTask = async (
    taskId: string,
    updates: {
      title?: string;
      description?: string;
      status?: Task['status'];
      importance?: number;
      due_date?: string;
      completion_notes?: string;
      create_record?: boolean;
    }
  ) => {
    if (!token) return null;
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '更新任务失败');
      }
      if (data.newlyUnlockedAchievements) {
        setNewlyUnlockedAchievements(data.newlyUnlockedAchievements);
      }
      await fetchTasks(true);
      return data;
    } catch (err: any) {
      setError(err.message || '更新任务失败');
      return null;
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    return updateTask(taskId, { status });
  };

  const deleteTask = async (taskId: string) => {
    if (!token) return false;
    try {
      const response = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: taskId }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '删除任务失败');
      }
      await fetchTasks(true);
      return true;
    } catch (err: any) {
      setError(err.message || '删除任务失败');
      return false;
    }
  };

  const fetchQuadrantData = useCallback(async (
    view: 'global' | 'big' | 'normal',
    bigTaskId?: string
  ): Promise<QuadrantData | null> => {
    if (!token) return null;
    try {
      const params = new URLSearchParams({ view });
      if (bigTaskId) params.set('big_task_id', bigTaskId);
      const response = await fetch(`/api/tasks/quadrant?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('获取象限数据失败');
      const data = await response.json();
      return data.quadrants;
    } catch (err) {
      console.error(err);
      setError('获取象限数据失败');
      return null;
    }
  }, [token]);

  const fetchThresholds = useCallback(async (): Promise<ThresholdsData | null> => {
    if (!token) return null;
    try {
      const response = await fetch('/api/tasks/thresholds', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('获取阈值设置失败');
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(err);
      setError('获取阈值设置失败');
      return null;
    }
  }, [token]);

  const updateThresholds = useCallback(async (
    type: 'normal' | 'big',
    thresholds: Thresholds,
    bigTaskId?: string
  ): Promise<Thresholds | null> => {
    if (!token) return null;
    try {
      const response = await fetch('/api/tasks/thresholds', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type, thresholds, big_task_id: bigTaskId }),
      });
      if (!response.ok) throw new Error('更新阈值设置失败');
      const data = await response.json();
      return data.thresholds;
    } catch (err) {
      console.error(err);
      setError('更新阈值设置失败');
      return null;
    }
  }, [token]);

  const fetchTaskDetail = useCallback(async (taskId: string): Promise<Task | null> => {
    if (!token) return null;
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('获取任务详情失败');
      const data = await response.json();
      return data.task;
    } catch (err) {
      console.error(err);
      setError('获取任务详情失败');
      return null;
    }
  }, [token]);

  const updateTaskStatusOptimistic = useCallback(async (
    taskId: string,
    status: Task['status'],
    isSubtask: boolean
  ): Promise<{ success: boolean; taskTitle: string }> => {
    let taskTitle = '';
    let oldStatus: Task['status'] | undefined;

    setTasks(prev => {
      const currentTask = prev.find(t => t.id === taskId);
      taskTitle = currentTask?.title || '';
      oldStatus = currentTask?.status;
      return prev.map(t =>
        t.id === taskId ? { ...t, status, completed_at: status === 'completed' ? new Date().toISOString() : null } : t
      );
    });

    if (oldStatus) {
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          pending: prev.pending + (oldStatus === 'pending' ? -1 : 0) + (status === 'pending' ? 1 : 0),
          completed: prev.completed + (oldStatus === 'completed' ? -1 : 0) + (status === 'completed' ? 1 : 0),
        };
      });
    }

    try {
      let response: Response;
      if (isSubtask) {
        response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ status }),
        });
      } else {
        response = await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ id: taskId, status }),
        });
      }
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (err) {
      console.error('Optimistic update failed, reverting:', err);
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: oldStatus || 'pending', completed_at: null } : t
      ));
      if (oldStatus) {
        setStats(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            pending: prev.pending + (status === 'pending' ? -1 : 0) + (oldStatus === 'pending' ? 1 : 0),
            completed: prev.completed + (status === 'completed' ? -1 : 0) + (oldStatus === 'completed' ? 1 : 0),
          };
        });
      }
      return { success: false, taskTitle };
    }

    if (status === 'completed') {
      const newlyUnlocked = await checkAchievements({ skipCelebration: true });
      if (newlyUnlocked.length > 0) {
        triggerAchievementCelebration(newlyUnlocked);
      }
    }

    return { success: true, taskTitle };
  }, [token, checkAchievements]);

  const patchTask = useCallback(async (
    taskId: string,
    updates: Partial<{
      title: string;
      description: string;
      status: Task['status'];
      importance: number;
      due_date: string;
      frequency: HabitFrequency;
      target_count: number;
      reminder_time: string;
      progress: number;
      thresholds: any;
    }>
  ): Promise<Task | null> => {
    if (!token) return null;
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('更新任务失败');
      const data = await response.json();
      await fetchTasks(true);
      return data.task;
    } catch (err: any) {
      console.error(err);
      setError(err.message || '更新任务失败');
      return null;
    }
  }, [token, fetchTasks]);

  const fetchSubtasks = useCallback(async (parentId: string): Promise<Task[]> => {
    if (!token) return [];
    try {
      const response = await fetch(`/api/tasks/${parentId}/subtasks`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('获取子任务失败');
      const data = await response.json();
      return data.subtasks || [];
    } catch (err) {
      console.error(err);
      setError('获取子任务失败');
      return [];
    }
  }, [token]);

  const createSubtask = useCallback(async (
    parentId: string,
    subtaskData: { title: string; description?: string; importance?: number; due_date?: string }
  ): Promise<Task | null> => {
    if (!token) return null;
    try {
      const response = await fetch(`/api/tasks/${parentId}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(subtaskData),
      });
      if (!response.ok) throw new Error('创建子任务失败');
      const data = await response.json();
      await fetchTasks(true);
      return data.subtask;
    } catch (err: any) {
      console.error(err);
      setError(err.message || '创建子任务失败');
      return null;
    }
  }, [token, fetchTasks]);

  const checkinHabit = useCallback(async (taskId: string): Promise<{
    task: Task;
    streak: number;
    best_streak: number;
    is_consecutive: boolean;
  } | null> => {
    if (!token) return null;
    try {
      const response = await fetch(`/api/tasks/${taskId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 409) throw new Error('今天已经打卡了');
        throw new Error('打卡失败');
      }
      const data = await response.json();
      await fetchTasks(true);
      trackUserAction('habit_checkin');
      const newlyUnlocked = await checkAchievements({ skipCelebration: true });
      if (newlyUnlocked.length > 0) {
        triggerAchievementCelebration(newlyUnlocked);
      }
      return data;
    } catch (err: any) {
      console.error(err);
      setError(err.message || '打卡失败');
      return null;
    }
  }, [token, fetchTasks]);

  return {
    tasks,
    goals,
    stats,
    loading,
    error,
    createTask,
    updateTask,
    updateTaskStatus,
    updateTaskStatusOptimistic,
    deleteTask,
    newlyUnlockedAchievements,
    refetch: fetchTasks,
    fetchQuadrantData,
    fetchThresholds,
    updateThresholds,
    fetchTaskDetail,
    patchTask,
    fetchSubtasks,
    createSubtask,
    checkinHabit,
  };
}

export function useQuickTasks() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<TaskWithGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchQuickTasks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/tasks?type=quick', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('获取快捷任务失败');
      }
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
      setError('获取快捷任务失败');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchQuickTasks();
  }, [fetchQuickTasks]);

  const createQuickTask = async (title: string) => {
    if (!token) return null;
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          type: 'quick' as TaskType,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '创建任务失败');
      }
      await fetchQuickTasks();
      return data.task;
    } catch (err: any) {
      setError(err.message || '创建任务失败');
      return null;
    }
  };

  return {
    tasks,
    loading,
    error,
    createQuickTask,
    refetch: fetchQuickTasks,
  };
}
