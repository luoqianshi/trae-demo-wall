// Auto-updater Service
// Handles application auto-update functionality using electron-updater

import { dialog, app } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';
import { logger } from '../utils/logger';
import { windowManager } from '../window';
import { UpdateConfig, DEFAULT_CONFIG } from '../../shared/types/config';

export type UpdateStatus = 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';

export interface UpdateProgress {
  total: number;
  delta: number;
  transferred: number;
  percent: number;
  bytesPerSecond: number;
}

export class AutoUpdater {
  private config: UpdateConfig;
  private status: UpdateStatus = 'not-available';
  private updateInfo: UpdateInfo | null = null;
  private progress: UpdateProgress | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.config = DEFAULT_CONFIG.update;
  }

  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    autoUpdater.autoDownload = this.config.autoDownloadUpdate;
    autoUpdater.autoInstallOnAppQuit = false;

    this.setupAutoUpdaterEvents();

    this.isInitialized = true;
    logger.info('AutoUpdater', 'Auto updater initialized');
  }

  private setupAutoUpdaterEvents(): void {
    autoUpdater.on('checking-for-update', () => {
      this.status = 'checking';
      this.notifyRenderer('update:checking');
      logger.info('AutoUpdater', 'Checking for update...');
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.status = 'available';
      this.updateInfo = info;
      this.notifyRenderer('update:available', info);

      logger.info(
        'AutoUpdater',
        `Update available: version ${info.version}, release date ${info.releaseDate}`
      );

      if (this.config.autoDownloadUpdate) {
        void this.downloadUpdate();
      } else {
        void this.showUpdateAvailableDialog(info);
      }
    });

    autoUpdater.on('update-not-available', () => {
      this.status = 'not-available';
      this.notifyRenderer('update:not-available');
      logger.info('AutoUpdater', 'Update not available. Current version is the latest.');
    });

    autoUpdater.on('download-progress', (progressObj: UpdateProgress) => {
      this.status = 'downloading';
      this.progress = progressObj;
      this.notifyRenderer('update:progress', progressObj);

      logger.info(
        'AutoUpdater',
        `Download progress: ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`
      );
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.status = 'downloaded';
      this.updateInfo = info;
      this.progress = null;
      this.notifyRenderer('update:downloaded', info);

      logger.info('AutoUpdater', 'Update downloaded');

      void this.showUpdateDownloadedDialog(info);
    });

    autoUpdater.on('error', (error: Error) => {
      this.status = 'error';
      this.notifyRenderer('update:error', error.message);

      logger.error('AutoUpdater', 'Update error', error);
    });
  }

  async checkForUpdate(): Promise<void> {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      logger.error('AutoUpdater', 'Failed to check for updates', error);
      this.status = 'error';
      this.notifyRenderer('update:error', (error as Error).message);
    }
  }

  async downloadUpdate(): Promise<void> {
    try {
      await autoUpdater.downloadUpdate();
      logger.info('AutoUpdater', 'Started downloading update');
    } catch (error) {
      logger.error('AutoUpdater', 'Failed to download update', error);
      this.status = 'error';
      this.notifyRenderer('update:error', (error as Error).message);
    }
  }

  quitAndInstall(): void {
    logger.info('AutoUpdater', 'Quitting and installing update');

    windowManager.setQuitting(true);
    this.notifyRenderer('update:installing');
    autoUpdater.quitAndInstall();
  }

  private async showUpdateAvailableDialog(info: UpdateInfo): Promise<void> {
    const mainWindow = windowManager.getMainWindow();

    const result = await dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 ${info.version}`,
      detail: `当前版本: ${app.getVersion()}\n新版本: ${info.version}\n\n是否立即下载更新？`,
      buttons: ['下载更新', '稍后提醒', '跳过此版本'],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      void this.downloadUpdate();
    } else if (result.response === 2) {
      logger.info('AutoUpdater', `User chose to skip version ${info.version}`);
    }
  }

  private async showUpdateDownloadedDialog(info: UpdateInfo): Promise<void> {
    const mainWindow = windowManager.getMainWindow();

    const result = await dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: '更新已下载',
      message: `新版本 ${info.version} 已下载完成`,
      detail: '应用需要重启以安装更新。是否立即重启并安装？',
      buttons: ['立即重启', '稍后重启'],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      this.quitAndInstall();
    }
  }

  async manualCheckUpdate(): Promise<void> {
    const mainWindow = windowManager.getMainWindow();

    try {
      const result = await autoUpdater.checkForUpdates();

      if (result && result.updateInfo) {
        if (result.updateInfo.version !== app.getVersion()) {
          await dialog.showMessageBox(mainWindow!, {
            type: 'info',
            title: '发现新版本',
            message: `发现新版本 ${result.updateInfo.version}`,
            detail: `当前版本: ${app.getVersion()}\n新版本: ${result.updateInfo.version}`,
            buttons: ['确定'],
          });
        } else {
          await dialog.showMessageBox(mainWindow!, {
            type: 'info',
            title: '已是最新版本',
            message: '当前已是最新版本',
            detail: `版本号: ${app.getVersion()}`,
            buttons: ['确定'],
          });
        }
      }
    } catch (error) {
      logger.error('AutoUpdater', 'Manual check update failed', error);

      await dialog.showMessageBox(mainWindow!, {
        type: 'error',
        title: '检查更新失败',
        message: '无法检查更新',
        detail: (error as Error).message,
        buttons: ['确定'],
      });
    }
  }

  setConfig(config: UpdateConfig): void {
    this.config = config;

    autoUpdater.autoDownload = config.autoDownloadUpdate;

    if (config.autoCheckUpdate && config.checkInterval > 0) {
      this.startPeriodicCheck(config.checkInterval);
    } else {
      this.stopPeriodicCheck();
    }

    logger.info('AutoUpdater', 'Update config applied');
  }

  private startPeriodicCheck(intervalHours: number): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    const intervalMs = intervalHours * 60 * 60 * 1000;

    this.checkInterval = setInterval(() => {
      void this.checkForUpdate();
      logger.debug('AutoUpdater', 'Periodic update check triggered');
    }, intervalMs);

    logger.info(
      'AutoUpdater',
      `Started periodic update check: every ${intervalHours} hours`
    );
  }

  private stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('AutoUpdater', 'Stopped periodic update check');
    }
  }

  getStatus(): UpdateStatus {
    return this.status;
  }

  getUpdateInfo(): UpdateInfo | null {
    return this.updateInfo;
  }

  getProgress(): UpdateProgress | null {
    return this.progress;
  }

  private notifyRenderer(channel: string, data?: unknown): void {
    windowManager.sendToWindow(channel, data);
  }

  checkOnStartup(): void {
    if (this.config.autoCheckUpdate) {
      setTimeout(() => {
        void this.checkForUpdate();
        logger.info('AutoUpdater', 'Startup update check initiated');
      }, 3000);
    }
  }

  destroy(): void {
    this.stopPeriodicCheck();
    autoUpdater.removeAllListeners();
    this.isInitialized = false;
    logger.info('AutoUpdater', 'Auto updater destroyed');
  }
}

export const autoUpdaterService = new AutoUpdater();
