export {}

import type { HistoryItem, HistoryAddItem } from './hooks/useHistory'

declare global {
  interface Window {
    electronAPI: {
      historyLoad: () => Promise<HistoryItem[]>
      historyAdd: (item: HistoryAddItem) => Promise<HistoryItem[]>
      historyDelete: (id: string) => Promise<HistoryItem[]>
      historyClear: () => Promise<HistoryItem[]>
      winMinimize: () => Promise<void>
      winMaximize: () => Promise<void>
      winClose: () => Promise<void>
      winIsMaximized: () => Promise<boolean>
    }
  }
}
