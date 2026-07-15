import { describe, it, expect, vi, beforeEach } from 'vitest'
const mockResponse = (data: any) => ({ data })
const mockApiStore = vi.hoisted(() => ({ mockApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { response: { use: vi.fn() } } } }))
vi.mock('axios', () => ({ default: { create: vi.fn(() => mockApiStore.mockApi) } }))
beforeEach(() => { vi.clearAllMocks() })
import { sleepConfigAPI } from './client'
describe('sleepConfigAPI', () => {
  it('get()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse({}))
    await sleepConfigAPI.get('device-1')
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/devices/device-1/sleep-config')
  })
  it('update()', async () => {
    mockApiStore.mockApi.put.mockResolvedValue(mockResponse({}))
    await sleepConfigAPI.update('device-1', { start_time: '22:00' })
    expect(mockApiStore.mockApi.put).toHaveBeenCalledWith('/devices/device-1/sleep-config', { start_time: '22:00' })
  })
})