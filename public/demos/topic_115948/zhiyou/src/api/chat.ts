import request from '../utils/request'

export interface MessageItem {
  id: string
  role: string
  content: string
  message_type: string
  created_at: string
}

export interface ChatHistoryResponse {
  list: MessageItem[]
  has_more: boolean
}

export interface SendMessageRequest {
  content: string
  message_type: string
}

export interface SendMessageResponse {
  id: string
  role: string
  content: string
  message_type: string
  created_at: string
}

export interface MemoryItem {
  id: string
  content: string
  recorded_at: string
  source: string
  importance: number
}

export interface MemoryResponse {
  list: MemoryItem[]
  total: number
  page: number
  page_size: number
}

export const chatApi = {
  getHistory: (friendId: string, before_time?: string, page_size = 50) =>
    request<ChatHistoryResponse>({
      url: `/chat/${friendId}/messages`,
      method: 'GET',
      data: { before_time, page_size },
    }),

  sendMessage: (friendId: string, content: string, message_type = 'text') =>
    request<SendMessageResponse>({
      url: `/chat/${friendId}/send`,
      method: 'POST',
      data: { content, message_type },
    }),

  markAsRead: (friendId: string) =>
    request<null>({
      url: `/chat/${friendId}/read`,
      method: 'POST',
    }),

  getMemories: (friendId: string, page = 1, page_size = 20) =>
    request<MemoryResponse>({
      url: `/friends/${friendId}/memories`,
      method: 'GET',
      data: { page, page_size },
    }),
}

export default chatApi
