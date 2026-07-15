/**
 * SQLiteStore — 看板持久化存储。
 *
 * 基于 better-sqlite3 同步 API。
 * WAL 模式提升并发读写性能。
 */

import Database from 'better-sqlite3'
import type { Dashboard, DashboardSummary } from '../types/shared'

export class SQLiteStore {
  private db: Database.Database

  constructor(dbPath: string) {
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        goal TEXT NOT NULL,
        dataset_id TEXT,
        report TEXT NOT NULL,
        charts TEXT NOT NULL,
        steps TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)
  }

  saveDashboard(d: Dashboard): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO dashboards
        (id, title, goal, dataset_id, report, charts, steps, created_at, updated_at)
      VALUES
        (@id, @title, @goal, @datasetId, @report, @charts, @steps, @createdAt, @updatedAt)
    `)
    stmt.run({
      id: d.id,
      title: d.title,
      goal: d.goal,
      datasetId: d.datasetId ?? null,
      report: d.report,
      charts: JSON.stringify(d.charts),
      steps: JSON.stringify(d.steps),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    })
  }

  getDashboard(id: string): Dashboard | null {
    const row = this.db
      .prepare('SELECT * FROM dashboards WHERE id = ?')
      .get(id) as DashboardRow | undefined

    if (!row) return null

    return {
      id: row.id,
      title: row.title,
      goal: row.goal,
      datasetId: row.dataset_id ?? undefined,
      report: row.report,
      charts: JSON.parse(row.charts),
      steps: JSON.parse(row.steps),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  listDashboards(): DashboardSummary[] {
    const rows = this.db
      .prepare('SELECT id, title, dataset_id, created_at FROM dashboards ORDER BY created_at DESC')
      .all() as DashboardSummaryRow[]

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      datasetId: row.dataset_id ?? undefined,
      createdAt: row.created_at
    }))
  }

  deleteDashboard(id: string): void {
    this.db.prepare('DELETE FROM dashboards WHERE id = ?').run(id)
  }

  close(): void {
    this.db.close()
  }

  /** 暴露底层 db 实例，供 API Server 使用 */
  getDB(): Database.Database {
    return this.db
  }
}

interface DashboardRow {
  id: string
  title: string
  goal: string
  dataset_id: string | null
  report: string
  charts: string
  steps: string
  created_at: string
  updated_at: string
}

interface DashboardSummaryRow {
  id: string
  title: string
  dataset_id: string | null
  created_at: string
}
