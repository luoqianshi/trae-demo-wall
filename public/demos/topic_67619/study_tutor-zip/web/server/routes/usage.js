const express = require('express')
const router = express.Router()
const { findById } = require('../lib/cache')

/**
 * Web 演示版的内存存储：
 * - users:    Map<userId, { plan, dailyUsed, dailyResetAt }>
 * - usageLog: [{ userId, questionId, ts, tokensUsed, costYuan, cacheHit, provider }]
 * - mistakes: [{ _id, userId, questionId, status, addedAt }]
 * - feedback: [{ userId, questionId, reportedWrong, ts }]
 *
 * 重启即清空，仅用于演示。
 */
const store = {
  users: new Map(),
  usageLog: [],
  mistakes: [],
  feedback: []
}
let mistakeSeq = 0

function getStore() {
  return store
}

const FREE_DAILY_LIMIT = 100 // 演示版放宽，与 W1 dogfood 一致

function todayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date())
}

function getUser(userId) {
  if (!store.users.has(userId)) {
    store.users.set(userId, {
      userId,
      plan: 'free',
      dailyUsed: 0,
      dailyResetAt: todayKey()
    })
  }
  const u = store.users.get(userId)
  if (u.dailyResetAt !== todayKey()) {
    u.dailyUsed = 0
    u.dailyResetAt = todayKey()
  }
  return u
}

function userIdOf(req) {
  return req.headers['x-user-id'] || 'demo-user'
}

// GET /api/usage/check — 配额查询
router.get('/check', (req, res) => {
  const u = getUser(userIdOf(req))
  res.json({
    ok: true,
    plan: u.plan,
    dailyUsed: u.dailyUsed,
    dailyLimit: u.plan === 'pro' ? null : FREE_DAILY_LIMIT,
    remaining: u.plan === 'pro' ? Infinity : Math.max(0, FREE_DAILY_LIMIT - u.dailyUsed)
  })
})

// POST /api/usage/increment — 扣减配额
router.post('/increment', (req, res) => {
  const u = getUser(userIdOf(req))
  if (u.plan !== 'pro' && u.dailyUsed >= FREE_DAILY_LIMIT) {
    return res.status(403).json({ ok: false, error: 'quota exceeded' })
  }
  u.dailyUsed += 1
  res.json({
    ok: true,
    dailyUsed: u.dailyUsed,
    remaining: u.plan === 'pro' ? Infinity : Math.max(0, FREE_DAILY_LIMIT - u.dailyUsed)
  })
})

// POST /api/usage/feedback — 答案对错反馈
router.post('/feedback', (req, res) => {
  const { questionId, correct } = req.body || {}
  if (!questionId) return res.status(400).json({ ok: false, error: 'questionId required' })
  store.feedback.push({
    userId: userIdOf(req),
    questionId,
    reportedWrong: !correct,
    ts: new Date()
  })
  res.json({ ok: true })
})

// GET /api/usage/mistakes — 错题本列表（带题目详情）
router.get('/mistakes', async (req, res) => {
  const userId = userIdOf(req)
  const items = store.mistakes.filter(m => m.userId === userId)
  const enriched = await Promise.all(items.map(async m => {
    const q = await findById(m.questionId)
    return { ...m, question: q }
  }))
  res.json({ ok: true, items: enriched })
})

// POST /api/usage/mistakes — 加入错题本
router.post('/mistakes', (req, res) => {
  const { questionId } = req.body || {}
  if (!questionId) return res.status(400).json({ ok: false, error: 'questionId required' })
  const userId = userIdOf(req)
  const exists = store.mistakes.some(m => m.userId === userId && m.questionId === questionId)
  if (exists) return res.json({ ok: true, duplicated: true })
  store.mistakes.push({
    _id: `m_${++mistakeSeq}`,
    userId,
    questionId,
    status: 'new',
    addedAt: new Date()
  })
  res.json({ ok: true })
})

// GET /api/usage/stats — 演示用统计（截图素材）
router.get('/stats', (req, res) => {
  const userId = userIdOf(req)
  const userLogs = store.usageLog.filter(l => l.userId === userId)
  const totalCalls = userLogs.length
  const cacheHits = userLogs.filter(l => l.cacheHit).length
  const totalCost = userLogs.reduce((s, l) => s + (l.costYuan || 0), 0)
  const totalTokens = userLogs.reduce((s, l) => s + (l.tokensUsed || 0), 0)
  res.json({
    ok: true,
    totalCalls,
    cacheHits,
    cacheHitRate: totalCalls > 0 ? cacheHits / totalCalls : 0,
    totalCostYuan: Number(totalCost.toFixed(4)),
    totalTokens,
    mistakeCount: store.mistakes.filter(m => m.userId === userId).length,
    feedbackCount: store.feedback.filter(f => f.userId === userId).length
  })
})

module.exports = router
module.exports.getStore = getStore
