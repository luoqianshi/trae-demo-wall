import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DeviceManager from './DeviceManager'

const mockResponse = (data: any) => ({
  data, status: 200, statusText: 'OK', headers: {}, config: {} as any,
})

const mockDevices = [
  { id: '1', name: '卧室打卡机', device_type: 'wake_up', model: 'M5CoreS3', has_rfid: true, is_active: true, location: '儿童房' },
  { id: '2', name: '客厅检测器', device_type: 'multi', model: 'ESP32-DevKit', has_rfid: false, is_active: false, location: '客厅' },
]

const mockApiStore = vi.hoisted(() => ({
  deviceAPI: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  deviceCommandAPI: { send: vi.fn() },
}))

vi.mock('../api/client', () => mockApiStore)

import { deviceAPI } from '../api/client'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DeviceManager', () => {
  it('renders table and fetches devices on mount', async () => {
    vi.mocked(deviceAPI.list).mockResolvedValue(mockResponse(mockDevices))
    render(<DeviceManager onSleepConfig={vi.fn()} />)
    expect(screen.getByText('添加设备')).toBeInTheDocument()
    expect(await screen.findByText('卧室打卡机')).toBeInTheDocument()
    expect(screen.getByText('客厅检测器')).toBeInTheDocument()
  })

  it('calls onSleepConfig when clicking sleep config button', async () => {
    vi.mocked(deviceAPI.list).mockResolvedValue(mockResponse(mockDevices))
    const onSleepConfig = vi.fn()
    render(<DeviceManager onSleepConfig={onSleepConfig} />)
    const buttons = await screen.findAllByText('睡觉配置')
    await userEvent.click(buttons[0])
    expect(onSleepConfig).toHaveBeenCalledWith(mockDevices[0])
  })

  it('opens create modal on add device button click', async () => {
    vi.mocked(deviceAPI.list).mockResolvedValue(mockResponse(mockDevices))
    render(<DeviceManager onSleepConfig={vi.fn()} />)
    await userEvent.click(await screen.findByText('添加设备'))
    expect(await screen.findByText('设备名称')).toBeInTheDocument()
    expect(screen.getByText('设备类型')).toBeInTheDocument()
  })

  it('opens edit modal on edit button click', async () => {
    vi.mocked(deviceAPI.list).mockResolvedValue(mockResponse(mockDevices))
    render(<DeviceManager onSleepConfig={vi.fn()} />)
    const buttons = await screen.findAllByText('编辑')
    await userEvent.click(buttons[0])
    expect(await screen.findByText('编辑设备')).toBeInTheDocument()
  })
})