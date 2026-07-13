import { CollectionRepository, Collection } from '../database/sqlite/repositories/CollectionRepository';
import { database } from '../database/sqlite';
import { zVecAdapter, ZVecAdapter } from '../database/vector';
import { vectorService, VectorService } from './VectorService';
import { aiService, AIService } from '../ai';
import {
  SearchQuery,
  SearchOptions,
  SearchResult,
  SearchResultItem,
  TagSuggestion,
  SearchSuggestion,
} from '../shared/types/search';

interface FulltextSearchResult {
  collectionId: string;
  title: string;
  score: number;
  highlights: {
    field: string;
    fragments: string[];
  }[];
}

interface SemanticSearchResult {
  collectionId: string;
  score: number;
  vectorType: string;
}

const DEFAULT_SEARCH_WEIGHTS = {
  semantic: 0.6,
  fulltext: 0.4,
};

/** Derive the source kind from a URL, matching the card/list UI's logic. */
function deriveSourceType(url: string): 'web' | 'wechat' | 'github' | 'local' {
  if (!url || (!url.startsWith('http') && !url.startsWith('本地文件'))) return 'local';
  if (url.startsWith('本地文件')) return 'local';
  if (url.includes('github.com')) return 'github';
  if (url.includes('mp.weixin.qq.com') || url.includes('weixin')) return 'wechat';
  return 'web';
}

export class SearchService {
  private collectionRepository: CollectionRepository;
  private zVec: ZVecAdapter;
  private vectorService: VectorService;
  private ai: AIService;
  private searchHistory: Map<string, { query: string; type: string; timestamp: string; resultCount: number }> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.collectionRepository = new CollectionRepository();
    this.zVec = zVecAdapter;
    this.vectorService = vectorService;
    this.ai = aiService;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.zVec.initialize();
    await this.ai.initialize();
    await this.vectorService.initialize();

    this.isInitialized = true;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  async search(
    query: SearchQuery,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();
    await this.ensureInitialized();

    const searchType = options.searchType || query.type || 'hybrid';
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const queryText = query.text.trim();

    if (!queryText) {
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        query: queryText,
        searchType,
        searchTimeMs: Date.now() - startTime,
      };
    }

    let results: SearchResultItem[];

    switch (searchType) {
      case 'fulltext':
        results = await this.fulltextSearch(queryText, options);
        break;
      case 'semantic':
        results = await this.semanticSearch(queryText, options);
        break;
      case 'hybrid':
      default:
        results = await this.hybridSearch(queryText, options);
        break;
    }

    results = this.applyFilters(results, query);

    const total = results.length;
    const paginatedResults = results.slice((page - 1) * pageSize, page * pageSize);

    const searchTimeMs = Date.now() - startTime;

    this.addToHistory(queryText, searchType, total);

    return {
      items: paginatedResults,
      total,
      page,
      pageSize,
      query: queryText,
      searchType,
      searchTimeMs,
    };
  }

  private async fulltextSearch(
    query: string,
    options: SearchOptions
  ): Promise<SearchResultItem[]> {
    try {
      const searchResults = await this.executeFulltextSearch(query);
      return this.enrichResults(searchResults, options);
    } catch (error) {
      console.error('Fulltext search error:', error);
      return [];
    }
  }

  private async executeFulltextSearch(query: string): Promise<FulltextSearchResult[]> {
    const escapedQuery = query.replace(/["'*]/g, ' ').trim();
    const searchTerms = escapedQuery.split(/\s+/).filter(t => t.length > 0);
    const matchQuery = searchTerms.map(t => `"${t}"`).join(' AND ');

    const sql = `
      SELECT
        c.id as collectionId,
        c.title,
        c.content_text,
        c.summary,
        rank
      FROM collections_fts fts
      JOIN collections c ON c.rowid = fts.rowid
      WHERE collections_fts MATCH ?
        AND c.is_deleted = 0
      ORDER BY rank
      LIMIT 100
    `;

    try {
      const stmt = database.db.prepare(sql);
      const rows = stmt.all(matchQuery) as Array<{
        collectionId: string;
        title: string;
        content_text?: string;
        summary?: string;
        rank: number;
      }>;

      const results: FulltextSearchResult[] = [];

      for (const row of rows) {
        const highlights = this.extractHighlights(query, {
          title: row.title || '',
          content_text: row.content_text || '',
          summary: row.summary || '',
        });

        const normalizedRank = 1 / (1 + row.rank);

        results.push({
          collectionId: row.collectionId,
          title: row.title,
          score: normalizedRank,
          highlights,
        });
      }

      return results;
    } catch (error) {
      console.error('FTS query error:', error);
      return this.fallbackFulltextSearch(query);
    }
  }

  private fallbackFulltextSearch(query: string): FulltextSearchResult[] {
    const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);

    const collections = this.collectionRepository.findWhere([
      { field: 'is_deleted', value: false },
    ]);

    const results: FulltextSearchResult[] = [];

    for (const collection of collections) {
      const title = (collection.title || '').toLowerCase();
      const content = (collection.content_text || '').toLowerCase();
      const summary = (collection.summary || '').toLowerCase();

      let score = 0;
      const highlights: { field: string; fragments: string[] }[] = [];

      for (const term of searchTerms) {
        if (title.includes(term)) {
          score += 3;
          highlights.push({
            field: 'title',
            fragments: [collection.title || ''],
          });
        }
        if (summary.includes(term)) {
          score += 2;
          highlights.push({
            field: 'summary',
            fragments: [collection.summary || ''],
          });
        }
        if (content.includes(term)) {
          score += 1;
          const snippet = this.getSnippet(content, term, 100);
          highlights.push({
            field: 'content',
            fragments: [snippet],
          });
        }
      }

      if (score > 0) {
        results.push({
          collectionId: collection.id,
          title: collection.title,
          score: score / (searchTerms.length * 3),
          highlights,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 100);
  }

  private async semanticSearch(
    query: string,
    options: SearchOptions
  ): Promise<SearchResultItem[]> {
    try {
      const embeddingResult = await this.vectorService.vectorizeText(query);
      const queryVector = embeddingResult.embedding;

      const searchResults = this.zVec.batchSearch(
        { contentVector: queryVector },
        {
          // Content is chunked, so fetch more docs; results are aggregated to
          // one score per collection (max-scoring chunk) downstream.
          k: 100,
          threshold: 0.3,
        }
      );

      // Diagnostics: reveals whether any vectors exist and the top similarities.
      const totalVectors = this.zVec.getStats().totalVectors;
      console.log('[Search] semantic', {
        query: query.slice(0, 40),
        queryDim: queryVector.length,
        totalVectorsInStore: totalVectors,
        matches: searchResults.length,
        topScores: searchResults.slice(0, 3).map((r) => Number(r.score.toFixed(3))),
      });

      const collectionScores: Map<string, number> = new Map();
      const collectionVectorTypes: Map<string, string> = new Map();

      for (const result of searchResults) {
        const existingScore = collectionScores.get(result.collectionId) || 0;
        if (result.score > existingScore) {
          collectionScores.set(result.collectionId, result.score);
          collectionVectorTypes.set(result.collectionId, result.vectorType);
        }
      }

      const sortedResults: SemanticSearchResult[] = Array.from(collectionScores.entries())
        .map(([collectionId, score]) => ({
          collectionId,
          score,
          vectorType: collectionVectorTypes.get(collectionId) || '',
        }))
        .sort((a, b) => b.score - a.score);

      return this.enrichSemanticResults(sortedResults, options);
    } catch (error) {
      console.error('Semantic search error:', error);
      return [];
    }
  }

  private async hybridSearch(
    query: string,
    options: SearchOptions
  ): Promise<SearchResultItem[]> {
    const [fulltextResults, semanticResults] = await Promise.all([
      this.fulltextSearch(query, options),
      this.semanticSearch(query, options),
    ]);

    const mergedScores: Map<string, { score: number; fulltext?: number; semantic?: number }> = new Map();

    for (const result of fulltextResults) {
      const existing = mergedScores.get(result.id);
      if (existing) {
        existing.fulltext = result.score;
        existing.score = this.calculateHybridScore(existing.semantic, existing.fulltext);
      } else {
        mergedScores.set(result.id, {
          score: (result.score || 0) * DEFAULT_SEARCH_WEIGHTS.fulltext,
          fulltext: result.score,
        });
      }
    }

    for (const result of semanticResults) {
      const existing = mergedScores.get(result.id);
      if (existing) {
        existing.semantic = result.score;
        existing.score = this.calculateHybridScore(existing.semantic, existing.fulltext);
      } else {
        mergedScores.set(result.id, {
          score: (result.score || 0) * DEFAULT_SEARCH_WEIGHTS.semantic,
          semantic: result.score,
        });
      }
    }

    const allIds = Array.from(mergedScores.keys());
    const results: SearchResultItem[] = [];

    for (const id of allIds) {
      const merged = mergedScores.get(id)!;
      const collection = this.collectionRepository.getById(id);
      if (!collection || collection.is_deleted) continue;

      const fulltextItem = fulltextResults.find(r => r.id === id);

      results.push({
        ...this.collectionToItem(collection),
        score: merged.score,
        highlights: fulltextItem?.highlights,
      });
    }

    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    return results;
  }

  private calculateHybridScore(semanticScore?: number, fulltextScore?: number): number {
    const s = semanticScore || 0;
    const f = fulltextScore || 0;

    if (s > 0 && f > 0) {
      return s * DEFAULT_SEARCH_WEIGHTS.semantic + f * DEFAULT_SEARCH_WEIGHTS.fulltext + 0.1;
    } else if (s > 0) {
      return s * DEFAULT_SEARCH_WEIGHTS.semantic;
    } else {
      return f * DEFAULT_SEARCH_WEIGHTS.fulltext;
    }
  }

  private enrichResults(
    searchResults: FulltextSearchResult[],
    options: SearchOptions
  ): SearchResultItem[] {
    const results: SearchResultItem[] = [];

    for (const searchResult of searchResults) {
      const collection = this.collectionRepository.getById(searchResult.collectionId);
      if (!collection || collection.is_deleted) continue;

      results.push({
        ...this.collectionToItem(collection),
        score: searchResult.score,
        highlights: options.highlightMatches !== false ? searchResult.highlights : undefined,
      });
    }

    return results;
  }

  private enrichSemanticResults(
    searchResults: SemanticSearchResult[],
    _options: SearchOptions
  ): SearchResultItem[] {
    const results: SearchResultItem[] = [];

    for (const searchResult of searchResults) {
      const collection = this.collectionRepository.getById(searchResult.collectionId);
      if (!collection || collection.is_deleted) continue;

      results.push({
        ...this.collectionToItem(collection),
        score: searchResult.score,
      });
    }

    return results;
  }

  private applyFilters(
    results: SearchResultItem[],
    query: SearchQuery
  ): SearchResultItem[] {
    let filtered = results;

    if (query.tags && query.tags.length > 0) {
      filtered = filtered.filter((item) => {
        const itemTags = item.tags || [];
        return query.tags!.some(tag => itemTags.includes(tag));
      });
    }

    if (query.isFavorite !== undefined) {
      filtered = filtered.filter(item => item.isFavorite === query.isFavorite);
    }

    if (query.isRead !== undefined) {
      filtered = filtered.filter(item => item.isRead === query.isRead);
    }

    if (query.dateRange) {
      const start = new Date(query.dateRange.start).getTime();
      const end = new Date(query.dateRange.end).getTime();
      filtered = filtered.filter(item => {
        const createdAt = new Date(item.createdAt).getTime();
        return createdAt >= start && createdAt <= end;
      });
    }

    if (query.sourceType && query.sourceType.length > 0) {
      const wanted = new Set(query.sourceType);
      filtered = filtered.filter(item => wanted.has(deriveSourceType(item.url)));
    }

    return filtered;
  }

  private extractHighlights(
    query: string,
    fields: { title: string; content_text: string; summary: string }
  ): { field: string; fragments: string[] }[] {
    const highlights: { field: string; fragments: string[] }[] = [];
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

    if (fields.title) {
      for (const term of terms) {
        if (fields.title.toLowerCase().includes(term)) {
          highlights.push({ field: 'title', fragments: [fields.title] });
          break;
        }
      }
    }

    if (fields.summary) {
      for (const term of terms) {
        if (fields.summary.toLowerCase().includes(term)) {
          const snippet = this.getSnippet(fields.summary, term, 150);
          highlights.push({ field: 'summary', fragments: [snippet] });
          break;
        }
      }
    }

    if (fields.content_text) {
      for (const term of terms) {
        if (fields.content_text.toLowerCase().includes(term)) {
          const snippet = this.getSnippet(fields.content_text, term, 200);
          highlights.push({ field: 'content', fragments: [snippet] });
          break;
        }
      }
    }

    return highlights;
  }

  private getSnippet(text: string, term: string, contextLength: number): string {
    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf(term.toLowerCase());

    if (index === -1) return text.slice(0, contextLength);

    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(text.length, index + term.length + contextLength / 2);
    let snippet = text.slice(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }

  private collectionToItem(collection: Collection): SearchResultItem {
    return {
      id: collection.id,
      url: collection.url,
      title: collection.title,
      description: collection.summary,
      tags: collection.tags ? collection.tags.split(',').filter(Boolean) : [],
      isFavorite: collection.is_favorite,
      isRead: collection.is_read,
      viewCount: 0,
      createdAt: collection.created_at,
      updatedAt: collection.updated_at,
      sourceType: this.toSourceType(collection.source_type),
    };
  }

  private toSourceType(value: string): 'web' | 'file' | 'note' | undefined {
    if (value === 'web' || value === 'file' || value === 'note') {
      return value;
    }
    return undefined;
  }

  async suggestTags(query: string): Promise<TagSuggestion[]> {
    const sql = `
      SELECT t.name as tag, COUNT(ct.collection_id) as count
      FROM tags t
      JOIN collection_tags ct ON t.id = ct.tag_id
      JOIN collections c ON ct.collection_id = c.id
      WHERE t.name LIKE ?
        AND c.is_deleted = 0
      GROUP BY t.id
      ORDER BY count DESC, t.name
      LIMIT 10
    `;

    const likeQuery = `%${query}%`;
    try {
      const stmt = database.db.prepare(sql);
      const rows = stmt.all(likeQuery) as Array<{ tag: string; count: number }>;
      return rows.map(row => ({ tag: row.tag, count: row.count }));
    } catch {
      return [];
    }
  }

  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    const history = Array.from(this.searchHistory.values())
      .filter(h => h.query.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    for (const item of history) {
      suggestions.push({ text: item.query, type: 'history' });
    }

    if (query.length > 1) {
      try {
        const tags = await this.suggestTags(query);
        for (const tag of tags.slice(0, 5)) {
          suggestions.push({ text: tag.tag, type: 'suggested' });
        }
      } catch {
        // ignore
      }
    }

    return suggestions;
  }

  getSearchHistory(limit: number = 20): Array<{
    id: string;
    query: string;
    type: string;
    timestamp: string;
    resultCount: number;
  }> {
    return Array.from(this.searchHistory.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
      .map((item, index) => ({ id: `history-${index}`, ...item }));
  }

  clearSearchHistory(): void {
    this.searchHistory.clear();
  }

  private addToHistory(query: string, type: string, resultCount: number): void {
    const key = `${type}:${query}`;
    this.searchHistory.set(key, {
      query,
      type,
      timestamp: new Date().toISOString(),
      resultCount,
    });

    if (this.searchHistory.size > 50) {
      const oldestKey = Array.from(this.searchHistory.keys())[0];
      this.searchHistory.delete(oldestKey);
    }
  }
}

let searchServiceInstance: SearchService | null = null;

export function getSearchService(): SearchService {
  if (!searchServiceInstance) {
    searchServiceInstance = new SearchService();
  }
  return searchServiceInstance;
}

export const searchService = getSearchService();