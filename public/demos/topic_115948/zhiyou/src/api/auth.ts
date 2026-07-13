import request from '../utils/request'

export interface UserInfo {
  id: string
  phone: string
  nickname?: string
  avatar_url?: string
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: UserInfo
}

export const authApi = {
  login: (phone: string, password: string) =>
    request<TokenResponse>({
      url: '/auth/login',
      method: 'POST',
      data: { phone, password },
    }),

  register: (phone: string, password: string) =>
    request<TokenResponse>({
      url: '/auth/register',
      method: 'POST',
      data: { phone, password },
    }),

  getCurrentUser: () =>
    request<UserInfo>({
      url: '/auth/me',
      method: 'GET',
    }),
}

export default authApi
