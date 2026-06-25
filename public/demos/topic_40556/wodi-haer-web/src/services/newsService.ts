// 新闻服务

import { api } from './api';
import type { ApiResponse } from './api';

// ==================== 类型定义 ====================

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: 'recall' | 'alert' | 'policy' | 'research' | 'incident';
  categoryLabel: string;
  source: string;
  date: string;
  urgency: 'high' | 'medium' | 'low';
  tags: string[];
  content: string;
  safetyTips?: string[];
  viewCount?: number;
}

export interface NewsCategory {
  key: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface NewsList {
  list: NewsItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ==================== 服务实现 ====================

export const newsService = {
  // 获取新闻列表
  getNewsList(params?: {
    category?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<NewsList>> {
    return api.get<NewsList>('/news', params);
  },

  // 根据ID获取新闻详情
  getNewsById(id: string): Promise<ApiResponse<NewsItem>> {
    return api.get<NewsItem>(`/news/${id}`);
  },

  // 获取紧急/重要新闻
  getUrgentNews(): Promise<ApiResponse<NewsItem[]>> {
    return api.get<NewsItem[]>('/news/urgent');
  },

  // 获取新闻分类列表
  getCategories(): Promise<ApiResponse<NewsCategory[]>> {
    return api.get<NewsCategory[]>('/news/categories');
  },
};
