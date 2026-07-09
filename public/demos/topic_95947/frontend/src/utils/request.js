import axios from 'axios'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

let authExpiredHandling = false
const errorMessageCache = new Map()
const ERROR_MESSAGE_DEDUPE_MS = 3000
const PUBLIC_AUTH_PATHS = new Set(['/login', '/register'])

const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000
})

function getErrorMessage(error) {
  const detail = error.response?.data?.detail
  if (Array.isArray(detail)) {
    return detail.map(item => item.msg || item.message).filter(Boolean).join('，') || '请求失败'
  }
  return detail || error.response?.data?.message || '请求失败'
}

function showErrorMessage(message) {
  const safeMessage = message || '请求失败，请稍后重试'
  const now = Date.now()
  const lastShownAt = errorMessageCache.get(safeMessage) || 0

  if (now - lastShownAt < ERROR_MESSAGE_DEDUPE_MS) {
    return
  }

  errorMessageCache.set(safeMessage, now)
  ElMessage.error(safeMessage)
}

export async function handleAuthExpired() {
  const userStore = useUserStore()
  userStore.logout()

  const currentPath = window.location.pathname
  if (PUBLIC_AUTH_PATHS.has(currentPath)) {
    authExpiredHandling = false
    return
  }

  if (authExpiredHandling) return
  authExpiredHandling = true

  ElMessage.error('登录已过期，请重新登录')
  const { default: router } = await import('@/router')
  router.replace({
    path: '/login',
    query: currentPath === '/' ? {} : { redirect: `${currentPath}${window.location.search}` }
  }).finally(() => {
    setTimeout(() => {
      authExpiredHandling = false
    }, 1000)
  })
}

export async function authFetch(input, init = {}) {
  const userStore = useUserStore()
  const headers = new Headers(init.headers || {})

  if (userStore.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${userStore.token}`)
  }

  const response = await fetch(input, {
    ...init,
    headers
  })

  if (response.status === 401) {
    await handleAuthExpired()
    throw new Error('登录已过期，请重新登录')
  }

  return response
}

axiosInstance.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      handleAuthExpired()
      return Promise.reject(error)
    }

    if (error.config?.silentError) {
      return Promise.reject(error)
    }

    if (error.response) {
      const status = error.response.status
      if (status === 403) {
        showErrorMessage('无权访问')
      } else if (status === 404) {
        showErrorMessage('资源不存在')
      } else {
        showErrorMessage(getErrorMessage(error))
      }
    } else {
      showErrorMessage('网络错误，请检查连接')
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
