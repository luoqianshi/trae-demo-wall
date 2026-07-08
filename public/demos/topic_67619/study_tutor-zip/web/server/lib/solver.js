const { buildMessages } = require('./prompt-builder')
const { parseSolution, validateSolutionShape } = require('./response-parser')
const { verifyAgainstExpected } = require('./math-verifier')
const { checkContent } = require('./content-safety')
const { computeHash, findByHash, saveQuestion } = require('./cache')
const { callLLM } = require('./llm-provider')
const { callLLMMock } = require('./llm-mock')

/**
 * 选择 LLM 后端：
 * - LLM_MODE=zhipu 且 ZHIPU_API_KEY 存在 → 真实智谱
 * - 否则 → mock
 */
function pickLLM() {
  const mode = (process.env.LLM_MODE || 'mock').toLowerCase()
  const hasKey = !!process.env.ZHIPU_API_KEY
  if (mode === 'zhipu' && hasKey) {
    return { call: callLLM, provider: 'zhipu' }
  }
  if (mode === 'zhipu' && !hasKey) {
    console.warn('[solver] LLM_MODE=zhipu 但未设 ZHIPU_API_KEY，降级到 mock')
  }
  return { call: callLLMMock, provider: 'mock' }
}

/**
 * 编排：内容安全 → 缓存查 → LLM → 解析 → 数学验证 → 缓存写
 * 与 cloudfunctions/fn-solve/index.js 流程一致，去掉云开发依赖。
 *
 * @param {object} params
 * @param {string} params.cleanedText 学生修正后的干净题面
 * @param {string} [params.rawText]   OCR 原始识别
 * @param {string} [params.imageUrl]  图片 URL（Web 演示版可空）
 * @returns {Promise<object>} { ok, questionId, solution, cacheHit, provider, tokensUsed, costYuan, verifyHint }
 */
async function solve(params) {
  const { cleanedText, rawText = '', imageUrl = '' } = params
  if (!cleanedText || !cleanedText.trim()) {
    return { ok: false, error: 'cleanedText is required' }
  }

  // Step 1: 内容安全
  const safety = await checkContent(cleanedText)
  if (!safety.ok) {
    return { ok: false, error: 'content safety rejected', reason: safety.reason }
  }

  // Step 2: 查缓存
  const hash = computeHash(cleanedText)
  const cached = await findByHash(null, hash)
  if (cached) {
    return {
      ok: true,
      questionId: cached._id,
      solution: cached.solution,
      cacheHit: true,
      provider: 'cache',
      tokensUsed: 0,
      costYuan: 0
    }
  }

  // Step 3: 调 LLM
  const llm = pickLLM()
  const messages = buildMessages(cleanedText)
  let llmResp
  try {
    llmResp = await llm.call(messages)
  } catch (err) {
    return { ok: false, error: `LLM call failed: ${err.message}` }
  }

  // Step 4: 解析
  const solution = parseSolution(llmResp.content)
  if (!solution) {
    return { ok: false, error: 'failed to parse LLM output as JSON' }
  }
  const shapeErrors = validateSolutionShape(solution)
  if (shapeErrors.length > 0) {
    console.warn('[solver] shape validation errors', shapeErrors)
  }

  // Step 5: 数学验证（W1 仅日志，不阻断）
  const verifyResult = verifyAgainstExpected(solution.final_answer, [])
  console.log('[solver] math verify', verifyResult)

  // Step 6: 写缓存
  const questionId = await saveQuestion(null, {
    hash,
    rawText,
    cleanedText,
    imageUrl,
    solution
  })

  // Step 7: 成本估算（与云函数一致：1k token ≈ ¥0.002）
  const tokensUsed = (llmResp.usage && llmResp.usage.total_tokens) || 2500
  const costYuan = tokensUsed / 1000 * 0.002

  return {
    ok: true,
    questionId,
    solution,
    cacheHit: false,
    provider: llm.provider,
    tokensUsed,
    costYuan,
    verifyHint: verifyResult
  }
}

module.exports = { solve, pickLLM }
