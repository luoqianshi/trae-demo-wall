// Config mapping between the persisted AppConfig (source of truth) and the
// renderer-facing ConfigData DTO. Kept free of Electron/fs imports so it can be
// unit-tested; runtime-only paths are injected by the caller.

import type { AppConfig, GeneralConfig, AppearanceConfig, AIConfig, ScraperConfig, SearchConfig, BackupConfig } from '../../shared/types/config';
import type { ConfigData, DeepPartial } from '../../shared/types/ipc';

/** Runtime storage paths (derived from the OS, not persisted in AppConfig). */
export interface StoragePaths {
  databasePath: string;
  backupPath: string;
  cachePath: string;
}

type ConfigTheme = ConfigData['app']['theme']; // 'light' | 'dark' | 'auto'
type AppTheme = AppearanceConfig['theme']; // 'light' | 'dark' | 'system'
type ConfigSearchType = ConfigData['search']['defaultType']; // 'fulltext' | 'semantic' | 'hybrid'
type AppSearchMode = SearchConfig['searchMode']; // 'keyword' | 'semantic' | 'hybrid'
type AppLanguage = GeneralConfig['language']; // 'zh-CN' | 'en-US'
type AppProvider = AIConfig['enabledProvider']; // 'openai' | 'claude' | 'ollama' | 'none'
type ProviderEntry = ConfigData['ai']['providers'][number];

// --- enum bridges (AppConfig uses 'system'/'keyword'; ConfigData uses 'auto'/'fulltext') ---

function toConfigTheme(theme: AppTheme): ConfigTheme {
  return theme === 'system' ? 'auto' : theme;
}
function toAppTheme(theme: ConfigTheme): AppTheme {
  return theme === 'auto' ? 'system' : theme;
}
function toConfigSearchType(mode: AppSearchMode): ConfigSearchType {
  return mode === 'keyword' ? 'fulltext' : mode;
}
function toAppSearchMode(type: ConfigSearchType): AppSearchMode {
  return type === 'fulltext' ? 'keyword' : type;
}
function narrowLanguage(value: string): AppLanguage {
  return value === 'en-US' ? 'en-US' : 'zh-CN';
}
function narrowProvider(value: string): AppProvider {
  return value === 'openai' || value === 'claude' || value === 'ollama' || value === 'byok' ? value : 'none';
}
function narrowProtocol(value: string): 'openai' | 'anthropic' {
  return value === 'anthropic' ? 'anthropic' : 'openai';
}
function narrowEngine(value: string): ScraperConfig['defaultEngine'] {
  return value === 'firecrawl' ? 'firecrawl' : 'local';
}

/** Derive the ConfigData provider list from AppConfig's structured provider configs. */
function deriveProviders(ai: AIConfig): ProviderEntry[] {
  return [
    { id: 'openai', name: 'OpenAI', type: 'openai', apiKey: ai.openai.apiKey, baseUrl: ai.openai.baseUrl, model: ai.openai.model, embeddingModel: ai.openai.embeddingModel, enabled: ai.enabledProvider === 'openai' },
    { id: 'claude', name: 'Claude', type: 'claude', apiKey: ai.claude.apiKey, baseUrl: ai.claude.baseUrl, model: ai.claude.model, enabled: ai.enabledProvider === 'claude' },
    { id: 'ollama', name: 'Ollama', type: 'ollama', apiKey: '', baseUrl: ai.ollama.baseUrl, model: ai.ollama.model, embeddingModel: ai.ollama.embeddingModel, enabled: ai.enabledProvider === 'ollama' },
  ];
}

/**
 * ConfigData-only fields with no AppConfig home are surfaced as fixed values:
 * `scraper.retryDelay` and the runtime `storage.*` paths. They are not
 * user-editable through the Settings UI.
 */
const SCRAPER_RETRY_DELAY_MS = 1000;

/** Map the persisted AppConfig to the renderer-facing ConfigData DTO. */
export function appConfigToConfigData(appConfig: AppConfig, paths: StoragePaths): ConfigData {
  return {
    app: {
      theme: toConfigTheme(appConfig.appearance.theme),
      language: appConfig.general.language,
      autoStart: appConfig.general.autoStart,
      minimizeToTray: appConfig.general.minimizeToTray,
      showInDock: appConfig.general.showInDock,
    },
    scraper: {
      enableJavaScript: appConfig.scraper.enableJavaScript,
      timeout: appConfig.scraper.timeout,
      retryAttempts: appConfig.scraper.maxRetries,
      retryDelay: SCRAPER_RETRY_DELAY_MS,
      maxConcurrent: appConfig.scraper.concurrency,
      defaultEngine: appConfig.scraper.defaultEngine,
      firecrawlApiKey: appConfig.scraper.firecrawlApiKey,
    },
    ai: {
      defaultProvider: appConfig.ai.enabledProvider,
      chatProvider: appConfig.ai.chatProvider,
      embeddingProvider: appConfig.ai.embeddingProvider,
      chatByok: { ...appConfig.ai.chatByok },
      embeddingByok: { ...appConfig.ai.embeddingByok },
      maxTokens: appConfig.ai.maxTokens,
      temperature: appConfig.ai.temperature,
      autoGenerateSummary: appConfig.ai.autoGenerateSummary,
      autoGenerateTags: appConfig.ai.autoGenerateTags,
      autoGenerateKeyPoints: appConfig.ai.autoGenerateKeyPoints,
      autoGenerateEmbedding: appConfig.ai.autoGenerateEmbedding,
      providers: deriveProviders(appConfig.ai),
    },
    storage: {
      databasePath: paths.databasePath,
      backupPath: paths.backupPath,
      cachePath: paths.cachePath,
      autoBackup: appConfig.backup.enableAutoBackup,
      backupInterval: appConfig.backup.backupInterval,
      maxBackups: appConfig.backup.keepBackupCount,
    },
    search: {
      defaultType: toConfigSearchType(appConfig.search.searchMode),
      pageSize: appConfig.search.pageSize,
    },
  };
}

/**
 * Map a partial ConfigData update (from the renderer) back to a Partial<AppConfig>
 * that ConfigService.updateConfig can deep-merge. Only fields present in the
 * input are emitted, so untouched settings are preserved by the merge.
 */
export function configDataToAppConfigPartial(partial: DeepPartial<ConfigData>): Partial<AppConfig> {
  const out: Partial<AppConfig> = {};

  if (partial.app) {
    const general: Partial<GeneralConfig> = {};
    const appearance: Partial<AppearanceConfig> = {};
    if (partial.app.theme !== undefined) { appearance.theme = toAppTheme(partial.app.theme); }
    if (partial.app.language !== undefined) { general.language = narrowLanguage(partial.app.language); }
    if (partial.app.autoStart !== undefined) { general.autoStart = partial.app.autoStart; }
    if (partial.app.minimizeToTray !== undefined) { general.minimizeToTray = partial.app.minimizeToTray; }
    if (partial.app.showInDock !== undefined) { general.showInDock = partial.app.showInDock; }
    if (Object.keys(general).length > 0) { out.general = general as GeneralConfig; }
    if (Object.keys(appearance).length > 0) { out.appearance = appearance as AppearanceConfig; }
  }

  if (partial.scraper) {
    const scraper: Partial<ScraperConfig> = {};
    if (partial.scraper.enableJavaScript !== undefined) { scraper.enableJavaScript = partial.scraper.enableJavaScript; }
    if (partial.scraper.timeout !== undefined) { scraper.timeout = partial.scraper.timeout; }
    if (partial.scraper.retryAttempts !== undefined) { scraper.maxRetries = partial.scraper.retryAttempts; }
    if (partial.scraper.maxConcurrent !== undefined) { scraper.concurrency = partial.scraper.maxConcurrent; }
    if (partial.scraper.defaultEngine !== undefined) { scraper.defaultEngine = narrowEngine(partial.scraper.defaultEngine); }
    if (partial.scraper.firecrawlApiKey !== undefined) { scraper.firecrawlApiKey = partial.scraper.firecrawlApiKey; }
    if (Object.keys(scraper).length > 0) { out.scraper = scraper as ScraperConfig; }
  }

  if (partial.ai) {
    const ai: Partial<AIConfig> = {};
    if (partial.ai.defaultProvider !== undefined) { ai.enabledProvider = narrowProvider(partial.ai.defaultProvider); }
    if (partial.ai.chatProvider !== undefined) {
      ai.chatProvider = narrowProvider(partial.ai.chatProvider);
      // keep the legacy enabledProvider aligned with the chat backend
      ai.enabledProvider = ai.chatProvider;
    }
    if (partial.ai.embeddingProvider !== undefined) { ai.embeddingProvider = narrowProvider(partial.ai.embeddingProvider); }
    if (partial.ai.maxTokens !== undefined) { ai.maxTokens = partial.ai.maxTokens; }
    if (partial.ai.temperature !== undefined) { ai.temperature = partial.ai.temperature; }
    if (partial.ai.autoGenerateSummary !== undefined) { ai.autoGenerateSummary = partial.ai.autoGenerateSummary; }
    if (partial.ai.autoGenerateTags !== undefined) { ai.autoGenerateTags = partial.ai.autoGenerateTags; }
    if (partial.ai.autoGenerateKeyPoints !== undefined) { ai.autoGenerateKeyPoints = partial.ai.autoGenerateKeyPoints; }
    if (partial.ai.autoGenerateEmbedding !== undefined) { ai.autoGenerateEmbedding = partial.ai.autoGenerateEmbedding; }
    if (partial.ai.chatByok) {
      ai.chatByok = { protocol: narrowProtocol(partial.ai.chatByok.protocol ?? 'openai'), baseUrl: partial.ai.chatByok.baseUrl ?? '', apiKey: partial.ai.chatByok.apiKey ?? '', model: partial.ai.chatByok.model ?? '', dimension: partial.ai.chatByok.dimension ?? 0 };
    }
    if (partial.ai.embeddingByok) {
      ai.embeddingByok = { protocol: narrowProtocol(partial.ai.embeddingByok.protocol ?? 'openai'), baseUrl: partial.ai.embeddingByok.baseUrl ?? '', apiKey: partial.ai.embeddingByok.apiKey ?? '', model: partial.ai.embeddingByok.model ?? '', dimension: partial.ai.embeddingByok.dimension ?? 0 };
    }
    if (partial.ai.providers) {
      for (const entry of partial.ai.providers) {
        if (!entry || entry.type === undefined) { continue; }
        if (entry.type === 'openai') {
          ai.openai = pruneUndefined({ apiKey: entry.apiKey, baseUrl: entry.baseUrl, model: entry.model, embeddingModel: entry.embeddingModel }) as AIConfig['openai'];
        } else if (entry.type === 'claude') {
          ai.claude = pruneUndefined({ apiKey: entry.apiKey, baseUrl: entry.baseUrl, model: entry.model }) as AIConfig['claude'];
        } else if (entry.type === 'ollama') {
          // AppConfig's Ollama config has no apiKey.
          ai.ollama = pruneUndefined({ baseUrl: entry.baseUrl, model: entry.model, embeddingModel: entry.embeddingModel }) as AIConfig['ollama'];
        }
      }
    }
    if (Object.keys(ai).length > 0) { out.ai = ai as AIConfig; }
  }

  if (partial.storage) {
    const backup: Partial<BackupConfig> = {};
    if (partial.storage.autoBackup !== undefined) { backup.enableAutoBackup = partial.storage.autoBackup; }
    if (partial.storage.backupInterval !== undefined) { backup.backupInterval = partial.storage.backupInterval; }
    if (partial.storage.maxBackups !== undefined) { backup.keepBackupCount = partial.storage.maxBackups; }
    if (Object.keys(backup).length > 0) { out.backup = backup as BackupConfig; }
  }

  if (partial.search) {
    const search: Partial<SearchConfig> = {};
    if (partial.search.defaultType !== undefined) { search.searchMode = toAppSearchMode(partial.search.defaultType); }
    if (partial.search.pageSize !== undefined) { search.pageSize = partial.search.pageSize; }
    if (Object.keys(search).length > 0) { out.search = search as SearchConfig; }
  }

  return out;
}

/** Drop keys whose value is undefined so they don't overwrite merged config. */
function pruneUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}
