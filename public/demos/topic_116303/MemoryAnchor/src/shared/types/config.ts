// Config Types
// Shared type definitions for configuration data

/**
 * 应用配置接口
 */
export interface AppConfig {
  // 通用设置
  general: GeneralConfig;
  // 外观设置
  appearance: AppearanceConfig;
  // 快捷键设置
  shortcuts: ShortcutConfig;
  // AI 设置
  ai: AIConfig;
  // 抓取设置
  scraper: ScraperConfig;
  // 搜索设置
  search: SearchConfig;
  // 备份设置
  backup: BackupConfig;
  // 更新设置
  update: UpdateConfig;
}

/**
 * 通用配置
 */
export interface GeneralConfig {
  // 启动时检查更新
  checkUpdateOnStartup: boolean;
  // 关闭窗口时最小化到托盘（而非退出）
  minimizeToTray: boolean;
  // 启动时显示主窗口
  showWindowOnStartup: boolean;
  // 开机自启动
  autoStart: boolean;
  // 在 macOS Dock 中显示图标
  showInDock: boolean;
  // 默认保存路径
  defaultSavePath: string;
  // 语言设置
  language: 'zh-CN' | 'en-US';
}

/**
 * 外观配置
 */
export interface AppearanceConfig {
  // 主题
  theme: 'light' | 'dark' | 'system';
  // 强调色
  accentColor: string;
  // 字体大小
  fontSize: 'small' | 'medium' | 'large';
  // 列表视图模式
  listViewMode: 'list' | 'grid' | 'compact';
  // 显示缩略图
  showThumbnails: boolean;
}

/**
 * 快捷键配置
 */
export interface ShortcutConfig {
  // 显示/隐藏窗口
  toggleWindow: string;
  // 新建收藏
  newCollection: string;
  // 搜索
  search: string;
  // 全部收藏
  allCollections: string;
  // 设置
  settings: string;
  // 快速抓取
  quickScrape: string;
}

/**
 * AI 配置
 */
export type AIBackend = 'openai' | 'claude' | 'ollama' | 'byok' | 'none';

/** BYOK：自定义端点，按 OpenAI 或 Anthropic 协议接入任意兼容服务。 */
export interface ByokConfig {
  protocol: 'openai' | 'anthropic';
  baseUrl: string;
  apiKey: string;
  model: string;
  /**
   * 向量维度（仅向量角色使用）。自定义端点无法从模型名推断维度
   * （如 Google embedding-2 为 3072），需用户显式指定；0 表示未设置。
   */
  dimension: number;
}

export interface AIConfig {
  // 启用的提供商（兼容旧字段，等同于 chatProvider）
  enabledProvider: AIBackend;
  // 对话（Chat）后端 —— 用于摘要 / 标签 / 要点生成
  chatProvider: AIBackend;
  // 向量（Embedding）后端 —— 用于语义搜索的向量生成
  embeddingProvider: AIBackend;
  // 各角色的 BYOK 自定义端点配置
  chatByok: ByokConfig;
  embeddingByok: ByokConfig;
  // OpenAI 配置
  openai: OpenAIConfig;
  // Claude 配置
  claude: ClaudeConfig;
  // Ollama 配置
  ollama: OllamaConfig;
  // 全局生成参数（统一作用于摘要 / 标签 / 要点 / 对话，覆盖每任务默认）
  maxTokens: number;
  temperature: number;
  // 自动生成摘要
  autoGenerateSummary: boolean;
  // 自动生成标签
  autoGenerateTags: boolean;
  // 自动生成要点
  autoGenerateKeyPoints: boolean;
  // 自动生成嵌入向量
  autoGenerateEmbedding: boolean;
}

/**
 * OpenAI 配置
 */
export interface OpenAIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  embeddingModel: string;
  maxTokens: number;
  temperature: number;
}

/**
 * Claude 配置
 */
export interface ClaudeConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

/**
 * Ollama 配置
 */
export interface OllamaConfig {
  baseUrl: string;
  model: string;
  embeddingModel: string;
}

/**
 * 抓取配置
 */
export interface ScraperConfig {
  // 默认抓取引擎
  defaultEngine: 'firecrawl' | 'local';
  // Firecrawl API Key
  firecrawlApiKey: string;
  // 抓取超时时间（秒）
  timeout: number;
  // 最大重试次数
  maxRetries: number;
  // 并发抓取数量
  concurrency: number;
  // 自动抓取间隔（小时，0 表示禁用）
  autoScrapeInterval: number;
  // 保留历史版本数量
  keepVersionCount: number;
  // 启用 JavaScript 渲染
  enableJavaScript: boolean;
  // 用户代理
  userAgent: string;
}

/**
 * 搜索配置
 */
export interface SearchConfig {
  // 每页显示数量
  pageSize: number;
  // 搜索模式
  searchMode: 'keyword' | 'semantic' | 'hybrid';
  // 启用搜索建议
  enableSuggestions: boolean;
  // 搜索历史数量
  searchHistoryCount: number;
}

/**
 * 备份配置
 */
export interface BackupConfig {
  // 启用自动备份
  enableAutoBackup: boolean;
  // 备份间隔（小时）
  backupInterval: number;
  // 备份保留数量
  keepBackupCount: number;
  // 备份路径
  backupPath: string;
  // 包含文件
  includeFiles: boolean;
}

/**
 * 更新配置
 */
export interface UpdateConfig {
  // 自动检查更新
  autoCheckUpdate: boolean;
  // 自动下载更新
  autoDownloadUpdate: boolean;
  // 更新通道
  channel: 'stable' | 'beta';
  // 检查更新间隔（小时）
  checkInterval: number;
}

/**
 * 窗口状态配置
 */
export interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isFullScreen: boolean;
}

/**
 * 托盘配置
 */
export interface TrayConfig {
  // 显示托盘图标
  showTrayIcon: boolean;
  // 最小化到托盘
  minimizeToTray: boolean;
  // 关闭到托盘
  closeToTray: boolean;
}

/**
 * 默认快捷键配置
 */
export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  toggleWindow: 'CommandOrControl+Shift+M',
  newCollection: 'CommandOrControl+N',
  search: 'CommandOrControl+F',
  allCollections: 'CommandOrControl+Shift+A',
  settings: 'CommandOrControl+,',
  quickScrape: 'CommandOrControl+Shift+S',
};

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: AppConfig = {
  general: {
    checkUpdateOnStartup: true,
    minimizeToTray: true,
    showWindowOnStartup: true,
    autoStart: false,
    showInDock: true,
    defaultSavePath: '',
    language: 'zh-CN',
  },
  appearance: {
    theme: 'system',
    accentColor: '#3B82F6',
    fontSize: 'medium',
    listViewMode: 'list',
    showThumbnails: true,
  },
  shortcuts: DEFAULT_SHORTCUTS,
  ai: {
    enabledProvider: 'none',
    chatProvider: 'none',
    embeddingProvider: 'none',
    chatByok: { protocol: 'openai', baseUrl: '', apiKey: '', model: '', dimension: 0 },
    embeddingByok: { protocol: 'openai', baseUrl: '', apiKey: '', model: '', dimension: 0 },
    openai: {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4-turbo-preview',
      embeddingModel: 'text-embedding-3-small',
      maxTokens: 4000,
      temperature: 0.7,
    },
    claude: {
      apiKey: '',
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-3-opus-20240229',
      maxTokens: 4000,
      temperature: 0.7,
    },
    ollama: {
      baseUrl: 'http://localhost:11434',
      model: 'llama2',
      embeddingModel: 'nomic-embed-text',
    },
    maxTokens: 4096,
    temperature: 0.7,
    autoGenerateSummary: true,
    autoGenerateTags: true,
    autoGenerateKeyPoints: false,
    autoGenerateEmbedding: true,
  },
  scraper: {
    defaultEngine: 'local',
    firecrawlApiKey: '',
    timeout: 30,
    maxRetries: 3,
    concurrency: 3,
    autoScrapeInterval: 0,
    keepVersionCount: 10,
    enableJavaScript: true,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  search: {
    pageSize: 20,
    searchMode: 'hybrid',
    enableSuggestions: true,
    searchHistoryCount: 50,
  },
  backup: {
    enableAutoBackup: true,
    backupInterval: 24,
    keepBackupCount: 5,
    backupPath: '',
    includeFiles: true,
  },
  update: {
    autoCheckUpdate: true,
    autoDownloadUpdate: true,
    channel: 'stable',
    checkInterval: 24,
  },
};

/**
 * 默认窗口状态
 */
export const DEFAULT_WINDOW_STATE: WindowState = {
  width: 1200,
  height: 800,
  isMaximized: false,
  isFullScreen: false,
};

/**
 * 默认托盘配置
 */
export const DEFAULT_TRAY_CONFIG: TrayConfig = {
  showTrayIcon: true,
  minimizeToTray: true,
  closeToTray: true,
};