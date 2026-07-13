import { ipcMain } from 'electron';
import { wrapIpcHandler, validateOrThrow } from '../utils/ipc';
import { logger } from '../utils/logger';
import { IPC_CHANNELS } from '../../shared/types/ipc';
import type {
  VersionListData,
  VersionCompareData,
  VersionUpdateCheckData,
  CollectionData,
} from '../../shared/types/ipc';
import { versionService } from '../../services/VersionService';

export function registerVersionHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.VERSION_LIST,
    wrapIpcHandler<VersionListData>(
      IPC_CHANNELS.VERSION_LIST,
      async (_event, collectionId: string, page?: number, pageSize?: number) => {
        logger.debug('IPC', 'Listing versions', { collectionId, page, pageSize });
        validateOrThrow({ collectionId }, {
          required: ['collectionId'],
          types: { collectionId: 'string' },
        });

        const result = versionService.getVersions(collectionId, page, pageSize);
        return result;
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.VERSION_COMPARE,
    wrapIpcHandler<VersionCompareData>(
      IPC_CHANNELS.VERSION_COMPARE,
      async (_event, collectionId: string, versionAId: string, versionBId: string) => {
        logger.debug('IPC', 'Comparing versions', { collectionId, versionAId, versionBId });
        validateOrThrow({ collectionId, versionAId, versionBId }, {
          required: ['collectionId', 'versionAId', 'versionBId'],
          types: { collectionId: 'string', versionAId: 'string', versionBId: 'string' },
        });

        const result = versionService.compareVersions(collectionId, versionAId, versionBId);
        if (!result) {
          throw new Error('Failed to compare versions');
        }
        return result;
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.VERSION_CHECK_UPDATE,
    wrapIpcHandler<VersionUpdateCheckData>(
      IPC_CHANNELS.VERSION_CHECK_UPDATE,
      async (_event, collectionId: string) => {
        logger.debug('IPC', 'Checking version update', { collectionId });
        validateOrThrow({ collectionId }, {
          required: ['collectionId'],
          types: { collectionId: 'string' },
        });

        const result = await versionService.checkForUpdate(collectionId);
        return result;
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.VERSION_RESTORE,
    wrapIpcHandler<CollectionData>(
      IPC_CHANNELS.VERSION_RESTORE,
      async (_event, collectionId: string, versionId: string) => {
        logger.debug('IPC', 'Restoring version', { collectionId, versionId });
        validateOrThrow({ collectionId, versionId }, {
          required: ['collectionId', 'versionId'],
          types: { collectionId: 'string', versionId: 'string' },
        });

        const result = await versionService.restoreVersion(collectionId, versionId);
        if (!result) {
          throw new Error('Failed to restore version');
        }
        return result;
      }
    )
  );

  logger.debug('IPC', 'Version handlers registered');
}
