import request from '@/utils/request'
import type { MetricVO } from './health'

// 家庭成员角色：OWNER 创建者 / MEMBER 普通成员
export type FamilyMemberRole = 'OWNER' | 'MEMBER'

// 家庭成员信息 VO（与后端 FamilyMemberVO 对齐）
export interface FamilyMemberVO {
  // 成员记录ID
  id: number
  userId: number
  name: string
  role: FamilyMemberRole
  // 是否授权查看指标 0否 1是
  authorizedView: number
  createdAt: string
}

// 创建家庭组入参（与后端 CreateFamilyDTO 对齐）
export interface CreateFamilyParams {
  name: string
}

// 创建家庭组，返回家庭组ID
export const createGroup = (data: CreateFamilyParams): Promise<number> => {
  return request.post<number, number>('/family/groups', data)
}

// 邀请家庭成员（通过手机号查询用户）
export const inviteMember = (groupId: number, phone: string): Promise<void> => {
  return request.post<void, void>(`/family/groups/${groupId}/invite`, { phone })
}

// 查询家庭组成员列表
export const getGroupMembers = (groupId: number): Promise<FamilyMemberVO[]> => {
  return request.get<FamilyMemberVO[], FamilyMemberVO[]>(`/family/groups/${groupId}/members`)
}

// 授权或取消授权成员查看指标
export const authorizeView = (
  groupId: number,
  memberId: number,
  authorizedView: number
): Promise<void> => {
  return request.post<void, void>(`/family/groups/${groupId}/authorize`, {
    memberId,
    authorizedView
  })
}

// 查看家庭成员的健康指标
export const getMemberHealth = (
  groupId: number,
  memberId: number
): Promise<MetricVO[]> => {
  return request.get<MetricVO[], MetricVO[]>(
    `/family/groups/${groupId}/members/${memberId}/health`
  )
}
