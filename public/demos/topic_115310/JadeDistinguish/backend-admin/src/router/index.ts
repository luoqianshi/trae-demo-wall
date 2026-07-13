import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue')
    },
    {
      path: '/',
      name: 'Layout',
      component: () => import('@/layout/index.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '数据看板' }
        },
        {
          path: 'identify',
          name: 'IdentifyList',
          component: () => import('@/views/identify/list.vue'),
          meta: { title: '鉴别记录' }
        },
        {
          path: 'identify/:id',
          name: 'IdentifyDetail',
          component: () => import('@/views/identify/detail.vue'),
          meta: { title: '记录详情' }
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.path === '/login') {
    next()
  } else {
    if (!authStore.token) {
      next('/login')
    } else {
      next()
    }
  }
})

export default router
