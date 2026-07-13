// Collection Types
// Shared type definitions for collection-related data

/**
 * 收藏项
 */
export interface Collection {
  id: string;
  url: string;
  title: string;
  description?: string;
  content?: string;
  htmlContent?: string;
  tags: string[];
  notes?: string;
  isFavorite: boolean;
  isRead: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  sourceType?: 'web' | 'file' | 'note';
  favicon?: string;
  thumbnail?: string;
  summary?: string;
  keyPoints?: string[];
}

/**
 * 收藏列表项（简化版）
 */
export interface CollectionItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  content?: string;
  tags: string[];
  isFavorite: boolean;
  isRead: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  favicon?: string;
  thumbnail?: string;
  sourceType?: 'web' | 'file' | 'note';
}

/**
 * 收藏详情（包含完整信息）
 */
export interface CollectionDetail extends Collection {
  versions?: CollectionVersion[];
  relatedCollections?: CollectionItem[];
}

/**
 * 收藏版本
 */
export interface CollectionVersion {
  id: string;
  collectionId: string;
  content: string;
  htmlContent?: string;
  checksum: string;
  createdAt: string;
  changeDescription?: string;
}

/**
 * 收藏筛选选项
 */
export interface CollectionFilter {
  tags?: string[];
  sourceType?: 'web' | 'wechat' | 'github' | 'local' | 'file' | 'note';
  isFavorite?: boolean;
  isRead?: boolean;
  isDeleted?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

/**
 * 收藏排序选项
 */
export interface CollectionSort {
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'viewCount';
  sortOrder: 'asc' | 'desc';
}

/**
 * 收藏列表状态
 */
export interface CollectionListState {
  items: CollectionItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * 创建收藏请求
 */
export interface CreateCollectionInput {
  url: string;
  title?: string;
  description?: string;
  tags?: string[];
  notes?: string;
  autoScrape?: boolean;
}

/**
 * 更新收藏请求
 */
export interface UpdateCollectionInput {
  title?: string;
  description?: string;
  tags?: string[];
  notes?: string;
}

/**
 * 收藏操作结果
 */
export interface CollectionOperationResult {
  success: boolean;
  data?: Collection;
  error?: string;
}