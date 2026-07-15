import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import FestivalBanner from './FestivalBanner'

const mockApiGet = vi.fn()
vi.mock('../api/client', () => ({
  default: { get: (...args: any[]) => mockApiGet(...args) },
}))

const mockFestivalData = {
  festivals: [
    { key: 'children-day', name: '儿童节', type: 'solar', theme: 'children-day' },
  ],
  theme: 'children-day',
  label: '🎈 儿童节快乐！',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('FestivalBanner', () => {
  it('renders when festival data is returned', async () => {
    mockApiGet.mockResolvedValue({ data: mockFestivalData })
    render(<FestivalBanner />)
    expect(await screen.findByText('🎈 儿童节快乐！')).toBeInTheDocument()
  })

  it('renders multiple festival names', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        festivals: [
          { key: 'spring-festival', name: '春节', type: 'lunar', theme: 'spring-festival' },
          { key: 'new-year', name: '元旦', type: 'solar', theme: 'new-year' },
        ],
        theme: 'spring-festival',
        label: '🧧 春节',
      },
    })
    render(<FestivalBanner />)
    expect(await screen.findByText('🧧 春节')).toBeInTheDocument()
  })

  it('returns null when no festivals', async () => {
    mockApiGet.mockResolvedValue({ data: { festivals: [], theme: 'default', label: '' } })
    const { container } = render(<FestivalBanner />)
    expect(container.innerHTML).toBe('')
  })

  it('handles API error silently', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'))
    const { container } = render(<FestivalBanner />)
    // Should render nothing on error
    expect(container.innerHTML).toBe('')
  })
})