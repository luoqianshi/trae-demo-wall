import { describe, it, expect, vi, beforeEach } from 'vitest'
const mockResponse = (data: any) => ({ data })
const mockApiStore = vi.hoisted(() => ({ mockApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { response: { use: vi.fn() } } } }))
vi.mock('axios', () => ({ default: { create: vi.fn(() => mockApiStore.mockApi) } }))
beforeEach(() => { vi.clearAllMocks() })
import { clockAPI } from './client'
describe('clockAPI', () => {
  it('clockIn()', async () => {
    mockApiStore.mockApi.post.mockResolvedValue(mockResponse({}))
    await clockAPI.clockIn({ child_id: '1', device_id: 'd1', event_type: 'wake_up' })
    expect(mockApiStore.mockApi.post).toHaveBeenCalledWith('/clock-in', { child_id: '1', device_id: 'd1', event_type: 'wake_up' })
  })
  it('confirm()', async () => {
    mockApiStore.mockApi.post.mockResolvedValue(mockResponse({}))
    await clockAPI.confirm('1'); expect(mockApiStore.mockApi.post).toHaveBeenCalledWith('/clock-in/1/confirm')
  })
  it('reject()', async () => {
    mockApiStore.mockApi.post.mockResolvedValue(mockResponse({}))
    await clockAPI.reject('1'); expect(mockApiStore.mockApi.post).toHaveBeenCalledWith('/clock-in/1/reject')
  })
  it('listByChild()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse([]))
    await clockAPI.listByChild('1'); expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/clock-in/child/1')
  })
  it('listByDevice()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse([]))
    await clockAPI.listByDevice('d1')
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/clock-in/device', { params: { device_id: 'd1' } })
  })
})