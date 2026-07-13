// Store Index
// Root store configuration and exports

/**
 * 开发环境配置（从 constants 重导出，避免循环依赖）
 */
export { isDev } from './constants';

/**
 * Store 持久化配置
 */
export const persistConfig = {
  name: 'memory-anchor-store',
  version: 1,
};

/**
 * 导出所有 Store Hooks
 */
export { useCollectionStore } from './collectionStore';
export { useSearchStore } from './searchStore';
export { useConfigStore } from './configStore';
export { useUIStore } from './uiStore';
export { useAIStore } from './aiStore';

/**
 * 导出类型定义
 */
export type { CollectionStore } from './collectionStore';
export type { SearchStore } from './searchStore';
export type { ConfigStore } from './configStore';
export type { UIStore, PageType, Notification } from './uiStore';
export type { AIStore } from './aiStore';

/**
 * 导出 UI Store 相关类型
 */
export type {
  NavigationHistoryItem,
  SidebarState,
  DialogState,
} from './uiStore';

/**
 * 重置所有 Store
 */
export const resetAllStores = () => {
  // 这个函数可以在需要时从各个 store 中导入 reset 方法
  // 或者创建一个组合的 reset 函数
};