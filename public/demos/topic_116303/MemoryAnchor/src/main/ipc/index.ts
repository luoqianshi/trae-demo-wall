// IPC Handlers Index
// This file exports and registers all IPC handlers for the main process

import { ipcMain, app } from 'electron';
import { windowManager } from '../window';
import { autoUpdaterService } from '../services/updater';
import { logger } from '../utils/logger';
import { pathManager } from '../utils/path';
import { ipcSuccess, ipcError } from '../utils/ipc';
import { IPC_CHANNELS } from '../../shared/types/ipc';

// Import module handlers
import { registerCollectionHandlers } from './collection';
import { registerSearchHandlers } from './search';
import { registerScraperHandlers } from './scraper';
import { registerAIHandlers } from './ai';
import { registerVersionHandlers } from './version';
import { registerConfigHandlers } from './config';
import { registerExportHandlers, registerImportHandlers } from './export';
import { registerBackupHandlers } from './backup';

/**
 * 注册所有 IPC 处理器
 */
export function registerIpcHandlers(): void {
  // Business module handlers
  registerCollectionHandlers();
  registerSearchHandlers();
  registerScraperHandlers();
  registerAIHandlers();
  registerVersionHandlers();
  registerConfigHandlers();
  registerExportHandlers();
  registerImportHandlers();
  registerBackupHandlers();

  // System handlers
  registerWindowHandlers();
  registerUpdateHandlers();
  registerAppHandlers();

  logger.info('IPC', 'All IPC handlers registered');
}

/**
 * 注册窗口控制处理器
 */
function registerWindowHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, async () => {
    windowManager.minimizeMainWindow();
    return ipcSuccess(undefined);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, async () => {
    windowManager.getMainWindow()?.maximize();
    return ipcSuccess(undefined);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_UNMAXIMIZE, async () => {
    windowManager.getMainWindow()?.unmaximize();
    return ipcSuccess(undefined);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, async () => {
    windowManager.getMainWindow()?.close();
    return ipcSuccess(undefined);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE_MAXIMIZE, async () => {
    windowManager.toggleMaximize();
    return ipcSuccess(undefined);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE_FULL_SCREEN, async () => {
    windowManager.toggleFullScreen();
    return ipcSuccess(undefined);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, async () => {
    return ipcSuccess(windowManager.isWindowMaximized());
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_FULL_SCREEN, async () => {
    return ipcSuccess(windowManager.isWindowFullScreen());
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_RELOAD, async () => {
    windowManager.reloadMainWindow();
    return ipcSuccess(undefined);
  });

  logger.debug('IPC', 'Window handlers registered');
}

/**
 * 注册更新处理器
 */
function registerUpdateHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.UPDATE_CHECK, async () => {
    await autoUpdaterService.checkForUpdate();
    return ipcSuccess(undefined);
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_DOWNLOAD, async () => {
    await autoUpdaterService.downloadUpdate();
    return ipcSuccess(undefined);
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_INSTALL, async () => {
    autoUpdaterService.quitAndInstall();
    return ipcSuccess(undefined);
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_GET_STATUS, async () => {
    return ipcSuccess(autoUpdaterService.getStatus());
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_GET_PROGRESS, async () => {
    return ipcSuccess(autoUpdaterService.getProgress());
  });

  logger.debug('IPC', 'Update handlers registered');
}

/**
 * 注册应用处理器
 */
function registerAppHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, async () => {
    return ipcSuccess({
      version: app.getVersion(),
      name: 'Memory Anchor',
    });
  });

  ipcMain.handle(IPC_CHANNELS.APP_GET_PATH, async (_event: unknown, name: string) => {
    const validNames = [
      'home',
      'appData',
      'userData',
      'temp',
      'exe',
      'module',
      'desktop',
      'documents',
      'downloads',
      'music',
      'pictures',
      'videos',
      'logs',
    ] as const;

    const isValidName = (validNames as readonly string[]).includes(name);
    if (!isValidName) {
      logger.warn('IPC', `Invalid path name requested: ${name}`);
      return ipcError(`Invalid path name: ${name}`, 'INVALID_PATH');
    }

    // Use pathManager for custom paths
    switch (name) {
      case 'userData':
        return ipcSuccess({ path: pathManager.getUserDataPath(), name });
      case 'logs':
        return ipcSuccess({ path: pathManager.getLogPath(), name });
      case 'temp':
        return ipcSuccess({ path: pathManager.getTempPath(), name });
      default:
        return ipcSuccess({ path: app.getPath(name as Parameters<typeof app.getPath>[0]), name });
    }
  });

  ipcMain.handle(IPC_CHANNELS.APP_QUIT, async () => {
    windowManager.setQuitting(true);
    app.quit();
    return ipcSuccess(undefined);
  });

  logger.debug('IPC', 'App handlers registered');
}