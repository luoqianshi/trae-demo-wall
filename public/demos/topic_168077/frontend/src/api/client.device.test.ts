import { describe, it, expect, vi, beforeEach } from 'vitest'
const mockResponse = (data: any) => ({ data })
const mockApiStore = vi.hoisted(() => ({ mockApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { response: { use: vi.fn() } } } }))
vi.mock('axios', () => ({ default: { create: vi.fn(() => mockApiStore.mockApi) } }))
beforeEach(() => { vi.clearAllMocks() })
import { deviceAPI, deviceLogAPI, deviceCommandAPI } from './client'
describe('deviceAPI', () => {
  it('list()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse([]))
    await deviceAPI.list(); expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/devices')
  })
  it('create()', async () => {
    mockApiStore.mockApi.post.mockResolvedValue(mockResponse({}))
    await deviceAPI.create({ name: 'CoreS3', device_type: 'multi' })
    expect(mockApiStore.mockApi.post).toHaveBeenCalledWith('/devices', { name: 'CoreS3', device_type: 'multi' })
  })
  it('update()', async () => {
    mockApiStore.mockApi.put.mockResolvedValue(mockResponse({}))
    await deviceAPI.update('1', { name: 'Updated' })
    expect(mockApiStore.mockApi.put).toHaveBeenCalledWith('/devices/1', { name: 'Updated' })
  })
  it('delete()', async () => {
    mockApiStore.mockApi.delete.mockResolvedValue(mockResponse({}))
    await deviceAPI.delete('1'); expect(mockApiStore.mockApi.delete).toHaveBeenCalledWith('/devices/1')
  })
})
describe('deviceLogAPI', () => {
  it('list()', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse([]))
    await deviceLogAPI.list({ child_id: '1' })
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/device-logs', { params: { child_id: '1' } })
  })
  it('list() no params', async () => {
    mockApiStore.mockApi.get.mockResolvedValue(mockResponse([]))
    await deviceLogAPI.list()
    expect(mockApiStore.mockApi.get).toHaveBeenCalledWith('/device-logs', { params: undefined })
  })
})
describe('deviceCommandAPI', () => {
  it('send()', async () => {
    mockApiStore.mockApi.post.mockResolvedValue(mockResponse({}))
    await deviceCommandAPI.send('device-1', 'wake')
    expect(mockApiStore.mockApi.post).toHaveBeenCalledWith('/devices/device-1/command', { cmd: 'wake' })
  })
  it('send() calibrate', async () => {
    mockApiStore.mockApi.post.mockResolvedValue(mockResponse({}))
    await deviceCommandAPI.send('device-1', 'calibrate')
    expect(mockApiStore.mockApi.post).toHaveBeenCalledWith('/devices/device-1/command', { cmd: 'calibrate' })
  })
})