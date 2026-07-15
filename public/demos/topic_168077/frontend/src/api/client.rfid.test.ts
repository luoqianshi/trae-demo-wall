import { describe, it, expect, vi, beforeEach } from 'vitest'
const mockResponse = (data: any) => ({ data })
const mockApiStore = vi.hoisted(() => ({ mockApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { response: { use: vi.fn() } } } }))
vi.mock('axios', () => ({ default: { create: vi.fn(() => mockApiStore.mockApi) } }))
beforeEach(() => { vi.clearAllMocks() })
import { rfidAPI } from './client'
describe('rfidAPI', () => {
  it('list()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse([]))
    await rfidAPI.list(); expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/rfid-bindings')
  })
  it('create()', async () => {
    mockApiStore.mockApi.post.mockResolvedValue(mockResponse({}))
    await rfidAPI.create({ child_id: '1', rfid_uid: 'A1:B2:C3:D4' })
    expect(mockApiStore.mockApi.post).toHaveBeenCalledWith('/rfid-bindings', { child_id: '1', rfid_uid: 'A1:B2:C3:D4' })
  })
  it('update()', async () => {
    mockApiStore.mockApi.put.mockResolvedValue(mockResponse({}))
    await rfidAPI.update('1', { label: '更新标签' })
    expect(mockApiStore.mockApi.put).toHaveBeenCalledWith('/rfid-bindings/1', { label: '更新标签' })
  })
  it('delete()', async () => {
    mockApiStore.mockApi.delete.mockResolvedValue(mockResponse({}))
    await rfidAPI.delete('1'); expect(mockApiStore.mockApi.delete).toHaveBeenCalledWith('/rfid-bindings/1')
  })
})