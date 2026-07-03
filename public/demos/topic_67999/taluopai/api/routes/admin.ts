import { Router, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import { getDb } from '../database.js'
import type { Card, DrawingCard } from '../../shared/types.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'tarot-secret-key'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

interface JwtPayload {
  role: string
  iat?: number
  exp?: number
}

/**
 * Auth middleware
 */
function authMiddleware(req: Request, res: Response, next: () => void): void {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: '未授权访问' })
      return
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    if (decoded.role !== 'admin') {
      res.status(403).json({ success: false, error: '权限不足' })
      return
    }

    next()
  } catch {
    res.status(401).json({ success: false, error: 'Token无效或已过期' })
  }
}

/**
 * POST /api/admin/login - login with password
 * Body: { password: string }
 */
router.post('/login', (req: Request, res: Response): void => {
  try {
    const { password } = req.body as { password: string }

    if (!password) {
      res.status(400).json({ success: false, error: '请输入密码' })
      return
    }

    if (password !== ADMIN_PASSWORD) {
      res.status(401).json({ success: false, error: '密码错误' })
      return
    }

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' })

    res.json({ success: true, data: { token } })
  } catch (error) {
    console.error('Error logging in:', error)
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

/**
 * POST /api/admin/verify - verify JWT token
 */
router.post('/verify', (req: Request, res: Response): void => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: '未授权访问' })
      return
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload

    if (decoded.role !== 'admin') {
      res.status(403).json({ success: false, error: '权限不足' })
      return
    }

    res.json({ success: true, data: { valid: true } })
  } catch {
    res.status(401).json({ success: false, error: 'Token无效或已过期' })
  }
})

/**
 * GET /api/admin/records - get all drawings with pagination and date filtering
 * Query: page, pageSize, startDate, endDate, spreadType
 */
router.get('/records', authMiddleware, (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20))
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined
    const spreadType = req.query.spreadType as string | undefined

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (startDate) {
      whereClause += ' AND d.createdAt >= ?'
      params.push(startDate)
    }
    if (endDate) {
      whereClause += ' AND d.createdAt <= ?'
      params.push(endDate)
    }
    if (spreadType) {
      whereClause += ' AND d.spreadType = ?'
      params.push(spreadType)
    }

    // Count total
    const countResult = db.prepare(
      `SELECT COUNT(*) as total FROM drawings d ${whereClause}`
    ).get(...params) as { total: number }

    const total = countResult.total
    const offset = (page - 1) * pageSize

    // Get drawings
    const drawings = db.prepare(
      `SELECT d.* FROM drawings d ${whereClause} ORDER BY d.createdAt DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset) as Array<{
      id: number; spreadType: string; sessionId: string; createdAt: string;
    }>

    // Get drawing cards for each drawing
    const results = drawings.map(drawing => {
      const cards = db.prepare(
        `SELECT dc.*, c.name, c.nameEn, c.type, c.suit, c.number, c.keywords, c.meaningUpright, c.meaningReversed, c.element, c.zodiac, c.description
         FROM drawing_cards dc
         JOIN cards c ON dc.cardId = c.id
         WHERE dc.drawingId = ?
         ORDER BY dc.position`
      ).all(drawing.id) as Array<DrawingCard & Card>

      return {
        ...drawing,
        cards,
      }
    })

    res.json({
      success: true,
      data: {
        records: results,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching records:', error)
    res.status(500).json({ success: false, error: '获取记录失败' })
  }
})

/**
 * GET /api/admin/statistics - get statistics
 */
router.get('/statistics', authMiddleware, (req: Request, res: Response): void => {
  try {
    const db = getDb()

    // Total drawings
    const totalDrawings = (db.prepare('SELECT COUNT(*) as count FROM drawings').get() as { count: number }).count

    // Card frequency (top 20)
    const cardFrequency = db.prepare(
      `SELECT c.id, c.name, c.nameEn, c.type, c.suit, COUNT(dc.id) as count
       FROM drawing_cards dc
       JOIN cards c ON dc.cardId = c.id
       GROUP BY c.id
       ORDER BY count DESC
       LIMIT 20`
    ).all()

    // Spread distribution
    const spreadDistribution = db.prepare(
      `SELECT spreadType, COUNT(*) as count
       FROM drawings
       GROUP BY spreadType
       ORDER BY count DESC`
    ).all()

    // Daily counts (last 30 days)
    const dailyCounts = db.prepare(
      `SELECT date(createdAt) as date, COUNT(*) as count
       FROM drawings
       WHERE createdAt >= datetime('now', '-30 days')
       GROUP BY date(createdAt)
       ORDER BY date ASC`
    ).all()

    // Reversed ratio
    const reversedRatio = db.prepare(
      `SELECT
        COUNT(CASE WHEN isReversed = 1 THEN 1 END) as reversed,
        COUNT(*) as total
       FROM drawing_cards`
    ).get() as { reversed: number; total: number }

    res.json({
      success: true,
      data: {
        totalDrawings,
        cardFrequency,
        spreadDistribution,
        dailyCounts,
        reversedRatio: {
          reversed: reversedRatio.reversed,
          total: reversedRatio.total,
          ratio: reversedRatio.total > 0
            ? Math.round((reversedRatio.reversed / reversedRatio.total) * 100)
            : 0,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    res.status(500).json({ success: false, error: '获取统计数据失败' })
  }
})

/**
 * GET /api/admin/export - export all records as CSV
 */
router.get('/export', authMiddleware, (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const records = db.prepare(
      `SELECT d.id as drawingId, d.spreadType, d.sessionId, d.createdAt,
              dc.position, dc.isReversed,
              c.name, c.nameEn, c.type, c.suit, c.number, c.keywords
       FROM drawings d
       JOIN drawing_cards dc ON dc.drawingId = d.id
       JOIN cards c ON dc.cardId = c.id
       ORDER BY d.createdAt DESC, dc.position ASC`
    ).all() as Array<Record<string, string | number>>

    if (records.length === 0) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="tarot-records.csv"')
      res.send('drawingId,spreadType,sessionId,createdAt,position,isReversed,cardName,cardNameEn,cardType,cardSuit,cardNumber,cardKeywords\n')
      return
    }

    const headers = Object.keys(records[0])
    const csvRows = [
      headers.join(','),
      ...records.map(row =>
        headers.map(h => {
          const val = row[h]
          if (val === null || val === undefined) return ''
          const str = String(val)
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }).join(',')
      ),
    ]

    const csv = csvRows.join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="tarot-records.csv"')
    res.send(csv)
  } catch (error) {
    console.error('Error exporting records:', error)
    res.status(500).json({ success: false, error: '导出记录失败' })
  }
})

export default router