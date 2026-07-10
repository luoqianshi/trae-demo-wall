import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse
} from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import logger from './logger'

// 后端业务返回统一结构
interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

// 业务成功码
const SUCCESS_CODE = 200
// 鉴权失败码
const UNAUTHORIZED_CODE = 401

// 创建 axios 实例：统一 baseURL 与超时
const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// 请求拦截器：附带 Authorization 头（Bearer 前缀）
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    logger.error('请求发送失败', error)
    return Promise.reject(error)
  }
)

// 响应拦截器：统一处理业务码与鉴权失效
request.interceptors.response.use(
  (response: AxiosResponse<ApiResult>) => {
    const result = response.data

    // 业务码非 200：提示错误并拒绝
    if (result.code !== SUCCESS_CODE) {
      ElMessage.error(result.message || '请求失败')
      // 401：清除登录态并跳转登录页
      if (result.code === UNAUTHORIZED_CODE) {
        const userStore = useUserStore()
        userStore.logout()
      }
      return Promise.reject(new Error(result.message || '请求失败'))
    }

    // 统一解包：直接返回业务数据，调用方无需再取 response.data.data
    return result.data as unknown as AxiosResponse
  },
  (error) => {
    // HTTP 层错误（如超时、网络异常、401/403 等状态码）
    const status = error.response?.status
    if (status === UNAUTHORIZED_CODE) {
      const userStore = useUserStore()
      userStore.logout()
    } else {
      const message = error.response?.data?.message || error.message || '网络异常，请稍后重试'
      ElMessage.error(message)
    }
    logger.error('响应处理失败', error)
    return Promise.reject(error)
  }
)

export default request
