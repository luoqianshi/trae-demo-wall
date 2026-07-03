import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import { getDb } from '../database.js'
import type { Card, Drawing, DrawingCard } from '../../shared/types.js'

const router = Router()

/**
 * GET /api/cards - list all cards
 */
router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const cards = db.prepare('SELECT * FROM cards ORDER BY type, suit, number').all() as Card[]
    res.json({ success: true, data: cards })
  } catch (error) {
    console.error('Error fetching cards:', error)
    res.status(500).json({ success: false, error: '获取卡牌列表失败' })
  }
})

/**
 * GET /api/cards/:id - get single card
 */
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id) as Card | undefined
    if (!card) {
      res.status(404).json({ success: false, error: '卡牌不存在' })
      return
    }
    res.json({ success: true, data: card })
  } catch (error) {
    console.error('Error fetching card:', error)
    res.status(500).json({ success: false, error: '获取卡牌详情失败' })
  }
})

/**
 * POST /api/cards/random - random draw
 * Body: { count: number, spreadType: string }
 */
router.post('/random', (req: Request, res: Response): void => {
  try {
    const { count, spreadType } = req.body as { count: number; spreadType: string }

    if (!count || count < 1 || count > 78) {
      res.status(400).json({ success: false, error: '抽牌数量必须在1到78之间' })
      return
    }

    const db = getDb()

    // Get all card IDs
    const allCards = db.prepare('SELECT id FROM cards').all() as { id: number }[]
    const cardIds = allCards.map(c => c.id)

    // Shuffle and pick random cards
    const shuffled = [...cardIds].sort(() => Math.random() - 0.5)
    const selectedIds = shuffled.slice(0, count)

    // Create drawing record
    const sessionId = crypto.randomUUID()
    const result = db.prepare(
      'INSERT INTO drawings (spreadType, sessionId) VALUES (?, ?)'
    ).run(spreadType || 'custom', sessionId)

    const drawingId = result.lastInsertRowid as number

    // Insert drawing cards
    const insertDrawingCard = db.prepare(
      'INSERT INTO drawing_cards (drawingId, cardId, position, isReversed) VALUES (?, ?, ?, ?)'
    )

    const drawingCards: DrawingCard[] = []

    const insertAll = db.transaction(() => {
      selectedIds.forEach((cardId, index) => {
        const isReversed = Math.random() > 0.5
        const result = insertDrawingCard.run(drawingId, cardId, index, isReversed ? 1 : 0)
        const drawingCardId = result.lastInsertRowid as number

        // Fetch card details
        const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId) as Card

        drawingCards.push({
          id: drawingCardId,
          cardId,
          position: index,
          isReversed,
          card,
        })
      })
    })

    insertAll()

    const drawing: Drawing = {
      id: drawingId,
      spreadType: spreadType || 'custom',
      sessionId,
      cards: drawingCards,
      createdAt: new Date().toISOString(),
    }

    res.json({ success: true, data: drawing })
  } catch (error) {
    console.error('Error drawing cards:', error)
    res.status(500).json({ success: false, error: '抽牌失败' })
  }
})

export default router