import request from '@/utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  password: string
  email?: string
}

export const login = (data: LoginParams) => {
  return request.post('/auth/login', data)
}

export const register = (data: RegisterParams) => {
  return request.post('/auth/register', data)
}

export const refreshToken = () => {
  return request.post('/auth/refresh')
}

export const getUserInfo = () => {
  return request.get('/user/me')
}
