import { describe, it, expect, vi, beforeEach } from 'vitest'
const mockResponse = (data: any) => ({ data })
const mockApiStore = vi.hoisted(() => ({ mockApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { response: { use: vi.fn() } } } }))
vi.mock('axios', () => ({ default: { create: vi.fn(() => mockApiStore.mockApi) } }))
beforeEach(() => { vi.clearAllMocks() })
import { allowanceAPI } from './client'
describe('allowanceAPI', () => {
  it('getBalance()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse({ balance: 100 }))
    await allowanceAPI.getBalance('1')
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/allowance/1')
  })
  it('listTransactions()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse([]))
    await allowanceAPI.listTransactions('1')
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/allowance/1/transactions')
  })
  it('spend()', async () => {
    mockApiStore.mockApi.post.mockResolvedValue(mockResponse({ message: '消费成功' }))
    await allowanceAPI.spend('1', 10, '买铅笔')
    expect(mockApiStore.mockApi.post).toHaveBeenCalledWith('/allowance/1/spend', { amount: 10, description: '买铅笔' })
  })
})