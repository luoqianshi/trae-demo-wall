import { app, BrowserWindow } from 'electron';
import { windowManager } from './window';
import { shortcutManager } from './services/shortcut';
import { trayManager } from './services/tray';
import { autoUpdaterService } from './services/updater';
import { logger } from './utils/logger';
import { pathManager } from './utils/path';
import { registerIpcHandlers } from './ipc';
import { database } from '../database/sqlite';
import { initialMigration } from '../database/sqlite/migrations/001_initial';
import { addTagsMigration } from '../database/sqlite/migrations/002_add_tags';
import { addVersionFieldsMigration } from '../database/sqlite/migrations/003_add_version_fields';
import { addCollectionFieldsMigration } from '../database/sqlite/migrations/004_add_collection_fields';
import { configService } from '../services/ConfigService';
import { scraperService } from '../services/ScraperService';
import { vectorService } from '../services/VectorService';

/**
 * 将持久化的配置应用到操作系统层面：开机自启动与（macOS）Dock 图标可见性。
 */
function applyOsPreferences(): void {
  try {
    const general = configService.getConfig().general;
    app.setLoginItemSettings({ openAtLogin: general.autoStart });
    if (process.platform === 'darwin' && app.dock) {
      if (general.showInDock) {
        void app.dock.show();
      } else {
        app.dock.hide();
      }
    }
  } catch (e) {
    logger.warn('Main', 'Failed to apply OS preferences', e);
  }
}

async function initializeApp(): Promise<void> {
  try {
    logger.info('Main', 'Starting application initialization');

    pathManager.ensureDir(pathManager.getUserDataPath());
    pathManager.ensureDir(pathManager.getCachePath());
    pathManager.ensureDir(pathManager.getBackupPath());
    pathManager.getDatabasePath();

    configService.getConfig();
    logger.info('Main', 'Config service initialized');

    // 应用操作系统相关偏好（开机自启 / Dock 可见性），并在配置变更时同步
    applyOsPreferences();
    configService.onConfigChange(() => applyOsPreferences());

    database.open();
    const migrationManager = database.instance.getMigrationManager();
    migrationManager.registerMigrations([
      initialMigration,
      addTagsMigration,
      addVersionFieldsMigration,
      addCollectionFieldsMigration,
    ]);
    await database.migrate();
    logger.info('Main', 'Database initialized and migrated');

    await scraperService.initialize();
    logger.info('Main', 'Scraper service initialized');

    await vectorService.initialize(configService.getEmbeddingDimensions());
    logger.info('Main', 'Vector service initialized');

    registerIpcHandlers();
    logger.info('Main', 'IPC handlers registered');

    const mainWindow = windowManager.createMainWindow();
    logger.info('Main', 'Main window created');

    // 焦点感知：应用内快捷键仅在窗口聚焦时生效，避免抢占其他应用的按键
    mainWindow.on('focus', () => shortcutManager.onWindowFocus());
    mainWindow.on('blur', () => shortcutManager.onWindowBlur());

    trayManager.createTray();
    trayManager.setupDockMenu();
    logger.info('Main', 'System tray and dock menu set up');

    shortcutManager.registerDefaults();
    logger.info('Main', 'Global shortcuts registered');

    autoUpdaterService.initialize();
    autoUpdaterService.checkOnStartup();
    logger.info('Main', 'Auto updater initialized');

    logger.info('Main', 'Application initialized successfully');
  } catch (error) {
    logger.error('Main', 'Failed to initialize application', error);
    throw error;
  }
}

app.whenReady().then(async () => {
  try {
    await initializeApp();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        windowManager.createMainWindow();
        windowManager.showMainWindow();
      } else {
        windowManager.showMainWindow();
      }
      logger.debug('Main', 'App activated');
    });

    logger.info('Main', 'Application ready');
  } catch (error) {
    logger.error('Main', 'Failed to start application', error);
    app.quit();
  }
}).catch((error) => {
  logger.error('Main', 'Failed to start application', error);
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (!trayManager.isTrayCreated()) {
      cleanupAndQuit();
    }
  }

  logger.debug('Main', 'All windows closed');
});

app.on('before-quit', (event) => {
  if (windowManager.isQuittingApp()) {
    logger.info('Main', 'Application is quitting');
    return;
  }

  event.preventDefault();

  windowManager.setQuitting(true);
  trayManager.setQuitting(true);

  cleanupAndQuit();
});

app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.protocol !== 'file:') {
      navigationEvent.preventDefault();
      logger.warn('Main', `Blocked navigation to: ${navigationUrl}`);
    }
  });

  contents.setWindowOpenHandler(() => {
    logger.warn('Main', 'Blocked new window creation');
    return { action: 'deny' };
  });

  contents.on('did-attach-webview', (webviewEvent) => {
    webviewEvent.preventDefault();
    logger.warn('Main', 'Blocked webview attachment');
  });
});

app.on('render-process-gone', (event, webContents, details) => {
  logger.error('Main', 'Render process crashed', {
    reason: details.reason,
    exitCode: details.exitCode,
  });

  const mainWindow = windowManager.getMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.reload();
    logger.info('Main', 'Reloaded main window after crash');
  }
});

app.on('child-process-gone', (event, details) => {
  if (details.type === 'GPU') {
    logger.error('Main', 'GPU process crashed', {
      reason: details.reason,
      exitCode: details.exitCode,
    });
  }
});

function cleanupAndQuit(): void {
  logger.info('Main', 'Starting cleanup before quit');

  try {
    vectorService.optimizeIndex();
  } catch (e) {
    logger.warn('Main', 'Failed to optimize vector index during cleanup', e);
  }

  shortcutManager.destroy();
  try {
    trayManager.destroy();
  } catch (e) {
    logger.warn('Main', 'Failed to destroy tray during cleanup', e);
  }
  autoUpdaterService.destroy();

  try {
    database.close();
  } catch (e) {
    logger.warn('Main', 'Failed to close database during cleanup', e);
  }

  windowManager.destroy();

  void logger.cleanOldLogs(7);

  app.quit();

  logger.info('Main', 'Application quit');
}



const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  logger.warn('Main', 'Another instance is already running, quitting');
  app.quit();
} else {
  app.on('second-instance', () => {
    windowManager.showMainWindow();
    logger.info('Main', 'Second instance started, focused main window');
  });
}

if (process.platform === 'win32') {
  app.setAppUserModelId('com.memoryanchor.app');
}

if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
  logger.info('Main', 'Running in development mode');
  logger.enableConsoleLogging(true);
}

process.on('uncaughtException', (error) => {
  logger.error('Main', 'Uncaught exception', error);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Main', 'Unhandled rejection', reason);
});

export {
  windowManager,
  shortcutManager,
  trayManager,
  autoUpdaterService,
  logger,
  pathManager,
  configService,
  scraperService,
  vectorService,
};
