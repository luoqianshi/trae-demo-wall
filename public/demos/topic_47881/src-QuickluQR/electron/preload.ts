import { contextBridge, ipcRenderer } from 'electron'
import type { HistoryItem } from './types.ts'

type HistoryAddItem = Omit<HistoryItem, 'id' | 'createdAt'>

contextBridge.exposeInMainWorld('electronAPI', {
  historyLoad: () => ipcRenderer.invoke('history:load') as Promise<HistoryItem[]>,
  historyAdd: (item: HistoryAddItem) => ipcRenderer.invoke('history:add', item) as Promise<HistoryItem[]>,
  historyDelete: (id: string) => ipcRenderer.invoke('history:delete', id) as Promise<HistoryItem[]>,
  historyClear: () => ipcRenderer.invoke('history:clear') as Promise<HistoryItem[]>,
  winMinimize: () => ipcRenderer.invoke('win:minimize'),
  winMaximize: () => ipcRenderer.invoke('win:maximize'),
  winClose: () => ipcRenderer.invoke('win:close'),
  winIsMaximized: () => ipcRenderer.invoke('win:isMaximized') as Promise<boolean>,
})

export type ElectronAPI = {
  historyLoad: () => Promise<HistoryItem[]>
  historyAdd: (item: HistoryAddItem) => Promise<HistoryItem[]>
  historyDelete: (id: string) => Promise<HistoryItem[]>
  historyClear: () => Promise<HistoryItem[]>
  winMinimize: () => Promise<void>
  winMaximize: () => Promise<void>
  winClose: () => Promise<void>
  winIsMaximized: () => Promise<boolean>
}
