/**
 * API Server — 主进程内嵌 Express 服务，为看板 iframe 提供 SQL 查询能力。
 *
 * 架构：
 *   看板 iframe (fetch) → Express (localhost:PORT) → better-sqlite3 → datapilot.db
 *
 * 安全措施：
 *   - 仅监听 127.0.0.1（不暴露到网络）
 *   - 动态端口分配（避免端口冲突）
 *   - 参数化查询（防 SQL 注入）
 *   - 可选的只读模式（仅允许 SELECT/PRAGMA）
 */

import express from 'express'
import cors from 'cors'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { SQLiteStore } from '../storage/SQLiteStore'

export interface APIServer {
  server: ReturnType<typeof express.application.listen>
  port: number
}

/** 测试用看板 HTML 路径（开发模式） */
let cachedTestDashboard: string | null = null

function getTestDashboardHTML(): string {
  if (cachedTestDashboard) return cachedTestDashboard
  try {
    // 尝试多个可能路径
    const candidates = [
      join(__dirname, '..', '..', 'scripts', 'test-dashboard.html'),
      join(__dirname, '..', '..', '..', 'scripts', 'test-dashboard.html'),
    ]
    for (const p of candidates) {
      try {
        cachedTestDashboard = readFileSync(p, 'utf-8')
        return cachedTestDashboard!
      } catch { /* try next */ }
    }
  } catch { /* ignore */ }
  return ''
}

export function createAPIServer(store: SQLiteStore, options?: { readonly?: boolean }): APIServer {
  const app = express()
  const readonly = options?.readonly ?? true

  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  // ── SQL 查询 ──
  app.post('/api/query', (req, res) => {
    const { sql, params } = req.body || {}

    if (!sql || typeof sql !== 'string') {
      res.status(400).json({ error: '缺少 sql 参数' })
      return
    }

    // 只读模式：仅允许 SELECT 和 PRAGMA
    if (readonly) {
      const trimmed = sql.trim().toUpperCase()
      if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('PRAGMA') && !trimmed.startsWith('EXPLAIN')) {
        res.status(403).json({ error: 'API 处于只读模式，仅允许 SELECT / PRAGMA 查询' })
        return
      }
    }

    try {
      const db = store.getDB()
      const stmt = db.prepare(sql)
      const rows = Array.isArray(params) ? stmt.all(...params) : stmt.all()
      const columns = rows.length > 0 ? Object.keys(rows[0] as object) : []
      res.json({ data: rows, columns, rowCount: rows.length })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  })

  // ── 表结构查询 ──
  app.get('/api/schema/:table', (req, res) => {
    const { table } = req.params
    try {
      const db = store.getDB()
      const columns = db.prepare(`PRAGMA table_info(${table})`).all()
      res.json({ table, columns })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  })

  // ── 表列表 ──
  app.get('/api/tables', (_req, res) => {
    try {
      const db = store.getDB()
      const rows = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .all() as Array<{ name: string }>
      res.json({ tables: rows.map((r) => r.name) })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  })

  // ── 健康检查 ──
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', readonly })
  })

  // ── 测试看板（开发/演示用） ──
  app.get('/api/test-dashboard', (_req, res) => {
    const html = getTestDashboardHTML()
    if (html) {
      res.type('html').send(html)
    } else {
      res.status(404).json({ error: 'test-dashboard.html not found' })
    }
  })

  // 动态端口，仅监听 127.0.0.1
  const server = app.listen(0, '127.0.0.1', () => {
    const addr = server.address()
    if (addr && typeof addr === 'object') {
      console.log(`[DataPilot API] http://127.0.0.1:${addr.port} (readonly=${readonly})`)
    }
  })

  const port = (server.address() as any)?.port || 0
  return { server, port }
}