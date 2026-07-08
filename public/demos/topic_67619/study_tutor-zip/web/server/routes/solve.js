const express = require('express')
const router = express.Router()
const { solve } = require('../lib/solver')
const { getStore } = require('./usage')

/**
 * POST /api/solve
 * body: { cleanedText, rawText?, imageUrl? }
 * 返回: { ok, questionId, solution, cacheHit, provider }
 */
router.post('/', async (req, res) => {
  const { cleanedText, rawText, imageUrl } = req.body || {}
  const userId = req.headers['x-user-id'] || 'demo-user'

  const result = await solve({ cleanedText, rawText, imageUrl })
  if (!result.ok) {
    return res.status(400).json(result)
  }

  // 写一条 usage_log（与云函数行为一致）
  const store = getStore()
  store.usageLog.push({
    userId,
    questionId: result.questionId,
    ts: new Date(),
    tokensUsed: result.tokensUsed,
    costYuan: result.costYuan,
    cacheHit: result.cacheHit,
    provider: result.provider
  })

  res.json(result)
})

module.exports = router
