import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { wrapIpcHandler, validateOrThrow } from '../utils/ipc';
import { logger } from '../utils/logger';
import { pathManager } from '../utils/path';
import { IPC_CHANNELS } from '../../shared/types/ipc';
import type {
  CreateCollectionRequest,
  UpdateCollectionRequest,
  ListCollectionsRequest,
  CollectionData,
  CollectionListData,
  CollectionStatsData,
} from '../../shared/types/ipc';
import { collectionService } from '../../services/CollectionService';

/** Recursively sum file sizes under a directory (best-effort; skips unreadable entries). */
function directorySize(dir: string): number {
  let total = 0;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    try {
      if (entry.isDirectory()) {
        total += directorySize(full);
      } else if (entry.isFile()) {
        total += fs.statSync(full).size;
      }
    } catch {
      // skip unreadable entry
    }
  }
  return total;
}

export function registerCollectionHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.COLLECTION_CREATE,
    wrapIpcHandler<CollectionData>(
      IPC_CHANNELS.COLLECTION_CREATE,
      async (_event, request: CreateCollectionRequest) => {
        logger.debug('IPC', 'Creating collection', request);
        validateOrThrow(request, {
          required: ['url'],
          optional: ['title', 'description', 'tags', 'notes', 'autoScrape'],
          types: { url: 'string' },
        });

        const collection = await collectionService.createCollection(request);
        return collection;
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.COLLECTION_GET,
    wrapIpcHandler<CollectionData>(
      IPC_CHANNELS.COLLECTION_GET,
      async (_event, id: string) => {
        logger.debug('IPC', 'Getting collection', { id });
        validateOrThrow({ id }, {
          required: ['id'],
          types: { id: 'string' },
        });

        const collection = collectionService.getCollection(id);
        if (!collection) {
          throw new Error(`Collection not found: ${id}`);
        }
        return collection;
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.COLLECTION_LIST,
    wrapIpcHandler<CollectionListData>(
      IPC_CHANNELS.COLLECTION_LIST,
      async (_event, params: ListCollectionsRequest) => {
        logger.debug('IPC', 'Listing collections', params);
        validateOrThrow(params || {}, {
          optional: ['page', 'pageSize', 'sortBy', 'sortOrder', 'isDeleted', 'isFavorite', 'isRead', 'sourceType', 'dateRange', 'tags', 'search'],
        });

        const result = collectionService.listCollections(params || {});
        return result;
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.COLLECTION_UPDATE,
    wrapIpcHandler<CollectionData>(
      IPC_CHANNELS.COLLECTION_UPDATE,
      async (_event, id: string, data: UpdateCollectionRequest['data']) => {
        logger.debug('IPC', 'Updating collection', { id, data });
        validateOrThrow({ id, data }, {
          required: ['id', 'data'],
          types: { id: 'string' },
        });

        const collection = collectionService.updateCollection(id, data);
        if (!collection) {
          throw new Error(`Collection not found: ${id}`);
        }
        return collection;
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.COLLECTION_DELETE,
    wrapIpcHandler<void>(
      IPC_CHANNELS.COLLECTION_DELETE,
      async (_event, id: string) => {
        logger.debug('IPC', 'Deleting collection (soft)', { id });
        validateOrThrow({ id }, {
          required: ['id'],
          types: { id: 'string' },
        });

        const success = collectionService.deleteCollection(id);
        if (!success) {
          throw new Error(`Failed to delete collection: ${id}`);
        }
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.COLLECTION_RESTORE,
    wrapIpcHandler<CollectionData>(
      IPC_CHANNELS.COLLECTION_RESTORE,
      async (_event, id: string) => {
        logger.debug('IPC', 'Restoring collection', { id });
        validateOrThrow({ id }, {
          required: ['id'],
          types: { id: 'string' },
        });

        const collection = collectionService.restoreCollection(id);
        if (!collection) {
          throw new Error(`Failed to restore collection: ${id}`);
        }
        return collection;
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.COLLECTION_DELETE_PERMANENTLY,
    wrapIpcHandler<void>(
      IPC_CHANNELS.COLLECTION_DELETE_PERMANENTLY,
      async (_event, id: string) => {
        logger.debug('IPC', 'Deleting collection permanently', { id });
        validateOrThrow({ id }, {
          required: ['id'],
          types: { id: 'string' },
        });

        const success = collectionService.permanentlyDeleteCollection(id);
        if (!success) {
          throw new Error(`Failed to permanently delete collection: ${id}`);
        }
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.COLLECTION_TOGGLE_FAVORITE,
    wrapIpcHandler<CollectionData>(
      IPC_CHANNELS.COLLECTION_TOGGLE_FAVORITE,
      async (_event, id: string) => {
        logger.debug('IPC', 'Toggling collection favorite', { id });
        validateOrThrow({ id }, {
          required: ['id'],
          types: { id: 'string' },
        });

        const collection = collectionService.toggleFavorite(id);
        if (!collection) {
          throw new Error(`Collection not found: ${id}`);
        }
        return collection;
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.COLLECTION_MARK_AS_READ,
    wrapIpcHandler<CollectionData>(
      IPC_CHANNELS.COLLECTION_MARK_AS_READ,
      async (_event, id: string) => {
        logger.debug('IPC', 'Marking collection as read', { id });
        validateOrThrow({ id }, {
          required: ['id'],
          types: { id: 'string' },
        });

        const collection = collectionService.markAsRead(id);
        if (!collection) {
          throw new Error(`Collection not found: ${id}`);
        }
        return collection;
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.COLLECTION_STATS,
    wrapIpcHandler<CollectionStatsData>(
      IPC_CHANNELS.COLLECTION_STATS,
      async () => {
        const stats = collectionService.getStats();
        const storageBytes = directorySize(pathManager.getUserDataPath());
        return { ...stats, storageBytes };
      }
    )
  );

  logger.debug('IPC', 'Collection handlers registered');
}
