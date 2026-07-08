/**
 * 端到端测试 - 需要真实云开发环境。
 * 跳过方式：jest --testPathIgnorePatterns=e2e
 * 手动触发：设置 E2E_ENV_ID 环境变量后 jest e2e
 */

const RUN_E2E = process.env.E2E_ENV_ID

const test = RUN_E2E ? global.test : global.test.skip

describe('e2e: fn-solve against real LLM', () => {
  test('easy quadratic minimization', async () => {
    const { main } = require('../index')
    const r = await main({
      cleanedText: '求函数 f(x) = x^2 - 4x + 3 的最小值。'
    })
    expect(r.ok).toBe(true)
    expect(r.solution.final_answer).toMatch(/\\boxed\{.*-?1.*\}/)
    expect(r.solution.confidence).toBeGreaterThanOrEqual(4)
  }, 60000)

  test('trigonometric double angle', async () => {
    const { main } = require('../index')
    const r = await main({
      cleanedText: '已知 sin α = 3/5，α ∈ (0, π/2)，求 cos 2α。'
    })
    expect(r.ok).toBe(true)
    expect(r.solution.confidence).toBeGreaterThanOrEqual(4)
  }, 60000)
})
