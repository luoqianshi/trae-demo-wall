import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'
import router from './router'
import permissionDirective from './directive/permission'

function clearCorruptedStorage() {
  try {
    const userKey = 'smart_class_user'
    const userStr = localStorage.getItem(userKey)
    if (userStr === 'undefined') {
      localStorage.removeItem(userKey)
    }
  } catch (e) {
    console.warn('Failed to clear corrupted storage:', e)
  }
}

clearCorruptedStorage()

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.directive('permission', permissionDirective)

app.mount('#app')
