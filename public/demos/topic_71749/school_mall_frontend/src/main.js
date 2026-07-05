import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router'
import App from './App.vue'
import './style.css'
import './styles/theme.css'
import axios from 'axios'

// 配置 axios 拦截器
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      // 使用更通用的方式设置 Header
      config.headers['Authorization'] = `Bearer ${token}`
      console.log(`[Axios Out] ${config.url} | Token exists`)
    } else {
      console.warn(`[Axios Out] ${config.url} | NO TOKEN`)
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

axios.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response && error.response.status === 401) {
      console.warn('401 Error encountered, but keeping storage for debugging.')
    }
    return Promise.reject(error)
  }
)

const app = createApp(App)

app.use(ElementPlus)
app.use(router)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
