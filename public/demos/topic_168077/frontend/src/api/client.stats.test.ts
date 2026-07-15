import { describe, it, expect, vi, beforeEach } from 'vitest'
const mockResponse = (data: any) => ({ data })
const mockApiStore = vi.hoisted(() => ({ mockApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { response: { use: vi.fn() } } } }))
vi.mock('axios', () => ({ default: { create: vi.fn(() => mockApiStore.mockApi) } }))
beforeEach(() => { vi.clearAllMocks() })
import { statsAPI } from './client'
describe('statsAPI', () => {
  it('get()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse({ total: 5, confirmed: 3 }))
    await statsAPI.get('1')
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/stats', { params: { child_id: '1' } })
  })
})