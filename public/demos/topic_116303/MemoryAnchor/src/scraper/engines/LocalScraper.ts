import { BaseScraper } from './BaseScraper';
import {
  ScrapeOptions,
  ScrapeResult,
  ScraperEngineType,
} from '../types';
import { extractContent } from '../utils/contentExtractor';
import { normalizeUrl, isValidUrl } from '../utils/urlUtils';
import { execSync } from 'child_process';
import { platform } from 'os';
import { existsSync } from 'fs';
import type { Browser, Page } from 'puppeteer-core';

type PuppeteerModule = typeof import('puppeteer-core');

export class LocalScraper extends BaseScraper {
  readonly name = 'Local Scraper';
  readonly type = ScraperEngineType.LOCAL;

  private puppeteer: PuppeteerModule | null = null;
  private browser: Browser | null = null;
  private isInitialized: boolean = false;

  constructor(config: Partial<ConstructorParameters<typeof BaseScraper>[0]> = {}) {
    super(config);
  }

  private async initPuppeteer(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.puppeteer = await import('puppeteer-core');
      this.isInitialized = true;
    } catch (error) {
      console.warn('Puppeteer not available:', error);
      this.isInitialized = false;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.initPuppeteer();
      return this.isInitialized && !!this.puppeteer;
    } catch {
      return false;
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser) return this.browser;

    if (!this.puppeteer) {
      await this.initPuppeteer();
    }

    if (!this.puppeteer) {
      throw new Error('Puppeteer is not available');
    }

    try {
      this.browser = await this.puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
        ],
      });
    } catch (error) {
      try {
        const executablePath = this.findChromePath();
        if (executablePath) {
          this.browser = await this.puppeteer.launch({
            executablePath,
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
            ],
          });
        } else {
          throw error;
        }
      } catch (e) {
        throw new Error(`Failed to launch browser: ${e instanceof Error ? e.message : 'Unknown error'}`, { cause: e });
      }
    }

    return this.browser;
  }

  private findChromePath(): string | null {
    try {
      if (platform() === 'darwin') {
        const paths = [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Chromium.app/Contents/MacOS/Chromium',
          '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
          '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        ];
        for (const path of paths) {
          if (existsSync(path)) return path;
        }
      } else if (platform() === 'win32') {
        const paths = [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files\\Chromium\\Application\\chrome.exe',
        ];
        for (const path of paths) {
          if (existsSync(path)) return path;
        }
      } else {
        try {
          const result = execSync('which chromium-browser || which chromium || which google-chrome || which google-chrome-stable', { encoding: 'utf8' });
          return result.trim();
        } catch {
          return null;
        }
      }
    } catch {
      return null;
    }

    return null;
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
        return await this.scrapeWithFetch(options, startTime);
      }

      return await this.scrapeWithPuppeteer(options, startTime);
    } catch (error) {
      return this.createErrorResult(
        url,
        error instanceof Error ? error.message : 'Unknown error',
        startTime
      );
    }
  }

  private async scrapeWithPuppeteer(options: ScrapeOptions, startTime: string): Promise<ScrapeResult> {
    const url = normalizeUrl(options.url);
    const timeout = this.getTimeout(options);
    const userAgent = this.getUserAgent(options);

    let page: Page | null = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();

      await page.setUserAgent(userAgent);
      await page.setViewport({ width: 1280, height: 800 });

      if (!this.shouldEnableJavaScript(options)) {
        await page.setJavaScriptEnabled(false);
      }

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout,
      });

      if (!response || !response.ok()) {
        const status = response ? response.status() : 0;
        return this.createErrorResult(url, `HTTP ${status} error`, startTime);
      }

      const finalUrl = page.url();
      const htmlContent = await page.content();
      const title = await page.title();

      const extractMainOnly = options.extractMainContentOnly !== false;
      const extracted = extractContent(htmlContent, finalUrl, extractMainOnly);

      let thumbnail: string | undefined;
      try {
        const ogImage = await page
          .$eval('meta[property="og:image"]', (el: { content: string }) => el.content)
          .catch(() => null);
        thumbnail = ogImage || extracted.metadata.thumbnail;
      } catch {
        thumbnail = extracted.metadata.thumbnail;
      }

      const result = this.createSuccessResult(
        {
          url,
          finalUrl,
          title: extracted.title || title,
          description: extracted.description,
          content: extracted.content,
          markdown: options.includeMarkdown !== false ? extracted.markdown : undefined,
          htmlContent: options.includeHtml !== false ? extracted.htmlContent : undefined,
          textContent: extracted.textContent,
          metadata: {
            ...extracted.metadata,
            thumbnail,
          },
        },
        startTime
      );

      return result;
    } catch (error) {
      return this.createErrorResult(
        url,
        error instanceof Error ? error.message : 'Puppeteer scrape failed',
        startTime
      );
    } finally {
      if (page) {
        try {
          await page.close();
        } catch {
          // ignore
        }
      }
    }
  }

  private async scrapeWithFetch(options: ScrapeOptions, startTime: string): Promise<ScrapeResult> {
    const url = normalizeUrl(options.url);
    const timeout = this.getTimeout(options);
    const userAgent = this.getUserAgent(options);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return this.createErrorResult(url, `HTTP ${response.status} error`, startTime);
      }

      const html = await response.text();
      const finalUrl = response.url;

      const extractMainOnly = options.extractMainContentOnly !== false;
      const extracted = extractContent(html, finalUrl, extractMainOnly);

      return this.createSuccessResult(
        {
          url,
          finalUrl,
          title: extracted.title,
          description: extracted.description,
          content: extracted.content,
          markdown: options.includeMarkdown !== false ? extracted.markdown : undefined,
          htmlContent: options.includeHtml !== false ? extracted.htmlContent : undefined,
          textContent: extracted.textContent,
          metadata: extracted.metadata,
        },
        startTime
      );
    } catch (error) {
      return this.createErrorResult(
        url,
        error instanceof Error ? error.message : 'Fetch failed',
        startTime
      );
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        // ignore
      }
      this.browser = null;
    }
  }
}

export const localScraper = new LocalScraper();
