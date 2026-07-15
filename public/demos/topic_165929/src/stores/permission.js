import { defineStore } from 'pinia'
import { asyncRoutes, constantRoutes } from '@/router/asyncRoutes'
import { hasPermission } from '@/utils/permission'

function filterAsyncRoutes(routes, permissions) {
  const res = []
  routes.forEach(route => {
    const tmp = { ...route }
    if (checkRoutePermission(tmp, permissions)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, permissions)
      }
      res.push(tmp)
    }
  })
  return res
}

function checkRoutePermission(route, permissions) {
  if (route.meta && route.meta.permission) {
    return hasPermission(route.meta.permission)
  }
  return true
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    routes: [],
    addRoutes: []
  }),

  getters: {
    sidebarRoutes: (state) => state.routes
  },

  actions: {
    generateRoutes(roles, permissions) {
      return new Promise(resolve => {
        let accessedRoutes
        if (roles.includes('admin')) {
          accessedRoutes = asyncRoutes || []
        } else {
          accessedRoutes = filterAsyncRoutes(asyncRoutes, permissions)
        }
        this.addRoutes = accessedRoutes
        this.routes = constantRoutes.concat(accessedRoutes)
        resolve(accessedRoutes)
      })
    },

    resetRoutes() {
      this.routes = []
      this.addRoutes = []
    }
  }
})
