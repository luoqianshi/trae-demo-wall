// Config Store
// Zustand store for configuration state management

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { AppConfig, DEFAULT_CONFIG } from '../../shared/types/config';
import { ConfigData, DeepPartial } from '../../shared/types/ipc';
import { isDev } from './constants';

/**
 * Config Store 状态接口
 */
export interface ConfigStore {
  // 状态
  config: AppConfig;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;

  // 操作
  loadConfig: () => Promise<void>;
  updateConfig: (partial: DeepPartial<AppConfig>) => Promise<boolean>;
  resetConfig: () => Promise<boolean>;
  validateConfig: (config: DeepPartial<AppConfig>) => boolean;

  // 局部更新方法
  updateGeneralConfig: (general: Partial<AppConfig['general']>) => Promise<boolean>;
  updateAppearanceConfig: (appearance: Partial<AppConfig['appearance']>) => Promise<boolean>;
  updateShortcutsConfig: (shortcuts: Partial<AppConfig['shortcuts']>) => Promise<boolean>;
  updateAIConfig: (ai: Partial<AppConfig['ai']>) => Promise<boolean>;
  updateScraperConfig: (scraper: Partial<AppConfig['scraper']>) => Promise<boolean>;
  updateSearchConfig: (search: Partial<AppConfig['search']>) => Promise<boolean>;
  updateBackupConfig: (backup: Partial<AppConfig['backup']>) => Promise<boolean>;
  updateUpdateConfig: (update: Partial<AppConfig['update']>) => Promise<boolean>;

  // 本地操作
  clearError: () => void;
  reset: () => void;
}

/**
 * 默认状态
 */
const initialState = {
  config: DEFAULT_CONFIG,
  loading: false,
  error: null as string | null,
  isInitialized: false,
};

/**
 * 创建 Config Store
 */
export const useConfigStore = create<ConfigStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // 加载配置
        loadConfig: async () => {
          set({ loading: true, error: null });
          try {
            const response = await window.electronAPI.config.get();

            if (response.success && response.data) {
              // 将 ConfigData 转换为 AppConfig
              // 注意：IPC 返回的 ConfigData 结构可能与 AppConfig 不同，需要转换
              const config: AppConfig = {
                general: {
                  checkUpdateOnStartup: DEFAULT_CONFIG.general.checkUpdateOnStartup,
                  minimizeToTray: response.data.app?.minimizeToTray ?? DEFAULT_CONFIG.general.minimizeToTray,
                  showWindowOnStartup: true,
                  autoStart: response.data.app?.autoStart ?? DEFAULT_CONFIG.general.autoStart,
                  showInDock: response.data.app?.showInDock ?? DEFAULT_CONFIG.general.showInDock,
                  defaultSavePath: response.data.storage?.databasePath || DEFAULT_CONFIG.general.defaultSavePath,
                  language: (response.data.app?.language as AppConfig['general']['language']) || DEFAULT_CONFIG.general.language,
                },
                appearance: {
                  theme: response.data.app?.theme === 'auto' ? 'system' : response.data.app?.theme || DEFAULT_CONFIG.appearance.theme,
                  accentColor: DEFAULT_CONFIG.appearance.accentColor,
                  fontSize: DEFAULT_CONFIG.appearance.fontSize,
                  listViewMode: DEFAULT_CONFIG.appearance.listViewMode,
                  showThumbnails: DEFAULT_CONFIG.appearance.showThumbnails,
                },
                shortcuts: DEFAULT_CONFIG.shortcuts,
                ai: {
                  enabledProvider: (response.data.ai?.defaultProvider as AppConfig['ai']['enabledProvider']) || DEFAULT_CONFIG.ai.enabledProvider,
                  chatProvider: (response.data.ai?.chatProvider as AppConfig['ai']['chatProvider']) || DEFAULT_CONFIG.ai.chatProvider,
                  embeddingProvider: (response.data.ai?.embeddingProvider as AppConfig['ai']['embeddingProvider']) || DEFAULT_CONFIG.ai.embeddingProvider,
                  chatByok: DEFAULT_CONFIG.ai.chatByok,
                  embeddingByok: DEFAULT_CONFIG.ai.embeddingByok,
                  openai: DEFAULT_CONFIG.ai.openai,
                  claude: DEFAULT_CONFIG.ai.claude,
                  ollama: {
                    baseUrl: response.data.ai?.providers?.[0]?.baseUrl || DEFAULT_CONFIG.ai.ollama.baseUrl,
                    model: response.data.ai?.providers?.[0]?.model || DEFAULT_CONFIG.ai.ollama.model,
                    embeddingModel: DEFAULT_CONFIG.ai.ollama.embeddingModel,
                  },
                  maxTokens: response.data.ai?.maxTokens ?? DEFAULT_CONFIG.ai.maxTokens,
                  temperature: response.data.ai?.temperature ?? DEFAULT_CONFIG.ai.temperature,
                  autoGenerateSummary: response.data.ai?.autoGenerateSummary ?? DEFAULT_CONFIG.ai.autoGenerateSummary,
                  autoGenerateTags: response.data.ai?.autoGenerateTags ?? DEFAULT_CONFIG.ai.autoGenerateTags,
                  autoGenerateKeyPoints: response.data.ai?.autoGenerateKeyPoints ?? DEFAULT_CONFIG.ai.autoGenerateKeyPoints,
                  autoGenerateEmbedding: response.data.ai?.autoGenerateEmbedding ?? DEFAULT_CONFIG.ai.autoGenerateEmbedding,
                },
                scraper: {
                  defaultEngine: (response.data.scraper?.defaultEngine as AppConfig['scraper']['defaultEngine']) || DEFAULT_CONFIG.scraper.defaultEngine,
                  firecrawlApiKey: DEFAULT_CONFIG.scraper.firecrawlApiKey,
                  timeout: response.data.scraper?.timeout || DEFAULT_CONFIG.scraper.timeout,
                  maxRetries: response.data.scraper?.retryAttempts || DEFAULT_CONFIG.scraper.maxRetries,
                  concurrency: response.data.scraper?.maxConcurrent || DEFAULT_CONFIG.scraper.concurrency,
                  autoScrapeInterval: DEFAULT_CONFIG.scraper.autoScrapeInterval,
                  keepVersionCount: DEFAULT_CONFIG.scraper.keepVersionCount,
                  enableJavaScript: response.data.scraper?.enableJavaScript || DEFAULT_CONFIG.scraper.enableJavaScript,
                  userAgent: DEFAULT_CONFIG.scraper.userAgent,
                },
                search: {
                  pageSize: response.data.search?.pageSize || DEFAULT_CONFIG.search.pageSize,
                  searchMode: response.data.search?.defaultType === 'fulltext' ? 'keyword' : response.data.search?.defaultType || DEFAULT_CONFIG.search.searchMode,
                  enableSuggestions: DEFAULT_CONFIG.search.enableSuggestions,
                  searchHistoryCount: DEFAULT_CONFIG.search.searchHistoryCount,
                },
                backup: {
                  enableAutoBackup: response.data.storage?.autoBackup || DEFAULT_CONFIG.backup.enableAutoBackup,
                  backupInterval: response.data.storage?.backupInterval || DEFAULT_CONFIG.backup.backupInterval,
                  keepBackupCount: response.data.storage?.maxBackups || DEFAULT_CONFIG.backup.keepBackupCount,
                  backupPath: response.data.storage?.backupPath || DEFAULT_CONFIG.backup.backupPath,
                  includeFiles: DEFAULT_CONFIG.backup.includeFiles,
                },
                update: DEFAULT_CONFIG.update,
              };

              set({
                config,
                loading: false,
                isInitialized: true,
              });
            } else {
              set({
                error: response.error || '加载配置失败',
                loading: false,
              });
            }
          } catch (error) {
            set({
              error: (error as Error).message,
              loading: false,
            });
          }
        },

        // 更新配置
        updateConfig: async (partial: DeepPartial<AppConfig>) => {
          set({ loading: true, error: null });
          try {
            // 验证配置
            if (!get().validateConfig(partial)) {
              set({ error: '配置验证失败', loading: false });
              return false;
            }

            // 将 AppConfig 转换为 ConfigData 格式发送给后端
            const currentConfig = get().config;
            const newConfig = { ...currentConfig, ...partial } as AppConfig;

            // 构造后端需要的格式
            const configData: DeepPartial<ConfigData> = {
              app: {
                theme: newConfig.appearance.theme === 'system' ? 'auto' : newConfig.appearance.theme,
                language: newConfig.general.language,
                autoStart: newConfig.general.checkUpdateOnStartup,
                minimizeToTray: newConfig.general.minimizeToTray,
                showInDock: true,
              },
              scraper: {
                enableJavaScript: newConfig.scraper.enableJavaScript,
                timeout: newConfig.scraper.timeout,
                retryAttempts: newConfig.scraper.maxRetries,
                retryDelay: 1000,
                maxConcurrent: newConfig.scraper.concurrency,
                defaultEngine: newConfig.scraper.defaultEngine,
              },
              ai: {
                defaultProvider: newConfig.ai.enabledProvider,
                providers: [
                  {
                    id: 'ollama',
                    name: 'Ollama',
                    type: 'ollama',
                    baseUrl: newConfig.ai.ollama.baseUrl,
                    model: newConfig.ai.ollama.model,
                    enabled: newConfig.ai.enabledProvider === 'ollama',
                  },
                ],
              },
              storage: {
                databasePath: newConfig.general.defaultSavePath,
                backupPath: newConfig.backup.backupPath,
                cachePath: '',
                autoBackup: newConfig.backup.enableAutoBackup,
                backupInterval: newConfig.backup.backupInterval,
                maxBackups: newConfig.backup.keepBackupCount,
              },
              search: {
                defaultType:
                  newConfig.search.searchMode === 'keyword'
                    ? 'fulltext'
                    : newConfig.search.searchMode,
                pageSize: newConfig.search.pageSize,
              },
            };

            const response = await window.electronAPI.config.update(configData);

            if (response.success && response.data) {
              set({
                config: newConfig,
                loading: false,
              });
              return true;
            } else {
              set({
                error: response.error || '更新配置失败',
                loading: false,
              });
              return false;
            }
          } catch (error) {
            set({
              error: (error as Error).message,
              loading: false,
            });
            return false;
          }
        },

        // 重置配置
        resetConfig: async () => {
          set({ loading: true, error: null });
          try {
            const response = await window.electronAPI.config.reset();

            if (response.success && response.data) {
              // 重新加载配置
              await get().loadConfig();
              return true;
            } else {
              set({
                error: response.error || '重置配置失败',
                loading: false,
              });
              return false;
            }
          } catch (error) {
            set({
              error: (error as Error).message,
              loading: false,
            });
            return false;
          }
        },

        // 验证配置
        validateConfig: (config: DeepPartial<AppConfig>) => {
          // 简单验证：检查必填字段
          if (config.general?.language && !['zh-CN', 'en-US'].includes(config.general.language)) {
            return false;
          }
          if (config.appearance?.theme && !['light', 'dark', 'system'].includes(config.appearance.theme)) {
            return false;
          }
          if (config.ai?.enabledProvider && !['openai', 'claude', 'ollama', 'none'].includes(config.ai.enabledProvider)) {
            return false;
          }
          if (config.scraper?.timeout && config.scraper.timeout < 5) {
            return false;
          }
          if (config.search?.pageSize && config.search.pageSize < 1) {
            return false;
          }
          return true;
        },

        // 更新通用配置
        updateGeneralConfig: async (general: Partial<AppConfig['general']>) => {
          return get().updateConfig({ general });
        },

        // 更新外观配置
        updateAppearanceConfig: async (appearance: Partial<AppConfig['appearance']>) => {
          return get().updateConfig({ appearance });
        },

        // 更新快捷键配置
        updateShortcutsConfig: async (shortcuts: Partial<AppConfig['shortcuts']>) => {
          return get().updateConfig({ shortcuts });
        },

        // 更新 AI 配置
        updateAIConfig: async (ai: Partial<AppConfig['ai']>) => {
          return get().updateConfig({ ai });
        },

        // 更新抓取配置
        updateScraperConfig: async (scraper: Partial<AppConfig['scraper']>) => {
          return get().updateConfig({ scraper });
        },

        // 更新搜索配置
        updateSearchConfig: async (search: Partial<AppConfig['search']>) => {
          return get().updateConfig({ search });
        },

        // 更新备份配置
        updateBackupConfig: async (backup: Partial<AppConfig['backup']>) => {
          return get().updateConfig({ backup });
        },

        // 更新更新配置
        updateUpdateConfig: async (update: Partial<AppConfig['update']>) => {
          return get().updateConfig({ update });
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
        name: 'config-store',
        partialize: (state) => ({
          config: state.config,
          isInitialized: state.isInitialized,
        }),
      }
    ),
    { name: 'ConfigStore', enabled: isDev }
  )
);