export const API_BASE_URL = process.env.TARO_ENV === 'h5'
  ? '/api'
  : 'http://localhost:8000/api'

export const API_TIMEOUT = 30000

export const TOKEN_KEY = 'zhiyou_token'
export const USER_INFO_KEY = 'zhiyou_user_info'
