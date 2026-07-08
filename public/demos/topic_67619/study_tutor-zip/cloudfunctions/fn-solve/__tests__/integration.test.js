const path = require('path')
jest.mock('wx-server-sdk', () => {
  const db = {
    collection: jest.fn(() => ({
      where: jest.fn(() => ({ limit: jest.fn(() => ({ get: jest.fn(() => ({ data: [] })) })) })),
      add: jest.fn(() => ({ _id: 'q1' })),
      doc: jest.fn(() => ({ update: jest.fn(() => ({})) }))
    }))
  }
  return {
    init: jest.fn(),
    database: jest.fn(() => db),
    getWXContext: jest.fn(() => ({ OPENID: 'test-openid' })),
    DYNAMIC_CURRENT_ENV: 'test'
  }
})

jest.mock('../llm-provider', () => ({
  callLLM: jest.fn()
}))
jest.mock('../content-safety', () => ({
  checkContent: jest.fn(() => Promise.resolve({ ok: true, provider: 'stub' }))
}))

const { main } = require('../index')
const { callLLM } = require('../llm-provider')

describe('fn-solve integration', () => {
  beforeEach(() => callLLM.mockReset())

  test('returns error when cleanedText missing', async () => {
    const r = await main({ fileID: 'cloud://x' })
    expect(r.ok).toBe(false)
    expect(r.error).toContain('cleanedText')
  })

  test('returns cached solution on cache hit', async () => {
    // 注入命中缓存的 mock
    const sdk = require('wx-server-sdk')
    const origDb = sdk.database
    sdk.database = jest.fn(() => ({
      collection: jest.fn(() => ({
        where: jest.fn(() => ({ limit: jest.fn(() => ({
          get: jest.fn(() => ({
            data: [{
              _id: 'cached-q',
              cleanedText: 'cached',
              solution: { final_answer: '\\boxed{1}', confidence: 5 }
            }]
          })) })) })),
        add: jest.fn()
      }))
    }))

    const r = await main({ fileID: 'f', cleanedText: 'cached' })
    expect(r.ok).toBe(true)
    expect(r.cacheHit).toBe(true)
    expect(r.questionId).toBe('cached-q')
    expect(callLLM).not.toHaveBeenCalled()

    // 恢复原始 mock
    sdk.database = origDb
  })

  test('calls LLM on cache miss and writes cache', async () => {
    callLLM.mockResolvedValue({
      content: JSON.stringify({
        restatement: 'r',
        conditions: ['c'],
        goal: 'g',
        topic: '函数与导数',
        difficulty: '易',
        hint1: 'h1',
        hint2: 'h2',
        solution_steps: [{ step: 1, content: 'c', basis: 'b' }],
        final_answer: '\\boxed{1}',
        answer_type: 'numeric',
        confidence: 5,
        uncertain_part: ''
      }),
      usage: { total_tokens: 100 }
    })

    const r = await main({ fileID: 'f', cleanedText: '新题 xyz' })
    expect(r.ok).toBe(true)
    expect(r.cacheHit).toBe(false)
    expect(callLLM).toHaveBeenCalled()
    expect(r.solution.final_answer).toContain('\\boxed{1}')
  })

  test('returns error when LLM output is invalid JSON', async () => {
    callLLM.mockResolvedValue({ content: 'not json', usage: {} })
    const r = await main({ fileID: 'f', cleanedText: '新题 xyz2' })
    expect(r.ok).toBe(false)
    expect(r.error).toContain('parse')
  })
})
