// 用眼相关类型定义

export interface EyeStatus {
  level: 'excellent' | 'good' | 'normal' | 'warning' | 'danger';
  score: number;
  continuousTime: number; // 连续使用时间（分钟）
  todayRestCount: number; // 今日休息次数
  todayRestTime: number; // 今日休息总时长（分钟）
}

export interface EyeTask {
  id: string;
  title: string;
  description: string;
  duration: number; // 建议休息时长（分钟）
  type: 'rest' | 'exercise' | 'massage';
  completed: boolean;
  icon: string;
}

export interface ReminderSettings {
  enabled: boolean;
  interval: number; // 提醒间隔（分钟）
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}