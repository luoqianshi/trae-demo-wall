import { apiClient } from '@/lib/api-client'

/** 观点对象 */
export interface KnowledgeOpinion {
  id: string
  kbId: string
  docId?: string
  relations: string  // JSON: {source_entity, target_entities[], interest_alignment}
  context: string    // JSON: {stance[], applicable_stage[]}
  coreThesis: string
  supportingLogic: string  // JSON array
  credibility: string      // JSON: {logic_rigor, expiration_trigger}
  searchIndex?: string
  createTime: string
}

/** 利益相关性枚举 */
export type InterestAlignment = '利益相关' | '利益无关' | '竞争抹黑'

/** 解析后的观点（JSON 字段已解析为对象） */
export interface ParsedOpinion extends Omit<KnowledgeOpinion, 'relations' | 'context' | 'supportingLogic' | 'credibility'> {
  relations: {
    source_entity: string
    target_entities: string[]
    interest_alignment: InterestAlignment | string
  }
  context: {
    stance: string[]
    applicable_stage: string[]
  }
  supportingLogic: string[]
  credibility: {
    logic_rigor: number
    expiration_trigger: string
  }
}

/** 观点统计项 */
export interface OpinionStat {
  alignment: string
  count: number
}

function safeParse<T>(str: string, fallback: T): T {
  if (!str) return fallback
  try {
    return JSON.parse(str) as T
  } catch {
    return fallback
  }
}

/** 将 KnowledgeOpinion 解析为 ParsedOpinion */
export function parseOpinion(opn: KnowledgeOpinion): ParsedOpinion {
  return {
    ...opn,
    relations: safeParse(opn.relations, { source_entity: '', target_entities: [], interest_alignment: '利益无关' }),
    context: safeParse(opn.context, { stance: [], applicable_stage: [] }),
    supportingLogic: safeParse(opn.supportingLogic, []),
    credibility: safeParse(opn.credibility, { logic_rigor: 5, expiration_trigger: '' }),
  }
}

export const opinionApi = {
  /** 观点列表（分页 + 多维筛选） */
  list: async (params: {
    kbId: string
    page?: number
    pageSize?: number
    sourceEntity?: string
    interestAlignment?: string
    stance?: string
    keyword?: string
  }): Promise<{ records: KnowledgeOpinion[]; total: number; current: number; size: number }> => {
    const { kbId, page = 1, pageSize = 20, sourceEntity, interestAlignment, stance, keyword } = params
    const query = new URLSearchParams({ kbId, page: String(page), pageSize: String(pageSize) })
    if (sourceEntity) query.set('sourceEntity', sourceEntity)
    if (interestAlignment) query.set('interestAlignment', interestAlignment)
    if (stance) query.set('stance', stance)
    if (keyword) query.set('keyword', keyword)
    const res = await apiClient.get(`/api/opinion/list?${query.toString()}`)
    return res.data
  },

  /** 观点详情 */
  detail: async (id: string): Promise<KnowledgeOpinion> => {
    const res = await apiClient.get(`/api/opinion/detail?id=${encodeURIComponent(id)}`)
    return res.data
  },

  /** 统计（按利益相关性分组） */
  stats: async (kbId: string): Promise<OpinionStat[]> => {
    const res = await apiClient.get(`/api/opinion/stats?kbId=${encodeURIComponent(kbId)}`)
    return res.data
  },

  /** 删除观点 */
  delete: async (id: string): Promise<boolean> => {
    const res = await apiClient.post('/api/opinion/delete', { id })
    return res.data
  },

  /** 清空观点数据 */
  clearData: async (kbId: string): Promise<boolean> => {
    const res = await apiClient.post('/api/opinion/clear-data', { kbId })
    return res.data
  },
}
