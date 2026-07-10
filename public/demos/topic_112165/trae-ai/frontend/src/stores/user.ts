import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'

// localStorage 中存储登录 token 的键名
const TOKEN_KEY = 'health_monitor_token'
// localStorage 中存储用户信息的键名
const USER_INFO_KEY = 'health_monitor_user_info'

// 当前登录用户信息
export interface UserInfo {
  // 用户唯一标识
  id: string | number
  // 用户姓名
  name: string
  // 角色：user 普通用户 / doctor 医生 / admin 管理员
  role: string
}

// 从 localStorage 读取用户信息；数据损坏时清除并按未登录处理
const loadUserInfo = (): UserInfo | null => {
  const raw = localStorage.getItem(USER_INFO_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as UserInfo
  } catch (e) {
    // localStorage 数据损坏（非合法 JSON），清除后按未登录处理
    localStorage.removeItem(USER_INFO_KEY)
    return null
  }
}

export const useUserStore = defineStore('user', () => {
  // 从 localStorage 初始化 token，保证刷新后仍处于登录态
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '')
  // 从 localStorage 初始化用户信息
  const userInfo = ref<UserInfo | null>(loadUserInfo())

  // 是否已登录：依据 token 是否存在
  const isLoggedIn = computed(() => token.value !== '')

  // 当前用户角色；未登录时为空字符串
  const role = computed(() => userInfo.value?.role ?? '')

  // 设置 token 并持久化到 localStorage；空值则清除
  const setToken = (newToken: string): void => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  // 设置用户信息并持久化到 localStorage
  const setUserInfo = (info: UserInfo): void => {
    userInfo.value = info
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
  }

  // 登出：清空登录态与用户信息并跳转登录页
  const logout = (): void => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_INFO_KEY)
    router.push('/login')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    role,
    setToken,
    setUserInfo,
    logout
  }
})
