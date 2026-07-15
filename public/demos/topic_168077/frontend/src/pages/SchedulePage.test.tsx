import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import SchedulePage from './SchedulePage'

const mockResponse = (data: any) => ({
  data, status: 200, statusText: 'OK', headers: {}, config: {} as any,
})

const todayDayOfWeek = dayjs().day()
const mockChildren = [
  { id: 'child-1', name: '小明', birthday: null },
  { id: 'child-2', name: '小红', birthday: null },
]

const mockSchedules = [
  { id: 's1', child_id: 'child-1', date: dayjs().format('YYYY-MM-DD'), start_time: '07:00', end_time: '07:30', activity: '起床', is_fixed: true, status: 'pending' },
  { id: 's2', child_id: 'child-1', date: dayjs().format('YYYY-MM-DD'), start_time: '08:00', end_time: '08:30', activity: '早餐', is_fixed: true, status: 'done' },
]

const mockTemplates = [
  { id: 't1', day_of_week: todayDayOfWeek, start_time: '07:00', end_time: '07:30', activity: '起床模板', sort_order: 1, is_required: true },
  { id: 't2', day_of_week: todayDayOfWeek, start_time: '08:00', end_time: '08:30', activity: '早餐模板', sort_order: 2, is_required: false },
]

const mockUseAuth = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../api/client', () => ({
  scheduleAPI: {
    listByChildAndDate: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    listTemplates: vi.fn(),
    generate: vi.fn(),
  },
  childAPI: {
    list: vi.fn(),
  },
}))

vi.mock('../components/AIAssistant', () => ({
  default: ({ visible }: { visible: boolean }) =>
    visible ? <div data-testid="ai-assistant">AI Assistant</div> : null,
}))

vi.mock('../components/ScheduleTemplateManager', () => ({
  default: () => <div data-testid="template-manager">Template Manager</div>,
}))

import { scheduleAPI, childAPI } from '../api/client'

beforeEach(() => {
  vi.clearAllMocks()
})

function renderPage(role: 'admin' | 'child' = 'admin') {
  mockUseAuth.mockReturnValue(
    role === 'admin'
      ? { role: 'admin', childId: null, childName: null }
      : { role: 'child', childId: 'child-1', childName: '小明' }
  )
  vi.mocked(childAPI.list).mockResolvedValue(mockResponse(mockChildren))
  vi.mocked(scheduleAPI.listByChildAndDate).mockResolvedValue(mockResponse(mockSchedules))
  vi.mocked(scheduleAPI.listTemplates).mockResolvedValue(mockResponse(mockTemplates))
  vi.mocked(scheduleAPI.create).mockResolvedValue(mockResponse({}))
  vi.mocked(scheduleAPI.update).mockResolvedValue(mockResponse({}))
  vi.mocked(scheduleAPI.delete).mockResolvedValue(mockResponse({}))
  vi.mocked(scheduleAPI.generate).mockResolvedValue(mockResponse(mockSchedules))
  return render(<SchedulePage />)
}

describe('SchedulePage', () => {
  describe('admin mode', () => {
    it('renders child selector, date input, and tabs', async () => {
      renderPage()
      await screen.findByDisplayValue(dayjs().format('YYYY-MM-DD'))
      expect(screen.getByText('每日作息')).toBeInTheDocument()
      expect(screen.getByText('作息模板')).toBeInTheDocument()
    })

    it('shows admin action buttons', async () => {
      renderPage()
      await screen.findByText('添加作息')
      expect(screen.getByText('从模板生成')).toBeInTheDocument()
      expect(screen.getByText('AI输入')).toBeInTheDocument()
    })

    it('renders schedule table with schedule data', async () => {
      renderPage()
      expect(await screen.findByText('起床')).toBeInTheDocument()
      expect(screen.getByText('早餐')).toBeInTheDocument()
      expect(screen.getByText('07:00')).toBeInTheDocument()
    })

    it('shows edit/delete buttons in table rows', async () => {
      renderPage()
      await screen.findByText('起床')
      await waitFor(() => {
        expect(screen.getAllByText('编辑').length).toBeGreaterThan(0)
      }, { timeout: 3000 })
      expect(screen.getAllByText('删除').length).toBeGreaterThan(0)
    })

    it('opens create modal on add schedule click', async () => {
      renderPage()
      const btn = await screen.findByText('添加作息')
      const user = userEvent.setup()
      await user.click(btn)
      await waitFor(() => {
        expect(document.querySelector('.ant-modal')).toBeInTheDocument()
      })
    })

    it('shows templates tab content when clicked', async () => {
      renderPage()
      await screen.findByText('每日作息')
      const user = userEvent.setup()
      await user.click(screen.getByText('作息模板'))
      await waitFor(() => {
        expect(screen.getByTestId('template-manager')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('child mode', () => {
    it('hides admin action buttons', async () => {
      renderPage('child')
      await screen.findByText('每日作息')
      expect(screen.queryByText('添加作息')).not.toBeInTheDocument()
      expect(screen.queryByText('从模板生成')).not.toBeInTheDocument()
      expect(screen.queryByText('AI输入')).not.toBeInTheDocument()
    })

    it('hides templates tab', async () => {
      renderPage('child')
      await screen.findByText('每日作息')
      expect(screen.queryByText('作息模板')).not.toBeInTheDocument()
    })

    it('shows status as read-only tags', async () => {
      renderPage('child')
      await screen.findByText('每日作息')
      await screen.findByText('起床')
      const tags = document.querySelectorAll('.ant-table .ant-tag')
      expect(tags.length).toBeGreaterThan(0)
    })

    it('hides edit/delete action column', async () => {
      renderPage('child')
      await screen.findByText('每日作息')
      await screen.findByText('起床')
      expect(screen.queryByText('编辑')).not.toBeInTheDocument()
      expect(screen.queryByText('删除')).not.toBeInTheDocument()
    })
  })

  describe('operations', () => {
    it('deletes a schedule via popconfirm', async () => {
      renderPage()
      await screen.findByText('起床')
      const user = userEvent.setup()
      await user.click(screen.getAllByText('删除')[0])
      expect(await screen.findByText('确定删除?')).toBeInTheDocument()
    })

    it('generates schedules from templates', async () => {
      renderPage()
      await screen.findByText('起床')
      const user = userEvent.setup()
      await user.click(screen.getByText('从模板生成'))
      await screen.findByText('从模板生成作息')
      expect(screen.getByText('起床模板')).toBeInTheDocument()
      expect(screen.getByText('早餐模板')).toBeInTheDocument()
    })

    it('loads schedules on mount', async () => {
      renderPage()
      await screen.findByText('起床')
      const today = dayjs().format('YYYY-MM-DD')
      expect(scheduleAPI.listByChildAndDate).toHaveBeenCalledWith('child-1', today)
    })
  })
})