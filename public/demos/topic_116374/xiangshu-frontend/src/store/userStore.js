import { defineStore } from 'pinia'

// 用户状态：登录态、用户信息、token，持久化到 localStorage
const STORAGE_KEY = 'xiangshu_user'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: null
  }),

  getters: {
    // 是否已登录
    isLoggedIn: (state) => !!state.token,
    // 用户昵称（无则取账号首字）
    displayName: (state) => state.userInfo?.name || state.userInfo?.account || ''
  },

  actions: {
    // 登录：在 Mock 模式下直接生成 token
    async login({ account, password }) {
      // TODO: 接入真实接口时替换为 api.post('/auth/login', ...)
      await new Promise((r) => setTimeout(r, 400))
      if (!account || !password) {
        throw new Error('请填写账号和密码')
      }
      this.token = 'mock-token-' + Date.now()
      this.userInfo = { name: account, account }
      this.persist()
      return this.userInfo
    },

    // 注册
    async register({ name, phone, password }) {
      await new Promise((r) => setTimeout(r, 400))
      if (!name || !phone || !password) {
        throw new Error('请完整填写注册信息')
      }
      this.token = 'mock-token-' + Date.now()
      this.userInfo = { name, account: phone }
      this.persist()
      return this.userInfo
    },

    // 退出
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem(STORAGE_KEY)
    },

    // 持久化
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: this.token, userInfo: this.userInfo })
      )
    },

    // 从 localStorage 恢复
    restore() {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      try {
        const data = JSON.parse(raw)
        this.token = data.token || ''
        this.userInfo = data.userInfo || null
      } catch (e) {
        // 数据损坏时清空
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }
})
