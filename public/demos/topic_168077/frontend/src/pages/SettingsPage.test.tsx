import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPage from './SettingsPage'

const mockResponse = (data: any) => ({
  data, status: 200, statusText: 'OK', headers: {}, config: {} as any,
})

const mockSettings = {
  mqtt: { broker: 'mqtt://test.io:1883', username: 'test', password: 'pass', client_id: 'client1', topic_prefix: 'prefix' },
  ai: { api_endpoint: 'https://api.test.com/v1/chat', api_key: 'sk-test', model: 'gpt-4' },
}

const mockUseAuth = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../api/client', () => ({
  settingsAPI: {
    get: vi.fn(),
    update: vi.fn(),
  },
}))

import { settingsAPI } from '../api/client'

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ role: 'admin', childId: null, childName: null })
  vi.mocked(settingsAPI.get).mockResolvedValue(mockResponse(mockSettings))
  vi.mocked(settingsAPI.update).mockResolvedValue(mockResponse({}))
})

describe('SettingsPage', () => {
  describe('admin mode', () => {
    it('renders MQTT and AI setting cards', async () => {
      render(<SettingsPage />)
      expect(await screen.findByText('MQTT 服务器设置')).toBeInTheDocument()
      expect(screen.getByText('AI API 接口设置')).toBeInTheDocument()
    })

    it('loads and displays MQTT settings', async () => {
      render(<SettingsPage />)
      await screen.findByText('MQTT 服务器设置')
      await waitFor(() => {
        expect(screen.getByDisplayValue('mqtt://test.io:1883')).toBeInTheDocument()
      })
      expect(screen.getByDisplayValue('test')).toBeInTheDocument()
      expect(screen.getByDisplayValue('client1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('prefix')).toBeInTheDocument()
    })

    it('loads and displays AI settings', async () => {
      render(<SettingsPage />)
      await screen.findByText('MQTT 服务器设置')
      await waitFor(() => {
        expect(screen.getByDisplayValue('https://api.test.com/v1/chat')).toBeInTheDocument()
      })
      expect(screen.getByDisplayValue('gpt-4')).toBeInTheDocument()
    })

    it('saves MQTT settings', async () => {
      render(<SettingsPage />)
      await screen.findByDisplayValue('mqtt://test.io:1883')
      const user = userEvent.setup()
      await user.click(screen.getByText('保存 MQTT 设置'))
      await waitFor(() => {
        expect(settingsAPI.update).toHaveBeenCalled()
      })
    })

    it('saves AI settings', async () => {
      render(<SettingsPage />)
      await screen.findByDisplayValue('https://api.test.com/v1/chat')
      const user = userEvent.setup()
      await user.click(screen.getByText('保存 AI 设置'))
      await waitFor(() => {
        expect(settingsAPI.update).toHaveBeenCalled()
      })
    })

    it('shows test connection button', async () => {
      render(<SettingsPage />)
      await screen.findByText('MQTT 服务器设置')
      expect(screen.getByText('测试连接')).toBeInTheDocument()
    })
  })

  describe('child mode', () => {
    it('shows 403 result', async () => {
      mockUseAuth.mockReturnValue({ role: 'child', childId: '1', childName: '小明' })
      render(<SettingsPage />)
      expect(await screen.findByText('无权限')).toBeInTheDocument()
      expect(screen.getByText('孩子模式下无法访问系统设置')).toBeInTheDocument()
      expect(screen.queryByText('MQTT 服务器设置')).not.toBeInTheDocument()
    })
  })
})