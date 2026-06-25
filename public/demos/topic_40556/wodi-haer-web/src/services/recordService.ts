// 记录服务 - 喂养、睡眠、排便、里程碑

import { api } from './api';
import type { ApiResponse } from './api';

// ==================== 喂养记录 ====================

export interface FeedingRecord {
  id: string;
  babyId: string;
  type: 'breast' | 'formula' | 'solid';
  amount?: number; // 毫升或克
  duration?: number; // 分钟
  food?: string; // 辅食名称
  startTime: string;
  endTime?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateFeedingDTO {
  babyId: string;
  type: 'breast' | 'formula' | 'solid';
  amount?: number;
  duration?: number;
  food?: string;
  startTime: string;
  endTime?: string;
  notes?: string;
}

// ==================== 睡眠记录 ====================

export interface SleepRecord {
  id: string;
  babyId: string;
  startTime: string;
  endTime: string;
  duration: number; // 分钟
  quality: 'good' | 'normal' | 'bad';
  notes?: string;
  createdAt: string;
}

export interface CreateSleepDTO {
  babyId: string;
  startTime: string;
  endTime: string;
  quality?: 'good' | 'normal' | 'bad';
  notes?: string;
}

// ==================== 排便记录 ====================

export interface DiaperRecord {
  id: string;
  babyId: string;
  type: 'pee' | 'poop' | 'both';
  time: string;
  color?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateDiaperDTO {
  babyId: string;
  type: 'pee' | 'poop' | 'both';
  time: string;
  color?: string;
  notes?: string;
}

// ==================== 里程碑记录 ====================

export interface MilestoneRecord {
  id: string;
  babyId: string;
  category: 'motor' | 'cognitive' | 'language' | 'social' | 'self_care';
  title: string;
  description: string;
  achievedDate: string;
  ageInMonths: number;
  photo?: string;
  createdAt: string;
}

export interface CreateMilestoneDTO {
  babyId: string;
  category: 'motor' | 'cognitive' | 'language' | 'social' | 'self_care';
  title: string;
  description: string;
  achievedDate: string;
  photo?: string;
}

// ==================== 服务实现 ====================

export const recordService = {
  // ========== 喂养记录 ==========

  getFeedingList(babyId: string, params?: { startDate?: string; endDate?: string; page?: number; pageSize?: number }): Promise<ApiResponse<FeedingRecord[]>> {
    return api.get<FeedingRecord[]>(`/records/feeding/${babyId}`, params);
  },

  createFeeding(data: CreateFeedingDTO): Promise<ApiResponse<FeedingRecord>> {
    return api.post<FeedingRecord>('/records/feeding', data);
  },

  deleteFeeding(id: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/records/feeding/${id}`);
  },

  // ========== 睡眠记录 ==========

  getSleepList(babyId: string, params?: { startDate?: string; endDate?: string; page?: number; pageSize?: number }): Promise<ApiResponse<SleepRecord[]>> {
    return api.get<SleepRecord[]>(`/records/sleep/${babyId}`, params);
  },

  createSleep(data: CreateSleepDTO): Promise<ApiResponse<SleepRecord>> {
    return api.post<SleepRecord>('/records/sleep', data);
  },

  deleteSleep(id: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/records/sleep/${id}`);
  },

  // ========== 排便记录 ==========

  getDiaperList(babyId: string, params?: { startDate?: string; endDate?: string; page?: number; pageSize?: number }): Promise<ApiResponse<DiaperRecord[]>> {
    return api.get<DiaperRecord[]>(`/records/diaper/${babyId}`, params);
  },

  createDiaper(data: CreateDiaperDTO): Promise<ApiResponse<DiaperRecord>> {
    return api.post<DiaperRecord>('/records/diaper', data);
  },

  deleteDiaper(id: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/records/diaper/${id}`);
  },

  // ========== 里程碑记录 ==========

  getMilestoneList(babyId: string, params?: { category?: string; page?: number; pageSize?: number }): Promise<ApiResponse<MilestoneRecord[]>> {
    return api.get<MilestoneRecord[]>(`/records/milestones/${babyId}`, params);
  },

  createMilestone(data: CreateMilestoneDTO): Promise<ApiResponse<MilestoneRecord>> {
    return api.post<MilestoneRecord>('/records/milestones', data);
  },

  deleteMilestone(id: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/records/milestones/${id}`);
  },
};
