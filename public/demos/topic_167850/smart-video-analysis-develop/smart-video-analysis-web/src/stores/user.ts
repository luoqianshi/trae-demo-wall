import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfo } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const userInfo = ref<Record<string, any> | null>(null)

  const userId = computed(() => {
    return userInfo.value?.id || userInfo.value?.userId || ''
  })

  const setToken = (val: string) => {
    token.value = val
    if (val) {
      localStorage.setItem('token', val)
    } else {
      localStorage.removeItem('token')
    }
  }

  const setUserInfo = (val: Record<string, any> | null) => {
    userInfo.value = val
  }

  const fetchUserInfo = async () => {
    try {
      const data: any = await getUserInfo()
      userInfo.value = data
    } catch {
      userInfo.value = null
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  const initFromStorage = () => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      token.value = savedToken
    }
  }

  return {
    token,
    userInfo,
    userId,
    setToken,
    setUserInfo,
    fetchUserInfo,
    logout,
    initFromStorage
  }
})
