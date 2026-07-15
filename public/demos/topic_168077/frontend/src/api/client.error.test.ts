import { describe, it, expect, vi, beforeEach } from 'vitest'
const mockApiStore = vi.hoisted(() => ({ mockApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { response: { use: vi.fn() } } } }))
vi.mock('axios', () => ({ default: { create: vi.fn(() => mockApiStore.mockApi) } }))
beforeEach(() => { vi.clearAllMocks() })
import { childAPI } from './client'
describe('API error handling', () => {
  it('throws on API error response', async () => {
    mockApiStore.mockApi.get.mockRejectedValue({ response: { data: { error: '服务器错误' } }, message: 'Request failed' })
    await expect(childAPI.list()).rejects.toThrow()
  })
  it('throws on network errors', async () => {
    mockApiStore.mockApi.get.mockRejectedValue(new Error('Network Error'))
    await expect(childAPI.list()).rejects.toThrow('Network Error')
  })
})