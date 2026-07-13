import { ipcMain } from 'electron';
import { wrapIpcHandler, validateOrThrow } from '../utils/ipc';
import { logger } from '../utils/logger';
import { IPC_CHANNELS } from '../../shared/types/ipc';
import type {
  SummaryData,
  TagsData,
  KeyPointsData,
  EmbeddingData,
  AIConnectionTestData,
  CollectionData,
} from '../../shared/types/ipc';
import { aiService, type AIProviderType } from '../../ai';
import { vectorService } from '../../services/VectorService';
import { configService } from '../../services/ConfigService';
import { scraperService } from '../../services/ScraperService';
import { collectionService } from '../../services/CollectionService';

export function registerAIHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.AI_GENERATE_SUMMARY,
    wrapIpcHandler<SummaryData>(
      IPC_CHANNELS.AI_GENERATE_SUMMARY,
      async (_event: unknown, content: string, title?: string) => {
        logger.debug('IPC', 'Generating summary');
        validateOrThrow({ content }, {
          required: ['content'],
          types: { content: 'string' },
        });

        await aiService.initialize();
        const result = await aiService.generateSummary({ title: title || '', content });

        return {
          summary: result.summary,
          content,
        };
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.AI_GENERATE_TAGS,
    wrapIpcHandler<TagsData>(
      IPC_CHANNELS.AI_GENERATE_TAGS,
      async (_event: unknown, content: string, title?: string) => {
        logger.debug('IPC', 'Generating tags');
        validateOrThrow({ content }, {
          required: ['content'],
          types: { content: 'string' },
        });

        await aiService.initialize();
        const result = await aiService.generateTags({ title: title || '', content });

        return {
          tags: result.tags,
          content,
        };
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.AI_GENERATE_KEY_POINTS,
    wrapIpcHandler<KeyPointsData>(
      IPC_CHANNELS.AI_GENERATE_KEY_POINTS,
      async (_event: unknown, content: string, title?: string) => {
        logger.debug('IPC', 'Generating key points');
        validateOrThrow({ content }, {
          required: ['content'],
          types: { content: 'string' },
        });

        await aiService.initialize();
        const result = await aiService.generateKeyPoints({ title: title || '', content });

        return {
          keyPoints: result.keyPoints,
          content,
        };
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.AI_GENERATE_EMBEDDING,
    wrapIpcHandler<EmbeddingData>(
      IPC_CHANNELS.AI_GENERATE_EMBEDDING,
      async (_event: unknown, text: string) => {
        logger.debug('IPC', 'Generating embedding');
        validateOrThrow({ text }, {
          required: ['text'],
          types: { text: 'string' },
        });

        await aiService.initialize();
        const result = await vectorService.vectorizeText(text);

        return {
          embedding: result.embedding,
          text,
        };
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.AI_TEST_CONNECTION,
    wrapIpcHandler<AIConnectionTestData>(
      IPC_CHANNELS.AI_TEST_CONNECTION,
      async (_event: unknown, providerId: string, modelType?: string) => {
        logger.debug('IPC', 'Testing AI connection', { providerId, modelType });
        validateOrThrow({ providerId }, {
          required: ['providerId'],
          types: { providerId: 'string' },
        });

        await aiService.initialize();
        // Push the latest persisted AI config into the providers so the test
        // reflects the credentials/baseURL the user just saved (BYOK included),
        // independent of the config-change listener timing.
        aiService.applyConfig(configService.getConfig().ai);
        const role = modelType === 'embedding' || modelType === 'chat' ? modelType : undefined;
        const results = await aiService.testConnection(providerId as AIProviderType, role);
        const chatResult = results.find(r => r.modelType === 'chat');
        const success = results.every(r => r.success);

        return {
          success,
          provider: providerId,
          message: success 
            ? `Connection successful (${results.filter(r => r.success).length}/${results.length} tests passed)`
            : (chatResult?.error || 'Connection failed'),
        };
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.AI_REPROCESS,
    wrapIpcHandler<CollectionData | null>(
      IPC_CHANNELS.AI_REPROCESS,
      async (_event: unknown, collectionId: string) => {
        logger.debug('IPC', 'Reprocessing AI for collection', { collectionId });
        validateOrThrow({ collectionId }, {
          required: ['collectionId'],
          types: { collectionId: 'string' },
        });

        await scraperService.reprocessCollectionAI(collectionId);
        return collectionService.getCollection(collectionId);
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.AI_REINDEX_ALL,
    wrapIpcHandler<{ total: number; success: number }>(
      IPC_CHANNELS.AI_REINDEX_ALL,
      async () => {
        logger.info('IPC', 'Rebuilding vectors for all collections');
        const results = await vectorService.vectorizeAll({ force: true });
        const success = results.filter((r) => r.success).length;
        logger.info('IPC', 'Vector rebuild done', { total: results.length, success });
        return { total: results.length, success };
      }
    )
  );

  logger.debug('IPC', 'AI handlers registered');
}
