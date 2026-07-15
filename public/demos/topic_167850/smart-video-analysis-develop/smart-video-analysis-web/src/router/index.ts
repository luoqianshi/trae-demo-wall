import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/project-list',
    children: [
      {
        path: 'project-list',
        name: 'ProjectList',
        component: () => import('@/views/ProjectList.vue'),
        meta: { title: '项目管理' }
      },
      {
        path: 'video-list',
        name: 'VideoList',
        component: () => import('@/views/VideoList.vue'),
        meta: { title: '视频管理' }
      },
      {
        path: 'video-upload',
        name: 'VideoUpload',
        component: () => import('@/views/VideoUpload.vue'),
        meta: { title: '视频上传解析' }
      },
      {
        path: 'analysis-result/:id',
        name: 'AnalysisResult',
        component: () => import('@/views/AnalysisResult.vue'),
        meta: { title: '解析结果详情' }
      },
      {
        path: 'multi-fusion',
        name: 'MultiFusion',
        component: () => import('@/views/MultiFusion.vue'),
        meta: { title: '多视频融合创作' }
      },
      {
        path: 'image-search',
        name: 'ImageSearch',
        component: () => import('@/views/ImageSearch.vue'),
        meta: { title: '以图搜视频' }
      },
      {
        path: 'frame-workspace',
        name: 'FrameWorkspace',
        component: () => import('@/views/FrameWorkspace.vue'),
        meta: { title: '帧级创作工作台' }
      },
      {
        path: 'audio-workspace',
        name: 'AudioWorkspace',
        component: () => import('@/views/AudioWorkspace.vue'),
        meta: { title: '音频创作工作台' }
      },
      {
        path: 'online-editor',
        name: 'OnlineEditor',
        component: () => import('@/views/OnlineEditor.vue'),
        meta: { title: '在线剪辑工作台' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const WHITE_LIST = ['/login', '/register']

router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || 'Smart Video Analysis'

  const userStore = useUserStore()
  if (!userStore.token) {
    userStore.initFromStorage()
  }

  if (WHITE_LIST.includes(to.path)) {
    next()
  } else if (!userStore.token) {
    next('/login')
  } else {
    next()
  }
})

export default router
