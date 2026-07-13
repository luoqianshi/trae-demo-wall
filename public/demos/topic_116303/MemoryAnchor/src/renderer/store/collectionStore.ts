// Collection Store
// Zustand store for collection state management

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import {
  Collection,
  CollectionItem,
  CollectionDetail,
  CollectionFilter,
  CollectionSort,
  CreateCollectionInput,
  UpdateCollectionInput,
} from '../../shared/types/collection';
import type { CollectionStatsData } from '../../shared/types/ipc';
import { isDev } from './constants';

/**
 * Collection Store 状态接口
 */
export interface CollectionStore {
  // 状态
  items: CollectionItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  currentCollection: CollectionDetail | null;
  loading: boolean;
  error: string | null;

  // 统计信息（总数、今日新增、AI 处理、存储占用）
  stats: CollectionStatsData | null;

  // 筛选和排序
  filter: CollectionFilter;
  sort: CollectionSort;

  // 操作
  fetchCollections: (page?: number, append?: boolean) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchCollection: (id: string) => Promise<void>;
  createCollection: (input: CreateCollectionInput) => Promise<Collection | null>;
  updateCollection: (id: string, input: UpdateCollectionInput) => Promise<Collection | null>;
  deleteCollection: (id: string) => Promise<boolean>;
  restoreCollection: (id: string) => Promise<boolean>;
  deletePermanently: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<boolean>;
  markAsRead: (id: string) => Promise<boolean>;

  // 筛选和排序操作
  setFilter: (filter: Partial<CollectionFilter>) => void;
  resetFilter: () => void;
  setSort: (sort: Partial<CollectionSort>) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;

  // 本地操作
  clearCurrentCollection: () => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * 默认筛选状态
 */
const defaultFilter: CollectionFilter = {
  tags: undefined,
  sourceType: undefined,
  isFavorite: undefined,
  isRead: undefined,
  isDeleted: false,
  dateRange: undefined,
  search: undefined,
};

/**
 * 默认排序状态
 */
const defaultSort: CollectionSort = {
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * 默认状态
 */
const initialState = {
  items: [] as CollectionItem[],
  total: 0,
  page: 1,
  pageSize: 20,
  hasMore: true,
  currentCollection: null as CollectionDetail | null,
  loading: false,
  error: null as string | null,
  stats: null as CollectionStatsData | null,
  filter: defaultFilter,
  sort: defaultSort,
};

/**
 * 创建 Collection Store
 */
export const useCollectionStore = create<CollectionStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // 获取收藏列表
        fetchCollections: async (page = 1, append = false) => {
          set({ loading: true, error: null });
          try {
            const state = get();
            const params = {
              page,
              pageSize: state.pageSize,
              sortBy: state.sort.sortBy,
              sortOrder: state.sort.sortOrder,
              ...state.filter,
            };

            const response = await window.electronAPI.collection.list(params);

            if (response.success && response.data) {
              const newItems = response.data.items.map(
                (item): CollectionItem => ({
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
                })
              );

              set({
                items: append ? [...state.items, ...newItems] : newItems,
                total: response.data.total,
                page: response.data.page,
                hasMore: response.data.items.length === state.pageSize,
                loading: false,
              });
              void get().fetchStats();
            } else {
              set({ error: response.error || '获取收藏列表失败', loading: false });
            }
          } catch (error) {
            set({ error: (error as Error).message, loading: false });
          }
        },

        // 获取统计信息
        fetchStats: async () => {
          try {
            const response = await window.electronAPI.collection.stats();
            if (response.success && response.data) {
              set({ stats: response.data });
            }
          } catch {
            // 统计信息获取失败不影响主流程
          }
        },

        // 获取单个收藏详情
        fetchCollection: async (id: string) => {
          set({ loading: true, error: null });
          try {
            const response = await window.electronAPI.collection.get(id);

            if (response.success && response.data) {
              set({
                currentCollection: response.data,
                loading: false,
              });
            } else {
              set({ error: response.error || '获取收藏详情失败', loading: false });
            }
          } catch (error) {
            set({ error: (error as Error).message, loading: false });
          }
        },

        // 创建收藏
        createCollection: async (input: CreateCollectionInput) => {
          set({ loading: true, error: null });
          try {
            const response = await window.electronAPI.collection.create(input);

            if (response.success && response.data) {
              // 刷新列表
              await get().fetchCollections(1);
              set({ loading: false });
              return response.data;
            } else {
              set({ error: response.error || '创建收藏失败', loading: false });
              return null;
            }
          } catch (error) {
            set({ error: (error as Error).message, loading: false });
            return null;
          }
        },

        // 更新收藏
        updateCollection: async (id: string, input: UpdateCollectionInput) => {
          set({ loading: true, error: null });
          try {
            const response = await window.electronAPI.collection.update(id, input);

            if (response.success && response.data) {
              // 更新当前收藏
              const state = get();
              if (state.currentCollection?.id === id) {
                set({
                  currentCollection: response.data,
                });
              }
              // 更新列表中的项
              set({
                items: state.items.map((item) =>
                  item.id === id
                    ? {
                        ...item,
                        title: response.data!.title,
                        description: response.data!.description,
                        tags: response.data!.tags,
                      }
                    : item
                ),
                loading: false,
              });
              return response.data;
            } else {
              set({ error: response.error || '更新收藏失败', loading: false });
              return null;
            }
          } catch (error) {
            set({ error: (error as Error).message, loading: false });
            return null;
          }
        },

        // 删除收藏（移到回收站）
        deleteCollection: async (id: string) => {
          set({ loading: true, error: null });
          try {
            const response = await window.electronAPI.collection.delete(id);

            if (response.success) {
              // 从列表中移除
              const state = get();
              set({
                items: state.items.filter((item) => item.id !== id),
                total: state.total - 1,
                loading: false,
              });
              void get().fetchStats();
              return true;
            } else {
              set({ error: response.error || '删除收藏失败', loading: false });
              return false;
            }
          } catch (error) {
            set({ error: (error as Error).message, loading: false });
            return false;
          }
        },

        // 恢复收藏
        restoreCollection: async (id: string) => {
          set({ loading: true, error: null });
          try {
            const response = await window.electronAPI.collection.restore(id);

            if (response.success && response.data) {
              set({ loading: false });
              void get().fetchStats();
              return true;
            } else {
              set({ error: response.error || '恢复收藏失败', loading: false });
              return false;
            }
          } catch (error) {
            set({ error: (error as Error).message, loading: false });
            return false;
          }
        },

        // 永久删除收藏
        deletePermanently: async (id: string) => {
          set({ loading: true, error: null });
          try {
            const response = await window.electronAPI.collection.deletePermanently(id);

            if (response.success) {
              const state = get();
              set({
                items: state.items.filter((item) => item.id !== id),
                total: state.total - 1,
                loading: false,
              });
              void get().fetchStats();
              return true;
            } else {
              set({ error: response.error || '永久删除失败', loading: false });
              return false;
            }
          } catch (error) {
            set({ error: (error as Error).message, loading: false });
            return false;
          }
        },

        // 切换收藏状态
        toggleFavorite: async (id: string) => {
          try {
            const response = await window.electronAPI.collection.toggleFavorite(id);

            if (response.success && response.data) {
              const state = get();
              // 更新列表中的项
              set({
                items: state.items.map((item) =>
                  item.id === id
                    ? { ...item, isFavorite: response.data!.isFavorite }
                    : item
                ),
              });
              // 更新当前收藏
              if (state.currentCollection?.id === id) {
                set({
                  currentCollection: {
                    ...state.currentCollection,
                    isFavorite: response.data.isFavorite,
                  },
                });
              }
              return true;
            }
            return false;
          } catch (error) {
            set({ error: (error as Error).message });
            return false;
          }
        },

        // 标记为已读
        markAsRead: async (id: string) => {
          try {
            const response = await window.electronAPI.collection.markAsRead(id);

            if (response.success && response.data) {
              const state = get();
              // 更新列表中的项
              set({
                items: state.items.map((item) =>
                  item.id === id ? { ...item, isRead: true } : item
                ),
              });
              // 更新当前收藏
              if (state.currentCollection?.id === id) {
                set({
                  currentCollection: {
                    ...state.currentCollection,
                    isRead: true,
                  },
                });
              }
              return true;
            }
            return false;
          } catch (error) {
            set({ error: (error as Error).message });
            return false;
          }
        },

        // 设置筛选条件
        setFilter: (filter: Partial<CollectionFilter>) => {
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

        // 设置排序条件
        setSort: (sort: Partial<CollectionSort>) => {
          const state = get();
          set({
            sort: { ...state.sort, ...sort },
            page: 1,
          });
        },

        // 设置页码
        setPage: (page: number) => {
          set({ page });
        },

        // 设置每页数量
        setPageSize: (pageSize: number) => {
          set({ pageSize, page: 1 });
        },

        // 清除当前收藏
        clearCurrentCollection: () => {
          set({ currentCollection: null });
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
        name: 'collection-store',
        partialize: (state) => ({
          filter: state.filter,
          sort: state.sort,
          pageSize: state.pageSize,
        }),
      }
    ),
    { name: 'CollectionStore', enabled: isDev }
  )
);