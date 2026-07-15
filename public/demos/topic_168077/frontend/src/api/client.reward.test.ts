import { describe, it, expect, vi, beforeEach } from 'vitest'
const mockResponse = (data: any) => ({ data })
const mockApiStore = vi.hoisted(() => ({ mockApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { response: { use: vi.fn() } } } }))
vi.mock('axios', () => ({ default: { create: vi.fn(() => mockApiStore.mockApi) } }))
beforeEach(() => { vi.clearAllMocks() })
import { rewardAPI } from './client'
describe('rewardAPI', () => {
  it('listRules()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse([]))
    await rewardAPI.listRules()
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/reward-rules')
  })
  it('createRule()', async () => {
    mockApiStore.mockApi.post.mockResolvedValue(mockResponse({}))
    await rewardAPI.createRule({ name: '按时起床', points: 10 })
    expect(mockApiStore.mockApi.post).toHaveBeenCalledWith('/reward-rules', { name: '按时起床', points: 10 })
  })
  it('createRecord()', async () => {
    mockApiStore.mockApi.post.mockResolvedValue(mockResponse({}))
    await rewardAPI.createRecord({ child_id: '1', type: 'reward', amount: 10 })
    expect(mockApiStore.mockApi.post).toHaveBeenCalledWith('/reward-records', { child_id: '1', type: 'reward', amount: 10 })
  })
  it('listRecords()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse([]))
    await rewardAPI.listRecords('1')
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/reward-records', { params: { child_id: '1' } })
  })
  it('updateRecord()', async () => {
    mockApiStore.mockApi.put.mockResolvedValue(mockResponse({}))
    await rewardAPI.updateRecord('1', { type: 'reward', amount: 5 })
    expect(mockApiStore.mockApi.put).toHaveBeenCalledWith('/reward-records/1', { type: 'reward', amount: 5 })
  })
  it('deleteRecord()', async () => {
    mockApiStore.mockApi.delete.mockResolvedValue(mockResponse({}))
    await rewardAPI.deleteRecord('1')
    expect(mockApiStore.mockApi.delete).toHaveBeenCalledWith('/reward-records/1')
  })
})