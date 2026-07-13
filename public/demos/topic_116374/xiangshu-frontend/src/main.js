import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import AppIcon from './components/AppIcon.vue'

// 全局样式：先变量后全局
import './styles/variables.css'
import './styles/global.css'

const app = createApp(App)

// 全局注册图标组件，所有视图可直接 <AppIcon icon="..." />
app.component('AppIcon', AppIcon)

app.use(createPinia())
app.use(router)

app.mount('#app')
