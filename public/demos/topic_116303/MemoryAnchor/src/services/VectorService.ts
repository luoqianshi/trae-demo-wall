import { zVecAdapter, ZVecAdapter } from '../database/vector';
import { aiService, AIService } from '../ai';
import { CollectionRepository, Collection } from '../database/sqlite/repositories/CollectionRepository';
import { chunkText } from './textChunk';

export interface VectorizeOptions {
  types?: Array<'title' | 'content' | 'summary'>;
  provider?: 'ollama' | 'openai' | 'claude';
  model?: string;
  force?: boolean;
}

export interface VectorizeResult {
  collectionId: string;
  vectors: {
    type: 'title' | 'content' | 'summary';
    success: boolean;
    error?: string;
    dimensions?: number;
  }[];
  success: boolean;
}

export class VectorService {
  private zVec: ZVecAdapter;
  private ai: AIService;
  private collectionRepository: CollectionRepository;
  private embeddingCache: Map<string, { vector: number[]; timestamp: string }> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.zVec = zVecAdapter;
    this.ai = aiService;
    this.collectionRepository = new CollectionRepository();
  }

  async initialize(dimensions: number = 1536): Promise<void> {
    if (this.isInitialized) return;

    await this.zVec.initialize(dimensions);
    await this.ai.initialize();

    this.isInitialized = true;
  }

  /**
   * Rebuild the vector store for a new embedding dimension (e.g. after the
   * embedding model changed). No-op if the dimension is unchanged.
   */
  async reinitialize(dimensions: number): Promise<void> {
    await this.zVec.reinitialize(dimensions);
    this.isInitialized = true;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  async vectorizeCollection(
    collectionId: string,
    options: VectorizeOptions = {}
  ): Promise<VectorizeResult> {
    await this.ensureInitialized();

    const collection = this.collectionRepository.getById(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    const types = options.types || ['title', 'content', 'summary'];
    const result: VectorizeResult = {
      collectionId,
      vectors: [],
      success: true,
    };

    if (types.includes('title')) {
      try {
        const vectorResult = await this.vectorizeTitle(collection, options);
        result.vectors.push(vectorResult);
      } catch (error) {
        result.vectors.push({
          type: 'title',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        result.success = false;
      }
    }

    if (types.includes('content')) {
      try {
        const vectorResult = await this.vectorizeContent(collection, options);
        result.vectors.push(vectorResult);
      } catch (error) {
        result.vectors.push({
          type: 'content',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        result.success = false;
      }
    }

    if (types.includes('summary')) {
      try {
        const vectorResult = await this.vectorizeSummary(collection, options);
        result.vectors.push(vectorResult);
      } catch (error) {
        result.vectors.push({
          type: 'summary',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        result.success = false;
      }
    }

    return result;
  }

  private async vectorizeTitle(
    collection: Collection,
    options: VectorizeOptions
  ): Promise<{
    type: 'title';
    success: boolean;
    error?: string;
    dimensions?: number;
  }> {
    const text = collection.title || '';
    if (!text.trim()) {
      return { type: 'title', success: false, error: 'Title is empty' };
    }

    if (!options.force) {
      const existing = this.zVec.getVector(collection.id, 'title');
      if (existing && existing.length > 0) {
        return { type: 'title', success: true, dimensions: existing.length };
      }
    }

    try {
      const embedding = await this.getEmbedding(text, options.provider);
      const provider = options.provider || 'ollama';
      const model = options.model || this.getDefaultEmbeddingModel(provider);

      this.zVec.addVector(
        collection.id,
        'title',
        embedding.embeddings[0],
        model,
        provider,
        embedding.dimensions
      );

      return { type: 'title', success: true, dimensions: embedding.dimensions };
    } catch (error) {
      return {
        type: 'title',
        success: false,
        error: error instanceof Error ? error.message : 'Vectorization failed',
      };
    }
  }

  private async vectorizeContent(
    collection: Collection,
    options: VectorizeOptions
  ): Promise<{
    type: 'content';
    success: boolean;
    error?: string;
    dimensions?: number;
  }> {
    const text = collection.content_text || collection.content || collection.description || '';
    if (!text.trim()) {
      return { type: 'content', success: false, error: 'Content is empty' };
    }

    if (!options.force && this.zVec.hasContentVectors(collection.id)) {
      return { type: 'content', success: true };
    }

    try {
      // Chunk the article into overlapping passages and embed each, so semantic
      // search can match a specific sentence/paragraph (and cover long articles)
      // instead of comparing against one whole-article vector.
      const chunks = chunkText(text);
      if (chunks.length === 0) {
        return { type: 'content', success: false, error: 'Content is empty' };
      }

      const { embeddings, dimensions } = await this.embedChunks(chunks, options.provider);
      const provider = options.provider || 'ollama';
      const model = options.model || this.getDefaultEmbeddingModel(provider);

      const stored = this.zVec.addContentChunks(
        collection.id,
        embeddings,
        model,
        provider,
        dimensions
      );
      console.log('[Vector] content vectorized', { collectionId: collection.id, chunks: chunks.length, dimensions, stored });

      return { type: 'content', success: stored > 0, dimensions };
    } catch (error) {
      console.error('[Vector] content vectorization failed', collection.id, error instanceof Error ? error.message : error);
      return {
        type: 'content',
        success: false,
        error: error instanceof Error ? error.message : 'Vectorization failed',
      };
    }
  }

  /**
   * Embed chunks, preferring a single batch call but falling back to
   * one-string-per-call when the endpoint rejects array input or returns the
   * wrong count (common with custom OpenAI-compatible servers).
   */
  private async embedChunks(
    chunks: string[],
    provider?: 'ollama' | 'openai' | 'claude'
  ): Promise<{ embeddings: number[][]; dimensions: number }> {
    try {
      const res = await this.ai.generateBatchEmbeddings(chunks, provider);
      const ok = res.embeddings.length === chunks.length && res.embeddings.every((e) => e && e.length > 0);
      if (ok) return { embeddings: res.embeddings, dimensions: res.dimensions };
      console.warn(`[Vector] batch embedding returned ${res.embeddings.length}/${chunks.length}; using sequential`);
    } catch (e) {
      console.warn('[Vector] batch embedding failed, using sequential:', e instanceof Error ? e.message : e);
    }

    const embeddings: number[][] = [];
    let dimensions = 0;
    for (const chunk of chunks) {
      const r = await this.ai.generateEmbedding({ text: chunk }, provider);
      embeddings.push(r.embeddings[0]);
      dimensions = r.dimensions || dimensions;
    }
    return { embeddings, dimensions };
  }

  private async vectorizeSummary(
    collection: Collection,
    options: VectorizeOptions
  ): Promise<{
    type: 'summary';
    success: boolean;
    error?: string;
    dimensions?: number;
  }> {
    const text = collection.description || collection.title || '';
    if (!text.trim()) {
      return { type: 'summary', success: false, error: 'Summary is empty' };
    }

    if (!options.force) {
      const existing = this.zVec.getVector(collection.id, 'summary');
      if (existing && existing.length > 0) {
        return { type: 'summary', success: true, dimensions: existing.length };
      }
    }

    try {
      const embedding = await this.getEmbedding(text, options.provider);
      const provider = options.provider || 'ollama';
      const model = options.model || this.getDefaultEmbeddingModel(provider);

      this.zVec.addVector(
        collection.id,
        'summary',
        embedding.embeddings[0],
        model,
        provider,
        embedding.dimensions
      );

      return { type: 'summary', success: true, dimensions: embedding.dimensions };
    } catch (error) {
      return {
        type: 'summary',
        success: false,
        error: error instanceof Error ? error.message : 'Vectorization failed',
      };
    }
  }

  async vectorizeText(
    text: string,
    provider?: 'ollama' | 'openai' | 'claude'
  ): Promise<{ embedding: number[]; dimensions: number; model: string; provider: string }> {
    await this.ensureInitialized();

    const cacheKey = this.getCacheKey(text, provider);
    const cached = this.embeddingCache.get(cacheKey);
    if (cached) {
      return {
        embedding: cached.vector,
        dimensions: cached.vector.length,
        model: this.getDefaultEmbeddingModel(provider || 'ollama'),
        provider: provider || 'ollama',
      };
    }

    const result = await this.getEmbedding(text, provider);

    this.embeddingCache.set(cacheKey, {
      vector: result.embeddings[0],
      timestamp: new Date().toISOString(),
    });

    return {
      embedding: result.embeddings[0],
      dimensions: result.dimensions,
      model: result.model,
      provider: provider || 'ollama',
    };
  }

  async vectorizeBatch(
    collectionIds: string[],
    options: VectorizeOptions = {}
  ): Promise<VectorizeResult[]> {
    await this.ensureInitialized();

    const results: VectorizeResult[] = [];
    const batchSize = 5;

    for (let i = 0; i < collectionIds.length; i += batchSize) {
      const batch = collectionIds.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(id => this.vectorizeCollection(id, options).catch(error => ({
          collectionId: id,
          vectors: [],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })))
      );
      results.push(...batchResults);
    }

    return results;
  }

  async vectorizeAll(options: VectorizeOptions = {}): Promise<VectorizeResult[]> {
    await this.ensureInitialized();

    const allCollections = this.collectionRepository.findWhere([
      { field: 'is_deleted', value: false },
      { field: 'status', value: 'active' },
    ]);

    const collectionIds = allCollections.map(c => c.id);
    return this.vectorizeBatch(collectionIds, options);
  }

  deleteVectors(collectionId: string): number {
    return this.zVec.deleteByCollectionId(collectionId);
  }

  async reindexCollection(collectionId: string): Promise<VectorizeResult> {
    this.zVec.deleteByCollectionId(collectionId);
    return this.vectorizeCollection(collectionId, { force: true });
  }

  optimizeIndex(): void {
    if (!this.isInitialized) return;
    this.zVec.optimize();
  }

  getStats(): {
    totalVectors: number;
    totalCollections: number;
    indexCompleteness: Record<string, number>;
    cacheSize: number;
  } {
    const dbStats = this.zVec.getStats();
    return {
      ...dbStats,
      cacheSize: this.embeddingCache.size,
    };
  }

  clearCache(): void {
    this.embeddingCache.clear();
  }

  private async getEmbedding(
    text: string,
    provider?: 'ollama' | 'openai' | 'claude'
  ) {
    return this.ai.generateEmbedding(
      { text },
      provider
    );
  }

  private getDefaultEmbeddingModel(provider: string): string {
    switch (provider) {
      case 'openai':
        return 'text-embedding-3-small';
      case 'ollama':
      default:
        return 'nomic-embed-text';
    }
  }

  private getCacheKey(text: string, provider?: string): string {
    return `${provider || 'default'}:${text.slice(0, 100)}:${text.length}`;
  }
}

let vectorServiceInstance: VectorService | null = null;

export function getVectorService(): VectorService {
  if (!vectorServiceInstance) {
    vectorServiceInstance = new VectorService();
  }
  return vectorServiceInstance;
}

export const vectorService = getVectorService();
