import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/userStore'

// 路由表：path / 组件 / 是否需要登录
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/archive',
    name: 'archive',
    component: () => import('@/views/ArchiveView.vue'),
    meta: { requiresAuth: true, title: '我的档案' }
  },
  {
    path: '/archive/tree',
    name: 'archive-tree',
    component: () => import('@/views/FamilyTreeView.vue'),
    meta: { requiresAuth: true, title: '家族树' }
  },
  {
    path: '/archive/photos',
    name: 'archive-photos',
    component: () => import('@/views/PhotosView.vue'),
    meta: { requiresAuth: true, title: '老照片墙' }
  },
  {
    path: '/archive/oral',
    name: 'archive-oral',
    component: () => import('@/views/OralHistoryView.vue'),
    meta: { requiresAuth: true, title: '口述历史' }
  },
  {
    path: '/archive/documents',
    name: 'archive-documents',
    component: () => import('@/views/DocumentsView.vue'),
    meta: { requiresAuth: true, title: '文档柜' }
  },
  {
    path: '/book',
    name: 'book',
    component: () => import('@/views/BookView.vue'),
    meta: { requiresAuth: true, title: '家族纪念册' }
  },
  {
    path: '/share/:code',
    name: 'share',
    component: () => import('@/views/ShareView.vue'),
    meta: { title: '分享档案' }
  },
  {
    path: '/explore',
    name: 'explore',
    component: () => import('@/views/ExploreView.vue'),
    meta: { title: '探索村庄' }
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { title: '关于乡书' }
  },
  {
    // 兜底重定向到首页
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 切换路由时回到顶部
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  }
})

// 全局前置守卫：校验登录态
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  // 设置文档标题
  if (to.meta.title) {
    document.title = `${to.meta.title} · 乡书`
  }
  // 需要登录但未登录 → 携带 redirect 跳转登录
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
