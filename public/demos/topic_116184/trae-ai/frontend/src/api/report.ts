import request from '@/utils/request'

// 报告类型：WEEKLY 周报 / MONTHLY 月报 / CUSTOM 自定义
export type ReportType = 'WEEKLY' | 'MONTHLY' | 'CUSTOM'

// 健康报告信息 VO（与后端 ReportVO 对齐）
export interface ReportVO {
  id: number
  reportType: ReportType
  periodStart: string
  periodEnd: string
  // PDF 文件下载路径
  fileUrl: string
  createdAt: string
}

// 生成健康报告入参（与后端 GenerateReportDTO 对齐）
export interface GenerateReportParams {
  reportType: ReportType
  // 周期开始日期，格式 YYYY-MM-DD
  periodStart: string
  // 周期结束日期，格式 YYYY-MM-DD
  periodEnd: string
}

// 生成健康报告，返回报告ID
export const generateReport = (data: GenerateReportParams): Promise<number> => {
  return request.post<number, number>('/reports/generate', data)
}

// 查询当前用户的报告列表
export const getMyReports = (): Promise<ReportVO[]> => {
  return request.get<ReportVO[], ReportVO[]>('/reports/mine')
}

// 下载报告 PDF（返回 Blob，由调用方触发浏览器下载）
export const downloadReport = (reportId: number): Promise<Blob> => {
  // 注意：此处直接使用 axios 实例的原始返回，responseType 为 blob
  return request.get<Blob, Blob>(`/reports/${reportId}/download`, {
    responseType: 'blob'
  })
}

// 分享报告给家庭成员
export const shareReport = (reportId: number, targetUserId: number): Promise<void> => {
  return request.post<void, void>(`/reports/${reportId}/share`, null, {
    params: { targetUserId }
  })
}
