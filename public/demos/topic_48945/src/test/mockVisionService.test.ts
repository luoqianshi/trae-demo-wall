import { describe, expect, it } from 'vitest'
import { mockVisionService } from '@/services/vision/mockVisionService'

describe('mockVisionService', () => {
  it('返回稳定的结构化户外步行描述', async () => {
    const result = await mockVisionService.describeFrame({
      dataUrl: 'data:image/jpeg;base64,mock',
      capturedAt: 6000,
    })

    expect(result.source).toBe('mock')
    expect(result.summary.text.length).toBeGreaterThan(0)
    expect(result.text).toContain(result.summary.text)
    expect(result.events.length).toBeGreaterThan(0)
    expect(result.events[0]?.type).toBe('route_node')
    expect(result.events[0]?.direction).toBe('front')
    expect(result.overallPriority).toBe('medium')
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.fallback).toEqual({ used: false })
    expect(result.capturedAt).toBe(6000)
  })
})
