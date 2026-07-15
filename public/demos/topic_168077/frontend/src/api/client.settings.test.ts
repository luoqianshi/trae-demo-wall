import { describe, it, expect, vi, beforeEach } from 'vitest'
const mockResponse = (data: any) => ({ data })
const mockApiStore = vi.hoisted(() => ({ mockApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { response: { use: vi.fn() } } } }))
vi.mock('axios', () => ({ default: { create: vi.fn(() => mockApiStore.mockApi) } }))
beforeEach(() => { vi.clearAllMocks() })
import { settingsAPI } from './client'

describe('settingsAPI', () => {
  it('get()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse({ mqtt: { broker: 'mqtt://localhost:1883' }, ai: {} }))
    const res = await settingsAPI.get()
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/settings')
    expect(res.data.mqtt.broker).toBe('mqtt://localhost:1883')
  })

  it('update()', async () => {
    const data = { mqtt: { broker: 'mqtt://test.io:1883' }, ai: { api_endpoint: 'https://api.test.com' } }
    mockApiStore.mockApi.put.mockResolvedValue(mockResponse({ message: '保存成功' }))
    const res = await settingsAPI.update(data)
    expect(mockApiStore.mockApi.put).toHaveBeenCalledWith('/settings', data)
    expect(res.data.message).toBe('保存成功')
  })

  it('get() handles empty settings', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse({}))
    const res = await settingsAPI.get()
    expect(res.data).toEqual({})
  })
})