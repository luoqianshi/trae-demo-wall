import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(sessionStorage.getItem('token') || '')
  const userInfo = ref(null)

  const isLoggedIn = computed(() => !!token.value)

  async function login(data) {
    const result = await authApi.login(data)
    token.value = result.access_token
    localStorage.removeItem('token')
    sessionStorage.setItem('token', result.access_token)
    sessionStorage.setItem('userId', result.user_id)
    sessionStorage.setItem('merchantName', result.merchant_name)
    return result
  }

  async function register(data) {
    const result = await authApi.register(data)
    token.value = result.access_token
    localStorage.removeItem('token')
    sessionStorage.setItem('token', result.access_token)
    sessionStorage.setItem('userId', result.user_id)
    sessionStorage.setItem('merchantName', result.merchant_name)
    return result
  }

  async function getProfile() {
    const result = await authApi.getProfile()
    userInfo.value = result
    return result
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('userId')
    sessionStorage.removeItem('merchantName')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    register,
    getProfile,
    logout
  }
})
