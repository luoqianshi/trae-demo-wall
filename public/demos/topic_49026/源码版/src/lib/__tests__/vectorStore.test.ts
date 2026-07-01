import { describe, it, expect } from 'vitest'
import { cosineSimilarity } from '../vectorStore'

describe('vectorStore', () => {
  describe('cosineSimilarity', () => {
    it('returns 1 for identical vectors', () => {
      const v = [1, 2, 3]
      expect(cosineSimilarity(v, v)).toBeCloseTo(1, 6)
    })

    it('returns -1 for opposite vectors', () => {
      expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 6)
    })

    it('returns 0 for orthogonal vectors', () => {
      expect(cosineSimilarity([1, 0], [0, 1])).toBe(0)
    })

    it('handles zero vectors gracefully', () => {
      expect(cosineSimilarity([0, 0], [1, 1])).toBe(0)
      expect(cosineSimilarity([0, 0], [0, 0])).toBe(0)
    })

    it('computes similarity for arbitrary vectors', () => {
      const a = [1, 2, 3]
      const b = [4, 5, 6]
      // dot = 32, normA = sqrt(14), normB = sqrt(77)
      const expected = 32 / (Math.sqrt(14) * Math.sqrt(77))
      expect(cosineSimilarity(a, b)).toBeCloseTo(expected, 6)
    })
  })
})
