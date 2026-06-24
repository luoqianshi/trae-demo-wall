// 用户相关类型定义

export interface UserProfile {
  id: string;
  nickname: string;
  avatar: string;
  level: number;
  points: number;
  joinDate: string;
}

export interface UserStatistics {
  totalRestDays: number;
  totalRestTime: number;
  completedChallenges: number;
  currentStreak: number; // 连续打卡天数
  bestStreak: number;
}

export interface EyeHealthRecord {
  date: string;
  avgDailyRestTime: number;
  avgDailyRestCount: number;
  totalScreenTime: number;
  eyeHealthScore: number;
}