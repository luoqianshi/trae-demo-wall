import request from './request'

export interface IdentifyRecord {
  id: number
  user_id: number | null
  image_url: string
  jade_type: string
  light_mode: string
  is_authentic: boolean | null
  confidence: number | null
  features: string | null
  suggestion: string | null
  status: string
  created_at: string
}

export interface StatsData {
  total_identifies: number
  today_identifies: number
  total_users: number
  ai_accuracy: number
}

export const getIdentifyRecords = (params?: {
  skip?: number
  limit?: number
  user_id?: number
  jade_type?: string
  status?: string
}): Promise<IdentifyRecord[]> => {
  return request.get('/admin/records', { params })
}

export const getIdentifyDetail = (id: number): Promise<IdentifyRecord> => {
  return request.get(`/identify/${id}`)
}

export const getStats = (): Promise<StatsData> => {
  return request.get('/admin/stats')
}
