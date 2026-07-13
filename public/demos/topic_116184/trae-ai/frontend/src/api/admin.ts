import request from '@/utils/request'

// ===== 指标大类 =====
export interface HealthCategoryDTO {
  id?: number
  name: string
  icon: string
  color: string
  sortOrder: number
  enabled: number
}

export const getCategories = (): Promise<HealthCategoryDTO[]> => {
  return request.get<HealthCategoryDTO[], HealthCategoryDTO[]>('/admin/metrics/categories')
}

export const saveCategory = (data: HealthCategoryDTO): Promise<void> => {
  if (data.id) {
    return request.put<void, void>(`/admin/metrics/categories/${data.id}`, data)
  }
  return request.post<void, void>('/admin/metrics/categories', data)
}

export const deleteCategory = (id: number): Promise<void> => {
  return request.delete<void, void>(`/admin/metrics/categories/${id}`)
}

// ===== 指标项 =====
export interface HealthMetricDTO {
  id?: number
  categoryId: number
  name: string
  unit: string
  normalMin: number | null
  normalMax: number | null
  warningMin: number | null
  warningMax: number | null
  dangerMin: number | null
  dangerMax: number | null
  applicableGender: string
  enabled: number
}

export const getMetrics = (page: number, size: number): Promise<{ records: HealthMetricDTO[]; total: number }> => {
  return request.get('/admin/metrics', { params: { page, size } })
}

export const saveMetric = (data: HealthMetricDTO): Promise<void> => {
  if (data.id) {
    return request.put<void, void>(`/admin/metrics/${data.id}`, data)
  }
  return request.post<void, void>('/admin/metrics', data)
}

export const toggleMetric = (id: number): Promise<void> => {
  return request.put<void, void>(`/admin/metrics/${id}/toggle`)
}

export const deleteMetric = (id: number): Promise<void> => {
  return request.delete<void, void>(`/admin/metrics/${id}`)
}

// ===== 建议模板 =====
export interface AdviceTemplateDTO {
  id?: number
  metricId: number | null
  level: string
  title: string
  content: string
  enabled: number
}

export const getAdviceList = (page: number, size: number): Promise<{ records: AdviceTemplateDTO[]; total: number }> => {
  return request.get('/admin/advice', { params: { page, size } })
}

export const saveAdvice = (data: AdviceTemplateDTO): Promise<void> => {
  if (data.id) {
    return request.put<void, void>(`/admin/advice/${data.id}`, data)
  }
  return request.post<void, void>('/admin/advice', data)
}

export const deleteAdvice = (id: number): Promise<void> => {
  return request.delete<void, void>(`/admin/advice/${id}`)
}

// ===== 用户管理 =====
export interface UserAdminVO {
  id: number
  phone: string
  name: string
  gender: string
  role: string
  status: number
  createdAt: string
}

export const getUsers = (page: number, size: number, keyword?: string): Promise<{ records: UserAdminVO[]; total: number }> => {
  return request.get('/admin/users', { params: { page, size, keyword } })
}

export const toggleUserStatus = (id: number, status: number): Promise<void> => {
  return request.put<void, void>(`/admin/users/${id}/status`, { status })
}

// ===== 医生管理 =====
export interface DoctorAdminVO {
  id: number
  userId: number
  name: string
  phone: string
  title: string
  department: string
  specialties: string
  auditStatus: string
  rating: number
}

export const getDoctors = (): Promise<DoctorAdminVO[]> => {
  return request.get<DoctorAdminVO[], DoctorAdminVO[]>('/admin/doctors')
}

export const auditDoctor = (id: number, auditStatus: string): Promise<void> => {
  return request.put<void, void>(`/admin/doctors/${id}/audit`, { auditStatus })
}

// ===== 统计 =====
export interface StatsOverview {
  userCount: number
  consultationCount: number
  alertCount: number
  activeToday: number
}

export interface AlertDistribution {
  metricName: string
  warningCount: number
  dangerCount: number
}

export const getStatsOverview = (): Promise<StatsOverview> => {
  return request.get<StatsOverview, StatsOverview>('/admin/stats/overview')
}

export const getAlertDistribution = (): Promise<AlertDistribution[]> => {
  return request.get<AlertDistribution[], AlertDistribution[]>('/admin/stats/alerts')
}
