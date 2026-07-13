import { describe, it, expect } from 'vitest';
import { appConfigToConfigData, configDataToAppConfigPartial, type StoragePaths } from './configMapper';
import { mergeConfig } from '../../config/defaultConfig';
import { DEFAULT_CONFIG, type AppConfig } from '../../shared/types/config';
import type { ConfigData } from '../../shared/types/ipc';

const PATHS: StoragePaths = {
  databasePath: '/data/db.sqlite',
  backupPath: '/data/backups',
  cachePath: '/data/cache',
};

/** Simulate the config:update -> config:get IPC round-trip. */
function applyUpdate(current: AppConfig, patch: ConfigData): ConfigData {
  const partial = configDataToAppConfigPartial(patch);
  const merged = mergeConfig(current, partial) as AppConfig;
  return appConfigToConfigData(merged, PATHS);
}

describe('config mapping round-trip', () => {
  it('round-trips a fully-mutated ConfigData without loss', () => {
    const base = appConfigToConfigData(DEFAULT_CONFIG, PATHS);

    const mutated: ConfigData = {
      app: { theme: 'dark', language: 'en-US', autoStart: true, minimizeToTray: false, showInDock: false },
      scraper: { enableJavaScript: false, timeout: 60, retryAttempts: 5, retryDelay: base.scraper.retryDelay, maxConcurrent: 8, defaultEngine: 'firecrawl', firecrawlApiKey: 'fc-test' },
      ai: {
        defaultProvider: 'openai',
        chatProvider: 'openai',
        embeddingProvider: 'openai',
        chatByok: base.ai.chatByok,
        embeddingByok: base.ai.embeddingByok,
        maxTokens: 1024,
        temperature: 0.2,
        autoGenerateSummary: false,
        autoGenerateTags: false,
        autoGenerateKeyPoints: true,
        autoGenerateEmbedding: false,
        providers: base.ai.providers.map((p) => ({
          ...p,
          enabled: p.type === 'openai',
          apiKey: p.type === 'openai' ? 'sk-test' : p.apiKey,
          embeddingModel: p.type === 'openai' ? 'text-embedding-3-large' : p.embeddingModel,
        })),
      },
      storage: { ...base.storage, autoBackup: false, backupInterval: 12, maxBackups: 3 },
      search: { defaultType: 'semantic', pageSize: 50 },
    };

    const result = applyUpdate(DEFAULT_CONFIG, mutated);
    expect(result).toEqual(mutated);
  });

  it('persists the settings that previously silently reset (regression)', () => {
    const result = applyUpdate(DEFAULT_CONFIG, {
      ...appConfigToConfigData(DEFAULT_CONFIG, PATHS),
      storage: { ...appConfigToConfigData(DEFAULT_CONFIG, PATHS).storage, autoBackup: false },
      search: { defaultType: 'semantic', pageSize: 20 },
    });
    // These used to be hardcoded on read / mismapped on write.
    expect(result.storage.autoBackup).toBe(false);
    expect(result.search.defaultType).toBe('semantic');
  });

  it('bridges theme system<->auto and search keyword<->fulltext', () => {
    // DEFAULT theme is 'system' -> exposed as 'auto'
    expect(appConfigToConfigData(DEFAULT_CONFIG, PATHS).app.theme).toBe('auto');
    // DEFAULT searchMode is 'hybrid'
    const fulltext = applyUpdate(DEFAULT_CONFIG, {
      ...appConfigToConfigData(DEFAULT_CONFIG, PATHS),
      search: { defaultType: 'fulltext', pageSize: 20 },
    });
    expect(fulltext.search.defaultType).toBe('fulltext');
    // and the underlying AppConfig stores 'keyword'
    const partial = configDataToAppConfigPartial({ search: { defaultType: 'fulltext', pageSize: 20 } });
    expect(partial.search?.searchMode).toBe('keyword');
  });

  it('maps app.language to general.language (was hardcoded to a default)', () => {
    const partial = configDataToAppConfigPartial({ app: { language: 'en-US' } });
    expect(partial.general?.language).toBe('en-US');
    const merged = mergeConfig(DEFAULT_CONFIG, partial) as AppConfig;
    expect(appConfigToConfigData(merged, PATHS).app.language).toBe('en-US');
  });

  it('applies a single-field update without clobbering other settings', () => {
    const result = applyUpdate(DEFAULT_CONFIG, { app: { theme: 'dark' } } as ConfigData);
    const base = appConfigToConfigData(DEFAULT_CONFIG, PATHS);
    expect(result.app.theme).toBe('dark');
    // untouched sections stay at defaults
    expect(result.search).toEqual(base.search);
    expect(result.scraper).toEqual(base.scraper);
    expect(result.ai.defaultProvider).toBe(base.ai.defaultProvider);
  });

  it('derives the AI provider list from structured AppConfig (not empty)', () => {
    const data = appConfigToConfigData(DEFAULT_CONFIG, PATHS);
    expect(data.ai.providers.map((p) => p.type)).toEqual(['openai', 'claude', 'ollama']);
    // round-trips an OpenAI api key edit
    const withKey = applyUpdate(DEFAULT_CONFIG, {
      ...data,
      ai: { ...data.ai, defaultProvider: 'openai', chatProvider: 'openai', embeddingProvider: 'openai', providers: data.ai.providers.map((p) => ({ ...p, enabled: p.type === 'openai', apiKey: p.type === 'openai' ? 'sk-abc' : p.apiKey })) },
    });
    expect(withKey.ai.providers.find((p) => p.type === 'openai')?.apiKey).toBe('sk-abc');
    expect(withKey.ai.defaultProvider).toBe('openai');
  });

  it('persists independent Chat and Embedding backends', () => {
    const base = appConfigToConfigData(DEFAULT_CONFIG, PATHS);
    const result = applyUpdate(DEFAULT_CONFIG, {
      ...base,
      ai: { ...base.ai, chatProvider: 'openai', embeddingProvider: 'ollama' },
    });
    expect(result.ai.chatProvider).toBe('openai');
    expect(result.ai.embeddingProvider).toBe('ollama');
  });

  it('persists per-role BYOK (protocol + baseUrl + key + model)', () => {
    const base = appConfigToConfigData(DEFAULT_CONFIG, PATHS);
    const result = applyUpdate(DEFAULT_CONFIG, {
      ...base,
      ai: {
        ...base.ai,
        chatProvider: 'byok',
        chatByok: { protocol: 'anthropic', baseUrl: 'https://my.endpoint/v1', apiKey: 'sk-byok', model: 'custom-1', dimension: 0 },
      },
    });
    expect(result.ai.chatProvider).toBe('byok');
    expect(result.ai.chatByok).toEqual({ protocol: 'anthropic', baseUrl: 'https://my.endpoint/v1', apiKey: 'sk-byok', model: 'custom-1', dimension: 0 });
  });

  it('persists a user-supplied BYOK embedding dimension', () => {
    const base = appConfigToConfigData(DEFAULT_CONFIG, PATHS);
    const result = applyUpdate(DEFAULT_CONFIG, {
      ...base,
      ai: {
        ...base.ai,
        embeddingProvider: 'byok',
        embeddingByok: { protocol: 'openai', baseUrl: 'https://g/v1', apiKey: 'k', model: 'embedding-2', dimension: 3072 },
      },
    });
    expect(result.ai.embeddingByok.dimension).toBe(3072);
  });

  it('persists global generation params (maxTokens + temperature)', () => {
    const base = appConfigToConfigData(DEFAULT_CONFIG, PATHS);
    // exposed defaults
    expect(base.ai.maxTokens).toBe(DEFAULT_CONFIG.ai.maxTokens);
    expect(base.ai.temperature).toBe(DEFAULT_CONFIG.ai.temperature);
    const result = applyUpdate(DEFAULT_CONFIG, {
      ...base,
      ai: { ...base.ai, maxTokens: 512, temperature: 0.15 },
    });
    expect(result.ai.maxTokens).toBe(512);
    expect(result.ai.temperature).toBe(0.15);
  });

  it('persists the auto-generate AI toggles', () => {
    const base = appConfigToConfigData(DEFAULT_CONFIG, PATHS);
    // exposed defaults
    expect(base.ai.autoGenerateTags).toBe(DEFAULT_CONFIG.ai.autoGenerateTags);
    const result = applyUpdate(DEFAULT_CONFIG, {
      ...base,
      ai: { ...base.ai, autoGenerateTags: false, autoGenerateKeyPoints: true },
    });
    expect(result.ai.autoGenerateTags).toBe(false);
    expect(result.ai.autoGenerateKeyPoints).toBe(true);
    // untouched toggles keep their defaults
    expect(result.ai.autoGenerateSummary).toBe(DEFAULT_CONFIG.ai.autoGenerateSummary);
  });

  it('persists the FireCrawl API key and per-provider embedding model', () => {
    const base = appConfigToConfigData(DEFAULT_CONFIG, PATHS);
    const result = applyUpdate(DEFAULT_CONFIG, {
      ...base,
      scraper: { ...base.scraper, firecrawlApiKey: 'fc-xyz' },
      ai: {
        ...base.ai,
        providers: base.ai.providers.map((p) => (p.type === 'ollama' ? { ...p, embeddingModel: 'nomic-embed-text-v2' } : p)),
      },
    });
    expect(result.scraper.firecrawlApiKey).toBe('fc-xyz');
    expect(result.ai.providers.find((p) => p.type === 'ollama')?.embeddingModel).toBe('nomic-embed-text-v2');
  });
});
