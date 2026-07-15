import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RFIDBindingManager from './RFIDBindingManager'

const mockResponse = (data: any) => ({
  data, status: 200, statusText: 'OK', headers: {}, config: {} as any,
})

const mockBindings = [
  { id: '1', rfid_uid: 'A1B2C3', child_id: 'child1', label: '红色卡' },
  { id: '2', rfid_uid: 'D4E5F6', child_id: 'child2', label: '蓝色卡' },
]
const mockChildren = [
  { id: 'child1', name: '小明' },
  { id: 'child2', name: '小红' },
]

const mockApiStore = vi.hoisted(() => ({
  rfidAPI: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  childAPI: { list: vi.fn() },
}))

vi.mock('../api/client', () => mockApiStore)

import { rfidAPI, childAPI } from '../api/client'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('RFIDBindingManager', () => {
  it('renders table and fetches data on mount', async () => {
    vi.mocked(rfidAPI.list).mockResolvedValue(mockResponse(mockBindings))
    vi.mocked(childAPI.list).mockResolvedValue(mockResponse(mockChildren))
    render(<RFIDBindingManager />)
    expect(screen.getByText('绑定RFID卡')).toBeInTheDocument()
    expect(await screen.findByText('A1B2C3')).toBeInTheDocument()
    expect(screen.getByText('D4E5F6')).toBeInTheDocument()
  })

  it('renders child name instead of child_id', async () => {
    vi.mocked(rfidAPI.list).mockResolvedValue(mockResponse(mockBindings))
    vi.mocked(childAPI.list).mockResolvedValue(mockResponse(mockChildren))
    render(<RFIDBindingManager />)
    expect(await screen.findByText('小明')).toBeInTheDocument()
    expect(screen.getByText('小红')).toBeInTheDocument()
  })

  it('opens create modal on button click', async () => {
    vi.mocked(rfidAPI.list).mockResolvedValue(mockResponse(mockBindings))
    vi.mocked(childAPI.list).mockResolvedValue(mockResponse(mockChildren))
    render(<RFIDBindingManager />)
    await userEvent.click(await screen.findByText('绑定RFID卡'))
    expect(await screen.findByText('RFID卡UID')).toBeInTheDocument()
  })

  it('opens edit modal on edit button click', async () => {
    vi.mocked(rfidAPI.list).mockResolvedValue(mockResponse(mockBindings))
    vi.mocked(childAPI.list).mockResolvedValue(mockResponse(mockChildren))
    render(<RFIDBindingManager />)
    const buttons = await screen.findAllByText('编辑')
    await userEvent.click(buttons[0])
    expect(await screen.findByText('编辑RFID绑定')).toBeInTheDocument()
  })
})