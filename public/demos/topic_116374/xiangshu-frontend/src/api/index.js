import axios from 'axios'

// Axios 实例：统一 baseURL / 拦截器
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000
})

// 请求拦截：携带 token
api.interceptors.request.use(
  (config) => {
    const raw = localStorage.getItem('xiangshu_user')
    if (raw) {
      try {
        const { token } = JSON.parse(raw)
        if (token) config.headers.Authorization = `Bearer ${token}`
      } catch (e) {
        // 忽略损坏的本地数据
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截：统一处理业务码与错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || '网络异常，请稍后重试'
    return Promise.reject(new Error(message))
  }
)

// Mock 请求工具：模拟延迟与返回数据，供 store 在 Mock 模式下使用
// 真实接口切换后可直接调用 api.get/post 等
export function mockRequest(data, delay = 300) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), delay)
  })
}

export default api
