import request from '@/utils/request'
import type { UserInfo } from '@/stores/user'

// 性别：MALE 男 / FEMALE 女（与后端一致）
export type Gender = 'MALE' | 'FEMALE'

// 登录方式常量
export const LOGIN_BY_SMS = 'LOGIN_BY_SMS'
export const LOGIN_BY_PASSWORD = 'LOGIN_BY_PASSWORD'

// 登录方式类型
export type LoginType = typeof LOGIN_BY_SMS | typeof LOGIN_BY_PASSWORD

// 短信登录入参
export interface SmsLoginParams {
  phone: string
  code: string
}

// 密码登录入参
export interface PasswordLoginParams {
  phone: string
  password: string
}

// 登录成功返回（与后端 LoginVO 对齐）
export interface LoginResult {
  token: string
  userId: number
  name: string
  role: string
}

// 用户注册入参（与后端 RegisterDTO 对齐）
export interface RegisterParams {
  phone: string
  code: string
  password: string
  name: string
  gender: Gender
  // 出生日期，格式 YYYY-MM-DD
  birthDate: string
}

// 医生注册入参（与后端 DoctorRegisterDTO 对齐）
export interface DoctorRegisterParams {
  phone: string
  code: string
  password: string
  name: string
  gender: Gender
  title: string
  department: string
  specialties: string
  licenseNo: string
  licenseImg: string
}

// 用户档案（与后端 UserProfileVO 对齐）
export interface UserProfile {
  userId: number
  name: string
  phone: string
  gender: string
  birthDate: string
  height: number
  weight: number
  role: string
  medicalHistory: string
  allergy: string
  medication: string
  emergencyContact: string
}

// 更新健康档案入参（与后端 UserProfileDTO 对齐）
export interface UpdateProfileParams {
  medicalHistory?: string
  allergy?: string
  medication?: string
  emergencyContact?: string
}

// 将登录结果转换为 store 中的 UserInfo
export const toUserInfo = (result: LoginResult): UserInfo => {
  return {
    id: result.userId,
    name: result.name,
    role: result.role
  }
}

// 发送短信验证码
export const sendSms = (phone: string): Promise<void> => {
  return request.post<void, void>('/auth/sms', { phone })
}

// 短信验证码登录
export const loginBySms = (params: SmsLoginParams): Promise<LoginResult> => {
  return request.post<LoginResult, LoginResult>('/auth/login', {
    phone: params.phone,
    code: params.code,
    loginType: LOGIN_BY_SMS
  })
}

// 密码登录
export const loginByPassword = (params: PasswordLoginParams): Promise<LoginResult> => {
  return request.post<LoginResult, LoginResult>('/auth/login', {
    phone: params.phone,
    password: params.password,
    loginType: LOGIN_BY_PASSWORD
  })
}

// 用户注册
export const register = (params: RegisterParams): Promise<LoginResult> => {
  return request.post<LoginResult, LoginResult>('/auth/register', params)
}

// 医生注册
export const registerDoctor = (params: DoctorRegisterParams): Promise<LoginResult> => {
  return request.post<LoginResult, LoginResult>('/auth/doctor/register', params)
}

// 获取当前登录用户档案（含健康档案）
export const getProfile = (): Promise<UserProfile> => {
  return request.get<UserProfile, UserProfile>('/user/profile')
}

// 更新当前登录用户健康档案
export const updateProfile = (data: UpdateProfileParams): Promise<void> => {
  return request.put<void, void>('/user/profile', data)
}
