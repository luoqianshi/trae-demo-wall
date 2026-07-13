// Tray Service
// Handles system tray integration

import { Tray, Menu, app, nativeImage, NativeImage } from 'electron';
import { logger } from '../utils/logger';
import { windowManager } from '../window';
import { TrayConfig, DEFAULT_TRAY_CONFIG } from '../../shared/types/config';

/**
 * 32x32 RGBA PNG（圆角蓝色方块）占位托盘图标，base64 data URL。
 * 用位图而非 SVG，因为 Electron 的 nativeImage 无法解码 SVG。
 */
const TRAY_ICON_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAQElEQVR4nO3XoREAIAwEwfRFdxSNhRkGQwNJxIrTv/ZjzBWvndzdjQ6A7OEvAAAAAAAAAAAAAAAAgBaA8nNaCji5TbintiIpwAAAAABJRU5ErkJggg==';

/**
 * 托盘管理器类
 */
export class TrayManager {
  private tray: Tray | null = null;
  private config: TrayConfig;
  private isQuitting: boolean = false;

  constructor() {
    this.config = DEFAULT_TRAY_CONFIG;
  }

  /**
   * 创建托盘图标
   *
   * 使用内嵌的 PNG 数据（32x32 圆角蓝色方块占位图标）。
   * 注意：`nativeImage.createFromBuffer` 无法解码 SVG，必须使用位图格式，
   * 因此这里通过 data URL 加载 PNG。生产环境应替换为真实的图标资源文件。
   */
  private createTrayIcon(): NativeImage {
    const icon = nativeImage.createFromDataURL(TRAY_ICON_PNG_DATA_URL);
    // macOS 托盘图标建议 16x16（点，@2x 时自动 32x32）
    return process.platform === 'darwin'
      ? icon.resize({ width: 16, height: 16 })
      : icon;
  }

  /**
   * 创建托盘菜单
   */
  private createTrayMenu(): Menu {
    const mainWindow = windowManager.getMainWindow();
    const isVisible = mainWindow ? mainWindow.isVisible() : false;

    const contextMenu = Menu.buildFromTemplate([
      // 显示/隐藏窗口
      {
        label: isVisible ? '隐藏窗口' : '显示窗口',
        click: () => {
          if (isVisible) {
            windowManager.hideMainWindow();
          } else {
            windowManager.showMainWindow();
          }
          this.updateTrayMenu();
        },
      },
      {
        type: 'separator',
      },
      // 快速操作
      {
        label: '新建收藏',
        click: () => {
          windowManager.showMainWindow();
          mainWindow?.webContents.send('tray:newCollection');
          logger.debug('TrayManager', 'Tray menu: new collection');
        },
      },
      {
        label: '全部收藏',
        click: () => {
          windowManager.showMainWindow();
          mainWindow?.webContents.send('tray:allCollections');
          logger.debug('TrayManager', 'Tray menu: all collections');
        },
      },
      {
        label: '搜索',
        click: () => {
          windowManager.showMainWindow();
          mainWindow?.webContents.send('tray:search');
          logger.debug('TrayManager', 'Tray menu: search');
        },
      },
      {
        type: 'separator',
      },
      // 设置
      {
        label: '设置',
        click: () => {
          windowManager.showMainWindow();
          mainWindow?.webContents.send('tray:settings');
          logger.debug('TrayManager', 'Tray menu: settings');
        },
      },
      {
        type: 'separator',
      },
      // 退出
      {
        label: '退出',
        click: () => {
          this.quitApp();
        },
      },
    ]);

    return contextMenu;
  }

  /**
   * 创建并显示托盘
   */
  createTray(): Tray {
    if (this.tray) {
      return this.tray;
    }

    const icon = this.createTrayIcon();
    this.tray = new Tray(icon);

    // 设置托盘提示文本
    this.tray.setToolTip('Memory Anchor');

    // 设置托盘菜单
    this.tray.setContextMenu(this.createTrayMenu());

    // macOS: 设置托盘标题
    if (process.platform === 'darwin') {
      this.tray.setTitle('Memory Anchor');
    }

    // 点击托盘图标事件
    this.tray.on('click', () => {
      this.handleTrayClick();
    });

    // 双击托盘图标事件（Windows 和 Linux）
    this.tray.on('double-click', () => {
      windowManager.showMainWindow();
      logger.debug('TrayManager', 'Tray double-click: show window');
    });

    // 右键点击托盘图标事件（macOS）
    if (process.platform === 'darwin') {
      this.tray.on('right-click', () => {
        // 在 macOS 上，右键点击会自动显示上下文菜单
        this.updateTrayMenu();
      });
    }

    logger.info('TrayManager', 'System tray created');

    return this.tray;
  }

  /**
   * 处理托盘点击事件
   */
  private handleTrayClick(): void {
    const mainWindow = windowManager.getMainWindow();

    if (mainWindow) {
      if (mainWindow.isVisible()) {
        if (mainWindow.isFocused()) {
          windowManager.hideMainWindow();
        } else {
          mainWindow.focus();
        }
      } else {
        windowManager.showMainWindow();
      }
    } else {
      // 如果窗口不存在，创建新窗口
      windowManager.createMainWindow();
      windowManager.showMainWindow();
    }

    this.updateTrayMenu();
    logger.debug('TrayManager', 'Tray clicked');
  }

  /**
   * 更新托盘菜单
   */
  updateTrayMenu(): void {
    if (this.tray) {
      this.tray.setContextMenu(this.createTrayMenu());
      logger.debug('TrayManager', 'Tray menu updated');
    }
  }

  /**
   * 更新托盘图标
   */
  updateTrayIcon(icon: NativeImage): void {
    if (this.tray) {
      this.tray.setImage(icon);
      logger.debug('TrayManager', 'Tray icon updated');
    }
  }

  /**
   * 设置托盘提示文本
   */
  setToolTip(text: string): void {
    if (this.tray) {
      this.tray.setToolTip(text);
      logger.debug('TrayManager', `Tray tooltip set to: ${text}`);
    }
  }

  /**
   * 设置托盘标题（仅 macOS）
   */
  setTitle(title: string): void {
    if (this.tray && process.platform === 'darwin') {
      this.tray.setTitle(title);
      logger.debug('TrayManager', `Tray title set to: ${title}`);
    }
  }

  /**
   * 设置应用是否正在退出
   */
  setQuitting(quitting: boolean): void {
    this.isQuitting = quitting;
    windowManager.setQuitting(quitting);
    logger.debug('TrayManager', `Quitting flag set to: ${quitting}`);
  }

  /**
   * 退出应用
   */
  private quitApp(): void {
    this.setQuitting(true);
    windowManager.closeAllWindows();
    app.quit();
    logger.info('TrayManager', 'Application quit from tray menu');
  }

  /**
   * 设置配置
   */
  setConfig(config: TrayConfig): void {
    this.config = config;

    // 根据配置决定是否显示托盘图标
    if (config.showTrayIcon) {
      if (!this.tray) {
        this.createTray();
      }
    } else {
      this.destroyTray();
    }

    logger.info('TrayManager', 'Tray config updated');
  }

  /**
   * 获取托盘是否已创建
   */
  isTrayCreated(): boolean {
    return this.tray !== null;
  }

  /**
   * 获取托盘实例
   */
  getTray(): Tray | null {
    return this.tray;
  }

  /**
   * 设置 macOS Dock 菜单
   */
  setupDockMenu(): void {
    if (process.platform !== 'darwin') {
      return;
    }

    const dockMenu = Menu.buildFromTemplate([
      {
        label: '新建收藏',
        click: () => {
          windowManager.showMainWindow();
          const mainWindow = windowManager.getMainWindow();
          mainWindow?.webContents.send('dock:newCollection');
          logger.debug('TrayManager', 'Dock menu: new collection');
        },
      },
      {
        label: '全部收藏',
        click: () => {
          windowManager.showMainWindow();
          const mainWindow = windowManager.getMainWindow();
          mainWindow?.webContents.send('dock:allCollections');
          logger.debug('TrayManager', 'Dock menu: all collections');
        },
      },
      {
        type: 'separator',
      },
      {
        label: '设置',
        click: () => {
          windowManager.showMainWindow();
          const mainWindow = windowManager.getMainWindow();
          mainWindow?.webContents.send('dock:settings');
          logger.debug('TrayManager', 'Dock menu: settings');
        },
      },
    ]);

    app.dock?.setMenu(dockMenu);
    logger.info('TrayManager', 'macOS Dock menu set up');
  }

  /**
   * 显示 macOS Dock 图标
   */
  showDockIcon(): void {
    if (process.platform === 'darwin') {
      void app.dock?.show();
      logger.debug('TrayManager', 'Dock icon shown');
    }
  }

  /**
   * 隐藏 macOS Dock 图标
   */
  hideDockIcon(): void {
    if (process.platform === 'darwin') {
      app.dock?.hide();
      logger.debug('TrayManager', 'Dock icon hidden');
    }
  }

  /**
   * 销毁托盘
   */
  destroyTray(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
      logger.info('TrayManager', 'System tray destroyed');
    }
  }

  /**
   * 销毁托盘管理器
   */
  destroy(): void {
    this.destroyTray();

    // 清理 macOS Dock 菜单
    if (process.platform === 'darwin') {
      try {
        app.dock?.setMenu(Menu.buildFromTemplate([]));
      } catch {
        // 忽略 Dock 菜单清理失败（可能在应用退出时已经是无效状态）
      }
    }

    logger.info('TrayManager', 'Tray manager destroyed');
  }
}

// 导出单例实例
export const trayManager = new TrayManager();