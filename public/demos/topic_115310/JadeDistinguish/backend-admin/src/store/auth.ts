import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminLogin } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const username = ref(localStorage.getItem('admin_username') || '')

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('admin_token', newToken)
  }

  const setUsername = (name: string) => {
    username.value = name
    localStorage.setItem('admin_username', name)
  }

  const login = async (loginUsername: string, loginPassword: string) => {
    const res = await adminLogin(loginUsername, loginPassword)
    setToken(res.access_token)
    setUsername(loginUsername)
    return res
  }

  const logout = () => {
    token.value = ''
    username.value = ''
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_username')
  }

  return {
    token,
    username,
    setToken,
    setUsername,
    login,
    logout
  }
})
