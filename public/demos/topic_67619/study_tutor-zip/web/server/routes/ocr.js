const express = require('express')
const router = express.Router()

/**
 * POST /api/ocr
 * Web 演示版 mock：不真调腾讯云 OCR，直接回预置结构化结果。
 * 前端可以选择不调此接口（直接在 edit 页录入题面）。
 * body: { image? } （演示版忽略图片内容）
 */
router.post('/', async (req, res) => {
  // 模拟 OCR 延时
  await new Promise(r => setTimeout(r, 500))

  res.json({
    ok: true,
    text: '已知 sin α = 3/5，α ∈ (0, π/2)，求 cos 2α。',
    latex: 'sin \\alpha = \\frac{3}{5}, \\alpha \\in (0, \\frac{\\pi}{2})',
    confidence: 0.85,
    segments: [
      { text: '已知 sin α = 3/5，', type: 'text', confidence: 0.96 },
      { text: 'α ∈ (0, π/2)，', type: 'formula', confidence: 0.62 },
      { text: '求 cos 2α。', type: 'text', confidence: 0.94 }
    ],
    mock: true
  })
})

module.exports = router
