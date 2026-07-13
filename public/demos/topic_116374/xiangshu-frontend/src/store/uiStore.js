import { defineStore } from 'pinia'

// UI 状态：全局 Toast 提示、全局 Loading
export const useUiStore = defineStore('ui', {
  state: () => ({
    // Toast 队列
    toasts: [],
    toastSeq: 0,
    // 全局 loading
    loading: false,
    loadingText: ''
  }),

  actions: {
    // 显示一条 Toast
    showToast(msg, type = 'ok', duration = 2600) {
      const id = ++this.toastSeq
      this.toasts.push({ id, msg, type })
      setTimeout(() => {
        this.removeToast(id)
      }, duration)
      return id
    },

    // 移除 Toast
    removeToast(id) {
      const idx = this.toasts.findIndex((t) => t.id === id)
      if (idx >= 0) this.toasts.splice(idx, 1)
    },

    // 开启全局 loading
    startLoading(text = '加载中…') {
      this.loading = true
      this.loadingText = text
    },

    // 关闭全局 loading
    stopLoading() {
      this.loading = false
      this.loadingText = ''
    }
  }
})
