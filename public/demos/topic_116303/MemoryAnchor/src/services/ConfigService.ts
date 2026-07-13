import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { AppConfig, DEFAULT_CONFIG } from '../shared/types/config';
import { mergeConfig, validateConfig } from '../config/defaultConfig';
import { logger } from '../main/utils/logger';

export class ConfigService {
  private static instance: ConfigService | null = null;
  private config: AppConfig;
  private configPath: string;
  private listeners: Set<(config: AppConfig) => void> = new Set();

  private constructor() {
    this.configPath = this.getConfigPath();
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private getConfigPath(): string {
    try {
      const userDataPath = app.getPath('userData');
      return path.join(userDataPath, 'config.json');
    } catch {
      return path.join(process.cwd(), '.data', 'config.json');
    }
  }

  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        const saved = JSON.parse(raw) as Partial<AppConfig>;
        const merged = mergeConfig(DEFAULT_CONFIG, saved) as AppConfig;
        const validation = validateConfig(merged);
        if (!validation.valid) {
          logger.warn('Config validation warnings:', validation.errors);
        }
        return merged;
      }
    } catch (error) {
      logger.error('Failed to load config, using defaults:', error);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as AppConfig;
  }

  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Failed to save config:', error);
    }
  }

  getConfig(): AppConfig {
    return JSON.parse(JSON.stringify(this.config)) as AppConfig;
  }

  updateConfig(partial: Partial<AppConfig>): AppConfig {
    this.config = mergeConfig(this.config, partial) as AppConfig;
    const validation = validateConfig(this.config);
    if (!validation.valid) {
      logger.warn('Config validation warnings after update:', validation.errors);
    }
    this.saveConfig();
    this.notifyListeners();
    return this.getConfig();
  }

  resetConfig(): AppConfig {
    this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as AppConfig;
    this.saveConfig();
    this.notifyListeners();
    return this.getConfig();
  }

  onConfigChange(callback: (config: AppConfig) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.getConfig());
      } catch (error) {
        logger.error('Config listener error:', error);
      }
    }
  }

  getFirecrawlApiKey(): string {
    return this.config.scraper.firecrawlApiKey;
  }

  getActiveAIProvider(): string {
    return this.config.ai.enabledProvider;
  }

  getEmbeddingDimensions(): number {
    const ai = this.config.ai;

    // Dimension is a property of the embedding MODEL, not the chat backend.
    const openAIModelDim = (model?: string): number => {
      const m = (model || '').toLowerCase();
      if (m.includes('3-large')) return 3072;
      if (m.includes('3-small')) return 1536;
      if (m.includes('ada-002')) return 1536;
      return 1536;
    };

    switch (ai.embeddingProvider) {
      case 'openai':
        return openAIModelDim(ai.openai.embeddingModel);
      case 'ollama':
        return 768; // nomic-embed-text and friends
      case 'byok':
        // Custom endpoints can't be inferred from the model name — honor the
        // user-supplied dimension (e.g. Google embedding-2 = 3072) when set.
        if (ai.embeddingByok.dimension && ai.embeddingByok.dimension > 0) {
          return ai.embeddingByok.dimension;
        }
        return ai.embeddingByok.protocol === 'openai'
          ? openAIModelDim(ai.embeddingByok.model)
          : 1536;
      case 'claude':
        // Claude has no native embeddings; it falls back to the OpenAI provider.
        return openAIModelDim(ai.openai.embeddingModel);
      case 'none':
      default:
        return 768;
    }
  }
}

export const configService = ConfigService.getInstance();
