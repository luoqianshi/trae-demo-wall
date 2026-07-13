// Electron 主进程与渲染进程共享的类型定义

/** 文件信息 */
export interface FileInfo {
  name: string
  path: string
  size: number
  isDirectory: boolean
  extension: string
  modifiedTime: number
  createdTime: number
}

/** 目录树节点 */
export interface DirTreeNode {
  name: string
  path: string
  isDirectory: boolean
  size: number
  extension: string
  modifiedTime: number
  children?: DirTreeNode[]
}

/** 打开文件对话框选项 */
export interface OpenFileDialogOptions {
  title?: string
  filters?: { name: string; extensions: string[] }[]
  multiple?: boolean
  defaultPath?: string
}

/** 保存文件对话框选项 */
export interface SaveFileDialogOptions {
  title?: string
  defaultPath?: string
  filters?: { name: string; extensions: string[] }[]
}

/** 工作区配置 */
export interface WorkspaceConfig {
  name: string
  path: string
  createdAt: number
  lastOpenedAt: number
}

/** 读取文件选项 */
export interface ReadFileOptions {
  encoding?: 'utf-8' | 'base64' | 'buffer'
}

/** 写入文件选项 */
export interface WriteFileOptions {
  encoding?: 'utf-8' | 'base64'
  createParentDirs?: boolean
}

/** 遍历目录选项 */
export interface ReadDirOptions {
  recursive?: boolean
  maxDepth?: number
  includeHidden?: boolean
}

/** 暴露给渲染进程的 API */
export interface ElectronAPI {
  // 文件系统
  fs: {
    openFileDialog: (options?: OpenFileDialogOptions) => Promise<string | string[] | null>
    saveFileDialog: (options?: SaveFileDialogOptions) => Promise<string | null>
    selectFolder: (defaultPath?: string) => Promise<string | null>
    readFile: (filePath: string, options?: ReadFileOptions) => Promise<string>
    writeFile: (filePath: string, content: string, options?: WriteFileOptions) => Promise<void>
    readDir: (dirPath: string, options?: ReadDirOptions) => Promise<DirTreeNode[]>
    getFileInfo: (filePath: string) => Promise<FileInfo>
    exists: (filePath: string) => Promise<boolean>
    copy: (src: string, dest: string) => Promise<void>
    move: (src: string, dest: string) => Promise<void>
    delete: (filePath: string, recursive?: boolean) => Promise<void>
    createDir: (dirPath: string, recursive?: boolean) => Promise<void>
    rename: (oldPath: string, newPath: string) => Promise<void>
    joinPath: (...paths: string[]) => Promise<string>
    basename: (filePath: string) => Promise<string>
    dirname: (filePath: string) => Promise<string>
  }
  // 工作区
  workspace: {
    getCurrent: () => Promise<WorkspaceConfig | null>
    select: () => Promise<WorkspaceConfig | null>
    set: (workspacePath: string, name?: string) => Promise<WorkspaceConfig>
    getRecent: () => Promise<WorkspaceConfig[]>
    clearRecent: () => Promise<void>
    openInExplorer: (path?: string) => Promise<void>
    verifyPermissions: () => Promise<
      | { ok: true; warnings: string[] }
      | { ok: false; code: string; message: string; details?: string }
    >
  }
  // 应用信息
  app: {
    isElectron: true
    version: string
    platform: string
    getBackendStatus: () => Promise<{ running: boolean; url: string }>
    restartBackend: () => Promise<boolean>
  }
}

declare global {
  interface Window {
    electron?: ElectronAPI
  }
}
