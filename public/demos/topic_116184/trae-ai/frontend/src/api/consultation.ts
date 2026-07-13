import request from '@/utils/request'

// 问诊类型：REALTIME 实时 / ASYNC 异步
export type ConsultationType = 'REALTIME' | 'ASYNC'

// 会话状态：WAITING 等待中 / IN_PROGRESS 进行中 / CLOSED 已关闭
export type ConsultationStatus = 'WAITING' | 'IN_PROGRESS' | 'CLOSED'

// 消息发送者类型：USER 用户 / DOCTOR 医生
export type SenderType = 'USER' | 'DOCTOR'

// 消息内容类型：TEXT 文本 / IMAGE 图片 / VOICE 语音
export type ContentType = 'TEXT' | 'IMAGE' | 'VOICE'

// 分页结果通用结构（与后端 PageResult 对齐）
export interface PageResult<T> {
  // 当前页码
  page: number
  // 每页条数
  size: number
  // 总条数
  total: number
  // 总页数
  pages: number
  // 数据列表
  records: T[]
}

// 医生列表展示 VO（与后端 DoctorVO 对齐）
export interface DoctorVO {
  // 医生用户ID（sys_user.id）
  id: number
  name: string
  title: string
  department: string
  specialties: string
  rating: number
  // 是否在线
  online: boolean
}

// 发起问诊入参（与后端 StartConsultationDTO 对齐）
export interface StartConsultationParams {
  doctorId: number
  type: ConsultationType
  // 主诉（异步问诊必填）
  chiefComplaint?: string
  symptomDesc?: string
  duration?: string
  accompanying?: string
  images?: string[]
}

// 问诊会话展示 VO（与后端 ConsultationVO 对齐）
export interface ConsultationVO {
  id: number
  userId: number
  doctorId: number
  type: ConsultationType
  status: ConsultationStatus
  chiefComplaint: string
  symptomDesc: string
  duration: string
  accompanying: string
  images: string[]
  replyCount: number
  // 评分 1-5，null 表示未评价
  rating: number | null
  ratingComment: string
  createdAt: string
  closedAt: string | null
  // 患者姓名
  userName: string
  // 医生姓名
  doctorName: string
  doctorTitle: string
  doctorDepartment: string
}

// 问诊消息展示 VO（与后端 MessageVO 对齐）
export interface MessageVO {
  id: number
  consultationId: number
  senderType: SenderType
  contentType: ContentType
  content: string
  sentAt: string
  // 已读状态 0未读 1已读
  readStatus: number
  senderId: number
  senderName: string
}

// 发送问诊消息入参（与后端 SendMessageDTO 对齐）
export interface SendMessageParams {
  consultationId: number
  contentType: ContentType
  content: string
}

// 评价问诊入参（与后端 EvaluateDTO 对齐）
export interface EvaluateParams {
  consultationId: number
  // 评分 1-5
  rating: number
  ratingComment?: string
}

// 查询在线医生列表
export const getOnlineDoctors = (): Promise<DoctorVO[]> => {
  return request.get<DoctorVO[], DoctorVO[]>('/consultations/doctors/online')
}

// 发起问诊会话，返回创建的会话ID
export const startConsultation = (data: StartConsultationParams): Promise<number> => {
  return request.post<number, number>('/consultations', data)
}

// 查询当前用户的问诊列表（分页）
export const getMyConsultations = (
  page = 1,
  size = 10
): Promise<PageResult<ConsultationVO>> => {
  return request.get<PageResult<ConsultationVO>, PageResult<ConsultationVO>>(
    '/consultations/mine',
    { params: { page, size } }
  )
}

// 查询当前医生的接诊列表（分页）
export const getDoctorConsultations = (
  page = 1,
  size = 10
): Promise<PageResult<ConsultationVO>> => {
  return request.get<PageResult<ConsultationVO>, PageResult<ConsultationVO>>(
    '/consultations/doctor',
    { params: { page, size } }
  )
}

// 查询问诊历史消息
export const getMessages = (consultationId: number): Promise<MessageVO[]> => {
  return request.get<MessageVO[], MessageVO[]>(`/consultations/${consultationId}/messages`)
}

// 发送问诊消息
export const sendMessage = (data: SendMessageParams): Promise<MessageVO> => {
  return request.post<MessageVO, MessageVO>('/consultations/messages', data)
}

// 医生异步回复
export const replyAsync = (data: {
  consultationId: number
  content: string
}): Promise<MessageVO> => {
  return request.post<MessageVO, MessageVO>('/consultations/reply', data)
}

// 关闭问诊会话
export const closeConsultation = (consultationId: number): Promise<void> => {
  return request.post<void, void>(`/consultations/${consultationId}/close`)
}

// 评价问诊会话
export const evaluateConsultation = (data: EvaluateParams): Promise<void> => {
  return request.post<void, void>('/consultations/evaluate', data)
}
