import request from './request'

export interface LoginResponse {
  access_token: string
  token_type: string
}

export const adminLogin = (username: string, password: string): Promise<LoginResponse> => {
  return request.post('/admin/auth/login', { username, password })
}
