import { BaseScraper } from './engines/BaseScraper';
import {
  ScrapeOptions,
  ScrapeResult,
  ScraperEngineType,
  EngineSelectionMode,
  ScrapeStatus,
} from './types';

interface EngineRegistryEntry {
  engine: BaseScraper;
  type: ScraperEngineType;
  priority: number;
}

/**
 * Low-level scraper engine registry: holds the registered scraper engines
 * (local, firecrawl), selects one per request/mode, and executes a single
 * scrape. High-level orchestration (queueing, collection persistence, AI
 * processing) lives in the `ScraperService` orchestrator under `src/services`.
 */
export class ScraperEngineService {
  private engines: Map<ScraperEngineType, EngineRegistryEntry> = new Map();
  private defaultMode: EngineSelectionMode = EngineSelectionMode.AUTO;
  private defaultEngine: ScraperEngineType = ScraperEngineType.LOCAL;

  constructor() {}

  registerEngine(engine: BaseScraper, priority: number = 0): void {
    this.engines.set(engine.type, {
      engine,
      type: engine.type,
      priority,
    });
  }

  unregisterEngine(type: ScraperEngineType): boolean {
    return this.engines.delete(type);
  }

  getEngine(type: ScraperEngineType): BaseScraper | undefined {
    const entry = this.engines.get(type);
    return entry?.engine;
  }

  hasEngine(type: ScraperEngineType): boolean {
    return this.engines.has(type);
  }

  setDefaultEngine(type: ScraperEngineType): void {
    this.defaultEngine = type;
  }

  setDefaultMode(mode: EngineSelectionMode): void {
    this.defaultMode = mode;
  }

  async selectEngine(
    options: ScrapeOptions,
    mode: EngineSelectionMode = this.defaultMode
  ): Promise<BaseScraper | null> {
    if (options.engine) {
      const engine = this.getEngine(options.engine);
      if (engine && (await engine.isAvailable())) {
        return engine;
      }
      return null;
    }

    switch (mode) {
      case EngineSelectionMode.LOCAL_ONLY:
        return this.selectLocalEngine();

      case EngineSelectionMode.FIRECRAWL_ONLY:
        return this.selectFirecrawlEngine();

      case EngineSelectionMode.AUTO:
        return this.selectAutoEngine();

      default:
        return this.selectAutoEngine();
    }
  }

  private async selectLocalEngine(): Promise<BaseScraper | null> {
    const engine = this.getEngine(ScraperEngineType.LOCAL);
    if (engine && (await engine.isAvailable())) {
      return engine;
    }
    return null;
  }

  private async selectFirecrawlEngine(): Promise<BaseScraper | null> {
    const engine = this.getEngine(ScraperEngineType.FIRECRAWL);
    if (engine && (await engine.isAvailable())) {
      return engine;
    }
    return null;
  }

  private async selectAutoEngine(): Promise<BaseScraper | null> {
    const sortedEngines = Array.from(this.engines.values()).sort(
      (a, b) => b.priority - a.priority
    );

    for (const entry of sortedEngines) {
      try {
        if (await entry.engine.isAvailable()) {
          return entry.engine;
        }
      } catch {
        continue;
      }
    }

    const defaultEngine = this.getEngine(this.defaultEngine);
    if (defaultEngine) {
      return defaultEngine;
    }

    return sortedEngines.length > 0 ? sortedEngines[0].engine : null;
  }

  async scrape(
    options: ScrapeOptions,
    mode: EngineSelectionMode = this.defaultMode
  ): Promise<ScrapeResult> {
    const engine = await this.selectEngine(options, mode);

    if (!engine) {
      return {
        url: options.url,
        status: ScrapeStatus.FAILED,
        title: '',
        error: 'No available scraper engine found',
        errorCode: 'NO_ENGINE_AVAILABLE',
      };
    }

    try {
      return await engine.scrape(options);
    } catch (error) {
      return {
        url: options.url,
        status: ScrapeStatus.FAILED,
        title: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        engine: engine.type,
      };
    }
  }

  async scrapeBatch(
    urls: string[],
    options: Partial<ScrapeOptions> = {},
    mode: EngineSelectionMode = this.defaultMode
  ): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];

    for (const url of urls) {
      const result = await this.scrape(
        {
          ...options,
          url,
        },
        mode
      );
      results.push(result);
    }

    return results;
  }

  async getAvailableEngines(): Promise<ScraperEngineType[]> {
    const available: ScraperEngineType[] = [];

    for (const [type, entry] of this.engines.entries()) {
      try {
        if (await entry.engine.isAvailable()) {
          available.push(type);
        }
      } catch {
        continue;
      }
    }

    return available;
  }

  getRegisteredEngines(): ScraperEngineType[] {
    return Array.from(this.engines.keys());
  }
}

export const scraperEngineService = new ScraperEngineService();
