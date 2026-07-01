import type { ExtractedMemory } from './memoryExtractor'

const ALLOWED_TYPES = new Set([
  'preference', 'commitment', 'event', 'insight', 'emotion', 'habit', 'goal', 'fear', 'value',
])
const ALLOWED_CONFIDENCE = new Set(['high', 'medium', 'low'])
const ALLOWED_TEMPORAL = new Set(['current', 'past', 'future'])
const ALLOWED_IMPORTANCE = new Set(['high', 'medium', 'low'])

export function validateExtractedMemory(item: unknown): ExtractedMemory | null {
  if (!item || typeof item !== 'object') return null
  const m = item as Partial<ExtractedMemory>

  if (!m.type || !ALLOWED_TYPES.has(m.type)) return null
  if (!m.content || typeof m.content !== 'string' || m.content.trim().length === 0) return null
  if (!m.confidence || !ALLOWED_CONFIDENCE.has(m.confidence)) return null

  return {
    type: m.type,
    content: m.content.trim(),
    confidence: m.confidence,
    reason: typeof m.reason === 'string' ? m.reason : '',
    related_dimensions: Array.isArray(m.related_dimensions)
      ? m.related_dimensions.filter((x): x is string => typeof x === 'string')
      : [],
    related_person_names: Array.isArray(m.related_person_names)
      ? m.related_person_names.filter((x): x is string => typeof x === 'string')
      : [],
    temporal: ALLOWED_TEMPORAL.has(m.temporal || '') ? (m.temporal as ExtractedMemory['temporal']) : undefined,
    importance: ALLOWED_IMPORTANCE.has(m.importance || '') ? (m.importance as ExtractedMemory['importance']) : undefined,
  }
}
