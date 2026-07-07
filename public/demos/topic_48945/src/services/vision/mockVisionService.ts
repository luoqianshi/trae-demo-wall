import type {
  FramePayload,
  NarrationResult,
  NarrationEvent,
  VisionProvider,
} from '@/services/vision/types'

interface MockNarrationScenario {
  summary: string
  detail?: string
  guidance?: string
  overallPriority: NarrationResult['overallPriority']
  confidence: number
  events: NarrationEvent[]
}

const mockNarrations: MockNarrationScenario[] = [
  {
    summary: '脚下前方有减速带边缘，抬脚通过更安全。',
    detail: '右前方有行人缓慢靠近，左侧人行道更顺畅。',
    guidance: '请稍微放慢脚步，从左侧留出通过空间。',
    overallPriority: 'high',
    confidence: 0.95,
    events: [
      {
        type: 'ground_obstacle',
        priority: 'high',
        confidence: 0.96,
        direction: 'underfoot_front',
        headline: '脚下前方有减速带边缘',
        guidance: '抬脚通过更安全',
      },
      {
        type: 'dynamic_approach',
        priority: 'medium',
        confidence: 0.89,
        direction: 'right_front',
        headline: '右前方有行人缓慢靠近',
        guidance: '从左侧留出通过空间',
      },
    ],
  },
  {
    summary: '前方路线保持通畅，可以继续直行。',
    detail: '右侧是一排店铺，左前方有树荫区，空间较开阔。',
    guidance: '保持当前方向，注意右侧零散驻足人群。',
    overallPriority: 'low',
    confidence: 0.93,
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
  },
  {
    summary: '前方三米左右接近路口，准备判断左右来向。',
    detail: '左前方有花坛收窄通道，建议稍向右保持直线。',
    guidance: '请提前减速，到路口前再确认通行方向。',
    overallPriority: 'medium',
    confidence: 0.9,
    events: [
      {
        type: 'route_node',
        priority: 'medium',
        confidence: 0.92,
        direction: 'front',
        headline: '前方三米左右接近路口',
        guidance: '提前减速并判断左右来向',
      },
      {
        type: 'space_change',
        priority: 'low',
        confidence: 0.86,
        direction: 'left_front',
        headline: '左前方花坛让通道略微收窄',
        guidance: '稍向右保持直线',
      },
    ],
  },
  {
    summary: '右前方有自行车快速接近，请先让行。',
    detail: '前方行人正在交错通过，原地稍停会更稳妥。',
    guidance: '请先停半步，等右前方通过后再继续。',
    overallPriority: 'high',
    confidence: 0.88,
    events: [
      {
        type: 'dynamic_approach',
        priority: 'high',
        confidence: 0.9,
        direction: 'right_front',
        headline: '右前方有自行车快速接近',
        guidance: '先让行',
      },
      {
        type: 'dynamic_approach',
        priority: 'medium',
        confidence: 0.84,
        direction: 'front',
        headline: '前方行人正在交错通过',
        guidance: '原地稍停更稳妥',
      },
    ],
  },
  {
    summary: '前方情况判断不够稳定，请放慢脚步。',
    detail: '画面中有反光和人流遮挡，暂时无法确认脚下是否完全平整。',
    guidance: '建议减速并用手杖或脚尖先确认前方。',
    overallPriority: 'high',
    confidence: 0.58,
    events: [
      {
        type: 'uncertain',
        priority: 'high',
        confidence: 0.58,
        direction: 'front',
        headline: '前方情况判断不够稳定',
        guidance: '请放慢脚步并先确认地面',
      },
    ],
  },
]

export class MockVisionService implements VisionProvider {
  async describeFrame(frame: FramePayload): Promise<NarrationResult> {
    const index = Math.abs(Math.floor(frame.capturedAt / 3000)) % mockNarrations.length
    const scenario = mockNarrations[index]

    return {
      text: scenario.detail ? `${scenario.summary} ${scenario.detail}` : scenario.summary,
      summary: {
        text: scenario.summary,
      },
      detail: scenario.detail
        ? {
            text: scenario.detail,
          }
        : undefined,
      events: scenario.events,
      overallPriority: scenario.overallPriority,
      guidance: scenario.guidance,
      source: 'mock',
      capturedAt: frame.capturedAt,
      confidence: scenario.confidence,
      fallback: {
        used: false,
      },
    }
  }
}

export const mockVisionService = new MockVisionService()
