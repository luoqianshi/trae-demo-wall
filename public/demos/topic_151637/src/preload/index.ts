import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../types/ipc'

/**
 * 预加载脚本 — 通过 contextBridge 安全暴露 API 到渲染进程。
 *
 * 所有 IPC 监听器返回清理函数，避免组件卸载后重复触发。
 */
const api = {
  agent: {
    run: (
      goal: string,
      datasetId?: string,
      llmConfig?: { apiKey?: string; baseURL?: string; model?: string },
      conversationHistory?: { role: 'user' | 'assistant'; content: string }[],
      priorState?: {
        sessionId: string
        datasetId?: string
        analysisResults?: unknown[]
        chartSpecs?: unknown[]
        researchFindings?: unknown[]
        report?: unknown
      },
      datasetPath?: string,
      styleId?: string,
      customStylePrompt?: string,
      apiPort?: number
    ) =>
      ipcRenderer.invoke(IPC.AGENT_RUN, {
        goal,
        datasetId,
        llmConfig,
        conversationHistory,
        priorState,
        datasetPath,
        styleId,
        customStylePrompt,
        apiPort
      }),
    cancel: () => ipcRenderer.invoke(IPC.AGENT_CANCEL),
    /** 删除会话时同步释放 sandbox（防止 Python 子进程泄漏） */
    stopSession: (sessionId: string) => ipcRenderer.invoke(IPC.SANDBOX_STOP, sessionId),
    onProgress: (callback: (event: unknown) => void) => {
      const handler = (_e: unknown, event: unknown) => callback(event)
      ipcRenderer.on(IPC.AGENT_PROGRESS, handler)
      return () => ipcRenderer.removeListener(IPC.AGENT_PROGRESS, handler as never)
    },
    onComplete: (callback: (result: unknown) => void) => {
      const handler = (_e: unknown, result: unknown) => callback(result)
      ipcRenderer.on(IPC.AGENT_COMPLETE, handler)
      return () => ipcRenderer.removeListener(IPC.AGENT_COMPLETE, handler as never)
    },
    onError: (callback: (error: { message: string }) => void) => {
      const handler = (_e: unknown, error: { message: string }) => callback(error)
      ipcRenderer.on(IPC.AGENT_ERROR, handler)
      return () => ipcRenderer.removeListener(IPC.AGENT_ERROR, handler as never)
    }
  },
  data: {
    listSamples: () => ipcRenderer.invoke(IPC.DATA_LIST_SAMPLES),
    loadSample: (id: string) => ipcRenderer.invoke(IPC.DATA_LOAD_SAMPLE, id),
    uploadFile: (filePath: string) => ipcRenderer.invoke(IPC.DATA_UPLOAD, filePath),
    uploadText: (text: string, name: string) =>
      ipcRenderer.invoke(IPC.DATA_UPLOAD_TEXT, { text, name }),
    preview: (datasetId: string) => ipcRenderer.invoke(IPC.DATA_PREVIEW, datasetId)
  },
  dialog: {
    openFile: () => ipcRenderer.invoke(IPC.DIALOG_OPEN_FILE)
  },
  storage: {
    listDashboards: () => ipcRenderer.invoke(IPC.STORAGE_LIST),
    getDashboard: (id: string) => ipcRenderer.invoke(IPC.STORAGE_GET, id),
    saveDashboard: (dashboard: unknown) =>
      ipcRenderer.invoke(IPC.STORAGE_SAVE, dashboard),
    deleteDashboard: (id: string) => ipcRenderer.invoke(IPC.STORAGE_DELETE, id)
  },
  /** 监听主进程发送的 API 端口 */
  onApiPort: (callback: (port: number) => void) => {
    const handler = (_e: unknown, port: number) => callback(port)
    ipcRenderer.on('api:port', handler as never)
    return () => ipcRenderer.removeListener('api:port', handler as never)
  }
}

contextBridge.exposeInMainWorld('datapilot', api)
