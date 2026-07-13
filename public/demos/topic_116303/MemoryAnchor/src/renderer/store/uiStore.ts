// UI Store
// Zustand store for UI state management

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { isDev } from './constants';

/**
 * 导航页面类型
 */
export type PageType = 'home' | 'detail' | 'search' | 'import' | 'settings';

/**
 * 导航历史项
 */
export interface NavigationHistoryItem {
  page: PageType;
  params?: Record<string, string>;
  timestamp: string;
}

/**
 * 侧边栏状态
 */
export interface SidebarState {
  collapsed: boolean;
  width: number;
  activeSection?: string;
}

/**
 * 对话框状态
 */
export interface DialogState {
  createDialog: {
    open: boolean;
    url?: string;
    title?: string;
  };
  settingsDialog: {
    open: boolean;
    activeTab?: string;
  };
  deleteDialog: {
    open: boolean;
    collectionId?: string;
    collectionTitle?: string;
  };
  versionDialog: {
    open: boolean;
    collectionId?: string;
  };
}

/**
 * 通知消息
 */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: string;
}

/**
 * UI Store 状态接口
 */
export interface UIStore {
  // 导航状态
  currentPage: PageType;
  pageParams: Record<string, string>;
  navigationHistory: NavigationHistoryItem[];
  maxHistoryCount: number;

  // 侧边栏状态
  sidebar: SidebarState;

  // 对话框状态
  dialogs: DialogState;

  // 全局 UI 状态
  loading: boolean;
  loadingMessage?: string;
  notifications: Notification[];
  maxNotifications: number;

  // 导航操作
  navigateTo: (page: PageType, params?: Record<string, string>) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  clearHistory: () => void;

  // 侧边栏操作
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setSidebarActiveSection: (section?: string) => void;

  // 对话框操作
  openCreateDialog: (url?: string, title?: string) => void;
  closeCreateDialog: () => void;
  openSettingsDialog: (activeTab?: string) => void;
  closeSettingsDialog: () => void;
  openDeleteDialog: (collectionId: string, collectionTitle: string) => void;
  closeDeleteDialog: () => void;
  openVersionDialog: (collectionId: string) => void;
  closeVersionDialog: () => void;
  closeAllDialogs: () => void;

  // 全局 UI 操作
  setLoading: (loading: boolean, message?: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // 本地操作
  reset: () => void;
}

/**
 * 默认侧边栏状态
 */
const defaultSidebarState: SidebarState = {
  collapsed: false,
  width: 240,
  activeSection: undefined,
};

/**
 * 默认对话框状态
 */
const defaultDialogState: DialogState = {
  createDialog: { open: false },
  settingsDialog: { open: false },
  deleteDialog: { open: false },
  versionDialog: { open: false },
};

/**
 * 默认状态
 */
const initialState = {
  currentPage: 'home' as PageType,
  pageParams: {} as Record<string, string>,
  navigationHistory: [] as NavigationHistoryItem[],
  maxHistoryCount: 50,
  sidebar: defaultSidebarState,
  dialogs: defaultDialogState,
  loading: false,
  loadingMessage: undefined as string | undefined,
  notifications: [] as Notification[],
  maxNotifications: 5,
};

/**
 * 创建 UI Store
 */
export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // 导航到页面
        navigateTo: (page: PageType, params?: Record<string, string>) => {
          const state = get();
          const historyItem: NavigationHistoryItem = {
            page,
            params: params || {},
            timestamp: new Date().toISOString(),
          };

          let newHistory: NavigationHistoryItem[];
          // 如果当前页面已经在历史中，则更新位置
          const currentIndex = state.navigationHistory.findIndex(
            (h) => h.page === state.currentPage && JSON.stringify(h.params) === JSON.stringify(state.pageParams)
          );

          if (currentIndex >= 0) {
            // 移除当前位置之后的历史
            newHistory = [
              ...state.navigationHistory.slice(0, currentIndex + 1),
              historyItem,
            ];
          } else {
            // 添加新历史
            newHistory = [...state.navigationHistory, historyItem];
          }

          // 限制历史记录数量
          if (newHistory.length > state.maxHistoryCount) {
            newHistory = newHistory.slice(-state.maxHistoryCount);
          }

          set({
            currentPage: page,
            pageParams: params || {},
            navigationHistory: newHistory,
          });
        },

        // 返回上一页
        goBack: () => {
          const state = get();
          if (state.navigationHistory.length > 1) {
            const previousItem = state.navigationHistory[state.navigationHistory.length - 2];
            set({
              currentPage: previousItem.page,
              pageParams: previousItem.params,
              navigationHistory: state.navigationHistory.slice(0, -1),
            });
          }
        },

        // 是否可以返回
        canGoBack: () => {
          const state = get();
          return state.navigationHistory.length > 1;
        },

        // 清空历史
        clearHistory: () => {
          set({ navigationHistory: [] });
        },

        // 切换侧边栏
        toggleSidebar: () => {
          const state = get();
          set({
            sidebar: {
              ...state.sidebar,
              collapsed: !state.sidebar.collapsed,
            },
          });
        },

        // 设置侧边栏折叠状态
        setSidebarCollapsed: (collapsed: boolean) => {
          const state = get();
          set({
            sidebar: {
              ...state.sidebar,
              collapsed,
            },
          });
        },

        // 设置侧边栏宽度
        setSidebarWidth: (width: number) => {
          const state = get();
          // 限制宽度范围
          const clampedWidth = Math.max(200, Math.min(400, width));
          set({
            sidebar: {
              ...state.sidebar,
              width: clampedWidth,
            },
          });
        },

        // 设置侧边栏活跃区域
        setSidebarActiveSection: (section?: string) => {
          const state = get();
          set({
            sidebar: {
              ...state.sidebar,
              activeSection: section,
            },
          });
        },

        // 打开创建对话框
        openCreateDialog: (url?: string, title?: string) => {
          set({
            dialogs: {
              ...get().dialogs,
              createDialog: { open: true, url, title },
            },
          });
        },

        // 关闭创建对话框
        closeCreateDialog: () => {
          set({
            dialogs: {
              ...get().dialogs,
              createDialog: { open: false },
            },
          });
        },

        // 打开设置对话框
        openSettingsDialog: (activeTab?: string) => {
          set({
            dialogs: {
              ...get().dialogs,
              settingsDialog: { open: true, activeTab },
            },
          });
        },

        // 关闭设置对话框
        closeSettingsDialog: () => {
          set({
            dialogs: {
              ...get().dialogs,
              settingsDialog: { open: false },
            },
          });
        },

        // 打开删除对话框
        openDeleteDialog: (collectionId: string, collectionTitle: string) => {
          set({
            dialogs: {
              ...get().dialogs,
              deleteDialog: {
                open: true,
                collectionId,
                collectionTitle,
              },
            },
          });
        },

        // 关闭删除对话框
        closeDeleteDialog: () => {
          set({
            dialogs: {
              ...get().dialogs,
              deleteDialog: { open: false },
            },
          });
        },

        // 打开版本对话框
        openVersionDialog: (collectionId: string) => {
          set({
            dialogs: {
              ...get().dialogs,
              versionDialog: { open: true, collectionId },
            },
          });
        },

        // 关闭版本对话框
        closeVersionDialog: () => {
          set({
            dialogs: {
              ...get().dialogs,
              versionDialog: { open: false },
            },
          });
        },

        // 关闭所有对话框
        closeAllDialogs: () => {
          set({
            dialogs: defaultDialogState,
          });
        },

        // 设置加载状态
        setLoading: (loading: boolean, message?: string) => {
          set({ loading, loadingMessage: message });
        },

        // 添加通知
        addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
          const state = get();
          const newNotification: Notification = {
            ...notification,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
          };

          let newNotifications: Notification[];
          if (state.notifications.length >= state.maxNotifications) {
            // 移除最早的 notification
            newNotifications = [...state.notifications.slice(1), newNotification];
          } else {
            newNotifications = [...state.notifications, newNotification];
          }

          set({ notifications: newNotifications });

          // 自动移除通知（如果有 duration）
          if (notification.duration && notification.duration > 0) {
            setTimeout(() => {
              get().removeNotification(newNotification.id);
            }, notification.duration);
          }
        },

        // 移除通知
        removeNotification: (id: string) => {
          const state = get();
          set({
            notifications: state.notifications.filter((n) => n.id !== id),
          });
        },

        // 清空通知
        clearNotifications: () => {
          set({ notifications: [] });
        },

        // 重置状态
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          sidebar: state.sidebar,
          maxHistoryCount: state.maxHistoryCount,
          maxNotifications: state.maxNotifications,
        }),
      }
    ),
    { name: 'UIStore', enabled: isDev }
  )
);