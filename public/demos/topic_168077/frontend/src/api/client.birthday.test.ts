import { describe, it, expect, vi, beforeEach } from 'vitest'
const mockResponse = (data: any) => ({ data })
const mockApiStore = vi.hoisted(() => ({ mockApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { response: { use: vi.fn() } } } }))
vi.mock('axios', () => ({ default: { create: vi.fn(() => mockApiStore.mockApi) } }))
beforeEach(() => { vi.clearAllMocks() })
import { birthdayAPI } from './client'

describe('birthdayAPI', () => {
  it('check()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse({ is_birthday: true, age: 8, days_until: 0 }))
    const res = await birthdayAPI.check('2018-06-30')
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/check', { params: { birthday: '2018-06-30' } })
    expect(res.data.is_birthday).toBe(true)
  })

  it('age()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse({ age: 8, next_birthday: '2027-06-30', days_until_next: 365 }))
    const res = await birthdayAPI.age('2018-06-30')
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/age', { params: { birthday: '2018-06-30' } })
    expect(res.data.age).toBe(8)
  })

  it('upcoming()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse([
      { birthday: '2018-06-30', age: 8, days_until: 0 },
      { birthday: '2020-03-15', age: 6, days_until: 258 },
    ]))
    const res = await birthdayAPI.upcoming(['2018-06-30', '2020-03-15'])
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/upcoming', { params: { birthdays: '2018-06-30,2020-03-15' } })
    expect(res.data).toHaveLength(2)
  })

  it('upcoming() with empty array', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse([]))
    const res = await birthdayAPI.upcoming([])
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/upcoming', { params: { birthdays: '' } })
    expect(res.data).toHaveLength(0)
  })
})