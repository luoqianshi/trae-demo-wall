// 知识库服务

import { api } from './api';
import type { ApiResponse } from './api';

// ==================== 类型定义 ====================

export interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  stage: string[];
  ageRange?: string;
  readTime: string;
  tags: string[];
  content: string;
  viewCount?: number;
  likeCount?: number;
  createdAt: string;
}

export interface Category {
  key: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface ArticleList {
  list: Article[];
  total: number;
  page: number;
  pageSize: number;
}

// ==================== 服务实现 ====================

export const knowledgeService = {
  // 获取文章列表
  getArticles(params?: {
    category?: string;
    stage?: string;
    page?: number;
    pageSize?: number;
    keyword?: string;
  }): Promise<ApiResponse<ArticleList>> {
    return api.get<ArticleList>('/knowledge/articles', params);
  },

  // 根据ID获取文章详情
  getArticleById(id: string): Promise<ApiResponse<Article>> {
    return api.get<Article>(`/knowledge/articles/${id}`);
  },

  // 获取分类列表
  getCategories(): Promise<ApiResponse<Category[]>> {
    return api.get<Category[]>('/knowledge/categories');
  },

  // 获取推荐文章（根据阶段）
  getRecommended(stage?: string): Promise<ApiResponse<Article[]>> {
    const params = stage ? { stage } : undefined;
    return api.get<Article[]>('/knowledge/recommended', params);
  },
};
