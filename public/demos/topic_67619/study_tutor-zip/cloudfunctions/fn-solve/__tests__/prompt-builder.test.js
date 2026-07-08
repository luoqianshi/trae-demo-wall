const { buildSystemPrompt, buildUserMessage, FEW_SHOT_EXAMPLES } = require('../prompt-builder')

describe('prompt-builder', () => {
  test('buildSystemPrompt includes JSON schema and role', () => {
    const p = buildSystemPrompt()
    expect(p).toContain('高中数学老师')
    expect(p).toContain('JSON')
    expect(p).toContain('restatement')
    expect(p).toContain('hint1')
    expect(p).toContain('hint2')
    expect(p).toContain('solution_steps')
    expect(p).toContain('final_answer')
    expect(p).toContain('\\\\boxed{}')
    expect(p).toContain('confidence')
  })

  test('buildUserMessage wraps question text', () => {
    const msg = buildUserMessage('求 f(x)=x^2+1 的最小值')
    expect(msg).toContain('求 f(x)=x^2+1 的最小值')
    expect(msg).toContain('题目')
  })

  test('FEW_SHOT_EXAMPLES has at least 2 examples covering different types', () => {
    expect(FEW_SHOT_EXAMPLES.length).toBeGreaterThanOrEqual(2)
    const types = FEW_SHOT_EXAMPLES.map(e => e.output.answer_type)
    expect(new Set(types).size).toBeGreaterThan(1)
  })
})
