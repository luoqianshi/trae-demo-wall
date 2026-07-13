// Config IPC Handler
// Handles configuration IPC communication

import { ipcMain } from 'electron';
import { wrapIpcHandler, validateOrThrow } from '../utils/ipc';
import { logger } from '../utils/logger';
import { IPC_CHANNELS } from '../../shared/types/ipc';
import type { ConfigData, DeepPartial } from '../../shared/types/ipc';
import { configService } from '../../services/ConfigService';
import { pathManager } from '../utils/path';
import { appConfigToConfigData, configDataToAppConfigPartial, type StoragePaths } from './configMapper';

/** Runtime storage paths surfaced in ConfigData (not persisted in AppConfig). */
function getStoragePaths(): StoragePaths {
  return {
    databasePath: pathManager.getDatabasePath(),
    backupPath: pathManager.getBackupPath(),
    cachePath: pathManager.getCachePath(),
  };
}

/**
 * 注册 Config IPC 处理器
 */
export function registerConfigHandlers(): void {
  // 获取配置
  ipcMain.handle(
    IPC_CHANNELS.CONFIG_GET,
    wrapIpcHandler<ConfigData>(
      IPC_CHANNELS.CONFIG_GET,
      async () => {
        logger.debug('IPC', 'Getting config');
        const appConfig = configService.getConfig();
        return appConfigToConfigData(appConfig, getStoragePaths());
      }
    )
  );

  // 更新配置
  ipcMain.handle(
    IPC_CHANNELS.CONFIG_UPDATE,
    wrapIpcHandler<ConfigData>(
      IPC_CHANNELS.CONFIG_UPDATE,
      async (_event: unknown, partial: DeepPartial<ConfigData>) => {
        logger.debug('IPC', 'Updating config', partial);
        validateOrThrow({ partial }, {
          required: ['partial'],
        });

        // Map the renderer DTO back to a Partial<AppConfig> (correct field
        // names + enum bridges) so every setting actually persists.
        const updateData = configDataToAppConfigPartial(partial);
        const updatedConfig = configService.updateConfig(updateData);
        return appConfigToConfigData(updatedConfig, getStoragePaths());
      }
    )
  );

  // 重置配置
  ipcMain.handle(
    IPC_CHANNELS.CONFIG_RESET,
    wrapIpcHandler<ConfigData>(
      IPC_CHANNELS.CONFIG_RESET,
      async () => {
        logger.debug('IPC', 'Resetting config');
        const resetConfig = configService.resetConfig();
        return appConfigToConfigData(resetConfig, getStoragePaths());
      }
    )
  );

  logger.debug('IPC', 'Config handlers registered');
}
