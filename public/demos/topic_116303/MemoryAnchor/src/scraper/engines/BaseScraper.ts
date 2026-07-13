import {
  ScrapeOptions,
  ScrapeResult,
  ScrapeStatus,
  ScraperEngineType,
  ScraperEngineConfig,
  LocalScraperEngine,
} from '../types';

export abstract class BaseScraper implements LocalScraperEngine {
  abstract readonly name: string;
  abstract readonly type: ScraperEngineType;

  protected config: ScraperEngineConfig;

  constructor(config: Partial<ScraperEngineConfig> = {}) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      enableJavaScript: true,
      ...config,
    };
  }

  abstract isAvailable(): Promise<boolean>;

  abstract scrape(options: ScrapeOptions): Promise<ScrapeResult>;

  async scrapeBatch(
    urls: string[],
    options: Partial<ScrapeOptions> = {}
  ): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    for (const url of urls) {
      try {
        const result = await this.scrape({
          ...options,
          url,
        });
        results.push(result);
      } catch (error) {
        results.push({
          url,
          status: ScrapeStatus.FAILED,
          title: '',
          error: error instanceof Error ? error.message : 'Unknown error',
          engine: this.type,
        });
      }
    }
    return results;
  }

  protected createErrorResult(
    url: string,
    error: Error | string,
    startedAt?: string
  ): ScrapeResult {
    const now = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : error;

    return {
      url,
      status: ScrapeStatus.FAILED,
      title: '',
      error: errorMessage,
      engine: this.type,
      startedAt: startedAt || now,
      completedAt: now,
      durationMs: startedAt
        ? new Date(now).getTime() - new Date(startedAt).getTime()
        : 0,
    };
  }

  protected createSuccessResult(
    data: Partial<ScrapeResult> & { url: string; title: string },
    startedAt: string
  ): ScrapeResult {
    const now = new Date().toISOString();

    return {
      url: data.url,
      finalUrl: data.finalUrl || data.url,
      status: ScrapeStatus.COMPLETED,
      title: data.title,
      description: data.description,
      content: data.content,
      markdown: data.markdown,
      htmlContent: data.htmlContent,
      textContent: data.textContent,
      metadata: data.metadata,
      engine: this.type,
      startedAt,
      completedAt: now,
      durationMs: new Date(now).getTime() - new Date(startedAt).getTime(),
    };
  }

  protected getTimeout(options: ScrapeOptions): number {
    return (options.timeout || this.config.timeout) * 1000;
  }

  protected getUserAgent(options: ScrapeOptions): string {
    return options.customUserAgent || this.config.userAgent;
  }

  protected shouldEnableJavaScript(options: ScrapeOptions): boolean {
    return options.enableJavaScript ?? this.config.enableJavaScript;
  }

  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Scrape timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }
}
