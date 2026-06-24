// 宝宝信息服务

import { api } from './api';
import type { ApiResponse } from './api';

// ==================== 类型定义 ====================

export interface Baby {
  id: string;
  name: string;
  gender: 'male' | 'female';
  birthday: string;
  avatar?: string;
  familyId?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Family {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: string;
}

export interface CreateBabyDTO {
  name: string;
  gender: 'male' | 'female';
  birthday: string;
  avatar?: string;
  familyId?: string;
  isDefault?: boolean;
  height?: number;
  weight?: number;
}

// ==================== 服务实现 ====================

export const babyService = {
  // 获取宝宝列表
  getBabies(): Promise<ApiResponse<Baby[]>> {
    return api.get<Baby[]>('/babies');
  },

  // 根据ID获取宝宝详情
  getBabyById(id: string): Promise<ApiResponse<Baby>> {
    return api.get<Baby>(`/babies/${id}`);
  },

  // 创建宝宝档案
  createBaby(data: CreateBabyDTO): Promise<ApiResponse<Baby>> {
    return api.post<Baby>('/babies', data);
  },

  // 更新宝宝信息
  updateBaby(id: string, data: Partial<Baby>): Promise<ApiResponse<Baby>> {
    return api.put<Baby>(`/babies/${id}`, data);
  },

  // 删除宝宝档案
  deleteBaby(id: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/babies/${id}`);
  },

  // 设置默认宝宝
  setDefaultBaby(id: string): Promise<ApiResponse<Baby>> {
    return api.put<Baby>(`/babies/${id}/default`);
  },

  // 获取家庭列表
  getFamilies(): Promise<ApiResponse<Family[]>> {
    return api.get<Family[]>('/families');
  },

  // 创建家庭
  createFamily(data: { name: string; description?: string }): Promise<ApiResponse<Family>> {
    return api.post<Family>('/families', data);
  },
};
