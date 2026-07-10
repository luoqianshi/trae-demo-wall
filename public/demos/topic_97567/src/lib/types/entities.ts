// Strong type definitions for all persistent entities.
// Replaces the any[] fields in the original LocalData interface.

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export type TaskType = 'normal' | 'quick' | 'big' | 'habit';
export type TaskStatus = 'pending' | 'completed';

export interface Task {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  description: string | null;
  task_type: TaskType;
  status: TaskStatus;
  importance: number | null;
  urgency: string | null;
  quadrant: number | null;
  due_date: string | null;
  parent_id: string | null;
  progress: number;
  frequency: string | null;
  target_count: number | null;
  current_streak: number;
  best_streak: number;
  reminder_time: string | null;
  completed_at: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export type RecordType = 'success' | 'reflection' | 'gratitude' | 'challenge' | string;

export interface DiaryRecord {
  id: string;
  user_id: string;
  record_type: RecordType;
  title?: string;
  content: string;
  tags?: string[];
  mood?: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface Challenge {
  id: string;
  challenge_type: 'bronze' | 'silver' | 'gold';
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
  reward: { score: number; badge_fragments?: number; badge_id?: string; special_reward?: string };
  is_active: boolean;
  is_recurring: boolean;
  display_order: number;
  created_at: string;
}

export type UserChallengeStatus = 'active' | 'completed' | 'failed' | 'abandoned';

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  status: UserChallengeStatus;
  progress: number;
  current_day: number;
  streak_days: number;
  make_up_count: number;
  max_make_ups: number;
  started_at: string;
  completed_at: string | null;
  last_progress_at: string | null;
  daily_records: Array<{ date: string; completed: boolean; record_id?: string; completed_at?: string }>;
  updated_at?: string;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface ProcrastinationSession {
  id: string;
  user_id: string;
  goal: string;
  current_state: string;
  steps: Array<{ task: string; completed: boolean }>;
  current_step_index: number;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  record_id: string;
  role: 'assistant' | 'user';
  content: string;
  created_at: string;
}

export interface EncouragementPost {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  [key: string]: unknown;
}

export interface EncouragementLike {
  id?: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  remind_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface Threshold {
  user_id: string;
  type: string;
  big_task_id: string | null;
  critical: number;
  high: number;
  medium: number;
  low: number;
  none: number;
}

export interface GrowthData {
  id: string;
  user_id: string;
  date: string;
  achievements_count: number;
  tasks_completed: number;
  records_count: number;
  snowball_size?: number;
  created_at: string;
  [key: string]: unknown;
}

export interface ScoreEvent {
  id: string;
  user_id: string;
  action: string;
  score: number;
  ref_id?: string;
  created_at: string;
}

export interface UserInteraction {
  user_id: string;
  type: 'snowball_interaction' | 'snowball_click';
  count: number;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  settings: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface LocalData {
  users: User[];
  goals: Goal[];
  tasks: Task[];
  records: DiaryRecord[];
  thresholds: Threshold[];
  growthData: GrowthData[];
  userAchievements: UserAchievement[];
  procrastinationSessions: ProcrastinationSession[];
  conversations: Conversation[];
  challenges: Challenge[];
  userChallenges: UserChallenge[];
  encouragementPosts: EncouragementPost[];
  encouragementLikes: EncouragementLike[];
  reminders: Reminder[];
  userSettings: UserSettings[];
  userInteractions: UserInteraction[];
  scoreEvents: ScoreEvent[];
}
