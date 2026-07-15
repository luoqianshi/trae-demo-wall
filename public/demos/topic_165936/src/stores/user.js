import { defineStore } from 'pinia'
import { login, logout, getUserInfo } from '@/api/auth'
import { getToken, setToken, removeToken, setUser, getUser, removeUser, clearAuth } from '@/utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    userInfo: getUser() || null,
    roles: [],
    permissions: []
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userId: (state) => state.userInfo?.id || null,
    username: (state) => state.userInfo?.username || '',
    nickname: (state) => state.userInfo?.nickname || '',
    avatar: (state) => state.userInfo?.avatar || ''
  },

  actions: {
    async login(loginForm) {
      try {
        const res = await login(loginForm)
        const { token, userInfo } = res.data
        this.token = token
        this.userInfo = userInfo
        this.roles = userInfo?.roles?.map(r => r.roleCode) || []
        setToken(token)
        setUser(userInfo)
        await this.getUserPermissions()
        return res
      } catch (error) {
        throw error
      }
    },

    async getUserPermissions() {
      try {
        const res = await getUserInfo()
        this.userInfo = res.data.userInfo
        this.roles = res.data.userInfo?.roles?.map(r => r.roleCode) || []
        this.permissions = res.data.permissions || []
        setUser(res.data.userInfo)
        return res
      } catch (error) {
        throw error
      }
    },

    async logout() {
      try {
        await logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.token = ''
        this.userInfo = null
        this.roles = []
        this.permissions = []
        clearAuth()
      }
    },

    resetState() {
      this.token = ''
      this.userInfo = null
      this.roles = []
      this.permissions = []
      clearAuth()
    },

    updateUserInfo(userInfo) {
      this.userInfo = { ...this.userInfo, ...userInfo }
      setUser(this.userInfo)
    }
  }
})
