// Default Configuration
// Default application configuration values

import { AppConfig, DEFAULT_CONFIG } from '../shared/types/config';

/**
 * 获取默认配置
 */
export function getDefaultConfig(): AppConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as AppConfig;
}

/**
 * 深度合并配置
 */
export function mergeConfig(
  target: Partial<AppConfig>,
  source: Partial<AppConfig>
): Partial<AppConfig> {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key as keyof AppConfig];
      const targetValue = target[key as keyof AppConfig];

      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        // 递归合并对象
        (result as Record<string, unknown>)[key] = mergeConfig(
          targetValue as Partial<AppConfig>,
          sourceValue as Partial<AppConfig>
        );
      } else {
        // 直接赋值
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    }
  }

  return result;
}

/**
 * 验证配置
 */
export function validateConfig(config: Partial<AppConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 验证通用配置
  if (config.general) {
    if (
      config.general.language &&
      !['zh-CN', 'en-US'].includes(config.general.language)
    ) {
      errors.push('Invalid language value in general config');
    }
  }

  // 验证外观配置
  if (config.appearance) {
    if (
      config.appearance.theme &&
      !['light', 'dark', 'system'].includes(config.appearance.theme)
    ) {
      errors.push('Invalid theme value in appearance config');
    }

    if (
      config.appearance.fontSize &&
      !['small', 'medium', 'large'].includes(config.appearance.fontSize)
    ) {
      errors.push('Invalid fontSize value in appearance config');
    }

    if (
      config.appearance.listViewMode &&
      !['list', 'grid', 'compact'].includes(config.appearance.listViewMode)
    ) {
      errors.push('Invalid listViewMode value in appearance config');
    }
  }

  // 验证 AI 配置
  if (config.ai) {
    if (
      config.ai.enabledProvider &&
      !['openai', 'claude', 'ollama', 'none'].includes(config.ai.enabledProvider)
    ) {
      errors.push('Invalid enabledProvider value in AI config');
    }

    if (config.ai.openai) {
      if (
        config.ai.openai.maxTokens !== undefined &&
        config.ai.openai.maxTokens < 1
      ) {
        errors.push('openai.maxTokens must be greater than 0');
      }
      if (
        config.ai.openai.temperature !== undefined &&
        (config.ai.openai.temperature < 0 || config.ai.openai.temperature > 2)
      ) {
        errors.push('openai.temperature must be between 0 and 2');
      }
    }

    if (config.ai.claude) {
      if (
        config.ai.claude.maxTokens !== undefined &&
        config.ai.claude.maxTokens < 1
      ) {
        errors.push('claude.maxTokens must be greater than 0');
      }
      if (
        config.ai.claude.temperature !== undefined &&
        (config.ai.claude.temperature < 0 || config.ai.claude.temperature > 1)
      ) {
        errors.push('claude.temperature must be between 0 and 1');
      }
    }
  }

  // 验证抓取配置
  if (config.scraper) {
    if (
      config.scraper.defaultEngine &&
      !['firecrawl', 'local'].includes(config.scraper.defaultEngine)
    ) {
      errors.push('Invalid defaultEngine value in scraper config');
    }

    if (
      config.scraper.timeout !== undefined &&
      config.scraper.timeout < 5
    ) {
      errors.push('scraper.timeout must be at least 5 seconds');
    }

    if (
      config.scraper.concurrency !== undefined &&
      (config.scraper.concurrency < 1 || config.scraper.concurrency > 10)
    ) {
      errors.push('scraper.concurrency must be between 1 and 10');
    }
  }

  // 验证搜索配置
  if (config.search) {
    if (
      config.search.searchMode &&
      !['keyword', 'semantic', 'hybrid'].includes(config.search.searchMode)
    ) {
      errors.push('Invalid searchMode value in search config');
    }

    if (
      config.search.pageSize !== undefined &&
      (config.search.pageSize < 10 || config.search.pageSize > 100)
    ) {
      errors.push('search.pageSize must be between 10 and 100');
    }
  }

  // 验证备份配置
  if (config.backup) {
    if (
      config.backup.backupInterval !== undefined &&
      config.backup.backupInterval < 1
    ) {
      errors.push('backup.backupInterval must be at least 1 hour');
    }

    if (
      config.backup.keepBackupCount !== undefined &&
      config.backup.keepBackupCount < 1
    ) {
      errors.push('backup.keepBackupCount must be at least 1');
    }
  }

  // 验证更新配置
  if (config.update) {
    if (
      config.update.channel &&
      !['stable', 'beta'].includes(config.update.channel)
    ) {
      errors.push('Invalid channel value in update config');
    }

    if (
      config.update.checkInterval !== undefined &&
      config.update.checkInterval < 1
    ) {
      errors.push('update.checkInterval must be at least 1 hour');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}