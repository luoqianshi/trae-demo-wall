import { createRouter, createWebHistory } from 'vue-router'
import { constantRoutes } from './asyncRoutes'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ top: 0 })
})

const whiteList = ['/login', '/register', '/404']

let addRoutesFlag = false

router.beforeEach(async (to, from, next) => {
  document.title = to.meta?.title ? `${to.meta.title} - 智能班级管理系统` : '智能班级管理系统'

  const hasToken = getToken()
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      if (!addRoutesFlag) {
        try {
          if (!userStore.roles || userStore.roles.length === 0) {
            await userStore.getUserPermissions()
          }
          const accessRoutes = await permissionStore.generateRoutes(
            userStore.roles,
            userStore.permissions
          )
          accessRoutes.forEach(route => {
            router.addRoute(route)
          })
          addRoutesFlag = true
          next({ ...to, replace: true })
        } catch (error) {
          userStore.resetState()
          permissionStore.resetRoutes()
          addRoutesFlag = false
          ElMessage.error(error.message || '身份验证失败，请重新登录')
          next(`/login?redirect=${to.path}`)
        }
      } else {
        next()
      }
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
    }
  }
})

router.afterEach(() => {
})

export function resetRouter() {
  addRoutesFlag = false
  const newRouter = createRouter({
    history: createWebHistory(),
    routes: constantRoutes,
    scrollBehavior: () => ({ top: 0 })
  })
  router.matcher = newRouter.matcher
}

export default router
