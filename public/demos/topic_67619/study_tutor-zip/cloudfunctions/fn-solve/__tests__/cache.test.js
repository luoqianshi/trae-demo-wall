const { computeHash, serializeForHash } = require('../cache')

describe('cache', () => {
  test('serializeForHash normalizes whitespace and case-insensitive', () => {
    const a = serializeForHash('  求 f(x) = x^2  的最小值\n')
    const b = serializeForHash('求f(x)=x^2的最小值')
    expect(a).toBe(b)
  })

  test('computeHash returns deterministic sha1 hex', () => {
    const h1 = computeHash('求 f(x) = x^2')
    const h2 = computeHash('求 f(x) = x^2')
    expect(h1).toBe(h2)
    expect(h1).toMatch(/^[a-f0-9]{40}$/)
  })

  test('computeHash differs for different inputs', () => {
    expect(computeHash('题目 A')).not.toBe(computeHash('题目 B'))
  })
})
