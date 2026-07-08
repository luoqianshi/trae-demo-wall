const { compareNumeric, normalizeAnswer, verifyAgainstExpected } = require('../math-verifier')

describe('math-verifier', () => {
  test('normalizeAnswer strips boxed and whitespace', () => {
    expect(normalizeAnswer('\\boxed{42}')).toBe('42')
    expect(normalizeAnswer(' \\boxed{ 42 } ')).toBe('42')
    expect(normalizeAnswer('42')).toBe('42')
  })

  test('compareNumeric compares decimal values', () => {
    expect(compareNumeric('1/2', '0.5')).toBe(true)
    expect(compareNumeric('0.333...', '1/3')).toBe(true)
    expect(compareNumeric('2', '3')).toBe(false)
  })

  test('compareNumeric handles LaTeX fractions', () => {
    expect(compareNumeric('\\dfrac{7}{25}', '0.28')).toBe(true)
  })

  test('compareNumeric returns false for non-numeric', () => {
    expect(compareNumeric('abc', 'xyz')).toBe(false)
  })

  test('verifyAgainstExpected returns match=true when consistent', () => {
    const r = verifyAgainstExpected('\\boxed{7/25}', ['\\boxed{7/25}'])
    expect(r.match).toBe(true)
  })

  test('verifyAgainstExpected returns match=false for different boxed', () => {
    const r = verifyAgainstExpected('\\boxed{2}', ['\\boxed{3}'])
    expect(r.match).toBe(false)
  })

  test('verifyAgainstExpected returns inconclusive when no expected', () => {
    const r = verifyAgainstExpected('\\boxed{2}', [])
    expect(r.match).toBeNull()
    expect(r.reason).toContain('no expected')
  })
})
