import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { HistoryItem } from './types.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const MAIN_DIST = path.join(APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(APP_ROOT, 'dist')

let win: BrowserWindow | null

function getDataPath(): string {
  if (!app.isPackaged) {
    return APP_ROOT
  }
  const portableDir = process.env.PORTABLE_EXECUTABLE_DIR
  if (portableDir) {
    return portableDir
  }
  return path.dirname(app.getPath('exe'))
}

function getHistoryPaths() {
  const historyDir = path.join(getDataPath(), 'data', 'history')
  const historyFile = path.join(historyDir, 'records.json')
  return { historyDir, historyFile }
}

function ensureDir(dirPath: string): void {
  try {
    fs.mkdirSync(dirPath, { recursive: true })
  } catch {
    // 忽略目录创建错误
  }
}

function readHistory(): HistoryItem[] {
  try {
    const { historyFile } = getHistoryPaths()
    if (!fs.existsSync(historyFile)) {
      return []
    }
    const data = fs.readFileSync(historyFile, 'utf-8')
    const items = JSON.parse(data)
    if (!Array.isArray(items)) {
      return []
    }
    return items
  } catch {
    return []
  }
}

function writeHistory(items: HistoryItem[]): void {
  const { historyDir, historyFile } = getHistoryPaths()
  ensureDir(historyDir)
  const tempFile = `${historyFile}.tmp`
  try {
    fs.writeFileSync(tempFile, JSON.stringify(items, null, 2), 'utf-8')
    fs.renameSync(tempFile, historyFile)
  } catch {
    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile)
      }
    } catch {
      // 忽略清理错误
    }
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(MAIN_DIST, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  win.on('closed', () => {
    win = null
  })
}

ipcMain.handle('history:load', () => {
  const items = readHistory()
  return items.sort((a, b) => b.createdAt - a.createdAt)
})

ipcMain.handle('history:add', (_event, item: Omit<HistoryItem, 'id' | 'createdAt'>) => {
  const items = readHistory()
  const now = Date.now()

  const isDuplicate = items.some((existing) => {
    if (now - existing.createdAt > 10000) return false
    return (
      existing.content === item.content &&
      existing.ecLevel === item.ecLevel &&
      existing.whiteBg === item.whiteBg
    )
  })

  if (!isDuplicate) {
    const newItem: HistoryItem = {
      id: generateId(),
      content: item.content,
      ecLevel: item.ecLevel,
      whiteBg: item.whiteBg,
      createdAt: now,
    }
    items.push(newItem)
  }

  const sorted = items.sort((a, b) => b.createdAt - a.createdAt)
  const limited = sorted.slice(0, 1000)
  writeHistory(limited)
  return limited
})

ipcMain.handle('history:delete', (_event, id: string) => {
  const items = readHistory()
  const filtered = items.filter((item) => item.id !== id)
  writeHistory(filtered)
  return filtered.sort((a, b) => b.createdAt - a.createdAt)
})

ipcMain.handle('history:clear', () => {
  writeHistory([])
  return []
})

ipcMain.handle('win:minimize', () => {
  win?.minimize()
})

ipcMain.handle('win:maximize', () => {
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})

ipcMain.handle('win:close', () => {
  win?.close()
})

ipcMain.handle('win:isMaximized', () => {
  return win?.isMaximized() ?? false
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  const { historyDir } = getHistoryPaths()
  ensureDir(historyDir)
  createWindow()
})
