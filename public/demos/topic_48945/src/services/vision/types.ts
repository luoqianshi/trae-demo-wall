export type VisionMode = 'mock' | 'real'

export type NarrationIntensity = 'standard' | 'quiet'

export type VisionProviderStatus = 'unconfigured' | 'saved' | 'valid' | 'invalid'

export type NarrationEventType =
  | 'ground_obstacle'
  | 'dynamic_approach'
  | 'route_node'
  | 'space_change'
  | 'uncertain'

export type NarrationPriority = 'high' | 'medium' | 'low'

export type NarrationDirection =
  | 'front'
  | 'left_front'
  | 'right_front'
  | 'left'
  | 'right'
  | 'underfoot_front'
  | 'behind'

export type VisionFallbackReason =
  | 'real_service_unavailable'
  | 'real_service_http_error'
  | 'real_service_invalid_response'

export interface FramePayload {
  dataUrl: string
  capturedAt: number
}

export interface NarrationLayer {
  text: string
}

export interface NarrationEvent {
  type: NarrationEventType
  priority: NarrationPriority
  confidence: number
  direction?: NarrationDirection
  headline: string
  guidance?: string
}

export interface NarrationResult {
  text: string
  summary: NarrationLayer
  detail?: NarrationLayer
  events: NarrationEvent[]
  overallPriority: NarrationPriority
  guidance?: string
  source: VisionMode
  capturedAt: number
  confidence: number
  fallback?: {
    used: boolean
    reason?: VisionFallbackReason
  }
}

export interface RealVisionRequestPayload {
  image: string
  capturedAt: number
  scene: 'outdoor_navigation'
  locale: 'zh-CN'
  responseFormat: 'structured_narration_v1'
  prompt: string
}

export interface RealVisionResponsePayload {
  summary?: string
  detail?: string
  text?: string
  primaryText?: string
  secondaryText?: string
  guidance?: string
  confidence?: number
  overallPriority?: NarrationPriority
  events?: Array<{
    type?: NarrationEventType
    priority?: NarrationPriority
    confidence?: number
    direction?: NarrationDirection
    headline?: string
    guidance?: string
  }>
  narration?: {
    primaryText?: string
    secondaryText?: string
    guidance?: string
    confidence?: number
    overallPriority?: NarrationPriority
    events?: Array<{
      type?: NarrationEventType
      priority?: NarrationPriority
      confidence?: number
      direction?: NarrationDirection
      headline?: string
      guidance?: string
    }>
  }
}

export interface VisionProvider {
  describeFrame: (frame: FramePayload) => Promise<NarrationResult>
}
