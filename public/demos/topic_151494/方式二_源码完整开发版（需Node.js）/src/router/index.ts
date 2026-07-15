import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import Watch from '@/pages/Watch.vue'
import AntiFraud from '@/pages/AntiFraud.vue'
import Create from '@/pages/Create.vue'
import Family from '@/pages/Family.vue'
import Health from '@/pages/Health.vue'
import Community from '@/pages/Community.vue'

const routes = [
  { path: '/', name: 'home', component: Home, meta: { title: '首页' } },
  { path: '/watch', name: 'watch', component: Watch, meta: { title: '无障碍观看' } },
  { path: '/anti-fraud', name: 'anti-fraud', component: AntiFraud, meta: { title: '反诈预警' } },
  { path: '/create', name: 'create', component: Create, meta: { title: '一键创作' } },
  { path: '/family', name: 'family', component: Family, meta: { title: '亲情陪伴' } },
  { path: '/health', name: 'health', component: Health, meta: { title: '健康管理' } },
  { path: '/community', name: 'community', component: Community, meta: { title: '社区共享' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.afterEach((to) => {
  const title = (to.meta?.title as string) || ''
  if (title) document.title = `${title} · 银龄AI助手「小银」`
})

export default router
