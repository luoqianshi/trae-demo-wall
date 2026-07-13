// AI Store
// Zustand store for AI state management

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import {
  AITask,
  AIProviderType,
  AIServiceStatus,
  GenerateSummaryInput,
  GenerateSummaryResult,
  GenerateTagsInput,
  GenerateTagsResult,
  GenerateKeyPointsInput,
  GenerateKeyPointsResult,
  GenerateEmbeddingInput,
  GenerateEmbeddingResult,
  AITestConnectionResult,
} from '../../shared/types/ai';
import { isDev } from './constants';

/**
 * AI Store 状态接口
 */
export interface AIStore {
  // 任务状态
  tasks: AITask[];
  currentTaskId: string | null;

  // 服务状态
  serviceStatus: AIServiceStatus[];
  currentProvider: AIProviderType;

  // 全局状态
  loading: boolean;
  error: string | null;

  // AI 生成操作
  generateSummary: (input: GenerateSummaryInput, collectionId?: string) => Promise<GenerateSummaryResult | null>;
  generateTags: (input: GenerateTagsInput, collectionId?: string) => Promise<GenerateTagsResult | null>;
  generateKeyPoints: (input: GenerateKeyPointsInput, collectionId?: string) => Promise<GenerateKeyPointsResult | null>;
  generateEmbedding: (input: GenerateEmbeddingInput, collectionId?: string) => Promise<GenerateEmbeddingResult | null>;

  // 测试连接
  testConnection: (provider: AIProviderType) => Promise<AITestConnectionResult | null>;

  // 任务管理
  getTask: (taskId: string) => AITask | undefined;
  getTasksByCollection: (collectionId: string) => AITask[];
  clearTasks: () => void;
  removeTask: (taskId: string) => void;

  // 服务状态管理
  updateServiceStatus: (provider: AIProviderType, status: Partial<AIServiceStatus>) => void;
  checkAllServices: () => Promise<void>;

  // 本地操作
  setCurrentProvider: (provider: AIProviderType) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * 默认状态
 */
const initialState = {
  tasks: [] as AITask[],
  currentTaskId: null as string | null,
  serviceStatus: [] as AIServiceStatus[],
  currentProvider: 'none' as AIProviderType,
  loading: false,
  error: null as string | null,
};

/**
 * 创建 AI Store
 */
export const useAIStore = create<AIStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // 生成摘要
        generateSummary: async (input: GenerateSummaryInput, collectionId?: string) => {
          const taskId = `summary-${Date.now()}`;
          const task: AITask = {
            id: taskId,
            type: 'summary',
            collectionId,
            status: 'processing',
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set({
            tasks: [...get().tasks, task],
            currentTaskId: taskId,
            loading: true,
            error: null,
          });

          try {
            const response = await window.electronAPI.ai.generateSummary(input.content);

            if (response.success && response.data) {
              // 更新任务状态
              set({
                tasks: get().tasks.map((t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        status: 'completed',
                        progress: 100,
                        result: response.data,
                        updatedAt: new Date().toISOString(),
                      }
                    : t
                ),
                loading: false,
              });

              return { summary: response.data.summary };
            } else {
              // 更新任务失败状态
              set({
                tasks: get().tasks.map((t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        status: 'failed',
                        error: response.error || '生成摘要失败',
                        updatedAt: new Date().toISOString(),
                      }
                    : t
                ),
                error: response.error || '生成摘要失败',
                loading: false,
              });

              return null;
            }
          } catch (error) {
            // 更新任务失败状态
            set({
              tasks: get().tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      status: 'failed',
                      error: (error as Error).message,
                      updatedAt: new Date().toISOString(),
                    }
                  : t
              ),
              error: (error as Error).message,
              loading: false,
            });

            return null;
          }
        },

        // 生成标签
        generateTags: async (input: GenerateTagsInput, collectionId?: string) => {
          const taskId = `tags-${Date.now()}`;
          const task: AITask = {
            id: taskId,
            type: 'tags',
            collectionId,
            status: 'processing',
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set({
            tasks: [...get().tasks, task],
            currentTaskId: taskId,
            loading: true,
            error: null,
          });

          try {
            const response = await window.electronAPI.ai.generateTags(input.content);

            if (response.success && response.data) {
              set({
                tasks: get().tasks.map((t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        status: 'completed',
                        progress: 100,
                        result: response.data,
                        updatedAt: new Date().toISOString(),
                      }
                    : t
                ),
                loading: false,
              });

              return { tags: response.data.tags };
            } else {
              set({
                tasks: get().tasks.map((t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        status: 'failed',
                        error: response.error || '生成标签失败',
                        updatedAt: new Date().toISOString(),
                      }
                    : t
                ),
                error: response.error || '生成标签失败',
                loading: false,
              });

              return null;
            }
          } catch (error) {
            set({
              tasks: get().tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      status: 'failed',
                      error: (error as Error).message,
                      updatedAt: new Date().toISOString(),
                    }
                  : t
              ),
              error: (error as Error).message,
              loading: false,
            });

            return null;
          }
        },

        // 生成要点
        generateKeyPoints: async (input: GenerateKeyPointsInput, collectionId?: string) => {
          const taskId = `keyPoints-${Date.now()}`;
          const task: AITask = {
            id: taskId,
            type: 'keyPoints',
            collectionId,
            status: 'processing',
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set({
            tasks: [...get().tasks, task],
            currentTaskId: taskId,
            loading: true,
            error: null,
          });

          try {
            const response = await window.electronAPI.ai.generateKeyPoints(input.content);

            if (response.success && response.data) {
              set({
                tasks: get().tasks.map((t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        status: 'completed',
                        progress: 100,
                        result: response.data,
                        updatedAt: new Date().toISOString(),
                      }
                    : t
                ),
                loading: false,
              });

              return { keyPoints: response.data.keyPoints };
            } else {
              set({
                tasks: get().tasks.map((t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        status: 'failed',
                        error: response.error || '生成要点失败',
                        updatedAt: new Date().toISOString(),
                      }
                    : t
                ),
                error: response.error || '生成要点失败',
                loading: false,
              });

              return null;
            }
          } catch (error) {
            set({
              tasks: get().tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      status: 'failed',
                      error: (error as Error).message,
                      updatedAt: new Date().toISOString(),
                    }
                  : t
              ),
              error: (error as Error).message,
              loading: false,
            });

            return null;
          }
        },

        // 生成嵌入向量
        generateEmbedding: async (input: GenerateEmbeddingInput, collectionId?: string) => {
          const taskId = `embedding-${Date.now()}`;
          const task: AITask = {
            id: taskId,
            type: 'embedding',
            collectionId,
            status: 'processing',
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set({
            tasks: [...get().tasks, task],
            currentTaskId: taskId,
            loading: true,
            error: null,
          });

          try {
            const response = await window.electronAPI.ai.generateEmbedding(input.text);

            if (response.success && response.data) {
              set({
                tasks: get().tasks.map((t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        status: 'completed',
                        progress: 100,
                        result: response.data,
                        updatedAt: new Date().toISOString(),
                      }
                    : t
                ),
                loading: false,
              });

              return { embedding: response.data.embedding };
            } else {
              set({
                tasks: get().tasks.map((t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        status: 'failed',
                        error: response.error || '生成嵌入向量失败',
                        updatedAt: new Date().toISOString(),
                      }
                    : t
                ),
                error: response.error || '生成嵌入向量失败',
                loading: false,
              });

              return null;
            }
          } catch (error) {
            set({
              tasks: get().tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      status: 'failed',
                      error: (error as Error).message,
                      updatedAt: new Date().toISOString(),
                    }
                  : t
              ),
              error: (error as Error).message,
              loading: false,
            });

            return null;
          }
        },

        // 测试连接
        testConnection: async (provider: AIProviderType) => {
          set({ loading: true, error: null });

          try {
            const startTime = Date.now();
            const response = await window.electronAPI.ai.testConnection(provider);
            const latency = Date.now() - startTime;

            if (response.success && response.data) {
              // 更新服务状态
              get().updateServiceStatus(provider, {
                available: response.data.success,
                lastChecked: new Date().toISOString(),
              });

              set({ loading: false });

              return {
                success: response.data.success,
                provider,
                message: response.data.message,
                latency,
              };
            } else {
              get().updateServiceStatus(provider, {
                available: false,
                lastChecked: new Date().toISOString(),
              });

              set({
                error: response.error || '测试连接失败',
                loading: false,
              });

              return null;
            }
          } catch (error) {
            get().updateServiceStatus(provider, {
              available: false,
              lastChecked: new Date().toISOString(),
            });

            set({
              error: (error as Error).message,
              loading: false,
            });

            return null;
          }
        },

        // 获取任务
        getTask: (taskId: string) => {
          return get().tasks.find((t) => t.id === taskId);
        },

        // 获取指定收藏的任务
        getTasksByCollection: (collectionId: string) => {
          return get().tasks.filter((t) => t.collectionId === collectionId);
        },

        // 清空所有任务
        clearTasks: () => {
          set({ tasks: [], currentTaskId: null });
        },

        // 删除指定任务
        removeTask: (taskId: string) => {
          const state = get();
          set({
            tasks: state.tasks.filter((t) => t.id !== taskId),
            currentTaskId: state.currentTaskId === taskId ? null : state.currentTaskId,
          });
        },

        // 更新服务状态
        updateServiceStatus: (provider: AIProviderType, status: Partial<AIServiceStatus>) => {
          const state = get();
          const existingIndex = state.serviceStatus.findIndex((s) => s.provider === provider);

          if (existingIndex >= 0) {
            set({
              serviceStatus: state.serviceStatus.map((s, i) =>
                i === existingIndex ? { ...s, ...status } : s
              ),
            });
          } else {
            set({
              serviceStatus: [
                ...state.serviceStatus,
                {
                  provider,
                  available: false,
                  lastChecked: new Date().toISOString(),
                  ...status,
                },
              ],
            });
          }
        },

        // 检查所有服务状态
        checkAllServices: async () => {
          const providers: AIProviderType[] = ['openai', 'claude', 'ollama'];

          for (const provider of providers) {
            await get().testConnection(provider);
          }
        },

        // 设置当前提供商
        setCurrentProvider: (provider: AIProviderType) => {
          set({ currentProvider: provider });
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
        name: 'ai-store',
        partialize: (state) => ({
          currentProvider: state.currentProvider,
          serviceStatus: state.serviceStatus,
        }),
      }
    ),
    { name: 'AIStore', enabled: isDev }
  )
);