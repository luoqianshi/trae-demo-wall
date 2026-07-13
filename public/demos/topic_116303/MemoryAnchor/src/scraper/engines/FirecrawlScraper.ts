import type { Firecrawl } from '@mendable/firecrawl-js';
import { BaseScraper } from './BaseScraper';
import {
  ScrapeOptions,
  ScrapeResult,
  ScrapeStatus,
  ScraperEngineType,
} from '../types';
import { normalizeUrl, isValidUrl } from '../utils/urlUtils';

export class FirecrawlScraper extends BaseScraper {
  readonly name = 'Firecrawl Scraper';
  readonly type = ScraperEngineType.FIRECRAWL;

  private apiKey: string;
  private baseUrl: string = 'https://api.firecrawl.dev';
  private firecrawl: Firecrawl | null = null;
  private isInitialized: boolean = false;

  constructor(
    apiKey: string = '',
    config: Partial<ConstructorParameters<typeof BaseScraper>[0]> = {}
  ) {
    super(config);
    this.apiKey = apiKey;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.isInitialized = false;
    this.firecrawl = null;
  }

  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
    this.isInitialized = false;
    this.firecrawl = null;
  }

  private async initFirecrawl(): Promise<void> {
    if (this.isInitialized) return;

    if (!this.apiKey) {
      this.isInitialized = false;
      return;
    }

    try {
      const { Firecrawl } = await import('@mendable/firecrawl-js');
      this.firecrawl = new Firecrawl({
        apiKey: this.apiKey,
        apiUrl: this.baseUrl,
      });
      this.isInitialized = true;
    } catch (error) {
      console.warn('Firecrawl SDK not available:', error);
      this.isInitialized = false;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.apiKey) return false;
      await this.initFirecrawl();
      return this.isInitialized && !!this.firecrawl;
    } catch {
      return false;
    }
  }

  async scrape(options: ScrapeOptions): Promise<ScrapeResult> {
    const startTime = new Date().toISOString();
    const url = normalizeUrl(options.url);

    if (!isValidUrl(url)) {
      return this.createErrorResult(url, 'Invalid URL', startTime);
    }

    try {
      const available = await this.isAvailable();
      if (!available) {
        return this.createErrorResult(
          url,
          this.apiKey ? 'Firecrawl SDK not available' : 'Firecrawl API key not set',
          startTime
        );
      }

      return await this.scrapeWithSDK(options, startTime);
    } catch (error) {
      return this.createErrorResult(
        url,
        error instanceof Error ? error.message : 'Unknown error',
        startTime
      );
    }
  }

  private async scrapeWithSDK(options: ScrapeOptions, startTime: string): Promise<ScrapeResult> {
    const url = normalizeUrl(options.url);

    try {
      // Firecrawl v4: `scrape()` returns the Document directly and throws on
      // failure — there is no `{ success, data }` envelope like v1.
      const doc = await this.firecrawl!.scrape(url, {
        formats: ['markdown', 'html', 'rawHtml'],
        onlyMainContent: options.extractMainContentOnly !== false,
      });

      const meta = doc.metadata ?? {};
      const keywords = meta.keywords;
      const tags = Array.isArray(keywords)
        ? keywords
        : typeof keywords === 'string'
          ? keywords.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined;

      const finalUrl = meta.sourceURL || meta.url || url;
      const title = meta.title || meta.ogTitle || url;
      const description = meta.description || meta.ogDescription;

      const markdown = options.includeMarkdown !== false ? doc.markdown : undefined;
      const htmlContent = options.includeHtml !== false ? doc.html : undefined;
      const textContent = doc.markdown ? this.markdownToText(doc.markdown) : undefined;

      const metadata = {
        title: meta.title,
        description: meta.description,
        // v4 DocumentMetadata has no dedicated author field; fall back to the
        // arbitrary metadata index when the source page exposed one.
        author: typeof meta.author === 'string' ? meta.author : undefined,
        publishedAt: meta.publishedTime,
        updatedAt: meta.modifiedTime,
        siteName: meta.ogSiteName,
        favicon: meta.favicon,
        thumbnail: meta.ogImage,
        language: meta.language,
        tags,
      };

      return this.createSuccessResult(
        {
          url,
          finalUrl,
          title,
          description,
          content: textContent,
          markdown,
          htmlContent,
          textContent,
          metadata,
        },
        startTime
      );
    } catch (error) {
      return this.createErrorResult(
        url,
        error instanceof Error ? error.message : 'Firecrawl scrape failed',
        startTime
      );
    }
  }

  async scrapeBatch(
    urls: string[],
    options: Partial<ScrapeOptions> = {}
  ): Promise<ScrapeResult[]> {
    const available = await this.isAvailable();
    if (!available) {
      return urls.map((url) => ({
        url,
        status: ScrapeStatus.FAILED,
        title: '',
        error: 'Firecrawl not available',
        engine: this.type,
      }));
    }

    const results: ScrapeResult[] = [];
    for (const url of urls) {
      const result = await this.scrape({ ...options, url });
      results.push(result);
    }
    return results;
  }

  private markdownToText(markdown: string): string {
    return markdown
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/^>\s+/gm, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/---/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

export const firecrawlScraper = new FirecrawlScraper();
