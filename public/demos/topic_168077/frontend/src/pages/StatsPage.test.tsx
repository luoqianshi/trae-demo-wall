import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import StatsPage from './StatsPage'

const mockChildList = vi.fn()
const mockStatsGet = vi.fn()
const mockDeviceLogList = vi.fn()

vi.mock('../api/client', () => ({
  childAPI: { list: (...args: any[]) => mockChildList(...args) },
  statsAPI: { get: (...args: any[]) => mockStatsGet(...args) },
  deviceLogAPI: { list: (...args: any[]) => mockDeviceLogList(...args) },
}))

vi.mock('../components/StatsChart', () => ({
  default: () => <div data-testid="stats-chart">Chart</div>,
}))

let mockRole = 'admin'
let mockChildId: string | null = null
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ role: mockRole, childId: mockChildId }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockRole = 'admin'
  mockChildId = null
  mockChildList.mockResolvedValue({ data: [
    { id: '1', name: '小明', age: 8 },
    { id: '2', name: '小红', age: 6 },
  ]})
  mockStatsGet.mockResolvedValue({ data: { total: 10, confirmed: 8, rejected: 1, streak_days: 5 } })
  mockDeviceLogList.mockResolvedValue({ data: [] })
})

describe('StatsPage', () => {
  it('shows placeholder when no child selected', async () => {
    render(<StatsPage />)
    await waitFor(() => {
      expect(screen.getByText('请选择要查看的孩子')).toBeInTheDocument()
    })
  })

  it('shows week/month tabs always visible', async () => {
    render(<StatsPage />)
    await waitFor(() => {
      expect(screen.getByText('周统计')).toBeInTheDocument()
    })
    expect(screen.getByText('月统计')).toBeInTheDocument()
  })

  it('loads and displays stat cards when a child is auto-selected in child mode', async () => {
    mockRole = 'child'
    mockChildId = '1'
    render(<StatsPage />)
    await waitFor(() => {
      expect(screen.getByText('总打卡')).toBeInTheDocument()
    })
    expect(screen.getByText('已完成')).toBeInTheDocument()
    expect(screen.getByText('未完成')).toBeInTheDocument()
    expect(screen.getByText('连续天数')).toBeInTheDocument()
  })

  it('shows stat values when auto-selected in child mode', async () => {
    mockRole = 'child'
    mockChildId = '1'
    render(<StatsPage />)
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument()
    })
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows chart component when child is selected', async () => {
    mockRole = 'child'
    mockChildId = '1'
    render(<StatsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('stats-chart')).toBeInTheDocument()
    })
  })

  it('shows detail table with logs', async () => {
    mockRole = 'child'
    mockChildId = '1'
    mockDeviceLogList.mockResolvedValue({
      data: [{ id: '1', created_at: '2026-07-01T10:00:00Z', event_type: 'clock_in', math_problem: '1+1', math_correct: true, status: 'confirmed' }],
    })
    render(<StatsPage />)
    await waitFor(() => {
      expect(screen.getByText('流水明细')).toBeInTheDocument()
    })
    expect(screen.getByText('clock_in')).toBeInTheDocument()
    expect(screen.getByText('1+1')).toBeInTheDocument()
  })

  it('handles API error gracefully', async () => {
    mockStatsGet.mockRejectedValue(new Error('Network error'))
    mockRole = 'child'
    mockChildId = '1'
    render(<StatsPage />)
    // Should render without crashing — check chart not rendered due to error
    // The page should still show the placeholder helper text
    await waitFor(() => {
      // No crash means success
      expect(screen.getByText('周统计')).toBeInTheDocument()
    })
  })

  it('disables child selector in child mode', async () => {
    mockRole = 'child'
    mockChildId = '1'
    render(<StatsPage />)
    await waitFor(() => {
      const select = document.querySelector('.ant-select-disabled')
      expect(select).not.toBeNull()
    })
  })
})