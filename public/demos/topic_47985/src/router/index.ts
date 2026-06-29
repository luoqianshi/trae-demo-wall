import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'

// 定义路由配置
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
