import { ipcMain } from 'electron';
import { wrapIpcHandler, validateOrThrow } from '../utils/ipc';
import { logger } from '../utils/logger';
import { IPC_CHANNELS } from '../../shared/types/ipc';
import type {
  SearchRequest,
  SearchResultData,
  TagSuggestionData,
  CollectionData,
} from '../../shared/types/ipc';
import { searchService } from '../../services/SearchService';

export function registerSearchHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.SEARCH_SEARCH,
    wrapIpcHandler<SearchResultData>(
      IPC_CHANNELS.SEARCH_SEARCH,
      async (_event: unknown, query: SearchRequest, options?: { page?: number; pageSize?: number }) => {
        logger.debug('IPC', 'Searching', { query: query.query, type: query.searchType });

        validateOrThrow(query, {
          required: ['query'],
          optional: ['page', 'pageSize', 'searchType', 'filters'],
          types: { query: 'string' },
        });

        await searchService.initialize();

        const searchType = query.searchType || 'hybrid';
        const page = options?.page || query.page || 1;
        const pageSize = options?.pageSize || query.pageSize || 20;

        const result = await searchService.search(
          {
            text: query.query,
            type: searchType,
            tags: query.filters?.tags,
            isFavorite: query.filters?.isFavorite,
            isRead: query.filters?.isRead,
            dateRange: query.filters?.dateRange,
            sourceType: query.filters?.sourceType,
          },
          {
            page,
            pageSize,
            searchType,
            highlightMatches: true,
          }
        );

        const items: CollectionData[] = result.items.map(item => ({
          id: item.id,
          url: item.url,
          title: item.title,
          description: item.description,
          content: item.content,
          tags: item.tags,
          isFavorite: item.isFavorite,
          isRead: item.isRead,
          viewCount: item.viewCount || 0,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          // Preserve relevance so the UI can show 相关度 / highlight matches.
          score: item.score,
          highlights: item.highlights,
        }));

        return {
          items,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          query: result.query,
          searchType: result.searchType,
          searchTimeMs: result.searchTimeMs,
        };
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.SEARCH_SUGGEST_TAGS,
    wrapIpcHandler<TagSuggestionData>(
      IPC_CHANNELS.SEARCH_SUGGEST_TAGS,
      async (_event: unknown, query: string, limit?: number) => {
        logger.debug('IPC', 'Suggesting tags', { query, limit });

        validateOrThrow({ query }, {
          required: ['query'],
          types: { query: 'string' },
        });

        await searchService.initialize();

        const suggestions = await searchService.suggestTags(query);
        const tags = suggestions.slice(0, limit || 10).map(s => s.tag);

        return {
          tags,
          query,
        };
      }
    )
  );

  logger.debug('IPC', 'Search handlers registered');
}