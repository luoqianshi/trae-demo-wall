// Search Store
// Zustand store for search state management

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import {
  SearchResultItem,
  SearchHistoryItem,
  SearchFilterState,
  SearchOptions,
  TagSuggestion,
  SearchSuggestion,
} from '../../shared/types/search';
import { isDev } from './constants';

/**
 * Search Store 状态接口
 */
export interface SearchStore {
  // 搜索状态
  query: string;
  type: 'fulltext' | 'semantic' | 'hybrid';
  results: SearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
  searchTimeMs: number;
  isSearching: boolean;
  error: string | null;

  // 筛选状态
  filter: SearchFilterState;

  // 搜索历史
  history: SearchHistoryItem[];
  maxHistoryCount: number;

  // 标签建议
  tagSuggestions: TagSuggestion[];
  searchSuggestions: SearchSuggestion[];

  // 操作
  search: (queryText: string, options?: SearchOptions) => Promise<void>;
  searchMore: () => Promise<void>;
  clearResults: () => void;
  setQuery: (query: string) => void;
  setType: (type: 'fulltext' | 'semantic' | 'hybrid') => void;
  setFilter: (filter: Partial<SearchFilterState>) => void;
  resetFilter: () => void;

  // 搜索历史操作
  addHistory: (item: SearchHistoryItem) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;

  // 建议操作
  fetchTagSuggestions: (query: string) => Promise<void>;
  clearTagSuggestions: () => void;
  setSearchSuggestions: (suggestions: SearchSuggestion[]) => void;

  // 本地操作
  clearError: () => void;
  reset: () => void;
}

/**
 * 默认筛选状态
 */
const defaultFilter: SearchFilterState = {
  tags: [],
  dateRange: undefined,
  isFavorite: undefined,
  isRead: undefined,
  sourceType: undefined,
};

/**
 * 默认状态
 */
const initialState = {
  query: '',
  type: 'hybrid' as 'fulltext' | 'semantic' | 'hybrid',
  results: [] as SearchResultItem[],
  total: 0,
  page: 1,
  pageSize: 20,
  searchTimeMs: 0,
  isSearching: false,
  error: null as string | null,
  filter: defaultFilter,
  history: [] as SearchHistoryItem[],
  maxHistoryCount: 50,
  tagSuggestions: [] as TagSuggestion[],
  searchSuggestions: [] as SearchSuggestion[],
};

/**
 * 创建 Search Store
 */
export const useSearchStore = create<SearchStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // 执行搜索
        search: async (queryText: string, options?: SearchOptions) => {
          set({ isSearching: true, error: null, query: queryText });
          const startTime = Date.now();

          try {
            const state = get();
            const searchParams = {
              query: queryText,
              page: options?.page || 1,
              pageSize: options?.pageSize || state.pageSize,
              searchType: options?.searchType || state.type,
              filters: {
                tags: state.filter.tags,
                dateRange: state.filter.dateRange,
                isFavorite: state.filter.isFavorite,
                isRead: state.filter.isRead,
              },
            };

            const response = await window.electronAPI.search.search(searchParams);

            if (response.success && response.data) {
              const searchTimeMs = Date.now() - startTime;
              const newResults = response.data.items.map(
                (item): SearchResultItem => ({
                  id: item.id,
                  url: item.url,
                  title: item.title,
                  description: item.description,
                  tags: item.tags,
                  isFavorite: item.isFavorite,
                  isRead: item.isRead,
                  viewCount: item.viewCount,
                  createdAt: item.createdAt,
                  updatedAt: item.updatedAt,
                  favicon: item.favicon,
                  thumbnail: item.thumbnail,
                  score: item.score,
                  highlights: item.highlights,
                })
              );

              set({
                results: newResults,
                total: response.data.total,
                page: response.data.page,
                searchTimeMs,
                isSearching: false,
              });

              // 添加到历史
              if (queryText.trim()) {
                get().addHistory({
                  id: `${Date.now()}-${queryText}`,
                  query: queryText,
                  type: state.type,
                  timestamp: new Date().toISOString(),
                  resultCount: response.data.total,
                });
              }
            } else {
              set({
                error: response.error || '搜索失败',
                isSearching: false,
                searchTimeMs: Date.now() - startTime,
              });
            }
          } catch (error) {
            set({
              error: (error as Error).message,
              isSearching: false,
              searchTimeMs: Date.now() - startTime,
            });
          }
        },

        // 加载更多结果
        searchMore: async () => {
          const state = get();
          if (state.results.length >= state.total) return;

          const nextPage = state.page + 1;
          set({ isSearching: true, error: null });
          const startTime = Date.now();

          try {
            const searchParams = {
              query: state.query,
              page: nextPage,
              pageSize: state.pageSize,
              searchType: state.type,
              filters: {
                tags: state.filter.tags,
                dateRange: state.filter.dateRange,
                isFavorite: state.filter.isFavorite,
                isRead: state.filter.isRead,
              },
            };

            const response = await window.electronAPI.search.search(searchParams);

            if (response.success && response.data) {
              const searchTimeMs = Date.now() - startTime;
              const newResults = response.data.items.map(
                (item): SearchResultItem => ({
                  id: item.id,
                  url: item.url,
                  title: item.title,
                  description: item.description,
                  tags: item.tags,
                  isFavorite: item.isFavorite,
                  isRead: item.isRead,
                  viewCount: item.viewCount,
                  createdAt: item.createdAt,
                  updatedAt: item.updatedAt,
                  favicon: item.favicon,
                  thumbnail: item.thumbnail,
                  score: item.score,
                  highlights: item.highlights,
                })
              );

              set({
                results: [...state.results, ...newResults],
                total: response.data.total,
                page: nextPage,
                searchTimeMs: state.searchTimeMs + searchTimeMs,
                isSearching: false,
              });
            } else {
              set({
                error: response.error || '加载更多失败',
                isSearching: false,
              });
            }
          } catch (error) {
            set({
              error: (error as Error).message,
              isSearching: false,
            });
          }
        },

        // 清除搜索结果
        clearResults: () => {
          set({
            results: [],
            total: 0,
            page: 1,
            searchTimeMs: 0,
            query: '',
          });
        },

        // 设置查询文本
        setQuery: (query: string) => {
          set({ query });
        },

        // 设置搜索类型
        setType: (type: 'fulltext' | 'semantic' | 'hybrid') => {
          set({ type, page: 1 });
        },

        // 设置筛选条件
        setFilter: (filter: Partial<SearchFilterState>) => {
          const state = get();
          set({
            filter: { ...state.filter, ...filter },
            page: 1,
          });
        },

        // 重置筛选条件
        resetFilter: () => {
          set({ filter: defaultFilter, page: 1 });
        },

        // 添加搜索历史
        addHistory: (item: SearchHistoryItem) => {
          const state = get();
          // 避免重复添加相同的查询
          const existingIndex = state.history.findIndex(
            (h) => h.query === item.query && h.type === item.type
          );

          let newHistory: SearchHistoryItem[];
          if (existingIndex >= 0) {
            // 更新现有记录
            newHistory = [
              item,
              ...state.history.slice(0, existingIndex),
              ...state.history.slice(existingIndex + 1),
            ];
          } else {
            // 添加新记录
            newHistory = [item, ...state.history];
          }

          // 限制历史记录数量
          if (newHistory.length > state.maxHistoryCount) {
            newHistory = newHistory.slice(0, state.maxHistoryCount);
          }

          set({ history: newHistory });
        },

        // 删除搜索历史
        removeHistory: (id: string) => {
          const state = get();
          set({
            history: state.history.filter((h) => h.id !== id),
          });
        },

        // 清空搜索历史
        clearHistory: () => {
          set({ history: [] });
        },

        // 获取标签建议
        fetchTagSuggestions: async (query: string) => {
          try {
            const response = await window.electronAPI.search.suggestTags(query, 10);

            if (response.success && response.data) {
              // 转换为 TagSuggestion 格式（假设返回的 tags 数组包含 tag 名称）
              const suggestions: TagSuggestion[] = response.data.tags.map((tag) => ({
                tag,
                count: 0, // 如果后端返回了 count，这里可以使用
              }));
              set({ tagSuggestions: suggestions });
            } else {
              set({ tagSuggestions: [] });
            }
          } catch {
            set({ tagSuggestions: [] });
          }
        },

        // 清除标签建议
        clearTagSuggestions: () => {
          set({ tagSuggestions: [] });
        },

        // 设置搜索建议
        setSearchSuggestions: (suggestions: SearchSuggestion[]) => {
          set({ searchSuggestions: suggestions });
        },

        // 清除错误
        clearError: () => {
          set({ error: null });
        },

        // 重置状态
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'search-store',
        partialize: (state) => ({
          type: state.type,
          pageSize: state.pageSize,
          history: state.history.slice(0, 10), // 只持久化最近 10 条历史
          maxHistoryCount: state.maxHistoryCount,
        }),
      }
    ),
    { name: 'SearchStore', enabled: isDev }
  )
);