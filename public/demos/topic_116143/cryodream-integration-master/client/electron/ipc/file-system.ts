// 文件系统 IPC handlers
import { ipcMain, dialog, shell } from 'electron'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import type { FileInfo, DirTreeNode } from '../types'

/** 获取文件信息 */
async function getFileInfo(filePath: string): Promise<FileInfo> {
  const stat = await fsp.stat(filePath)
  const ext = path.extname(filePath)
  return {
    name: path.basename(filePath),
    path: filePath,
    size: stat.size,
    isDirectory: stat.isDirectory(),
    extension: ext,
    modifiedTime: stat.mtime.getTime(),
    createdTime: stat.birthtime.getTime(),
  }
}

/** 递归读取目录 */
async function readDirRecursive(
  dirPath: string,
  maxDepth: number,
  currentDepth: number,
  includeHidden: boolean
): Promise<DirTreeNode[]> {
  if (currentDepth >= maxDepth) return []
  const entries = await fsp.readdir(dirPath, { withFileTypes: true })
  const nodes: DirTreeNode[] = []

  for (const entry of entries) {
    if (!includeHidden && entry.name.startsWith('.')) continue

    const fullPath = path.join(dirPath, entry.name)
    const stat = await fsp.stat(fullPath)
    const node: DirTreeNode = {
      name: entry.name,
      path: fullPath,
      isDirectory: entry.isDirectory(),
      size: stat.size,
      extension: entry.isFile() ? path.extname(entry.name) : '',
      modifiedTime: stat.mtime.getTime(),
    }

    if (entry.isDirectory()) {
      node.children = await readDirRecursive(
        fullPath,
        maxDepth,
        currentDepth + 1,
        includeHidden
      )
    }
    nodes.push(node)
  }
  return nodes
}

/** 注册文件系统 IPC handlers */
export function registerFileSystemIPC(): void {
  // 打开文件对话框
  ipcMain.handle('fs:openFileDialog', async (_event, options) => {
    const opts = options || {}
    const result = await dialog.showOpenDialog({
      title: opts.title || '选择文件',
      defaultPath: opts.defaultPath,
      filters: opts.filters || [
        { name: '所有文件', extensions: ['*'] },
        { name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] },
        { name: '视频', extensions: ['mp4', 'webm', 'avi', 'mov'] },
        { name: '音频', extensions: ['mp3', 'wav', 'flac', 'ogg'] },
        { name: '文档', extensions: ['txt', 'md', 'json', 'yaml', 'yml'] },
      ],
      properties: opts.multiple ? ['openFile', 'multiSelections'] : ['openFile'],
    })

    if (result.canceled) return null
    return opts.multiple ? result.filePaths : result.filePaths[0]
  })

  // 保存文件对话框
  ipcMain.handle('fs:saveFileDialog', async (_event, options) => {
    const opts = options || {}
    const result = await dialog.showSaveDialog({
      title: opts.title || '保存文件',
      defaultPath: opts.defaultPath,
      filters: opts.filters || [
        { name: '所有文件', extensions: ['*'] },
        { name: '图片', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
        { name: 'JSON', extensions: ['json'] },
        { name: '文本', extensions: ['txt', 'md'] },
      ],
    })

    if (result.canceled) return null
    return result.filePath
  })

  // 选择文件夹
  ipcMain.handle('fs:selectFolder', async (_event, defaultPath) => {
    const result = await dialog.showOpenDialog({
      title: '选择文件夹',
      defaultPath,
      properties: ['openDirectory'],
    })

    if (result.canceled) return null
    return result.filePaths[0]
  })

  // 读取文件
  ipcMain.handle('fs:readFile', async (_event, filePath, options) => {
    const opts = options || {}
    const encoding = opts.encoding || 'utf-8'

    if (encoding === 'buffer') {
      const buffer = await fsp.readFile(filePath)
      return buffer.toString('base64')
    }

    return await fsp.readFile(filePath, encoding as BufferEncoding)
  })

  // 写入文件
  ipcMain.handle('fs:writeFile', async (_event, filePath, content, options) => {
    const opts = options || {}
    const encoding = opts.encoding || 'utf-8'

    if (opts.createParentDirs) {
      const dir = path.dirname(filePath)
      await fsp.mkdir(dir, { recursive: true })
    }

    if (encoding === 'base64') {
      const buffer = Buffer.from(content, 'base64')
      await fsp.writeFile(filePath, buffer)
    } else {
      await fsp.writeFile(filePath, content, encoding as BufferEncoding)
    }
  })

  // 遍历目录
  ipcMain.handle('fs:readDir', async (_event, dirPath, options) => {
    const opts = options || {}
    const recursive = opts.recursive !== false
    const maxDepth = opts.maxDepth || 5
    const includeHidden = opts.includeHidden || false

    if (recursive) {
      return await readDirRecursive(dirPath, maxDepth, 0, includeHidden)
    }

    const entries = await fsp.readdir(dirPath, { withFileTypes: true })
    const nodes: DirTreeNode[] = []
    for (const entry of entries) {
      if (!includeHidden && entry.name.startsWith('.')) continue
      const fullPath = path.join(dirPath, entry.name)
      const stat = await fsp.stat(fullPath)
      nodes.push({
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory(),
        size: stat.size,
        extension: entry.isFile() ? path.extname(entry.name) : '',
        modifiedTime: stat.mtime.getTime(),
      })
    }
    return nodes
  })

  // 获取文件信息
  ipcMain.handle('fs:getFileInfo', async (_event, filePath) => {
    return await getFileInfo(filePath)
  })

  // 判断文件是否存在
  ipcMain.handle('fs:exists', async (_event, filePath) => {
    try {
      await fsp.access(filePath)
      return true
    } catch {
      return false
    }
  })

  // 复制文件/目录
  ipcMain.handle('fs:copy', async (_event, src, dest) => {
    const stat = await fsp.stat(src)
    if (stat.isDirectory()) {
      await copyDirRecursive(src, dest)
    } else {
      const destDir = path.dirname(dest)
      await fsp.mkdir(destDir, { recursive: true })
      await fsp.copyFile(src, dest)
    }
  })

  // 移动文件/目录
  ipcMain.handle('fs:move', async (_event, src, dest) => {
    const destDir = path.dirname(dest)
    await fsp.mkdir(destDir, { recursive: true })
    await fsp.rename(src, dest)
  })

  // 删除文件/目录
  ipcMain.handle('fs:delete', async (_event, filePath, recursive) => {
    const stat = await fsp.stat(filePath)
    if (stat.isDirectory() && recursive) {
      await fsp.rm(filePath, { recursive: true, force: true })
    } else if (stat.isDirectory()) {
      await fsp.rmdir(filePath)
    } else {
      await fsp.unlink(filePath)
    }
  })

  // 创建目录
  ipcMain.handle('fs:createDir', async (_event, dirPath, recursive) => {
    await fsp.mkdir(dirPath, { recursive: recursive !== false })
  })

  // 重命名
  ipcMain.handle('fs:rename', async (_event, oldPath, newPath) => {
    await fsp.rename(oldPath, newPath)
  })

  // 路径拼接
  ipcMain.handle('fs:joinPath', async (_event, paths) => {
    return path.join(...paths)
  })

  // 获取文件名
  ipcMain.handle('fs:basename', async (_event, filePath) => {
    return path.basename(filePath)
  })

  // 获取目录名
  ipcMain.handle('fs:dirname', async (_event, filePath) => {
    return path.dirname(filePath)
  })
}

/** 递归复制目录 */
async function copyDirRecursive(src: string, dest: string): Promise<void> {
  await fsp.mkdir(dest, { recursive: true })
  const entries = await fsp.readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath)
    } else {
      await fsp.copyFile(srcPath, destPath)
    }
  }
}
