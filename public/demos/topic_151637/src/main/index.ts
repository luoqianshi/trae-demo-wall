import 'dotenv/config'
import { app, BrowserWindow, shell } from 'electron'
import { execSync } from 'child_process'
import { join } from 'path'
import { PATHS } from './config'
import { SQLiteStore } from '../storage/SQLiteStore'
import { registerAgentIPC, cleanupSandbox } from './ipc/agent.ipc'
import { registerDataIPC } from './ipc/data.ipc'
import { registerStorageIPC } from './ipc/storage.ipc'
import { createAPIServer, type APIServer } from './apiServer'

let mainWindow: BrowserWindow | null = null
let sqliteStore: SQLiteStore | null = null
let apiServer: APIServer | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    title: 'DataPilot',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/** 检测 Python 运行时是否可用 */
function checkPythonRuntime(): boolean {
  try {
    execSync('python --version', { stdio: 'pipe', timeout: 5000 })
    return true
  } catch {
    return false
  }
}

app.whenReady().then(() => {
  // 初始化 SQLite 存储
  sqliteStore = new SQLiteStore(PATHS.database)

  // 启动内嵌 API 服务（供看板 iframe 查询 SQL 用）
  apiServer = createAPIServer(sqliteStore, { readonly: true })

  // 创建窗口
  createWindow()

  // 窗口加载完成后，将 API 端口传给渲染进程
  if (mainWindow) {
    mainWindow.webContents.on('did-finish-load', () => {
      if (apiServer) {
        mainWindow?.webContents.send('api:port', apiServer.port)
      }
    })
  }

  // Python 运行时检测
  if (!checkPythonRuntime() && mainWindow) {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow?.webContents.send('agent:error', {
        message: '未检测到 Python 运行时。请安装 Python 3.10+ 并配置环境变量 PATH。'
      })
    })
  }

  // 注册 IPC handlers（需要 mainWindow 引用）
  if (mainWindow) {
    registerAgentIPC(mainWindow)
  }
  registerDataIPC()
  if (sqliteStore) {
    registerStorageIPC(sqliteStore)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  await cleanupSandbox()
  apiServer?.server?.close()
  sqliteStore?.close()
})
