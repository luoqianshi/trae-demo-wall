import { describe, it, expect, beforeEach } from 'vitest'
import { isApiKeyValid, isDoubaoApiKeyValid, isAnyModelAvailable, isUsingDefaultKey, getDoubaoEmbeddingModel } from '../config'

describe('config', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('isApiKeyValid', () => {
    it('returns false when no key is set', () => {
      expect(isApiKeyValid()).toBe(false)
    })

    it('returns false for empty or whitespace keys', () => {
      localStorage.setItem('hengzhou-api-key', '   ')
      expect(isApiKeyValid()).toBe(false)
    })

    it('returns true for a non-empty key', () => {
      localStorage.setItem('hengzhou-api-key', 'sk-test-key')
      expect(isApiKeyValid()).toBe(true)
    })
  })

  describe('isDoubaoApiKeyValid', () => {
    it('returns false when no key is set', () => {
      expect(isDoubaoApiKeyValid()).toBe(false)
    })

    it('returns true for a non-empty key', () => {
      localStorage.setItem('hengzhou-doubao-api-key', 'db-test-key')
      expect(isDoubaoApiKeyValid()).toBe(true)
    })
  })

  describe('isAnyModelAvailable', () => {
    it('returns true when backend default key is configured even if no user key is set', () => {
      expect(isAnyModelAvailable()).toBe(true)
    })

    it('returns true when deepseek key is set', () => {
      localStorage.setItem('hengzhou-api-key', 'sk-test-key')
      expect(isAnyModelAvailable()).toBe(true)
    })

    it('returns true when doubao key is set', () => {
      localStorage.setItem('hengzhou-doubao-api-key', 'db-test-key')
      expect(isAnyModelAvailable()).toBe(true)
    })
  })

  describe('isUsingDefaultKey', () => {
    it('returns true when no user key is configured', () => {
      expect(isUsingDefaultKey()).toBe(true)
    })

    it('returns false when both keys are configured', () => {
      localStorage.setItem('hengzhou-api-key', 'sk-test-key')
      localStorage.setItem('hengzhou-doubao-api-key', 'db-test-key')
      expect(isUsingDefaultKey()).toBe(false)
    })
  })

  describe('getDoubaoEmbeddingModel', () => {
    it('returns the configured embedding model', () => {
      localStorage.setItem('hengzhou-doubao-embedding-model', 'custom-embedding-model')
      expect(getDoubaoEmbeddingModel()).toBe('custom-embedding-model')
    })

    it('falls back to default model', () => {
      expect(getDoubaoEmbeddingModel()).toBe('doubao-embedding-vision-251215')
    })
  })
})
