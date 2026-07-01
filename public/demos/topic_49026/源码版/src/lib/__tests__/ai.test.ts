import { describe, it, expect } from 'vitest'
import { isDemoModeError } from '../ai'

describe('isDemoModeError', () => {
  it('returns true for backend no-key error', () => {
    expect(isDemoModeError(new Error('API Key for deepseek is not configured'))).toBe(true)
  })
  it('returns true for circuit open error', () => {
    expect(isDemoModeError(new Error('服务暂时不可用'))).toBe(true)
  })
  it('returns false for random network error', () => {
    expect(isDemoModeError(new Error('Connection timeout'))).toBe(false)
  })
})
