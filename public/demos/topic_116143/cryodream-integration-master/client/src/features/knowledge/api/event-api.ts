import { apiClient } from '@/lib/api-client'

export interface KnowledgeEvent {
  id: string
  kbId: string
  docId: string
  eventDate: string
  timeGranularity: 'exact' | 'month' | 'year'
  searchIndex: string
  entities: string  // JSON array string
  action: string
  sourceType: 'official' | 'news' | 'social_media'
  confidenceScore: number
  verificationStatus: 'verified' | 'unverified'
  impactInference: string
  sourceUrl: string
  rawText: string
  createTime: string
}

export interface EventGraphNode {
  id: string
  type: 'entity' | 'event'
  label: string
  date?: string
  granularity?: string
  sourceType?: string
  confidenceScore?: number
  verificationStatus?: string
  impactInference?: string
  action?: string
}

export interface EventGraphEdge {
  source: string
  target: string
  label: string
  _color?: string
  _isEntityRelation?: boolean
}

export interface EventGraphData {
  nodes: EventGraphNode[]
  edges: EventGraphEdge[]
  stats: {
    events: number
    entities: number
    edges: number
  }
}

export interface EventTimelineYear {
  year: string
  months: {
    month: string
    events: KnowledgeEvent[]
  }[]
}

export const eventApi = {
  listEvents: (params: { kbId: string; page?: number; pageSize?: number; sourceType?: string; minConfidence?: number; dateFrom?: string; dateTo?: string }) =>
    apiClient.get<{ records: KnowledgeEvent[]; total: number; current: number; size: number }>(`/event/list`, { params }).then(r => r.data),

  getTimeline: (kbId: string) =>
    apiClient.get<EventTimelineYear[]>(`/event/timeline`, { params: { kbId } }).then(r => r.data),

  getGraphData: (kbId: string) =>
    apiClient.get<EventGraphData>(`/event/graph-data`, { params: { kbId } }).then(r => r.data),

  getStats: (kbId: string) =>
    apiClient.get<{ total: number; bySourceType: Record<string, number>; byYear: Record<string, number>; avgConfidence: number }>(`/event/stats`, { params: { kbId } }).then(r => r.data),

  searchEvents: (kbId: string, query: string, limit = 10) =>
    apiClient.get<KnowledgeEvent[]>(`/event/search`, { params: { kbId, query, limit } }).then(r => r.data),

  clearData: (kbId: string) =>
    apiClient.post<boolean>(`/event/clear-data`, null, { params: { kbId } }).then(r => r.data),
}
