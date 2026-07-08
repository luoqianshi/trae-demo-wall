const cloud = require('wx-server-sdk')
const { buildMessages } = require('./prompt-builder')
const { callLLM } = require('./llm-provider')
const { parseSolution, validateSolutionShape, extractBoxedAnswers } = require('./response-parser')
const { verifyAgainstExpected } = require('./math-verifier')
const { checkContent } = require('./content-safety')
const { computeHash, findByHash, saveQuestion } = require('./cache')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

async function writeUsageLog(db, openid, questionId, usage, costYuan, cacheHit) {
  await db.collection('usage_log').add({
    data: {
      openid: openid || '',
      questionId,
      ts: new Date(),
      tokensUsed: (usage && usage.total_tokens) || 0,
      costYuan,
      cacheHit
    }
  })
}

async function handle(event, context) {
  const { fileID, cleanedText, latexText, rawText } = event
  if (!cleanedText) {
    return { ok: false, error: 'cleanedText is required' }
  }

  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()

  // Step 2: 内容安全
  const safety = await checkContent(cleanedText)
  if (!safety.ok) {
    return { ok: false, error: 'content safety rejected', reason: safety.reason }
  }

  // Step 3: 查缓存
  const hash = computeHash(cleanedText)
  const cached = await findByHash(db, hash)
  if (cached) {
    await writeUsageLog(db, OPENID, cached._id, { total_tokens: 0 }, 0, true)
    return {
      ok: true,
      questionId: cached._id,
      solution: cached.solution,
      cacheHit: true
    }
  }

  // Step 4-5: 调 LLM
  const messages = buildMessages(cleanedText)
  let llmResp
  try {
    llmResp = await callLLM(messages)
  } catch (err) {
    return { ok: false, error: `LLM call failed: ${err.message}` }
  }

  // Step 6: 解析
  const solution = parseSolution(llmResp.content)
  if (!solution) {
    await writeUsageLog(db, OPENID, '', llmResp.usage, 0.01, false)
    return { ok: false, error: 'failed to parse LLM output as JSON' }
  }
  const shapeErrors = validateSolutionShape(solution)
  if (shapeErrors.length > 0) {
    console.warn('[solve] shape validation errors', shapeErrors)
  }

  // Step 7: math 验证（W1 仅日志）
  const expectedBoxed = []  // W1 没有独立 sympy 计算，留空；W3 接入
  const verifyResult = verifyAgainstExpected(solution.final_answer, expectedBoxed)
  console.log('[solve] math verify', verifyResult)

  // Step 8: 写缓存
  const questionId = await saveQuestion(db, {
    hash,
    rawText: rawText || '',
    cleanedText,
    latexText: latexText || '',
    imageUrl: fileID || '',
    solution
  })

  // Step 9: usage log（成本估算：1k input + 1.5k output token ≈ ¥0.005）
  const costYuan = ((llmResp.usage && llmResp.usage.total_tokens) || 2500) / 1000 * 0.002
  await writeUsageLog(db, OPENID, questionId, llmResp.usage, costYuan, false)

  return {
    ok: true,
    questionId,
    solution,
    cacheHit: false,
    verifyHint: verifyResult
  }
}

exports.main = handle
