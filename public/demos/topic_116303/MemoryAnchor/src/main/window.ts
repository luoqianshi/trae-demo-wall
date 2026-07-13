// Window Manager
// Manages application windows with state persistence

import { BrowserWindow, app, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { logger } from './utils/logger';
import { pathManager } from './utils/path';
import { configService } from '../services/ConfigService';
import { WindowState, DEFAULT_WINDOW_STATE } from '../shared/types/config';

/**
 * 窗口管理器类
 */
export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private windowState: WindowState;
  private windowStatePath: string;
  private isQuitting: boolean = false;

  constructor() {
    this.windowStatePath = pathManager.getWindowStatePath();
    this.windowState = this.loadWindowState();
  }

  /**
   * 加载窗口状态
   */
  private loadWindowState(): WindowState {
    try {
      if (fs.existsSync(this.windowStatePath)) {
        const data = fs.readFileSync(this.windowStatePath, 'utf-8');
        const state = JSON.parse(data) as WindowState;

        // 验证状态数据
        if (
          state &&
          typeof state.width === 'number' &&
          typeof state.height === 'number' &&
          state.width >= 800 &&
          state.height >= 600
        ) {
          logger.info('WindowManager', 'Loaded saved window state');
          return state;
        }
      }
    } catch (error) {
      logger.error('WindowManager', 'Failed to load window state', error);
    }

    logger.info('WindowManager', 'Using default window state');
    return DEFAULT_WINDOW_STATE;
  }

  /**
   * 保存窗口状态
   */
  private saveWindowState(): void {
    if (!this.mainWindow) {
      return;
    }

    try {
      const bounds = this.mainWindow.getBounds();
      const isMaximized = this.mainWindow.isMaximized();
      const isFullScreen = this.mainWindow.isFullScreen();

      const state: WindowState = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized,
        isFullScreen,
      };

      fs.writeFileSync(this.windowStatePath, JSON.stringify(state, null, 2));
      logger.debug('WindowManager', 'Saved window state');
    } catch (error) {
      logger.error('WindowManager', 'Failed to save window state', error);
    }
  }

  /**
   * 创建主窗口
   */
  createMainWindow(): BrowserWindow {
    if (this.mainWindow) {
      return this.mainWindow;
    }

    // 窗口配置
    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      width: this.windowState.width,
      height: this.windowState.height,
      minWidth: 800,
      minHeight: 600,
      show: false, // 先隐藏，等加载完成后显示
      title: 'Memory Anchor',
      // macOS 特定样式
      titleBarStyle: 'hiddenInset',
      vibrancy: 'under-window',
      visualEffectState: 'active',
      // 安全配置
      webPreferences: {
        nodeIntegration: false, // 禁用 Node.js 集成
        contextIsolation: true, // 启用上下文隔离
        sandbox: true, // 启用沙箱
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true, // 启用 web 安全
        allowRunningInsecureContent: false, // 禁止加载不安全内容
        enableBlinkFeatures: '', // 禁用实验性特性
        disableBlinkFeatures: 'AuxClick', // 禁用辅助点击
      },
    };

    // 如果有保存的位置，恢复位置（仅在非最大化状态下）
    if (
      this.windowState.x !== undefined &&
      this.windowState.y !== undefined &&
      !this.windowState.isMaximized &&
      !this.windowState.isFullScreen
    ) {
      windowOptions.x = this.windowState.x;
      windowOptions.y = this.windowState.y;
    }

    this.mainWindow = new BrowserWindow(windowOptions);

    // 恢复窗口状态
    if (this.windowState.isMaximized) {
      this.mainWindow.maximize();
    } else if (this.windowState.isFullScreen) {
      this.mainWindow.setFullScreen(true);
    }

    // 加载内容
    this.loadContent();

    // 设置 CSP（Content Security Policy）
    this.setupContentSecurityPolicy();

    // 设置事件监听
    this.setupWindowEvents();

    logger.info('WindowManager', 'Main window created');

    return this.mainWindow;
  }

  /**
   * 加载窗口内容
   */
  private loadContent(): void {
    if (!this.mainWindow) {
      return;
    }

    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    if (isDev) {
      // 开发模式：加载开发服务器
      void this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
      logger.debug('WindowManager', 'Loading from development server');
    } else {
      // 生产模式：加载打包后的文件
      const indexPath = path.join(__dirname, '../renderer/index.html');
      void this.mainWindow.loadFile(indexPath);
      logger.debug('WindowManager', 'Loading from production build');
    }
  }

  /**
   * 设置 Content Security Policy
   */
  private setupContentSecurityPolicy(): void {
    if (!this.mainWindow) {
      return;
    }

    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    // 开发模式和生产模式的 CSP 配置不同
    const csp = isDev
      ? [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // 开发模式允许 unsafe-inline 和 unsafe-eval
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: https:",
          "font-src 'self' data: https://fonts.gstatic.com",
          "connect-src 'self' http://localhost:* https:", // 开发模式允许 localhost
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
        ].join('; ')
      : [
          "default-src 'self'",
          "script-src 'self'", // 生产模式严格限制
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // 样式允许 inline（因为 Vue/React 可能需要）
          "img-src 'self' data: https:",
          "font-src 'self' data: https://fonts.gstatic.com",
          "connect-src 'self' https:", // 生产模式只允许 https
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
        ].join('; ');

    // 在加载前设置 CSP
    this.mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [csp],
        },
      });
    });

    logger.debug('WindowManager', 'Content Security Policy configured', { isDev });
  }

  /**
   * 设置窗口事件监听
   */
  private setupWindowEvents(): void {
    if (!this.mainWindow) {
      return;
    }

    // 窗口准备好显示时
    this.mainWindow.once('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show();
        logger.debug('WindowManager', 'Window ready and shown');
      }
    });

    // 窗口关闭事件：仅当启用「最小化到托盘」时隐藏，否则正常退出
    this.mainWindow.on('close', (event) => {
      const minimizeToTray = configService.getConfig().general.minimizeToTray;
      if (!this.isQuitting && minimizeToTray) {
        event.preventDefault();
        this.hideMainWindow();
        logger.debug('WindowManager', 'Window hidden instead of closed');
      }
    });

    // 窗口关闭后
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
      logger.debug('WindowManager', 'Window closed');
    });

    // 窗口移动、调整大小时保存状态
    this.mainWindow.on('move', () => this.saveWindowState());
    this.mainWindow.on('resize', () => this.saveWindowState());
    this.mainWindow.on('maximize', () => this.saveWindowState());
    this.mainWindow.on('unmaximize', () => this.saveWindowState());
    this.mainWindow.on('enter-full-screen', () => this.saveWindowState());
    this.mainWindow.on('leave-full-screen', () => this.saveWindowState());

    // 安全：阻止导航到外部链接
    this.mainWindow.webContents.on('will-navigate', (event, url) => {
      const currentUrl = this.mainWindow?.webContents.getURL();
      if (url !== currentUrl) {
        event.preventDefault();
        void shell.openExternal(url);
        logger.warn('WindowManager', `Blocked navigation to external URL: ${url}`);
      }
    });

    // 安全：在新窗口中打开外部链接
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      void shell.openExternal(url);
      logger.debug('WindowManager', `Opened external URL in browser: ${url}`);
      return { action: 'deny' };
    });
  }

  /**
   * 获取主窗口
   */
  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  /**
   * 显示主窗口
   */
  showMainWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
      logger.debug('WindowManager', 'Window shown and focused');
    }
  }

  /**
   * 隐藏主窗口
   */
  hideMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.hide();
      logger.debug('WindowManager', 'Window hidden');
    }
  }

  /**
   * 最小化主窗口
   */
  minimizeMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.minimize();
      logger.debug('WindowManager', 'Window minimized');
    }
  }

  /**
   * 最大化/取消最大化主窗口
   */
  toggleMaximize(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
        logger.debug('WindowManager', 'Window unmaximized');
      } else {
        this.mainWindow.maximize();
        logger.debug('WindowManager', 'Window maximized');
      }
    }
  }

  /**
   * 切换全屏模式
   */
  toggleFullScreen(): void {
    if (this.mainWindow) {
      this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
      logger.debug('WindowManager', 'Toggled full screen');
    }
  }

  /**
   * 切换窗口可见性
   */
  toggleWindowVisibility(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isVisible() && this.mainWindow.isFocused()) {
        this.hideMainWindow();
      } else {
        this.showMainWindow();
      }
    }
  }

  /**
   * 判断窗口是否可见
   */
  isWindowVisible(): boolean {
    return this.mainWindow ? this.mainWindow.isVisible() : false;
  }

  /**
   * 判断窗口是否最大化
   */
  isWindowMaximized(): boolean {
    return this.mainWindow ? this.mainWindow.isMaximized() : false;
  }

  /**
   * 判断窗口是否全屏
   */
  isWindowFullScreen(): boolean {
    return this.mainWindow ? this.mainWindow.isFullScreen() : false;
  }

  /**
   * 设置应用正在退出标志
   */
  setQuitting(quitting: boolean): void {
    this.isQuitting = quitting;
    logger.debug('WindowManager', `Quitting flag set to: ${quitting}`);
  }

  /**
   * 获取应用是否正在退出
   */
  isQuittingApp(): boolean {
    return this.isQuitting;
  }

  /**
   * 关闭所有窗口
   */
  closeAllWindows(): void {
    this.setQuitting(true);
    this.saveWindowState();

    if (this.mainWindow) {
      this.mainWindow.close();
    }

    BrowserWindow.getAllWindows().forEach((window) => {
      window.close();
    });

    logger.info('WindowManager', 'All windows closed');
  }

  /**
   * 发送消息到主窗口
   */
  sendToWindow(channel: string, ...args: unknown[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args);
      logger.debug('WindowManager', `Sent message to window: ${channel}`);
    }
  }

  /**
   * 重新加载主窗口内容
   */
  reloadMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.reload();
      logger.info('WindowManager', 'Window content reloaded');
    }
  }

  /**
   * 销毁窗口管理器
   */
  destroy(): void {
    this.saveWindowState();
    this.closeAllWindows();
    logger.info('WindowManager', 'Window manager destroyed');
  }
}

// 导出单例实例
export const windowManager = new WindowManager();