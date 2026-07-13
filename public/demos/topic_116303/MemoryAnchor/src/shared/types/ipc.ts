// IPC Types
// Shared type definitions for IPC communication

/**
 * 统一的 IPC 响应格式
 */
export interface IpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * 递归 Partial：让嵌套对象的每一层字段都可选
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? U[]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

/**
 * IPC 请求参数类型
 */

// Collection 相关
export interface CreateCollectionRequest {
  url: string;
  title?: string;
  description?: string;
  tags?: string[];
  notes?: string;
  autoScrape?: boolean;
}

export interface GetCollectionRequest {
  id: string;
}

export interface ListCollectionsRequest {
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
  isDeleted?: boolean;
  isFavorite?: boolean;
  isRead?: boolean;
  sourceType?: string;
  dateRange?: { start: string; end: string };
  tags?: string[];
  search?: string;
}

export interface UpdateCollectionRequest {
  id: string;
  data: {
    title?: string;
    description?: string;
    tags?: string[];
    notes?: string;
    summary?: string;
    keyPoints?: string[];
  };
}

export interface DeleteCollectionRequest {
  id: string;
}

// Search 相关
export interface SearchRequest {
  query: string;
  page?: number;
  pageSize?: number;
  searchType?: 'fulltext' | 'semantic' | 'hybrid';
  filters?: {
    tags?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    isFavorite?: boolean;
    isRead?: boolean;
    sourceType?: string[];
  };
}

export interface SuggestTagsRequest {
  query: string;
  limit?: number;
}

// Scraper 相关
export interface ScrapeRequest {
  url: string;
  options?: {
    enableJavaScript?: boolean;
    timeout?: number;
    extractMetadata?: boolean;
    generateSummary?: boolean;
    generateTags?: boolean;
  };
}

export interface ScrapeBatchRequest {
  urls: string[];
}

export interface GetScraperStatusRequest {
  taskId: string;
}

// AI 相关
export interface GenerateSummaryRequest {
  content: string;
  maxLength?: number;
}

export interface GenerateTagsRequest {
  content: string;
  maxTags?: number;
}

export interface GenerateKeyPointsRequest {
  content: string;
  maxPoints?: number;
}

export interface GenerateEmbeddingRequest {
  text: string;
}

export interface TestAIConnectionRequest {
  providerId: string;
}

// Version 相关
export interface ListVersionsRequest {
  collectionId: string;
  page?: number;
  pageSize?: number;
}

export interface CompareVersionsRequest {
  collectionId: string;
  versionAId: string;
  versionBId: string;
}

export interface CheckVersionUpdateRequest {
  collectionId: string;
}

export interface RestoreVersionRequest {
  collectionId: string;
  versionId: string;
}

// Config 相关
export interface GetConfigRequest {}

export interface UpdateConfigRequest {
  partial: Record<string, unknown>;
}

export interface ResetConfigRequest {}

// Export 相关
export interface ExportJsonRequest {
  collectionIds: string[];
  includeMetadata?: boolean;
  includeVersions?: boolean;
}

export interface ExportMarkdownRequest {
  collectionIds: string[];
  includeMetadata?: boolean;
  includeVersions?: boolean;
  singleFile?: boolean;
}

export interface ExportHtmlRequest {
  collectionIds: string[];
  includeMetadata?: boolean;
  includeVersions?: boolean;
  theme?: 'light' | 'dark';
}

// Import 相关
export interface ImportJsonRequest {
  filePath: string;
}

// Backup 相关
export interface CreateBackupRequest {}

export interface RestoreBackupRequest {
  source: string;
}

// Window 相关
export interface WindowRequest {}

// Update 相关
export interface CheckUpdateRequest {}

export interface DownloadUpdateRequest {}

export interface InstallUpdateRequest {}

export interface GetUpdateStatusRequest {}

export interface GetUpdateProgressRequest {}

// App 相关
export interface GetAppVersionRequest {}

export interface GetAppPathRequest {
  name: string;
}

export interface QuitAppRequest {}

/**
 * IPC 响应数据类型
 */

// Collection 响应
export interface CollectionData {
  id: string;
  url: string;
  title: string;
  description?: string;
  content?: string;
  htmlContent?: string;
  summary?: string;
  keyPoints?: string[];
  tags: string[];
  notes?: string;
  isFavorite: boolean;
  isRead: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  favicon?: string;
  thumbnail?: string;
  score?: number;
  highlights?: {
    field: string;
    fragments: string[];
  }[];
}

export interface CollectionListData {
  items: CollectionData[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CollectionStatsData {
  total: number;
  todayCount: number;
  aiProcessedCount: number;
  storageBytes: number;
}

// Search 响应
export interface SearchResultData {
  items: CollectionData[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
  searchType: string;
  searchTimeMs?: number;
}

export interface TagSuggestionData {
  tags: string[];
  query: string;
}

// Scraper 响应
export interface ScraperTaskData {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  url: string;
  error?: string;
  result?: CollectionData;
}

// AI 响应
export interface SummaryData {
  summary: string;
  content: string;
}

export interface TagsData {
  tags: string[];
  content: string;
}

export interface KeyPointsData {
  keyPoints: string[];
  content: string;
}

export interface EmbeddingData {
  embedding: number[];
  text: string;
}

export interface AIConnectionTestData {
  success: boolean;
  provider: string;
  message: string;
}

// Version 响应
export interface VersionData {
  id: string;
  collectionId: string;
  versionNumber: number;
  title?: string;
  content: string;
  htmlContent?: string;
  checksum: string;
  wordCount?: number;
  createdAt: string;
  changeDescription?: string;
}

export interface VersionListData {
  items: VersionData[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VersionCompareData {
  versionA: VersionData;
  versionB: VersionData;
  diff: string;
  changes: {
    additions: number;
    deletions: number;
    modifications: number;
  };
}

export interface VersionUpdateCheckData {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  changeDescription?: string;
}

// Config 响应
export interface ConfigData {
  app: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    autoStart: boolean;
    minimizeToTray: boolean;
    showInDock: boolean;
  };
  scraper: {
    enableJavaScript: boolean;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    maxConcurrent: number;
    defaultEngine: string;
    firecrawlApiKey: string;
  };
  ai: {
    defaultProvider: string;
    chatProvider: string;
    embeddingProvider: string;
    chatByok: { protocol: string; baseUrl: string; apiKey: string; model: string; dimension: number };
    embeddingByok: { protocol: string; baseUrl: string; apiKey: string; model: string; dimension: number };
    // 全局生成参数（统一作用于所有 AI 操作）
    maxTokens: number;
    temperature: number;
    // 采集时自动运行的 AI 处理开关
    autoGenerateSummary: boolean;
    autoGenerateTags: boolean;
    autoGenerateKeyPoints: boolean;
    autoGenerateEmbedding: boolean;
    providers: {
      id: string;
      name: string;
      type: string;
      apiKey?: string;
      baseUrl?: string;
      model?: string;
      embeddingModel?: string;
      enabled: boolean;
    }[];
  };
  storage: {
    databasePath: string;
    backupPath: string;
    cachePath: string;
    autoBackup: boolean;
    backupInterval: number;
    maxBackups: number;
  };
  search: {
    defaultType: 'fulltext' | 'semantic' | 'hybrid';
    pageSize: number;
  };
}

// Export 响应
export interface ExportResultData {
  success: boolean;
  filePath: string;
  itemCount: number;
  size: number;
}

// Import 响应
export interface ImportResultData {
  success: boolean;
  itemCount: number;
  errors?: string[];
}

// Backup 响应
export interface BackupData {
  id: string;
  path: string;
  size: number;
  createdAt: string;
  itemCount: number;
}

// Window 响应
export interface WindowStateData {
  isMaximized: boolean;
  isFullScreen: boolean;
  isVisible: boolean;
}

// Update 响应
export interface UpdateStatusData {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  releaseDate?: string;
  releaseNotes?: string;
}

export interface UpdateProgressData {
  percent: number;
  bytesPerSecond: number;
  total: number;
  transferred: number;
}

// App 响应
export interface AppVersionData {
  version: string;
  name: string;
}

export interface AppPathData {
  path: string;
  name: string;
}

/**
 * IPC 白名单通道定义
 */
export const IPC_CHANNELS = {
  // Collection 通道
  COLLECTION_CREATE: 'collection:create',
  COLLECTION_GET: 'collection:get',
  COLLECTION_LIST: 'collection:list',
  COLLECTION_UPDATE: 'collection:update',
  COLLECTION_DELETE: 'collection:delete',
  COLLECTION_RESTORE: 'collection:restore',
  COLLECTION_DELETE_PERMANENTLY: 'collection:deletePermanently',
  COLLECTION_TOGGLE_FAVORITE: 'collection:toggleFavorite',
  COLLECTION_MARK_AS_READ: 'collection:markAsRead',
  COLLECTION_STATS: 'collection:stats',

  // Search 通道
  SEARCH_SEARCH: 'search:search',
  SEARCH_SUGGEST_TAGS: 'search:suggestTags',

  // Scraper 通道
  SCRAPER_SCRAPE: 'scraper:scrape',
  SCRAPER_SCRAPE_BATCH: 'scraper:scrapeBatch',
  SCRAPER_GET_STATUS: 'scraper:getStatus',

  // AI 通道
  AI_GENERATE_SUMMARY: 'ai:generateSummary',
  AI_GENERATE_TAGS: 'ai:generateTags',
  AI_GENERATE_KEY_POINTS: 'ai:generateKeyPoints',
  AI_GENERATE_EMBEDDING: 'ai:generateEmbedding',
  AI_TEST_CONNECTION: 'ai:testConnection',
  AI_REPROCESS: 'ai:reprocess',
  AI_REINDEX_ALL: 'ai:reindexAll',

  // Version 通道
  VERSION_LIST: 'version:list',
  VERSION_COMPARE: 'version:compare',
  VERSION_CHECK_UPDATE: 'version:checkUpdate',
  VERSION_RESTORE: 'version:restore',

  // Config 通道
  CONFIG_GET: 'config:get',
  CONFIG_UPDATE: 'config:update',
  CONFIG_RESET: 'config:reset',

  // Export 通道
  EXPORT_JSON: 'export:json',
  EXPORT_MARKDOWN: 'export:markdown',
  EXPORT_HTML: 'export:html',

  // Import 通道
  IMPORT_JSON: 'import:json',

  // Backup 通道
  BACKUP_CREATE: 'backup:create',
  BACKUP_RESTORE: 'backup:restore',

  // Window 通道
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_UNMAXIMIZE: 'window:unmaximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_TOGGLE_MAXIMIZE: 'window:toggleMaximize',
  WINDOW_TOGGLE_FULL_SCREEN: 'window:toggleFullScreen',
  WINDOW_IS_MAXIMIZED: 'window:isMaximized',
  WINDOW_IS_FULL_SCREEN: 'window:isFullScreen',
  WINDOW_RELOAD: 'window:reload',

  // Update 通道
  UPDATE_CHECK: 'update:check',
  UPDATE_DOWNLOAD: 'update:download',
  UPDATE_INSTALL: 'update:install',
  UPDATE_GET_STATUS: 'update:getStatus',
  UPDATE_GET_PROGRESS: 'update:getProgress',

  // App 通道
  APP_GET_VERSION: 'app:getVersion',
  APP_GET_PATH: 'app:getPath',
  APP_QUIT: 'app:quit',
} as const;

/**
 * 采集流程阶段（用于前端流水线可视化，与后端真实进度同步）
 */
export type CaptureStage = 'scraping' | 'extracting' | 'ai' | 'saving' | 'done' | 'error';

/**
 * 采集/AI 进度事件负载（SCRAPER_PROGRESS / AI_PROGRESS / SCRAPER_COMPLETED / SCRAPER_FAILED）
 */
export interface CaptureProgressEvent {
  taskId: string;
  url: string;
  stage: CaptureStage;
  /** 0-100 的整体进度 */
  progress: number;
  /** 可选的阶段说明（如「生成摘要」） */
  message?: string;
  /** 完成时携带的收藏数据 */
  collectionId?: string;
  title?: string;
  error?: string;
}

/**
 * IPC 事件通道（主进程向渲染进程推送）
 */
export const IPC_EVENT_CHANNELS = {
  // 应用事件
  APP_READY: 'app:ready',

  // Scraper 事件
  SCRAPER_PROGRESS: 'scraper:progress',
  SCRAPER_COMPLETED: 'scraper:completed',
  SCRAPER_FAILED: 'scraper:failed',

  // AI 事件
  AI_PROGRESS: 'ai:progress',
  AI_COMPLETED: 'ai:completed',
  AI_FAILED: 'ai:failed',

  // Version 事件
  VERSION_UPDATE_DETECTED: 'version:updateDetected',

  // Update 事件
  UPDATE_CHECKING: 'update:checking',
  UPDATE_AVAILABLE: 'update:available',
  UPDATE_NOT_AVAILABLE: 'update:not-available',
  UPDATE_DOWNLOADING: 'update:downloading',
  UPDATE_DOWNLOADED: 'update:downloaded',
  UPDATE_PROGRESS: 'update:progress',
  UPDATE_ERROR: 'update:error',
  UPDATE_INSTALLING: 'update:installing',

  // Shortcut 事件
  SHORTCUT_NEW_COLLECTION: 'shortcut:newCollection',
  SHORTCUT_SEARCH: 'shortcut:search',
  SHORTCUT_ALL_COLLECTIONS: 'shortcut:allCollections',
  SHORTCUT_SETTINGS: 'shortcut:settings',
  SHORTCUT_QUICK_SCRAPE: 'shortcut:quickScrape',

  // Tray 事件
  TRAY_NEW_COLLECTION: 'tray:newCollection',
  TRAY_ALL_COLLECTIONS: 'tray:allCollections',
  TRAY_SEARCH: 'tray:search',
  TRAY_SETTINGS: 'tray:settings',

  // Dock 事件
  DOCK_NEW_COLLECTION: 'dock:newCollection',
  DOCK_ALL_COLLECTIONS: 'dock:allCollections',
  DOCK_SETTINGS: 'dock:settings',
} as const;

/**
 * 渲染进程 API 类型定义
 */
export interface ElectronAPI {
  // Host platform ('darwin' | 'win32' | 'linux').
  platform: string;
  // Collection APIs
  collection: {
    create: (request: CreateCollectionRequest) => Promise<IpcResponse<CollectionData>>;
    get: (id: string) => Promise<IpcResponse<CollectionData>>;
    list: (params: ListCollectionsRequest) => Promise<IpcResponse<CollectionListData>>;
    update: (id: string, data: UpdateCollectionRequest['data']) => Promise<IpcResponse<CollectionData>>;
    delete: (id: string) => Promise<IpcResponse<void>>;
    restore: (id: string) => Promise<IpcResponse<CollectionData>>;
    deletePermanently: (id: string) => Promise<IpcResponse<void>>;
    toggleFavorite: (id: string) => Promise<IpcResponse<CollectionData>>;
    markAsRead: (id: string) => Promise<IpcResponse<CollectionData>>;
    stats: () => Promise<IpcResponse<CollectionStatsData>>;
  };

  // Search APIs
  search: {
    search: (query: SearchRequest) => Promise<IpcResponse<SearchResultData>>;
    suggestTags: (query: string, limit?: number) => Promise<IpcResponse<TagSuggestionData>>;
  };

  // Scraper APIs
  scraper: {
    scrape: (url: string, options?: ScrapeRequest['options']) => Promise<IpcResponse<ScraperTaskData>>;
    scrapeBatch: (urls: string[]) => Promise<IpcResponse<ScraperTaskData[]>>;
    getStatus: (taskId: string) => Promise<IpcResponse<ScraperTaskData>>;
  };

  // AI APIs
  ai: {
    generateSummary: (content: string) => Promise<IpcResponse<SummaryData>>;
    generateTags: (content: string) => Promise<IpcResponse<TagsData>>;
    generateKeyPoints: (content: string) => Promise<IpcResponse<KeyPointsData>>;
    generateEmbedding: (text: string) => Promise<IpcResponse<EmbeddingData>>;
    testConnection: (providerId: string, modelType?: 'chat' | 'embedding') => Promise<IpcResponse<AIConnectionTestData>>;
    reprocess: (collectionId: string) => Promise<IpcResponse<CollectionData | null>>;
    reindexAll: () => Promise<IpcResponse<{ total: number; success: number }>>;
  };

  // Version APIs
  version: {
    list: (collectionId: string, page?: number, pageSize?: number) => Promise<IpcResponse<VersionListData>>;
    compare: (collectionId: string, versionAId: string, versionBId: string) => Promise<IpcResponse<VersionCompareData>>;
    checkUpdate: (collectionId: string) => Promise<IpcResponse<VersionUpdateCheckData>>;
    restore: (collectionId: string, versionId: string) => Promise<IpcResponse<CollectionData>>;
  };

  // Config APIs
  config: {
    get: () => Promise<IpcResponse<ConfigData>>;
    update: (partial: DeepPartial<ConfigData>) => Promise<IpcResponse<ConfigData>>;
    reset: () => Promise<IpcResponse<ConfigData>>;
  };

  // Export APIs
  export: {
    json: (collectionIds: string[], options?: ExportJsonRequest) => Promise<IpcResponse<ExportResultData>>;
    markdown: (collectionIds: string[], options?: ExportMarkdownRequest) => Promise<IpcResponse<ExportResultData>>;
    html: (collectionIds: string[], options?: ExportHtmlRequest) => Promise<IpcResponse<ExportResultData>>;
  };

  // Import APIs
  import: {
    json: (filePath?: string) => Promise<IpcResponse<ImportResultData>>;
  };

  // Backup APIs
  backup: {
    create: () => Promise<IpcResponse<BackupData>>;
    restore: (source: string) => Promise<IpcResponse<void>>;
  };

  // Window APIs
  window: {
    minimize: () => Promise<IpcResponse<void>>;
    maximize: () => Promise<IpcResponse<void>>;
    unmaximize: () => Promise<IpcResponse<void>>;
    close: () => Promise<IpcResponse<void>>;
    toggleMaximize: () => Promise<IpcResponse<void>>;
    toggleFullScreen: () => Promise<IpcResponse<void>>;
    isMaximized: () => Promise<IpcResponse<boolean>>;
    isFullScreen: () => Promise<IpcResponse<boolean>>;
    reload: () => Promise<IpcResponse<void>>;
  };

  // Update APIs
  update: {
    check: () => Promise<IpcResponse<void>>;
    download: () => Promise<IpcResponse<void>>;
    install: () => Promise<IpcResponse<void>>;
    getStatus: () => Promise<IpcResponse<UpdateStatusData>>;
    getProgress: () => Promise<IpcResponse<UpdateProgressData>>;
  };

  // App APIs
  app: {
    getVersion: () => Promise<IpcResponse<AppVersionData>>;
    getPath: (name: string) => Promise<IpcResponse<AppPathData>>;
    quit: () => Promise<IpcResponse<void>>;
  };

  // Event listeners
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (channel: string, callback: (...args: unknown[]) => void) => void;
  removeAllListeners: (channel: string) => void;

  // Shortcut event listeners
  onShortcut: (action: string, callback: () => void) => void;

  // Tray event listeners
  onTray: (action: string, callback: () => void) => void;

  // Dock event listeners (macOS only)
  onDock: (action: string, callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}