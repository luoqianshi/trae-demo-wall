import request from '../utils/request'

export interface AvatarConfig {
  hairstyle: string
  face_shape: string
  clothing: string
  color?: string
  hair_color?: string
  clothes_color?: string
}

export interface FriendItem {
  id: string
  name: string
  identity: string
  identity_label: string
  avatar_config: AvatarConfig
  last_message?: string
  last_message_at?: string
  unread_count: number
}

export interface FriendDetail {
  id: string
  name: string
  description?: string
  identity: string
  identity_label: string
  avatar_config: AvatarConfig
  personality_traits: string[]
  speaking_style: string
  speaking_style_label: string
  companion_days: number
  chat_count: number
  memory_count: number
  created_at: string
}

export interface FriendResponse {
  id: string
  name: string
  identity: string
  identity_label: string
  avatar_config: AvatarConfig
  last_message?: string
  last_message_at?: string
  unread_count: number
  companion_days: number
  chat_count: number
  memory_count: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  page_size: number
}

export interface CreateFriendRequest {
  name: string
  description?: string
  identity: 'friend' | 'bestie' | 'teacher' | 'doctor' | 'lawyer' | 'counselor'
  avatar_config: AvatarConfig
  personality_traits: string[]
  speaking_style: 'gentle' | 'humorous' | 'professional' | 'warm' | 'calm' | 'normal'
}

export interface UpdateFriendRequest {
  name?: string
  description?: string
  avatar_config?: AvatarConfig
  personality_traits?: string[]
  speaking_style?: string
}

export const friendApi = {
  getList: (keyword?: string, page = 1, page_size = 20) =>
    request<PageResult<FriendItem>>({
      url: '/friends',
      method: 'GET',
      data: { keyword, page, page_size },
    }),

  getDetail: (id: string) =>
    request<FriendDetail>({
      url: `/friends/${id}`,
      method: 'GET',
    }),

  create: (data: CreateFriendRequest) =>
    request<FriendResponse>({
      url: '/friends',
      method: 'POST',
      data,
    }),

  update: (id: string, data: UpdateFriendRequest) =>
    request<FriendResponse>({
      url: `/friends/${id}`,
      method: 'PUT',
      data,
    }),

  delete: (id: string) =>
    request<null>({
      url: `/friends/${id}`,
      method: 'DELETE',
    }),
}

export default friendApi
