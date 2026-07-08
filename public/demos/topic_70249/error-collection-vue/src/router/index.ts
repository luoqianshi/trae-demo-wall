import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/record', name: 'record', component: () => import('../views/RecordView.vue') },
  { path: '/book', name: 'book', component: () => import('../views/BookView.vue') },
  { path: '/analysis', name: 'analysis', component: () => import('../views/AnalysisView.vue') },
  { path: '/distribution', name: 'distribution', component: () => import('../views/DistributionView.vue') },
  { path: '/review', name: 'review', component: () => import('../views/ReviewView.vue') },
  { path: '/profile', name: 'profile', component: () => import('../views/ProfileView.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
