import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false,
    device: 'desktop',
    size: 'default',
    visitedViews: [],
    cachedViews: []
  }),

  getters: {
    sidebarWidth: (state) => state.sidebarCollapsed ? '64px' : '220px'
  },

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    closeSidebar() {
      this.sidebarCollapsed = true
    },

    openSidebar() {
      this.sidebarCollapsed = false
    },

    setDevice(device) {
      this.device = device
    },

    setSize(size) {
      this.size = size
    },

    addVisitedView(view) {
      if (this.visitedViews.some(v => v.path === view.path)) return
      this.visitedViews.push({
        name: view.name,
        path: view.path,
        title: view.meta?.title || 'no-name',
        fullPath: view.fullPath
      })
      if (view.meta?.keepAlive) {
        this.cachedViews.push(view.name)
      }
    },

    delVisitedView(path) {
      return new Promise(resolve => {
        this.visitedViews = this.visitedViews.filter(v => v.path !== path)
        this.cachedViews = this.cachedViews.filter(name => {
          const view = this.visitedViews.find(v => v.name === name)
          return view ? view.meta?.keepAlive : false
        })
        resolve([...this.visitedViews])
      })
    },

    delAllVisitedViews() {
      return new Promise(resolve => {
        this.visitedViews = []
        this.cachedViews = []
        resolve([...this.visitedViews])
      })
    },

    delOthersVisitedViews(path) {
      return new Promise(resolve => {
        this.visitedViews = this.visitedViews.filter(
          v => v.meta?.affix || v.path === path
        )
        this.cachedViews = this.cachedViews.filter(name => {
          const view = this.visitedViews.find(v => v.name === name)
          return view ? view.meta?.keepAlive : false
        })
        resolve([...this.visitedViews])
      })
    }
  }
})
