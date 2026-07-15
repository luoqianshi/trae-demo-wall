import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ScheduleTemplateManager from './ScheduleTemplateManager'

const mockResponse = (data: any) => ({
  data, status: 200, statusText: 'OK', headers: {}, config: {} as any,
})

const mockTemplates = [
  { id: '1', day_of_week: 1, start_time: '07:00', end_time: '07:30', activity: '起床', sort_order: 1, is_required: true },
  { id: '2', day_of_week: 1, start_time: '08:00', end_time: '08:30', activity: '早餐', sort_order: 2, is_required: false },
]

vi.mock('../api/client', () => ({
  scheduleAPI: {
    listTemplates: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
  },
}))

import { scheduleAPI } from '../api/client'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ScheduleTemplateManager', () => {
  it('renders add button and fetches templates on mount', async () => {
    vi.mocked(scheduleAPI.listTemplates).mockResolvedValue(mockResponse(mockTemplates))
    render(<ScheduleTemplateManager />)
    expect(screen.getByText('添加模板')).toBeInTheDocument()
    expect(await screen.findByText('起床')).toBeInTheDocument()
  })

  it('opens create modal on add button click', async () => {
    vi.mocked(scheduleAPI.listTemplates).mockResolvedValue(mockResponse(mockTemplates))
    render(<ScheduleTemplateManager />)
    await userEvent.click(await screen.findByText('添加模板'))
    expect(await screen.findByText('添加作息模板')).toBeInTheDocument()
  })

  it('shows empty state when no templates', async () => {
    vi.mocked(scheduleAPI.listTemplates).mockResolvedValue(mockResponse([]))
    render(<ScheduleTemplateManager />)
    expect(await screen.findByText('添加模板')).toBeInTheDocument()
  })

  it('renders required tag for is_required templates', async () => {
    vi.mocked(scheduleAPI.listTemplates).mockResolvedValue(mockResponse(mockTemplates))
    render(<ScheduleTemplateManager />)
    expect(await screen.findByText('必须')).toBeInTheDocument()
  })
})