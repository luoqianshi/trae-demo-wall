export enum ScrapeStatus {
  PENDING = 'pending',
  SCRAPING = 'scraping',
  SCRAPED = 'scraped',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ScraperEngineType {
  LOCAL = 'local',
  FIRECRAWL = 'firecrawl',
}

export enum EngineSelectionMode {
  LOCAL_ONLY = 'local_only',
  FIRECRAWL_ONLY = 'firecrawl_only',
  AUTO = 'auto',
}

export enum ScrapePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3,
}

export interface ScrapeOptions {
  url: string;
  engine?: ScraperEngineType;
  priority?: ScrapePriority;
  timeout?: number;
  maxRetries?: number;
  enableJavaScript?: boolean;
  extractMainContentOnly?: boolean;
  includeMarkdown?: boolean;
  includeHtml?: boolean;
  customUserAgent?: string;
}

export interface ScrapeMetadata {
  title?: string;
  description?: string;
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  siteName?: string;
  favicon?: string;
  thumbnail?: string;
  language?: string;
  wordCount?: number;
  readingTime?: number;
  tags?: string[];
}

export interface ScrapeResult {
  url: string;
  finalUrl?: string;
  status: ScrapeStatus;
  title: string;
  description?: string;
  content?: string;
  markdown?: string;
  htmlContent?: string;
  textContent?: string;
  metadata?: ScrapeMetadata;
  engine?: ScraperEngineType;
  error?: string;
  errorCode?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface ScrapeTask {
  id: string;
  url: string;
  status: ScrapeStatus;
  priority: ScrapePriority;
  engine?: ScraperEngineType;
  options: ScrapeOptions;
  result?: ScrapeResult;
  error?: string;
  retryCount: number;
  maxRetries: number;
  collectionId?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ScraperEngineConfig {
  timeout: number;
  maxRetries: number;
  userAgent: string;
  enableJavaScript: boolean;
}

export interface LocalScraperEngine {
  name: string;
  type: ScraperEngineType;
  isAvailable(): Promise<boolean>;
  scrape(options: ScrapeOptions): Promise<ScrapeResult>;
  scrapeBatch?(urls: string[], options?: Partial<ScrapeOptions>): Promise<ScrapeResult[]>;
  cancel?(taskId: string): boolean;
}

export interface QueueConfig {
  concurrency: number;
  defaultTimeout: number;
  defaultMaxRetries: number;
  retryDelayMs: number;
  maxRetryDelayMs: number;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export type ScrapeProgressCallback = (task: ScrapeTask, progress: number) => void;
export type ScrapeCompleteCallback = (task: ScrapeTask, result: ScrapeResult) => void;
export type ScrapeErrorCallback = (task: ScrapeTask, error: Error) => void;
