import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// localStorage 中存储登录 token 的键名
const TOKEN_KEY = 'health_monitor_token'

// localStorage 中存储用户角色的键名
const ROLE_KEY = 'health_monitor_role'

// 路由表：login/register 为公开页面，其余均需登录态
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/user/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/user/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/health/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/metric/:id',
    name: 'MetricDetail',
    component: () => import('@/views/health/MetricDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/consultation/doctor-list',
    name: 'DoctorList',
    component: () => import('@/views/consultation/DoctorList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/consultation/chat/:id',
    name: 'ConsultationChat',
    component: () => import('@/views/consultation/RealtimeChat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/consultation/async',
    name: 'AsyncConsultation',
    component: () => import('@/views/consultation/AsyncConsult.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/user/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/device',
    name: 'Device',
    component: () => import('@/views/device/DeviceList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/report',
    name: 'Report',
    component: () => import('@/views/report/ReportList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/family',
    name: 'Family',
    component: () => import('@/views/family/FamilyGroup.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/plan',
    name: 'Plan',
    component: () => import('@/views/plan/PlanList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/points',
    name: 'Points',
    component: () => import('@/views/plan/Points.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/doctor/workbench',
    name: 'DoctorWorkbench',
    component: () => import('@/views/doctor/Workbench.vue'),
    meta: { requiresAuth: true, roles: ['DOCTOR'] }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/Dashboard.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] }
  },
  {
    path: '/admin/metric',
    name: 'AdminMetric',
    component: () => import('@/views/admin/MetricConfig.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] }
  },
  {
    path: '/admin/user',
    name: 'AdminUser',
    component: () => import('@/views/admin/UserManage.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] }
  },
  {
    path: '/admin/doctor',
    name: 'AdminDoctor',
    component: () => import('@/views/admin/DoctorManage.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] }
  },
  {
    path: '/admin/advice',
    name: 'AdminAdvice',
    component: () => import('@/views/admin/AdviceManage.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫：登录态校验 + 角色权限校验
router.beforeEach((to, _from, next) => {
  const requiresAuth = to.meta.requiresAuth !== false
  const hasToken = localStorage.getItem(TOKEN_KEY) !== null

  if (!requiresAuth) {
    next()
    return
  }

  if (!hasToken) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 角色权限校验
  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = localStorage.getItem(ROLE_KEY) || 'USER'
    if (!requiredRoles.includes(userRole)) {
      next({ path: '/' })
      return
    }
  }

  next()
})

export default router
