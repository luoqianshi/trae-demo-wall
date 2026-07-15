import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import BirthdayReminder from './BirthdayReminder'

const mockChildList = vi.fn()
const mockBirthdayUpcoming = vi.fn()

vi.mock('../api/client', () => ({
  childAPI: { list: (...args: any[]) => mockChildList(...args) },
  birthdayAPI: { upcoming: (...args: any[]) => mockBirthdayUpcoming(...args) },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('BirthdayReminder', () => {
  it('renders birthday icon', async () => {
    mockChildList.mockResolvedValue({ data: [] })
    render(<BirthdayReminder />)
    // Should render the GiftOutlined icon
    expect(document.querySelector('.anticon-gift')).toBeInTheDocument()
  })

  it('shows empty state when no children', async () => {
    mockChildList.mockResolvedValue({ data: [] })
    render(<BirthdayReminder />)
    // Icon should still render
    expect(document.querySelector('.anticon-gift')).toBeInTheDocument()
  })

  it('shows empty state when children have no birthdays', async () => {
    mockChildList.mockResolvedValue({ data: [{ id: '1', name: '小明', birthday: null }] })
    render(<BirthdayReminder />)
    expect(document.querySelector('.anticon-gift')).toBeInTheDocument()
  })

  it('loads upcoming birthdays for children with birthdays', async () => {
    mockChildList.mockResolvedValue({ data: [{ id: '1', name: '小明', birthday: '2018-06-30' }] })
    mockBirthdayUpcoming.mockResolvedValue({
      data: [{ birthday: '2018-06-30', age: 8, next_birthday: '2027-06-30', days_until: 0 }],
    })
    render(<BirthdayReminder />)
    expect(document.querySelector('.anticon-gift')).toBeInTheDocument()
    await waitFor(() => {
      expect(mockBirthdayUpcoming).toHaveBeenCalledWith(['2018-06-30'])
    })
  })

  it('handles API error silently', async () => {
    mockChildList.mockRejectedValue(new Error('Network error'))
    render(<BirthdayReminder />)
    expect(document.querySelector('.anticon-gift')).toBeInTheDocument()
  })
})