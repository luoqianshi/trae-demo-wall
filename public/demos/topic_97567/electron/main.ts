import { app, BrowserWindow, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { findAvailablePort } from './port-manager';
import { startServer, stopServer, type ServerHandle } from './server-manager';

// 是否为开发模式（通过环境变量 ELECTRON_IS_DEV 判断）
const isDev = process.env.ELECTRON_IS_DEV === '1' || !app.isPackaged;

// 生产环境错误日志：写入 userData/logs/launch.log，便于诊断启动失败
const logDir = isDev
  ? process.cwd()
  : path.join(app.getPath('userData'), 'logs');
const logFile = path.join(logDir, 'launch.log');
function logError(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, line);
  } catch { /* ignore logging failures */ }
  console.error(msg);
}

let mainWindow: BrowserWindow | null = null;
let server: ServerHandle | null = null;

/**
 * 获取数据文件路径。
 * 生产环境存放在用户数据目录，开发环境使用项目 data 目录。
 */
function getDataFilePath(): string {
  if (isDev) {
    return path.join(process.cwd(), 'data', 'local-db.json');
  }
  const userDataDir = app.getPath('userData');
  const dataDir = path.join(userDataDir, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'local-db.json');
}

/**
 * 创建主窗口。
 */
function createWindow(url: string): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: '雪球日记',
    icon: path.join(__dirname, 'icons', 'icon.ico'),
    autoHideMenuBar: true,
    backgroundColor: '#FFF8F0',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(url);

  // 外部链接在系统默认浏览器打开，应用内链接在窗口内导航
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('http://127.0.0.1') || targetUrl.startsWith('http://localhost')) {
      return { action: 'allow' };
    }
    shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

  // 开发模式打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * 应用初始化：启动服务器并创建窗口。
 *
 * 开发模式：next dev 已由 electron:dev 脚本启动，直接连接 http://localhost:3000
 * 生产模式：启动 standalone 服务器子进程
 */
async function bootstrap(): Promise<void> {
  try {
    if (isDev) {
      // 开发模式：直接连接已运行的 next dev 服务器
      const devPort = Number(process.env.PORT) || 3000;
      const devUrl = `http://127.0.0.1:${devPort}`;
      console.log(`[main] 开发模式，连接: ${devUrl}`);
      createWindow(devUrl);
    } else {
      // 生产模式：启动 standalone 服务器
      const port = await findAvailablePort();
      const dataFile = getDataFilePath();

      console.log(`[main] 数据文件路径: ${dataFile}`);
      console.log(`[main] 启动 Next.js 服务器于端口 ${port}...`);

      server = await startServer(port, dataFile, isDev);

      console.log(`[main] 服务器就绪: ${server.url}`);
      createWindow(server.url);
    }
  } catch (e) {
    const errMsg = (e as Error).message;
    const errStack = (e as Error).stack || 'N/A';
    logError(`启动失败: ${errMsg}`);
    logError(`堆栈: ${errStack}`);
    // 给用户一个错误提示后退出
    const { dialog } = require('electron');
    dialog.showErrorBox(
      '雪球日记启动失败',
      `应用启动时发生错误：\n\n${errMsg}\n\n请截图此错误并联系开发者。`,
    );
    app.quit();
  }
}

// 单实例锁：防止多个实例同时运行
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.whenReady().then(bootstrap);

  app.on('window-all-closed', () => {
    // macOS 上应用通常不退出，其他平台退出
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // macOS: 点击 dock 图标时重新创建窗口
    if (mainWindow === null && server) {
      createWindow(server.url);
    }
  });

  // 应用退出前停止服务器
  app.on('before-quit', () => {
    stopServer(server);
    server = null;
  });
}
