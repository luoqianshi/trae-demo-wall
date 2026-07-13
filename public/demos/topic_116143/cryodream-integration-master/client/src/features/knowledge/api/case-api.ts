import { apiClient } from '@/lib/api-client'

export interface CaseCredibility {
  source_nature: 'official_report' | 'first_hand_review' | 'third_party_analysis' | 'PR_article'
  authenticity_score: number
  survivorship_bias_warning: string
}

export interface CaseAttachment {
  type: 'document' | 'screenshot' | 'link' | 'code'
  name: string
  url: string
}

export interface CaseData {
  title: string
  context: {
    industry: string[]
    business_model: string[]
    company_stage: string[]
    target_audience: string[]
  }
  problem: {
    symptom_summary: string
    root_causes: string[]
  }
  solution: {
    strategy_type: string[]
    execution_steps: string[]
  }
  outcome: {
    result_summary: string
    key_success_factors: string[]
  }
  credibility: CaseCredibility
  attachments: CaseAttachment[]
  search_index: string
}

export interface KnowledgeCase {
  id: string
  kbId: string
  sourceDocId: string
  caseData: string | CaseData
  searchIndex: string
  createTime: string
}

export interface CaseDetail {
  id: string
  kbId: string
  sourceDocId: string
  caseData: CaseData | string
  searchIndex: string
  createTime: string
}

export interface CaseStats {
  total: number
  byIndustry: Record<string, number>
  avgAuthenticity: number
}

export const caseApi = {
  listCases: (params: { kbId: string; page?: number; pageSize?: number; industry?: string; businessModel?: string; minAuthenticity?: number }) =>
    apiClient.get<{ records: KnowledgeCase[]; total: number }>(`/case/list`, { params }).then(r => r.data),

  searchCases: (params: { kbId: string; query: string; industry?: string[]; businessModel?: string[]; minAuthenticity?: number; limit?: number }) =>
    apiClient.get<KnowledgeCase[]>(`/case/search`, { params }).then(r => r.data),

  getCaseDetail: (caseId: string) =>
    apiClient.get<CaseDetail>(`/case/detail`, { params: { caseId } }).then(r => r.data),

  getStats: (kbId: string) =>
    apiClient.get<CaseStats>(`/case/stats`, { params: { kbId } }).then(r => r.data),

  clearData: (kbId: string) =>
    apiClient.post<boolean>(`/case/clear-data`, null, { params: { kbId } }).then(r => r.data),
}
