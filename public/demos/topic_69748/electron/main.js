const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { initDatabase, getDb, getJumperConfig, saveJumperConfig } = require('./database');
const { registerHandlers } = require('./ipc-handlers');

let mainWindow = null;

function getDataDir() {
  // 数据目录与程序本体同目录下的独立文件夹
  let baseDir;
  if (process.env.NODE_ENV === 'development') {
    baseDir = process.cwd();
  } else {
    baseDir = path.dirname(app.getPath('exe'));
  }
  const dataDir = path.join(baseDir, 'app-data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const projectsDir = path.join(dataDir, 'projects');
  if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir, { recursive: true });
  }
  return dataDir;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: '局点项目信息管理工具',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  const dataDir = getDataDir();
  initDatabase(dataDir);
  registerHandlers(ipcMain, { getDataDir, getDb, dialog, shell, getJumperConfig, saveJumperConfig });
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
