// 闯关相关类型定义

export interface Challenge {
  id: string;
  level: number;
  title: string;
  description: string;
  tasks: ChallengeTask[];
  reward: {
    points: number;
    badge?: string;
  };
  status: 'locked' | 'current' | 'completed';
  progress: number; // 0-100
}

export interface ChallengeTask {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  completed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface LeaderboardItem {
  rank: number;
  nickname: string;
  avatar: string;
  points: number;
  level: number;
}