// Electron 主进程入口
import { app, BrowserWindow, shell, ipcMain, session } from 'electron'
import path from 'path'
import { startSidecar, stopSidecar, restartSidecar, isBackendReady, getBackendUrl } from './sidecar'
import { createTray, destroyTray } from './tray'
import { registerFileSystemIPC } from './ipc/file-system'
import { registerWorkspaceIPC } from './ipc/workspace'

let mainWindow: BrowserWindow | null = null

// vite-plugin-electron 在开发模式会注入 VITE_DEV_SERVER_URL，比 app.isPackaged 可靠
const isDev = !!process.env.VITE_DEV_SERVER_URL
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:49217'
const PROD_URL = 'http://localhost:8111'

/** 创建主窗口 */
function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: true,
    autoHideMenuBar: true,
    title: 'ComfyUI Draw Flow',
    webPreferences: {
      preload: path.join(app.getAppPath(), 'dist-electron/preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  })

  // 兜底：即使 ready-to-show 已经错过也强制 show
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  // 关闭按钮 → 最小化到托盘
  mainWindow.on('close', (e) => {
    const isQuitting = (app as unknown as { isQuitting: boolean }).isQuitting
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  // 外部链接用系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  // 加载页面
  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL)
    // devtools 默认不打开；如需调试可按 F12 或在环境变量里设置 OPEN_DEVTOOLS=1
    if (process.env.OPEN_DEVTOOLS === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  } else {
    mainWindow.loadURL(PROD_URL)
  }

  // F12 快捷键切换 devtools，Ctrl+Shift+I 同样支持
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.type !== 'keyDown') return
    const isF12 = input.key === 'F12'
    const isCtrlShiftI = input.control && input.shift && (input.key === 'I' || input.key === 'i')
    if (isF12 || isCtrlShiftI) {
      if (mainWindow?.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools()
      } else {
        mainWindow?.webContents.openDevTools({ mode: 'detach' })
      }
    }
  })

  return mainWindow
}

/** 注册应用级 IPC */
function registerAppIPC(): void {
  ipcMain.handle('app:getBackendStatus', async () => {
    return {
      running: await isBackendReady(),
      url: getBackendUrl(),
    }
  })

  ipcMain.handle('app:restartBackend', async () => {
    return await restartSidecar()
  })
}

// 单实例锁
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    // 0. 放开麦克风权限（日记模块语音输入需要）
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      if (permission === 'media') {
        callback(true)
      } else {
        callback(false)
      }
    })

    // 1. 注册 IPC handlers
    registerFileSystemIPC()
    registerWorkspaceIPC()
    registerAppIPC()

    // 2. 启动后端 sidecar
    console.log('[main] 启动后端 sidecar...')
    const backendReady = await startSidecar()
    if (!backendReady) {
      console.error('[main] 后端启动失败，应用仍会打开但功能可能不可用')
    }

    // 3. 创建主窗口
    const win = createWindow()

    // 4. 创建系统托盘
    createTray(win)
  })

  // macOS 激活
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })

  // 真正退出前清理
  app.on('before-quit', async (e) => {
    e.preventDefault()
    console.log('[main] 正在停止后端...')
    await stopSidecar()
    destroyTray()
    ;(app as unknown as { isQuitting: boolean }).isQuitting = true
    app.exit()
  })

  app.on('window-all-closed', () => {
    // 不退出，最小化到托盘（所有平台统一行为）
    // macOS 也不退出
  })
}
