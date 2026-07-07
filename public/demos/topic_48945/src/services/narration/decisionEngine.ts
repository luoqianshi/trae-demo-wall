import type { NarrationEvent, NarrationIntensity, NarrationPriority, NarrationResult } from '@/services/vision/types'

export interface NarrationDecisionState {
  lastAnnouncedAt: number | null
  lastAnnouncedPriority: NarrationPriority | null
  lastAnnouncedEventKeys: string[]
}

export interface NarrationDecision {
  result: NarrationResult
  shouldAnnounce: boolean
  state: NarrationDecisionState
  reason: 'announce' | 'duplicate' | 'low_priority_gated' | 'medium_priority_gated' | 'quiet_mode_gated'
}

export interface NarrationDecisionOptions {
  intensity?: NarrationIntensity
}

const priorityWeights: Record<NarrationPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

const eventTypeWeights: Record<NarrationEvent['type'], number> = {
  uncertain: 5,
  ground_obstacle: 4,
  dynamic_approach: 3,
  route_node: 2,
  space_change: 1,
}

const duplicateWindowMs = 12_000
const mediumAnnouncementGapMs = 4_500
const lowAnnouncementGapMs = 9_000
const uncertainConfidenceThreshold = 0.68
const eventUncertainConfidenceThreshold = 0.62
const mediumAnnouncementConfidenceThreshold = 0.72
const lowAnnouncementConfidenceThreshold = 0.82

export const initialNarrationDecisionState: NarrationDecisionState = {
  lastAnnouncedAt: null,
  lastAnnouncedPriority: null,
  lastAnnouncedEventKeys: [],
}

function normalizeHeadline(text: string) {
  return text.replace(/[\s，。、“”‘’：；！？,.!?、0-9]/g, '').slice(0, 18)
}

function buildEventKey(event: NarrationEvent) {
  return [event.type, event.direction ?? 'front', normalizeHeadline(event.headline)].join('|')
}

export function sortNarrationEvents(events: NarrationEvent[]) {
  return [...events].sort((left, right) => {
    const priorityDelta = priorityWeights[right.priority] - priorityWeights[left.priority]

    if (priorityDelta !== 0) {
      return priorityDelta
    }

    const typeDelta = eventTypeWeights[right.type] - eventTypeWeights[left.type]

    if (typeDelta !== 0) {
      return typeDelta
    }

    return right.confidence - left.confidence
  })
}

function toUncertainNarration(result: NarrationResult) {
  const sortedEvents = sortNarrationEvents(result.events)
  const leadEvent = sortedEvents[0]
  const uncertainEvent: NarrationEvent = {
    type: 'uncertain',
    priority: 'high',
    confidence: Math.min(result.confidence, leadEvent?.confidence ?? result.confidence),
    direction: leadEvent?.direction ?? 'front',
    headline: '当前识别把握不足',
    guidance: '识别把握不足，请放慢脚步。',
  }
  const summaryText = result.summary.text || '前方环境识别把握不足。'
  const detailText = result.detail?.text
  const events = sortNarrationEvents([uncertainEvent, ...sortedEvents.filter((event) => buildEventKey(event) !== buildEventKey(uncertainEvent))])

  return {
    ...result,
    text: detailText ? `${summaryText} ${detailText}` : summaryText,
    summary: {
      text: summaryText,
    },
    detail: detailText
      ? {
          text: detailText,
        }
      : undefined,
    events,
    overallPriority: 'high' as const,
    guidance: uncertainEvent.guidance,
    confidence: Math.min(result.confidence, leadEvent?.confidence ?? result.confidence),
  }
}

export function normalizeNarrationResult(result: NarrationResult) {
  const sortedEvents = sortNarrationEvents(result.events)
  const normalizedResult = {
    ...result,
    events: sortedEvents,
    overallPriority: sortedEvents[0]?.priority ?? result.overallPriority,
  }
  const leadEvent = sortedEvents[0]
  const shouldUseUncertainNarration =
    normalizedResult.confidence < uncertainConfidenceThreshold ||
    leadEvent?.type === 'uncertain' ||
    (leadEvent?.confidence ?? 1) < eventUncertainConfidenceThreshold

  return shouldUseUncertainNarration ? toUncertainNarration(normalizedResult) : normalizedResult
}

function isDuplicateNarration(result: NarrationResult, state: NarrationDecisionState, now: number) {
  if (!state.lastAnnouncedAt || now - state.lastAnnouncedAt > duplicateWindowMs) {
    return false
  }

  const currentKeys = result.events.slice(0, 2).map(buildEventKey)

  if (currentKeys.length === 0) {
    return false
  }

  return currentKeys.some((key) => state.lastAnnouncedEventKeys.includes(key))
}

function buildNextState(result: NarrationResult, now: number): NarrationDecisionState {
  return {
    lastAnnouncedAt: now,
    lastAnnouncedPriority: result.events[0]?.priority ?? result.overallPriority,
    lastAnnouncedEventKeys: result.events.slice(0, 2).map(buildEventKey),
  }
}

export function evaluateNarrationDecision(
  result: NarrationResult,
  state: NarrationDecisionState,
  now = result.capturedAt,
  options: NarrationDecisionOptions = {},
): NarrationDecision {
  const normalizedResult = normalizeNarrationResult(result)
  const leadEvent = normalizedResult.events[0]
  const intensity = options.intensity ?? 'standard'

  if (!leadEvent) {
    return {
      result: normalizedResult,
      shouldAnnounce: false,
      state,
      reason: 'low_priority_gated',
    }
  }

  if (isDuplicateNarration(normalizedResult, state, now)) {
    return {
      result: normalizedResult,
      shouldAnnounce: false,
      state,
      reason: 'duplicate',
    }
  }

  const elapsed = state.lastAnnouncedAt === null ? Number.POSITIVE_INFINITY : now - state.lastAnnouncedAt

  if (leadEvent.priority === 'high') {
    return {
      result: normalizedResult,
      shouldAnnounce: true,
      state: buildNextState(normalizedResult, now),
      reason: 'announce',
    }
  }

  if (intensity === 'quiet' && leadEvent.type !== 'route_node') {
    return {
      result: normalizedResult,
      shouldAnnounce: false,
      state,
      reason: 'quiet_mode_gated',
    }
  }

  if (leadEvent.priority === 'medium') {
    const shouldAnnounce =
      leadEvent.confidence >= mediumAnnouncementConfidenceThreshold && elapsed >= mediumAnnouncementGapMs

    return {
      result: normalizedResult,
      shouldAnnounce,
      state: shouldAnnounce ? buildNextState(normalizedResult, now) : state,
      reason: shouldAnnounce ? 'announce' : 'medium_priority_gated',
    }
  }

  const shouldAnnounce =
    leadEvent.confidence >= lowAnnouncementConfidenceThreshold && elapsed >= lowAnnouncementGapMs

  return {
    result: normalizedResult,
    shouldAnnounce,
    state: shouldAnnounce ? buildNextState(normalizedResult, now) : state,
    reason: shouldAnnounce ? 'announce' : 'low_priority_gated',
  }
}
