import request from '@/utils/request'

// 计划状态
export type PlanStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED'

// 健康计划
export interface HealthPlan {
  id: number
  type: string
  goal: string
  tasks: string[]
  periodStart: string
  periodEnd: string
  progress: number
  status: PlanStatus
}

// 创建计划入参
export interface CreatePlanParams {
  type: string
  goal: string
  tasks: string[]
  periodStart: string
  periodEnd: string
}

// 打卡入参
export interface CheckinParams {
  planId: number
  taskDate: string
}

// 兑换商品
export interface ExchangeItem {
  id: number
  itemName: string
  description: string
  pointsCost: number
  stock: number
}

// 积分余额
export interface PointsBalance {
  balance: number
}

// 排行榜项
export interface RankingItem {
  userId: number
  name: string
  totalPoints: number
}

// 推荐计划
export const recommendPlan = (): Promise<HealthPlan> => {
  return request.post<HealthPlan, HealthPlan>('/plans/recommend')
}

// 创建计划
export const createPlan = (data: CreatePlanParams): Promise<HealthPlan> => {
  return request.post<HealthPlan, HealthPlan>('/plans', data)
}

// 打卡
export const checkin = (data: CheckinParams): Promise<void> => {
  return request.post<void, void>('/plans/checkin', data)
}

// 我的计划列表
export const getMyPlans = (): Promise<HealthPlan[]> => {
  return request.get<HealthPlan[], HealthPlan[]>('/plans/mine')
}

// 积分余额
export const getBalance = (): Promise<PointsBalance> => {
  return request.get<PointsBalance, PointsBalance>('/points/balance')
}

// 排行榜
export const getRanking = (period: 'WEEK' | 'MONTH'): Promise<RankingItem[]> => {
  return request.get<RankingItem[], RankingItem[]>('/points/ranking', { params: { period } })
}

// 兑换商品列表
export const getExchangeItems = (): Promise<ExchangeItem[]> => {
  return request.get<ExchangeItem[], ExchangeItem[]>('/points/exchange-items')
}

// 兑换商品
export const exchangeItem = (itemId: number): Promise<void> => {
  return request.post<void, void>(`/points/exchange/${itemId}`)
}
