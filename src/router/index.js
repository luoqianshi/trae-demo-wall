import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/project/:id',
    name: 'detail',
    component: () => import('@/views/DetailView.vue'),
  },
  {
    path: '/immersive',
    name: 'immersive',
    component: () => import('@/views/ImmersiveView.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
