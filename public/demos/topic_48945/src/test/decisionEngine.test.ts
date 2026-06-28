import { describe, expect, it } from 'vitest'
import {
  evaluateNarrationDecision,
  initialNarrationDecisionState,
  normalizeNarrationResult,
  sortNarrationEvents,
} from '@/services/narration/decisionEngine'
import type { NarrationResult } from '@/services/vision/types'

function createResult(overrides?: Partial<NarrationResult>): NarrationResult {
  return {
    text: '前方三米左右接近路口。',
    summary: {
      text: '前方三米左右接近路口。',
    },
    events: [
      {
        type: 'route_node',
        priority: 'medium',
        confidence: 0.9,
        direction: 'front',
        headline: '前方三米左右接近路口',
        guidance: '提前减速并判断左右来向',
      },
      {
        type: 'space_change',
        priority: 'low',
        confidence: 0.88,
        direction: 'left_front',
        headline: '左前方花坛让通道略微收窄',
        guidance: '稍向右保持直线',
      },
    ],
    overallPriority: 'medium',
    guidance: '提前减速并判断左右来向',
    source: 'mock',
    capturedAt: 3_000,
    confidence: 0.9,
    fallback: {
      used: false,
    },
    ...overrides,
  }
}

describe('decisionEngine', () => {
  it('按优先级和事件类型排序，优先播报高风险事件', () => {
    const result = createResult({
      events: [
        {
          type: 'space_change',
          priority: 'low',
          confidence: 0.98,
          direction: 'front',
          headline: '前方空间开阔',
        },
        {
          type: 'dynamic_approach',
          priority: 'high',
          confidence: 0.82,
          direction: 'right_front',
          headline: '右前方有自行车快速接近',
        },
        {
          type: 'route_node',
          priority: 'medium',
          confidence: 0.95,
          direction: 'front',
          headline: '前方接近路口',
        },
      ],
      overallPriority: 'low',
    })

    const sorted = sortNarrationEvents(result.events)

    expect(sorted[0]?.type).toBe('dynamic_approach')
    expect(normalizeNarrationResult(result).overallPriority).toBe('high')
  })

  it('对近似事件去重，避免短时间重复播报', () => {
    const firstDecision = evaluateNarrationDecision(createResult(), initialNarrationDecisionState, 3_000)
    const secondDecision = evaluateNarrationDecision(
      createResult({ capturedAt: 6_000 }),
      firstDecision.state,
      6_000,
    )

    expect(firstDecision.shouldAnnounce).toBe(true)
    expect(secondDecision.shouldAnnounce).toBe(false)
    expect(secondDecision.reason).toBe('duplicate')
  })

  it('低优先级结果在静默窗口内不触发播报', () => {
    const decision = evaluateNarrationDecision(
      createResult({
        text: '前方路线保持通畅。',
        summary: {
          text: '前方路线保持通畅。',
        },
        events: [
          {
            type: 'space_change',
            priority: 'low',
            confidence: 0.91,
            direction: 'front',
            headline: '前方路线保持通畅',
            guidance: '可以继续直行',
          },
        ],
        overallPriority: 'low',
        guidance: '可以继续直行',
      }),
      {
        lastAnnouncedAt: 4_000,
        lastAnnouncedPriority: 'medium',
        lastAnnouncedEventKeys: ['route_node|front|前方三米左右接近路口'],
      },
      10_000,
    )

    expect(decision.shouldAnnounce).toBe(false)
    expect(decision.reason).toBe('low_priority_gated')
  })

  it('安静模式会收起普通环境变化，只保留高风险与关键节点', () => {
    const lowDecision = evaluateNarrationDecision(
      createResult({
        events: [
          {
            type: 'space_change',
            priority: 'low',
            confidence: 0.94,
            direction: 'front',
            headline: '前方道路变得开阔',
            guidance: '保持直行',
          },
        ],
        overallPriority: 'low',
      }),
      initialNarrationDecisionState,
      8_000,
      { intensity: 'quiet' },
    )

    const routeDecision = evaluateNarrationDecision(
      createResult({
        events: [
          {
            type: 'route_node',
            priority: 'medium',
            confidence: 0.88,
            direction: 'front',
            headline: '前方接近路口',
            guidance: '请提前减速后确认左右来向',
          },
        ],
        overallPriority: 'medium',
      }),
      initialNarrationDecisionState,
      9_000,
      { intensity: 'quiet' },
    )

    expect(lowDecision.shouldAnnounce).toBe(false)
    expect(lowDecision.reason).toBe('quiet_mode_gated')
    expect(routeDecision.shouldAnnounce).toBe(true)
  })

  it('低置信度结果会转成明确不确定提示', () => {
    const decision = evaluateNarrationDecision(
      createResult({
        confidence: 0.56,
        text: '画面中有反光和遮挡。',
        summary: {
          text: '画面中有反光和遮挡。',
        },
        detail: {
          text: '暂时无法确认脚下是否平整。',
        },
      }),
      initialNarrationDecisionState,
      12_000,
    )

    expect(decision.shouldAnnounce).toBe(true)
    expect(decision.result.summary.text).toBe('画面中有反光和遮挡。')
    expect(decision.result.guidance).toContain('识别把握不足')
    expect(decision.result.events[0]?.type).toBe('uncertain')
    expect(decision.result.overallPriority).toBe('high')
  })

  it('当前方环境内容近似重复时，前端门控层应保持静默', () => {
    const decision = evaluateNarrationDecision(
      createResult({
        summary: { text: '前方通道保持通畅，脚下地面较平整。' },
        events: [
          {
            type: 'space_change',
            priority: 'low',
            confidence: 0.91,
            direction: 'front',
            headline: '前方通道保持通畅',
          },
        ],
      }),
      {
        lastAnnouncedAt: 14_000,
        lastAnnouncedPriority: 'low',
        lastAnnouncedEventKeys: ['space_change|front|前方通道保持通畅'],
      },
      15_000,
    )

    expect(decision.shouldAnnounce).toBe(false)
    expect(decision.reason).toBe('duplicate')
  })
})
