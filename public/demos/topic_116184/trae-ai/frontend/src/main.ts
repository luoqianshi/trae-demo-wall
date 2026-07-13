import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import './styles/global.scss'

// 创建 Vue 应用实例
const app = createApp(App)

// 全量注册 Element Plus 图标组件，模板中可直接按名称使用
for (const [iconName, iconComponent] of Object.entries(ElementPlusIconsVue)) {
  app.component(iconName, iconComponent)
}

// 注册 Pinia 状态管理、路由、Element Plus 组件库
app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
