/**
 * 研易记 Electron 主进程
 */
const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, screen } = require('electron');
const path = require('path');
const axios = require('axios');

let mainWindow = null;
let captureWindow = null;

// 配置 API 地址
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 创建截图窗口（透明窗口用于选区）
function createCaptureWindow() {
  const { width, height } = screen.getPrimaryDisplay().bounds;

  captureWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  captureWindow.loadFile(path.join(__dirname, 'renderer', 'capture.html'));

  captureWindow.on('closed', () => {
    captureWindow = null;
  });
}

// 注册全局快捷键
function registerShortcuts() {
  // Ctrl+Shift+Y: 唤起截图识别
  const ret = globalShortcut.register('Ctrl+Shift+Y', () => {
    console.log('触发快捷键: Ctrl+Shift+Y');
    createCaptureWindow();
  });

  if (!ret) {
    console.error('快捷键注册失败');
  }
}

app.whenReady().then(() => {
  createWindow();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// --- IPC 消息处理 ---

// 截图完成，发送图片到后端识别
ipcMain.on('capture-done', async (event, imageDataUrl) => {
  try {
    // 关闭截图窗口
    if (captureWindow) {
      captureWindow.close();
    }

    // 转换 data URL 为 blob
    const base64 = imageDataUrl.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');

    // 上传到后端
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'image/png' });
    formData.append('file', blob, 'capture.png');

    const response = await axios.post(`${API_BASE_URL}/api/v1/recognize`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = response.data;

    // 复制 LaTeX 到剪贴板
    clipboard.writeText(result.latex);

    // 显示结果到主窗口
    if (mainWindow) {
      mainWindow.webContents.send('recognize-result', result);
      mainWindow.show();
      mainWindow.focus();
    }

    console.log('识别成功，已复制到剪贴板');
  } catch (error) {
    console.error('识别失败:', error);
    if (mainWindow) {
      mainWindow.webContents.send('recognize-error', error.message);
      mainWindow.show();
    }
  }
});

// 取消截图
ipcMain.on('capture-cancel', () => {
  if (captureWindow) {
    captureWindow.close();
  }
});

// 发送结果到渲染窗口显示
ipcMain.on('open-main-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
});