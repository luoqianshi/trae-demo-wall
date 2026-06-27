import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false
  }),

  actions: {
    async login(username, password) {
      this.loading = true
      try {
        const response = await axios.post('/api/auth/login', {
          username,
          password
        }, {
          withCredentials: true
        })
        
        if (response.data.success) {
          this.user = { username: response.data.username }
          this.isAuthenticated = true
          return { success: true }
        } else {
          return { success: false, message: response.data.message }
        }
      } catch (error) {
        const message = error.response?.data?.message || '登录失败'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async register(username, password) {
      this.loading = true
      try {
        const response = await axios.post('/api/auth/register', {
          username,
          password
        })
        
        if (response.data.success) {
          return { success: true, message: response.data.message }
        } else {
          return { success: false, message: response.data.message }
        }
      } catch (error) {
        const message = error.response?.data?.message || '注册失败'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await axios.post('/api/auth/logout', {}, {
          withCredentials: true
        })
      } catch (error) {
        console.error('登出请求失败:', error)
      } finally {
        this.user = null
        this.isAuthenticated = false
      }
    },

    async checkAuth() {
      try {
        const response = await axios.get('/api/auth/check', {
          withCredentials: true
        })
        
        if (response.data.authenticated) {
          this.user = { username: response.data.username }
          this.isAuthenticated = true
        } else {
          this.user = null
          this.isAuthenticated = false
        }
      } catch (error) {
        console.error('检查认证状态失败:', error)
        this.user = null
        this.isAuthenticated = false
      }
    }
  }
})