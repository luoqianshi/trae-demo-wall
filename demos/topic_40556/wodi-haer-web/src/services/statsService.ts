// 统计服务

import { api } from './api';
import type { ApiResponse } from './api';

// ==================== 类型定义 ====================

export interface TodayStats {
  date: string;
  feedingCount: number;
  feedingTotalAmount: number; // 毫升
  sleepTotalDuration: number; // 分钟
  sleepCount: number;
  diaperWetCount: number;
  diaperDirtyCount: number;
  diaperMixedCount: number;
}

export interface WeekStats {
  startDate: string;
  endDate: string;
  dailyStats: TodayStats[];
  feedingAverage: number;
  sleepAverage: number; // 小时
  diaperAverage: number;
}

export interface MonthStats {
  year: number;
  month: number;
  dailyStats: TodayStats[];
  feedingTrend: { date: string; amount: number }[];
  sleepTrend: { date: string; duration: number }[];
  diaperTrend: { date: string; count: number }[];
  summary: {
    totalFeedings: number;
    averageSleepHours: number;
    totalDiapers: number;
    bestSleepDay: string;
    worstSleepDay: string;
  };
}

// ==================== 服务实现 ====================

export const statsService = {
  // 获取今日统计
  getTodayStats(babyId: string): Promise<ApiResponse<TodayStats>> {
    return api.get<TodayStats>(`/babies/${babyId}/stats/today`);
  },

  // 获取本周统计
  getWeekStats(babyId: string): Promise<ApiResponse<WeekStats>> {
    return api.get<WeekStats>(`/babies/${babyId}/stats/week`);
  },

  // 获取本月统计
  getMonthStats(babyId: string, year?: number, month?: number): Promise<ApiResponse<MonthStats>> {
    const params: Record<string, string | number> = {};
    if (year) params.year = year;
    if (month) params.month = month;

    return api.get<MonthStats>(`/babies/${babyId}/stats/month`, params);
  },
};
