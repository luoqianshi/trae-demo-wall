import request from '@/utils/request'

// 告警等级：NORMAL 正常 / WARNING 预警 / DANGER 危险
export type AlertLevel = 'NORMAL' | 'WARNING' | 'DANGER'

// 数据来源：MANUAL 手动 / DEVICE 设备 / IMPORT 导入
export type RecordSource = 'MANUAL' | 'DEVICE' | 'IMPORT'

// 看板状态概览（与后端 HealthDashboardVO.Summary 对齐）
export interface HealthSummary {
  // 正常指标数
  normal: number
  // 预警指标数
  warning: number
  // 危险指标数
  danger: number
}

// 指标项 VO（含最新值与告警等级，与后端 MetricVO 对齐）
export interface MetricVO {
  id: number
  categoryId: number
  name: string
  unit: string
  // 正常范围描述（如 "90-120"）
  normalRange: string
  // 最新值（字符串兼容数值型与文本型指标）
  value: string
  // 告警等级：NORMAL / WARNING / DANGER
  alertLevel: AlertLevel
  // 最近采集时间（ISO 字符串）
  recordedAt: string
}

// 指标大类卡片 VO（与后端 CategoryVO 对齐）
export interface CategoryVO {
  id: number
  name: string
  icon: string
  color: string
  sortOrder: number
  // 该大类下的指标列表
  metrics: MetricVO[]
}

// 健康看板响应 VO（与后端 HealthDashboardVO 对齐）
export interface HealthDashboard {
  // 状态概览
  summary: HealthSummary
  // 大类卡片列表
  categories: CategoryVO[]
}

// 健康记录（与后端 HealthRecord 对齐）
export interface HealthRecord {
  id: number
  userId: number
  metricId: number
  value: string
  unit: string
  source: RecordSource
  deviceId: number | null
  recordedAt: string
}

// 健康建议（与后端 AdviceVO 对齐）
export interface HealthAdvice {
  id: number
  title: string
  // 建议内容（富文本 HTML）
  content: string
  // 告警等级
  level: AlertLevel
}

// 上报指标数据入参（与后端 ReportMetricDTO 对齐）
export interface ReportMetricParams {
  metricId: number
  value: string
  recordedAt?: string
  source?: RecordSource
}

// 获取健康看板数据（含状态概览与大类卡片）
export const getDashboard = (): Promise<HealthDashboard> => {
  return request.get<HealthDashboard, HealthDashboard>('/health/dashboard')
}

// 上报指标数据，返回计算后的告警等级
export const reportMetric = (data: ReportMetricParams): Promise<{ alertLevel: AlertLevel }> => {
  return request.post<{ alertLevel: AlertLevel }, { alertLevel: AlertLevel }>(
    '/health/records',
    data
  )
}

// 获取指标趋势数据（近 N 天）
export const getTrend = (
  metricId: number,
  days = 7
): Promise<HealthRecord[]> => {
  return request.get<HealthRecord[], HealthRecord[]>('/health/records/trend', {
    params: { metricId, days }
  })
}

// 根据指标项 ID 获取健康建议
export const getAdvice = (metricId: number): Promise<HealthAdvice> => {
  return request.get<HealthAdvice, HealthAdvice>(`/health/advice/${metricId}`)
}
