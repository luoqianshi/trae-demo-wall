// Backup IPC Handler
// Handles backup-related IPC communication

import { ipcMain, dialog } from 'electron';
import { wrapIpcHandler, validateOrThrow } from '../utils/ipc';
import { logger } from '../utils/logger';
import { IPC_CHANNELS } from '../../shared/types/ipc';
import type { BackupData } from '../../shared/types/ipc';
import { backupService } from '../../services/BackupService';
import { pathManager } from '../utils/path';
import path from 'path';

/**
 * 注册 Backup IPC 处理器
 */
export function registerBackupHandlers(): void {
  // 创建备份
  ipcMain.handle(
    IPC_CHANNELS.BACKUP_CREATE,
    wrapIpcHandler<BackupData>(
      IPC_CHANNELS.BACKUP_CREATE,
      async () => {
        logger.debug('IPC', 'Creating backup');

        const backupDir = pathManager.getBackupPath();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const defaultFilename = `memory-anchor-backup-${timestamp}.db`;

        const result = await dialog.showSaveDialog({
          title: 'Create Backup',
          defaultPath: path.join(backupDir, defaultFilename),
          filters: [{ name: 'Database Backup', extensions: ['db', 'backup'] }],
        });

        if (result.canceled || !result.filePath) {
          throw new Error('Backup creation canceled by user');
        }

        const backup = await backupService.createBackup(result.filePath);

        return {
          id: backup.id,
          path: backup.path,
          size: backup.size,
          createdAt: backup.createdAt,
          itemCount: backup.itemCount,
        };
      }
    )
  );

  // 恢复备份
  ipcMain.handle(
    IPC_CHANNELS.BACKUP_RESTORE,
    wrapIpcHandler<void>(
      IPC_CHANNELS.BACKUP_RESTORE,
      async (_event, source?: string) => {
        logger.debug('IPC', 'Restoring backup', { source });

        let backupPath = source;

        if (!backupPath) {
          const result = await dialog.showOpenDialog({
            title: 'Select Backup File to Restore',
            filters: [{ name: 'Database Backup', extensions: ['db', 'backup'] }],
            properties: ['openFile'],
          });

          if (result.canceled || result.filePaths.length === 0) {
            throw new Error('Backup restoration canceled by user');
          }

          backupPath = result.filePaths[0];
        }

        validateOrThrow({ backupPath }, {
          required: ['backupPath'],
          types: { backupPath: 'string' },
        });

        await backupService.restoreBackup(backupPath);
        return;
      }
    )
  );

  logger.debug('IPC', 'Backup handlers registered');
}
