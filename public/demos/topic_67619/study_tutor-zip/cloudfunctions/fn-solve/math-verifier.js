const { evaluate, simplify, equal } = require('mathjs')

function normalizeAnswer(raw) {
  if (!raw) return ''
  let s = String(raw).trim()
  // strip \boxed{...} wrapper if present
  if (s.startsWith('\\boxed{') && s.endsWith('}')) {
    s = s.slice('\\boxed{'.length, -1).trim()
  }
  return s
}

function tryEvaluate(expr) {
  try {
    return evaluate(expr)
  } catch {
    return null
  }
}

function compareNumeric(actual, expected) {
  const a = normalizeAnswer(actual)
  const e = normalizeAnswer(expected)
  if (!a || !e) return false

  // direct string compare
  if (a === e) return true

  // try numeric comparison
  const aVal = tryEvaluate(latexToMath(a))
  const eVal = tryEvaluate(latexToMath(e))
  if (aVal === null || eVal === null) return false

  try {
    if (typeof aVal === 'number' && typeof eVal === 'number') {
      // 容差 1e-3：足够区分 7/25 (0.28) vs 8/25 (0.32) 等典型数学答案；
      // 又能容忍学生写的 0.333 与标准 1/3 之差 0.000333
      return Math.abs(aVal - eVal) < 1e-3
    }
    return equal(aVal, eVal)
  } catch {
    return false
  }
}

function latexToMath(s) {
  return s
    .replace(/\\dfrac\{/g, '(')
    .replace(/\\frac\{/g, '(')
    .replace(/\\dfrac/g, '')
    .replace(/\\frac/g, '')
    .replace(/\}\{/g, ')/(')
    .replace(/\}/g, ')')
    .replace(/\\,/g, '')
    .replace(/\\!/g, '')
    .replace(/\.\.\./g, '')
}

function verifyAgainstExpected(actualFinalAnswer, expectedBoxedValues) {
  if (!expectedBoxedValues || expectedBoxedValues.length === 0) {
    return { match: null, reason: 'no expected values provided' }
  }
  for (const expected of expectedBoxedValues) {
    if (compareNumeric(actualFinalAnswer, expected)) {
      return { match: true, expected }
    }
  }
  return { match: false, expected: expectedBoxedValues[0] }
}

module.exports = {
  normalizeAnswer,
  compareNumeric,
  verifyAgainstExpected,
  latexToMath
}
