import { describe, it, expect, vi, beforeEach } from 'vitest'
const mockResponse = (data: any) => ({ data })
const mockApiStore = vi.hoisted(() => ({ mockApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { response: { use: vi.fn() } } } }))
vi.mock('axios', () => ({ default: { create: vi.fn(() => mockApiStore.mockApi) } }))
beforeEach(() => { vi.clearAllMocks() })
import { scheduleAPI } from './client'
describe('scheduleAPI', () => {
  it('listByChildAndDate()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse([]))
    await scheduleAPI.listByChildAndDate('1', '2026-06-21')
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/schedules', { params: { child_id: '1', date: '2026-06-21' } })
  })
  it('listByDate()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse([]))
    await scheduleAPI.listByDate('2026-06-21')
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/schedules/date', { params: { date: '2026-06-21' } })
  })
  it('create()', async () => {
    mockApiStore.mockApi.post.mockResolvedValue(mockResponse({}))
    const data = { child_id: '1', activity: '起床', start_time: '07:00', end_time: '07:30' }
    await scheduleAPI.create(data)
    expect(mockApiStore.mockApi.post).toHaveBeenCalledWith('/schedules', data)
  })
  it('generate()', async () => {
    mockApiStore.mockApi.post.mockResolvedValue(mockResponse({}))
    await scheduleAPI.generate('1', '2026-06-22')
    expect(mockApiStore.mockApi.post).toHaveBeenCalledWith('/schedules/generate', { child_id: '1', date: '2026-06-22', template_ids: undefined })
  })
  it('listTemplates()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse([]))
    await scheduleAPI.listTemplates()
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/schedule-templates')
  })
})