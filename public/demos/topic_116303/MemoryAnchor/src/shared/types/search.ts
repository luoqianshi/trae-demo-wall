// Search Types
// Shared type definitions for search-related data

import { CollectionItem } from './collection';

/**
 * 搜索查询
 */
export interface SearchQuery {
  text: string;
  type: 'fulltext' | 'semantic' | 'hybrid';
  tags?: string[];
  dateRange?: DateRange;
  isFavorite?: boolean;
  isRead?: boolean;
  // Source kinds derived from the URL: 'web' | 'wechat' | 'github' | 'local'.
  sourceType?: string[];
}

/**
 * 日期范围
 */
export interface DateRange {
  start: string;
  end: string;
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  pageSize?: number;
  page?: number;
  searchType?: 'fulltext' | 'semantic' | 'hybrid';
  fuzzyMatch?: boolean;
  highlightMatches?: boolean;
}

/**
 * 搜索结果项
 */
export interface SearchResultItem extends CollectionItem {
  score?: number;
  highlights?: {
    field: string;
    fragments: string[];
  }[];
}

/**
 * 搜索结果
 */
export interface SearchResult {
  items: SearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
  searchType: string;
  searchTimeMs: number;
}

/**
 * 搜索历史项
 */
export interface SearchHistoryItem {
  id: string;
  query: string;
  type: 'fulltext' | 'semantic' | 'hybrid';
  timestamp: string;
  resultCount: number;
}

/**
 * 搜索筛选状态
 */
export interface SearchFilterState {
  tags: string[];
  dateRange?: DateRange;
  isFavorite?: boolean;
  isRead?: boolean;
  sourceType?: 'web' | 'file' | 'note';
}

/**
 * 搜索状态
 */
export interface SearchState {
  query: string;
  type: 'fulltext' | 'semantic' | 'hybrid';
  results: SearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
  searchTimeMs: number;
  isSearching: boolean;
  error?: string;
  filter: SearchFilterState;
  history: SearchHistoryItem[];
}

/**
 * 标签建议
 */
export interface TagSuggestion {
  tag: string;
  count: number;
}

/**
 * 搜索建议
 */
export interface SearchSuggestion {
  text: string;
  type: 'history' | 'popular' | 'suggested';
}