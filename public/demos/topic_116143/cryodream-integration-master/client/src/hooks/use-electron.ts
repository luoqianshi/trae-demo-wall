// Electron 环境 React Hook
import { useState, useEffect, useCallback } from 'react'
import { isElectron, getElectronAPI } from '@/lib/electron'
import type { WorkspaceConfig } from '../../electron/types'

/** Electron 环境检测 hook */
export function useElectron() {
  const [electronReady, setElectronReady] = useState(false)

  useEffect(() => {
    setElectronReady(isElectron())
  }, [])

  return {
    isElectron: electronReady,
    api: getElectronAPI(),
  }
}

/** 文件系统 hook */
export function useFileSystem() {
  const { isElectron: ready } = useElectron()

  const openFileDialog = useCallback(
    async (options?: Parameters<NonNullable<Window['electron']>['fs']['openFileDialog']>[0]) => {
      if (!ready) return null
      return await window.electron!.fs.openFileDialog(options)
    },
    [ready]
  )

  const saveFileDialog = useCallback(
    async (options?: Parameters<NonNullable<Window['electron']>['fs']['saveFileDialog']>[0]) => {
      if (!ready) return null
      return await window.electron!.fs.saveFileDialog(options)
    },
    [ready]
  )

  const selectFolder = useCallback(async () => {
    if (!ready) return null
    return await window.electron!.fs.selectFolder()
  }, [ready])

  const readFile = useCallback(
    async (filePath: string, options?: { encoding?: 'utf-8' | 'base64' | 'buffer' }) => {
      if (!ready) return null
      return await window.electron!.fs.readFile(filePath, options)
    },
    [ready]
  )

  const writeFile = useCallback(
    async (
      filePath: string,
      content: string,
      options?: { encoding?: 'utf-8' | 'base64'; createParentDirs?: boolean }
    ) => {
      if (!ready) return
      await window.electron!.fs.writeFile(filePath, content, options)
    },
    [ready]
  )

  const readDir = useCallback(
    async (dirPath: string, options?: { recursive?: boolean; maxDepth?: number }) => {
      if (!ready) return []
      return await window.electron!.fs.readDir(dirPath, options)
    },
    [ready]
  )

  const exists = useCallback(
    async (filePath: string) => {
      if (!ready) return false
      return await window.electron!.fs.exists(filePath)
    },
    [ready]
  )

  const deleteFile = useCallback(
    async (filePath: string, recursive?: boolean) => {
      if (!ready) return
      await window.electron!.fs.delete(filePath, recursive)
    },
    [ready]
  )

  return {
    ready,
    openFileDialog,
    saveFileDialog,
    selectFolder,
    readFile,
    writeFile,
    readDir,
    exists,
    deleteFile,
  }
}

/** 工作区 hook */
export function useWorkspace() {
  const { isElectron: ready } = useElectron()
  const [current, setCurrent] = useState<WorkspaceConfig | null>(null)
  const [recent, setRecent] = useState<WorkspaceConfig[]>([])

  const refresh = useCallback(async () => {
    if (!ready) return
    const [cur, rec] = await Promise.all([
      window.electron!.workspace.getCurrent(),
      window.electron!.workspace.getRecent(),
    ])
    setCurrent(cur)
    setRecent(rec)
  }, [ready])

  useEffect(() => {
    refresh()
  }, [refresh])

  const select = useCallback(async () => {
    if (!ready) return null
    const ws = await window.electron!.workspace.select()
    if (ws) {
      await refresh()
    }
    return ws
  }, [ready, refresh])

  const openInExplorer = useCallback(async () => {
    if (!ready) return
    await window.electron!.workspace.openInExplorer()
  }, [ready])

  return {
    ready,
    current,
    recent,
    select,
    refresh,
    openInExplorer,
  }
}
