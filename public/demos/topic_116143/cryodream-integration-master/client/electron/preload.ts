// preload 脚本 - 桥接主进程和渲染进程
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // 文件系统
  fs: {
    openFileDialog: (options?: unknown) =>
      ipcRenderer.invoke('fs:openFileDialog', options),
    saveFileDialog: (options?: unknown) =>
      ipcRenderer.invoke('fs:saveFileDialog', options),
    selectFolder: (defaultPath?: string) =>
      ipcRenderer.invoke('fs:selectFolder', defaultPath),
    readFile: (filePath: string, options?: unknown) =>
      ipcRenderer.invoke('fs:readFile', filePath, options),
    writeFile: (filePath: string, content: string, options?: unknown) =>
      ipcRenderer.invoke('fs:writeFile', filePath, content, options),
    readDir: (dirPath: string, options?: unknown) =>
      ipcRenderer.invoke('fs:readDir', dirPath, options),
    getFileInfo: (filePath: string) =>
      ipcRenderer.invoke('fs:getFileInfo', filePath),
    exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
    copy: (src: string, dest: string) =>
      ipcRenderer.invoke('fs:copy', src, dest),
    move: (src: string, dest: string) =>
      ipcRenderer.invoke('fs:move', src, dest),
    delete: (filePath: string, recursive?: boolean) =>
      ipcRenderer.invoke('fs:delete', filePath, recursive),
    createDir: (dirPath: string, recursive?: boolean) =>
      ipcRenderer.invoke('fs:createDir', dirPath, recursive),
    rename: (oldPath: string, newPath: string) =>
      ipcRenderer.invoke('fs:rename', oldPath, newPath),
    joinPath: (...paths: string[]) => ipcRenderer.invoke('fs:joinPath', paths),
    basename: (filePath: string) => ipcRenderer.invoke('fs:basename', filePath),
    dirname: (filePath: string) => ipcRenderer.invoke('fs:dirname', filePath),
  },
  // 工作区
  workspace: {
    getCurrent: () => ipcRenderer.invoke('workspace:getCurrent'),
    select: () => ipcRenderer.invoke('workspace:select'),
    set: (workspacePath: string, name?: string) =>
      ipcRenderer.invoke('workspace:set', workspacePath, name),
    getRecent: () => ipcRenderer.invoke('workspace:getRecent'),
    clearRecent: () => ipcRenderer.invoke('workspace:clearRecent'),
    openInExplorer: (p?: string) =>
      ipcRenderer.invoke('workspace:openInExplorer', p),
    verifyPermissions: () => ipcRenderer.invoke('workspace:verifyPermissions'),
  },
  // 应用信息
  app: {
    isElectron: true as const,
    version: process.env.npm_package_version || '1.0.0',
    platform: process.platform,
    getBackendStatus: () => ipcRenderer.invoke('app:getBackendStatus'),
    restartBackend: () => ipcRenderer.invoke('app:restartBackend'),
  },
}

contextBridge.exposeInMainWorld('electron', api)
