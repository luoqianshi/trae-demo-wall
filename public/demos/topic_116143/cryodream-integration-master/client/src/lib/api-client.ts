import axios from 'axios'

interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => {
    const result = response.data as ApiResponse<unknown>
    if (result.code !== 0) {
      return Promise.reject(new Error(result.message || '请求失败'))
    }
    response.data = result.data
    return response
  },
  (error) => {
    return Promise.reject(error)
  }
)
