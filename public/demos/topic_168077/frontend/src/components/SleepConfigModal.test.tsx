import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SleepConfigModal from './SleepConfigModal'

const mockResponse = (data: any) => ({
  data, status: 200, statusText: 'OK', headers: {}, config: {} as any,
})

const mockDevice = { id: 'dev1', name: '卧室检测器' }

const mockApiStore = vi.hoisted(() => ({
  sleepConfigAPI: { get: vi.fn(), update: vi.fn() },
}))

vi.mock('../api/client', () => mockApiStore)

import { sleepConfigAPI } from '../api/client'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SleepConfigModal', () => {
  it('renders modal with device name when visible', async () => {
    vi.mocked(sleepConfigAPI.get).mockResolvedValue(mockResponse({
      start_time: '22:00',
      end_time: '22:30',
      reminder_1_min: 20,
      reminder_2_min: 10,
      sound_threshold: 500,
      is_enabled: true,
    }))
    render(<SleepConfigModal device={mockDevice} visible={true} onClose={vi.fn()} />)
    expect(screen.getByText('睡觉检测配置 - 卧室检测器')).toBeInTheDocument()
    expect(await screen.findByText('检测开始时间')).toBeInTheDocument()
  })

  it('uses default values when API fetch fails', async () => {
    vi.mocked(sleepConfigAPI.get).mockRejectedValue(new Error('fail'))
    render(<SleepConfigModal device={mockDevice} visible={true} onClose={vi.fn()} />)
    expect(await screen.findByText('检测开始时间')).toBeInTheDocument()
    expect(screen.getByText('启用')).toBeInTheDocument()
  })

  it('calls onClose when cancel is clicked', async () => {
    vi.mocked(sleepConfigAPI.get).mockResolvedValue(mockResponse({
      start_time: '22:00',
      end_time: '22:30',
      reminder_1_min: 20,
      reminder_2_min: 10,
      sound_threshold: 500,
      is_enabled: true,
    }))
    const onClose = vi.fn()
    render(<SleepConfigModal device={mockDevice} visible={true} onClose={onClose} />)
    await userEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  it('submits config on ok click', async () => {
    vi.mocked(sleepConfigAPI.get).mockResolvedValue(mockResponse({
      start_time: '22:00',
      end_time: '22:30',
      reminder_1_min: 20,
      reminder_2_min: 10,
      sound_threshold: 500,
      is_enabled: true,
    }))
    vi.mocked(sleepConfigAPI.update).mockResolvedValue(mockResponse({}))
    const onClose = vi.fn()
    render(<SleepConfigModal device={mockDevice} visible={true} onClose={onClose} />)
    await userEvent.click(screen.getByText('OK'))
    expect(sleepConfigAPI.update).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when visible is false', () => {
    render(<SleepConfigModal device={mockDevice} visible={false} onClose={vi.fn()} />)
    expect(screen.queryByText('睡觉检测配置 - 卧室检测器')).not.toBeInTheDocument()
  })
})