/**
 * Storage IPC — 看板 CRUD。
 *
 * 薄封装 SQLiteStore，对应 IPC 通道。
 */

import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { IPC } from '../../types/ipc'
import type { Dashboard, DashboardSummary } from '../../types/shared'
import { SQLiteStore } from '../../storage/SQLiteStore'

export function registerStorageIPC(store: SQLiteStore) {
  ipcMain.handle(
    IPC.STORAGE_LIST,
    async (): Promise<DashboardSummary[]> => {
      return store.listDashboards()
    }
  )

  ipcMain.handle(
    IPC.STORAGE_GET,
    async (_e, id: string): Promise<Dashboard | null> => {
      return store.getDashboard(id)
    }
  )

  ipcMain.handle(
    IPC.STORAGE_SAVE,
    async (_e, data: Partial<Dashboard> & { goal: string }): Promise<Dashboard> => {
      const now = new Date().toISOString()
      const dashboard: Dashboard = {
        id: data.id || randomUUID(),
        title: data.title || data.goal.slice(0, 50),
        goal: data.goal,
        datasetId: data.datasetId,
        report: data.report || '',
        charts: data.charts || [],
        steps: data.steps || [],
        createdAt: data.createdAt || now,
        updatedAt: now
      }
      store.saveDashboard(dashboard)
      return dashboard
    }
  )

  ipcMain.handle(
    IPC.STORAGE_DELETE,
    async (_e, id: string): Promise<void> => {
      store.deleteDashboard(id)
    }
  )
}
