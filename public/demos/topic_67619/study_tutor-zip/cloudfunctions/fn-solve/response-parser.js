const REQUIRED_FIELDS = [
  'restatement',
  'conditions',
  'goal',
  'topic',
  'difficulty',
  'hint1',
  'hint2',
  'solution_steps',
  'final_answer',
  'answer_type',
  'confidence'
]

const VALID_TOPICS = [
  '函数与导数', '三角函数', '数列', '立体几何',
  '解析几何', '概率统计', '不等式', '其他'
]
const VALID_DIFFICULTIES = ['易', '中', '难']
const VALID_ANSWER_TYPES = ['numeric', 'symbolic', 'proof', 'multi']

function stripMarkdownFences(raw) {
  let s = raw.trim()
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  return s.trim()
}

function parseSolution(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return null
  const cleaned = stripMarkdownFences(rawContent)
  try {
    return JSON.parse(cleaned)
  } catch (err) {
    return null
  }
}

function extractBoxedAnswers(text) {
  if (!text) return []
  const results = []
  let i = 0
  while (i < text.length) {
    const idx = text.indexOf('\\boxed{', i)
    if (idx === -1) break
    const start = idx + '\\boxed{'.length
    let depth = 1
    let j = start
    while (j < text.length && depth > 0) {
      if (text[j] === '{') depth++
      else if (text[j] === '}') depth--
      j++
    }
    if (depth === 0) {
      results.push(text.slice(start, j - 1))
    }
    i = j
  }
  return results
}

function validateSolutionShape(sol) {
  const errors = []
  if (!sol || typeof sol !== 'object') {
    return ['solution is not an object']
  }
  for (const f of REQUIRED_FIELDS) {
    if (!(f in sol) || sol[f] === undefined || sol[f] === null) {
      errors.push(`missing field: ${f}`)
    }
  }
  if (!VALID_TOPICS.includes(sol.topic)) {
    errors.push(`topic must be one of ${VALID_TOPICS.join(', ')}`)
  }
  if (!VALID_DIFFICULTIES.includes(sol.difficulty)) {
    errors.push(`difficulty must be one of ${VALID_DIFFICULTIES.join(', ')}`)
  }
  if (!VALID_ANSWER_TYPES.includes(sol.answer_type)) {
    errors.push(`answer_type must be one of ${VALID_ANSWER_TYPES.join(', ')}`)
  }
  if (typeof sol.confidence !== 'number' || sol.confidence < 1 || sol.confidence > 5) {
    errors.push('confidence must be a number in [1, 5]')
  }
  if (sol.confidence < 4 && !sol.uncertain_part) {
    errors.push('uncertain_part required when confidence < 4')
  }
  return errors
}

module.exports = {
  parseSolution,
  extractBoxedAnswers,
  validateSolutionShape,
  REQUIRED_FIELDS,
  VALID_TOPICS,
  VALID_DIFFICULTIES,
  VALID_ANSWER_TYPES
}
