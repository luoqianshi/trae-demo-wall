import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/appConfig', () => ({
  appConfig: {
    backendApiBaseUrl: '',
  },
}))

vi.mock('@/hooks/useVisionConfig', () => ({
  readVisionConfigFromStorage: vi.fn(() => ({
    baseUrl: 'https://api.example.com/v1',
    apiKey: 'secret',
    model: 'vision-model',
  })),
}))

vi.mock('@/services/vision/realVisionProvider', () => ({
  realVisionProvider: {
    describeFrame: vi.fn().mockRejectedValue(new Error('fail')),
  },
}))

import { describeFrameWithMode } from '@/services/vision/providerAdapter'
import { readVisionConfigFromStorage } from '@/hooks/useVisionConfig'

describe('describeFrameWithMode', () => {
  beforeEach(() => {
    vi.mocked(readVisionConfigFromStorage).mockReturnValue({
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'secret',
      model: 'vision-model',
    })
  })

  it('真实模式失败时回退到模拟模式', async () => {
    const { result, fallbackUsed, status } = await describeFrameWithMode(
      { dataUrl: 'data:image/jpeg;base64,mock', capturedAt: 9000 },
      'real',
    )

    expect(fallbackUsed).toBe(true)
    expect(status).toBe('fallback')
    expect(result.source).toBe('mock')
    expect(result.fallback).toEqual({
      used: true,
      reason: 'real_service_unavailable',
    })
    expect(result.summary.text.length).toBeGreaterThan(0)
    expect(result.events.length).toBeGreaterThan(0)
  })

  it('真实模式未配置时返回未配置状态而不是假装在线', async () => {
    vi.mocked(readVisionConfigFromStorage).mockReturnValue({
      baseUrl: '',
      apiKey: '',
      model: '',
    })

    const { result, fallbackUsed, status } = await describeFrameWithMode(
      { dataUrl: 'data:image/jpeg;base64,mock', capturedAt: 9000 },
      'real',
    )

    expect(fallbackUsed).toBe(true)
    expect(status).toBe('unconfigured')
    expect(result.source).toBe('mock')
    expect(result.fallback).toEqual({
      used: true,
      reason: 'real_service_unavailable',
    })
  })
})
