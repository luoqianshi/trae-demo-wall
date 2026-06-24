// 健康档案服务

import { api } from './api';
import type { ApiResponse } from './api';

// ==================== 类型定义 ====================

// 疫苗接种记录
export interface Vaccination {
  id: string;
  babyId: string;
  vaccineName: string;
  type: 'free' | 'paid';
  scheduledDate: string; // 计划接种日期
  actualDate?: string; // 实际接种日期
  status: 'scheduled' | 'completed' | 'missed' | 'delayed';
  batchNumber?: string;
  nextVaccineDate?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateVaccinationDTO {
  babyId: string;
  vaccineName: string;
  type: 'free' | 'paid';
  scheduledDate: string;
  notes?: string;
}

// 体检记录
export interface Checkup {
  id: string;
  babyId: string;
  checkupType: 'routine' | 'follow_up' | 'special';
  date: string;
  ageInMonths: number;
  weight?: number; // kg
  height?: number; // cm
  headCircumference?: number; // cm
  doctorNotes?: string;
  recommendations?: string[];
  nextCheckupDate?: string;
  attachments?: string[]; // 文件URL列表
  createdAt: string;
}

export interface CreateCheckupDTO {
  babyId: string;
  checkupType: 'routine' | 'follow_up' | 'special';
  date: string;
  weight?: number;
  height?: number;
  headCircumference?: number;
  doctorNotes?: string;
  recommendations?: string[];
  nextCheckupDate?: string;
}

// 成长曲线数据
export interface GrowthData {
  babyId: string;
  records: GrowthRecord[];
  standards: GrowthStandard;
}

export interface GrowthRecord {
  date: string;
  ageInMonths: number;
  weight?: number;
  height?: number;
  headCircumference?: number;
}

export interface GrowthStandard {
  weight: { month: number; p3: number; p15: number; p50: number; p85: number; p97: number }[];
  height: { month: number; p3: number; p15: number; p50: number; p85: number; p97: number }[];
  headCircumference: { month: number; p3: number; p15: number; p50: number; p85: number; p97: number }[];
}

// ==================== 服务实现 ====================

export const healthService = {
  // ========== 疫苗接种 ==========

  // 获取疫苗接种列表
  getVaccinations(babyId: string): Promise<ApiResponse<Vaccination[]>> {
    return api.get<Vaccination[]>(`/babies/${babyId}/vaccinations`);
  },

  // 创建疫苗接种计划
  createVaccination(data: CreateVaccinationDTO): Promise<ApiResponse<Vaccination>> {
    return api.post<Vaccination>(`/babies/${data.babyId}/vaccinations`, data);
  },

  // 更新疫苗接种记录
  updateVaccination(id: string, data: Partial<Vaccination>): Promise<ApiResponse<Vaccination>> {
    return api.put<Vaccination>(`/vaccinations/${id}`, data);
  },

  // ========== 体检记录 ==========

  // 获取体检记录列表
  getCheckups(babyId: string): Promise<ApiResponse<Checkup[]>> {
    return api.get<Checkup[]>(`/babies/${babyId}/checkups`);
  },

  // 创建体检记录
  createCheckup(data: CreateCheckupDTO): Promise<ApiResponse<Checkup>> {
    return api.post<Checkup>(`/babies/${data.babyId}/checkups`, data);
  },

  // 更新体检记录
  updateCheckup(id: string, data: Partial<Checkup>): Promise<ApiResponse<Checkup>> {
    return api.put<Checkup>(`/checkups/${id}`, data);
  },

  // ========== 成长曲线 ==========

  // 获取成长曲线数据
  getGrowthCurve(babyId: string): Promise<ApiResponse<GrowthData>> {
    return api.get<GrowthData>(`/babies/${babyId}/growth`);
  },
};
