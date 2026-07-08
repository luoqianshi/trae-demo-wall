const { parseSolution, extractBoxedAnswers, validateSolutionShape } = require('../response-parser')

describe('response-parser', () => {
  test('parseSolution parses valid JSON string', () => {
    const raw = JSON.stringify({
      restatement: '...',
      conditions: ['a'],
      goal: 'g',
      topic: '函数与导数',
      difficulty: '中',
      hint1: 'h1',
      hint2: 'h2',
      solution_steps: [{ step: 1, content: 'c', basis: 'b' }],
      final_answer: '\\boxed{42}',
      answer_type: 'numeric',
      confidence: 5,
      uncertain_part: ''
    })
    const parsed = parseSolution(raw)
    expect(parsed.final_answer).toBe('\\boxed{42}')
  })

  test('parseSolution strips Markdown code fences', () => {
    const raw = '```json\n{"confidence": 4, "final_answer": "\\\\boxed{1}"}\n```'
    const parsed = parseSolution(raw)
    expect(parsed.confidence).toBe(4)
  })

  test('parseSolution returns null for invalid JSON', () => {
    expect(parseSolution('not json')).toBeNull()
  })

  test('extractBoxedAnswers returns all boxed values', () => {
    const s = '中间结果 \\boxed{2}，最终 \\boxed{7/25}'
    expect(extractBoxedAnswers(s)).toEqual(['2', '7/25'])
  })

  test('extractBoxedAnswers handles nested braces', () => {
    const s = '\\boxed{\\dfrac{7}{25}}'
    expect(extractBoxedAnswers(s)).toEqual(['\\dfrac{7}{25}'])
  })

  test('extractBoxedAnswers returns empty array when no boxed', () => {
    expect(extractBoxedAnswers('no answer')).toEqual([])
  })

  test('validateSolutionShape returns errors for missing fields', () => {
    const sol = { confidence: 5 }
    const errors = validateSolutionShape(sol)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.includes('final_answer'))).toBe(true)
  })

  test('validateSolutionShape passes for well-formed solution', () => {
    const sol = {
      restatement: 'r',
      conditions: ['c'],
      goal: 'g',
      topic: '函数与导数',
      difficulty: '中',
      hint1: 'h1',
      hint2: 'h2',
      solution_steps: [{ step: 1, content: 'c', basis: 'b' }],
      final_answer: '\\boxed{1}',
      answer_type: 'numeric',
      confidence: 5,
      uncertain_part: ''
    }
    expect(validateSolutionShape(sol)).toEqual([])
  })
})
