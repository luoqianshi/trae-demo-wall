import {
  ScraperEngineService,
  scraperEngineService,
  ScraperScheduler,
  ScrapeStateMachine,
  scrapeStateMachine,
  LocalScraper,
  localScraper,
  FirecrawlScraper,
  firecrawlScraper,
  ScrapeOptions,
  ScrapeResult,
  ScrapeStatus,
  ScrapeTask,
  QueueStats,
  ScraperEngineType,
} from '../scraper';
import { collectionService } from './CollectionService';
import { configService } from './ConfigService';
import { IPC_EVENT_CHANNELS, CollectionData, CaptureProgressEvent } from '../shared/types/ipc';
import { windowManager } from '../main/window';
import { aiService } from '../ai';
import { vectorService } from './VectorService';
import { logger } from '../main/utils/logger';

/**
 * High-level scraper orchestrator: wires the engine registry
 * ({@link ScraperEngineService}) and scheduler to collection persistence and
 * post-scrape AI processing, and emits progress/completion IPC events. This is
 * the public entry point used by the main process and IPC handlers.
 */
export class ScraperService {
  private scheduler: ScraperScheduler;
  private scraperEngine: ScraperEngineService;
  private stateMachine: ScrapeStateMachine;
  private localScraperInstance: LocalScraper;
  private firecrawlScraperInstance: FirecrawlScraper;
  private isInitialized: boolean = false;

  constructor() {
    this.scraperEngine = scraperEngineService;
    this.stateMachine = scrapeStateMachine;
    this.localScraperInstance = localScraper;
    this.firecrawlScraperInstance = firecrawlScraper;
    this.scheduler = new ScraperScheduler(this.scraperEngine, this.stateMachine);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const config = configService.getConfig();
      const scraperConfig = config.scraper;

      this.localScraperInstance = new LocalScraper({
        timeout: scraperConfig.timeout,
        maxRetries: scraperConfig.maxRetries,
        userAgent: scraperConfig.userAgent,
        enableJavaScript: scraperConfig.enableJavaScript,
      });

      this.firecrawlScraperInstance = new FirecrawlScraper(scraperConfig.firecrawlApiKey, {
        timeout: scraperConfig.timeout,
        maxRetries: scraperConfig.maxRetries,
      });

      this.scraperEngine.unregisterEngine(ScraperEngineType.LOCAL);
      this.scraperEngine.unregisterEngine(ScraperEngineType.FIRECRAWL);
      this.scraperEngine.registerEngine(this.localScraperInstance, 1);
      this.scraperEngine.registerEngine(this.firecrawlScraperInstance, 2);

      if (scraperConfig.defaultEngine === 'firecrawl') {
        this.scraperEngine.setDefaultEngine(ScraperEngineType.FIRECRAWL);
      } else {
        this.scraperEngine.setDefaultEngine(ScraperEngineType.LOCAL);
      }

      // Initialize the AI service and apply the persisted config (per-provider
      // credentials + independent Chat / Embedding backend selection), and keep
      // it in sync when settings change.
      await aiService.initialize();
      aiService.applyConfig(config.ai);
      configService.onConfigChange((c) => {
        aiService.applyConfig(c.ai);
        // The embedding model's dimension may have changed; rebuild the vector
        // store to match so semantic search doesn't crash on a size mismatch.
        void vectorService.reinitialize(configService.getEmbeddingDimensions());
      });

      this.scheduler = new ScraperScheduler(this.scraperEngine, this.stateMachine, {
        concurrency: scraperConfig.concurrency,
        defaultTimeout: scraperConfig.timeout * 1000,
        defaultMaxRetries: scraperConfig.maxRetries,
        retryDelayMs: 1000,
        maxRetryDelayMs: 30000,
      });

      this.setupEventListeners();

      this.isInitialized = true;
      logger.info('ScraperService', 'Initialized successfully');
    } catch (error) {
      logger.error('ScraperService', 'Failed to initialize:', error);
    }
  }

  private setupEventListeners(): void {
    this.scheduler.onProgress((task, progress) => {
      this.sendProgressEvent(task, progress);
    });

    this.scheduler.onComplete((task, result) => {
      void this.handleScrapeComplete(task, result);
    });

    this.scheduler.onError((task, error) => {
      this.sendErrorEvent(task, error);
    });
  }

  async scrape(url: string, options?: Partial<ScrapeOptions>): Promise<ScrapeTask> {
    await this.ensureInitialized();

    const scrapeOptions: ScrapeOptions = {
      url,
      ...options,
    };

    // Ensure a collection row exists for this URL (side effect only).
    if (!collectionService.getCollectionByUrl(url)) {
      await collectionService.createCollection({
        url,
        autoScrape: false,
      });
    }

    const task = this.scheduler.addTask(scrapeOptions);
    return task;
  }

  async scrapeBatch(urls: string[], options?: Partial<ScrapeOptions>): Promise<ScrapeTask[]> {
    await this.ensureInitialized();

    const tasks: ScrapeTask[] = [];

    for (const url of urls) {
      // Ensure a collection row exists for this URL (side effect only).
      if (!collectionService.getCollectionByUrl(url)) {
        await collectionService.createCollection({
          url,
          autoScrape: false,
        });
      }

      const task = this.scheduler.addTask({
        url,
        ...options,
      });
      tasks.push(task);
    }

    return tasks;
  }

  getTaskStatus(taskId: string): ScrapeTask | undefined {
    return this.scheduler.getTask(taskId);
  }

  getStats(): QueueStats {
    return this.scheduler.getStats();
  }

  cancelTask(taskId: string): boolean {
    return this.scheduler.cancelTask(taskId);
  }

  retryTask(taskId: string): boolean {
    return this.scheduler.retryTask(taskId);
  }

  pause(): void {
    this.scheduler.pause();
  }

  resume(): void {
    this.scheduler.resume();
  }

  clearCompleted(): void {
    this.scheduler.clearCompleted();
  }

  private async handleScrapeComplete(task: ScrapeTask, result: ScrapeResult): Promise<void> {
    try {
      if (result.status === ScrapeStatus.COMPLETED) {
        let collection = collectionService.getCollectionByUrl(task.url);

        if (collection) {
          // Stage 2: extract & persist the article body.
          this.emitCapture(IPC_EVENT_CHANNELS.SCRAPER_PROGRESS, {
            taskId: task.id, url: task.url, stage: 'extracting', progress: 45, message: '提取正文',
          });

          collection = collectionService.updateCollectionWithScrapeResult(
            collection.id,
            {
              title: result.title,
              description: result.description,
              content: result.content,
              htmlContent: result.htmlContent,
              textContent: result.textContent,
              markdown: result.markdown,
              metadata: result.metadata,
              engine: result.engine,
            }
          );

          // Stage 3: AI processing (summary / tags / key points / embedding).
          // Run if EITHER a chat backend (summary/tags/key-points) or an
          // embedding backend (vectors) is configured — they're independent.
          const config = configService.getConfig();
          const aiEnabled = config.ai.chatProvider !== 'none' || config.ai.embeddingProvider !== 'none';
          if (aiEnabled && collection) {
            this.emitCapture(IPC_EVENT_CHANNELS.SCRAPER_PROGRESS, {
              taskId: task.id, url: task.url, stage: 'ai', progress: 55, message: 'AI 处理',
            });
            try {
              await this.runAIProcessing(collection.id, task);
            } catch (aiError) {
              logger.error('ScraperService', 'AI processing failed:', aiError);
            }
            // Reload so the completed event carries the AI-enriched record.
            collection = collectionService.getCollection(collection.id) ?? collection;
          }
        }

        this.sendCompletedEvent(task, result, collection);
      } else {
        this.sendErrorEvent(task, new Error(result.error || 'Scrape failed'));
      }
    } catch (error) {
      logger.error('ScraperService', 'Error handling scrape completion:', error);
      this.sendErrorEvent(task, error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Re-run AI processing (summary / tags / key points / embedding) on an
   * existing collection — used by the "regenerate" action so users can enrich
   * or re-embed items without re-scraping.
   */
  async reprocessCollectionAI(collectionId: string): Promise<void> {
    await this.ensureInitialized();
    await this.runAIProcessing(collectionId);
  }

  private async runAIProcessing(collectionId: string, task?: ScrapeTask): Promise<void> {
    const config = configService.getConfig();
    const collection = collectionService.getCollection(collectionId);
    if (!collection) return;

    const content = collection.content || collection.description || '';
    const title = collection.title || '';

    const aiProgress = (progress: number, message: string): void => {
      if (!task) return;
      this.emitCapture(IPC_EVENT_CHANNELS.AI_PROGRESS, {
        taskId: task.id, url: task.url, stage: 'ai', progress, message,
      });
    };

    logger.info('ScraperService', 'AI processing start', {
      collectionId,
      chatProvider: config.ai.chatProvider,
      embeddingProvider: config.ai.embeddingProvider,
      autoSummary: config.ai.autoGenerateSummary,
      autoTags: config.ai.autoGenerateTags,
      autoKeyPoints: config.ai.autoGenerateKeyPoints,
      autoEmbedding: config.ai.autoGenerateEmbedding,
      contentLen: content.length,
    });

    if (!content) {
      logger.warn('ScraperService', 'AI processing skipped: empty content', { collectionId });
    }

    // Each step is isolated: one step failing (e.g. the chat backend erroring)
    // must not prevent the others from running, and each logs its outcome so a
    // missing summary/tag/key-point is diagnosable.
    if (content && config.ai.autoGenerateSummary) {
      try {
        aiProgress(60, '生成摘要');
        const summaryResult = await aiService.generateSummary({ title, content });
        if (summaryResult.summary) {
          collectionService.updateCollection(collectionId, { summary: summaryResult.summary });
        }
        logger.info('ScraperService', 'AI summary done', { collectionId, len: summaryResult.summary?.length ?? 0 });
      } catch (e) {
        logger.error('ScraperService', 'AI summary failed', e);
      }
    }

    if (content && config.ai.autoGenerateTags) {
      try {
        aiProgress(72, '生成标签');
        const tagsResult = await aiService.generateTags({ title, content, maxTags: 8 });
        logger.info('ScraperService', 'AI tags generated', { collectionId, count: tagsResult.tags.length, tags: tagsResult.tags });
        if (tagsResult.tags.length > 0) {
          const merged = [...new Set([...(collection.tags || []), ...tagsResult.tags])];
          collectionService.updateCollection(collectionId, { tags: merged });
        }
      } catch (e) {
        logger.error('ScraperService', 'AI tags failed', e);
      }
    }

    if (content && config.ai.autoGenerateKeyPoints) {
      try {
        aiProgress(82, '提炼要点');
        const kpResult = await aiService.generateKeyPoints({ title, content, maxPoints: 6 });
        logger.info('ScraperService', 'AI key points generated', { collectionId, count: kpResult.keyPoints.length });
        if (kpResult.keyPoints.length > 0) {
          collectionService.updateCollection(collectionId, { keyPoints: kpResult.keyPoints });
        }
      } catch (e) {
        logger.error('ScraperService', 'AI key points failed', e);
      }
    }

    if (config.ai.autoGenerateEmbedding) {
      try {
        aiProgress(92, '生成向量');
        await vectorService.vectorizeCollection(collectionId);
      } catch (e) {
        logger.error('ScraperService', 'AI embedding failed', e);
      }
    }
  }

  /** Push a capture-progress event to the renderer (best-effort). */
  private emitCapture(channel: string, event: CaptureProgressEvent): void {
    const mainWin = windowManager.getMainWindow();
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.webContents.send(channel, event);
    }
  }

  private sendProgressEvent(task: ScrapeTask, progress: number): void {
    // Scraping occupies the first ~40% of the pipeline; AI/save fill the rest.
    const scaled = Math.max(5, Math.min(40, Math.round(progress * 0.4)));
    this.emitCapture(IPC_EVENT_CHANNELS.SCRAPER_PROGRESS, {
      taskId: task.id, url: task.url, stage: 'scraping', progress: scaled, message: '抓取网页',
    });
  }

  private sendCompletedEvent(
    task: ScrapeTask,
    result: ScrapeResult,
    collection?: CollectionData | null
  ): void {
    this.emitCapture(IPC_EVENT_CHANNELS.SCRAPER_COMPLETED, {
      taskId: task.id,
      url: task.url,
      stage: 'done',
      progress: 100,
      collectionId: collection?.id,
      title: collection?.title || result.title,
    });
  }

  private sendErrorEvent(task: ScrapeTask, error: Error): void {
    this.emitCapture(IPC_EVENT_CHANNELS.SCRAPER_FAILED, {
      taskId: task.id,
      url: task.url,
      stage: 'error',
      progress: 0,
      error: error.message,
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  async getAvailableEngines(): Promise<string[]> {
    await this.ensureInitialized();
    const engines = await this.scraperEngine.getAvailableEngines();
    return engines.map((e) => e.toString());
  }

  updateFirecrawlApiKey(apiKey: string): void {
    this.firecrawlScraperInstance.setApiKey(apiKey);
  }

  reinitialize(): void {
    this.isInitialized = false;
  }
}

export const scraperService = new ScraperService();
