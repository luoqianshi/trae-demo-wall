import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/useVisionConfig', () => ({
  readVisionConfigFromStorage: vi.fn(() => ({
    baseUrl: 'https://api.example.com/v1',
    apiKey: 'secret',
    model: 'vision-model',
  })),
}))

import { realVisionProvider } from '@/services/vision/realVisionProvider'

describe('realVisionProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('通过本地代理请求真实识别结果', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        text: '脚下前方有减速带边缘。右前方有人经过。',
        summary: { text: '脚下前方有减速带边缘。' },
        detail: { text: '右前方有人经过。' },
        events: [
          {
            type: 'ground_obstacle',
            priority: 'high',
            confidence: 0.95,
            direction: 'underfoot_front',
            headline: '脚下前方有减速带边缘',
            guidance: '抬脚通过更安全',
          },
        ],
        overallPriority: 'high',
        guidance: '抬脚通过更安全',
        source: 'real',
        capturedAt: 3000,
        confidence: 0.95,
        fallback: { used: false },
      }),
    } as Response)

    const result = await realVisionProvider.describeFrame({
      dataUrl: 'data:image/jpeg;base64,mock',
      capturedAt: 3000,
    })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/vision/analyze',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,mock',
          capturedAt: 3000,
          config: {
            baseUrl: 'https://api.example.com/v1',
            apiKey: 'secret',
            model: 'vision-model',
          },
        }),
      }),
    )
    expect(result.source).toBe('real')
    expect(result.summary.text).toContain('减速带')
  })
})
