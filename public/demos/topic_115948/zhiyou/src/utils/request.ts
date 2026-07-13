import Taro from '@tarojs/taro'
import { API_BASE_URL, API_TIMEOUT, TOKEN_KEY } from '../config/api'

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  showLoading?: boolean
}

export async function request<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    showLoading = false,
  } = options

  const token = Taro.getStorageSync(TOKEN_KEY)

  const finalHeader: Record<string, string> = {
    'Content-Type': 'application/json',
    ...header,
  }

  if (token) {
    finalHeader['Authorization'] = `Bearer ${token}`
  }

  if (showLoading) {
    Taro.showLoading({ title: '加载中...', mask: true })
  }

  try {
    const res = await Taro.request({
      url: `${API_BASE_URL}/v1${url}`,
      method,
      data,
      header: finalHeader,
      timeout: API_TIMEOUT,
    })

    const result = res.data as ApiResponse<T>

    if (result.code !== 0) {
      if (result.code === 40101 || result.code === 40102) {
        Taro.removeStorageSync(TOKEN_KEY)
        Taro.redirectTo({ url: '/pages/login/login' })
      }
      Taro.showToast({
        title: result.message || '请求失败',
        icon: 'none',
        duration: 2000,
      })
      throw new Error(result.message || '请求失败')
    }

    return result
  } catch (error: any) {
    const errorMessage = error.message || error.errMsg || '请求失败'
    Taro.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 2000,
    })
    throw error
  } finally {
    if (showLoading) {
      Taro.hideLoading()
    }
  }
}

export default request
