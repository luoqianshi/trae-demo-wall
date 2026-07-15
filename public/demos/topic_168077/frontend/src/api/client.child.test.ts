import { describe, it, expect, vi, beforeEach } from 'vitest'
const mockResponse = (data: any) => ({ data })
const mockApiStore = vi.hoisted(() => ({ mockApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { response: { use: vi.fn() } } } }))
vi.mock('axios', () => ({ default: { create: vi.fn(() => mockApiStore.mockApi) } }))
beforeEach(() => { vi.clearAllMocks() })
import { childAPI } from './client'
describe('childAPI', () => {
  it('list()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse([{ id: '1', name: '小明' }]))
    const res = await childAPI.list()
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/children')
    expect(res.data).toHaveLength(1)
  })
  it('get()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse({ id: '1', name: '小明' }))
    await childAPI.get('1'); expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/children/1')
  })
  it('create()', async () => {
    mockApiStore.mockApi.post.mockResolvedValue(mockResponse({ id: '2', name: '小红' }))
    await childAPI.create({ name: '小红', age: 5 })
    expect(mockApiStore.mockApi.post).toHaveBeenCalledWith('/children', { name: '小红', age: 5 })
  })
  it('update()', async () => {
    mockApiStore.mockApi.put.mockResolvedValue(mockResponse({ id: '1', name: '小明改' }))
    await childAPI.update('1', { name: '小明改' })
    expect(mockApiStore.mockApi.put).toHaveBeenCalledWith('/children/1', { name: '小明改' })
  })
  it('delete()', async () => {
    mockApiStore.mockApi.delete.mockResolvedValue(mockResponse({ message: '删除成功' }))
    await childAPI.delete('1'); expect(mockApiStore.mockApi.delete).toHaveBeenCalledWith('/children/1')
  })
})