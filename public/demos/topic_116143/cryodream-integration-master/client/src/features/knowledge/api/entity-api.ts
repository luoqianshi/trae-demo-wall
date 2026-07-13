import { apiClient } from '@/lib/api-client'

/** 实体类型 */
export type EntityType = 'Person' | 'Company' | 'Product' | 'Concept'

/** 实体对象 */
export interface KnowledgeEntity {
  id: string
  kbId: string
  name: string
  type: EntityType | string
  aliases: string  // JSON array string
  description: string
  metadata: string  // JSON object string
  createTime: string
  updateTime: string
}

/** 实体穿透查询结果 */
export interface EntityDetail {
  entity: KnowledgeEntity & {
    aliases?: string[]
    metadata?: Record<string, unknown>
  }
  relatedEvents: Array<{
    id: string
    date: string
    granularity: string
    action: string
    entities: string
    sourceType: string
    confidenceScore: number
    impactInference: string
  }>
  eventCount: number
  relatedCases: Array<{
    id: string
    caseData: string
    searchIndex: string
  }>
  caseCount: number
}

/** 实体统计项 */
export interface EntityStat {
  type: string
  count: number
}

export const entityApi = {
  /** 实体列表（分页 + 类型筛选 + 关键词搜索） */
  list: async (params: {
    kbId: string
    page?: number
    pageSize?: number
    type?: string
    keyword?: string
  }): Promise<{ records: KnowledgeEntity[]; total: number; current: number; size: number }> => {
    const { kbId, page = 1, pageSize = 20, type, keyword } = params
    const query = new URLSearchParams({ kbId, page: String(page), pageSize: String(pageSize) })
    if (type) query.set('type', type)
    if (keyword) query.set('keyword', keyword)
    const res = await apiClient.get(`/api/entity/list?${query.toString()}`)
    return res.data
  },

  /** 实体统计 */
  stats: async (kbId: string): Promise<EntityStat[]> => {
    const res = await apiClient.get(`/api/entity/stats?kbId=${encodeURIComponent(kbId)}`)
    return res.data
  },

  /** 实体穿透查询 */
  detail: async (id: string): Promise<EntityDetail> => {
    const res = await apiClient.get(`/api/entity/detail?id=${encodeURIComponent(id)}`)
    return res.data
  },

  /** 创建实体 */
  create: async (payload: {
    kbId: string
    name: string
    type?: string
    aliases?: string[]
    description?: string
    metadata?: Record<string, unknown>
  }): Promise<KnowledgeEntity> => {
    const res = await apiClient.post('/api/entity/create', payload)
    return res.data
  },

  /** 更新实体 */
  update: async (payload: {
    id: string
    name?: string
    type?: string
    description?: string
    aliases?: string[]
    metadata?: Record<string, unknown>
  }): Promise<boolean> => {
    const res = await apiClient.post('/api/entity/update', payload)
    return res.data
  },

  /** 删除实体 */
  delete: async (id: string): Promise<boolean> => {
    const res = await apiClient.post('/api/entity/delete', { id })
    return res.data
  },
}
