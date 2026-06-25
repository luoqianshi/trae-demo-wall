// 统一导出所有服务模块
// 使用示例：import { api, babyService } from '@/services';

// ==================== 基础 API ====================

export { api, ApiError } from './api';
export type { ApiResponse, RequestOptions } from './api';

// ==================== 认证服务 ====================

export { authService } from './auth';

// ==================== 宝宝信息服务 ====================

export { babyService } from './babyService';
export type { Baby, Family, CreateBabyDTO } from './babyService';

// ==================== 记录服务（喂养、睡眠、排便、里程碑）====================

export { recordService } from './recordService';
export type {
  FeedingRecord,
  SleepRecord,
  DiaperRecord,
  MilestoneRecord,
} from './recordService';

// ==================== 统计服务 ====================

export { statsService } from './statsService';
export type { TodayStats, WeekStats, MonthStats } from './statsService';

// ==================== 知识库服务 ====================

export { knowledgeService } from './knowledgeService';
export type { Article, Category, ArticleList } from './knowledgeService';

// ==================== 新闻服务 ====================

export { newsService } from './newsService';
export type { NewsItem, NewsCategory, NewsList } from './newsService';

// ==================== 健康档案服务 ====================

export { healthService } from './healthService';
export type { Vaccination, Checkup, GrowthData } from './healthService';
